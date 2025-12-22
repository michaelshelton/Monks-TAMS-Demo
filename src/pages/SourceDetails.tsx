import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Anchor,
  Collapse,
  Modal,
  TextInput,
  Textarea
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
import { SourceTagsManager } from '../components/SourceTagsManager';
import { apiClient } from '../services/api';

// TAMS Source interface (based on API response)
interface Source {
  id: string;
  format?: string;
  label?: string;
  description?: string;
  created?: string;
  updated?: string;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
  flows?: Array<{
    id: string;
    label?: string;
    format: string;
    tags?: Record<string, string | string[]>;
    created?: string;
    updated?: string;
  }>;
  // Soft delete fields (if supported)
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
  const [showInfoBox, setShowInfoBox] = useState(true); // State for collapsible info box
  
  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // Configuration state
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState('');
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [editingDescription, setEditingDescription] = useState('');
  const [flowsWithIds, setFlowsWithIds] = useState<Record<string, string>>({}); // Map flow characteristics to IDs

  // Load source data
  useEffect(() => {
    if (sourceId) {
      loadSource();
    }
  }, [sourceId]);

  // Load analytics when analytics tab is selected
  useEffect(() => {
    if (activeTab === 'analytics' && source) {
      loadAnalytics();
    }
  }, [activeTab, source]);

