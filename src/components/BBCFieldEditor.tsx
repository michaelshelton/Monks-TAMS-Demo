import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Group,
  Text,
  Button,
  Stack,
  Card,
  Badge,
  TextInput,
  Textarea,
  Switch,
  NumberInput,
  Chip,
  ActionIcon,
  Tooltip,
  Alert,
  Divider,
  Modal,
  LoadingOverlay
} from '@mantine/core';
import {
  IconEdit,
  IconCheck,
  IconX,
  IconPlus,
  IconTrash,
  IconInfoCircle,
  IconAlertCircle,
  IconDeviceFloppy
} from '@tabler/icons-react';

// BBC TAMS Field Editor Component
interface BBCFieldEditorProps {
  // Entity information
  entityId: string;
  entityType: 'source' | 'flow';
  currentData: Record<string, any>;
  
  // Field definitions
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'boolean' | 'tags' | 'select';
    required?: boolean;
    validation?: (value: any) => string | null;
    options?: Array<{ value: string; label: string }>;
    placeholder?: string;
    description?: string;
  }>;
  
  // Callbacks
  onFieldUpdate: (fieldKey: string, value: any) => Promise<boolean>;
  onFieldDelete?: (fieldKey: string) => Promise<boolean>;
  onSave?: (allData: Record<string, any>) => Promise<boolean>;
  
  // Options
  showOptimisticUpdates?: boolean;
  showValidation?: boolean;
  showFieldHistory?: boolean;
  disabled?: boolean;
  className?: string;
}

// Field validation functions
const fieldValidators = {
  label: (value: string) => {
    if (!value || value.trim().length === 0) return 'Label is required';
    if (value.length > 255) return 'Label must be less than 255 characters';
    return null;
  },
  
  description: (value: string) => {
    if (value && value.length > 1000) return 'Description must be less than 1000 characters';
    return null;
  },
  
  maxBitRate: (value: number) => {
    if (value && value <= 0) return 'Max bit rate must be positive';
    if (value && value > 1000000000) return 'Max bit rate must be less than 1 Gbps';
    return null;
  },
  
  frameWidth: (value: number) => {
    if (value && value <= 0) return 'Frame width must be positive';
    if (value && value > 7680) return 'Frame width must be less than 8K';
    return null;
  },
  
  frameHeight: (value: number) => {
    if (value && value <= 0) return 'Frame height must be positive';
    if (value && value > 4320) return 'Frame height must be less than 8K';
    return null;
  },
  
  sampleRate: (value: number) => {
    if (value && value <= 0) return 'Sample rate must be positive';
    if (value && value > 192000) return 'Sample rate must be less than 192 kHz';
    return null;
  }
};

