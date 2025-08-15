import React, { useState } from 'react';
import {
  Card,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Badge,
  Box,
  Table,
  Pagination,
  Select,
  TextInput,
  ActionIcon,
  Tooltip,
  Collapse,
  Alert,
  Code,
  Divider,
  Modal,
  SimpleGrid,
  Image,
  Progress,
  Chip
} from '@mantine/core';
import { 
  IconEye, 
  IconDownload, 
  IconShare, 
  IconHeart, 
  IconClock, 
  IconTag, 
  IconFilter, 
  IconSortAscending,
  IconSortDescending,
  IconInfoCircle,
  IconPlayerPlay,
  IconMaximize,
  IconSearch
} from '@tabler/icons-react';

export interface SearchResult {
  id: string;
  type: 'source' | 'flow' | 'segment';
  title: string;
  description?: string;
  format: string;
  codec?: string;
  duration?: number;
  size?: number;
  tags: Record<string, string>;
  metadata: Record<string, any>;
  thumbnail?: string;
  url?: string;
  created_at: string;
  updated_at: string;
  score?: number; // Relevance score for AI-powered search
}

export interface SearchResultViewerProps {
  results: SearchResult[];
  loading?: boolean;
  totalResults?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onResultClick?: (result: SearchResult) => void;
  onExport?: (results: SearchResult[]) => void;
  onShare?: (result: SearchResult) => void;
  query?: string;
}

