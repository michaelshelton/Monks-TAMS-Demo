import React, { useState, useCallback, useEffect } from 'react';
import { 
  Container, 
  Title, 
  TextInput, 
  Stack, 
  Card, 
  Text, 
  Badge, 
  Group, 
  Box, 
  Button, 
  Grid,
  Select,
  Alert,
  rem,
  Tabs,
  Switch,
  Collapse,
  Divider,
  ActionIcon,
  Tooltip,
  Modal,
  Textarea,
  Code,
  Image
} from '@mantine/core';
import { 
  IconSearch, 
  IconUser, 
  IconClock, 
  IconTag, 
  IconFilter,
  IconInfoCircle,
  IconArrowRight,
  IconVideo,
  IconBrain,
  IconDatabase,
  IconTarget,
  IconEye,
  IconLink,
  IconSortAscending,
  IconSortDescending,
  IconRefresh,
  IconSettings,
  IconChartBar,
  IconBookmark,
  IconHistory,
  IconStar,
  IconDownload,
  IconShare,
  IconHeart,
  IconTrash,
  IconPlayerPlay
} from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import { BBCApiOptions } from '../services/api';
import BBCAdvancedFilter, { BBCFilterPatterns } from '../components/BBCAdvancedFilter';
import BBCPagination from '../components/BBCPagination';
import VideoPlayer from '../components/VideoPlayer';
import FlowAdvancedSearch, { FlowAdvancedSearchFilters } from '../components/FlowAdvancedSearch';
import { 
  performSearch, 
  getFootballGames, 
  SearchQuery, 
  SearchResult, 
  SearchResponse 
} from '../services/searchService';

