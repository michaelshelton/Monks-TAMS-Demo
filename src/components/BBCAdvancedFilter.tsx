import React, { useState, useEffect } from 'react';
import {
  Group,
  Text,
  Button,
  Stack,
  Box,
  Divider,
  TextInput,
  Select,
  NumberInput,
  Switch,
  Chip,
  MultiSelect,
  ActionIcon,
  Tooltip,
  Collapse,
  Alert,
  Badge
} from '@mantine/core';
import { 
  IconFilter, 
  IconX, 
  IconPlus, 
  IconChevronDown, 
  IconChevronUp,
  IconTag,
  IconClock,
  IconVideo,
  IconMusic,
  IconDatabase,
  IconPhoto,
  IconInfoCircle
} from '@tabler/icons-react';
import TimerangePicker from './TimerangePicker';

// BBC TAMS Filter patterns
interface BBCFilterPatterns {
  // Basic filters
  label?: string;
  format?: string;
  codec?: string;
  
  // Tag-based filters
  tags?: Record<string, string>; // tag.{name} = value
  tagExists?: Record<string, boolean>; // tag_exists.{name} = true/false
  
  // Time-based filters
  timerange?: string;
  
  // Format-specific filters
  frame_width?: number;
  frame_height?: number;
  sample_rate?: number;
  bits_per_sample?: number;
  channels?: number;
  
  // Pagination
  page?: string;
  limit?: number;
  
  // Custom filters
  custom?: Record<string, any>;
}

interface BBCAdvancedFilterProps {
  // Current filter state
  filters: BBCFilterPatterns;
  
  // Callbacks
  onFiltersChange: (filters: BBCFilterPatterns) => void;
  onReset: () => void;
  onApply: () => void;
  
  // Available options
  availableFormats?: string[];
  availableCodecs?: string[];
  availableTags?: string[];
  
  // UI options
  showTimerange?: boolean;
  showFormatSpecific?: boolean;
  showTagFilters?: boolean;
  showPagination?: boolean;
  collapsed?: boolean;
  disabled?: boolean;
  className?: string;
}

// BBC TAMS content formats
const BBC_CONTENT_FORMATS = [
  'urn:x-nmos:format:video',
  'urn:x-nmos:format:audio', 
  'urn:x-nmos:format:data',
  'urn:x-nmos:format:multi',
  'urn:x-tam:format:image'
];

// Common codecs
const COMMON_CODECS = [
  'video/h264',
  'video/h265',
  'video/mp4',
  'audio/aac',
  'audio/mp3',
  'audio/wav',
  'application/json',
  'text/plain'
];

