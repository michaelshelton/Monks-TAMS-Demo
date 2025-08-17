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
  List,
  Modal,
  Title,
  Alert,
  Divider
} from '@mantine/core';
import { 
  IconBell, 
  IconBellRinging, 
  IconCheck, 
  IconX, 
  IconSearch, 
  IconFilter,
  IconSettings,
  IconInfoCircle
} from '@tabler/icons-react';

// BBC TAMS Notification Types
const NOTIFICATION_TYPES = {
  'flows': {
    icon: '🎬',
    color: 'blue',
    label: 'Flow Events',
    events: ['flows/created', 'flows/updated', 'flows/deleted', 'flows/segments_added', 'flows/segments_deleted']
  },
  'sources': {
    icon: '📁',
    color: 'grape',
    label: 'Source Events',
    events: ['sources/created', 'sources/updated', 'sources/deleted', 'sources/uploaded', 'sources/processed']
  },
  'segments': {
    icon: '⏱️',
    color: 'cyan',
    label: 'Segment Events',
    events: ['segments/created', 'segments/updated', 'segments/deleted', 'segments/processed']
  },
  'collections': {
    icon: '📦',
    color: 'green',
    label: 'Collection Events',
    events: ['collections/created', 'collections/updated', 'collections/deleted', 'collections/flows_added', 'collections/flows_removed']
  },
  'system': {
    icon: '⚙️',
    color: 'orange',
    label: 'System Events',
    events: ['system/health_check', 'system/backup_completed', 'system/maintenance_started', 'system/maintenance_completed']
  }
};

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  entity_id?: string;
  entity_type?: string;
  event_type: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  dismissed: boolean;
  webhook_id?: string;
  webhook_name?: string;
  payload?: any;
  actions?: Array<{
    label: string;
    action: string;
    url?: string;
  }>;
}

interface NotificationCenterMantineProps {
  onNotificationAction?: (notification: Notification, action: string) => void;
  onNotificationSelect?: (notification: Notification) => void;
  refreshInterval?: number; // in seconds
}

