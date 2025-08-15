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
  NumberInput,
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
  CopyButton
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconUpload,
  IconDownload,
  IconDatabase,
  IconBucket,
  IconSettings,
  IconInfoCircle,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconCopy,
  IconExternalLink,
  IconRefresh,
  IconHistory
} from '@tabler/icons-react';

// BBC TAMS API v6.0 Storage Types
interface StorageAllocation {
  id: string;
  flow_id: string;
  limit: number;
  object_ids: string[];
  status: 'pending' | 'allocated' | 'in_use' | 'completed' | 'failed';
  created_at: string;
  expires_at?: string;
  created_by: string;
  storage_locations?: StorageLocation[];
  metadata?: Record<string, any>;
}

interface StorageLocation {
  object_id: string;
  put_url: string;
  bucket_put_url: string;
  bucket_name: string;
  region?: string;
  expires_at?: string;
  cors_enabled: boolean;
}

interface StorageBucket {
  id: string;
  name: string;
  region: string;
  status: 'active' | 'inactive' | 'maintenance';
  cors_enabled: boolean;
  max_size: number;
  current_usage: number;
  object_count: number;
  created_at: string;
  last_accessed: string;
}

interface StorageAllocationManagerProps {
  flowId?: string;
  onAllocate?: (allocation: StorageAllocation) => void;
  onDelete?: (allocationId: string) => void;
  disabled?: boolean;
}

