import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Stack,
  Group,
  Button,
  TextInput,
  Select,
  Textarea,
  Badge,
  Alert,
  Box,
  Code,
  Divider,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import { IconEdit, IconTrash, IconEye, IconRefresh, IconCheck, IconX } from '@tabler/icons-react';
import { apiClient } from '../services/api';

// BBC TAMS Field Editor Props - standardized interface
interface BBCFieldEditorProps {
  // Entity information
  entityType: 'flows' | 'sources' | 'segments';
  entityId: string;
  initialFields?: Record<string, any>;
  
  // Callbacks
  onFieldUpdate?: (fieldKey: string, value: any) => void;
  onFieldDelete?: (fieldKey: string) => void;
  onFieldsChange?: (fields: Record<string, any>) => void;
  
  // UI options
  showMetadata?: boolean;
  showHistory?: boolean;
  collapsed?: boolean;
  disabled?: boolean;
  className?: string;
  
  // Custom styling
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'filled' | 'outline' | 'light' | 'white' | 'subtle' | 'gradient';
}

interface FieldOperation {
  type: 'GET' | 'PUT' | 'DELETE' | 'HEAD';
  fieldKey: string;
  timestamp: Date;
  success: boolean;
  response?: any;
  error?: string;
}

/**
 * Standardized BBC TAMS Field Editor Component
 * 
 * This component provides field editing capabilities following BBC TAMS v6.0 specification.
 * It supports GET, PUT, DELETE, and HEAD operations on entity fields.
 * 
 * @example
 * ```tsx
 * <BBCFieldEditor
 *   entityType="flows"
 *   entityId="flow-123"
 *   initialFields={{ label: "My Flow", description: "Flow description" }}
 *   onFieldUpdate={(key, value) => console.log(`${key}: ${value}`)}
 *   showMetadata={true}
 *   showHistory={true}
 * />
 * ```
 */
