import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Badge,
  Box,
  Alert,
  Code,
  Tabs,
  Switch,
  Progress,
  Divider,
  Collapse,
  ActionIcon,
  Tooltip,
  Modal,
  Grid
} from '@mantine/core';
import { 
  IconSearch, 
  IconDatabase, 
  IconVideo, 
  IconTarget, 
  IconBrain, 
  IconInfoCircle, 
  IconEye, 
  IconLink, 
  IconFilter,
  IconSortAscending,
    IconSortDescending,
    IconRefresh,
    IconSettings,
    IconChartBar
} from '@tabler/icons-react';
import { AdvancedSearchQuery } from './AdvancedSearchBuilder';
import { SearchResult } from './SearchResultViewer';

export interface MultiEntitySearchProps {
  onSearch: (query: AdvancedSearchQuery, strategy: SearchStrategy) => void;
  onResultClick?: (result: SearchResult) => void;
  onExport?: (results: SearchResult[]) => void;
  onShare?: (result: SearchResult) => void;
  savedQueries?: AdvancedSearchQuery[];
  onSaveQuery?: (query: AdvancedSearchQuery) => void;
  onLoadQuery?: (query: AdvancedSearchQuery) => void;
}

export interface SearchStrategy {
  sources: boolean;
  flows: boolean;
  segments: boolean;
  searchOrder: 'bbc-tams' | 'custom';
  customOrder?: ('sources' | 'flows' | 'segments')[];
  deduplication: boolean;
  relationshipMapping: boolean;
}

export interface EntitySearchResult {
  entityType: 'sources' | 'flows' | 'segments';
  results: SearchResult[];
  count: number;
  searchTime: number;
  errors?: string[];
}

export interface UnifiedSearchResult {
  strategy: SearchStrategy;
  entityResults: EntitySearchResult[];
  totalResults: number;
  totalSearchTime: number;
  relationships: ContentRelationship[];
  deduplicatedResults: SearchResult[];
}

export interface ContentRelationship {
  sourceId: string;
  flowIds: string[];
  segmentIds: string[];
  relationshipType: 'derived' | 'composed' | 'extracted';
  metadata: Record<string, any>;
}

