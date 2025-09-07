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
  IconPlus,
  IconRefresh,
  IconCheck,
  IconX,
  IconEdit,
  IconTrash,
  IconAlertCircle
} from '@tabler/icons-react';

import { apiClient, BBCApiOptions, BBCApiResponse, BBCPaginationMeta } from '../services/api';
import BBCPagination from '../components/BBCPagination';

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookData | null>(null);
  
  // BBC TAMS API state
  const [bbcPagination, setBbcPagination] = useState<BBCPaginationMeta>({});
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    url: '',
    events: [] as string[],
    api_key_name: '',
    description: '',
    active: true
  });

  // Fetch webhooks on component mount
  useEffect(() => {
    fetchWebhooksVastTams();
    // Set default event types since the backend doesn't provide them
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

  // Fetch webhooks using VAST TAMS API
  const fetchWebhooksVastTams = async (cursor?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const options: BBCApiOptions = {
        limit: 10
      };
      
      if (cursor) {
        options.page = cursor;
      }

      console.log('Fetching webhooks from VAST TAMS API with options:', options);
      const response = await apiClient.getWebhooks(options);
      console.log('VAST TAMS API response:', response);
      
      setWebhooks(response.data);
      setBbcPagination(response.pagination);
      setCurrentCursor(cursor || null);
      setError(null);
    } catch (err: any) {
      console.error('VAST TAMS API error:', err);
      
      // Set appropriate error message based on error type
      if (err?.message?.includes('500') || err?.message?.includes('Internal Server Error')) {
        setError('VAST TAMS backend temporarily unavailable - please try again later');
      } else if (err?.message?.includes('Network') || err?.message?.includes('fetch') || err?.message?.includes('CORS')) {
        setError('Network connection issue - please check your connection and try again');
      } else if (err?.message?.includes('404')) {
        setError('VAST TAMS API endpoint not found - please check backend configuration');
      } else {
        setError(`VAST TAMS API error: ${err?.message || 'Unknown error'}`);
      }
      
      // Clear webhooks on error
      setWebhooks([]);
      setBbcPagination({});
      setCurrentCursor(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle VAST TAMS pagination
  const handleVastTamsPageChange = (cursor: string | null) => {
    if (cursor) {
      fetchWebhooksVastTams(cursor);
    }
  };



  const handleCreateWebhook = async () => {
    try {
      setLoading(true);
      const webhookData: any = {
        url: formData.url,
        events: formData.events
      };
      
      if (formData.api_key_name && formData.api_key_name.trim()) {
        webhookData.api_key_name = formData.api_key_name.trim();
      }
      
      const response = await apiClient.createWebhook(webhookData);
      
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
    if (!selectedWebhook?.id) {
      setError('No webhook selected for update');
      return;
    }
    
    try {
      setLoading(true);
      const webhookData: any = {
        url: formData.url,
        events: formData.events
      };
      
      if (formData.api_key_name && formData.api_key_name.trim()) {
        webhookData.api_key_name = formData.api_key_name.trim();
      }
      
      const response = await apiClient.updateWebhook(selectedWebhook.id, webhookData);
      
      setWebhooks(prev => prev.map(w => w.id === selectedWebhook.id ? response : w));
      setShowEditModal(false);
      setSelectedWebhook(null);
    } catch (err: any) {
      setError(`Failed to update webhook: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      setLoading(true);
      await apiClient.deleteWebhook(webhookId);
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
                fetchWebhooksVastTams();
                setError(null);
              }}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setShowCreateModal(true)}
            >
              Add Webhook
            </Button>
          </Group>
        </Group>

        {/* Error Alert */}
        {error && (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            color="red" 
            title="VAST TAMS Connection Error"
            withCloseButton
            onClose={() => setError(null)}
            mb="md"
          >
            {error}
          </Alert>
        )}

        {/* VAST TAMS Info */}
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
              <strong>Demo Note:</strong> This page shows live data from the TAMS backend powered by VAST, demonstrating real-time 
              webhook management and event notification capabilities.
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
                      {webhooks.length === 0 
                        ? "No webhooks available from VAST TAMS backend" 
                        : "No webhooks found"
                      }
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
          
          {/* VAST TAMS Pagination */}
          {bbcPagination && Object.keys(bbcPagination).length > 0 ? (
            <Group justify="center" mt="lg">
              <BBCPagination
                paginationMeta={bbcPagination}
                onPageChange={handleVastTamsPageChange}
                onLimitChange={(limit) => {
                  // Handle limit change for VAST TAMS API
                  fetchWebhooksVastTams();
                }}
                showBBCMetadata={true}
                showLimitSelector={true}
              />
            </Group>
          ) : (
            /* No pagination when no data */
            webhooks.length === 0 && !loading && (
              <Group justify="center" mt="lg">
                <Text c="dimmed">No webhooks available</Text>
              </Group>
            )
          )}
        </Card>

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

      </Stack>
    </Container>
  );
};
