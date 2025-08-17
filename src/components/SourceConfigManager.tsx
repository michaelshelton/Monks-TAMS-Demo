import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Group,
  Badge,
  Stack,
  Grid,
  Paper,
  Alert,
  Box,
  Title,
  Button,
  Loader
} from '@mantine/core';
import {
  IconSettings,
  IconVideo,
  IconMusic,
  IconDatabase,
  IconPhoto
} from '@tabler/icons-react';

interface SourceConfigManagerProps {
  sourceId?: string;
  disabled?: boolean;
  onConfigChange?: (config: any) => void;
}

export function SourceConfigManager({ 
  sourceId, 
  disabled = false,
  onConfigChange 
}: SourceConfigManagerProps) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock configuration data for demonstration
  const mockConfig = {
    id: sourceId || 'demo-source',
    format: 'urn:x-nmos:format:video',
    quality: {
      resolution: '1920x1080',
      bitrate: 5000000,
      fps: 30,
      codec: 'H.264',
      quality: 'high'
    },
    network: {
      protocol: 'http',
      port: 8080,
      compression: true,
      encryption: false
    },
    storage: {
      format: 'mp4',
      compression: 'lossy',
      maxFileSize: 1073741824, // 1GB
      backup: true
    },
    presets: [
      {
        id: 'broadcast-hd',
        name: 'Broadcast HD',
        description: 'High-quality HD broadcast configuration',
        category: 'broadcast',
        isDefault: true
      },
      {
        id: 'streaming-4k',
        name: 'Streaming 4K',
        description: 'Ultra-high quality 4K streaming',
        category: 'streaming',
        isDefault: false
      }
    ],
    lastUpdated: new Date().toISOString(),
    version: '1.0.0'
  };

  const loadConfiguration = async () => {
    if (disabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setConfig(mockConfig);
    } catch (err: any) {
      console.error('Error loading configuration:', err);
      setError('Failed to load source configuration');
    } finally {
      setLoading(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'urn:x-nmos:format:video': return <IconVideo size={20} color="#228be6" />;
      case 'urn:x-nmos:format:audio': return <IconMusic size={20} color="#40c057" />;
      case 'urn:x-nmos:format:data': return <IconDatabase size={20} color="#fd7e14" />;
      case 'urn:x-tam:format:image': return <IconPhoto size={20} color="#7950f2" />;
      default: return <IconDatabase size={20} color="#868e96" />;
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'low': return 'red';
      case 'medium': return 'yellow';
      case 'high': return 'green';
      case 'ultra': return 'blue';
      default: return 'gray';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'broadcast': return 'blue';
      case 'streaming': return 'green';
      case 'archival': return 'orange';
      case 'production': return 'purple';
      case 'custom': return 'gray';
      default: return 'gray';
    }
  };

  useEffect(() => {
    loadConfiguration();
  }, [sourceId, disabled]);

  if (disabled) {
    return (
      <Card withBorder>
        <Stack gap="md" align="center" py="xl">
          <IconSettings size={48} color="#ccc" />
          <Text size="lg" c="dimmed">Configuration management disabled</Text>
          <Text size="sm" c="dimmed" ta="center">
            Enable configuration management to view and modify source settings.
          </Text>
        </Stack>
      </Card>
    );
  }

  if (loading && !config) {
    return (
      <Card withBorder>
        <Stack gap="md" align="center" py="xl">
          <Loader size="lg" />
          <Text size="lg" c="dimmed">Loading configuration...</Text>
        </Stack>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card withBorder>
        <Alert icon={<IconSettings size={16} />} color="red" title="Configuration Not Found">
          Unable to load source configuration. Please check the source ID and try again.
        </Alert>
      </Card>
    );
  }

  return (
    <Card withBorder>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Box>
            <Group gap="sm" align="center" mb="xs">
              <IconSettings size={20} color="#228be6" />
              <Title order={4}>Source Configuration</Title>
              <Badge variant="light" color="blue">
                v{config.version}
              </Badge>
            </Group>
            <Text size="sm" c="dimmed" mb="xs">
              Manage source format, quality, network, and storage settings
            </Text>
            <Text size="xs" c="dimmed">
              Last updated: {new Date(config.lastUpdated).toLocaleString()}
            </Text>
          </Box>
          
          <Button
            variant="light"
            size="sm"
            onClick={loadConfiguration}
            loading={loading}
          >
            Refresh
          </Button>
        </Group>

        {/* Error Display */}
        {error && (
          <Alert icon={<IconSettings size={16} />} color="red" title="Error">
            {error}
          </Alert>
        )}

        {/* Configuration Overview */}
        <Stack gap="xl">
          {/* Format Information */}
          <Card withBorder>
            <Title order={5} mb="md">Format Configuration</Title>
            <Grid>
              <Grid.Col span={6}>
                <Stack gap="md">
                  <Box>
                    <Group gap="sm" mb={4}>
                      {getFormatIcon(config.format)}
                      <Text size="sm" fw={500}>Content Format</Text>
                    </Group>
                    <Text>{config.format}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} c="dimmed">Configuration Version</Text>
                    <Text>{config.version}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} c="dimmed">Last Updated</Text>
                    <Text>{new Date(config.lastUpdated).toLocaleString()}</Text>
                  </Box>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap="md">
                  <Box>
                    <Text size="sm" fw={500} c="dimmed">Quality Level</Text>
                    <Badge 
                      variant="light" 
                      color={getQualityColor(config.quality.quality)}
                      size="lg"
                    >
                      {config.quality.quality.charAt(0).toUpperCase() + config.quality.quality.slice(1)}
                    </Badge>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} c="dimmed">Storage Format</Text>
                    <Text>{config.storage.format.toUpperCase()}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} c="dimmed">Network Protocol</Text>
                    <Text>{config.network.protocol.toUpperCase()}</Text>
                  </Box>
                </Stack>
              </Grid.Col>
            </Grid>
          </Card>

          {/* Configuration Presets */}
          <Card withBorder>
            <Title order={5} mb="md">Configuration Presets</Title>
            <Stack gap="md">
              {config.presets.map((preset: any) => (
                <Paper key={preset.id} withBorder p="md">
                  <Group justify="space-between" align="flex-start">
                    <Box>
                      <Group gap="sm" align="center" mb="xs">
                        <Text fw={500}>{preset.name}</Text>
                        <Badge 
                          variant="light" 
                          color={getCategoryColor(preset.category)}
                          size="sm"
                        >
                          {preset.category.charAt(0).toUpperCase() + preset.category.slice(1)}
                        </Badge>
                        {preset.isDefault && (
                          <Badge variant="light" color="blue" size="sm">
                            Default
                          </Badge>
                        )}
                      </Group>
                      <Text size="sm" c="dimmed" mb="xs">{preset.description}</Text>
                    </Box>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => {
                        console.log('Applying preset:', preset);
                      }}
                    >
                      Apply
                    </Button>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Card>
        </Stack>
      </Stack>
    </Card>
  );
}
