import React, { useState, useCallback } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  Group,
  Badge,
  Box,
  Divider,
  Alert,
  Button,
  Code,
  Tabs,
  SimpleGrid
} from '@mantine/core';
import { IconInfoCircle, IconClock, IconFilter, IconList, IconEdit, IconFolders, IconDatabase, IconActivity, IconVideo } from '@tabler/icons-react';
import TimerangePicker from '../components/TimerangePicker';
import BBCPagination from '../components/BBCPagination';
import BBCAdvancedFilter from '../components/BBCAdvancedFilter';
import TimelineNavigator from '../components/TimelineNavigator';
import TemporalFilter from '../components/TemporalFilter';
import BBCFieldEditor from '../components/BBCFieldEditor';
import { FlowCollectionManager } from '../components/FlowCollectionManager';
import { StorageAllocationManager } from '../components/StorageAllocationManager';
import { AsyncOperationMonitor } from '../components/AsyncOperationMonitor';
import { WebhookManagerMantine } from '../components/WebhookManagerMantine';
import { EventHistoryMantine } from '../components/EventHistoryMantine';
import { NotificationCenterMantine } from '../components/NotificationCenterMantine';
import VideoPlayerWithAnalytics from '../components/VideoPlayerWithAnalytics';
import MobileVideoPlayer from '../components/MobileVideoPlayer';
import VideoCompilationEngine from '../components/VideoCompilationEngine';

