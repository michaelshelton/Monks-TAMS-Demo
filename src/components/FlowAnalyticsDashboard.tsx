import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Group,
  Button,
  Stack,
  Divider,
  Alert,
  Box,
  Title,
  Grid,
  Paper,
  Progress,
  RingProgress,
  Badge,
  Select,
  Loader,
  ScrollArea
} from '@mantine/core';
import {
  IconChartBar,
  IconTrendingUp,
  IconTrendingDown,
  IconDatabase,
  IconClock,
  IconActivity,
  IconRefresh,
  IconX,
  IconInfoCircle,
  IconCalendar,
  IconNetwork
} from '@tabler/icons-react';
import { apiClient } from '../services/api';

interface FlowAnalyticsDashboardProps {
  flowId: string;
  disabled?: boolean;
}

interface FlowUsageAnalytics {
  total_segments: number;
  total_duration: number;
  total_size: number;
  average_bitrate: number;
  peak_bitrate: number;
  frame_drops: number;
  quality_score: number;
  uptime_percentage: number;
  last_24h_segments: number;
  last_24h_size: number;
  last_7d_segments: number;
  last_7d_size: number;
  last_30d_segments: number;
  last_30d_size: number;
}

interface StorageUsageAnalytics {
  storage_used: number;
  storage_limit: number;
  storage_percentage: number;
  oldest_segment: string;
  newest_segment: string;
  segment_count: number;
  average_segment_size: number;
  largest_segment: number;
  smallest_segment: number;
}

interface TimeRangeAnalytics {
  hourly_usage: Array<{ hour: number; segments: number; size: number }>;
  daily_usage: Array<{ date: string; segments: number; size: number }>;
  weekly_usage: Array<{ week: string; segments: number; size: number }>;
  monthly_usage: Array<{ month: string; segments: number; size: number }>;
}

