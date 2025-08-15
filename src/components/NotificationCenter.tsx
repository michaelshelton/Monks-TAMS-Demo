import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Badge,
  Drawer,
  Divider,
  Fab,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Fade
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Webhook as WebhookIcon,
  Event as EventIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

// BBC TAMS Notification Types
const NOTIFICATION_TYPES = {
  'flows': {
    icon: '🎬',
    color: 'primary',
    label: 'Flow Events',
    events: ['flows/created', 'flows/updated', 'flows/deleted', 'flows/segments_added', 'flows/segments_deleted']
  },
  'sources': {
    icon: '📁',
    color: 'secondary',
    label: 'Source Events',
    events: ['sources/created', 'sources/updated', 'sources/deleted', 'sources/uploaded', 'sources/processed']
  },
  'segments': {
    icon: '⏱️',
    color: 'info',
    label: 'Segment Events',
    events: ['segments/created', 'segments/updated', 'segments/deleted', 'segments/processed']
  },
  'collections': {
    icon: '📦',
    color: 'success',
    label: 'Collection Events',
    events: ['collections/created', 'collections/updated', 'collections/deleted', 'collections/flows_added', 'collections/flows_removed']
  },
  'system': {
    icon: '⚙️',
    color: 'warning',
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

interface NotificationCenterProps {
  onNotificationAction?: (notification: Notification, action: string) => void;
  onNotificationSelect?: (notification: Notification) => void;
  refreshInterval?: number; // in seconds
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onNotificationAction,
  onNotificationSelect,
  refreshInterval = 10
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    soundEnabled: true,
    desktopNotifications: true,
    autoDismiss: true,
    autoDismissDelay: 5000, // ms
    maxNotifications: 100,
    refreshInterval: 10 // seconds
  });
  const [filters, setFilters] = useState({
    severity: '',
    type: '',
    read: 'all' as 'all' | 'unread' | 'read'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout>();

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

  useEffect(() => {
    // Check for new notifications and play sound if enabled
    const newNotifications = notifications.filter(n => !n.read && !n.dismissed);
    if (newNotifications.length > 0 && settings.soundEnabled) {
      playNotificationSound();
    }
  }, [notifications, settings.soundEnabled]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
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
            { label: 'View Segment', action: 'view', url: '/segments/segment_003' },
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
      setSnackbar({
        open: true,
        message: 'Failed to load notifications',
        severity: 'error'
      });
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
    
    // Update browser tab title with unread count
    if (unread > 0) {
      document.title = `(${unread}) BBC TAMS`;
    } else {
      document.title = 'BBC TAMS';
    }
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

  const playNotificationSound = () => {
    if (audioRef.current && settings.soundEnabled) {
      audioRef.current.play().catch(console.error);
    }
  };

  const showDesktopNotification = (notification: Notification) => {
    if (settings.desktopNotifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.severity === 'error'
      });
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
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
      color: 'default',
      label: 'Unknown'
    };
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="notifications"
        onClick={() => setDrawerOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? <NotificationsActiveIcon /> : <NotificationsIcon />}
        </Badge>
      </Fab>

      {/* Notification Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400, md: 500 } }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsIcon color="primary" />
                <Typography variant="h6">Notifications</Typography>
                {unreadCount > 0 && (
                  <Chip 
                    label={unreadCount} 
                    color="error" 
                    size="small"
                  />
                )}
              </Box>
            }
            subheader={`${filteredNotifications.length} notification${filteredNotifications.length !== 1 ? 's' : ''}`}
            action={
              <IconButton onClick={() => setDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            }
          />

          {/* Filters and Search */}
          <Card sx={{ mx: 2, mb: 2 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={filters.type}
                      onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                      label="Type"
                    >
                      <MenuItem value="">All Types</MenuItem>
                      {Object.entries(NOTIFICATION_TYPES).map(([key, config]) => (
                        <MenuItem key={key} value={key}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{config.icon}</span>
                            {config.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.read}
                      onChange={(e) => setFilters(prev => ({ ...prev, read: e.target.value as any }))}
                      label="Status"
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="unread">Unread</MenuItem>
                      <MenuItem value="read">Read</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Actions */}
          <Box sx={{ px: 2, mb: 2, display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark All Read
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={clearAllNotifications}
              disabled={notifications.length === 0}
            >
              Clear All
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => {/* TODO: Open settings dialog */}}
            >
              Settings
            </Button>
          </Box>

          {/* Notifications List */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredNotifications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No notifications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm || Object.values(filters).some(f => f) 
                    ? 'Try adjusting your filters or search terms'
                    : 'You\'re all caught up!'
                  }
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {filteredNotifications.map((notification, index) => {
                  const typeInfo = getNotificationTypeInfo(notification.type);
                  
                  return (
                    <React.Fragment key={notification.id}>
                      <ListItem
                        sx={{
                          backgroundColor: notification.read ? 'transparent' : 'action.hover',
                          '&:hover': { backgroundColor: 'action.selected' }
                        }}
                      >
                        <ListItemIcon>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            {getSeverityIcon(notification.severity)}
                            <Typography variant="caption" sx={{ fontSize: '1.2rem' }}>
                              {typeInfo.icon}
                            </Typography>
                          </Box>
                        </ListItemIcon>
                        
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography 
                                variant="body2" 
                                fontWeight={notification.read ? 'normal' : 'medium'}
                                sx={{ flex: 1 }}
                              >
                                {notification.title}
                              </Typography>
                              <Chip 
                                label={notification.severity} 
                                size="small" 
                                color={getSeverityColor(notification.severity) as any}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {notification.message}
                              </Typography>
                              
                              {notification.entity_id && (
                                <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                                  Entity: {notification.entity_id}
                                </Typography>
                              )}
                              
                              <Typography variant="caption" color="text.secondary">
                                {formatTimestamp(notification.timestamp)}
                              </Typography>
                              
                              {notification.actions && notification.actions.length > 0 && (
                                <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {notification.actions.map((action, actionIndex) => (
                                    <Button
                                      key={actionIndex}
                                      size="small"
                                      variant="text"
                                      onClick={() => handleNotificationAction(notification, action.action)}
                                      sx={{ minWidth: 'auto', p: 0.5 }}
                                    >
                                      {action.label}
                                    </Button>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          }
                        />
                        
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => markAsRead(notification.id)}
                              disabled={notification.read}
                            >
                              <SuccessIcon color={notification.read ? 'disabled' : 'success'} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => dismissNotification(notification.id)}
                              disabled={notification.dismissed}
                            >
                              <CloseIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < filteredNotifications.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Hidden audio element for notification sounds */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification-sound.mp3" type="audio/mpeg" />
        <source src="/notification-sound.wav" type="audio/wav" />
      </audio>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};
