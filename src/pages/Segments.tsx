
import { useState, useMemo } from 'react';
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
  Timeline,
  ScrollArea,
  Grid,
  Paper,
  SimpleGrid
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
  IconInfoCircle
} from '@tabler/icons-react';
import AdvancedFilter, { FilterOption, FilterState, FilterPreset } from '../components/AdvancedFilter';
import { useFilterPersistence } from '../hooks/useFilterPersistence';

// Mock data structure based on backend API models
interface Segment {
  id: string;
  object_id: string;
  flow_id: string;
  flow_name: string;
  flow_format: string;
  timerange: {
    start: string;
    end: string;
  };
  ts_offset?: string;
  last_duration?: string;
  sample_offset?: number;
  sample_count?: number;
  key_frame_count?: number;
  get_urls?: Array<{
    url: string;
    label?: string;
  }>;
  tags?: Record<string, string>;
  description?: string;
  status: 'active' | 'processing' | 'error' | 'deleted';
  size?: number;
  created?: string;
  updated?: string;
}

// Mock data
const dummySegments: Segment[] = [
  // Real video segments from public/videos directory
  {
    id: 'seg_uhd_4096_2160',
    object_id: 'obj_uhd_4096_2160',
    flow_id: 'flow_test_videos',
    flow_name: 'Test Videos Collection',
    flow_format: 'urn:x-nmos:format:video',
    timerange: { start: '2025-01-25T10:00:00Z', end: '2025-01-25T10:00:15Z' },
    ts_offset: '00:00:00',
    last_duration: '00:00:15',
    key_frame_count: 360, // 24fps * 15s
    tags: { category: 'test', type: 'uhd', resolution: '4096x2160', fps: '24' },
    description: 'Ultra HD test video (4096x2160, 24fps)',
    status: 'active',
    size: 24117248, // 23MB
    created: '2025-01-25T10:00:00Z',
    get_urls: [
      { url: '/videos/2932301-uhd_4096_2160_24fps.mp4', label: 'Direct Download' }
    ]
  },
  {
    id: 'seg_uhd_3840_2160',
    object_id: 'obj_uhd_3840_2160',
    flow_id: 'flow_test_videos',
    flow_name: 'Test Videos Collection',
    flow_format: 'urn:x-nmos:format:video',
    timerange: { start: '2025-01-25T10:00:15Z', end: '2025-01-25T10:00:40Z' },
    ts_offset: '00:00:15',
    last_duration: '00:00:25',
    key_frame_count: 625, // 25fps * 25s
    tags: { category: 'test', type: 'uhd', resolution: '3840x2160', fps: '25' },
    description: 'Ultra HD test video (3840x2160, 25fps)',
    status: 'active',
    size: 52428800, // 50MB
    created: '2025-01-25T10:00:15Z',
    get_urls: [
      { url: '/videos/3125907-uhd_3840_2160_25fps.mp4', label: 'Direct Download' }
    ]
  },
  {
    id: 'seg_hd_1920_1080',
    object_id: 'obj_hd_1920_1080',
    flow_id: 'flow_test_videos',
    flow_name: 'Test Videos Collection',
    flow_format: 'urn:x-nmos:format:video',
    timerange: { start: '2025-01-25T10:00:40Z', end: '2025-01-25T10:01:10Z' },
    ts_offset: '00:00:40',
    last_duration: '00:00:30',
    key_frame_count: 900, // 30fps * 30s
    tags: { category: 'test', type: 'hd', resolution: '1920x1080', fps: '30' },
    description: 'HD test video (1920x1080, 30fps)',
    status: 'active',
    size: 31457280, // 30MB
    created: '2025-01-25T10:00:40Z',
    get_urls: [
      { url: '/videos/852038-hd_1920_1080_30fps.mp4', label: 'Direct Download' }
    ]
  },
  // Original dummy segments
  {
    id: '1',
    object_id: 'obj_001',
    flow_id: 'flow_001',
    flow_name: 'BBC News Studio',
    flow_format: 'urn:x-nmos:format:video',
    timerange: { start: '2024-01-15T10:00:00Z', end: '2024-01-15T10:01:00Z' },
    ts_offset: '00:00:00',
    last_duration: '00:01:00',
    key_frame_count: 30,
    tags: { category: 'news', type: 'intro', priority: 'high' },
    description: 'Opening segment with news introduction',
    status: 'active',
    size: 52428800, // 50MB
    created: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    object_id: 'obj_002',
    flow_id: 'flow_001',
    flow_name: 'BBC News Studio',
    flow_format: 'urn:x-nmos:format:video',
    timerange: { start: '2024-01-15T10:01:00Z', end: '2024-01-15T10:02:30Z' },
    ts_offset: '00:01:00',
    last_duration: '00:01:30',
    key_frame_count: 45,
    tags: { category: 'news', type: 'interview', priority: 'medium' },
    description: 'Guest interview segment',
    status: 'active',
    size: 78643200, // 75MB
    created: '2024-01-15T10:01:00Z'
  },
  {
    id: '3',
    object_id: 'obj_003',
    flow_id: 'flow_002',
    flow_name: 'Sports Arena Camera',
    flow_format: 'urn:x-nmos:format:video',
    timerange: { start: '2024-01-15T10:02:30Z', end: '2024-01-15T10:03:00Z' },
    ts_offset: '00:02:30',
    last_duration: '00:00:30',
    key_frame_count: 15,
    tags: { category: 'sports', type: 'update', priority: 'low' },
    description: 'Sports update segment',
    status: 'active',
    size: 26214400, // 25MB
    created: '2024-01-15T10:02:30Z'
  },
  {
    id: '4',
    object_id: 'obj_004',
    flow_id: 'flow_003',
    flow_name: 'Radio Studio A',
    flow_format: 'urn:x-nmos:format:audio',
    timerange: { start: '2024-01-15T10:03:00Z', end: '2024-01-15T10:04:00Z' },
    ts_offset: '00:03:00',
    last_duration: '00:01:00',
    sample_offset: 44100,
    sample_count: 44100,
    tags: { category: 'audio', type: 'music', priority: 'medium' },
    description: 'Background music segment',
    status: 'active',
    size: 10485760, // 10MB
    created: '2024-01-15T10:03:00Z'
  },
  {
    id: '5',
    object_id: 'obj_005',
    flow_id: 'flow_004',
    flow_name: 'Photo Studio Feed',
    flow_format: 'urn:x-tam:format:image',
    timerange: { start: '2024-01-15T10:04:00Z', end: '2024-01-15T10:04:30Z' },
    ts_offset: '00:04:00',
    last_duration: '00:00:30',
    tags: { category: 'image', type: 'photo', priority: 'low' },
    description: 'Photo gallery segment',
    status: 'processing',
    size: 5242880, // 5MB
    created: '2024-01-15T10:04:00Z'
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
    case 'error': return 'red';
    case 'deleted': return 'gray';
    default: return 'blue';
  }
};

