import React, { useState, useEffect, useCallback } from 'react';
import {
  Group,
  NumberInput,
  Text,
  Button,
  Stack,
  Alert,
  TextInput,
  Select,
  ActionIcon,
  Tooltip,
  Box,
  Divider,
  Code,
  Switch
} from '@mantine/core';
import { IconClock, IconX, IconInfoCircle, IconRefresh } from '@tabler/icons-react';

// BBC TAMS Timerange format: [start]:[start_subsecond]_[end]:[end_subsecond]
// Examples: "0:0", "0:0_1:30", "1:500000000_2:100000000"
interface TimerangePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  showPresets?: boolean;
  allowInfinite?: boolean;
  className?: string;
  
  // Custom styling
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'filled' | 'outline' | 'light' | 'white' | 'subtle' | 'gradient';
}

interface TimeValue {
  seconds: number;
  subseconds: number;
}

interface ParsedTimerange {
  start: TimeValue;
  end: TimeValue | null;
  isInfinite: boolean;
}

// BBC TAMS Timerange Presets
const BBC_TIMERANGE_PRESETS = [
  { label: '0:0 (Start)', value: '0:0' },
  { label: '0:0_1:0 (1 second)', value: '0:0_1:0' },
  { label: '0:0_1:30 (1.5 seconds)', value: '0:0_1:30' },
  { label: '0:0_5:0 (5 seconds)', value: '0:0_5:0' },
  { label: '0:0_10:0 (10 seconds)', value: '0:0_10:0' },
  { label: '0:0_30:0 (30 seconds)', value: '0:0_30:0' },
  { label: '0:0_1:0_0 (1 minute)', value: '0:0_60:0' },
  { label: '0:0_5:0_0 (5 minutes)', value: '0:0_300:0' },
  { label: '0:0_10:0_0 (10 minutes)', value: '0:0_600:0' },
  { label: '0:0_1:0_0_0 (1 hour)', value: '0:0_3600:0' },
  { label: '∞ (Infinite)', value: '0:0_∞' }
];

/**
 * Standardized BBC TAMS Timerange Picker Component
 * 
 * This component provides temporal filtering capabilities following BBC TAMS v6.0 specification.
 * It supports the BBC TAMS timerange format: [start]:[start_subsecond]_[end]:[end_subsecond]
 * 
 * @example
 * ```tsx
 * <TimerangePicker
 *   value={timerange}
 *   onChange={setTimerange}
 *   label="Time Range"
 *   placeholder="0:0_1:30"
 *   showPresets={true}
 *   allowInfinite={true}
 * />
 * ```
 */