export function FlowAnalyticsDashboard({ 
  flowId, 
  disabled = false 
}: FlowAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [usageAnalytics, setUsageAnalytics] = useState<FlowUsageAnalytics | null>(null);
  const [storageAnalytics, setStorageAnalytics] = useState<StorageUsageAnalytics | null>(null);
  const [timeRangeAnalytics, setTimeRangeAnalytics] = useState<TimeRangeAnalytics | null>(null);

  useEffect(() => {
    if (flowId) {
      loadAnalytics();
    }
  }, [flowId, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load different types of analytics
      const [usageResponse, storageResponse, timeResponse] = await Promise.allSettled([
        apiClient.getFlowUsageAnalytics(),
        apiClient.getStorageUsageAnalytics(),
        apiClient.getTimeRangeAnalytics()
      ]);

      // Handle usage analytics
      if (usageResponse.status === 'fulfilled' && usageResponse.value) {
        setUsageAnalytics(usageResponse.value);
      }

      // Handle storage analytics
      if (storageResponse.status === 'fulfilled' && storageResponse.value) {
        setStorageAnalytics(storageResponse.value);
      }

      // Handle time range analytics
      if (timeResponse.status === 'fulfilled' && timeResponse.value) {
        setTimeRangeAnalytics(timeResponse.value);
      }

      // Log any failed responses for debugging
      if (usageResponse.status === 'rejected') {
        console.warn('Usage analytics failed:', usageResponse.reason);
      }
      if (storageResponse.status === 'rejected') {
        console.warn('Storage analytics failed:', storageResponse.reason);
      }
      if (timeResponse.status === 'rejected') {
        console.warn('Time range analytics failed:', timeResponse.reason);
      }

      // If no analytics data was loaded, provide fallback mock data for development
      if (!usageAnalytics && !storageAnalytics && !timeRangeAnalytics) {
        console.log('No analytics data available, using fallback mock data');
      }

    } catch (err: any) {
      setError('Failed to load analytics data');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '24h': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case 'all': return 'All Time';
      default: return 'Last 7 Days';
    }
  };

  const getUsageData = () => {
    if (!usageAnalytics) return null;
    
    switch (timeRange) {
      case '24h':
        return {
          segments: usageAnalytics.last_24h_segments,
          size: usageAnalytics.last_24h_size
        };
      case '7d':
        return {
          segments: usageAnalytics.last_7d_segments,
          size: usageAnalytics.last_7d_size
        };
      case '30d':
        return {
          segments: usageAnalytics.last_30d_segments,
          size: usageAnalytics.last_30d_size
        };
      case 'all':
        return {
          segments: usageAnalytics.total_segments,
          size: usageAnalytics.total_size
        };
      default:
        return {
          segments: usageAnalytics.last_7d_segments,
          size: usageAnalytics.last_7d_size
        };
    }
  };

  if (loading && !usageAnalytics && !storageAnalytics) {
    return (
      <Card withBorder>
        <Stack gap="md" align="center" py="xl">
          <Loader size="lg" />
          <Text size="lg" c="dimmed">Loading flow analytics...</Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack gap="xl">
      {/* Header */}
      <Card withBorder>
        <Group justify="space-between" align="center">
          <Box>
            <Group gap="sm" align="center">
              <IconChartBar size={24} color="#228be6" />
              <Title order={3}>Flow Analytics Dashboard</Title>
            </Group>
            <Text size="sm" c="dimmed" mt="xs">
              Comprehensive analytics and performance metrics for this flow
            </Text>
          </Box>
          
          <Group gap="xs">
            <Select
              label="Time Range"
              value={timeRange}
              onChange={(value) => setTimeRange((value as any) || '7d')}
              data={[
                { value: '24h', label: 'Last 24 Hours' },
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: 'all', label: 'All Time' }
              ]}
              size="sm"
              disabled={disabled}
            />
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={loadAnalytics}
              loading={loading}
              disabled={disabled}
            >
              Refresh
            </Button>
          </Group>
        </Group>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert icon={<IconX size={16} />} color="red" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Usage Overview */}
      {usageAnalytics && (
        <Card withBorder>
          <Title order={4} mb="lg">Usage Overview - {getTimeRangeLabel()}</Title>
          <Grid>
            <Grid.Col span={3}>
              <Paper withBorder p="md" ta="center">
                <IconActivity size={32} color="#228be6" />
                <Text size="lg" fw={600}>
                  {getUsageData()?.segments || 0}
                </Text>
                <Text size="sm" c="dimmed">Segments</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={3}>
              <Paper withBorder p="md" ta="center">
                <IconDatabase size={32} color="#40c057" />
                <Text size="lg" fw={600}>
                  {getUsageData()?.size ? formatFileSize(getUsageData()!.size) : '0 B'}
                </Text>
                <Text size="sm" c="dimmed">Total Size</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={3}>
              <Paper withBorder p="md" ta="center">
                <IconClock size={32} color="#fd7e14" />
                <Text size="lg" fw={600}>
                  {usageAnalytics.total_duration ? formatDuration(usageAnalytics.total_duration) : '0s'}
                </Text>
                <Text size="sm" c="dimmed">Total Duration</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={3}>
              <Paper withBorder p="md" ta="center">
                <IconNetwork size={32} color="#7950f2" />
                <Text size="lg" fw={600}>
                  {usageAnalytics.average_bitrate ? Math.round(usageAnalytics.average_bitrate / 1000000) : 0}
                </Text>
                <Text size="sm" c="dimmed">Avg Bitrate (Mbps)</Text>
              </Paper>
            </Grid.Col>
          </Grid>
        </Card>
      )}

      {/* Performance Metrics */}
      {usageAnalytics && (
        <Grid>
          <Grid.Col span={6}>
            <Card withBorder>
              <Title order={4} mb="md">Quality Metrics</Title>
              <Stack gap="lg">
                <Box>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={500}>Quality Score</Text>
                    <Text size="sm" fw={600}>{usageAnalytics.quality_score}%</Text>
                  </Group>
                  <Progress
                    value={usageAnalytics.quality_score}
                    color={usageAnalytics.quality_score > 90 ? 'green' : 
                           usageAnalytics.quality_score > 70 ? 'yellow' : 'red'}
                    size="lg"
                  />
                </Box>
                
                <Box>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={500}>Uptime</Text>
                    <Text size="sm" fw={600}>{usageAnalytics.uptime_percentage}%</Text>
                  </Group>
                  <Progress
                    value={usageAnalytics.uptime_percentage}
                    color="green"
                    size="lg"
                  />
                </Box>
                
                <Box>
                  <Text size="sm" fw={500} mb="xs">Frame Drops</Text>
                  <Text size="lg" fw={600} color={usageAnalytics.frame_drops > 10 ? 'red' : 'green'}>
                    {usageAnalytics.frame_drops} frames
                  </Text>
                </Box>
              </Stack>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={6}>
            <Card withBorder>
              <Title order={4} mb="md">Bitrate Analysis</Title>
              <Stack gap="lg">
                <Box>
                  <Text size="sm" fw={500} mb="xs">Peak Bitrate</Text>
                  <Text size="lg" fw={600} color="#fd7e14">
                    {usageAnalytics.peak_bitrate ? Math.round(usageAnalytics.peak_bitrate / 1000000) : 0} Mbps
                  </Text>
                </Box>
                
                <Box>
                  <Text size="sm" fw={500} mb="xs">Average Bitrate</Text>
                  <Text size="lg" fw={600} color="#228be6">
                    {usageAnalytics.average_bitrate ? Math.round(usageAnalytics.average_bitrate / 1000000) : 0} Mbps
                  </Text>
                </Box>
                
                <Box>
                  <Text size="sm" fw={500} mb="xs">Bitrate Stability</Text>
                  <Text size="sm" c="dimmed">
                    {usageAnalytics.peak_bitrate && usageAnalytics.average_bitrate 
                      ? `${Math.round((usageAnalytics.average_bitrate / usageAnalytics.peak_bitrate) * 100)}% of peak`
                      : 'N/A'
                    }
                  </Text>
                </Box>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      )}

      {/* Storage Analysis */}
      {storageAnalytics && (
        <Card withBorder>
          <Title order={4} mb="lg">Storage Analysis</Title>
          <Grid>
            <Grid.Col span={4}>
              <Paper withBorder p="xl" ta="center">
                <RingProgress
                  size={120}
                  thickness={12}
                  sections={[{ value: storageAnalytics.storage_percentage, color: storageAnalytics.storage_percentage > 80 ? 'red' : 'blue' }]}
                  label={
                    <Text ta="center" size="lg" fw={700}>
                      {storageAnalytics.storage_percentage}%
                    </Text>
                  }
                />
                <Text size="sm" c="dimmed" mt="xs">Storage Used</Text>
              </Paper>
            </Grid.Col>
            
            <Grid.Col span={8}>
              <Stack gap="md">
                <Grid>
                  <Grid.Col span={6}>
                    <Box>
                      <Text size="sm" fw={500} c="dimmed">Storage Used</Text>
                      <Text size="lg" fw={600}>{formatFileSize(storageAnalytics.storage_used)}</Text>
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box>
                      <Text size="sm" fw={500} c="dimmed">Storage Limit</Text>
                      <Text size="lg" fw={600}>{formatFileSize(storageAnalytics.storage_limit)}</Text>
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box>
                      <Text size="sm" fw={500} c="dimmed">Segment Count</Text>
                      <Text size="lg" fw={600}>{storageAnalytics.segment_count}</Text>
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box>
                      <Text size="sm" fw={500} c="dimmed">Avg Segment Size</Text>
                      <Text size="lg" fw={600}>{formatFileSize(storageAnalytics.average_segment_size)}</Text>
                    </Box>
                  </Grid.Col>
                </Grid>
                
                <Box>
                  <Text size="sm" fw={500} mb="xs">Storage Range</Text>
                  <Group gap="md">
                    <Badge variant="light" color="blue">
                      Oldest: {storageAnalytics.oldest_segment ? new Date(storageAnalytics.oldest_segment).toLocaleDateString() : 'N/A'}
                    </Badge>
                    <Badge variant="light" color="green">
                      Newest: {storageAnalytics.newest_segment ? new Date(storageAnalytics.newest_segment).toLocaleDateString() : 'N/A'}
                    </Badge>
                  </Group>
                </Box>
              </Stack>
            </Grid.Col>
          </Grid>
        </Card>
      )}

      {/* Time Patterns */}
      {timeRangeAnalytics && (
        <Card withBorder>
          <Title order={4} mb="lg">Time Patterns</Title>
          <Text size="sm" c="dimmed" mb="md">
            Usage patterns over time help identify peak usage periods and trends.
          </Text>
          
          <Grid>
            <Grid.Col span={6}>
              <Paper withBorder p="md">
                <Text size="sm" fw={500} mb="md">Daily Usage Trend</Text>
                <ScrollArea h={200}>
                  <Stack gap="xs">
                    {timeRangeAnalytics.daily_usage && timeRangeAnalytics.daily_usage.length > 0 ? (
                      timeRangeAnalytics.daily_usage.slice(-7).map((day, index) => (
                        <Box key={index}>
                          <Group justify="space-between" mb="xs">
                            <Text size="xs">{day.date}</Text>
                            <Text size="xs" fw={500}>{day.segments} segments</Text>
                          </Group>
                          <Progress
                            value={(day.segments / Math.max(...timeRangeAnalytics.daily_usage.map(d => d.segments))) * 100}
                            size="sm"
                            color="blue"
                          />
                        </Box>
                      ))
                    ) : (
                      <Text size="sm" c="dimmed" ta="center" py="md">
                        No daily usage data available
                      </Text>
                    )}
                  </Stack>
                </ScrollArea>
              </Paper>
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Paper withBorder p="md">
                <Text size="sm" fw={500} mb="md">Hourly Usage Pattern</Text>
                <ScrollArea h={200}>
                  <Stack gap="xs">
                    {timeRangeAnalytics.hourly_usage && timeRangeAnalytics.hourly_usage.length > 0 ? (
                      timeRangeAnalytics.hourly_usage.map((hour, index) => (
                        <Box key={index}>
                          <Group justify="space-between" mb="xs">
                            <Text size="xs">{hour.hour}:00</Text>
                            <Text size="xs" fw={500}>{hour.segments} segments</Text>
                          </Group>
                          <Progress
                            value={(hour.segments / Math.max(...timeRangeAnalytics.hourly_usage.map(h => h.segments))) * 100}
                            size="sm"
                            color="green"
                          />
                        </Box>
                      ))
                    ) : (
                      <Text size="sm" c="dimmed" ta="center" py="md">
                        No hourly usage data available
                      </Text>
                    )}
                  </Stack>
                </ScrollArea>
              </Paper>
            </Grid.Col>
          </Grid>
        </Card>
      )}

      {/* No Data State */}
      {!loading && !usageAnalytics && !storageAnalytics && !timeRangeAnalytics && (
        <Card withBorder>
          <Stack gap="md" align="center" py="xl">
            <IconChartBar size={64} color="#ccc" />
            <Text size="lg" c="dimmed">No analytics data available</Text>
            <Text size="sm" c="dimmed" ta="center">
              Analytics data will appear here once the flow has been active and generated usage metrics.
            </Text>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