export default function BBCDemo() {
  const [timerange, setTimerange] = useState('0:0_1:30');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // Timeline navigation state
  const [currentTime, setCurrentTime] = useState(0);
  const [timelineDuration] = useState(3600); // 1 hour demo
  
  // Temporal filter state
  const [temporalFilters, setTemporalFilters] = useState({
    timerange: '',
    startTime: '',
    endTime: '',
    minDuration: undefined as number | undefined,
    maxDuration: undefined as number | undefined,
    sampleOffset: undefined as number | undefined,
    sampleCount: undefined as number | undefined,
    temporalPattern: 'any' as const,
    timeTags: {},
    customFilters: {}
  });

  // Field editor demo state
  const [demoSource, setDemoSource] = useState({
    id: 'demo-source-1',
    label: 'Demo Video Source',
    description: 'A sample video source for demonstration',
    format: 'urn:x-nmos:format:video',
    maxBitRate: 5000000,
    frameWidth: 1920,
    frameHeight: 1080,
    tags: ['demo', 'video', 'hd'],
    readOnly: false
  });

  const [demoFlow, setDemoFlow] = useState({
    id: 'demo-flow-1',
    label: 'Demo Video Flow',
    description: 'A sample video flow for demonstration',
    format: 'urn:x-nmos:format:video',
    maxBitRate: 8000000,
    frameWidth: 1920,
    frameHeight: 1080,
    sampleRate: 48000,
    channels: 2,
    tags: ['demo', 'video', 'hd', 'stereo'],
    readOnly: false
  });
  
  // BBC filter state
  const [bbcFilters, setBbcFilters] = useState({
    label: '',
    format: '',
    codec: '',
    tags: {},
    tagExists: {},
    timerange: '',
    frame_width: undefined as number | undefined,
    frame_height: undefined as number | undefined,
    sample_rate: undefined as number | undefined,
    bits_per_sample: undefined as number | undefined,
    channels: undefined as number | undefined,
    page: '',
    limit: 50
  });

  // Mock pagination metadata
  const mockPaginationMeta = {
    link: '<http://localhost:8000/flows?page=cursor_123&limit=50>; rel="next", <http://localhost:8000/flows?page=cursor_456&limit=50>; rel="prev"',
    limit: 50,
    nextKey: 'cursor_789',
    timerange: '0:0_3600:0',
    count: 50,
    reverseOrder: false
  };

  // Mock timeline segments for demo
  const mockTimelineSegments = [
    { id: '1', startTime: 0, endTime: 300, label: 'Intro', type: 'video' as const, tags: { quality: 'hd' } },
    { id: '2', startTime: 300, endTime: 900, label: 'Main Content', type: 'video' as const, tags: { quality: 'hd' } },
    { id: '3', startTime: 900, endTime: 1200, label: 'Audio Overlay', type: 'audio' as const, tags: { quality: 'high' } },
    { id: '4', startTime: 1200, endTime: 1800, label: 'Data Stream', type: 'data' as const, tags: { format: 'json' } },
    { id: '5', startTime: 1800, endTime: 2400, label: 'Image Sequence', type: 'image' as const, tags: { format: 'png' } },
    { id: '6', startTime: 2400, endTime: 3600, label: 'Conclusion', type: 'video' as const, tags: { quality: 'hd' } }
  ];

  const handleBbcFiltersChange = useCallback((newFilters: any) => {
    setBbcFilters(newFilters);
  }, []);

  const handleBbcFiltersReset = useCallback(() => {
    setBbcFilters({
      label: '',
      format: '',
      codec: '',
      tags: {},
      tagExists: {},
      timerange: '',
      frame_width: undefined,
      frame_height: undefined,
      sample_rate: undefined,
      bits_per_sample: undefined,
      channels: undefined,
      page: '',
      limit: 50
    });
  }, []);

  const handleBbcFiltersApply = useCallback(() => {
    console.log('Applying BBC filters:', bbcFilters);
  }, [bbcFilters]);

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Box>
          <Title order={1} mb="md">BBC TAMS v6.0 Compliance Demo</Title>
          <Text size="lg" c="dimmed">
            This page demonstrates the BBC TAMS API compliant components we've implemented, 
            showcasing how your frontend now aligns with the official BBC TAMS specification.
          </Text>
        </Box>

        {/* BBC TAMS Info */}
        <Alert icon={<IconInfoCircle size={16} />} title="BBC TAMS API v6.0" color="blue">
          <Text size="sm">
            The Time-addressable Media Store (TAMS) API is designed for storing segmented media flows 
            with timeline-based positioning. Our implementation follows the BBC specification exactly 
            while leveraging VAST TAMS extensions for production use.
          </Text>
        </Alert>

        <Tabs defaultValue="overview">
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<IconInfoCircle size={16} />}>
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="timerange" leftSection={<IconClock size={16} />}>
              Timerange Picker
            </Tabs.Tab>
            <Tabs.Tab value="timeline" leftSection={<IconClock size={16} />}>
              Timeline Navigator
            </Tabs.Tab>
            <Tabs.Tab value="temporal" leftSection={<IconFilter size={16} />}>
              Temporal Filter
            </Tabs.Tab>
            <Tabs.Tab value="api" leftSection={<IconInfoCircle size={16} />}>
              BBC TAMS API
            </Tabs.Tab>
            <Tabs.Tab value="fields" leftSection={<IconEdit size={16} />}>
              Field Editor
            </Tabs.Tab>
            <Tabs.Tab value="collections" leftSection={<IconFolders size={16} />}>
              Flow Collections
            </Tabs.Tab>
            <Tabs.Tab value="storage" leftSection={<IconDatabase size={16} />}>
              Storage Management
            </Tabs.Tab>
            <Tabs.Tab value="async" leftSection={<IconClock size={16} />}>
              Async Operations
            </Tabs.Tab>
            <Tabs.Tab value="pagination" leftSection={<IconList size={16} />}>
              BBC Pagination
            </Tabs.Tab>
            <Tabs.Tab value="filters" leftSection={<IconFilter size={16} />}>
              Advanced Filters
            </Tabs.Tab>
            <Tabs.Tab value="webhooks" leftSection={<IconInfoCircle size={16} />}>
              Webhook Management
            </Tabs.Tab>
            <Tabs.Tab value="events" leftSection={<IconClock size={16} />}>
              Event History
            </Tabs.Tab>
            <Tabs.Tab value="notifications" leftSection={<IconInfoCircle size={16} />}>
              Notifications
            </Tabs.Tab>
            <Tabs.Tab value="video" leftSection={<IconVideo size={16} />}>
              Video Playback
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <Card withBorder>
              <Stack gap="lg">
                <Box>
                  <Title order={3} mb="sm">BBC TAMS Implementation Overview</Title>
                  <Text size="sm" c="dimmed" mb="md">
                    Here's what we've implemented to align with the BBC TAMS API specification
                  </Text>
                </Box>

                <Stack gap="md">
                  <Box>
                    <Text fw={500} mb="xs">✅ Implemented Components:</Text>
                    <Group gap="xs" wrap="wrap">
                      <Badge color="green" variant="light">TimerangePicker</Badge>
                      <Badge color="green" variant="light">BBCPagination</Badge>
                      <Badge color="green" variant="light">BBCAdvancedFilter</Badge>
                      <Badge color="green" variant="light">BBCFieldEditor</Badge>
                      <Badge color="green" variant="light">FlowCollectionManager</Badge>
                      <Badge color="green" variant="light">StorageAllocationManager</Badge>
                      <Badge color="green" variant="light">AsyncOperationMonitor</Badge>
                      <Badge color="green" variant="light">WebhookManager</Badge>
                      <Badge color="green" variant="light">EventHistory</Badge>
                      <Badge color="green" variant="light">NotificationCenter</Badge>
                    </Group>
                  </Box>

                  <Box>
                    <Text fw={500} mb="xs">🎯 BBC TAMS Features:</Text>
                    <Group gap="xs" wrap="wrap">
                      <Badge color="blue" variant="light">Timerange Format</Badge>
                      <Badge color="blue" variant="light">Cursor Pagination</Badge>
                      <Badge color="blue" variant="light">Tag Filters</Badge>
                      <Badge color="blue" variant="light">Format-Specific Filters</Badge>
                      <Badge color="blue" variant="light">Link Headers</Badge>
                      <Badge color="blue" variant="light">Paging Metadata</Badge>
                      <Badge color="blue" variant="light">Field-Level Operations</Badge>
                      <Badge color="blue" variant="light">Multi-Essence Collections</Badge>
                      <Badge color="blue" variant="light">Webhook Events</Badge>
                      <Badge color="blue" variant="light">Event History</Badge>
                      <Badge color="blue" variant="light">Real-time Notifications</Badge>
                    </Group>
                  </Box>

                  <Box>
                    <Text fw={500} mb="xs">🔧 Next Steps:</Text>
                    <Group gap="xs" wrap="wrap">
                      <Badge color="orange" variant="light">Integrate with API</Badge>
                      <Badge color="orange" variant="light">Add to Existing Pages</Badge>
                      <Badge color="green" variant="light">Event System ✅</Badge>
                      <Badge color="green" variant="light">Multi-Essence Support ✅</Badge>
                      <Badge color="green" variant="light">Webhook Management ✅</Badge>
                      <Badge color="green" variant="light">Real-time Notifications ✅</Badge>
                    </Group>
                  </Box>
                </Stack>

                <Divider />

                <Box>
                  <Text fw={500} mb="xs">📚 BBC TAMS API Compliance:</Text>
                  <Text size="sm" c="dimmed">
                    Our components now generate exactly the same query parameters and handle the same 
                    response formats as specified in the BBC TAMS API v6.0 specification. This means 
                    your frontend can work with any BBC TAMS compliant backend, not just VAST TAMS.
                  </Text>
                </Box>

                <Box>
                  <Text fw={500} mb="xs">🚀 VAST TAMS Extensions:</Text>
                  <Text size="sm" c="dimmed">
                    While maintaining BBC compliance, we leverage VAST TAMS extensions for enhanced 
                    analytics, soft delete, health monitoring, and performance optimizations.
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Text fw={500} mb="xs">🎉 Phase 3 Complete: BBC TAMS Event System</Text>
                  <Text size="sm" c="dimmed" mb="xs">
                    We've successfully implemented the complete BBC TAMS Event System including:
                  </Text>
                  <Group gap="xs" wrap="wrap" mt="xs">
                    <Badge color="green" variant="light">Webhook Management</Badge>
                    <Badge color="green" variant="light">Event History Tracking</Badge>
                    <Badge color="green" variant="light">Real-time Notifications</Badge>
                    <Badge color="green" variant="light">BBC TAMS v6.0 Compliance</Badge>
                  </Group>
                  <Text size="sm" c="dimmed" mt="xs">
                    All components are now available in the tabs above and ready for backend integration 
                    with BBC TAMS webhook endpoints and event streaming services.
                  </Text>
                </Box>
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="timerange" pt="md">
            <Card withBorder>
              <Stack gap="lg">
                <Box>
                  <Title order={3} mb="sm">Timerange Picker Component</Title>
                  <Text size="sm" c="dimmed" mb="md">
                    BBC TAMS uses a specific timerange format: [seconds]:[subseconds]_[end_seconds]:[end_subseconds]
                  </Text>
                </Box>

                <TimerangePicker
                  value={timerange}
                  onChange={setTimerange}
                  label="Demo Timerange"
                  showPresets={true}
                  allowInfinite={true}
                />

                <Box>
                  <Text size="sm" fw={500} mb="xs">Current Timerange Value:</Text>
                  <Code block>{timerange}</Code>
                </Box>

                <Alert icon={<IconInfoCircle size={16} />} title="BBC TAMS Compliance" color="green">
                  <Text size="sm">
                    This component generates BBC TAMS v6.0 compliant timerange strings that can be used 
                    directly in API calls like <Code>/flows?timerange={timerange}</Code>
                  </Text>
                </Alert>
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="timeline" pt="md">
            <Card withBorder>
              <Stack gap="lg">
                <Box>
                  <Title order={3} mb="sm">Timeline Navigator Component</Title>
                  <Text size="sm" c="dimmed" mb="md">
                    Visual timeline navigation for BBC TAMS flows with segment visualization and time-based positioning
                  </Text>
                </Box>

                <TimelineNavigator
                  duration={timelineDuration}
                  currentTime={currentTime}
                  segments={mockTimelineSegments}
                  onTimeChange={setCurrentTime}
                  onSegmentSelect={(segmentId) => console.log('Selected segment:', segmentId)}
                  height={300}
                  showSegments={true}
                  showControls={true}
                  showZoom={true}
                  showTimeDisplay={true}
                />

                <Box>
                  <Text size="sm" fw={500} mb="xs">Current Time:</Text>
                  <Code block>{currentTime.toFixed(1)}s</Code>
                </Box>

                <Alert icon={<IconInfoCircle size={16} />} title="BBC TAMS Compliance" color="green">
                  <Text size="sm">
                    This component provides BBC TAMS v6.0 compliant timeline navigation with segment visualization, 
                    time-based positioning, and sample-level control as specified in the BBC TAMS API.
                  </Text>
                </Alert>
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="temporal" pt="md">
            <Card withBorder>
              <Stack gap="lg">
                <Box>
                  <Title order={3} mb="sm">Temporal Filter Component</Title>
                  <Text size="sm" c="dimmed" mb="md">
                    Advanced time-based filtering for BBC TAMS flows with sample-level control and temporal patterns
                  </Text>
                </Box>

                <TemporalFilter
                  filters={temporalFilters}
                  onFiltersChange={setTemporalFilters}
                  onReset={() => setTemporalFilters({
                    timerange: '',
                    startTime: '',
                    endTime: '',
                    minDuration: undefined,
                    maxDuration: undefined,
                    sampleOffset: undefined,
                    sampleCount: undefined,
                    temporalPattern: 'any',
                    timeTags: {},
                    customFilters: {}
                  })}
                  onApply={() => console.log('Applying temporal filters:', temporalFilters)}
                  showAdvanced={true}
                  showSampleControls={true}
                  showPatternMatching={true}
                  showTimeTags={true}
                  showCustomFilters={true}
                />

                <Box>
                  <Text size="sm" fw={500} mb="xs">Current Filter State:</Text>
                  <Code block>{JSON.stringify(temporalFilters, null, 2)}</Code>
                </Box>

                <Alert icon={<IconInfoCircle size={16} />} title="BBC TAMS Compliance" color="green">
                  <Text size="sm">
                    This component provides BBC TAMS v6.0 compliant temporal filtering with sample-level control, 
                    temporal patterns, and time-based queries as specified in the BBC TAMS API.
                  </Text>
                </Alert>
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="api" pt="md">
            <Card withBorder>
              <Stack gap="lg">
                <Box>
                  <Title order={3} mb="sm">BBC TAMS API Service</Title>
                  <Text size="sm" c="dimmed" mb="md">
                    BBC TAMS v6.0 compliant API client with cursor-based pagination, Link header parsing, and metadata handling
                  </Text>
                </Box>

                <Alert icon={<IconInfoCircle size={16} />} title="API Features" color="blue">
                  <Text size="sm">
                    <strong>Cursor-Based Pagination:</strong> Full support for BBC TAMS pagination with cursor tokens<br />
                    <strong>Link Header Parsing:</strong> RFC 5988 compliant Link header parsing for navigation<br />
                    <strong>Metadata Extraction:</strong> Parse X-Paging-* headers and response metadata<br />
                    <strong>Query Building:</strong> Generate BBC-compliant query strings with filters<br />
                    <strong>HEAD Support:</strong> Metadata retrieval without full response bodies
                  </Text>
                </Alert>

                <Box>
                  <Text size="sm" fw={500} mb="xs">Example API Usage:</Text>
                  <Code block>
{`// Get flows with BBC TAMS pagination
const response = await getFlows({
  page: 'cursor_123',
  limit: 50,
  timerange: '0:0_3600:0',
  format: 'urn:x-nmos:format:video',
  tags: { quality: 'hd' }
});

// Extract pagination info
const nextPage = getNextPageCursor(response);
const totalCount = getTotalCount(response);
const currentLimit = getCurrentLimit(response);

// Parse Link headers
const nextLink = response.links.find(link => link.rel === 'next');
const prevLink = response.links.find(link => link.rel === 'prev');`}
                  </Code>
                </Box>

                <Box>
                  <Text size="sm" fw={500} mb="xs">Available Functions:</Text>
                  <Group gap="xs">
                    <Badge variant="light" color="blue">getFlows()</Badge>
                    <Badge variant="light" color="blue">getSources()</Badge>
                    <Badge variant="light" color="blue">getObjects()</Badge>
                    <Badge variant="light" color="blue">getFlowSegments()</Badge>
                    <Badge variant="light" color="blue">getService()</Badge>
                    <Badge variant="light" color="blue">createDeletionRequest()</Badge>
                  </Group>
                </Box>

                <Box>
                  <Text size="sm" fw={500} mb="xs">Utility Functions:</Text>
                  <Group gap="xs">
                    <Badge variant="light" color="green">getNextPageCursor()</Badge>
                    <Badge variant="light" color="green">getTotalCount()</Badge>
                    <Badge variant="light" color="green">hasNextPage()</Badge>
                    <Badge variant="light" color="green">parseLinkHeader()</Badge>
                    <Badge variant="light" color="green">buildBBCQueryString()</Badge>
                  </Group>
                </Box>

                <Alert icon={<IconInfoCircle size={16} />} title="BBC TAMS Compliance" color="green">
                  <Text size="sm">
                    This API service implements the complete BBC TAMS v6.0 specification for cursor-based pagination, 
                    Link headers, and metadata handling. It provides a clean interface for building BBC-compliant 
                    applications while maintaining compatibility with existing VAST TAMS extensions.
                  </Text>
                </Alert>
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="fields" pt="md">
            <Card withBorder p="xl">
              <Stack gap="lg">
                <Box>
                  <Title order={3} mb="sm">BBC TAMS Field-Level Operations</Title>
                  <Text size="sm" c="dimmed">
                    Individual field editing and validation for BBC TAMS compliance
                  </Text>
                </Box>

                <Tabs defaultValue="source">
                  <Tabs.List>
                    <Tabs.Tab value="source">Source Fields</Tabs.Tab>
                    <Tabs.Tab value="flow">Flow Fields</Tabs.Tab>
                  </Tabs.List>

                  <Tabs.Panel value="source" pt="md">
                    <BBCFieldEditor
                      entityId={demoSource.id}
                      entityType="source"
                      currentData={demoSource}
                      fields={[
                        {
                          key: 'label',
                          label: 'Label',
                          type: 'text',
                          required: true,
                          placeholder: 'Enter source label',
                          description: 'Human-readable name for the source'
                        },
                        {
                          key: 'description',
                          label: 'Description',
                          type: 'textarea',
                          placeholder: 'Enter source description',
                          description: 'Detailed description of the source'
                        },
                        {
                          key: 'format',
                          label: 'Format',
                          type: 'select',
                          required: true,
                          options: [
                            { value: 'urn:x-nmos:format:video', label: 'Video' },
                            { value: 'urn:x-nmos:format:audio', label: 'Audio' },
                            { value: 'urn:x-nmos:format:data', label: 'Data' },
                            { value: 'urn:x-nmos:format:multi', label: 'Multi' }
                          ],
                          description: 'Content format specification'
                        },
                        {
                          key: 'maxBitRate',
                          label: 'Max Bit Rate (bps)',
                          type: 'number',
                          placeholder: '5000000',
                          description: 'Maximum bit rate in bits per second'
                        },
                        {
                          key: 'frameWidth',
                          label: 'Frame Width',
                          type: 'number',
                          placeholder: '1920',
                          description: 'Video frame width in pixels'
                        },
                        {
                          key: 'frameHeight',
                          label: 'Frame Height',
                          type: 'number',
                          placeholder: '1080',
                          description: 'Video frame height in pixels'
                        },
                        {
                          key: 'tags',
                          label: 'Tags',
                          type: 'tags',
                          description: 'Custom tags for categorization'
                        },
                        {
                          key: 'readOnly',
                          label: 'Read Only',
                          type: 'boolean',
                          description: 'Whether the source is read-only'
                        }
                      ]}
                      onFieldUpdate={async (fieldKey, value) => {
                        // Simulate API call
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // Update local state
                        setDemoSource(prev => ({ ...prev, [fieldKey]: value }));
                        return true; // Success
                      }}
                      onFieldDelete={async (fieldKey) => {
                        // Simulate API call
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // Update local state
                        setDemoSource(prev => {
                          const newState = { ...prev };
                          delete newState[fieldKey];
                          return newState;
                        });
                        return true; // Success
                      }}
                      onSave={async (allData) => {
                        // Simulate API call
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        // Update local state
                        setDemoSource(allData);
                        return true; // Success
                      }}
                      showOptimisticUpdates={true}
                      showValidation={true}
                      showFieldHistory={true}
                    />
                  </Tabs.Panel>

                  <Tabs.Panel value="flow" pt="md">
                    <BBCFieldEditor
                      entityId={demoFlow.id}
                      entityType="flow"
                      currentData={demoFlow}
                      fields={[
                        {
                          key: 'label',
                          label: 'Label',
                          type: 'text',
                          required: true,
                          placeholder: 'Enter flow label',
                          description: 'Human-readable name for the flow'
                        },
                        {
                          key: 'description',
                          label: 'Description',
                          type: 'textarea',
                          placeholder: 'Enter flow description',
                          description: 'Detailed description of the flow'
                        },
                        {
                          key: 'format',
                          label: 'Format',
                          type: 'select',
                          required: true,
                          options: [
                            { value: 'urn:x-nmos:format:video', label: 'Video' },
                            { value: 'urn:x-nmos:format:audio', label: 'Audio' },
                            { value: 'urn:x-nmos:format:data', label: 'Data' },
                            { value: 'urn:x-nmos:format:multi', label: 'Multi' }
                          ],
                          description: 'Content format specification'
                        },
                        {
                          key: 'maxBitRate',
                          label: 'Max Bit Rate (bps)',
                          type: 'number',
                          placeholder: '8000000',
                          description: 'Maximum bit rate in bits per second'
                        },
                        {
                          key: 'frameWidth',
                          label: 'Frame Width',
                          type: 'number',
                          placeholder: '1920',
                          description: 'Video frame width in pixels'
                        },
                        {
                          key: 'frameHeight',
                          label: 'Frame Height',
                          type: 'number',
                          placeholder: '1080',
                          description: 'Video frame height in pixels'
                        },
                        {
                          key: 'sampleRate',
                          label: 'Sample Rate (Hz)',
                          type: 'number',
                          placeholder: '48000',
                          description: 'Audio sample rate in Hertz'
                        },
                        {
                          key: 'channels',
                          label: 'Channels',
                          type: 'number',
                          placeholder: '2',
                          description: 'Number of audio channels'
                        },
                        {
                          key: 'tags',
                          label: 'Tags',
                          type: 'tags',
                          description: 'Custom tags for categorization'
                        },
                        {
                          key: 'readOnly',
                          label: 'Read Only',
                          type: 'boolean',
                          description: 'Whether the flow is read-only'
                        }
                      ]}
                      onFieldUpdate={async (fieldKey, value) => {
                        // Simulate API call
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // Update local state
                        setDemoFlow(prev => ({ ...prev, [fieldKey]: value }));
                        return true; // Success
                      }}
                      onFieldDelete={async (fieldKey) => {
                        // Simulate API call
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // Update local state
                        setDemoFlow(prev => {
                          const newState = { ...prev };
                          delete newState[fieldKey];
                          return newState;
                        });
                        return true; // Success
                      }}
                      onSave={async (allData) => {
                        // Simulate API call
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        // Update local state
                        setDemoFlow(allData);
                        return true; // Success
                      }}
                      showOptimisticUpdates={true}
                      showValidation={true}
                      showFieldHistory={true}
                    />
                  </Tabs.Panel>
                </Tabs>
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="collections" pt="md">
            <Card withBorder p="xl">
              <Stack gap="lg">
                <Box>
                  <Title order={3} mb="sm">BBC TAMS Flow Collections</Title>
                  <Text size="sm" c="dimmed">
                    Multi-essence flow management with role assignment and container mapping
                  </Text>
                </Box>

                <FlowCollectionManager />
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="storage" pt="md">
            <Card withBorder p="xl">
              <Stack gap="lg">
                <Box>
                  <Title order={3} mb="sm">BBC TAMS Storage Management</Title>
                  <Text size="sm" c="dimmed">
                    Pre-upload storage allocation and bucket management
                  </Text>
                </Box>

                <StorageAllocationManager />
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="async" pt="md">
            <Card withBorder p="xl">
              <Stack gap="lg">
                <Box>
                  <Title order={3} mb="sm">BBC TAMS Async Operation Monitor</Title>
                  <Text size="sm" c="dimmed">
                    Monitor long-running operations with real-time status tracking
                  </Text>
                </Box>

                <AsyncOperationMonitor
                  operationType="all"
                  onCancel={async (operationId) => {
                    console.log('Cancelling operation:', operationId);
                    return true;
                  }}
                  onRetry={async (operationId) => {
                    console.log('Retrying operation:', operationId);
                    return true;
                  }}
                  onViewDetails={(operation) => {
                    console.log('Viewing operation details:', operation);
                  }}
                  autoRefresh={true}
                  refreshInterval={5000}
                />
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="pagination" pt="md">
            <Card withBorder>
              <Stack gap="lg">
                <Box>
                  <Title order={3} mb="sm">BBC TAMS Pagination</Title>
                  <Text size="sm" c="dimmed" mb="md">
                    BBC TAMS uses cursor-based pagination with Link headers for navigation.
                  </Text>
                </Box>

                <BBCPagination
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={mockPaginationMeta.count}
                  paginationMeta={mockPaginationMeta}
                  onPageChange={setCurrentPage}
                  onLimitChange={setItemsPerPage}
                  onNextPage={(nextKey) => {
                    console.log('Next page with key:', nextKey);
                    setCurrentPage(prev => prev + 1);
                  }}
                  onPreviousPage={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  onFirstPage={() => setCurrentPage(1)}
                  onLastPage={() => setCurrentPage(10)}
                  showBBCMetadata={true}
                  showPageNumbers={true}
                  showLimitSelector={true}
                  showNavigationButtons={true}
                />

                <Box>
                  <Text size="sm" fw={500} mb="xs">Current Pagination State:</Text>
                  <Code block>{JSON.stringify(mockPaginationMeta, null, 2)}</Code>
                </Box>

                <Alert icon={<IconInfoCircle size={16} />} title="BBC TAMS Compliance" color="green">
                  <Text size="sm">
                    This component generates BBC TAMS v6.0 compliant pagination Link headers and handles 
                    cursor-based pagination with the BBC TAMS API.
                  </Text>
                </Alert>
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="filters" pt="md">
            <Card withBorder>
              <Stack gap="lg">
                <Box>
                  <Title order={3} mb="sm">BBC TAMS Advanced Filtering</Title>
                  <Text size="sm" c="dimmed">
                    Complex filtering with tag patterns and format-specific filters
                  </Text>
                </Box>

                <BBCAdvancedFilter
                  filters={bbcFilters}
                  onFiltersChange={setBbcFilters}
                />
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="webhooks" pt="md">
            <Stack gap="lg">
              <Card withBorder p="xl">
                <Stack gap="lg">
                  <Box>
                    <Title order={3} mb="sm">BBC TAMS Event System</Title>
                    <Text size="sm" c="dimmed">
                      Real-time webhook management and event notifications
                    </Text>
                  </Box>

                  <Tabs defaultValue="webhooks">
                    <Tabs.List>
                      <Tabs.Tab value="webhooks">Webhook Management</Tabs.Tab>
                      <Tabs.Tab value="events">Event History</Tabs.Tab>
                      <Tabs.Tab value="notifications">Notifications</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="webhooks" pt="md">
                      <WebhookManagerMantine
                        onWebhookUpdate={(webhook) => console.log('Webhook updated:', webhook)}
                        onWebhookDelete={(webhookId) => console.log('Webhook deleted:', webhookId)}
                      />
                    </Tabs.Panel>

                    <Tabs.Panel value="events" pt="md">
                      <EventHistoryMantine
                        onEventSelect={(event) => console.log('Event selected:', event)}
                        refreshInterval={30}
                      />
                    </Tabs.Panel>

                    <Tabs.Panel value="notifications" pt="md">
                      <NotificationCenterMantine
                        onNotificationAction={(notification, action) => console.log('Notification action:', { notification, action })}
                        refreshInterval={10}
                      />
                    </Tabs.Panel>
                  </Tabs>
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="events" pt="md">
            <Card withBorder p="xl">
              <Stack gap="lg">
                <Box>
                  <Title order={3} mb="sm">BBC TAMS Event History</Title>
                  <Text size="sm" c="dimmed">
                    Track and analyze webhook event delivery and status
                  </Text>
                </Box>
                
                <Alert icon={<IconInfoCircle size={16} />} title="Event Tracking & Analytics" color="green">
                  <Text size="sm">
                    Monitor webhook delivery status, filter events by type and status, and export event 
                    data for analysis. Real-time updates with configurable refresh intervals ensure 
                    you always have the latest event information.
                  </Text>
                </Alert>

                <EventHistoryMantine
                  onEventSelect={(event) => console.log('Event selected:', event)}
                  refreshInterval={30}
                />
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="notifications" pt="md">
            <Card withBorder p="xl">
              <Stack gap="lg">
                <Box>
                  <Title order={3} mb="sm">BBC TAMS Notification Center</Title>
                  <Text size="sm" c="dimmed">
                    Real-time notifications for BBC TAMS events with actionable alerts
                  </Text>
                </Box>
                
                <Alert icon={<IconInfoCircle size={16} />} title="Real-time Notifications" color="orange">
                  <Text size="sm">
                    The notification center provides real-time alerts for BBC TAMS events with sound 
                    notifications, desktop alerts, and actionable buttons. Access it via the floating 
                    notification bell in the bottom-right corner.
                  </Text>
                </Alert>

                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Text size="lg" c="dimmed">
                    The notification center is available as a floating action button in the bottom-right corner.
                  </Text>
                  <Text size="sm" c="dimmed" mt="xs">
                    Click the notification bell icon to open the notification drawer and manage your real-time alerts.
                  </Text>
                </Box>
                
                {/* Notification Center Component (rendered globally) */}
                <NotificationCenterMantine
                  onNotificationAction={(notification, action) => console.log('Notification action:', { notification, action })}
                  refreshInterval={10}
                />
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="video" pt="md">
            <Stack gap="lg">
              <Card withBorder p="xl">
                <Stack gap="lg">
                  <Box>
                    <Title order={3} mb="sm">Video Playback with CMCD Analytics</Title>
                    <Text size="sm" c="dimmed">
                      BBC TAMS compliant video components with Common Media Client Data collection
                    </Text>
                  </Box>

                  <Tabs defaultValue="player">
                    <Tabs.List>
                      <Tabs.Tab value="player">Video Player</Tabs.Tab>
                      <Tabs.Tab value="mobile">Mobile Player</Tabs.Tab>
                      <Tabs.Tab value="compilation">Compilation Engine</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="player" pt="md">
                      <Card withBorder p="md">
                        <Stack gap="md">
                          <Title order={4}>Enhanced Video Player with CMCD</Title>
                          <Text size="sm" c="dimmed">
                            This video player includes comprehensive CMCD data collection for BBC TAMS compliance
                          </Text>
                          
                          <VideoPlayerWithAnalytics
                            src="/videos/852038-hd_1920_1080_30fps.mp4"
                            videoId="demo-video-1"
                            compilationId="demo-comp-1"
                            title="BBC TAMS Demo Video"
                            description="HD video with CMCD analytics and BBC TAMS compliance"
                            videoDuration="2:15"
                            showAnalytics={true}
                          />
                        </Stack>
                      </Card>
                    </Tabs.Panel>

                    <Tabs.Panel value="mobile" pt="md">
                      <Card withBorder p="md">
                        <Stack gap="md">
                          <Title order={4}>Mobile Video Player with CMCD</Title>
                          <Text size="sm" c="dimmed">
                            Mobile-optimized video player with CMCD data collection
                          </Text>
                          
                          <MobileVideoPlayer
                            videoUrl="/videos/852038-hd_1920_1080_30fps.mp4"
                            videoId="demo-mobile-video-1"
                            title="Mobile Demo Video"
                          />
                        </Stack>
                      </Card>
                    </Tabs.Panel>

                    <Tabs.Panel value="compilation" pt="md">
                      <Card withBorder p="md">
                        <Stack gap="md">
                          <Title order={4}>Video Compilation Engine</Title>
                          <Text size="sm" c="dimmed">
                            Multi-segment video compilation with CMCD analytics
                          </Text>
                          
                          <VideoCompilationEngine
                            segments={[
                              {
                                id: 'seg_001',
                                object_id: 'obj_hd_1920_1080',
                                flow_id: 'flow_demo_videos',
                                timerange: {
                                  start: '2025-01-25T10:00:00Z',
                                  end: '2025-01-25T10:02:15Z'
                                },
                                url: '/videos/852038-hd_1920_1080_30fps.mp4',
                                format: 'video',
                                codec: 'h264',
                                size: 23068672
                              }
                            ]}
                          />
                        </Stack>
                      </Card>
                    </Tabs.Panel>
                  </Tabs>

                  <Alert
                    icon={<IconInfoCircle size={16} />}
                    title="CMCD & BBC TAMS Compliance"
                    color="blue"
                  >
                    <Text size="sm">
                      All video components now include comprehensive CMCD (Common Media Client Data) collection 
                      for BBC TAMS compliance. This enables:
                    </Text>
                    <Text size="sm" mt="xs">
                      • <strong>Performance Optimization</strong> - Real-time playback metrics and buffering analysis<br/>
                      • <strong>Device Analytics</strong> - Device type, screen size, and network condition tracking<br/>
                      • <strong>Quality Monitoring</strong> - Bitrate, resolution, and frame rate analysis<br/>
                      • <strong>BBC TAMS Compliance</strong> - Full adherence to BBC TAMS v6.0 specification<br/>
                      • <strong>Enhanced Analytics</strong> - Detailed insights for content optimization
                    </Text>
                  </Alert>
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
