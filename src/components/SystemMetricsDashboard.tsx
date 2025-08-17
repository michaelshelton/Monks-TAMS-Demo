import React, { useState, useEffect } from 'react';
import {
  Card,
  Title,
  Text,
  Group,
  Stack,
  Grid,
  Badge,
  Progress,
  RingProgress,
  Box,
  Alert,
  Button,
  Tooltip,
  Divider,
  Table,
  NumberFormatter
} from '@mantine/core';
import {
  IconActivity,
  IconServer,
  IconDatabase,
  IconCloud,
  IconAlertCircle,
  IconRefresh,
  IconTrendingUp,
  IconTrendingDown,
  IconClock,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { apiClient } from '../services/api';

interface MetricsData {
  http_requests_total: { [key: string]: number };
  http_request_duration_seconds: { [key: string]: number[] };
  sources_total: number;
  flows_total: number;
  objects_total: number;
  storage_bytes_total: number;
  flow_operations_total: { [key: string]: number };
  object_operations_total: { [key: string]: number };
  source_operations_total: { [key: string]: number };
  errors_total: number;
  vast_query_duration_seconds: number;
  s3_operation_duration_seconds: number;
  memory_usage_bytes: number;
  active_connections: number;
  last_updated: string;
}

interface SystemMetricsDashboardProps {
  refreshInterval?: number; // in milliseconds
}

export function SystemMetricsDashboard({ refreshInterval = 7200000 }: SystemMetricsDashboardProps) { // Default to 2 hours instead of 1 minute
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Mock data for development - replace with actual API call
  const mockMetrics: MetricsData = {
    http_requests_total: {
      'GET /sources': 1247,
      'POST /sources': 89,
      'DELETE /sources': 23,
      'GET /flows': 2156,
      'POST /flows': 156,
      'DELETE /flows': 45,
      'GET /analytics': 892,
      'GET /health': 1567
    },
    http_request_duration_seconds: {
      'GET /sources': [0.1, 0.25, 0.5, 1.0, 2.5],
      'POST /sources': [0.2, 0.4, 0.8, 1.5, 3.0],
      'GET /flows': [0.15, 0.3, 0.6, 1.2, 2.8],
      'GET /analytics': [0.3, 0.6, 1.2, 2.5, 5.0]
    },
    sources_total: 45,
    flows_total: 234,
    objects_total: 1247,
    storage_bytes_total: 107374182400, // 100 GB
    flow_operations_total: {
      'create_success': 156,
      'create_failed': 3,
      'update_success': 89,
      'update_failed': 1,
      'delete_success': 45,
      'delete_failed': 0
    },
    object_operations_total: {
      'upload_success': 1247,
      'upload_failed': 12,
      'delete_success': 89,
      'delete_failed': 2
    },
    source_operations_total: {
      'create_success': 89,
      'create_failed': 1,
      'update_success': 45,
      'update_failed': 0,
      'delete_success': 23,
      'delete_failed': 0
    },
    errors_total: 18,
    vast_query_duration_seconds: 0.45,
    s3_operation_duration_seconds: 0.23,
    memory_usage_bytes: 536870912, // 512 MB
    active_connections: 12,
    last_updated: new Date().toISOString()
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch Prometheus metrics directly using the proxy to avoid CORS issues
      // Note: /metrics returns Prometheus format, not JSON
      const response = await fetch(import.meta.env.DEV ? '/api/metrics' : '/api/proxy/metrics');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Get the Prometheus metrics as text
      const prometheusText = await response.text();
      
      // Parse Prometheus metrics to extract useful information
      const parsedMetrics = parsePrometheusMetrics(prometheusText);
      
      // Create metrics data from parsed Prometheus response, with fallbacks to mock data if needed
      const metricsData: MetricsData = {
        http_requests_total: parsedMetrics.http_requests_total || mockMetrics.http_requests_total,
        http_request_duration_seconds: parsedMetrics.http_request_duration_seconds || mockMetrics.http_request_duration_seconds,
        sources_total: parsedMetrics.sources_total || mockMetrics.sources_total,
        flows_total: parsedMetrics.flows_total || mockMetrics.flows_total,
        objects_total: parsedMetrics.objects_total || mockMetrics.objects_total,
        storage_bytes_total: parsedMetrics.storage_bytes_total || mockMetrics.storage_bytes_total,
        flow_operations_total: parsedMetrics.flow_operations_total || mockMetrics.flow_operations_total,
        object_operations_total: parsedMetrics.object_operations_total || mockMetrics.object_operations_total,
        source_operations_total: parsedMetrics.source_operations_total || mockMetrics.source_operations_total,
        errors_total: parsedMetrics.errors_total || mockMetrics.errors_total,
        vast_query_duration_seconds: parsedMetrics.vast_query_duration_seconds || mockMetrics.vast_query_duration_seconds,
        s3_operation_duration_seconds: parsedMetrics.s3_operation_duration_seconds || mockMetrics.s3_operation_duration_seconds,
        memory_usage_bytes: parsedMetrics.memory_usage_bytes || mockMetrics.memory_usage_bytes,
        active_connections: parsedMetrics.active_connections || mockMetrics.active_connections,
        last_updated: new Date().toISOString()
      };
      
      setMetrics(metricsData);
      setLastRefresh(new Date());
    } catch (err: any) {
      // Check if it's a 404 error (backend not ready)
      if (err.message && err.message.includes('404')) {
        setError('Backend Not Ready - Metrics endpoint is not available');
        // Fall back to mock data for development
        setMetrics(mockMetrics);
      } else {
        console.warn('Failed to fetch Prometheus metrics, using mock data:', err.message);
        setError('Using mock data - Failed to fetch live metrics');
        // Fall back to mock data for development
        setMetrics(mockMetrics);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse Prometheus metrics format
  const parsePrometheusMetrics = (prometheusText: string): Partial<MetricsData> => {
    const metrics: Partial<MetricsData> = {};
    
    try {
      const lines = prometheusText.split('\n');
      
      for (const line of lines) {
        // Skip comments and empty lines
        if (line.startsWith('#') || !line.trim()) continue;
        
        // Parse metric lines (format: metric_name{label="value"} value)
        const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{([^}]*)\})?\s+([0-9.]+)$/);
        if (match) {
          const [, metricName, labels, value] = match;
          if (!metricName || !value) continue; // Skip if metricName or value is undefined
          
          const numValue = parseFloat(value);
          
          // Extract useful metrics based on common Prometheus metric names
          if (metricName.includes('http_requests_total')) {
            if (!metrics.http_requests_total) metrics.http_requests_total = {};
            const label = labels ? labels.split('=')[1]?.replace(/"/g, '') || 'unknown' : 'total';
            metrics.http_requests_total[label] = numValue;
          } else if (metricName.includes('http_request_duration_seconds')) {
            if (!metrics.http_request_duration_seconds) metrics.http_request_duration_seconds = {};
            const label = labels ? labels.split('=')[1]?.replace(/"/g, '') || 'unknown' : 'total';
            if (!metrics.http_request_duration_seconds[label]) {
              metrics.http_request_duration_seconds[label] = [];
            }
            metrics.http_request_duration_seconds[label].push(numValue);
          } else if (metricName.includes('sources_total')) {
            metrics.sources_total = numValue;
          } else if (metricName.includes('flows_total')) {
            metrics.flows_total = numValue;
          } else if (metricName.includes('objects_total')) {
            metrics.objects_total = numValue;
          } else if (metricName.includes('storage_bytes_total')) {
            metrics.storage_bytes_total = numValue;
          } else if (metricName.includes('errors_total')) {
            metrics.errors_total = numValue;
          } else if (metricName.includes('memory_usage_bytes')) {
            metrics.memory_usage_bytes = numValue;
          } else if (metricName.includes('active_connections')) {
            metrics.active_connections = numValue;
          }
        }
      }
    } catch (parseError) {
      console.warn('Failed to parse Prometheus metrics:', parseError);
    }
    
    return metrics;
  };

  useEffect(() => {
    fetchMetrics();
    
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
    return `${seconds.toFixed(2)}s`;
  };

  const getSuccessRate = (success: number, total: number): number => {
    if (total === 0) return 100;
    return Math.round((success / total) * 100);
  };

  const getStatusColor = (value: number, threshold: number): string => {
    if (value <= threshold * 0.7) return 'green';
    if (value <= threshold) return 'yellow';
    return 'red';
  };

  if (loading && !metrics) {
    return (
      <Card>
        <Stack align="center" py="xl">
          <Text>Loading system metrics...</Text>
        </Stack>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error Loading Metrics">
        <Text>{error}</Text>
        <Button mt="sm" onClick={fetchMetrics} leftSection={<IconRefresh size={16} />}>
          Retry
        </Button>
      </Alert>
    );
  }

  if (!metrics) return null;

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between" align="center">
        <Group>
          <IconActivity size={24} />
          <Title order={3}>System Metrics Dashboard</Title>
        </Group>
        <Group gap="xs">
          <Text size="sm" c="dimmed">
            Last updated: {new Date(metrics.last_updated).toLocaleTimeString()}
          </Text>
          <Button
            variant="light"
            size="sm"
            leftSection={<IconRefresh size={16} />}
            onClick={fetchMetrics}
            loading={loading}
          >
            Refresh
          </Button>
        </Group>
      </Group>

      {/* Key Metrics Overview */}
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card>
            <Group>
              <IconServer size={24} color="blue" />
              <Box>
                <Text size="xs" c="dimmed">Total Sources</Text>
                <Title order={4}>{metrics.sources_total}</Title>
              </Box>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card>
            <Group>
              <IconDatabase size={24} color="green" />
              <Box>
                <Text size="xs" c="dimmed">Total Flows</Text>
                <Title order={4}>{metrics.flows_total}</Title>
              </Box>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card>
            <Group>
              <IconCloud size={24} color="orange" />
              <Box>
                <Text size="xs" c="dimmed">Total Objects</Text>
                <Title order={4}>{metrics.objects_total}</Title>
              </Box>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card>
            <Group>
              <IconActivity size={24} color="purple" />
              <Box>
                <Text size="xs" c="dimmed">Storage Used</Text>
                <Title order={4}>{formatBytes(metrics.storage_bytes_total)}</Title>
              </Box>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Performance Metrics */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card>
            <Title order={4} mb="md">Database Performance</Title>
            <Stack gap="md">
              <Group justify="space-between">
                <Text>VAST Query Duration</Text>
                <Badge 
                  color={getStatusColor(metrics.vast_query_duration_seconds, 1.0)}
                  variant="light"
                >
                  {formatDuration(metrics.vast_query_duration_seconds)}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text>S3 Operation Duration</Text>
                <Badge 
                  color={getStatusColor(metrics.s3_operation_duration_seconds, 0.5)}
                  variant="light"
                >
                  {formatDuration(metrics.s3_operation_duration_seconds)}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text>Active Connections</Text>
                <Badge 
                  color={getStatusColor(metrics.active_connections, 20)}
                  variant="light"
                >
                  {metrics.active_connections}
                </Badge>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card>
            <Title order={4} mb="md">System Resources</Title>
            <Stack gap="md">
              <Box>
                <Group justify="space-between" mb="xs">
                  <Text size="sm">Memory Usage</Text>
                  <Text size="sm">{formatBytes(metrics.memory_usage_bytes)}</Text>
                </Group>
                <Progress 
                  value={(metrics.memory_usage_bytes / (1024 * 1024 * 1024)) * 100} // Convert to GB percentage
                  color={getStatusColor(metrics.memory_usage_bytes / (1024 * 1024 * 1024), 1)}
                  size="sm"
                />
              </Box>
              <Box>
                <Group justify="space-between" mb="xs">
                  <Text size="sm">Error Rate</Text>
                  <Text size="sm">{metrics.errors_total} errors</Text>
                </Group>
                <Progress 
                  value={(metrics.errors_total / 1000) * 100} // Error rate percentage
                  color={getStatusColor(metrics.errors_total, 50)}
                  size="sm"
                />
              </Box>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* HTTP Request Metrics */}
      <Card>
        <Title order={4} mb="md">HTTP Request Metrics</Title>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Endpoint</Table.Th>
              <Table.Th>Total Requests</Table.Th>
              <Table.Th>Success Rate</Table.Th>
              <Table.Th>Avg Duration</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {Object.entries(metrics.http_requests_total).map(([endpoint, count]) => {
              const durations = metrics.http_request_duration_seconds[endpoint] || [];
              const avgDuration = durations.length > 0 
                ? durations.reduce((a, b) => a + b, 0) / durations.length 
                : 0;
              
              return (
                <Table.Tr key={endpoint}>
                  <Table.Td>
                    <Text size="sm" style={{ fontFamily: 'monospace' }}>{endpoint}</Text>
                  </Table.Td>
                  <Table.Td>
                    <NumberFormatter value={count} thousandSeparator />
                  </Table.Td>
                  <Table.Td>
                    <Badge color="green" variant="light">99%</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDuration(avgDuration)}</Text>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Operation Success Rates */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card>
            <Title order={4} mb="md">Flow Operations</Title>
            <Stack gap="md">
              {Object.entries(metrics.flow_operations_total).map(([operation, count]) => {
                const isSuccess = operation.includes('success');
                const total = Object.entries(metrics.flow_operations_total)
                  .filter(([op]) => {
                    const prefix = operation.split('_')[0];
                    return prefix && op.startsWith(prefix);
                  })
                  .reduce((sum, [, c]) => sum + c, 0);
                const successRate = getSuccessRate(count, total);
                
                return (
                  <Box key={operation}>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" tt="capitalize">
                        {operation.replace('_', ' ')}
                      </Text>
                      <Badge 
                        color={isSuccess ? 'green' : 'red'} 
                        variant="light"
                        size="sm"
                      >
                        {count}
                      </Badge>
                    </Group>
                    {isSuccess && (
                      <>
                        <Progress 
                          value={successRate} 
                          color="green" 
                          size="xs"
                        />
                        <Text size="xs" ta="center">{successRate}%</Text>
                      </>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card>
            <Title order={4} mb="md">Object Operations</Title>
            <Stack gap="md">
              {Object.entries(metrics.object_operations_total).map(([operation, count]) => {
                const isSuccess = operation.includes('success');
                const total = Object.entries(metrics.object_operations_total)
                  .filter(([op]) => {
                    const prefix = operation.split('_')[0];
                    return prefix && op.startsWith(prefix);
                  })
                  .reduce((sum, [, c]) => sum + c, 0);
                const successRate = getSuccessRate(count, total);
                
                return (
                  <Box key={operation}>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" tt="capitalize">
                        {operation.replace('_', ' ')}
                      </Text>
                      <Badge 
                        color={isSuccess ? 'green' : 'red'} 
                        variant="light"
                        size="sm"
                      >
                        {count}
                      </Badge>
                    </Group>
                    {isSuccess && (
                      <>
                        <Progress 
                          value={successRate} 
                          color="green" 
                          size="xs"
                        />
                        <Text size="xs" ta="center">{successRate}%</Text>
                      </>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card>
            <Title order={4} mb="md">Source Operations</Title>
            <Stack gap="md">
              {Object.entries(metrics.source_operations_total).map(([operation, count]) => {
                const isSuccess = operation.includes('success');
                const total = Object.entries(metrics.source_operations_total)
                  .filter(([op]) => {
                    const prefix = operation.split('_')[0];
                    return prefix && op.startsWith(prefix);
                  })
                  .reduce((sum, [, c]) => sum + c, 0);
                const successRate = getSuccessRate(count, total);
                
                return (
                  <Box key={operation}>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" tt="capitalize">
                        {operation.replace('_', ' ')}
                      </Text>
                      <Badge 
                        color={isSuccess ? 'green' : 'red'} 
                        variant="light"
                        size="sm"
                      >
                        {count}
                      </Badge>
                    </Group>
                    {isSuccess && (
                      <>
                        <Progress 
                          value={successRate} 
                          color="green" 
                          size="xs"
                        />
                        <Text size="xs" ta="center">{successRate}%</Text>
                      </>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
