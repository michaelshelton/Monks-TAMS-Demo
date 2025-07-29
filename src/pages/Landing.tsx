
import { Container, Title, Text, Button, Box, Group, Card, SimpleGrid, Stack, Badge, Grid, ActionIcon, Tooltip, Progress, RingProgress, Paper } from '@mantine/core';
import { 
  IconClock, 
  IconSearch, 
  IconDatabase, 
  IconPlayerPlay, 
  IconArrowRight,
  IconVideo,
  IconMusic,
  IconPhoto,
  IconServer,
  IconActivity,
  IconTimeline,
  IconSettings,
  IconWebhook,
  IconFilter,
  IconEye,
  IconDownload,
  IconPlus,
  IconCheck,
  IconExternalLink,
  IconBroadcast,
  IconNetwork,
  IconShield,
  IconBolt,
  IconTarget,
  IconTrendingUp,
  IconAlertCircle
} from '@tabler/icons-react';

const liveStats = [
  { label: 'Active Sources', value: '12', icon: <IconVideo size={20} />, color: 'blue' },
  { label: 'Live Flows', value: '8', icon: <IconBroadcast size={20} />, color: 'green' },
  { label: 'Segments Today', value: '1,247', icon: <IconTimeline size={20} />, color: 'orange' },
  { label: 'Storage Used', value: '2.4TB', icon: <IconDatabase size={20} />, color: 'purple' }
];

const quickActions = [
  {
    title: 'Live Sources',
    description: 'View real-time media inputs',
    icon: <IconBroadcast size={32} />,
    color: 'blue',
    link: '/sources',
    badge: '12 Active'
  },
  {
    title: 'Media Flows',
    description: 'Monitor processing streams',
    icon: <IconBroadcast size={32} />,
    color: 'green',
    link: '/flows',
    badge: '8 Running'
  },
  {
    title: 'Time Navigation',
    description: 'Jump to any moment instantly',
    icon: <IconTarget size={32} />,
    color: 'orange',
    link: '/segments',
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
              <Button size="lg" rightSection={<IconArrowRight size={20} />} color="blue">
                Start Interactive Demo
              </Button>
              <Button size="lg" variant="outline" color="white">
                Watch Demo Video
              </Button>
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* Live Stats Dashboard */}
      <Container size="xl" px="xl" py="xl">
        <Stack gap="xl">
          <Box ta="center">
            <Title order={2} mb="md">
              Live System Status
            </Title>
            <Text size="lg" c="dimmed">
              Real-time metrics from our TAMS demo environment
            </Text>
          </Box>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xl">
            {liveStats.map((stat, i) => (
              <Card key={i} withBorder p="md" ta="center">
                <Group justify="center" mb="xs">
                  <Box style={{ color: `var(--mantine-color-${stat.color}-6)` }}>
                    {stat.icon}
                  </Box>
                </Group>
                <Text size="xl" fw={700} mb="xs">
                  {stat.value}
                </Text>
                <Text size="sm" c="dimmed">
                  {stat.label}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>

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
                      component="a"
                      href={action.link}
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
                    component="a"
                    href="/segments"
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
                    component="a"
                    href="/search"
                  >
                    Try Search Demo
                  </Button>
                </Stack>
              </Card>
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      {/* Technology Demo */}
      <Container size="xl" px="xl" py="xl">
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

      {/* Demo CTA */}
      <Box py="xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Container size="xl" px="xl">
          <Stack align="center" gap="xl">
            <Box ta="center" maw={700}>
              <Title order={2} mb="lg" c="white">
                Ready to Experience TAMS?
              </Title>
              <Text size="lg" mb="xl" c="white" opacity={0.9}>
                Start exploring the interactive demo areas to see how TAMS can transform your media workflows.
              </Text>
            </Box>
            <Group gap="md">
              <Button size="xl" rightSection={<IconPlayerPlay size={24} />} color="white" variant="filled">
                Start Interactive Demo
              </Button>
              <Button size="xl" variant="outline" color="white" rightSection={<IconArrowRight size={24} />}>
                Explore Features
              </Button>
            </Group>
            <Group gap="lg" mt="xl">
              <Group gap="xs">
                <IconCheck size={16} style={{ color: 'white' }} />
                <Text size="sm" c="white">Live Demo Data</Text>
              </Group>
              <Group gap="xs">
                <IconCheck size={16} style={{ color: 'white' }} />
                <Text size="sm" c="white">Interactive Features</Text>
              </Group>
              <Group gap="xs">
                <IconCheck size={16} style={{ color: 'white' }} />
                <Text size="sm" c="white">Real-Time Metrics</Text>
              </Group>
            </Group>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
} 