export function StorageAllocationManager({
  flowId,
  onAllocate,
  onDelete,
  disabled = false
}: StorageAllocationManagerProps) {
  // State management
  const [allocations, setAllocations] = useState<StorageAllocation[]>([]);
  const [buckets, setBuckets] = useState<StorageBucket[]>([]);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<StorageAllocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for new allocation
  const [newAllocation, setNewAllocation] = useState({
    limit: 1000000000, // 1GB default
    object_ids: [''],
    bucket_preference: '',
    cors_enabled: true,
    expires_in_hours: 24
  });

  // Form state for new bucket
  const [newBucket, setNewBucket] = useState({
    name: '',
    region: 'us-east-1',
    max_size: 1000000000000, // 1TB default
    cors_enabled: true
  });

  // Load data
  useEffect(() => {
    loadStorageData();
  }, [flowId]);

  const loadStorageData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API calls
      // const [allocationsRes, bucketsRes] = await Promise.all([
      //   apiClient.getStorageAllocations(flowId),
      //   apiClient.getStorageBuckets()
      // ]);
      // setAllocations(allocationsRes.data);
      // setBuckets(bucketsRes.data);
      
      // Mock data for now
      setAllocations([
        {
          id: 'alloc-1',
          flow_id: flowId || 'flow-1',
          limit: 5000000000,
          object_ids: ['obj-001', 'obj-002'],
          status: 'allocated',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'admin',
          storage_locations: [
            {
              object_id: 'obj-001',
              put_url: 'https://storage.example.com/upload/obj-001',
              bucket_put_url: 'https://bucket.example.com/obj-001',
              bucket_name: 'media-bucket-1',
              region: 'us-east-1',
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              cors_enabled: true
            }
          ]
        }
      ]);

      setBuckets([
        {
          id: 'bucket-1',
          name: 'media-bucket-1',
          region: 'us-east-1',
          status: 'active',
          cors_enabled: true,
          max_size: 1000000000000,
          current_usage: 250000000000,
          object_count: 1250,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          last_accessed: new Date().toISOString()
        }
      ]);
    } catch (err: any) {
      setError(`Failed to load storage data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAllocation = async () => {
    if (!flowId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const allocation: StorageAllocation = {
        id: `alloc-${Date.now()}`,
        flow_id: flowId,
        limit: newAllocation.limit,
        object_ids: newAllocation.object_ids.filter(id => id.trim()),
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + newAllocation.expires_in_hours * 60 * 60 * 1000).toISOString(),
        created_by: 'admin',
        // cors_enabled is not part of StorageAllocation interface
      };

      if (onAllocate) {
        await onAllocate(allocation);
      }
      
      // TODO: Replace with actual API call
      // await apiClient.createStorageAllocation(flowId, allocation);
      
      setAllocations(prev => [...prev, allocation]);
      setShowAllocationModal(false);
      setNewAllocation({
        limit: 1000000000,
        object_ids: [''],
        bucket_preference: '',
        cors_enabled: true,
        expires_in_hours: 24
      });
    } catch (err: any) {
      setError(`Failed to create allocation: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBucket = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const bucket: StorageBucket = {
        id: `bucket-${Date.now()}`,
        name: newBucket.name,
        region: newBucket.region,
        status: 'active',
        cors_enabled: newBucket.cors_enabled,
        max_size: newBucket.max_size,
        current_usage: 0,
        object_count: 0,
        created_at: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      };

      // TODO: Replace with actual API call
      // await apiClient.createStorageBucket(bucket);
      
      setBuckets(prev => [...prev, bucket]);
      setShowBucketModal(false);
      setNewBucket({
        name: '',
        region: 'us-east-1',
        max_size: 1000000000000,
        cors_enabled: true
      });
    } catch (err: any) {
      setError(`Failed to create bucket: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllocation = async (allocationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (onDelete) {
        await onDelete(allocationId);
      }
      
      // TODO: Replace with actual API call
      // await apiClient.deleteStorageAllocation(allocationId);
      
      setAllocations(prev => prev.filter(a => a.id !== allocationId));
      setShowDeleteModal(false);
    } catch (err: any) {
      setError(`Failed to delete allocation: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addObjectId = () => {
    setNewAllocation(prev => ({
      ...prev,
      object_ids: [...prev.object_ids, '']
    }));
  };

  const removeObjectId = (index: number) => {
    setNewAllocation(prev => ({
      ...prev,
      object_ids: prev.object_ids.filter((_, i) => i !== index)
    }));
  };

  const updateObjectId = (index: number, value: string) => {
    setNewAllocation(prev => ({
      ...prev,
      object_ids: prev.object_ids.map((id, i) => i === index ? value : id)
    }));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'allocated': return 'blue';
      case 'in_use': return 'green';
      case 'completed': return 'green';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <IconAlertCircle size={16} />;
      case 'allocated': return <IconCheck size={16} />;
      case 'in_use': return <IconUpload size={16} />;
      case 'completed': return <IconCheck size={16} />;
      case 'failed': return <IconX size={16} />;
      default: return <IconInfoCircle size={16} />;
    }
  };

  if (isLoading && allocations.length === 0) {
    return (
      <Card withBorder>
        <Stack gap="md" align="center" py="xl">
          <Text>Loading storage data...</Text>
        </Stack>
      </Card>
    );
  }

  if (error && allocations.length === 0) {
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
              <Title order={3}>Storage Allocation Manager</Title>
              <Text size="sm" c="dimmed" mb="xs">
                BBC TAMS v6.0 compliant storage allocation and bucket management
              </Text>
            </Box>
            
            <Group gap="xs">
              <Button
                variant="light"
                size="sm"
                leftSection={<IconPlus size={14} />}
                onClick={() => setShowAllocationModal(true)}
                disabled={disabled || !flowId}
              >
                Allocate Storage
              </Button>
              <Button
                variant="light"
                size="sm"
                leftSection={<IconBucket size={14} />}
                onClick={() => setShowBucketModal(true)}
                disabled={disabled}
              >
                Create Bucket
              </Button>
              <ActionIcon
                size="sm"
                variant="light"
                color="blue"
                onClick={loadStorageData}
                disabled={disabled}
              >
                <IconRefresh size={14} />
              </ActionIcon>
            </Group>
          </Group>

          <Divider />

          {/* Storage Overview */}
          <Tabs defaultValue="allocations">
            <Tabs.List>
              <Tabs.Tab value="allocations" leftSection={<IconDatabase size={16} />}>
                Storage Allocations ({allocations.length})
              </Tabs.Tab>
              <Tabs.Tab value="buckets" leftSection={<IconBucket size={16} />}>
                Storage Buckets ({buckets.length})
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="allocations" pt="md">
              {allocations.length === 0 ? (
                <Alert icon={<IconInfoCircle size={16} />} color="blue">
                  <Text size="sm">No storage allocations yet. Click "Allocate Storage" to get started.</Text>
                </Alert>
              ) : (
                <Stack gap="md">
                  {allocations.map((allocation) => (
                    <Card key={allocation.id} withBorder variant="light">
                      <Stack gap="md">
                        <Group justify="space-between" align="flex-start">
                          <Box>
                            <Group gap="sm" mb="xs">
                              <Badge 
                                variant="light" 
                                color={getStatusColor(allocation.status)}
                                leftSection={getStatusIcon(allocation.status)}
                              >
                                {allocation.status}
                              </Badge>
                              <Text size="sm" fw={500}>
                                Allocation {allocation.id}
                              </Text>
                            </Group>
                            <Text size="xs" c="dimmed">
                              Flow: {allocation.flow_id} | Created: {new Date(allocation.created_at).toLocaleString()}
                            </Text>
                          </Box>
                          
                          <Group gap="xs">
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="blue"
                              onClick={() => {
                                setEditingAllocation(allocation);
                                setShowAllocationModal(true);
                              }}
                              disabled={disabled}
                            >
                              <IconEdit size={14} />
                            </ActionIcon>
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="red"
                              onClick={() => {
                                setEditingAllocation(allocation);
                                setShowDeleteModal(true);
                              }}
                              disabled={disabled}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Group>
                        </Group>

                        <Grid>
                          <Grid.Col span={6}>
                            <Text size="sm" fw={500}>Storage Limit</Text>
                            <Text size="sm" c="dimmed">{formatBytes(allocation.limit)}</Text>
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <Text size="sm" fw={500}>Object Count</Text>
                            <Text size="sm" c="dimmed">{allocation.object_ids.length} objects</Text>
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <Text size="sm" fw={500}>Expires</Text>
                            <Text size="sm" c="dimmed">
                              {allocation.expires_at ? new Date(allocation.expires_at).toLocaleString() : 'Never'}
                            </Text>
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <Text size="sm" fw={500}>Created By</Text>
                            <Text size="sm" c="dimmed">{allocation.created_by}</Text>
                          </Grid.Col>
                        </Grid>

                        {allocation.storage_locations && allocation.storage_locations.length > 0 && (
                          <Box>
                            <Text size="sm" fw={500} mb="xs">Storage Locations:</Text>
                            <Stack gap="sm">
                              {allocation.storage_locations.map((location) => (
                                <Card key={location.object_id} withBorder variant="subtle" p="xs">
                                  <Group justify="space-between" align="center">
                                    <Box>
                                      <Text size="sm" fw={500}>{location.object_id}</Text>
                                      <Text size="xs" c="dimmed">{location.bucket_name} ({location.region})</Text>
                                    </Box>
                                    <Group gap="xs">
                                      <CopyButton value={location.put_url}>
                                        {({ copied, copy }) => (
                                          <ActionIcon
                                            size="sm"
                                            variant="light"
                                            color={copied ? 'green' : 'blue'}
                                            onClick={copy}
                                          >
                                            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                          </ActionIcon>
                                        )}
                                      </CopyButton>
                                      <ActionIcon
                                        size="sm"
                                        variant="light"
                                        color="blue"
                                        component="a"
                                        href={location.put_url}
                                        target="_blank"
                                      >
                                        <IconExternalLink size={14} />
                                      </ActionIcon>
                                    </Group>
                                  </Group>
                                </Card>
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="buckets" pt="md">
              {buckets.length === 0 ? (
                <Alert icon={<IconInfoCircle size={16} />} color="blue">
                  <Text size="sm">No storage buckets yet. Click "Create Bucket" to get started.</Text>
                </Alert>
              ) : (
                <Stack gap="md">
                  {buckets.map((bucket) => (
                    <Card key={bucket.id} withBorder variant="light">
                      <Stack gap="md">
                        <Group justify="space-between" align="flex-start">
                          <Box>
                            <Group gap="sm" mb="xs">
                              <Badge 
                                variant="light" 
                                color={bucket.status === 'active' ? 'green' : 'gray'}
                              >
                                {bucket.status}
                              </Badge>
                              <Text size="sm" fw={500}>
                                {bucket.name}
                              </Text>
                            </Group>
                            <Text size="xs" c="dimmed">
                              Region: {bucket.region} | Created: {new Date(bucket.created_at).toLocaleString()}
                            </Text>
                          </Box>
                          
                          <Group gap="xs">
                            <Badge variant="light" color={bucket.cors_enabled ? 'green' : 'red'}>
                              CORS {bucket.cors_enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </Group>
                        </Group>

                        <Grid>
                          <Grid.Col span={6}>
                            <Text size="sm" fw={500}>Max Size</Text>
                            <Text size="sm" c="dimmed">{formatBytes(bucket.max_size)}</Text>
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <Text size="sm" fw={500}>Current Usage</Text>
                            <Text size="sm" c="dimmed">{formatBytes(bucket.current_usage)}</Text>
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <Text size="sm" fw={500}>Object Count</Text>
                            <Text size="sm" c="dimmed">{bucket.object_count} objects</Text>
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <Text size="sm" fw={500}>Last Accessed</Text>
                            <Text size="sm" c="dimmed">
                              {new Date(bucket.last_accessed).toLocaleString()}
                            </Text>
                          </Grid.Col>
                        </Grid>

                        <Box>
                          <Text size="sm" fw={500} mb="xs">Storage Usage</Text>
                          <Progress 
                            value={(bucket.current_usage / bucket.max_size) * 100} 
                            color="blue" 
                            size="sm"
                          />
                          <Text size="xs" c="dimmed" mt="xs">
                            {formatBytes(bucket.current_usage)} / {formatBytes(bucket.max_size)} used
                          </Text>
                        </Box>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              )}
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Card>

      {/* Storage Allocation Modal */}
      <Modal
        opened={showAllocationModal}
        onClose={() => setShowAllocationModal(false)}
        title={editingAllocation ? "Edit Storage Allocation" : "Create Storage Allocation"}
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {editingAllocation 
              ? "Modify the storage allocation settings."
              : "Pre-allocate storage for your flow before uploading media objects."
            }
          </Text>
          
          <Grid>
            <Grid.Col span={6}>
              <NumberInput
                label="Storage Limit (bytes)"
                placeholder="1000000000"
                value={newAllocation.limit}
                onChange={(value) => setNewAllocation({ ...newAllocation, limit: typeof value === 'number' ? value : 0 })}
                min={0}
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="Expires In (hours)"
                placeholder="24"
                value={newAllocation.expires_in_hours}
                onChange={(value) => setNewAllocation({ ...newAllocation, expires_in_hours: typeof value === 'number' ? value : 24 })}
                min={1}
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Bucket Preference"
                placeholder="Select preferred bucket"
                data={buckets.map(bucket => ({ value: bucket.id, label: bucket.name }))}
                value={newAllocation.bucket_preference}
                onChange={(value) => setNewAllocation({ ...newAllocation, bucket_preference: value || '' })}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Switch
                label="Enable CORS"
                checked={newAllocation.cors_enabled}
                onChange={(e) => setNewAllocation({ ...newAllocation, cors_enabled: e.currentTarget.checked })}
              />
            </Grid.Col>
          </Grid>

          <Box>
            <Group justify="space-between" align="center" mb="xs">
              <Text size="sm" fw={500}>Object IDs</Text>
              <Button
                variant="light"
                size="xs"
                leftSection={<IconPlus size={12} />}
                onClick={addObjectId}
              >
                Add Object
              </Button>
            </Group>
            
            <Stack gap="sm">
              {newAllocation.object_ids.map((id, index) => (
                <Group key={index} gap="sm">
                  <TextInput
                    style={{ flex: 1 }}
                    placeholder={`Object ID ${index + 1}`}
                    value={id}
                    onChange={(e) => updateObjectId(index, e.target.value)}
                    required
                  />
                  {newAllocation.object_ids.length > 1 && (
                    <ActionIcon
                      size="sm"
                      variant="light"
                      color="red"
                      onClick={() => removeObjectId(index)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  )}
                </Group>
              ))}
            </Stack>
          </Box>

          <Group justify="flex-end">
            <Button variant="light" onClick={() => setShowAllocationModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateAllocation}
              loading={isLoading}
              disabled={!newAllocation.limit || newAllocation.object_ids.some(id => !id.trim())}
            >
              {editingAllocation ? 'Update Allocation' : 'Create Allocation'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Create Bucket Modal */}
      <Modal
        opened={showBucketModal}
        onClose={() => setShowBucketModal(false)}
        title="Create Storage Bucket"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Create a new storage bucket for media objects with CORS configuration.
          </Text>
          
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Bucket Name"
                placeholder="media-bucket-1"
                value={newBucket.name}
                onChange={(e) => setNewBucket({ ...newBucket, name: e.target.value })}
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Region"
                placeholder="Select region"
                data={[
                  { value: 'us-east-1', label: 'US East (N. Virginia)' },
                  { value: 'us-west-2', label: 'US West (Oregon)' },
                  { value: 'eu-west-1', label: 'Europe (Ireland)' },
                  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' }
                ]}
                value={newBucket.region}
                onChange={(value) => setNewBucket({ ...newBucket, region: value || 'us-east-1' })}
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="Max Size (bytes)"
                placeholder="1000000000000"
                value={newBucket.max_size}
                onChange={(value) => setNewBucket({ ...newBucket, max_size: typeof value === 'number' ? value : 0 })}
                min={0}
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Switch
                label="Enable CORS"
                checked={newBucket.cors_enabled}
                onChange={(e) => setNewBucket({ ...newBucket, cors_enabled: e.currentTarget.checked })}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end">
            <Button variant="light" onClick={() => setShowBucketModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBucket}
              loading={isLoading}
              disabled={!newBucket.name || !newBucket.region}
            >
              Create Bucket
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Storage Allocation"
        size="md"
      >
        <Stack gap="md">
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            <Text fw={500}>Warning: This action cannot be undone!</Text>
            <Text size="sm">
              Deleting this storage allocation will remove all allocated storage and may affect 
              ongoing uploads or media operations.
            </Text>
          </Alert>
          
          {editingAllocation && (
            <Text size="sm">
              <strong>Allocation:</strong> {editingAllocation.id}<br />
              <strong>Flow:</strong> {editingAllocation.flow_id}<br />
              <strong>Storage:</strong> {formatBytes(editingAllocation.limit)}<br />
              <strong>Objects:</strong> {editingAllocation.object_ids.length} objects
            </Text>
          )}
          
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button 
              color="red" 
              onClick={() => editingAllocation && handleDeleteAllocation(editingAllocation.id)}
              loading={isLoading}
            >
              Delete Allocation
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
