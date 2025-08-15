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
  ActionIcon,
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
  Divider
} from '@mantine/core';
import AdvancedFilter, { FilterOption, FilterState, FilterPreset } from '../components/AdvancedFilter';
import { useFilterPersistence } from '../hooks/useFilterPersistence';
import { 
  IconVideo, 
  IconMusic, 
  IconDatabase, 
  IconPhoto, 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconEye,
  IconFilter,
  IconSearch,
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
  IconLink
} from '@tabler/icons-react';
import BBCAdvancedFilter, { BBCFilterPatterns } from '../components/BBCAdvancedFilter';
import { EnhancedDeleteModal, DeleteOptions } from '../components/EnhancedDeleteModal';
import { apiClient } from '../services/api';
import { getFlows, getSources, BBCApiOptions, BBCApiResponse, BBCPaginationMeta } from '../services/bbcTamsApi';
import BBCPagination from '../components/BBCPagination';

// Football game metadata interface
interface FootballGameMetadata {
  sport: string;
  league: string;
  venue: string;
  season: string;
  homeTeam?: string;
  awayTeam?: string;
  gameDate?: string;
  score?: string;
  duration?: string;
  highlights?: string[];
  highlightsCount?: number;
  sourceId?: string;
}

// Enhanced Flow interface with football metadata
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
  // Football-specific metadata
  footballMetadata?: FootballGameMetadata;
}

