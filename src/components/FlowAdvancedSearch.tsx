import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Text,
  Group,
  Stack,
  TextInput,
  Select,
  MultiSelect,
  Switch,
  Button,
  Collapse,
  Divider,
  Badge,
  ActionIcon,
  Tooltip,
  Alert,
  Box,
  Grid,
  NumberInput,
  Chip,
  ScrollArea
} from '@mantine/core';
import {
  IconSearch,
  IconFilter,
  IconX,
  IconRefresh,
  IconBookmark,
  IconHistory,
  IconSettings,
  IconChevronDown,
  IconChevronUp,
  IconPlus,
  IconTrash,
  IconEye,
  IconEyeOff
} from '@tabler/icons-react';

import { BBCApiOptions } from '../services/api';

export interface FlowAdvancedSearchFilters {
  // Basic search
  query: string;
  label: string;
  description: string;
  
  // Flow metadata
  tags: Record<string, string>;
  tagExists: Record<string, boolean>;
  format: string;
  codec: string;
  
  // Timing
  timerange: string;
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
  duration: {
    min: number | null;
    max: number | null;
  };
  
  // Flow properties
  flowType: string;
  status: string;
  priority: string;
  
  // Segment-specific filters
  segmentCount: {
    min: number | null;
    max: number | null;
  };
  hasSegments: boolean;
  segmentTypes: string[];
  
  // Advanced options
  searchMode: 'exact' | 'fuzzy' | 'semantic';
  caseSensitive: boolean;
  includeArchived: boolean;
  includeDeleted: boolean;
  
  // Pagination
  page: string;
  limit: number;
}

export interface FlowAdvancedSearchProps {
  filters: FlowAdvancedSearchFilters;
  onFiltersChange: (filters: FlowAdvancedSearchFilters) => void;
  onSearch: () => void;
  onReset: () => void;
  onSaveQuery?: (name: string, filters: FlowAdvancedSearchFilters) => void;
  onLoadQuery?: (name: string) => void;
  savedQueries?: Array<{ name: string; filters: FlowAdvancedSearchFilters }>;
  loading?: boolean;
  showAdvanced?: boolean;
  onToggleAdvanced?: (show: boolean) => void;
}

const FLOW_TYPES = [
  { value: 'live', label: 'Live Stream' },
  { value: 'recorded', label: 'Recorded Content' },
  { value: 'archived', label: 'Archived Content' },
  { value: 'compiled', label: 'Compiled Content' },
  { value: 'template', label: 'Template' }
];

const FLOW_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'processing', label: 'Processing' },
  { value: 'error', label: 'Error' },
  { value: 'completed', label: 'Completed' }
];

const FLOW_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

const SEGMENT_TYPES = [
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'metadata', label: 'Metadata' },
  { value: 'annotation', label: 'Annotation' },
  { value: 'highlight', label: 'Highlight' },
  { value: 'clip', label: 'Clip' }
];

const FORMATS = [
  { value: 'mp4', label: 'MP4' },
  { value: 'h264', label: 'H.264' },
  { value: 'h265', label: 'H.265' },
  { value: 'prores', label: 'ProRes' },
  { value: 'dnxhd', label: 'DNxHD' },
  { value: 'mxf', label: 'MXF' }
];

const CODECS = [
  { value: 'h264', label: 'H.264' },
  { value: 'h265', label: 'H.265' },
  { value: 'prores', label: 'ProRes' },
  { value: 'dnxhd', label: 'DNxHD' },
  { value: 'mpeg2', label: 'MPEG-2' }
];