// Enhanced search interface with BBC TAMS compliance
interface EnhancedSearchOptions extends BBCApiOptions {
  query: string;
  searchMode: 'basic' | 'advanced' | 'flow' | 'ai';
  searchStrategy: {
    sources: boolean;
    flows: boolean;
    segments: boolean;
    searchOrder: 'bbc-tams' | 'custom';
    customOrder?: ('sources' | 'flows' | 'segments')[];
    deduplication: boolean;
    relationshipMapping: boolean;
  };
  aiSearchEnabled: boolean;
  aiConfidence: number;
  playerNumber?: string;
  playerName?: string;
  team?: string;
  eventType?: string;
  timerange?: string;
  savedQueries: any[];
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [searchMode, setSearchMode] = useState<'basic' | 'advanced' | 'flow' | 'ai'>(
    (searchParams.get('searchMode') as 'basic' | 'advanced' | 'flow' | 'ai') || 'advanced'
  );
  const [playerNumber, setPlayerNumber] = useState(searchParams.get('playerNumber') || '');
  const [playerName, setPlayerName] = useState(searchParams.get('playerName') || '');
  const [team, setTeam] = useState(searchParams.get('team') || '');
  const [eventType, setEventType] = useState<string | undefined>(searchParams.get('eventType') || undefined);
  const [selectedGame, setSelectedGame] = useState<string | null>(searchParams.get('gameId') || '');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSearchStrategy, setShowSearchStrategy] = useState(false);
  const [aiSearchEnabled, setAiSearchEnabled] = useState(searchParams.get('aiSearchEnabled') === 'true');
  const [aiConfidence, setAiConfidence] = useState(parseFloat(searchParams.get('aiConfidence') || '0.7'));
  const [savedQueries, setSavedQueries] = useState<any[]>([]);
  const [showQueryHistory, setShowQueryHistory] = useState(false);
  const [savedFlowQueries, setSavedFlowQueries] = useState<Array<{ name: string; filters: FlowAdvancedSearchFilters }>>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [footballGames, setFootballGames] = useState<SearchResult[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<SearchResult | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  // BBC TAMS Search Strategy
  const [searchStrategy, setSearchStrategy] = useState(() => {
    const strategyParam = searchParams.get('searchStrategy');
    return strategyParam ? JSON.parse(strategyParam) : {
      sources: true,
      flows: true,
      segments: true,
      searchOrder: 'bbc-tams' as const,
      deduplication: true,
      relationshipMapping: true
    };
  });

  // BBC TAMS Advanced Filters
  const [bbcFilters, setBbcFilters] = useState<BBCFilterPatterns>(() => {
    return {
      label: searchParams.get('label') || '',
      format: searchParams.get('format') || '',
      codec: searchParams.get('codec') || '',
      tags: searchParams.get('tags') ? JSON.parse(searchParams.get('tags')!) : {},
      tagExists: {},
      timerange: searchParams.get('timerange') || '',
      page: '',
      limit: parseInt(searchParams.get('limit') || '50')
    };
  });

  // Flow Advanced Search Filters
  const [flowAdvancedFilters, setFlowAdvancedFilters] = useState<FlowAdvancedSearchFilters>(() => {
    return {
      query: searchParams.get('query') || '',
      label: searchParams.get('label') || '',
      description: searchParams.get('description') || '',
      tags: searchParams.get('tags') ? JSON.parse(searchParams.get('tags')!) : {},
      tagExists: {},
      format: searchParams.get('format') || '',
      codec: searchParams.get('codec') || '',
      timerange: searchParams.get('timerange') || '',
      startDate: null,
      endDate: null,
      startTime: '',
      endTime: '',
      duration: { min: null, max: null },
      flowType: searchParams.get('flowType') || '',
      status: searchParams.get('status') || '',
      priority: searchParams.get('priority') || '',
      segmentCount: { min: null, max: null },
      hasSegments: searchParams.get('hasSegments') === 'true',
      segmentTypes: searchParams.get('segmentTypes') ? JSON.parse(searchParams.get('segmentTypes')!) : [],
      searchMode: (searchParams.get('searchMode') as 'exact' | 'fuzzy' | 'semantic') || 'fuzzy',
      caseSensitive: searchParams.get('caseSensitive') === 'true',
      includeArchived: searchParams.get('includeArchived') === 'true',
      includeDeleted: searchParams.get('includeDeleted') === 'true',
      page: searchParams.get('page') || '',
      limit: parseInt(searchParams.get('limit') || '50')
    };
  });

  // Event types for football
  const eventTypes = [
    { value: 'goal', label: 'Goal' },
    { value: 'assist', label: 'Assist' },
    { value: 'save', label: 'Save' },
    { value: 'tackle', label: 'Tackle' },
    { value: 'free_kick', label: 'Free Kick' },
    { value: 'penalty', label: 'Penalty' },
    { value: 'yellow_card', label: 'Yellow Card' },
    { value: 'red_card', label: 'Red Card' }
  ];

  // Load football games on component mount
  useEffect(() => {
    loadFootballGames();
  }, []);

  // Load available football games from API
  const loadFootballGames = async () => {
    try {
      const games = await getFootballGames();
      setFootballGames(games);
    } catch (error) {
      console.error('Failed to load football games:', error);
      // Keep existing mock games as fallback
    }
  };

  // Update URL parameters when search state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('query', searchQuery);
    if (searchMode) params.set('searchMode', searchMode);
    if (aiSearchEnabled) params.set('aiSearchEnabled', 'true');
    if (aiConfidence !== 0.7) params.set('aiConfidence', aiConfidence.toString());
    if (playerNumber) params.set('playerNumber', playerNumber);
    if (playerName) params.set('playerName', playerName);
    if (team) params.set('team', team);
    if (eventType) params.set('eventType', eventType);
    if (selectedGame) params.set('gameId', selectedGame);
    
    // Add flow advanced filters to URL params
    if (searchMode === 'flow') {
      if (flowAdvancedFilters.timerange) params.set('timerange', flowAdvancedFilters.timerange);
      if (flowAdvancedFilters.format) params.set('format', flowAdvancedFilters.format);
      if (flowAdvancedFilters.codec) params.set('codec', flowAdvancedFilters.codec);
      if (flowAdvancedFilters.flowType) params.set('flowType', flowAdvancedFilters.flowType);
      if (flowAdvancedFilters.status) params.set('status', flowAdvancedFilters.status);
      if (flowAdvancedFilters.priority) params.set('priority', flowAdvancedFilters.priority);
      if (flowAdvancedFilters.hasSegments) params.set('hasSegments', 'true');
      if (flowAdvancedFilters.segmentTypes.length > 0) params.set('segmentTypes', JSON.stringify(flowAdvancedFilters.segmentTypes));
      if (flowAdvancedFilters.caseSensitive) params.set('caseSensitive', 'true');
      if (flowAdvancedFilters.includeArchived) params.set('includeArchived', 'true');
      if (flowAdvancedFilters.includeDeleted) params.set('includeDeleted', 'true');
      if (flowAdvancedFilters.tags && Object.keys(flowAdvancedFilters.tags).length > 0) {
        params.set('tags', JSON.stringify(flowAdvancedFilters.tags));
      }
    } else {
      // Standard BBC filters
      if (bbcFilters.timerange) params.set('timerange', bbcFilters.timerange);
      if (bbcFilters.format) params.set('format', bbcFilters.format);
      if (bbcFilters.codec) params.set('codec', bbcFilters.codec);
      if (bbcFilters.tags && Object.keys(bbcFilters.tags).length > 0) {
        params.set('tags', JSON.stringify(bbcFilters.tags));
      }
    }
    
    params.set('searchStrategy', JSON.stringify(searchStrategy));
    
    setSearchParams(params, { replace: true });
  }, [searchQuery, searchMode, aiSearchEnabled, aiConfidence, playerNumber, playerName, team, eventType, selectedGame, bbcFilters, flowAdvancedFilters, searchStrategy, setSearchParams]);

  // Handle search submission
  const handleSearch = async () => {
    if (!searchQuery.trim() && searchMode !== 'flow') return;
    
    setShowResults(true);
    setLoading(true);
    setError(null);
    
    try {
      // Build search query based on mode
      let searchQueryData: SearchQuery;
      
      if (searchMode === 'flow') {
        // Use flow advanced filters for flow search
        searchQueryData = {
          query: flowAdvancedFilters.query || searchQuery,
          searchMode: 'flow',
          aiSearchEnabled: false,
          aiConfidence: 0.7,
          playerNumber: '',
          playerName: '',
          team: '',
          eventType: undefined,
          timerange: flowAdvancedFilters.timerange,
          format: flowAdvancedFilters.format,
          codec: flowAdvancedFilters.codec,
          searchStrategy: {
            ...searchStrategy,
            flows: true,
            segments: true,
            sources: false // Focus on flows and segments for flow search
          }
        };
      } else {
        // Use standard search for other modes
        searchQueryData = {
          query: searchQuery,
          searchMode,
          aiSearchEnabled,
          aiConfidence,
          playerNumber,
          playerName,
          team,
          eventType,
          timerange: bbcFilters.timerange,
          format: bbcFilters.format,
          codec: bbcFilters.codec,
          searchStrategy
        };
      }

      // Perform real search
      const searchResponse = await performSearch(searchQueryData, currentPage, itemsPerPage);
      
      setSearchResults(searchResponse.results);
      setTotalResults(searchResponse.totalResults);
      setSearchTime(searchResponse.searchTime);
      
      console.log('Search completed:', searchResponse);
      
      // Debug: Log video URLs for debugging
      searchResponse.results.forEach((result, index) => {
        if (result.previewUrl) {
          console.log(`Result ${index + 1} (${result.type}): ${result.previewUrl}`);
        }
      });
      
    } catch (error) {
      console.error('Search failed:', error);
      setError(error instanceof Error ? error.message : 'Search failed');
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  // Handle quick search examples
  const handleQuickSearch = (example: string) => {
    setSearchQuery(example);
    setPlayerNumber('19');
    setPlayerName('Marcus Rashford');
    setTeam('Manchester United');
    setEventType('goal');
    setSelectedGame('game-001');
    setSearchMode('ai');
    setAiSearchEnabled(true);
    setShowResults(true);
    
    // Auto-trigger search for quick examples
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  // Save current search query
  const handleSaveQuery = useCallback(() => {
    const queryToSave = {
      id: Date.now().toString(),
      name: `Search ${new Date().toLocaleString()}`,
      query: searchQuery,
      filters: {
        playerNumber,
        playerName,
        team,
        eventType,
        selectedGame,
        bbcFilters,
        searchStrategy
      },
      searchMode,
      aiSearchEnabled,
      aiConfidence,
      timestamp: new Date().toISOString()
    };
    setSavedQueries(prev => [...prev, queryToSave]);
  }, [searchQuery, playerNumber, playerName, team, eventType, selectedGame, bbcFilters, searchStrategy, searchMode, aiSearchEnabled, aiConfidence]);

  // Load saved query
  const handleLoadQuery = useCallback((query: any) => {
    setSearchQuery(query.query);
    setPlayerNumber(query.filters.playerNumber || '');
    setPlayerName(query.filters.playerName || '');
    setTeam(query.filters.team || '');
    setEventType(query.filters.eventType || '');
    setSelectedGame(query.filters.selectedGame || '');
    setBbcFilters(query.filters.bbcFilters || {});
    setSearchStrategy(query.filters.searchStrategy || searchStrategy);
    setSearchMode(query.searchMode || 'advanced');
    setAiSearchEnabled(query.aiSearchEnabled || true);
    setAiConfidence(query.aiConfidence || 0.7);
    setShowResults(true);
  }, [searchStrategy]);

  // Handle result selection
  const toggleResultSelection = (resultId: string) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(resultId)) {
      newSelected.delete(resultId);
    } else {
      newSelected.add(resultId);
    }
    setSelectedResults(newSelected);
  };

  // Handle page change
  const handlePageChange = (cursor: string) => {
    const pageNum = parseInt(cursor) || 1;
    setCurrentPage(pageNum);
    
    // Re-run search with new page
    if (showResults && searchQuery.trim()) {
      handleSearch();
    }
  };

  // Handle limit change
  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
    
    // Re-run search with new limit
    if (showResults && searchQuery.trim()) {
      handleSearch();
    }
  };

  // Preview video with video player
  const handlePreview = (result: SearchResult) => {
    if (result.previewUrl) {
      setSelectedVideo(result);
      setShowVideoPlayer(true);
    } else {
      alert(`Preview: ${result.title}\nDuration: ${result.timing.duration}s\nNo preview URL available`);
    }
  };

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get filtered results for current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = searchResults.slice(startIndex, endIndex);

  // Mock pagination metadata for BBC TAMS (will be replaced with real data)
  const mockPaginationMeta = {
    limit: itemsPerPage,
    count: totalResults,
    timerange: '0:0_90:0', // 90 minutes game
    reverseOrder: false
  };

  // Check if search is ready
  const isSearchReady = searchMode === 'flow' || searchQuery.trim().length > 0;

  return (
    <Container size="xl" px="xl" py="xl" className="dark-bg-primary">
      <Stack gap="xl">
        {/* Header */}
        <Box ta="center">
          <Title order={1} mb="md" className="dark-text-primary" style={{ fontSize: rem(48), fontWeight: 700 }}>
            Advanced Content Discovery
          </Title>
          <Text size="lg" className="dark-text-secondary" style={{ maxWidth: '600px', margin: '0 auto' }}>
            Search across football content using TAMS v6.0 API with AI-powered discovery and advanced filtering
          </Text>
        </Box>

        {/* Search Mode Selection */}
        <Card withBorder p="lg" radius="lg" shadow="sm" className="search-interface">
          <Stack gap="md">
            <Box>
              <Title order={4} mb="xs" className="dark-text-primary">Search Mode</Title>
              <Text size="sm" className="dark-text-secondary">Choose your search approach</Text>
            </Box>
            
            <Tabs value={searchMode} onChange={(value) => setSearchMode(value as 'basic' | 'advanced' | 'flow' | 'ai')}>
              <Tabs.List>
                <Tabs.Tab value="basic" leftSection={<IconSearch size={16} />}>
                  Basic Search
                </Tabs.Tab>
                <Tabs.Tab value="advanced" leftSection={<IconFilter size={16} />}>
                  Advanced Filters
                </Tabs.Tab>
                <Tabs.Tab value="flow" leftSection={<IconDatabase size={16} />}>
                  Flow & Segment Search
                </Tabs.Tab>
                <Tabs.Tab value="ai" leftSection={<IconBrain size={16} />}>
                  AI Discovery
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>

            {/* AI Search Configuration */}
            {searchMode === 'ai' && (
              <Card withBorder p="md" radius="md" className="dark-modal">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text fw={500} className="dark-text-primary">AI-Powered Search</Text>
                    <Switch
                      checked={aiSearchEnabled}
                      onChange={(event) => setAiSearchEnabled(event.currentTarget.checked)}
                      label="Enable AI Search"
                    />
                  </Group>
                  
                  {aiSearchEnabled && (
                    <Box>
                      <Text size="sm" mb="xs" className="dark-text-secondary">AI Confidence Threshold</Text>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={aiConfidence}
                        onChange={(e) => setAiConfidence(parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                        className="dark-video-timeline"
                      />
                      <Text size="xs" className="dark-text-tertiary" ta="center">
                        {Math.round(aiConfidence * 100)}% confidence
                      </Text>
                    </Box>
                  )}
                </Stack>
              </Card>
            )}
          </Stack>
        </Card>

        {/* Main Search Interface */}
        <Card withBorder p="xl" radius="lg" shadow="sm" className="search-interface">
          <Stack gap="lg">
            <Box ta="center">
              <Title order={3} mb="xs" className="dark-text-primary">Find Football Moments</Title>
              <Text className="dark-text-secondary">Search for specific players, events, or time ranges</Text>
            </Box>

            {/* Search Input */}
            <TextInput
              size="lg"
              placeholder="e.g., Show me all times when player number 19 was visible"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSection={<IconSearch size={20} />}
              className="search-input"
              rightSection={
                <Group gap="xs">
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => setShowQueryHistory(true)}
                    leftSection={<IconHistory size={16} />}
                    className="dark-button"
                  >
                    History
                  </Button>
                  <Button
                    variant="filled"
                    size="sm"
                    onClick={handleSearch}
                    disabled={!isSearchReady || loading}
                    loading={loading}
                    rightSection={<IconArrowRight size={16} />}
                    className="dark-button primary"
                  >
                    {loading ? 'Searching...' : (searchMode === 'flow' ? 'Search Flows' : 'Search')}
                  </Button>
                </Group>
              }
            />

            {/* Basic Search Options */}
            {searchMode === 'basic' && (
              <Grid gutter="md">
                <Grid.Col span={3}>
                  <TextInput
                    label="Player Number"
                    placeholder="e.g., 19"
                    value={playerNumber}
                    onChange={(e) => setPlayerNumber(e.target.value)}
                    leftSection={<IconUser size={16} />}
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <TextInput
                    label="Player Name"
                    placeholder="e.g., Marcus Rashford"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    leftSection={<IconUser size={16} />}
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <TextInput
                    label="Team"
                    placeholder="e.g., Manchester United"
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    leftSection={<IconTag size={16} />}
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <Select
                    label="Event Type"
                    placeholder="Select event"
                    data={eventTypes}
                    value={eventType || null}
                    onChange={(value) => setEventType(value || undefined)}
                    leftSection={<IconFilter size={16} />}
                    clearable
                  />
                </Grid.Col>
              </Grid>
            )}

            {/* Advanced Filters */}
            {searchMode === 'advanced' && (
              <Box>
                <Button
                  variant="light"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  leftSection={<IconFilter size={16} />}
                  mb="md"
                >
                  {showAdvancedFilters ? 'Hide' : 'Show'} Advanced TAMS Filters
                </Button>
                
                <Collapse in={showAdvancedFilters}>
                  <BBCAdvancedFilter
                    filters={bbcFilters}
                    onFiltersChange={setBbcFilters}
                    onReset={() => setBbcFilters({
                      label: '',
                      format: '',
                      codec: '',
                      tags: {},
                      tagExists: {},
                      timerange: '',
                      page: '',
                      limit: 50
                    })}
                    onApply={() => console.log('Applying BBC filters:', bbcFilters)}
                  />
                </Collapse>
              </Box>
            )}

            {/* Flow Advanced Search */}
            {searchMode === 'flow' && (
              <FlowAdvancedSearch
                filters={flowAdvancedFilters}
                onFiltersChange={setFlowAdvancedFilters}
                onSearch={handleSearch}
                onReset={() => {
                  setFlowAdvancedFilters({
                    query: '',
                    label: '',
                    description: '',
                    tags: {},
                    tagExists: {},
                    format: '',
                    codec: '',
                    timerange: '',
                    startDate: null,
                    endDate: null,
                    startTime: '',
                    endTime: '',
                    duration: { min: null, max: null },
                    flowType: '',
                    status: '',
                    priority: '',
                    segmentCount: { min: null, max: null },
                    hasSegments: false,
                    segmentTypes: [],
                    searchMode: 'fuzzy',
                    caseSensitive: false,
                    includeArchived: false,
                    includeDeleted: false,
                    page: '',
                    limit: 50
                  });
                }}
                onSaveQuery={(name, filters) => {
                  setSavedFlowQueries(prev => [...prev, { name, filters }]);
                }}
                onLoadQuery={(name) => {
                  const query = savedFlowQueries.find(q => q.name === name);
                  if (query) {
                    setFlowAdvancedFilters(query.filters);
                  }
                }}
                savedQueries={savedFlowQueries}
                loading={loading}
                showAdvanced={true}
                onToggleAdvanced={() => {}}
              />
            )}

            {/* Search Strategy Configuration */}
            <Box>
              <Button
                variant="light"
                onClick={() => setShowSearchStrategy(!showSearchStrategy)}
                leftSection={<IconSettings size={16} />}
                mb="md"
              >
                {showSearchStrategy ? 'Hide' : 'Show'} Search Strategy
              </Button>
              
              <Collapse in={showSearchStrategy}>
                <Card withBorder p="md" radius="md">
                  <Stack gap="md">
                    <Text fw={500}>TAMS Search Strategy</Text>
                    
                    <Grid gutter="md">
                      <Grid.Col span={4}>
                        <Switch
                          label="Search Sources"
                          checked={searchStrategy.sources}
                          onChange={(event) => setSearchStrategy((prev: any) => ({ ...prev, sources: event.currentTarget.checked }))}
                        />
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <Switch
                          label="Search Flows"
                          checked={searchStrategy.flows}
                          onChange={(event) => setSearchStrategy((prev: any) => ({ ...prev, flows: event.currentTarget.checked }))}
                        />
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <Switch
                          label="Search Segments"
                          checked={searchStrategy.segments}
                          onChange={(event) => setSearchStrategy((prev: any) => ({ ...prev, segments: event.currentTarget.checked }))}
                        />
                      </Grid.Col>
                    </Grid>

                    <Grid gutter="md">
                      <Grid.Col span={6}>
                        <Switch
                          label="Enable Deduplication"
                          checked={searchStrategy.deduplication}
                          onChange={(event) => setSearchStrategy((prev: any) => ({ ...prev, deduplication: event.currentTarget.checked }))}
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Switch
                          label="Map Relationships"
                          checked={searchStrategy.relationshipMapping}
                          onChange={(event) => setSearchStrategy((prev: any) => ({ ...prev, relationshipMapping: event.currentTarget.checked }))}
                        />
                      </Grid.Col>
                    </Grid>

                    <Select
                      label="Search Order"
                      data={[
                        { value: 'bbc-tams', label: 'TAMS Standard (Sources → Flows → Segments)' },
                        { value: 'custom', label: 'Custom Order' }
                      ]}
                      value={searchStrategy.searchOrder}
                      onChange={(value) => setSearchStrategy((prev: any) => ({ ...prev, searchOrder: value as 'bbc-tams' | 'custom' }))}
                    />
                  </Stack>
                </Card>
              </Collapse>
            </Box>

            {/* Quick Search Examples */}
            <Box>
              <Text fw={500} mb="xs" className="dark-text-primary">Quick Search Examples</Text>
              <Group gap="xs">
                {searchMode === 'flow' ? (
                  <>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => {
                        setFlowAdvancedFilters(prev => ({
                          ...prev,
                          flowType: 'recorded',
                          hasSegments: true,
                          segmentTypes: ['video', 'highlight']
                        }));
                      }}
                      className="dark-button"
                    >
                      Recorded Flows with Video Segments
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => {
                        setFlowAdvancedFilters(prev => ({
                          ...prev,
                          status: 'active',
                          priority: 'high'
                        }));
                      }}
                      className="dark-button"
                    >
                      Active High Priority Flows
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => {
                        setFlowAdvancedFilters(prev => ({
                          ...prev,
                          format: 'h264',
                          duration: { min: 300, max: 3600 } // 5 min to 1 hour
                        }));
                      }}
                      className="dark-button"
                    >
                      H.264 Flows (5min-1hr)
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => handleQuickSearch('Show me all times when player number 19 was visible')}
                      className="dark-button"
                    >
                      Player 19 Highlights
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => handleQuickSearch('Find all goals scored by Marcus Rashford')}
                      className="dark-button"
                    >
                      Rashford Goals
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => handleQuickSearch('Show Manchester United goals from January 2024')}
                      className="dark-button"
                    >
                      Man U Goals
                    </Button>
                  </>
                )}
                <Button
                  variant="light"
                  size="sm"
                  onClick={searchMode === 'flow' ? () => {
                    setSavedFlowQueries(prev => [...prev, { 
                      name: `Flow Search ${new Date().toLocaleString()}`, 
                      filters: flowAdvancedFilters 
                    }]);
                  } : handleSaveQuery}
                  leftSection={<IconBookmark size={16} />}
                  className="dark-button success"
                >
                  Save Search
                </Button>
              </Group>
            </Box>
          </Stack>
        </Card>

        {/* Search Results - Inline */}
        {showResults && (
          <Card withBorder p="xl" radius="lg" shadow="sm" className="search-interface">
            <Stack gap="lg">
              {/* Results Header */}
              <Box>
                <Group justify="space-between" align="flex-start">
                  <Box>
                    <Title order={3} mb="xs" className="dark-text-primary">Search Results</Title>
                    <Text className="dark-text-secondary" size="sm">
                      Found {totalResults} results
                      {searchMode === 'flow' ? ' for flow search' : ` for "${searchQuery}"`}
                      {searchTime > 0 && ` in ${searchTime}ms`}
                    </Text>
                    <Text size="xs" className="dark-text-tertiary" mt="xs">
                      Search Mode: {searchMode} • AI: {aiSearchEnabled ? 'Enabled' : 'Disabled'}
                      {aiSearchEnabled && ` • Confidence: ${Math.round(aiConfidence * 100)}%`}
                      {searchMode === 'flow' && flowAdvancedFilters.flowType && ` • Type: ${flowAdvancedFilters.flowType}`}
                      {searchMode === 'flow' && flowAdvancedFilters.status && ` • Status: ${flowAdvancedFilters.status}`}
                      {searchMode === 'flow' && flowAdvancedFilters.hasSegments && ` • Has Segments: Yes`}
                    </Text>
                  </Box>
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => setShowResults(false)}
                    className="dark-button"
                  >
                    Hide Results
                  </Button>
                </Group>
              </Box>

              {/* Error Display */}
              {error && (
                <Alert title="Search Error" color="red">
                  <Text>{error}</Text>
                  <Button 
                    variant="light" 
                    size="sm" 
                    mt="xs"
                    onClick={handleSearch}
                  >
                    Try Again
                  </Button>
                </Alert>
              )}

              {/* Loading State */}
              {loading && (
                <Box ta="center" py="xl">
                  <Text>Searching TAMS API...</Text>
                </Box>
              )}

              {/* Results Count and Actions */}
              {!loading && !error && (
                <Group justify="space-between" align="center">
                  <Text size="sm" c="dimmed">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalResults)} of {totalResults} results
                  </Text>
                  
                  {selectedResults.size > 0 && (
                    <Group gap="xs">
                      <Text size="sm" c="dimmed">
                        {selectedResults.size} selected
                      </Text>
                      <Button size="sm" variant="light" color="red">
                        Delete Selected
                      </Button>
                      <Button size="sm" variant="light">
                        Export Selected
                      </Button>
                    </Group>
                  )}
                </Group>
              )}

              {/* Search Results Grid */}
              {!loading && !error && (
                <Grid gutter="md">
                  {paginatedResults.map((result) => (
                    <Grid.Col key={result.id} span={6}>
                      <Card 
                        withBorder 
                        p="md" 
                        radius="md"
                        style={{ 
                          borderColor: selectedResults.has(result.id) ? '#228be6' : undefined,
                          borderWidth: selectedResults.has(result.id) ? '2px' : '1px'
                        }}
                      >
                        <Stack gap="sm">
                          {/* Result Header */}
                          <Group justify="space-between" align="flex-start">
                            <Box style={{ flex: 1 }}>
                              <Text fw={500} size="sm" lineClamp={2}>
                                {result.title}
                              </Text>
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {result.description}
                              </Text>
                              <Badge variant="light" color="gray" size="xs" mt="xs">
                                {result.type}
                              </Badge>
                            </Box>
                            <ActionIcon
                              size="sm"
                              variant="light"
                              onClick={() => toggleResultSelection(result.id)}
                              color={selectedResults.has(result.id) ? 'blue' : 'gray'}
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                          </Group>

                          {/* Game Info */}
                          <Box>
                            <Badge variant="light" color="blue" size="sm" mb="xs">
                              {result.gameInfo.homeTeam} vs {result.gameInfo.awayTeam}
                            </Badge>
                            <Text size="xs" c="dimmed">
                              {result.gameInfo.date} • {result.gameInfo.venue}
                              {result.gameInfo.score && ` • ${result.gameInfo.score}`}
                            </Text>
                          </Box>

                          {/* Player Info */}
                          {result.playerInfo && (
                            <Box>
                              <Group gap="xs" wrap="wrap">
                                <Badge variant="light" color="green" size="xs">
                                  #{result.playerInfo.number} {result.playerInfo.name}
                                </Badge>
                                <Badge variant="light" color="gray" size="xs">
                                  {result.playerInfo.position}
                                </Badge>
                              </Group>
                            </Box>
                          )}

                          {/* Timing */}
                          <Box>
                            <Group gap="xs" align="center">
                              <IconClock size={14} />
                              <Text size="xs" c="dimmed">
                                {result.timing.start} - {result.timing.end} ({formatDuration(result.timing.duration)})
                              </Text>
                            </Group>
                          </Box>

                          {/* Metadata */}
                          <Box>
                            <Group gap="xs" wrap="wrap">
                              <Badge variant="light" color="gray" size="xs">
                                {result.metadata.format}
                              </Badge>
                              <Badge variant="light" color="gray" size="xs">
                                {result.metadata.quality}
                              </Badge>
                              {Object.entries(result.metadata.tags).slice(0, 3).map(([key, value]) => (
                                <Badge key={key} variant="light" color="gray" size="xs">
                                  {key}: {String(value)}
                                </Badge>
                              ))}
                            </Group>
                          </Box>

                          {/* Actions */}
                          <Group gap="xs">
                            <Button
                              size="xs"
                              variant="light"
                              leftSection={<IconPlayerPlay size={14} />}
                              onClick={() => handlePreview(result)}
                            >
                              Preview
                            </Button>
                            <Button
                              size="xs"
                              variant="light"
                              leftSection={<IconEye size={14} />}
                            >
                              View Details
                            </Button>
                          </Group>
                        </Stack>
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>
              )}

              {/* No Results */}
              {!loading && !error && paginatedResults.length === 0 && (
                <Card withBorder p="xl" ta="center">
                  <Stack gap="md">
                    <IconSearch size={48} color="var(--mantine-color-gray-4)" />
                    <Text size="lg" c="dimmed">No results found</Text>
                    <Text size="sm" c="dimmed">
                      Try adjusting your search filters or search criteria
                    </Text>
                  </Stack>
                </Card>
              )}

              {/* BBC TAMS Pagination */}
              {!loading && !error && totalResults > 0 && (
                <Card withBorder p="md">
                  <BBCPagination
                    paginationMeta={mockPaginationMeta}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                    showBBCMetadata={true}
                    showLimitSelector={true}
                    showNavigationButtons={true}
                  />
                </Card>
              )}
            </Stack>
          </Card>
        )}

        {/* BBC TAMS Search Strategy Info Box */}
        <Card withBorder p="xl" radius="lg" shadow="sm" className="dark-info-box">
          <Stack gap="lg">
            <Box>
              <Title order={3} mb="sm" className="dark-text-primary">TAMS v6.0 Search Strategy</Title>
              <Text size="sm" className="dark-text-secondary" mb="md">
                Advanced search capabilities following BBC TAMS specification with AI-powered content discovery
              </Text>
            </Box>

            <Grid gutter="md">
              <Grid.Col span={6}>
                <Box>
                  <Text fw={500} mb="xs">🔍 Search Modes:</Text>
                  <Group gap="xs" wrap="wrap" mb="md">
                    <Badge variant="light" color="blue">Basic Search</Badge>
                    <Badge variant="light" color="green">Advanced Filters</Badge>
                    <Badge variant="light" color="purple">AI Discovery</Badge>
                  </Group>
                  
                  <Text fw={500} mb="xs">🎯 Entity Types:</Text>
                  <Group gap="xs" wrap="wrap" mb="md">
                    <Badge variant="light" color="green">Sources</Badge>
                    <Badge variant="light" color="blue">Flows</Badge>
                    <Badge variant="light" color="orange">Segments</Badge>
                  </Group>
                </Box>
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Box>
                  <Text fw={500} mb="xs">🚀 Advanced Features:</Text>
                  <Group gap="xs" wrap="wrap" mb="md">
                    <Badge variant="light" color="green">Tag-based Filtering</Badge>
                    <Badge variant="light" color="blue">Temporal Queries</Badge>
                    <Badge variant="light" color="purple">AI Content Recognition</Badge>
                    <Badge variant="light" color="orange">Relationship Mapping</Badge>
                  </Group>
                  
                  <Text fw={500} mb="xs">📊 BBC TAMS Compliance:</Text>
                  <Group gap="xs" wrap="wrap">
                    <Badge variant="light" color="green">v6.0 Specification</Badge>
                    <Badge variant="light" color="blue">Cursor Pagination</Badge>
                    <Badge variant="light" color="purple">Link Headers</Badge>
                  </Group>
                </Box>
              </Grid.Col>
            </Grid>

            <Alert icon={<IconInfoCircle size={16} />} title="Search Strategy Benefits" color="blue">
              <Text size="sm">
                <strong>Multi-Entity Search:</strong> Search across sources, flows, and segments simultaneously<br />
                <strong>AI-Powered Discovery:</strong> Intelligent content recognition and relationship mapping<br />
                <strong>BBC TAMS Compliance:</strong> Full adherence to BBC TAMS v6.0 specification<br />
                <strong>Advanced Filtering:</strong> Complex tag patterns and temporal queries<br />
                <strong>Performance Optimization:</strong> Deduplication and relationship mapping for efficient results
              </Text>
            </Alert>
          </Stack>
        </Card>

        {/* Available Games */}
        <Card withBorder p="xl" radius="lg" shadow="sm" className="search-interface">
          <Stack gap="lg">
            <Box>
              <Title order={3} mb="xs" className="dark-text-primary">Available Football Games</Title>
              <Text className="dark-text-secondary">Select a specific game to search within, or search across all games</Text>
            </Box>

            <Grid gutter="md">
              {footballGames.map((game) => (
                <Grid.Col key={game.id} span={4}>
                  <Card 
                    withBorder 
                    p="md" 
                    radius="md"
                    style={{ 
                      cursor: 'pointer',
                      borderColor: selectedGame === game.id ? '#228be6' : undefined,
                      borderWidth: selectedGame === game.id ? '2px' : '1px'
                    }}
                    onClick={() => setSelectedGame(selectedGame === game.id ? null : game.id)}
                  >
                    <Stack gap="sm">
                      <Group justify="space-between" align="center">
                        <Badge variant="filled" color="blue" size="sm">
                          {game.gameInfo.homeTeam} vs {game.gameInfo.awayTeam}
                        </Badge>
                        {game.gameInfo.score && (
                          <Badge variant="light" color="green" size="sm">
                            {game.gameInfo.score}
                          </Badge>
                        )}
                      </Group>
                      
                      <Text size="sm" c="dimmed">
                        {game.gameInfo.date} • {game.gameInfo.venue}
                      </Text>
                      
                      <Text size="xs" c="dimmed">
                        Duration: {formatDuration(game.timing.duration)} • {game.type}
                      </Text>
                      
                      <Group gap="xs" wrap="wrap">
                        {Object.entries(game.metadata.tags).slice(0, 3).map(([key, value]) => (
                          <Badge key={key} variant="light" color="gray" size="xs">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </Group>
                    </Stack>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>
        </Card>

        {/* Search Flow Explanation */}
        <Card withBorder p="lg" radius="md" className="dark-info-box">
          <Stack gap="md">
            <Title order={4} className="dark-text-primary">How Advanced Search Works</Title>
            <Grid gutter="md">
              <Grid.Col span={3}>
                <Box ta="center">
                  <IconSearch size={32} color="blue" />
                  <Text fw={500} size="sm" mt="xs" className="dark-text-primary">1. Choose Mode</Text>
                  <Text size="xs" className="dark-text-secondary">Basic, Advanced, or AI-powered</Text>
                </Box>
              </Grid.Col>
              <Grid.Col span={3}>
                <Box ta="center">
                  <IconFilter size={32} color="blue" />
                  <Text fw={500} size="sm" mt="xs" className="dark-text-primary">2. Configure Strategy</Text>
                  <Text size="xs" className="dark-text-secondary">Set search scope and filters</Text>
                </Box>
              </Grid.Col>
              <Grid.Col span={3}>
                <Box ta="center">
                  <IconBrain size={32} color="blue" />
                  <Text fw={500} size="sm" mt="xs" className="dark-text-primary">3. AI Discovery</Text>
                  <Text size="xs" className="dark-text-secondary">Intelligent content recognition</Text>
                </Box>
              </Grid.Col>
              <Grid.Col span={3}>
                <Box ta="center">
                  <IconVideo size={32} color="blue" />
                  <Text fw={500} size="sm" mt="xs" className="dark-text-primary">4. View Results</Text>
                  <Text size="xs" className="dark-text-secondary">Multi-entity search results</Text>
                </Box>
              </Grid.Col>
            </Grid>
          </Stack>
        </Card>

        {/* Query History Modal */}
        <Modal
          opened={showQueryHistory}
          onClose={() => setShowQueryHistory(false)}
          title="Saved Search Queries"
          size="lg"
        >
          <Stack gap="md">
            {savedQueries.length === 0 ? (
              <Text c="dimmed" ta="center">No saved queries yet</Text>
            ) : (
              savedQueries.map((query) => (
                <Card key={query.id} withBorder p="md" radius="md">
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text fw={500}>{query.name}</Text>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => handleLoadQuery(query)}
                        >
                          Load
                        </Button>
                        <ActionIcon
                          size="sm"
                          variant="light"
                          color="red"
                          onClick={() => setSavedQueries((prev: any[]) => prev.filter(q => q.id !== query.id))}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Group>
                    <Text size="sm" c="dimmed">{query.query}</Text>
                    <Text size="xs" c="dimmed">
                      {new Date(query.timestamp).toLocaleString()} • {query.searchMode} mode
                    </Text>
                  </Stack>
                </Card>
              ))
            )}
          </Stack>
        </Modal>

        {/* Video Player Modal */}
        <Modal
          opened={showVideoPlayer}
          onClose={() => setShowVideoPlayer(false)}
          title="Video Player"
          size="xl"
          fullScreen
        >
          {selectedVideo && (
            <VideoPlayer
              videoUrl={selectedVideo.previewUrl || ''}
              title={selectedVideo.title}
              description={selectedVideo.description}
              metadata={{
                format: selectedVideo.metadata.format,
                quality: selectedVideo.metadata.quality,
                duration: selectedVideo.timing.duration,
                tags: selectedVideo.metadata.tags
              }}
              onClose={() => setShowVideoPlayer(false)}
              showControls={true}
            />
          )}
        </Modal>
      </Stack>
    </Container>
  );
} 