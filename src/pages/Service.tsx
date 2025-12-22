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
  Alert,
  Grid,
  Paper,
  Loader,
  Divider,
  CopyButton
} from '@mantine/core';
import {
  IconInfoCircle,
  IconRefresh,
  IconServer,
  IconDatabase,
  IconFile,
  IconTag,
  IconVideo,
  IconAlertCircle,
  IconCheck,
  IconCopy,
  IconCode,
  IconDatabase as IconStorage
} from '@tabler/icons-react';
import { apiClient } from '../services/api';

// Service info structure based on actual API response from GET /service
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

interface StorageBackend {
  id: string;
  type: string;
  description?: string;
  [key: string]: any;
}

export default function Service() {
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null);
  const [storageBackends, setStorageBackends] = useState<StorageBackend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch service info from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [serviceResponse, backendsResponse] = await Promise.all([
          apiClient.getService().catch(() => null),
          apiClient.getStorageBackends().catch(() => null)
        ]);
        
        // Use actual API response - backend returns: { name, version, capabilities }
        if (serviceResponse) {
          setServiceInfo(serviceResponse as ServiceInfo);
        } else {
          setServiceInfo(null);
        }
        
        if (backendsResponse?.storage_backends) {
          setStorageBackends(backendsResponse.storage_backends);
        }
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
      const [serviceResponse, backendsResponse] = await Promise.all([
        apiClient.getService().catch(() => null),
        apiClient.getStorageBackends().catch(() => null)
      ]);
      
      // Use actual API response
      if (serviceResponse) {
        setServiceInfo(serviceResponse as ServiceInfo);
      } else {
        setServiceInfo(null);
      }
      
      if (backendsResponse?.storage_backends) {
        setStorageBackends(backendsResponse.storage_backends);
      }
    } catch (err: any) {
      setError('Failed to refresh service information');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const API_BASE_URL = import.meta.env.DEV 
    ? (import.meta.env.VITE_API_URL || 'http://localhost:3000')
    : '/api/proxy';

  return (
    <Container size="xl" px="xl" py="xl">
      {/* Header */}
      <Box mb="xl">
        <Group justify="space-between" align="flex-end">
          <Box>
            <Title order={2} mb="md">Service Information</Title>
            <Text size="lg" c="dimmed">
              View TAMS API service configuration and capabilities
            </Text>
          </Box>
          <Group gap="sm">
            <Badge color="green" variant="light" size="lg">
              <IconServer size={16} style={{ marginRight: 8 }} />
              TAMS API (Local)
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

      {/* Info Alert */}
      <Alert
        icon={<IconInfoCircle size={20} />}
        title="Service Information"
        color="blue"
        variant="light"
        mb="lg"
      >
        <Text size="sm">
          This page displays service configuration and capabilities from the TAMS API. 
          For real-time system health monitoring and metrics, see the <strong>Observability</strong> page.
        </Text>
        <Text size="sm" mt="xs">
          <strong>Note:</strong> This page shows static service information (name, version, capabilities, storage backends). 
          Dynamic health metrics and system monitoring are available on the Observability page.
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
                        <Text size="sm">{serviceInfo?.name || 'N/A'}</Text>
                      </Box>
                      <Box>
                        <Text size="sm" fw={500} c="dimmed">Version</Text>
                        <Text size="sm">{serviceInfo?.version || 'N/A'}</Text>
                      </Box>
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Stack gap="md">
                      <Box>
                        <Text size="sm" fw={500} c="dimmed">API Base URL</Text>
                        <Group gap="xs" mt={4}>
                          <Text size="sm" style={{ fontFamily: 'monospace' }}>
                            {API_BASE_URL}
                          </Text>
                          <CopyButton value={API_BASE_URL}>
                            {({ copied, copy }) => (
                              <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy} size="sm">
                                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                              </ActionIcon>
                            )}
                          </CopyButton>
                        </Group>
                      </Box>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Card>

              {/* Capabilities */}
              <Card withBorder p="xl">
                <Title order={4} mb="md">Service Capabilities</Title>
                {serviceInfo?.capabilities ? (
                  <Stack gap="md">
                    <Group gap="xs" wrap="wrap">
                      {serviceInfo.capabilities.sources && (
                        <Badge variant="light" color="blue" size="lg">
                          <IconDatabase size={14} style={{ marginRight: 4 }} />
                          Sources
                        </Badge>
                      )}
                      {serviceInfo.capabilities.flows && (
                        <Badge variant="light" color="green" size="lg">
                          <IconVideo size={14} style={{ marginRight: 4 }} />
                          Flows
                        </Badge>
                      )}
                      {serviceInfo.capabilities.segments && (
                        <Badge variant="light" color="orange" size="lg">
                          <IconFile size={14} style={{ marginRight: 4 }} />
                          Segments
                        </Badge>
                      )}
                      {serviceInfo.capabilities.metadata && (
                        <Badge variant="light" color="purple" size="lg">
                          <IconTag size={14} style={{ marginRight: 4 }} />
                          Metadata
                        </Badge>
                      )}
                      {serviceInfo.capabilities.tags && (
                        <Badge variant="light" color="cyan" size="lg">
                          <IconTag size={14} style={{ marginRight: 4 }} />
                          Tags
                        </Badge>
                      )}
                    </Group>
                    {serviceInfo.capabilities.storage_backends && serviceInfo.capabilities.storage_backends.length > 0 && (
                      <Box>
                        <Text size="sm" fw={500} c="dimmed" mb="xs">Storage Backends</Text>
                        <Group gap="xs">
                          {serviceInfo.capabilities.storage_backends.map((backend: string) => (
                            <Badge key={backend} variant="outline" color="gray">
                              {backend}
                            </Badge>
                          ))}
                        </Group>
                      </Box>
                    )}
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">No capabilities information available</Text>
                )}
              </Card>

              {/* Storage Backends */}
              <Card withBorder p="xl">
                <Title order={4} mb="md">Storage Backends</Title>
                {storageBackends.length > 0 ? (
                  <Stack gap="md">
                    {storageBackends.map((backend) => (
                      <Paper key={backend.id} p="md" withBorder>
                        <Stack gap="xs">
                          <Group justify="space-between">
                            <Group gap="xs">
                              <IconStorage size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
                              <Text size="sm" fw={600}>{backend.id}</Text>
                            </Group>
                            <Badge variant="light" color="blue">
                              {backend.type}
                            </Badge>
                          </Group>
                          {backend.description && (
                            <Text size="xs" c="dimmed">{backend.description}</Text>
                          )}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">No storage backends configured</Text>
                )}
              </Card>
            </Stack>
          </Grid.Col>

          <Grid.Col span={4}>
            <Stack gap="lg">
              {/* Quick Info */}
              <Card withBorder p="xl">
                <Title order={4} mb="md">Quick Info</Title>
                <Stack gap="md">
                  <Box>
                    <Group gap="xs" mb={4}>
                      <IconServer size={20} color="#40c057" />
                      <Text size="sm" fw={500} c="dimmed">Service Name</Text>
                    </Group>
                    <Text size="lg" fw={600}>
                      {serviceInfo?.name || 'N/A'}
                    </Text>
                  </Box>
                  <Box>
                    <Group gap="xs" mb={4}>
                      <IconCode size={20} color="#40c057" />
                      <Text size="sm" fw={500} c="dimmed">Version</Text>
                    </Group>
                    <Text size="lg" fw={600}>
                      {serviceInfo?.version || 'N/A'}
                    </Text>
                  </Box>
                  <Divider />
                  <Box>
                    <Text size="sm" fw={500} c="dimmed" mb="xs">Note</Text>
                    <Text size="xs" c="dimmed">
                      For real-time health monitoring and system metrics, see the <strong>Observability</strong> page.
                    </Text>
                  </Box>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>
      )}
    </Container>
  );
}
