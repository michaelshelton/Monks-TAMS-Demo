/**
 * VAST TAMS Video Player Component
 * 
 * Specialized video player for VAST TAMS segments with support for:
 * - Dual URL structure (GET/HEAD presigned URLs)
 * - BBC TAMS v6.0 compliance
 * - S3 presigned URL handling
 * - Enhanced error handling for cloud storage
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  Group,
  Badge,
  Box,
  Button,
  Alert,
  Code,
  Collapse,
  Progress,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconVolumeOff,
  IconMaximize,
  IconMinimize,
  IconSettings,
  IconInfoCircle,
  IconDownload,
  IconRefresh,
  IconAlertCircle,
  IconCheck
} from '@tabler/icons-react';
import { VastTamsSegment } from '../services/vastTamsApi';
import { 
  getSegmentPlaybackUrl, 
  getSegmentMetadataUrl, 
  getAllSegmentUrls,
  getSegmentDisplayInfo,
  hasValidVideoUrls,
  validateVastTamsSegment
} from '../utils/vastTamsUtils';

interface VastTamsVideoPlayerProps {
  segment: VastTamsSegment;
  title?: string;
  description?: string;
  onClose?: () => void;
  showControls?: boolean;
  autoPlay?: boolean;
  onError?: (error: string) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onMetadataLoaded?: (metadata: any) => void;
}

export default function VastTamsVideoPlayer({
  segment,
  title,
  description,
  onClose,
  showControls = true,
  autoPlay = false,
  onError,
  onLoadStart,
  onLoadEnd,
  onMetadataLoaded
}: VastTamsVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);

  // Validate segment data
  useEffect(() => {
    if (!validateVastTamsSegment(segment)) {
      const errorMsg = 'Invalid VAST TAMS segment data';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (!hasValidVideoUrls(segment)) {
      const errorMsg = 'No valid video URLs found in segment';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }
  }, [segment, onError]);

  // Get segment URLs
  const segmentUrls = getAllSegmentUrls(segment);
  const playbackUrl = segmentUrls.playbackUrl;
  const metadataUrl = segmentUrls.metadataUrl;
  const displayInfo = getSegmentDisplayInfo(segment);

  // Handle video load
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackUrl) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      setError(null);
      onLoadEnd?.();
    };

    const handleError = () => {
      const errorMsg = 'Failed to load video from VAST TAMS';
      setError(errorMsg);
      setIsLoading(false);
      onError?.(errorMsg);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handleWaiting = () => setBuffering(true);
    const handleCanPlay = () => setBuffering(false);

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // Set video source
    video.src = playbackUrl;
    if (autoPlay) {
      video.play().catch(console.error);
    }

    onLoadStart?.();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [playbackUrl, autoPlay, onLoadStart, onLoadEnd, onError]);

  // Load metadata
  const loadMetadata = async () => {
    if (!metadataUrl || metadataLoading) return;

    setMetadataLoading(true);
    try {
      const response = await fetch(metadataUrl, { method: 'HEAD' });
      if (response.ok) {
        const metadata = {
          contentLength: response.headers.get('content-length'),
          contentType: response.headers.get('content-type'),
          lastModified: response.headers.get('last-modified'),
          etag: response.headers.get('etag'),
          server: response.headers.get('server')
        };
        setMetadata(metadata);
        onMetadataLoaded?.(metadata);
      }
    } catch (error) {
      console.warn('Failed to load metadata:', error);
    } finally {
      setMetadataLoading(false);
    }
  };

  // Video controls
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(console.error);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = newVolume;
    setVolume(newVolume);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = time;
    setCurrentTime(time);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <Card withBorder p="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={4}>VAST TAMS Video Player</Title>
            {onClose && (
              <Button variant="subtle" onClick={onClose}>
                Close
              </Button>
            )}
          </Group>
          
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            <Text size="sm">{error}</Text>
          </Alert>

          <Box>
            <Text size="sm" fw={500} mb="xs">Segment Information:</Text>
            <Code block>
              {JSON.stringify({
                id: segment.id,
                timerange: segment.timerange,
                format: segment.format,
                codec: segment.codec,
                availableUrls: segmentUrls.allUrls.length
              }, null, 2)}
            </Code>
          </Box>
        </Stack>
      </Card>
    );
  }

  return (
    <Card withBorder p="md">
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Box>
            <Title order={4}>
              {title || `VAST TAMS Segment ${segment.id}`}
            </Title>
            {description && (
              <Text size="sm" c="dimmed">{description}</Text>
            )}
          </Box>
          <Group gap="xs">
            <Tooltip label="Load Metadata">
              <ActionIcon
                variant="subtle"
                onClick={loadMetadata}
                loading={metadataLoading}
              >
                <IconInfoCircle size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Segment Info">
              <ActionIcon
                variant="subtle"
                onClick={() => setShowMetadata(!showMetadata)}
              >
                <IconSettings size={16} />
              </ActionIcon>
            </Tooltip>
            {onClose && (
              <Button variant="subtle" onClick={onClose}>
                Close
              </Button>
            )}
          </Group>
        </Group>

        {/* Segment Information */}
        <Collapse in={showMetadata}>
          <Box>
            <Text size="sm" fw={500} mb="xs">Segment Details:</Text>
            <Group gap="md" mb="sm">
              <Badge variant="light" color="blue">
                {displayInfo.format}
              </Badge>
              <Badge variant="light" color="green">
                {displayInfo.codec}
              </Badge>
              <Badge variant="light" color="orange">
                {displayInfo.duration}
              </Badge>
              <Badge variant="light" color="purple">
                {displayInfo.size}
              </Badge>
            </Group>
            
            {metadata && (
              <Box mb="sm">
                <Text size="sm" fw={500} mb="xs">Metadata:</Text>
                <Code block>
                  {JSON.stringify(metadata, null, 2)}
                </Code>
              </Box>
            )}

            <Box>
              <Text size="sm" fw={500} mb="xs">Available URLs:</Text>
              <Stack gap="xs">
                {segmentUrls.allUrls.map((url, index) => (
                  <Group key={index} gap="xs">
                    <Badge size="sm" color={url.type === 'GET' ? 'green' : 'blue'}>
                      {url.type}
                    </Badge>
                    <Text size="xs" style={{ fontFamily: 'monospace' }}>
                      {url.url}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Box>
          </Box>
        </Collapse>

        {/* Video Player */}
        <Box style={{ position: 'relative' }}>
          <video
            ref={videoRef}
            style={{ 
              width: '100%', 
              maxHeight: '400px',
              borderRadius: '8px',
              backgroundColor: '#000'
            }}
            preload="metadata"
          />
          
          {/* Loading Overlay */}
          {isLoading && (
            <Box
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.7)',
                borderRadius: '8px'
              }}
            >
              <Stack align="center" gap="sm">
                <Progress size="sm" style={{ width: '200px' }} value={0} />
                <Text color="white" size="sm">Loading VAST TAMS video...</Text>
              </Stack>
            </Box>
          )}

          {/* Buffering Overlay */}
          {buffering && !isLoading && (
            <Box
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: '8px'
              }}
            >
              <Text color="white">Buffering...</Text>
            </Box>
          )}
        </Box>

        {/* Custom Controls */}
        {showControls && (
          <Stack gap="sm">
            {/* Progress Bar */}
            <Box>
              <Progress
                value={(currentTime / duration) * 100}
                size="sm"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const percentage = clickX / rect.width;
                  handleSeek(percentage * duration);
                }}
                style={{ cursor: 'pointer' }}
              />
              <Group justify="space-between" mt="xs">
                <Text size="xs" c="dimmed">
                  {formatTime(currentTime)}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatTime(duration)}
                </Text>
              </Group>
            </Box>

            {/* Control Buttons */}
            <Group justify="center" gap="md">
              <ActionIcon
                variant="filled"
                size="lg"
                onClick={togglePlay}
                disabled={isLoading}
              >
                {isPlaying ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
              </ActionIcon>

              <Group gap="xs">
                <ActionIcon
                  variant="subtle"
                  onClick={toggleMute}
                >
                  {isMuted ? <IconVolumeOff size={16} /> : <IconVolume size={16} />}
                </ActionIcon>
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  style={{ width: '80px' }}
                />
              </Group>

              <ActionIcon
                variant="subtle"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
              </ActionIcon>
            </Group>
          </Stack>
        )}

        {/* Status Information */}
        <Group justify="space-between">
          <Group gap="xs">
            {displayInfo.hasVideo && (
              <Badge size="sm" color="green" leftSection={<IconCheck size={12} />}>
                Video Available
              </Badge>
            )}
            {displayInfo.hasMetadata && (
              <Badge size="sm" color="blue" leftSection={<IconInfoCircle size={12} />}>
                Metadata Available
              </Badge>
            )}
          </Group>
          
          <Text size="xs" c="dimmed">
            VAST TAMS v6.0 • {segment.id}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}
