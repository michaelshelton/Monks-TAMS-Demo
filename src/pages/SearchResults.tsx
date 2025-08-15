import React, { useState } from 'react';
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
  Alert
} from '@mantine/core';
import { 
  IconPlayerPlay, 
  IconEye, 
  IconClock, 
  IconTag, 
  IconFilter,
  IconSearch,
  IconRefresh,
  IconInfoCircle
} from '@tabler/icons-react';
import BBCPagination from '../components/BBCPagination';
import { BBCApiOptions } from '../services/api';

// Search result interface for football content
interface SearchResult {
  id: string;
  type: 'segment' | 'flow';
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

// Search filters interface
interface SearchFilters extends BBCApiOptions {
  query?: string;
  playerNumber?: string;
  playerName?: string;
  team?: string;
  gameDate?: string;
  timerange?: string;
  format?: string;
  quality?: string;
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
  const [results] = useState<SearchResult[]>(mockFootballResults);
  const [filters, setFilters] = useState<SearchFilters>({
    query: 'player number 19',
    playerNumber: '19',
    playerName: 'Marcus Rashford',
    team: 'Manchester United'
  });
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);

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
          <Title order={2} mb="xs">Search Results</Title>
          <Text c="dimmed" size="sm">
            Found {filteredResults.length} results for "{filters.query}"
          </Text>
        </Box>

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
                leftSection={<IconSearch size={16} />}
              >
                Search
              </Button>
            </Group>
            
            <Grid gutter="md">
              <Grid.Col span={3}>
                <TextInput
                  label="Player Number"
                  placeholder="e.g., 19"
                  value={filters.playerNumber || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, playerNumber: e.target.value }))}
                  size="sm"
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput
                  label="Player Name"
                  placeholder="e.g., Marcus Rashford"
                  value={filters.playerName || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, playerName: e.target.value }))}
                  size="sm"
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput
                  label="Team"
                  placeholder="e.g., Manchester United"
                  value={filters.team || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, team: e.target.value }))}
                  size="sm"
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput
                  label="Game Date"
                  placeholder="e.g., 2024-01-15"
                  value={filters.gameDate || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, gameDate: e.target.value }))}
                  size="sm"
                />
              </Grid.Col>
            </Grid>
          </Stack>
        </Card>

        {/* Results Summary */}
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredResults.length)} of {filteredResults.length} results
          </Text>
          <Group gap="xs">
            <Text size="sm" c="dimmed">Selected:</Text>
            <Badge variant="filled" color="blue">
              {selectedResults.size} items
            </Badge>
          </Group>
        </Group>

        {/* Results Grid */}
        <Grid gutter="md">
          {paginatedResults.map((result) => (
            <Grid.Col key={result.id} span={4}>
              <Card withBorder shadow="sm" radius="md" p="md">
                <Stack gap="sm">
                  {/* Thumbnail */}
                  <Box style={{ position: 'relative' }}>
                    <Image
                      src={result.thumbnail}
                      alt={result.title}
                      radius="sm"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handlePreview(result)}
                    />
                    <Group
                      gap="xs"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px'
                      }}
                    >
                      <Badge variant="filled" color="red" size="sm">
                        {formatDuration(result.timing.duration)}
                      </Badge>
                                              <ActionIcon
                          variant="filled"
                          color="blue"
                          size="sm"
                          onClick={() => handlePreview(result)}
                        >
                          <IconPlayerPlay size={12} />
                        </ActionIcon>
                    </Group>
                  </Box>

                  {/* Content Info */}
                  <Box>
                    <Text fw={600} size="sm" lineClamp={2}>
                      {result.title}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {result.description}
                    </Text>
                  </Box>

                  {/* Game Info */}
                  <Box>
                    <Group gap="xs" mb="xs">
                      <Badge variant="light" color="blue" size="xs">
                        {result.gameInfo.homeTeam} vs {result.gameInfo.awayTeam}
                      </Badge>
                      {result.gameInfo.score && (
                        <Badge variant="light" color="green" size="xs">
                          {result.gameInfo.score}
                        </Badge>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed">
                      {result.gameInfo.date} • {result.gameInfo.venue}
                    </Text>
                  </Box>

                  {/* Player Info */}
                  {result.playerInfo && (
                    <Box>
                      <Group gap="xs" mb="xs">
                        <Badge variant="light" color="orange" size="xs">
                          #{result.playerInfo.number}
                        </Badge>
                        <Badge variant="light" color="gray" size="xs">
                          {result.playerInfo.position}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {result.playerInfo.name} • {result.playerInfo.team}
                      </Text>
                    </Box>
                  )}

                  {/* Timing */}
                  <Box>
                    <Group gap="xs" align="center">
                      <IconClock size={12} />
                      <Text size="xs" c="dimmed">
                        {result.timing.start} - {result.timing.end}
                      </Text>
                    </Group>
                  </Box>

                  {/* Selection */}
                  <Button
                    variant={selectedResults.has(result.id) ? "filled" : "outline"}
                    size="xs"
                    fullWidth
                    onClick={() => toggleResultSelection(result.id)}
                  >
                    {selectedResults.has(result.id) ? 'Selected' : 'Select'}
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {/* Pagination */}
        <Box>
          <BBCPagination
            paginationMeta={mockPaginationMeta}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            showBBCMetadata={true}
            showLimitSelector={true}
            showNavigationButtons={true}
          />
        </Box>

        {/* BBC TAMS Info */}
        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
          <Text size="sm">
            This search results page demonstrates BBC TAMS v6.0 content discovery capabilities. 
            In production, it would use real BBC TAMS API endpoints for searching flows and segments 
            with advanced filtering and cursor-based pagination.
          </Text>
        </Alert>
      </Stack>
    </Container>
  );
}
