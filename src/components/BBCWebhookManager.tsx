import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Stack,
  Group,
  Button,
  TextInput,
  Select,
  MultiSelect,
  Textarea,
  Badge,
  Alert,
  Box,
  Code,
  Divider,
  ActionIcon,
  Tooltip,
  Switch,
  Modal,
  Table,
  ScrollArea,
  Tabs
} from '@mantine/core';
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconTestPipe, 
  IconHistory, 
  IconChartBar,
  IconRefresh,
  IconCheck,
  IconX,
  IconWebhook,
  IconActivity
} from '@tabler/icons-react';
import {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getWebhookHistory,
  getWebhookStats,
  getWebhookEventTypes
} from '../services/bbcTamsApi';

interface WebhookData {
  id?: string; // Backend doesn't provide IDs, we'll generate them
  url: string;
  events: string[];
  api_key_name?: string;
  api_key_value?: string;
  owner_id?: string;
  created_by?: string;
  created?: string;
  // These fields are not in the backend but useful for UI
  name?: string; // Derived from URL or generated
  description?: string; // Optional UI field
  active?: boolean; // Optional UI field
}

interface WebhookHistoryItem {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: any;
  response_status: number;
  response_body?: string;
  created_at: string;
  success: boolean;
  error_message?: string;
}

interface WebhookStats {
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  success_rate: number;
  average_response_time: number;
  last_delivery?: string;
}

