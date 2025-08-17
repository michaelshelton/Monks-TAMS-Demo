import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Text,
  Group,
  Badge,
  Stack,
  TextInput,
  Select,
  Button,
  ActionIcon,
  Tooltip,
  Table,
  Pagination,
  Title,
  Alert
} from '@mantine/core';
import { IconSearch, IconFilter, IconDownload, IconRefresh, IconInfoCircle } from '@tabler/icons-react';

// BBC TAMS Event Types and Categories
const BBC_EVENT_CATEGORIES = {
  'flows': {
    icon: '🎬',
    color: 'blue',
    events: ['flows/created', 'flows/updated', 'flows/deleted', 'flows/segments_added', 'flows/segments_deleted', 'flows/storage_allocated', 'flows/storage_released']
  },
  'sources': {
    icon: '📁',
    color: 'grape',
    events: ['sources/created', 'sources/updated', 'sources/deleted', 'sources/uploaded', 'sources/processed']
  },
  'segments': {
    icon: '⏱️',
    color: 'cyan',
    events: ['segments/created', 'segments/updated', 'segments/deleted', 'segments/processed']
  },
  'collections': {
    icon: '📦',
    color: 'green',
    events: ['collections/created', 'collections/updated', 'collections/deleted', 'collections/flows_added', 'collections/flows_removed']
  },
  'system': {
    icon: '⚙️',
    color: 'orange',
    events: ['system/health_check', 'system/backup_completed', 'system/maintenance_started', 'system/maintenance_completed']
  }
};

interface WebhookEvent {
  id: string;
  event_type: string;
  entity_id: string;
  entity_type: string;
  timestamp: string;
  webhook_id: string;
  webhook_name: string;
  status: 'success' | 'failed' | 'pending' | 'retrying';
  retry_count: number;
  max_retries: number;
  response_code?: number;
  response_time_ms?: number;
  error_message?: string;
  payload: {
    before?: any;
    after?: any;
    changes?: string[];
    metadata?: any;
  };
}

interface EventHistoryMantineProps {
  onEventSelect?: (event: WebhookEvent) => void;
  refreshInterval?: number; // in seconds
}

