import { useState, useEffect } from 'react';
import {
  Card,
  Group,
  TextInput,
  Select,
  MultiSelect,
  Button,
  Badge,
  Box,
  Stack,
  Text,
  ActionIcon,
  Collapse,
  Divider,
  NumberInput,
  Switch
} from '@mantine/core';

import {
  IconFilter,
  IconSearch,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconTag,
  IconCalendar,
  IconSettings
} from '@tabler/icons-react';

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'daterange' | 'date' | 'number' | 'boolean';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface FilterState {
  [key: string]: any;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterState;
}

interface AdvancedFilterProps {
  filters: FilterOption[];
  value: FilterState;
  onChange: (filters: FilterState) => void;
  presets?: FilterPreset[];
  onPresetSave?: (preset: FilterPreset) => void;
  onPresetDelete?: (presetId: string) => void;
  showAdvanced?: boolean;
  onShowAdvancedChange?: (show: boolean) => void;
}

export default function AdvancedFilter({
  filters,
  value,
  onChange,
  presets = [],
  onPresetSave,
  onPresetDelete,
  showAdvanced = false,
  onShowAdvancedChange
}: AdvancedFilterProps) {
  const [localValue, setLocalValue] = useState<FilterState>(value);
  const [isExpanded, setIsExpanded] = useState(false);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleFilterChange = (key: string, newValue: any) => {
    const updatedFilters = { ...localValue };
    if (newValue === null || newValue === '' || (Array.isArray(newValue) && newValue.length === 0)) {
      delete updatedFilters[key];
    } else {
      updatedFilters[key] = newValue;
    }
    setLocalValue(updatedFilters);
    onChange(updatedFilters);
  };

  const clearAllFilters = () => {
    setLocalValue({});
    onChange({});
  };

  const hasActiveFilters = Object.keys(value).length > 0;

  const renderFilterInput = (filter: FilterOption) => {
    const currentValue = localValue[filter.key];

    switch (filter.type) {
      case 'text':
        return (
          <TextInput
            placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
            value={currentValue || ''}
            onChange={(e) => handleFilterChange(filter.key, e.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            style={{ flex: 1 }}
          />
        );

      case 'select':
        return (
          <Select
            placeholder={filter.placeholder || `Select ${filter.label.toLowerCase()}`}
            data={filter.options || []}
            value={currentValue || null}
            onChange={(value) => handleFilterChange(filter.key, value)}
            clearable
            style={{ minWidth: 150 }}
          />
        );

      case 'multiselect':
        return (
          <MultiSelect
            placeholder={filter.placeholder || `Select ${filter.label.toLowerCase()}...`}
            data={filter.options || []}
            value={currentValue || []}
            onChange={(value) => handleFilterChange(filter.key, value)}
            clearable
            searchable
            style={{ minWidth: 200 }}
          />
        );

      case 'daterange':
        return (
          <TextInput
            placeholder={filter.placeholder || 'Select date range (YYYY-MM-DD)'}
            value={currentValue || ''}
            onChange={(e) => handleFilterChange(filter.key, e.currentTarget.value)}
            style={{ minWidth: 200 }}
          />
        );

      case 'date':
        return (
          <Select
            placeholder={filter.placeholder || 'Select date range'}
            data={[
              { value: 'today', label: 'Today' },
              { value: 'yesterday', label: 'Yesterday' },
              { value: 'last_7_days', label: 'Last 7 Days' },
              { value: 'last_30_days', label: 'Last 30 Days' },
              { value: 'last_90_days', label: 'Last 90 Days' },
              { value: 'this_month', label: 'This Month' },
              { value: 'last_month', label: 'Last Month' },
              { value: 'this_year', label: 'This Year' },
              { value: 'last_year', label: 'Last Year' }
            ]}
            value={currentValue || null}
            onChange={(value) => handleFilterChange(filter.key, value)}
            clearable
            style={{ minWidth: 200 }}
          />
        );

      case 'number':
        return (
          <NumberInput
            placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}`}
            value={currentValue || null}
            onChange={(value) => handleFilterChange(filter.key, value)}
            {...(filter.min !== undefined && { min: filter.min })}
            {...(filter.max !== undefined && { max: filter.max })}
            style={{ minWidth: 120 }}
          />
        );

      case 'boolean':
        return (
          <Switch
            label={filter.label}
            checked={currentValue || false}
            onChange={(e) => handleFilterChange(filter.key, e.currentTarget.checked)}
          />
        );

      default:
        return null;
    }
  };

  const renderActiveFilters = () => {
    const activeFilters = Object.entries(value).filter(([_, val]) => 
      val !== null && val !== '' && val !== undefined && 
      !(Array.isArray(val) && val.length === 0)
    );

    if (activeFilters.length === 0) return null;

    return (
      <Group gap="xs" wrap="wrap">
        {activeFilters.map(([key, val]) => {
          const filter = filters.find(f => f.key === key);
          if (!filter) return null;

          let displayValue = val;
          if (Array.isArray(val)) {
            displayValue = val.join(', ');
          } else if (typeof val === 'object' && val !== null) {
            displayValue = `${val[0]?.toLocaleDateString()} - ${val[1]?.toLocaleDateString()}`;
          }

          return (
            <Badge
              key={key}
              color="blue"
              variant="light"
              rightSection={
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  onClick={() => handleFilterChange(key, null)}
                >
                  <IconX size={10} />
                </ActionIcon>
              }
            >
              {filter.label}: {displayValue}
            </Badge>
          );
        })}
      </Group>
    );
  };

  return (
    <Card withBorder>
      <Stack gap="md">
        {/* Main Filter Row */}
        <Group gap="md" align="flex-end">
          {filters.slice(0, showAdvanced ? undefined : 3).map((filter) => (
            <Box key={filter.key}>
              <Text size="xs" fw={500} mb={4} c="dimmed">
                {filter.label}
              </Text>
              {renderFilterInput(filter)}
            </Box>
          ))}
          
          <Group gap="xs">
            <Button
              variant="light"
              leftSection={<IconFilter size={16} />}
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
            >
              Clear All
            </Button>
            
            {filters.length > 3 && (
              <Button
                variant="subtle"
                leftSection={isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Show Less' : 'Show More'}
              </Button>
            )}
          </Group>
        </Group>

        {/* Advanced Filters (Collapsible) */}
        {filters.length > 3 && (
          <Collapse in={isExpanded}>
            <Divider my="md" />
            <Group gap="md" align="flex-end">
              {filters.slice(3).map((filter) => (
                <Box key={filter.key}>
                  <Text size="xs" fw={500} mb={4} c="dimmed">
                    {filter.label}
                  </Text>
                  {renderFilterInput(filter)}
                </Box>
              ))}
            </Group>
          </Collapse>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <Box>
            <Text size="xs" fw={500} mb="xs" c="dimmed">
              Active Filters:
            </Text>
            {renderActiveFilters()}
          </Box>
        )}

        {/* Filter Presets */}
        {presets.length > 0 && (
          <Box>
            <Text size="xs" fw={500} mb="xs" c="dimmed">
              Saved Presets:
            </Text>
            <Group gap="xs" wrap="wrap">
              {presets.map((preset) => (
                <Badge
                  key={preset.id}
                  color="gray"
                  variant="outline"
                  style={{ cursor: 'pointer' }}
                  rightSection={
                    onPresetDelete && (
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPresetDelete(preset.id);
                        }}
                      >
                        <IconX size={10} />
                      </ActionIcon>
                    )
                  }
                  onClick={() => onChange(preset.filters)}
                >
                  {preset.name}
                </Badge>
              ))}
            </Group>
          </Box>
        )}

        {/* Save Current Filter as Preset */}
        {onPresetSave && hasActiveFilters && (
          <Group gap="xs">
            <TextInput
              placeholder="Save current filters as preset..."
              value={presetName}
              onChange={(e) => setPresetName(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Button
              size="sm"
              variant="light"
              onClick={() => {
                if (presetName.trim()) {
                  onPresetSave({
                    id: Date.now().toString(),
                    name: presetName.trim(),
                    filters: value
                  });
                  setPresetName('');
                }
              }}
              disabled={!presetName.trim()}
            >
              Save Preset
            </Button>
          </Group>
        )}
      </Stack>
    </Card>
  );
}

// Helper function to create filter options
export function createFilterOptions(options: FilterOption[]): FilterOption[] {
  return options;
}

// Common filter presets
export const commonFilterPresets: FilterPreset[] = [
  {
    id: 'recent',
    name: 'Recent Items',
    filters: { created: 'last_7_days' }
  },
  {
    id: 'active',
    name: 'Active Only',
    filters: { status: 'active' }
  },
  {
    id: 'video',
    name: 'Video Content',
    filters: { format: 'urn:x-nmos:format:video' }
  },
  {
    id: 'audio',
    name: 'Audio Content',
    filters: { format: 'urn:x-nmos:format:audio' }
  }
]; 