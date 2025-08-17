import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Group,
  Button,
  Stack,
  Divider,
  Alert,
  Box,
  Title,
  Switch,
  Badge,
  Modal,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import {
  IconLock,
  IconLockOpen,
  IconEdit,
  IconX,
  IconCheck,
  IconInfoCircle,
  IconAlertTriangle
} from '@tabler/icons-react';
import { updateFlowReadOnly, getFlowReadOnly } from '../services/bbcTamsApi';

interface FlowReadOnlyManagerProps {
  flowId: string;
  initialReadOnly?: boolean;
  disabled?: boolean;
  onReadOnlyChange?: (readOnly: boolean) => void;
}

export function FlowReadOnlyManager({ 
  flowId, 
  initialReadOnly = false,
  disabled = false,
  onReadOnlyChange 
}: FlowReadOnlyManagerProps) {
  const [readOnly, setReadOnly] = useState(initialReadOnly);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingReadOnly, setPendingReadOnly] = useState<boolean | null>(null);

  // Load initial data from API if not provided
  useEffect(() => {
    if (flowId) {
      loadInitialData();
    }
  }, [flowId]);

  // Update local state when props change
  useEffect(() => {
    setReadOnly(initialReadOnly);
  }, [initialReadOnly]);

  const loadInitialData = async () => {
    if (initialReadOnly === undefined) {
      setLoading(true);
      try {
        const response = await getFlowReadOnly(flowId);
        setReadOnly(response.read_only);
      } catch (err: any) {
        console.error('Error loading initial read-only status:', err);
        // Use props as fallback
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleReadOnly = async (newReadOnly: boolean) => {
    setPendingReadOnly(newReadOnly);
    setShowConfirmModal(true);
  };

  const confirmToggleReadOnly = async () => {
    if (pendingReadOnly === null) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('Updating flow read-only status:', { flowId, readOnly: pendingReadOnly });
      await updateFlowReadOnly(flowId, pendingReadOnly);
      console.log('Flow read-only status updated successfully');
      
      setReadOnly(pendingReadOnly);
      if (onReadOnlyChange) {
        onReadOnlyChange(pendingReadOnly);
      }
      
      setShowConfirmModal(false);
      setPendingReadOnly(null);
    } catch (err: any) {
      console.error('Error updating read-only status:', err);
      setError(`Failed to ${pendingReadOnly ? 'enable' : 'disable'} read-only mode: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getReadOnlyIcon = () => {
    return readOnly ? <IconLock size={20} color="#fa5252" /> : <IconLockOpen size={20} color="#40c057" />;
  };

  const getReadOnlyColor = () => {
    return readOnly ? 'red' : 'green';
  };

  const getReadOnlyLabel = () => {
    return readOnly ? 'Read Only' : 'Editable';
  };

  const getReadOnlyDescription = () => {
    return readOnly 
      ? 'This flow is currently in read-only mode and cannot be modified.'
      : 'This flow is currently editable and can be modified by authorized users.';
  };

  return (
    <>
      <Card withBorder>
        <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between" align="flex-start">
            <Box>
              <Group gap="sm" align="center">
                {getReadOnlyIcon()}
                <Title order={4}>Read-Only Status</Title>
                <Badge variant="light" color={getReadOnlyColor()}>
                  {getReadOnlyLabel()}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed" mt="xs">
                {getReadOnlyDescription()}
              </Text>
            </Box>
          </Group>

          <Divider />

          {/* Error Display */}
          {error && (
            <Alert icon={<IconX size={16} />} color="red" withCloseButton onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Status Display */}
          <Box>
            <Group justify="space-between" align="center" mb="md">
              <Text size="sm" fw={500}>Current Status</Text>
              <Switch
                checked={readOnly}
                onChange={(event) => handleToggleReadOnly(event.currentTarget.checked)}
                disabled={disabled || loading}
                size="lg"
                color={getReadOnlyColor()}
                onLabel={<IconLock size={16} />}
                offLabel={<IconLockOpen size={16} />}
              />
            </Group>
            
            <Alert 
              icon={readOnly ? <IconLock size={16} /> : <IconLockOpen size={16} />} 
              color={getReadOnlyColor()} 
              variant="light"
            >
              <Text size="sm">
                {readOnly 
                  ? 'This flow is protected from modifications. All edit operations are disabled.'
                  : 'This flow is currently editable. Users with appropriate permissions can modify flow properties, tags, and other settings.'
                }
              </Text>
            </Alert>
          </Box>

          {/* Read-Only Effects */}
          {readOnly && (
            <Box>
              <Text size="sm" fw={500} mb="xs">Read-Only Mode Effects:</Text>
              <Stack gap="xs">
                <Group gap="xs">
                  <IconX size={14} color="#fa5252" />
                  <Text size="sm">Flow properties cannot be modified</Text>
                </Group>
                <Group gap="xs">
                  <IconX size={14} color="#fa5252" />
                  <Text size="sm">Tags cannot be added, edited, or removed</Text>
                </Group>
                <Group gap="xs">
                  <IconX size={14} color="#fa5252" />
                  <Text size="sm">Flow collection cannot be modified</Text>
                </Group>
                <Group gap="xs">
                  <IconX size={14} color="#fa5252" />
                  <Text size="sm">Description and label cannot be updated</Text>
                </Group>
                <Group gap="xs">
                  <IconCheck size={14} color="#40c057" />
                  <Text size="sm">Flow can still be viewed and analyzed</Text>
                </Group>
                <Group gap="xs">
                  <IconCheck size={14} color="#40c057" />
                  <Text size="sm">Segments can still be accessed and played</Text>
                </Group>
              </Stack>
            </Box>
          )}

          {/* Action Buttons */}
          <Group justify="flex-end">
            <Button
              variant="light"
              color={readOnly ? 'green' : 'red'}
              leftSection={readOnly ? <IconLockOpen size={16} /> : <IconLock size={16} />}
              onClick={() => handleToggleReadOnly(!readOnly)}
              disabled={disabled || loading}
              loading={loading}
            >
              {readOnly ? 'Enable Editing' : 'Enable Read-Only'}
            </Button>
          </Group>
        </Stack>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        opened={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={`${pendingReadOnly ? 'Enable' : 'Disable'} Read-Only Mode`}
        size="md"
      >
        <Stack gap="md">
          <Alert 
            icon={<IconAlertTriangle size={16} />} 
            color={pendingReadOnly ? 'red' : 'blue'} 
            variant="light"
          >
            <Text size="sm">
              {pendingReadOnly 
                ? 'Are you sure you want to enable read-only mode? This will prevent all modifications to this flow.'
                : 'Are you sure you want to disable read-only mode? This will allow modifications to this flow.'
              }
            </Text>
          </Alert>
          
          <Text size="sm" c="dimmed">
            {pendingReadOnly 
              ? 'Read-only mode is useful for protecting important flows from accidental modifications or for archival purposes.'
              : 'Editable mode allows authorized users to modify flow properties, tags, and other settings.'
            }
          </Text>
          
          <Group gap="xs" justify="flex-end">
            <Button variant="light" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              color={pendingReadOnly ? 'red' : 'blue'}
              onClick={confirmToggleReadOnly}
              loading={loading}
            >
              {pendingReadOnly ? 'Enable Read-Only' : 'Disable Read-Only'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
