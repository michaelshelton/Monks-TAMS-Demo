import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Button,
  Group,
  Table,
  Text,
  Badge,
  ActionIcon,
  Modal,
  Stack,
  TextInput,
  Textarea,
  Select,
  Pagination,
  Box,
  Card,
  Grid,
  Input,
  Chip,
  Flex,
  Tooltip,
  Menu,
  Divider,
  Alert,
  Loader,
  SimpleGrid,
  Image
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconFilter,
  IconVideo,
  IconMusic,
  IconDatabase,
  IconPhoto,
  IconEye,
  IconDots,
  IconSettings,
  IconRefresh,
  IconAlertCircle,
  IconCalendar,
  IconMapPin,
  IconActivity,
  IconInfoCircle
} from '@tabler/icons-react';
import AdvancedFilter, { FilterOption, FilterState, FilterPreset } from '../components/AdvancedFilter';
import { useFilterPersistence } from '../hooks/useFilterPersistence';
import { EnhancedDeleteModal, DeleteOptions } from '../components/EnhancedDeleteModal';
import { useNavigate } from 'react-router-dom';
import { 
  validateTAMSEntity, 
  VALID_CONTENT_FORMATS, 
  ContentFormat,
  sanitizeForBackend,
  formatValidationErrors 
} from '../utils/enhancedValidation';
import { apiClient } from '../services/api';
import { getSources, BBCApiOptions, BBCApiResponse, BBCPaginationMeta } from '../services/bbcTamsApi';
import BBCPagination from '../components/BBCPagination';
import { SourceHealthMonitor } from '../components/SourceHealthMonitor';

// Football-specific metadata interface
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
}

// Enhanced Source interface with football metadata
interface Source {
  id: string;
  format: string;
  label?: string;
  description?: string;
  created_by?: string;
  updated_by?: string;
  created?: string;
  updated?: string;
  tags?: Record<string, string>;
  source_collection?: Array<{ id: string; label?: string }>;
  collected_by?: string[];
  // New soft delete fields for backend v6.0
  deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
  // Football-specific metadata
  footballMetadata?: FootballGameMetadata;
}

