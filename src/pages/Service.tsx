import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Badge,
  Group,
  Box,
  Button,
  ActionIcon,
  Tooltip,
  Progress,
  Divider,
  Alert,
  Table,
  ScrollArea,
  Grid,
  Paper,
  SimpleGrid,
  Tabs,
  List,
  ThemeIcon,
  Modal,
  TextInput,
  Select,
  Textarea,
  NumberInput,
  Switch,
  Code,
  CopyButton,
  Textarea as MantineTextarea
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconDownload,
  IconTrash,
  IconEdit,
  IconEye,
  IconClock,
  IconTag,
  IconVideo,
  IconMusic,
  IconPhoto,
  IconDatabase,
  IconPlus,
  IconFilter,
  IconSearch,
  IconTimeline,
  IconCalendar,
  IconInfoCircle,
  IconLink,
  IconExternalLink,
  IconCopy,
  IconShare,
  IconFolder,
  IconFile,
  IconDatabase as IconStorage,
  IconNetwork,
  IconServer,
  IconActivity,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconSettings,
  IconRefresh,
  IconArrowLeft,
  IconBroadcast,
  IconSignalE,
  IconPalette,
  IconCode,
  IconContainer,
  IconWebhook,
  IconTestPipe,
  IconKey,
  IconGlobe,
  IconShield,
  IconBell,
  IconPlug,
  IconDatabase as IconEventStream
} from '@tabler/icons-react';

// Mock data structure based on backend API models
interface ServiceInfo {
  name: string;
  description: string;
  type: string;
  api_version: string;
  service_version: string;
  media_store: {
    type: string;
  };
  event_stream_mechanisms: Array<{
    name: string;
    description: string;
  }>;
  status: 'healthy' | 'warning' | 'error';
  uptime: number;
  last_updated: string;
}

interface Webhook {
  id: string;
  url: string;
  api_key_name: string;
  api_key_value?: string;
  events: string[];
  status: 'active' | 'inactive' | 'error';
  last_triggered?: string;
  success_count: number;
  error_count: number;
  created: string;
}

// Mock data
const mockServiceInfo: ServiceInfo = {
  name: 'TAMS API',
  description: 'Time-addressable Media Store API',
  type: 'urn:x-tams:service:api',
  api_version: '6.0',
  service_version: '1.0.0',
  media_store: {
    type: 'http_object_store'
  },
  event_stream_mechanisms: [
    {
      name: 'webhooks',
      description: 'HTTP webhooks for event notifications'
    },
    {
      name: 'server-sent-events',
      description: 'Server-Sent Events for real-time updates'
    }
  ],
  status: 'healthy',
  uptime: 99.8,
  last_updated: '2024-01-15T10:30:00Z'
};

const mockWebhooks: Webhook[] = [
  {
    id: 'webhook_001',
    url: 'https://analytics.example.com/webhook',
    api_key_name: 'X-API-Key',
    api_key_value: 'sk_1234567890abcdef',
    events: ['flow.created', 'flow.updated', 'segment.created'],
    status: 'active',
    last_triggered: '2024-01-15T10:25:00Z',
    success_count: 156,
    error_count: 2,
    created: '2024-01-15T09:00:00Z'
  },
  {
    id: 'webhook_002',
    url: 'https://monitoring.example.com/events',
    api_key_name: 'Authorization',
    api_key_value: 'Bearer token_1234567890',
    events: ['flow.deleted', 'segment.deleted', 'error.occurred'],
    status: 'active',
    last_triggered: '2024-01-15T10:28:00Z',
    success_count: 89,
    error_count: 0,
    created: '2024-01-15T09:30:00Z'
  },
  {
    id: 'webhook_003',
    url: 'https://backup.example.com/webhook',
    api_key_name: 'X-Backup-Key',
    events: ['object.created', 'object.deleted'],
    status: 'error',
    last_triggered: '2024-01-15T10:20:00Z',
    success_count: 45,
    error_count: 12,
    created: '2024-01-15T10:00:00Z'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy':
    case 'active':
      return 'green';
    case 'warning':
      return 'yellow';
    case 'error':
    case 'inactive':
      return 'red';
    default:
      return 'gray';
  }
};

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const availableEvents = [
  'flow.created',
  'flow.updated',
  'flow.deleted',
  'segment.created',
  'segment.updated',
  'segment.deleted',
  'object.created',
  'object.deleted',
  'source.created',
  'source.updated',
  'source.deleted',
  'error.occurred',
  'system.warning',
  'system.maintenance'
];

