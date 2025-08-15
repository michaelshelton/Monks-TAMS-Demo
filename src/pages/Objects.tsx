import { useState, useMemo, useEffect } from 'react';
import { 
  Container, 
  Title, 
  Card, 
  Stack, 
  Badge, 
  Group, 
  Box, 
  Text, 
  Button,
  Select,
  TextInput,
  Modal,
  Textarea,
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
  Loader,
  Chip
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
  IconRefresh,
  IconAlertCircle
} from '@tabler/icons-react';
import AdvancedFilter, { FilterOption, FilterState, FilterPreset } from '../components/AdvancedFilter';
import { useFilterPersistence } from '../hooks/useFilterPersistence';
import { EnhancedDeleteModal, DeleteOptions } from '../components/EnhancedDeleteModal';
import { apiClient } from '../services/api';

// Mock data structure based on backend API models
interface MediaObject {
  object_id: string;
  flow_references: Array<{
    flow_id: string;
    flow_name: string;
    flow_format: string;
    timerange?: {
      start: string;
      end: string;
    };
  }>;
  size?: number;
  created?: string;
  updated?: string;
  status: 'active' | 'archived' | 'deleted' | 'processing';
  storage_location?: string;
  access_urls?: Array<{
    url: string;
    label?: string;
    type: 'download' | 'stream' | 'preview';
  }>;
  metadata?: {
    content_type?: string;
    encoding?: string;
    checksum?: string;
    compression?: string;
  };
  tags?: Record<string, string>;
  description?: string;
  // New soft delete fields for backend v6.0
  deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

// Mock data
const dummyObjects: MediaObject[] = [
  {
    object_id: 'obj_001',
    flow_references: [
      {
        flow_id: 'flow_001',
        flow_name: 'BBC News Studio',
        flow_format: 'urn:x-nmos:format:video',
        timerange: { start: '2024-01-15T10:00:00Z', end: '2024-01-15T10:01:00Z' }
      }
    ],
    size: 52428800, // 50MB
    created: '2024-01-15T10:00:00Z',
    status: 'active',
    storage_location: 's3://vast-media-bucket/obj_001.mp4',
    access_urls: [
      { url: 'https://vast-media.example.com/obj_001.mp4', label: 'Download', type: 'download' },
      { url: 'https://vast-media.example.com/obj_001/stream.m3u8', label: 'Stream', type: 'stream' },
      { url: 'https://vast-media.example.com/obj_001/preview.jpg', label: 'Preview', type: 'preview' }
    ],
    metadata: {
      content_type: 'video/mp4',
      encoding: 'H.264',
      checksum: 'sha256:abc123...',
      compression: 'none'
    },
    tags: { category: 'news', type: 'video', priority: 'high' },
    description: 'BBC News Studio opening segment'
  },
  {
    object_id: 'obj_002',
    flow_references: [
      {
        flow_id: 'flow_001',
        flow_name: 'BBC News Studio',
        flow_format: 'urn:x-nmos:format:video',
        timerange: { start: '2024-01-15T10:01:00Z', end: '2024-01-15T10:02:30Z' }
      },
      {
        flow_id: 'flow_002',
        flow_name: 'Sports Arena Camera',
        flow_format: 'urn:x-nmos:format:video',
        timerange: { start: '2024-01-15T10:01:00Z', end: '2024-01-15T10:02:30Z' }
      }
    ],
    size: 78643200, // 75MB
    created: '2024-01-15T10:01:00Z',
    status: 'active',
    storage_location: 's3://vast-media-bucket/obj_002.mp4',
    access_urls: [
      { url: 'https://vast-media.example.com/obj_002.mp4', label: 'Download', type: 'download' },
      { url: 'https://vast-media.example.com/obj_002/stream.m3u8', label: 'Stream', type: 'stream' }
    ],
    metadata: {
      content_type: 'video/mp4',
      encoding: 'H.264',
      checksum: 'sha256:def456...',
      compression: 'none'
    },
    tags: { category: 'news', type: 'video', priority: 'medium' },
    description: 'Multi-flow video object with news and sports content'
  },
  {
    object_id: 'obj_003',
    flow_references: [
      {
        flow_id: 'flow_003',
        flow_name: 'Radio Studio A',
        flow_format: 'urn:x-nmos:format:audio',
        timerange: { start: '2024-01-15T10:03:00Z', end: '2024-01-15T10:04:00Z' }
      }
    ],
    size: 10485760, // 10MB
    created: '2024-01-15T10:03:00Z',
    status: 'active',
    storage_location: 's3://vast-media-bucket/obj_003.mp3',
    access_urls: [
      { url: 'https://vast-media.example.com/obj_003.mp3', label: 'Download', type: 'download' },
      { url: 'https://vast-media.example.com/obj_003/stream.m3u8', label: 'Stream', type: 'stream' }
    ],
    metadata: {
      content_type: 'audio/mp3',
      encoding: 'AAC',
      checksum: 'sha256:ghi789...',
      compression: 'mp3'
    },
    tags: { category: 'audio', type: 'music', priority: 'medium' },
    description: 'Background music audio object'
  },
  {
    object_id: 'obj_004',
    flow_references: [
      {
        flow_id: 'flow_004',
        flow_name: 'Photo Studio Feed',
        flow_format: 'urn:x-tam:format:image',
        timerange: { start: '2024-01-15T10:04:00Z', end: '2024-01-15T10:04:30Z' }
      }
    ],
    size: 5242880, // 5MB
    created: '2024-01-15T10:04:00Z',
    status: 'processing',
    storage_location: 's3://vast-media-bucket/obj_004.jpg',
    access_urls: [
      { url: 'https://vast-media.example.com/obj_004.jpg', label: 'Download', type: 'download' },
      { url: 'https://vast-media.example.com/obj_004/preview.jpg', label: 'Preview', type: 'preview' }
    ],
    metadata: {
      content_type: 'image/jpeg',
      encoding: 'JPEG',
      checksum: 'sha256:jkl012...',
      compression: 'jpeg'
    },
    tags: { category: 'image', type: 'photo', priority: 'low' },
    description: 'Photo gallery image object'
  },
  {
    object_id: 'obj_005',
    flow_references: [
      {
        flow_id: 'flow_005',
        flow_name: 'Data Feed',
        flow_format: 'urn:x-nmos:format:data',
        timerange: { start: '2024-01-15T10:05:00Z', end: '2024-01-15T10:06:00Z' }
      }
    ],
    size: 2097152, // 2MB
    created: '2024-01-15T10:05:00Z',
    status: 'archived',
    storage_location: 's3://vast-media-bucket/obj_005.json',
    access_urls: [
      { url: 'https://vast-media.example.com/obj_005.json', label: 'Download', type: 'download' }
    ],
    metadata: {
      content_type: 'application/json',
      encoding: 'UTF-8',
      checksum: 'sha256:mno345...',
      compression: 'gzip'
    },
    tags: { category: 'data', type: 'metadata', priority: 'low' },
    description: 'Data feed JSON object'
  }
];

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
    case 'processing': return 'yellow';
    case 'archived': return 'blue';
    case 'deleted': return 'red';
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

const getContentTypeIcon = (contentType: string) => {
  if (contentType?.includes('video')) return <IconVideo size={16} />;
  if (contentType?.includes('audio')) return <IconMusic size={16} />;
  if (contentType?.includes('image')) return <IconPhoto size={16} />;
  if (contentType?.includes('json') || contentType?.includes('text')) return <IconFile size={16} />;
  return <IconDatabase size={16} />;
};

export default function Objects() {
  const [objects, setObjects] = useState<MediaObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<MediaObject | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);
  
