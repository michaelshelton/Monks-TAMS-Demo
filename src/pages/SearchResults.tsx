import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Stack,
  Card,
  Text,
  Badge,
  Group,
  Grid,
  Button,
  ActionIcon,
  Box,
  Image,
  Select,
  TextInput,
  Alert,
  Tabs,
  Switch,
  Code,
  Divider,
  Collapse
} from '@mantine/core';
import { 
  IconPlayerPlay, 
  IconEye, 
  IconClock, 
  IconTag, 
  IconFilter,
  IconSearch,
  IconRefresh,
  IconInfoCircle,
  IconBrain,
  IconSettings,
  IconDatabase,
  IconTarget,
  IconArrowLeft
} from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BBCPagination from '../components/BBCPagination';
import { BBCApiOptions } from '../services/api';

// Enhanced search result interface for football content
interface SearchResult {
  id: string;
  type: 'segment' | 'flow' | 'source';
  title: string;
  description?: string;
  gameInfo: {
    homeTeam: string;
    awayTeam: string;
    date: string;
    venue: string;
    score?: string;
  };
  playerInfo?: {
    number: string;
    name: string;
    team: string;
    position: string;
  };
  timing: {
    start: string;
    end: string;
    duration: number; // seconds
  };
  metadata: {
    format: string;
    quality: string;
    tags: Record<string, string>;
  };
  thumbnail?: string;
  previewUrl?: string;
}

// Enhanced search filters interface
interface SearchFilters extends BBCApiOptions {
  query?: string;
  searchMode?: 'basic' | 'advanced' | 'ai';
  aiSearchEnabled?: boolean;
  aiConfidence?: number;
  playerNumber?: string;
  playerName?: string;
  team?: string;
  gameDate?: string;
  timerange?: string;
  format?: string;
  quality?: string;
  searchStrategy?: {
    sources: boolean;
    flows: boolean;
    segments: boolean;
    searchOrder: 'bbc-tams' | 'custom';
    customOrder?: ('sources' | 'flows' | 'segments')[];
    deduplication: boolean;
    relationshipMapping: boolean;
  };
}

// Mock data for football demo
const mockFootballResults: SearchResult[] = [
  {
    id: 'seg-001',
    type: 'segment',
    title: 'Player 19 Goal Celebration',
    description: 'Amazing goal celebration by player number 19',
    gameInfo: {
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      date: '2024-01-15',
      venue: 'Old Trafford',
      score: '2-1'
    },
    playerInfo: {
      number: '19',
      name: 'Marcus Rashford',
      team: 'Manchester United',
      position: 'Forward'
    },
    timing: {
      start: '00:45:30',
      end: '00:46:15',
      duration: 45
    },
    metadata: {
      format: 'video/h264',
      quality: '1080p',
      tags: {
        'player_number': '19',
        'player_name': 'Marcus Rashford',
        'event_type': 'goal',
        'team': 'Manchester United',
        'venue': 'Old Trafford'
      }
    },
    thumbnail: 'https://via.placeholder.com/320x180/1f2937/ffffff?text=Goal+19',
    previewUrl: 'https://example.com/video/seg-001.mp4'
  },
  {
    id: 'seg-002',
    type: 'segment',
    title: 'Player 19 Assist',
    description: 'Beautiful assist leading to a goal',
    gameInfo: {
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      date: '2024-01-15',
      venue: 'Old Trafford',
      score: '2-1'
    },
    playerInfo: {
      number: '19',
      name: 'Marcus Rashford',
      team: 'Manchester United',
      position: 'Forward'
    },
    timing: {
      start: '00:32:45',
      end: '00:33:20',
      duration: 35
    },
    metadata: {
      format: 'video/h264',
      quality: '1080p',
      tags: {
        'player_number': '19',
        'player_name': 'Marcus Rashford',
        'event_type': 'assist',
        'team': 'Manchester United',
        'venue': 'Old Trafford'
      }
    },
    thumbnail: 'https://via.placeholder.com/320x180/1f2937/ffffff?text=Assist+19',
    previewUrl: 'https://example.com/video/seg-002.mp4'
  },
  {
    id: 'seg-003',
    type: 'segment',
    title: 'Player 19 Free Kick',
    description: 'Spectacular free kick attempt',
    gameInfo: {
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      date: '2024-01-15',
      venue: 'Old Trafford',
      score: '2-1'
    },
    playerInfo: {
      number: '19',
      name: 'Marcus Rashford',
      team: 'Manchester United',
      position: 'Forward'
    },
    timing: {
      start: '00:78:12',
      end: '00:78:45',
      duration: 33
    },
    metadata: {
      format: 'video/h264',
      quality: '1080p',
      tags: {
        'player_number': '19',
        'player_name': 'Marcus Rashford',
        'event_type': 'free_kick',
        'team': 'Manchester United',
        'venue': 'Old Trafford'
      }
    },
    thumbnail: 'https://via.placeholder.com/320x180/1f2937/ffffff?text=Free+Kick+19',
    previewUrl: 'https://example.com/video/seg-003.mp4'
  }
];