export default function Service() {
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo>(mockServiceInfo);
  const [webhooks, setWebhooks] = useState<Webhook[]>(mockWebhooks);
  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false);
  const [showEditWebhookModal, setShowEditWebhookModal] = useState(false);
  const [showDeleteWebhookModal, setShowDeleteWebhookModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [showTestWebhookModal, setShowTestWebhookModal] = useState(false);

  const handleCreateWebhook = (webhook: Omit<Webhook, 'id' | 'created' | 'success_count' | 'error_count'>) => {
    const newWebhook: Webhook = {
      ...webhook,
      id: `webhook_${Date.now()}`,
      created: new Date().toISOString(),
      success_count: 0,
      error_count: 0
    };
    setWebhooks([...webhooks, newWebhook]);
    setShowCreateWebhookModal(false);
  };

  const handleUpdateWebhook = (updatedWebhook: Webhook) => {
    setWebhooks(webhooks.map(w => w.id === updatedWebhook.id ? updatedWebhook : w));
    setShowEditWebhookModal(false);
    setSelectedWebhook(null);
  };

  const handleDeleteWebhook = (webhookId: string) => {
    setWebhooks(webhooks.filter(w => w.id !== webhookId));
    setShowDeleteWebhookModal(false);
    setSelectedWebhook(null);
  };

  const handleTestWebhook = (webhookId: string) => {
    // Simulate webhook test
    setShowTestWebhookModal(false);
    setSelectedWebhook(null);
  };

  return (
    <Container size="xl" px="xl" py="xl">
      {/* Header */}
      <Box mb="xl">
        <Title order={2} mb="md">Service Configuration</Title>
        <Text size="lg" c="dimmed">
          Manage TAMS service settings, webhooks, and system configuration
        </Text>
      </Box>

      {/* Main Content */}
      <Tabs defaultValue="overview">
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconInfoCircle size={16} />}>
            Service Overview
          </Tabs.Tab>
          <Tabs.Tab value="webhooks" leftSection={<IconWebhook size={16} />}>
            Webhooks
          </Tabs.Tab>
          <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
            Settings
          </Tabs.Tab>
          <Tabs.Tab value="api" leftSection={<IconCode size={16} />}>
            API Documentation
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="xl">
          <Grid>
            <Grid.Col span={8}>
              <Stack gap="lg">
                {/* Service Information */}
                <Card withBorder p="xl">
                  <Title order={4} mb="md">Service Information</Title>
                  <Grid>
                    <Grid.Col span={6}>
                      <Stack gap="md">
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Service Name</Text>
                          <Text size="sm">{serviceInfo.name}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Description</Text>
                          <Text size="sm">{serviceInfo.description}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Type</Text>
                          <Text size="sm" style={{ fontFamily: 'monospace' }}>{serviceInfo.type}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">API Version</Text>
                          <Text size="sm">{serviceInfo.api_version}</Text>
                        </Box>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Stack gap="md">
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Service Version</Text>
                          <Text size="sm">{serviceInfo.service_version}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Status</Text>
                          <Badge color={getStatusColor(serviceInfo.status)} variant="light">
                            {serviceInfo.status}
                          </Badge>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Uptime</Text>
                          <Text size="sm">{serviceInfo.uptime}%</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Last Updated</Text>
                          <Text size="sm">{formatTimestamp(serviceInfo.last_updated)}</Text>
                        </Box>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Card>

                {/* Media Store Configuration */}
                <Card withBorder p="xl">
                  <Title order={4} mb="md">Media Store Configuration</Title>
                  <Grid>
                    <Grid.Col span={6}>
                      <Stack gap="md">
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Store Type</Text>
                          <Text size="sm">{serviceInfo.media_store.type}</Text>
                        </Box>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Card>

                {/* Event Stream Mechanisms */}
                <Card withBorder p="xl">
                  <Title order={4} mb="md">Event Stream Mechanisms</Title>
                  <List>
                    {serviceInfo.event_stream_mechanisms.map((mechanism, index) => (
                      <List.Item
                        key={index}
                        icon={
                          <ThemeIcon color="blue" size="sm">
                            <IconEventStream size={16} />
                          </ThemeIcon>
                        }
                      >
                        <Stack gap="xs">
                          <Text size="sm" fw={500}>{mechanism.name}</Text>
                          <Text size="xs" c="dimmed">{mechanism.description}</Text>
                        </Stack>
                      </List.Item>
                    ))}
                  </List>
                </Card>
              </Stack>
            </Grid.Col>

            <Grid.Col span={4}>
              <Stack gap="lg">
                {/* Service Status */}
                <Card withBorder p="xl">
                  <Title order={4} mb="md">Service Status</Title>
                  <Stack gap="md">
                    <Box>
                      <Text size="sm" fw={500} mb="xs">Overall Health</Text>
                      <Progress
                        value={serviceInfo.uptime}
                        color={serviceInfo.status === 'healthy' ? 'green' : 
                               serviceInfo.status === 'warning' ? 'yellow' : 'red'}
                        size="lg"
                      />
                      <Text size="sm" c="dimmed" mt="xs">
                        {serviceInfo.uptime}% uptime
                      </Text>
                    </Box>
                    <Box>
                      <Text size="sm" fw={500} mb="xs">Status</Text>
                      <Badge color={getStatusColor(serviceInfo.status)} variant="light" size="lg">
                        {serviceInfo.status}
                      </Badge>
                    </Box>
                  </Stack>
                </Card>

                {/* Quick Stats */}
                <Card withBorder p="xl">
                  <Title order={4} mb="md">Quick Stats</Title>
                  <Stack gap="md">
                    <Box>
                      <Group gap="xs" mb={4}>
                        <IconWebhook size={20} color="#228be6" />
                        <Text size="sm" fw={500} c="dimmed">Active Webhooks</Text>
                      </Group>
                      <Text size="lg" fw={600}>
                        {webhooks.filter(w => w.status === 'active').length}
                      </Text>
                    </Box>
                    <Box>
                      <Group gap="xs" mb={4}>
                        <IconActivity size={20} color="#40c057" />
                        <Text size="sm" fw={500} c="dimmed">Total Events</Text>
                      </Group>
                      <Text size="lg" fw={600}>
                        {webhooks.reduce((total, w) => total + w.success_count + w.error_count, 0)}
                      </Text>
                    </Box>
                    <Box>
                      <Group gap="xs" mb={4}>
                        <IconAlertCircle size={20} color="#fd7e14" />
                        <Text size="sm" fw={500} c="dimmed">Error Rate</Text>
                      </Group>
                      <Text size="lg" fw={600}>
                        {(() => {
                          const total = webhooks.reduce((sum, w) => sum + w.success_count + w.error_count, 0);
                          const errors = webhooks.reduce((sum, w) => sum + w.error_count, 0);
                          return total > 0 ? `${((errors / total) * 100).toFixed(1)}%` : '0%';
                        })()}
                      </Text>
                    </Box>
                  </Stack>
                </Card>
              </Stack>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="webhooks" pt="xl">
          <Card withBorder p="xl">
            <Group justify="space-between" mb="md">
              <Title order={4}>Webhook Management</Title>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setShowCreateWebhookModal(true)}
              >
                Create Webhook
              </Button>
            </Group>
            
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>URL</Table.Th>
                  <Table.Th>Events</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Success/Error</Table.Th>
                  <Table.Th>Last Triggered</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {webhooks.map((webhook) => (
                  <Table.Tr key={webhook.id}>
                    <Table.Td>
                      <Text size="sm" style={{ fontFamily: 'monospace' }} lineClamp={1}>
                        {webhook.url}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" wrap="wrap">
                        {webhook.events.slice(0, 2).map((event) => (
                          <Badge key={event} color="blue" variant="light" size="xs">
                            {event}
                          </Badge>
                        ))}
                        {webhook.events.length > 2 && (
                          <Text size="xs" c="dimmed">
                            +{webhook.events.length - 2} more
                          </Text>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(webhook.status)} variant="light" size="sm">
                        {webhook.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {webhook.success_count}/{webhook.error_count}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {webhook.last_triggered ? (
                        <Text size="sm">{formatTimestamp(webhook.last_triggered)}</Text>
                      ) : (
                        <Text size="sm" c="dimmed">Never</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          size="sm"
                          variant="light"
                          onClick={() => {
                            setSelectedWebhook(webhook);
                            setShowTestWebhookModal(true);
                          }}
                        >
                          <IconTestPipe size={14} />
                        </ActionIcon>
                        <ActionIcon
                          size="sm"
                          variant="light"
                          onClick={() => {
                            setSelectedWebhook(webhook);
                            setShowEditWebhookModal(true);
                          }}
                        >
                          <IconEdit size={14} />
                        </ActionIcon>
                        <ActionIcon
                          size="sm"
                          variant="light"
                          color="red"
                          onClick={() => {
                            setSelectedWebhook(webhook);
                            setShowDeleteWebhookModal(true);
                          }}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="settings" pt="xl">
          <Grid>
            <Grid.Col span={6}>
              <Card withBorder p="xl">
                <Title order={4} mb="md">General Settings</Title>
                <Stack gap="md">
                  <TextInput
                    label="Service Name"
                    value={serviceInfo.name}
                    onChange={() => {}}
                  />
                  <Textarea
                    label="Description"
                    value={serviceInfo.description}
                    onChange={() => {}}
                    rows={3}
                  />
                  <Select
                    label="Service Status"
                    value={serviceInfo.status}
                    onChange={() => {}}
                    data={[
                      { value: 'healthy', label: 'Healthy' },
                      { value: 'warning', label: 'Warning' },
                      { value: 'error', label: 'Error' }
                    ]}
                  />
                  <Switch
                    label="Enable Debug Mode"
                    checked={false}
                    onChange={() => {}}
                  />
                  <Switch
                    label="Enable Event Logging"
                    checked={true}
                    onChange={() => {}}
                  />
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={6}>
              <Card withBorder p="xl">
                <Title order={4} mb="md">Security Settings</Title>
                <Stack gap="md">
                  <TextInput
                    label="API Key Header"
                    value="X-API-Key"
                    onChange={() => {}}
                  />
                  <TextInput
                    label="Rate Limit (requests/min)"
                    value="1000"
                    onChange={() => {}}
                  />
                  <Switch
                    label="Require HTTPS"
                    checked={true}
                    onChange={() => {}}
                  />
                  <Switch
                    label="Enable CORS"
                    checked={true}
                    onChange={() => {}}
                  />
                  <Switch
                    label="Enable Request Logging"
                    checked={true}
                    onChange={() => {}}
                  />
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="api" pt="xl">
          <Card withBorder p="xl">
            <Title order={4} mb="md">API Documentation</Title>
            <Stack gap="md">
              <Box>
                <Text size="sm" fw={500} mb="xs">OpenAPI Specification</Text>
                <Group gap="xs">
                  <Button
                    variant="light"
                    leftSection={<IconExternalLink size={16} />}
                    onClick={() => window.open('/docs', '_blank')}
                  >
                    View Swagger UI
                  </Button>
                  <Button
                    variant="light"
                    leftSection={<IconDownload size={16} />}
                    onClick={() => window.open('/openapi.json', '_blank')}
                  >
                    Download OpenAPI JSON
                  </Button>
                </Group>
              </Box>
              
              <Box>
                <Text size="sm" fw={500} mb="xs">API Base URL</Text>
                <Group gap="xs">
                  <Text size="sm" style={{ fontFamily: 'monospace' }}>
                    http://localhost:8000
                  </Text>
                  <CopyButton value="http://localhost:8000">
                    {({ copied, copy }) => (
                      <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
                        {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                      </ActionIcon>
                    )}
                  </CopyButton>
                </Group>
              </Box>
              
              <Box>
                <Text size="sm" fw={500} mb="xs">API Version</Text>
                <Text size="sm">{serviceInfo.api_version}</Text>
              </Box>
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Create Webhook Modal */}
      <Modal
        opened={showCreateWebhookModal}
        onClose={() => setShowCreateWebhookModal(false)}
        title="Create Webhook"
        size="lg"
      >
        <CreateWebhookForm
          onSubmit={handleCreateWebhook}
          onCancel={() => setShowCreateWebhookModal(false)}
        />
      </Modal>

      {/* Edit Webhook Modal */}
      {selectedWebhook && (
        <Modal
          opened={showEditWebhookModal}
          onClose={() => setShowEditWebhookModal(false)}
          title="Edit Webhook"
          size="lg"
        >
          <EditWebhookForm
            webhook={selectedWebhook}
            onSubmit={handleUpdateWebhook}
            onCancel={() => setShowEditWebhookModal(false)}
          />
        </Modal>
      )}

      {/* Delete Webhook Modal */}
      {selectedWebhook && (
        <Modal
          opened={showDeleteWebhookModal}
          onClose={() => setShowDeleteWebhookModal(false)}
          title="Delete Webhook"
          size="md"
        >
          <Stack gap="md">
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              Are you sure you want to delete this webhook? This action cannot be undone.
            </Alert>
            <Text size="sm">
              <strong>URL:</strong> {selectedWebhook.url}<br />
              <strong>Events:</strong> {selectedWebhook.events.join(', ')}<br />
              <strong>Status:</strong> {selectedWebhook.status}
            </Text>
            <Group gap="xs" justify="flex-end">
              <Button variant="light" onClick={() => setShowDeleteWebhookModal(false)}>
                Cancel
              </Button>
              <Button color="red" onClick={() => handleDeleteWebhook(selectedWebhook.id)}>
                Delete Webhook
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}

      {/* Test Webhook Modal */}
      {selectedWebhook && (
        <Modal
          opened={showTestWebhookModal}
          onClose={() => setShowTestWebhookModal(false)}
          title="Test Webhook"
          size="md"
        >
          <Stack gap="md">
            <Text size="sm">
              Send a test event to <strong>{selectedWebhook.url}</strong>
            </Text>
            <Select
              label="Test Event Type"
              placeholder="Select an event type"
              data={selectedWebhook.events.map(event => ({ value: event, label: event }))}
            />
            <Group gap="xs" justify="flex-end">
              <Button variant="light" onClick={() => setShowTestWebhookModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleTestWebhook(selectedWebhook.id)}>
                Send Test Event
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}
    </Container>
  );
}

// Form Components
interface CreateWebhookFormProps {
  onSubmit: (webhook: Omit<Webhook, 'id' | 'created' | 'success_count' | 'error_count'>) => void;
  onCancel: () => void;
}

function CreateWebhookForm({ onSubmit, onCancel }: CreateWebhookFormProps) {
  const [formData, setFormData] = useState({
    url: '',
    api_key_name: 'X-API-Key',
    api_key_value: '',
    events: [] as string[],
    status: 'active' as 'active' | 'inactive'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label="Webhook URL"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.currentTarget.value })}
          placeholder="https://example.com/webhook"
          required
        />
        <TextInput
          label="API Key Name"
          value={formData.api_key_name}
          onChange={(e) => setFormData({ ...formData, api_key_name: e.currentTarget.value })}
          placeholder="X-API-Key"
        />
        <TextInput
          label="API Key Value"
          value={formData.api_key_value}
          onChange={(e) => setFormData({ ...formData, api_key_value: e.currentTarget.value })}
          placeholder="your-api-key"
        />
        <Select
          label="Events"
          placeholder="Select events"
          data={availableEvents.map(event => ({ value: event, label: event }))}
          value={formData.events[0] || null}
          onChange={(value) => setFormData({ ...formData, events: value ? [value] : [] })}
        />
        <Select
          label="Status"
          value={formData.status}
          onChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}
          data={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ]}
        />
        <Group gap="xs" justify="flex-end">
          <Button variant="light" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Create Webhook
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

interface EditWebhookFormProps {
  webhook: Webhook;
  onSubmit: (webhook: Webhook) => void;
  onCancel: () => void;
}

function EditWebhookForm({ webhook, onSubmit, onCancel }: EditWebhookFormProps) {
  const [formData, setFormData] = useState({
    ...webhook
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label="Webhook URL"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.currentTarget.value })}
          required
        />
        <TextInput
          label="API Key Name"
          value={formData.api_key_name}
          onChange={(e) => setFormData({ ...formData, api_key_name: e.currentTarget.value })}
        />
        <TextInput
          label="API Key Value"
          value={formData.api_key_value || ''}
          onChange={(e) => setFormData({ ...formData, api_key_value: e.currentTarget.value })}
        />
        <Select
          label="Status"
          value={formData.status || null}
          onChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' | 'error' })}
          data={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'error', label: 'Error' }
          ]}
        />
        <Group gap="xs" justify="flex-end">
          <Button variant="light" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Update Webhook
          </Button>
        </Group>
      </Stack>
    </form>
  );
} 