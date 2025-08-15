import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Stack,
  Tabs,
  Card,
  Box,
  Badge,
  Alert,
  Button,
  Grid,
  Divider,
  Loader
} from '@mantine/core';
import {
  IconActivity,
  IconHeart,
  IconChartBar,
  IconServer,
  IconDatabase,
  IconCloud,
  IconAlertTriangle,
  IconInfoCircle,
  IconRefresh,
  IconTrendingUp,
  IconTrendingDown
} from '@tabler/icons-react';
import { SystemMetricsDashboard } from '../components/SystemMetricsDashboard';
import { HealthStatusIndicator } from '../components/HealthStatusIndicator';
import { apiClient } from '../services/api';

export default function Observability() {
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // No specific data fetching needed for this page yet,
        // as it's primarily a dashboard for monitoring.
        // If future data fetching is required, add it here.
      } catch (err) {
        setError('Failed to fetch observability data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading && !error) {
    return (
      <Container size="xl" px="xl" py="xl">
        <Box display="flex" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <Loader variant="dots" />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" px="xl" py="xl">
        <Box display="flex" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <Stack align="center">
            <Alert icon={<IconAlertTriangle size={16} />} color="red" title="Error" mb="md">
              {error}
            </Alert>
            <Button onClick={() => window.location.reload()} leftSection={<IconRefresh size={16} />}>
              Retry
            </Button>
          </Stack>
        </Box>
      </Container>
    );
  }

  return (
    <Container size="xl" px="xl" py="xl">
      {/* Header */}
      <Box mb="xl">
        <Group justify="space-between" align="flex-end">
          <Box>
            <Title order={2} mb="md">
              System Observability Dashboard
            </Title>
            <Text size="lg" c="dimmed">
              Monitor system performance, health, and metrics in real-time
            </Text>
          </Box>
          <Group>
            <HealthStatusIndicator showDetails={true} />
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
            <Badge color="blue" variant="light" size="lg">
              Backend v6.0
            </Badge>
          </Group>
        </Group>
      </Box>

      {/* Feature Overview */}
      <Alert icon={<IconInfoCircle size={16} />} color="blue" mb="lg">
        <Text size="sm">
          <strong>New in Backend v6.0:</strong> Enhanced observability with Prometheus metrics, 
          OpenTelemetry tracing, and comprehensive health monitoring. This dashboard provides 
          real-time insights into system performance, resource usage, and operational health.
        </Text>
      </Alert>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab 
            value="overview" 
            leftSection={<IconActivity size={16} />}
          >
            Overview
          </Tabs.Tab>
          <Tabs.Tab 
            value="metrics" 
            leftSection={<IconChartBar size={16} />}
          >
            System Metrics
          </Tabs.Tab>
          <Tabs.Tab 
            value="health" 
            leftSection={<IconHeart size={16} />}
          >
            Health Status
          </Tabs.Tab>
          <Tabs.Tab 
            value="performance" 
            leftSection={<IconTrendingUp size={16} />}
          >
            Performance
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="lg">
          <Stack gap="lg">
            {/* Quick Status Overview */}
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card>
                  <Stack align="center" py="md">
                    <IconServer size={32} color="blue" />
                    <Title order={4}>API Server</Title>
                    <HealthStatusIndicator showDetails={false} />
                  </Stack>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card>
                  <Stack align="center" py="md">
                    <IconDatabase size={32} color="green" />
                    <Title order={4}>VAST Database</Title>
                    <HealthStatusIndicator showDetails={false} />
                  </Stack>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card>
                  <Stack align="center" py="md">
                    <IconCloud size={32} color="orange" />
                    <Title order={4}>S3 Storage</Title>
                    <HealthStatusIndicator showDetails={false} />
                  </Stack>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card>
                  <Stack align="center" py="md">
                    <IconActivity size={32} color="purple" />
                    <Title order={4}>Overall System</Title>
                    <HealthStatusIndicator showDetails={false} />
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>

            {/* Key Features */}
            <Card>
              <Title order={4} mb="md">Observability Features</Title>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="md">
                    <Group>
                      <IconActivity size={20} color="blue" />
                      <Box>
                        <Text fw={500}>Prometheus Metrics</Text>
                        <Text size="sm" c="dimmed">
                          Comprehensive system metrics collection and monitoring
                        </Text>
                      </Box>
                    </Group>
                    
                    <Group>
                      <IconHeart size={20} color="green" />
                      <Box>
                        <Text fw={500}>Enhanced Health Checks</Text>
                        <Text size="sm" c="dimmed">
                          Detailed system health monitoring with service status
                        </Text>
                      </Box>
                    </Group>
                    
                    <Group>
                      <IconTrendingUp size={20} color="orange" />
                      <Box>
                        <Text fw={500}>Performance Monitoring</Text>
                        <Text size="sm" c="dimmed">
                          Real-time performance metrics and resource usage
                        </Text>
                      </Box>
                    </Group>
                  </Stack>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="md">
                    <Group>
                      <IconDatabase size={20} color="purple" />
                      <Box>
                        <Text fw={500}>VAST Database Metrics</Text>
                        <Text size="sm" c="dimmed">
                          Query performance and connection monitoring
                        </Text>
                      </Box>
                    </Group>
                    
                    <Group>
                      <IconCloud size={20} color="cyan" />
                      <Box>
                        <Text fw={500}>S3 Storage Metrics</Text>
                        <Text size="sm" c="dimmed">
                          Storage operation performance and reliability
                        </Text>
                      </Box>
                    </Group>
                    
                    <Group>
                      <IconAlertTriangle size={20} color="red" />
                      <Box>
                        <Text fw={500}>Error Tracking</Text>
                        <Text size="sm" c="dimmed">
                          Comprehensive error monitoring and alerting
                        </Text>
                      </Box>
                    </Group>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card>

            {/* API Endpoints */}
            <Card>
              <Title order={4} mb="md">Available Endpoints</Title>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="sm">
                    <Group>
                      <Badge color="green" variant="light">GET</Badge>
                      <Text size="sm" style={{ fontFamily: 'monospace' }}>/metrics</Text>
                      <Text size="sm" c="dimmed">Prometheus metrics</Text>
                    </Group>
                    <Group>
                      <Badge color="blue" variant="light">GET</Badge>
                      <Text size="sm" style={{ fontFamily: 'monospace' }}>/health</Text>
                      <Text size="sm" c="dimmed">Enhanced health check</Text>
                    </Group>
                  </Stack>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="sm">
                    <Group>
                      <Badge color="purple" variant="light">GET</Badge>
                      <Text size="sm" style={{ fontFamily: 'monospace' }}>/openapi.json</Text>
                      <Text size="sm" c="dimmed">API specification</Text>
                    </Group>
                    <Group>
                      <Badge color="orange" variant="light">GET</Badge>
                      <Text size="sm" style={{ fontFamily: 'monospace' }}>/docs</Text>
                      <Text size="sm" c="dimmed">Interactive API docs</Text>
                    </Group>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="metrics" pt="lg">
          <SystemMetricsDashboard refreshInterval={30000} />
        </Tabs.Panel>

        <Tabs.Panel value="health" pt="lg">
          <Stack gap="lg">
            <Card>
              <Title order={4} mb="md">System Health Overview</Title>
              <HealthStatusIndicator showDetails={true} refreshInterval={15000} />
            </Card>
            
            <Alert icon={<IconInfoCircle size={16} />} color="blue">
              <Text size="sm">
                The health status indicator shows real-time system health information including 
                service status, resource usage, and performance metrics. Click on the health badges 
                to see detailed information.
              </Text>
            </Alert>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="performance" pt="lg">
          <Stack gap="lg">
            <Card>
              <Title order={4} mb="md">Performance Monitoring</Title>
              <Text c="dimmed" mb="md">
                Real-time performance metrics and resource utilization monitoring
              </Text>
              
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Box>
                    <Text fw={500} mb="xs">Database Performance</Text>
                    <Text size="sm" c="dimmed">
                      Monitor VAST database query performance, connection pools, and response times
                    </Text>
                  </Box>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Box>
                    <Text fw={500} mb="xs">Storage Performance</Text>
                    <Text size="sm" c="dimmed">
                      Track S3 storage operation performance, upload/download speeds, and reliability
                    </Text>
                  </Box>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Box>
                    <Text fw={500} mb="xs">API Performance</Text>
                    <Text size="sm" c="dimmed">
                      Monitor API endpoint response times, throughput, and error rates
                    </Text>
                  </Box>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Box>
                    <Text fw={500} mb="xs">Resource Usage</Text>
                    <Text size="sm" c="dimmed">
                      Track CPU, memory, and disk usage to prevent resource bottlenecks
                    </Text>
                  </Box>
                </Grid.Col>
              </Grid>
            </Card>
            
            <Alert icon={<IconAlertTriangle size={16} />} color="yellow">
              <Text size="sm">
                <strong>Note:</strong> Performance metrics are now using real-time data from the backend API. 
                If you see mock data, it means the backend endpoints are not responding and the system has 
                fallen back to development data.
              </Text>
            </Alert>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
