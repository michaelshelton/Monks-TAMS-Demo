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
  Code
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
  className
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
    
    if (!endTime) {
      return `${startTime.seconds}:${startTime.subseconds}`;
    }
    
    return `${startTime.seconds}:${startTime.subseconds}_${endTime.seconds}:${endTime.subseconds}`;
  }, [startTime, endTime, isInfinite]);

  // Parse initial value only once on mount
  useEffect(() => {
    if (value && typeof value === 'string') {
      const parsed = parseTimerange(value);
      setStartTime(parsed.start);
      setEndTime(parsed.end);
      setIsInfinite(parsed.isInfinite);
      setInternalValue(value);
    }
  }, [value, parseTimerange]);

  // Handle manual value updates
  const handleValueChange = useCallback((newValue: string) => {
    setInternalValue(newValue);
    onChange(newValue);
  }, [onChange]);

  // Handle start time changes
  const handleStartTimeChange = useCallback((field: 'seconds' | 'subseconds', newValue: number) => {
    setStartTime(prev => ({ ...prev, [field]: newValue }));
  }, []);

  // Handle end time changes
  const handleEndTimeChange = useCallback((field: 'seconds' | 'subseconds', newValue: number) => {
    if (endTime) {
      setEndTime({ ...endTime, [field]: newValue });
    }
  }, [endTime]);

  // Handle infinite toggle
  const handleInfiniteToggle = useCallback(() => {
    setIsInfinite(prev => !prev);
  }, []);

  // Apply current state to generate new timerange
  const handleApply = useCallback(() => {
    const newTimerange = generateTimerange();
    handleValueChange(newTimerange);
  }, [generateTimerange, handleValueChange]);

  // Reset to current value
  const handleReset = useCallback(() => {
    if (value && typeof value === 'string') {
      const parsed = parseTimerange(value);
      setStartTime(parsed.start);
      setEndTime(parsed.end);
      setIsInfinite(parsed.isInfinite);
      setInternalValue(value);
    }
  }, [value, parseTimerange]);

  // Preset timeranges for common use cases
  const presets = [
    { label: "0-1 min", value: "0:0_1:0" },
    { label: "0-5 min", value: "0:0_5:0" },
    { label: "0-10 min", value: "0:0_10:0" },
    { label: "0-1 hour", value: "0:0_3600:0" },
    { label: "Start only", value: "0:0" }
  ];

  const handlePresetClick = useCallback((presetValue: string) => {
    const parsed = parseTimerange(presetValue);
    setStartTime(parsed.start);
    setEndTime(parsed.end);
    setIsInfinite(parsed.isInfinite);
    setInternalValue(presetValue);
    onChange(presetValue);
  }, [parseTimerange, onChange]);

  return (
    <Box className={className || ''}>
      {label && (
        <Text size="sm" fw={500} mb="xs">
          {label}
          {required && <Text component="span" c="red"> *</Text>}
        </Text>
      )}

      <Stack gap="sm">
        {/* Start Time */}
        <Group gap="xs" align="flex-end">
          <Text size="sm" fw={500} style={{ minWidth: '60px' }}>Start:</Text>
                      <NumberInput
              label="Seconds"
              placeholder="0"
              min={0}
              value={startTime.seconds}
              onChange={(val) => handleStartTimeChange('seconds', typeof val === 'number' ? val : 0)}
              disabled={disabled}
              style={{ width: '80px' }}
            />
            <NumberInput
              label="Subseconds (ns)"
              placeholder="0"
              min={0}
              max={999999999}
              value={startTime.subseconds}
              onChange={(val) => handleStartTimeChange('subseconds', typeof val === 'number' ? val : 0)}
              disabled={disabled}
              style={{ width: '120px' }}
            />
        </Group>

        {/* End Time */}
        <Group gap="xs" align="flex-end">
          <Text size="sm" fw={500} style={{ minWidth: '60px' }}>End:</Text>
          {isInfinite ? (
            <Text c="dimmed" size="sm">∞ (Infinite)</Text>
          ) : (
            <>
                              <NumberInput
                  label="Seconds"
                  placeholder="1"
                  min={0}
                  value={endTime?.seconds || 0}
                  onChange={(val) => handleEndTimeChange('seconds', typeof val === 'number' ? val : 0)}
                  disabled={disabled}
                  style={{ width: '80px' }}
                />
                <NumberInput
                  label="Subseconds (ns)"
                  placeholder="30"
                  min={0}
                  max={999999999}
                  value={endTime?.subseconds || 0}
                  onChange={(val) => handleEndTimeChange('subseconds', typeof val === 'number' ? val : 0)}
                  disabled={disabled}
                  style={{ width: '120px' }}
                />
            </>
          )}
        </Group>

        {/* Controls */}
        <Group gap="xs">
          {allowInfinite && (
            <Button
              variant={isInfinite ? "filled" : "outline"}
              size="xs"
              onClick={handleInfiniteToggle}
              disabled={disabled}
              leftSection={<IconClock size={14} />}
            >
              {isInfinite ? "Finite" : "Infinite"}
            </Button>
          )}
          
          <Button
            size="xs"
            onClick={handleApply}
            disabled={disabled}
            leftSection={<IconRefresh size={14} />}
          >
            Apply
          </Button>
          
          <Button
            variant="outline"
            size="xs"
            onClick={handleReset}
            disabled={disabled}
            leftSection={<IconX size={14} />}
          >
            Reset
          </Button>
        </Group>

        {/* Current Value Display */}
        <Box>
          <Text size="xs" c="dimmed" mb="xs">Current Value:</Text>
          <TextInput
            value={internalValue}
            onChange={(e) => setInternalValue(e.currentTarget.value)}
            placeholder={placeholder}
            disabled={disabled}
            rightSection={
              <Tooltip label="Apply this value">
                <ActionIcon
                  onClick={() => handleValueChange(internalValue)}
                  disabled={disabled || internalValue === value}
                >
                  <IconInfoCircle size={16} />
                </ActionIcon>
              </Tooltip>
            }
          />
        </Box>

        {/* Presets */}
        {showPresets && (
          <Box>
            <Text size="xs" c="dimmed" mb="xs">Quick Presets:</Text>
            <Group gap="xs">
              {presets.map((preset) => (
                <Button
                  key={preset.value}
                  variant="light"
                  size="xs"
                  onClick={() => handlePresetClick(preset.value)}
                  disabled={disabled}
                >
                  {preset.label}
                </Button>
              ))}
            </Group>
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Alert color="red" title="Error" icon={<IconX size={16} />}>
            {error}
          </Alert>
        )}

        {/* Help Text */}
        <Alert color="blue" title="BBC TAMS Format" icon={<IconInfoCircle size={16} />}>
          <Text size="xs">
            Format: <Code>[seconds]:[subseconds]_[end_seconds]:[end_subseconds]</Code><br />
            Examples: "0:0", "0:0_1:30", "1:500000000_2:100000000"<br />
            Subseconds are in nanoseconds (0-999999999)
          </Text>
        </Alert>
      </Stack>
    </Box>
  );
}
