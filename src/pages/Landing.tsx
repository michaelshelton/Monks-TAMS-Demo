
import { Container, Title, Text, Button, Box, Group, Card, SimpleGrid, Stack, Badge, Grid, ActionIcon, Tooltip } from '@mantine/core';
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
  IconBolt
} from '@tabler/icons-react';

const features = [
  {
    icon: <IconVideo size={32} />,
    title: 'Sources Management',
    description: 'Manage media inputs from cameras, microphones, and data feeds with comprehensive CRUD operations.',
    color: 'blue',
    link: '/sources'
  },
  {
    icon: <IconBroadcast size={32} />,
    title: 'Flow Management',
    description: 'Process and manage media streams with detailed technical specifications and performance metrics.',
    color: 'green',
    link: '/flows'
  },
  {
    icon: <IconTimeline size={32} />,
    title: 'Segment Timeline',
    description: 'Visual timeline view of media segments with time-based navigation and playback controls.',
    color: 'orange',
    link: '/segments'
  },
  {
    icon: <IconDatabase size={32} />,
    title: 'Objects Browser',
    description: 'Browse and manage persistent media objects with multi-format support and storage analytics.',
    color: 'purple',
    link: '/objects'
  },
  {
    icon: <IconActivity size={32} />,
    title: 'Analytics Dashboard',
    description: 'Comprehensive analytics with performance metrics, usage patterns, and system health monitoring.',
    color: 'teal',
    link: '/analytics'
  },
  {
    icon: <IconSettings size={32} />,
    title: 'Service Configuration',
    description: 'System administration with webhook management, security settings, and API documentation.',
    color: 'gray',
    link: '/service'
  }
];

const capabilities = [
  {
    icon: <IconFilter size={24} />,
    title: 'Advanced Filtering',
    description: 'URL-persistent filters with presets and multi-criteria search across all data types.'
  },
  {
    icon: <IconWebhook size={24} />,
    title: 'Event-Driven Architecture',
    description: 'Real-time webhook notifications for seamless integration with external systems.'
  },
  {
    icon: <IconActivity size={24} />,
    title: 'Performance Monitoring',
    description: 'Real-time metrics, quality scores, and uptime monitoring for production reliability.'
  },
  {
    icon: <IconShield size={24} />,
    title: 'Enterprise Security',
    description: 'API key management, rate limiting, HTTPS enforcement, and comprehensive access controls.'
  },
  {
    icon: <IconBolt size={24} />,
    title: 'High Performance',
    description: 'Optimized for real-time media processing with sub-second response times.'
  },
  {
    icon: <IconNetwork size={24} />,
    title: 'Scalable Architecture',
    description: 'Built on VAST Data Platform for petabyte-scale media storage and processing.'
  }
];

const stats = [
  { label: 'Media Sources', value: 'Unlimited', icon: <IconVideo size={20} /> },
  { label: 'Flow Types', value: '5+ Formats', icon: <IconBroadcast size={20} /> },
  { label: 'Storage Scale', value: 'Petabytes', icon: <IconDatabase size={20} /> },
  { label: 'API Endpoints', value: '20+ Routes', icon: <IconServer size={20} /> }
];

