
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Tooltip,
  Progress,
  Divider,
  Alert,
  Table,
  ScrollArea,
  Grid,
  Paper,
  SimpleGrid,
  Tabs,
  List,
  ThemeIcon,
  Modal,
  TextInput,
  Select,
  Textarea,
  NumberInput,
  Switch,
  Timeline,
  RingProgress,
  Code,
  Loader
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconDownload,
  IconTrash,
  IconEdit,
  IconEye,
  IconClock,
  IconTag,
  IconVideo,
  IconMusic,
  IconPhoto,
  IconDatabase,
  IconPlus,
  IconFilter,
  IconSearch,
  IconTimeline,
  IconCalendar,
  IconInfoCircle,
  IconLink,
  IconExternalLink,
  IconCopy,
  IconShare,
  IconFolder,
  IconFile,
  IconDatabase as IconStorage,
  IconNetwork,
  IconServer,
  IconActivity,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconSettings,
  IconRefresh,
  IconArrowLeft,
  IconBroadcast,
  IconSignalE,
  IconPalette,
  IconCode,
  IconContainer
} from '@tabler/icons-react';
import { apiClient } from '../services/api';

// Mock data structure based on backend API models
interface FlowDetails {
  id: string;
  source_id: string;
  source_name: string;
  format: string;
  codec: string;
  label: string;
  description: string;
  created_by: string;
  updated_by: string;
  created: string;
  updated: string;
  tags: Record<string, string>;
  status: 'active' | 'inactive' | 'processing' | 'error';
  read_only: boolean;
  
  // Video-specific fields
  frame_width?: number;
  frame_height?: number;
  frame_rate?: string;
  interlace_mode?: string;
  color_sampling?: string;
  color_space?: string;
  transfer_characteristics?: string;
  color_primaries?: string;
  
  // Audio-specific fields
  sample_rate?: number;
  bits_per_sample?: number;
  channels?: number;
  
  // Common fields
  container?: string;
  
  // Multi-flow fields
  flow_collection?: string[];
  
  // Performance metrics
  performance?: {
    bitrate: number;
    frame_drops: number;
    latency: number;
    quality_score: number;
    uptime_percentage: number;
  };
  
  // Storage info
  storage?: {
    total_segments: number;
    total_size: number;
    oldest_segment: string;
    newest_segment: string;
    storage_used: number;
    storage_limit: number;
  };
  
  // Recent segments
  recent_segments?: Array<{
    object_id: string;
    timerange: {
      start: string;
      end: string;
    };
    size: number;
    status: string;
  }>;
  