export default function TimerangePicker({
  value,
  onChange,
  placeholder = "0:0_1:30",
  label = "Time Range",
  required = false,
  error,
  disabled = false,
  showPresets = true,
  allowInfinite = true,
  className,
  size = 'md',
  variant = 'outline'
}: TimerangePickerProps) {
  const [startTime, setStartTime] = useState<TimeValue>({ seconds: 0, subseconds: 0 });
  const [endTime, setEndTime] = useState<TimeValue | null>({ seconds: 1, subseconds: 30 });
  const [isInfinite, setIsInfinite] = useState(false);
  const [internalValue, setInternalValue] = useState(value);

  // Parse timerange string into structured format
  const parseTimerange = useCallback((timerange: string): ParsedTimerange => {
    if (!timerange) {
      return {
        start: { seconds: 0, subseconds: 0 },
        end: { seconds: 1, subseconds: 30 },
        isInfinite: false
      };
    }

    const parts = timerange.split('_');
    const startPart = parts[0];
    const endPart = parts[1];

    const parseTimePart = (timePart: string): TimeValue => {
      const [seconds, subseconds] = timePart.split(':').map(Number);
      return {
        seconds: seconds || 0,
        subseconds: subseconds || 0
      };
    };

    const start = parseTimePart(startPart || '0:0');
    let end: TimeValue | null = null;
    let infinite = false;

    if (endPart) {
      if (endPart === '∞' || endPart === 'inf') {
        infinite = true;
      } else {
        end = parseTimePart(endPart);
      }
    }

    return { start, end, isInfinite: infinite };
  }, []);

  // Generate timerange string from structured format
  const generateTimerange = useCallback((): string => {
    if (isInfinite) {
      return `${startTime.seconds}:${startTime.subseconds}_∞`;
    }
    
    if (endTime) {
      return `${startTime.seconds}:${startTime.subseconds}_${endTime.seconds}:${endTime.subseconds}`;
    }
    
    return `${startTime.seconds}:${startTime.subseconds}`;
  }, [startTime, endTime, isInfinite]);

  // Update internal state when value prop changes
  useEffect(() => {
    if (value !== internalValue) {
      const parsed = parseTimerange(value);
      setStartTime(parsed.start);
      setEndTime(parsed.end);
      setIsInfinite(parsed.isInfinite);
      setInternalValue(value);
    }
  }, [value, parseTimerange, internalValue]);

  // Update output when internal state changes
  useEffect(() => {
    const newValue = generateTimerange();
    if (newValue !== internalValue) {
      setInternalValue(newValue);
      onChange(newValue);
    }
  }, [startTime, endTime, isInfinite, generateTimerange, onChange, internalValue]);

  const handleStartTimeChange = (field: 'seconds' | 'subseconds', value: string | number | null) => {
    const numValue = value === '' || value === null ? 0 : Number(value);
    setStartTime(prev => ({ ...prev, [field]: numValue }));
  };

  const handleEndTimeChange = (field: 'seconds' | 'subseconds', value: string | number | null) => {
    if (!endTime) return;
    const numValue = value === '' || value === null ? 0 : Number(value);
    setEndTime({ ...endTime, [field]: numValue });
  };

  const handlePresetSelect = (presetValue: string) => {
    if (presetValue === '0:0_∞') {
      setIsInfinite(true);
      setStartTime({ seconds: 0, subseconds: 0 });
      setEndTime(null);
    } else {
      const parsed = parseTimerange(presetValue);
      setStartTime(parsed.start);
      setEndTime(parsed.end);
      setIsInfinite(parsed.isInfinite);
    }
  };

  const handleInfiniteToggle = () => {
    setIsInfinite(!isInfinite);
    if (!isInfinite) {
      setEndTime(null);
    } else {
      setEndTime({ seconds: 1, subseconds: 30 });
    }
  };

  const handleReset = () => {
    setStartTime({ seconds: 0, subseconds: 0 });
    setEndTime({ seconds: 1, subseconds: 30 });
    setIsInfinite(false);
  };

  return (
    <Box {...(className ? { className } : {})}>
      {/* Label */}
      {label && (
        <Text size="sm" fw={500} mb="xs">
          {label}
          {required && <Text span c="red"> *</Text>}
        </Text>
      )}

      {/* BBC TAMS Format Info */}
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" mb="md">
        <Text size="xs">
          TAMS v6.0 format: <Code>[start]:[start_subsecond]_[end]:[end_subsecond]</Code>
        </Text>
      </Alert>

      {/* Timerange Input */}
      <TextInput
        value={internalValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        error={error}
        disabled={disabled}
        size={size}
        mb="md"
        rightSection={
          <Tooltip label="Reset to default">
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={handleReset}
              disabled={disabled}
            >
              <IconRefresh size={14} />
            </ActionIcon>
          </Tooltip>
        }
      />

      {/* Time Controls */}
      <Stack gap="md">
        {/* Start Time */}
        <Box>
          <Text size="sm" fw={500} mb="xs">Start Time</Text>
          <Group gap="xs">
                         <NumberInput
               label="Seconds"
               value={startTime.seconds}
               onChange={(value) => handleStartTimeChange('seconds', value || 0)}
               min={0}
               disabled={disabled}
               size={size}
               style={{ flex: 1 }}
             />
             <NumberInput
               label="Subseconds (ns)"
               value={startTime.subseconds}
               onChange={(value) => handleStartTimeChange('subseconds', value || 0)}
               min={0}
               max={999999999}
               disabled={disabled}
               size={size}
               style={{ flex: 1 }}
             />
          </Group>
        </Box>

        {/* End Time */}
        <Box>
          <Group justify="space-between" align="center" mb="xs">
            <Text size="sm" fw={500}>End Time</Text>
            {allowInfinite && (
              <Switch
                label="Infinite"
                checked={isInfinite}
                onChange={handleInfiniteToggle}
                disabled={disabled}
                size={size}
              />
            )}
          </Group>
          
          {!isInfinite && (
            <Group gap="xs">
                             <NumberInput
                 label="Seconds"
                 value={endTime?.seconds || 0}
                 onChange={(value) => handleEndTimeChange('seconds', value || 0)}
                 min={0}
                 disabled={disabled}
                 size={size}
                 style={{ flex: 1 }}
               />
               <NumberInput
                 label="Subseconds (ns)"
                 value={endTime?.subseconds || 0}
                 onChange={(value) => handleEndTimeChange('subseconds', value || 0)}
                 min={0}
                 max={999999999}
                 disabled={disabled}
                 size={size}
                 style={{ flex: 1 }}
               />
            </Group>
          )}
        </Box>
      </Stack>

      {/* Presets */}
      {showPresets && (
        <Box mt="md">
          <Text size="sm" fw={500} mb="xs">Quick Presets</Text>
          <Group gap="xs" wrap="wrap">
            {BBC_TIMERANGE_PRESETS.map((preset) => (
              <Button
                key={preset.value}
                variant={internalValue === preset.value ? 'filled' : 'light'}
                size="xs"
                onClick={() => handlePresetSelect(preset.value)}
                disabled={disabled}
              >
                {preset.label}
              </Button>
            ))}
          </Group>
        </Box>
      )}

      {/* Divider */}
      <Divider my="md" />
    </Box>
  );
}

export type { TimerangePickerProps };
