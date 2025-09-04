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
  Image,
  Table
} from '@mantine/core';
import { 
  IconSearch, 
  IconUser, 
  IconClock, 
  IconTag, 
  IconFilter,
  IconInfoCircle,
  IconAlertCircle,
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
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BBCApiOptions } from '../services/api';
import BBCAdvancedFilter, { BBCFilterPatterns } from '../components/BBCAdvancedFilter';
import BBCPagination from '../components/BBCPagination';
import VideoPlayer from '../components/VideoPlayer';
import FlowAdvancedSearch, { FlowAdvancedSearchFilters } from '../components/FlowAdvancedSearch';
import { 
  performSearch, 
  SearchQuery, 
  SearchResult, 
  SearchResponse 
} from '../services/searchService';

// Simplified search interface aligned with VAST TAMS API
interface TAMSSearchOptions {
  query: string;
  searchType: 'sources' | 'flows' | 'segments';
  filters: {
    // Sources filters
    label?: string;
    format?: string;
    
    // Flows filters  
    source_id?: string;
    timerange?: string;
    codec?: string;
    frame_width?: number;
    frame_height?: number;
    
    // Tag filters (for all types)
    tags?: Record<string, string>;
    tagExists?: Record<string, boolean>;
    
    // Pagination
    page?: string;
    limit?: number;
  };
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [searchType, setSearchType] = useState<'sources' | 'flows' | 'segments'>(
    (searchParams.get('searchType') as 'sources' | 'flows' | 'segments') || 'flows'
  );
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [selectedVideo, setSelectedVideo] = useState<SearchResult | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  // Search filters aligned with VAST TAMS API
  const [filters, setFilters] = useState({
    label: searchParams.get('label') || '',
    format: searchParams.get('format') || '',
    source_id: searchParams.get('source_id') || '',
    timerange: searchParams.get('timerange') || '',
    codec: searchParams.get('codec') || '',
    frame_width: searchParams.get('frame_width') ? parseInt(searchParams.get('frame_width')!) : undefined,
    frame_height: searchParams.get('frame_height') ? parseInt(searchParams.get('frame_height')!) : undefined,
    tags: searchParams.get('tags') ? JSON.parse(searchParams.get('tags')!) : {},
    tagExists: searchParams.get('tagExists') ? JSON.parse(searchParams.get('tagExists')!) : {},
    tagName: searchParams.get('tagName') || '',
    tagValue: searchParams.get('tagValue') || '',
    page: searchParams.get('page') || '',
    limit: parseInt(searchParams.get('limit') || '50')
  });



  // Update URL parameters when search state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('query', searchQuery);
    if (searchType) params.set('searchType', searchType);
    if (filters.label) params.set('label', filters.label);
    if (filters.format) params.set('format', filters.format);
    if (filters.source_id) params.set('source_id', filters.source_id);
    if (filters.timerange) params.set('timerange', filters.timerange);
    if (filters.codec) params.set('codec', filters.codec);
    if (filters.frame_width) params.set('frame_width', filters.frame_width.toString());
    if (filters.frame_height) params.set('frame_height', filters.frame_height.toString());
    if (Object.keys(filters.tags).length > 0) {
      try {
        params.set('tags', JSON.stringify(filters.tags));
      } catch (e) {
        console.warn('Failed to serialize tags:', e);
      }
    }
    if (Object.keys(filters.tagExists).length > 0) {
      try {
        params.set('tagExists', JSON.stringify(filters.tagExists));
      } catch (e) {
        console.warn('Failed to serialize tagExists:', e);
      }
    }
    if (filters.tagName) params.set('tagName', filters.tagName);
    if (filters.tagValue) params.set('tagValue', filters.tagValue);
    if (filters.page) params.set('page', filters.page);
    if (filters.limit !== 50) params.set('limit', filters.limit.toString());
    
