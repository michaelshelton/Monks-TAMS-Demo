import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Badge,
  Box,
  Divider,
  Alert,
  Modal,
  TextInput,
  Select,
  Textarea,
  Switch,
  ActionIcon,
  Tooltip,
  Grid,
  Progress,
  Code,
  Tabs,
  List,
  ThemeIcon,
  Timeline,
  RingProgress,
  Center
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconClock,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconInfoCircle,
  IconRefresh,
  IconHistory,
  IconArrowRight,
  IconPause,
  IconSquare,
  IconDownload,
  IconUpload,
  IconDatabase,
  IconSettings
} from '@tabler/icons-react';

// BBC TAMS API v6.0 Async Operation Types
interface AsyncOperation {
  id: string;
  operation_type: 'deletion' | 'upload' | 'processing' | 'migration' | 'cleanup';
  entity_type: 'flow' | 'source' | 'segment' | 'object' | 'collection';
  entity_id: string;
  entity_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  progress: number;
  estimated_completion?: string;
  started_at: string;
  completed_at?: string;
  created_by: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description?: string;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  timeout_seconds: number;
  metadata?: Record<string, any>;
}

interface DeletionRequest extends AsyncOperation {
  operation_type: 'deletion';
  soft_delete: boolean;
  cascade: boolean;
  deleted_by: string;
  estimated_size: number;
  segments_count: number;
}

