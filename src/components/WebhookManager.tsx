import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  Chip, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  FormControl, 
  FormControlLabel, 
  Grid, 
  IconButton, 
  InputLabel, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  MenuItem, 
  Select, 
  Switch, 
  TextField, 
  Typography,
  Alert,
  Snackbar,
  Tooltip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Webhook as WebhookIcon,
  ExpandMore as ExpandMoreIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  TestTube as TestIcon
} from '@mui/icons-material';

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

interface WebhookManagerProps {
  onWebhookUpdate?: (webhook: WebhookConfig) => void;
  onWebhookDelete?: (webhookId: string) => void;
}

export const WebhookManager: React.FC<WebhookManagerProps> = ({
  onWebhookUpdate,
  onWebhookDelete
}) => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

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
      // TODO: Replace with actual API call
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
      setSnackbar({
        open: true,
        message: 'Failed to load webhooks',
        severity: 'error'
      });
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
        
        // TODO: Replace with actual API call
        setWebhooks(prev => prev.map(w => w.id === editingWebhook.id ? updatedWebhook : w));
        onWebhookUpdate?.(updatedWebhook);
        
        setSnackbar({
          open: true,
          message: 'Webhook updated successfully',
          severity: 'success'
        });
      } else {
        // Create new webhook
        const newWebhook: WebhookConfig = {
          id: Date.now().toString(),
          ...formData,
          enabled: true,
          created_at: new Date().toISOString(),
          last_status: 'pending'
        };
        
        // TODO: Replace with actual API call
        setWebhooks(prev => [...prev, newWebhook]);
        
        setSnackbar({
          open: true,
          message: 'Webhook created successfully',
          severity: 'success'
        });
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save webhook:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save webhook',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (webhookId: string) => {
    try {
      // TODO: Replace with actual API call
      setWebhooks(prev => prev.filter(w => w.id !== webhookId));
      onWebhookDelete?.(webhookId);
      
      setSnackbar({
        open: true,
        message: 'Webhook deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete webhook',
        severity: 'error'
      });
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
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
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
      // TODO: Replace with actual test API call
      setSnackbar({
        open: true,
        message: `Test webhook sent to ${webhook.name}`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to test webhook',
        severity: 'error'
      });
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WebhookIcon color="primary" />
          BBC TAMS Webhook Manager
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Webhook
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Webhook List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Configured Webhooks" 
              subheader={`${webhooks.length} webhook${webhooks.length !== 1 ? 's' : ''} configured`}
            />
            <CardContent>
              {webhooks.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <WebhookIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No webhooks configured
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create your first webhook to receive real-time BBC TAMS event notifications
                  </Typography>
                </Box>
              ) : (
                <List>
                  {webhooks.map((webhook, index) => (
                    <React.Fragment key={webhook.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="h6">{webhook.name}</Typography>
                              <Chip 
                                label={webhook.enabled ? 'Active' : 'Inactive'} 
                                color={webhook.enabled ? 'success' : 'default'}
                                size="small"
                              />
                              <Chip 
                                label={getStatusIcon(webhook.last_status)} 
                                color={getStatusColor(webhook.last_status)}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {webhook.url}
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                {webhook.events.map(event => (
                                  <Chip 
                                    key={event} 
                                    label={event} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                                ))}
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                Created: {new Date(webhook.created_at).toLocaleDateString()}
                                {webhook.last_triggered && ` • Last triggered: ${new Date(webhook.last_triggered).toLocaleDateString()}`}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Test webhook">
                              <IconButton 
                                onClick={() => handleTestWebhook(webhook)}
                                color="primary"
                              >
                                <TestIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit webhook">
                              <IconButton 
                                onClick={() => handleEdit(webhook)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete webhook">
                              <IconButton 
                                onClick={() => handleDelete(webhook.id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < webhooks.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* BBC TAMS Event Types Reference */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader 
              title="BBC TAMS Event Types" 
              subheader="Available events for subscription"
              avatar={<NotificationsIcon color="primary" />}
            />
            <CardContent>
              {Object.entries(BBC_EVENT_TYPES).map(([category, events]) => (
                <Accordion key={category} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                      {category}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {events.map(event => (
                        <Chip 
                          key={event} 
                          label={event} 
                          size="small" 
                          variant="outlined"
                          sx={{ alignSelf: 'flex-start' }}
                        />
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add/Edit Webhook Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingWebhook ? 'Edit Webhook' : 'Add New Webhook'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Webhook Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Production Alerts"
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Webhook URL"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://your-domain.com/webhook"
                required
                helperText="HTTPS endpoint to receive BBC TAMS events"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Event Types</InputLabel>
                <Select
                  multiple
                  value={formData.events}
                  onChange={(e) => setFormData(prev => ({ ...prev, events: e.target.value as string[] }))}
                  label="Event Types"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {Object.values(BBC_EVENT_TYPES).flat().map((event) => (
                    <MenuItem key={event} value={event}>
                      {event}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Secret Key (Optional)"
                value={formData.secret}
                onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                placeholder="Webhook secret for security"
                helperText="Used to verify webhook authenticity"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Retry Count"
                type="number"
                value={formData.retry_count}
                onChange={(e) => setFormData(prev => ({ ...prev, retry_count: parseInt(e.target.value) || 0 }))}
                inputProps={{ min: 0, max: 10 }}
                helperText="Number of retry attempts on failure"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Timeout (seconds)"
                type="number"
                value={formData.timeout_seconds}
                onChange={(e) => setFormData(prev => ({ ...prev, timeout_seconds: parseInt(e.target.value) || 30 }))}
                inputProps={{ min: 5, max: 300 }}
                helperText="Request timeout in seconds"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name || !formData.url || formData.events.length === 0}
          >
            {editingWebhook ? 'Update' : 'Create'} Webhook
          </Button>
        </DialogActions>
      </Dialog>

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