const BBCAdvancedFilter: React.FC<BBCAdvancedFilterProps> = ({
  filters,
  onFiltersChange,
  onReset,
  onApply,
  availableFormats = BBC_CONTENT_FORMATS,
  availableCodecs = COMMON_CODECS,
  availableTags = [],
  showTimerange = true,
  showFormatSpecific = true,
  showTagFilters = true,
  showPagination = true,
  collapsed = false,
  disabled = false,
  className
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [localFilters, setLocalFilters] = useState<BBCFilterPatterns>(filters);
  const [newTagKey, setNewTagKey] = useState('');
  const [newTagValue, setNewTagValue] = useState('');
  const [newTagExistsKey, setNewTagExistsKey] = useState('');
  const [newTagExistsValue, setNewTagExistsValue] = useState(true);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Update parent filters
  const updateFilters = (newFilters: Partial<BBCFilterPatterns>) => {
    const updated = { ...localFilters, ...newFilters };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  // Tag filter operations
  const addTagFilter = () => {
    if (newTagKey && newTagValue) {
      const updatedTags = { ...localFilters.tags, [newTagKey]: newTagValue };
      updateFilters({ tags: updatedTags });
      setNewTagKey('');
      setNewTagValue('');
    }
  };

  const removeTagFilter = (key: string) => {
    const { [key]: removed, ...remainingTags } = localFilters.tags || {};
    updateFilters({ tags: remainingTags });
  };

  const addTagExistsFilter = () => {
    if (newTagExistsKey) {
      const updatedTagExists = { ...localFilters.tagExists, [newTagExistsKey]: newTagExistsValue };
      updateFilters({ tagExists: updatedTagExists });
      setNewTagExistsKey('');
      setNewTagExistsValue(true);
    }
  };

  const removeTagExistsFilter = (key: string) => {
    const { [key]: removed, ...remainingTagExists } = localFilters.tagExists || {};
    updateFilters({ tagExists: remainingTagExists });
  };

  // Format-specific filter operations
  const updateFormatSpecificFilter = (key: string, value: number | undefined) => {
    updateFilters({ [key]: value });
  };

  // Reset all filters
  const handleReset = () => {
    setLocalFilters({});
    onReset();
  };

  // Apply filters
  const handleApply = () => {
    onApply();
  };

  // Generate BBC filter query string
  const generateFilterQuery = (): string => {
    const params = new URLSearchParams();
    
    // Basic filters
    if (localFilters.label) params.append('label', localFilters.label);
    if (localFilters.format) params.append('format', localFilters.format);
    if (localFilters.codec) params.append('codec', localFilters.codec);
    if (localFilters.timerange) params.append('timerange', localFilters.timerange);
    
    // Tag filters
    Object.entries(localFilters.tags || {}).forEach(([key, value]) => {
      params.append(`tag.${key}`, value);
    });
    
    // Tag existence filters
    Object.entries(localFilters.tagExists || {}).forEach(([key, value]) => {
      params.append(`tag_exists.${key}`, value.toString());
    });
    
    // Format-specific filters
    if (localFilters.frame_width) params.append('frame_width', localFilters.frame_width.toString());
    if (localFilters.frame_height) params.append('frame_height', localFilters.frame_height.toString());
    if (localFilters.sample_rate) params.append('sample_rate', localFilters.sample_rate.toString());
    if (localFilters.bits_per_sample) params.append('bits_per_sample', localFilters.bits_per_sample.toString());
    if (localFilters.channels) params.append('channels', localFilters.channels.toString());
    
    // Pagination
    if (localFilters.page) params.append('page', localFilters.page);
    if (localFilters.limit) params.append('limit', localFilters.limit.toString());
    
    return params.toString();
  };

  const activeFilterCount = Object.keys(localFilters).filter(key => 
    localFilters[key as keyof BBCFilterPatterns] !== undefined && 
    localFilters[key as keyof BBCFilterPatterns] !== null &&
    localFilters[key as keyof BBCFilterPatterns] !== ''
  ).length;

  return (
    <Box className={className}>
      {/* Filter Header */}
      <Group justify="space-between" align="center" mb="md">
        <Group gap="xs">
          <IconFilter size={20} />
          <Text fw={500}>BBC TAMS Advanced Filters</Text>
          {activeFilterCount > 0 && (
            <Badge variant="filled" color="blue" size="sm">
              {activeFilterCount} active
            </Badge>
          )}
        </Group>
        
        <Group gap="xs">
          <Button
            variant="outline"
            size="xs"
            onClick={() => setIsCollapsed(!isCollapsed)}
            leftSection={isCollapsed ? <IconChevronDown size={14} /> : <IconChevronUp size={14} />}
          >
            {isCollapsed ? 'Expand' : 'Collapse'}
          </Button>
          
          <Button
            variant="outline"
            size="xs"
            onClick={handleReset}
            disabled={disabled || activeFilterCount === 0}
            leftSection={<IconX size={14} />}
          >
            Reset
          </Button>
          
          <Button
            size="xs"
            onClick={handleApply}
            disabled={disabled}
          >
            Apply Filters
          </Button>
        </Group>
      </Group>

      {/* BBC TAMS Compliance Info */}
      <Alert icon={<IconInfoCircle size={16} />} title="BBC TAMS v6.0 Compliant" color="blue" mb="md">
        This filter interface implements BBC TAMS specification patterns including tag.{name}, tag_exists.{name}, 
        format-specific filters, and timerange filtering.
      </Alert>

      <Collapse in={!isCollapsed}>
        <Stack gap="lg">
          {/* Basic Filters */}
          <Box>
            <Text fw={500} mb="sm">Basic Filters</Text>
            <Group gap="md" align="flex-end">
              <TextInput
                label="Label"
                placeholder="Filter by label"
                value={localFilters.label || ''}
                onChange={(e) => updateFilters({ label: e.target.value })}
                disabled={disabled}
                style={{ flex: 1 }}
              />
              
              <Select
                label="Format"
                placeholder="Select format"
                data={availableFormats}
                value={localFilters.format || ''}
                onChange={(value) => updateFilters({ format: value || undefined })}
                disabled={disabled}
                style={{ flex: 1 }}
                clearable
              />
              
              <Select
                label="Codec"
                placeholder="Select codec"
                data={availableCodecs}
                value={localFilters.codec || ''}
                onChange={(value) => updateFilters({ codec: value || undefined })}
                disabled={disabled}
                style={{ flex: 1 }}
                clearable
              />
            </Group>
          </Box>

          {/* Timerange Filter */}
          {showTimerange && (
            <Box>
              <Text fw={500} mb="sm">Time Range Filter</Text>
              <TimerangePicker
                value={localFilters.timerange || ''}
                onChange={(value) => updateFilters({ timerange: value })}
                label="Filter by timerange"
                showPresets={true}
                allowInfinite={true}
              />
            </Box>
          )}

          {/* Tag Filters */}
          {showTagFilters && (
            <Box>
              <Text fw={500} mb="sm">Tag Filters</Text>
              
              {/* Tag Value Filters */}
              <Box mb="md">
                <Text size="sm" c="dimmed" mb="xs">Filter by tag values (tag.{name} = value)</Text>
                <Group gap="xs" align="flex-end">
                  <TextInput
                    placeholder="Tag name"
                    value={newTagKey}
                    onChange={(e) => setNewTagKey(e.target.value)}
                    disabled={disabled}
                    style={{ flex: 1 }}
                  />
                  <TextInput
                    placeholder="Tag value"
                    value={newTagValue}
                    onChange={(e) => setNewTagValue(e.target.value)}
                    disabled={disabled}
                    style={{ flex: 1 }}
                  />
                  <Button
                    size="xs"
                    onClick={addTagFilter}
                    disabled={disabled || !newTagKey || !newTagValue}
                    leftSection={<IconPlus size={14} />}
                  >
                    Add
                  </Button>
                </Group>
                
                {/* Active Tag Value Filters */}
                {Object.entries(localFilters.tags || {}).length > 0 && (
                  <Group gap="xs" mt="xs" wrap="wrap">
                    {Object.entries(localFilters.tags || {}).map(([key, value]) => (
                      <Chip
                        key={key}
                        checked={true}
                        variant="filled"
                        onClick={() => removeTagFilter(key)}
                        rightSection={<IconX size={12} />}
                      >
                        {key}={value}
                      </Chip>
                    ))}
                  </Group>
                )}
              </Box>

              {/* Tag Existence Filters */}
              <Box>
                <Text size="sm" c="dimmed" mb="xs">Filter by tag existence (tag_exists.{name} = true/false)</Text>
                <Group gap="xs" align="flex-end">
                  <TextInput
                    placeholder="Tag name"
                    value={newTagExistsKey}
                    onChange={(e) => setNewTagExistsKey(e.target.value)}
                    disabled={disabled}
                    style={{ flex: 1 }}
                  />
                  <Switch
                    label="Tag exists"
                    checked={newTagExistsValue}
                    onChange={(e) => setNewTagExistsValue(e.currentTarget.checked)}
                    disabled={disabled}
                  />
                  <Button
                    size="xs"
                    onClick={addTagExistsFilter}
                    disabled={disabled || !newTagExistsKey}
                    leftSection={<IconPlus size={14} />}
                  >
                    Add
                  </Button>
                </Group>
                
                {/* Active Tag Existence Filters */}
                {Object.entries(localFilters.tagExists || {}).length > 0 && (
                  <Group gap="xs" mt="xs" wrap="wrap">
                    {Object.entries(localFilters.tagExists || {}).map(([key, value]) => (
                      <Chip
                        key={key}
                        checked={true}
                        variant="filled"
                        onClick={() => removeTagExistsFilter(key)}
                        rightSection={<IconX size={12} />}
                      >
                        {key} {value ? 'exists' : 'missing'}
                      </Chip>
                    ))}
                  </Group>
                )}
              </Box>
            </Box>
          )}

          {/* Format-Specific Filters */}
          {showFormatSpecific && (
            <Box>
              <Text fw={500} mb="sm">Format-Specific Filters</Text>
              
              <Group gap="md" align="flex-end">
                {/* Video-specific filters */}
                <NumberInput
                  label="Frame Width"
                  placeholder="1920"
                  min={1}
                  value={localFilters.frame_width || undefined}
                  onChange={(value) => updateFormatSpecificFilter('frame_width', value)}
                  disabled={disabled}
                  style={{ flex: 1 }}
                />
                
                <NumberInput
                  label="Frame Height"
                  placeholder="1080"
                  min={1}
                  value={localFilters.frame_height || undefined}
                  onChange={(value) => updateFormatSpecificFilter('frame_height', value)}
                  disabled={disabled}
                  style={{ flex: 1 }}
                />
                
                {/* Audio-specific filters */}
                <NumberInput
                  label="Sample Rate (Hz)"
                  placeholder="48000"
                  min={1}
                  value={localFilters.sample_rate || undefined}
                  onChange={(value) => updateFormatSpecificFilter('sample_rate', value)}
                  disabled={disabled}
                  style={{ flex: 1 }}
                />
                
                <NumberInput
                  label="Bits Per Sample"
                  placeholder="16"
                  min={1}
                  value={localFilters.bits_per_sample || undefined}
                  onChange={(value) => updateFormatSpecificFilter('bits_per_sample', value)}
                  disabled={disabled}
                  style={{ flex: 1 }}
                />
                
                <NumberInput
                  label="Channels"
                  placeholder="2"
                  min={1}
                  value={localFilters.channels || undefined}
                  onChange={(value) => updateFormatSpecificFilter('channels', value)}
                  disabled={disabled}
                  style={{ flex: 1 }}
                />
              </Group>
            </Box>
          )}

          {/* Pagination */}
          {showPagination && (
            <Box>
              <Text fw={500} mb="sm">Pagination</Text>
              <Group gap="md" align="flex-end">
                <TextInput
                  label="Page Cursor"
                  placeholder="Cursor for pagination"
                  value={localFilters.page || ''}
                  onChange={(e) => updateFilters({ page: e.target.value })}
                  disabled={disabled}
                  style={{ flex: 1 }}
                />
                
                <NumberInput
                  label="Limit"
                  placeholder="50"
                  min={1}
                  max={1000}
                  value={localFilters.limit || undefined}
                  onChange={(value) => updateFilters({ limit: value })}
                  disabled={disabled}
                  style={{ flex: 1 }}
                />
              </Group>
            </Box>
          )}

          {/* Generated Query String */}
          <Box p="xs" bg="gray.0" style={{ borderRadius: '4px', border: '1px solid #dee2e6' }}>
            <Text size="sm" fw={500} mb="xs">Generated BBC Filter Query:</Text>
            <Text size="sm" fontFamily="monospace" bg="white" px="xs" py="2px" style={{ borderRadius: '2px' }}>
              {generateFilterQuery() || 'No filters applied'}
            </Text>
          </Box>
        </Stack>
      </Collapse>
    </Box>
  );
};

export default BBCAdvancedFilter;