  // Advanced filtering
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useFilterPersistence('objects');
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);

  // Define filter options
  const filterOptions: FilterOption[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search objects by description or ID...'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'processing', label: 'Processing' },
        { value: 'archived', label: 'Archived' },
        { value: 'deleted', label: 'Deleted' }
      ]
    },
    {
      key: 'content_type',
      label: 'Content Type',
      type: 'select',
      options: [
        { value: 'video', label: 'Video' },
        { value: 'audio', label: 'Audio' },
        { value: 'image', label: 'Image' },
        { value: 'data', label: 'Data' }
      ]
    },
    {
      key: 'size_range',
      label: 'Size Range',
      type: 'select',
      options: [
        { value: 'small', label: 'Small (< 10MB)' },
        { value: 'medium', label: 'Medium (10MB - 100MB)' },
        { value: 'large', label: 'Large (> 100MB)' }
      ]
    },
    {
      key: 'created',
      label: 'Created Date',
      type: 'date',
      placeholder: 'Select date range'
    },
    {
      key: 'tags',
      label: 'Tags',
      type: 'text',
      placeholder: 'Filter by tag key:value'
    }
  ];

  const filteredObjects = objects.filter(obj => {
    // Search filter
    const searchTerm = filters.search?.toLowerCase();
    const matchesSearch = !searchTerm || 
      obj.description?.toLowerCase().includes(searchTerm) ||
      obj.object_id.toLowerCase().includes(searchTerm);

    // Status filter
    const statusFilter = filters.status;
    const matchesStatus = !statusFilter || obj.status === statusFilter;

    // Content type filter
    const contentTypeFilter = filters.content_type;
    const matchesContentType = !contentTypeFilter || 
      obj.metadata?.content_type?.includes(contentTypeFilter);

    // Size range filter
    const sizeRangeFilter = filters.size_range;
    const matchesSizeRange = !sizeRangeFilter || (() => {
      if (!obj.size) return false;
      switch (sizeRangeFilter) {
        case 'small': return obj.size < 10 * 1024 * 1024; // < 10MB
        case 'medium': return obj.size >= 10 * 1024 * 1024 && obj.size < 100 * 1024 * 1024; // 10MB - 100MB
        case 'large': return obj.size >= 100 * 1024 * 1024; // > 100MB
        default: return true;
      }
    })();

    // Created date filter
    const createdFilter = filters.created;
    const matchesCreated = !createdFilter || (() => {
      // Simplified date filtering for demo
      switch (createdFilter) {
        case 'today':
        case 'yesterday':
        case 'last_7_days':
        case 'last_30_days':
        case 'last_90_days':
        case 'this_month':
        case 'last_month':
        case 'this_year':
        case 'last_year':
          return true; // For demo, show all items
        default:
          return true;
      }
    })();

    // Tags filter
    const tagsFilter = filters.tags;
    const matchesTags = !tagsFilter || 
      (obj.tags && Object.entries(obj.tags).some(([key, value]) => 
        `${key}:${value}`.toLowerCase().includes(tagsFilter.toLowerCase())
      ));

    return matchesSearch && matchesStatus && matchesContentType && matchesSizeRange && matchesCreated && matchesTags;
  });

  // Fetch objects from API
  useEffect(() => {
    const fetchObjects = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getObjects({
          page: currentPage,
          page_size: 10,
          show_deleted: showDeleted
        });
        setObjects(response.data || []);
      } catch (err: any) {
        if (err.message?.includes('404') || err.message?.includes('Not Found')) {
          setError('Objects API endpoint is not available yet. The backend is still being configured.');
          setObjects([]);
        } else {
          setError('Failed to fetch objects');
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchObjects();
  }, [currentPage, showDeleted, filters]);

  const handleCreateObject = async (newObject: Omit<MediaObject, 'object_id' | 'created' | 'updated'>) => {
    try {
      setLoading(true);
      const response = await apiClient.createObject(newObject);
      setObjects(prev => [...prev, response.data]);
      setShowEditModal(false);
    } catch (err) {
      setError('Failed to create object');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteObject = async (objectId: string, options: DeleteOptions) => {
    try {
      setLoading(true);
      await apiClient.deleteObject(objectId, options);
      setObjects(prev => prev.filter(o => o.object_id !== objectId));
      setShowDeleteModal(false);
      setSelectedObject(null);
    } catch (err) {
      setError('Failed to delete object');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (object: MediaObject) => {
    setSelectedObject(object);
    setShowDetailsModal(true);
  };

  const handleEdit = (object: MediaObject) => {
    setSelectedObject(object);
    setShowEditModal(true);
  };

  const handleDelete = (object: MediaObject) => {
    setSelectedObject(object);
    setShowDeleteModal(true);
  };

  const renderGridView = () => (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
      {filteredObjects.map((obj) => (
        <Card key={obj.object_id} withBorder p="md">
          <Stack gap="md">
            {/* Header */}
            <Group justify="space-between">
              <Group gap="xs">
                {getContentTypeIcon(obj.metadata?.content_type || '')}
                <Text fw={600} size="sm" style={{ fontFamily: 'monospace' }}>
                  {obj.object_id}
                </Text>
              </Group>
              <Badge color={getStatusColor(obj.status)} variant="light" size="sm">
                {obj.status}
              </Badge>
            </Group>

            {/* Description */}
            <Text size="sm" c="dimmed" lineClamp={2}>
              {obj.description || 'No description available'}
            </Text>

            {/* Flow References */}
            <Box>
              <Text size="xs" fw={500} mb="xs">Flows ({obj.flow_references.length})</Text>
              <Stack gap="xs">
                {obj.flow_references.slice(0, 2).map((flow, index) => (
                  <Group key={index} gap="xs">
                    {getFormatIcon(flow.flow_format)}
                    <Text size="xs" lineClamp={1}>
                      {flow.flow_name}
                    </Text>
                  </Group>
                ))}
                {obj.flow_references.length > 2 && (
                  <Text size="xs" c="dimmed">
                    +{obj.flow_references.length - 2} more flows
                  </Text>
                )}
              </Stack>
            </Box>

            {/* Metadata */}
            <Group gap="xs" wrap="wrap">
              {obj.size && (
                <Badge color="blue" variant="light" size="xs">
                  {formatFileSize(obj.size)}
                </Badge>
              )}
              {obj.metadata?.content_type && (
                <Badge color="gray" variant="light" size="xs">
                  {obj.metadata.content_type.split('/')[1]}
                </Badge>
              )}
              {obj.created && (
                <Badge color="green" variant="light" size="xs">
                  {formatTimestamp(obj.created)}
                </Badge>
              )}
            </Group>

            {/* Tags */}
            {obj.tags && (
              <Group gap="xs" wrap="wrap">
                {Object.entries(obj.tags).slice(0, 3).map(([key, value]) => (
                  <Badge key={key} color="gray" variant="outline" size="xs">
                    {key}: {value}
                  </Badge>
                ))}
                {Object.keys(obj.tags).length > 3 && (
                  <Text size="xs" c="dimmed">
                    +{Object.keys(obj.tags).length - 3} more tags
                  </Text>
                )}
              </Group>
            )}

            {/* Actions */}
            <Group gap="xs">
              <Button
                size="xs"
                variant="light"
                leftSection={<IconEye size={14} />}
                onClick={() => {
                  setSelectedObject(obj);
                  setShowDetailsModal(true);
                }}
              >
                Details
              </Button>
              {obj.access_urls?.some(url => url.type === 'stream') && (
                <Button size="xs" variant="light" leftSection={<IconPlayerPlay size={14} />}>
                  Play
                </Button>
              )}
              <Button size="xs" variant="light" leftSection={<IconDownload size={14} />}>
                Download
              </Button>
              <ActionIcon
                size="sm"
                variant="light"
                color="red"
                onClick={() => {
                  setSelectedObject(obj);
                  setShowDeleteModal(true);
                }}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );

  const renderListView = () => (
    <Stack gap="md">
      {filteredObjects.map((obj) => (
        <Paper key={obj.object_id} withBorder p="md">
          <Grid>
            <Grid.Col span={3}>
              <Stack gap="xs">
                <Group gap="xs">
                  {getContentTypeIcon(obj.metadata?.content_type || '')}
                  <Text fw={600} size="sm" style={{ fontFamily: 'monospace' }}>
                    {obj.object_id}
                  </Text>
                </Group>
                <Text size="xs" c="dimmed" lineClamp={2}>
                  {obj.description || 'No description available'}
                </Text>
              </Stack>
            </Grid.Col>
            
            <Grid.Col span={2}>
              <Stack gap="xs">
                <Text size="sm" fw={500}>Flows</Text>
                <Text size="xs">{obj.flow_references.length} flows</Text>
                <Text size="xs" c="dimmed">
                  {obj.flow_references.map(f => getFormatLabel(f.flow_format)).join(', ')}
                </Text>
              </Stack>
            </Grid.Col>
            
            <Grid.Col span={2}>
              <Stack gap="xs">
                <Text size="sm" fw={500}>Size & Status</Text>
                {obj.size && (
                  <Text size="xs">{formatFileSize(obj.size)}</Text>
                )}
                <Badge color={getStatusColor(obj.status)} variant="light" size="xs">
                  {obj.status}
                </Badge>
              </Stack>
            </Grid.Col>
            
            <Grid.Col span={3}>
              <Stack gap="xs">
                <Text size="sm" fw={500}>Tags</Text>
                <Group gap="xs" wrap="wrap">
                  {obj.tags && Object.entries(obj.tags).slice(0, 2).map(([key, value]) => (
                    <Badge key={key} color="gray" variant="outline" size="xs">
                      {key}: {value}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            </Grid.Col>
            
            <Grid.Col span={2}>
              <Group gap="xs">
                <Tooltip label="View Details">
                  <ActionIcon
                    size="sm"
                    variant="light"
                    onClick={() => {
                      setSelectedObject(obj);
                      setShowDetailsModal(true);
                    }}
                  >
                    <IconEye size={14} />
                  </ActionIcon>
                </Tooltip>
                {obj.access_urls?.some(url => url.type === 'stream') && (
                  <Tooltip label="Play">
                    <ActionIcon size="sm" variant="light">
                      <IconPlayerPlay size={14} />
                    </ActionIcon>
                  </Tooltip>
                )}
                <Tooltip label="Download">
                  <ActionIcon size="sm" variant="light">
                    <IconDownload size={14} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete">
                  <ActionIcon
                    size="sm"
                    variant="light"
                    color="red"
                    onClick={() => {
                      setSelectedObject(obj);
                      setShowDeleteModal(true);
                    }}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
          </Grid>
        </Paper>
      ))}
    </Stack>
  );

  const renderTableView = () => (
    <Table striped>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Object ID</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th>Flows</Table.Th>
          <Table.Th>Size</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Created</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {filteredObjects.map((obj) => (
          <Table.Tr key={obj.object_id}>
            <Table.Td>
              <Text size="sm" style={{ fontFamily: 'monospace' }}>
                {obj.object_id}
              </Text>
            </Table.Td>
            <Table.Td>
              <Group gap="xs">
                {getContentTypeIcon(obj.metadata?.content_type || '')}
                <Text size="sm">
                  {obj.metadata?.content_type?.split('/')[1] || 'Unknown'}
                </Text>
              </Group>
            </Table.Td>
            <Table.Td>
              <Text size="sm">{obj.flow_references.length} flows</Text>
            </Table.Td>
            <Table.Td>
              {obj.size && <Text size="sm">{formatFileSize(obj.size)}</Text>}
            </Table.Td>
            <Table.Td>
              <Badge color={getStatusColor(obj.status)} variant="light" size="sm">
                {obj.status}
              </Badge>
            </Table.Td>
            <Table.Td>
              {obj.created && <Text size="sm">{formatTimestamp(obj.created)}</Text>}
            </Table.Td>
            <Table.Td>
              <Group gap="xs">
                <ActionIcon
                  size="sm"
                  variant="light"
                  onClick={() => {
                    setSelectedObject(obj);
                    setShowDetailsModal(true);
                  }}
                >
                  <IconEye size={14} />
                </ActionIcon>
                <ActionIcon size="sm" variant="light">
                  <IconDownload size={14} />
                </ActionIcon>
                <ActionIcon
                  size="sm"
                  variant="light"
                  color="red"
                  onClick={() => {
                    setSelectedObject(obj);
                    setShowDeleteModal(true);
                  }}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );

  return (
    <Container size="xl" px="xl" py="xl">
      <Box mb="xl">
        <Group justify="space-between" align="flex-end">
          <Box>
            <Title order={2} mb="md">Objects Browser</Title>
            <Text size="lg" c="dimmed">
              Browse and manage media objects across all flows
            </Text>
          </Box>
          <Group gap="sm">
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={() => {
                setCurrentPage(1);
                setError(null);
                // Trigger a refresh by changing the dependency
                setCurrentPage(prev => prev);
              }}
              loading={loading}
              size="sm"
            >
              Refresh
            </Button>
            <Select
              value={viewMode}
              onChange={(value) => setViewMode(value as 'grid' | 'list' | 'table')}
              data={[
                { value: 'grid', label: 'Grid View' },
                { value: 'list', label: 'List View' },
                { value: 'table', label: 'Table View' }
              ]}
              size="sm"
            />
            <Button
              leftSection={<IconPlus size={16} />}
              size="sm"
              disabled={!!error}
            >
              Create Object
            </Button>
          </Group>
        </Group>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          color={error.includes('not available yet') ? 'yellow' : 'red'} 
          title={error.includes('not available yet') ? 'Backend Not Ready' : 'Error'}
          withCloseButton
          onClose={() => setError(null)}
          mb="md"
        >
          {error}
          {error.includes('not available yet') && (
            <Text size="sm" mt="xs">
              This page will work once the backend objects API is fully configured. 
              For now, you can use the Sources and Flows pages which are already working.
            </Text>
          )}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box ta="center" py="xl">
          <Loader size="lg" />
          <Text mt="md" c="dimmed">Loading objects...</Text>
        </Box>
      )}

      {/* Advanced Filters */}
      <AdvancedFilter
        filters={filterOptions}
        value={filters}
        onChange={updateFilters}
        presets={savedPresets}
        onPresetSave={(preset) => setSavedPresets([...savedPresets, preset])}
        onPresetDelete={(presetId) => setSavedPresets(savedPresets.filter(p => p.id !== presetId))}
      />

      {/* Show Deleted Items Toggle */}
      <Group justify="flex-end" mb="md">
        <Chip
          checked={showDeleted}
          onChange={(checked) => setShowDeleted(checked)}
          variant="outline"
          color="gray"
        >
          Show Deleted Items
        </Chip>
      </Group>

      {/* Statistics */}
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="lg" mb="lg">
        <Card withBorder p="md">
          <Group gap="xs">
            <IconStorage size={20} color="#228be6" />
            <Box>
              <Text size="xs" c="dimmed">Total Objects</Text>
              <Text fw={600}>
                {loading ? '...' : error ? 'N/A' : filteredObjects.length}
              </Text>
            </Box>
          </Group>
        </Card>
        <Card withBorder p="md">
          <Group gap="xs">
            <IconDatabase size={20} color="#40c057" />
            <Box>
              <Text size="xs" c="dimmed">Total Size</Text>
              <Text fw={600}>
                {loading ? '...' : error ? 'N/A' : formatFileSize(filteredObjects.reduce((total, obj) => total + (obj.size || 0), 0))}
              </Text>
            </Box>
          </Group>
        </Card>
        <Card withBorder p="md">
          <Group gap="xs">
            <IconNetwork size={20} color="#fd7e14" />
            <Box>
              <Text size="xs" c="dimmed">Active Objects</Text>
              <Text fw={600}>
                {loading ? '...' : error ? 'N/A' : filteredObjects.filter(obj => obj.status === 'active').length}
              </Text>
            </Box>
          </Group>
        </Card>
        <Card withBorder p="md">
          <Group gap="xs">
            <IconServer size={20} color="#7950f2" />
            <Box>
              <Text size="xs" c="dimmed">Unique Flows</Text>
              <Text fw={600}>
                {loading ? '...' : error ? 'N/A' : new Set(filteredObjects.flatMap(obj => obj.flow_references.map(f => f.flow_id))).size}
              </Text>
            </Box>
          </Group>
        </Card>
      </SimpleGrid>

      {/* Objects View */}
      <Card withBorder>
        <Box mb="lg">
          <Title order={4} mb="xs">
            {viewMode === 'grid' ? 'Grid View' : viewMode === 'list' ? 'List View' : 'Table View'}
          </Title>
          <Text size="sm" c="dimmed">
            {loading ? 'Loading...' : error ? 'API not available' : `${filteredObjects.length} objects found`}
          </Text>
        </Box>
        
        {loading ? (
          <Box ta="center" py="xl">
            <Loader />
          </Box>
        ) : error ? (
          <Box ta="center" py="xl" c="red">
            {error}
          </Box>
        ) : filteredObjects.length === 0 ? (
          <Box ta="center" py="xl">
            <Text c="dimmed">No objects found matching your filters</Text>
          </Box>
        ) : (
          <>
            {viewMode === 'grid' && renderGridView()}
            {viewMode === 'list' && renderListView()}
            {viewMode === 'table' && renderTableView()}
          </>
        )}
      </Card>

      {/* Object Details Modal */}
      {selectedObject && (
        <Modal
          opened={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Object Details"
          size="lg"
        >
          <Stack gap="md">
            <Tabs defaultValue="overview">
              <Tabs.List>
                <Tabs.Tab value="overview" leftSection={<IconInfoCircle size={16} />}>
                  Overview
                </Tabs.Tab>
                <Tabs.Tab value="flows" leftSection={<IconLink size={16} />}>
                  Flow References
                </Tabs.Tab>
                <Tabs.Tab value="access" leftSection={<IconExternalLink size={16} />}>
                  Access URLs
                </Tabs.Tab>
                <Tabs.Tab value="metadata" leftSection={<IconDatabase size={16} />}>
                  Metadata
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="overview" pt="md">
                <Stack gap="md">
                  <Group gap="md">
                    <Box>
                      <Text size="sm" fw={500}>Object ID</Text>
                      <Text size="sm" style={{ fontFamily: 'monospace' }}>
                        {selectedObject.object_id}
                      </Text>
                    </Box>
                    <Box>
                      <Text size="sm" fw={500}>Status</Text>
                      <Badge color={getStatusColor(selectedObject.status)} variant="light">
                        {selectedObject.status}
                      </Badge>
                    </Box>
                    <Box>
                      <Text size="sm" fw={500}>Content Type</Text>
                      <Group gap="xs">
                        {getContentTypeIcon(selectedObject.metadata?.content_type || '')}
                        <Text size="sm">{selectedObject.metadata?.content_type || 'Unknown'}</Text>
                      </Group>
                    </Box>
                  </Group>
                  
                  {selectedObject.description && (
                    <Box>
                      <Text size="sm" fw={500}>Description</Text>
                      <Text size="sm">{selectedObject.description}</Text>
                    </Box>
                  )}
                  
                  <Group gap="md">
                    {selectedObject.size && (
                      <Box>
                        <Text size="sm" fw={500}>Size</Text>
                        <Text size="sm">{formatFileSize(selectedObject.size)}</Text>
                      </Box>
                    )}
                    {selectedObject.created && (
                      <Box>
                        <Text size="sm" fw={500}>Created</Text>
                        <Text size="sm">{formatTimestamp(selectedObject.created)}</Text>
                      </Box>
                    )}
                    {selectedObject.storage_location && (
                      <Box>
                        <Text size="sm" fw={500}>Storage Location</Text>
                        <Text size="sm" style={{ fontFamily: 'monospace' }}>
                          {selectedObject.storage_location}
                        </Text>
                      </Box>
                    )}
                  </Group>
                  
                  {selectedObject.tags && (
                    <Box>
                      <Text size="sm" fw={500}>Tags</Text>
                      <Group gap="xs" wrap="wrap">
                        {Object.entries(selectedObject.tags).map(([key, value]) => (
                          <Badge key={key} color="gray" variant="outline">
                            {key}: {value}
                          </Badge>
                        ))}
                      </Group>
                    </Box>
                  )}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="flows" pt="md">
                <Stack gap="md">
                  <Text size="sm" fw={500}>Flow References ({selectedObject.flow_references.length})</Text>
                  <List>
                    {selectedObject.flow_references.map((flow, index) => (
                      <List.Item
                        key={index}
                        icon={
                          <ThemeIcon color="blue" size="sm">
                            {getFormatIcon(flow.flow_format)}
                          </ThemeIcon>
                        }
                      >
                        <Stack gap="xs">
                          <Text size="sm" fw={500}>{flow.flow_name}</Text>
                          <Text size="xs" c="dimmed">ID: {flow.flow_id}</Text>
                          <Text size="xs" c="dimmed">Format: {getFormatLabel(flow.flow_format)}</Text>
                          {flow.timerange && (
                            <Text size="xs" c="dimmed">
                              Time: {formatTimestamp(flow.timerange.start)} - {formatTimestamp(flow.timerange.end)}
                            </Text>
                          )}
                        </Stack>
                      </List.Item>
                    ))}
                  </List>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="access" pt="md">
                <Stack gap="md">
                  <Text size="sm" fw={500}>Access URLs ({selectedObject.access_urls?.length || 0})</Text>
                  {selectedObject.access_urls?.map((url, index) => (
                    <Card key={index} withBorder p="sm">
                      <Group justify="space-between">
                        <Box>
                          <Text size="sm" fw={500}>{url.label || `URL ${index + 1}`}</Text>
                          <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                            {url.url}
                          </Text>
                        </Box>
                        <Group gap="xs">
                          <Badge color="blue" variant="light" size="sm">
                            {url.type}
                          </Badge>
                          <ActionIcon size="sm" variant="light">
                            <IconCopy size={14} />
                          </ActionIcon>
                          <ActionIcon size="sm" variant="light">
                            <IconExternalLink size={14} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="metadata" pt="md">
                <Stack gap="md">
                  <Text size="sm" fw={500}>Object Metadata</Text>
                  {selectedObject.metadata && (
                    <Grid>
                      {Object.entries(selectedObject.metadata).map(([key, value]) => (
                        <Grid.Col key={key} span={6}>
                          <Box>
                            <Text size="sm" fw={500} style={{ textTransform: 'capitalize' }}>
                              {key.replace(/_/g, ' ')}
                            </Text>
                            <Text size="sm" style={{ fontFamily: 'monospace' }}>
                              {value}
                            </Text>
                          </Box>
                        </Grid.Col>
                      ))}
                    </Grid>
                  )}
                </Stack>
              </Tabs.Panel>
            </Tabs>
            
            <Group gap="xs" mt="md">
              <Button leftSection={<IconDownload size={16} />}>
                Download Object
              </Button>
              {selectedObject.access_urls?.some(url => url.type === 'stream') && (
                <Button variant="light" leftSection={<IconPlayerPlay size={16} />}>
                  Play Object
                </Button>
              )}
              <Button variant="light" leftSection={<IconShare size={16} />}>
                Share Object
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {selectedObject && (
        <Modal
          opened={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Object"
          size="md"
        >
          <Stack gap="md">
            <Alert icon={<IconInfoCircle size={16} />} color="red">
              Are you sure you want to delete this object? This action cannot be undone.
            </Alert>
            <Text size="sm">
              <strong>Object ID:</strong> {selectedObject.object_id}<br />
              <strong>Description:</strong> {selectedObject.description}<br />
              <strong>Size:</strong> {selectedObject.size ? formatFileSize(selectedObject.size) : 'Unknown'}<br />
              <strong>Flows:</strong> {selectedObject.flow_references.length} flows
            </Text>
            <Group gap="xs" justify="flex-end">
              <Button variant="light" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
                              <Button color="red" onClick={() => handleDeleteObject(selectedObject.object_id, { softDelete: true, cascade: false, deletedBy: 'admin' })}>
                  Delete Object
                </Button>
            </Group>
          </Stack>
        </Modal>
      )}
    </Container>
  );
} 