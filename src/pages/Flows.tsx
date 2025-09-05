import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Card,
  Text,
  Badge,
  Group,
  Box,
  Button,
  Table,
  Modal,
  TextInput,
  Select,
  Textarea,
  Stack,
  NumberInput,
  MultiSelect,
  Alert,
  Pagination,
  TextInput as MantineTextInput,
  Loader,
  SimpleGrid,
  Chip,
  Tooltip,
  Divider,
  Collapse
} from '@mantine/core';
import AdvancedFilter, { FilterOption, FilterState, FilterPreset } from '../components/AdvancedFilter';
import { useFilterPersistence } from '../hooks/useFilterPersistence';
import {
  IconVideo, 
  IconMusic, 
  IconDatabase, 
  IconPhoto, 
  IconPlus, 
  IconFilter,
  IconDots,
  IconTag,
  IconClock,
  IconAlertCircle,
  IconX,
  IconRefresh,
  IconActivity,
  IconCalendar,
  IconMapPin,
  IconInfoCircle,
  IconLink,
  IconArrowLeft
} from '@tabler/icons-react';
import BBCAdvancedFilter, { BBCFilterPatterns } from '../components/BBCAdvancedFilter';
import { apiClient } from '../services/api';
import { BBCApiOptions, BBCApiResponse, BBCPaginationMeta } from '../services/api';
import BBCPagination from '../components/BBCPagination';

// Enhanced Flow interface
interface Flow {
  id: string;
  source_id: string;
  format: string;
  codec: string;
  label?: string;
  description?: string;
  created_by?: string;
  updated_by?: string;
  created?: string;
  updated?: string;
  tags?: Record<string, string>;
  // Video-specific fields
  frame_width?: number;
  frame_height?: number;
  frame_rate?: string;
  // Audio-specific fields
  sample_rate?: number;
  bits_per_sample?: number;
  channels?: number;
  // Common fields
  container?: string;
  read_only?: boolean;
  status?: string;
  views?: number;
  duration?: string;
  // New soft delete fields for backend v6.0
  deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
  // Collection fields
  collection_id?: string;
  collection_label?: string;
}

// VAST TAMS Flows - fetched from real backend API

// BBC TAMS content formats and codecs
const BBC_CONTENT_FORMATS = [
  'urn:x-nmos:format:video',
  'urn:x-nmos:format:audio', 
  'urn:x-nmos:format:data',
  'urn:x-nmos:format:multi',
  'urn:x-tam:format:image'
];

const COMMON_CODECS = [
  'video/h264',
  'video/h265',
  'video/mp4',
  'audio/aac',
  'audio/mp3',
  'audio/wav',
  'application/json',
  'text/plain'
];

const getFormatIcon = (format: string) => {
  switch (format) {
    case 'urn:x-nmos:format:video':
      return <IconVideo size={16} />;
    case 'urn:x-nmos:format:audio':
      return <IconMusic size={16} />;
    case 'urn:x-nmos:format:data':
      return <IconDatabase size={16} />;
    case 'urn:x-tam:format:image':
      return <IconPhoto size={16} />;
    default:
      return <IconDatabase size={16} />;
  }
};

const getFormatLabel = (format: string) => {
  switch (format) {
    case 'urn:x-nmos:format:video':
      return 'Video';
    case 'urn:x-nmos:format:audio':
      return 'Audio';
    case 'urn:x-nmos:format:data':
      return 'Data';
    case 'urn:x-tam:format:image':
      return 'Image';
    default:
      return 'Unknown';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'green';
    case 'processing': return 'orange';
    case 'error': return 'red';
    default: return 'gray';
  }
};