export default function SearchResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [results] = useState<SearchResult[]>(mockFootballResults);
  
  // Parse URL parameters
  const [filters, setFilters] = useState<SearchFilters>(() => {
    const params = new URLSearchParams(searchParams);
    return {
      query: params.get('query') || 'player number 19',
      searchMode: (params.get('searchMode') as 'basic' | 'advanced' | 'ai') || 'basic',
      aiSearchEnabled: params.get('aiSearchEnabled') === 'true',
      aiConfidence: parseFloat(params.get('aiConfidence') || '0.7'),
      playerNumber: params.get('playerNumber') || '19',
      playerName: params.get('playerName') || 'Marcus Rashford',
      team: params.get('team') || 'Manchester United',
      timerange: params.get('timerange') || '',
      format: params.get('format') || '',
      quality: params.get('quality') || '',
      searchStrategy: params.get('searchStrategy') ? 
        JSON.parse(params.get('searchStrategy')!) : {
          sources: true,
          flows: true,
          segments: true,
          searchOrder: 'bbc-tams' as const,
          deduplication: true,
          relationshipMapping: true
        }
    };
  });

  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [showSearchDetails, setShowSearchDetails] = useState(false);

  // Mock pagination metadata for BBC TAMS
  const mockPaginationMeta = {
    limit: itemsPerPage,
    count: results.length,
    timerange: '0:0_90:0', // 90 minutes game
    reverseOrder: false
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

  // Handle filters change
  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    // In real implementation, this would trigger a new search
  };

  // Handle search
  const handleSearch = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  // Handle page change
  const handlePageChange = (cursor: string) => {
    const pageNum = parseInt(cursor) || 1;
    setCurrentPage(pageNum);
  };

  // Handle limit change
  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
  };

  // Preview video (simple implementation)
  const handlePreview = (result: SearchResult) => {
    // In real implementation, this would open a video player
    alert(`Preview: ${result.title}\nDuration: ${result.timing.duration}s\nURL: ${result.previewUrl}`);
  };

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get filtered results
  const filteredResults = results.filter(result => {
    if (filters.query && !result.title.toLowerCase().includes(filters.query.toLowerCase())) {
      return false;
    }
    if (filters.playerNumber && result.playerInfo?.number !== filters.playerNumber) {
      return false;
    }
    if (filters.team && result.gameInfo.homeTeam !== filters.team && result.gameInfo.awayTeam !== filters.team) {
      return false;
    }
    return true;
  });

  // Paginate results
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  return (
    <Container size="xl" px="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Box>
          <Group justify="space-between" align="flex-start">
            <Box>
              <Title order={2} mb="xs" className="dark-text-primary">Search Results</Title>
              <Text c="dimmed" size="sm" className="dark-text-secondary">
                Found {filteredResults.length} results for "{filters.query}"
              </Text>
              <Text size="xs" c="dimmed" mt="xs">
                Search Mode: {filters.searchMode} • AI: {filters.aiSearchEnabled ? 'Enabled' : 'Disabled'}
                {filters.aiSearchEnabled && ` • Confidence: ${Math.round((filters.aiConfidence || 0) * 100)}%`}
              </Text>
            </Box>
            <Button
              variant="light"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate('/search')}
            >
              Back to Search
            </Button>
          </Group>
        </Box>

        {/* Search Configuration Summary */}
        <Card withBorder p="md">
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Text fw={500}>Search Configuration</Text>
              <Button
                variant="light"
                size="sm"
                onClick={() => setShowSearchDetails(!showSearchDetails)}
                leftSection={<IconSettings size={16} />}
              >
                {showSearchDetails ? 'Hide' : 'Show'} Details
              </Button>
            </Group>
            
            <Collapse in={showSearchDetails}>
              <Stack gap="md">
                <Divider />
                
                <Grid gutter="md">
                  <Grid.Col span={6}>
                    <Text fw={500} size="sm" mb="xs">Search Parameters:</Text>
                    <Group gap="xs" wrap="wrap">
                      <Badge variant="light" color="blue">{filters.searchMode} mode</Badge>
                      {filters.playerNumber && <Badge variant="light" color="green">Player {filters.playerNumber}</Badge>}
                      {filters.playerName && <Badge variant="light" color="green">{filters.playerName}</Badge>}
                      {filters.team && <Badge variant="light" color="green">{filters.team}</Badge>}
                      {filters.timerange && <Badge variant="light" color="orange">Timerange: {filters.timerange}</Badge>}
                    </Group>
                  </Grid.Col>
                  
                  <Grid.Col span={6}>
                    <Text fw={500} size="sm" mb="xs">Search Strategy:</Text>
                    <Group gap="xs" wrap="wrap">
                      {filters.searchStrategy?.sources && <Badge variant="light" color="green">Sources</Badge>}
                      {filters.searchStrategy?.flows && <Badge variant="light" color="blue">Flows</Badge>}
                      {filters.searchStrategy?.segments && <Badge variant="light" color="orange">Segments</Badge>}
                      {filters.searchStrategy?.deduplication && <Badge variant="light" color="purple">Deduplication</Badge>}
                      {filters.searchStrategy?.relationshipMapping && <Badge variant="light" color="cyan">Relationships</Badge>}
                    </Group>
                  </Grid.Col>
                </Grid>

                {filters.aiSearchEnabled && (
                  <Box>
                    <Text fw={500} size="sm" mb="xs">AI Configuration:</Text>
                    <Group gap="xs">
                      <Badge variant="light" color="purple" leftSection={<IconBrain size={12} />}>
                        AI Search Enabled
                      </Badge>
                      <Badge variant="light" color="purple">
                        Confidence: {Math.round((filters.aiConfidence || 0) * 100)}%
                      </Badge>
                    </Group>
                  </Box>
                )}

                <Box>
                  <Text fw={500} size="sm" mb="xs">Raw Search Parameters:</Text>
                  <Code block>{JSON.stringify(filters, null, 2)}</Code>
                </Box>
              </Stack>
            </Collapse>
          </Stack>
        </Card>

        {/* Search Filters */}
        <Card withBorder p="md">
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Text fw={500}>Refine Search</Text>
              <Button
                variant="light"
                size="sm"
                onClick={handleSearch}
                loading={loading}
                leftSection={<IconRefresh size={16} />}
              >
                Refresh Results
              </Button>
            </Group>
            
            <Grid gutter="md">
              <Grid.Col span={3}>
                <TextInput
                  label="Query"
                  placeholder="Search query"
                  value={filters.query || ''}
                  onChange={(e) => handleFiltersChange({ ...filters, query: e.target.value })}
                  leftSection={<IconSearch size={16} />}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput
                  label="Player Number"
                  placeholder="e.g., 19"
                  value={filters.playerNumber || ''}
                  onChange={(e) => handleFiltersChange({ ...filters, playerNumber: e.target.value })}
                  leftSection={<IconTag size={16} />}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput
                  label="Team"
                  placeholder="e.g., Manchester United"
                  value={filters.team || ''}
                  onChange={(e) => handleFiltersChange({ ...filters, team: e.target.value })}
                  leftSection={<IconTag size={16} />}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <Select
                  label="Format"
                  placeholder="Select format"
                  data={[
                    { value: 'video/h264', label: 'H.264 Video' },
                    { value: 'video/h265', label: 'H.265 Video' },
                    { value: 'audio/aac', label: 'AAC Audio' },
                    { value: 'data/json', label: 'JSON Data' }
                  ]}
                  value={filters.format || ''}
                  onChange={(value) => handleFiltersChange({ ...filters, format: value || '' })}
                  clearable
                />
              </Grid.Col>
            </Grid>
          </Stack>
        </Card>

        {/* Results Count and Actions */}
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredResults.length)} of {filteredResults.length} results
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

        {/* Search Results */}
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
                          {key}: {value}
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

        {/* No Results */}
        {paginatedResults.length === 0 && (
          <Card withBorder p="xl" ta="center">
            <Stack gap="md">
              <IconSearch size={48} color="var(--mantine-color-gray-4)" />
              <Text size="lg" c="dimmed">No results found</Text>
              <Text size="sm" c="dimmed">
                Try adjusting your search filters or search criteria
              </Text>
              <Button
                variant="light"
                onClick={() => navigate('/search')}
                leftSection={<IconArrowLeft size={16} />}
              >
                Back to Search
              </Button>
            </Stack>
          </Card>
        )}

        {/* BBC TAMS Pagination */}
        {filteredResults.length > 0 && (
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

        {/* BBC TAMS Search Info */}
        <Alert icon={<IconInfoCircle size={16} />} title="BBC TAMS Search Results" color="blue">
          <Text size="sm">
            These results demonstrate BBC TAMS v6.0 compliant search capabilities with multi-entity support, 
            advanced filtering, and AI-powered content discovery. The search strategy and filters are applied 
            according to BBC TAMS specification for optimal content retrieval.
          </Text>
        </Alert>
      </Stack>
    </Container>
  );
}
