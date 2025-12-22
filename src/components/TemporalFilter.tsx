import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Group,
  Text,
  Button,
  Stack,
  Card,
  Badge,
  Switch,
  Select,
  NumberInput,
  TextInput,
  Chip,
  MultiSelect,
  ActionIcon,
  Tooltip,
  Collapse,
  Alert,
  Divider
} from '@mantine/core';
import {
  IconClock,
  IconFilter,
  IconX,
  IconPlus,
  IconChevronDown,
  IconChevronUp,
  IconInfoCircle,
  IconCalendar,
  IconRefresh
} from '@tabler/icons-react';
import TimerangePicker from './TimerangePicker';

// BBC TAMS Temporal Filter Component
interface TemporalFilterProps {
  // Filter values
  filters: {
    // Time range filters
    timerange?: string;
    startTime?: string;
    endTime?: string;
    
    // Duration filters
    minDuration?: number | undefined;
    maxDuration?: number | undefined;
    
    // Sample-level filters
    sampleOffset?: number | undefined;
    sampleCount?: number | undefined;
    
    // Temporal patterns
    temporalPattern?: 'continuous' | 'segmented' | 'intermittent' | 'any';
    
    // Time-based tags
    timeTags?: Record<string, string>;
    
    // Custom temporal filters
    customFilters?: Record<string, any>;
  };
  
  // Callbacks
  onFiltersChange: (filters: any) => void;
  onReset?: () => void;
  onApply?: () => void;
  
  // Options
  showAdvanced?: boolean;
  showSampleControls?: boolean;
  showPatternMatching?: boolean;
  showTimeTags?: boolean;
  showCustomFilters?: boolean;
  disabled?: boolean;
  className?: string;
}

// Temporal pattern options
const TEMPORAL_PATTERNS = [
  { value: 'continuous', label: 'Continuous', description: 'Uninterrupted media flow' },
  { value: 'segmented', label: 'Segmented', description: 'Media split into segments' },
  { value: 'intermittent', label: 'Intermittent', description: 'Gaps in media flow' },
  { value: 'any', label: 'Any Pattern', description: 'No pattern restriction' }
];

// Common time tags for BBC TAMS
const COMMON_TIME_TAGS = [
  'live',
  'recorded',
  'scheduled',
  'on-demand',
  'archived',
  'temporary',
  'permanent',
  'scheduled-deletion'
];