export default function Flows() {
  const navigate = useNavigate();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [sources, setSources] = useState<Array<{ id: string; label?: string }>>([]);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfoBox, setShowInfoBox] = useState(true); // State for collapsible info box
  
  // VAST TAMS API state
  const [bbcPagination, setBbcPagination] = useState<BBCPaginationMeta>({});
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  
  // Advanced filtering
  const { filters, updateFilters, clearFilters, hasActiveFilters, setFilter } = useFilterPersistence('flows');
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);
  
  // BBC TAMS compliant filtering
  const [bbcFilters, setBbcFilters] = useState<BBCFilterPatterns>({
    label: '',
    format: '',
    codec: '',
    tags: {},
    tagExists: {},
    timerange: '',
    page: '',
    limit: 50
  });

  // Fetch flows using VAST TAMS API
  const fetchFlowsVastTams = async (cursor?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const options: BBCApiOptions = {
        limit: 10,
        custom: { show_deleted: false }
      };
      
      if (cursor) {
        options.page = cursor;
      }

      // Apply filters to VAST TAMS API
      if (filters.format) options.format = filters.format;
      if (filters.category) options.tags = { ...options.tags, category: filters.category };
      if (filters.content_type) options.tags = { ...options.tags, content_type: filters.content_type };
      if (filters.year) options.tags = { ...options.tags, year: filters.year };

      console.log('Fetching flows from VAST TAMS API with options:', options);
      const response = await apiClient.getFlows(options);
      console.log('VAST TAMS flows API response:', response);
      
      setFlows(response.data);
      setBbcPagination(response.pagination);
      setCurrentCursor(cursor || null);
      setError(null);
    } catch (err: any) {
      console.error('VAST TAMS flows API error:', err);
      
      // Set appropriate error message based on error type
      if (err?.message?.includes('500') || err?.message?.includes('Internal Server Error')) {
        setError('VAST TAMS backend temporarily unavailable - please try again later');
      } else if (err?.message?.includes('Network') || err?.message?.includes('fetch') || err?.message?.includes('CORS')) {
        setError('Network connection issue - please check your connection and try again');
      } else if (err?.message?.includes('404')) {
        setError('VAST TAMS API endpoint not found - please check backend configuration');
      } else {
        setError(`VAST TAMS API error: ${err?.message || 'Unknown error'}`);
      }
      
      // Clear flows on error
      setFlows([]);
      setBbcPagination({});
      setCurrentCursor(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sources for the create flow modal
  const fetchSources = async () => {
    try {
      const response = await apiClient.getSources();
      setSources(response.data);
    } catch (err) {
      console.warn('Failed to fetch sources for flow creation:', err);
    }
  };

  // Fetch flows and sources on component mount
  useEffect(() => {
    fetchFlowsVastTams();
    fetchSources();
  }, [filters]);

  // Refresh data function
  const handleRefresh = () => {
    fetchFlowsVastTams();
    setError(null);
  };

  // Handle VAST TAMS pagination
  const handleVastTamsPageChange = (cursor: string | null) => {
    if (cursor) {
      fetchFlowsVastTams(cursor);
    }
  };


  const handleCreateFlow = async (newFlow: Omit<Flow, 'id' | 'created' | 'updated'>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.createFlow(newFlow);
      setFlows(prev => [...prev, response]);
      setShowCreateModal(false);
    } catch (err) {
      setError('Failed to create flow');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };




  // Define filter options for media flows
  const filterOptions: FilterOption[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search flows by name or description...'
    },
    {
      key: 'format',
      label: 'Format',
      type: 'select',
      options: [
        { value: 'urn:x-nmos:format:video', label: 'Video' },
        { value: 'urn:x-nmos:format:audio', label: 'Audio' },
        { value: 'urn:x-nmos:format:data', label: 'Data' },
        { value: 'urn:x-tam:format:image', label: 'Image' }
      ]
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'technology', label: 'Technology' },
        { value: 'education', label: 'Education' },
        { value: 'entertainment', label: 'Entertainment' },
        { value: 'business', label: 'Business' },
        { value: 'news', label: 'News' }
      ]
    },
    {
      key: 'content_type',
      label: 'Content Type',
      type: 'select',
      options: [
        { value: 'conference', label: 'Conference' },
        { value: 'podcast', label: 'Podcast' },
        { value: 'training', label: 'Training' },
        { value: 'presentation', label: 'Presentation' },
        { value: 'webinar', label: 'Webinar' }
      ]
    },
    {
      key: 'year',
      label: 'Year',
      type: 'select',
      options: [
        { value: '2024', label: '2024' },
        { value: '2023', label: '2023' },
        { value: '2022', label: '2022' }
      ]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'processing', label: 'Processing' },
        { value: 'error', label: 'Error' }
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

  const filteredFlows = flows.filter(flow => {
    // Search filter
    const searchTerm = filters.search?.toLowerCase();
    const matchesSearch = !searchTerm || 
      flow.label?.toLowerCase().includes(searchTerm) ||
      flow.description?.toLowerCase().includes(searchTerm);

    // Format filter
    const formatFilter = filters.format;
    const matchesFormat = !formatFilter || flow.format === formatFilter;

    // Category filter
    const categoryFilter = filters.category;
    const matchesCategory = !categoryFilter || 
      flow.tags?.['category'] === categoryFilter;

    // Content type filter
    const contentTypeFilter = filters.content_type;
    const matchesContentType = !contentTypeFilter || 
      flow.tags?.['content_type'] === contentTypeFilter;

    // Year filter
    const yearFilter = filters.year;
    const matchesYear = !yearFilter || 
      flow.tags?.['year'] === yearFilter;

    // Status filter
    const statusFilter = filters.status;
    const matchesStatus = !statusFilter || flow.status === statusFilter;

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
      (flow.tags && Object.entries(flow.tags).some(([key, value]) => 
        `${key}:${value}`.toLowerCase().includes(tagsFilter.toLowerCase())
      ));

    return matchesSearch && matchesFormat && matchesCategory && matchesContentType && 
           matchesYear && matchesStatus && matchesCreated && matchesTags;
  });

  // BBC TAMS filter handlers
  const handleBbcFiltersChange = useCallback((newFilters: any) => {
    setBbcFilters(newFilters);
    // Reset to first page when filters change
    setCurrentCursor(null);
  }, []);

  const handleBbcFiltersReset = useCallback(() => {
    setBbcFilters({
      label: '',
      format: '',
      codec: '',
      tags: {},
      tagExists: {},
      timerange: '',
      page: '',
      limit: 50
    });
    setCurrentCursor(null);
  }, []);

  const handleBbcFiltersApply = useCallback(() => {
    // Apply BBC filters - this would typically make an API call
    console.log('Applying BBC filters:', bbcFilters);
    // For now, just log the filters - in production this would update the API call
  }, [bbcFilters]);

  return (
    <Container size="xl" px="xl" py="xl">
      {/* Title and Header */}
      <Group justify="space-between" mb="lg">
        <Box>
          <Title order={2}>Media Flows</Title>
          <Text c="dimmed" size="sm" mt="xs">
            Processed media streams with technical specifications and encoding details
          </Text>
        </Box>
        <Group>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setShowCreateModal(true)}
          >
            Add Flow
          </Button>
        </Group>
      </Group>

      {/* Error Alert */}
      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          color="red" 
          title="VAST TAMS Connection Error"
          withCloseButton
          onClose={() => setError(null)}
          mb="md"
        >
          {error}
        </Alert>
      )}

      {/* VAST TAMS Info - Toggleable */}
      {!error && (
        <Alert 
          icon={<IconInfoCircle size={16} />} 
          color="blue" 
          title={
            <Group justify="space-between" w="100%">
              <Text>What are Flows in TAMS?</Text>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setShowInfoBox(!showInfoBox)}
                rightSection={showInfoBox ? <IconArrowLeft size={12} /> : <IconArrowLeft size={12} style={{ transform: 'rotate(-90deg)' }} />}
              >
                {showInfoBox ? 'Hide' : 'Show'} Info
              </Button>
            </Group>
          }
          mb="md"
        >
          <Collapse in={showInfoBox}>
            <Stack gap="xs">
              <Text size="sm">
                <strong>Flows</strong> are the processed media content in the TAMS system - they represent individual 
                media streams that have been created from sources and contain specific video/audio streams, codecs, 
                and technical specifications.
              </Text>
              <Text size="sm">
                Each flow contains detailed metadata like format, codec, resolution, sample rates, and custom tags. 
                Flows are the second step in the TAMS workflow - they define how content is encoded and delivered.
              </Text>
            </Stack>
          </Collapse>
        </Alert>
      )}



      {/* Filter Controls */}
      <Group justify="space-between" mb="md">
        <Group>
          {hasActiveFilters && (
            <Button
              variant="subtle"
              color="red"
              size="sm"
              onClick={clearFilters}
            >
              Clear All Filters
            </Button>
          )}
        </Group>
      </Group>

      {/* Quick Media Filters */}
      <Card withBorder mb="md" p="sm">
        <Group gap="md" align="center">
          <Group gap="xs">
            <Text size="sm" fw={500} c="dimmed">Quick Filters:</Text>
            {hasActiveFilters && (
              <Badge size="xs" variant="light" color="blue">
                {Object.keys(filters).length} active
              </Badge>
            )}
          </Group>
          
          <Chip
            checked={filters.category === 'sports'}
            onChange={(checked) => setFilter('category', checked ? 'sports' : '')}
            variant="light"
            size="sm"
            color="green"
          >
            Sports
          </Chip>
          
          <Chip
            checked={filters.category === 'conference'}
            onChange={(checked) => setFilter('category', checked ? 'conference' : '')}
            variant="light"
            size="sm"
            color="green"
          >
            Conference
          </Chip>
          
          <Chip
            checked={filters.content_type === 'podcast'}
            onChange={(checked) => setFilter('content_type', checked ? 'podcast' : '')}
            variant="light"
            size="sm"
            color="red"
          >
            Podcast
          </Chip>
          
          <Chip
            checked={filters.year === '2024'}
            onChange={(checked) => setFilter('year', checked ? '2024' : '')}
            variant="light"
            size="sm"
            color="orange"
          >
            Year 2024
          </Chip>
          
          {/* Quick Timerange Filters */}
          <Divider orientation="vertical" />
          <Group gap="xs">
            <Text size="xs" c="dimmed">Time:</Text>
            <Chip
              checked={filters.created === 'last_7_days'}
              onChange={(checked) => setFilter('created', checked ? 'last_7_days' : '')}
              variant="light"
              size="xs"
              color="gray"
            >
              Last 7 days
            </Chip>
            <Chip
              checked={filters.created === 'last_30_days'}
              onChange={(checked) => setFilter('created', checked ? 'last_30_days' : '')}
              variant="light"
              size="xs"
              color="gray"
            >
              Last 30 days
            </Chip>
            <Chip
              checked={filters.created === 'this_month'}
              onChange={(checked) => setFilter('created', checked ? 'this_month' : '')}
              variant="light"
              size="xs"
              color="gray"
            >
              This month
            </Chip>
          </Group>
          
          <Text size="xs" c="dimmed" ml="auto">
            Advanced filters available below
          </Text>
        </Group>
      </Card>

      {/* Advanced Filters */}
      <AdvancedFilter
        filters={filterOptions}
        value={filters}
        onChange={updateFilters}
        presets={savedPresets}
        onPresetSave={(preset) => setSavedPresets([...savedPresets, preset])}
        onPresetDelete={(presetId) => setSavedPresets(savedPresets.filter(p => p.id !== presetId))}
      />

      {/* BBC TAMS Compliant Filters */}
      <Box mb="lg">
        <Text size="sm" c="dimmed" mb="xs">
          TAMS Advanced Filters - For technical content filtering (format, codec, tags)
        </Text>
        <BBCAdvancedFilter
          filters={bbcFilters}
          onFiltersChange={handleBbcFiltersChange}
          onReset={handleBbcFiltersReset}
          onApply={handleBbcFiltersApply}
          availableFormats={BBC_CONTENT_FORMATS}
          availableCodecs={COMMON_CODECS}
          availableTags={['quality', 'source', 'metadata', 'processing']}
          showTimerange={true}
          showFormatSpecific={false}
          showTagFilters={true}
          showPagination={false}
          collapsed={true}
          disabled={loading}
          size="sm"
          variant="light"
        />
      </Box>

      {/* Flows Table */}
      <Card withBorder>
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Media Content</Table.Th>
              <Table.Th>Format & Codec</Table.Th>
              <Table.Th>Content Information</Table.Th>
              <Table.Th>Category & Type</Table.Th>
              <Table.Th>Collection</Table.Th>
              <Table.Th>Content Stats</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <Table.Tr>
                <Table.Td colSpan={7} ta="center">
                  <Loader />
                </Table.Td>
              </Table.Tr>
            ) : error ? (
              <Table.Tr>
                <Table.Td colSpan={7} ta="center" c="red">
                  {error}
                </Table.Td>
              </Table.Tr>
            ) : filteredFlows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} ta="center">
                  <Text c="dimmed">
                    {flows.length === 0 
                      ? "No flows available from VAST TAMS backend" 
                      : "No flows found matching your filters"
                    }
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              filteredFlows.map((flow) => (
                <Table.Tr key={flow.id}>
                  <Table.Td>
                    <Group gap="sm">
                      {getFormatIcon(flow.format)}
                      <Box>
                        <Group gap="xs" align="center">
                          <Text 
                            fw={500} 
                            size="sm" 
                            style={{ cursor: 'pointer', color: 'var(--mantine-color-blue-6)' }}
                            onClick={() => navigate(`/flow-details/${flow.id}`)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                          >
                            {flow.label || 'Unnamed Flow'}
                          </Text>
                          {flow.deleted && (
                            <Badge size="xs" color="red">DELETED</Badge>
                          )}
                        </Group>
                        <Text size="xs" c="dimmed">
                          {flow.description || 'No description'}
                        </Text>
                        {/* Source Link */}
                        {flow.source_id && (
                          <Group gap="xs" mt="xs">
                            <IconLink size={12} />
                            <Text size="xs" c="blue">
                              Source: {flow.source_id}
                            </Text>
                          </Group>
                        )}
                      </Box>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap="xs">
                      <Badge variant="light" color="blue">
                        {getFormatLabel(flow.format)}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        {flow.codec}
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap="xs">
                      <Group gap="xs" align="center">
                        <IconCalendar size={14} />
                        <Text size="sm">
                          {flow.created ? new Date(flow.created).toLocaleDateString() : 'Unknown'}
                        </Text>
                      </Group>
                      <Group gap="xs" align="center">
                        <IconActivity size={14} />
                        <Text size="sm" fw={500}>
                          {flow.duration || 'Unknown'}
                        </Text>
                      </Group>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap="xs">
                      {/* Category & Content Type */}
                      <Group gap="xs">
                        {flow.tags?.category && (
                          <Badge size="xs" variant="light" color="blue">
                            {flow.tags.category}
                          </Badge>
                        )}
                        {flow.tags?.content_type && (
                          <Badge size="xs" variant="light" color="green">
                            {flow.tags.content_type}
                          </Badge>
                        )}
                      </Group>
                      {/* Year & Speaker */}
                      <Stack gap="xs">
                        {flow.tags?.year && (
                          <Text size="xs" fw={500}>
                            Year: {flow.tags.year}
                          </Text>
                        )}
                        {flow.tags?.speaker && (
                          <Text size="xs" c="dimmed">
                            Speaker: {flow.tags.speaker}
                          </Text>
                        )}
                      </Stack>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap="xs">
                      {/* Collection Badge */}
                      {flow.collection_id ? (
                        <Badge variant="light" color="purple" size="sm">
                          {flow.collection_label || 'Collection'}
                        </Badge>
                      ) : (
                        <Text size="xs" c="dimmed">
                          No collection
                        </Text>
                      )}
                      {/* Collection Actions */}
                      {flow.collection_id && (
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => navigate(`/flow-collections/${flow.collection_id}`)}
                        >
                          View Collection
                        </Button>
                      )}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap="xs">
                      <Group gap="xs" align="center">
                        <IconActivity size={14} />
                        <Text size="sm">
                          {flow.views || 0} views
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {flow.duration || 'Unknown'}
                      </Text>
                      {/* Quality Badge */}
                      {flow.tags?.quality && (
                        <Badge size="xs" variant="light" color="orange">
                          {flow.tags.quality}
                        </Badge>
                      )}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge 
                      color={getStatusColor(flow.status || 'unknown')} 
                      variant="light"
                      size="sm"
                    >
                      {flow.status || 'Unknown'}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
        
        {/* VAST TAMS Pagination */}
        {bbcPagination && Object.keys(bbcPagination).length > 0 ? (
          <Group justify="center" mt="lg">
            <BBCPagination
              paginationMeta={bbcPagination}
              onPageChange={handleVastTamsPageChange}
              onLimitChange={(limit) => {
                // Handle limit change for VAST TAMS API
                fetchFlowsVastTams();
              }}
              showBBCMetadata={true}
              showLimitSelector={true}
            />
          </Group>
        ) : (
          /* No pagination when no data */
          flows.length === 0 && !loading && (
            <Group justify="center" mt="lg">
              <Text c="dimmed">No flows available</Text>
            </Group>
          )
        )}
      </Card>

      {/* Create Flow Modal */}
      <CreateFlowModal 
        opened={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateFlow}
        sources={sources}
      />

    </Container>
  );
}