export default function SearchResultViewer({
  results,
  loading = false,
  totalResults = 0,
  currentPage = 1,
  pageSize = 20,
  onPageChange,
  onResultClick,
  onExport,
  onShare,
  query
}: SearchResultViewerProps) {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'list'>('table');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Sort options
  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'title', label: 'Title' },
    { value: 'created_at', label: 'Date Created' },
    { value: 'updated_at', label: 'Date Updated' },
    { value: 'duration', label: 'Duration' },
    { value: 'size', label: 'File Size' },
    { value: 'score', label: 'AI Score' }
  ];

  // View mode options
  const viewModeOptions = [
    { value: 'table', label: 'Table', icon: '📊' },
    { value: 'grid', label: 'Grid', icon: '🔲' },
    { value: 'list', label: 'List', icon: '📝' }
  ];

  // Get all unique tags from results
  const allTags = Array.from(new Set(
    results.flatMap(result => Object.keys(result.tags))
  )).sort();

  // Filter and sort results
  const filteredResults = results
    .filter(result => {
      // Filter by search term
      if (searchTerm && !result.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !result.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filter by selected tags
      if (filterTags.length > 0) {
        return filterTags.every(tag => result.tags[tag]);
      }
      
      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        case 'size':
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        case 'score':
          aValue = a.score || 0;
          bValue = b.score || 0;
          break;
        default: // relevance
          aValue = a.score || 0;
          bValue = b.score || 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const toggleTagFilter = (tag: string) => {
    setFilterTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'source': return '📁';
      case 'flow': return '🎬';
      case 'segment': return '🎯';
      default: return '📄';
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case 'source': return 'blue';
      case 'flow': return 'green';
      case 'segment': return 'orange';
      default: return 'gray';
    }
  };

  const renderTableView = () => (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Content</Table.Th>
          <Table.Th>
            <Group gap="xs">
              <Text>Type</Text>
              <ActionIcon
                size="sm"
                variant={sortBy === 'type' ? 'filled' : 'subtle'}
                onClick={() => handleSort('type')}
              >
                {sortBy === 'type' && sortOrder === 'asc' ? <IconSortAscending size={14} /> : <IconSortDescending size={14} />}
              </ActionIcon>
            </Group>
          </Table.Th>
          <Table.Th>
            <Group gap="xs">
              <Text>Format</Text>
              <ActionIcon
                size="sm"
                variant={sortBy === 'format' ? 'filled' : 'subtle'}
                onClick={() => handleSort('format')}
              >
                {sortBy === 'format' && sortOrder === 'asc' ? <IconSortAscending size={14} /> : <IconSortDescending size={14} />}
              </ActionIcon>
            </Group>
          </Table.Th>
          <Table.Th>
            <Group gap="xs">
              <Text>Duration</Text>
              <ActionIcon
                size="sm"
                variant={sortBy === 'duration' ? 'filled' : 'subtle'}
                onClick={() => handleSort('duration')}
              >
                {sortBy === 'duration' && sortOrder === 'asc' ? <IconSortAscending size={14} /> : <IconSortDescending size={14} />}
              </ActionIcon>
            </Group>
          </Table.Th>
          <Table.Th>
            <Group gap="xs">
              <Text>Tags</Text>
            </Group>
          </Table.Th>
          <Table.Th>
            <Group gap="xs">
              <Text>Updated</Text>
              <ActionIcon
                size="sm"
                variant={sortBy === 'updated_at' ? 'filled' : 'subtle'}
                onClick={() => handleSort('updated_at')}
              >
                {sortBy === 'updated_at' && sortOrder === 'asc' ? <IconSortAscending size={14} /> : <IconSortDescending size={14} />}
              </ActionIcon>
            </Group>
          </Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {filteredResults.map((result) => (
          <Table.Tr key={result.id} style={{ cursor: 'pointer' }} onClick={() => onResultClick?.(result)}>
            <Table.Td>
              <Group gap="sm">
                {result.thumbnail && (
                  <Image
                    src={result.thumbnail}
                    alt={result.title}
                    width={60}
                    height={40}
                    fit="cover"
                    radius="sm"
                  />
                )}
                <Box>
                  <Text fw={500} size="sm">{result.title}</Text>
                  {result.description && (
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {result.description}
                    </Text>
                  )}
                  {result.score && (
                    <Progress
                      value={result.score * 100}
                      size="xs"
                      color="green"
                      style={{ width: 60 }}
                    />
                  )}
                </Box>
              </Group>
            </Table.Td>
            <Table.Td>
              <Badge color={getResultColor(result.type)} variant="light">
                {getResultIcon(result.type)} {result.type}
              </Badge>
            </Table.Td>
            <Table.Td>
              <Group gap="xs">
                <Badge variant="outline">{result.format}</Badge>
                {result.codec && <Badge variant="outline" size="xs">{result.codec}</Badge>}
              </Group>
            </Table.Td>
            <Table.Td>
              <Text size="sm">{formatDuration(result.duration)}</Text>
            </Table.Td>
            <Table.Td>
              <Group gap="xs">
                {Object.entries(result.tags).slice(0, 3).map(([key, value]) => (
                  <Badge key={key} size="xs" variant="light">
                    {key}: {value}
                  </Badge>
                ))}
                {Object.keys(result.tags).length > 3 && (
                  <Badge size="xs" variant="light">+{Object.keys(result.tags).length - 3}</Badge>
                )}
              </Group>
            </Table.Td>
            <Table.Td>
              <Text size="xs" c="dimmed">
                {new Date(result.updated_at).toLocaleDateString()}
              </Text>
            </Table.Td>
            <Table.Td>
              <Group gap="xs">
                <Tooltip label="View Details">
                  <ActionIcon size="sm" variant="light" onClick={(e) => { e.stopPropagation(); setSelectedResult(result); }}>
                    <IconEye size={14} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Play">
                  <ActionIcon size="sm" variant="light" onClick={(e) => { e.stopPropagation(); }}>
                    <IconPlayerPlay size={14} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Share">
                  <ActionIcon size="sm" variant="light" onClick={(e) => { e.stopPropagation(); onShare?.(result); }}>
                    <IconShare size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );

  const renderGridView = () => (
    <SimpleGrid cols={3}>
      {filteredResults.map((result) => (
        <Card key={result.id} withBorder p="md" style={{ cursor: 'pointer' }} onClick={() => onResultClick?.(result)}>
          {result.thumbnail && (
            <Image
              src={result.thumbnail}
              alt={result.title}
              height={120}
              fit="cover"
              radius="sm"
              mb="sm"
            />
          )}
          
          <Stack gap="xs">
            <Group justify="space-between" align="flex-start">
              <Text fw={500} size="sm" lineClamp={2}>{result.title}</Text>
              <Badge color={getResultColor(result.type)} size="sm">
                {getResultIcon(result.type)}
              </Badge>
            </Group>
            
            {result.description && (
              <Text size="xs" c="dimmed" lineClamp={2}>
                {result.description}
              </Text>
            )}
            
            <Group gap="xs">
              <Badge variant="outline" size="xs">{result.format}</Badge>
              {result.duration && (
                <Badge variant="light" size="xs" leftSection={<IconClock size={12} />}>
                  {formatDuration(result.duration)}
                </Badge>
              )}
            </Group>
            
            {result.score && (
              <Box>
                <Text size="xs" c="dimmed" mb="xs">Relevance Score</Text>
                <Progress value={result.score * 100} size="sm" color="green" />
              </Box>
            )}
            
            <Group gap="xs" justify="space-between">
              <Text size="xs" c="dimmed">
                {new Date(result.updated_at).toLocaleDateString()}
              </Text>
              <Group gap="xs">
                <ActionIcon size="sm" variant="light" onClick={(e) => { e.stopPropagation(); setSelectedResult(result); }}>
                  <IconEye size={14} />
                </ActionIcon>
                <ActionIcon size="sm" variant="light" onClick={(e) => { e.stopPropagation(); }}>
                  <IconPlayerPlay size={14} />
                </ActionIcon>
              </Group>
            </Group>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );

  const renderListView = () => (
    <Stack gap="md">
      {filteredResults.map((result) => (
        <Card key={result.id} withBorder p="md" style={{ cursor: 'pointer' }} onClick={() => onResultClick?.(result)}>
          <Group gap="md" align="flex-start">
            {result.thumbnail && (
              <Image
                src={result.thumbnail}
                alt={result.title}
                width={80}
                height={60}
                fit="cover"
                radius="sm"
              />
            )}
            
            <Box style={{ flex: 1 }}>
              <Group justify="space-between" align="flex-start" mb="xs">
                <Text fw={500} size="lg">{result.title}</Text>
                <Group gap="xs">
                  <Badge color={getResultColor(result.type)}>
                    {getResultIcon(result.type)} {result.type}
                  </Badge>
                  <Badge variant="outline">{result.format}</Badge>
                </Group>
              </Group>
              
              {result.description && (
                <Text size="sm" c="dimmed" mb="sm" lineClamp={2}>
                  {result.description}
                </Text>
              )}
              
              <Group gap="md" mb="sm">
                {result.duration && (
                  <Group gap="xs">
                    <IconClock size={16} />
                    <Text size="sm">{formatDuration(result.duration)}</Text>
                  </Group>
                )}
                {result.size && (
                  <Text size="sm">{formatFileSize(result.size)}</Text>
                )}
                <Text size="sm" c="dimmed">
                  Updated: {new Date(result.updated_at).toLocaleDateString()}
                </Text>
              </Group>
              
              <Group gap="xs" mb="sm">
                {Object.entries(result.tags).map(([key, value]) => (
                  <Badge key={key} size="sm" variant="light" leftSection={<IconTag size={12} />}>
                    {key}: {value}
                  </Badge>
                ))}
              </Group>
              
              {result.score && (
                <Box>
                  <Text size="xs" c="dimmed" mb="xs">AI Relevance Score</Text>
                  <Progress value={result.score * 100} size="sm" color="green" />
                </Box>
              )}
            </Box>
            
            <Group gap="xs">
              <ActionIcon size="lg" variant="light" onClick={(e) => { e.stopPropagation(); setSelectedResult(result); }}>
                <IconEye size={20} />
              </ActionIcon>
              <ActionIcon size="lg" variant="light" onClick={(e) => { e.stopPropagation(); }}>
                <IconPlayerPlay size={20} />
              </ActionIcon>
              <ActionIcon size="lg" variant="light" onClick={(e) => { e.stopPropagation(); onShare?.(result); }}>
                <IconShare size={20} />
              </ActionIcon>
            </Group>
          </Group>
        </Card>
      ))}
    </Stack>
  );

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Box>
            <Title order={3}>Search Results</Title>
            <Text size="sm" c="dimmed">
              {loading ? 'Searching...' : `${totalResults} results found`}
              {query && ` for "${query}"`}
            </Text>
          </Box>
          
          <Group>
            {onExport && (
              <Button
                variant="light"
                leftSection={<IconDownload size={16} />}
                onClick={() => onExport(filteredResults)}
                disabled={filteredResults.length === 0}
              >
                Export ({filteredResults.length})
              </Button>
            )}
            
            <Select
              value={viewMode}
              onChange={(value) => setViewMode(value as 'table' | 'grid' | 'list')}
              data={viewModeOptions}
              style={{ width: 120 }}
            />
          </Group>
        </Group>

        {/* Filters and Search */}
        <Card withBorder p="md">
          <Group gap="md" align="flex-end">
            <TextInput
              placeholder="Search in results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftSection={<IconSearch size={16} />}
              style={{ flex: 1 }}
            />
            
            <Select
              label="Sort by"
              value={sortBy}
              onChange={(value) => setSortBy(value || 'relevance')}
              data={sortOptions}
              style={{ width: 150 }}
            />
            
            <Button
              variant={sortOrder === 'asc' ? 'filled' : 'light'}
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              leftSection={sortOrder === 'asc' ? <IconSortAscending size={16} /> : <IconSortDescending size={16} />}
            >
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </Group>
          
          {/* Tag Filters */}
          {allTags.length > 0 && (
            <Box mt="md">
              <Text size="sm" fw={500} mb="xs">Filter by Tags:</Text>
              <Group gap="xs">
                {allTags.map(tag => (
                  <Chip
                    key={tag}
                    checked={filterTags.includes(tag)}
                    onChange={() => toggleTagFilter(tag)}
                    variant="light"
                    size="sm"
                  >
                    {tag}
                  </Chip>
                ))}
              </Group>
            </Box>
          )}
        </Card>

        {/* Results */}
        {loading ? (
          <Alert icon={<IconInfoCircle size={16} />}>
            Searching for content... This may take a few moments for complex queries.
          </Alert>
        ) : filteredResults.length === 0 ? (
          <Alert icon={<IconInfoCircle size={16} />} color="yellow">
            No results found. Try adjusting your search criteria or filters.
          </Alert>
        ) : (
          <Box>
            {viewMode === 'table' && renderTableView()}
            {viewMode === 'grid' && renderGridView()}
            {viewMode === 'list' && renderListView()}
          </Box>
        )}

        {/* Pagination */}
        {totalResults > pageSize && onPageChange && (
          <Group justify="center">
            <Pagination
              total={Math.ceil(totalResults / pageSize)}
              value={currentPage}
              onChange={onPageChange}
              size="lg"
            />
          </Group>
        )}
      </Stack>

      {/* Result Detail Modal */}
      <Modal
        opened={!!selectedResult}
        onClose={() => setSelectedResult(null)}
        title={selectedResult?.title}
        size="lg"
      >
        {selectedResult && (
          <Stack gap="md">
            {selectedResult.thumbnail && (
              <Image
                src={selectedResult.thumbnail}
                alt={selectedResult.title}
                height={200}
                fit="cover"
                radius="sm"
              />
            )}
            
            <Box>
              <Text fw={500} mb="xs">Description</Text>
              <Text size="sm" c="dimmed">
                {selectedResult.description || 'No description available'}
              </Text>
            </Box>
            
            <SimpleGrid cols={2}>
              <Box>
                <Text fw={500} mb="xs">Format</Text>
                <Text size="sm">{selectedResult.format}</Text>
              </Box>
              <Box>
                <Text fw={500} mb="xs">Codec</Text>
                <Text size="sm">{selectedResult.codec || 'N/A'}</Text>
              </Box>
              <Box>
                <Text fw={500} mb="xs">Duration</Text>
                <Text size="sm">{formatDuration(selectedResult.duration)}</Text>
              </Box>
              <Box>
                <Text fw={500} mb="xs">File Size</Text>
                <Text size="sm">{formatFileSize(selectedResult.size)}</Text>
              </Box>
            </SimpleGrid>
            
            <Box>
              <Text fw={500} mb="xs">Tags</Text>
              <Group gap="xs">
                {Object.entries(selectedResult.tags).map(([key, value]) => (
                  <Badge key={key} variant="light">
                    {key}: {value}
                  </Badge>
                ))}
              </Group>
            </Box>
            
            <Box>
              <Text fw={500} mb="xs">Metadata</Text>
              <Code block>
                {JSON.stringify(selectedResult.metadata, null, 2)}
              </Code>
            </Box>
            
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Created: {new Date(selectedResult.created_at).toLocaleString()}
              </Text>
              <Text size="sm" c="dimmed">
                Updated: {new Date(selectedResult.updated_at).toLocaleString()}
              </Text>
            </Group>
          </Stack>
        )}
      </Modal>
    </Card>
  );
}