export default function MultiEntitySearch({
  onSearch,
  onResultClick,
  onExport,
  onShare,
  savedQueries = [],
  onSaveQuery,
  onLoadQuery
}: MultiEntitySearchProps) {
  const [searchStrategy, setSearchStrategy] = useState<SearchStrategy>({
    sources: true,
    flows: true,
    segments: true,
    searchOrder: 'bbc-tams',
    deduplication: true,
    relationshipMapping: true
  });

  const [customOrder, setCustomOrder] = useState<('sources' | 'flows' | 'segments')[]>([
    'sources', 'flows', 'segments'
  ]);

  const [currentQuery, setCurrentQuery] = useState<AdvancedSearchQuery | null>(null);
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [showRelationships, setShowRelationships] = useState(false);

  // Mock data for demonstration - in real implementation, this would come from API
  const mockEntityResults: EntitySearchResult[] = [
    {
      entityType: 'sources',
      results: [
        {
          id: 'source-1',
          type: 'source',
          title: 'Football Match - Team A vs Team B',
          description: 'Complete match recording with player #19',
          format: 'video',
          codec: 'H.264',
          duration: 5400,
          size: 2147483648,
          tags: {
            'sport': 'football',
            'player.jersey_number': '19',
            'player.team': 'Team A',
            'venue': 'stadium',
            'competition': 'Premier League'
          },
          metadata: { frame_width: 3840, frame_height: 2160 },
          thumbnail: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Match+Recording',
          url: 'https://example.com/source1.mp4',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          score: 0.95
        }
      ],
      count: 1,
      searchTime: 0.8
    },
    {
      entityType: 'flows',
      results: [
        {
          id: 'flow-1',
          type: 'flow',
          title: 'Player #19 Highlights',
          description: 'Compilation of all player #19 moments',
          format: 'video',
          codec: 'H.265',
          duration: 1800,
          size: 1073741824,
          tags: {
            'sport': 'football',
            'player.jersey_number': '19',
            'player.team': 'Team A',
            'type': 'highlights',
            'source': 'source-1'
          },
          metadata: { frame_width: 1920, frame_height: 1080 },
          thumbnail: 'https://via.placeholder.com/300x200/16a34a/ffffff?text=Highlights',
          url: 'https://example.com/flow1.mp4',
          created_at: '2024-01-16T14:30:00Z',
          updated_at: '2024-01-16T14:30:00Z',
          score: 0.92
        }
      ],
      count: 1,
      searchTime: 0.6
    },
    {
      entityType: 'segments',
      results: [
        {
          id: 'segment-1',
          type: 'segment',
          title: 'Player #19 Goal',
          description: 'Specific goal moment by player #19',
          format: 'video',
          codec: 'H.264',
          duration: 45,
          size: 268435456,
          tags: {
            'sport': 'football',
            'player.jersey_number': '19',
            'player.team': 'Team A',
            'action': 'goal_scored',
            'source': 'source-1',
            'flow': 'flow-1'
          },
          metadata: { frame_width: 3840, frame_height: 2160 },
          thumbnail: 'https://via.placeholder.com/300x200/dc2626/ffffff?text=Goal',
          url: 'https://example.com/segment1.mp4',
          created_at: '2024-01-15T15:45:00Z',
          updated_at: '2024-01-15T15:45:00Z',
          score: 0.98
        }
      ],
      count: 1,
      searchTime: 0.4
    }
  ];

  const mockRelationships: ContentRelationship[] = [
    {
      sourceId: 'source-1',
      flowIds: ['flow-1'],
      segmentIds: ['segment-1'],
      relationshipType: 'derived',
      metadata: {
        'derivation_method': 'ai_extraction',
        'confidence': 0.95,
        'processing_date': '2024-01-16T14:30:00Z'
      }
    }
  ];

  // Simulate multi-entity search
  const performMultiEntitySearch = useCallback(async (query: AdvancedSearchQuery, strategy: SearchStrategy): Promise<UnifiedSearchResult> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Filter results based on strategy
    const filteredResults = mockEntityResults.filter(result => 
      strategy[result.entityType as keyof SearchStrategy]
    );
    
    // Apply search order
    let orderedResults = [...filteredResults];
    if (strategy.searchOrder === 'bbc-tams') {
      // BBC TAMS recommended order: Sources -> Flows -> Segments
      const order = ['sources', 'flows', 'segments'];
      orderedResults.sort((a, b) => 
        order.indexOf(a.entityType) - order.indexOf(b.entityType)
      );
    } else if (strategy.customOrder) {
      orderedResults.sort((a, b) => 
        strategy.customOrder!.indexOf(a.entityType) - strategy.customOrder!.indexOf(b.entityType)
      );
    }
    
    // Deduplicate results if enabled
    let deduplicatedResults: SearchResult[] = [];
    if (strategy.deduplication) {
      const seen = new Set<string>();
      orderedResults.forEach(entityResult => {
        entityResult.results.forEach(result => {
          if (!seen.has(result.id)) {
            seen.add(result.id);
            deduplicatedResults.push(result);
          }
        });
      });
    } else {
      deduplicatedResults = orderedResults.flatMap(result => result.results);
    }
    
    return {
      strategy,
      entityResults: orderedResults,
      totalResults: deduplicatedResults.length,
      totalSearchTime: orderedResults.reduce((sum, result) => sum + result.searchTime, 0),
      relationships: strategy.relationshipMapping ? mockRelationships : [],
      deduplicatedResults
    };
  }, []);

  // Handle search execution
  const handleSearch = useCallback(async (query: AdvancedSearchQuery) => {
    setCurrentQuery(query);
    setLoading(true);
    
    try {
      const results = await performMultiEntitySearch(query, searchStrategy);
      setSearchResults(results);
      onSearch(query, searchStrategy);
    } catch (error) {
      console.error('Multi-entity search failed:', error);
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  }, [performMultiEntitySearch, searchStrategy, onSearch]);

  // Update search strategy
  const updateSearchStrategy = (updates: Partial<SearchStrategy>) => {
    setSearchStrategy(prev => ({ ...prev, ...updates }));
  };

  // Get entity type icon
  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'source': return '📁';
      case 'flow': return '🎬';
      case 'segment': return '🎯';
      default: return '📄';
    }
  };

  // Get entity type color
  const getEntityColor = (type: string) => {
    switch (type) {
      case 'source': return 'blue';
      case 'flow': return 'green';
      case 'segment': return 'orange';
      default: return 'gray';
    }
  };

  // Get BBC TAMS search order description
  const getSearchOrderDescription = () => {
    if (searchStrategy.searchOrder === 'bbc-tams') {
      return 'TAMS v6.0 recommended order: Sources → Flows → Segments';
    } else {
      return `Custom order: ${customOrder.join(' → ')}`;
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Box>
            <Title order={3}>Multi-Entity Search</Title>
            <Text size="lg" c="dimmed">
              TAMS v6.0 compliant search across Sources, Flows, and Segments
            </Text>
          </Box>
          
          <Group>
            <Button
              variant="light"
              leftSection={<IconSettings size={16} />}
              onClick={() => setShowStrategyModal(true)}
            >
              Search Strategy
            </Button>
            <Button
              variant="light"
              leftSection={<IconChartBar size={16} />}
              onClick={() => setShowRelationships(!showRelationships)}
            >
              {showRelationships ? 'Hide' : 'Show'} Relationships
            </Button>
          </Group>
        </Group>

        {/* TAMS Search Strategy Info */}
        <Alert icon={<IconInfoCircle size={16} />} title="TAMS Multi-Entity Search Strategy" color="blue">
          <Text size="sm" mb="xs">
            <strong>Recommended Search Order:</strong>
          </Text>
          <Text size="sm" mb="xs">
            1. <strong>Sources</strong> 📁 - Search original content first (richest metadata)<br/>
            2. <strong>Flows</strong> 🎬 - Search derived content second (enhanced metadata)<br/>
            3. <strong>Segments</strong> 🎯 - Search specific moments last (precise metadata)
          </Text>
          <Text size="sm" c="dimmed">
            This approach ensures comprehensive content discovery while following TAMS v6.0 best practices.
          </Text>
        </Alert>

        {/* Search Strategy Configuration */}
        <Card withBorder p="md">
          <Title order={4} mb="md">Search Strategy Configuration</Title>
          
          <SimpleGrid cols={2}>
            <Box>
              <Text fw={500} mb="xs">Entity Types to Search</Text>
              <Stack gap="xs">
                <Switch
                  label="Sources (Original Content)"
                  checked={searchStrategy.sources}
                  onChange={(event) => updateSearchStrategy({ sources: event.currentTarget.checked })}
                />
                <Switch
                  label="Flows (Derived Content)"
                  checked={searchStrategy.flows}
                  onChange={(event) => updateSearchStrategy({ flows: event.currentTarget.checked })}
                />
                <Switch
                  label="Segments (Specific Moments)"
                  checked={searchStrategy.segments}
                  onChange={(event) => updateSearchStrategy({ segments: event.currentTarget.checked })}
                />
              </Stack>
            </Box>
            
            <Box>
              <Text fw={500} mb="xs">Search Options</Text>
              <Stack gap="xs">
                <Switch
                  label="BBC TAMS Recommended Order"
                  checked={searchStrategy.searchOrder === 'bbc-tams'}
                  onChange={(event) => updateSearchStrategy({ 
                    searchOrder: event.currentTarget.checked ? 'bbc-tams' : 'custom' 
                  })}
                />
                <Switch
                  label="Enable Deduplication"
                  checked={searchStrategy.deduplication}
                  onChange={(event) => updateSearchStrategy({ deduplication: event.currentTarget.checked })}
                />
                <Switch
                  label="Map Content Relationships"
                  checked={searchStrategy.relationshipMapping}
                  onChange={(event) => updateSearchStrategy({ relationshipMapping: event.currentTarget.checked })}
                />
              </Stack>
            </Box>
          </SimpleGrid>
          
          <Text size="sm" c="dimmed" mt="md">
            {getSearchOrderDescription()}
          </Text>
        </Card>

        {/* Search Interface Placeholder */}
        <Card withBorder p="md">
          <Text fw={500} mb="xs">Search Interface</Text>
          <Text size="sm" c="dimmed">
            The advanced search interface will be integrated here. Users can build complex queries 
            that will be executed across all selected entity types following the TAMS strategy.
          </Text>
          <Button mt="md" onClick={() => handleSearch({ format: 'video', tags: { 'player.jersey_number': '19' } })}>
            Execute Multi-Entity Search
          </Button>
        </Card>

        {/* Search Results */}
        {loading && (
          <Alert icon={<IconSearch size={16} />}>
            <Text size="sm" mb="xs">Executing Multi-Entity Search...</Text>
            <Progress value={75} size="sm" color="blue" />
            <Text size="xs" c="dimmed" mt="xs">
              Following TAMS v6.0 search strategy: Sources → Flows → Segments
            </Text>
          </Alert>
        )}

        {searchResults && (
          <Stack gap="md">
            {/* Results Summary */}
            <Card withBorder p="md">
              <Group justify="space-between" align="center">
                <Box>
                  <Title order={4}>Search Results</Title>
                  <Text size="sm" c="dimmed">
                    {searchResults.totalResults} results found in {searchResults.totalSearchTime.toFixed(2)}s
                  </Text>
                </Box>
                <Badge color="blue" variant="light">
                  {searchStrategy.searchOrder === 'bbc-tams' ? 'TAMS Strategy' : 'Custom Strategy'}
                </Badge>
              </Group>
            </Card>

            {/* Entity Results */}
            <Tabs defaultValue="summary">
              <Tabs.List>
                <Tabs.Tab value="summary" leftSection={<IconChartBar size={16} />}>
                  Summary
                </Tabs.Tab>
                <Tabs.Tab value="sources" leftSection={<IconDatabase size={16} />}>
                  Sources ({searchResults.entityResults.find(r => r.entityType === 'sources')?.count || 0})
                </Tabs.Tab>
                <Tabs.Tab value="flows" leftSection={<IconVideo size={16} />}>
                  Flows ({searchResults.entityResults.find(r => r.entityType === 'flows')?.count || 0})
                </Tabs.Tab>
                <Tabs.Tab value="segments" leftSection={<IconTarget size={16} />}>
                  Segments ({searchResults.entityResults.find(r => r.entityType === 'segments')?.count || 0})
                </Tabs.Tab>
                <Tabs.Tab value="relationships" leftSection={<IconLink size={16} />}>
                  Relationships ({searchResults.relationships.length})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="summary" pt="md">
                <SimpleGrid cols={3}>
                  {searchResults.entityResults.map((entityResult) => (
                    <Card key={entityResult.entityType} withBorder p="md">
                      <Group justify="space-between" align="center" mb="sm">
                        <Badge color={getEntityColor(entityResult.entityType)} size="lg">
                          {getEntityIcon(entityResult.entityType)} {entityResult.entityType}
                        </Badge>
                        <Text fw={700} size="xl">{entityResult.count}</Text>
                      </Group>
                      <Text size="sm" c="dimmed" mb="xs">
                        {entityResult.results.length} results found
                      </Text>
                      <Text size="xs" c="dimmed">
                        Search time: {entityResult.searchTime.toFixed(2)}s
                      </Text>
                    </Card>
                  ))}
                </SimpleGrid>
              </Tabs.Panel>

              <Tabs.Panel value="sources" pt="md">
                <EntityResultsPanel 
                  entityType="sources"
                  results={searchResults.entityResults.find(r => r.entityType === 'sources')?.results || []}
                  {...(onResultClick && { onResultClick })}
                />
              </Tabs.Panel>

              <Tabs.Panel value="flows" pt="md">
                <EntityResultsPanel 
                  entityType="flows"
                  results={searchResults.entityResults.find(r => r.entityType === 'flows')?.results || []}
                  {...(onResultClick && { onResultClick })}
                />
              </Tabs.Panel>

              <Tabs.Panel value="segments" pt="md">
                <EntityResultsPanel 
                  entityType="segments"
                  results={searchResults.entityResults.find(r => r.entityType === 'segments')?.results || []}
                  {...(onResultClick && { onResultClick })}
                />
              </Tabs.Panel>

              <Tabs.Panel value="relationships" pt="md">
                <ContentRelationshipsPanel relationships={searchResults.relationships} />
              </Tabs.Panel>
            </Tabs>
          </Stack>
        )}

        {/* Search Strategy Modal */}
        <Modal
          opened={showStrategyModal}
          onClose={() => setShowStrategyModal(false)}
          title="Search Strategy Configuration"
          size="lg"
        >
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Configure how the multi-entity search should be executed according to TAMS v6.0 guidelines.
            </Text>
            
            <Box>
              <Text fw={500} mb="xs">Search Order Strategy</Text>
              <Group gap="md">
                <Switch
                  label="BBC TAMS Recommended"
                  checked={searchStrategy.searchOrder === 'bbc-tams'}
                  onChange={(event) => updateSearchStrategy({ 
                    searchOrder: event.currentTarget.checked ? 'bbc-tams' : 'custom' 
                  })}
                />
                <Switch
                  label="Custom Order"
                  checked={searchStrategy.searchOrder === 'custom'}
                  onChange={(event) => updateSearchStrategy({ 
                    searchOrder: event.currentTarget.checked ? 'custom' : 'bbc-tams' 
                  })}
                />
              </Group>
            </Box>
            
            {searchStrategy.searchOrder === 'custom' && (
              <Box>
                <Text fw={500} mb="xs">Custom Search Order</Text>
                <Text size="sm" c="dimmed" mb="xs">
                  Drag and drop to reorder the search sequence
                </Text>
                {/* Custom order interface would go here */}
              </Box>
            )}
            
            <Box>
              <Text fw={500} mb="xs">Advanced Options</Text>
              <Stack gap="xs">
                <Switch
                  label="Enable Result Deduplication"
                  checked={searchStrategy.deduplication}
                  onChange={(event) => updateSearchStrategy({ deduplication: event.currentTarget.checked })}
                  description="Remove duplicate content across entity types"
                />
                <Switch
                  label="Map Content Relationships"
                  checked={searchStrategy.relationshipMapping}
                  onChange={(event) => updateSearchStrategy({ relationshipMapping: event.currentTarget.checked })}
                  description="Show how Sources, Flows, and Segments relate to each other"
                />
              </Stack>
            </Box>
          </Stack>
        </Modal>
      </Stack>
    </Card>
  );
}

