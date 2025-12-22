import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Group,
  Text,
  Button,
  Slider,
  Stack,
  Card,
  Badge,
  Tooltip,
  ActionIcon,
  NumberInput,
  Select,
  Divider,
  Alert
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconZoomIn,
  IconZoomOut,
  IconClock,
  IconInfoCircle,
  IconMaximize,
  IconMinimize
} from '@tabler/icons-react';

// BBC TAMS Timeline Navigation Component
interface TimelineNavigatorProps {
  // Timeline data
  duration: number; // Total duration in seconds
  currentTime: number; // Current position in seconds
  segments?: Array<{
    id: string;
    startTime: number;
    endTime: number;
    label: string;
    type: 'video' | 'audio' | 'data' | 'image';
    tags?: Record<string, string>;
  }>;
  
  // Navigation callbacks
  onTimeChange: (time: number) => void;
  onSegmentSelect?: (segmentId: string) => void;
  onZoomChange?: (zoomLevel: number) => void;
  
  // Display options
  showSegments?: boolean;
  showControls?: boolean;
  showZoom?: boolean;
  showTimeDisplay?: boolean;
  height?: number;
  disabled?: boolean;
  className?: string;
}

// Zoom levels for timeline navigation
const ZOOM_LEVELS = [
  { value: 0.1, label: '0.1x', pixelsPerSecond: 10 },
  { value: 0.25, label: '0.25x', pixelsPerSecond: 25 },
  { value: 0.5, label: '0.5x', pixelsPerSecond: 50 },
  { value: 1, label: '1x', pixelsPerSecond: 100 },
  { value: 2, label: '2x', pixelsPerSecond: 200 },
  { value: 5, label: '5x', pixelsPerSecond: 500 },
  { value: 10, label: '10x', pixelsPerSecond: 1000 }
];

