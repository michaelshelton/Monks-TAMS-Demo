import React, { useState, useEffect } from 'react';
import {
  Card,
  Title,
  Text,
  Stack,
  Group,
  Button,
  TextInput,
  Select,
  Checkbox,
  Divider,
  Badge,
  Box,
  Alert,
  Code,
  ActionIcon,
  Tooltip,
  Collapse,
  Switch,
  NumberInput,
  Textarea
} from '@mantine/core';
import { IconPlus, IconTrash, IconSearch, IconFilter, IconTag, IconEye, IconEyeOff, IconInfoCircle } from '@tabler/icons-react';

export interface AdvancedSearchQuery {
  // Basic filters
  format?: string;
  codec?: string;
  label?: string;
  limit?: number;
  timerange?: string;
  
  // Advanced tag filters
  tags?: Record<string, string>;
  tagExists?: Record<string, boolean>;
  
  // Custom filters
  custom?: Record<string, any>;
  
  // Query metadata
  name?: string;
  description?: string;
  saved?: boolean;
}

export interface AdvancedSearchBuilderProps {
  onSearch: (query: AdvancedSearchQuery) => void;
  onSaveQuery?: (query: AdvancedSearchQuery) => void;
  onLoadQuery?: (query: AdvancedSearchQuery) => void;
  savedQueries?: AdvancedSearchQuery[];
  initialQuery?: AdvancedSearchQuery | null;
}

