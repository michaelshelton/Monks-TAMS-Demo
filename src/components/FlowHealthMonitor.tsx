import React, { useState, useEffect, useRef } from 'react';
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
  Badge,
  Switch,
  Loader,
  Timeline,
  ActionIcon,
  Tooltip,
  Modal
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
  IconInfoCircle,
  IconClock,
  IconNetwork,
  IconServer,
  IconDatabase,
  IconVideo,
  IconMicrophone
} from '@tabler/icons-react';
import { apiClient } from '../services/api';

interface FlowHealthMonitorProps {
  flowId: string;
  disabled?: boolean;
}

interface HealthCheck {
  id: string;
  type: 'connectivity' | 'performance' | 'storage' | 'quality' | 'system';
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  message: string;
  timestamp: string;
  details?: Record<string, any>;
  lastCheck: string;
  nextCheck: string;
}

interface PerformanceAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  type: 'bitrate_drop' | 'frame_drops' | 'latency_spike' | 'storage_full' | 'quality_degradation';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  flowId: string;
  details?: Record<string, any>;
}

export function FlowHealthMonitor({ 
  flowId, 
  disabled = false 
}: FlowHealthMonitorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [performanceAlerts, setPerformanceAlerts] = useState<PerformanceAlert[]>([]);
  const [overallHealth, setOverallHealth] = useState<'healthy' | 'warning' | 'critical' | 'unknown'>('unknown');
  const [lastHealthUpdate, setLastHealthUpdate] = useState<Date | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (flowId && autoRefresh) {
      loadHealthStatus();
      startAutoRefresh();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [flowId, autoRefresh, refreshInterval]);

  const startAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        loadHealthStatus();
      }, refreshInterval * 1000);
    }
  };

  const loadHealthStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate health check API calls
      // In a real implementation, these would be actual API endpoints
      const mockHealthChecks: HealthCheck[] = [
        {
          id: 'connectivity_1',
          type: 'connectivity',
          status: 'healthy',
          message: 'Flow connectivity is stable',
          timestamp: new Date().toISOString(),
          lastCheck: new Date().toISOString(),
          nextCheck: new Date(Date.now() + 30000).toISOString(),
          details: { responseTime: 45, packetLoss: 0.01 }
        },
        {
          id: 'performance_1',
          type: 'performance',
          status: 'warning',
          message: 'Frame drops detected above threshold',
          timestamp: new Date().toISOString(),
          lastCheck: new Date().toISOString(),
          nextCheck: new Date(Date.now() + 30000).toISOString(),
          details: { frameDrops: 15, threshold: 10 }
        },
        {
          id: 'storage_1',
          type: 'storage',
          status: 'healthy',
          message: 'Storage usage within normal limits',
          timestamp: new Date().toISOString(),
          lastCheck: new Date().toISOString(),
          nextCheck: new Date(Date.now() + 60000).toISOString(),
          details: { usagePercent: 65, available: '35 GB' }
        },
        {
          id: 'quality_1',
          type: 'quality',
          status: 'healthy',
          message: 'Video quality metrics are good',
          timestamp: new Date().toISOString(),
          lastCheck: new Date().toISOString(),
          nextCheck: new Date(Date.now() + 30000).toISOString(),
          details: { qualityScore: 92, bitrate: '15 Mbps' }
        },
        {
          id: 'system_1',
          type: 'system',
          status: 'healthy',
          message: 'System resources are adequate',
          timestamp: new Date().toISOString(),
          lastCheck: new Date().toISOString(),
          nextCheck: new Date(Date.now() + 60000).toISOString(),
          details: { cpuUsage: 45, memoryUsage: 60 }
        }
      ];

      const mockAlerts: PerformanceAlert[] = [
        {
          id: 'alert_1',
          severity: 'warning',
          type: 'frame_drops',
          message: 'Frame drops detected: 15 frames in last minute',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          acknowledged: false,
          flowId: flowId,
          details: { frameCount: 15, timeWindow: '1 minute', threshold: 10 }
        },
        {
          id: 'alert_2',
          severity: 'info',
          type: 'bitrate_drop',
          message: 'Bitrate dropped to 12 Mbps (normal: 15 Mbps)',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          acknowledged: true,
          flowId: flowId,
          details: { currentBitrate: 12, normalBitrate: 15, dropPercent: 20 }
        }
      ];

      setHealthChecks(mockHealthChecks);
      setPerformanceAlerts(mockAlerts);
      
      // Calculate overall health
      const criticalCount = mockHealthChecks.filter(h => h.status === 'critical').length;
      const warningCount = mockHealthChecks.filter(h => h.status === 'warning').length;
      
      if (criticalCount > 0) {
        setOverallHealth('critical');
      } else if (warningCount > 0) {
        setOverallHealth('warning');
      } else {
        setOverallHealth('healthy');
      }
      
      setLastHealthUpdate(new Date());
    } catch (err: any) {
      setError('Failed to load health status');
      console.error('Error loading health status:', err);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setPerformanceAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    );
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <IconHeart size={20} color="#40c057" />;
      case 'warning': return <IconAlertTriangle size={20} color="#fd7e14" />;
      case 'critical': return <IconHeartBroken size={20} color="#fa5252" />;
      default: return <IconX size={20} color="#868e96" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'warning': return 'orange';
      case 'critical': return 'red';
      default: return 'gray';
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'info': return <IconInfoCircle size={16} color="#228be6" />;
      case 'warning': return <IconAlertTriangle size={16} color="#fd7e14" />;
      case 'error': return <IconX size={16} color="#fa5252" />;
      case 'critical': return <IconHeartBroken size={16} color="#c92a2a" />;
      default: return <IconInfoCircle size={16} color="#868e96" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'blue';
      case 'warning': return 'orange';
      case 'error': return 'red';
      case 'critical': return 'red';
      default: return 'gray';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getHealthSummary = () => {
    const total = healthChecks.length;
    const healthy = healthChecks.filter(h => h.status === 'healthy').length;
    const warning = healthChecks.filter(h => h.status === 'warning').length;
    const critical = healthChecks.filter(h => h.status === 'critical').length;
    
    return { total, healthy, warning, critical };
  };

  const summary = getHealthSummary();

  return (
    <>
      <Stack gap="xl">
        {/* Header */}
        <Card withBorder>
          <Group justify="space-between" align="center">
            <Box>
              <Group gap="sm" align="center">
                {getHealthIcon(overallHealth)}
                <Title order={3}>Flow Health Monitor</Title>
                <Badge variant="light" color={getHealthColor(overallHealth)} size="lg">
                  {overallHealth.charAt(0).toUpperCase() + overallHealth.slice(1)}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed" mt="xs">
                Real-time monitoring of flow health, performance, and system status
              </Text>
            </Box>
            
            <Group gap="xs">
              <Switch
                label="Auto-refresh"
                checked={autoRefresh}
                onChange={(event) => setAutoRefresh(event.currentTarget.checked)}
                disabled={disabled}
              />
              <Button
                variant="light"
                leftSection={<IconSettings size={16} />}
                onClick={() => setShowSettingsModal(true)}
                disabled={disabled}
              >
                Settings
              </Button>
              <Button
                variant="light"
                leftSection={<IconRefresh size={16} />}
                onClick={loadHealthStatus}
                loading={loading}
                disabled={disabled}
              >
                Refresh
              </Button>
            </Group>
          </Group>
          
          {lastHealthUpdate && (
            <Text size="xs" c="dimmed" mt="xs">
              Last updated: {lastHealthUpdate.toLocaleTimeString()}
            </Text>
          )}
        </Card>

        {/* Error Display */}
        {error && (
          <Alert icon={<IconX size={16} />} color="red" withCloseButton onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Health Overview */}
        <Card withBorder>
          <Title order={4} mb="lg">Health Overview</Title>
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
        </Card>

        {/* Health Checks */}
        <Card withBorder>
          <Title order={4} mb="lg">Health Checks</Title>
          <Grid>
            {healthChecks.map((check) => (
              <Grid.Col key={check.id} span={6}>
                <Paper withBorder p="md">
                  <Group justify="space-between" align="flex-start" mb="xs">
                    <Group gap="xs">
                      {getHealthIcon(check.status)}
                      <Text size="sm" fw={500} style={{ textTransform: 'capitalize' }}>
                        {check.type.replace('_', ' ')}
                      </Text>
                      <Badge variant="light" color={getHealthColor(check.status)} size="xs">
                        {check.status}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {formatTimestamp(check.lastCheck)}
                    </Text>
                  </Group>
                  
                  <Text size="sm" mb="xs">{check.message}</Text>
                  
                  {check.details && (
                    <Box>
                      <Text size="xs" c="dimmed" mb="xs">Details:</Text>
                      <Group gap="xs" wrap="wrap">
                        {Object.entries(check.details).map(([key, value]) => (
                          <Badge key={key} variant="outline" size="xs">
                            {key}: {value}
                          </Badge>
                        ))}
                      </Group>
                    </Box>
                  )}
                  
                  <Text size="xs" c="dimmed" mt="xs">
                    Next check: {formatTimestamp(check.nextCheck)}
                  </Text>
                </Paper>
              </Grid.Col>
            ))}
          </Grid>
        </Card>

        {/* Performance Alerts */}
        <Card withBorder>
          <Title order={4} mb="lg">Performance Alerts</Title>
          {performanceAlerts.length === 0 ? (
            <Alert icon={<IconCheck size={16} />} color="green" variant="light">
              <Text size="sm">No active performance alerts. All systems are operating normally.</Text>
            </Alert>
          ) : (
            <Stack gap="md">
              {performanceAlerts.map((alert) => (
                <Paper key={alert.id} withBorder p="md">
                  <Group justify="space-between" align="flex-start">
                    <Box style={{ flex: 1 }}>
                      <Group gap="xs" mb="xs">
                        {getAlertIcon(alert.severity)}
                        <Badge variant="light" color={getAlertColor(alert.severity)} size="sm">
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {alert.type.replace('_', ' ')}
                        </Badge>
                        {alert.acknowledged && (
                          <Badge variant="light" color="gray" size="sm">
                            Acknowledged
                          </Badge>
                        )}
                      </Group>
                      
                      <Text size="sm" mb="xs">{alert.message}</Text>
                      
                      {alert.details && (
                        <Box>
                          <Text size="xs" c="dimmed" mb="xs">Details:</Text>
                          <Group gap="xs" wrap="wrap">
                            {Object.entries(alert.details).map(([key, value]) => (
                              <Badge key={key} variant="outline" size="xs">
                                {key}: {value}
                              </Badge>
                            ))}
                          </Group>
                        </Box>
                      )}
                      
                      <Text size="xs" c="dimmed" mt="xs">
                        {formatTimestamp(alert.timestamp)}
                      </Text>
                    </Box>
                    
                    {!alert.acknowledged && (
                      <Button
                        variant="light"
                        size="xs"
                        onClick={() => acknowledgeAlert(alert.id)}
                        disabled={disabled}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Card>

        {/* System Status Timeline */}
        <Card withBorder>
          <Title order={4} mb="lg">System Status Timeline</Title>
          <Timeline active={healthChecks.length - 1} bulletSize={24} lineWidth={2}>
            {healthChecks.map((check, index) => (
              <Timeline.Item
                key={check.id}
                bullet={getHealthIcon(check.status)}
                title={`${check.type.replace('_', ' ').charAt(0).toUpperCase() + check.type.replace('_', ' ').slice(1)} Check`}
                color={getHealthColor(check.status)}
              >
                <Text size="sm" c="dimmed" mt={4}>
                  {check.message}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatTimestamp(check.timestamp)}
                </Text>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      </Stack>

      {/* Settings Modal */}
      <Modal
        opened={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Health Monitor Settings"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Configure automatic health monitoring and alerting settings.
          </Text>
          
          <Switch
            label="Enable auto-refresh"
            checked={autoRefresh}
            onChange={(event) => setAutoRefresh(event.currentTarget.checked)}
            description="Automatically refresh health status at regular intervals"
          />
          
          {autoRefresh && (
            <Box>
              <Text size="sm" fw={500} mb="xs">Refresh Interval (seconds)</Text>
              <Group gap="xs">
                {[15, 30, 60, 120].map((interval) => (
                  <Button
                    key={interval}
                    variant={refreshInterval === interval ? 'filled' : 'light'}
                    size="xs"
                    onClick={() => setRefreshInterval(interval)}
                  >
                    {interval}s
                  </Button>
                ))}
              </Group>
            </Box>
          )}
          
          <Group gap="xs" justify="flex-end">
            <Button variant="light" onClick={() => setShowSettingsModal(false)}>
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