interface AsyncOperationMonitorProps {
  operationType?: 'all' | 'deletion' | 'upload' | 'processing';
  onCancel?: (operationId: string) => void;
  onRetry?: (operationId: string) => void;
  onViewDetails?: (operation: AsyncOperation) => void;
  disabled?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function AsyncOperationMonitor({
  operationType = 'all',
  onCancel,
  onRetry,
  onViewDetails,
  disabled = false,
  autoRefresh = true,
  refreshInterval = 5000
}: AsyncOperationMonitorProps) {
  // State management
  const [operations, setOperations] = useState<AsyncOperation[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<AsyncOperation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load operations data
  useEffect(() => {
    loadOperations();
  }, [operationType]);

  // Auto-refresh operations
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadOperations();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const loadOperations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // const response = await apiClient.getAsyncOperations({ type: operationType });
      // setOperations(response.data);
      
      // Mock data for now
      setOperations([
        {
          id: 'op-1',
          operation_type: 'deletion',
          entity_type: 'flow',
          entity_id: 'flow-123',
          entity_name: 'Demo Video Flow',
          status: 'in_progress',
          progress: 65,
          estimated_completion: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          created_by: 'admin',
          priority: 'high',
          description: 'Deleting flow with 150 segments',
          retry_count: 0,
          max_retries: 3,
          timeout_seconds: 3600,
          metadata: { segments_deleted: 98, total_segments: 150 }
        },
        {
          id: 'op-2',
          operation_type: 'upload',
          entity_type: 'source',
          entity_id: 'source-456',
          entity_name: 'HD Video Source',
          status: 'completed',
          progress: 100,
          started_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          created_by: 'user1',
          priority: 'medium',
          description: 'Uploading 4K video source',
          retry_count: 0,
          max_retries: 3,
          timeout_seconds: 1800
        },
        {
          id: 'op-3',
          operation_type: 'processing',
          entity_type: 'flow',
          entity_id: 'flow-789',
          entity_name: 'Audio Processing Flow',
          status: 'failed',
          progress: 45,
          started_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          created_by: 'system',
          priority: 'low',
          description: 'Audio format conversion',
          error_message: 'Codec not supported',
          retry_count: 2,
          max_retries: 3,
          timeout_seconds: 7200
        }
      ]);
    } catch (err: any) {
      setError(`Failed to load operations: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOperation = async (operationId: string) => {
    if (onCancel) {
      await onCancel(operationId);
    }
    
    // TODO: Replace with actual API call
    // await apiClient.cancelAsyncOperation(operationId);
    
    // Update local state
    setOperations(prev => prev.map(op => 
      op.id === operationId 
        ? { ...op, status: 'cancelled' as const }
        : op
    ));
  };

  const handleRetryOperation = async (operationId: string) => {
    if (onRetry) {
      await onRetry(operationId);
    }
    
    // TODO: Replace with actual API call
    // await apiClient.retryAsyncOperation(operationId);
    
    // Update local state
    setOperations(prev => prev.map(op => 
      op.id === operationId 
        ? { ...op, status: 'pending' as const, progress: 0, retry_count: op.retry_count + 1 }
        : op
    ));
  };

  const handleViewDetails = (operation: AsyncOperation) => {
    setSelectedOperation(operation);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'in_progress': return 'blue';
      case 'completed': return 'green';
      case 'failed': return 'red';
      case 'cancelled': return 'gray';
      case 'timeout': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <IconClock size={16} />;
      case 'in_progress': return <IconArrowRight size={16} />;
      case 'completed': return <IconCheck size={16} />;
      case 'failed': return <IconX size={16} />;
      case 'cancelled': return <IconSquare size={16} />;
      case 'timeout': return <IconAlertCircle size={16} />;
      default: return <IconInfoCircle size={16} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };

  const getOperationTypeIcon = (type: string) => {
    switch (type) {
      case 'deletion': return <IconTrash size={16} />;
      case 'upload': return <IconUpload size={16} />;
      case 'processing': return <IconSettings size={16} />;
      case 'migration': return <IconDatabase size={16} />;
      case 'cleanup': return <IconRefresh size={16} />;
      default: return <IconInfoCircle size={16} />;
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = end.getTime() - start.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const filteredOperations = operations.filter(op => {
    const matchesType = operationType === 'all' || op.operation_type === operationType;
    const matchesStatus = filterStatus === 'all' || op.status === filterStatus;
    const matchesSearch = op.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         op.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  if (isLoading && operations.length === 0) {
    return (
      <Card withBorder>
        <Stack gap="md" align="center" py="xl">
          <Text>Loading operations...</Text>
        </Stack>
      </Card>
    );
  }

  if (error && operations.length === 0) {
    return (
      <Card withBorder>
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
          <Text>{error}</Text>
        </Alert>
      </Card>
    );
  }

  return (
    <>
      <Card withBorder>
        <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between" align="flex-start">
            <Box>
              <Title order={3}>Async Operation Monitor</Title>
              <Text size="sm" c="dimmed" mb="xs">
                BBC TAMS v6.0 compliant monitoring of long-running operations
              </Text>
            </Box>
            
            <Group gap="xs">
              <ActionIcon
                size="sm"
                variant="light"
                color="blue"
                onClick={loadOperations}
                disabled={disabled}
              >
                <IconRefresh size={14} />
              </ActionIcon>
              <Switch
                label="Auto-refresh"
                checked={autoRefresh}
                onChange={(e) => {
                  // This would need to be handled by parent component
                  console.log('Auto-refresh toggled:', e.currentTarget.checked);
                }}
              />
            </Group>
          </Group>

          {/* Filters */}
          <Group gap="md">
            <Select
              label="Status Filter"
              placeholder="All Statuses"
              data={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'failed', label: 'Failed' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'timeout', label: 'Timeout' }
              ]}
              value={filterStatus}
              onChange={(value) => setFilterStatus(value || 'all')}
              style={{ minWidth: 150 }}
            />
            <TextInput
              label="Search"
              placeholder="Search operations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ minWidth: 200 }}
            />
          </Group>

          <Divider />

          {/* Operations Overview */}
          <Tabs defaultValue="list">
            <Tabs.List>
              <Tabs.Tab value="list" leftSection={<IconHistory size={16} />}>
                Operations List ({filteredOperations.length})
              </Tabs.Tab>
              <Tabs.Tab value="timeline" leftSection={<IconClock size={16} />}>
                Timeline View
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="list" pt="md">
              {filteredOperations.length === 0 ? (
                <Alert icon={<IconInfoCircle size={16} />} color="blue">
                  <Text size="sm">No operations found matching the current filters.</Text>
                </Alert>
              ) : (
                <Stack gap="md">
                  {filteredOperations.map((operation) => (
                    <Card key={operation.id} withBorder variant="light">
                      <Stack gap="md">
                        <Group justify="space-between" align="flex-start">
                          <Box>
                            <Group gap="sm" mb="xs">
                              <Badge 
                                variant="light" 
                                color={getStatusColor(operation.status)}
                                leftSection={getStatusIcon(operation.status)}
                              >
                                {operation.status.replace('_', ' ')}
                              </Badge>
                              <Badge 
                                variant="light" 
                                color={getPriorityColor(operation.priority)}
                              >
                                {operation.priority}
                              </Badge>
                              <Badge 
                                variant="light" 
                                color="blue"
                                leftSection={getOperationTypeIcon(operation.operation_type)}
                              >
                                {operation.operation_type}
                              </Badge>
                            </Group>
                            <Text size="sm" fw={500}>
                              {operation.entity_name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {operation.entity_type} • {operation.description}
                            </Text>
                          </Box>
                          
                          <Group gap="xs">
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="blue"
                              onClick={() => handleViewDetails(operation)}
                              disabled={disabled}
                            >
                              <IconEye size={14} />
                            </ActionIcon>
                            {operation.status === 'in_progress' && (
                              <ActionIcon
                                size="sm"
                                variant="light"
                                color="red"
                                onClick={() => handleCancelOperation(operation.id)}
                                disabled={disabled}
                              >
                                <IconSquare size={14} />
                              </ActionIcon>
                            )}
                            {operation.status === 'failed' && operation.retry_count < operation.max_retries && (
                              <ActionIcon
                                size="sm"
                                variant="light"
                                color="green"
                                onClick={() => handleRetryOperation(operation.id)}
                                disabled={disabled}
                              >
                                <IconRefresh size={14} />
                              </ActionIcon>
                            )}
                          </Group>
                        </Group>

                        {/* Progress Section */}
                        {operation.status === 'in_progress' && (
                          <Box>
                            <Group justify="space-between" mb="xs">
                              <Text size="sm" fw={500}>Progress</Text>
                              <Text size="sm" c="dimmed">
                                {operation.progress}%
                              </Text>
                            </Group>
                            <Progress 
                              value={operation.progress} 
                              color="blue" 
                              size="sm"
                            />
                            {operation.estimated_completion && (
                              <Text size="xs" c="dimmed" mt="xs">
                                Estimated completion: {new Date(operation.estimated_completion).toLocaleString()}
                              </Text>
                            )}
                          </Box>
                        )}

                        {/* Operation Details */}
                        <Grid>
                          <Grid.Col span={6}>
                            <Text size="sm" fw={500}>Started</Text>
                            <Text size="sm" c="dimmed">
                              {new Date(operation.started_at).toLocaleString()}
                            </Text>
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <Text size="sm" fw={500}>Duration</Text>
                            <Text size="sm" c="dimmed">
                              {formatDuration(operation.started_at, operation.completed_at)}
                            </Text>
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <Text size="sm" fw={500}>Created By</Text>
                            <Text size="sm" c="dimmed">{operation.created_by}</Text>
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <Text size="sm" fw={500}>Retries</Text>
                            <Text size="sm" c="dimmed">
                              {operation.retry_count} / {operation.max_retries}
                            </Text>
                          </Grid.Col>
                        </Grid>

                        {/* Error Message */}
                        {operation.error_message && (
                          <Alert icon={<IconAlertCircle size={16} />} color="red">
                            <Text size="sm">{operation.error_message}</Text>
                          </Alert>
                        )}
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="timeline" pt="md">
              <Timeline active={filteredOperations.filter(op => op.status === 'in_progress').length}>
                {filteredOperations.map((operation) => (
                  <Timeline.Item
                    key={operation.id}
                    bullet={getStatusIcon(operation.status)}
                    title={operation.entity_name}
                    color={getStatusColor(operation.status)}
                  >
                    <Text size="sm" c="dimmed">
                      {operation.operation_type} • {operation.status}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Started: {new Date(operation.started_at).toLocaleString()}
                    </Text>
                    {operation.status === 'in_progress' && (
                      <Progress 
                        value={operation.progress} 
                        color="blue" 
                        size="sm" 
                        mt="xs"
                      />
                    )}
                  </Timeline.Item>
                ))}
              </Timeline>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Card>

      {/* Operation Details Modal */}
      <Modal
        opened={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Operation Details"
        size="lg"
      >
        {selectedOperation && (
          <Stack gap="md">
            <Group justify="space-between">
              <Badge 
                size="lg"
                color={getStatusColor(selectedOperation.status)}
                leftSection={getStatusIcon(selectedOperation.status)}
              >
                {selectedOperation.status.replace('_', ' ')}
              </Badge>
              <Badge 
                size="lg"
                color={getPriorityColor(selectedOperation.priority)}
              >
                {selectedOperation.priority}
              </Badge>
            </Group>

            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" fw={500}>Operation ID</Text>
                <Text size="sm" c="dimmed">{selectedOperation.id}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" fw={500}>Type</Text>
                <Text size="sm" c="dimmed">{selectedOperation.operation_type}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" fw={500}>Entity</Text>
                <Text size="sm" c="dimmed">{selectedOperation.entity_name}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" fw={500}>Entity Type</Text>
                <Text size="sm" c="dimmed">{selectedOperation.entity_type}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" fw={500}>Started</Text>
                <Text size="sm" c="dimmed">
                  {new Date(selectedOperation.started_at).toLocaleString()}
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" fw={500}>Created By</Text>
                <Text size="sm" c="dimmed">{selectedOperation.created_by}</Text>
              </Grid.Col>
              {selectedOperation.completed_at && (
                <Grid.Col span={6}>
                  <Text size="sm" fw={500}>Completed</Text>
                  <Text size="sm" c="dimmed">
                    {new Date(selectedOperation.completed_at).toLocaleString()}
                  </Text>
                </Grid.Col>
              )}
              <Grid.Col span={6}>
                <Text size="sm" fw={500}>Duration</Text>
                <Text size="sm" c="dimmed">
                  {formatDuration(selectedOperation.started_at, selectedOperation.completed_at)}
                </Text>
              </Grid.Col>
            </Grid>

            {selectedOperation.description && (
              <Box>
                <Text size="sm" fw={500} mb="xs">Description</Text>
                <Text size="sm">{selectedOperation.description}</Text>
              </Box>
            )}

            {selectedOperation.status === 'in_progress' && (
              <Box>
                <Text size="sm" fw={500} mb="md">Progress</Text>
                <Center>
                  <RingProgress
                    size={120}
                    thickness={12}
                    sections={[{ value: selectedOperation.progress, color: 'blue' }]}
                    label={
                      <Text size="lg" fw={700} ta="center">
                        {selectedOperation.progress}%
                      </Text>
                    }
                  />
                </Center>
                {selectedOperation.estimated_completion && (
                  <Text size="sm" c="dimmed" ta="center" mt="md">
                    Estimated completion: {new Date(selectedOperation.estimated_completion).toLocaleString()}
                  </Text>
                )}
              </Box>
            )}

            {selectedOperation.error_message && (
              <Alert icon={<IconAlertCircle size={16} />} color="red">
                <Text size="sm" fw={500}>Error Message</Text>
                <Text size="sm">{selectedOperation.error_message}</Text>
              </Alert>
            )}

            {selectedOperation.metadata && Object.keys(selectedOperation.metadata).length > 0 && (
              <Box>
                <Text size="sm" fw={500} mb="xs">Metadata</Text>
                <Code block>{JSON.stringify(selectedOperation.metadata, null, 2)}</Code>
              </Box>
            )}

            <Group justify="flex-end">
              <Button variant="light" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
              {selectedOperation.status === 'in_progress' && (
                <Button
                  color="red"
                  onClick={() => {
                    handleCancelOperation(selectedOperation.id);
                    setShowDetailsModal(false);
                  }}
                >
                  Cancel Operation
                </Button>
              )}
              {selectedOperation.status === 'failed' && selectedOperation.retry_count < selectedOperation.max_retries && (
                <Button
                  color="green"
                  onClick={() => {
                    handleRetryOperation(selectedOperation.id);
                    setShowDetailsModal(false);
                  }}
                >
                  Retry Operation
                </Button>
              )}
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