export default function TimelineNavigator({
  duration,
  currentTime,
  segments = [],
  onTimeChange,
  onSegmentSelect,
  onZoomChange,
  showSegments = true,
  showControls = true,
  showZoom = true,
  showTimeDisplay = true,
  height = 200,
  disabled = false,
  className
}: TimelineNavigatorProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Calculate timeline dimensions
  const timelineWidth = useMemo(() => {
    const baseWidth = 800; // Base width in pixels
    return baseWidth * zoomLevel;
  }, [zoomLevel]);

  const pixelsPerSecond = useMemo(() => {
    return timelineWidth / duration;
  }, [timelineWidth, duration]);

  // Format time for display
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    } else if (minutes > 0) {
      return `${minutes}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    } else {
      return `${secs}.${milliseconds.toString().padStart(3, '0')}s`;
    }
  }, []);

  // Handle timeline click
  const handleTimelineClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickedTime = (clickX / pixelsPerSecond);
    
    // Clamp to valid range
    const clampedTime = Math.max(0, Math.min(clickedTime, duration));
    onTimeChange(clampedTime);
  }, [disabled, pixelsPerSecond, duration, onTimeChange]);

  // Handle zoom change
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoomLevel(newZoom);
    onZoomChange?.(newZoom);
  }, [onZoomChange]);

  // Handle playback controls
  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSkipBack = useCallback(() => {
    const newTime = Math.max(0, currentTime - 10);
    onTimeChange(newTime);
  }, [currentTime, onTimeChange]);

  const handleSkipForward = useCallback(() => {
    const newTime = Math.min(duration, currentTime + 10);
    onTimeChange(newTime);
  }, [currentTime, duration, onTimeChange]);

  const handleSeek = useCallback((newTime: number) => {
    onTimeChange(newTime);
  }, [onTimeChange]);

  // Get segment color based on type
  const getSegmentColor = useCallback((type: string): string => {
    switch (type) {
      case 'video': return 'blue';
      case 'audio': return 'green';
      case 'data': return 'orange';
      case 'image': return 'purple';
      default: return 'gray';
    }
  }, []);

  // Calculate segment position and width
  const getSegmentStyle = useCallback((startTime: number, endTime: number) => {
    const left = (startTime / duration) * 100;
    const width = ((endTime - startTime) / duration) * 100;
    return {
      left: `${left}%`,
      width: `${width}%`
    };
  }, [duration]);

  return (
    <Card withBorder {...(className ? { className } : {})}>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconClock size={20} />
            <Text fw={500}>Timeline Navigator</Text>
            <Badge variant="light" color="blue">TAMS v6.0</Badge>
          </Group>
          
          {showZoom && (
            <Group gap="xs">
              <Text size="sm">Zoom:</Text>
              <Select
                size="xs"
                value={zoomLevel.toString()}
                onChange={(value) => handleZoomChange(Number(value))}
                data={ZOOM_LEVELS.map(level => ({ value: level.value.toString(), label: level.label }))}
                disabled={disabled}
                style={{ width: '80px' }}
              />
            </Group>
          )}
        </Group>

        {/* Timeline Display */}
        <Box
          style={{
            height: height,
            width: '100%',
            position: 'relative',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            overflow: 'hidden'
          }}
          onClick={handleTimelineClick}
        >
          {/* Time markers */}
          <Box style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '20px' }}>
            {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => {
              const time = i;
              const left = (time / duration) * 100;
              return (
                <Box
                  key={time}
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    top: '0',
                    height: '100%',
                    borderLeft: '1px solid #dee2e6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text size="xs" c="dimmed" style={{ transform: 'rotate(-45deg)', fontSize: '10px' }}>
                    {formatTime(time)}
                  </Text>
                </Box>
              );
            })}
          </Box>

          {/* Segments */}
          {showSegments && segments.map((segment) => (
            <Tooltip
              key={segment.id}
              label={`${segment.label} (${formatTime(segment.startTime)} - ${formatTime(segment.endTime)})`}
              position="top"
            >
              <Box
                style={{
                  position: 'absolute',
                  top: '25px',
                  height: '30px',
                  backgroundColor: `var(--mantine-color-${getSegmentColor(segment.type)}-6)`,
                  border: '1px solid var(--mantine-color-white)',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  ...getSegmentStyle(segment.startTime, segment.endTime)
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSegmentSelect?.(segment.id);
                }}
              >
                <Text
                  size="xs"
                  c="white"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    padding: '0 4px'
                  }}
                >
                  {segment.label}
                </Text>
              </Box>
            </Tooltip>
          ))}

          {/* Current time indicator */}
          <Box
            style={{
              position: 'absolute',
              top: '20px',
              left: `${(currentTime / duration) * 100}%`,
              height: '100%',
              width: '2px',
              backgroundColor: 'red',
              zIndex: 10,
              transform: 'translateX(-50%)'
            }}
          >
            <Box
              style={{
                position: 'absolute',
                top: '-5px',
                left: '-5px',
                width: '12px',
                height: '12px',
                backgroundColor: 'red',
                borderRadius: '50%',
                border: '2px solid white'
              }}
            />
          </Box>
        </Box>

        {/* Controls */}
        {showControls && (
          <Group justify="space-between" align="center">
            {/* Playback Controls */}
            <Group gap="xs">
              <ActionIcon
                variant="light"
                size="md"
                onClick={handleSkipBack}
                disabled={disabled}
                title="Skip back 10 seconds"
              >
                <IconPlayerSkipBack size={16} />
              </ActionIcon>
              
              <ActionIcon
                variant="light"
                size="lg"
                onClick={handlePlayPause}
                disabled={disabled}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
              </ActionIcon>
              
              <ActionIcon
                variant="light"
                size="md"
                onClick={handleSkipForward}
                disabled={disabled}
                title="Skip forward 10 seconds"
              >
                <IconPlayerSkipForward size={16} />
              </ActionIcon>
            </Group>

            {/* Time Display */}
            {showTimeDisplay && (
              <Group gap="xs">
                <Text size="sm" c="dimmed">Current:</Text>
                <Text size="sm" fw={500}>{formatTime(currentTime)}</Text>
                <Text size="sm" c="dimmed">/</Text>
                <Text size="sm" fw={500}>{formatTime(duration)}</Text>
              </Group>
            )}

            {/* Fullscreen Toggle */}
            <ActionIcon
              variant="light"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              disabled={disabled}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
            </ActionIcon>
          </Group>
        )}

        {/* Time Slider */}
        <Slider
          value={currentTime}
          onChange={handleSeek}
          min={0}
          max={duration}
          step={0.1}
          disabled={disabled}
          label={formatTime}
          size="sm"
          marks={[
            { value: 0, label: '0s' },
            { value: duration / 4, label: formatTime(duration / 4) },
            { value: duration / 2, label: formatTime(duration / 2) },
            { value: (duration * 3) / 4, label: formatTime((duration * 3) / 4) },
            { value: duration, label: formatTime(duration) }
          ]}
        />

        {/* Playback Speed Control */}
        <Group gap="xs" align="center">
          <Text size="sm">Speed:</Text>
          <Select
            size="xs"
            value={playbackSpeed.toString()}
            onChange={(value) => setPlaybackSpeed(Number(value))}
            data={[
              { value: '0.25', label: '0.25x' },
              { value: '0.5', label: '0.5x' },
              { value: '1', label: '1x' },
              { value: '1.5', label: '1.5x' },
              { value: '2', label: '2x' },
              { value: '4', label: '4x' }
            ]}
            disabled={disabled}
            style={{ width: '80px' }}
          />
        </Group>

        {/* BBC TAMS Info */}
        <Alert color="blue" title="TAMS Timeline Navigation" icon={<IconInfoCircle size={16} />}>
          <Text size="xs">
            This timeline navigator provides TAMS v6.0 compliant navigation for time-addressable media flows. 
            It supports timeline-based positioning, segment visualization, and precise time control as specified 
            in the BBC TAMS API specification.
          </Text>
        </Alert>
      </Stack>
    </Card>
  );
}
