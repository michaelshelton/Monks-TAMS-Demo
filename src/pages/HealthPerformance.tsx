import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Card,
  Text,
  Badge,
  Group,
  Box,
  Button,
  Alert,
  Loader,
  Stack,
  SimpleGrid,
  Progress,
  ThemeIcon,
  Paper,
  Divider,
  ActionIcon,
} from '@mantine/core';
import {
  IconHeartbeat,
  IconDatabase,
  IconServer,
  IconRefresh,
  IconDownload,
  IconActivity,
  IconClock,
  IconFileDatabase,
  IconChartBar,
  IconAlertCircle,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { apiClient } from '../services/api';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    mongodb?: 'healthy' | 'unhealthy';
    minio?: 'healthy' | 'unhealthy';
  };
}

interface ServiceInfo {
  name: string;
  version: string;
  capabilities: {
    sources: boolean;
    flows: boolean;
    segments: boolean;
    metadata: boolean;
    tags: boolean;
    storage_backends: string[];
  };
}

interface FlowStats {
  flow_id: string;
  total_segments: number;
  total_size_bytes: number;
  average_segment_size: number;
  oldest_segment: string | null;
  newest_segment: string | null;
  segments_per_hour: number;
  bandwidth_mbps: string;
  storage_used_gb: string;
}

interface AggregatedStats {
  totalFlows: number;
  totalSegments: number;
  totalStorageGB: number;
  averageBandwidth: number;
  totalSources: number;
}

