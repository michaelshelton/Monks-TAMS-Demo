import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Text,
  Group,
  Badge,
  Stack,
  TextInput,
  Select,
  MultiSelect,
  NumberInput,
  Modal,
  ActionIcon,
  Tooltip,
  Alert,
  Divider,
  Title,
  Code
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconTestPipe, IconWebhook, IconInfoCircle } from '@tabler/icons-react';

// BBC TAMS Event Types as per specification
const BBC_EVENT_TYPES = {
  'flows': [
    'flows/created',
    'flows/updated', 
    'flows/deleted',
    'flows/segments_added',
    'flows/segments_deleted',
    'flows/storage_allocated',
    'flows/storage_released'
  ],
  'sources': [
    'sources/created',
    'sources/updated',
    'sources/deleted',
    'sources/uploaded',
    'sources/processed'
  ],
  'segments': [
    'segments/created',
    'segments/updated',
    'segments/deleted',
    'segments/processed'
  ],
  'collections': [
    'collections/created',
    'collections/updated',
    'collections/deleted',
    'collections/flows_added',
    'collections/flows_removed'
  ]
};

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  enabled: boolean;
  retry_count: number;
  timeout_seconds: number;
  created_at: string;
  last_triggered?: string;
  last_status?: 'success' | 'failed' | 'pending';
  last_error?: string;
}

interface WebhookManagerMantineProps {
  onWebhookUpdate?: (webhook: WebhookConfig) => void;
  onWebhookDelete?: (webhookId: string) => void;
}