export default function AdvancedSearchBuilder({
  onSearch,
  onSaveQuery,
  onLoadQuery,
  savedQueries = [],
  initialQuery
}: AdvancedSearchBuilderProps) {
  const [query, setQuery] = useState<AdvancedSearchQuery>(initialQuery || {
    format: '',
    codec: '',
    label: '',
    limit: 50,
    timerange: '',
    tags: {},
    tagExists: {},
    custom: {}
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [newTagKey, setNewTagKey] = useState('');
  const [newTagValue, setNewTagValue] = useState('');
  const [newCustomKey, setNewCustomKey] = useState('');
  const [newCustomValue, setNewCustomValue] = useState('');
  const [queryName, setQueryName] = useState('');
  const [queryDescription, setQueryDescription] = useState('');

  // Common format options
  const formatOptions = [
    { value: '', label: 'Any Format' },
    { value: 'video', label: 'Video' },
    { value: 'audio', label: 'Audio' },
    { value: 'image', label: 'Image' },
    { value: 'data', label: 'Data' },
    { value: 'document', label: 'Document' }
  ];

  // Common codec options
  const codecOptions = [
    { value: '', label: 'Any Codec' },
    { value: 'H.264', label: 'H.264 (AVC)' },
    { value: 'H.265', label: 'H.265 (HEVC)' },
    { value: 'VP9', label: 'VP9' },
    { value: 'AV1', label: 'AV1' },
    { value: 'AAC', label: 'AAC' },
    { value: 'MP3', label: 'MP3' },
    { value: 'Opus', label: 'Opus' }
  ];

  // Common tag examples for sports content
  const tagExamples = [
    { key: 'sport', value: 'football', description: 'Sport type' },
    { key: 'player.jersey_number', value: '19', description: 'Player jersey number' },
    { key: 'player.team', value: 'Team A', description: 'Player team' },
    { key: 'player.position', value: 'midfielder', description: 'Player position' },
    { key: 'action', value: 'goal_scored', description: 'Action type' },
    { key: 'venue', value: 'stadium', description: 'Venue location' },
    { key: 'competition', value: 'Premier League', description: 'Competition name' },
    { key: 'camera', value: 'main', description: 'Camera angle' },
    { key: 'quality', value: '4K', description: 'Content quality' }
  ];

  const handleBasicFilterChange = (key: string, value: string | number) => {
    setQuery(prev => ({ ...prev, [key]: value }));
  };

  const addTagFilter = () => {
    if (newTagKey.trim() && newTagValue.trim()) {
      setQuery(prev => ({
        ...prev,
        tags: { ...prev.tags, [newTagKey.trim()]: newTagValue.trim() }
      }));
      setNewTagKey('');
      setNewTagValue('');
    }
  };

  const removeTagFilter = (key: string) => {
    setQuery(prev => {
      const newTags = { ...prev.tags };
      delete newTags[key];
      return { ...prev, tags: newTags };
    });
  };

  const addTagExistsFilter = (key: string, exists: boolean) => {
    setQuery(prev => ({
      ...prev,
      tagExists: { ...prev.tagExists, [key]: exists }
    }));
  };

  const removeTagExistsFilter = (key: string) => {
    setQuery(prev => {
      const newTagExists = { ...prev.tagExists };
      delete newTagExists[key];
      return { ...prev, tagExists: newTagExists };
    });
  };

  const addCustomFilter = () => {
    if (newCustomKey.trim() && newCustomValue.trim()) {
      setQuery(prev => ({
        ...prev,
        custom: { ...prev.custom, [newCustomKey.trim()]: newCustomValue.trim() }
      }));
      setNewCustomKey('');
      setNewCustomValue('');
    }
  };

  const removeCustomFilter = (key: string) => {
    setQuery(prev => {
      const newCustom = { ...prev.custom };
      delete newCustom[key];
      return { ...prev, custom: newCustom };
    });
  };

  const handleSearch = () => {
    onSearch(query);
  };

  const handleSaveQuery = () => {
    if (queryName.trim()) {
      const queryToSave = {
        ...query,
        name: queryName.trim(),
        description: queryDescription.trim(),
        saved: true
      };
      onSaveQuery?.(queryToSave);
      setQueryName('');
      setQueryDescription('');
    }
  };

  const handleLoadQuery = (savedQuery: AdvancedSearchQuery) => {
    setQuery(savedQuery);
    onLoadQuery?.(savedQuery);
  };

  const resetQuery = () => {
    setQuery({
      format: '',
      codec: '',
      label: '',
      limit: 50,
      timerange: '',
      tags: {},
      tagExists: {},
      custom: {}
    });
  };

  const getQueryString = () => {
    const params = new URLSearchParams();
    
    if (query.format) params.append('format', query.format);
    if (query.codec) params.append('codec', query.codec);
    if (query.label) params.append('label', query.label);
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.timerange) params.append('timerange', query.timerange);
    
    // Add tag filters
    Object.entries(query.tags || {}).forEach(([key, value]) => {
      params.append(`tags[${key}]`, value);
    });
    
    // Add tag existence filters
    Object.entries(query.tagExists || {}).forEach(([key, value]) => {
      params.append(`tagExists[${key}]`, value.toString());
    });
    
    // Add custom filters
    Object.entries(query.custom || {}).forEach(([key, value]) => {
      params.append(`custom[${key}]`, value.toString());
    });
    
    return params.toString();
  };

  const hasAdvancedFilters = Object.keys(query.tags || {}).length > 0 || 
                           Object.keys(query.tagExists || {}).length > 0 ||
                           Object.keys(query.custom || {}).length > 0;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={3}>Advanced Search Builder</Title>
          <Group>
            <Button
              variant="light"
              leftSection={<IconFilter size={16} />}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
            <Button
              variant="light"
              leftSection={<IconSearch size={16} />}
              onClick={handleSearch}
              color="blue"
            >
              Search
            </Button>
          </Group>
        </Group>

        <Text size="sm" c="dimmed">
          Build complex BBC TAMS v6.0 compliant search queries with advanced filtering, tag-based search, and AI content discovery.
        </Text>
        
        <Alert icon={<IconInfoCircle size={16} />} title="Search Target" color="blue" variant="light">
          <Text size="sm">
            This search builder is currently configured to search <strong>Sources</strong> (original media files) 
            which contain the richest metadata. For comprehensive discovery, you may also want to search 
            <strong> Flows</strong> (derived content) and <strong>Segments</strong> (specific moments).
          </Text>
        </Alert>

        {/* Basic Filters */}
        <Card withBorder p="md">
          <Title order={4} mb="md">Basic Filters</Title>
          <SimpleGrid cols={3}>
            <Select
              label="Format"
              placeholder="Select format"
              data={formatOptions}
              value={query.format || null}
              onChange={(value) => handleBasicFilterChange('format', value || '')}
            />
            <Select
              label="Codec"
              placeholder="Select codec"
              data={codecOptions}
              value={query.codec || null}
              onChange={(value) => handleBasicFilterChange('codec', value || '')}
            />
            <TextInput
              label="Label"
              placeholder="Search in labels"
              value={query.label}
              onChange={(e) => handleBasicFilterChange('label', e.target.value)}
            />
          </SimpleGrid>
          <SimpleGrid cols={2} mt="md">
            <NumberInput
              label="Limit"
              placeholder="Results per page"
              min={1}
              max={1000}
              value={query.limit || 50}
              onChange={(value) => handleBasicFilterChange('limit', value || 50)}
            />
            <TextInput
              label="Timerange"
              placeholder="BBC TAMS format (e.g., 0:0_90:0)"
              value={query.timerange}
              onChange={(e) => handleBasicFilterChange('timerange', e.target.value)}
            />
          </SimpleGrid>
        </Card>

        {/* Advanced Filters */}
        <Collapse in={showAdvanced}>
          <Card withBorder p="md">
            <Title order={4} mb="md">Advanced Filters</Title>
            
            {/* Tag-Based Filtering */}
            <Box mb="lg">
              <Group justify="space-between" mb="sm">
                <Text fw={500}>Tag Filters</Text>
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconInfoCircle size={14} />}
                  onClick={() => setShowCustom(!showCustom)}
                >
                  Examples
                </Button>
              </Group>
              
              <Collapse in={showCustom}>
                <Alert icon={<IconInfoCircle size={16} />} mb="md">
                  <Text size="sm" mb="xs">Common tag examples for sports content:</Text>
                  <SimpleGrid cols={2}>
                    {tagExamples.map((example, index) => (
                      <Box key={index} p="xs" bg="gray.0" style={{ borderRadius: 4 }}>
                        <Text size="xs" fw={500}>{example.key}</Text>
                        <Text size="xs" c="dimmed">{example.value}</Text>
                        <Text size="xs" c="dimmed">{example.description}</Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Alert>
              </Collapse>

              {/* Add new tag filter */}
              <Group mb="md">
                <TextInput
                  placeholder="Tag key (e.g., player.jersey_number)"
                  value={newTagKey}
                  onChange={(e) => setNewTagKey(e.target.value)}
                  style={{ flex: 1 }}
                />
                <TextInput
                  placeholder="Tag value (e.g., 19)"
                  value={newTagValue}
                  onChange={(e) => setNewTagValue(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Button size="sm" onClick={addTagFilter} leftSection={<IconPlus size={14} />}>
                  Add
                </Button>
              </Group>

              {/* Display existing tag filters */}
              {Object.entries(query.tags || {}).map(([key, value]) => (
                <Group key={key} mb="xs">
                  <Badge variant="light" color="blue">
                    {key}: {value}
                  </Badge>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    onClick={() => removeTagFilter(key)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              ))}
            </Box>

            {/* Tag Existence Filters */}
            <Box mb="lg">
              <Text fw={500} mb="sm">Required Tags</Text>
              <Text size="sm" c="dimmed" mb="md">
                Tags that must exist (regardless of value) for content to be included
              </Text>
              
              {/* Add new tag existence filter */}
              <Group mb="md">
                <TextInput
                  placeholder="Tag key (e.g., player.face_detection)"
                  value={newTagKey}
                  onChange={(e) => setNewTagKey(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Switch
                  label="Must exist"
                  checked={true}
                  onChange={() => addTagExistsFilter(newTagKey, true)}
                />
                <Button size="sm" onClick={() => addTagExistsFilter(newTagKey, true)} leftSection={<IconPlus size={14} />}>
                  Add Required
                </Button>
              </Group>

              {/* Display existing tag existence filters */}
              {Object.entries(query.tagExists || {}).map(([key, exists]) => (
                <Group key={key} mb="xs">
                  <Badge variant="light" color={exists ? "green" : "red"}>
                    {exists ? <IconEye size={12} /> : <IconEyeOff size={12} />} {key}
                  </Badge>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    onClick={() => removeTagExistsFilter(key)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              ))}
            </Box>

            {/* Custom Filters */}
            <Box>
              <Text fw={500} mb="sm">Custom Filters</Text>
              <Text size="sm" c="dimmed" mb="md">
                Additional custom filter parameters for extended functionality
              </Text>
              
              {/* Add new custom filter */}
              <Group mb="md">
                <TextInput
                  placeholder="Filter key"
                  value={newCustomKey}
                  onChange={(e) => setNewCustomKey(e.target.value)}
                  style={{ flex: 1 }}
                />
                <TextInput
                  placeholder="Filter value"
                  value={newCustomValue}
                  onChange={(e) => setNewCustomValue(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Button size="sm" onClick={addCustomFilter} leftSection={<IconPlus size={14} />}>
                  Add
                </Button>
              </Group>

              {/* Display existing custom filters */}
              {Object.entries(query.custom || {}).map(([key, value]) => (
                <Group key={key} mb="xs">
                  <Badge variant="light" color="gray">
                    {key}: {value}
                  </Badge>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    onClick={() => removeCustomFilter(key)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              ))}
            </Box>
          </Card>
        </Collapse>

        {/* Query Preview */}
        {hasAdvancedFilters && (
          <Card withBorder p="md">
            <Title order={4} mb="md">Query Preview</Title>
            <Code block>
              GET /sources?{getQueryString()}
            </Code>
          </Card>
        )}

        {/* Query Management */}
        <Card withBorder p="md">
          <Title order={4} mb="md">Query Management</Title>
          
          {/* Save Query */}
          <Group mb="md">
            <TextInput
              placeholder="Query name"
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              style={{ flex: 1 }}
            />
            <Textarea
              placeholder="Query description"
              value={queryDescription}
              onChange={(e) => setQueryDescription(e.target.value)}
              style={{ flex: 1 }}
              minRows={2}
            />
            <Button
              variant="light"
              onClick={handleSaveQuery}
              disabled={!queryName.trim()}
              leftSection={<IconPlus size={16} />}
            >
              Save Query
            </Button>
          </Group>

          {/* Saved Queries */}
          {savedQueries.length > 0 && (
            <Box>
              <Text fw={500} mb="sm">Saved Queries</Text>
              <SimpleGrid cols={2}>
                {savedQueries.map((savedQuery, index) => (
                  <Card key={index} withBorder p="xs" style={{ cursor: 'pointer' }} onClick={() => handleLoadQuery(savedQuery)}>
                    <Text size="sm" fw={500}>{savedQuery.name}</Text>
                    <Text size="xs" c="dimmed">{savedQuery.description}</Text>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          )}

          {/* Actions */}
          <Group mt="md">
            <Button variant="light" onClick={resetQuery} leftSection={<IconTrash size={16} />}>
              Reset Query
            </Button>
            <Button variant="light" onClick={() => setShowAdvanced(!showAdvanced)}>
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Button>
          </Group>
        </Card>
      </Stack>
    </Card>
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