export default function HealthPerformance() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [service, setService] = useState<ServiceInfo | null>(null);
  const [aggregatedStats, setAggregatedStats] = useState<AggregatedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchHealthData = async () => {
    try {
      setError(null);
      
      // Fetch health status
      const healthData = await apiClient.health.getHealth();
      setHealth(healthData);
      
      // Fetch service info
      const serviceData = await apiClient.health.getService();
      setService(serviceData);
      
      // Fetch flows and aggregate stats
      const flowsResponse = await apiClient.flows.list();
      const flows = Array.isArray(flowsResponse) ? flowsResponse : flowsResponse.flows || [];
      
      // Fetch sources count
      const sourcesResponse = await apiClient.sources.list();
      const sources = Array.isArray(sourcesResponse) ? sourcesResponse : sourcesResponse.sources || [];
      
      // Aggregate stats from all flows
      let totalSegments = 0;
      let totalStorageBytes = 0;
      let totalBandwidth = 0;
      let flowCount = 0;
      
      // Get stats for each flow
      for (const flow of flows) {
        const flowId = flow.id || flow._id;
        if (flowId) {
          try {
            const stats: FlowStats = await apiClient.health.getFlowStats(flowId);
            totalSegments += stats.total_segments;
            totalStorageBytes += stats.total_size_bytes;
            totalBandwidth += parseFloat(stats.bandwidth_mbps);
            flowCount++;
          } catch (err) {
            console.warn(`Failed to fetch stats for flow ${flowId}:`, err);
          }
        }
      }
      
      setAggregatedStats({
        totalFlows: flows.length,
        totalSegments,
        totalStorageGB: totalStorageBytes / (1024 * 1024 * 1024),
        averageBandwidth: flowCount > 0 ? totalBandwidth / flowCount : 0,
        totalSources: sources.length,
      });
      
      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to fetch health data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    
    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchHealthData, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const exportDiagnostics = () => {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      health,
      service,
      stats: aggregatedStats,
    };
    
    const blob = new Blob([JSON.stringify(diagnostics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tams-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'degraded': return 'yellow';
      case 'unhealthy': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'healthy': return <IconCheck size={16} />;
      case 'unhealthy': return <IconX size={16} />;
      default: return <IconAlertCircle size={16} />;
    }
  };

  if (loading) {
    return (
      <Container size="xl">
        <Box ta="center" py="xl">
          <Loader size="lg" />
          <Text mt="md" c="dimmed">Loading health data...</Text>
        </Box>
      </Container>
    );
  }

  if (error && !health) {
    return (
      <Container size="xl">
        <Alert color="red" title="Error loading health data">
          {error}
        </Alert>
        <Button mt="md" onClick={fetchHealthData} leftSection={<IconRefresh size={16} />}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Group justify="space-between" mb="lg">
        <Group>
          <ThemeIcon size="xl" radius="md" variant="gradient" gradient={{ from: 'purple', to: 'pink', deg: 45 }}>
            <IconHeartbeat size={28} />
          </ThemeIcon>
          <div>
            <Title order={1}>Health & Performance</Title>
            <Text size="sm" c="dimmed">System diagnostics and metrics</Text>
          </div>
        </Group>
        
        <Group>
          <Badge variant="light" color={autoRefresh ? 'green' : 'gray'}>
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Badge>
          <Button
            variant="light"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
          </Button>
          <ActionIcon variant="default" size="lg" onClick={fetchHealthData}>
            <IconRefresh size={18} />
          </ActionIcon>
          <ActionIcon variant="default" size="lg" onClick={exportDiagnostics}>
            <IconDownload size={18} />
          </ActionIcon>
        </Group>
      </Group>

      {/* System Health Section */}
      <Card withBorder mb="lg">
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <ThemeIcon size="md" radius="md" variant="light" color="green">
              <IconActivity size={18} />
            </ThemeIcon>
            <Title order={3}>System Health</Title>
          </Group>
          <Badge size="lg" variant="filled" color={getStatusColor(health?.status)}>
            {health?.status?.toUpperCase() || 'UNKNOWN'}
          </Badge>
        </Group>
        
        <SimpleGrid cols={2} spacing="md">
          <Paper p="md" withBorder>
            <Group justify="space-between">
              <Group>
                <ThemeIcon size="lg" radius="md" variant="light" color="purple">
                  <IconDatabase size={20} />
                </ThemeIcon>
                <div>
                  <Text fw={500}>MongoDB</Text>
                  <Text size="xs" c="dimmed">Database Service</Text>
                </div>
              </Group>
              <Badge
                size="lg"
                variant="filled"
                color={getStatusColor(health?.services?.mongodb)}
                leftSection={getStatusIcon(health?.services?.mongodb)}
              >
                {health?.services?.mongodb?.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder>
            <Group justify="space-between">
              <Group>
                <ThemeIcon size="lg" radius="md" variant="light" color="orange">
                  <IconServer size={20} />
                </ThemeIcon>
                <div>
                  <Text fw={500}>MinIO</Text>
                  <Text size="xs" c="dimmed">Storage Service</Text>
                </div>
              </Group>
              <Badge
                size="lg"
                variant="filled"
                color={getStatusColor(health?.services?.minio)}
                leftSection={getStatusIcon(health?.services?.minio)}
              >
                {health?.services?.minio?.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </Group>
          </Paper>
        </SimpleGrid>
        
        <Text size="xs" c="dimmed" mt="md">
          Last checked: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'Never'}
        </Text>
      </Card>

      {/* Storage Metrics Section */}
      <Card withBorder mb="lg">
        <Group gap="xs" mb="md">
          <ThemeIcon size="md" radius="md" variant="light" color="blue">
            <IconDatabase size={18} />
          </ThemeIcon>
          <Title order={3}>Storage Metrics</Title>
        </Group>
        
        <SimpleGrid cols={3} spacing="md">
          <Paper p="md" withBorder>
            <Group>
              <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                <IconFileDatabase size={20} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">Total Storage</Text>
                <Text size="xl" fw={700}>{aggregatedStats?.totalStorageGB.toFixed(2)} GB</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder>
            <Group>
              <ThemeIcon size="lg" radius="md" variant="light" color="green">
                <IconChartBar size={20} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">Total Segments</Text>
                <Text size="xl" fw={700}>{aggregatedStats?.totalSegments.toLocaleString()}</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder>
            <Group>
              <ThemeIcon size="lg" radius="md" variant="light" color="purple">
                <IconActivity size={20} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">Avg Bandwidth</Text>
                <Text size="xl" fw={700}>{aggregatedStats?.averageBandwidth.toFixed(2)} Mbps</Text>
              </div>
            </Group>
          </Paper>
        </SimpleGrid>
        
        {aggregatedStats && aggregatedStats.totalStorageGB > 0 && (
          <Box mt="md">
            <Text size="sm" mb="xs">Storage Usage</Text>
            <Progress
              value={Math.min((aggregatedStats.totalStorageGB / 100) * 100, 100)}
              size="lg"
              radius="md"
              color={aggregatedStats.totalStorageGB > 80 ? 'red' : aggregatedStats.totalStorageGB > 50 ? 'yellow' : 'green'}
            />
            <Text size="xs" c="dimmed" mt="xs">
              {aggregatedStats.totalStorageGB.toFixed(2)} GB used
            </Text>
          </Box>
        )}
      </Card>

      {/* System Info Section */}
      <Card withBorder mb="lg">
        <Group gap="xs" mb="md">
          <ThemeIcon size="md" radius="md" variant="light" color="orange">
            <IconServer size={18} />
          </ThemeIcon>
          <Title order={3}>System Information</Title>
        </Group>
        
        <SimpleGrid cols={2} spacing="md">
          <Paper p="md" withBorder>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>Service Name:</Text>
                <Text size="sm">{service?.name || 'Unknown'}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" fw={500}>Version:</Text>
                <Badge variant="filled" color="blue">{service?.version || 'Unknown'}</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm" fw={500}>Total Flows:</Text>
                <Badge variant="filled" color="gray">{aggregatedStats?.totalFlows || 0}</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm" fw={500}>Total Sources:</Text>
                <Badge variant="filled" color="gray">{aggregatedStats?.totalSources || 0}</Badge>
              </Group>
            </Stack>
          </Paper>
          
          <Paper p="md" withBorder>
            <Text size="sm" fw={500} mb="xs">Capabilities:</Text>
            <Group gap="xs">
              {service?.capabilities && Object.entries(service.capabilities).map(([key, value]) => {
                if (typeof value === 'boolean') {
                  return (
                    <Badge
                      key={key}
                      variant="light"
                      color={value ? 'green' : 'gray'}
                      leftSection={value ? <IconCheck size={12} /> : <IconX size={12} />}
                    >
                      {key}
                    </Badge>
                  );
                }
                return null;
              })}
            </Group>
            {service?.capabilities?.storage_backends && (
              <>
                <Text size="sm" fw={500} mt="sm" mb="xs">Storage Backends:</Text>
                <Group gap="xs">
                  {service.capabilities.storage_backends.map((backend) => (
                    <Badge key={backend} variant="light" color="blue">
                      {backend}
                    </Badge>
                  ))}
                </Group>
              </>
            )}
          </Paper>
        </SimpleGrid>
      </Card>

      {/* Footer */}
      <Text size="xs" c="dimmed" ta="center">
        <IconClock size={12} style={{ verticalAlign: 'middle' }} /> Last refresh: {lastRefresh.toLocaleTimeString()}
      </Text>
    </Container>
  );
}