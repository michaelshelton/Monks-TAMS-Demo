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
import { BBCApiOptions } from '../services/api';

// BBC TAMS Filter patterns - standardized interface
export interface BBCFilterPatterns extends BBCApiOptions {
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

// Standardized BBC Advanced Filter Props
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
  
  // Custom styling
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'filled' | 'outline' | 'light' | 'white' | 'subtle' | 'gradient';
}

// BBC TAMS content formats - standardized
const BBC_CONTENT_FORMATS = [
  'urn:x-nmos:format:video',
  'urn:x-nmos:format:audio', 
  'urn:x-nmos:format:data',
  'urn:x-nmos:format:multi',
  'urn:x-tam:format:image'
];

// Common codecs - standardized
const COMMON_CODECS = [
  'video/h264',
  'video/h265',
  'video/mp4',
  'video/av1',
  'audio/aac',
  'audio/mp3',
  'audio/wav',
  'audio/flac',
  'application/json',
  'text/plain',
  'image/jpeg',
  'image/png'
];

/**
 * Standardized BBC TAMS Advanced Filter Component
 * 
 * This component provides comprehensive filtering capabilities following BBC TAMS v6.0 specification.
 * It supports format-specific filters, tag-based filtering, temporal filtering, and pagination.
 * 
 * @example
 * ```tsx
 * <BBCAdvancedFilter
 *   filters={currentFilters}
 *   onFiltersChange={setFilters}
 *   onReset={resetFilters}
 *   onApply={applyFilters}
 *   showTimerange={true}
 *   showFormatSpecific={true}
 *   showTagFilters={true}
 * />
 * ```
 */
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
  className,
  size = 'md',
  variant = 'outline'
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [localFilters, setLocalFilters] = useState<BBCFilterPatterns>(filters);

  // Sync local filters with prop changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof BBCFilterPatterns, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleTagFilterChange = (tagName: string, tagValue: string) => {
    const newTags = { ...localFilters.tags, [tagName]: tagValue };
    handleFilterChange('tags', newTags);
  };

  const handleTagExistsChange = (tagName: string, exists: boolean) => {
    const newTagExists = { ...localFilters.tagExists, [tagName]: exists };
    handleFilterChange('tagExists', newTagExists);
  };

  const handleRemoveTag = (tagName: string) => {
    const newTags = { ...localFilters.tags };
    delete newTags[tagName];
    handleFilterChange('tags', newTags);
  };

  const handleRemoveTagExists = (tagName: string) => {
    const newTagExists = { ...localFilters.tagExists };
    delete newTagExists[tagName];
    handleFilterChange('tagExists', newTagExists);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply();
  };

  const handleReset = () => {
    const resetFilters: BBCFilterPatterns = {
      tags: {},
      tagExists: {},
      custom: {}
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onReset();
  };

  const getFormatIcon = (format: string) => {
    if (format.includes('video')) return <IconVideo size={16} />;
    if (format.includes('audio')) return <IconMusic size={16} />;
    if (format.includes('data')) return <IconDatabase size={16} />;
    if (format.includes('image')) return <IconPhoto size={16} />;
    return <IconDatabase size={16} />;
  };

  return (
    <Box {...(className ? { className } : {})}>
      {/* Filter Header */}
      <Group justify="space-between" align="center" mb="md">
        <Group gap="xs">
          <IconFilter size={20} />
          <Text fw={500}>BBC TAMS Advanced Filters</Text>
          <Badge variant="light" color="blue" size="sm">v6.0</Badge>
        </Group>
        
        <Group gap="xs">
          <Button
            variant="light"
            size="xs"
            onClick={() => setIsCollapsed(!isCollapsed)}
            leftSection={isCollapsed ? <IconChevronDown size={14} /> : <IconChevronUp size={14} />}
          >
            {isCollapsed ? 'Show' : 'Hide'}
          </Button>
          
          <Button
            variant="light"
            size="xs"
            onClick={handleReset}
            leftSection={<IconX size={14} />}
            disabled={disabled}
          >
            Reset
          </Button>
          
          <Button
            variant={variant}
            size={size}
            onClick={handleApply}
            leftSection={<IconFilter size={16} />}
            disabled={disabled}
          >
            Apply Filters
          </Button>
        </Group>
      </Group>

      {/* Filter Content */}
      <Collapse in={!isCollapsed}>
        <Stack gap="md">
          {/* Basic Filters */}
          <Box>
            <Text fw={500} mb="xs" size="sm">Basic Filters</Text>
            <Group gap="md" grow>
              <TextInput
                label="Label"
                placeholder="Filter by label"
                value={localFilters.label || ''}
                onChange={(e) => handleFilterChange('label', e.target.value)}
                disabled={disabled}
                size={size}
              />
              
              <Select
                label="Format"
                placeholder="Select format"
                data={availableFormats.map(format => ({
                  value: format,
                  label: format.split(':').pop() || format,
                  leftSection: getFormatIcon(format)
                }))}
                value={localFilters.format || ''}
                onChange={(value) => handleFilterChange('format', value)}
                disabled={disabled}
                size={size}
                clearable
              />
              
              <Select
                label="Codec"
                placeholder="Select codec"
                data={availableCodecs}
                value={localFilters.codec || ''}
                onChange={(value) => handleFilterChange('codec', value)}
                disabled={disabled}
                size={size}
                clearable
              />
            </Group>
          </Box>

          {/* Timerange Filter */}
          {showTimerange && (
            <Box>
              <Text fw={500} mb="xs" size="sm">Temporal Filter</Text>
              <TimerangePicker
                value={localFilters.timerange || ''}
                onChange={(value) => handleFilterChange('timerange', value)}
                label="Timerange"
                placeholder="0:0_1:30"
                size={size}
                disabled={disabled}
              />
            </Box>
          )}

          {/* Format-Specific Filters */}
          {showFormatSpecific && (
            <Box>
              <Text fw={500} mb="xs" size="sm">Format-Specific Filters</Text>
              <Group gap="md" grow>
                                 <NumberInput
                   label="Frame Width"
                   placeholder="1920"
                   value={localFilters.frame_width || ''}
                   onChange={(value) => handleFilterChange('frame_width', value)}
                   disabled={disabled}
                   size={size}
                   min={1}
                 />
                 
                 <NumberInput
                   label="Frame Height"
                   placeholder="1080"
                   value={localFilters.frame_height || ''}
                   onChange={(value) => handleFilterChange('frame_height', value)}
                   disabled={disabled}
                   size={size}
                   min={1}
                 />
                 
                 <NumberInput
                   label="Sample Rate"
                   placeholder="48000"
                   value={localFilters.sample_rate || ''}
                   onChange={(value) => handleFilterChange('sample_rate', value)}
                   disabled={disabled}
                   size={size}
                   min={1}
                 />
              </Group>
            </Box>
          )}

          {/* Tag Filters */}
          {showTagFilters && (
            <Box>
              <Text fw={500} mb="xs" size="sm">Tag Filters</Text>
              
              {/* Tag Value Filters */}
              <Box mb="md">
                <Text size="sm" c="dimmed" mb="xs">Tag Values</Text>
                <Group gap="xs" wrap="wrap">
                  {Object.entries(localFilters.tags || {}).map(([tagName, tagValue]) => (
                    <Group key={tagName} gap="xs" align="center">
                      <Chip
                        checked={true}
                        variant="filled"
                        color="blue"
                        size={size}
                      >
                        {tagName}: {tagValue}
                      </Chip>
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        onClick={() => handleRemoveTag(tagName)}
                        disabled={disabled}
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    </Group>
                  ))}
                </Group>
                
                <Group gap="md" mt="xs">
                  <TextInput
                    placeholder="Tag name"
                    size="xs"
                    style={{ flex: 1 }}
                    disabled={disabled}
                  />
                  <TextInput
                    placeholder="Tag value"
                    size="xs"
                    style={{ flex: 1 }}
                    disabled={disabled}
                  />
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPlus size={12} />}
                    onClick={() => {}} // TODO: Implement add tag
                    disabled={disabled}
                  >
                    Add Tag
                  </Button>
                </Group>
              </Box>

              {/* Tag Existence Filters */}
              <Box>
                <Text size="sm" c="dimmed" mb="xs">Tag Existence</Text>
                <Group gap="xs" wrap="wrap">
                  {Object.entries(localFilters.tagExists || {}).map(([tagName, exists]) => (
                    <Group key={tagName} gap="xs" align="center">
                      <Chip
                        checked={true}
                        variant="filled"
                        color={exists ? "green" : "red"}
                        size={size}
                      >
                        {tagName}: {exists ? "exists" : "missing"}
                      </Chip>
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        onClick={() => handleRemoveTagExists(tagName)}
                        disabled={disabled}
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    </Group>
                  ))}
                </Group>
              </Box>
            </Box>
          )}

          {/* Pagination Controls */}
          {showPagination && (
            <Box>
              <Text fw={500} mb="xs" size="sm">Pagination</Text>
              <Group gap="md" grow>
                <TextInput
                  label="Page Cursor"
                  placeholder="Cursor for pagination"
                  value={localFilters.page || ''}
                  onChange={(e) => handleFilterChange('page', e.target.value)}
                  disabled={disabled}
                  size={size}
                />
                
                                 <NumberInput
                   label="Limit"
                   placeholder="25"
                   value={localFilters.limit || ''}
                   onChange={(value) => handleFilterChange('limit', value)}
                   disabled={disabled}
                   size={size}
                   min={1}
                   max={1000}
                 />
              </Group>
            </Box>
          )}

          {/* BBC TAMS Compliance Note */}
          <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
            <Text size="sm">
              This filter follows BBC TAMS v6.0 specification with support for cursor-based pagination, 
              temporal filtering, and advanced tag-based queries.
            </Text>
          </Alert>
        </Stack>
      </Collapse>
    </Box>
  );
};

export default BBCAdvancedFilter;
export type { BBCAdvancedFilterProps };
