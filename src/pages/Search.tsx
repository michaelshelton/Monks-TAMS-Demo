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
  Table,
  SimpleGrid,
  ScrollArea,
  Pagination
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
  IconArrowLeft,
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
import VideoPlayer from '../components/VideoPlayer';
import VastTamsVideoPlayer from '../components/VastTamsVideoPlayer';
import HLSVideoPlayer from '../components/HLSVideoPlayer';
import FlowAdvancedSearch, { FlowAdvancedSearchFilters } from '../components/FlowAdvancedSearch';
import { 
  performSearch, 
  SearchQuery, 
  SearchResult, 
  SearchResponse 
} from '../services/searchService';
import { cmcdTracker, type CMCDMetrics } from '../services/cmcdService';

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
  // Search only works for segments (via marker descriptions)
  const [searchType] = useState<'sources' | 'flows' | 'segments'>('segments');
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 10;
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showInfoBox, setShowInfoBox] = useState(true); // State for collapsible info box

  const [selectedVideo, setSelectedVideo] = useState<SearchResult | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<SearchResult | null>(null);
  const [showSegmentDetails, setShowSegmentDetails] = useState(false);
  
  // Video player state
  const [showInlineVideoPlayer, setShowInlineVideoPlayer] = useState(false);
  const [inlineVideoUrl, setInlineVideoUrl] = useState<string | null>(null);
  const [inlineVideoError, setInlineVideoError] = useState<string | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  
  // CMCD tracking state
  const [cmcdMetrics, setCmcdMetrics] = useState<CMCDMetrics[]>([]);
  const [showCMCDPanel, setShowCMCDPanel] = useState(false);
  const [cmcdSessionActive, setCmcdSessionActive] = useState(false);
  const [showCMCD, setShowCMCD] = useState(false);

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
    // searchType is always 'segments' now, so we don't need to store it in URL
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
  }, [searchQuery, filters, setSearchParams]);

  // Handle search submission
  const handleSearch = async () => {
    if (!isSearchReady) return;
    
    setShowResults(true);
    setLoading(true);
    setError(null);
    setActivePage(1); // Reset to first page on new search
    
    try {
      // Build search query - only segments are searchable via the /search endpoint
      const searchQueryData: SearchQuery = {
        query: searchQuery,
        searchMode: 'basic',
        aiSearchEnabled: false,
        aiConfidence: 0.7,
        searchStrategy: {
          sources: false, // Not supported by search endpoint
          flows: false,    // Not supported by search endpoint
          segments: true,  // Only segments are searchable
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
      const searchResponse = await performSearch(searchQueryData, activePage, itemsPerPage);
      
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


  // Preview video with video player
  const handlePreview = (result: SearchResult) => {
    if (result.previewUrl) {
      setSelectedVideo(result);
      setShowVideoPlayer(true);
    } else {
      alert(`Preview: ${result.title}\nDuration: ${result.timing.duration}s\nNo preview URL available`);
    }
  };

  // Handle segment playback
  const handlePlaySegment = (result: SearchResult) => {
    console.log('Playing segment:', result);
    
    // Load segment into inline video player
    setSelectedSegment(result);
    setShowInlineVideoPlayer(true);
    
    // Clear any previous video player errors
    setInlineVideoError(null);
    
    // Check if segment has presigned URLs from TAMS
    if (!result.get_urls || result.get_urls.length === 0) {
      setInlineVideoError('No playback URLs available for this segment');
      setInlineVideoUrl(null);
      return;
    }
    
    // Get the first available URL for playback
    const playbackUrl = result.get_urls.find(url => url.label?.includes('GET'))?.url || result.get_urls[0]?.url;
    if (playbackUrl) {
      setInlineVideoUrl(playbackUrl);
      setInlineVideoError(null);
    } else {
      setInlineVideoError('No valid playback URL found for this segment');
      setInlineVideoUrl(null);
    }
    
    // Reset CMCD tracking for new segment
    cmcdTracker.resetSession();
    setCmcdMetrics([]);
    setCmcdSessionActive(true);
  };

  // Handle inline video close
  const handleInlineVideoClose = () => {
    setShowInlineVideoPlayer(false);
    setInlineVideoUrl(null);
    setInlineVideoError(null);
    setCmcdSessionActive(false);
    setCmcdMetrics([]);
  };

  // CMCD metrics tracking effect
  useEffect(() => {
    if (cmcdSessionActive) {
      const interval = setInterval(() => {
        const session = cmcdTracker.getSession();
        if (session.metrics && session.metrics.length > 0) {
          setCmcdMetrics(session.metrics);
        }
      }, 1000); // Update every second

      return () => clearInterval(interval);
    }
    return undefined;
  }, [cmcdSessionActive]);

  // CMCD tracking for inline video
  useEffect(() => {
    if (cmcdSessionActive && videoRef) {
      // Start CMCD tracking for the video element
      cmcdTracker.startVideoTracking(videoRef, selectedSegment?.id, undefined, undefined);
      
      // Cleanup
      return () => {
        cmcdTracker.stopVideoTracking();
      };
    }
    return undefined;
  }, [cmcdSessionActive, selectedSegment?.id]);

  // CMCD data display function
  const renderCMCDData = () => {
    if (!cmcdMetrics || cmcdMetrics.length === 0) return null;

    const latestMetric = cmcdMetrics[cmcdMetrics.length - 1];
    if (!latestMetric) return null;

    return (
      <Collapse in={showCMCD}>
        <Card mt="md" withBorder>
          <Group justify="space-between" mb="sm">
            <Title order={6}>CMCD Data (Common Media Client Data)</Title>
            <Badge color="blue">TAMS Compliant</Badge>
          </Group>
          <SimpleGrid cols={2} spacing="xs">
            <Box>
              <Text size="xs" c="dimmed">Object Type</Text>
              <Code style={{ fontSize: '0.75rem' }}>v</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Duration</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.objectDuration?.toFixed(1) || 'N/A'}s</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Session ID</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.sessionId || 'N/A'}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Load Time</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.loadTime ? `${latestMetric.loadTime}ms` : 'N/A'}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Bitrate</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.bandwidth ? `${(latestMetric.bandwidth / 1000).toFixed(0)}kbps` : 'N/A'}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Buffer Length</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.bufferLength?.toFixed(1) || 'N/A'}s</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Playback Rate</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.playbackRate?.toFixed(2) || 'N/A'}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Quality Level</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.qualityLevel || 'N/A'}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Startup Time</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.startupTime ? `${latestMetric.startupTime.toFixed(2)}s` : 'N/A'}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Rebuffering Events</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.rebufferingEvents || 0}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Decoded Frames</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.decodedFrames || 0}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Dropped Frames</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.droppedFrames || 0}</Code>
            </Box>
          </SimpleGrid>
        </Card>
      </Collapse>
    );
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

  // Client-side pagination for search results
  const totalPages = Math.ceil(searchResults.length / itemsPerPage);
  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = searchResults.slice(startIndex, endIndex);

  // Check if search is ready - for segment search, we need a query string
  const isSearchReady = searchQuery.trim().length > 0;

  return (
    <Container size="xl" px="xl" py="xl">
      <Stack gap="xl">
        {/* Title and Header */}
        <Group justify="space-between" mb="lg">
          <Box>
            <Title order={2} className="dark-text-primary">Search</Title>
            <Text c="dimmed" size="sm" mt="xs" className="dark-text-secondary">
              Find and explore media segments across your TAMS library
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



        {/* Main Search Interface */}
        <Card withBorder p="xl" radius="lg" shadow="sm" className="search-interface">
          <Stack gap="lg">
            <Box ta="center">
              <Title order={3} mb="xs" className="dark-text-primary">Search Segments</Title>
              <Text className="dark-text-secondary">
                Find segments by searching marker descriptions and metadata
              </Text>
            </Box>

            {/* Search Input */}
            <TextInput
              size="lg"
              placeholder="Search for segments (e.g., 'camera', 'sports', 'conference')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSection={<IconSearch size={20} />}
              className="search-input"
              rightSection={
                <Button
                  variant="filled"
                  size="sm"
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || loading}
                  loading={loading}
                  rightSection={<IconArrowRight size={16} />}
                  className="dark-button primary"
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              }
            />



            {/* Quick Search Examples */}
            <Box>
              <Text fw={500} mb="xs" className="dark-text-primary">Quick Search Examples</Text>
              <Group gap="xs">
                <>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('sports');
                        setFilters(prev => ({ ...prev }));
                      }}
                      className="dark-button"
                    >
                      🏈 Sports
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('news');
                        setFilters(prev => ({ ...prev }));
                      }}
                      className="dark-button"
                    >
                      📰 News
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('technology');
                        setFilters(prev => ({ ...prev }));
                      }}
                      className="dark-button"
                    >
                      💻 Technology
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('conference');
                        setFilters(prev => ({ ...prev }));
                      }}
                      className="dark-button"
                    >
                      🎤 Conference
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('camera');
                        setFilters(prev => ({ ...prev }));
                      }}
                      className="dark-button"
                    >
                      📹 Camera
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('presentation');
                        setFilters(prev => ({ ...prev }));
                      }}
                      className="dark-button"
                    >
                      📊 Presentation
                    </Button>
                </>
              </Group>
            </Box>
          </Stack>
        </Card>

        {/* Search Results - Broadcast Layout */}
        {showResults && (
          <Grid gutter="lg">
            {/* Main Content Area */}
            <Grid.Col span={8}>
          <Card withBorder p="xl" radius="lg" shadow="sm" className="search-interface">
            <Stack gap="lg">
              {/* Results Header */}
              <Box>
                <Title order={3} mb="xs" className="dark-text-primary">Search Results</Title>
                <Text className="dark-text-secondary" size="sm">
                  Found {searchResults.length} segment{searchResults.length !== 1 ? 's' : ''}
                  {searchQuery && ` for "${searchQuery}"`}
                  {searchTime > 0 && ` in ${searchTime}ms`}
                </Text>
                <Badge variant="light" color="blue" size="sm" mt="xs">
                  SEGMENTS
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
                  <Text>Searching TAMS API...</Text>
                </Box>
              )}

              {/* Results Count and Actions */}
              {!loading && !error && (
                <Group justify="space-between" align="center">
                  <Text size="sm" c="dimmed">
                    Showing {startIndex + 1}-{Math.min(endIndex, searchResults.length)} of {searchResults.length} results
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

                  {/* Search Results List - Broadcast Style */}
              {!loading && !error && (
                    <ScrollArea h={600}>
                      <Stack gap="md">
                    {paginatedResults.map((result) => (
                          <Card 
                        key={result.id}
                            withBorder 
                            p="md" 
                            radius="md"
                        style={{ 
                              backgroundColor: selectedResults.has(result.id) ? 'var(--mantine-color-blue-0)' : undefined,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => handlePlaySegment(result)}
                            onMouseEnter={(e) => {
                              if (!selectedResults.has(result.id)) {
                                e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!selectedResults.has(result.id)) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <Group justify="space-between" align="flex-start">
                              <Box style={{ flex: 1 }}>
                            <Group gap="xs" align="center" mb="xs">
                                  <Text fw={600} size="md" c="blue">
                                {result.title}
                              </Text>
                                  <Badge variant="light" color="gray" size="sm">
                                {result.type}
                              </Badge>
                              {selectedResults.has(result.id) && (
                                    <Badge size="sm" color="blue">SELECTED</Badge>
                              )}
                            </Group>
                                
                                <Text size="sm" c="dimmed" mb="sm" lineClamp={2}>
                              {result.description}
                            </Text>
                                
                                <Group gap="md" mb="sm">
                                  <Group gap="xs">
                                    <IconClock size={14} />
                                    <Text size="sm" fw={500}>
                                      {formatDuration(result.timing.duration)}
                            </Text>
                                  </Group>
                            <Badge variant="light" color="blue" size="sm">
                              {result.metadata.format}
                            </Badge>
                            <Badge variant="light" color="green" size="sm">
                              {result.metadata.quality}
                            </Badge>
                                  {result.contentInfo.venue && (
                                    <Badge variant="light" color="orange" size="sm">
                                      📍 {result.contentInfo.venue}
                                    </Badge>
                                  )}
                          </Group>
                                
                            {result.metadata.tags && Object.keys(result.metadata.tags).length > 0 && (
                              <Group gap="xs" wrap="wrap">
                                    {Object.entries(result.metadata.tags).slice(0, 3).map(([key, value]) => (
                                  <Badge key={key} variant="light" color="green" size="xs">
                                    {key}: {String(value)}
                                  </Badge>
                                ))}
                                    {Object.keys(result.metadata.tags).length > 3 && (
                                  <Badge variant="light" color="gray" size="xs">
                                        +{Object.keys(result.metadata.tags).length - 3} more
                                  </Badge>
                                )}
                              </Group>
                            )}
                              </Box>
                              
                          <Group gap="xs">
                            <Tooltip label="Select">
                              <ActionIcon
                                size="sm"
                                variant="light"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleResultSelection(result.id);
                                    }}
                                color={selectedResults.has(result.id) ? 'blue' : 'gray'}
                              >
                                <IconEye size={14} />
                              </ActionIcon>
                            </Tooltip>
                                <Tooltip label="Play Segment">
                              <ActionIcon
                                size="sm"
                                variant="light"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePlaySegment(result);
                                    }}
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                  setSelectedSegment(result);
                                  setShowSegmentDetails(true);
                                }}
                              >
                                <IconEye size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                            </Group>
                          </Card>
                    ))}
                      </Stack>
                    </ScrollArea>
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
              {!loading && !error && searchResults.length > itemsPerPage && (
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
              {!loading && !error && searchResults.length > 0 && (
                <Group justify="center" mt="md">
                  <Text size="sm" c="dimmed">
                    Showing {startIndex + 1}-{Math.min(endIndex, searchResults.length)} of {searchResults.length} results
                  </Text>
                </Group>
              )}
            </Stack>
          </Card>
            </Grid.Col>

            {/* Video Player Sidebar */}
            <Grid.Col span={4}>
              <Stack gap="lg">
                {/* Video Player Box */}
                <Card withBorder p="xl" className="video-player-container">
                  <Title order={4} mb="md" className="dark-text-primary">Segment Player</Title>
                  <Stack gap="md">
                    {!selectedSegment ? (
                      <Box
                        style={{
                          width: '100%',
                          height: '300px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px dashed #dee2e6'
                        }}
                      >
                        <Stack gap="md" align="center">
                          <IconVideo size={48} color="#6c757d" />
                          <Text c="dimmed" size="sm" ta="center" className="dark-text-secondary">
                            Select a segment to play
                          </Text>
                          <Text size="xs" c="dimmed" ta="center" className="dark-text-tertiary">
                            Click on any search result to start playback
                          </Text>
                        </Stack>
                      </Box>
                    ) : (
                      <Box
                        style={{
                          width: '100%',
                          height: '300px',
                          backgroundColor: '#000',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          position: 'relative'
                        }}
                      >
                        {inlineVideoError ? (
                          <Stack gap="md" p="md">
                            <Alert 
                              color="red" 
                              icon={<IconAlertCircle size={16} />}
                              title="Playback Error"
                              withCloseButton
                              onClose={() => {
                                setInlineVideoError(null);
                                setSelectedSegment(null);
                                setShowInlineVideoPlayer(false);
                              }}
                            >
                              {inlineVideoError}
                            </Alert>
                            <Text size="sm" c="dimmed" ta="center">
                              Select another segment to try again
                            </Text>
                          </Stack>
                        ) : showInlineVideoPlayer && inlineVideoUrl ? (
                          <Stack gap="md">
                            <Box 
                              style={{ 
                                position: 'relative',
                                cursor: 'pointer'
                              }}
                              onClick={handleInlineVideoClose}
                              title="Click to close video player"
                            >
                              <video
                                ref={setVideoRef}
                                controls
                                autoPlay
                                muted
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain'
                                }}
                                onError={(e) => {
                                  console.error('Video playback error:', e);
                                  setInlineVideoError(`Video playback error: ${e.currentTarget.error?.message || 'Unknown error'}`);
                                }}
                                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking video controls
                              >
                                <source src={inlineVideoUrl} type="application/x-mpegURL" />
                                <source src={inlineVideoUrl} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            </Box>
                            {cmcdSessionActive && (
                              <Group gap="xs" justify="center">
                                <Badge color="green" variant="light" size="sm">
                                  CMCD Tracking Active
                                </Badge>
                                <Text size="xs" c="dimmed">
                                  Metrics: {cmcdMetrics.length}
                                </Text>
                                <Button
                                  variant="light"
                                  size="xs"
                                  onClick={() => setShowCMCD(!showCMCD)}
                                >
                                  {showCMCD ? 'Hide' : 'Show'} CMCD
                                </Button>
                              </Group>
                            )}
                          </Stack>
                        ) : (
                          <Box
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#000'
                            }}
                          >
                            <Text c="white" size="sm">Loading segment player...</Text>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Stack>
                  
                  {/* CMCD Data Display */}
                  {renderCMCDData()}
                </Card>

                {/* Selected Segment Info */}
                <Card withBorder p="md" className="now-playing-card">
                  <Title order={5} mb="sm" className="dark-text-primary">
                    {selectedSegment ? 'Now Playing' : 'No Selection'}
                  </Title>
                  <Stack gap="sm">
                    {selectedSegment ? (
                      <>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed" className="dark-text-secondary">Segment</Text>
                          <Text size="sm" fw={500} c="blue" className="dark-text-primary">{selectedSegment.title}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed" className="dark-text-secondary">Format</Text>
                          <Badge variant="light" color="blue" size="sm">
                            {selectedSegment.metadata.format}
                          </Badge>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed" className="dark-text-secondary">Duration</Text>
                          <Text size="sm" fw={500} className="dark-text-primary">{formatDuration(selectedSegment.timing.duration)}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed" className="dark-text-secondary">Quality</Text>
                          <Badge variant="light" color="green" size="sm">
                            {selectedSegment.metadata.quality}
                          </Badge>
                        </Group>
                        {selectedSegment.metadata.tags && Object.keys(selectedSegment.metadata.tags).length > 0 && (
                          <Box>
                            <Text size="xs" c="dimmed" mb="xs" className="dark-text-secondary">Tags</Text>
                            <Group gap="xs" wrap="wrap">
                              {Object.entries(selectedSegment.metadata.tags).slice(0, 2).map(([k,v]) => (
                                <Badge key={k} color="gray" variant="outline" size="xs">{k}: {v}</Badge>
                              ))}
                              {Object.keys(selectedSegment.metadata.tags).length > 2 && (
                                <Badge color="gray" variant="outline" size="xs">+{Object.keys(selectedSegment.metadata.tags).length - 2}</Badge>
                              )}
                            </Group>
                          </Box>
                        )}
                      </>
                    ) : (
                      <Text size="sm" c="dimmed" ta="center" className="dark-text-secondary">
                        Select a segment from the search results to see details and play content
                      </Text>
                    )}
                  </Stack>
                </Card>

                {/* Quick Actions */}
                <Card withBorder p="md" className="quick-actions-card">
                  <Title order={5} mb="sm" className="dark-text-primary">Quick Actions</Title>
                  <Stack gap="sm">
                    <Button 
                      variant="light" 
                      leftSection={<IconRefresh size={16} />} 
                      onClick={handleSearch}
                      loading={loading}
                      fullWidth
                      className="dark-button"
                    >
                      Refresh Search
                    </Button>
                    <Button 
                      variant="light" 
                      leftSection={<IconSettings size={16} />} 
                      onClick={() => setShowCMCDPanel(!showCMCDPanel)}
                      fullWidth
                      className="dark-button"
                    >
                      {showCMCDPanel ? 'Hide' : 'Show'} Analytics
                    </Button>
                    {selectedResults.size > 0 && (
                      <Button 
                        variant="light" 
                        leftSection={<IconDownload size={16} />} 
                        fullWidth
                        className="dark-button"
                      >
                        Export Selected ({selectedResults.size})
                      </Button>
                    )}
                  </Stack>
                </Card>
              </Stack>
            </Grid.Col>
          </Grid>
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
            <Stack gap="md">
              <Group justify="space-between">
                <Box>
                  <Title order={4}>{selectedVideo.title}</Title>
                  <Text size="sm" c="dimmed">{selectedVideo.description} • {formatDuration(selectedVideo.timing.duration)}</Text>
                </Box>
                <Group>
                  <Button variant="light" leftSection={<IconDownload size={16} />}>Download</Button>
                  <Button variant="light" leftSection={<IconChartBar size={16} />} onClick={() => setShowCMCDPanel(!showCMCDPanel)}>
                    {showCMCDPanel ? 'Hide' : 'Show'} Analytics
                  </Button>
                  <Button variant="light" onClick={() => setShowVideoPlayer(false)}>Close</Button>
                </Group>
              </Group>
              
              <Grid>
                <Grid.Col span={showCMCDPanel ? 8 : 12}>
                  {selectedVideo.get_urls && selectedVideo.get_urls.length > 0 ? (
                    // Use VAST TAMS Video Player for segments with presigned URLs
                    <VastTamsVideoPlayer
                      segment={{
                        id: selectedVideo.id,
                        timerange: `${selectedVideo.timing.start}/${selectedVideo.timing.end}`,
                        get_urls: selectedVideo.get_urls,
                        format: selectedVideo.metadata.format,
                        codec: 'h264',
                        size: 0,
                        created: new Date().toISOString(),
                        updated: new Date().toISOString(),
                        tags: selectedVideo.metadata.tags,
                        deleted: false,
                        deleted_at: null,
                        deleted_by: null
                      }}
                      title={selectedVideo.title}
                      description={selectedVideo.description || 'No description available'}
                      onClose={() => setShowVideoPlayer(false)}
                      showControls={true}
                      autoPlay={true}
                      onError={(error) => {
                        console.error('VAST TAMS Video Player Error:', error);
                        setError(`Video playback error: ${error}`);
                      }}
                    />
                  ) : (
                    // Fallback to regular video player
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
                </Grid.Col>
                
                {showCMCDPanel && (
                  <Grid.Col span={4}>
                    <Card withBorder p="md" h="70vh">
                      <Stack gap="md">
                        <Group justify="space-between">
                          <Title order={5}>CMCD Analytics</Title>
                          <Group gap="xs">
                            <Badge color="green" variant="light">Live</Badge>
                            {cmcdSessionActive && <Badge color="blue" variant="light">Active</Badge>}
                          </Group>
                        </Group>
                        
                        <Divider />
                        
                        {/* Real-time metrics */}
                        <Box>
                          <Text size="sm" fw={500} mb="xs">Current Metrics</Text>
                          {cmcdMetrics.length > 0 ? (
                            <Stack gap="xs">
                              <Group gap="xs">
                                <Text size="xs" c="dimmed">Buffer:</Text>
                                <Text size="xs" fw={500}>
                                  {(() => {
                                    const bufferLength = cmcdMetrics[cmcdMetrics.length - 1]?.bufferLength;
                                    return bufferLength ? `${Math.round(bufferLength)}s` : 'N/A';
                                  })()}
                                </Text>
                              </Group>
                              <Group gap="xs">
                                <Text size="xs" c="dimmed">Playback Rate:</Text>
                                <Text size="xs" fw={500}>
                                  {(() => {
                                    const playbackRate = cmcdMetrics[cmcdMetrics.length - 1]?.playbackRate;
                                    return playbackRate ? `${playbackRate}x` : 'N/A';
                                  })()}
                                </Text>
                              </Group>
                              <Group gap="xs">
                                <Text size="xs" c="dimmed">Duration:</Text>
                                <Text size="xs" fw={500}>
                                  {(() => {
                                    const objectDuration = cmcdMetrics[cmcdMetrics.length - 1]?.objectDuration;
                                    return objectDuration ? `${Math.round(objectDuration)}s` : 'N/A';
                                  })()}
                                </Text>
                              </Group>
                              <Group gap="xs">
                                <Text size="xs" c="dimmed">Bandwidth:</Text>
                                <Text size="xs" fw={500}>
                                  {(() => {
                                    const bandwidth = cmcdMetrics[cmcdMetrics.length - 1]?.bandwidth;
                                    return bandwidth ? `${Math.round(bandwidth)} kbps` : 'N/A';
                                  })()}
                                </Text>
                              </Group>
                            </Stack>
                          ) : (
                            <Text size="xs" c="dimmed" ta="center" py="md">
                              {cmcdSessionActive ? 'Collecting metrics...' : 'Start video playback to see metrics'}
                            </Text>
                          )}
                        </Box>
                        
                        <Divider />
                        
                        {/* Session info */}
                        <Box>
                          <Text size="xs" c="dimmed">Session ID</Text>
                          <Text size="xs" style={{ fontFamily: 'monospace' }}>
                            {cmcdTracker.getSession().id}
                          </Text>
                          <Text size="xs" c="dimmed" mt="xs">Metrics Count: {cmcdMetrics.length}</Text>
                        </Box>
                      </Stack>
                    </Card>
                  </Grid.Col>
                )}
              </Grid>
            </Stack>
          )}
        </Modal>

        {/* Segment Details Modal */}
        {selectedSegment && (
          <Modal
            opened={showSegmentDetails}
            onClose={() => setShowSegmentDetails(false)}
            title="Segment Details"
            size="lg"
          >
            <Stack gap="md">
              {/* Segment Header */}
              <Card withBorder p="md">
                <Stack gap="sm">
                  <Title order={3}>{selectedSegment.title}</Title>
                  {selectedSegment.description && (
                    <Text c="dimmed">{selectedSegment.description}</Text>
                  )}
                  <Group gap="md">
                    <Badge variant="light" color="blue" size="lg">
                      {selectedSegment.type.toUpperCase()}
                    </Badge>
                    <Badge variant="light" color="green" size="lg">
                      {selectedSegment.metadata.format}
                    </Badge>
                    <Badge variant="light" color="orange" size="lg">
                      {selectedSegment.metadata.quality}
                    </Badge>
                  </Group>
                </Stack>
              </Card>

              {/* Content Information */}
              <Card withBorder p="md">
                <Title order={4} mb="md">Content Information</Title>
                <Grid gutter="md">
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500} c="dimmed">Category</Text>
                    <Text size="sm">{selectedSegment.contentInfo.category}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500} c="dimmed">Content Type</Text>
                    <Text size="sm">{selectedSegment.contentInfo.contentType}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500} c="dimmed">Organization</Text>
                    <Text size="sm">{selectedSegment.contentInfo.organization}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500} c="dimmed">Date</Text>
                    <Text size="sm">{selectedSegment.contentInfo.date}</Text>
                  </Grid.Col>
                  {selectedSegment.contentInfo.venue && (
                    <Grid.Col span={12}>
                      <Text size="sm" fw={500} c="dimmed">Venue</Text>
                      <Text size="sm">📍 {selectedSegment.contentInfo.venue}</Text>
                    </Grid.Col>
                  )}
                </Grid>
              </Card>

              {/* Timing Information */}
              <Card withBorder p="md">
                <Title order={4} mb="md">Timing Information</Title>
                <Grid gutter="md">
                  <Grid.Col span={4}>
                    <Text size="sm" fw={500} c="dimmed">Start Time</Text>
                    <Text size="sm" style={{ fontFamily: 'monospace' }}>
                      {selectedSegment.timing.start}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Text size="sm" fw={500} c="dimmed">End Time</Text>
                    <Text size="sm" style={{ fontFamily: 'monospace' }}>
                      {selectedSegment.timing.end}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Text size="sm" fw={500} c="dimmed">Duration</Text>
                    <Text size="sm" fw={500}>
                      {Math.floor(selectedSegment.timing.duration / 60)}m {selectedSegment.timing.duration % 60}s
                    </Text>
                  </Grid.Col>
                </Grid>
              </Card>

              {/* Tags */}
              {selectedSegment.metadata.tags && Object.keys(selectedSegment.metadata.tags).length > 0 && (
                <Card withBorder p="md">
                  <Title order={4} mb="md">Tags</Title>
                  <Group gap="xs" wrap="wrap">
                    {Object.entries(selectedSegment.metadata.tags).map(([key, value]) => (
                      <Badge key={key} variant="light" color="blue" size="sm">
                        {key}: {String(value)}
                      </Badge>
                    ))}
                  </Group>
                </Card>
              )}

              {/* Available URLs */}
              {selectedSegment.get_urls && selectedSegment.get_urls.length > 0 && (
                <Card withBorder p="md">
                  <Title order={4} mb="md">Available URLs</Title>
                  <Stack gap="xs">
                    {selectedSegment.get_urls.map((url, index) => (
                      <Group key={index} gap="xs">
                        <Badge size="sm" color="green">
                          GET
                        </Badge>
                        <Text size="xs" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {url.url}
                        </Text>
                        {url.label && (
                          <Badge size="xs" variant="light" color="gray">
                            {url.label}
                          </Badge>
                        )}
                      </Group>
                    ))}
                  </Stack>
                </Card>
              )}

              {/* Actions */}
              <Group justify="flex-end" mt="md">
                <Button
                  variant="light"
                  onClick={() => setShowSegmentDetails(false)}
                >
                  Close
                </Button>
                <Button
                  color="blue"
                  onClick={() => {
                    setSelectedVideo(selectedSegment);
                    setShowVideoPlayer(true);
                    setShowSegmentDetails(false);
                    // Start CMCD tracking for modal video
                    cmcdTracker.resetSession();
                    setCmcdMetrics([]);
                    setCmcdSessionActive(true);
                  }}
                >
                  Play Segment
                </Button>
              </Group>
            </Stack>
          </Modal>
        )}
      </Stack>
    </Container>
  );
}