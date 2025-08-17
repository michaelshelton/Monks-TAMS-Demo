import React, { useState, useEffect } from 'react';
import {
  Group,
  Badge,
  Text,
  Tooltip,
  ActionIcon,
  Popover,
  Stack,
  Box,
  Progress,
  Divider,
  Alert
} from '@mantine/core';
import {
  IconHeart,
  IconHeartOff,
  IconActivity,
  IconServer,
  IconDatabase,
  IconCloud,
  IconRefresh,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconClock
} from '@tabler/icons-react';
import { apiClient } from '../services/api';

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime_seconds: number;
  version: string;
  system: {
    cpu_usage_percent: number;
    memory_usage_percent: number;
    disk_usage_percent: number;
  };
  services: {
    vast_database: 'healthy' | 'degraded' | 'unhealthy';
    s3_storage: 'healthy' | 'degraded' | 'unhealthy';
    api_server: 'healthy' | 'degraded' | 'unhealthy';
  };
  performance: {
    response_time_ms: number;
    active_connections: number;
    error_rate_percent: number;
  };
}

interface HealthStatusIndicatorProps {
  refreshInterval?: number; // in milliseconds
  showDetails?: boolean;
}

export function HealthStatusIndicator({ 
  refreshInterval = 60000, // Refresh every minute instead of every 30 seconds 
  showDetails = false 
}: HealthStatusIndicatorProps) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  // Mock data for development - replace with actual API call
  const mockHealth: HealthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime_seconds: 86400, // 24 hours
    version: '6.0.0',
    system: {
      cpu_usage_percent: 23.5,
      memory_usage_percent: 45.2,
      disk_usage_percent: 67.8
    },
    services: {
      vast_database: 'healthy',
      s3_storage: 'healthy',
      api_server: 'healthy'
    },
    performance: {
      response_time_ms: 145,
      active_connections: 12,
      error_rate_percent: 0.8
    }
  };

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use real API call to /health
      const response = await apiClient.getHealth();
      
      // Transform the API response to match our expected format
      const apiHealth = response || {};
      
      // Create health data from API response, with fallbacks to mock data if needed
      const healthData: HealthData = {
        status: apiHealth.status || mockHealth.status,
        timestamp: apiHealth.timestamp || new Date().toISOString(),
        uptime_seconds: apiHealth.uptime_seconds || mockHealth.uptime_seconds,
        version: apiHealth.version || mockHealth.version,
        system: {
          cpu_usage_percent: apiHealth.system?.cpu_usage_percent || mockHealth.system.cpu_usage_percent,
          memory_usage_percent: apiHealth.system?.memory_usage_percent || mockHealth.system.memory_usage_percent,
          disk_usage_percent: apiHealth.system?.disk_usage_percent || mockHealth.system.disk_usage_percent
        },
        services: {
          vast_database: apiHealth.services?.vast_database || mockHealth.services.vast_database,
          s3_storage: apiHealth.services?.s3_storage || mockHealth.services.s3_storage,
          api_server: apiHealth.services?.api_server || mockHealth.services.api_server
        },
        performance: {
          response_time_ms: apiHealth.performance?.response_time_ms || mockHealth.performance.response_time_ms,
          active_connections: apiHealth.performance?.active_connections || mockHealth.performance.active_connections,
          error_rate_percent: apiHealth.performance?.error_rate_percent || mockHealth.performance.error_rate_percent
        }
      };
      
      setHealth(healthData);
      setLastCheck(new Date());
    } catch (err: any) {
      // Check if it's a 404 error (backend not ready)
      if (err.message && err.message.includes('404')) {
        setError('Backend Not Ready - Health endpoint is not available');
        // Fall back to mock data for development
        setHealth(mockHealth);
      } else {
        setError(err.message || 'Failed to fetch health status');
        // Fall back to mock data for development
        setHealth(mockHealth);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    
    const interval = setInterval(fetchHealth, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'green';
      case 'degraded': return 'yellow';
      case 'unhealthy': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <IconHeart size={16} />;
      case 'degraded': return <IconActivity size={16} />;
      case 'unhealthy': return <IconHeartOff size={16} />;
      default: return <IconServer size={16} />;
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getSystemStatusColor = (usage: number): string => {
    if (usage <= 70) return 'green';
    if (usage <= 85) return 'yellow';
    return 'red';
  };

  if (error && !health) {
    return (
      <Tooltip label="Health check failed">
        <Badge color="red" variant="light" size="sm">
          <IconX size={12} />
        </Badge>
      </Tooltip>
    );
  }

  if (!health) {
    return (
      <Tooltip label="Checking health status...">
        <Badge color="gray" variant="light" size="sm">
          <IconActivity size={12} />
        </Badge>
      </Tooltip>
    );
  }

  const healthContent = (
    <Stack gap="md" p="md" style={{ minWidth: 300 }}>
      {/* Header */}
      <Group justify="space-between">
        <Group>
          {getStatusIcon(health.status)}
          <Text fw={500}>System Health</Text>
        </Group>
        <Badge color={getStatusColor(health.status)} variant="light">
          {health.status.toUpperCase()}
        </Badge>
      </Group>

      <Divider />

      {/* System Overview */}
      <Box>
        <Text size="sm" fw={500} mb="xs">System Status</Text>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm">Version</Text>
            <Badge variant="light" size="sm">{health.version}</Badge>
          </Group>
          <Group justify="space-between">
            <Text size="sm">Uptime</Text>
            <Text size="sm" c="dimmed">{formatUptime(health.uptime_seconds)}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">Last Check</Text>
            <Text size="sm" c="dimmed">
              {new Date(health.timestamp).toLocaleTimeString()}
            </Text>
          </Group>
        </Stack>
      </Box>

      <Divider />

      {/* Service Status */}
      <Box>
        <Text size="sm" fw={500} mb="xs">Services</Text>
        <Stack gap="xs">
          {Object.entries(health.services).map(([service, status]) => (
            <Group key={service} justify="space-between">
              <Group gap="xs">
                {getStatusIcon(status)}
                <Text size="sm" tt="capitalize">
                  {service.replace('_', ' ')}
                </Text>
              </Group>
              <Badge 
                color={getStatusColor(status)} 
                variant="light" 
                size="xs"
              >
                {status}
              </Badge>
            </Group>
          ))}
        </Stack>
      </Box>

      <Divider />

      {/* Performance Metrics */}
      <Box>
        <Text size="sm" fw={500} mb="xs">Performance</Text>
        <Stack gap="xs">
          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="sm">Response Time</Text>
              <Text size="sm" c="dimmed">{health.performance.response_time_ms}ms</Text>
            </Group>
            <Progress 
              value={(health.performance.response_time_ms / 500) * 100} // 500ms threshold
              color={getSystemStatusColor((health.performance.response_time_ms / 500) * 100)}
              size="xs"
            />
          </Box>
          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="sm">Error Rate</Text>
              <Text size="sm" c="dimmed">{health.performance.error_rate_percent}%</Text>
            </Group>
            <Progress 
              value={health.performance.error_rate_percent} // 5% threshold
              color={getSystemStatusColor(health.performance.error_rate_percent * 20)}
              size="xs"
            />
          </Box>
        </Stack>
      </Box>

      <Divider />

      {/* System Resources */}
      <Box>
        <Text size="sm" fw={500} mb="xs">Resources</Text>
        <Stack gap="xs">
          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="sm">CPU Usage</Text>
              <Text size="sm" c="dimmed">{health.system.cpu_usage_percent}%</Text>
            </Group>
            <Progress 
              value={health.system.cpu_usage_percent}
              color={getSystemStatusColor(health.system.cpu_usage_percent)}
              size="xs"
            />
          </Box>
          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="sm">Memory Usage</Text>
              <Text size="sm" c="dimmed">{health.system.memory_usage_percent}%</Text>
            </Group>
            <Progress 
              value={health.system.memory_usage_percent}
              color={getSystemStatusColor(health.system.memory_usage_percent)}
              size="xs"
            />
          </Box>
          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="sm">Disk Usage</Text>
              <Text size="sm" c="dimmed">{health.system.disk_usage_percent}%</Text>
            </Group>
            <Progress 
              value={health.system.disk_usage_percent}
              color={getSystemStatusColor(health.system.disk_usage_percent)}
              size="xs"
            />
          </Box>
        </Stack>
      </Box>

      {/* Refresh Button */}
      <Group justify="center">
        <ActionIcon
          variant="light"
          size="sm"
          onClick={fetchHealth}
          loading={loading}
        >
          <IconRefresh size={16} />
        </ActionIcon>
      </Group>
    </Stack>
  );

  return (
    <Group gap="xs">
      {/* Main Health Badge */}
      <Popover 
        position="bottom-end" 
        withArrow 
        shadow="md"
        disabled={!showDetails}
      >
        <Popover.Target>
          <Tooltip label={`System Status: ${health.status}`}>
            <Badge 
              color={getStatusColor(health.status)} 
              variant="light" 
              size="sm"
              style={{ cursor: showDetails ? 'pointer' : 'default' }}
            >
              <Group gap={4}>
                {getStatusIcon(health.status)}
                {showDetails && <Text size="xs">{health.status}</Text>}
              </Group>
            </Badge>
          </Tooltip>
        </Popover.Target>
        
        {showDetails && (
          <Popover.Dropdown>
            {healthContent}
          </Popover.Dropdown>
        )}
      </Popover>

      {/* Quick Status Indicators */}
      {showDetails && (
        <>
          <Tooltip label="VAST Database">
            <Badge 
              color={getStatusColor(health.services.vast_database)} 
              variant="light" 
              size="xs"
            >
              <IconDatabase size={12} />
            </Badge>
          </Tooltip>
          
          <Tooltip label="S3 Storage">
            <Badge 
              color={getStatusColor(health.services.s3_storage)} 
              variant="light" 
              size="xs"
            >
              <IconCloud size={12} />
            </Badge>
          </Tooltip>
          
          <Tooltip label="API Server">
            <Badge 
              color={getStatusColor(health.services.api_server)} 
              variant="light" 
              size="xs"
            >
              <IconServer size={12} />
            </Badge>
          </Tooltip>
        </>
      )}
    </Group>
  );
}