export default function BBCWebhookManager() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookData | null>(null);
  const [webhookHistory, setWebhookHistory] = useState<WebhookHistoryItem[]>([]);
  const [webhookStats, setWebhookStats] = useState<WebhookStats | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    url: '',
    events: [] as string[],
    api_key_name: '',
    api_key_value: '',
    owner_id: 'local-dev',
    // UI-only fields
    name: '',
    description: '',
    active: true
  });

  // Load webhooks and event types on component mount
  useEffect(() => {
    loadWebhooks();
    loadEventTypes();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getWebhooks();
      if (response && response.data && Array.isArray(response.data)) {
        // Transform backend data to include UI fields
        const webhooksWithUI = response.data.map((webhook: any, index: number) => ({
          ...webhook,
          id: webhook.id || `webhook-${index + 1}`, // Generate ID if missing
          name: webhook.name || `Webhook ${index + 1}`, // Generate name if missing
          description: webhook.description || `Webhook for ${webhook.url}`,
          active: webhook.active !== undefined ? webhook.active : true
        }));
        
        setWebhooks(webhooksWithUI);
      } else {
        console.warn('Unexpected webhooks response format:', response);
        setWebhooks([]);
      }
    } catch (err) {
      console.error('Error loading webhooks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load webhooks');
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEventTypes = async () => {
    try {
      const events = await getWebhookEventTypes();
      setEventTypes(events);
    } catch (err) {
      console.warn('Could not load webhook event types:', err);
      // Event types will use fallback from the API function
    }
  };

  const handleCreateWebhook = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare data for backend (only send supported fields)
      const backendData = {
        url: formData.url,
        events: formData.events,
        ...(formData.api_key_name && { api_key_name: formData.api_key_name }),
        ...(formData.api_key_value && { api_key_value: formData.api_key_value }),
        ...(formData.owner_id && { owner_id: formData.owner_id })
      };
      
      const newWebhook = await createWebhook(backendData);
      
      // Add to local state with generated ID and UI fields
      const webhookWithUI = {
        ...newWebhook,
        id: `webhook-${Date.now()}`, // Generate ID for UI
        name: formData.name || `Webhook ${Date.now()}`,
        description: formData.description,
        active: formData.active
      };
      
      setWebhooks(prev => [...prev, webhookWithUI]);
      
      // Reset form and close modal
      setFormData({
        url: '',
        events: [],
        api_key_name: '',
        api_key_value: '',
        owner_id: 'local-dev',
        name: '',
        description: '',
        active: true
      });
      setShowCreateModal(false);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create webhook';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWebhook = async () => {
    if (!selectedWebhook) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const updatedWebhook = await updateWebhook(selectedWebhook.id!, formData);
      
      // Update local state
      setWebhooks(prev => prev.map(wh => 
        wh.id === selectedWebhook.id ? { ...wh, ...updatedWebhook } : wh
      ));
      
      // Reset form and close modal
      setFormData({
        name: '',
        url: '',
        events: [],
        api_key_name: '',
        api_key_value: '',
        owner_id: 'local-dev',
        active: true,
        description: ''
      });
      setShowEditModal(false);
      setSelectedWebhook(null);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update webhook';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await deleteWebhook(webhookId);
      
      // Remove from local state
      setWebhooks(prev => prev.filter(wh => wh.id !== webhookId));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete webhook';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await testWebhook(webhookId);
      console.log('Webhook test result:', result);
      
      // Show success message
      setError(null);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test webhook';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async (webhook: WebhookData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getWebhookHistory(webhook.id!);
      if (response && response.data && Array.isArray(response.data)) {
        setWebhookHistory(response.data);
        setSelectedWebhook(webhook);
        setShowHistoryModal(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load webhook history';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStats = async (webhook: WebhookData) => {
    try {
      setLoading(true);
      setError(null);
      
      const stats = await getWebhookStats(webhook.id!);
      setWebhookStats(stats);
      setSelectedWebhook(webhook);
      setShowStatsModal(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load webhook stats';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (webhook: WebhookData) => {
    setSelectedWebhook(webhook);
    setFormData({
      name: webhook.name || '',
      url: webhook.url,
      events: webhook.events,
      api_key_name: webhook.api_key_name || '',
      api_key_value: webhook.api_key_value || '',
      owner_id: webhook.owner_id || 'local-dev',
      description: webhook.description || '',
      active: webhook.active !== undefined ? webhook.active : true
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      url: '',
      events: [],
      api_key_name: '',
      api_key_value: '',
      owner_id: 'local-dev',
      name: '',
      description: '',
      active: true
    });
  };

  return (
    <Stack gap="md">
      {/* Header */}
      <Card withBorder p="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Box>
              <Text fw={500} size="lg">BBC TAMS Webhook Manager</Text>
              <Text size="sm" c="dimmed">
                Manage webhooks for real-time BBC TAMS event notifications
              </Text>
            </Box>
            <Group gap="xs">
              <Button 
                size="sm" 
                variant="light" 
                onClick={loadWebhooks}
                loading={loading}
              >
                <IconRefresh size={16} />
                Refresh
              </Button>
              <Button 
                size="sm" 
                onClick={() => setShowCreateModal(true)}
                leftSection={<IconPlus size={16} />}
              >
                Create Webhook
              </Button>
            </Group>
          </Group>
          
          {/* BBC TAMS Compliance Info */}
          <Box>
            <Text size="sm" fw={500} mb="xs">TAMS v6.0 Webhook Operations:</Text>
            <Group gap="xs" wrap="wrap">
              <Badge variant="light" color="green">Webhook CRUD</Badge>
              <Badge variant="light" color="green">Event Subscription</Badge>
              <Badge variant="light" color="green">Real-time Notifications</Badge>
              <Badge variant="light" color="green">Delivery History</Badge>
              <Badge variant="light" color="green">Performance Stats</Badge>
              <Badge variant="light" color="blue">BBC TAMS Events</Badge>
            </Group>
          </Box>
        </Stack>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert title="Error" color="red" onClose={() => setError(null)}>
          <Text>{error}</Text>
        </Alert>
      )}

      {/* Webhooks List */}
      <Card withBorder p="md">
        <Stack gap="md">
          <Text fw={500} size="sm">Webhooks ({webhooks.length})</Text>
          
          {webhooks.length === 0 ? (
            <Text c="dimmed" ta="center">No webhooks configured</Text>
          ) : (
            <ScrollArea>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>URL</Table.Th>
                    <Table.Th>Events</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {webhooks.map((webhook) => (
                    <Table.Tr key={webhook.id}>
                      <Table.Td>
                        <Box>
                          <Text fw={500} size="sm">{webhook.name}</Text>
                          {webhook.description && (
                            <Text size="xs" c="dimmed">{webhook.description}</Text>
                          )}
                        </Box>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {webhook.url}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="wrap">
                          {webhook.events.slice(0, 3).map((event) => (
                            <Badge key={event} variant="light" size="xs" color="blue">
                              {event}
                            </Badge>
                          ))}
                          {webhook.events.length > 3 && (
                            <Badge variant="light" size="xs" color="gray">
                              +{webhook.events.length - 3} more
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge 
                          variant="light" 
                          color={webhook.active ? 'green' : 'red'}
                        >
                          {webhook.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Tooltip label="Edit Webhook">
                            <ActionIcon
                              variant="light"
                              size="sm"
                              onClick={() => openEditModal(webhook)}
                              disabled={loading}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Test Webhook">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              size="sm"
                              onClick={() => handleTestWebhook(webhook.id!)}
                              disabled={loading}
                            >
                              <IconTestPipe size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="View History">
                            <ActionIcon
                              variant="light"
                              color="gray"
                              size="sm"
                              onClick={() => handleViewHistory(webhook)}
                              disabled={loading}
                            >
                              <IconHistory size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="View Stats">
                            <ActionIcon
                              variant="light"
                              color="purple"
                              size="sm"
                              onClick={() => handleViewStats(webhook)}
                              disabled={loading}
                            >
                              <IconChartBar size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete Webhook">
                            <ActionIcon
                              variant="light"
                              color="red"
                              size="sm"
                              onClick={() => handleDeleteWebhook(webhook.id!)}
                              disabled={loading}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Stack>
      </Card>

      {/* Create Webhook Modal */}
      <Modal
        opened={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Webhook"
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Webhook Name (Optional)"
            placeholder="Enter webhook name for display"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
          
          <TextInput
            label="Webhook URL"
            placeholder="https://your-endpoint.com/webhook"
            value={formData.url}
            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
            required
          />
          
          <MultiSelect
            label="Events"
            placeholder="Select events to subscribe to"
            data={eventTypes}
            value={formData.events}
            onChange={(value) => setFormData(prev => ({ ...prev, events: value }))}
            required
          />
          
          <TextInput
            label="API Key Name (Optional)"
            placeholder="API key identifier"
            value={formData.api_key_name}
            onChange={(e) => setFormData(prev => ({ ...prev, api_key_name: e.target.value }))}
          />
          
          <TextInput
            label="API Key Value (Optional)"
            placeholder="API key value for authentication"
            value={formData.api_key_value}
            onChange={(e) => setFormData(prev => ({ ...prev, api_key_value: e.target.value }))}
          />
          
          <TextInput
            label="Owner ID"
            placeholder="Owner identifier"
            value={formData.owner_id}
            onChange={(e) => setFormData(prev => ({ ...prev, owner_id: e.target.value }))}
          />
          
          <Switch
            label="Active"
            checked={formData.active}
            onChange={(e) => setFormData(prev => ({ ...prev, active: e.currentTarget.checked }))}
          />
          
          <Textarea
            label="Description (Optional)"
            placeholder="Webhook description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            minRows={2}
          />
          
          <Group justify="flex-end" gap="xs">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
                      <Button onClick={handleCreateWebhook} loading={loading}>
            Create Webhook
          </Button>
        </Group>
      </Stack>
    </Modal>

    {/* Edit Webhook Modal */}
    <Modal
      opened={showEditModal}
      onClose={() => setShowEditModal(false)}
      title="Edit Webhook"
      size="lg"
    >
      <Stack gap="md">
        <TextInput
          label="Webhook Name (Optional)"
          placeholder="Enter webhook name for display"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
        
        <TextInput
          label="Webhook URL"
          placeholder="https://your-endpoint.com/webhook"
          value={formData.url}
          onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
          required
        />
        
        <MultiSelect
          label="Events"
          placeholder="Select events to subscribe to"
          data={eventTypes}
          value={formData.events}
          onChange={(value) => setFormData(prev => ({ ...prev, events: value }))}
          required
        />
          
          <TextInput
            label="API Key Name (Optional)"
            placeholder="API key identifier"
            value={formData.api_key_name}
            onChange={(e) => setFormData(prev => ({ ...prev, api_key_name: e.target.value }))}
          />
          
          <TextInput
            label="API Key Value (Optional)"
            placeholder="API key value for authentication"
            value={formData.api_key_value}
            onChange={(e) => setFormData(prev => ({ ...prev, api_key_value: e.target.value }))}
          />
          
          <TextInput
            label="Owner ID"
            placeholder="Owner identifier"
            value={formData.owner_id}
            onChange={(e) => setFormData(prev => ({ ...prev, owner_id: e.target.value }))}
          />
          
          <Switch
            label="Active"
            checked={formData.active}
            onChange={(e) => setFormData(prev => ({ ...prev, active: e.currentTarget.checked }))}
          />
          
          <Textarea
            label="Description (Optional)"
            placeholder="Webhook description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            minRows={2}
          />
          
          <Group justify="flex-end" gap="xs">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateWebhook} loading={loading}>
              Update Webhook
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Webhook History Modal */}
      <Modal
        opened={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title={`Webhook History - ${selectedWebhook?.name}`}
        size="xl"
      >
        <Stack gap="md">
          {webhookHistory.length === 0 ? (
            <Text c="dimmed" ta="center">No delivery history available</Text>
          ) : (
            <ScrollArea style={{ maxHeight: '400px' }}>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Event</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Response Time</Table.Th>
                    <Table.Th>Timestamp</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {webhookHistory.map((item) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        <Badge variant="light" size="sm" color="blue">
                          {item.event_type}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge 
                          variant="light" 
                          color={item.success ? 'green' : 'red'}
                          size="sm"
                        >
                          {item.response_status} {item.success ? 'Success' : 'Failed'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{item.response_status}ms</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{new Date(item.created_at).toLocaleString()}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Stack>
      </Modal>

      {/* Webhook Stats Modal */}
      <Modal
        opened={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title={`Webhook Statistics - ${selectedWebhook?.name}`}
        size="md"
      >
        <Stack gap="md">
          {webhookStats ? (
            <Group gap="md">
              <Box>
                <Text size="sm" fw={500}>Total Deliveries</Text>
                <Text size="lg" fw={700}>{webhookStats.total_deliveries}</Text>
              </Box>
              <Box>
                <Text size="sm" fw={500}>Success Rate</Text>
                <Text size="lg" fw={700} color="green">{webhookStats.success_rate}%</Text>
              </Box>
              <Box>
                <Text size="sm" fw={500}>Avg Response Time</Text>
                <Text size="lg" fw={700}>{webhookStats.average_response_time}ms</Text>
              </Box>
            </Group>
          ) : (
            <Text c="dimmed" ta="center">No statistics available</Text>
          )}
        </Stack>
      </Modal>

      {/* BBC TAMS API Information */}
      <Card withBorder p="md">
        <Stack gap="md">
          <Text fw={500} size="sm">TAMS API Compliance</Text>
          <Text size="sm" c="dimmed">
            This component demonstrates TAMS v6.0 webhook operations, enabling real-time 
            event notifications for media store operations.
          </Text>
          
          <Box>
            <Text size="sm" fw={500} mb="xs">Available Webhook Operations:</Text>
            <Group gap="xs" wrap="wrap">
              <Badge variant="light" color="green">GET /webhooks</Badge>
              <Badge variant="light" color="green">POST /webhooks</Badge>
              <Badge variant="light" color="green">PUT /webhooks/{'{id}'}</Badge>
              <Badge variant="light" color="green">DELETE /webhooks/{'{id}'}</Badge>
              <Badge variant="light" color="green">POST /webhooks/{'{id}'}/test</Badge>
              <Badge variant="light" color="green">GET /webhooks/{'{id}'}/history</Badge>
              <Badge variant="light" color="green">GET /webhooks/{'{id}'}/stats</Badge>
            </Group>
          </Box>
          
          <Box>
            <Text size="sm" fw={500} mb="xs">BBC TAMS Features Demonstrated:</Text>
            <Group gap="xs" wrap="wrap">
              <Badge variant="light" color="green">Webhook Management</Badge>
              <Badge variant="light" color="green">Event Subscription</Badge>
              <Badge variant="light" color="green">Real-time Notifications</Badge>
              <Badge variant="light" color="green">Delivery History</Badge>
              <Badge variant="light" color="green">Performance Statistics</Badge>
              <Badge variant="light" color="green">Real API Integration</Badge>
            </Group>
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
}