export const NotificationCenterMantine: React.FC<NotificationCenterMantineProps> = ({
  onNotificationAction,
  onNotificationSelect,
      refreshInterval = 7200 // Refresh every 2 hours instead of every minute
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    severity: '',
    type: '',
    read: 'all' as 'all' | 'unread' | 'read'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    
    // Auto-refresh every refreshInterval seconds
    const interval = setInterval(loadNotifications, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    applyFilters();
    updateUnreadCount();
  }, [notifications, filters, searchTerm]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Mock data for demo
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'flows',
          title: 'New Flow Created',
          message: 'Production Flow "Q4_2025_Product_Launch" has been created successfully',
          entity_id: 'flow_001',
          entity_type: 'flow',
          event_type: 'flows/created',
          severity: 'success',
          timestamp: '2025-01-25T15:30:00Z',
          read: false,
          dismissed: false,
          webhook_id: 'webhook_001',
          webhook_name: 'Production Alerts',
          payload: { flow_id: 'flow_001', label: 'Q4_2025_Product_Launch' },
          actions: [
            { label: 'View Flow', action: 'view', url: '/flows/flow_001' },
            { label: 'Edit Flow', action: 'edit', url: '/flows/flow_001/edit' }
          ]
        },
        {
          id: '2',
          type: 'sources',
          title: 'Source Upload Failed',
          message: 'Failed to upload source file "product_demo.mp4" - Connection timeout',
          entity_id: 'source_002',
          entity_type: 'source',
          event_type: 'sources/uploaded',
          severity: 'error',
          timestamp: '2025-01-25T15:25:00Z',
          read: false,
          dismissed: false,
          webhook_id: 'webhook_002',
          webhook_name: 'Development Notifications',
          payload: { source_id: 'source_002', filename: 'product_demo.mp4', error: 'Connection timeout' },
          actions: [
            { label: 'Retry Upload', action: 'retry', url: '/sources/upload' },
            { label: 'View Error Details', action: 'view_error', url: '/sources/source_002' }
          ]
        },
        {
          id: '3',
          type: 'segments',
          title: 'Segment Processing Complete',
          message: 'Segment "intro_segment" has been processed and is ready for use',
          entity_id: 'segment_003',
          entity_type: 'segment',
          event_type: 'segments/processed',
          severity: 'info',
          timestamp: '2025-01-25T15:20:00Z',
          read: true,
          dismissed: false,
          webhook_id: 'webhook_001',
          webhook_name: 'Production Alerts',
          payload: { segment_id: 'segment_003', flow_id: 'flow_001', status: 'processed' },
          actions: [
            { label: 'View Segment', action: 'view', url: '/flow-details/flow_001?tab=segments&segmentId=segment_003' },
            { label: 'Add to Flow', action: 'add_to_flow', url: '/flows/flow_001/edit' }
          ]
        },
        {
          id: '4',
          type: 'system',
          title: 'System Maintenance Scheduled',
          message: 'Scheduled maintenance will begin in 30 minutes. Expected downtime: 15 minutes',
          event_type: 'system/maintenance_started',
          severity: 'warning',
          timestamp: '2025-01-25T15:15:00Z',
          read: false,
          dismissed: false,
          actions: [
            { label: 'View Maintenance Schedule', action: 'view_schedule', url: '/system/maintenance' },
            { label: 'Dismiss', action: 'dismiss' }
          ]
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...notifications];

    // Apply severity filter
    if (filters.severity) {
      filtered = filtered.filter(notification => notification.severity === filters.severity);
    }

    // Apply type filter
    if (filters.type) {
      filtered = filtered.filter(notification => notification.type === filters.type);
    }

    // Apply read filter
    if (filters.read === 'unread') {
      filtered = filtered.filter(notification => !notification.read);
    } else if (filters.read === 'read') {
      filtered = filtered.filter(notification => notification.read);
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(term) ||
        notification.message.toLowerCase().includes(term) ||
        notification.event_type.toLowerCase().includes(term)
      );
    }

    setFilteredNotifications(filtered);
  };

  const updateUnreadCount = () => {
    const unread = notifications.filter(n => !n.read && !n.dismissed).length;
    setUnreadCount(unread);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, dismissed: true } : n)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationAction = (notification: Notification, action: string) => {
    if (action === 'dismiss') {
      dismissNotification(notification.id);
    } else if (action === 'mark_read') {
      markAsRead(notification.id);
    } else {
      onNotificationAction?.(notification, action);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'green';
      case 'error': return 'red';
      case 'warning': return 'yellow';
      case 'info': return 'blue';
      default: return 'gray';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '❓';
    }
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

  const getNotificationTypeInfo = (type: string) => {
    return NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES] || {
      icon: '❓',
      color: 'gray',
      label: 'Unknown'
    };
  };

  return (
    <Box>
      {/* Notification Center Header */}
      <Card withBorder mb="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            {unreadCount > 0 ? (
              <IconBellRinging size={24} color="var(--mantine-color-blue-6)" />
            ) : (
              <IconBell size={24} color="var(--mantine-color-gray-6)" />
            )}
            <Box>
              <Title order={5}>Notification Center</Title>
              <Text size="sm" c="dimmed">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </Text>
            </Box>
          </Group>
          
          <Group gap="xs">
            <Button
              size="sm"
              variant="light"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark All Read
            </Button>
            <Button
              size="sm"
              variant="light"
              color="red"
              onClick={clearAllNotifications}
              disabled={notifications.length === 0}
            >
              Clear All
            </Button>
            <Button
              size="sm"
              variant="light"
              leftSection={<IconSettings size={16} />}
              onClick={() => setModalOpen(true)}
            >
              Settings
            </Button>
          </Group>
        </Group>
      </Card>

      {/* Filters and Search */}
      <Card withBorder mb="md">
        <Stack gap="md">
          <Title order={6}>Filters & Search</Title>
          
          <Group grow>
            <TextInput
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftSection={<IconSearch size={16} />}
            />
            
            <Select
              placeholder="Type"
              value={filters.type}
              onChange={(value) => setFilters(prev => ({ ...prev, type: value || '' }))}
              data={Object.entries(NOTIFICATION_TYPES).map(([key, config]) => ({
                value: key,
                label: config.label
              }))}
              clearable
            />

            <Select
              placeholder="Status"
              value={filters.read}
              onChange={(value) => setFilters(prev => ({ ...prev, read: value as any }))}
              data={[
                { value: 'all', label: 'All' },
                { value: 'unread', label: 'Unread' },
                { value: 'read', label: 'Read' }
              ]}
            />
          </Group>
        </Stack>
      </Card>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card withBorder p="xl" ta="center">
          <IconBell size={48} style={{ margin: '0 auto 16px', color: 'var(--mantine-color-gray-5)' }} />
          <Title order={4} c="dimmed" mb="xs">No notifications</Title>
          <Text size="sm" c="dimmed">
            {searchTerm || Object.values(filters).some(f => f) 
              ? 'Try adjusting your filters or search terms'
              : 'You\'re all caught up!'
            }
          </Text>
        </Card>
      ) : (
        <Stack gap="md">
          {filteredNotifications.map((notification, index) => {
            const typeInfo = getNotificationTypeInfo(notification.type);
            
            return (
              <Card 
                key={notification.id} 
                withBorder
                style={{
                  backgroundColor: notification.read ? 'transparent' : 'var(--mantine-color-blue-0)'
                }}
              >
                <Group justify="space-between" align="flex-start">
                  <Box style={{ flex: 1 }}>
                    <Group gap="xs" mb="xs">
                      <Text size="lg">{getSeverityIcon(notification.severity)}</Text>
                      <Text size="lg">{typeInfo.icon}</Text>
                      <Title order={6} style={{ flex: 1 }}>
                        {notification.title}
                      </Title>
                      <Badge 
                        color={getSeverityColor(notification.severity)} 
                        variant="light"
                        size="sm"
                      >
                        {notification.severity}
                      </Badge>
                    </Group>
                    
                    <Text size="sm" c="dimmed" mb="xs">
                      {notification.message}
                    </Text>
                    
                    {notification.entity_id && (
                      <Text size="xs" c="dimmed" mb="xs">
                        Entity: {notification.entity_id}
                      </Text>
                    )}
                    
                    <Text size="xs" c="dimmed" mb="xs">
                      {formatTimestamp(notification.timestamp)}
                    </Text>
                    
                    {notification.actions && notification.actions.length > 0 && (
                      <Group gap="xs" mt="xs">
                        {notification.actions.map((action, actionIndex) => (
                          <Button
                            key={actionIndex}
                            size="xs"
                            variant="light"
                            onClick={() => handleNotificationAction(notification, action.action)}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </Group>
                    )}
                  </Box>
                  
                  <Group gap="xs">
                    <Tooltip label="Mark as read">
                      <ActionIcon
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        disabled={notification.read}
                        variant="light"
                        color="green"
                      >
                        <IconCheck size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Dismiss">
                      <ActionIcon
                        size="sm"
                        onClick={() => dismissNotification(notification.id)}
                        disabled={notification.dismissed}
                        variant="light"
                        color="red"
                      >
                        <IconX size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Settings Modal */}
      <Modal 
        opened={modalOpen} 
        onClose={() => setModalOpen(false)}
        title="Notification Settings"
        size="md"
      >
        <Stack gap="md">
          <Alert icon={<IconInfoCircle size={16} />} title="Notification Center" color="blue">
            <Text size="sm">
              The notification center provides real-time alerts for BBC TAMS events with sound 
              notifications, desktop alerts, and actionable buttons. Access it via the floating 
              notification bell in the bottom-right corner.
            </Text>
          </Alert>
          
          <Text size="sm" c="dimmed">
            This is a demo implementation. In production, you would configure notification 
            preferences, sound settings, and desktop notification permissions here.
          </Text>
          
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setModalOpen(false)}>
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};