// Mock football games for demonstration (will be replaced with BBC TAMS API)
const mockFootballGames: Source[] = [
  {
    id: 'game-001',
    format: 'urn:x-nmos:format:video',
    label: 'Manchester United vs Liverpool',
    description: 'Premier League match with full game coverage and highlights',
    created: '2024-01-15T15:00:00Z',
    updated: '2024-01-15T17:00:00Z',
    tags: {
      'sport': 'football',
      'league': 'Premier League',
      'venue': 'Old Trafford',
      'season': '2024',
      'home_team': 'Manchester United',
      'away_team': 'Liverpool',
      'score': '2-1',
      'duration': '90:00'
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
      highlights: ['Player 19 Goal', 'Player 19 Assist', 'Player 19 Free Kick']
    }
  },
  {
    id: 'game-002',
    format: 'urn:x-nmos:format:video',
    label: 'Arsenal vs Chelsea',
    description: 'Premier League derby with tactical analysis',
    created: '2024-01-20T15:00:00Z',
    updated: '2024-01-20T17:00:00Z',
    tags: {
      'sport': 'football',
      'league': 'Premier League',
      'venue': 'Emirates Stadium',
      'season': '2024',
      'home_team': 'Arsenal',
      'away_team': 'Chelsea',
      'score': '1-1',
      'duration': '90:00'
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
      highlights: ['Player 10 Goal', 'Player 22 Save']
    }
  },
  {
    id: 'game-003',
    format: 'urn:x-nmos:format:video',
    label: 'Barcelona vs Real Madrid',
    description: 'El Clásico - La Liga classic match',
    created: '2024-01-25T15:00:00Z',
    updated: '2024-01-25T17:00:00Z',
    tags: {
      'sport': 'football',
      'league': 'La Liga',
      'venue': 'Camp Nou',
      'season': '2024',
      'home_team': 'Barcelona',
      'away_team': 'Real Madrid',
      'score': '3-2',
      'duration': '90:00'
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
      highlights: ['Player 9 Hat-trick', 'Player 7 Goal']
    }
  }
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

export default function Sources() {
  const navigate = useNavigate();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false); // New state for showing deleted items
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // BBC TAMS API state
  const [bbcPagination, setBbcPagination] = useState<BBCPaginationMeta>({});
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  
  // Advanced filtering
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useFilterPersistence('sources');
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);

  // Define filter options with football-specific filters
  const filterOptions: any[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search sources by name or description...'
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
    },
    {
      key: 'deleted',
      label: 'Show Deleted',
      type: 'boolean',
      placeholder: 'Include deleted items'
    }
  ];

  // Filter sources with football-specific logic
  const filteredSources = sources.filter(source => {
    // Search filter
    const searchTerm = filters.search?.toLowerCase();
    const matchesSearch = !searchTerm || 
      source.label?.toLowerCase().includes(searchTerm) ||
      source.description?.toLowerCase().includes(searchTerm);

    // Format filter
    const formatFilter = filters.format;
    const matchesFormat = !formatFilter || source.format === formatFilter;

    // Sport filter
    const sportFilter = filters.sport;
    const matchesSport = !sportFilter || 
      source.tags?.['sport'] === sportFilter ||
      source.footballMetadata?.sport === sportFilter;

    // League filter
    const leagueFilter = filters.league;
    const matchesLeague = !leagueFilter || 
      source.tags?.['league'] === leagueFilter ||
      source.footballMetadata?.league === leagueFilter;

    // Venue filter
    const venueFilter = filters.venue;
    const matchesVenue = !venueFilter || 
      source.tags?.['venue'] === venueFilter ||
      source.footballMetadata?.venue === venueFilter;

    // Season filter
    const seasonFilter = filters.season;
    const matchesSeason = !seasonFilter || 
      source.tags?.['season'] === seasonFilter ||
      source.footballMetadata?.season === seasonFilter;

    // Created date filter
    const createdFilter = filters.created;
    const matchesCreated = !createdFilter || (() => {
      // Simplified date filtering for demo
      // In real implementation, this would compare actual dates
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
      (source.tags && Object.entries(source.tags).some(([key, value]) => 
        `${key}:${value}`.toLowerCase().includes(tagsFilter.toLowerCase())
      ));

    // Deleted filter
    const deletedFilter = filters.deleted;
    const matchesDeleted = !deletedFilter || (source.deleted === deletedFilter);

    return matchesSearch && matchesFormat && matchesSport && matchesLeague && 
           matchesVenue && matchesSeason && matchesCreated && matchesTags && matchesDeleted;
  });

  // Fetch sources using BBC TAMS API
  const fetchSourcesBbcTams = async (cursor?: string) => {
    try {
      setLoading(true);
      const options: BBCApiOptions = {
        limit: 10,
        custom: { show_deleted: showDeleted }
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

      const response = await getSources(options);
      setSources(response.data);
      setBbcPagination(response.pagination);
      setCurrentCursor(cursor || null);
      setError(null);
    } catch (err) {
      console.error('BBC TAMS API error:', err);
      // Fallback to mock data for demo
      setSources(mockFootballGames);
      setBbcPagination({});
      setError('BBC TAMS API unavailable, using demo data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSourcesBbcTams();
  }, [showDeleted, filters]);

  // Initialize with demo data for better demo experience
  useEffect(() => {
    if (sources.length === 0 && !loading && !error) {
      setSources(mockFootballGames);
    }
  }, [sources.length, loading, error]);

  // Handle BBC TAMS pagination
  const handleBbcPageChange = (cursor: string | null) => {
    if (cursor) {
      fetchSourcesBbcTams(cursor);
    }
  };

  const handleCreateSource = async (newSource: Omit<Source, 'id' | 'created' | 'updated'>) => {
    try {
      setLoading(true);
      const response = await apiClient.createSource(newSource);
      setSources(prev => [...prev, response.data]);
      setShowCreateModal(false);
    } catch (err) {
      setError('Failed to create source');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSource = async (updatedSource: Source) => {
    try {
      setLoading(true);
      const response = await apiClient.updateSource(updatedSource.id, updatedSource);
      setSources(prev => prev.map(s => s.id === updatedSource.id ? response.data : s));
      setShowEditModal(false);
      setSelectedSource(null);
    } catch (err) {
      setError('Failed to update source');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (source: Source) => {
    setSelectedSource(source);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (options: DeleteOptions) => {
    if (selectedSource) {
      try {
        setLoading(true);
        await apiClient.deleteSource(selectedSource.id, options);
        setSources(prev => prev.filter(s => s.id !== selectedSource.id));
        setShowDeleteModal(false);
        setSelectedSource(null);
      } catch (err) {
        setError('Failed to delete source');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };



  const handleEdit = (source: Source) => {
    setSelectedSource(source);
    setShowEditModal(true);
  };

  const handleRestore = async (source: Source) => {
    try {
      setLoading(true);
      await apiClient.restoreSource(source.id);
      setSources(prev => prev.map(s => 
        s.id === source.id 
          ? { 
              ...s, 
              deleted: false, 
              deleted_at: null, 
              deleted_by: null 
            }
          : s
      ));
      setShowDeleteModal(false);
      setSelectedSource(null);
    } catch (err) {
      setError('Failed to restore source');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // For demo data, show all filtered sources (BBC TAMS API handles pagination)
  const paginatedSources = filteredSources;

  return (
    <Container size="xl" px="xl" py="xl">
      {/* Title and Header */}
      <Group justify="space-between" mb="lg">
        <Box>
          <Title order={2}>Sports Content Discovery - Sources</Title>
          <Text c="dimmed" size="sm" mt="xs">
            Discover and manage sports content sources using TAMS v6.0 API
          </Text>
        </Box>
        <Group>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={() => {
              fetchSourcesBbcTams();
              setError(null);
            }}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setShowCreateModal(true)}
          >
            Add Game
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
      {!error && (
        <Alert 
          icon={<IconInfoCircle size={16} />} 
          color="blue" 
          title="BBC TAMS API Demo Mode"
          mb="md"
        >
          <Text size="sm">
            This page demonstrates BBC TAMS v6.0 API integration for football content discovery. 
            The API automatically handles cursor-based pagination, tag filtering, and metadata management.
            Use the View button to navigate to detailed source information pages.
          </Text>
        </Alert>
      )}

      {/* Football Demo Features */}
      <Card withBorder mb="md">
        <Group gap="md" align="center">
          <IconActivity size={24} color="#228be6" />
          <Box>
            <Text fw={500} size="sm">Football Demo Features</Text>
            <Text size="xs" c="dimmed">
              • Sport-specific filtering (football, basketball, tennis) • League-based organization (Premier League, La Liga) • 
              Venue tracking • Season management • Game metadata (teams, scores, duration) • BBC TAMS v6.0 compliance
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
        </Group>
      </Group>

      {/* Advanced Filters */}
      <AdvancedFilter
        filters={filterOptions}
        value={filters}
        onChange={updateFilters}
        presets={savedPresets}
        onPresetSave={(preset) => setSavedPresets([...savedPresets, preset])}
        onPresetDelete={(presetId) => setSavedPresets(savedPresets.filter(p => p.id !== presetId))}
      />

      {/* Sources Table */}
      <Card withBorder>
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Game Information</Table.Th>
              <Table.Th>Format</Table.Th>
              <Table.Th>Game Date</Table.Th>
              <Table.Th>Venue & League</Table.Th>
              <Table.Th>Score & Duration</Table.Th>
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
            ) : paginatedSources.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} ta="center">
                  <Text c="dimmed">No football games found matching your filters</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              paginatedSources.map((source) => (
                <Table.Tr 
                  key={source.id}
                  style={{ 
                    opacity: source.deleted ? 0.6 : 1,
                    backgroundColor: source.deleted ? '#f8f9fa' : 'transparent'
                  }}
                >
                  <Table.Td>
                    <Group gap="sm">
                      {getFormatIcon(source.format)}
                      <Box>
                        <Group gap="xs" align="center">
                          <Text fw={500} size="sm">
                            {source.label || 'Unnamed Game'}
                          </Text>
                          {source.deleted && (
                            <Badge size="xs" color="red">DELETED</Badge>
                          )}
                        </Group>
                        <Text size="xs" c="dimmed">
                          {source.description || 'No description'}
                        </Text>
                        {/* Football Teams */}
                        {source.footballMetadata && (
                          <Group gap="xs" mt="xs">
                            <Badge size="xs" variant="light" color="blue">
                              {source.footballMetadata.homeTeam}
                            </Badge>
                            <Text size="xs" c="dimmed">vs</Text>
                            <Badge size="xs" variant="light" color="red">
                              {source.footballMetadata.awayTeam}
                            </Badge>
                          </Group>
                        )}
                      </Box>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="blue">
                      {getFormatLabel(source.format)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" align="center">
                      <IconCalendar size={14} />
                      <Text size="sm">
                        {source.footballMetadata?.gameDate || 
                         (source.created ? new Date(source.created).toLocaleDateString() : 'Unknown')}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap="xs">
                      <Group gap="xs" align="center">
                        <IconMapPin size={14} />
                        <Text size="sm" fw={500}>
                          {source.footballMetadata?.venue || source.tags?.['venue'] || 'Unknown Venue'}
                        </Text>
                      </Group>
                      <Badge size="xs" variant="light" color="green">
                        {source.footballMetadata?.league || source.tags?.['league'] || 'Unknown League'}
                      </Badge>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap="xs">
                      <Group gap="xs" align="center">
                        <IconActivity size={14} />
                        <Text size="sm" fw={500}>
                          {source.footballMetadata?.score || source.tags?.['score'] || 'N/A'}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {source.footballMetadata?.duration || source.tags?.['duration'] || 'Unknown'}
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    {source.deleted ? (
                      <Badge color="red" variant="light" size="sm">
                        Deleted
                      </Badge>
                    ) : (
                      <Badge color="green" variant="light" size="sm">
                        Active
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="View Details Page">
                        <ActionIcon
                          variant="subtle"
                          color="green"
                          onClick={() => navigate(`/source-details/${source.id}`)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      {!source.deleted ? (
                        <>
                          <Tooltip label="Edit Game">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => handleEdit(source)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete Game">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => handleDelete(source)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip label="Restore Game">
                          <ActionIcon
                            variant="subtle"
                            color="green"
                            onClick={() => handleRestore(source)}
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
        {bbcPagination && Object.keys(bbcPagination).length > 0 ? (
          <Group justify="center" mt="lg">
            <BBCPagination
              paginationMeta={bbcPagination}
              onPageChange={handleBbcPageChange}
              onLimitChange={(limit) => {
                // Handle limit change for BBC TAMS API
                fetchSourcesBbcTams();
              }}
              showBBCMetadata={true}
              showLimitSelector={true}
            />
          </Group>
        ) : (
          /* Fallback Pagination for Demo Data */
          filteredSources.length > 0 && (
            <Group justify="center" mt="lg">
              <Pagination 
                total={Math.ceil(filteredSources.length / 10)} 
                value={1} 
                onChange={() => {}} // No-op for demo data
              />
            </Group>
          )
        )}
      </Card>

      {/* Source Health Monitoring */}
      <Card withBorder mt="lg">
        <Title order={4} mb="md">Source Health & Performance</Title>
        <Text size="sm" c="dimmed" mb="lg">
          Monitor the health status, performance metrics, and system alerts for all sources
        </Text>
        <SourceHealthMonitor 
          autoRefresh={true}
          refreshInterval={7200000}
        />
      </Card>

      {/* Create Source Modal */}
      <CreateSourceModal 
        opened={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSource}
      />

      {/* Edit Source Modal */}
      {selectedSource && (
        <EditSourceModal
          source={selectedSource}
          opened={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSource(null);
          }}
          onSubmit={handleUpdateSource}
        />
      )}

      {/* Delete Confirmation Modal */}
      {selectedSource && (
        <EnhancedDeleteModal
          opened={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Football Game"
          itemName={selectedSource.label || 'Unnamed Game'}
          itemType="source"
          showCascadeOption={true}
          defaultDeletedBy="admin"
        />
      )}


    </Container>
  );
}

// Modal Components
interface CreateSourceModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (source: Omit<Source, 'id' | 'created' | 'updated'>) => void;
}

function CreateSourceModal({ opened, onClose, onSubmit }: CreateSourceModalProps) {
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    format: 'urn:x-nmos:format:video',
    // Football-specific fields
    homeTeam: '',
    awayTeam: '',
    venue: '',
    league: '',
    season: '2024',
    score: '',
    duration: ''
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    const validation = validateTAMSEntity('source', formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }
    
    // Clear validation errors
    setValidationErrors([]);
    
    // Create source with football metadata
    const sourceData = {
      label: formData.label,
      description: formData.description,
      format: formData.format,
      tags: {
        sport: 'football',
        home_team: formData.homeTeam,
        away_team: formData.awayTeam,
        venue: formData.venue,
        league: formData.league,
        season: formData.season,
        score: formData.score,
        duration: formData.duration
      },
      footballMetadata: {
        sport: 'football',
        homeTeam: formData.homeTeam,
        awayTeam: formData.awayTeam,
        venue: formData.venue,
        league: formData.league,
        season: formData.season,
        score: formData.score,
        duration: formData.duration,
        highlights: []
      }
    };
    
    onSubmit(sourceData);
    setFormData({ 
      label: '', 
      description: '', 
      format: 'urn:x-nmos:format:video',
      homeTeam: '',
      awayTeam: '',
      venue: '',
      league: '',
      season: '2024',
      score: '',
      duration: ''
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create New Football Game" size="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Validation Errors">
              <Text size="sm">{formatValidationErrors(validationErrors)}</Text>
            </Alert>
          )}
          
          <TextInput
            label="Game Title"
            placeholder="e.g., Manchester United vs Liverpool"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.currentTarget.value })}
            required
          />
          
          <Textarea
            label="Description"
            placeholder="Enter game description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
            rows={3}
          />

          {/* Football-specific fields */}
          <SimpleGrid cols={2}>
            <TextInput
              label="Home Team"
              placeholder="e.g., Manchester United"
              value={formData.homeTeam}
              onChange={(e) => setFormData({ ...formData, homeTeam: e.currentTarget.value })}
              required
            />
            <TextInput
              label="Away Team"
              placeholder="e.g., Liverpool"
              value={formData.awayTeam}
              onChange={(e) => setFormData({ ...formData, awayTeam: e.currentTarget.value })}
              required
            />
          </SimpleGrid>

          <SimpleGrid cols={2}>
            <TextInput
              label="Venue"
              placeholder="e.g., Old Trafford"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.currentTarget.value })}
              required
            />
            <TextInput
              label="League"
              placeholder="e.g., Premier League"
              value={formData.league}
              onChange={(e) => setFormData({ ...formData, league: e.currentTarget.value })}
              required
            />
          </SimpleGrid>

          <SimpleGrid cols={2}>
            <TextInput
              label="Season"
              placeholder="e.g., 2024"
              value={formData.season}
              onChange={(e) => setFormData({ ...formData, season: e.currentTarget.value })}
              required
            />
            <TextInput
              label="Score"
              placeholder="e.g., 2-1"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: e.currentTarget.value })}
            />
          </SimpleGrid>

          <TextInput
            label="Duration"
            placeholder="e.g., 90:00"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.currentTarget.value })}
          />
          
          <Select
            label="Format"
            data={VALID_CONTENT_FORMATS.map(format => ({
              value: format,
              label: getFormatLabel(format)
            }))}
            value={formData.format}
            onChange={(value) => setFormData({ ...formData, format: value as ContentFormat || 'urn:x-nmos:format:video' })}
            required
            description="Select the content format according to TAMS v6.0 specification"
          />
          
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create Game</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

interface EditSourceModalProps {
  source: Source;
  opened: boolean;
  onClose: () => void;
  onSubmit: (source: Source) => void;
}

function EditSourceModal({ source, opened, onClose, onSubmit }: EditSourceModalProps) {
  const [formData, setFormData] = useState({
    label: source.label || '',
    description: source.description || '',
    format: source.format,
    // Football-specific fields
    homeTeam: source.footballMetadata?.homeTeam || source.tags?.['home_team'] || '',
    awayTeam: source.footballMetadata?.awayTeam || source.tags?.['away_team'] || '',
    venue: source.footballMetadata?.venue || source.tags?.['venue'] || '',
    league: source.footballMetadata?.league || source.tags?.['league'] || '',
    season: source.footballMetadata?.season || source.tags?.['season'] || '2024',
    score: source.footballMetadata?.score || source.tags?.['score'] || '',
    duration: source.footballMetadata?.duration || source.tags?.['duration'] || ''
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    const validation = validateTAMSEntity('source', formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }
    
    // Clear validation errors
    setValidationErrors([]);
    
    // Update source with football metadata
    const updatedSource = {
      ...source,
      label: formData.label,
      description: formData.description,
      format: formData.format,
      updated: new Date().toISOString(),
      updated_by: 'admin',
      tags: {
        ...source.tags,
        sport: 'football',
        home_team: formData.homeTeam,
        away_team: formData.awayTeam,
        venue: formData.venue,
        league: formData.league,
        season: formData.season,
        score: formData.score,
        duration: formData.duration
      },
      footballMetadata: {
        sport: 'football',
        homeTeam: formData.homeTeam,
        awayTeam: formData.awayTeam,
        venue: formData.venue,
        league: formData.league,
        season: formData.season,
        score: formData.score,
        duration: formData.duration,
        highlights: source.footballMetadata?.highlights || []
      }
    };
    
    onSubmit(updatedSource);
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Football Game" size="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Validation Errors">
              <Text size="sm">{formatValidationErrors(validationErrors)}</Text>
            </Alert>
          )}
          
          <TextInput
            label="Game Title"
            placeholder="e.g., Manchester United vs Liverpool"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.currentTarget.value })}
            required
          />
          
          <Textarea
            label="Description"
            placeholder="Enter game description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
            rows={3}
          />

          {/* Football-specific fields */}
          <SimpleGrid cols={2}>
            <TextInput
              label="Home Team"
              placeholder="e.g., Manchester United"
              value={formData.homeTeam}
              onChange={(e) => setFormData({ ...formData, homeTeam: e.currentTarget.value })}
              required
            />
            <TextInput
              label="Away Team"
              placeholder="e.g., Liverpool"
              value={formData.awayTeam}
              onChange={(e) => setFormData({ ...formData, awayTeam: e.currentTarget.value })}
              required
            />
          </SimpleGrid>

          <SimpleGrid cols={2}>
            <TextInput
              label="Venue"
              placeholder="e.g., Old Trafford"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.currentTarget.value })}
              required
            />
            <TextInput
              label="League"
              placeholder="e.g., Premier League"
              value={formData.league}
              onChange={(e) => setFormData({ ...formData, league: e.currentTarget.value })}
              required
            />
          </SimpleGrid>

          <SimpleGrid cols={2}>
            <TextInput
              label="Season"
              placeholder="e.g., 2024"
              value={formData.season}
              onChange={(e) => setFormData({ ...formData, season: e.currentTarget.value })}
              required
            />
            <TextInput
              label="Score"
              placeholder="e.g., 2-1"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: e.currentTarget.value })}
            />
          </SimpleGrid>

          <TextInput
            label="Duration"
            placeholder="e.g., 90:00"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.currentTarget.value })}
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
          
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={onClose}>Cancel</Button>
            <Button type="submit">Update Game</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
} 

 