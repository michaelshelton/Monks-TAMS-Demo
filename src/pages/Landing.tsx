import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Button, 
  Box, 
  Group, 
  Card, 
  SimpleGrid, 
  Stack, 
  Badge, 
  Grid,
  Paper,
  Progress,
  RingProgress,
  Center,
  Loader,
  Alert,
  Divider
} from '@mantine/core';
import { 
  IconClock, 
  IconSearch, 
  IconDatabase, 
  IconArrowRight,
  IconVideo,
  IconBroadcast,
  IconTimeline,
  IconBolt,
  IconTarget,
  IconTrendingUp,
  IconActivity,
  IconShield,
  IconShieldCheck,
  IconPlayerPlay,
  IconCheck,
  IconServer,
  IconChartBar,
  IconInfoCircle,
  IconExternalLink,
  IconContainer,
  IconWebhook,
  IconTag,
  IconRadio
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';

interface SystemStats {
  sources: number;
  flows: number;
  totalSegments: number;
  totalStorageGB: number;
  totalDurationHours: number;
  objects: number;
  webhooks: number;
  liveFlows: number;
  health: any;
  serviceInfo: any;
  storageBackends: any[];
  loading: boolean;
  error: string | null;
  recentFlows: any[];
}

export default function Landing() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats>({
    sources: 0,
    flows: 0,
    totalSegments: 0,
    totalStorageGB: 0,
    totalDurationHours: 0,
    objects: 0,
    webhooks: 0,
    liveFlows: 0,
    health: null,
    serviceInfo: null,
    storageBackends: [],
    loading: true,
    error: null,
    recentFlows: []
  });

  // Load system data on component mount and refresh periodically
  useEffect(() => {
    loadSystemData();
    const interval = setInterval(loadSystemData, 120000); // Refresh every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    setStats(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Ensure API client is initialized before making requests
      // This ensures consistent behavior on first load vs refresh
      if (apiClient && typeof (apiClient as any).ensureApiClientInitialized === 'function') {
        await (apiClient as any).ensureApiClientInitialized();
      }
      
      // Load multiple data sources in parallel
      const [
        health,
        sourcesResponse,
        flowsResponse,
        objectsResponse,
        webhooksResponse,
        serviceInfo
      ] = await Promise.all([
        apiClient.getHealth().catch(() => null),
        // Get all sources to get accurate count (API returns { data: [...], pagination: { count } })
        // Note: We rely on pagination.count from headers (X-Paging-Count) for total count
        apiClient.getSources().catch(() => ({ data: [], pagination: { count: 0 } })),
        // Try flows - if it fails, we'll handle gracefully
        apiClient.getFlows().catch(() => {
          // If flows endpoint fails, try with limit parameter
          return apiClient.getFlows({ limit: 100 }).catch(() => ({ data: [], pagination: { count: 0 } }));
        }),
        // Objects endpoint not implemented in backend (Issue #6 in BACKEND_FIXES_NEEDED.md)
        Promise.resolve({ data: [], pagination: { count: 0 } }),
        // Webhooks endpoint not available in backend (documented in FRONTEND_GAP_ANALYSIS.md)
        Promise.resolve({ data: [], pagination: { count: 0 } }),
        apiClient.getService().catch(() => null)
      ]);
      
      // Handle API response formats
      // The monks_tams_api returns: { sources: [...], count: 20 }
      // BBC TAMS format would be: { data: [...], pagination: { count } }
      let sourcesCount = 0;
      const sourcesResponseAny = sourcesResponse as any;
      
      // Check for monks_tams_api format first: { sources: [...], count }
      if (sourcesResponseAny && sourcesResponseAny.sources && Array.isArray(sourcesResponseAny.sources)) {
        // monks_tams_api format: { sources: [...], count }
        // Prefer count if available (total count), otherwise use array length
        sourcesCount = sourcesResponseAny.count ?? sourcesResponseAny.sources.length;
        
        console.log('Landing page - Sources (monks_tams_api format):', {
          count: sourcesResponseAny.count,
          sourcesLength: sourcesResponseAny.sources.length,
          finalCount: sourcesCount,
          firstSourceId: sourcesResponseAny.sources[0]?.id
        });
      } else if (sourcesResponse && typeof sourcesResponse === 'object' && 'data' in sourcesResponse) {
        // BBC TAMS format: { data: [...], pagination: { count } }
        if (Array.isArray(sourcesResponse.data)) {
          const paginationCount = sourcesResponse.pagination?.count;
          const dataLength = sourcesResponse.data.length;
          
          // Prefer pagination.count if available, otherwise use data.length
          if (paginationCount !== undefined && paginationCount !== null) {
            sourcesCount = paginationCount;
          } else {
            sourcesCount = dataLength;
          }
          
          console.log('Landing page - Sources (BBC TAMS format):', {
            dataLength,
            paginationCount: sourcesResponse.pagination?.count,
            finalCount: sourcesCount,
            firstSourceId: sourcesResponse.data[0]?.id
          });
        }
      } else if (Array.isArray(sourcesResponse)) {
        // Direct array response
        sourcesCount = (sourcesResponse as any[]).length;
        console.log('Landing page - Sources (array format):', sourcesCount);
      } else if (sourcesResponseAny && Array.isArray(sourcesResponseAny.data)) {
        // Another format with data array
        sourcesCount = sourcesResponseAny.data.length;
        console.log('Landing page - Sources (data array format):', sourcesCount);
      } else {
        console.warn('Landing page - Unknown sources response format:', sourcesResponse);
      }
      
      // Flows: array directly or BBC TAMS format { data: [...], pagination: { count } }
      // Note: API returns _id (MongoDB format), normalize to id for frontend
      let flowsData: any[] = [];
      let flowsCount = 0;
      const flowsResponseAny = flowsResponse as any;
      if (Array.isArray(flowsResponse)) {
        // New API returns array directly - normalize _id to id
        flowsData = flowsResponse.map((flow: any) => ({
          ...flow,
          id: flow.id || flow._id // Normalize _id to id
        }));
        flowsCount = flowsResponse.length;
      } else if (flowsResponse && flowsResponse.data && Array.isArray(flowsResponse.data)) {
        // BBC TAMS format - normalize _id to id
        flowsData = flowsResponse.data.map((flow: any) => ({
          ...flow,
          id: flow.id || flow._id // Normalize _id to id
        }));
        flowsCount = flowsResponse.pagination?.count ?? flowsResponse.data.length;
      } else if (flowsResponseAny && flowsResponseAny.flows && Array.isArray(flowsResponseAny.flows)) {
        // Alternative format - normalize _id to id
        flowsData = flowsResponseAny.flows.map((flow: any) => ({
          ...flow,
          id: flow.id || flow._id // Normalize _id to id
        }));
        flowsCount = flowsResponseAny.count ?? flowsResponseAny.flows.length;
      } else if (flowsResponseAny && flowsResponseAny.error) {
        // API returned an error - log it but don't crash
        console.warn('Flows API error:', flowsResponseAny.error);
        flowsData = [];
        flowsCount = 0;
      }
      
      // Objects: endpoint not implemented in backend (always 0)
      const objectsCount = 0;
      
      // Webhooks: endpoint not available in backend (always 0)
      const webhooksCount = 0;
      
      // Analyze flows for additional stats
      let totalSegments = 0;
      let totalStorageGB = 0;
      let totalDurationSeconds = 0;
      let liveFlows = 0;
      const recentFlows = flowsData.slice(0, 5);
      
      flowsData.forEach((flow: any) => {
        // Count segments
        if (flow.total_segments) {
          totalSegments += flow.total_segments;
        }
        
        // Estimate duration
        if (flow.total_duration) {
          totalDurationSeconds += flow.total_duration;
        } else if (flow.total_segments) {
          totalDurationSeconds += flow.total_segments * 10;
        }
        
        // Estimate storage
        if (flow.total_segments) {
          totalStorageGB += (flow.total_segments * 1) / 1024; // Convert MB to GB
        }
        
        // Count live flows
        if (flow.tags?.stream_type?.includes('live') || flow.tags?.stream_type === 'live') {
          liveFlows++;
        }
        
        // Note: Marker flows concept is not clearly defined in the API
        // QC markers exist via /api/v1/flows/:flowId/qc-markers but that's different
        // Removing marker flow counting as it's not a clear API concept
        
      });
      
      const totalDurationHours = totalDurationSeconds / 3600;
      
      // Try to get storage backends
      let storageBackends: any[] = [];
      try {
        const storageData = await apiClient.getStorageBackends().catch(() => null);
        if (storageData) {
          storageBackends = storageData.storage_backends || [];
        }
      } catch (e) {
        // Ignore storage backend errors
      }
      
      setStats({
        sources: sourcesCount,
        flows: flowsCount,
        totalSegments,
        totalStorageGB,
        totalDurationHours,
        objects: objectsCount,
        webhooks: webhooksCount,
        liveFlows,
        health,
        serviceInfo,
        storageBackends,
        loading: false,
        error: null,
        recentFlows
      });
      
    } catch (error) {
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load system data'
      }));
    }
  };

  // Placeholder data for demo when no real data is available
  const getPlaceholderValue = (key: string): number => {
    const placeholders: Record<string, number> = {
      sources: 12,
      flows: 45,
      totalSegments: 1250,
      totalStorageGB: 245.8,
      totalDurationHours: 18.5,
      objects: 3200,
      flowCollections: 8,
      webhooks: 5,
      liveFlows: 12
    };
    return placeholders[key] || 0;
  };

  const formatNumber = (num: number): string => {
    if (num === 0) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatStorage = (gb: number): string => {
    if (gb === 0) return '0 GB';
    if (gb >= 1000) return `${(gb / 1000).toFixed(2)} TB`;
    return `${gb.toFixed(2)} GB`;
  };

  const formatDuration = (hours: number): string => {
    if (hours === 0) return '0 min';
    if (hours >= 24) return `${(hours / 24).toFixed(1)} days`;
    if (hours >= 1) return `${hours.toFixed(1)} hours`;
    return `${(hours * 60).toFixed(0)} minutes`;
  };

  // Use real data if available, otherwise use placeholders
  // Always show placeholders if loading or if values are 0
  const displayStats = {
    sources: (!stats.loading && stats.sources > 0) ? stats.sources : getPlaceholderValue('sources'),
    flows: (!stats.loading && stats.flows > 0) ? stats.flows : getPlaceholderValue('flows'),
    totalSegments: (!stats.loading && stats.totalSegments > 0) ? stats.totalSegments : getPlaceholderValue('totalSegments'),
    totalStorageGB: (!stats.loading && stats.totalStorageGB > 0) ? stats.totalStorageGB : getPlaceholderValue('totalStorageGB'),
    totalDurationHours: (!stats.loading && stats.totalDurationHours > 0) ? stats.totalDurationHours : getPlaceholderValue('totalDurationHours'),
    objects: (!stats.loading && stats.objects > 0) ? stats.objects : getPlaceholderValue('objects'),
    webhooks: (!stats.loading && stats.webhooks > 0) ? stats.webhooks : getPlaceholderValue('webhooks'),
    liveFlows: (!stats.loading && stats.liveFlows > 0) ? stats.liveFlows : getPlaceholderValue('liveFlows')
  };

  const statCards = [
    {
      title: 'Active Sources',
      value: displayStats.sources,
      formatted: formatNumber(displayStats.sources),
      icon: <IconBroadcast size={32} />,
      color: 'blue',
      link: '/sources',
      description: 'Media input sources',
      isPlaceholder: stats.loading || stats.sources === 0
    },
    {
      title: 'Media Flows',
      value: displayStats.flows,
      formatted: formatNumber(displayStats.flows),
      icon: <IconVideo size={32} />,
      color: 'green',
      link: '/flows',
      description: 'Processing streams',
      isPlaceholder: stats.loading || stats.flows === 0
    },
    {
      title: 'Total Segments',
      value: displayStats.totalSegments,
      formatted: formatNumber(displayStats.totalSegments),
      icon: <IconVideo size={32} />,
      color: 'orange',
      link: '/flows',
      description: 'Time-addressable segments',
      isPlaceholder: stats.loading || stats.totalSegments === 0
    },
    {
      title: 'Storage Used',
      value: displayStats.totalStorageGB,
      formatted: formatStorage(displayStats.totalStorageGB),
      icon: <IconDatabase size={32} />,
      color: 'purple',
      link: '/flows',
      description: 'Total media storage',
      isPlaceholder: stats.loading || stats.totalStorageGB === 0
    },
    {
      title: 'Total Duration',
      value: displayStats.totalDurationHours,
      formatted: formatDuration(displayStats.totalDurationHours),
      icon: <IconClock size={32} />,
      color: 'teal',
      link: '/flows',
      description: 'Cumulative media time',
      isPlaceholder: stats.loading || stats.totalDurationHours === 0
    }
  ];


  return (
    <Box style={{ margin: 0, padding: 0 }}>
      {/* Hero Section with Key Stats */}
      <Box 
        py="lg" 
        style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Container size="xl" px="xl">
          <Stack align="center" gap="lg" py="lg">
            <Title order={1} ta="center" maw={900} c="white" size="3rem">
              TAMS Explorer
            </Title>
            <Text size="lg" ta="center" maw={700} c="white" opacity={0.95}>
              Explore and navigate TAMS data with real-time insights into sources, flows, segments, and more
            </Text>
            
            {stats.error ? (
              <Alert icon={<IconInfoCircle size={16} />} color="yellow" title="Data Loading">
                {stats.error}
              </Alert>
            ) : (
              <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} spacing="md" mt="xl" style={{ width: '100%' }}>
                {statCards.map((card, i) => {
                  return (
                    <div
                      key={i}
                      onClick={() => navigate(card.link)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                      }}
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        minHeight: '160px',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        zIndex: 1
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '12px',
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        zIndex: 2
                      }}>
                        <div style={{ 
                          color: '#ffffff', 
                          fontSize: '32px', 
                          lineHeight: 1,
                          display: 'block',
                          opacity: 1
                        }}>
                          {card.icon}
                        </div>
                        <div 
                          style={{ 
                            color: '#ffffff', 
                            fontSize: '28px', 
                            fontWeight: 700,
                            textAlign: 'center',
                            lineHeight: 1.2,
                            display: 'block',
                            opacity: 1,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {card.formatted || '0'}
                        </div>
                        <div 
                          style={{ 
                            color: '#ffffff', 
                            fontSize: '14px', 
                            fontWeight: 500,
                            textAlign: 'center',
                            opacity: 1,
                            display: 'block'
                          }}
                        >
                          {card.title}
                        </div>
                        {card.isPlaceholder && (
                          <Badge 
                            size="xs" 
                            variant="filled" 
                            style={{ 
                              backgroundColor: 'rgba(102, 126, 234, 0.9)',
                              color: '#ffffff',
                              marginTop: '4px',
                              display: 'block'
                            }}
                          >
                            Demo Data
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </SimpleGrid>
            )}
          </Stack>
        </Container>
      </Box>

      {/* System Health & Status */}
      {stats.health && (
        <Box py="sm" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
        <Container size="xl" px="xl">
            <Group justify="space-between" align="center">
              <Group gap="md">
                <IconServer size={20} />
                <Text size="sm" fw={500}>
                  System Status: 
              </Text>
                <Badge 
                  color={stats.health.status === 'healthy' ? 'green' : 'yellow'} 
                  variant="light"
                >
                  {stats.health.status?.toUpperCase() || 'UNKNOWN'}
                </Badge>
              </Group>
              {stats.health.services && (
                <Group gap="md">
                  {Object.entries(stats.health.services).map(([service, status]: [string, any]) => (
                    <Group key={service} gap="xs">
                      <Text size="xs" c="dimmed">{service}:</Text>
                      <Badge 
                        size="sm"
                        color={status === 'healthy' ? 'green' : 'red'} 
                        variant="dot"
                      >
                        {status}
                      </Badge>
                    </Group>
                  ))}
                </Group>
              )}
            </Group>
          </Container>
        </Box>
      )}

      {/* Main Content Grid */}
      <Container size="xl" px="xl" py="md">
        <Grid>
          {/* Left Column - Navigation & Quick Actions */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="xl">
              {/* Recent Activity */}
              {stats.recentFlows.length > 0 && (
                <Card withBorder p="xl">
                  <Stack gap="md">
                    <Title order={3}>Recent Flows</Title>
                    <Text c="dimmed" size="sm">
                      Latest media flows in the system
            </Text>
                    <Stack gap="sm" mt="md">
                      {stats.recentFlows.slice(0, 5).map((flow: any, i: number) => {
                        // Ensure we have an ID (normalized from _id if needed)
                        const flowId = flow.id || flow._id;
                        // Use index as key fallback if no ID available
                        const key = flowId || `flow-${i}`;
                        
                        return (
                          <Paper 
                            key={key} 
                            p="md" 
                            withBorder 
                            style={{ cursor: flowId ? 'pointer' : 'default' }}
                            onClick={() => {
                              if (flowId) {
                                navigate(`/flow-details/${flowId}`);
                              }
                            }}
                            onMouseEnter={(e) => {
                              if (flowId) {
                                e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Group justify="space-between">
                              <Box style={{ flex: 1 }}>
                                <Text fw={500}>{flow.label || flowId || 'Unnamed Flow'}</Text>
                                <Text size="xs" c="dimmed">
                                  {flow.format || 'Unknown format'}
                                  {flow.source_id && ` • ${flow.source_id}`}
                                </Text>
                              </Box>
                              {flowId && (
                                <IconArrowRight size={16} style={{ color: 'var(--mantine-color-gray-6)' }} />
                              )}
                            </Group>
                          </Paper>
                        );
                      })}
                    </Stack>
                    <Button
                      variant="subtle"
                      size="sm"
                      rightSection={<IconArrowRight size={14} />}
                      onClick={() => navigate('/flows')}
                    >
                      View All Flows
                    </Button>
                  </Stack>
                </Card>
              )}
            </Stack>
              </Grid.Col>

          {/* Right Column - Figma Diagram Preview & Info */}
          <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="xl">
              {/* Figma Diagram Preview */}
              <Card withBorder p="xl" style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
                <Stack gap="md">
                  <Group>
                    <IconTarget size={24} style={{ color: 'var(--mantine-color-blue-6)' }} />
                    <Title order={3}>Architecture Diagram</Title>
                  </Group>
                  <Text size="sm" c="dimmed">
                    Preview of the TAMS system architecture from Figma design
                  </Text>
                  <Box
                    style={{
                      width: '100%',
                      height: '300px',
                      backgroundColor: 'white',
                      border: '1px solid var(--mantine-color-gray-3)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <Stack align="center" gap="md">
                      <IconExternalLink size={48} style={{ color: 'var(--mantine-color-gray-4)' }} />
                      <Box>
                        <Text size="sm" c="dimmed" ta="center">
                          Figma diagram preview
                        </Text>
                        <Text size="xs" c="dimmed" ta="center" mt="xs">
                          (Design diagram will be embedded here)
                        </Text>
                      </Box>
                    </Stack>
                  </Box>
                  <Button 
                    variant="light" 
                    size="sm"
                    fullWidth
                    rightSection={<IconExternalLink size={14} />}
                    onClick={() => {
                      // Open Figma link in new tab if available
                      window.open('https://www.figma.com', '_blank');
                    }}
                  >
                    View Full Diagram
                  </Button>
                </Stack>
              </Card>

              {/* Key Features */}
              <Card withBorder p="xl">
                <Stack gap="md">
                  <Title order={3}>Key Capabilities</Title>
                  <Stack gap="sm">
                    {[
                      { icon: <IconClock size={18} />, text: 'Time-addressable access to any moment' },
                      { icon: <IconBolt size={18} />, text: 'Real-time processing & indexing' },
                      { icon: <IconSearch size={18} />, text: 'Semantic search across media' },
                      { icon: <IconDatabase size={18} />, text: 'Petabyte-scale storage' },
                      { icon: <IconShield size={18} />, text: 'TAMS v6.0 compliant' }
                    ].map((feature, i) => (
                      <Group key={i} gap="sm">
                        <Box style={{ color: 'var(--mantine-color-blue-6)' }}>
                          {feature.icon}
                    </Box>
                        <Text size="sm" style={{ flex: 1 }}>
                          {feature.text}
                        </Text>
                  </Group>
                    ))}
                  </Stack>
                </Stack>
              </Card>

              {/* System Info */}
              <Card withBorder p="xl" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <Stack gap="sm">
                  <Title order={4}>System Information</Title>
                  <Divider />
                  {stats.serviceInfo && (
                    <>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Service:</Text>
                        <Text size="sm" fw={500}>{stats.serviceInfo.name || 'TAMS API'}</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Version:</Text>
                        <Text size="sm" fw={500}>{stats.serviceInfo.version || 'v3.0'}</Text>
                      </Group>
                      {stats.serviceInfo.capabilities && (
                        <Box>
                          <Text size="sm" c="dimmed" mb="xs">Capabilities:</Text>
                          <Group gap="xs">
                            {Object.entries(stats.serviceInfo.capabilities).map(([key, value]: [string, any]) => {
                              if (typeof value === 'boolean' && value) {
                                return (
                                  <Badge key={key} size="xs" variant="light" color="blue">
                                    {key}
                                  </Badge>
                                );
                              }
                              return null;
                            })}
                          </Group>
                        </Box>
                      )}
                    </>
                  )}
                  {!stats.serviceInfo && (
                    <>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">API Version:</Text>
                        <Text size="sm" fw={500}>TAMS v3.0</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Compliance:</Text>
                        <Badge size="sm" color="green">TAMS v6.0</Badge>
                      </Group>
                    </>
                  )}
                  {stats.storageBackends.length > 0 && (
                    <Box>
                      <Text size="sm" c="dimmed" mb="xs">Storage Backends:</Text>
                      <Stack gap="xs">
                        {stats.storageBackends.map((backend: any, i: number) => (
                          <Group key={i} justify="space-between">
                            <Text size="xs" c="dimmed">{backend.id}:</Text>
                            <Badge size="xs" variant="light" color="purple">
                              {backend.type}
                            </Badge>
                          </Group>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Card>
          </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
} 
