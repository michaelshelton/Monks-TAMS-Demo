
import React, { useState, useEffect } from 'react';
import { Container, Title, Text, Button, Box, Group, Card, SimpleGrid, Stack, Badge, Grid } from '@mantine/core';
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
  IconPlayerPlay,
  IconCheck
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';

// Live stats will be loaded dynamically from API

// Quick actions will be generated dynamically with real data

const demoHighlights = [
  {
    icon: <IconClock size={24} />,
    title: 'Time-Addressable Access',
    description: 'Access any moment in your media streams instantly - no more scrubbing through hours of content.'
  },
  {
    icon: <IconBolt size={24} />,
    title: 'Real-Time Processing',
    description: 'Live media streams processed and indexed as they arrive, enabling instant search and retrieval.'
  },
  {
    icon: <IconSearch size={24} />,
    title: 'Instant Search',
    description: 'Find specific content across petabytes of media using semantic search and AI-powered indexing.'
  },
  {
    icon: <IconDatabase size={24} />,
    title: 'Petabyte Scale',
    description: 'Built on VAST Data Platform for unlimited storage and lightning-fast access to any media moment.'
  }
];

export default function Landing() {
  const navigate = useNavigate();
  const [systemData, setSystemData] = useState<{
    sources: number;
    flows: number;
    segments: number;
    health: any;
    loading: boolean;
    error: string | null;
  }>({
    sources: 0,
    flows: 0,
    segments: 0,
    health: null,
    loading: true,
    error: null
  });

  // Load system data on component mount
  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    setSystemData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🔄 Loading landing page system data...');
      
      // Load health status
      const health = await apiClient.getHealth();
      console.log('✅ Health loaded:', health);
      
      // Load basic counts
      const [sourcesResponse, flowsResponse] = await Promise.all([
        apiClient.getSources({ limit: 10 }),
        apiClient.getFlows({ limit: 10 })
      ]);
      
      console.log('📊 Sources response:', sourcesResponse);
      console.log('📊 Flows response:', flowsResponse);
      
      // Calculate counts
      const sourcesCount = sourcesResponse.pagination?.count || sourcesResponse.data?.length || 0;
      const flowsCount = flowsResponse.pagination?.count || flowsResponse.data?.length || 0;
      
      // Get segment count from first flow if available
      let segmentsCount = 0;
      if (flowsResponse.data && flowsResponse.data.length > 0) {
        try {
          const firstFlow = flowsResponse.data[0];
          const segmentsResponse = await apiClient.getFlowSegments(firstFlow.id, { limit: 10 });
          segmentsCount = segmentsResponse.pagination?.count || segmentsResponse.data?.length || 0;
        } catch (segmentError) {
          console.warn('⚠️ Could not load segment count:', segmentError);
        }
      }
      
      setSystemData({
        sources: sourcesCount,
        flows: flowsCount,
        segments: segmentsCount,
        health,
        loading: false,
        error: null
      });
      
    } catch (error) {
      console.error('❌ Error loading system data:', error);
      setSystemData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load system data'
      }));
    }
  };



  // Generate quick actions with real data
  const quickActions = [
    {
      title: 'Live Sources',
      description: 'View real-time media inputs',
      icon: <IconBroadcast size={32} />,
      color: 'blue',
      link: '/sources',
      badge: `${systemData.sources} Active`
    },
    {
      title: 'Media Flows',
      description: 'Monitor processing streams',
      icon: <IconBroadcast size={32} />,
      color: 'green',
      link: '/flows',
      badge: `${systemData.flows} Running`
    },
    {
      title: 'TAMS Workflow',
      description: 'Interactive demo walkthrough',
      icon: <IconTarget size={32} />,
      color: 'orange',
      link: '/vast-tams-workflow',
      badge: 'Live Demo'
    },
    {
      title: 'Analytics',
      description: 'Real-time performance metrics',
      icon: <IconTrendingUp size={32} />,
      color: 'teal',
      link: '/analytics',
      badge: 'Live Data'
    }
  ];

  return (
    <Box>
      {/* Hero Section - Demo Focus */}
      <Box py="xl" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <Container size="xl" px="xl">
          <Stack align="center" gap="xl" py="xl">
            <Badge size="lg" variant="light" color="blue">
              <IconBroadcast size={16} style={{ marginRight: 8 }} />
              LIVE DEMO
            </Badge>
            <Title order={1} ta="center" maw={800} c="white">
              Time Addressable Media Storage
            </Title>
            <Text size="lg" ta="center" maw={700} c="white" opacity={0.9}>
              Experience the future of media storage. Access any moment in your media streams instantly - 
              no more scrubbing through hours of content to find what you need.
            </Text>
            <Group justify="center" gap="md">
              <Button 
                size="lg" 
                rightSection={<IconArrowRight size={20} />} 
                color="blue"
                onClick={() => navigate('/vast-tams-workflow')}
              >
                Start Walkthrough
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                color="white"
                onClick={() => navigate('/sources')}
              >
                Explore Sources
              </Button>
            </Group>
          </Stack>
        </Container>
      </Box>



      {/* Quick Actions - Demo Navigation */}
      <Box py="xl" style={{ background: 'var(--mantine-color-gray-0)' }}>
        <Container size="xl" px="xl">
          <Stack gap="xl">
            <Box ta="center">
              <Title order={2} mb="md">
                Interactive Demo Areas
              </Title>
              <Text size="lg" c="dimmed">
                Explore different aspects of TAMS functionality
              </Text>
            </Box>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xl">
              {quickActions.map((action, i) => (
                <Card key={i} withBorder p="xl" style={{ height: '100%' }}>
                  <Stack gap="md" h="100%">
                    <Group gap="md">
                      <Box style={{ color: `var(--mantine-color-${action.color}-6)` }}>
                        {action.icon}
                      </Box>
                      <Badge size="sm" variant="light" color={action.color}>
                        {action.badge}
                      </Badge>
                    </Group>
                    <Title order={4} style={{ flex: 1 }}>
                      {action.title}
                    </Title>
                    <Text c="dimmed" size="sm" style={{ flex: 1 }}>
                      {action.description}
                    </Text>
                    <Button 
                      variant="light" 
                      size="sm" 
                      rightSection={<IconArrowRight size={16} />}
                      onClick={() => navigate(action.link)}
                      color={action.color}
                    >
                      Explore
                    </Button>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      {/* Key Differentiators */}
      <Container size="xl" px="xl" py="xl">
        <Stack gap="xl">
          <Box ta="center">
            <Title order={2} mb="md">
              Why TAMS is Revolutionary
            </Title>
            <Text size="lg" c="dimmed">
              Traditional media storage vs. Time Addressable Media Storage
            </Text>
          </Box>
          <Grid>
            {demoHighlights.map((highlight, i) => (
              <Grid.Col key={i} span={{ base: 12, sm: 6, lg: 3 }}>
                <Card withBorder p="md">
                  <Group gap="md">
                    <Box style={{ color: 'var(--mantine-color-blue-6)' }}>
                      {highlight.icon}
                    </Box>
                    <Box style={{ flex: 1 }}>
                      <Text fw={500} mb="xs">
                        {highlight.title}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {highlight.description}
                      </Text>
                    </Box>
                  </Group>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Stack>
      </Container>

      {/* Live Demo Section */}
      <Box py="xl" style={{ background: 'var(--mantine-color-gray-0)' }}>
        <Container size="xl" px="xl">
          <Stack gap="xl">
            <Box ta="center">
              <Title order={2} mb="md">
                Try It Now
              </Title>
              <Text size="lg" c="dimmed">
                Experience the power of time-addressable media storage
              </Text>
            </Box>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
              <Card withBorder p="xl">
                <Stack gap="md">
                  <Group gap="md">
                    <IconTimeline size={32} style={{ color: 'var(--mantine-color-orange-6)' }} />
                    <Box>
                      <Title order={4}>Segment Timeline</Title>
                      <Text size="sm" c="dimmed">Visual timeline navigation</Text>
                    </Box>
                  </Group>
                  <Text>
                    Navigate through media segments with our interactive timeline. 
                    Jump to any moment instantly without scrubbing through content.
                  </Text>
                  <Button 
                    variant="light" 
                    rightSection={<IconArrowRight size={16} />}
                    onClick={() => navigate('/vast-tams-workflow')}
                  >
                    Try Timeline Demo
                  </Button>
                </Stack>
              </Card>
              <Card withBorder p="xl">
                <Stack gap="md">
                  <Group gap="md">
                    <IconSearch size={32} style={{ color: 'var(--mantine-color-blue-6)' }} />
                    <Box>
                      <Title order={4}>Advanced Search</Title>
                      <Text size="sm" c="dimmed">Find content instantly</Text>
                    </Box>
                  </Group>
                  <Text>
                    Search across all your media using advanced filters, metadata, 
                    and semantic search capabilities.
                  </Text>
                  <Button 
                    variant="light" 
                    rightSection={<IconArrowRight size={16} />}
                    onClick={() => navigate('/search')}
                  >
                    Try Search Demo
                  </Button>
                </Stack>
              </Card>
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      {/* VAST TAMS Features */}
      <Container size="xl" px="xl" py="xl">
        <Stack gap="xl">
          <Box ta="center">
            <Title order={2} mb="md">
              TAMS Features
            </Title>
            <Text size="lg" c="dimmed">
              Time-Addressable Media Store with advanced capabilities
            </Text>
          </Box>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            <Card p="md" withBorder>
              <Group>
                <Box style={{ color: 'var(--mantine-color-green-6)' }}>
                  <IconCheck size={20} />
                </Box>
                <div>
                  <Text fw={600} mb="xs">
                    BBC TAMS v6.0 Compliance
                  </Text>
                  <Text size="sm" c="dimmed">
                    Full specification compliance with BBC TAMS API
                  </Text>
                </div>
              </Group>
            </Card>
            <Card p="md" withBorder>
              <Group>
                <Box style={{ color: 'var(--mantine-color-blue-6)' }}>
                  <IconTimeline size={20} />
                </Box>
                <div>
                  <Text fw={600} mb="xs">
                    Time-Addressable Media
                  </Text>
                  <Text size="sm" c="dimmed">
                    Jump to any moment in your media with precise time ranges
                  </Text>
                </div>
              </Group>
            </Card>
            <Card p="md" withBorder>
              <Group>
                <Box style={{ color: 'var(--mantine-color-purple-6)' }}>
                  <IconTarget size={20} />
                </Box>
                <div>
                  <Text fw={600} mb="xs">
                    Dual URL Support
                  </Text>
                  <Text size="sm" c="dimmed">
                    GET and HEAD presigned URLs for flexible media access
                  </Text>
                </div>
              </Group>
            </Card>
            <Card p="md" withBorder>
              <Group>
                <Box style={{ color: 'var(--mantine-color-red-6)' }}>
                  <IconActivity size={20} />
                </Box>
                <div>
                  <Text fw={600} mb="xs">
                    Real-time Webhooks
                  </Text>
                  <Text size="sm" c="dimmed">
                    Event-driven notifications for media operations
                  </Text>
                </div>
              </Group>
            </Card>
            <Card p="md" withBorder>
              <Group>
                <Box style={{ color: 'var(--mantine-color-orange-6)' }}>
                  <IconDatabase size={20} />
                </Box>
                <div>
                  <Text fw={600} mb="xs">
                    Soft Delete & Restore
                  </Text>
                  <Text size="sm" c="dimmed">
                    Advanced deletion with recovery capabilities
                  </Text>
                </div>
              </Group>
            </Card>
            <Card p="md" withBorder>
              <Group>
                <Box style={{ color: 'var(--mantine-color-teal-6)' }}>
                  <IconActivity size={20} />
                </Box>
                <div>
                  <Text fw={600} mb="xs">
                    Analytics & Monitoring
                  </Text>
                  <Text size="sm" c="dimmed">
                    Real-time usage analytics and performance metrics
                  </Text>
                </div>
              </Group>
            </Card>
          </SimpleGrid>
        </Stack>
      </Container>

      {/* Technology Demo */}
      <Box py="xl" style={{ background: 'var(--mantine-color-gray-0)' }}>
        <Container size="xl" px="xl">
          <Stack gap="xl">
            <Box ta="center">
              <Title order={2} mb="md">
                Powered by VAST Data Platform
              </Title>
              <Text size="lg" c="dimmed">
                Built on the world's fastest data platform for unlimited scale and performance
              </Text>
            </Box>
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
              <Card withBorder p="md" ta="center">
                <IconBolt size={32} style={{ color: 'var(--mantine-color-green-6)' }} />
                <Text fw={500} mt="sm">Sub-Second Access</Text>
                <Text size="sm" c="dimmed">Any moment, instantly</Text>
              </Card>
              <Card withBorder p="md" ta="center">
                <IconDatabase size={32} style={{ color: 'var(--mantine-color-blue-6)' }} />
                <Text fw={500} mt="sm">Petabyte Scale</Text>
                <Text size="sm" c="dimmed">Unlimited storage</Text>
              </Card>
              <Card withBorder p="md" ta="center">
                <IconActivity size={32} style={{ color: 'var(--mantine-color-orange-6)' }} />
                <Text fw={500} mt="sm">Real-Time Processing</Text>
                <Text size="sm" c="dimmed">Live stream indexing</Text>
              </Card>
              <Card withBorder p="md" ta="center">
                <IconShield size={32} style={{ color: 'var(--mantine-color-purple-6)' }} />
                <Text fw={500} mt="sm">Enterprise Ready</Text>
                <Text size="sm" c="dimmed">Production hardened</Text>
              </Card>
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      {/* Call to Action */}
      <Container size="xl" px="xl" py="xl">
        <Card p="xl" withBorder style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
          <Stack align="center" ta="center">
            <Title order={3} c="blue">
              Ready to Explore TAMS?
            </Title>
            <Text size="lg" c="dimmed" maw={600}>
              Start with our interactive workflow demo to see all TAMS features in action
            </Text>
            <Group>
              <Button
                size="lg"
                rightSection={<IconArrowRight size={16} />}
                onClick={() => navigate('/vast-tams-workflow')}
              >
                Start Workflow Demo
              </Button>
              <Button
                size="lg"
                variant="light"
                onClick={() => navigate('/sources')}
              >
                Explore Sources
              </Button>
            </Group>
          </Stack>
        </Card>
      </Container>

    </Box>
  );
} 