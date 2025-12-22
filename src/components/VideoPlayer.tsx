import React, { useState, useRef, useEffect } from 'react';
import { 
  Card, 
  Text, 
  Group, 
  Button, 
  Stack, 
  Badge, 
  Box,
  Progress,
  ActionIcon,
  Tooltip,
  Modal,
  Alert
} from '@mantine/core';
import { 
  IconPlayerPlay, 
  IconPlayerPause, 
  IconVolume, 
  IconVolumeOff,
  IconMaximize,
  IconSettings,
  IconDownload,
  IconShare,
  IconInfoCircle
} from '@tabler/icons-react';
import { VastTamsSegment } from '../services/vastTamsApi';
import { getSegmentPlaybackUrl, hasValidVideoUrls, validateVastTamsSegment } from '../utils/vastTamsUtils';

interface VideoPlayerProps {
  videoUrl?: string;
  title: string;
  description?: string | undefined;
  metadata?: {
    format: string;
    quality: string;
    duration: number;
    tags: Record<string, string>;
  } | undefined;
  onClose?: () => void;
  showControls?: boolean;
  // VAST TAMS support
  vastTamsSegment?: VastTamsSegment;
}

export default function VideoPlayer({ 
  videoUrl, 
  title, 
  description, 
  metadata, 
  onClose,
  showControls = true,
  vastTamsSegment
}: VideoPlayerProps) {
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

  // Determine the video URL to use
  const getVideoUrl = (): string | null => {
    // Priority: VAST TAMS segment > legacy videoUrl
    if (vastTamsSegment) {
      if (!validateVastTamsSegment(vastTamsSegment)) {
        setError('Invalid TAMS segment data');
        return null;
      }
      
      if (!hasValidVideoUrls(vastTamsSegment)) {
        setError('No valid video URLs found in TAMS segment');
        return null;
      }
      
      return getSegmentPlaybackUrl(vastTamsSegment);
    }
    
    return videoUrl || null;
  };

  const effectiveVideoUrl = getVideoUrl();

  // Handle video load
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !effectiveVideoUrl) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      setError(null);
    };

    const handleError = () => {
      setError('Failed to load video');
      setIsLoading(false);
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

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  // Handle play/pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
  };

  // Handle mute toggle
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle download
  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `${title}.mp4`;
      link.click();
    }
  };

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        if (videoUrl) {
          await navigator.share({
            title,
            text: description || '',
            url: videoUrl
          });
        }
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      if (videoUrl) {
        navigator.clipboard.writeText(videoUrl);
      }
    }
  };

  if (error) {
    return (
      <Card withBorder p="lg" radius="md">
        <Alert title="Video Error" color="red" icon={<IconInfoCircle size={16} />}>
          <Text>{error}</Text>
          <Text size="sm" mt="xs">URL: {videoUrl}</Text>
          <Button variant="light" size="sm" mt="md" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Alert>
      </Card>
    );
  }

  return (
    <Card withBorder p="lg" radius="lg" shadow="sm">
      <Stack gap="md">
        {/* Video Header */}
        <Group justify="space-between" align="flex-start">
          <Box style={{ flex: 1 }}>
            <Group gap="xs" mb="xs">
              <Text fw={500} size="lg">{title}</Text>
              {vastTamsSegment && (
                <Badge size="sm" color="blue" variant="light">
                  TAMS
                </Badge>
              )}
            </Group>
            {description && (
              <Text size="sm" c="dimmed" lineClamp={2}>{description}</Text>
            )}
          </Box>
          <Group gap="xs">
            <Tooltip label="Metadata">
              <ActionIcon
                variant="light"
                onClick={() => setShowMetadata(!showMetadata)}
              >
                <IconInfoCircle size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Download">
              <ActionIcon
                variant="light"
                onClick={handleDownload}
              >
                <IconDownload size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Share">
              <ActionIcon
                variant="light"
                onClick={handleShare}
              >
                <IconShare size={16} />
              </ActionIcon>
            </Tooltip>
            {onClose && (
              <Button variant="light" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </Group>
        </Group>

        {/* Video Player */}
        <Box style={{ position: 'relative' }}>
          <video
            ref={videoRef}
            src={effectiveVideoUrl || undefined}
            style={{ 
              width: '100%', 
              maxHeight: '400px',
              borderRadius: '8px',
              backgroundColor: '#000'
            }}
            controls={!showControls}
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
              <Text color="white">Loading video...</Text>
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
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                style={{ width: '100%' }}
              />
              <Group justify="space-between" mt="xs">
                <Text size="sm">{formatTime(currentTime)}</Text>
                <Text size="sm">{formatTime(duration)}</Text>
              </Group>
            </Box>

            {/* Control Buttons */}
            <Group justify="space-between">
              <Group gap="xs">
                <Button
                  variant="light"
                  size="sm"
                  onClick={togglePlay}
                  leftSection={isPlaying ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                
                <Tooltip label={isMuted ? 'Unmute' : 'Mute'}>
                  <ActionIcon
                    variant="light"
                    onClick={toggleMute}
                  >
                    {isMuted ? <IconVolumeOff size={16} /> : <IconVolume size={16} />}
                  </ActionIcon>
                </Tooltip>

                <Box style={{ width: '100px' }}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={volume}
                    onChange={handleVolumeChange}
                    style={{ width: '100%' }}
                  />
                </Box>
              </Group>

              <Group gap="xs">
                <Tooltip label="Fullscreen">
                  <ActionIcon
                    variant="light"
                    onClick={toggleFullscreen}
                  >
                    <IconMaximize size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </Stack>
        )}

        {/* Metadata Display */}
        {showMetadata && metadata && (
          <Card withBorder p="md" radius="md">
            <Stack gap="sm">
              <Text fw={500} size="sm">Video Metadata</Text>
              <Group gap="xs" wrap="wrap">
                <Badge variant="light" color="blue">{metadata.format}</Badge>
                <Badge variant="light" color="green">{metadata.quality}</Badge>
                <Badge variant="light" color="orange">{formatTime(metadata.duration)}</Badge>
              </Group>
              {Object.entries(metadata.tags).length > 0 && (
                <Box>
                  <Text size="sm" fw={500} mb="xs">Tags:</Text>
                  <Group gap="xs" wrap="wrap">
                    {Object.entries(metadata.tags).map(([key, value]) => (
                      <Badge key={key} variant="light" color="gray" size="xs">
                        {key}: {String(value)}
                      </Badge>
                    ))}
                  </Group>
                </Box>
              )}
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  );
}
