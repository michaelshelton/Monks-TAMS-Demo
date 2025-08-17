import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Text,
  Group,
  Badge,
  Stack,
  Grid,
  Paper,
  Progress,
  RingProgress,
  Alert,
  Box,
  Title,
  Button,
  Modal,
  TextInput,
  Switch,
  Divider,
  Timeline,
  ActionIcon,
  Tooltip,
  Loader,
  ScrollArea
} from '@mantine/core';
import {
  IconHeart,
  IconHeartBroken,
  IconActivity,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconRefresh,
  IconSettings,
  IconNetwork,
  IconDatabase,
  IconVideo,
  IconClock
} from '@tabler/icons-react';

interface SourceHealthMonitorProps {
  sourceId?: string;
  disabled?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface HealthCheck {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  message: string;
  lastChecked: string;
  responseTime?: number;
  details?: Record<string, any>;
}

interface HealthSummary {
  total: number;
  healthy: number;
  warning: number;
  critical: number;
  unknown: number;
  overallStatus: 'healthy' | 'warning' | 'critical' | 'unknown';
}

interface PerformanceMetrics {
  uptime: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  qualityScore: number;
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  source?: string;
}

export function SourceHealthMonitor({ 
  sourceId, 
  disabled = false, 
  autoRefresh = true, 
  refreshInterval = 30000 
}: SourceHealthMonitorProps) {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState({
    autoRefresh: autoRefresh,
    refreshInterval: refreshInterval,
    alertThresholds: {
      responseTime: 1000,
      errorRate: 5,
      qualityScore: 80
    }
  });

  const intervalRef = useRef<number | null>(null);

  // Mock health check data for demonstration
  const mockHealthChecks: HealthCheck[] = [
    {
      id: 'connectivity',
      name: 'Network Connectivity',
      status: 'healthy',
      message: 'Source is responding to network requests',
      lastChecked: new Date().toISOString(),
      responseTime: 45,
      details: { ip: '192.168.1.100', port: 8080, protocol: 'HTTP' }
    },
    {
      id: 'performance',
      name: 'Performance Metrics',
      status: 'healthy',
      message: 'All performance metrics within acceptable ranges',
      lastChecked: new Date().toISOString(),
      responseTime: 120,
      details: { cpu: '15%', memory: '45%', disk: '30%' }
    },
    {
      id: 'storage',
      name: 'Storage Health',
      status: 'warning',
      message: 'Storage usage approaching threshold',
      lastChecked: new Date().toISOString(),
      responseTime: 85,
      details: { used: '85%', available: '15%', total: '1TB' }
    },
    {
      id: 'quality',
      name: 'Content Quality',
      status: 'healthy',
      message: 'Content quality metrics are optimal',
      lastChecked: new Date().toISOString(),
      responseTime: 65,
      details: { bitrate: '5Mbps', resolution: '1080p', fps: '30' }
    },
    {
      id: 'system',
      name: 'System Status',
      status: 'healthy',
      message: 'System resources are healthy',
      lastChecked: new Date().toISOString(),
      responseTime: 95,
      details: { uptime: '99.9%', temperature: '45°C', fanSpeed: '60%' }
    }
  ];

  // Mock performance metrics
  const mockPerformanceMetrics: PerformanceMetrics = {
    uptime: 99.9,
    responseTime: 85,
    errorRate: 0.1,
    throughput: 95.5,
    qualityScore: 92
  };

  // Mock system alerts
  const mockAlerts: SystemAlert[] = [
    {
      id: '1',
      type: 'warning',
      message: 'Storage usage approaching 90% threshold',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      acknowledged: false,
      source: 'Storage Health Check'
    },
    {
      id: '2',
      type: 'info',
      message: 'Source performance metrics updated',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      acknowledged: true,
      source: 'Performance Monitor'
    },
    {
      id: '3',
      type: 'success',
      message: 'All health checks passed successfully',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      acknowledged: true,
      source: 'Health Monitor'
    }
  ];

  const loadHealthData = async () => {
    if (disabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the VAST TAMS API
      // For now, we'll use mock data with simulated delays
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setHealthChecks(mockHealthChecks);
      setPerformanceMetrics(mockPerformanceMetrics);
      setAlerts(mockAlerts);
      
    } catch (err: any) {
      console.error('Error loading health data:', err);
      setError('Failed to load health monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'warning': return 'yellow';
      case 'critical': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <IconHeart size={16} color="#40c057" />;
      case 'warning': return <IconAlertTriangle size={16} color="#fd7e14" />;
      case 'critical': return <IconHeartBroken size={16} color="#fa5252" />;
      default: return <IconActivity size={16} color="#868e96" />;
    }
  };

  const getHealthSummary = (): HealthSummary => {
    const total = healthChecks.length;
    const healthy = healthChecks.filter(c => c.status === 'healthy').length;
    const warning = healthChecks.filter(c => c.status === 'warning').length;
    const critical = healthChecks.filter(c => c.status === 'critical').length;
    const unknown = healthChecks.filter(c => c.status === 'unknown').length;

    let overallStatus: 'healthy' | 'warning' | 'critical' | 'unknown' = 'healthy';
    if (critical > 0) overallStatus = 'critical';
    else if (warning > 0) overallStatus = 'warning';
    else if (unknown > 0) overallStatus = 'unknown';

    return { total, healthy, warning, critical, unknown, overallStatus };
  };

  useEffect(() => {
    loadHealthData();
    
    if (settings.autoRefresh && !disabled) {
      intervalRef.current = window.setInterval(loadHealthData, settings.refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sourceId, settings.autoRefresh, settings.refreshInterval, disabled]);

  const summary = getHealthSummary();

  if (disabled) {
    return (
      <Card withBorder>
        <Stack gap="md" align="center" py="xl">
          <IconActivity size={48} color="#ccc" />
          <Text size="lg" c="dimmed">Health monitoring disabled</Text>
          <Text size="sm" c="dimmed" ta="center">
            Enable health monitoring to view source health status and performance metrics.
          </Text>
        </Stack>
      </Card>
    );
  }

  return (
    <>
      <Card withBorder>
        <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between" align="flex-start">
            <Box>
              <Group gap="sm" align="center">
                <IconActivity size={20} color="#228be6" />
                <Title order={4}>Source Health Monitor</Title>
                <Badge 
                  variant="light" 
                  color={getStatusColor(summary.overallStatus)}
                  leftSection={getStatusIcon(summary.overallStatus)}
                >
                  {summary.overallStatus.charAt(0).toUpperCase() + summary.overallStatus.slice(1)}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed" mt="xs">
                Real-time monitoring of source health, performance, and system status
              </Text>
            </Box>
            
            <Group gap="xs">
              <Button
                variant="light"
                size="sm"
                leftSection={<IconRefresh size={14} />}
                onClick={loadHealthData}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                variant="light"
                size="sm"
                leftSection={<IconSettings size={14} />}
                onClick={() => setShowSettingsModal(true)}
              >
                Settings
              </Button>
            </Group>
          </Group>

          <Divider />

          {/* Error Display */}
          {error && (
            <Alert icon={<IconX size={16} />} color="red" withCloseButton onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Health Summary */}
          <Grid>
            <Grid.Col span={3}>
              <Paper withBorder p="md" ta="center">
                <IconHeart size={32} color="#40c057" />
                <Text size="lg" fw={600}>{summary.healthy}</Text>
                <Text size="sm" c="dimmed">Healthy</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={3}>
              <Paper withBorder p="md" ta="center">
                <IconAlertTriangle size={32} color="#fd7e14" />
                <Text size="lg" fw={600}>{summary.warning}</Text>
                <Text size="sm" c="dimmed">Warning</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={3}>
              <Paper withBorder p="md" ta="center">
                <IconHeartBroken size={32} color="#fa5252" />
                <Text size="lg" fw={600}>{summary.critical}</Text>
                <Text size="sm" c="dimmed">Critical</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={3}>
              <Paper withBorder p="md" ta="center">
                <IconActivity size={32} color="#228be6" />
                <Text size="lg" fw={600}>{summary.total}</Text>
                <Text size="sm" c="dimmed">Total Checks</Text>
              </Paper>
            </Grid.Col>
          </Grid>

          {/* Performance Metrics */}
          {performanceMetrics && (
            <Card withBorder>
              <Title order={5} mb="md">Performance Overview</Title>
              <Grid>
                <Grid.Col span={4}>
                  <Paper withBorder p="xl" ta="center">
                    <RingProgress
                      size={100}
                      thickness={8}
                      sections={[
                        { value: performanceMetrics.uptime, color: 'green' }
                      ]}
                      label={
                        <Text ta="center" size="lg" fw={700}>
                          {performanceMetrics.uptime}%
                        </Text>
                      }
                    />
                    <Text size="sm" c="dimmed" mt="xs">Uptime</Text>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Stack gap="md">
                    <Box>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>Response Time</Text>
                        <Text size="sm" fw={600}>{performanceMetrics.responseTime}ms</Text>
                      </Group>
                      <Progress
                        value={(performanceMetrics.responseTime / 1000) * 100}
                        color={performanceMetrics.responseTime < 500 ? 'green' : 
                               performanceMetrics.responseTime < 1000 ? 'yellow' : 'red'}
                        size="sm"
                      />
                    </Box>
                    <Box>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>Error Rate</Text>
                        <Text size="sm" fw={600}>{performanceMetrics.errorRate}%</Text>
                      </Group>
                      <Progress
                        value={performanceMetrics.errorRate}
                        color={performanceMetrics.errorRate < 1 ? 'green' : 
                               performanceMetrics.errorRate < 5 ? 'yellow' : 'red'}
                        size="sm"
                      />
                    </Box>
                    <Box>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>Quality Score</Text>
                        <Text size="sm" fw={600}>{performanceMetrics.qualityScore}%</Text>
                      </Group>
                      <Progress
                        value={performanceMetrics.qualityScore}
                        color={performanceMetrics.qualityScore > 90 ? 'green' : 
                               performanceMetrics.qualityScore > 70 ? 'yellow' : 'red'}
                        size="sm"
                      />
                    </Box>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card>
          )}

          {/* Health Checks */}
          <Card withBorder>
            <Title order={5} mb="md">Health Checks</Title>
            <Stack gap="md">
              {healthChecks.map((check) => (
                <Paper key={check.id} withBorder p="md">
                  <Group justify="space-between" align="flex-start">
                    <Box>
                      <Group gap="sm" align="center" mb="xs">
                        {getStatusIcon(check.status)}
                        <Text fw={500} size="sm">{check.name}</Text>
                        <Badge 
                          variant="light" 
                          color={getStatusColor(check.status)}
                          size="sm"
                        >
                          {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
                        </Badge>
                      </Group>
                      <Text size="sm" c="dimmed" mb="xs">{check.message}</Text>
                      {check.responseTime && (
                        <Text size="xs" c="dimmed">
                          Response time: {check.responseTime}ms • Last checked: {new Date(check.lastChecked).toLocaleTimeString()}
                        </Text>
                      )}
                    </Box>
                    {check.details && (
                      <Group gap="xs">
                        {Object.entries(check.details).map(([key, value]) => (
                          <Badge key={key} variant="outline" size="xs">
                            {key}: {value}
                          </Badge>
                        ))}
                      </Group>
                    )}
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Card>

          {/* System Alerts */}
          <Card withBorder>
            <Title order={5} mb="md">System Alerts</Title>
            <Stack gap="md">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <Paper key={alert.id} withBorder p="md">
                    <Group justify="space-between" align="flex-start">
                      <Box>
                        <Group gap="sm" align="center" mb="xs">
                          <Badge 
                            variant="light" 
                            color={alert.type === 'error' ? 'red' : 
                                   alert.type === 'warning' ? 'yellow' : 
                                   alert.type === 'success' ? 'green' : 'blue'}
                          >
                            {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                          </Badge>
                          {alert.source && (
                            <Text size="xs" c="dimmed">Source: {alert.source}</Text>
                          )}
                          <Text size="xs" c="dimmed">
                            {new Date(alert.timestamp).toLocaleString()}
                          </Text>
                        </Group>
                        <Text size="sm">{alert.message}</Text>
                      </Box>
                      {!alert.acknowledged && (
                        <Button
                          variant="light"
                          size="xs"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </Group>
                  </Paper>
                ))
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  No active alerts
                </Text>
              )}
            </Stack>
          </Card>
        </Stack>
      </Card>

      {/* Settings Modal */}
      <Modal
        opened={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Health Monitor Settings"
        size="md"
      >
        <Stack gap="md">
          <Switch
            label="Auto-refresh"
            description="Automatically refresh health data at regular intervals"
            checked={settings.autoRefresh}
            onChange={(event) => setSettings({ ...settings, autoRefresh: event.currentTarget.checked })}
          />
          
          <TextInput
            label="Refresh Interval (ms)"
            description="How often to refresh health data (in milliseconds)"
            type="number"
            value={settings.refreshInterval}
            onChange={(event) => setSettings({ ...settings, refreshInterval: parseInt(event.currentTarget.value) || 30000 })}
            disabled={!settings.autoRefresh}
          />
          
          <Divider />
          
          <Title order={6}>Alert Thresholds</Title>
          
          <TextInput
            label="Response Time Threshold (ms)"
            description="Alert when response time exceeds this value"
            type="number"
            value={settings.alertThresholds.responseTime}
            onChange={(event) => setSettings({
              ...settings,
              alertThresholds: {
                ...settings.alertThresholds,
                responseTime: parseInt(event.currentTarget.value) || 1000
              }
            })}
          />
          
          <TextInput
            label="Error Rate Threshold (%)"
            description="Alert when error rate exceeds this percentage"
            type="number"
            value={settings.alertThresholds.errorRate}
            onChange={(event) => setSettings({
              ...settings,
              alertThresholds: {
                ...settings.alertThresholds,
                errorRate: parseInt(event.currentTarget.value) || 5
              }
            })}
          />
          
          <TextInput
            label="Quality Score Threshold (%)"
            description="Alert when quality score falls below this percentage"
            type="number"
            value={settings.alertThresholds.qualityScore}
            onChange={(event) => setSettings({
              ...settings,
              alertThresholds: {
                ...settings.alertThresholds,
                qualityScore: parseInt(event.currentTarget.value) || 80
              }
            })}
          />
          
          <Group gap="xs" justify="flex-end">
            <Button variant="light" onClick={() => setShowSettingsModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowSettingsModal(false)}>
              Save Settings
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
