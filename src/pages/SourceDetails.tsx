import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Group,
  Badge,
  Button,
  Stack,
  Card,
  Grid,
  Tabs,
  Alert,
  Loader,
  Box,
  Paper,
  Divider,
  ActionIcon,
  Tooltip,
  Breadcrumbs,
  Anchor
} from '@mantine/core';
import {
  IconArrowLeft,
  IconActivity,
  IconVideo,
  IconMusic,
  IconDatabase,
  IconPhoto,
  IconTags,
  IconSettings,
  IconChartBar,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconAlertCircle,
  IconInfoCircle,
  IconMapPin,
  IconNetwork,
  IconGauge,
  IconCalendar
} from '@tabler/icons-react';

import { EnhancedDeleteModal, DeleteOptions } from '../components/EnhancedDeleteModal';
import { apiClient } from '../services/api';

// VAST TAMS Source interface
interface Source {
  id: string;
  format: string;
  label?: string;
  description?: string;
  created_by?: string;
  updated_by?: string;
  created?: string;
  updated?: string;
  tags?: Record<string, string>;
  source_collection?: Array<{ id: string; label?: string }>;
  collected_by?: string[];
  // VAST TAMS soft delete fields
  deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export default function SourceDetails() {
  const { sourceId } = useParams<{ sourceId: string }>();
  const navigate = useNavigate();
  const [source, setSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'configuration'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [disabled, setDisabled] = useState(false);
  
  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // Configuration state
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // Load source data
  useEffect(() => {
    if (sourceId) {
      loadSource();
    }
  }, [sourceId]);

  // Load analytics when analytics tab is selected
  useEffect(() => {
    if (activeTab === 'analytics' && !analyticsData) {
      loadAnalytics();
    }
  }, [activeTab, analyticsData]);

  const loadSource = async () => {
    if (!sourceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching source details from VAST TAMS API for ID:', sourceId);
      const sourceData = await apiClient.getSource(sourceId);
      console.log('VAST TAMS source details response:', sourceData);
      
      setSource(sourceData);
    } catch (err: any) {
      console.error('VAST TAMS source details API error:', err);
      
      // Set appropriate error message based on error type
      if (err?.message?.includes('500') || err?.message?.includes('Internal Server Error')) {
        setError('VAST TAMS backend temporarily unavailable - please try again later');
      } else if (err?.message?.includes('Network') || err?.message?.includes('fetch') || err?.message?.includes('CORS')) {
        setError('Network connection issue - please check your connection and try again');
      } else if (err?.message?.includes('404')) {
        setError('Source not found - please check the source ID and try again');
      } else {
        setError(`VAST TAMS API error: ${err?.message || 'Unknown error'}`);
      }
      
      // Clear source on error
      setSource(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      // Fetch analytics data from VAST TAMS
      const [flowUsage, storageUsage, timeRangeAnalysis] = await Promise.all([
        fetch('/api/analytics/flow-usage').then(res => res.json()),
        fetch('/api/analytics/storage-usage').then(res => res.json()),
        fetch('/api/analytics/time-range-analysis').then(res => res.json())
      ]);
      
      setAnalyticsData({
        flowUsage,
        storageUsage,
        timeRangeAnalysis
      });
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const updateSourceConfig = async (field: string, value: string) => {
    if (!sourceId) return;
    
    setConfigLoading(true);
    setConfigError(null);
    
    try {
      // Update specific field using VAST TAMS API
      const response = await fetch(`/api/sources/${sourceId}/${field}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update ${field}`);
      }
      
      // Reload source data to reflect changes
      await loadSource();
    } catch (err: any) {
      console.error(`Failed to update ${field}:`, err);
      setConfigError(`Failed to update ${field}: ${err.message}`);
    } finally {
      setConfigLoading(false);
    }
  };

  const handleDelete = async (options: DeleteOptions) => {
    if (!source) return;
    
    try {
      setLoading(true);
      await apiClient.deleteSource(source.id, options);
      navigate('/sources');
    } catch (err) {
      console.error('Failed to delete source:', err);
      setError('Failed to delete source');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const getFormatLabel = (format: string) => {
    const formatMap: Record<string, string> = {
      'urn:x-nmos:format:video': 'Video',
      'urn:x-nmos:format:audio': 'Audio',
      'urn:x-nmos:format:data': 'Data',
      'urn:x-tam:format:image': 'Image'
    };
    return formatMap[format] || format;
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'urn:x-nmos:format:video': return <IconVideo size={20} color="#228be6" />;
      case 'urn:x-nmos:format:audio': return <IconMusic size={20} color="#40c057" />;
      case 'urn:x-nmos:format:data': return <IconDatabase size={20} color="#fd7e14" />;
      case 'urn:x-tam:format:image': return <IconPhoto size={20} color="#7950f2" />;
      default: return <IconDatabase size={20} color="#868e96" />;
    }
  };

  const getStatusColor = (deleted?: boolean) => {
    return deleted ? 'red' : 'green';
  };

  if (loading) {
    return (
      <Container size="xl" px="xl" py="xl">
        <Stack gap="xl" align="center" py="xl">
          <Loader size="lg" />
          <Text size="lg" c="dimmed">Loading source details...</Text>
        </Stack>
      </Container>
    );
  }

  if (!source) {
    return (
      <Container size="xl" px="xl" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Source Not Found">
          The requested source could not be found. Please check the source ID and try again.
        </Alert>
      </Container>
    );
  }

  const breadcrumbs = [
    { title: 'Sources', href: '/sources' },
    { title: source.label || 'Source Details', href: '#' }
  ];

  return (
    <Container size="xl" px="xl" py="xl">
      {/* Breadcrumbs */}
      <Breadcrumbs mb="lg">
        {breadcrumbs.map((item, index) => (
          <Anchor
            key={index}
            href={item.href}
            onClick={(e) => {
              if (index < breadcrumbs.length - 1) {
                e.preventDefault();
                navigate(item.href);
              }
            }}
            c={index === breadcrumbs.length - 1 ? 'dimmed' : 'blue'}
          >
            {item.title}
          </Anchor>
        ))}
      </Breadcrumbs>

      {/* Header */}
      <Group justify="space-between" align="flex-start" mb="lg">
        <Box>
          <Group gap="sm" align="center" mb="xs">
            {getFormatIcon(source.format)}
            <Title order={2}>{source.label || 'Unnamed Source'}</Title>
            <Badge 
              variant="light" 
              color={getStatusColor(source.deleted)}
              size="lg"
            >
              {source.deleted ? 'Deleted' : 'Active'}
            </Badge>
          </Group>
          <Text c="dimmed" size="sm" mb="xs">
            {source.description || 'No description available'}
          </Text>
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              ID: {source.id}
            </Text>
            {source.created && (
              <Text size="xs" c="dimmed">
                Created: {new Date(source.created).toLocaleDateString()}
              </Text>
            )}
            {source.updated && (
              <Text size="xs" c="dimmed">
                Updated: {new Date(source.updated).toLocaleDateString()}
              </Text>
            )}
          </Group>
        </Box>
        
        <Group gap="xs">
          <Button
            variant="light"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/sources')}
          >
            Back to Sources
          </Button>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={loadSource}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            variant="light"
            leftSection={<IconEdit size={16} />}
            onClick={() => {/* TODO: Implement edit */}}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={() => setShowDeleteModal(true)}
          >
            Delete
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
          mb="lg"
        >
          {error}
        </Alert>
      )}

      {/* VAST TAMS Info */}
      {!error && (
        <Alert 
          icon={<IconInfoCircle size={16} />} 
          color="blue" 
          title="Source Details in TAMS"
          mb="lg"
        >
          <Text size="sm" mb="xs">
            This page shows detailed information about a specific <strong>Source</strong> - the original media input 
            container in the TAMS system. Here you can view metadata, analytics, and configuration options.
          </Text>
          <Text size="sm" mb="xs">
            Sources contain information like format, tags, creation details, and relationships to flows and collections. 
            This detailed view helps you understand the content structure and manage source properties.
          </Text>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value as any)}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconInfoCircle size={16} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="analytics" leftSection={<IconChartBar size={16} />}>
            Analytics
          </Tabs.Tab>
          <Tabs.Tab value="configuration" leftSection={<IconSettings size={16} />}>
            Configuration
          </Tabs.Tab>
        </Tabs.List>

        {/* Overview Tab */}
        <Tabs.Panel value="overview" pt="xl">
          <Stack gap="xl">
            {/* Basic Information */}
            <Card withBorder>
              <Title order={4} mb="md">Basic Information</Title>
              <Grid>
                <Grid.Col span={6}>
                  <Stack gap="md">
                    <Box>
                      <Text size="sm" fw={500} c="dimmed">Format</Text>
                      <Group gap="sm">
                        {getFormatIcon(source.format)}
                        <Text>{getFormatLabel(source.format)}</Text>
                      </Group>
                    </Box>
                    <Box>
                      <Text size="sm" fw={500} c="dimmed">Status</Text>
                      <Badge 
                        variant="light" 
                        color={getStatusColor(source.deleted)}
                        size="lg"
                      >
                        {source.deleted ? 'Deleted' : 'Active'}
                      </Badge>
                    </Box>
                    <Box>
                      <Text size="sm" fw={500} c="dimmed">Created By</Text>
                      <Text>{source.created_by || 'Unknown'}</Text>
                    </Box>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Stack gap="md">
                    <Box>
                      <Text size="sm" fw={500} c="dimmed">Updated By</Text>
                      <Text>{source.updated_by || 'Never'}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" fw={500} c="dimmed">Created Date</Text>
                      <Text>{source.created ? new Date(source.created).toLocaleString() : 'Unknown'}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" fw={500} c="dimmed">Last Updated</Text>
                      <Text>{source.updated ? new Date(source.updated).toLocaleString() : 'Never'}</Text>
                    </Box>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card>

            {/* Media Information */}
            {source.tags && (source.tags.category || source.tags.content_type || source.tags.speaker) && (
              <Card withBorder>
                <Title order={4} mb="md">Media Information</Title>
                <Grid>
                  <Grid.Col span={6}>
                    <Stack gap="md">
                      {source.tags.category && (
                        <Box>
                          <Group gap="xs" mb={4}>
                            <IconActivity size={16} />
                            <Text size="sm" fw={500}>Category</Text>
                          </Group>
                          <Badge size="lg" variant="light" color="blue">
                            {source.tags.category}
                          </Badge>
                        </Box>
                      )}
                      {source.tags.content_type && (
                        <Box>
                          <Group gap="xs" mb={4}>
                            <IconCalendar size={16} />
                            <Text size="sm" fw={500}>Content Type</Text>
                          </Group>
                          <Badge size="lg" variant="light" color="green">
                            {source.tags.content_type}
                          </Badge>
                        </Box>
                      )}
                      {source.tags.venue && (
                        <Box>
                          <Group gap="xs" mb={4}>
                            <IconMapPin size={16} />
                            <Text size="sm" fw={500}>Venue</Text>
                          </Group>
                          <Text>{source.tags.venue}</Text>
                        </Box>
                      )}
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Stack gap="md">
                      {source.tags.speaker && (
                        <Box>
                          <Group gap="xs" mb={4}>
                            <IconActivity size={16} />
                            <Text size="sm" fw={500}>Speaker</Text>
                          </Group>
                          <Text size="lg" fw={700} c="blue">
                            {source.tags.speaker}
                          </Text>
                        </Box>
                      )}
                      {source.tags.duration && (
                        <Box>
                          <Group gap="xs" mb={4}>
                            <IconGauge size={16} />
                            <Text size="sm" fw={500}>Duration</Text>
                          </Group>
                          <Text>{source.tags.duration}</Text>
                        </Box>
                      )}
                      {source.tags.year && (
                        <Box>
                          <Group gap="xs" mb={4}>
                            <IconActivity size={16} />
                            <Text size="sm" fw={500}>Year</Text>
                          </Group>
                          <Badge size="md" variant="light" color="green">
                            {source.tags.year}
                          </Badge>
                        </Box>
                      )}
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Card>
            )}

            {/* Tags */}
            {source.tags && Object.keys(source.tags).length > 0 && (
              <Card withBorder>
                <Title order={4} mb="md">Tags & Metadata</Title>
                <Group gap="xs" wrap="wrap">
                  {Object.entries(source.tags).map(([key, value]) => (
                    <Badge key={key} size="lg" variant="light" color="blue">
                      {key}: {value}
                    </Badge>
                  ))}
                </Group>
              </Card>
            )}

            {/* Source Collection */}
            {source.source_collection && source.source_collection.length > 0 && (
              <Card withBorder>
                <Title order={4} mb="md">Source Collection</Title>
                <Stack gap="md">
                  {source.source_collection.map((collection) => (
                    <Paper key={collection.id} withBorder p="md">
                      <Group justify="space-between">
                        <Box>
                          <Text fw={500}>{collection.label || 'Unnamed Collection'}</Text>
                          <Text size="sm" c="dimmed">ID: {collection.id}</Text>
                        </Box>
                        <Button variant="light" size="sm">
                          View Collection
                        </Button>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Card>
            )}

            {/* Collected By */}
            {source.collected_by && source.collected_by.length > 0 && (
              <Card withBorder>
                <Title order={4} mb="md">Collected By</Title>
                <Stack gap="md">
                  {source.collected_by.map((collectorId) => (
                    <Paper key={collectorId} withBorder p="md">
                      <Group gap="sm">
                        <IconNetwork size={16} color="#228be6" />
                        <Box>
                          <Text fw={500}>Collector ID</Text>
                          <Text size="sm" c="dimmed" ff="monospace">{collectorId}</Text>
                        </Box>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Card>
            )}
          </Stack>
        </Tabs.Panel>



        {/* Analytics Tab */}
        <Tabs.Panel value="analytics" pt="xl">
          <Stack gap="xl">
            {analyticsLoading ? (
              <Card withBorder>
                <Stack gap="md" align="center" py="xl">
                  <Loader size="lg" />
                  <Text size="lg" c="dimmed">Loading analytics data...</Text>
                </Stack>
              </Card>
            ) : analyticsData ? (
              <>
                {/* Flow Usage Analytics */}
                <Card withBorder>
                  <Title order={4} mb="md">Flow Usage Statistics</Title>
                  <Grid>
                    <Grid.Col span={4}>
                      <Paper withBorder p="md" ta="center">
                        <Text size="xl" fw={700} c="blue">
                          {analyticsData.flowUsage.total_flows}
                        </Text>
                        <Text size="sm" c="dimmed">Total Flows</Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Paper withBorder p="md" ta="center">
                        <Text size="xl" fw={700} c="green">
                          {Math.round(analyticsData.flowUsage.average_flow_size / 1024 / 1024)} MB
                        </Text>
                        <Text size="sm" c="dimmed">Average Flow Size</Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Paper withBorder p="md" ta="center">
                        <Text size="xl" fw={700} c="orange">
                          {Math.round(analyticsData.flowUsage.estimated_storage_bytes / 1024 / 1024)} MB
                        </Text>
                        <Text size="sm" c="dimmed">Total Storage</Text>
                      </Paper>
                    </Grid.Col>
                  </Grid>
                  
                  {analyticsData.flowUsage.format_distribution && (
                    <Box mt="md">
                      <Text size="sm" fw={500} mb="sm">Format Distribution</Text>
                      <Group gap="xs">
                        {Object.entries(analyticsData.flowUsage.format_distribution).map(([format, count]) => (
                          <Badge key={format} size="lg" variant="light" color="blue">
                            {format.split(':').pop()}: {count as number}
                          </Badge>
                        ))}
                      </Group>
                    </Box>
                  )}
                </Card>

                {/* Storage Usage Analytics */}
                {analyticsData.storageUsage && (
                  <Card withBorder>
                    <Title order={4} mb="md">Storage Usage Analysis</Title>
                    <Text size="sm" c="dimmed">
                      Storage usage patterns and access statistics from VAST TAMS backend.
                    </Text>
                    {/* Add more storage analytics when available */}
                  </Card>
                )}

                {/* Time Range Analysis */}
                {analyticsData.timeRangeAnalysis && (
                  <Card withBorder>
                    <Title order={4} mb="md">Time Range Patterns</Title>
                    <Text size="sm" c="dimmed">
                      Time range patterns and duration analysis from VAST TAMS backend.
                    </Text>
                    {/* Add more time range analytics when available */}
                  </Card>
                )}
              </>
            ) : (
              <Card withBorder>
                <Stack gap="md" align="center" py="xl">
                  <IconChartBar size={64} color="#ccc" />
                  <Title order={4} c="dimmed">Analytics Unavailable</Title>
                  <Text size="lg" c="dimmed" ta="center">
                    Unable to load analytics data from VAST TAMS backend
                  </Text>
                  <Button 
                    variant="light" 
                    onClick={loadAnalytics}
                    loading={analyticsLoading}
                  >
                    Retry
                  </Button>
                </Stack>
              </Card>
            )}
          </Stack>
        </Tabs.Panel>

        {/* Configuration Tab */}
        <Tabs.Panel value="configuration" pt="xl">
          <Stack gap="xl">
            {configError && (
              <Alert 
                icon={<IconAlertCircle size={16} />} 
                color="red" 
                title="Configuration Error"
                withCloseButton
                onClose={() => setConfigError(null)}
              >
                {configError}
              </Alert>
            )}
            
            <Card withBorder>
              <Title order={4} mb="md">Source Configuration</Title>
              <Text size="sm" c="dimmed" mb="lg">
                Update source metadata using VAST TAMS API endpoints
              </Text>
              
              <Stack gap="md">
                {/* Label Configuration */}
                <Paper withBorder p="md">
                  <Group justify="space-between" align="flex-start">
                    <Box style={{ flex: 1 }}>
                      <Text fw={500} mb="xs">Label</Text>
                      <Text size="sm" c="dimmed" mb="sm">
                        Human-readable name for this source
                      </Text>
                      <Text size="sm" ff="monospace" c="dimmed">
                        Current: {source?.label || 'No label set'}
                      </Text>
                    </Box>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => {
                        const newLabel = prompt('Enter new label:', source?.label || '');
                        if (newLabel !== null && newLabel !== source?.label) {
                          updateSourceConfig('label', newLabel);
                        }
                      }}
                      loading={configLoading}
                    >
                      Update Label
                    </Button>
                  </Group>
                </Paper>

                {/* Description Configuration */}
                <Paper withBorder p="md">
                  <Group justify="space-between" align="flex-start">
                    <Box style={{ flex: 1 }}>
                      <Text fw={500} mb="xs">Description</Text>
                      <Text size="sm" c="dimmed" mb="sm">
                        Detailed description of this source
                      </Text>
                      <Text size="sm" ff="monospace" c="dimmed">
                        Current: {source?.description || 'No description set'}
                      </Text>
                    </Box>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => {
                        const newDescription = prompt('Enter new description:', source?.description || '');
                        if (newDescription !== null && newDescription !== source?.description) {
                          updateSourceConfig('description', newDescription);
                        }
                      }}
                      loading={configLoading}
                    >
                      Update Description
                    </Button>
                  </Group>
                </Paper>

                {/* Tags Configuration */}
                <Paper withBorder p="md">
                  <Text fw={500} mb="xs">Tags</Text>
                  <Text size="sm" c="dimmed" mb="sm">
                    Key-value metadata tags for this source
                  </Text>
                  
                  {source?.tags && Object.keys(source.tags).length > 0 ? (
                    <Stack gap="xs">
                      {Object.entries(source.tags).map(([key, value]) => (
                        <Group key={key} justify="space-between" align="center">
                          <Badge variant="light" color="blue">
                            {key}: {value}
                          </Badge>
                          <Button
                            variant="subtle"
                            color="red"
                            size="xs"
                            onClick={() => {
                              if (confirm(`Delete tag "${key}"?`)) {
                                // TODO: Implement tag deletion via VAST TAMS API
                                console.log('Delete tag:', key);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </Group>
                      ))}
                    </Stack>
                  ) : (
                    <Text size="sm" c="dimmed">No tags configured</Text>
                  )}
                  
                  <Button
                    variant="light"
                    size="sm"
                    mt="sm"
                    onClick={() => {
                      const key = prompt('Enter tag key:');
                      const value = prompt('Enter tag value:');
                      if (key && value) {
                        // TODO: Implement tag addition via VAST TAMS API
                        console.log('Add tag:', key, value);
                      }
                    }}
                    loading={configLoading}
                  >
                    Add Tag
                  </Button>
                </Paper>

                {/* Format Information (Read-only) */}
                <Paper withBorder p="md">
                  <Text fw={500} mb="xs">Format</Text>
                  <Text size="sm" c="dimmed" mb="sm">
                    Media format type (read-only)
                  </Text>
                  <Group gap="sm">
                    {getFormatIcon(source?.format || '')}
                    <Text>{getFormatLabel(source?.format || '')}</Text>
                    <Badge variant="light" color="gray">
                      {source?.format}
                    </Badge>
                  </Group>
                </Paper>
              </Stack>
            </Card>
          </Stack>
        </Tabs.Panel>


      </Tabs>

      {/* Delete Confirmation Modal */}
      <EnhancedDeleteModal
        opened={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Source"
        itemName={source.label || 'Unnamed Source'}
        itemType="source"
        showCascadeOption={true}
        defaultDeletedBy="admin"
      />
    </Container>
  );
}
