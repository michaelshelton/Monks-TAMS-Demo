import React, { useState, useEffect } from 'react';
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
import { apiClient } from '../services/api';
import { BBCApiOptions, BBCApiResponse, BBCPaginationMeta } from '../services/api';

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
}

// TAMS Flows - fetched from real backend API

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

// Mock flows data for demo mode - matches actual API structure
const createMockFlows = (): Flow[] => {
  const now = new Date();
  const flows: Flow[] = [];
  
  const formats = [
    'urn:x-nmos:format:video',
    'urn:x-nmos:format:audio',
    'urn:x-nmos:format:data',
    'urn:x-tam:format:image'
  ];
  
  const categories = ['conference', 'sports', 'entertainment', 'business', 'news'];
  const contentTypes = ['presentation', 'podcast', 'training', 'webinar', 'live'];
  const years = ['2024', '2023', '2022'];
  
  for (let i = 0; i < 15; i++) {
    const created = new Date(now.getTime() - (i * 2 * 24 * 60 * 60 * 1000)); // Staggered dates
    const format = formats[i % formats.length]!;
    const category = categories[i % categories.length]!;
    const contentType = contentTypes[i % contentTypes.length]!;
    const year = years[i % years.length]!;
    
    flows.push({
      id: `demo-flow-${i + 1}-${crypto.randomUUID().substring(0, 8)}`,
      source_id: `demo-source-${i + 1}-${crypto.randomUUID().substring(0, 8)}`,
      format: format,
      codec: format === 'urn:x-nmos:format:video' ? 'video/h264' : 
             format === 'urn:x-nmos:format:audio' ? 'audio/aac' : 
             format === 'urn:x-nmos:format:data' ? 'application/json' : 'image/jpeg',
      label: `Demo Flow ${i + 1} - ${category.charAt(0).toUpperCase() + category.slice(1)} ${contentType}`,
      description: `This is a demo flow showing ${format.split(':').pop() || 'content'} content for ${category} ${contentType} from ${year}.`,
      created_by: 'demo-user',
      updated_by: 'demo-user',
      created: created.toISOString(),
      updated: created.toISOString(),
      tags: {
        category: category,
        content_type: contentType,
        year: year,
        quality: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
        location: i % 2 === 0 ? 'London' : 'New York',
        speaker: i % 4 === 0 ? 'John Doe' : i % 4 === 1 ? 'Jane Smith' : i % 4 === 2 ? 'Bob Johnson' : 'Alice Williams'
      },
      read_only: false,
      // Video-specific fields (for video flows)
      ...(format === 'urn:x-nmos:format:video' && {
        frame_width: 1920,
        frame_height: 1080,
        frame_rate: '25/1'
      }),
      // Audio-specific fields (for audio flows)
      ...(format === 'urn:x-nmos:format:audio' && {
        sample_rate: 44100,
        bits_per_sample: 16,
        channels: 2
      }),
      container: format === 'urn:x-nmos:format:video' ? 'video/mp4' : 
                 format === 'urn:x-nmos:format:audio' ? 'audio/mp4' : 
                 format === 'urn:x-nmos:format:data' ? 'application/json' : 'image/jpeg',
      status: i % 5 === 0 ? 'processing' : 'active',
      views: Math.floor(Math.random() * 1000),
      duration: `${Math.floor(Math.random() * 60)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
    });
  }
  
  return flows;
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
  const [isDemoMode, setIsDemoMode] = useState(false); // Track if we're using demo data
  
  // VAST TAMS API state
  const [bbcPagination, setBbcPagination] = useState<BBCPaginationMeta>({});
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  
  // Client-side pagination state
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 10;
  
  // Advanced filtering
  const { filters, updateFilters, clearFilters, hasActiveFilters, setFilter } = useFilterPersistence('flows');
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);

  // Fetch flows using VAST TAMS API
  const fetchFlowsVastTams = async (cursor?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const options: BBCApiOptions = {
        // Issue #3: limit parameter still causes validation errors
        // Backend expects integer but query strings are strings (AJV doesn't coerce types)
        // TODO: Re-enable when backend adds query parameter coercion middleware
        // limit: 10, // Disabled due to Issue #3 (query parameter validation)
        // Issue #4: show_deleted is not a valid query parameter (schema rejects additionalProperties)
        // Filtering deleted flows will be handled client-side if needed
      };
      
      if (cursor) {
        options.page = cursor;
      }

      // Apply filters to VAST TAMS API (server-side filtering)
      if (filters.format) {
        options.format = filters.format;
      }
      // Tag filters - API supports tag.<name> query parameters
      if (filters.category) {
        options.tags = { ...(options.tags || {}), category: filters.category };
      }
      if (filters.content_type) {
        options.tags = { ...(options.tags || {}), content_type: filters.content_type };
      }
      if (filters.year) {
        options.tags = { ...(options.tags || {}), year: filters.year };
      }

      console.log('Fetching flows from TAMS API with options:', options);
      const response = await apiClient.getFlows(options);
      console.log('TAMS flows API response:', response);
      
      // Handle different response formats
      // The API returns a direct array of flows with pagination in headers
      // bbcTamsGet normalizes to { data: [...], pagination: {...} }
      // Note: API returns _id (MongoDB format), normalize to id for frontend
      let flowsData: Flow[] = [];
      let paginationData: BBCPaginationMeta = {};
      
      if (response && response.data && Array.isArray(response.data)) {
        // Normalized BBC TAMS format from bbcTamsGet
        // Normalize _id to id (API returns _id from MongoDB)
        flowsData = response.data.map((flow: any) => ({
          ...flow,
          id: flow.id || flow._id // Normalize _id to id
        }));
        paginationData = response.pagination || {};
      } else if (response && 'flows' in response && Array.isArray((response as any).flows)) {
        // Alternative format: { flows: [...], count }
        flowsData = (response as any).flows.map((flow: any) => ({
          ...flow,
          id: flow.id || flow._id // Normalize _id to id
        }));
        paginationData = {
          count: (response as any).count || (response as any).flows.length,
          limit: options.limit || 50
        };
      } else if (Array.isArray(response)) {
        // Direct array response (when API works correctly)
        flowsData = response.map((flow: any) => ({
          ...flow,
          id: flow.id || flow._id // Normalize _id to id
        }));
        paginationData = {
          count: response.length,
          limit: options.limit || 50
        };
      }
      
      setFlows(flowsData);
      setBbcPagination(paginationData);
      setCurrentCursor(cursor || null);
      setError(null);
      setIsDemoMode(false); // API is working, not in demo mode
      // Reset to first page when flows change
      setActivePage(1);
    } catch (err: any) {
      console.error('TAMS flows API error:', err);
      
      // Check if it's a network/connection error
      const isNetworkError = err?.message?.includes('Network') || 
                             err?.message?.includes('fetch') || 
                             err?.message?.includes('CORS') ||
                             err?.name === 'TypeError' ||
                             err?.message?.includes('Could not connect');
      
      // Check if it's a validation error (Issue #3 - still broken)
      const isValidationError = err?.message?.includes('ValidationError') ||
                                  err?.message?.includes('must be integer') ||
                                  err?.message?.includes('Invalid request data');
      
      if (isNetworkError) {
        // Network errors: fall back to demo data
        console.warn('Network error, falling back to demo data');
        const mockFlows = createMockFlows();
        setFlows(mockFlows);
        setBbcPagination({
          count: mockFlows.length,
          limit: 50
        });
        setCurrentCursor(null);
        setIsDemoMode(true);
        setError(null); // Don't show error for network issues, use demo data
      } else if (isValidationError) {
        // Validation errors: show error but don't use demo data
        // Issue #3: limit parameter validation still broken
        setError('API validation error. Some query parameters may not be supported yet. Please try without filters.');
        setIsDemoMode(false);
        setFlows([]);
        setBbcPagination({});
        setCurrentCursor(null);
      } else {
        // Other errors: show error message
        // Issue #1 is now fixed, so binding errors should not occur
        const errorMsg = err?.message || 'Unknown error occurred';
        setError(`Failed to load flows: ${errorMsg}`);
        setIsDemoMode(false);
        setFlows([]);
        setBbcPagination({});
        setCurrentCursor(null);
      }
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
    setIsDemoMode(false); // Reset demo mode when refreshing
    fetchFlowsVastTams();
    setError(null);
  };



  const handleCreateFlow = async (newFlow: Omit<Flow, 'id' | 'created' | 'updated'>) => {
    // In demo mode, show a message that creation won't work
    if (isDemoMode) {
      setError('Cannot create flows in demo mode. Please ensure the TAMS API is available.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      // Generate a UUID for the flow ID (required by API)
      const flowId = crypto.randomUUID();
      
      // The API expects POST /flows/:id with the flow data
      const flowData = {
        id: flowId,
        ...newFlow
      };
      
      const response = await apiClient.createFlow(flowId, flowData);
      
      // Refresh the flows list to get the new flow
      await fetchFlowsVastTams();
      setShowCreateModal(false);
      setError(null);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to create flow';
      setError(errorMsg);
      console.error('Create flow error:', err);
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

  // Client-side filtering for filters not supported by API
  // Note: Format, category, content_type, and year filters are applied server-side via API (tag.category, tag.content_type, tag.year)
  // Status and created date filters are client-side only (not in API)
  const filteredFlows = flows.filter(flow => {
    // Search filter
    const searchTerm = filters.search?.toLowerCase();
    const matchesSearch = !searchTerm || 
      flow.label?.toLowerCase().includes(searchTerm) ||
      flow.description?.toLowerCase().includes(searchTerm);

    // Format, category, content_type, and year are filtered server-side via API

    // Status filter - NOTE: status is NOT in the API schema, this is client-side only
    // The API doesn't have a status field for flows, so this only works with demo data
    const statusFilter = filters.status;
    const matchesStatus = !statusFilter || flow.status === statusFilter;

    // Created date filter - NOTE: created date filtering is NOT supported by the API
    // The API only supports timerange (for flow content time), not creation dates
    // This is client-side only and won't filter real API data server-side
    const createdFilter = filters.created;
    const matchesCreated = !createdFilter || (() => {
      if (!flow.created) return true;
      const flowDate = new Date(flow.created);
      const now = new Date();
      switch (createdFilter) {
        case 'last_7_days':
          return (now.getTime() - flowDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
        case 'last_30_days':
          return (now.getTime() - flowDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        case 'this_month':
          return flowDate.getMonth() === now.getMonth() && flowDate.getFullYear() === now.getFullYear();
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

    // Format, category, content_type, and year are filtered server-side via API
    return matchesSearch && matchesStatus && matchesCreated && matchesTags;
  });

  // Client-side pagination for filtered flows
  const totalPages = Math.ceil(filteredFlows.length / itemsPerPage);
  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFlows = filteredFlows.slice(startIndex, endIndex);

  return (
    <Box style={{ backgroundColor: '#0f0f0f', minHeight: '100vh', padding: '24px' }}>
      <Container size="xl" px={0}>
        {/* Title and Header */}
        <Group justify="space-between" mb="lg">
          <Box>
            <Title order={2} c="white">Media Flows</Title>
            <Text c="#b3b3b3" size="sm" mt="xs">
              Processed media streams with technical specifications and encoding details
            </Text>
          </Box>
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconInfoCircle size={16} />}
            onClick={() => navigate('/flow-details/demo')}
            styles={{
              root: {
                backgroundColor: 'transparent',
                border: '1px solid #333333',
                color: '#b3b3b3',
                '&:hover': {
                  backgroundColor: '#1a1a1a',
                  borderColor: '#404040',
                },
              },
            }}
          >
            View Demo Flow
          </Button>
          <Button
            variant="subtle"
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefresh}
            loading={loading}
            styles={{
              root: {
                backgroundColor: 'transparent',
                border: '1px solid #333333',
                color: '#b3b3b3',
                '&:hover': {
                  backgroundColor: '#1a1a1a',
                  borderColor: '#404040',
                },
              },
            }}
          >
            Refresh
          </Button>
          <Button
            variant="subtle"
            leftSection={<IconPlus size={16} />}
            onClick={() => setShowCreateModal(true)}
            styles={{
              root: {
                backgroundColor: 'transparent',
                border: '1px solid #333333',
                color: '#b3b3b3',
                '&:hover': {
                  backgroundColor: '#1a1a1a',
                  borderColor: '#404040',
                },
              },
            }}
          >
            Add Flow
          </Button>
        </Group>
      </Group>

      {/* Demo Mode Alert */}
      {isDemoMode && (
        <Alert 
          icon={<IconInfoCircle size={16} />} 
          color="blue" 
          title="Demo Mode - Mock Data"
          withCloseButton
          onClose={() => setIsDemoMode(false)}
          mb="md"
        >
          <Text size="sm">
            The TAMS API is currently unavailable. You are viewing <strong>demo flows data</strong> to allow you to test the interface.
            All features work with this demo data, but changes won't be saved to the backend.
          </Text>
        </Alert>
      )}

      {/* Error Alert - only show if not in demo mode */}
      {error && !isDemoMode && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          color="red" 
          title="TAMS Connection Error"
          withCloseButton
          onClose={() => setError(null)}
          mb="md"
        >
          {error}
        </Alert>
      )}

      {/* TAMS Info - Toggleable */}
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
                styles={{
                  root: {
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#b3b3b3',
                    padding: 0,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                }}
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
              styles={{
                root: {
                  backgroundColor: 'transparent',
                  border: '1px solid #333333',
                  color: '#b3b3b3',
                  '&:hover': {
                    backgroundColor: '#1a1a1a',
                    borderColor: '#404040',
                  },
                },
              }}
            >
              Clear All Filters
            </Button>
          )}
        </Group>
      </Group>

      {/* Quick Filters */}
      <Card 
        withBorder 
        mb="md" 
        p="sm"
        style={{
          backgroundColor: 'transparent',
          border: '1px solid #333333',
        }}
      >
        <Group gap="md" align="center">
          <Group gap="xs">
            <Text size="sm" fw={500} c="#b3b3b3">Quick Filters:</Text>
            {hasActiveFilters && (
              <Badge size="xs" variant="light" color="blue">
                {Object.keys(filters).length} active
              </Badge>
            )}
          </Group>
          
          {/* Format Filters */}
          <Divider orientation="vertical" />
          <Group gap="xs">
            <Text size="xs" c="#b3b3b3">Format:</Text>
            <Chip
              checked={filters.format === 'urn:x-nmos:format:video'}
              onChange={(checked) => setFilter('format', checked ? 'urn:x-nmos:format:video' : '')}
              variant="light"
              size="sm"
              color="blue"
            >
              Video
            </Chip>
            <Chip
              checked={filters.format === 'urn:x-nmos:format:audio'}
              onChange={(checked) => setFilter('format', checked ? 'urn:x-nmos:format:audio' : '')}
              variant="light"
              size="sm"
              color="blue"
            >
              Audio
            </Chip>
          </Group>
          
          {/* Tag-based Filters */}
          <Divider orientation="vertical" />
          <Group gap="xs">
            <Text size="xs" c="#b3b3b3">Tags:</Text>
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
          </Group>
        </Group>
      </Card>

      {/* Advanced Filters */}
      <AdvancedFilter
        filters={filterOptions}
        value={filters}
        onChange={updateFilters}
        presets={savedPresets}
        onPresetDelete={(presetId) => setSavedPresets(savedPresets.filter(p => p.id !== presetId))}
      />

      {/* Flows Table */}
      <Box mt="xl">
        <Table
          style={{
            backgroundColor: 'transparent'
          }}
          styles={{
            thead: {
              backgroundColor: 'transparent',
            },
            th: {
              backgroundColor: 'transparent',
              color: '#b3b3b3',
              borderBottom: '1px solid #333333',
              padding: '12px 16px',
              fontWeight: 500,
              fontSize: '14px',
            },
            tbody: {
              backgroundColor: 'transparent',
            },
            tr: {
              backgroundColor: 'transparent',
              borderBottom: '1px solid #333333',
              '&:hover': {
                backgroundColor: '#1a1a1a',
              },
            },
            td: {
              backgroundColor: 'transparent',
              color: '#ffffff',
              borderBottom: '1px solid #333333',
              padding: '12px 16px',
            },
          }}
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Media Content</Table.Th>
              <Table.Th>Format & Codec</Table.Th>
              <Table.Th>Content Information</Table.Th>
              <Table.Th>Category & Type</Table.Th>
              <Table.Th>Content Stats</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <Table.Tr>
                <Table.Td colSpan={6} ta="center">
                  <Loader />
                </Table.Td>
              </Table.Tr>
            ) : error ? (
              <Table.Tr>
                <Table.Td colSpan={6} ta="center" c="red">
                  {error}
                </Table.Td>
              </Table.Tr>
            ) : filteredFlows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6} ta="center">
                  <Text c="#b3b3b3">
                    {flows.length === 0 
                      ? (isDemoMode 
                          ? "No demo flows available" 
                          : "No flows available from TAMS backend")
                      : "No flows found matching your filters"
                    }
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              paginatedFlows.map((flow) => (
                <Table.Tr 
                  key={flow.id}
                  style={{ 
                    opacity: flow.deleted ? 0.6 : 1,
                    cursor: 'pointer',
                  }}
                >
                  <Table.Td>
                    <Box>
                      <Group gap="xs" align="center">
                        <Text 
                          fw={500} 
                          size="sm" 
                          c="white"
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/flow-details/${flow.id}`);
                          }}
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
                      <Text size="xs" c="#b3b3b3" mt={4}>
                        {flow.description || 'No description'}
                      </Text>
                      {/* Source Link */}
                      {flow.source_id && (
                        <Group gap="xs" mt="xs">
                          <IconLink size={12} />
                          <Text size="xs" c="#666666">
                            Source: {flow.source_id}
                          </Text>
                        </Group>
                      )}
                    </Box>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={4}>
                      <Badge variant="light" color="blue" size="sm">
                        {getFormatLabel(flow.format)}
                      </Badge>
                      <Text size="sm" c="#b3b3b3">
                        {flow.codec}
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={4}>
                      <Group gap="xs" align="center">
                        <IconCalendar size={14} />
                        <Text size="sm" c="#b3b3b3">
                          {flow.created ? new Date(flow.created).toLocaleDateString() : 'Unknown'}
                        </Text>
                      </Group>
                      <Group gap="xs" align="center">
                        <IconActivity size={14} />
                        <Text size="sm" c="#b3b3b3">
                          {flow.duration || 'Unknown'}
                        </Text>
                      </Group>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={4}>
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
                      {flow.tags?.year && (
                        <Text size="xs" c="#b3b3b3">
                          Year: {flow.tags.year}
                        </Text>
                      )}
                      {flow.tags?.speaker && (
                        <Text size="xs" c="#666666">
                          Speaker: {flow.tags.speaker}
                        </Text>
                      )}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    {/* views and duration are not in the API - only show if present (demo data) */}
                    <Stack gap={4}>
                      {flow.views !== undefined && (
                        <Group gap="xs" align="center">
                          <IconActivity size={14} />
                          <Text size="sm" c="#b3b3b3">
                            {flow.views} views
                          </Text>
                        </Group>
                      )}
                      {flow.duration && (
                        <Text size="xs" c="#666666">
                          {flow.duration}
                        </Text>
                      )}
                      {/* Quality Badge from tags */}
                      {flow.tags?.quality && (
                        <Badge size="xs" variant="light" color="orange">
                          {flow.tags.quality}
                        </Badge>
                      )}
                      {!flow.views && !flow.duration && !flow.tags?.quality && (
                        <Text size="xs" c="#666666">—</Text>
                      )}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    {/* Status is not in the API schema - only show if present (demo data) */}
                    {flow.status ? (
                      <Badge 
                        color={getStatusColor(flow.status)} 
                        variant="light"
                        size="sm"
                      >
                        {flow.status}
                      </Badge>
                    ) : (
                      <Text size="sm" c="#666666">—</Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
        
        {/* Pagination */}
        {filteredFlows.length > itemsPerPage && (
          <Group justify="center" mt="lg">
            <Pagination
              value={activePage}
              onChange={setActivePage}
              total={totalPages}
              size="sm"
            />
          </Group>
        )}
        
        {/* Results count */}
        {!loading && filteredFlows.length > 0 && (
          <Group justify="center" mt="md">
            <Text size="sm" c="#b3b3b3">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredFlows.length)} of {filteredFlows.length} flows
            </Text>
          </Group>
        )}
      </Box>

        {/* Create Flow Modal */}
        <CreateFlowModal 
          opened={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateFlow}
          sources={sources}
        />
      </Container>
    </Box>
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
