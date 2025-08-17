import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Group,
  Button,
  Modal,
  TextInput,
  Stack,
  Divider,
  Alert,
  Loader,
  Box,
  Title,
  ActionIcon,
  Tooltip,
  Badge,
  Select,
  MultiSelect,
  Paper,
  Grid,
  ScrollArea
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconFolder,
  IconFolderOpen,
  IconLink,
  IconX,
  IconCheck,
  IconInfoCircle,
  IconHierarchy
} from '@tabler/icons-react';
import { getFlowCollection, setFlowCollection, removeFlowFromCollection, getFlows } from '../services/bbcTamsApi';

interface FlowCollectionManagerProps {
  flowId: string;
  initialCollection?: string[];
  availableFlows?: Array<{ id: string; label: string; description?: string }>;
  disabled?: boolean;
  onCollectionChange?: (collection: string[]) => void;
}

interface CollectionFlow {
  id: string;
  label: string;
  description?: string;
  isInCollection: boolean;
}

export function FlowCollectionManager({ 
  flowId, 
  initialCollection = [], 
  availableFlows = [],
  disabled = false,
  onCollectionChange 
}: FlowCollectionManagerProps) {
  const [collection, setCollection] = useState<string[]>(initialCollection);
  const [flows, setFlows] = useState<CollectionFlow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFlows, setSelectedFlows] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load initial data from API if not provided
  useEffect(() => {
    if (flowId) {
      loadInitialData();
    }
  }, [flowId]);

  // Update local state when props change
  useEffect(() => {
    setCollection(initialCollection);
  }, [initialCollection]);

  const loadInitialData = async () => {
    if (initialCollection.length === 0) {
      setLoading(true);
      try {
        const response = await getFlowCollection(flowId);
        if (response && response.collection_id) {
          setCollection([response.collection_id]);
        }
      } catch (err: any) {
        console.error('Error loading initial collection:', err);
        // Use props as fallback
      } finally {
        setLoading(false);
      }
    }
  };

  // Initialize flows data
  useEffect(() => {
    if (availableFlows.length > 0) {
      const collectionFlows = availableFlows.map(flow => ({
        ...flow,
        isInCollection: initialCollection.includes(flow.id)
      }));
      setFlows(collectionFlows);
    }
  }, [availableFlows, initialCollection]);

  // Load available flows if not provided
  useEffect(() => {
    if (availableFlows.length === 0) {
      loadAvailableFlows();
    }
  }, []);

  const loadAvailableFlows = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getFlows();
      const availableFlows = response.data.map((flow: any) => ({
        id: flow.id,
        label: flow.label || flow.id,
        description: flow.description,
        isInCollection: collection.includes(flow.id)
      }));
      setFlows(availableFlows);
    } catch (err: any) {
      setError('Failed to load available flows');
      console.error('Error loading flows:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCollection = async () => {
    if (selectedFlows.length === 0) return;
    
    setLoading(true);
    setError(null);
    try {
      // Update flow collection
      const newCollection = [...collection, ...selectedFlows];
      if (newCollection.length > 0) {
        await setFlowCollection(flowId, newCollection[0]!); // BBC TAMS supports single collection
      }
      
      setCollection(newCollection);
      
      // Update local flows state
      setFlows(prev => prev.map(flow => ({
        ...flow,
        isInCollection: newCollection.includes(flow.id)
      })));
      
      if (onCollectionChange) {
        onCollectionChange(newCollection);
      }
      
      setShowAddModal(false);
      setSelectedFlows([]);
    } catch (err: any) {
      setError('Failed to add flows to collection');
      console.error('Error adding flows to collection:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromCollection = async (flowIdToRemove: string) => {
    setLoading(true);
    setError(null);
    try {
      const newCollection = collection.filter(id => id !== flowIdToRemove);
      if (newCollection.length > 0) {
        await setFlowCollection(flowId, newCollection[0]!);
      } else {
        await removeFlowFromCollection(flowId);
      }
      
      setCollection(newCollection);
      
      // Update local flows state
      setFlows(prev => prev.map(flow => ({
        ...flow,
        isInCollection: newCollection.includes(flow.id)
      })));
      
      if (onCollectionChange) {
        onCollectionChange(newCollection);
      }
    } catch (err: any) {
      setError('Failed to remove flow from collection');
      console.error('Error removing flow from collection:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCollection = async () => {
    setLoading(true);
    setError(null);
    try {
      await removeFlowFromCollection(flowId);
      
      setCollection([]);
      
      // Update local flows state
      setFlows(prev => prev.map(flow => ({
        ...flow,
        isInCollection: false
      })));
      
      if (onCollectionChange) {
        onCollectionChange([]);
      }
    } catch (err: any) {
      setError('Failed to clear collection');
      console.error('Error clearing collection:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFlows = flows.filter(flow => 
    !collection.includes(flow.id) && 
    (flow.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (flow.description && flow.description.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const collectionFlows = flows.filter(flow => collection.includes(flow.id));

  return (
    <>
      <Card withBorder>
        <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between" align="flex-start">
            <Box>
              <Group gap="sm" align="center">
                <IconFolder size={20} color="#228be6" />
                <Title order={4}>Flow Collection</Title>
                <Badge variant="light" color="blue">
                  {collection.length} flow{collection.length !== 1 ? 's' : ''}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed" mt="xs">
                Group related flows together in collections for better organization and management.
              </Text>
            </Box>
            
            <Group gap="xs">
              <Button
                variant="light"
                size="sm"
                leftSection={<IconPlus size={14} />}
                onClick={() => setShowAddModal(true)}
                disabled={disabled}
              >
                Add Flows
              </Button>
              {collection.length > 0 && (
                <Button
                  variant="light"
                  color="red"
                  size="sm"
                  leftSection={<IconTrash size={14} />}
                  onClick={handleClearCollection}
                  disabled={disabled || loading}
                  loading={loading}
                >
                  Clear Collection
                </Button>
              )}
            </Group>
          </Group>

          <Divider />

          {/* Error Display */}
          {error && (
            <Alert icon={<IconX size={16} />} color="red" withCloseButton onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Collection Display */}
          {collection.length === 0 ? (
            <Alert icon={<IconFolder size={16} />} color="blue" variant="light">
              <Text size="sm">No flows in this collection. Click "Add Flows" to get started.</Text>
            </Alert>
          ) : (
            <Stack gap="md">
              <Text size="sm" fw={500} c="dimmed">Flows in Collection:</Text>
              {collectionFlows.map((flow) => (
                <Paper key={flow.id} withBorder p="md">
                  <Group justify="space-between" align="flex-start">
                    <Box style={{ flex: 1 }}>
                      <Group gap="sm" mb="xs">
                        <IconFolderOpen size={16} color="#40c057" />
                        <Text size="sm" fw={500}>
                          {flow.label}
                        </Text>
                        <Badge variant="outline" color="blue" size="xs">
                          {flow.id}
                        </Badge>
                      </Group>
                      {flow.description && (
                        <Text size="xs" c="dimmed">
                          {flow.description}
                        </Text>
                      )}
                    </Box>
                    
                    <ActionIcon
                      size="sm"
                      variant="light"
                      color="red"
                      onClick={() => handleRemoveFromCollection(flow.id)}
                      disabled={disabled || loading}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}

          {/* Refresh Button */}
          <Group justify="flex-end">
            <Button
              variant="subtle"
              size="sm"
              onClick={loadAvailableFlows}
              loading={loading}
              disabled={disabled}
            >
              Refresh Flows
            </Button>
          </Group>
        </Stack>
      </Card>

      {/* Add Flows Modal */}
      <Modal
        opened={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Flows to Collection"
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Select flows to add to this collection. Only flows not already in the collection are shown.
          </Text>
          
          <TextInput
            label="Search Flows"
            placeholder="Search by label or description..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            leftSection={<IconInfoCircle size={16} />}
          />
          
          <ScrollArea h={300}>
            <Stack gap="xs">
              {filteredFlows.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  {searchQuery ? 'No flows match your search.' : 'No available flows to add.'}
                </Text>
              ) : (
                filteredFlows.map((flow) => (
                  <Paper key={flow.id} withBorder p="sm">
                    <Group justify="space-between" align="flex-start">
                      <Box style={{ flex: 1 }}>
                        <Group gap="sm" mb="xs">
                          <IconFolder size={16} color="#228be6" />
                          <Text size="sm" fw={500}>
                            {flow.label}
                          </Text>
                          <Badge variant="outline" color="gray" size="xs">
                            {flow.id}
                          </Badge>
                        </Group>
                        {flow.description && (
                          <Text size="xs" c="dimmed">
                            {flow.description}
                          </Text>
                        )}
                      </Box>
                      
                      <ActionIcon
                        size="sm"
                        variant="light"
                        color="blue"
                        onClick={() => setSelectedFlows(prev => [...prev, flow.id])}
                        disabled={selectedFlows.includes(flow.id)}
                      >
                        <IconPlus size={14} />
                      </ActionIcon>
                    </Group>
                  </Paper>
                ))
              )}
            </Stack>
          </ScrollArea>
          
          {selectedFlows.length > 0 && (
            <Alert icon={<IconCheck size={16} />} color="blue" variant="light">
              <Text size="sm">
                {selectedFlows.length} flow{selectedFlows.length !== 1 ? 's' : ''} selected for addition.
              </Text>
            </Alert>
          )}
          
          <Group gap="xs" justify="flex-end">
            <Button variant="light" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddToCollection}
              loading={loading}
              disabled={selectedFlows.length === 0}
            >
              Add {selectedFlows.length > 0 ? `${selectedFlows.length} Flow${selectedFlows.length !== 1 ? 's' : ''}` : 'Flows'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