export default function FlowAdvancedSearch({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  onSaveQuery,
  onLoadQuery,
  savedQueries = [],
  loading = false,
  showAdvanced = false,
  onToggleAdvanced
}: FlowAdvancedSearchProps) {
  const [showSavedQueries, setShowSavedQueries] = useState(false);
  const [queryName, setQueryName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);



  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  }, [onSearch]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  // Handle tag changes
  const handleTagChange = useCallback((key: string, value: string) => {
    const newTags = { ...filters.tags, [key]: value };
    handleFilterChange('tags', newTags);
  }, [filters.tags, handleFilterChange]);

  // Handle tag existence toggle
  const handleTagExistsChange = useCallback((key: string, exists: boolean) => {
    const newTagExists = { ...filters.tagExists, [key]: exists };
    handleFilterChange('tagExists', newTagExists);
  }, [filters.tagExists, handleFilterChange]);

  // Add new tag filter
  const addTagFilter = useCallback(() => {
    const newTags = { ...filters.tags, '': '' };
    const newTagExists = { ...filters.tagExists, '': false };
    handleFilterChange('tags', newTags);
    handleFilterChange('tagExists', newTagExists);
  }, [filters.tags, filters.tagExists, handleFilterChange]);

  // Remove tag filter
  const removeTagFilter = useCallback((key: string) => {
    const newTags = { ...filters.tags };
    const newTagExists = { ...filters.tagExists };
    delete newTags[key];
    delete newTagExists[key];
    handleFilterChange('tags', newTags);
    handleFilterChange('tagExists', newTagExists);
  }, [filters.tags, filters.tagExists, handleFilterChange]);

  // Save current query
  const handleSaveQuery = useCallback(() => {
    if (queryName.trim() && onSaveQuery) {
      onSaveQuery(queryName.trim(), filters);
      setQueryName('');
      setShowSaveForm(false);
    }
  }, [queryName, filters, onSaveQuery]);

  // Load saved query
  const handleLoadQuery = useCallback((name: string) => {
    if (onLoadQuery) {
      onLoadQuery(name);
      setShowSavedQueries(false);
    }
  }, [onLoadQuery]);

  // Reset all filters
  const handleReset = useCallback(() => {
    const defaultFilters: FlowAdvancedSearchFilters = {
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
    };
    onFiltersChange(defaultFilters);
    onReset();
  }, [onFiltersChange, onReset]);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Header */}
          <Group justify="space-between" align="center">
            <Group>
              <IconSearch size={20} />
              <Text fw={500} size="lg">Flow Advanced Search</Text>
            </Group>
            <Group>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => onToggleAdvanced?.(!showAdvanced)}
                leftSection={showAdvanced ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
              >
                {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
              </Button>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => setShowSavedQueries(!showSavedQueries)}
                leftSection={<IconBookmark size={16} />}
              >
                Saved Queries
              </Button>
            </Group>
          </Group>

          {/* Basic Search */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Search Query"
                placeholder="Enter search terms..."
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                leftSection={<IconSearch size={16} />}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Flow Label"
                placeholder="Flow label or name..."
                value={filters.label}
                onChange={(e) => handleFilterChange('label', e.target.value)}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Description"
            placeholder="Search in flow descriptions..."
            value={filters.description}
            onChange={(e) => handleFilterChange('description', e.target.value)}
          />

          {/* Advanced Filters */}
          <Collapse in={showAdvanced}>
            <Stack gap="md">
              <Divider label="Advanced Filters" labelPosition="center" />

              {/* Flow Properties */}
              <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Flow Type"
                    placeholder="Select flow type"
                    data={FLOW_TYPES}
                    value={filters.flowType}
                    onChange={(value) => handleFilterChange('flowType', value)}
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Status"
                    placeholder="Select status"
                    data={FLOW_STATUSES}
                    value={filters.status}
                    onChange={(value) => handleFilterChange('status', value)}
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Priority"
                    placeholder="Select priority"
                    data={FLOW_PRIORITIES}
                    value={filters.priority}
                    onChange={(value) => handleFilterChange('priority', value)}
                    clearable
                  />
                </Grid.Col>
              </Grid>

              {/* Format and Codec */}
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Format"
                    placeholder="Select format"
                    data={FORMATS}
                    value={filters.format}
                    onChange={(value) => handleFilterChange('format', value)}
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Codec"
                    placeholder="Select codec"
                    data={CODECS}
                    value={filters.codec}
                    onChange={(value) => handleFilterChange('codec', value)}
                    clearable
                  />
                </Grid.Col>
              </Grid>

              {/* Timing */}
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Timerange"
                    placeholder="e.g., 2024-01-01T00:00:00Z/2024-01-31T23:59:59Z"
                    value={filters.timerange}
                    onChange={(e) => handleFilterChange('timerange', e.target.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <MultiSelect
                    label="Segment Types"
                    placeholder="Select segment types"
                    data={SEGMENT_TYPES}
                    value={filters.segmentTypes}
                    onChange={(value) => handleFilterChange('segmentTypes', value)}
                    clearable
                  />
                </Grid.Col>
              </Grid>

              {/* Duration and Segment Count */}
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Group gap="xs">
                                         <NumberInput
                       label="Min Duration (seconds)"
                       placeholder="Min"
                       value={filters.duration.min || ''}
                       onChange={(value) => handleFilterChange('duration', { ...filters.duration, min: value })}
                       min={0}
                       style={{ flex: 1 }}
                     />
                     <NumberInput
                       label="Max Duration (seconds)"
                       placeholder="Max"
                       value={filters.duration.max || ''}
                       onChange={(value) => handleFilterChange('duration', { ...filters.duration, max: value })}
                       min={0}
                       style={{ flex: 1 }}
                     />
                  </Group>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Group gap="xs">
                                         <NumberInput
                       label="Min Segments"
                       placeholder="Min"
                       value={filters.segmentCount.min || ''}
                       onChange={(value) => handleFilterChange('segmentCount', { ...filters.segmentCount, min: value })}
                       min={0}
                       style={{ flex: 1 }}
                     />
                     <NumberInput
                       label="Max Segments"
                       placeholder="Max"
                       value={filters.segmentCount.max || ''}
                       onChange={(value) => handleFilterChange('segmentCount', { ...filters.segmentCount, max: value })}
                       min={0}
                       style={{ flex: 1 }}
                     />
                  </Group>
                </Grid.Col>
              </Grid>

              {/* Search Options */}
              <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Search Mode"
                    data={[
                      { value: 'exact', label: 'Exact Match' },
                      { value: 'fuzzy', label: 'Fuzzy Search' },
                      { value: 'semantic', label: 'Semantic Search' }
                    ]}
                    value={filters.searchMode}
                    onChange={(value) => handleFilterChange('searchMode', value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <NumberInput
                    label="Results Limit"
                    placeholder="50"
                    value={filters.limit}
                    onChange={(value) => handleFilterChange('limit', value)}
                    min={1}
                    max={1000}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Stack gap="xs">
                    <Switch
                      label="Case Sensitive"
                      checked={filters.caseSensitive}
                      onChange={(e) => handleFilterChange('caseSensitive', e.currentTarget.checked)}
                    />
                    <Switch
                      label="Include Archived"
                      checked={filters.includeArchived}
                      onChange={(e) => handleFilterChange('includeArchived', e.currentTarget.checked)}
                    />
                    <Switch
                      label="Include Deleted"
                      checked={filters.includeDeleted}
                      onChange={(e) => handleFilterChange('includeDeleted', e.currentTarget.checked)}
                    />
                    <Switch
                      label="Has Segments"
                      checked={filters.hasSegments}
                      onChange={(e) => handleFilterChange('hasSegments', e.currentTarget.checked)}
                    />
                  </Stack>
                </Grid.Col>
              </Grid>

              {/* Tags */}
              <Box>
                <Group justify="space-between" align="center" mb="xs">
                  <Text size="sm" fw={500}>Tags</Text>
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={addTagFilter}
                    leftSection={<IconPlus size={14} />}
                  >
                    Add Tag
                  </Button>
                </Group>
                <Stack gap="xs">
                  {Object.entries(filters.tags).map(([key, value]) => (
                    <Group key={key} gap="xs">
                      <TextInput
                        placeholder="Tag key"
                        value={key}
                        onChange={(e) => {
                          const newTags = { ...filters.tags };
                          delete newTags[key];
                          newTags[e.target.value] = value;
                          handleFilterChange('tags', newTags);
                        }}
                        style={{ flex: 1 }}
                      />
                      <TextInput
                        placeholder="Tag value"
                        value={value}
                        onChange={(e) => handleTagChange(key, e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <Switch
                        size="xs"
                        checked={filters.tagExists[key] || false}
                        onChange={(e) => handleTagExistsChange(key, e.currentTarget.checked)}
                        onLabel={<IconEye size={12} />}
                        offLabel={<IconEyeOff size={12} />}
                      />
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => removeTagFilter(key)}
                        size="sm"
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  ))}
                  {Object.keys(filters.tags).length === 0 && (
                    <Text size="sm" c="dimmed" ta="center" py="xs">
                      No tag filters added
                    </Text>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Collapse>

          {/* Saved Queries */}
          <Collapse in={showSavedQueries}>
            <Stack gap="md">
              <Divider label="Saved Queries" labelPosition="center" />
              
              {savedQueries.length > 0 ? (
                <ScrollArea h={200}>
                  <Stack gap="xs">
                    {savedQueries.map((query) => (
                      <Group key={query.name} justify="space-between" p="xs" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-sm)' }}>
                        <Text size="sm" fw={500}>{query.name}</Text>
                        <Group gap="xs">
                          <Button
                            variant="subtle"
                            size="xs"
                            onClick={() => handleLoadQuery(query.name)}
                          >
                            Load
                          </Button>
                          <Button
                            variant="subtle"
                            size="xs"
                            onClick={() => {
                              onFiltersChange(query.filters);
                            }}
                          >
                            Apply
                          </Button>
                        </Group>
                      </Group>
                    ))}
                  </Stack>
                </ScrollArea>
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="xs">
                  No saved queries
                </Text>
              )}

              {/* Save Query Form */}
              <Collapse in={showSaveForm}>
                <Group gap="xs">
                  <TextInput
                    placeholder="Query name"
                    value={queryName}
                    onChange={(e) => setQueryName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveQuery}
                    disabled={!queryName.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => setShowSaveForm(false)}
                  >
                    Cancel
                  </Button>
                </Group>
              </Collapse>

              {!showSaveForm && (
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => setShowSaveForm(true)}
                  leftSection={<IconPlus size={16} />}
                >
                  Save Current Query
                </Button>
              )}
            </Stack>
          </Collapse>

          {/* Action Buttons */}
          <Group justify="space-between">
            <Group>
              <Button
                type="submit"
                loading={loading}
                leftSection={<IconSearch size={16} />}
              >
                Search
              </Button>
              <Button
                variant="subtle"
                onClick={handleReset}
                leftSection={<IconRefresh size={16} />}
              >
                Reset
              </Button>
            </Group>
            
            <Group>
              <Text size="sm" c="dimmed">
                {Object.keys(filters.tags).length} tags, {filters.segmentTypes.length} segment types
              </Text>
            </Group>
          </Group>
        </Stack>
      </form>
    </Card>
  );
}