// Mock football game flows for demonstration
const mockFootballFlows: Flow[] = [
  {
    id: 'flow-001',
    source_id: 'game-001',
    format: 'urn:x-nmos:format:video',
    codec: 'video/h264',
    label: 'Manchester United vs Liverpool - Full Match',
    description: 'Complete Premier League match coverage with multiple camera angles',
    created: '2024-01-15T15:00:00Z',
    updated: '2024-01-15T17:00:00Z',
    status: 'active',
    views: 1250,
    duration: '90:00',
    tags: {
      'sport': 'football',
      'league': 'Premier League',
      'venue': 'Old Trafford',
      'season': '2024',
      'home_team': 'Manchester United',
      'away_team': 'Liverpool',
      'score': '2-1',
      'highlights_count': '3'
    },
    footballMetadata: {
      sport: 'football',
      league: 'Premier League',
      venue: 'Old Trafford',
      season: '2024',
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      gameDate: '2024-01-15',
      score: '2-1',
      duration: '90:00',
      highlights: ['Player 19 Goal', 'Player 19 Assist', 'Player 19 Free Kick'],
      highlightsCount: 3,
      sourceId: 'game-001'
    }
  },
  {
    id: 'flow-002',
    source_id: 'game-002',
    format: 'urn:x-nmos:format:video',
    codec: 'video/h264',
    label: 'Arsenal vs Chelsea - Tactical Analysis',
    description: 'Premier League derby with tactical breakdown and highlights',
    created: '2024-01-20T15:00:00Z',
    updated: '2024-01-20T17:00:00Z',
    status: 'active',
    views: 890,
    duration: '90:00',
    tags: {
      'sport': 'football',
      'league': 'Premier League',
      'venue': 'Emirates Stadium',
      'season': '2024',
      'home_team': 'Arsenal',
      'away_team': 'Chelsea',
      'score': '1-1',
      'highlights_count': '2'
    },
    footballMetadata: {
      sport: 'football',
      league: 'Premier League',
      venue: 'Emirates Stadium',
      season: '2024',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      gameDate: '2024-01-20',
      score: '1-1',
      duration: '90:00',
      highlights: ['Player 10 Goal', 'Player 22 Save'],
      highlightsCount: 2,
      sourceId: 'game-002'
    }
  },
  {
    id: 'flow-003',
    source_id: 'game-003',
    format: 'urn:x-nmos:format:video',
    codec: 'video/h265',
    label: 'Barcelona vs Real Madrid - El Clásico',
    description: 'La Liga classic match with full coverage and analysis',
    created: '2024-01-25T15:00:00Z',
    updated: '2024-01-25T17:00:00Z',
    status: 'active',
    views: 2100,
    duration: '90:00',
    tags: {
      'sport': 'football',
      'league': 'La Liga',
      'venue': 'Camp Nou',
      'season': '2024',
      'home_team': 'Barcelona',
      'away_team': 'Real Madrid',
      'score': '3-2',
      'highlights_count': '4'
    },
    footballMetadata: {
      sport: 'football',
      league: 'La Liga',
      venue: 'Camp Nou',
      season: '2024',
      homeTeam: 'Barcelona',
      awayTeam: 'Real Madrid',
      gameDate: '2024-01-25',
      score: '3-2',
      duration: '90:00',
      highlights: ['Player 9 Hat-trick', 'Player 7 Goal'],
      highlightsCount: 4,
      sourceId: 'game-003'
    }
  }
];

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // BBC TAMS API state
  const [bbcPagination, setBbcPagination] = useState<BBCPaginationMeta>({});
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [useBbcApi, setUseBbcApi] = useState(true); // Toggle between BBC TAMS and legacy API
  
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

  // Fetch flows using BBC TAMS API
  const fetchFlowsBbcTams = async (cursor?: string) => {
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

      // Apply filters to BBC TAMS API
      if (filters.format) options.format = filters.format;
      if (filters.sport) options.tags = { ...options.tags, sport: filters.sport };
      if (filters.league) options.tags = { ...options.tags, league: filters.league };
      if (filters.venue) options.tags = { ...options.tags, venue: filters.venue };
      if (filters.season) options.tags = { ...options.tags, season: filters.season };
      if (filters.homeTeam) options.tags = { ...options.tags, home_team: filters.homeTeam };
      if (filters.awayTeam) options.tags = { ...options.tags, away_team: filters.awayTeam };

      const response = await getFlows(options);
      setFlows(response.data);
      setBbcPagination(response.pagination);
      setCurrentCursor(cursor || null);
      setError(null);
    } catch (err) {
      console.error('BBC TAMS API error:', err);
      // Fallback to mock data for demo
      setFlows(mockFootballFlows);
      setBbcPagination({});
      setError('BBC TAMS API unavailable, using demo data');
    } finally {
      setLoading(false);
    }
  };

  // Legacy API fetch (fallback)
  const fetchFlowsLegacy = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch flows and sources in parallel
      const [flowsResponse, sourcesResponse] = await Promise.all([
        apiClient.getFlows(),
        apiClient.getSources()
      ]);
      
      setFlows(flowsResponse.data);
      setSources(sourcesResponse.data);
    } catch (err) {
      setError('Failed to fetch flows and sources');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch flows and sources on component mount
  useEffect(() => {
    if (useBbcApi) {
      fetchFlowsBbcTams();
    } else {
      fetchFlowsLegacy();
    }
  }, [useBbcApi, filters]);

  // Initialize with demo data for better demo experience
  useEffect(() => {
    if (flows.length === 0 && !loading) {
      setFlows(mockFootballFlows);
    }
  }, [flows.length, loading]);

  // Refresh data function
  const handleRefresh = () => {
    if (useBbcApi) {
      fetchFlowsBbcTams();
    } else {
      fetchFlowsLegacy();
    }
    setError(null);
  };

  // Handle BBC TAMS pagination
  const handleBbcPageChange = (cursor: string | null) => {
    if (cursor) {
      fetchFlowsBbcTams(cursor);
    }
  };

  // Navigate to search with flow context
  const handleSearchFlow = (flow: Flow) => {
    const searchParams = new URLSearchParams();
    if (flow.footballMetadata?.homeTeam) searchParams.append('homeTeam', flow.footballMetadata.homeTeam);
    if (flow.footballMetadata?.awayTeam) searchParams.append('awayTeam', flow.footballMetadata.awayTeam);
    if (flow.footballMetadata?.venue) searchParams.append('venue', flow.footballMetadata.venue);
    if (flow.footballMetadata?.league) searchParams.append('league', flow.footballMetadata.league);
    if (flow.footballMetadata?.season) searchParams.append('season', flow.footballMetadata.season);
    searchParams.append('flowId', flow.id);
    
    navigate(`/search?${searchParams.toString()}`);
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

  const handleUpdateFlow = async (updatedFlow: Flow) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.updateFlow(updatedFlow.id, updatedFlow);
      setFlows(prev => prev.map(f => f.id === updatedFlow.id ? response : f));
      setShowEditModal(false);
      setSelectedFlow(null);
    } catch (err) {
      setError('Failed to update flow');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (flow: Flow) => {
    setSelectedFlow(flow);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (options: DeleteOptions) => {
    if (selectedFlow) {
      try {
        setLoading(true);
        setError(null);
        await apiClient.deleteFlow(selectedFlow.id, options);
        setFlows(prev => prev.filter(f => f.id !== selectedFlow.id));
        setShowDeleteModal(false);
        setSelectedFlow(null);
      } catch (err) {
        setError('Failed to delete flow');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleView = (flow: Flow) => {
    navigate(`/flow-details/${flow.id}`);
  };

  const handleEdit = (flow: Flow) => {
    setSelectedFlow(flow);
    setShowEditModal(true);
  };

  const handleRestore = async (flow: Flow) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.restoreFlow(flow.id);
      setFlows(prev => prev.map(f => 
        f.id === flow.id 
          ? { 
              ...f, 
              deleted: false, 
              deleted_at: null, 
              deleted_by: null 
            }
          : f
      ));
      setShowDeleteModal(false);
      setSelectedFlow(null);
    } catch (err) {
      setError('Failed to restore flow');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Define filter options with football-specific filters
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
      key: 'sport',
      label: 'Sport',
      type: 'select',
      options: [
        { value: 'football', label: 'Football' },
        { value: 'hockey', label: 'Hockey' },
        { value: 'basketball', label: 'Basketball' },
        { value: 'tennis', label: 'Tennis' },
        { value: 'cricket', label: 'Cricket' }
      ]
    },
    {
      key: 'league',
      label: 'League',
      type: 'select',
      options: [
        { value: 'Premier League', label: 'Premier League' },
        { value: 'La Liga', label: 'La Liga' },
        { value: 'Bundesliga', label: 'Bundesliga' },
        { value: 'Serie A', label: 'Serie A' }
      ]
    },
    {
      key: 'venue',
      label: 'Venue',
      type: 'select',
      options: [
        { value: 'Old Trafford', label: 'Old Trafford' },
        { value: 'Emirates Stadium', label: 'Emirates Stadium' },
        { value: 'Camp Nou', label: 'Camp Nou' },
        { value: 'Santiago Bernabéu', label: 'Santiago Bernabéu' }
      ]
    },
    {
      key: 'season',
      label: 'Season',
      type: 'select',
      options: [
        { value: '2024', label: '2024' },
        { value: '2023', label: '2023' },
        { value: '2022', label: '2022' }
      ]
    },
    {
      key: 'homeTeam',
      label: 'Home Team',
      type: 'select',
      options: [
        { value: 'Manchester United', label: 'Manchester United' },
        { value: 'Arsenal', label: 'Arsenal' },
        { value: 'Barcelona', label: 'Barcelona' },
        { value: 'Real Madrid', label: 'Real Madrid' }
      ]
    },
    {
      key: 'awayTeam',
      label: 'Away Team',
      type: 'select',
      options: [
        { value: 'Liverpool', label: 'Liverpool' },
        { value: 'Chelsea', label: 'Chelsea' },
        { value: 'Real Madrid', label: 'Real Madrid' },
        { value: 'Barcelona', label: 'Barcelona' }
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

    // Sport filter
    const sportFilter = filters.sport;
    const matchesSport = !sportFilter || 
      flow.tags?.['sport'] === sportFilter ||
      flow.footballMetadata?.sport === sportFilter;

    // League filter
    const leagueFilter = filters.league;
    const matchesLeague = !leagueFilter || 
      flow.tags?.['league'] === leagueFilter ||
      flow.footballMetadata?.league === leagueFilter;

    // Venue filter
    const venueFilter = filters.venue;
    const matchesVenue = !venueFilter || 
      flow.tags?.['venue'] === venueFilter ||
      flow.footballMetadata?.venue === venueFilter;

    // Season filter
    const seasonFilter = filters.season;
    const matchesSeason = !seasonFilter || 
      flow.tags?.['season'] === seasonFilter ||
      flow.footballMetadata?.season === seasonFilter;

    // Home team filter
    const homeTeamFilter = filters.homeTeam;
    const matchesHomeTeam = !homeTeamFilter || 
      flow.tags?.['home_team'] === homeTeamFilter ||
      flow.footballMetadata?.homeTeam === homeTeamFilter;

    // Away team filter
    const awayTeamFilter = filters.awayTeam;
    const matchesAwayTeam = !awayTeamFilter || 
      flow.tags?.['away_team'] === awayTeamFilter ||
      flow.footballMetadata?.awayTeam === awayTeamFilter;

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

    return matchesSearch && matchesFormat && matchesSport && matchesLeague && 
           matchesVenue && matchesSeason && matchesHomeTeam && matchesAwayTeam && 
           matchesStatus && matchesCreated && matchesTags;
  });

  // BBC TAMS filter handlers
  const handleBbcFiltersChange = useCallback((newFilters: any) => {
    setBbcFilters(newFilters);
    // Reset to first page when filters change
    setCurrentPage(1);
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
    setCurrentPage(1);
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
          <Title order={2}>Football Game Content Management</Title>
          <Text c="dimmed" size="sm" mt="xs">
            Manage football game content flows using BBC TAMS v6.0 API
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
          title="Error"
          withCloseButton
          onClose={() => setError(null)}
          mb="md"
        >
          {error}
        </Alert>
      )}

      {/* Demo Mode Info */}
      {!error && useBbcApi && (
        <Alert 
          icon={<IconInfoCircle size={16} />} 
          color="blue" 
          title="BBC TAMS API Demo Mode"
          mb="md"
        >
          <Text size="sm">
            This page demonstrates BBC TAMS v6.0 API integration for football content management. 
            Flows represent individual football games with their video content, metadata, and relationships.
            {flows.length > 0 && flows[0]?.footballMetadata && ' Click on any flow to view game details and search for specific content.'}
          </Text>
        </Alert>
      )}

      {/* Football Demo Features */}
      <Card withBorder mb="md">
        <Group gap="md" align="center">
          <IconActivity size={24} color="#228be6" />
          <Box>
            <Text fw={500} size="sm">Football Content Management Features</Text>
            <Text size="xs" c="dimmed">
              • Game content flows with full metadata • Team and venue tracking • League and season organization • 
              Content relationships and search integration • BBC TAMS v6.0 compliance • Cursor-based pagination
            </Text>
          </Box>
        </Group>
      </Card>

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
          <Chip
            checked={useBbcApi}
            onChange={(checked) => setUseBbcApi(checked)}
            variant="outline"
            color="blue"
          >
            BBC TAMS API
          </Chip>
        </Group>
      </Group>

      {/* Quick Football Filters */}
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
            checked={filters.sport === 'football'}
            onChange={(checked) => setFilter('sport', checked ? 'football' : '')}
            variant="light"
            size="sm"
            color="blue"
          >
            Football Only
          </Chip>
          
          <Chip
            checked={filters.league === 'Premier League'}
            onChange={(checked) => setFilter('league', checked ? 'Premier League' : '')}
            variant="light"
            size="sm"
            color="green"
          >
            Premier League
          </Chip>
          
          <Chip
            checked={filters.league === 'La Liga'}
            onChange={(checked) => setFilter('league', checked ? 'La Liga' : '')}
            variant="light"
            size="sm"
            color="red"
          >
            La Liga
          </Chip>
          
          <Chip
            checked={filters.season === '2024'}
            onChange={(checked) => setFilter('season', checked ? '2024' : '')}
            variant="light"
            size="sm"
            color="orange"
          >
            Season 2024
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
          BBC TAMS Advanced Filters - For technical content filtering (format, codec, tags)
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
              <Table.Th>Game Content</Table.Th>
              <Table.Th>Format & Codec</Table.Th>
              <Table.Th>Game Information</Table.Th>
              <Table.Th>Teams & Venue</Table.Th>
              <Table.Th>Content Stats</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
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
                  <Text c="dimmed">No football game flows found matching your filters</Text>
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
                          <Text fw={500} size="sm">
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
                        {flow.footballMetadata?.sourceId && (
                          <Group gap="xs" mt="xs">
                            <IconLink size={12} />
                            <Text size="xs" c="blue">
                              Source: {flow.footballMetadata.sourceId}
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
                          {flow.footballMetadata?.gameDate || 
                           (flow.created ? new Date(flow.created).toLocaleDateString() : 'Unknown')}
                        </Text>
                      </Group>
                      <Group gap="xs" align="center">
                        <IconActivity size={14} />
                        <Text size="sm" fw={500}>
                          {flow.footballMetadata?.score || flow.tags?.['score'] || 'N/A'}
                        </Text>
                      </Group>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap="xs">
                      {/* Teams */}
                      {flow.footballMetadata && (
                        <Group gap="xs">
                          <Badge size="xs" variant="light" color="blue">
                            {flow.footballMetadata.homeTeam}
                          </Badge>
                          <Text size="xs" c="dimmed">vs</Text>
                          <Badge size="xs" variant="light" color="red">
                            {flow.footballMetadata.awayTeam}
                          </Badge>
                        </Group>
                      )}
                      {/* Venue & League */}
                      <Stack gap="xs">
                        <Text size="xs" fw={500}>
                          {flow.footballMetadata?.venue || flow.tags?.['venue'] || 'Unknown Venue'}
                        </Text>
                        <Badge size="xs" variant="light" color="green">
                          {flow.footballMetadata?.league || flow.tags?.['league'] || 'Unknown League'}
                        </Badge>
                      </Stack>
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
                      {/* Highlights Count */}
                      {flow.footballMetadata?.highlightsCount && (
                        <Badge size="xs" variant="light" color="orange">
                          {flow.footballMetadata.highlightsCount} highlights
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
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="View Game Details">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => handleView(flow)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Search Content">
                        <ActionIcon
                          variant="subtle"
                          color="green"
                          onClick={() => handleSearchFlow(flow)}
                        >
                          <IconSearch size={16} />
                        </ActionIcon>
                      </Tooltip>
                      {!flow.deleted ? (
                        <>
                          <Tooltip label="Edit Flow">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => handleEdit(flow)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete Flow">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => handleDelete(flow)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip label="Restore Flow">
                          <ActionIcon
                            variant="subtle"
                            color="green"
                            onClick={() => handleRestore(flow)}
                          >
                            <IconRefresh size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
        
        {/* BBC TAMS Pagination */}
        {useBbcApi && bbcPagination && Object.keys(bbcPagination).length > 0 ? (
          <Group justify="center" mt="lg">
            <BBCPagination
              paginationMeta={bbcPagination}
              onPageChange={handleBbcPageChange}
              onLimitChange={(limit) => {
                // Handle limit change for BBC TAMS API
                fetchFlowsBbcTams();
              }}
              showBBCMetadata={true}
              showLimitSelector={true}
            />
          </Group>
        ) : (
          /* Legacy Pagination */
          filteredFlows.length > 0 && (
            <Group justify="center" mt="lg">
              <Pagination 
                total={Math.ceil(filteredFlows.length / 10)} 
                value={currentPage} 
                onChange={setCurrentPage}
              />
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

      {/* Edit Flow Modal */}
      {selectedFlow && (
        <EditFlowModal
          flow={selectedFlow}
          opened={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedFlow(null);
          }}
          onSubmit={handleUpdateFlow}
        />
      )}

      {/* Delete Confirmation Modal */}
      {selectedFlow && (
        <EnhancedDeleteModal
          opened={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Flow"
          itemName={selectedFlow.label || 'Unnamed Flow'}
          itemType="flow"
          showCascadeOption={true}
          defaultDeletedBy="admin"
        />
      )}
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
                    <ActionIcon 
                      size="xs" 
                      variant="subtle" 
                      onClick={() => removeTag(key)}
                    >
                      <IconX size={10} />
                    </ActionIcon>
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

interface EditFlowModalProps {
  flow: Flow;
  opened: boolean;
  onClose: () => void;
  onSubmit: (flow: Flow) => void;
}

function EditFlowModal({ flow, opened, onClose, onSubmit }: EditFlowModalProps) {
  const [formData, setFormData] = useState({
    ...flow,
    tags: flow.tags || {}
  });

  const [tagKey, setTagKey] = useState('');
  const [tagValue, setTagValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...flow,
      ...formData,
      updated: new Date().toISOString(),
      updated_by: 'admin'
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
    <Modal opened={opened} onClose={onClose} title="Edit Flow" size="lg">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Label"
            placeholder="Flow name"
            value={formData.label || ''}
            onChange={(e) => setFormData({ ...formData, label: e.currentTarget.value })}
            required
          />
          
          <Textarea
            label="Description"
            placeholder="Flow description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
            rows={3}
          />
          
          <TextInput
            label="Codec"
            placeholder="e.g., video/mp4, audio/wav"
            value={formData.codec}
            onChange={(e) => setFormData({ ...formData, codec: e.currentTarget.value })}
            required
          />
          
          <TextInput
            label="Container"
            placeholder="e.g., mp4, wav, jpeg"
            value={formData.container || ''}
            onChange={(e) => setFormData({ ...formData, container: e.currentTarget.value })}
          />
          
          {/* Video-specific fields */}
          {formData.format === 'urn:x-nmos:format:video' && (
            <Group grow>
                             <NumberInput
                 label="Frame Width"
                 value={formData.frame_width || 1920}
                 onChange={(value) => setFormData({ ...formData, frame_width: typeof value === 'number' ? value : 1920 })}
                 min={1}
               />
               <NumberInput
                 label="Frame Height"
                 value={formData.frame_height || 1080}
                 onChange={(value) => setFormData({ ...formData, frame_height: typeof value === 'number' ? value : 1080 })}
                 min={1}
               />
              <TextInput
                label="Frame Rate"
                placeholder="e.g., 25/1"
                value={formData.frame_rate || ''}
                onChange={(e) => setFormData({ ...formData, frame_rate: e.currentTarget.value })}
              />
            </Group>
          )}
          
          {/* Audio-specific fields */}
          {formData.format === 'urn:x-nmos:format:audio' && (
            <Group grow>
                             <NumberInput
                 label="Sample Rate"
                 value={formData.sample_rate || 44100}
                 onChange={(value) => setFormData({ ...formData, sample_rate: typeof value === 'number' ? value : 44100 })}
                 min={1}
               />
               <NumberInput
                 label="Bits Per Sample"
                 value={formData.bits_per_sample || 16}
                 onChange={(value) => setFormData({ ...formData, bits_per_sample: typeof value === 'number' ? value : 16 })}
                 min={1}
               />
               <NumberInput
                 label="Channels"
                 value={formData.channels || 2}
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
                    <ActionIcon 
                      size="xs" 
                      variant="subtle" 
                      onClick={() => removeTag(key)}
                    >
                      <IconX size={10} />
                    </ActionIcon>
                  }
                >
                  {key}: {value}
                </Badge>
              ))}
            </Group>
          </Box>
          
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={onClose}>Cancel</Button>
            <Button type="submit">Update Flow</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
} 