export const WebhookManagerMantine: React.FC<WebhookManagerMantineProps> = ({
  onWebhookUpdate,
  onWebhookDelete
}) => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: '',
    retry_count: 3,
    timeout_seconds: 30
  });

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      // Mock data for demo
      const mockWebhooks: WebhookConfig[] = [
        {
          id: '1',
          name: 'Production Alerts',
          url: 'https://api.production.com/webhooks/tams',
          events: ['flows/created', 'flows/deleted'],
          secret: 'prod_secret_123',
          enabled: true,
          retry_count: 3,
          timeout_seconds: 30,
          created_at: '2025-01-20T10:00:00Z',
          last_triggered: '2025-01-25T14:30:00Z',
          last_status: 'success'
        },
        {
          id: '2',
          name: 'Development Notifications',
          url: 'https://dev.example.com/webhook',
          events: ['sources/uploaded', 'segments/processed'],
          enabled: false,
          retry_count: 2,
          timeout_seconds: 15,
          created_at: '2025-01-22T09:00:00Z',
          last_status: 'failed',
          last_error: 'Connection timeout'
        }
      ];
      setWebhooks(mockWebhooks);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingWebhook) {
        // Update existing webhook
        const updatedWebhook: WebhookConfig = {
          ...editingWebhook,
          ...formData
        };
        
        setWebhooks(prev => prev.map(w => w.id === editingWebhook.id ? updatedWebhook : w));
        onWebhookUpdate?.(updatedWebhook);
      } else {
        // Create new webhook
        const newWebhook: WebhookConfig = {
          id: Date.now().toString(),
          ...formData,
          enabled: true,
          created_at: new Date().toISOString(),
          last_status: 'pending'
        };
        
        setWebhooks(prev => [...prev, newWebhook]);
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save webhook:', error);
    }
  };

  const handleDelete = async (webhookId: string) => {
    try {
      setWebhooks(prev => prev.filter(w => w.id !== webhookId));
      onWebhookDelete?.(webhookId);
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  const handleEdit = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      secret: webhook.secret || '',
      retry_count: webhook.retry_count,
      timeout_seconds: webhook.timeout_seconds
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingWebhook(null);
    setFormData({
      name: '',
      url: '',
      events: [],
      secret: '',
      retry_count: 3,
      timeout_seconds: 30
    });
  };

  const handleTestWebhook = async (webhook: WebhookConfig) => {
    try {
      console.log(`Testing webhook: ${webhook.name}`);
      // TODO: Implement actual test
    } catch (error) {
      console.error('Failed to test webhook:', error);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'green';
      case 'failed': return 'red';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <Box>
      {/* Webhook List */}
      <Stack gap="md">
        {webhooks.length === 0 ? (
          <Card withBorder p="xl" ta="center">
            <IconWebhook size={48} style={{ margin: '0 auto 16px', color: 'var(--mantine-color-gray-5)' }} />
            <Title order={4} c="dimmed" mb="xs">No webhooks configured</Title>
            <Text size="sm" c="dimmed">
              Create your first webhook to receive real-time BBC TAMS event notifications
            </Text>
          </Card>
        ) : (
          webhooks.map((webhook, index) => (
            <Card key={webhook.id} withBorder>
              <Group justify="space-between" align="flex-start">
                <Box style={{ flex: 1 }}>
                  <Group gap="xs" mb="xs">
                    <Title order={5}>{webhook.name}</Title>
                    <Badge color={webhook.enabled ? 'green' : 'gray'} variant="light">
                      {webhook.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge color={getStatusColor(webhook.last_status)} variant="light">
                      {getStatusIcon(webhook.last_status)}
                    </Badge>
                  </Group>
                  
                  <Text size="sm" c="dimmed" mb="xs">
                    {webhook.url}
                  </Text>
                  
                  <Group gap="xs" mb="xs">
                    {webhook.events.map(event => (
                      <Badge key={event} variant="outline" size="sm">
                        {event}
                      </Badge>
                    ))}
                  </Group>
                  
                  <Text size="xs" c="dimmed">
                    Created: {new Date(webhook.created_at).toLocaleDateString()}
                    {webhook.last_triggered && ` • Last triggered: ${new Date(webhook.last_triggered).toLocaleDateString()}`}
                  </Text>
                </Box>
                
                <Group gap="xs">
                  <Tooltip label="Test webhook">
                    <ActionIcon 
                      onClick={() => handleTestWebhook(webhook)}
                      color="blue"
                      variant="light"
                    >
                      <IconTestPipe size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Edit webhook">
                    <ActionIcon 
                      onClick={() => handleEdit(webhook)}
                      color="blue"
                      variant="light"
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Delete webhook">
                    <ActionIcon 
                      onClick={() => handleDelete(webhook.id)}
                      color="red"
                      variant="light"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Card>
          ))
        )}
      </Stack>

      {/* Add Webhook Button */}
      <Button
        leftSection={<IconPlus size={16} />}
        onClick={() => setModalOpen(true)}
        mt="md"
        fullWidth
      >
        Add Webhook
      </Button>

      {/* Add/Edit Webhook Modal */}
      <Modal 
        opened={modalOpen} 
        onClose={handleCloseModal}
        title={editingWebhook ? 'Edit Webhook' : 'Add New Webhook'}
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Webhook Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Production Alerts"
            required
          />
          
          <TextInput
            label="Webhook URL"
            value={formData.url}
            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
            placeholder="https://your-domain.com/webhook"
            required
            description="HTTPS endpoint to receive BBC TAMS events"
          />

          <MultiSelect
            label="Event Types"
            value={formData.events}
            onChange={(value) => setFormData(prev => ({ ...prev, events: value }))}
            data={Object.values(BBC_EVENT_TYPES).flat()}
            placeholder="Select event types to subscribe to"
            searchable
            required
          />

          <TextInput
            label="Secret Key (Optional)"
            value={formData.secret}
            onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
            placeholder="Webhook secret for security"
            description="Used to verify webhook authenticity"
          />

          <Group grow>
            <NumberInput
              label="Retry Count"
              value={formData.retry_count}
                              onChange={(value) => setFormData(prev => ({ ...prev, retry_count: typeof value === 'string' ? parseInt(value) || 0 : value || 0 }))}
              min={0}
              max={10}
              description="Number of retry attempts on failure"
            />

            <NumberInput
              label="Timeout (seconds)"
              value={formData.timeout_seconds}
                              onChange={(value) => setFormData(prev => ({ ...prev, timeout_seconds: typeof value === 'string' ? parseInt(value) || 30 : value || 30 }))}
              min={5}
              max={300}
              description="Request timeout in seconds"
            />
          </Group>

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={handleCloseModal}>Cancel</Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.name || !formData.url || formData.events.length === 0}
            >
              {editingWebhook ? 'Update' : 'Create'} Webhook
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* BBC TAMS Event Types Reference */}
      <Card withBorder mt="lg">
        <Group mb="md">
          <IconInfoCircle size={20} />
          <Title order={5}>BBC TAMS Event Types</Title>
        </Group>
        
        <Stack gap="sm">
          {Object.entries(BBC_EVENT_TYPES).map(([category, events]) => (
            <Box key={category}>
              <Text fw={500} size="sm" mb="xs" tt="capitalize">
                {category}
              </Text>
              <Group gap="xs" wrap="wrap">
                {events.map(event => (
                  <Badge key={event} variant="outline" size="xs">
                    {event}
                  </Badge>
                ))}
              </Group>
            </Box>
          ))}
        </Stack>
      </Card>
    </Box>
  );
};