  // New soft delete fields for backend v6.0
  deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

// Mock data
const mockFlowDetails: FlowDetails = {
  id: 'flow_001',
  source_id: 'source_001',
  source_name: 'BBC News Studio Camera',
  format: 'urn:x-nmos:format:video',
  codec: 'video/H.264',
  label: 'BBC News Studio',
  description: 'High-quality video stream from BBC News Studio with professional lighting and audio',
  created_by: 'admin@bbc.com',
  updated_by: 'admin@bbc.com',
  created: '2024-01-15T09:00:00Z',
  updated: '2024-01-15T10:30:00Z',
  tags: {
    category: 'news',
    type: 'video',
    priority: 'high',
    location: 'studio',
    quality: 'broadcast'
  },
  status: 'active',
  read_only: false,
  
  // Video-specific
  frame_width: 1920,
  frame_height: 1080,
  frame_rate: '25/1',
  interlace_mode: 'progressive',
  color_sampling: '4:2:2',
  color_space: 'BT.709',
  transfer_characteristics: 'BT.709',
  color_primaries: 'BT.709',
  
  // Common
  container: 'MPEG-TS',
  
  // Performance
  performance: {
    bitrate: 15000000, // 15 Mbps
    frame_drops: 2,
    latency: 150, // ms
    quality_score: 95,
    uptime_percentage: 99.8
  },
  
  // Storage
  storage: {
    total_segments: 156,
    total_size: 21474836480, // 20 GB
    oldest_segment: '2024-01-15T09:00:00Z',
    newest_segment: '2024-01-15T10:30:00Z',
    storage_used: 21474836480,
    storage_limit: 107374182400 // 100 GB
  },
  
  // Recent segments
  recent_segments: [
    {
      object_id: 'obj_001',
      timerange: { start: '2024-01-15T10:00:00Z', end: '2024-01-15T10:01:00Z' },
      size: 52428800, // 50MB
      status: 'active'
    },
    {
      object_id: 'obj_002',
      timerange: { start: '2024-01-15T10:01:00Z', end: '2024-01-15T10:02:30Z' },
      size: 78643200, // 75MB
      status: 'active'
    },
    {
      object_id: 'obj_003',
      timerange: { start: '2024-01-15T10:02:30Z', end: '2024-01-15T10:03:00Z' },
      size: 26214400, // 25MB
      status: 'processing'
    }
  ]
};

const getFormatIcon = (format: string) => {
  switch (format) {
    case 'urn:x-nmos:format:video': return <IconVideo size={16} />;
    case 'urn:x-nmos:format:audio': return <IconMusic size={16} />;
    case 'urn:x-tam:format:image': return <IconPhoto size={16} />;
    default: return <IconDatabase size={16} />;
  }
};

const getFormatLabel = (format: string) => {
  switch (format) {
    case 'urn:x-nmos:format:video': return 'Video';
    case 'urn:x-nmos:format:audio': return 'Audio';
    case 'urn:x-tam:format:image': return 'Image';
    default: return 'Data';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'green';
    case 'inactive': return 'gray';
    case 'processing': return 'yellow';
    case 'error': return 'red';
    default: return 'gray';
  }
};

const formatFileSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDuration = (start: string, end: string) => {
  const startTime = new Date(start);
  const endTime = new Date(end);
  const durationMs = endTime.getTime() - startTime.getTime();
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

export default function FlowDetails() {
  const { flowId } = useParams<{ flowId: string }>();
  const navigate = useNavigate();
  const [flow, setFlow] = useState<FlowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchFlowDetails = async () => {
      if (!flowId) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.getFlow(flowId);
        setFlow(response);
      } catch (err: any) {
        // Check if it's a 404 error (backend not ready)
        if (err.message && err.message.includes('404')) {
          setError('Backend Not Ready - Flow details endpoint is not available');
        } else {
          setError('Failed to fetch flow details');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFlowDetails();
  }, [flowId]);

  const handleDeleteFlow = async () => {
    if (!flowId) return;
    
    try {
      await apiClient.deleteFlow(flowId, { softDelete: false, cascade: false, deletedBy: 'admin' });
      setShowDeleteModal(false);
      navigate('/flows');
    } catch (err: any) {
      setError('Failed to delete flow');
      console.error(err);
    }
  };

  const refreshFlowDetails = async () => {
    if (!flowId) return;
    
    try {
      setRefreshing(true);
      setError(null);
      const response = await apiClient.getFlow(flowId);
      setFlow(response);
    } catch (err: any) {
      // Check if it's a 404 error (backend not ready)
      if (err.message && err.message.includes('404')) {
        setError('Backend Not Ready - Flow details endpoint is not available');
      } else {
        setError('Failed to refresh flow details');
      }
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const retryFlowDetails = async () => {
    if (!flowId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getFlow(flowId);
      setFlow(response);
    } catch (err: any) {
      // Check if it's a 404 error (backend not ready)
      if (err.message && err.message.includes('404')) {
        setError('Backend Not Ready - Flow details endpoint is not available');
      } else {
        setError('Failed to fetch flow details');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !flow) {
    return (
      <Container size="xl" px="xl" py="xl">
        <Box ta="center" py="xl">
          <Loader />
          <Text mt="md">Loading flow details...</Text>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" px="xl" py="xl">
        <Box mb="xl">
          <Group gap="sm" mb="md">
            <Button
              variant="light"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate('/flows')}
            >
              Back to Flows
            </Button>
          </Group>
        </Box>
        
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          color="red" 
          title="Backend Not Ready"
          mb="xl"
        >
          The flow details endpoint is not available. This usually means the backend dependencies are not fully configured.
          <br /><br />
          <Text size="sm" c="dimmed">
            • Check that the backend is running at http://localhost:8000<br />
            • Verify that all required Python packages are installed<br />
            • Check backend logs for dependency errors
          </Text>
        </Alert>
        
        <Card withBorder>
          <Box ta="center" py="xl">
            <IconAlertCircle size={48} color="red" />
            <Title order={3} mt="md" mb="sm">Flow Details Unavailable</Title>
            <Text c="dimmed" mb="lg">
              Unable to load flow details from the backend API
            </Text>
            <Button 
              variant="light" 
              leftSection={<IconRefresh size={16} />}
              onClick={retryFlowDetails}
              loading={loading}
            >
              Try Again
            </Button>
          </Box>
        </Card>
      </Container>
    );
  }

  if (!flow) {
    return (
      <Container size="xl" px="xl" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} color="red">
          Flow not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" px="xl" py="xl">
      {/* Header */}
      <Box mb="xl">
        <Group justify="space-between" align="flex-start">
          <Box>
            <Group gap="sm" mb="md">
              <Button
                variant="light"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => navigate('/flows')}
              >
                Back to Flows
              </Button>
              <Badge color={getStatusColor(flow.status)} variant="light">
                {flow.status}
              </Badge>
            </Group>
            <Title order={2} mb="md">{flow.label}</Title>
            <Text size="lg" c="dimmed" mb="md">{flow.description}</Text>
            <Group gap="xs" wrap="wrap">
              {getFormatIcon(flow.format)}
              <Text size="sm">{getFormatLabel(flow.format)}</Text>
              <Text size="sm" c="dimmed">•</Text>
              <Text size="sm" c="dimmed">Source: {flow.source_name}</Text>
              <Text size="sm" c="dimmed">•</Text>
              <Text size="sm" c="dimmed">Codec: {flow.codec}</Text>
            </Group>
          </Box>
          <Group gap="sm">
            <Button leftSection={<IconPlayerPlay size={16} />}>
              Play Live
            </Button>
            <Button variant="light" leftSection={<IconEdit size={16} />} onClick={() => setShowEditModal(true)}>
              Edit Flow
            </Button>
            <Button 
              variant="light" 
              leftSection={<IconRefresh size={16} />} 
              onClick={refreshFlowDetails}
              loading={refreshing}
            >
              Refresh
            </Button>
            <ActionIcon
              color="red"
              variant="light"
              onClick={() => setShowDeleteModal(true)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Group>
      </Box>

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

      {/* Backend Status Note */}
      {error && error.includes('Backend Not Ready') && (
        <Alert 
          icon={<IconInfoCircle size={16} />} 
          color="blue" 
          title="Backend Status"
          mb="md"
        >
          The backend API endpoints for flows are not responding. This is likely due to missing Python dependencies (like 'ibis') that prevent the flows router from loading properly.
          <br /><br />
          <Text size="sm" c="dimmed">
            To fix this, the backend needs to have all required Python packages installed and running correctly.
          </Text>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview">
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconInfoCircle size={16} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="segments" leftSection={<IconTimeline size={16} />}>
            Segments
          </Tabs.Tab>
          <Tabs.Tab value="performance" leftSection={<IconActivity size={16} />}>
            Performance
          </Tabs.Tab>
          <Tabs.Tab value="storage" leftSection={<IconStorage size={16} />}>
            Storage
          </Tabs.Tab>
          <Tabs.Tab value="technical" leftSection={<IconSettings size={16} />}>
            Technical Details
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="xl">
          <Grid>
            <Grid.Col span={8}>
              <Stack gap="lg">
                {/* Flow Information */}
                <Card withBorder p="xl">
                  <Title order={4} mb="md">Flow Information</Title>
                  <Grid>
                    <Grid.Col span={6}>
                      <Stack gap="md">
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Flow ID</Text>
                          <Text size="sm" style={{ fontFamily: 'monospace' }}>{flow.id}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Source ID</Text>
                          <Text size="sm" style={{ fontFamily: 'monospace' }}>{flow.source_id}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Created By</Text>
                          <Text size="sm">{flow.created_by}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Created</Text>
                          <Text size="sm">{formatTimestamp(flow.created)}</Text>
                        </Box>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Stack gap="md">
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Format</Text>
                          <Text size="sm">{flow.format}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Codec</Text>
                          <Text size="sm">{flow.codec}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Updated By</Text>
                          <Text size="sm">{flow.updated_by}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Last Updated</Text>
                          <Text size="sm">{formatTimestamp(flow.updated)}</Text>
                        </Box>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Card>

                {/* Tags */}
                <Card withBorder p="xl">
                  <Title order={4} mb="md">Tags</Title>
                  <Group gap="xs" wrap="wrap">
                    {Object.entries(flow.tags).map(([key, value]) => (
                      <Badge key={key} color="blue" variant="light">
                        {key}: {value}
                      </Badge>
                    ))}
                  </Group>
                </Card>

                {/* Recent Segments */}
                <Card withBorder p="xl">
                  <Title order={4} mb="md">Recent Segments</Title>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Object ID</Table.Th>
                        <Table.Th>Time Range</Table.Th>
                        <Table.Th>Duration</Table.Th>
                        <Table.Th>Size</Table.Th>
                        <Table.Th>Status</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {flow.recent_segments?.map((segment) => (
                        <Table.Tr key={segment.object_id}>
                          <Table.Td>
                            <Text size="sm" style={{ fontFamily: 'monospace' }}>
                              {segment.object_id}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">
                              {formatTimestamp(segment.timerange.start)} - {formatTimestamp(segment.timerange.end)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">
                              {formatDuration(segment.timerange.start, segment.timerange.end)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{formatFileSize(segment.size)}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={getStatusColor(segment.status)} variant="light" size="sm">
                              {segment.status}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Card>
              </Stack>
            </Grid.Col>

            <Grid.Col span={4}>
              <Stack gap="lg">
                {/* Quick Stats */}
                <Card withBorder p="xl">
                  <Title order={4} mb="md">Quick Stats</Title>
                  <Stack gap="md">
                    <Box>
                      <Group gap="xs" mb={4}>
                        <IconTimeline size={20} color="#228be6" />
                        <Text size="sm" fw={500} c="dimmed">Total Segments</Text>
                      </Group>
                      <Text size="lg" fw={600}>{flow.storage?.total_segments || 0}</Text>
                    </Box>
                    <Box>
                      <Group gap="xs" mb={4}>
                        <IconStorage size={20} color="#40c057" />
                        <Text size="sm" fw={500} c="dimmed">Total Size</Text>
                      </Group>
                      <Text size="lg" fw={600}>{flow.storage ? formatFileSize(flow.storage.total_size) : '0 B'}</Text>
                    </Box>
                    <Box>
                      <Group gap="xs" mb={4}>
                        <IconTrendingUp size={20} color="#fd7e14" />
                        <Text size="sm" fw={500} c="dimmed">Quality Score</Text>
                      </Group>
                      <Text size="lg" fw={600}>{flow.performance?.quality_score || 0}%</Text>
                    </Box>
                    <Box>
                      <Group gap="xs" mb={4}>
                        <IconCheck size={20} color="#7950f2" />
                        <Text size="sm" fw={500} c="dimmed">Uptime</Text>
                      </Group>
                      <Text size="lg" fw={600}>{flow.performance?.uptime_percentage || 0}%</Text>
                    </Box>
                  </Stack>
                </Card>

                {/* Performance Ring */}
                <Card withBorder p="xl">
                  <Title order={4} mb="md">Performance</Title>
                  <Box ta="center">
                    <RingProgress
                      size={120}
                      thickness={12}
                      sections={[
                        { value: flow.performance?.quality_score || 0, color: 'green' }
                      ]}
                      label={
                        <Text ta="center" size="lg" fw={700}>
                          {flow.performance?.quality_score || 0}%
                        </Text>
                      }
                    />
                    <Text size="sm" c="dimmed" mt="md">Quality Score</Text>
                  </Box>
                </Card>
              </Stack>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="segments" pt="xl">
          <Card withBorder p="xl">
            <Group justify="space-between" mb="md">
              <Title order={4}>Flow Segments</Title>
              <Button leftSection={<IconPlus size={16} />}>
                Upload Segment
              </Button>
            </Group>
            <Text size="sm" c="dimmed" mb="lg">
              {flow.storage?.total_segments || 0} segments found
            </Text>
            
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Object ID</Table.Th>
                  <Table.Th>Start Time</Table.Th>
                  <Table.Th>End Time</Table.Th>
                  <Table.Th>Duration</Table.Th>
                  <Table.Th>Size</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {flow.recent_segments?.map((segment) => (
                  <Table.Tr key={segment.object_id}>
                    <Table.Td>
                      <Text size="sm" style={{ fontFamily: 'monospace' }}>
                        {segment.object_id}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatTimestamp(segment.timerange.start)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatTimestamp(segment.timerange.end)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {formatDuration(segment.timerange.start, segment.timerange.end)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatFileSize(segment.size)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(segment.status)} variant="light" size="sm">
                        {segment.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon size="sm" variant="light">
                          <IconEye size={14} />
                        </ActionIcon>
                        <ActionIcon size="sm" variant="light">
                          <IconPlayerPlay size={14} />
                        </ActionIcon>
                        <ActionIcon size="sm" variant="light">
                          <IconDownload size={14} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="performance" pt="xl">
          <Grid>
            <Grid.Col span={6}>
              <Card withBorder p="xl">
                <Title order={4} mb="md">Performance Metrics</Title>
                <Stack gap="lg">
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Bitrate</Text>
                    <Text size="lg" fw={600}>
                      {flow.performance ? Math.round(flow.performance.bitrate / 1000000) : 0} Mbps
                    </Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Frame Drops</Text>
                    <Text size="lg" fw={600}>
                      {flow.performance?.frame_drops || 0} frames
                    </Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Latency</Text>
                    <Text size="lg" fw={600}>
                      {flow.performance?.latency || 0} ms
                    </Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Quality Score</Text>
                    <Progress
                      value={flow.performance?.quality_score || 0}
                      color={flow.performance && flow.performance.quality_score > 90 ? 'green' : 
                             flow.performance && flow.performance.quality_score > 70 ? 'yellow' : 'red'}
                      size="lg"
                    />
                    <Text size="sm" c="dimmed" mt="xs">
                      {flow.performance?.quality_score || 0}%
                    </Text>
                  </Box>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={6}>
              <Card withBorder p="xl">
                <Title order={4} mb="md">Uptime & Reliability</Title>
                <Stack gap="lg">
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Uptime Percentage</Text>
                    <Progress
                      value={flow.performance?.uptime_percentage || 0}
                      color="green"
                      size="lg"
                    />
                    <Text size="sm" c="dimmed" mt="xs">
                      {flow.performance?.uptime_percentage || 0}%
                    </Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Status</Text>
                    <Badge color={getStatusColor(flow.status)} variant="light" size="lg">
                      {flow.status}
                    </Badge>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Read Only</Text>
                    <Badge color={flow.read_only ? 'red' : 'green'} variant="light" size="lg">
                      {flow.read_only ? 'Yes' : 'No'}
                    </Badge>
                  </Box>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="storage" pt="xl">
          <Grid>
            <Grid.Col span={6}>
              <Card withBorder p="xl">
                <Title order={4} mb="md">Storage Overview</Title>
                <Stack gap="lg">
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Total Segments</Text>
                    <Text size="lg" fw={600}>{flow.storage?.total_segments || 0}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Total Size</Text>
                    <Text size="lg" fw={600}>
                      {flow.storage ? formatFileSize(flow.storage.total_size) : '0 B'}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Storage Used</Text>
                    <Progress
                      value={flow.storage ? (flow.storage.storage_used / flow.storage.storage_limit) * 100 : 0}
                      color={flow.storage && (flow.storage.storage_used / flow.storage.storage_limit) > 0.8 ? 'red' : 'blue'}
                      size="lg"
                    />
                    <Text size="sm" c="dimmed" mt="xs">
                      {flow.storage ? formatFileSize(flow.storage.storage_used) : '0 B'} / {flow.storage ? formatFileSize(flow.storage.storage_limit) : '0 B'}
                    </Text>
                  </Box>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={6}>
              <Card withBorder p="xl">
                <Title order={4} mb="md">Time Range</Title>
                <Stack gap="lg">
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Oldest Segment</Text>
                    <Text size="sm">{flow.storage ? formatTimestamp(flow.storage.oldest_segment) : 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Newest Segment</Text>
                    <Text size="sm">{flow.storage ? formatTimestamp(flow.storage.newest_segment) : 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Time Span</Text>
                    <Text size="sm">
                      {flow.storage ? formatDuration(flow.storage.oldest_segment, flow.storage.newest_segment) : 'N/A'}
                    </Text>
                  </Box>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="technical" pt="xl">
          <Grid>
            <Grid.Col span={6}>
              <Card withBorder p="xl">
                <Title order={4} mb="md">Video Specifications</Title>
                <Stack gap="md">
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Resolution</Text>
                    <Text size="sm">{flow.frame_width} x {flow.frame_height}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Frame Rate</Text>
                    <Text size="sm">{flow.frame_rate}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Interlace Mode</Text>
                    <Text size="sm">{flow.interlace_mode || 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Color Sampling</Text>
                    <Text size="sm">{flow.color_sampling || 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Color Space</Text>
                    <Text size="sm">{flow.color_space || 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Transfer Characteristics</Text>
                    <Text size="sm">{flow.transfer_characteristics || 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Color Primaries</Text>
                    <Text size="sm">{flow.color_primaries || 'N/A'}</Text>
                  </Box>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={6}>
              <Card withBorder p="xl">
                <Title order={4} mb="md">Audio Specifications</Title>
                <Stack gap="md">
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Sample Rate</Text>
                    <Text size="sm">{flow.sample_rate ? `${flow.sample_rate} Hz` : 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Bits Per Sample</Text>
                    <Text size="sm">{flow.bits_per_sample ? `${flow.bits_per_sample} bit` : 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Channels</Text>
                    <Text size="sm">{flow.channels ? `${flow.channels} channels` : 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Container</Text>
                    <Text size="sm">{flow.container || 'N/A'}</Text>
                  </Box>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>
      </Tabs>

      {/* Edit Flow Modal */}
      <Modal
        opened={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Flow"
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Label"
            value={flow.label}
            onChange={(event) => setFlow({ ...flow, label: event.currentTarget.value })}
          />
          <Textarea
            label="Description"
            value={flow.description}
            onChange={(event) => setFlow({ ...flow, description: event.currentTarget.value })}
            rows={3}
          />
          <Select
            label="Status"
            value={flow.status}
            onChange={(value) => setFlow({ ...flow, status: value as 'active' | 'inactive' | 'processing' | 'error' })}
            data={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'processing', label: 'Processing' },
              { value: 'error', label: 'Error' }
            ]}
          />
          <Switch
            label="Read Only"
            checked={flow.read_only}
            onChange={(event) => setFlow({ ...flow, read_only: event.currentTarget.checked })}
          />
          <Group gap="xs" justify="flex-end">
            <Button variant="light" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={async () => {
              if (!flowId) return;
              
              try {
                await apiClient.updateFlow(flowId, flow);
                setShowEditModal(false);
              } catch (err: any) {
                setError('Failed to update flow');
                console.error(err);
              }
            }}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Flow"
        size="md"
      >
        <Stack gap="md">
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            Are you sure you want to delete this flow? This action cannot be undone.
          </Alert>
          <Text size="sm">
            <strong>Flow ID:</strong> {flow.id}<br />
            <strong>Label:</strong> {flow.label}<br />
            <strong>Segments:</strong> {flow.storage?.total_segments || 0} segments<br />
            <strong>Total Size:</strong> {flow.storage ? formatFileSize(flow.storage.total_size) : '0 B'}
          </Text>
          <Group gap="xs" justify="flex-end">
            <Button variant="light" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteFlow}>
              Delete Flow
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
} 