export const EventHistoryMantine: React.FC<EventHistoryMantineProps> = ({
  onEventSelect,
      refreshInterval = 7200 // Refresh every 2 hours instead of every minute
}) => {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    eventType: '',
    entityType: '',
    status: '',
    dateRange: '24h' as '1h' | '24h' | '7d' | '30d' | 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(10);

  useEffect(() => {
    loadEvents();
    
    // Auto-refresh every refreshInterval seconds
    const interval = setInterval(loadEvents, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    applyFilters();
  }, [events, filters, searchTerm]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Mock data for demo
      const mockEvents: WebhookEvent[] = [
        {
          id: '1',
          event_type: 'flows/created',
          entity_id: 'flow_001',
          entity_type: 'flow',
          timestamp: '2025-01-25T15:30:00Z',
          webhook_id: 'webhook_001',
          webhook_name: 'Production Alerts',
          status: 'success',
          retry_count: 0,
          max_retries: 3,
          response_code: 200,
          response_time_ms: 150,
          payload: {
            after: { id: 'flow_001', label: 'New Production Flow', type: 'video' },
            changes: ['created'],
            metadata: { user: 'admin', source: 'api' }
          }
        },
        {
          id: '2',
          event_type: 'sources/uploaded',
          entity_id: 'source_002',
          entity_type: 'source',
          timestamp: '2025-01-25T15:25:00Z',
          webhook_id: 'webhook_002',
          webhook_name: 'Development Notifications',
          status: 'failed',
          retry_count: 2,
          max_retries: 3,
          response_code: 500,
          response_time_ms: 5000,
          error_message: 'Internal server error',
          payload: {
            after: { id: 'source_002', filename: 'video.mp4', size: 1048576 },
            changes: ['uploaded'],
            metadata: { user: 'developer', source: 'web' }
          }
        },
        {
          id: '3',
          event_type: 'segments/processed',
          entity_id: 'segment_003',
          entity_type: 'segment',
          timestamp: '2025-01-25T15:20:00Z',
          webhook_id: 'webhook_001',
          webhook_name: 'Production Alerts',
          status: 'pending',
          retry_count: 0,
          max_retries: 3,
          payload: {
            after: { id: 'segment_003', flow_id: 'flow_001', start_time: '0:0', duration: '1:30' },
            changes: ['processed'],
            metadata: { user: 'system', source: 'processor' }
          }
        }
      ];
      
      setEvents(mockEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Apply event type filter
    if (filters.eventType) {
      filtered = filtered.filter(event => event.event_type === filters.eventType);
    }

    // Apply entity type filter
    if (filters.entityType) {
      filtered = filtered.filter(event => event.entity_type === filters.entityType);
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(event => event.status === filters.status);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (filters.dateRange) {
        case '1h':
          cutoffDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }
      
      filtered = filtered.filter(event => new Date(event.timestamp) >= cutoffDate);
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.entity_id.toLowerCase().includes(term) ||
        event.webhook_name.toLowerCase().includes(term) ||
        event.event_type.toLowerCase().includes(term) ||
        (event.payload.after?.label && event.payload.after.label.toLowerCase().includes(term))
      );
    }

    setFilteredEvents(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      eventType: '',
      entityType: '',
      status: '',
      dateRange: '24h'
    });
    setSearchTerm('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'green';
      case 'failed': return 'red';
      case 'pending': return 'yellow';
      case 'retrying': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'pending': return '⏳';
      case 'retrying': return '🔄';
      default: return '❓';
    }
  };

  const getEventCategory = (eventType: string) => {
    for (const [category, config] of Object.entries(BBC_EVENT_CATEGORIES)) {
      if (config.events.includes(eventType)) {
        return { category, ...config };
      }
    }
    return { category: 'unknown', icon: '❓', color: 'gray' };
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const exportEvents = () => {
    const csvContent = [
      'Event ID,Event Type,Entity ID,Entity Type,Timestamp,Webhook,Status,Response Code,Response Time (ms)',
      ...filteredEvents.map(event => 
        `${event.id},${event.event_type},${event.entity_id},${event.entity_type},${event.timestamp},${event.webhook_name},${event.status},${event.response_code || ''},${event.response_time_ms || ''}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webhook-events-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * eventsPerPage,
    currentPage * eventsPerPage
  );

  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  return (
    <Box>
      {/* Filters and Search */}
      <Card withBorder mb="md">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Title order={5}>Filters & Search</Title>
            <Button
              size="sm"
              variant="light"
              onClick={clearFilters}
              disabled={!filters.eventType && !filters.entityType && !filters.status && !searchTerm}
            >
              Clear All
            </Button>
          </Group>
          
          <Group grow>
            <TextInput
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftSection={<IconSearch size={16} />}
            />
            
            <Select
              placeholder="Event Type"
              value={filters.eventType}
              onChange={(value) => setFilters(prev => ({ ...prev, eventType: value || '' }))}
              data={Object.values(BBC_EVENT_CATEGORIES).flatMap(config => config.events)}
              clearable
            />

            <Select
              placeholder="Entity Type"
              value={filters.entityType}
              onChange={(value) => setFilters(prev => ({ ...prev, entityType: value || '' }))}
              data={[
                { value: 'flow', label: 'Flows' },
                { value: 'source', label: 'Sources' },
                { value: 'segment', label: 'Segments' },
                { value: 'collection', label: 'Collections' }
              ]}
              clearable
            />

            <Select
              placeholder="Status"
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value || '' }))}
              data={[
                { value: 'success', label: 'Success' },
                { value: 'failed', label: 'Failed' },
                { value: 'pending', label: 'Pending' },
                { value: 'retrying', label: 'Retrying' }
              ]}
              clearable
            />

            <Select
              placeholder="Date Range"
              value={filters.dateRange}
              onChange={(value) => setFilters(prev => ({ ...prev, dateRange: value as any }))}
              data={[
                { value: '1h', label: 'Last Hour' },
                { value: '24h', label: 'Last 24 Hours' },
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: 'all', label: 'All Time' }
              ]}
            />
          </Group>
        </Stack>
      </Card>

      {/* Event Statistics */}
      <Group gap="md" mb="md">
        {Object.entries(BBC_EVENT_CATEGORIES).map(([category, config]) => {
          const categoryEvents = filteredEvents.filter(event => 
            config.events.includes(event.event_type)
          );
          const successCount = categoryEvents.filter(e => e.status === 'success').length;
          const failedCount = categoryEvents.filter(e => e.status === 'failed').length;
          const pendingCount = categoryEvents.filter(e => e.status === 'pending').length;

          return (
            <Card key={category} withBorder p="sm" style={{ flex: 1 }}>
              <Stack gap="xs" align="center">
                <Text size="xl">{config.icon}</Text>
                <Text size="sm" fw={500} tt="capitalize">{category}</Text>
                <Title order={3} c={config.color}>{categoryEvents.length}</Title>
                <Group gap="xs" wrap="wrap">
                  <Badge color="green" size="xs">✓ {successCount}</Badge>
                  <Badge color="red" size="xs">✗ {failedCount}</Badge>
                  <Badge color="yellow" size="xs">⏳ {pendingCount}</Badge>
                </Group>
              </Stack>
            </Card>
          );
        })}
      </Group>

      {/* Actions */}
      <Group justify="space-between" mb="md">
        <Title order={5}>Event History ({filteredEvents.length} events)</Title>
        <Group>
          <Button
            variant="outlined"
            leftSection={<IconDownload size={16} />}
            onClick={exportEvents}
            disabled={filteredEvents.length === 0}
            size="sm"
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            leftSection={<IconRefresh size={16} />}
            onClick={loadEvents}
            disabled={loading}
            size="sm"
          >
            Refresh
          </Button>
        </Group>
      </Group>

      {/* Events Table */}
      {filteredEvents.length === 0 ? (
        <Card withBorder p="xl" ta="center">
          <IconInfoCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--mantine-color-gray-5)' }} />
          <Title order={4} c="dimmed" mb="xs">No events found</Title>
          <Text size="sm" c="dimmed">
            {searchTerm || Object.values(filters).some(f => f) 
              ? 'Try adjusting your filters or search terms'
              : 'No webhook events have been triggered yet'
            }
          </Text>
        </Card>
      ) : (
        <>
          <Card withBorder>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Event</Table.Th>
                  <Table.Th>Entity</Table.Th>
                  <Table.Th>Webhook</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Response</Table.Th>
                  <Table.Th>Timestamp</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedEvents.map((event) => {
                  const eventCategory = getEventCategory(event.event_type);
                  
                  return (
                    <Table.Tr key={event.id}>
                      <Table.Td>
                        <Group gap="xs">
                          <Text size="lg">{eventCategory.icon}</Text>
                          <Box>
                            <Text size="sm" fw={500}>{event.event_type}</Text>
                            <Badge color={eventCategory.color} variant="light" size="xs">
                              {eventCategory.category}
                            </Badge>
                          </Box>
                        </Group>
                      </Table.Td>
                      
                      <Table.Td>
                        <Box>
                          <Text size="sm" fw={500}>{event.entity_id}</Text>
                          <Badge color={eventCategory.color} variant="outline" size="xs">
                            {event.entity_type}
                          </Badge>
                        </Box>
                      </Table.Td>
                      
                      <Table.Td>
                        <Text size="sm">{event.webhook_name}</Text>
                        <Text size="xs" c="dimmed">{event.webhook_id}</Text>
                      </Table.Td>
                      
                      <Table.Td>
                        <Group gap="xs">
                          <Text size="lg">{getStatusIcon(event.status)}</Text>
                          <Badge color={getStatusColor(event.status)} size="sm">
                            {event.status}
                          </Badge>
                        </Group>
                      </Table.Td>
                      
                      <Table.Td>
                        {event.response_code ? (
                          <Box>
                            <Text size="sm" fw={500}>{event.response_code}</Text>
                            {event.response_time_ms && (
                              <Text size="xs" c="dimmed">{event.response_time_ms}ms</Text>
                            )}
                          </Box>
                        ) : (
                          <Text size="sm" c="dimmed">-</Text>
                        )}
                      </Table.Td>
                      
                      <Table.Td>
                        <Text size="sm">{formatTimestamp(event.timestamp)}</Text>
                        <Text size="xs" c="dimmed">
                          {new Date(event.timestamp).toLocaleString()}
                        </Text>
                      </Table.Td>
                      
                      <Table.Td>
                        <Tooltip label="View Event Details">
                          <ActionIcon 
                            size="sm"
                            onClick={() => onEventSelect?.(event)}
                            variant="light"
                          >
                            <IconInfoCircle size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <Group justify="center" mt="md">
              <Pagination
                total={totalPages}
                value={currentPage}
                onChange={setCurrentPage}
                size="sm"
              />
            </Group>
          )}
        </>
      )}
    </Box>
  );
};