// Helper component for displaying entity results
function EntityResultsPanel({ 
  entityType, 
  results, 
  onResultClick 
}: { 
  entityType: string; 
  results: SearchResult[]; 
  onResultClick?: (result: SearchResult) => void;
}) {
  if (results.length === 0) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} color="yellow">
        No {entityType} results found for this search query.
      </Alert>
    );
  }

  return (
    <Stack gap="sm">
      {results.map((result) => (
        <Card key={result.id} withBorder p="sm" style={{ cursor: 'pointer' }} onClick={() => onResultClick?.(result)}>
          <Group gap="md" align="flex-start">
            {result.thumbnail && (
              <img 
                src={result.thumbnail} 
                alt={result.title}
                style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }}
              />
            )}
            
            <Box style={{ flex: 1 }}>
              <Group justify="space-between" align="flex-start" mb="xs">
                <Text fw={500} size="lg">{result.title}</Text>
                <Badge color="blue" variant="light">{entityType}</Badge>
              </Group>
              
              {result.description && (
                <Text size="sm" c="dimmed" mb="sm">{result.description}</Text>
              )}
              
              <Group gap="xs">
                {Object.entries(result.tags).slice(0, 5).map(([key, value]) => (
                  <Badge key={key} size="sm" variant="light">
                    {key}: {value}
                  </Badge>
                ))}
                {Object.keys(result.tags).length > 5 && (
                  <Badge size="sm" variant="light">+{Object.keys(result.tags).length - 5} more</Badge>
                )}
              </Group>
            </Box>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}

// Helper component for displaying content relationships
function ContentRelationshipsPanel({ relationships }: { relationships: ContentRelationship[] }) {
  if (relationships.length === 0) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} color="yellow">
        No content relationships found. Enable relationship mapping in search strategy to see how content relates.
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Content relationships show how Sources, Flows, and Segments are connected.
      </Text>
      
      {relationships.map((relationship, index) => (
        <Card key={index} withBorder p="md">
          <Title order={5} mb="sm">Content Relationship #{index + 1}</Title>
          
          <SimpleGrid cols={3}>
            <Box>
              <Text fw={500} mb="xs">Source</Text>
              <Badge color="blue" variant="light">{relationship.sourceId}</Badge>
            </Box>
            
            <Box>
              <Text fw={500} mb="xs">Flows</Text>
              <Group gap="xs">
                {relationship.flowIds.map(id => (
                  <Badge key={id} color="green" variant="light">{id}</Badge>
                ))}
              </Group>
            </Box>
            
            <Box>
              <Text fw={500} mb="xs">Segments</Text>
              <Group gap="xs">
                {relationship.segmentIds.map(id => (
                  <Badge key={id} color="orange" variant="light">{id}</Badge>
                ))}
              </Group>
            </Box>
          </SimpleGrid>
          
          <Divider my="md" />
          
          <Group justify="space-between" align="center">
            <Badge variant="outline">{relationship.relationshipType}</Badge>
            <Text size="sm" c="dimmed">
              Confidence: {(relationship.metadata.confidence * 100).toFixed(0)}%
            </Text>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}

// Helper component for simple grid layout
function SimpleGrid({ children, cols = 2, ...props }: { children: React.ReactNode; cols?: number; [key: string]: any }) {
  return (
    <Box
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: '1rem',
        ...props
      }}
    >
      {children}
    </Box>
  );
}
