import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  Group,
  Button,
  Badge,
  Table,
  Modal,
  TextInput,
  Textarea,
  Alert,
  ActionIcon,
  Tooltip,
  Box,
  Divider,
  Select,
  MultiSelect,
  Loader,
  Center,
  Collapse
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconInfoCircle,
  IconAlertCircle,
  IconRefresh,
  IconDatabase,
  IconVideo,
  IconTag,
  IconCalendar,
  IconUsers,
  IconArrowLeft
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';

// Flow Collection interface
interface FlowCollection {
  id: string;
  label: string;
  description?: string;
  flow_ids: string[];
  created?: string;
  updated?: string;
  tags?: Record<string, any>;
}

// Flow interface for selection
interface Flow {
  id: string;
  label: string;
  description?: string;
  format?: string;
  source_id?: string;
}

export default function FlowCollections() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<FlowCollection[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<FlowCollection | null>(null);
  const [selectedFlows, setSelectedFlows] = useState<string[]>([]);
  const [showInfoBox, setShowInfoBox] = useState(true); // State for collapsible info box

  // Form state
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    tags: {} as Record<string, string>
  });

  // Load collections and flows
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load flows for selection
      const flowsResponse = await apiClient.getFlows({ limit: 1000 });
      setFlows(flowsResponse.data || []);

      // Load collections (mock data for now - will be replaced with real API)
      // TODO: Implement actual Flow Collections API endpoints
      const mockCollections: FlowCollection[] = [
        {
          id: 'collection-1',
          label: 'Sports Events',
          description: 'Collection of sports-related media flows',
          flow_ids: ['flow-1', 'flow-2', 'flow-3'],
          created: '2025-01-15T10:00:00Z',
          updated: '2025-01-15T10:00:00Z',
          tags: { category: 'sports', venue: 'stadium' }
        },
        {
          id: 'collection-2',
          label: 'News Segments',
          description: 'Breaking news and current events flows',
          flow_ids: ['flow-4', 'flow-5'],
          created: '2025-01-14T15:30:00Z',
          updated: '2025-01-14T15:30:00Z',
          tags: { category: 'news', priority: 'high' }
        },
        {
          id: 'collection-3',
          label: 'Documentary Series',
          description: 'Long-form documentary content flows',
          flow_ids: ['flow-6'],
          created: '2025-01-13T09:15:00Z',
          updated: '2025-01-13T09:15:00Z',
          tags: { category: 'documentary', duration: 'long-form' }
        }
      ];
      setCollections(mockCollections);

    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    try {
      // TODO: Implement actual API call
      const newCollection: FlowCollection = {
        id: `collection-${Date.now()}`,
        label: formData.label,
        description: formData.description,
        flow_ids: selectedFlows,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        tags: formData.tags
      };

      setCollections(prev => [...prev, newCollection]);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error('Failed to create collection:', err);
      setError(err instanceof Error ? err.message : 'Failed to create collection');
    }
  };

  const handleEditCollection = async () => {
    if (!editingCollection) return;

    try {
      // TODO: Implement actual API call
      const updatedCollection: FlowCollection = {
        ...editingCollection,
        label: formData.label,
        description: formData.description,
        flow_ids: selectedFlows,
        updated: new Date().toISOString(),
        tags: formData.tags
      };

      setCollections(prev => 
        prev.map(col => col.id === editingCollection.id ? updatedCollection : col)
      );
      setShowEditModal(false);
      setEditingCollection(null);
      resetForm();
    } catch (err) {
      console.error('Failed to update collection:', err);
      setError(err instanceof Error ? err.message : 'Failed to update collection');
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    try {
      // TODO: Implement actual API call
      setCollections(prev => prev.filter(col => col.id !== collectionId));
    } catch (err) {
      console.error('Failed to delete collection:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete collection');
    }
  };

  const resetForm = () => {
    setFormData({ label: '', description: '', tags: {} });
    setSelectedFlows([]);
  };

  const openEditModal = (collection: FlowCollection) => {
    setEditingCollection(collection);
    setFormData({
      label: collection.label,
      description: collection.description || '',
      tags: collection.tags || {}
    });
    setSelectedFlows(collection.flow_ids);
    setShowEditModal(true);
  };

  const getFlowLabel = (flowId: string) => {
    const flow = flows.find(f => f.id === flowId);
    return flow?.label || flowId;
  };

  const getFlowDescription = (flowId: string) => {
    const flow = flows.find(f => f.id === flowId);
    return flow?.description || 'No description';
  };

  if (loading) {
    return (
      <Container size="xl" px="xl" py="xl">
        <Center py="xl">
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text>Loading Flow Collections...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" px="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" mb="lg">
          <Box>
            <Title order={2} className="dark-text-primary">Flow Collections</Title>
            <Text c="dimmed" size="sm" mt="xs" className="dark-text-secondary">
              Organize and manage related media flows in logical groups
            </Text>
          </Box>
          <Group>
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={loadData}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setShowCreateModal(true)}
            >
              Create Collection
            </Button>
          </Group>
        </Group>

        {/* Error Alert */}
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            title="Error"
            withCloseButton
            onClose={() => setError(null)}
            mb="md"
          >
            {error}
          </Alert>
        )}

        {/* VAST TAMS Info - Toggleable */}
        {!error && (
          <Alert
            icon={<IconInfoCircle size={16} />}
            color="blue"
            title={
              <Group justify="space-between" w="100%">
                <Text>What are Flow Collections in TAMS?</Text>
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => setShowInfoBox(!showInfoBox)}
                  rightSection={showInfoBox ? <IconArrowLeft size={12} /> : <IconArrowLeft size={12} style={{ transform: 'rotate(-90deg)' }} />}
                >
                  {showInfoBox ? 'Hide' : 'Show'} Info
                </Button>
              </Group>
            }
            mb="md"
          >
            <Collapse in={showInfoBox}>
              <Stack gap="xs">
                <Text size="sm">
                  <strong>Flow Collections</strong> allow you to group related media flows together for better organization,
                  management, and monitoring. Collections help organize complex media workflows and enable bulk operations.
                </Text>
                <Text size="sm">
                  Each collection can contain multiple flows with shared metadata, tags, and management settings.
                  Collections are particularly useful for multi-essence workflows, event-based content, and series management.
                </Text>
                <Text size="sm">
                  <strong>Demo Note:</strong> This page demonstrates Flow Collections functionality,
                  showing how to organize and manage related media content efficiently. This page is showing mock data.
                </Text>
              </Stack>
            </Collapse>
          </Alert>
        )}

        {/* Collections Table */}
        <Card withBorder p="xl" radius="lg" shadow="sm">
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Collection</Table.Th>
                <Table.Th>Flows</Table.Th>
                <Table.Th>Tags</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {collections.map((collection) => (
                <Table.Tr key={collection.id}>
                  <Table.Td>
                    <Box>
                      <Text fw={500} size="sm">
                        {collection.label}
                      </Text>
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {collection.description || 'No description'}
                      </Text>
                    </Box>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Badge variant="light" color="blue" size="sm">
                        {collection.flow_ids.length} flows
                      </Badge>
                      {collection.flow_ids.slice(0, 2).map((flowId) => (
                        <Badge key={flowId} variant="light" color="gray" size="xs">
                          {getFlowLabel(flowId)}
                        </Badge>
                      ))}
                      {collection.flow_ids.length > 2 && (
                        <Badge variant="light" color="gray" size="xs">
                          +{collection.flow_ids.length - 2} more
                        </Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="wrap">
                      {collection.tags && Object.entries(collection.tags).slice(0, 2).map(([key, value]) => (
                        <Badge key={key} variant="light" color="green" size="xs">
                          {key}: {String(value)}
                        </Badge>
                      ))}
                      {collection.tags && Object.keys(collection.tags).length > 2 && (
                        <Badge variant="light" color="gray" size="xs">
                          +{Object.keys(collection.tags).length - 2} more
                        </Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {collection.created ? new Date(collection.created).toLocaleDateString() : 'Unknown'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="View Details">
                        <ActionIcon
                          size="sm"
                          variant="light"
                          onClick={() => navigate(`/flow-collections/${collection.id}`)}
                          color="blue"
                        >
                          <IconEye size={14} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit Collection">
                        <ActionIcon
                          size="sm"
                          variant="light"
                          onClick={() => openEditModal(collection)}
                          color="orange"
                        >
                          <IconEdit size={14} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete Collection">
                        <ActionIcon
                          size="sm"
                          variant="light"
                          onClick={() => handleDeleteCollection(collection.id)}
                          color="red"
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {collections.length === 0 && (
            <Center py="xl">
              <Stack align="center" gap="md">
                <IconDatabase size={48} color="var(--mantine-color-gray-4)" />
                <Text size="lg" c="dimmed">No collections found</Text>
                <Text size="sm" c="dimmed">
                  Create your first collection to organize related flows
                </Text>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Collection
                </Button>
              </Stack>
            </Center>
          )}
        </Card>

        {/* Create Collection Modal */}
        <Modal
          opened={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="Create Flow Collection"
          size="lg"
        >
          <Stack gap="md">
            <TextInput
              label="Collection Label"
              placeholder="Enter collection name"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              required
            />
            <Textarea
              label="Description"
              placeholder="Enter collection description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
            <MultiSelect
              label="Select Flows"
              placeholder="Choose flows to include in this collection"
              data={flows.map(flow => ({ value: flow.id, label: flow.label }))}
              value={selectedFlows}
              onChange={setSelectedFlows}
              searchable
              clearable
            />
            <Group justify="flex-end" gap="sm">
              <Button
                variant="light"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCollection}
                disabled={!formData.label.trim()}
              >
                Create Collection
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Edit Collection Modal */}
        <Modal
          opened={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingCollection(null);
            resetForm();
          }}
          title="Edit Flow Collection"
          size="lg"
        >
          <Stack gap="md">
            <TextInput
              label="Collection Label"
              placeholder="Enter collection name"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              required
            />
            <Textarea
              label="Description"
              placeholder="Enter collection description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
            <MultiSelect
              label="Select Flows"
              placeholder="Choose flows to include in this collection"
              data={flows.map(flow => ({ value: flow.id, label: flow.label }))}
              value={selectedFlows}
              onChange={setSelectedFlows}
              searchable
              clearable
            />
            <Group justify="flex-end" gap="sm">
              <Button
                variant="light"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCollection(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditCollection}
                disabled={!formData.label.trim()}
              >
                Update Collection
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
}
