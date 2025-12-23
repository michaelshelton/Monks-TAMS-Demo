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
  Divider
} from '@mantine/core';
import { 
  IconClock, 
  IconSearch, 
  IconDatabase, 
  IconArrowRight,
  IconVideo,
  IconBroadcast,
  IconBolt,
  IconTarget,
  IconExternalLink,
  IconContainer,
  IconWebhook,
  IconPlayerPlay,
  IconChartBar,
  IconServer
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
      if (apiClient && typeof (apiClient as any).ensureApiClientInitialized === 'function') {
        await (apiClient as any).ensureApiClientInitialized();
      }
      
      // Load multiple data sources in parallel
      const [
        health,
        sourcesResponse,
        flowsResponse,
        serviceInfo
      ] = await Promise.all([
        apiClient.getHealth().catch(() => null),
        apiClient.getSources().catch(() => ({ data: [], pagination: { count: 0 } })),
        apiClient.getFlows().catch(() => {
          return apiClient.getFlows({ limit: 100 }).catch(() => ({ data: [], pagination: { count: 0 } }));
        }),
        apiClient.getService().catch(() => null)
      ]);
      
      // Handle API response formats
      let sourcesCount = 0;
      const sourcesResponseAny = sourcesResponse as any;
      
      if (sourcesResponseAny && sourcesResponseAny.sources && Array.isArray(sourcesResponseAny.sources)) {
        sourcesCount = sourcesResponseAny.count ?? sourcesResponseAny.sources.length;
      } else if (sourcesResponse && typeof sourcesResponse === 'object' && 'data' in sourcesResponse) {
        if (Array.isArray(sourcesResponse.data)) {
          const paginationCount = sourcesResponse.pagination?.count;
          sourcesCount = paginationCount !== undefined && paginationCount !== null 
            ? paginationCount 
            : sourcesResponse.data.length;
        }
      } else if (Array.isArray(sourcesResponse)) {
        sourcesCount = (sourcesResponse as any[]).length;
      } else if (sourcesResponseAny && Array.isArray(sourcesResponseAny.data)) {
        sourcesCount = sourcesResponseAny.data.length;
      }
      
      // Flows: array directly or BBC TAMS format
      let flowsData: any[] = [];
      let flowsCount = 0;
      const flowsResponseAny = flowsResponse as any;
      if (Array.isArray(flowsResponse)) {
        flowsData = flowsResponse.map((flow: any) => ({
          ...flow,
          id: flow.id || flow._id
        }));
        flowsCount = flowsResponse.length;
      } else if (flowsResponse && flowsResponse.data && Array.isArray(flowsResponse.data)) {
        flowsData = flowsResponse.data.map((flow: any) => ({
          ...flow,
          id: flow.id || flow._id
        }));
        flowsCount = flowsResponse.pagination?.count ?? flowsResponse.data.length;
      } else if (flowsResponseAny && flowsResponseAny.flows && Array.isArray(flowsResponseAny.flows)) {
        flowsData = flowsResponseAny.flows.map((flow: any) => ({
          ...flow,
          id: flow.id || flow._id
        }));
        flowsCount = flowsResponseAny.count ?? flowsResponseAny.flows.length;
      }
      
      // Analyze flows for additional stats
      let totalSegments = 0;
      let totalStorageGB = 0;
      let totalDurationSeconds = 0;
      let liveFlows = 0;
      const recentFlows = flowsData.slice(0, 5);
      
      flowsData.forEach((flow: any) => {
        if (flow.total_segments) {
          totalSegments += flow.total_segments;
        }
        
        if (flow.total_duration) {
          totalDurationSeconds += flow.total_duration;
        } else if (flow.total_segments) {
          totalDurationSeconds += flow.total_segments * 10;
        }
        
        if (flow.total_segments) {
          totalStorageGB += (flow.total_segments * 1) / 1024;
        }
        
        if (flow.tags?.stream_type?.includes('live') || flow.tags?.stream_type === 'live') {
          liveFlows++;
        }
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
        objects: 0,
        webhooks: 0,
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
      sources: 6,
      flows: 3,
      totalSegments: 1300,
      totalStorageGB: 245.80,
      totalDurationHours: 18.5,
      objects: 3200,
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
    if (gb === 0) return '0';
    if (gb >= 1000) return `${(gb / 1000).toFixed(2)} TB`;
    return `${gb.toFixed(2)}`;
  };

  const formatDuration = (hours: number): string => {
    if (hours === 0) return '0 min';
    if (hours >= 24) return `${(hours / 24).toFixed(1)} days`;
    if (hours >= 1) return `${hours.toFixed(1)}hrs`;
    return `${(hours * 60).toFixed(0)} min`;
  };

  // Use real data if available, otherwise use placeholders
  const displayStats = {
    sources: (!stats.loading && stats.sources > 0) ? stats.sources : getPlaceholderValue('sources'),
    flows: (!stats.loading && stats.flows > 0) ? stats.flows : getPlaceholderValue('flows'),
    totalSegments: (!stats.loading && stats.totalSegments > 0) ? stats.totalSegments : getPlaceholderValue('totalSegments'),
    totalStorageGB: (!stats.loading && stats.totalStorageGB > 0) ? stats.totalStorageGB : getPlaceholderValue('totalStorageGB'),
    totalDurationHours: (!stats.loading && stats.totalDurationHours > 0) ? stats.totalDurationHours : getPlaceholderValue('totalDurationHours'),
  };

  const isPlaceholder = stats.loading || stats.sources === 0;

  return (
    <Box 
      style={{ 
        backgroundColor: '#0f0f0f',
        minHeight: '100vh',
        padding: '24px'
      }}
    >
      <Container size="xl" px={0}>
        <Grid gutter="lg">
          {/* Top Row - Three Large Cards */}
          <Grid.Col span={12}>
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
              {/* Live Sources Card - Teal Gradient */}
              <Card
                p="xl"
                style={{
                  background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  minHeight: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onClick={() => navigate('/sources')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Stack gap="xs">
                  <Text size="sm" fw={500} c="white" opacity={0.9}>
                    Live Sources
                  </Text>
                  <Text size="xs" c="white" opacity={0.8}>
                    View real-time media inputs
                  </Text>
                </Stack>
                <Group justify="space-between" align="flex-end" mt="xl">
                  <Stack gap={4}>
                    <Text size="48px" fw={700} c="white" lh={1}>
                      {displayStats.sources}
                    </Text>
                    <Badge 
                      size="sm" 
                      variant="filled" 
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        width: 'fit-content'
                      }}
                    >
                      ACTIVE
                    </Badge>
                  </Stack>
                  <Button
                    variant="subtle"
                    rightSection={<IconArrowRight size={16} />}
                    styles={{
                      root: {
                        backgroundColor: 'transparent !important',
                        border: 'none !important',
                        padding: 0,
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'transparent !important',
                        }
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/sources');
                    }}
                  >
                    Explore
                  </Button>
                </Group>
              </Card>

              {/* Media Flows Card - Green Gradient */}
              <Card
                p="xl"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  minHeight: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onClick={() => navigate('/flows')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Stack gap="xs">
                  <Text size="sm" fw={500} c="white" opacity={0.9}>
                    Media Flows
                  </Text>
                  <Text size="xs" c="white" opacity={0.8}>
                    View real-time media inputs
                  </Text>
                </Stack>
                <Group justify="space-between" align="flex-end" mt="xl">
                  <Stack gap={4}>
                    <Text size="48px" fw={700} c="white" lh={1}>
                      {displayStats.flows}
                    </Text>
                    <Badge 
                      size="sm" 
                      variant="filled" 
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        width: 'fit-content'
                      }}
                    >
                      RUNNING
                    </Badge>
                  </Stack>
                  <Button
                    variant="subtle"
                    rightSection={<IconArrowRight size={16} />}
                    styles={{
                      root: {
                        backgroundColor: 'transparent !important',
                        border: 'none !important',
                        padding: 0,
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'transparent !important',
                        }
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/flows');
                    }}
                  >
                    Explore
                  </Button>
                </Group>
              </Card>

              {/* Explore TAMS Data Card - Dark Gray Vertical */}
              <Card
                p="xl"
                style={{
                  backgroundColor: 'transparent',
                  borderRadius: '12px',
                  border: '1px solid #333333',
                  minHeight: '200px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Text size="sm" fw={600} c="white" mb="md">
                  Explore TAMS Data
                </Text>
                <Stack gap="xs">
                  {[
                    { label: 'Sources', to: '/sources', icon: IconContainer },
                    { label: 'Flows', to: '/flows', icon: IconContainer },
                    { label: 'Search', to: '/search', icon: IconContainer },
                    { label: 'Analytics', to: '/observability', icon: IconContainer },
                    { label: 'Flow Collections', to: '/flows', icon: IconContainer },
                    { label: 'Webhooks', to: '/webhooks', icon: IconContainer },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Paper
                        key={item.label}
                        p="sm"
                        style={{
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderRadius: '6px',
                          transition: 'background-color 0.2s'
                        }}
                        onClick={() => navigate(item.to)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#262626';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Group gap="sm">
                          <Icon size={18} color="#b3b3b3" />
                          <Text size="sm" c="#b3b3b3">
                            {item.label}
                          </Text>
                        </Group>
                        <IconArrowRight size={16} color="#666666" />
                      </Paper>
                    );
                  })}
                </Stack>
              </Card>
            </SimpleGrid>
          </Grid.Col>

          {/* Middle Row - Three Stat Cards */}
          <Grid.Col span={12}>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
              {/* Total Segments */}
              <Card
                p="xl"
                style={{
                  backgroundColor: 'transparent',
                  borderRadius: '12px',
                  border: '1px solid #333333'
                }}
              >
                <Group gap="sm" mb="md">
                  <IconContainer size={20} color="#b3b3b3" />
                  <Text size="sm" fw={500} c="#b3b3b3">
                    Total Segments
                  </Text>
                </Group>
                <Text size="32px" fw={700} c="white" mb="xs">
                  {formatNumber(displayStats.totalSegments)}
                </Text>
                {isPlaceholder && (
                  <Badge size="xs" variant="light" color="gray">
                    DEMO DATA
                  </Badge>
                )}
              </Card>

              {/* Storage Used */}
              <Card
                p="xl"
                style={{
                  backgroundColor: 'transparent',
                  borderRadius: '12px',
                  border: '1px solid #333333'
                }}
              >
                <Group gap="sm" mb="md">
                  <IconContainer size={20} color="#b3b3b3" />
                  <Text size="sm" fw={500} c="#b3b3b3">
                    Storage Used
                  </Text>
                </Group>
                <Text size="32px" fw={700} c="white" mb="xs">
                  {formatStorage(displayStats.totalStorageGB)}
                </Text>
                {isPlaceholder && (
                  <Badge size="xs" variant="light" color="gray">
                    DEMO DATA
                  </Badge>
                )}
              </Card>

              {/* Total Duration */}
              <Card
                p="xl"
                style={{
                  backgroundColor: 'transparent',
                  borderRadius: '12px',
                  border: '1px solid #333333'
                }}
              >
                <Group gap="sm" mb="md">
                  <IconContainer size={20} color="#b3b3b3" />
                  <Text size="sm" fw={500} c="#b3b3b3">
                    Total Duration
                  </Text>
                </Group>
                <Text size="32px" fw={700} c="white" mb="xs">
                  {formatDuration(displayStats.totalDurationHours)}
                </Text>
                {isPlaceholder && (
                  <Badge size="xs" variant="light" color="gray">
                    DEMO DATA
                  </Badge>
                )}
              </Card>
            </SimpleGrid>
          </Grid.Col>

          {/* Bottom Row - Recent Flows and Architecture Diagram */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card
              p="xl"
              style={{
                backgroundColor: 'transparent',
                borderRadius: '12px',
                border: '1px solid #333333',
                minHeight: '400px'
              }}
            >
              <Group justify="space-between" mb="md">
                <Stack gap={4}>
                  <Title order={3} c="white">
                    Recent Flows
                  </Title>
                  <Text size="sm" c="#b3b3b3">
                    Latest media flows in the system
                  </Text>
                </Stack>
                <Button
                  variant="subtle"
                  size="sm"
                  rightSection={<IconArrowRight size={14} />}
                  styles={{
                    root: {
                      backgroundColor: 'transparent !important',
                      border: 'none !important',
                      padding: 0,
                      color: '#b3b3b3',
                      '&:hover': {
                        backgroundColor: 'transparent !important',
                      }
                    }
                  }}
                  onClick={() => navigate('/flows')}
                >
                  View More
                </Button>
              </Group>
              <Stack gap="sm" mt="md">
                {stats.recentFlows.length > 0 ? (
                  stats.recentFlows.slice(0, 4).map((flow: any, i: number) => {
                    const flowId = flow.id || flow._id;
                    const key = flowId || `flow-${i}`;
                    
                    return (
                      <Paper
                        key={key}
                        p="md"
                        style={{
                          backgroundColor: 'transparent',
                          border: '1px solid #333333',
                          borderRadius: '8px',
                          cursor: flowId ? 'pointer' : 'default',
                          transition: 'background-color 0.2s'
                        }}
                        onClick={() => {
                          if (flowId) {
                            navigate(`/flow-details/${flowId}`);
                          }
                        }}
                        onMouseEnter={(e) => {
                          if (flowId) {
                            e.currentTarget.style.backgroundColor = '#1a1a1a';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Group justify="space-between">
                          <Box style={{ flex: 1 }}>
                            <Text fw={500} c="white" size="sm">
                              {flow.label || flowId || 'Unnamed Flow'}
                            </Text>
                            <Text size="xs" c="#b3b3b3" mt={4}>
                              {flow.format || 'Unknown format'}
                              {flow.source_id && ` • ${flow.source_id}`}
                            </Text>
                          </Box>
                          {flowId && (
                            <IconArrowRight size={16} color="#666666" />
                          )}
                        </Group>
                      </Paper>
                    );
                  })
                ) : (
                  <Text c="#666666" size="sm" ta="center" py="xl">
                    No recent flows available
                  </Text>
                )}
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card
              p="xl"
              style={{
                backgroundColor: 'transparent',
                borderRadius: '12px',
                border: '1px solid #333333',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Group justify="space-between" mb="md">
                <Stack gap={4}>
                  <Title order={3} c="white">
                    Architecture Diagram
                  </Title>
                  <Text size="sm" c="#b3b3b3">
                    Preview of the TAMS system architecture
                  </Text>
                </Stack>
                <Button
                  variant="subtle"
                  size="sm"
                  rightSection={<IconExternalLink size={14} />}
                  styles={{
                    root: {
                      backgroundColor: 'transparent !important',
                      border: 'none !important',
                      padding: 0,
                      color: '#b3b3b3',
                      '&:hover': {
                        backgroundColor: 'transparent !important',
                      }
                    }
                  }}
                  onClick={() => {
                    window.open('https://www.figma.com', '_blank');
                  }}
                >
                  View Diagram
                </Button>
              </Group>
              <Box
                style={{
                  flex: 1,
                  backgroundColor: '#0f0f0f',
                  border: '1px dashed #404040',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '250px'
                }}
              >
                <Stack align="center" gap="md">
                  <IconTarget size={48} color="#404040" />
                  <Text size="sm" c="#666666" ta="center">
                    Architecture diagram placeholder
                  </Text>
                </Stack>
              </Box>
            </Card>
          </Grid.Col>

          {/* Bottom-most Row - Key Capabilities and System Information */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card
              p="xl"
              style={{
                backgroundColor: 'transparent',
                borderRadius: '12px',
                border: '1px solid #333333'
              }}
            >
              <Title order={3} c="white" mb="md">
                Key Capabilities
              </Title>
              <Stack gap="sm">
                {[
                  { icon: IconClock, text: 'Time-addressable access to any moment' },
                  { icon: IconBolt, text: 'Real-time processing & indexing' },
                  { icon: IconSearch, text: 'Semantic search across media' },
                ].map((capability, i) => {
                  const Icon = capability.icon;
                  return (
                    <Group key={i} gap="sm">
                      <Icon size={18} color="#b3b3b3" />
                      <Text size="sm" c="#b3b3b3" style={{ flex: 1 }}>
                        {capability.text}
                      </Text>
                    </Group>
                  );
                })}
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card
              p="xl"
              style={{
                backgroundColor: 'transparent',
                borderRadius: '12px',
                border: '1px solid #333333'
              }}
            >
              <Title order={4} c="white" mb="md">
                System Information
              </Title>
              <Stack gap="sm">
                {stats.serviceInfo ? (
                  <>
                    <Group justify="space-between">
                      <Text size="sm" c="#b3b3b3">Service:</Text>
                      <Text size="sm" fw={500} c="white">
                        {stats.serviceInfo.name || 'TAMS API'}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="#b3b3b3">Version:</Text>
                      <Text size="sm" fw={500} c="white">
                        {stats.serviceInfo.version || 'v3.0'}
                      </Text>
                    </Group>
                  </>
                ) : (
                  <>
                    <Group justify="space-between">
                      <Text size="sm" c="#b3b3b3">TAMS API</Text>
                      <Text size="sm" c="#666666">Service</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="#b3b3b3">v3.0</Text>
                      <Text size="sm" c="#666666">Version</Text>
                    </Group>
                  </>
                )}
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