    setSearchParams(params, { replace: true });
  }, [searchQuery, searchType, filters, setSearchParams]);

  // Handle search submission
  const handleSearch = async () => {
    if (!isSearchReady) return;
    
    setShowResults(true);
    setLoading(true);
    setError(null);
    
    try {
      // Build search query based on VAST TAMS API
      const searchQueryData: SearchQuery = {
        query: searchQuery,
        searchMode: searchType === 'sources' ? 'basic' : 'flow',
        aiSearchEnabled: false,
        aiConfidence: 0.7,
        // playerNumber: '', // Not used in simplified version
        // playerName: '', // Not used in simplified version
        // team: '', // Not used in simplified version
        // eventType: filters.format, // Not supported in SearchQuery interface
        timerange: filters.timerange,
        format: filters.format,
        codec: filters.codec,
        searchStrategy: {
          sources: searchType === 'sources',
          flows: searchType === 'flows',
          segments: searchType === 'segments',
          searchOrder: 'bbc-tams',
          deduplication: true,
          relationshipMapping: true
        }
      };

      // Add tag filtering if tagName and tagValue are provided
      if (filters.tagName && filters.tagValue) {
        searchQueryData.searchStrategy = {
          ...searchQueryData.searchStrategy,
          // This will be handled in the searchService to add tag.* parameters
        };
      }

      console.log('🔍 Search Component: About to call performSearch with:', searchQueryData);
      const searchResponse = await performSearch(searchQueryData, currentPage, itemsPerPage);
      
      console.log('🔍 Search Component: Received search response:', searchResponse);
      
      setSearchResults(searchResponse.results);
      setTotalResults(searchResponse.totalResults);
      setSearchTime(searchResponse.searchTime);
      
    } catch (error) {
      console.error('Search failed:', error);
      setError(error instanceof Error ? error.message : 'Search failed');
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

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
    if (showResults && isSearchReady) {
      handleSearch();
    }
  };

  // Handle limit change
  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
    
    // Re-run search with new limit
    if (showResults && isSearchReady) {
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

  const handleResultClick = (result: SearchResult) => {
    // Navigate to the appropriate detail page based on result type
    if (result.type === 'source') {
      navigate(`/sources/${result.id}`);
    } else if (result.type === 'flow') {
      navigate(`/flows/${result.id}`);
    } else if (result.type === 'segment') {
      // For segments, we'll navigate to the flows page since we don't have flowId
      // Users can then find the specific flow that contains this segment
      navigate('/flows');
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
    timerange: '0:0_90:0', // 90 minutes
    reverseOrder: false
  };

  // Check if search is ready
  const isSearchReady = searchQuery.trim().length > 0 || 
                       filters.label.trim().length > 0 || 
                       filters.format.trim().length > 0 ||
                       filters.source_id.trim().length > 0 ||
                       filters.timerange.trim().length > 0 ||
                       filters.codec.trim().length > 0 ||
                       filters.tagName.trim().length > 0 ||
                       filters.tagValue.trim().length > 0 ||
                       Object.keys(filters.tags).length > 0;

  return (
    <Container size="xl" px="xl" py="xl">
      <Stack gap="xl">
        {/* Title and Header */}
        <Group justify="space-between" mb="lg">
          <Box>
            <Title order={2}>Content Discovery</Title>
            <Text c="dimmed" size="sm" mt="xs">
              Search across Sources, Flows, and Segments using VAST TAMS API
            </Text>
          </Box>
          <Group>
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={() => {
                setError(null);
                if (isSearchReady) {
                  handleSearch();
                }
              }}
              loading={loading}
            >
              Refresh
            </Button>
          </Group>
        </Group>

        {/* Error Alert */}
        {error && (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            color="red" 
            title="Search Error"
            withCloseButton
            onClose={() => setError(null)}
            mb="md"
          >
            {error}
          </Alert>
        )}

        {/* VAST TAMS Info */}
        {!error && (
          <Alert 
            icon={<IconInfoCircle size={16} />} 
            color="blue" 
            title="What is Search in TAMS?"
            mb="md"
          >
            <Text size="sm" mb="xs">
              <strong>Search</strong> is the content discovery engine in the TAMS system - it allows you to find and explore 
              sources, flows, and segments across your entire media library using powerful filtering and query capabilities.
            </Text>
            <Text size="sm" mb="xs">
              You can search by text, filter by format, codec, time ranges, tags, and technical specifications. 
              Search helps you quickly locate specific content and understand relationships between different media objects.
            </Text>
          </Alert>
        )}


        {/* Search Type Selection */}
        <Card withBorder p="lg" radius="lg" shadow="sm" className="search-interface">
          <Stack gap="md">
            <Box>
              <Title order={4} mb="xs" className="dark-text-primary">Search Type</Title>
              <Text size="sm" className="dark-text-secondary">Choose what type of content to search</Text>
            </Box>
            
            <Tabs value={searchType} onChange={(value) => setSearchType(value as 'sources' | 'flows' | 'segments')}>
              <Tabs.List>
                <Tabs.Tab value="sources" leftSection={<IconDatabase size={16} />}>
                  Sources
                </Tabs.Tab>
                <Tabs.Tab value="flows" leftSection={<IconVideo size={16} />}>
                  Flows
                </Tabs.Tab>
                <Tabs.Tab value="segments" leftSection={<IconTarget size={16} />}>
                  Segments
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>
          </Stack>
        </Card>

        {/* Main Search Interface */}
        <Card withBorder p="xl" radius="lg" shadow="sm" className="search-interface">
          <Stack gap="lg">
            <Box ta="center">
              <Title order={3} mb="xs" className="dark-text-primary">Search {searchType.charAt(0).toUpperCase() + searchType.slice(1)}</Title>
              <Text className="dark-text-secondary">
                {searchType === 'sources' && 'Search for media sources by label and format'}
                {searchType === 'flows' && 'Search for media flows with time range and format filtering'}
                {searchType === 'segments' && 'Search for media segments within specific time ranges'}
              </Text>
            </Box>

            {/* Search Input */}
            <TextInput
              size="lg"
              placeholder={`Search ${searchType}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSection={<IconSearch size={20} />}
              className="search-input"
              rightSection={
                <Button
                  variant="filled"
                  size="sm"
                  onClick={handleSearch}
                  disabled={!isSearchReady || loading}
                  loading={loading}
                  rightSection={<IconArrowRight size={16} />}
                  className="dark-button primary"
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              }
            />

            {/* Search Filters */}
            <Grid gutter="md">
              {/* Common filters */}
              <Grid.Col span={4}>
                <TextInput
                  label="Label"
                  placeholder="Filter by label"
                  value={filters.label}
                  onChange={(e) => setFilters(prev => ({ ...prev, label: e.target.value }))}
                  leftSection={<IconTag size={16} />}
                />
              </Grid.Col>
              
              <Grid.Col span={4}>
                <Select
                  label="Format"
                  placeholder="Select format"
                  data={[
                    { value: 'urn:x-nmos:format:video', label: 'Video' },
                    { value: 'urn:x-nmos:format:audio', label: 'Audio' },
                    { value: 'urn:x-nmos:format:data', label: 'Data' },
                    { value: 'urn:x-nmos:format:mux', label: 'Mux' }
                  ]}
                  value={filters.format || null}
                  onChange={(value) => setFilters(prev => ({ ...prev, format: value || '' }))}
                  leftSection={<IconFilter size={16} />}
                  clearable
                />
              </Grid.Col>

              {/* Flow-specific filters */}
              {searchType === 'flows' && (
                <>
                  <Grid.Col span={4}>
                    <TextInput
                      label="Source ID"
                      placeholder="Enter source ID"
                      value={filters.source_id}
                      onChange={(e) => setFilters(prev => ({ ...prev, source_id: e.target.value }))}
                      leftSection={<IconDatabase size={16} />}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={4}>
                    <TextInput
                      label="Time Range"
                      placeholder="e.g., [0:0_10:0)"
                      value={filters.timerange}
                      onChange={(e) => setFilters(prev => ({ ...prev, timerange: e.target.value }))}
                      leftSection={<IconClock size={16} />}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={4}>
                    <Select
                      label="Codec"
                      placeholder="Select codec"
                      data={[
                        { value: 'urn:x-nmos:codec:h264', label: 'H.264' },
                        { value: 'urn:x-nmos:codec:prores', label: 'ProRes' },
                        { value: 'urn:x-nmos:codec:dnxhd', label: 'DNxHD' },
                        { value: 'urn:x-nmos:codec:mjpeg', label: 'MJPEG' }
                      ]}
                      value={filters.codec || null}
                      onChange={(value) => setFilters(prev => ({ ...prev, codec: value || '' }))}
                      leftSection={<IconVideo size={16} />}
                      clearable
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={3}>
                    <TextInput
                      label="Frame Width"
                      placeholder="e.g., 1920"
                      type="number"
                      value={filters.frame_width || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, frame_width: e.target.value ? parseInt(e.target.value) : undefined }))}
                      leftSection={<IconVideo size={16} />}
                    />
                  </Grid.Col>
                  
                  <Grid.Col span={3}>
                    <TextInput
                      label="Frame Height"
                      placeholder="e.g., 1080"
                      type="number"
                      value={filters.frame_height || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, frame_height: e.target.value ? parseInt(e.target.value) : undefined }))}
                      leftSection={<IconVideo size={16} />}
                    />
                  </Grid.Col>
                </>
              )}

              {/* Segment-specific filters */}
              {searchType === 'segments' && (
                <Grid.Col span={4}>
                  <TextInput
                    label="Time Range"
                    placeholder="e.g., [0:0_10:0)"
                    value={filters.timerange}
                    onChange={(e) => setFilters(prev => ({ ...prev, timerange: e.target.value }))}
                    leftSection={<IconClock size={16} />}
                  />
                </Grid.Col>
              )}
            </Grid>

            {/* Tag Filters */}
            <Box>
              <Text fw={500} mb="xs" className="dark-text-primary">Tag Filters</Text>
              <Text size="sm" mb="sm" className="dark-text-secondary">
                Add custom tags to filter results (e.g., category, organization, etc.)
              </Text>
              <Grid gutter="md">
                <Grid.Col span={6}>
                  <TextInput
                    label="Tag Name"
                    placeholder="e.g., category"
                    value={filters.tagName || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, tagName: e.target.value }))}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Tag Value"
                    placeholder="e.g., sports"
                    value={filters.tagValue || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, tagValue: e.target.value }))}
                  />
                </Grid.Col>
              </Grid>
              {(filters.tagName || filters.tagValue) && (
                <Group gap="xs" mt="sm">
                  <Badge variant="light" color="blue" size="sm">
                    {filters.tagName}: {filters.tagValue}
                  </Badge>
                  <Button
                    size="xs"
                    variant="light"
                    color="red"
                    onClick={() => setFilters(prev => ({ ...prev, tagName: '', tagValue: '' }))}
                  >
                    Clear
                  </Button>
                </Group>
              )}
            </Box>

            {/* Quick Search Examples */}
            <Box>
              <Text fw={500} mb="xs" className="dark-text-primary">Quick Search Examples</Text>
              <Group gap="xs">
                {searchType === 'sources' && (
                  <>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, format: 'urn:x-nmos:format:video' }));
                        setSearchQuery('camera');
                      }}
                      className="dark-button"
                    >
                      Video Sources
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, label: 'camera' }));
                        setSearchQuery('');
                      }}
                      className="dark-button"
                    >
                      Camera Sources
                    </Button>
                  </>
                )}
                {searchType === 'flows' && (
                  <>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => {
                        setFilters(prev => ({ 
                          ...prev, 
                          format: 'urn:x-nmos:format:video',
                          codec: 'urn:x-nmos:codec:h264'
                        }));
                        setSearchQuery('');
                      }}
                      className="dark-button"
                    >
                      H.264 Video Flows
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => {
                        setFilters(prev => ({ 
                          ...prev, 
                          timerange: '[0:0_60:0)',
                          format: 'urn:x-nmos:format:video'
                        }));
                        setSearchQuery('');
                      }}
                      className="dark-button"
                    >
                      First Hour Video
                    </Button>
                  </>
                )}
                {searchType === 'segments' && (
                  <>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => {
                        setFilters(prev => ({ 
                          ...prev, 
                          timerange: '[0:0_10:0)'
                        }));
                        setSearchQuery('');
                      }}
                      className="dark-button"
                    >
                      First 10 Minutes
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => {
                        setFilters(prev => ({ 
                          ...prev, 
                          timerange: '[30:0_60:0)'
                        }));
                        setSearchQuery('');
                      }}
                      className="dark-button"
                    >
                      30-60 Minutes
                    </Button>
                  </>
                )}
              </Group>
            </Box>
          </Stack>
        </Card>

        {/* Search Results */}
        {showResults && (
          <Card withBorder p="xl" radius="lg" shadow="sm" className="search-interface">
            <Stack gap="lg">
              {/* Results Header */}
              <Box>
                <Title order={3} mb="xs" className="dark-text-primary">Search Results</Title>
                <Text className="dark-text-secondary" size="sm">
                  Found {totalResults} {searchType}
                  {searchQuery && ` for "${searchQuery}"`}
                  {searchTime > 0 && ` in ${searchTime}ms`}
                </Text>
                <Badge variant="light" color="blue" size="sm" mt="xs">
                  {searchType.toUpperCase()}
                </Badge>
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
                  <Text>Searching VAST TAMS API...</Text>
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
                      <Button size="sm" variant="light">
                        Export Selected
                      </Button>
                    </Group>
                  )}
                </Group>
              )}

              {/* Search Results Table */}
              {!loading && !error && (
                <Table striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Content</Table.Th>
                      <Table.Th>Type & Format</Table.Th>
                      <Table.Th>Timing</Table.Th>
                      <Table.Th>Metadata</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedResults.map((result) => (
                      <Table.Tr 
                        key={result.id}
                        style={{ 
                          backgroundColor: selectedResults.has(result.id) ? 'var(--mantine-color-blue-0)' : undefined
                        }}
                      >
                        <Table.Td>
                          <Box>
                            <Group gap="xs" align="center" mb="xs">
                              <Text 
                                fw={500} 
                                size="sm"
                                style={{ cursor: 'pointer', color: '#228be6' }}
                                onClick={() => handleResultClick(result)}
                              >
                                {result.title}
                              </Text>
                              <Badge variant="light" color="gray" size="xs">
                                {result.type}
                              </Badge>
                              {selectedResults.has(result.id) && (
                                <Badge size="xs" color="blue">SELECTED</Badge>
                              )}
                            </Group>
                            <Text size="xs" c="dimmed" lineClamp={2}>
                              {result.description}
                            </Text>
                            <Text size="xs" c="dimmed" mt="xs">
                              {result.contentInfo.category} • {result.contentInfo.contentType}
                            </Text>
                          </Box>
                        </Table.Td>
                        <Table.Td>
                          <Stack gap="xs">
                            <Badge variant="light" color="blue" size="sm">
                              {result.metadata.format}
                            </Badge>
                            <Badge variant="light" color="green" size="sm">
                              {result.metadata.quality}
                            </Badge>
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" align="center">
                            <IconClock size={14} />
                            <Box>
                              <Text size="xs" fw={500}>
                                {formatDuration(result.timing.duration)}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {result.timing.start} - {result.timing.end}
                              </Text>
                            </Box>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Stack gap="xs">
                            {result.metadata.tags && Object.keys(result.metadata.tags).length > 0 && (
                              <Group gap="xs" wrap="wrap">
                                {Object.entries(result.metadata.tags).slice(0, 2).map(([key, value]) => (
                                  <Badge key={key} variant="light" color="green" size="xs">
                                    {key}: {String(value)}
                                  </Badge>
                                ))}
                                {Object.keys(result.metadata.tags).length > 2 && (
                                  <Badge variant="light" color="gray" size="xs">
                                    +{Object.keys(result.metadata.tags).length - 2} more
                                  </Badge>
                                )}
                              </Group>
                            )}
                            {result.contentInfo.venue && (
                              <Badge variant="light" color="orange" size="xs">
                                📍 {result.contentInfo.venue}
                              </Badge>
                            )}
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Tooltip label="Select">
                              <ActionIcon
                                size="sm"
                                variant="light"
                                onClick={() => toggleResultSelection(result.id)}
                                color={selectedResults.has(result.id) ? 'blue' : 'gray'}
                              >
                                <IconEye size={14} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Preview">
                              <ActionIcon
                                size="sm"
                                variant="light"
                                onClick={() => handlePreview(result)}
                                color="blue"
                              >
                                <IconPlayerPlay size={14} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="View Details">
                              <ActionIcon
                                size="sm"
                                variant="light"
                                color="gray"
                              >
                                <IconEye size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
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

              {/* Pagination */}
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