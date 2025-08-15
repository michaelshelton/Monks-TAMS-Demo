import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Text,
  Paper,
  Card,
  Group,
  Badge,
  Alert,
  Divider,
  Title,
  Stack,
  Button,
  TextInput,
  Select,
  MultiSelect,
  Textarea,
  ActionIcon,
  Tooltip,
  Switch,
  Modal,
  Table,
  ScrollArea,
  Loader,
  Progress,
  RingProgress,
  SimpleGrid,
  Container
} from '@mantine/core';
import { 
  IconWebhook, 
  IconCalendarEvent, 
  IconBell, 
  IconInfoCircle,
  IconPlus,
  IconEdit,
  IconTrash,
  IconTestPipe,
  IconHistory,
  IconChartBar,
  IconRefresh,
  IconCheck,
  IconX,
  IconActivity
} from '@tabler/icons-react';
import { WebhookManagerMantine } from '../components/WebhookManagerMantine';
import { EventHistoryMantine } from '../components/EventHistoryMantine';
import { NotificationCenterMantine } from '../components/NotificationCenterMantine';
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

export const Webhooks: React.FC = () => {
  const [tabValue, setTabValue] = useState('webhooks');
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
  const [formData, setFormData] = useState({
    url: '',
    events: [] as string[],
    api_key_name: '',
    description: '',
    active: true
  });

  // Fetch webhooks and event types on component mount
  useEffect(() => {
    fetchWebhooks();
    fetchEventTypes();
  }, []);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWebhooks();
      setWebhooks(response.data || []);
    } catch (err: any) {
      setError('Failed to fetch webhooks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventTypes = async () => {
    try {
      const response = await getWebhookEventTypes();
      setEventTypes(response || []);
    } catch (err: any) {
      console.error('Failed to fetch event types:', err);
    }
  };

  const handleCreateWebhook = async () => {
    try {
      setLoading(true);
      const webhookData: any = {
        url: formData.url,
        events: formData.events
      };
      
      if (formData.api_key_name) {
        webhookData.api_key_name = formData.api_key_name;
      }
      
      const response = await createWebhook(webhookData);
      
      setWebhooks(prev => [...prev, response]);
      setShowCreateModal(false);
      setFormData({ url: '', events: [], api_key_name: '', description: '', active: true });
    } catch (err: any) {
      setError('Failed to create webhook');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWebhook = async () => {
    if (!selectedWebhook?.id) return;
    
    try {
      setLoading(true);
      const webhookData: any = {
        url: formData.url,
        events: formData.events
      };
      
      if (formData.api_key_name) {
        webhookData.api_key_name = formData.api_key_name;
      }
      
      const response = await updateWebhook(selectedWebhook.id, webhookData);
      
      setWebhooks(prev => prev.map(w => w.id === selectedWebhook.id ? response : w));
      setShowEditModal(false);
      setSelectedWebhook(null);
    } catch (err: any) {
      setError('Failed to update webhook');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      setLoading(true);
      await deleteWebhook(webhookId);
      setWebhooks(prev => prev.filter(w => w.id !== webhookId));
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
      const response = await testWebhook(webhookId);
      console.log('Webhook test response:', response);
      // Show success notification
    } catch (err: any) {
      setError('Webhook test failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async (webhookId: string) => {
    try {
      setLoading(true);
      const response = await getWebhookHistory(webhookId);
      setWebhookHistory(response.data || []);
      setShowHistoryModal(true);
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
      const response = await getWebhookStats(webhookId);
      setWebhookStats(response);
      setShowStatsModal(true);
    } catch (err: any) {
      setError('Failed to fetch webhook stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWebhookUpdate = (webhook: any) => {
    setSelectedWebhook(webhook);
    setFormData({
      url: webhook.url,
      events: webhook.events,
      api_key_name: webhook.api_key_name || '',
      description: webhook.description || '',
      active: webhook.active !== false
    });
    setShowEditModal(true);
  };

  const handleWebhookDelete = (webhookId: string) => {
    handleDeleteWebhook(webhookId);
  };

  const handleEventSelect = (event: any) => {
    console.log('Event selected:', event);
    // TODO: Handle event selection
  };

  const handleNotificationAction = (notification: any, action: string) => {
    console.log('Notification action:', { notification, action });
    // TODO: Handle notification actions
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Page Header */}
        <Box>
          <Title order={1} mb="xs" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconWebhook size="1.2em" color="var(--mantine-color-blue-6)" />
            TAMS Event System
          </Title>
          <Text c="dimmed">
            Manage webhook configurations, monitor event history, and receive real-time notifications for TAMS events.
          </Text>
        </Box>

        {/* Info Box */}
        <Alert icon={<IconInfoCircle size={16} />} title="BBC TAMS Webhook System" color="blue">
          <Text size="sm" mb="xs">
            This page provides comprehensive webhook management for the TAMS platform, allowing you to:
          </Text>
          <Stack gap="xs" mt="xs">
            <Text size="sm">• <strong>Create and manage webhooks</strong> to receive real-time BBC TAMS events</Text>
            <Text size="sm">• <strong>Monitor delivery performance</strong> with success rates and response times</Text>
            <Text size="sm">• <strong>Track event history</strong> for debugging and compliance</Text>
            <Text size="sm">• <strong>Receive notifications</strong> about system events and webhook status</Text>
            <Text size="sm">• <strong>Test webhook endpoints</strong> to ensure proper configuration</Text>
          </Stack>
          <Text size="sm" mt="xs" c="dimmed">
            Webhooks follow BBC TAMS v6.0 specification and support events like flow creation, segment updates, and system notifications.
          </Text>
        </Alert>

        {/* Error Display */}
        {error && (
          <Alert icon={<IconX size={16} />} color="red" withCloseButton onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Main Content */}
        <Paper shadow="xs" p="md">
          <Tabs value={tabValue} onChange={(value) => setTabValue(value || 'webhooks')}>
            <Tabs.List>
              <Tabs.Tab value="webhooks" leftSection={<IconWebhook size="1rem" />}>
                Webhook Management
              </Tabs.Tab>
              <Tabs.Tab value="events" leftSection={<IconCalendarEvent size="1rem" />}>
                Event History
              </Tabs.Tab>
              <Tabs.Tab value="notifications" leftSection={<IconBell size="1rem" />}>
                Notifications
              </Tabs.Tab>
              <Tabs.Tab value="analytics" leftSection={<IconChartBar size="1rem" />}>
                Performance Analytics
              </Tabs.Tab>
            </Tabs.List>

            {/* Webhook Management Tab */}
            <Tabs.Panel value="webhooks" pt="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Title order={3}>Webhook Management</Title>
                  <Button 
                    leftSection={<IconPlus size={16} />} 
                    onClick={() => setShowCreateModal(true)}
                    loading={loading}
                  >
                    Create Webhook
                  </Button>
                </Group>

                {loading ? (
                  <Box ta="center" py="xl">
                    <Loader size="lg" />
                    <Text mt="md" c="dimmed">Loading webhooks...</Text>
                  </Box>
                ) : webhooks.length === 0 ? (
                  <Alert icon={<IconInfoCircle size={16} />} color="blue">
                    No webhooks configured. Create your first webhook to start receiving BBC TAMS events.
                  </Alert>
                ) : (
                  <ScrollArea>
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Name/URL</Table.Th>
                          <Table.Th>Events</Table.Th>
                          <Table.Th>Status</Table.Th>
                          <Table.Th>Created</Table.Th>
                          <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {webhooks.map((webhook) => (
                          <Table.Tr key={webhook.id || webhook.url}>
                            <Table.Td>
                              <Stack gap="xs">
                                <Text fw={500}>{webhook.name || 'Unnamed Webhook'}</Text>
                                <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>
                                  {webhook.url}
                                </Text>
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
                                <Tooltip label="Test Webhook">
                                  <ActionIcon 
                                    size="sm" 
                                    variant="light" 
                                    color="blue"
                                    onClick={() => handleTestWebhook(webhook.id || webhook.url)}
                                  >
                                    <IconTestPipe size={14} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="View History">
                                  <ActionIcon 
                                    size="sm" 
                                    variant="light" 
                                    color="green"
                                    onClick={() => handleViewHistory(webhook.id || webhook.url)}
                                  >
                                    <IconHistory size={14} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="View Stats">
                                  <ActionIcon 
                                    size="sm" 
                                    variant="light" 
                                    color="orange"
                                    onClick={() => handleViewStats(webhook.id || webhook.url)}
                                  >
                                    <IconChartBar size={14} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Edit Webhook">
                                  <ActionIcon 
                                    size="sm" 
                                    variant="light" 
                                    onClick={() => handleWebhookUpdate(webhook)}
                                  >
                                    <IconEdit size={14} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Delete Webhook">
                                  <ActionIcon 
                                    size="sm" 
                                    variant="light" 
                                    color="red"
                                    onClick={() => handleWebhookDelete(webhook.id || webhook.url)}
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
                  </ScrollArea>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Event History Tab */}
            <Tabs.Panel value="events" pt="md">
              <EventHistoryMantine />
            </Tabs.Panel>

            {/* Notifications Tab */}
            <Tabs.Panel value="notifications" pt="md">
              <NotificationCenterMantine />
            </Tabs.Panel>

            {/* Performance Analytics Tab */}
            <Tabs.Panel value="analytics" pt="md">
              <Stack gap="md">
                <Title order={3}>Webhook Performance Analytics</Title>
                
                {webhookStats && (
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
                    <Card withBorder p="md">
                      <Stack gap="xs">
                        <Group gap="xs">
                          <IconActivity size={20} color="#228be6" />
                          <Box>
                            <Text size="xs" c="dimmed">Total Deliveries</Text>
                            <Text fw={600}>{webhookStats.total_deliveries}</Text>
                          </Box>
                        </Group>
                      </Stack>
                    </Card>
                    
                    <Card withBorder p="md">
                      <Stack gap="xs">
                        <Group gap="xs">
                          <IconCheck size={20} color="#40c057" />
                          <Box>
                            <Text size="xs" c="dimmed">Success Rate</Text>
                            <Text fw={600}>{webhookStats.success_rate}%</Text>
                          </Box>
                        </Group>
                      </Stack>
                    </Card>
                    
                    <Card withBorder p="md">
                      <Stack gap="xs">
                        <Group gap="xs">
                          <IconChartBar size={20} color="#fd7e14" />
                          <Box>
                            <Text size="xs" c="dimmed">Avg Response Time</Text>
                            <Text fw={600}>{webhookStats.average_response_time}ms</Text>
                          </Box>
                        </Group>
                      </Stack>
                    </Card>
                    
                    <Card withBorder p="md">
                      <Stack gap="xs">
                        <Group gap="xs">
                          <IconHistory size={20} color="#7950f2" />
                          <Box>
                            <Text size="xs" c="dimmed">Last Delivery</Text>
                            <Text fw={600}>
                              {webhookStats.last_delivery ? 
                                new Date(webhookStats.last_delivery).toLocaleDateString() : 'N/A'}
                            </Text>
                          </Box>
                        </Group>
                      </Stack>
                    </Card>
                  </SimpleGrid>
                )}
                
                <Card withBorder p="md">
                  <Title order={4} mb="md">Delivery Success Rate</Title>
                  {webhookStats && (
                    <Box>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm">Success Rate</Text>
                        <Text size="sm" fw={500}>{webhookStats.success_rate}%</Text>
                      </Group>
                      <Progress 
                        value={webhookStats.success_rate} 
                        color={webhookStats.success_rate > 90 ? 'green' : webhookStats.success_rate > 70 ? 'yellow' : 'red'}
                        size="lg"
                      />
                      <Group justify="space-between" mt="xs">
                        <Text size="xs" c="dimmed">Successful: {webhookStats.successful_deliveries}</Text>
                        <Text size="xs" c="dimmed">Failed: {webhookStats.failed_deliveries}</Text>
                      </Group>
                    </Box>
                  )}
                </Card>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Paper>

        {/* Create Webhook Modal */}
        <Modal opened={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Webhook" size="lg">
          <Stack gap="md">
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
              <Button variant="light" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreateWebhook} loading={loading}>Create Webhook</Button>
            </Group>
          </Stack>
        </Modal>

        {/* Edit Webhook Modal */}
        <Modal opened={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Webhook" size="lg">
          <Stack gap="md">
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

        {/* Webhook History Modal */}
        <Modal opened={showHistoryModal} onClose={() => setShowHistoryModal(false)} title="Webhook Delivery History" size="xl">
          <ScrollArea h={400}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Event Type</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Response Time</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Details</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {webhookHistory.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>
                      <Badge variant="light" size="sm">
                        {item.event_type}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge 
                        color={item.success ? 'green' : 'red'} 
                        variant="light"
                      >
                        {item.response_status} {item.success ? 'Success' : 'Failed'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">N/A</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {new Date(item.created_at).toLocaleString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {item.error_message || 'No errors'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Modal>

        {/* Webhook Stats Modal */}
        <Modal opened={showStatsModal} onClose={() => setShowStatsModal(false)} title="Webhook Performance Statistics" size="md">
          {webhookStats && (
            <Stack gap="md">
              <SimpleGrid cols={2} spacing="lg">
                <Box ta="center">
                  <RingProgress
                    size={120}
                    thickness={12}
                    sections={[
                      { 
                        value: webhookStats.success_rate, 
                        color: webhookStats.success_rate > 90 ? 'green' : webhookStats.success_rate > 70 ? 'yellow' : 'red' 
                      }
                    ]}
                    label={
                      <Text ta="center" size="lg" fw={700}>
                        {webhookStats.success_rate}%
                      </Text>
                    }
                  />
                  <Text size="sm" c="dimmed" mt="md">Success Rate</Text>
                </Box>
                
                <Box ta="center">
                  <Text size="xl" fw={700} color="blue">
                    {webhookStats.total_deliveries}
                  </Text>
                  <Text size="sm" c="dimmed">Total Deliveries</Text>
                </Box>
              </SimpleGrid>
              
              <Divider />
              
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">Successful Deliveries:</Text>
                  <Text size="sm" fw={500}>{webhookStats.successful_deliveries}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Failed Deliveries:</Text>
                  <Text size="sm" fw={500}>{webhookStats.failed_deliveries}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Average Response Time:</Text>
                  <Text size="sm" fw={500}>{webhookStats.average_response_time}ms</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Last Delivery:</Text>
                  <Text size="sm" fw={500}>
                    {webhookStats.last_delivery ? 
                      new Date(webhookStats.last_delivery).toLocaleString() : 'N/A'}
                  </Text>
                </Group>
              </Stack>
            </Stack>
          )}
        </Modal>
      </Stack>
    </Container>
  );
};