export default function TemporalFilter({
  filters,
  onFiltersChange,
  onReset,
  onApply,
  showAdvanced = true,
  showSampleControls = true,
  showPatternMatching = true,
  showTimeTags = true,
  showCustomFilters = false,
  disabled = false,
  className
}: TemporalFilterProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customFilterKey, setCustomFilterKey] = useState('');
  const [customFilterValue, setCustomFilterValue] = useState('');

  // Update specific filter value
  const updateFilter = useCallback((key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  }, [filters, onFiltersChange]);

  // Handle timerange change
  const handleTimerangeChange = useCallback((timerange: string) => {
    updateFilter('timerange', timerange);
  }, [updateFilter]);

  // Handle start time change
  const handleStartTimeChange = useCallback((startTime: string) => {
    updateFilter('startTime', startTime);
  }, [updateFilter]);

  // Handle end time change
  const handleEndTimeChange = useCallback((endTime: string) => {
    updateFilter('endTime', endTime);
  }, [updateFilter]);

  // Handle duration range changes
  const handleMinDurationChange = useCallback((value: string | number) => {
    updateFilter('minDuration', value === '' ? undefined : Number(value));
  }, [updateFilter]);

  const handleMaxDurationChange = useCallback((value: string | number) => {
    updateFilter('maxDuration', value === '' ? undefined : Number(value));
  }, [updateFilter]);

  // Handle sample-level controls
  const handleSampleOffsetChange = useCallback((value: string | number) => {
    updateFilter('sampleOffset', value === '' ? undefined : Number(value));
  }, [updateFilter]);

  const handleSampleCountChange = useCallback((value: string | number) => {
    updateFilter('sampleCount', value === '' ? undefined : Number(value));
  }, [updateFilter]);

  // Handle temporal pattern change
  const handlePatternChange = useCallback((pattern: string | null) => {
    updateFilter('temporalPattern', pattern || undefined);
  }, [updateFilter]);

  // Handle time tags change
  const handleTimeTagsChange = useCallback((tags: string[]) => {
    const timeTags: Record<string, string> = {};
    tags.forEach(tag => {
      timeTags[tag] = 'true';
    });
    updateFilter('timeTags', timeTags);
  }, [updateFilter]);

  // Handle custom filter addition
  const handleAddCustomFilter = useCallback(() => {
    if (customFilterKey && customFilterValue) {
      const newCustomFilters = {
        ...filters.customFilters,
        [customFilterKey]: customFilterValue
      };
      updateFilter('customFilters', newCustomFilters);
      setCustomFilterKey('');
      setCustomFilterValue('');
    }
  }, [customFilterKey, customFilterValue, filters.customFilters, updateFilter]);

  // Handle custom filter removal
  const handleRemoveCustomFilter = useCallback((key: string) => {
    const newCustomFilters = { ...filters.customFilters };
    delete newCustomFilters[key];
    updateFilter('customFilters', newCustomFilters);
  }, [filters.customFilters, updateFilter]);

  // Handle reset
  const handleReset = useCallback(() => {
    onReset?.();
  }, [onReset]);

  // Handle apply
  const handleApply = useCallback(() => {
    onApply?.();
  }, [onApply]);

  // Generate BBC TAMS query string
  const generateQueryString = useMemo(() => {
    const params: string[] = [];
    
    if (filters.timerange) {
      params.push(`timerange=${encodeURIComponent(filters.timerange)}`);
    }
    
    if (filters.startTime) {
      params.push(`start_time=${encodeURIComponent(filters.startTime)}`);
    }
    
    if (filters.endTime) {
      params.push(`end_time=${encodeURIComponent(filters.endTime)}`);
    }
    
    if (filters.minDuration !== undefined) {
      params.push(`min_duration=${filters.minDuration}`);
    }
    
    if (filters.maxDuration !== undefined) {
      params.push(`max_duration=${filters.maxDuration}`);
    }
    
    if (filters.sampleOffset !== undefined) {
      params.push(`sample_offset=${filters.sampleOffset}`);
    }
    
    if (filters.sampleCount !== undefined) {
      params.push(`sample_count=${filters.sampleCount}`);
    }
    
    if (filters.temporalPattern && filters.temporalPattern !== 'any') {
      params.push(`temporal_pattern=${filters.temporalPattern}`);
    }
    
    if (filters.timeTags) {
      Object.entries(filters.timeTags).forEach(([tag, value]) => {
        params.push(`tag.${tag}=${encodeURIComponent(value)}`);
      });
    }
    
    if (filters.customFilters) {
      Object.entries(filters.customFilters).forEach(([key, value]) => {
        params.push(`${key}=${encodeURIComponent(value)}`);
      });
    }
    
    return params.length > 0 ? `?${params.join('&')}` : '';
  }, [filters]);

  // Get current time tags as array
  const currentTimeTags = useMemo(() => {
    return filters.timeTags ? Object.keys(filters.timeTags) : [];
  }, [filters.timeTags]);

  return (
    <Card withBorder {...(className ? { className } : {})}>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconClock size={20} />
            <Text fw={500}>Temporal Filter</Text>
            <Badge variant="light" color="blue">TAMS v6.0</Badge>
          </Group>
          
          <Group gap="xs">
            <Button
              variant="light"
              size="xs"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              leftSection={isAdvancedOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
              disabled={disabled}
            >
              {isAdvancedOpen ? 'Hide' : 'Advanced'}
            </Button>
            
            <Button
              variant="outline"
              size="xs"
              onClick={handleReset}
              disabled={disabled}
              leftSection={<IconRefresh size={14} />}
            >
              Reset
            </Button>
            
            <Button
              size="xs"
              onClick={handleApply}
              disabled={disabled}
              leftSection={<IconFilter size={14} />}
            >
              Apply
            </Button>
          </Group>
        </Group>

        {/* Basic Filters */}
        <Stack gap="md">
          {/* Timerange Filter */}
          <Box>
            <Text size="sm" fw={500} mb="xs">Time Range</Text>
            <TimerangePicker
              value={filters.timerange || ''}
              onChange={handleTimerangeChange}
              placeholder="0:0_1:30"
              label=""
              disabled={disabled}
              showPresets={true}
              allowInfinite={true}
            />
          </Box>

          {/* Start/End Time Filters */}
          <Group gap="md" grow>
            <Box>
              <Text size="sm" fw={500} mb="xs">Start Time</Text>
              <TextInput
                value={filters.startTime || ''}
                onChange={(e) => handleStartTimeChange(e.currentTarget.value)}
                placeholder="0:0"
                disabled={disabled}
              />
            </Box>
            
            <Box>
              <Text size="sm" fw={500} mb="xs">End Time</Text>
              <TextInput
                value={filters.endTime || ''}
                onChange={(e) => handleEndTimeChange(e.currentTarget.value)}
                placeholder="1:30"
                disabled={disabled}
              />
            </Box>
          </Group>

          {/* Duration Range */}
          <Group gap="md" grow>
            <Box>
              <Text size="sm" fw={500} mb="xs">Min Duration (seconds)</Text>
              <NumberInput
                value={filters.minDuration || ''}
                onChange={handleMinDurationChange}
                placeholder="0"
                min={0}
                disabled={disabled}
              />
            </Box>
            
            <Box>
              <Text size="sm" fw={500} mb="xs">Max Duration (seconds)</Text>
              <NumberInput
                value={filters.maxDuration || ''}
                onChange={handleMaxDurationChange}
                placeholder="3600"
                min={0}
                disabled={disabled}
              />
            </Box>
          </Group>
        </Stack>

        {/* Advanced Filters */}
        <Collapse in={isAdvancedOpen}>
          <Stack gap="md">
            <Divider label="Advanced Options" labelPosition="center" />
            
            {/* Sample-Level Controls */}
            {showSampleControls && (
              <Group gap="md" grow>
                <Box>
                  <Text size="sm" fw={500} mb="xs">Sample Offset</Text>
                  <NumberInput
                    value={filters.sampleOffset || ''}
                    onChange={handleSampleOffsetChange}
                    placeholder="0"
                    min={0}
                    disabled={disabled}
                  />
                </Box>
                
                <Box>
                  <Text size="sm" fw={500} mb="xs">Sample Count</Text>
                  <NumberInput
                    value={filters.sampleCount || ''}
                    onChange={handleSampleCountChange}
                    placeholder="1500"
                    min={1}
                    disabled={disabled}
                  />
                </Box>
              </Group>
            )}

            {/* Temporal Pattern Matching */}
            {showPatternMatching && (
              <Box>
                <Text size="sm" fw={500} mb="xs">Temporal Pattern</Text>
                <Select
                  value={filters.temporalPattern || 'any'}
                  onChange={handlePatternChange}
                  data={TEMPORAL_PATTERNS}
                  disabled={disabled}
                  placeholder="Select pattern"
                />
              </Box>
            )}

            {/* Time Tags */}
            {showTimeTags && (
              <Box>
                <Text size="sm" fw={500} mb="xs">Time Tags</Text>
                <MultiSelect
                  value={currentTimeTags}
                  onChange={handleTimeTagsChange}
                  data={COMMON_TIME_TAGS}
                  disabled={disabled}
                  placeholder="Select time tags"
                  searchable
                />
              </Box>
            )}

            {/* Custom Filters */}
            {showCustomFilters && (
              <Box>
                <Text size="sm" fw={500} mb="xs">Custom Filters</Text>
                <Stack gap="xs">
                  {filters.customFilters && Object.entries(filters.customFilters).map(([key, value]) => (
                    <Group key={key} gap="xs">
                      <Text size="sm" c="dimmed" style={{ minWidth: '100px' }}>{key}:</Text>
                      <Text size="sm" style={{ flex: 1 }}>{value}</Text>
                      <ActionIcon
                        size="sm"
                        variant="light"
                        color="red"
                        onClick={() => handleRemoveCustomFilter(key)}
                        disabled={disabled}
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    </Group>
                  ))}
                  
                  <Group gap="xs">
                    <TextInput
                      placeholder="Filter key"
                      value={customFilterKey}
                      onChange={(e) => setCustomFilterKey(e.currentTarget.value)}
                      disabled={disabled}
                      style={{ flex: 1 }}
                    />
                    <TextInput
                      placeholder="Filter value"
                      value={customFilterValue}
                      onChange={(e) => setCustomFilterValue(e.currentTarget.value)}
                      disabled={disabled}
                      style={{ flex: 1 }}
                    />
                    <ActionIcon
                      size="sm"
                      variant="light"
                      color="blue"
                      onClick={handleAddCustomFilter}
                      disabled={disabled || !customFilterKey || !customFilterValue}
                    >
                      <IconPlus size={14} />
                    </ActionIcon>
                  </Group>
                </Stack>
              </Box>
            )}
          </Stack>
        </Collapse>

        {/* Query String Preview */}
        <Box>
          <Text size="sm" fw={500} mb="xs">Generated Query</Text>
          <TextInput
            value={generateQueryString}
            readOnly
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
            rightSection={
              <Tooltip label="Copy query string">
                <ActionIcon
                  size="sm"
                  variant="light"
                  onClick={() => navigator.clipboard.writeText(generateQueryString)}
                  disabled={disabled}
                >
                  <IconInfoCircle size={14} />
                </ActionIcon>
              </Tooltip>
            }
          />
        </Box>

        {/* BBC TAMS Info */}
        <Alert color="blue" title="TAMS Temporal Filtering" icon={<IconInfoCircle size={16} />}>
          <Text size="xs">
            This temporal filter provides TAMS v6.0 compliant time-based filtering capabilities. 
            It supports timerange queries, duration filtering, sample-level control, and temporal pattern 
            matching as specified in the BBC TAMS API specification.
          </Text>
        </Alert>
      </Stack>
    </Card>
  );
}
