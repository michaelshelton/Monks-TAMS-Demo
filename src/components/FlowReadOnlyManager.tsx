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
import { apiClient } from '../services/api';

interface FlowReadOnlyManagerProps {
  flowId: string;
  initialReadOnly?: boolean;
  disabled?: boolean;
  onReadOnlyChange?: (readOnly: boolean) => void;
  // Current flow data - needed to include required fields (id, source_id) in update
  currentFlow?: any;
}

export function FlowReadOnlyManager({ 
  flowId, 
  initialReadOnly = false,
  disabled = false,
  onReadOnlyChange,
  currentFlow
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
        // Fetch flow data using the workaround (GET /flows and filter)
        const flowsResponse = await apiClient.getFlows();
        let flowsData: any[] = [];
        
        if (flowsResponse && flowsResponse.data && Array.isArray(flowsResponse.data)) {
          flowsData = flowsResponse.data;
        } else if (Array.isArray(flowsResponse)) {
          flowsData = flowsResponse;
        }
        
        const foundFlow = flowsData.find((f: any) => 
          (f._id === flowId || f.id === flowId) ||
          (f._id && String(f._id) === String(flowId)) ||
          (f.id && String(f.id) === String(flowId))
        );
        
        if (foundFlow && foundFlow.read_only !== undefined) {
          setReadOnly(foundFlow.read_only);
        }
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
      
      // Backend requires id and source_id in request body (schema validation)
      // Fetch current flow if not provided to get required fields
      let flowData = currentFlow;
      if (!flowData) {
        try {
          // Try to get flow using workaround (Issue #6)
          const flowsResponse = await apiClient.getFlows();
          let flowsData: any[] = [];
          
          if (flowsResponse && flowsResponse.data && Array.isArray(flowsResponse.data)) {
            flowsData = flowsResponse.data;
          } else if (Array.isArray(flowsResponse)) {
            flowsData = flowsResponse;
          }
          
          flowData = flowsData.find((f: any) => 
            (f._id === flowId || f.id === flowId) ||
            (f._id && String(f._id) === String(flowId)) ||
            (f.id && String(f.id) === String(flowId))
          );
        } catch (fetchErr) {
          console.error('Failed to fetch flow data:', fetchErr);
        }
      }
      
      // Build update payload - backend requires full flow object with required fields
      // Issue #7: Schema validation requires id and source_id, but existing flows may not have source_id
      // We need to send the full flow object to pass validation, but may need to generate source_id
      const updatePayload: any = flowData ? {
        // Use the full flow object and only update read_only
        ...flowData,
        read_only: pendingReadOnly,
        // Normalize _id to id for schema validation
        id: flowData.id || flowData._id || flowId,
        // Generate source_id if missing (required by schema but may not exist in DB)
        source_id: flowData.source_id || flowData.sourceId || `source-${flowId}`,
        // Ensure format is valid (may be "video/mp4" instead of "urn:x-nmos:format:video")
        format: flowData.format || 'urn:x-nmos:format:video',
        // Ensure codec is valid format
        codec: flowData.codec || 'video/h264'
      } : {
        // Fallback if flow data not available
        id: flowId,
        source_id: `source-${flowId}`,
        read_only: pendingReadOnly,
        format: 'urn:x-nmos:format:video',
        codec: 'video/h264'
      };
      
      // Remove _id if we're using id (to avoid conflicts)
      if (updatePayload._id && updatePayload.id) {
        delete updatePayload._id;
      }
      
      // Note: The id and source_id must match UUID pattern, but existing flows may have non-UUID IDs
      // This is a backend validation issue (Issue #7) - the schema is too strict
      
      // Use PUT /flows/:id to update read_only (backend doesn't have separate endpoint)
      await apiClient.updateFlow(flowId, updatePayload);
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