const formatDuration = (duration: string) => {
  // Convert timestamp format to readable duration
  return duration.replace('PT', '').replace('S', 's').replace('M', 'm').replace('H', 'h');
};

const formatFileSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export default function Segments() {
  const [segments, setSegments] = useState<Segment[]>(dummySegments);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  
  // Advanced filtering
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useFilterPersistence('segments');
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);

  // Define filter options
  const filterOptions: FilterOption[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search segments by description...'
    },
    {
      key: 'flow',
      label: 'Flow',
      type: 'select',
      options: [
        { value: 'flow_test_videos', label: 'Test Videos Collection' },
        { value: 'flow_001', label: 'BBC News Studio' },
        { value: 'flow_002', label: 'Sports Arena Camera' },
        { value: 'flow_003', label: 'Radio Studio A' },
        { value: 'flow_004', label: 'Photo Studio Feed' }
      ]
    },
    {
      key: 'format',
      label: 'Format',
      type: 'select',
      options: [
        { value: 'urn:x-nmos:format:video', label: 'Video' },
        { value: 'urn:x-nmos:format:audio', label: 'Audio' },
        { value: 'urn:x-tam:format:image', label: 'Image' }
      ]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'processing', label: 'Processing' },
        { value: 'error', label: 'Error' },
        { value: 'deleted', label: 'Deleted' }
      ]
    },
    {
      key: 'timerange',
      label: 'Time Range',
      type: 'text',
      placeholder: 'Filter by time range (HH:MM:SS)'
    },
    {
      key: 'tags',
      label: 'Tags',
      type: 'text',
      placeholder: 'Filter by tag key:value'
    }
  ];

  const filteredSegments = segments.filter(segment => {
    // Search filter
    const searchTerm = filters.search?.toLowerCase();
    const matchesSearch = !searchTerm || 
      segment.description?.toLowerCase().includes(searchTerm) ||
      segment.flow_name?.toLowerCase().includes(searchTerm);

    // Flow filter
    const flowFilter = filters.flow;
    const matchesFlow = !flowFilter || segment.flow_id === flowFilter;

    // Format filter
    const formatFilter = filters.format;
    const matchesFormat = !formatFilter || segment.flow_format === formatFilter;

    // Status filter
    const statusFilter = filters.status;
    const matchesStatus = !statusFilter || segment.status === statusFilter;

    // Time range filter
    const timerangeFilter = filters.timerange;
    const matchesTimerange = !timerangeFilter || 
      segment.timerange.start.includes(timerangeFilter) ||
      segment.timerange.end.includes(timerangeFilter);

    // Tags filter
    const tagsFilter = filters.tags;
    const matchesTags = !tagsFilter || 
      (segment.tags && Object.entries(segment.tags).some(([key, value]) => 
        `${key}:${value}`.toLowerCase().includes(tagsFilter.toLowerCase())
      ));

    return matchesSearch && matchesFlow && matchesFormat && matchesStatus && matchesTimerange && matchesTags;
  });

  const handleDeleteSegment = (segmentId: string) => {
    setSegments(segments.filter(s => s.id !== segmentId));
    setShowDeleteModal(false);
    setSelectedSegment(null);
  };

  const handlePlaySegment = (segment: Segment) => {
    setSelectedSegment(segment);
    setShowVideoPlayer(true);
  };

  const timelineSegments = useMemo(() => {
    return filteredSegments.sort((a, b) => 
      new Date(a.timerange.start).getTime() - new Date(b.timerange.start).getTime()
    );
  }, [filteredSegments]);

  const renderTimelineView = () => (
    <Card withBorder>
      <Box mb="lg">
        <Title order={4} mb="xs">Timeline View</Title>
        <Text size="sm" c="dimmed">Chronological view of all segments</Text>
      </Box>
      
      <Timeline active={timelineSegments.length - 1} bulletSize={24} lineWidth={2}>
        {timelineSegments.map((segment, index) => (
          <Timeline.Item
            key={segment.id}
            bullet={getFormatIcon(segment.flow_format)}
            title={
              <Group gap="xs" align="center">
                <Text fw={600}>{segment.flow_name}</Text>
                <Badge color={getStatusColor(segment.status)} variant="light" size="sm">
                  {segment.status}
                </Badge>
              </Group>
            }
            lineVariant={index === timelineSegments.length - 1 ? 'dashed' : 'solid'}
          >
            <Card withBorder p="md" mt="xs">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconClock size={14} />
                    <Text size="sm">
                      {formatTimestamp(segment.timerange.start)} - {formatTimestamp(segment.timerange.end)}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <Badge color="blue" variant="light" size="sm">
                      {formatDuration(segment.last_duration || 'PT0S')}
                    </Badge>
                    {segment.size && (
                      <Badge color="gray" variant="light" size="sm">
                        {formatFileSize(segment.size)}
                      </Badge>
                    )}
                  </Group>
                </Group>
                
                <Text size="sm" c="dimmed">{segment.description}</Text>
                
                {segment.tags && (
                  <Group gap="xs" wrap="wrap">
                    {Object.entries(segment.tags).map(([key, value]) => (
                      <Badge key={key} color="gray" variant="outline" size="xs">
                        {key}: {value}
                      </Badge>
                    ))}
                  </Group>
                )}
                
                <Group gap="xs" mt="xs">
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconEye size={14} />}
                    onClick={() => {
                      setSelectedSegment(segment);
                      setShowDetailsModal(true);
                    }}
                  >
                    Details
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPlayerPlay size={14} />}
                    onClick={() => handlePlaySegment(segment)}
                  >
                    Play
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconDownload size={14} />}
                  >
                    Download
                  </Button>
                  <ActionIcon
                    size="sm"
                    variant="light"
                    color="red"
                    onClick={() => {
                      setSelectedSegment(segment);
                      setShowDeleteModal(true);
                    }}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Stack>
            </Card>
          </Timeline.Item>
        ))}
      </Timeline>
      
      {timelineSegments.length === 0 && (
        <Box ta="center" py="xl">
          <Text c="dimmed">No segments found matching your filters</Text>
        </Box>
      )}
    </Card>
  );

  const renderListView = () => (
    <Card withBorder>
      <Box mb="lg">
        <Title order={4} mb="xs">List View</Title>
        <Text size="sm" c="dimmed">Detailed table view of segments</Text>
      </Box>
      
      <ScrollArea>
        <Stack gap="md">
          {filteredSegments.map((segment) => (
            <Paper key={segment.id} withBorder p="md">
              <Grid>
                <Grid.Col span={3}>
                  <Stack gap="xs">
                    <Group gap="xs">
                      {getFormatIcon(segment.flow_format)}
                      <Text fw={600} size="sm">{segment.flow_name}</Text>
                    </Group>
                    <Text size="xs" c="dimmed">{segment.description}</Text>
                  </Stack>
                </Grid.Col>
                
                <Grid.Col span={2}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>Time Range</Text>
                    <Text size="xs">
                      {formatTimestamp(segment.timerange.start)} - {formatTimestamp(segment.timerange.end)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Duration: {formatDuration(segment.last_duration || 'PT0S')}
                    </Text>
                  </Stack>
                </Grid.Col>
                
                <Grid.Col span={2}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>Status & Size</Text>
                    <Badge color={getStatusColor(segment.status)} variant="light" size="sm">
                      {segment.status}
                    </Badge>
                    {segment.size && (
                      <Text size="xs" c="dimmed">{formatFileSize(segment.size)}</Text>
                    )}
                  </Stack>
                </Grid.Col>
                
                <Grid.Col span={3}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>Tags</Text>
                    <Group gap="xs" wrap="wrap">
                      {segment.tags && Object.entries(segment.tags).map(([key, value]) => (
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
                          setSelectedSegment(segment);
                          setShowDetailsModal(true);
                        }}
                      >
                        <IconEye size={14} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Play Segment">
                      <ActionIcon size="sm" variant="light" onClick={() => handlePlaySegment(segment)}>
                        <IconPlayerPlay size={14} />
                      </ActionIcon>
                    </Tooltip>
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
                          setSelectedSegment(segment);
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
      </ScrollArea>
      
      {filteredSegments.length === 0 && (
        <Box ta="center" py="xl">
          <Text c="dimmed">No segments found matching your filters</Text>
        </Box>
      )}
    </Card>
  );

  return (
    <Container size="xl" px="xl" py="xl">
      <Box mb="xl">
        <Group justify="space-between" align="flex-end">
          <Box>
            <Title order={2} mb="md">Segment Timeline</Title>
            <Text size="lg" c="dimmed">
              View and manage media segments across all flows
            </Text>
          </Box>
          <Group gap="sm">
            <Select
              value={viewMode}
              onChange={(value) => setViewMode(value as 'timeline' | 'list')}
              data={[
                { value: 'timeline', label: 'Timeline View' },
                { value: 'list', label: 'List View' }
              ]}
              size="sm"
            />
            <Button
              leftSection={<IconPlus size={16} />}
              size="sm"
            >
              Upload Segment
            </Button>
          </Group>
        </Group>
      </Box>

      {/* Advanced Filters */}
      <AdvancedFilter
        filters={filterOptions}
        value={filters}
        onChange={updateFilters}
        presets={savedPresets}
        onPresetSave={(preset) => setSavedPresets([...savedPresets, preset])}
        onPresetDelete={(presetId) => setSavedPresets(savedPresets.filter(p => p.id !== presetId))}
      />

      {/* Statistics */}
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="lg" mb="lg">
        <Card withBorder p="md">
          <Group gap="xs">
            <IconVideo size={20} color="#228be6" />
            <Box>
              <Text size="xs" c="dimmed">Total Segments</Text>
              <Text fw={600}>{filteredSegments.length}</Text>
            </Box>
          </Group>
        </Card>
        <Card withBorder p="md">
          <Group gap="xs">
            <IconClock size={20} color="#40c057" />
            <Box>
              <Text size="xs" c="dimmed">Total Duration</Text>
              <Text fw={600}>
                {filteredSegments.reduce((total, seg) => {
                  const duration = seg.last_duration || 'PT0S';
                  return total + (parseInt(duration.replace(/\D/g, '')) || 0);
                }, 0)}s
              </Text>
            </Box>
          </Group>
        </Card>
        <Card withBorder p="md">
          <Group gap="xs">
            <IconDatabase size={20} color="#fd7e14" />
            <Box>
              <Text size="xs" c="dimmed">Total Size</Text>
              <Text fw={600}>
                {formatFileSize(filteredSegments.reduce((total, seg) => total + (seg.size || 0), 0))}
              </Text>
            </Box>
          </Group>
        </Card>
        <Card withBorder p="md">
          <Group gap="xs">
            <IconInfoCircle size={20} color="#7950f2" />
            <Box>
              <Text size="xs" c="dimmed">Active Flows</Text>
              <Text fw={600}>
                {new Set(filteredSegments.map(s => s.flow_id)).size}
              </Text>
            </Box>
          </Group>
        </Card>
      </SimpleGrid>

      {/* Timeline/List View */}
      {viewMode === 'timeline' ? renderTimelineView() : renderListView()}

      {/* Segment Details Modal */}
      {selectedSegment && (
        <Modal
          opened={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Segment Details"
          size="lg"
        >
          <Stack gap="md">
            <Group gap="md">
              <Box>
                <Text size="sm" fw={500}>Flow</Text>
                <Text size="sm">{selectedSegment.flow_name}</Text>
              </Box>
              <Box>
                <Text size="sm" fw={500}>Format</Text>
                <Group gap="xs">
                  {getFormatIcon(selectedSegment.flow_format)}
                  <Text size="sm">{getFormatLabel(selectedSegment.flow_format)}</Text>
                </Group>
              </Box>
              <Box>
                <Text size="sm" fw={500}>Status</Text>
                <Badge color={getStatusColor(selectedSegment.status)} variant="light">
                  {selectedSegment.status}
                </Badge>
              </Box>
            </Group>
            
            <Divider />
            
            <Group gap="md">
              <Box>
                <Text size="sm" fw={500}>Start Time</Text>
                <Text size="sm">{formatTimestamp(selectedSegment.timerange.start)}</Text>
              </Box>
              <Box>
                <Text size="sm" fw={500}>End Time</Text>
                <Text size="sm">{formatTimestamp(selectedSegment.timerange.end)}</Text>
              </Box>
              <Box>
                <Text size="sm" fw={500}>Duration</Text>
                <Text size="sm">{formatDuration(selectedSegment.last_duration || 'PT0S')}</Text>
              </Box>
            </Group>
            
            {selectedSegment.size && (
              <Box>
                <Text size="sm" fw={500}>File Size</Text>
                <Text size="sm">{formatFileSize(selectedSegment.size)}</Text>
              </Box>
            )}
            
            {selectedSegment.description && (
              <Box>
                <Text size="sm" fw={500}>Description</Text>
                <Text size="sm">{selectedSegment.description}</Text>
              </Box>
            )}
            
            {selectedSegment.tags && (
              <Box>
                <Text size="sm" fw={500}>Tags</Text>
                <Group gap="xs" wrap="wrap">
                  {Object.entries(selectedSegment.tags).map(([key, value]) => (
                    <Badge key={key} color="gray" variant="outline">
                      {key}: {value}
                    </Badge>
                  ))}
                </Group>
              </Box>
            )}
            
            <Group gap="xs" mt="md">
              <Button 
                leftSection={<IconPlayerPlay size={16} />}
                onClick={() => handlePlaySegment(selectedSegment)}
                disabled={selectedSegment.flow_format !== 'urn:x-nmos:format:video'}
              >
                Play Segment
              </Button>
              <Button variant="light" leftSection={<IconDownload size={16} />}>
                Download
              </Button>
              <Button variant="light" leftSection={<IconEdit size={16} />}>
                Edit
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {selectedSegment && (
        <Modal
          opened={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Segment"
          size="md"
        >
          <Stack gap="md">
            <Alert icon={<IconInfoCircle size={16} />} color="red">
              Are you sure you want to delete this segment? This action cannot be undone.
            </Alert>
            <Text size="sm">
              <strong>Flow:</strong> {selectedSegment.flow_name}<br />
              <strong>Time Range:</strong> {formatTimestamp(selectedSegment.timerange.start)} - {formatTimestamp(selectedSegment.timerange.end)}<br />
              <strong>Description:</strong> {selectedSegment.description}
            </Text>
            <Group gap="xs" justify="flex-end">
              <Button variant="light" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button color="red" onClick={() => handleDeleteSegment(selectedSegment.id)}>
                Delete Segment
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}

      {/* Video Player Modal */}
      {selectedSegment && selectedSegment.flow_format === 'urn:x-nmos:format:video' && (
        <Modal
          opened={showVideoPlayer}
          onClose={() => setShowVideoPlayer(false)}
          title={`Video Player - ${selectedSegment.flow_name}`}
          size="xl"
          fullScreen
        >
          <Stack gap="md">
            <Group justify="space-between">
              <Box>
                <Title order={4}>{selectedSegment.description}</Title>
                <Text size="sm" c="dimmed">
                  {selectedSegment.flow_name} • {formatDuration(selectedSegment.last_duration || 'PT0S')} • {formatFileSize(selectedSegment.size || 0)}
                </Text>
              </Box>
              <Group>
                <Button
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={() => {
                    if (selectedSegment.get_urls && selectedSegment.get_urls[0]) {
                      const link = document.createElement('a');
                      link.href = selectedSegment.get_urls[0].url;
                      link.download = selectedSegment.id + '.mp4';
                      link.click();
                    }
                  }}
                >
                  Download
                </Button>
                <Button variant="light" onClick={() => setShowVideoPlayer(false)}>
                  Close
                </Button>
              </Group>
            </Group>

            <Box
              style={{
                width: '100%',
                height: '70vh',
                backgroundColor: '#000',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {selectedSegment.get_urls && selectedSegment.get_urls[0] ? (
                <video
                  controls
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                  src={selectedSegment.get_urls[0].url}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <Stack gap="md" align="center">
                  <IconVideo size={64} color="#666" />
                  <Text c="dimmed" size="lg" ta="center">
                    Video not available for playback
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    This segment doesn't have a playable video URL
                  </Text>
                </Stack>
              )}
            </Box>

            {/* Video Metadata */}
            <Card withBorder p="md">
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                <Box>
                  <Text size="sm" fw={500} c="dimmed">Resolution</Text>
                  <Text size="sm">
                    {selectedSegment.tags?.resolution || 'Unknown'}
                  </Text>
                </Box>
                <Box>
                  <Text size="sm" fw={500} c="dimmed">Frame Rate</Text>
                  <Text size="sm">
                    {selectedSegment.tags?.fps || 'Unknown'} fps
                  </Text>
                </Box>
                <Box>
                  <Text size="sm" fw={500} c="dimmed">Key Frames</Text>
                  <Text size="sm">
                    {selectedSegment.key_frame_count || 'Unknown'}
                  </Text>
                </Box>
                <Box>
                  <Text size="sm" fw={500} c="dimmed">Duration</Text>
                  <Text size="sm">
                    {formatDuration(selectedSegment.last_duration || 'PT0S')}
                  </Text>
                </Box>
              </SimpleGrid>
            </Card>
          </Stack>
        </Modal>
      )}
    </Container>
  );
} 