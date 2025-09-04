import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Badge,
  Group,
  Box,
  Button,
  ActionIcon,
  Tooltip,
  Progress,
  Divider,
  Alert,
  Table,
  ScrollArea,
  Grid,
  Paper,
  SimpleGrid,
  Tabs,
  List,
  ThemeIcon,
  Modal,
  TextInput,
  Select,
  Textarea,
  NumberInput,
  Switch,
  Code,
  CopyButton,
  Textarea as MantineTextarea,
  Loader
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconDownload,
  IconTrash,
  IconEdit,
  IconEye,
  IconClock,
  IconTag,
  IconVideo,
  IconMusic,
  IconPhoto,
  IconDatabase,
  IconPlus,
  IconFilter,
  IconSearch,
  IconTimeline,
  IconCalendar,
  IconInfoCircle,
  IconLink,
  IconExternalLink,
  IconCopy,
  IconShare,
  IconFolder,
  IconFile,
  IconDatabase as IconStorage,
  IconNetwork,
  IconServer,
  IconActivity,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconSettings,
  IconRefresh,
  IconArrowLeft,
  IconBroadcast,
  IconSignalE,
  IconPalette,
  IconCode,
  IconContainer,
  IconWebhook,
  IconTestPipe,
  IconKey,
  IconGlobe,
  IconShield,
  IconBell,
  IconPlug,
  IconDatabase as IconEventStream,
  IconHeart,
  IconGauge,
  IconShieldCheck,
  IconCloud
} from '@tabler/icons-react';
import { apiClient } from '../services/api';
import { HealthStatusIndicator } from '../components/HealthStatusIndicator';
import { SystemMetricsDashboard } from '../components/SystemMetricsDashboard';
import { BackendSelector } from '../components/BackendSelector';



// Mock data structure based on backend API models
interface ServiceInfo {
  name: string;
  description: string;
  type: string;
  api_version: string;
  service_version: string;
  media_store: {
    type: string;
  };
  event_stream_mechanisms: Array<{
    name: string;
    description: string;
  }>;
  status: 'healthy' | 'warning' | 'error';
  uptime: number;
  last_updated: string;

  service_dependencies?: Array<{
    name: string;
    type: string;
    status: string;
    health_check_url?: string;
  }>;
  health_endpoints?: Array<{
    path: string;
    method: string;
    description: string;
    status: string;
  }>;
}



// Mock data
const mockServiceInfo: ServiceInfo = {
  name: 'TAMS API',
  description: 'Time-addressable Media Store API with VAST database integration and S3 object storage',
  type: 'urn:x-tams:service:api',
  api_version: '6.0',
  service_version: '1.0.0',
  media_store: {
    type: 'http_object_store'
  },
  event_stream_mechanisms: [
    {
      name: 'webhooks',
      description: 'HTTP webhooks for event notifications on flows, sources, and objects'
    },
    {
      name: 'server-sent-events',
      description: 'Server-Sent Events for real-time updates and monitoring'
    }
  ],
  status: 'healthy',
  uptime: 99.8,
  last_updated: '2024-01-15T10:30:00Z',

  service_dependencies: [
    {
      name: 'VAST Database',
      type: 'database',
      status: 'healthy',
      health_check_url: '/health/vast'
    },
    {
      name: 'S3 Storage',
      type: 'storage',
      status: 'healthy',
      health_check_url: '/health/s3'
    },
    {
      name: 'Redis Cache',
      type: 'cache',
      status: 'healthy',
      health_check_url: '/health/redis'
    }
  ],
  health_endpoints: [
    {
      path: '/health',
      method: 'GET',
      description: 'Overall system health check',
      status: 'healthy'
    },
    {
      path: '/health/vast',
      method: 'GET',
      description: 'VAST database health check',
      status: 'healthy'
    },
    {
      path: '/health/s3',
      method: 'GET',
      description: 'S3 storage health check',
      status: 'healthy'
    },
    {
      path: '/metrics',
      method: 'GET',
      description: 'Prometheus metrics endpoint',
      status: 'healthy'
    }
  ]
};



const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy':
    case 'active':
      return 'green';
    case 'warning':
      return 'yellow';
    case 'error':
    case 'inactive':
      return 'red';
    default:
      return 'gray';
  }
};

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};



