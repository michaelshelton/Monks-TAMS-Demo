import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Alert,
  Code,
  Box,
  Divider,
  Badge,
  Tabs,
  Card,
  ActionIcon,
  Tooltip,
  Modal,
  Textarea,
  TextInput,
  Select,
  Switch
} from '@mantine/core';
import { 
  IconSearch, 
  IconBrain, 
  IconTag, 
  IconEye, 
  IconDownload, 
  IconShare, 
  IconHeart, 
  IconBookmark, 
  IconInfoCircle, 
  IconPlayerPlay,
  IconFilter,
    IconHistory,
    IconStar,
    IconSettings
} from '@tabler/icons-react';
import AdvancedSearchBuilder, { AdvancedSearchQuery } from './AdvancedSearchBuilder';
import SearchResultViewer, { SearchResult } from './SearchResultViewer';

export interface ContentDiscoveryProps {
  onResultClick?: (result: SearchResult) => void;
  onExport?: (results: SearchResult[]) => void;
  onShare?: (result: SearchResult) => void;
  savedQueries?: AdvancedSearchQuery[];
  onSaveQuery?: (query: AdvancedSearchQuery) => void;
  onLoadQuery?: (query: AdvancedSearchQuery) => void;
}

export default function ContentDiscovery({
  onResultClick,
  onExport,
  onShare,
  savedQueries = [],
  onSaveQuery,
  onLoadQuery
}: ContentDiscoveryProps) {
  const [currentQuery, setCurrentQuery] = useState<AdvancedSearchQuery | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showQueryHistory, setShowQueryHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchMode, setSearchMode] = useState<'basic' | 'advanced' | 'ai'>('advanced');
  const [aiSearchEnabled, setAiSearchEnabled] = useState(true);
  const [aiConfidence, setAiConfidence] = useState(0.7);

  // Mock data for demonstration - in real implementation, this would come from API
  const mockResults: SearchResult[] = [
    {
      id: '1',
      type: 'source',
      title: 'Football Match Highlights - Team A vs Team B',
      description: 'Complete match highlights featuring key moments and goals',
      format: 'video',
      codec: 'H.264',
      duration: 5400, // 1.5 hours
      size: 2147483648, // 2GB
      tags: {
        'sport': 'football',
        'player.jersey_number': '19',
        'player.team': 'Team A',
        'player.position': 'midfielder',
        'action': 'goal_scored',
        'venue': 'stadium',
        'competition': 'Premier League',
        'camera': 'main',
        'quality': '4K'
      },
      metadata: {
        'frame_width': 3840,
        'frame_height': 2160,
        'frame_rate': 60,
        'bitrate': 50000
      },
      thumbnail: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Football+Match',
      url: 'https://example.com/video1.mp4',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      score: 0.95
    },
    {
      id: '2',
      type: 'flow',
      title: 'Player #19 Individual Performance',
      description: 'Compilation of all moments featuring player with jersey number 19',
      format: 'video',
      codec: 'H.265',
      duration: 1800, // 30 minutes
      size: 1073741824, // 1GB
      tags: {
        'sport': 'football',
        'player.jersey_number': '19',
        'player.team': 'Team A',
        'player.position': 'midfielder',
        'action': 'assist',
        'camera': 'close_up',
        'quality': '1080p'
      },
      metadata: {
        'frame_width': 1920,
        'frame_height': 1080,
        'frame_rate': 30,
        'bitrate': 25000
      },
      thumbnail: 'https://via.placeholder.com/300x200/16a34a/ffffff?text=Player+19',
      url: 'https://example.com/video2.mp4',
      created_at: '2024-01-16T14:30:00Z',
      updated_at: '2024-01-16T14:30:00Z',
      score: 0.92
    },
    {
      id: '3',
      type: 'segment',
      title: 'Goal Scored by Player #19',
      description: 'Specific moment when player #19 scored a goal',
      format: 'video',
      codec: 'H.264',
      duration: 45, // 45 seconds
      size: 268435456, // 250MB
      tags: {
        'sport': 'football',
        'player.jersey_number': '19',
        'player.team': 'Team A',
        'action': 'goal_scored',
        'moment': 'goal',
        'camera': 'main',
        'quality': '4K'
      },
      metadata: {
        'frame_width': 3840,
        'frame_height': 2160,
        'frame_rate': 60,
        'bitrate': 50000
      },
      thumbnail: 'https://via.placeholder.com/300x200/dc2626/ffffff?text=Goal+Scored',
      url: 'https://example.com/video3.mp4',
      created_at: '2024-01-15T15:45:00Z',
      updated_at: '2024-01-15T15:45:00Z',
      score: 0.98
    },
    {
      id: '4',
      type: 'source',
      title: 'Team A Training Session',
      description: 'Behind the scenes training footage including player #19',
      format: 'video',
      codec: 'H.264',
      duration: 3600, // 1 hour
      size: 1610612736, // 1.5GB
      tags: {
        'sport': 'football',
        'player.jersey_number': '19',
        'player.team': 'Team A',
        'type': 'training',
        'camera': 'behind_scenes',
        'quality': '1080p'
      },
      metadata: {
        'frame_width': 1920,
        'frame_height': 1080,
        'frame_rate': 30,
        'bitrate': 20000
      },
      thumbnail: 'https://via.placeholder.com/300x200/7c3aed/ffffff?text=Training+Session',
      url: 'https://example.com/video4.mp4',
      created_at: '2024-01-14T09:00:00Z',
      updated_at: '2024-01-14T09:00:00Z',
      score: 0.87
    },
    {
      id: '5',
      type: 'flow',
      title: 'Player #19 Interview',
      description: 'Post-match interview with player #19 about the game',
      format: 'video',
      codec: 'H.264',
      duration: 300, // 5 minutes
      size: 134217728, // 125MB
      tags: {
        'sport': 'football',
        'player.jersey_number': '19',
        'player.team': 'Team A',
        'type': 'interview',
        'camera': 'interview',
        'quality': '1080p'
      },
      metadata: {
        'frame_width': 1920,
        'frame_height': 1080,
        'frame_rate': 25,
        'bitrate': 15000
      },
      thumbnail: 'https://via.placeholder.com/300x200/ea580c/ffffff?text=Player+Interview',
      url: 'https://example.com/video5.mp4',
      created_at: '2024-01-15T18:00:00Z',
      updated_at: '2024-01-15T18:00:00Z',
      score: 0.89
    }
  ];

  // Simulate AI-powered search
  const performAISearch = useCallback(async (query: AdvancedSearchQuery): Promise<SearchResult[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Filter mock results based on query
    let filtered = [...mockResults];
    
    // Apply basic filters
    if (query.format) {
      filtered = filtered.filter(result => result.format === query.format);
    }
    
    if (query.codec) {
      filtered = filtered.filter(result => result.codec === query.codec);
    }
    
    if (query.label) {
      filtered = filtered.filter(result => 
        result.title.toLowerCase().includes(query.label!.toLowerCase()) ||
        result.description?.toLowerCase().includes(query.label!.toLowerCase())
      );
    }
    
    // Apply tag filters
    if (query.tags) {
      Object.entries(query.tags).forEach(([key, value]) => {
        filtered = filtered.filter(result => result.tags[key] === value);
      });
    }
    
    // Apply tag existence filters
    if (query.tagExists) {
      Object.entries(query.tagExists).forEach(([key, exists]) => {
        if (exists) {
          filtered = filtered.filter(result => result.tags[key]);
        } else {
          filtered = filtered.filter(result => !result.tags[key]);
        }
      });
    }
    
    // Apply AI confidence threshold
    if (aiSearchEnabled) {
      filtered = filtered.filter(result => (result.score || 0) >= aiConfidence);
    }
    
    // Sort by relevance score
    filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    return filtered;
  }, [aiSearchEnabled, aiConfidence]);

  // Handle search execution
  const handleSearch = useCallback(async (query: AdvancedSearchQuery) => {
    setCurrentQuery(query);
    setLoading(true);
    setCurrentPage(1);
    
    try {
      const results = await performAISearch(query);
      setSearchResults(results);
      setTotalResults(results.length);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [performAISearch]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // In real implementation, this would trigger a new API call with pagination
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    onResultClick?.(result);
  };

  // Handle export
  const handleExport = (results: SearchResult[]) => {
    onExport?.(results);
  };

  // Handle share
  const handleShare = (result: SearchResult) => {
    onShare?.(result);
  };

  // Handle save query
  const handleSaveQuery = (query: AdvancedSearchQuery) => {
    onSaveQuery?.(query);
  };

  // Handle load query
  const handleLoadQuery = (query: AdvancedSearchQuery) => {
    setCurrentQuery(query);
    handleSearch(query);
  };

  // Get query summary for display
  const getQuerySummary = (query: AdvancedSearchQuery): string => {
    const parts: string[] = [];
    
    if (query.format) parts.push(`Format: ${query.format}`);
    if (query.codec) parts.push(`Codec: ${query.codec}`);
    if (query.label) parts.push(`Label: ${query.label}`);
    
    if (query.tags) {
      Object.entries(query.tags).forEach(([key, value]) => {
        parts.push(`${key}: ${value}`);
      });
    }
    
    if (query.tagExists) {
      Object.entries(query.tagExists).forEach(([key, exists]) => {
        parts.push(`${key}: ${exists ? 'required' : 'excluded'}`);
      });
    }
    
    return parts.join(', ');
  };

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Box>
            <Title order={2}>AI-Powered Content Discovery</Title>
            <Text size="lg" c="dimmed">
              Find exactly what you're looking for with BBC TAMS v6.0 advanced search and AI content recognition
            </Text>
          </Box>
          
          <Group>
            <Button
              variant="light"
              leftSection={<IconHistory size={16} />}
              onClick={() => setShowQueryHistory(true)}
            >
              Query History
            </Button>
            <Button
              variant="light"
              leftSection={<IconSettings size={16} />}
              onClick={() => setShowSettings(true)}
            >
              Settings
            </Button>
          </Group>
        </Group>

        {/* BBC TAMS Search Hierarchy Info */}
        <Alert icon={<IconInfoCircle size={16} />} title="BBC TAMS Search Strategy" color="blue">
          <Text size="sm" mb="xs">
            <strong>Understanding BBC TAMS Content Hierarchy:</strong>
          </Text>
          <Text size="sm" mb="xs">
            • <strong>Sources</strong> 📁 - Original media files (raw camera footage, uploaded videos)<br/>
            • <strong>Flows</strong> 🎬 - Processed/derived content from sources (edited highlights, transcoded versions)<br/>
            • <strong>Segments</strong> 🎯 - Specific time-based portions of flows (individual moments, clips)
          </Text>
          <Text size="sm" mb="xs">
            <strong>Recommended Search Strategy:</strong>
          </Text>
          <Text size="sm" mb="xs">
            • <strong>Search Sources first</strong> - They contain the richest metadata and original content<br/>
            • <strong>Then search Flows</strong> - For derived content that may have enhanced metadata<br/>
            • <strong>Finally search Segments</strong> - For precise moments within specific flows
          </Text>
          <Text size="sm" c="dimmed">
            This approach follows BBC TAMS v6.0 best practices and ensures comprehensive content discovery.
          </Text>
          
          <Text size="sm" mt="xs">
            <strong>Example:</strong> To find "all video where player #19 appears":
          </Text>
          <Text size="sm" c="dimmed" mt="xs">
            1. <strong>Search Sources:</strong> Find original match recordings with player #19<br/>
            2. <strong>Search Flows:</strong> Find highlight reels featuring player #19<br/>
            3. <strong>Search Segments:</strong> Find specific moments (goals, assists) by player #19
          </Text>
        </Alert>

        {/* Search Mode Selection */}
        <Card withBorder p="md">
          <Group justify="space-between" align="center">
            <Text fw={500}>Search Mode</Text>
            <Group>
              <Button
                variant={searchMode === 'basic' ? 'filled' : 'light'}
                size="sm"
                onClick={() => setSearchMode('basic')}
              >
                Basic
              </Button>
              <Button
                variant={searchMode === 'advanced' ? 'filled' : 'light'}
                size="sm"
                onClick={() => setSearchMode('advanced')}
              >
                Advanced
              </Button>
              <Button
                variant={searchMode === 'ai' ? 'filled' : 'light'}
                size="sm"
                leftSection={<IconBrain size={16} />}
                onClick={() => setSearchMode('ai')}
              >
                AI-Powered
              </Button>
            </Group>
          </Group>
          
          <Text size="sm" c="dimmed" mt="xs">
            {searchMode === 'basic' && 'Simple search with basic filters'}
            {searchMode === 'advanced' && 'Complex search with tag filtering and custom parameters'}
            {searchMode === 'ai' && 'AI-powered search with content recognition and relevance scoring'}
          </Text>
        </Card>

        {/* Search Interface */}
        <AdvancedSearchBuilder
          onSearch={handleSearch}
          onSaveQuery={handleSaveQuery}
          onLoadQuery={handleLoadQuery}
          savedQueries={savedQueries}
          initialQuery={currentQuery}
        />

        {/* Current Query Display */}
        {currentQuery && (
          <Card withBorder p="md">
            <Group justify="space-between" align="center">
              <Box>
                <Text fw={500} mb="xs">Current Search Query</Text>
                <Text size="sm" c="dimmed">{getQuerySummary(currentQuery)}</Text>
              </Box>
              <Badge color="blue" variant="light">
                {searchMode === 'ai' ? 'AI-Powered' : 'Advanced'} Search
              </Badge>
            </Group>
          </Card>
        )}

        {/* Search Results */}
        {currentQuery && (
          <SearchResultViewer
            results={searchResults}
            loading={loading}
            totalResults={totalResults}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onResultClick={handleResultClick}
            onExport={handleExport}
            onShare={handleShare}
            query={getQuerySummary(currentQuery)}
          />
        )}

        {/* No Results State */}
        {currentQuery && !loading && searchResults.length === 0 && (
          <Card withBorder p="lg">
            <Stack align="center" gap="md">
              <IconSearch size={48} color="gray" />
              <Title order={4}>No Results Found</Title>
              <Text c="dimmed" ta="center">
                Try adjusting your search criteria or using different tags. 
                {aiSearchEnabled && ' You can also lower the AI confidence threshold in settings.'}
              </Text>
              <Group>
                <Button variant="light" onClick={() => setCurrentQuery(null)}>
                  Start New Search
                </Button>
                <Button variant="light" onClick={() => setShowSettings(true)}>
                  Adjust Settings
                </Button>
              </Group>
            </Stack>
          </Card>
        )}

        {/* Query History Modal */}
        <Modal
          opened={showQueryHistory}
          onClose={() => setShowQueryHistory(false)}
          title="Search Query History"
          size="lg"
        >
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Your previously saved search queries for quick access
            </Text>
            
            {savedQueries.length === 0 ? (
              <Alert icon={<IconInfoCircle size={16} />}>
                No saved queries yet. Save your first query to get started!
              </Alert>
            ) : (
              <Stack gap="sm">
                {savedQueries.map((query, index) => (
                  <Card key={index} withBorder p="sm" style={{ cursor: 'pointer' }} onClick={() => handleLoadQuery(query)}>
                    <Group justify="space-between">
                      <Box>
                        <Text fw={500}>{query.name}</Text>
                        <Text size="sm" c="dimmed">{query.description}</Text>
                        <Text size="xs" c="dimmed">{getQuerySummary(query)}</Text>
                      </Box>
                      <Badge variant="light">{query.saved ? 'Saved' : 'Recent'}</Badge>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </Modal>

        {/* Settings Modal */}
        <Modal
          opened={showSettings}
          onClose={() => setShowSettings(false)}
          title="Search Settings"
          size="md"
        >
          <Stack gap="md">
            <Box>
              <Text fw={500} mb="xs">AI Search Settings</Text>
              <Switch
                label="Enable AI-powered content recognition"
                checked={aiSearchEnabled}
                onChange={(event) => setAiSearchEnabled(event.currentTarget.checked)}
                description="Use AI to analyze content and provide relevance scoring"
              />
            </Box>
            
            {aiSearchEnabled && (
              <Box>
                <Text fw={500} mb="xs">AI Confidence Threshold</Text>
                <Text size="sm" c="dimmed" mb="xs">
                  Minimum confidence score (0.0 - 1.0) for AI results
                </Text>
                <Select
                  value={aiConfidence.toString()}
                  onChange={(value) => setAiConfidence(parseFloat(value || '0.7'))}
                  data={[
                    { value: '0.5', label: '0.5 - Low (More results)' },
                    { value: '0.7', label: '0.7 - Medium (Balanced)' },
                    { value: '0.8', label: '0.8 - High (Fewer, more relevant)' },
                    { value: '0.9', label: '0.9 - Very High (Most relevant only)' }
                  ]}
                />
              </Box>
            )}
            
            <Box>
              <Text fw={500} mb="xs">Display Settings</Text>
              <Select
                label="Default page size"
                value={pageSize.toString()}
                onChange={(value) => setPageSize(parseInt(value || '20'))}
                data={[
                  { value: '10', label: '10 results per page' },
                  { value: '20', label: '20 results per page' },
                  { value: '50', label: '50 results per page' },
                  { value: '100', label: '100 results per page' }
                ]}
              />
            </Box>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
}
