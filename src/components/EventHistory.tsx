import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Pagination,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  Event as EventIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

// BBC TAMS Event Types and Categories
const BBC_EVENT_CATEGORIES = {
  'flows': {
    icon: '🎬',
    color: 'primary',
    events: ['flows/created', 'flows/updated', 'flows/deleted', 'flows/segments_added', 'flows/segments_deleted', 'flows/storage_allocated', 'flows/storage_released']
  },
  'sources': {
    icon: '📁',
    color: 'secondary',
    events: ['sources/created', 'sources/updated', 'sources/deleted', 'sources/uploaded', 'sources/processed']
  },
  'segments': {
    icon: '⏱️',
    color: 'info',
    events: ['segments/created', 'segments/updated', 'segments/deleted', 'segments/processed']
  },
  'collections': {
    icon: '📦',
    color: 'success',
    events: ['collections/created', 'collections/updated', 'collections/deleted', 'collections/flows_added', 'collections/flows_removed']
  },
  'system': {
    icon: '⚙️',
    color: 'warning',
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
  headers?: Record<string, string>;
  user_agent?: string;
  ip_address?: string;
}

interface EventHistoryProps {
  onEventSelect?: (event: WebhookEvent) => void;
  refreshInterval?: number; // in seconds
}

export const EventHistory: React.FC<EventHistoryProps> = ({
  onEventSelect,
  refreshInterval = 30
}) => {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    eventType: '',
    entityType: '',
    status: '',
    webhookId: '',
    dateRange: '24h' as '1h' | '24h' | '7d' | '30d' | 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(25);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });

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
      // TODO: Replace with actual API call
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
          },
          headers: { 'Content-Type': 'application/json' },
          user_agent: 'BBC-TAMS-Client/1.0',
          ip_address: '192.168.1.100'
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
          },
          headers: { 'Content-Type': 'application/json' },
          user_agent: 'BBC-TAMS-Client/1.0',
          ip_address: '192.168.1.101'
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
          },
          headers: { 'Content-Type': 'application/json' },
          user_agent: 'BBC-TAMS-Client/1.0',
          ip_address: '192.168.1.100'
        }
      ];
      
      setEvents(mockEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load event history',
        severity: 'error'
      });
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

    // Apply webhook filter
    if (filters.webhookId) {
      filtered = filtered.filter(event => event.webhook_id === filters.webhookId);
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
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      eventType: '',
      entityType: '',
      status: '',
      webhookId: '',
      dateRange: '24h'
    });
    setSearchTerm('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'retrying':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      case 'retrying': return 'warning';
      default: return 'default';
    }
  };

  const getEventCategory = (eventType: string) => {
    for (const [category, config] of Object.entries(BBC_EVENT_CATEGORIES)) {
      if (config.events.includes(eventType)) {
        return { category, ...config };
      }
    }
    return { category: 'unknown', icon: '❓', color: 'default' };
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventIcon color="primary" />
          BBC TAMS Event History
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportEvents}
            disabled={filteredEvents.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadEvents}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Filters & Search" 
          avatar={<FilterIcon />}
          action={
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              disabled={!filters.eventType && !filters.entityType && !filters.status && !filters.webhookId && !searchTerm}
            >
              Clear All
            </Button>
          }
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events..."
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={filters.eventType}
                  onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
                  label="Event Type"
                >
                  <MenuItem value="">All Events</MenuItem>
                  {Object.values(BBC_EVENT_CATEGORIES).flatMap(config => config.events).map(eventType => (
                    <MenuItem key={eventType} value={eventType}>{eventType}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Entity Type</InputLabel>
                <Select
                  value={filters.entityType}
                  onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value }))}
                  label="Entity Type"
                >
                  <MenuItem value="">All Entities</MenuItem>
                  <MenuItem value="flow">Flows</MenuItem>
                  <MenuItem value="source">Sources</MenuItem>
                  <MenuItem value="segment">Segments</MenuItem>
                  <MenuItem value="collection">Collections</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="retrying">Retrying</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                  label="Date Range"
                >
                  <MenuItem value="1h">Last Hour</MenuItem>
                  <MenuItem value="24h">Last 24 Hours</MenuItem>
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                  <MenuItem value="all">All Time</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Event Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {Object.entries(BBC_EVENT_CATEGORIES).map(([category, config]) => {
          const categoryEvents = filteredEvents.filter(event => 
            config.events.includes(event.event_type)
          );
          const successCount = categoryEvents.filter(e => e.status === 'success').length;
          const failedCount = categoryEvents.filter(e => e.status === 'failed').length;
          const pendingCount = categoryEvents.filter(e => e.status === 'pending').length;

          return (
            <Grid item xs={12} sm={6} md={3} key={category}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ mb: 1 }}>
                    {config.icon}
                  </Typography>
                  <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
                    {category}
                  </Typography>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {categoryEvents.length}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.875rem' }}>
                    <Box sx={{ color: 'success.main' }}>✓ {successCount}</Box>
                    <Box sx={{ color: 'error.main' }}>✗ {failedCount}</Box>
                    <Box sx={{ color: 'warning.main' }}>⏳ {pendingCount}</Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Events Table */}
      <Card>
        <CardHeader 
          title={`Event History (${filteredEvents.length} events)`}
          subheader={`Showing ${paginatedEvents.length} of ${filteredEvents.length} events`}
        />
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredEvents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <EventIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No events found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || Object.values(filters).some(f => f) 
                  ? 'Try adjusting your filters or search terms'
                  : 'No webhook events have been triggered yet'
                }
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Event</TableCell>
                      <TableCell>Entity</TableCell>
                      <TableCell>Webhook</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Response</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedEvents.map((event) => {
                      const eventCategory = getEventCategory(event.event_type);
                      
                      return (
                        <TableRow key={event.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontSize: '1.2rem' }}>
                                {eventCategory.icon}
                              </Typography>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {event.event_type}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {eventCategory.category}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {event.entity_id}
                              </Typography>
                              <Chip 
                                label={event.entity_type} 
                                size="small" 
                                variant="outlined"
                                color={eventCategory.color as any}
                              />
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2">
                              {event.webhook_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {event.webhook_id}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getStatusIcon(event.status)}
                              <Chip 
                                label={event.status} 
                                size="small" 
                                color={getStatusColor(event.status) as any}
                              />
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            {event.response_code ? (
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {event.response_code}
                                </Typography>
                                {event.response_time_ms && (
                                  <Typography variant="caption" color="text.secondary">
                                    {event.response_time_ms}ms
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                -
                              </Typography>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2">
                              {formatTimestamp(event.timestamp)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(event.timestamp).toLocaleString()}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            <Tooltip title="View Event Details">
                              <IconButton 
                                size="small"
                                onClick={() => onEventSelect?.(event)}
                              >
                                <InfoIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(_, page) => setCurrentPage(page)}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