export default function Service() {
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch service info from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const serviceResponse = await apiClient.getService();
        setServiceInfo(serviceResponse);
      } catch (err: any) {
        setError('Failed to fetch service information');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      const serviceResponse = await apiClient.getService();
      setServiceInfo(serviceResponse);
    } catch (err: any) {
      setError('Failed to refresh service information');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  const API_BASE_URL = import.meta.env.DEV 
    ? (import.meta.env.VITE_API_URL || 'http://localhost:8000')
    : '/api/proxy';

  return (
    <Container size="xl" px="xl" py="xl">
      {/* Header */}
      <Box mb="xl">
        <Group justify="space-between" align="flex-end">
          <Box>
            <Title order={2} mb="md">Service Configuration</Title>
            <Text size="lg" c="dimmed">
              Manage TAMS service settings and system configuration
            </Text>
          </Box>
          <Group gap="sm">
            <BackendSelector size="sm" showFeatures={false} showInfo={true} />
            <Badge color="green" variant="light" size="lg">
              <IconServer size={16} style={{ marginRight: 8 }} />
              TAMS API
            </Badge>
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={refreshData}
              loading={loading}
            >
              Refresh
            </Button>
          </Group>
        </Group>
      </Box>

      {/* Service Info Box */}
      <Alert
        icon={<IconInfoCircle size={20} />}
        title="What is this page?"
        color="blue"
        variant="light"
        mb="lg"
      >
        <Text size="sm">
          The Service Configuration page provides comprehensive management of your TAMS application's 
          service settings, system health monitoring, and service configuration.
        </Text>
        <Text size="sm" mt="xs">
          This page includes:
        </Text>
        <Text size="sm" mt="xs">
          • <strong>Service Overview</strong> - Basic service information and configuration<br/>
          • <strong>Health & Monitoring</strong> - Real-time system health and performance metrics<br/>
          • <strong>Settings</strong> - General and security configuration options<br/>
          • <strong>API Documentation</strong> - OpenAPI specification and developer resources
        </Text>
        <Text size="sm" mt="xs">
          <strong>Note:</strong> For webhook management, use the dedicated Webhooks page. This page provides 
          comprehensive service management capabilities with real-time monitoring and health features.
        </Text>
      </Alert>

      {/* Error Alert */}
      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          color="red" 
          title="Error"
          withCloseButton
          onClose={() => setError(null)}
          mb="md"
        >
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box ta="center" py="xl">
          <Loader size="lg" />
          <Text mt="md" c="dimmed">Loading service information...</Text>
        </Box>
      )}

      {/* Main Content */}
      {loading ? (
        <Box ta="center" py="xl">
          <Loader size="lg" />
          <Text mt="md" c="dimmed">Loading service information...</Text>
        </Box>
      ) : !serviceInfo ? (
        <Box ta="center" py="xl">
          <Text c="dimmed">No service information available</Text>
        </Box>
      ) : (
        <Tabs defaultValue="overview">
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconInfoCircle size={16} />}>
            Service Overview
          </Tabs.Tab>


          <Tabs.Tab value="health" leftSection={<IconHeart size={16} />}>
            Health & Monitoring
          </Tabs.Tab>
          <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
            Settings
          </Tabs.Tab>
          <Tabs.Tab value="api" leftSection={<IconCode size={16} />}>
            API Documentation
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="xl">
          <Grid>
            <Grid.Col span={8}>
              <Stack gap="lg">
                {/* Service Information */}
                <Card withBorder p="xl">
                  <Title order={4} mb="md">Service Information</Title>
                  <Grid>
                    <Grid.Col span={6}>
                      <Stack gap="md">
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Service Name</Text>
                          <Text size="sm">{serviceInfo?.name}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Description</Text>
                          <Text size="sm">{serviceInfo?.description}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Type</Text>
                          <Text size="sm" style={{ fontFamily: 'monospace' }}>{serviceInfo?.type}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">API Version</Text>
                          <Text size="sm">{serviceInfo?.api_version}</Text>
                        </Box>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Stack gap="md">
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Service Version</Text>
                          <Text size="sm">{serviceInfo?.service_version}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Status</Text>
                          <Badge color={getStatusColor(serviceInfo?.status || '')} variant="light">
                            {serviceInfo?.status}
                          </Badge>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Uptime</Text>
                          <Text size="sm">{serviceInfo?.uptime}%</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Last Updated</Text>
                          <Text size="sm">{formatTimestamp(serviceInfo?.last_updated || '')}</Text>
                        </Box>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Card>

                {/* Media Store Configuration */}
                <Card withBorder p="xl">
                  <Title order={4} mb="md">Media Store Configuration</Title>
                  <Grid>
                    <Grid.Col span={6}>
                      <Stack gap="md">
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Store Type</Text>
                          <Text size="sm">{serviceInfo?.media_store.type}</Text>
                        </Box>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Card>

                {/* Event Stream Mechanisms */}
                <Card withBorder p="xl">
                  <Title order={4} mb="md">Event Stream Mechanisms</Title>
                  <List>
                    {serviceInfo?.event_stream_mechanisms.map((mechanism, index) => (
                      <List.Item
                        key={index}
                        icon={
                          <ThemeIcon color="blue" size="sm">
                            <IconEventStream size={16} />
                          </ThemeIcon>
                        }
                      >
                        <Stack gap="xs">
                          <Text size="sm" fw={500}>{mechanism.name}</Text>
                          <Text size="xs" c="dimmed">{mechanism.description}</Text>
                        </Stack>
                      </List.Item>
                    ))}
                  </List>
                </Card>


              </Stack>
            </Grid.Col>

            <Grid.Col span={4}>
              <Stack gap="lg">
                {/* Service Status */}
                <Card withBorder p="xl">
                  <Title order={4} mb="md">Service Status</Title>
                  <Stack gap="md">
                    <Box>
                      <Text size="sm" fw={500} mb="xs">Overall Health</Text>
                      <Progress
                        value={serviceInfo?.uptime || 0}
                        color={serviceInfo?.status === 'healthy' ? 'green' : 
                               serviceInfo?.status === 'warning' ? 'yellow' : 'red'}
                        size="lg"
                      />
                      <Text size="sm" c="dimmed" mt="xs">
                        {serviceInfo?.uptime}% uptime
                      </Text>
                    </Box>
                    <Box>
                      <Text size="sm" fw={500} mb="xs">Status</Text>
                      <Badge color={getStatusColor(serviceInfo?.status || '')} variant="light" size="lg">
                        {serviceInfo?.status}
                      </Badge>
                    </Box>
                  </Stack>
                </Card>

                {/* Quick Stats */}
                <Card withBorder p="xl">
                  <Title order={4} mb="md">Quick Stats</Title>
                  <Stack gap="md">
                    <Box>
                      <Group gap="xs" mb={4}>
                        <IconActivity size={20} color="#40c057" />
                        <Text size="sm" fw={500} c="dimmed">Service Status</Text>
                      </Group>
                      <Text size="lg" fw={600}>
                        {serviceInfo?.status || 'Unknown'}
                      </Text>
                    </Box>
                    <Box>
                      <Group gap="xs" mb={4}>
                        <IconHeart size={20} color="#40c057" />
                        <Text size="sm" fw={500} c="dimmed">Uptime</Text>
                      </Group>
                      <Text size="lg" fw={600}>
                        {serviceInfo?.uptime || 0}%
                      </Text>
                    </Box>
                    <Box>
                      <Group gap="xs" mb={4}>
                        <IconServer size={20} color="#40c057" />
                        <Text size="sm" fw={500} c="dimmed">API Version</Text>
                      </Group>
                      <Text size="lg" fw={600}>
                        {serviceInfo?.api_version || '6.0'}
                      </Text>
                    </Box>
                  </Stack>
                </Card>
              </Stack>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>





        <Tabs.Panel value="health" pt="xl">
          <Stack gap="lg">
            {/* Real-time Health Monitoring */}
            <Card withBorder p="xl">
              <Title order={4} mb="lg">Real-Time System Health</Title>
              <HealthStatusIndicator showDetails={true} refreshInterval={7200000} /> {/* Refresh every 2 hours instead of every minute */}
            </Card>
            
            {/* System Metrics Dashboard */}
            <Card withBorder p="xl">
              <Title order={4} mb="lg">System Performance Metrics</Title>
              <SystemMetricsDashboard refreshInterval={7200000} /> {/* Refresh every 2 hours instead of every minute */}
            </Card>

            {/* Health Status Overview */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
              <Card withBorder p="xl">
                <Stack align="center" py="md">
                  <IconServer size={32} color="blue" />
                  <Title order={4}>API Server</Title>
                  <HealthStatusIndicator showDetails={false} />
                </Stack>
              </Card>
              
              <Card withBorder p="xl">
                <Stack align="center" py="md">
                  <IconDatabase size={32} color="green" />
                  <Title order={4}>VAST Database</Title>
                  <HealthStatusIndicator showDetails={false} />
                </Stack>
              </Card>
              
              <Card withBorder p="xl">
                <Stack align="center" py="xl">
                  <IconCloud size={32} color="orange" />
                  <Title order={4}>S3 Storage</Title>
                  <HealthStatusIndicator showDetails={false} />
                </Stack>
              </Card>
              
              <Card withBorder p="xl">
                <Stack align="center" py="md">
                  <IconActivity size={32} color="purple" />
                  <Title order={4}>Overall System</Title>
                  <HealthStatusIndicator showDetails={false} />
                </Stack>
              </Card>
            </SimpleGrid>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="settings" pt="xl">
          <Grid>
            <Grid.Col span={6}>
              <Card withBorder p="xl">
                <Title order={4} mb="md">General Settings</Title>
                <Stack gap="md">
                  <TextInput
                    label="Service Name"
                    value={serviceInfo?.name}
                    onChange={() => {}}
                  />
                  <Textarea
                    label="Description"
                    value={serviceInfo?.description}
                    onChange={() => {}}
                    rows={3}
                  />
                  <Select
                    label="Service Status"
                    value={serviceInfo?.status || null}
                    onChange={() => {}}
                    data={[
                      { value: 'healthy', label: 'Healthy' },
                      { value: 'warning', label: 'Warning' },
                      { value: 'error', label: 'Error' }
                    ]}
                  />
                  <Switch
                    label="Enable Debug Mode"
                    checked={false}
                    onChange={() => {}}
                  />
                  <Switch
                    label="Enable Event Logging"
                    checked={true}
                    onChange={() => {}}
                  />
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={6}>
              <Card withBorder p="xl">
                <Title order={4} mb="md">Security Settings</Title>
                <Stack gap="md">
                  <TextInput
                    label="API Key Header"
                    value="X-API-Key"
                    onChange={() => {}}
                  />
                  <TextInput
                    label="Rate Limit (requests/min)"
                    value="1000"
                    onChange={() => {}}
                  />
                  <Switch
                    label="Require HTTPS"
                    checked={true}
                    onChange={() => {}}
                  />
                  <Switch
                    label="Enable CORS"
                    checked={true}
                    onChange={() => {}}
                  />
                  <Switch
                    label="Enable Request Logging"
                    checked={true}
                    onChange={() => {}}
                  />
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="api" pt="xl">
          <Card withBorder p="xl">
            <Title order={4} mb="md">API Documentation</Title>
            <Stack gap="md">
              <Box>
                <Text size="sm" fw={500} mb="xs">OpenAPI Specification</Text>
                <Group gap="xs">
                  <Button
                    variant="light"
                    leftSection={<IconExternalLink size={16} />}
                    onClick={() => window.open('/docs', '_blank')}
                  >
                    View Swagger UI
                  </Button>
                  <Button
                    variant="light"
                    leftSection={<IconDownload size={16} />}
                    onClick={() => window.open('/openapi.json', '_blank')}
                  >
                    Download OpenAPI JSON
                  </Button>
                </Group>
              </Box>
              
              <Box>
                <Text size="sm" fw={500} mb="xs">API Base URL</Text>
                <Group gap="xs">
                  <Text size="sm" style={{ fontFamily: 'monospace' }}>
                    {API_BASE_URL}
                  </Text>
                  <CopyButton value={API_BASE_URL}>
                    {({ copied, copy }) => (
                      <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
                        {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                      </ActionIcon>
                    )}
                  </CopyButton>
                </Group>
              </Box>
              
              <Box>
                <Text size="sm" fw={500} mb="xs">API Version</Text>
                <Text size="sm">{serviceInfo?.api_version}</Text>
              </Box>
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>
      )}


    </Container>
  );
}

 