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
  ScrollArea,
  Tabs,
  List,
  ThemeIcon
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconLink,
  IconUnlink,
  IconFolders,
  IconVideo,
  IconMicrophone,
  IconFileText,
  IconPhoto,
  IconSettings,
  IconInfoCircle,
  IconAlertCircle,
  IconCheck,
  IconX
} from '@tabler/icons-react';

// BBC TAMS API v6.0 Types
interface CollectionItem {
  id: string;
  role: string;
  container_mapping?: ContainerMapping;
}

interface ContainerMapping {
  essence_type: string;
  mapping_data: Record<string, any>;
}

interface FlowCollection {
  id: string;
  label: string;
  description?: string;
  format: string;
  codec: string;
  container?: string;
  flow_collection: CollectionItem[];
  collected_by?: string[];
  read_only: boolean;
  created_by?: string;
  updated_by?: string;
  created?: string;
  updated?: string;
  tags?: Record<string, string>;
  // Soft delete fields
  deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

interface FlowCollectionManagerProps {
  collectionId?: string;
  onSave?: (collection: FlowCollection) => void;
  onDelete?: (collectionId: string) => void;
  disabled?: boolean;
}

export function FlowCollectionManager({
  collectionId,
  onSave,
  onDelete,
  disabled = false
}: FlowCollectionManagerProps) {
  // State management
  const [collection, setCollection] = useState<FlowCollection | null>(null);
  const [availableFlows, setAvailableFlows] = useState<any[]>([]);
  const [showAddFlowModal, setShowAddFlowModal] = useState(false);
  const [showEditFlowModal, setShowEditFlowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingFlow, setEditingFlow] = useState<CollectionItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for new collection
  const [newCollection, setNewCollection] = useState({
    label: '',
    description: '',
    format: 'urn:x-nmos:format:multi',
    codec: 'application/mxf',
    container: 'application/mxf',
    read_only: false
  });

  // Load collection data
  useEffect(() => {
    if (collectionId) {
      loadCollection(collectionId);
    }
  }, [collectionId]);

  // Load available flows for adding to collection
  useEffect(() => {
    loadAvailableFlows();
  }, []);

  const loadCollection = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // const response = await apiClient.getFlow(id);
      // setCollection(response);
      
      // Mock data for now
      setCollection({
        id,
        label: 'Multi-Essence Demo Collection',
        description: 'A collection of video, audio, and data flows',
        format: 'urn:x-nmos:format:multi',
        codec: 'application/mxf',
        container: 'application/mxf',
        flow_collection: [
          { id: 'flow-1', role: 'Main Video' },
          { id: 'flow-2', role: 'Stereo Audio' },
          { id: 'flow-3', role: 'Metadata' }
        ],
        read_only: false,
        created_by: 'admin',
        created: new Date().toISOString()
      });
    } catch (err: any) {
      setError(`Failed to load collection: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableFlows = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await apiClient.getFlows({ format: '!urn:x-nmos:format:multi' });
      // setAvailableFlows(response.data);
      
      // Mock data for now
      setAvailableFlows([
        { id: 'flow-4', label: 'HD Video', format: 'urn:x-nmos:format:video' },
        { id: 'flow-5', label: '5.1 Audio', format: 'urn:x-nmos:format:audio' },
        { id: 'flow-6', label: 'Subtitles', format: 'urn:x-nmos:format:data' }
      ]);
    } catch (err: any) {
      setError(`Failed to load available flows: ${err.message}`);
    }
  };

  const handleAddFlow = (flowId: string, role: string) => {
    if (!collection) return;
    
    const newFlow: CollectionItem = { id: flowId, role };
    setCollection({
      ...collection,
      flow_collection: [...collection.flow_collection, newFlow]
    });
    setShowAddFlowModal(false);
  };

  const handleRemoveFlow = (flowId: string) => {
    if (!collection) return;
    
    setCollection({
      ...collection,
      flow_collection: collection.flow_collection.filter(f => f.id !== flowId)
    });
  };

  const handleUpdateFlowRole = (flowId: string, newRole: string) => {
    if (!collection) return;
    
    setCollection({
      ...collection,
      flow_collection: collection.flow_collection.map(f => 
        f.id === flowId ? { ...f, role: newRole } : f
      )
    });
  };

  const handleSaveCollection = async () => {
    if (!collection) return;
    
    setIsLoading(true);
    setError(null);
    try {
      if (onSave) {
        await onSave(collection);
      }
      // TODO: Replace with actual API call
      // await apiClient.updateFlow(collection.id, collection);
    } catch (err: any) {
      setError(`Failed to save collection: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!collection) return;
    
    setIsLoading(true);
    setError(null);
    try {
      if (onDelete) {
        await onDelete(collection.id);
      }
      // TODO: Replace with actual API call
      // await apiClient.deleteFlow(collection.id);
      setShowDeleteModal(false);
    } catch (err: any) {
      setError(`Failed to delete collection: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getFlowIcon = (format: string) => {
    switch (format) {
      case 'urn:x-nmos:format:video':
        return <IconVideo size={16} />;
      case 'urn:x-nmos:format:audio':
        return <IconMicrophone size={16} />;
      case 'urn:x-nmos:format:data':
        return <IconFileText size={16} />;
      case 'urn:x-tam:format:image':
        return <IconPhoto size={16} />;
      case 'urn:x-nmos:format:multi':
        return <IconFolders size={16} />;
      default:
        return <IconFileText size={16} />;
    }
  };

  const getFlowColor = (format: string) => {
    switch (format) {
      case 'urn:x-nmos:format:video':
        return 'blue';
      case 'urn:x-nmos:format:audio':
        return 'green';
      case 'urn:x-nmos:format:data':
        return 'orange';
      case 'urn:x-tam:format:image':
        return 'purple';
      case 'urn:x-nmos:format:multi':
        return 'grape';
      default:
        return 'gray';
    }
  };

  if (isLoading) {
    return (
      <Card withBorder>
        <Stack gap="md" align="center" py="xl">
          <Text>Loading collection...</Text>
        </Stack>
      </Card>
    );
  }

  if (error) {
    return (
      <Card withBorder>
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
          <Text>{error}</Text>
        </Alert>
      </Card>
    );
  }

  if (!collection) {
    return (
      <Card withBorder>
        <Stack gap="md">
          <Title order={3}>Create New Flow Collection</Title>
          <Text size="sm" c="dimmed">
            Create a new multi-essence flow collection according to BBC TAMS API v6.0 specification
          </Text>
          
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Collection Label"
                placeholder="Enter collection name"
                value={newCollection.label}
                onChange={(e) => setNewCollection({ ...newCollection, label: e.target.value })}
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Codec"
                placeholder="Select codec"
                data={[
                  { value: 'application/mxf', label: 'MXF' },
                  { value: 'video/mp4', label: 'MP4' },
                  { value: 'application/ts', label: 'MPEG-TS' }
                ]}
                value={newCollection.codec}
                onChange={(value) => setNewCollection({ ...newCollection, codec: value || '' })}
                required
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label="Description"
                placeholder="Enter collection description"
                value={newCollection.description}
                onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                rows={3}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Switch
                label="Read Only"
                checked={newCollection.read_only}
                onChange={(e) => setNewCollection({ ...newCollection, read_only: e.currentTarget.checked })}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end">
            <Button
              onClick={() => {
                const newFlow: FlowCollection = {
                  id: `collection-${Date.now()}`,
                  ...newCollection,
                  flow_collection: [],
                  created_by: 'admin',
                  created: new Date().toISOString()
                };
                setCollection(newFlow);
              }}
              disabled={!newCollection.label || !newCollection.codec}
            >
              Create Collection
            </Button>
          </Group>
        </Stack>
      </Card>
    );
  }

  return (
    <>
      <Card withBorder>
        <Stack gap="lg">
          {/* Collection Header */}
          <Group justify="space-between" align="flex-start">
            <Box>
              <Title order={3}>{collection.label}</Title>
              <Text size="sm" c="dimmed" mb="xs">
                Multi-Essence Flow Collection
              </Text>
              <Group gap="xs">
                <Badge variant="light" color={getFlowColor(collection.format)} leftSection={getFlowIcon(collection.format)}>
                  {collection.format.split(':').pop()}
                </Badge>
                <Badge variant="light" color="gray">
                  {collection.codec}
                </Badge>
                {collection.read_only && (
                  <Badge variant="light" color="red">Read Only</Badge>
                )}
              </Group>
            </Box>
            
            <Group gap="xs">
              <Button
                variant="light"
                size="sm"
                leftSection={<IconPlus size={14} />}
                onClick={() => setShowAddFlowModal(true)}
                disabled={disabled || collection.read_only}
              >
                Add Flow
              </Button>
              <Button
                variant="light"
                size="sm"
                leftSection={<IconEdit size={14} />}
                onClick={() => setShowEditFlowModal(true)}
                disabled={disabled || collection.read_only}
              >
                Edit
              </Button>
              <Button
                variant="light"
                size="sm"
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => setShowDeleteModal(true)}
                disabled={disabled || collection.read_only}
              >
                Delete
              </Button>
            </Group>
          </Group>

          {collection.description && (
            <Text size="sm">{collection.description}</Text>
          )}

          <Divider />

          {/* Collection Content */}
          <Tabs defaultValue="flows">
            <Tabs.List>
              <Tabs.Tab value="flows" leftSection={<IconFolders size={16} />}>
                Collection Flows ({collection.flow_collection.length})
              </Tabs.Tab>
              <Tabs.Tab value="info" leftSection={<IconInfoCircle size={16} />}>
                Collection Info
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="flows" pt="md">
              {collection.flow_collection.length === 0 ? (
                <Alert icon={<IconInfoCircle size={16} />} color="blue">
                  <Text size="sm">No flows in this collection yet. Click "Add Flow" to get started.</Text>
                </Alert>
              ) : (
                <Stack gap="sm">
                  {collection.flow_collection.map((flow, index) => (
                    <Card key={flow.id} withBorder variant="light">
                      <Group justify="space-between" align="center">
                        <Group gap="sm">
                          <Badge variant="light" color="blue">
                            {flow.role}
                          </Badge>
                          <Text size="sm" fw={500}>
                            Flow {flow.id}
                          </Text>
                          <Text size="xs" c="dimmed">
                            ID: {flow.id}
                          </Text>
                        </Group>
                        
                        <Group gap="xs">
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="blue"
                            onClick={() => {
                              setEditingFlow(flow);
                              setShowEditFlowModal(true);
                            }}
                            disabled={disabled || collection.read_only}
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="red"
                            onClick={() => handleRemoveFlow(flow.id)}
                            disabled={disabled || collection.read_only}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="info" pt="md">
              <Stack gap="md">
                <Grid>
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500}>Collection ID</Text>
                    <Text size="sm" c="dimmed">{collection.id}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500}>Format</Text>
                    <Text size="sm" c="dimmed">{collection.format}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500}>Codec</Text>
                    <Text size="sm" c="dimmed">{collection.codec}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500}>Container</Text>
                    <Text size="sm" c="dimmed">{collection.container || 'N/A'}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500}>Created By</Text>
                    <Text size="sm" c="dimmed">{collection.created_by || 'N/A'}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500}>Created</Text>
                    <Text size="sm" c="dimmed">
                      {collection.created ? new Date(collection.created).toLocaleString() : 'N/A'}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500}>Updated By</Text>
                    <Text size="sm" c="dimmed">{collection.updated_by || 'N/A'}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500}>Updated</Text>
                    <Text size="sm" c="dimmed">
                      {collection.updated ? new Date(collection.updated).toLocaleString() : 'N/A'}
                    </Text>
                  </Grid.Col>
                </Grid>

                {collection.tags && Object.keys(collection.tags).length > 0 && (
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Tags</Text>
                    <Group gap="xs">
                      {Object.entries(collection.tags).map(([key, value]) => (
                        <Badge key={key} variant="light" size="sm">
                          {key}: {value}
                        </Badge>
                      ))}
                    </Group>
                  </Box>
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>

          {/* Action Buttons */}
          <Group justify="flex-end">
            <Button
              onClick={handleSaveCollection}
              disabled={disabled || collection.read_only}
              loading={isLoading}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Card>

      {/* Add Flow Modal */}
      <Modal
        opened={showAddFlowModal}
        onClose={() => setShowAddFlowModal(false)}
        title="Add Flow to Collection"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Select a flow to add to this collection and assign it a role.
          </Text>
          
          <Select
            label="Available Flows"
            placeholder="Select a flow"
            data={availableFlows.map(flow => ({
              value: flow.id,
              label: `${flow.label} (${flow.format.split(':').pop()})`,
              group: flow.format.split(':').pop()
            }))}
            onChange={(value) => {
              const flow = availableFlows.find(f => f.id === value);
              if (flow) {
                handleAddFlow(flow.id, 'New Role');
              }
            }}
          />
          
          <Text size="xs" c="dimmed">
            Note: Only flows that are not already in a collection can be added.
          </Text>
        </Stack>
      </Modal>

      {/* Edit Flow Role Modal */}
      <Modal
        opened={showEditFlowModal}
        onClose={() => setShowEditFlowModal(false)}
        title="Edit Flow Role"
        size="md"
      >
        <Stack gap="md">
          {editingFlow && (
            <>
              <TextInput
                label="Flow Role"
                placeholder="Enter role (e.g., 'Main Video', 'Stereo Audio')"
                value={editingFlow.role}
                onChange={(e) => setEditingFlow({ ...editingFlow, role: e.target.value })}
                required
              />
              
              <Text size="xs" c="dimmed">
                The role describes the purpose of this flow within the collection.
              </Text>
              
              <Group justify="flex-end">
                <Button variant="light" onClick={() => setShowEditFlowModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editingFlow) {
                      handleUpdateFlowRole(editingFlow.id, editingFlow.role);
                      setShowEditFlowModal(false);
                      setEditingFlow(null);
                    }
                  }}
                >
                  Update Role
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Collection"
        size="md"
      >
        <Stack gap="md">
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            <Text fw={500}>Warning: This action cannot be undone!</Text>
            <Text size="sm">
              Deleting this collection will remove all flow associations and may affect 
              other parts of the system that reference these flows.
            </Text>
          </Alert>
          
          <Text size="sm">
            <strong>Collection:</strong> {collection.label}<br />
            <strong>Flows:</strong> {collection.flow_collection.length} flows<br />
            <strong>Format:</strong> {collection.format}
          </Text>
          
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteCollection} loading={isLoading}>
              Delete Collection
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