export default function BBCFieldEditor({ 
  entityType, 
  entityId, 
  initialFields = {},
  onFieldUpdate,
  onFieldDelete,
  onFieldsChange,
  showMetadata = true,
  showHistory = true,
  collapsed = false,
  disabled = false,
  className,
  size = 'md',
  variant = 'outline'
}: BBCFieldEditorProps) {
  const [fields, setFields] = useState<Record<string, any>>(initialFields);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string>('');
  const [fieldValue, setFieldValue] = useState<string>('');
  const [operationHistory, setOperationHistory] = useState<FieldOperation[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Load available fields on component mount
  useEffect(() => {
    loadAvailableFields();
  }, [entityType, entityId]);

  const loadAvailableFields = async () => {
    try {
      setLoading(true);
      const fields = await apiClient.getEntityFields(entityType, entityId);
      setAvailableFields(fields);
      
      // If no fields returned from API, use initial fields
      if (fields.length === 0 && Object.keys(initialFields).length > 0) {
        setAvailableFields(Object.keys(initialFields));
      }
    } catch (err) {
      console.warn('Could not load entity fields:', err);
      // Fallback to initial fields
      if (Object.keys(initialFields).length > 0) {
        setAvailableFields(Object.keys(initialFields));
      }
    } finally {
      setLoading(false);
    }
  };

  const addOperationToHistory = (operation: Omit<FieldOperation, 'timestamp'>) => {
    setOperationHistory(prev => [{
      ...operation,
      timestamp: new Date()
    }, ...prev.slice(0, 9)]); // Keep last 10 operations
  };

  const handleGetField = async (fieldKey: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const value = await apiClient.getFieldValue(entityType, entityId, fieldKey);
      
      // Update local fields state
      setFields(prev => ({ ...prev, [fieldKey]: value }));
      
      // Update operation history
      addOperationToHistory({
        type: 'GET',
        fieldKey,
        success: true,
        response: value
      });
      
      // Notify parent component
      onFieldsChange?.(fields);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to get field ${fieldKey}: ${errorMsg}`);
      
      addOperationToHistory({
        type: 'GET',
        fieldKey,
        success: false,
        error: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = async (fieldKey: string, value: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiClient.updateFieldValue(entityType, entityId, fieldKey, value);
      
      // Update local fields state
      setFields(prev => ({ ...prev, [fieldKey]: value }));
      
      // Update operation history
      addOperationToHistory({
        type: 'PUT',
        fieldKey,
        success: true,
        response: value
      });
      
      // Notify parent component
      onFieldUpdate?.(fieldKey, value);
      onFieldsChange?.(fields);
      
      // Reset editing state
      setEditingField(null);
      setEditValue('');
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to update field ${fieldKey}: ${errorMsg}`);
      
      addOperationToHistory({
        type: 'PUT',
        fieldKey,
        success: false,
        error: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async (fieldKey: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiClient.deleteField(entityType, entityId, fieldKey);
      
      // Remove from local fields state
      const { [fieldKey]: removed, ...remainingFields } = fields;
      setFields(remainingFields);
      
      // Update operation history
      addOperationToHistory({
        type: 'DELETE',
        fieldKey,
        success: true
      });
      
      // Notify parent component
      onFieldDelete?.(fieldKey);
      onFieldsChange?.(remainingFields);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to delete field ${fieldKey}: ${errorMsg}`);
      
      addOperationToHistory({
        type: 'DELETE',
        fieldKey,
        success: false,
        error: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetMetadata = async (fieldKey: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const metadata = await apiClient.getFieldMetadata(entityType, entityId, fieldKey);
      
      // Update operation history
      addOperationToHistory({
        type: 'HEAD',
        fieldKey,
        success: true,
        response: metadata
      });
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to get metadata for field ${fieldKey}: ${errorMsg}`);
      
      addOperationToHistory({
        type: 'HEAD',
        fieldKey,
        success: false,
        error: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (fieldKey: string, currentValue: any) => {
    setEditingField(fieldKey);
    setEditValue(String(currentValue || ''));
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'GET': return <IconEye size={14} />;
      case 'PUT': return <IconEdit size={14} />;
      case 'DELETE': return <IconTrash size={14} />;
      case 'HEAD': return <IconRefresh size={14} />;
      default: return <IconEye size={14} />;
    }
  };

  const getOperationColor = (type: string, success: boolean) => {
    if (!success) return 'red';
    switch (type) {
      case 'GET': return 'blue';
      case 'PUT': return 'green';
      case 'DELETE': return 'orange';
      case 'HEAD': return 'cyan';
      default: return 'gray';
    }
  };

  return (
    <Card {...(className ? { className } : {})} withBorder>
      <Card.Section p="md">
        <Group justify="space-between" align="center">
          <Text fw={500}>BBC TAMS Field Editor</Text>
          <Badge variant="light" color="blue" size="sm">v6.0</Badge>
        </Group>
        <Text size="sm" c="dimmed">Entity: {entityType}/{entityId}</Text>
      </Card.Section>

      <Card.Section p="md">
        <Stack gap="md">
          {/* Field Selection */}
          <Box>
            <Text size="sm" fw={500} mb="xs">Field Operations</Text>
            <Group gap="xs" align="flex-end">
              <Select
                label="Select Field"
                placeholder="Choose a field"
                data={availableFields.map(field => ({ value: field, label: field }))}
                value={selectedField}
                onChange={(value) => setSelectedField(value || '')}
                disabled={disabled || loading}
                size={size}
                style={{ flex: 1 }}
              />
              
              <TextInput
                label="Field Value"
                placeholder="Enter field value"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                disabled={disabled || loading}
                size={size}
                style={{ flex: 1 }}
              />
              
              <Button
                variant={variant}
                size={size}
                onClick={() => handleGetField(selectedField)}
                disabled={disabled || loading || !selectedField}
                leftSection={<IconEye size={16} />}
              >
                Get
              </Button>
            </Group>
          </Box>

          {/* Field Actions */}
          {selectedField && (
            <Box>
              <Text size="sm" fw={500} mb="xs">Field Actions</Text>
              <Group gap="xs">
                <Button
                  variant="light"
                  size={size}
                  onClick={() => handleGetMetadata(selectedField)}
                  disabled={disabled || loading}
                  leftSection={<IconRefresh size={16} />}
                >
                  Metadata
                </Button>
                
                <Button
                  variant="light"
                  size={size}
                  onClick={() => startEditing(selectedField, fields[selectedField])}
                  disabled={disabled || loading}
                  leftSection={<IconEdit size={16} />}
                >
                  Edit
                </Button>
                
                <Button
                  variant="light"
                  color="red"
                  size={size}
                  onClick={() => handleDeleteField(selectedField)}
                  disabled={disabled || loading}
                  leftSection={<IconTrash size={16} />}
                >
                  Delete
                </Button>
              </Group>
            </Box>
          )}

          {/* Field Editing */}
          {editingField && (
            <Box>
              <Text size="sm" fw={500} mb="xs">Edit Field: {editingField}</Text>
              <Group gap="xs" align="flex-end">
                <TextInput
                  placeholder="Enter new value"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  disabled={disabled || loading}
                  size={size}
                  style={{ flex: 1 }}
                />
                
                <Button
                  variant="filled"
                  color="green"
                  size={size}
                  onClick={() => handleUpdateField(editingField, editValue)}
                  disabled={disabled || loading}
                  leftSection={<IconCheck size={16} />}
                >
                  Save
                </Button>
                
                <Button
                  variant="light"
                  size={size}
                  onClick={cancelEditing}
                  disabled={disabled || loading}
                  leftSection={<IconX size={16} />}
                >
                  Cancel
                </Button>
              </Group>
            </Box>
          )}

          {/* Current Fields Display */}
          <Box>
            <Text size="sm" fw={500} mb="xs">Current Fields</Text>
            <Group gap="xs" wrap="wrap">
              {Object.entries(fields).map(([key, value]) => (
                <Badge
                  key={key}
                  variant="outline"
                  size={size}
                  rightSection={
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      onClick={() => startEditing(key, value)}
                      disabled={disabled}
                    >
                      <IconEdit size={12} />
                    </ActionIcon>
                  }
                >
                  {key}: {String(value).substring(0, 20)}
                  {String(value).length > 20 ? '...' : ''}
                </Badge>
              ))}
            </Group>
          </Box>

          {/* Operation History */}
          {showHistory && operationHistory.length > 0 && (
            <Box>
              <Text size="sm" fw={500} mb="xs">Operation History</Text>
              <Stack gap="xs">
                {operationHistory.map((op, index) => (
                  <Group key={index} gap="xs" align="center">
                    <Badge
                      variant="light"
                      color={getOperationColor(op.type, op.success)}
                      size="xs"
                      leftSection={getOperationIcon(op.type)}
                    >
                      {op.type}
                    </Badge>
                    
                    <Text size="xs" style={{ flex: 1 }}>
                      {op.fieldKey}
                    </Text>
                    
                    <Text size="xs" c="dimmed">
                      {op.timestamp.toLocaleTimeString()}
                    </Text>
                    
                    {op.success ? (
                      <Badge variant="light" color="green" size="xs">Success</Badge>
                    ) : (
                      <Badge variant="light" color="red" size="xs">Failed</Badge>
                    )}
                  </Group>
                ))}
              </Stack>
            </Box>
          )}

          {/* Error Display */}
          {error && (
            <Alert color="red" icon={<IconX size={16} />}>
              <Text size="sm">{error}</Text>
            </Alert>
          )}

          {/* BBC TAMS Compliance Note */}
          <Alert icon={<IconRefresh size={16} />} color="blue" variant="light">
            <Text size="sm">
              This field editor follows TAMS v6.0 specification with support for GET, PUT, DELETE, 
              and HEAD operations on entity fields.
            </Text>
          </Alert>
        </Stack>
      </Card.Section>
    </Card>
  );
}

export type { BBCFieldEditorProps };