// Modal Components
interface CreateFlowModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (flow: Omit<Flow, 'id' | 'created' | 'updated'>) => void;
  sources: Array<{ id: string; label?: string }>;
}

function CreateFlowModal({ opened, onClose, onSubmit, sources }: CreateFlowModalProps) {
  const [formData, setFormData] = useState({
    source_id: '',
    format: 'urn:x-nmos:format:video',
    codec: '',
    label: '',
    description: '',
    frame_width: 1920,
    frame_height: 1080,
    frame_rate: '25/1',
    sample_rate: 44100,
    bits_per_sample: 16,
    channels: 2,
    container: '',
    tags: {} as Record<string, string>
  });

  const [tagKey, setTagKey] = useState('');
  const [tagValue, setTagValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      source_id: '',
      format: 'urn:x-nmos:format:video',
      codec: '',
      label: '',
      description: '',
      frame_width: 1920,
      frame_height: 1080,
      frame_rate: '25/1',
      sample_rate: 44100,
      bits_per_sample: 16,
      channels: 2,
      container: '',
      tags: {}
    });
  };

  const addTag = () => {
    if (tagKey && tagValue) {
      setFormData({
        ...formData,
        tags: { ...formData.tags, [tagKey]: tagValue }
      });
      setTagKey('');
      setTagValue('');
    }
  };

  const removeTag = (key: string) => {
    const newTags = { ...formData.tags };
    delete newTags[key];
    setFormData({ ...formData, tags: newTags });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create New Flow" size="lg">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Select
            label="Source"
            placeholder="Select source"
            data={sources.map(source => ({
              value: source.id,
              label: source.label || 'Unknown Source'
            }))}
            value={formData.source_id}
            onChange={(value) => setFormData({ ...formData, source_id: value || '' })}
            required
          />
          
          <Select
            label="Format"
            data={[
              { value: 'urn:x-nmos:format:video', label: 'Video' },
              { value: 'urn:x-nmos:format:audio', label: 'Audio' },
              { value: 'urn:x-nmos:format:data', label: 'Data' },
              { value: 'urn:x-tam:format:image', label: 'Image' }
            ]}
            value={formData.format}
            onChange={(value) => setFormData({ ...formData, format: value || 'urn:x-nmos:format:video' })}
            required
          />
          
          <TextInput
            label="Codec"
            placeholder="e.g., video/mp4, audio/wav"
            value={formData.codec}
            onChange={(e) => setFormData({ ...formData, codec: e.currentTarget.value })}
            required
          />
          
          <TextInput
            label="Label"
            placeholder="Flow name"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.currentTarget.value })}
            required
          />
          
          <Textarea
            label="Description"
            placeholder="Flow description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
            rows={3}
          />
          
          <TextInput
            label="Container"
            placeholder="e.g., mp4, wav, jpeg"
            value={formData.container}
            onChange={(e) => setFormData({ ...formData, container: e.currentTarget.value })}
          />
          
          {/* Video-specific fields */}
          {formData.format === 'urn:x-nmos:format:video' && (
            <Group grow>
                             <NumberInput
                 label="Frame Width"
                 value={formData.frame_width}
                 onChange={(value) => setFormData({ ...formData, frame_width: typeof value === 'number' ? value : 1920 })}
                 min={1}
               />
               <NumberInput
                 label="Frame Height"
                 value={formData.frame_height}
                 onChange={(value) => setFormData({ ...formData, frame_height: typeof value === 'number' ? value : 1080 })}
                 min={1}
               />
              <TextInput
                label="Frame Rate"
                placeholder="e.g., 25/1"
                value={formData.frame_rate}
                onChange={(e) => setFormData({ ...formData, frame_rate: e.currentTarget.value })}
              />
            </Group>
          )}
          
          {/* Audio-specific fields */}
          {formData.format === 'urn:x-nmos:format:audio' && (
            <Group grow>
                             <NumberInput
                 label="Sample Rate"
                 value={formData.sample_rate}
                 onChange={(value) => setFormData({ ...formData, sample_rate: typeof value === 'number' ? value : 44100 })}
                 min={1}
               />
               <NumberInput
                 label="Bits Per Sample"
                 value={formData.bits_per_sample}
                 onChange={(value) => setFormData({ ...formData, bits_per_sample: typeof value === 'number' ? value : 16 })}
                 min={1}
               />
               <NumberInput
                 label="Channels"
                 value={formData.channels}
                 onChange={(value) => setFormData({ ...formData, channels: typeof value === 'number' ? value : 2 })}
                 min={1}
               />
            </Group>
          )}
          
          {/* Tags */}
          <Box>
            <Text size="sm" fw={500} mb="xs">Tags</Text>
            <Group gap="xs" mb="xs">
              <TextInput
                placeholder="Tag key"
                value={tagKey}
                onChange={(e) => setTagKey(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <TextInput
                placeholder="Tag value"
                value={tagValue}
                onChange={(e) => setTagValue(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <Button size="sm" onClick={addTag}>Add</Button>
            </Group>
            <Group gap="xs">
              {Object.entries(formData.tags).map(([key, value]) => (
                <Badge 
                  key={key} 
                  color="blue" 
                  variant="light"
                  rightSection={
                    <Button 
                      size="xs" 
                      variant="subtle" 
                      onClick={() => removeTag(key)}
                      style={{ minWidth: 'auto', padding: '2px' }}
                    >
                      <IconX size={10} />
                    </Button>
                  }
                >
                  {key}: {value}
                </Badge>
              ))}
            </Group>
          </Box>
          
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create Flow</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
