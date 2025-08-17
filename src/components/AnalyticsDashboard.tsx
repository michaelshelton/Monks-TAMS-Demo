import { useState, useEffect } from 'react';
import {
  Card,
  Title,
  Text,
  Group,
  Badge,
  Stack,
  Grid,
  SimpleGrid,
  Timeline,
  Box,
  Button,
  Alert,
  Progress,
  RingProgress,
  List,
  ThemeIcon
} from '@mantine/core';
import {
  IconChartBar,
  IconDeviceMobile,
  IconQrcode,
  IconClock,
  IconVideo,
  IconUsers,
  IconActivity,
  IconRefresh,
  IconAlertCircle,
  IconCheck
} from '@tabler/icons-react';
import { analyticsService, type AnalyticsData } from '../services/analytics';

interface AnalyticsDashboardProps {
  compilationId?: string;
  showMockData?: boolean;
}

export default function AnalyticsDashboard({ 
  compilationId, 
  showMockData = true 
}: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      let data: AnalyticsData;
      if (showMockData) {
        data = analyticsService.getMockAnalytics();
      } else {
        data = await analyticsService.getRealAnalytics(compilationId);
      }

      setAnalyticsData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    
    // Auto-refresh every minute instead of every 30 seconds
    const interval = setInterval(loadAnalytics, 7200000); // 2 hours
    
    return () => clearInterval(interval);
  }, [compilationId, showMockData]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <Card>
        <Stack align="center" gap="md">
          <Progress value={100} animated />
          <Text>Loading analytics...</Text>
        </Stack>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red">
        <Text>Failed to load analytics: {error}</Text>
        <Button 
          size="sm" 
          variant="light" 
          onClick={loadAnalytics}
          leftSection={<IconRefresh size={14} />}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  if (!analyticsData) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="yellow">
        No analytics data available
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Group>
          <IconChartBar size={24} />
          <Title order={3}>Analytics Dashboard</Title>
        </Group>
        <Group>
          <Badge 
            color={showMockData ? 'yellow' : 'green'}
            variant="light"
          >
            {showMockData ? 'Mock Data' : 'Live Data'}
          </Badge>
          <Text size="sm" c="dimmed">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Text>
          <Button 
            size="xs" 
            variant="light" 
            onClick={loadAnalytics}
            leftSection={<IconRefresh size={12} />}
          >
            Refresh
          </Button>
        </Group>
      </Group>

      {/* Key Metrics */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        <Card withBorder p="md">
          <Stack gap="xs">
            <Group>
              <IconUsers size={20} />
              <Text size="sm" fw={500}>Session Views</Text>
            </Group>
            <Title order={2}>{analyticsData.session_views.toLocaleString()}</Title>
            <Text size="xs" c="dimmed">Total unique sessions</Text>
          </Stack>
        </Card>

        <Card withBorder p="md">
          <Stack gap="xs">
            <Group>
              <IconDeviceMobile size={20} />
              <Text size="sm" fw={500}>Mobile Access</Text>
            </Group>
            <RingProgress
              size={60}
              thickness={4}
              sections={[{ value: analyticsData.mobile_access, color: 'blue' }]}
              label={
                <Text ta="center" size="xs" fw={700}>
                  {analyticsData.mobile_access}%
                </Text>
              }
            />
            <Text size="xs" c="dimmed">Mobile device usage</Text>
          </Stack>
        </Card>

        <Card withBorder p="md">
          <Stack gap="xs">
            <Group>
              <IconQrcode size={20} />
              <Text size="sm" fw={500}>QR Scans</Text>
            </Group>
            <Title order={2}>{analyticsData.qr_scans.toLocaleString()}</Title>
            <Text size="xs" c="dimmed">QR code interactions</Text>
          </Stack>
        </Card>

        <Card withBorder p="md">
          <Stack gap="xs">
            <Group>
              <IconClock size={20} />
              <Text size="sm" fw={500}>Avg Watch Time</Text>
            </Group>
            <Title order={2}>{formatDuration(analyticsData.avg_watch_time)}</Title>
            <Text size="xs" c="dimmed">Average session duration</Text>
          </Stack>
        </Card>
      </SimpleGrid>

            {/* Compilations and Activity */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Card withBorder p="md">
          <Stack gap="md">
            <Group>
              <IconVideo size={20} />
              <Title order={4}>Video Compilations</Title>
            </Group>
            
            <Group>
              <Box>
                <Title order={3}>{analyticsData.total_compilations}</Title>
                <Text size="sm" c="dimmed">Total compilations created</Text>
              </Box>
              <Badge color="green" variant="light">
                Active
              </Badge>
            </Group>

            <Progress 
              value={Math.min((analyticsData.total_compilations / 100) * 100, 100)} 
              color="blue"
              size="sm"
            />
            
            <Text size="xs" c="dimmed">
              Compilation activity tracking
            </Text>
          </Stack>
        </Card>
        
        <Card withBorder p="md">
          <Stack gap="md">
            <Group>
              <IconActivity size={20} />
              <Title order={4}>Recent Activity</Title>
            </Group>
            
            <Timeline active={analyticsData.recent_activity.length - 1}>
              {analyticsData.recent_activity.slice(0, 5).map((activity, index) => (
                <Timeline.Item
                  key={index}
                  bullet={<ThemeIcon size={22} radius="xl" color="blue">⚡</ThemeIcon>}
                  title={activity.event.replace('_', ' ').toUpperCase()}
                >
                  <Text size="sm" c="dimmed">
                    {formatTimestamp(activity.timestamp)}
                  </Text>
                  <Text size="xs">
                    Video: {activity.video_id}
                  </Text>
                </Timeline.Item>
              ))}
            </Timeline>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Data Source Info */}
      <Card withBorder p="md">
        <Stack gap="md">
          <Group>
            <IconCheck size={20} color="green" />
            <Title order={4}>Data Source</Title>
          </Group>
          
          <Box size="sm">
            {showMockData ? (
              <>
                Currently using <Badge color="yellow" variant="light">Mock Data</Badge> stored in browser localStorage. 
                This simulates real analytics tracking and will automatically switch to live Hydrolix data 
                when the backend integration is complete.
              </>
            ) : (
              <>
                Connected to <Badge color="green" variant="light">Live Hydrolix</Badge> analytics. 
                Real-time CMCD data is being collected and processed.
              </>
            )}
          </Box>

          <List size="sm" spacing="xs">
            <List.Item>
              <Text size="sm">• Session tracking via unique session IDs</Text>
            </List.Item>
            <List.Item>
              <Text size="sm">• Device type detection (mobile/desktop/tablet)</Text>
            </List.Item>
            <List.Item>
              <Text size="sm">• Video playback event tracking</Text>
            </List.Item>
            <List.Item>
              <Text size="sm">• QR code scan analytics</Text>
            </List.Item>
            <List.Item>
              <Text size="sm">• Compilation process monitoring</Text>
            </List.Item>
          </List>
        </Stack>
      </Card>
    </Stack>
  );
}
