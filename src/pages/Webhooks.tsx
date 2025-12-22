import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Text,
  Paper,
  Group,
  Badge,
  Alert,
  Title,
  Stack,
  Button,
  TextInput,
  MultiSelect,
  Textarea,
  Switch,
  Modal,
  Table,
  ScrollArea,
  Loader,
  Container,
  ActionIcon,
  Tooltip,
  Card
} from '@mantine/core';
import { 
  IconWebhook, 
  IconInfoCircle,
  IconRefresh,
  IconCheck,
  IconX,
  IconEdit,
  IconTrash,
  IconAlertCircle
} from '@tabler/icons-react';

// Note: Webhooks are not yet implemented in the backend API, so this page uses dummy data for demonstration

interface WebhookData {
  id?: string;
  url: string;
  events: string[];
  api_key_name?: string;
  api_key_value?: string;
  owner_id?: string;
  created_by?: string;
  created?: string;
  name?: string;
  description?: string;
  active?: boolean;
}



export const Webhooks: React.FC = () => {
  const [tabValue, setTabValue] = useState('webhooks');
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookData | null>(null);
  
  // Dummy webhook data for demonstration
  const DUMMY_WEBHOOKS: WebhookData[] = [
    {
      id: 'webhook-001',
      name: 'Production Monitoring',
      url: 'https://monitoring.example.com/webhooks/tams',
      events: ['flow.created', 'flow.updated', 'error.occurred'],
      api_key_name: 'X-API-Key',
      description: 'Monitors production flows and errors for alerting',
      active: true,
      created: '2024-01-15T10:30:00Z',
      created_by: 'admin@example.com'
    },
    {
      id: 'webhook-002',
      name: 'Source Lifecycle Tracker',
      url: 'https://analytics.example.com/api/webhooks/sources',
      events: ['source.created', 'source.updated', 'source.deleted'],
      api_key_name: 'Authorization',
      description: 'Tracks source lifecycle events for analytics dashboard',
      active: true,
      created: '2024-01-14T14:20:00Z',
      created_by: 'analytics@example.com'
    },
    {
      id: 'webhook-003',
      name: 'System Health Notifications',
      url: 'https://slack.example.com/hooks/tams-health',
      events: ['system.warning', 'system.maintenance', 'error.occurred'],
      description: 'Sends system health notifications to Slack channel',
      active: true,
      created: '2024-01-13T09:15:00Z',
      created_by: 'ops@example.com'
    },
    {
      id: 'webhook-004',
      name: 'Flow Archive Service',
      url: 'https://archive.example.com/webhooks/flows',
      events: ['flow.deleted', 'object.deleted'],
      api_key_name: 'X-Auth-Token',
      description: 'Archives flows and objects when they are deleted',
      active: false,
      created: '2024-01-12T16:45:00Z',
      created_by: 'archive@example.com'
    },
    {
      id: 'webhook-005',
      name: 'Content Delivery Network',
      url: 'https://cdn.example.com/webhooks/tams-updates',
      events: ['flow.created', 'flow.updated', 'object.created'],
      description: 'Syncs new and updated content to CDN for distribution',
      active: true,
      created: '2024-01-11T11:00:00Z',
      created_by: 'cdn@example.com'
    }
  ];

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    api_key_name: '',
    description: '',
    active: true
  });

  // Fetch webhooks on component mount - using dummy data
  useEffect(() => {
    fetchWebhooks();
    // Set default event types
    setEventTypes([
      'flow.created',
      'flow.updated', 
      'flow.deleted',
      'source.created',
      'source.updated',
      'source.deleted',
      'object.created',
      'object.deleted',
      'error.occurred',
      'system.warning',
      'system.maintenance'
    ]);
  }, []);

  // Fetch webhooks using dummy data (simulating API delay)
  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Load from localStorage if available, otherwise use dummy data
      const savedWebhooks = localStorage.getItem('tams_webhooks');
      if (savedWebhooks) {
        setWebhooks(JSON.parse(savedWebhooks));
      } else {
        setWebhooks(DUMMY_WEBHOOKS);
        localStorage.setItem('tams_webhooks', JSON.stringify(DUMMY_WEBHOOKS));
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error loading webhooks:', err);
      setError('Failed to load webhooks');
      setWebhooks(DUMMY_WEBHOOKS);
    } finally {
      setLoading(false);
    }
  };



  const handleUpdateWebhook = async () => {
    if (!selectedWebhook?.id) {
      setError('No webhook selected for update');
      return;
    }
    
    try {
      setLoading(true);
      
      // Validate form
      if (!formData.url || formData.events.length === 0) {
        setError('URL and at least one event are required');
        return;
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update webhook
      const updatedWebhook: WebhookData = {
        ...selectedWebhook,
        name: formData.name || formData.description || selectedWebhook.name || 'Unnamed Webhook',
        url: formData.url,
        events: formData.events,
        ...(formData.api_key_name && { api_key_name: formData.api_key_name }),
        ...(formData.description && { description: formData.description }),
        active: formData.active
      };
      
      const updatedWebhooks = webhooks.map(w => w.id === selectedWebhook.id ? updatedWebhook : w);
      setWebhooks(updatedWebhooks);
      localStorage.setItem('tams_webhooks', JSON.stringify(updatedWebhooks));
      
      setShowEditModal(false);
      setSelectedWebhook(null);
      setError(null);
    } catch (err: any) {
      setError(`Failed to update webhook: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Filter out the webhook by matching either id or url
      // Note: This is temporary - webhooks will reappear on page refresh
      const updatedWebhooks = webhooks.filter(w => {
        // Keep webhooks that don't match by id or url
        return w.id !== webhookId && w.url !== webhookId;
      });
      
      // Only update state, don't persist to localStorage
      // This allows webhooks to reappear on page refresh
      setWebhooks(updatedWebhooks);
      setError(null);
    } catch (err: any) {
      setError('Failed to delete webhook');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      setLoading(true);
      setError('Webhook testing is not supported by the current backend implementation');
    } catch (err: any) {
      setError('Webhook test failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWebhookEdit = (webhook: WebhookData) => {
    setSelectedWebhook(webhook);
    setFormData({
      name: webhook.name || '',
      url: webhook.url,
      events: webhook.events,
      api_key_name: webhook.api_key_name || '',
      description: webhook.description || '',
      active: webhook.active !== false
    });
    setShowEditModal(true);
  };

  const handleViewHistory = async (webhookId: string) => {
    try {
      setLoading(true);
      setError('Webhook history is not supported by the current backend implementation');
    } catch (err: any) {
      setError('Failed to fetch webhook history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStats = async (webhookId: string) => {
    try {
      setLoading(true);
      setError('Webhook statistics are not supported by the current backend implementation');
    } catch (err: any) {
      setError('Failed to fetch webhook stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Page Header */}
        <Group justify="space-between" mb="lg">
          <Box>
            <Title order={2} className="dark-text-primary">Webhook Management</Title>
            <Text c="dimmed" size="sm" mt="xs" className="dark-text-secondary">
              Event-driven notifications for real-time TAMS system integration
            </Text>
          </Box>
          <Group>
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={() => {
                fetchWebhooks();
                setError(null);
              }}
              loading={loading}
            >
              Refresh
            </Button>
          </Group>
        </Group>

        {/* Error Alert */}
        {error && (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            color="red" 
            title="TAMS Connection Error"
            withCloseButton
            onClose={() => setError(null)}
            mb="md"
          >
            {error}
          </Alert>
        )}

        {/* Webhook Info */}
        {!error && (
          <Alert 
            icon={<IconInfoCircle size={16} />} 
            color="blue" 
            title="What are Webhooks in TAMS?"
            mb="md"
          >
            <Text size="sm" mb="xs">
              <strong>Webhooks</strong> are event-driven notifications that allow external systems to receive 
              real-time updates when specific events occur in the TAMS system - like when sources are created, 
              flows are updated, or errors occur.
            </Text>
            <Text size="sm" mb="xs">
              Each webhook can subscribe to multiple event types and includes authentication via API keys. 
              Webhooks enable integration with external monitoring, logging, and automation systems.
            </Text>
            <Text size="sm">
              <strong>Demo Note:</strong> This page uses demonstration data to showcase webhook functionality. 
            </Text>
          </Alert>
        )}

        {/* Webhooks Table */}
        <Card withBorder>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Webhook Information</Table.Th>
                <Table.Th>Events</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Created Date</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={5} ta="center">
                    <Loader />
                  </Table.Td>
                </Table.Tr>
              ) : error ? (
                <Table.Tr>
                  <Table.Td colSpan={5} ta="center" c="red">
                    {error}
                  </Table.Td>
                </Table.Tr>
              ) : webhooks.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5} ta="center">
                    <Text c="dimmed">
                      No webhooks configured. Click "Add Webhook" to create one.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                webhooks.map((webhook) => (
                  <Table.Tr key={webhook.id || webhook.url}>
                    <Table.Td>
                      <Stack gap="xs">
                        <Text fw={500}>{webhook.name || 'Unnamed Webhook'}</Text>
                        <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>
                          {webhook.url}
                        </Text>
                        {webhook.api_key_name && (
                          <Badge size="xs" variant="light" color="blue">
                            API Key: {webhook.api_key_name}
                          </Badge>
                        )}
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" wrap="wrap">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="light" size="sm">
                            {event}
                          </Badge>
                        ))}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge 
                        color={webhook.active !== false ? 'green' : 'gray'} 
                        variant="light"
                      >
                        {webhook.active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {webhook.created ? new Date(webhook.created).toLocaleDateString() : 'N/A'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Tooltip label="Edit Webhook">
                          <ActionIcon 
                            size="sm" 
                            variant="light" 
                            onClick={() => handleWebhookEdit(webhook)}
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete Webhook">
                          <ActionIcon 
                            size="sm" 
                            variant="light" 
                            color="red"
                            onClick={() => handleDeleteWebhook(webhook.id || webhook.url)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
          
          {/* Webhook count info */}
          {webhooks.length > 0 && !loading && (
            <Group justify="center" mt="lg">
              <Text size="sm" c="dimmed">
                Showing {webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''}
              </Text>
            </Group>
          )}
        </Card>

        {/* Edit Webhook Modal */}
        <Modal opened={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Webhook" size="lg">
          <Stack gap="md">
            <TextInput
              label="Webhook Name"
              placeholder="Production Monitoring"
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
              placeholder="my-api-key"
              value={formData.api_key_name}
              onChange={(e) => setFormData(prev => ({ ...prev, api_key_name: e.target.value }))}
            />
            
            <Textarea
              label="Description (Optional)"
              placeholder="Describe the purpose of this webhook"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
            
            <Switch
              label="Active"
              checked={formData.active}
              onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
            />
            
            <Group justify="flex-end" gap="xs">
              <Button variant="light" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button onClick={handleUpdateWebhook} loading={loading}>Update Webhook</Button>
            </Group>
          </Stack>
        </Modal>

      </Stack>
    </Container>
  );
};