export default function Landing() {
  return (
    <Box>
      {/* Hero Section */}
      <Box py="xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Container size="xl" px="xl">
          <Stack align="center" gap="xl" py="xl">
            <Badge size="lg" variant="light" color="white">
              Time Addressable Media Storage
            </Badge>
            <Title order={1} ta="center" maw={800} c="white">
              Transform How You Store, Search, and Analyze Media
            </Title>
            <Text size="lg" ta="center" maw={700} c="white" opacity={0.9}>
              Access any moment in your media streams instantly with AI-powered time-addressable storage. 
              From live broadcasts to archived content, TAMS revolutionizes your media workflows.
            </Text>
            <Group justify="center" gap="md">
              <Button size="lg" rightSection={<IconArrowRight size={20} />} color="white" variant="filled">
                Explore the Demo
              </Button>
              <Button size="lg" variant="outline" color="white">
                Learn More
              </Button>
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container size="xl" px="xl" py="xl">
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xl">
          {stats.map((stat, i) => (
            <Card key={i} withBorder p="md" ta="center">
              <Group justify="center" mb="xs">
                {stat.icon}
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
      </Container>

      {/* Features Section */}
      <Container size="xl" px="xl" py="xl">
        <Stack align="center" gap="xl">
          <Box ta="center" maw={700}>
            <Title order={2} mb="md">
              Comprehensive Media Management
            </Title>
            <Text size="lg" c="dimmed">
              Nine major features designed for enterprise media workflows
            </Text>
          </Box>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" w="100%">
            {features.map((feature, i) => (
              <Card key={i} withBorder p="xl" style={{ height: '100%' }}>
                <Stack gap="md" h="100%">
                  <Group gap="md">
                    <Box style={{ color: `var(--mantine-color-${feature.color}-6)` }}>
                      {feature.icon}
                    </Box>
                    <Title order={4} style={{ flex: 1 }}>
                      {feature.title}
                    </Title>
                  </Group>
                  <Text c="dimmed" style={{ flex: 1 }}>
                    {feature.description}
                  </Text>
                  <Button 
                    variant="light" 
                    size="sm" 
                    rightSection={<IconArrowRight size={16} />}
                    component="a"
                    href={feature.link}
                  >
                    Explore
                  </Button>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>

      {/* Capabilities Section */}
      <Box py="xl" style={{ background: 'var(--mantine-color-gray-0)' }}>
        <Container size="xl" px="xl">
          <Stack align="center" gap="xl">
            <Box ta="center" maw={700}>
              <Title order={2} mb="md">
                Enterprise Capabilities
              </Title>
              <Text size="lg" c="dimmed">
                Built for production media environments with enterprise-grade features
              </Text>
            </Box>
            <Grid>
              {capabilities.map((capability, i) => (
                <Grid.Col key={i} span={{ base: 12, sm: 6, lg: 4 }}>
                  <Card withBorder p="md">
                    <Group gap="md">
                      <Box style={{ color: 'var(--mantine-color-blue-6)' }}>
                        {capability.icon}
                      </Box>
                      <Box style={{ flex: 1 }}>
                        <Text fw={500} mb="xs">
                          {capability.title}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {capability.description}
                        </Text>
                      </Box>
                    </Group>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Box>

      {/* Technology Stack */}
      <Container size="xl" px="xl" py="xl">
        <Stack align="center" gap="xl">
          <Box ta="center" maw={700}>
            <Title order={2} mb="md">
              Built on Modern Technology
            </Title>
            <Text size="lg" c="dimmed">
              Leveraging cutting-edge technologies for optimal performance
            </Text>
          </Box>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
            <Card withBorder p="md" ta="center">
              <IconServer size={32} style={{ color: 'var(--mantine-color-blue-6)' }} />
              <Text fw={500} mt="sm">VAST Data Platform</Text>
              <Text size="sm" c="dimmed">High-performance storage</Text>
            </Card>
            <Card withBorder p="md" ta="center">
              <IconNetwork size={32} style={{ color: 'var(--mantine-color-green-6)' }} />
              <Text fw={500} mt="sm">FastAPI Backend</Text>
              <Text size="sm" c="dimmed">RESTful API service</Text>
            </Card>
            <Card withBorder p="md" ta="center">
                             <IconBolt size={32} style={{ color: 'var(--mantine-color-orange-6)' }} />
              <Text fw={500} mt="sm">React Frontend</Text>
              <Text size="sm" c="dimmed">Modern UI framework</Text>
            </Card>
            <Card withBorder p="md" ta="center">
              <IconShield size={32} style={{ color: 'var(--mantine-color-purple-6)' }} />
              <Text fw={500} mt="sm">Enterprise Security</Text>
              <Text size="sm" c="dimmed">Production-ready</Text>
            </Card>
          </SimpleGrid>
        </Stack>
      </Container>

      {/* Use Cases */}
      <Box py="xl" style={{ background: 'var(--mantine-color-gray-0)' }}>
        <Container size="xl" px="xl">
          <Stack align="center" gap="xl">
            <Box ta="center" maw={700}>
              <Title order={2} mb="md">
                Perfect For
              </Title>
              <Text size="lg" c="dimmed">
                Media organizations that demand reliability and performance
              </Text>
            </Box>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
              <Card withBorder p="xl" ta="center">
                <IconBroadcast size={48} style={{ color: 'var(--mantine-color-blue-6)' }} />
                <Title order={3} mt="md" mb="sm">Broadcast Media</Title>
                <Text c="dimmed">
                  Live news, sports, and entertainment with real-time processing and instant access to any moment.
                </Text>
              </Card>
              <Card withBorder p="xl" ta="center">
                <IconVideo size={48} style={{ color: 'var(--mantine-color-green-6)' }} />
                <Title order={3} mt="md" mb="sm">Content Archives</Title>
                <Text c="dimmed">
                  Long-term storage and retrieval of media assets with intelligent search and metadata management.
                </Text>
              </Card>
              <Card withBorder p="xl" ta="center">
                <IconActivity size={48} style={{ color: 'var(--mantine-color-orange-6)' }} />
                <Title order={3} mt="md" mb="sm">Production Workflows</Title>
                <Text c="dimmed">
                  Seamless integration with existing production systems and automated media processing pipelines.
                </Text>
              </Card>
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py="xl">
        <Container size="xl" px="xl">
          <Stack align="center" gap="xl">
            <Box ta="center" maw={700}>
              <Title order={2} mb="lg">
                Ready to Transform Your Media Storage?
              </Title>
              <Text size="lg" mb="xl" c="dimmed">
                Experience the power of time-addressable media storage with our interactive demo. 
                See how TAMS can revolutionize your media workflows.
              </Text>
            </Box>
            <Group gap="md">
              <Button size="xl" rightSection={<IconPlayerPlay size={24} />}>
                Start Demo Now
              </Button>
              <Button size="xl" variant="outline" rightSection={<IconExternalLink size={24} />}>
                View Documentation
              </Button>
            </Group>
            <Group gap="lg" mt="xl">
              <Group gap="xs">
                <IconCheck size={16} style={{ color: 'var(--mantine-color-green-6)' }} />
                <Text size="sm">Production Ready</Text>
              </Group>
              <Group gap="xs">
                <IconCheck size={16} style={{ color: 'var(--mantine-color-green-6)' }} />
                <Text size="sm">Enterprise Security</Text>
              </Group>
              <Group gap="xs">
                <IconCheck size={16} style={{ color: 'var(--mantine-color-green-6)' }} />
                <Text size="sm">Scalable Architecture</Text>
              </Group>
            </Group>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
} 