export default function BBCFieldEditor({
  entityId,
  entityType,
  currentData,
  fields,
  onFieldUpdate,
  onFieldDelete,
  onSave,
  showOptimisticUpdates = true,
  showValidation = true,
  showFieldHistory = false,
  disabled = false,
  className
}: BBCFieldEditorProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>(currentData);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [updateHistory, setUpdateHistory] = useState<Array<{
    field: string;
    oldValue: any;
    newValue: any;
    timestamp: Date;
    success: boolean;
  }>>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Initialize field values
  useEffect(() => {
    setFieldValues(currentData);
  }, [currentData]);

  // Handle field value change
  const handleFieldChange = useCallback((fieldKey: string, value: any) => {
    setFieldValues(prev => ({ ...prev, [fieldKey]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[fieldKey]) {
      setFieldErrors(prev => ({ ...prev, [fieldKey]: '' }));
    }
  }, [fieldErrors]);

  // Validate field value
  const validateField = useCallback((fieldKey: string, value: any): string | null => {
    const field = fields.find(f => f.key === fieldKey);
    if (!field) return null;

    // Check required fields
    if (field.required && (!value || (typeof value === 'string' && value.trim().length === 0))) {
      return `${field.label} is required`;
    }

    // Check custom validation
    if (field.validation) {
      const validationError = field.validation(value);
      if (validationError) return validationError;
    }

    // Check built-in validators
    const builtInValidator = fieldValidators[fieldKey as keyof typeof fieldValidators];
    if (builtInValidator) {
      // Type-safe validation based on field type
      if (field.type === 'number' && typeof value === 'number') {
        const validator = builtInValidator as (value: number) => string | null;
        const validationError = validator(value);
        if (validationError) return validationError;
      } else if (field.type === 'text' && typeof value === 'string') {
        const validator = builtInValidator as (value: string) => string | null;
        const validationError = validator(value);
        if (validationError) return validationError;
      }
    }

    return null;
  }, [fields]);

  // Handle field update
  const handleFieldUpdate = useCallback(async (fieldKey: string) => {
    const value = fieldValues[fieldKey];
    
    // Validate field
    const error = validateField(fieldKey, value);
    if (error) {
      setFieldErrors(prev => ({ ...prev, [fieldKey]: error }));
      return;
    }

    setIsUpdating(prev => ({ ...prev, [fieldKey]: true }));
    
    try {
      const success = await onFieldUpdate(fieldKey, value);
      
      if (success) {
        // Clear error and exit edit mode
        setFieldErrors(prev => ({ ...prev, [fieldKey]: '' }));
        setEditingField(null);
        
        // Add to history
        setUpdateHistory(prev => [{
          field: fieldKey,
          oldValue: currentData[fieldKey],
          newValue: value,
          timestamp: new Date(),
          success: true
        }, ...prev.slice(0, 9)]); // Keep last 10 updates
        
        // Show optimistic update
        if (showOptimisticUpdates) {
          // Field is already updated in local state
        }
      } else {
        // Revert to original value on failure
        setFieldValues(prev => ({ ...prev, [fieldKey]: currentData[fieldKey] }));
        setFieldErrors(prev => ({ ...prev, [fieldKey]: 'Update failed' }));
      }
    } catch (error) {
      // Revert to original value on error
      setFieldValues(prev => ({ ...prev, [fieldKey]: currentData[fieldKey] }));
      setFieldErrors(prev => ({ ...prev, [fieldKey]: `Error: ${error}` }));
    } finally {
      setIsUpdating(prev => ({ ...prev, [fieldKey]: false }));
    }
  }, [fieldValues, currentData, onFieldUpdate, validateField, showOptimisticUpdates]);

  // Handle field deletion
  const handleFieldDelete = useCallback(async (fieldKey: string) => {
    if (!onFieldDelete) return;
    
    setIsUpdating(prev => ({ ...prev, [fieldKey]: true }));
    
    try {
      const success = await onFieldDelete(fieldKey);
      
      if (success) {
        // Remove from local state
        setFieldValues(prev => {
          const newState = { ...prev };
          delete newState[fieldKey];
          return newState;
        });
        
        // Add to history
        setUpdateHistory(prev => [{
          field: fieldKey,
          oldValue: currentData[fieldKey],
          newValue: undefined,
          timestamp: new Date(),
          success: true
        }, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      // Keep field on error
      setFieldErrors(prev => ({ ...prev, [fieldKey]: `Delete failed: ${error}` }));
    } finally {
      setIsUpdating(prev => ({ ...prev, [fieldKey]: false }));
    }
  }, [onFieldDelete, currentData]);

  // Handle save all
  const handleSaveAll = useCallback(async () => {
    if (!onSave) return;
    
    // Validate all fields
    const errors: Record<string, string> = {};
    fields.forEach(field => {
      const error = validateField(field.key, fieldValues[field.key]);
      if (error) {
        errors[field.key] = error;
      }
    });
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    try {
      const success = await onSave(fieldValues);
      if (success) {
        // Clear all errors
        setFieldErrors({});
        setEditingField(null);
      }
    } catch (error) {
      // Handle save error
      console.error('Save failed:', error);
    }
  }, [onSave, fieldValues, fields, validateField]);

  // Cancel field edit
  const handleCancelEdit = useCallback((fieldKey: string) => {
    setEditingField(null);
    setFieldValues(prev => ({ ...prev, [fieldKey]: currentData[fieldKey] }));
    setFieldErrors(prev => ({ ...prev, [fieldKey]: '' }));
  }, [currentData]);

  // Render field input based on type
  const renderFieldInput = useCallback((field: any, value: any, isEditing: boolean) => {
    if (!isEditing) {
      return (
        <Text size="sm" c={value ? 'inherit' : 'dimmed'}>
          {value || 'Not set'}
        </Text>
      );
    }

    const commonProps = {
      value: value || '',
      onChange: (newValue: any) => handleFieldChange(field.key, newValue),
      disabled: Boolean(disabled || isUpdating[field.key]),
      placeholder: field.placeholder,
      error: fieldErrors[field.key]
    };

    switch (field.type) {
      case 'text':
        return <TextInput {...commonProps} />;
      
      case 'textarea':
        return <Textarea {...commonProps} minRows={2} maxRows={4} />;
      
      case 'number':
        return <NumberInput {...commonProps} min={0} />;
      
      case 'boolean':
        return (
                      <Switch
              checked={value || false}
              onChange={(event) => handleFieldChange(field.key, event.currentTarget.checked)}
              disabled={Boolean(disabled || isUpdating[field.key])}
            />
        );
      
      case 'tags':
        return (
          <Box>
            <Group gap="xs" mb="xs">
              {Array.isArray(value) ? value.map((tag: string, index: number) => (
                <Chip
                  key={index}
                  checked={false}
                  disabled={Boolean(disabled || isUpdating[field.key])}
                >
                  <Group gap="xs" align="center">
                    {tag}
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="red"
                      onClick={() => {
                        const newTags = value.filter((_: string, i: number) => i !== index);
                        handleFieldChange(field.key, newTags);
                      }}
                    >
                      <IconX size={10} />
                    </ActionIcon>
                  </Group>
                </Chip>
              )) : null}
            </Group>
            <TextInput
              placeholder="Add new tag"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && event.currentTarget.value.trim()) {
                  const newTag = event.currentTarget.value.trim();
                  const currentTags = Array.isArray(value) ? value : [];
                  handleFieldChange(field.key, [...currentTags, newTag]);
                  event.currentTarget.value = '';
                }
              }}
              disabled={Boolean(disabled || isUpdating[field.key])}
            />
          </Box>
        );
      
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(event) => handleFieldChange(field.key, event.currentTarget.value)}
            disabled={Boolean(disabled || isUpdating[field.key])}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      default:
        return <TextInput {...commonProps} />;
    }
  }, [handleFieldChange, fieldErrors, disabled, isUpdating]);

  return (
    <>
      <Card withBorder {...(className ? { className } : {})}>
        <Stack gap="md">
          {/* Header */}
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconEdit size={20} />
              <Text fw={500}>BBC TAMS Field Editor</Text>
              <Badge variant="light" color="blue">BBC TAMS v6.0</Badge>
              <Badge variant="light" color="gray">{entityType}</Badge>
              <Badge variant="light" color="gray">{entityId}</Badge>
            </Group>
            
            <Group gap="xs">
              {showFieldHistory && (
                <Button
                  variant="light"
                  size="xs"
                  onClick={() => setShowHistoryModal(true)}
                  leftSection={<IconInfoCircle size={14} />}
                  disabled={disabled}
                >
                  History
                </Button>
              )}
              
              {onSave && (
                <Button
                  size="xs"
                  onClick={handleSaveAll}
                  leftSection={<IconDeviceFloppy size={14} />}
                  disabled={disabled || Object.keys(fieldErrors).length > 0}
                >
                  Save All
                </Button>
              )}
            </Group>
          </Group>

          {/* Fields */}
          <Stack gap="md">
            {fields.map(field => {
              const isEditing = editingField === field.key;
              const value = fieldValues[field.key];
              const hasError = !!fieldErrors[field.key];
              const isRequired = field.required;
              
              return (
                <Box key={field.key}>
                  <Group justify="space-between" align="flex-start" mb="xs">
                    <Box style={{ flex: 1 }}>
                      <Group gap="xs" align="center" mb="xs">
                        <Text size="sm" fw={500}>
                          {field.label}
                          {isRequired && <Text component="span" c="red"> *</Text>}
                        </Text>
                        
                        {field.description && (
                          <Tooltip label={field.description}>
                            <IconInfoCircle size={14} color="dimmed" />
                          </Tooltip>
                        )}
                        
                        {hasError && (
                          <IconAlertCircle size={14} color="red" />
                        )}
                      </Group>
                      
                      {renderFieldInput(field, value, isEditing)}
                      
                      {hasError && (
                        <Text size="xs" c="red" mt="xs">
                          {fieldErrors[field.key]}
                        </Text>
                      )}
                    </Box>
                    
                    {/* Field Actions */}
                    <Group gap="xs">
                      {isEditing ? (
                        <>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="green"
                            onClick={() => handleFieldUpdate(field.key)}
                            disabled={Boolean(disabled || isUpdating[field.key])}
                            loading={Boolean(isUpdating[field.key])}
                          >
                            <IconCheck size={14} />
                          </ActionIcon>
                          
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="gray"
                            onClick={() => handleCancelEdit(field.key)}
                            disabled={Boolean(disabled || isUpdating[field.key])}
                          >
                            <IconX size={14} />
                          </ActionIcon>
                        </>
                      ) : (
                        <ActionIcon
                          size="sm"
                          variant="light"
                          color="blue"
                          onClick={() => setEditingField(field.key)}
                          disabled={Boolean(disabled)}
                        >
                          <IconEdit size={14} />
                        </ActionIcon>
                      )}
                      
                      {onFieldDelete && !isRequired && (
                        <ActionIcon
                          size="sm"
                          variant="light"
                          color="red"
                          onClick={() => handleFieldDelete(field.key)}
                          disabled={Boolean(disabled || isUpdating[field.key])}
                          loading={Boolean(isUpdating[field.key])}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Group>
                  
                  <Divider mt="md" />
                </Box>
              );
            })}
          </Stack>

          {/* BBC TAMS Info */}
          <Alert color="blue" title="BBC TAMS Field Operations" icon={<IconInfoCircle size={16} />}>
            <Text size="xs">
              This field editor provides BBC TAMS v6.0 compliant individual field operations. 
              It supports granular CRUD operations, field validation, optimistic updates, and 
              maintains a history of field changes as specified in the BBC TAMS API.
            </Text>
          </Alert>
        </Stack>
      </Card>

      {/* Field History Modal */}
      <Modal
        opened={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Field Update History"
        size="lg"
      >
        <Stack gap="md">
          {updateHistory.length === 0 ? (
            <Text c="dimmed" ta="center">No field updates yet</Text>
          ) : (
            updateHistory.map((update, index) => (
              <Box key={index} p="xs" style={{ border: '1px solid #dee2e6', borderRadius: '4px' }}>
                <Group justify="space-between" align="center" mb="xs">
                  <Text size="sm" fw={500}>{update.field}</Text>
                  <Badge
                    variant="light"
                    color={update.success ? 'green' : 'red'}
                  >
                    {update.success ? 'Success' : 'Failed'}
                  </Badge>
                </Group>
                
                <Group gap="md" mb="xs">
                  <Box>
                    <Text size="xs" c="dimmed">Old Value:</Text>
                    <Text size="sm">{String(update.oldValue || 'Not set')}</Text>
                  </Box>
                  
                  <Box>
                    <Text size="xs" c="dimmed">New Value:</Text>
                    <Text size="sm">{String(update.newValue || 'Not set')}</Text>
                  </Box>
                </Group>
                
                <Text size="xs" c="dimmed">
                  {update.timestamp.toLocaleString()}
                </Text>
              </Box>
            ))
          )}
        </Stack>
      </Modal>
    </>
  );
}