  const loadSource = async () => {
    if (!sourceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching source details from TAMS API for ID:', sourceId);
      const sourceData = await apiClient.getSource(sourceId);
      console.log('TAMS source details response:', sourceData);
      
      // Log flows to debug
      if (sourceData?.flows) {
        console.log('Source flows:', sourceData.flows);
        sourceData.flows.forEach((flow: any, index: number) => {
          console.log(`Flow ${index}:`, { id: flow.id, label: flow.label, format: flow.format, fullFlow: flow });
        });
        
        // If any flows are missing IDs, try to fetch them from the flows endpoint
        // Workaround for Issue #2: Flow IDs missing in source response
        // Note: Issue #1 is now fixed, so this workaround should work correctly
        const flowsMissingIds = sourceData.flows.filter((f: any) => !f.id && !(f as any)._id);
        if (flowsMissingIds.length > 0) {
          console.log('Some flows are missing IDs (Issue #2), attempting to fetch flow IDs from /flows endpoint...');
          try {
            // Issue #1 is fixed, so this should work now
            // Try to get flows by source_id to find the IDs
            const flowsResponse = await apiClient.getFlows({ 
              source_id: sourceId,
            } as any);
            
            if (flowsResponse?.data && Array.isArray(flowsResponse.data)) {
              // Create a map of flow characteristics to IDs
              // Note: /flows endpoint returns _id (MongoDB format), handle both id and _id
              const flowIdMap: Record<string, string> = {};
              flowsResponse.data.forEach((flow: any) => {
                const flowId = flow.id || flow._id;
                if (flowId) {
                  // Create a key from flow characteristics for matching
                  const key = `${flow.label || ''}|${flow.format || ''}|${JSON.stringify(flow.tags || {})}`;
                  flowIdMap[key] = flowId;
                }
              });
              
              // Match flows from source response to flows with IDs
              const updatedFlows = sourceData.flows.map((flow: any) => {
                if (!flow.id && !(flow as any)._id) {
                  const key = `${flow.label || ''}|${flow.format || ''}|${JSON.stringify(flow.tags || {})}`;
                  const matchedId = flowIdMap[key];
                  if (matchedId) {
                    console.log(`Matched flow "${flow.label}" to ID: ${matchedId}`);
                    return { ...flow, id: matchedId };
                  }
                }
                return flow;
              });
              
              sourceData.flows = updatedFlows;
              setFlowsWithIds(flowIdMap);
            }
          } catch (err) {
            console.warn('Could not fetch flows to get IDs:', err);
            // Continue without IDs - buttons will be disabled
            // Note: Issue #1 is fixed, so if this fails it's likely a different issue
          }
        }
      }
      
      setSource(sourceData);
    } catch (err: any) {
      console.error('TAMS source details API error:', err);
      
      // Set appropriate error message based on error type
      if (err?.message?.includes('500') || err?.message?.includes('Internal Server Error')) {
        setError('TAMS backend temporarily unavailable - please try again later');
      } else if (err?.message?.includes('Network') || err?.message?.includes('fetch') || err?.message?.includes('CORS')) {
        setError('Network connection issue - please check your connection and try again');
      } else if (err?.message?.includes('404')) {
        setError('Source not found - please check the source ID and try again');
      } else {
        // Use error message directly if it already contains "TAMS API error", otherwise prefix it
        const errorMsg = err?.message || 'Unknown error';
        setError(errorMsg.includes('TAMS API error') ? errorMsg : `TAMS API error: ${errorMsg}`);
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
      // Use flows data from source response (API returns flows with source)
      if (source && source.flows) {
        const flows = source.flows;
        const flowUsage = {
          total_flows: flows.length,
          format_distribution: flows.reduce((acc: Record<string, number>, flow: any) => {
            const format = flow.format || 'unknown';
            acc[format] = (acc[format] || 0) + 1;
            return acc;
          }, {}),
          average_flow_size: 0, // Not available from API
          estimated_storage_bytes: 0 // Not available from API
        };
        
        setAnalyticsData({
          flowUsage,
          flows: flows
        });
      } else {
        setAnalyticsData(null);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setAnalyticsData(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleUpdateDescription = async () => {
    if (!sourceId) return;
    
    setConfigLoading(true);
    setConfigError(null);
    
    try {
      if (editingDescription.trim()) {
        await apiClient.setSourceDescription(sourceId, editingDescription.trim());
      } else {
        // If empty, delete the description
        await apiClient.deleteSourceDescription(sourceId);
      }
      
      // Reload source data to reflect changes
      await loadSource();
      
      // Close modal
      setShowDescriptionModal(false);
      setEditingDescription('');
    } catch (err: any) {
      console.error('Failed to update description:', err);
      setConfigError(`Failed to update description: ${err.message}`);
    } finally {
      setConfigLoading(false);
    }
  };

  const handleDeleteDescription = async () => {
    if (!sourceId) return;
    
    setConfigLoading(true);
    setConfigError(null);
    
    try {
      await apiClient.deleteSourceDescription(sourceId);
      
      // Reload source data to reflect changes
      await loadSource();
      
      // Close modal if open
      setShowDescriptionModal(false);
      setEditingDescription('');
    } catch (err: any) {
      console.error('Failed to delete description:', err);
      setConfigError(`Failed to delete description: ${err.message}`);
    } finally {
      setConfigLoading(false);
    }
  };

  const handleUpdateLabel = async () => {
    if (!editingLabel.trim() || !sourceId) return;
    
    setConfigLoading(true);
    setConfigError(null);
    
    try {
      await apiClient.setSourceLabel(sourceId, editingLabel.trim());
      
      // Reload source data to reflect changes
      await loadSource();
      
      // Close modal
      setShowLabelModal(false);
      setEditingLabel('');
    } catch (err: any) {
      console.error('Failed to update label:', err);
      setConfigError(`Failed to update label: ${err.message}`);
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
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          if (isLast) {
            return (
              <Text key={index} c="dimmed" component="span">
                {item.title}
              </Text>
            );
          }
          return (
            <Anchor
              key={index}
              component={Link}
              to={item.href}
              c="blue"
            >
              {item.title}
            </Anchor>
          );
        })}
      </Breadcrumbs>

      {/* Header */}
      <Group justify="space-between" align="flex-start" mb="lg">
        <Box>
          <Group gap="sm" align="center" mb="xs">
            {source.format && getFormatIcon(source.format)}
            <Title order={2} className="dark-text-primary">{source.label || 'Unnamed Source'}</Title>
            {source.deleted !== undefined && (
              <Badge 
                variant="light" 
                color={getStatusColor(source.deleted)}
                size="lg"
              >
                {source.deleted ? 'Deleted' : 'Active'}
              </Badge>
            )}
          </Group>
          <Text c="dimmed" size="sm" mb="xs" className="dark-text-secondary">
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
            onClick={() => {
              navigate('/sources');
            }}
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
          title="TAMS Connection Error"
          withCloseButton
          onClose={() => setError(null)}
          mb="lg"
        >
          {error}
        </Alert>
      )}

      {/* VAST TAMS Info - Toggleable */}
      {!error && (
        <Alert 
          icon={<IconInfoCircle size={16} />} 
          color="blue" 
          title={
            <Group justify="space-between" w="100%">
              <Text>Source Details in TAMS</Text>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setShowInfoBox(!showInfoBox)}
                rightSection={showInfoBox ? <IconArrowLeft size={12} /> : <IconArrowLeft size={12} style={{ transform: 'rotate(-90deg)' }} />}
              >
                {showInfoBox ? 'Hide' : 'Show'} Info
              </Button>
            </Group>
          }
          mb="lg"
        >
          <Collapse in={showInfoBox}>
            <Stack gap="xs">
              <Text size="sm">
                This page shows detailed information about a specific <strong>Source</strong> - the original media input 
                container in the TAMS system. Here you can view metadata, analytics, and configuration options.
              </Text>
              <Text size="sm">
                Sources contain information like format, tags, creation details, and relationships to flows and collections. 
                This detailed view helps you understand the content structure and manage source properties.
              </Text>
            </Stack>
          </Collapse>
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
            <Card withBorder className="search-interface">
              <Title order={4} mb="md" className="dark-text-primary">Basic Information</Title>
              <Grid>
                <Grid.Col span={6}>
                  <Stack gap="md">
                    {source.format && (
                      <Box>
                        <Text size="sm" fw={500} c="dimmed">Format</Text>
                        <Group gap="sm">
                          {getFormatIcon(source.format)}
                          <Text>{getFormatLabel(source.format)}</Text>
                        </Group>
                      </Box>
                    )}
                    {source.deleted !== undefined && (
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
                    )}
                  </Stack>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Stack gap="md">
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
              <Card withBorder className="search-interface">
                <Title order={4} mb="md" className="dark-text-primary">Media Information</Title>
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
              <Card withBorder className="search-interface">
                <Title order={4} mb="md" className="dark-text-primary">Tags & Metadata</Title>
                <Group gap="xs" wrap="wrap">
                  {Object.entries(source.tags).map(([key, value]) => (
                    <Badge key={key} size="lg" variant="light" color="blue">
                      {key}: {value}
                    </Badge>
                  ))}
                </Group>
              </Card>
            )}

            {/* Associated Flows */}
            {source.flows && source.flows.length > 0 && (
              <Card withBorder>
                <Title order={4} mb="md">Associated Flows</Title>
                <Text size="sm" c="dimmed" mb="md">
                  Flows associated with this source
                </Text>
                <Stack gap="md">
                  {source.flows.map((flow, index) => (
                    <Paper key={flow.id || `flow-${index}`} withBorder p="md">
                      <Group justify="space-between" align="flex-start">
                        <Box style={{ flex: 1 }}>
                          <Group gap="sm" mb="xs">
                            {getFormatIcon(flow.format)}
                            <Text fw={500}>{flow.label || 'Unnamed Flow'}</Text>
                            <Badge variant="light" color="blue">
                              {getFormatLabel(flow.format)}
                            </Badge>
                          </Group>
                          <Text size="sm" c="dimmed" ff="monospace" mb="xs">
                            ID: {flow.id}
                          </Text>
                          {flow.tags && Object.keys(flow.tags).length > 0 && (
                            <Group gap="xs" mt="xs">
                              {Object.entries(flow.tags).slice(0, 3).map(([key, value]) => (
                                <Badge key={key} size="sm" variant="light" color="gray">
                                  {key}: {Array.isArray(value) ? value.join(', ') : value}
                                </Badge>
                              ))}
                            </Group>
                          )}
                          {flow.created && (
                            <Text size="xs" c="dimmed" mt="xs">
                              Created: {new Date(flow.created).toLocaleString()}
                            </Text>
                          )}
                        </Box>
                        <Button 
                          variant="light" 
                          size="sm"
                          onClick={async () => {
                            let flowId = flow?.id || (flow as any)?._id;
                            
                            // If no ID, try to find it by matching characteristics
                            if (!flowId && source?.flows) {
                              const flowIndex = source.flows.indexOf(flow);
                              try {
                                // Try to fetch flows for this source
                                const flowsResponse = await apiClient.getFlows({ 
                                  source_id: sourceId 
                                } as any);
                                
                                if (flowsResponse?.data && Array.isArray(flowsResponse.data) && flowsResponse.data[flowIndex]) {
                                  flowId = flowsResponse.data[flowIndex].id;
                                  console.log(`Found flow ID by position ${flowIndex}:`, flowId);
                                }
                              } catch (err) {
                                console.warn('Could not fetch flows to get ID:', err);
                              }
                            }
                            
                            if (flowId) {
                              navigate(`/flow-details/${flowId}`);
                            } else {
                              console.error('Flow ID is missing:', flow);
                              setError(`Cannot navigate to flow: Flow ID is missing. The backend needs to be fixed to include flow IDs in the source response.`);
                            }
                          }}
                          disabled={!flow?.id && !(flow as any)?._id}
                        >
                          View Flow
                        </Button>
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
                {/* Flow Statistics */}
                <Card withBorder>
                  <Title order={4} mb="md">Flow Statistics</Title>
                  <Grid>
                    <Grid.Col span={4}>
                      <Paper withBorder p="md" ta="center">
                        <Text size="xl" fw={700} c="blue">
                          {analyticsData.flowUsage.total_flows}
                        </Text>
                        <Text size="sm" c="dimmed">Total Flows</Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={8}>
                      {analyticsData.flowUsage.format_distribution && Object.keys(analyticsData.flowUsage.format_distribution).length > 0 && (
                        <Box>
                          <Text size="sm" fw={500} mb="sm">Format Distribution</Text>
                          <Group gap="xs">
                            {Object.entries(analyticsData.flowUsage.format_distribution).map(([format, count]) => (
                              <Badge key={format} size="lg" variant="light" color="blue">
                                {getFormatLabel(format)}: {count as number}
                              </Badge>
                            ))}
                          </Group>
                        </Box>
                      )}
                    </Grid.Col>
                  </Grid>
                </Card>

                {/* Flow List */}
                {analyticsData.flows && analyticsData.flows.length > 0 && (
                  <Card withBorder>
                    <Title order={4} mb="md">Associated Flows</Title>
                    <Stack gap="md">
                      {analyticsData.flows.map((flow: any, index: number) => (
                        <Paper key={flow.id || `flow-${index}`} withBorder p="md">
                          <Group justify="space-between" align="flex-start">
                            <Box style={{ flex: 1 }}>
                              <Group gap="sm" mb="xs">
                                {getFormatIcon(flow.format)}
                                <Text fw={500}>{flow.label || 'Unnamed Flow'}</Text>
                                <Badge variant="light" color="blue">
                                  {getFormatLabel(flow.format)}
                                </Badge>
                              </Group>
                              <Text size="sm" c="dimmed" ff="monospace" mb="xs">
                                ID: {flow.id}
                              </Text>
                              {flow.tags && Object.keys(flow.tags).length > 0 && (
                                <Group gap="xs" mt="xs">
                                  {Object.entries(flow.tags).slice(0, 5).map(([key, value]) => (
                                    <Badge key={key} size="sm" variant="light" color="gray">
                                      {key}: {Array.isArray(value) ? value.join(', ') : String(value ?? '')}
                                    </Badge>
                                  ))}
                                </Group>
                              )}
                              {flow.created && (
                                <Text size="xs" c="dimmed" mt="xs">
                                  Created: {new Date(flow.created).toLocaleString()}
                                </Text>
                              )}
                            </Box>
                            <Button 
                              variant="light" 
                              size="sm"
                              onClick={async () => {
                                let flowId = flow?.id || (flow as any)?._id;
                                
                                // If no ID, try to find it by matching position in analytics flows
                                if (!flowId && analyticsData?.flows) {
                                  const flowIndex = analyticsData.flows.indexOf(flow);
                                  try {
                                    // Try to fetch flows for this source
                                    const flowsResponse = await apiClient.getFlows({ 
                                      source_id: sourceId 
                                    } as any);
                                    
                                    if (flowsResponse?.data && Array.isArray(flowsResponse.data) && flowsResponse.data[flowIndex]) {
                                      flowId = flowsResponse.data[flowIndex].id;
                                      console.log(`Found flow ID by position ${flowIndex}:`, flowId);
                                    }
                                  } catch (err) {
                                    console.warn('Could not fetch flows to get ID:', err);
                                  }
                                }
                                
                                if (flowId) {
                                  navigate(`/flow-details/${flowId}`);
                                } else {
                                  console.error('Flow ID is missing:', flow);
                                  setError(`Cannot navigate to flow: Flow ID is missing. The backend needs to be fixed to include flow IDs in the source response.`);
                                }
                              }}
                              disabled={!flow?.id && !(flow as any)?._id}
                            >
                              View Details
                            </Button>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  </Card>
                )}
              </>
            ) : (
              <Card withBorder>
                <Stack gap="md" align="center" py="xl">
                  <IconChartBar size={64} color="#ccc" />
                  <Title order={4} c="dimmed">Analytics Unavailable</Title>
                  <Text size="lg" c="dimmed" ta="center">
                    Unable to load analytics data from TAMS backend
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
                      <Text size="sm" fw={500}>
                        {source?.label || <Text component="span" c="dimmed" fs="italic">No label set</Text>}
                      </Text>
                    </Box>
                    <Button
                      variant="light"
                      size="sm"
                      leftSection={<IconEdit size={14} />}
                      onClick={() => {
                        setEditingLabel(source?.label || '');
                        setShowLabelModal(true);
                      }}
                      disabled={disabled}
                    >
                      Edit Label
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
                      {source?.description ? (
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {source.description}
                        </Text>
                      ) : (
                        <Text size="sm" c="dimmed" fs="italic">No description set</Text>
                      )}
                    </Box>
                    <Group gap="xs">
                      <Button
                        variant="light"
                        size="sm"
                        leftSection={<IconEdit size={14} />}
                        onClick={() => {
                          setEditingDescription(source?.description || '');
                          setShowDescriptionModal(true);
                          setConfigError(null);
                        }}
                        disabled={disabled || configLoading}
                      >
                        {source?.description ? 'Edit' : 'Add'}
                      </Button>
                      {source?.description && (
                        <Button
                          variant="light"
                          size="sm"
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          onClick={handleDeleteDescription}
                          loading={configLoading}
                          disabled={disabled}
                        >
                          Delete
                        </Button>
                      )}
                    </Group>
                  </Group>
                </Paper>

                {/* Tags Configuration */}
                {sourceId ? (
                  <SourceTagsManager
                    sourceId={sourceId}
                    initialTags={source?.tags || {}}
                    disabled={disabled}
                    onTagsChange={(tags: Record<string, string>) => {
                      // Update source tags in parent component
                      setSource(prev => prev ? { ...prev, tags } : null);
                      console.log('Source tags updated:', tags);
                    }}
                  />
                ) : (
                  <Paper withBorder p="md">
                    <Alert icon={<IconAlertCircle size={16} />} color="red" title="Source ID Required">
                      Source ID is required to manage source tags.
                    </Alert>
                  </Paper>
                )}

                {/* Format Information (Read-only) */}
                <Paper withBorder p="md">
                  <Text fw={500} mb="xs">Format</Text>
                  <Text size="sm" c="dimmed" mb="sm">
                    Media format type (read-only)
                  </Text>
                  {source?.format ? (
                    <Group gap="sm">
                      {getFormatIcon(source.format)}
                      <Text>{getFormatLabel(source.format)}</Text>
                      <Badge variant="light" color="gray">
                        {source.format}
                      </Badge>
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed">Format not specified</Text>
                  )}
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

      {/* Edit Label Modal */}
      <Modal
        opened={showLabelModal}
        onClose={() => {
          setShowLabelModal(false);
          setEditingLabel('');
        }}
        title="Edit Source Label"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Update the human-readable label for this source. The label helps identify the source in lists and displays.
          </Text>
          
          <TextInput
            label="Label"
            placeholder="Enter source label"
            value={editingLabel}
            onChange={(event) => setEditingLabel(event.currentTarget.value)}
            required
            autoFocus
          />
          
          {configError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
              {configError}
            </Alert>
          )}
          
          <Group gap="xs" justify="flex-end">
            <Button 
              variant="light" 
              onClick={() => {
                setShowLabelModal(false);
                setEditingLabel('');
                setConfigError(null);
              }}
              disabled={configLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateLabel}
              loading={configLoading}
              disabled={!editingLabel.trim()}
            >
              Update Label
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit Description Modal */}
      <Modal
        opened={showDescriptionModal}
        onClose={() => {
          setShowDescriptionModal(false);
          setEditingDescription('');
          setConfigError(null);
        }}
        title={source?.description ? "Edit Source Description" : "Add Source Description"}
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Update the detailed description for this source. The description provides additional context and information about the source.
          </Text>
          
          <Textarea
            label="Description"
            placeholder="Enter source description"
            value={editingDescription}
            onChange={(event) => setEditingDescription(event.currentTarget.value)}
            minRows={4}
            maxRows={8}
            autosize
            autoFocus
          />
          
          {configError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
              {configError}
            </Alert>
          )}
          
          <Group gap="xs" justify="flex-end">
            <Button 
              variant="light" 
              onClick={() => {
                setShowDescriptionModal(false);
                setEditingDescription('');
                setConfigError(null);
              }}
              disabled={configLoading}
            >
              Cancel
            </Button>
            {source?.description && (
              <Button
                variant="light"
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={async () => {
                  await handleDeleteDescription();
                }}
                loading={configLoading}
              >
                Delete
              </Button>
            )}
            <Button
              onClick={handleUpdateDescription}
              loading={configLoading}
            >
              {source?.description ? 'Update Description' : 'Add Description'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
