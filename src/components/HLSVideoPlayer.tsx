import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Stack,
  Text,
  Button,
  Group,
  ActionIcon,
  Progress,
  Alert,
  Badge,
  Card,
  Grid,
  Divider,
  Loader
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconVolumeOff,
  IconMaximize,
  IconSettings,
  IconDownload,
  IconAlertCircle,
  IconRefresh,
  IconBroadcast
} from '@tabler/icons-react';
import Hls from 'hls.js';

interface HLSVideoPlayerProps {
  hlsUrl: string;
  title?: string;
  description?: string;
  onClose?: () => void;
  showControls?: boolean;
  autoPlay?: boolean;
  onError?: (error: string) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
}

export default function HLSVideoPlayer({
  hlsUrl,
  title = 'HLS Video Player',
  description,
  onClose,
  showControls = true,
  autoPlay = false,
  onError,
  onLoadStart,
  onLoadEnd
}: HLSVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hlsSupported, setHlsSupported] = useState(false);
  const [qualityLevels, setQualityLevels] = useState<any[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number | null>(null);

  // Check HLS support
  useEffect(() => {
    if (Hls.isSupported()) {
      setHlsSupported(true);
    } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      setHlsSupported(true);
    } else {
      setError('HLS is not supported in this browser');
      onError?.('HLS is not supported in this browser');
    }
  }, [onError]);

  // Initialize HLS
  useEffect(() => {
    if (!hlsUrl || !hlsSupported || !videoRef.current) return;

    const video = videoRef.current;
    let hls: Hls | null = null;

    const initializeHLS = () => {
      setIsLoading(true);
      setError(null);
      onLoadStart?.();

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });

        hls.loadSource(hlsUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest parsed successfully');
          setIsLoading(false);
          onLoadEnd?.();
          
          // Get quality levels
          if (hls?.levels) {
            setQualityLevels(hls.levels);
            setCurrentQuality(hls.currentLevel);
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError('Network error occurred while loading the video');
                onError?.('Network error occurred while loading the video');
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError('Media error occurred while playing the video');
                onError?.('Media error occurred while playing the video');
                break;
              default:
                setError('Fatal error occurred while loading the video');
                onError?.('Fatal error occurred while loading the video');
                break;
            }
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          setCurrentQuality(data.level);
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = hlsUrl;
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
          onLoadEnd?.();
        });
      }
    };

    initializeHLS();

    return () => {
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl, hlsSupported, onLoadStart, onLoadEnd, onError]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const handleError = () => {
      setError('Video playback error');
      onError?.('Video playback error');
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('error', handleError);
    };
  }, [onError]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (newTime: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleQualityChange = (level: number) => {
    if (hlsRef.current && hlsRef.current.levels[level]) {
      hlsRef.current.currentLevel = level;
      setCurrentQuality(level);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const retry = () => {
    setError(null);
    setIsLoading(true);
    // Re-initialize HLS
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }
    // The useEffect will re-initialize
  };

  if (error) {
    return (
      <Card withBorder p="xl">
        <Stack gap="md" align="center">
          <IconAlertCircle size={48} color="red" />
          <Text size="lg" fw={600} ta="center">Video Playback Error</Text>
          <Text size="sm" c="dimmed" ta="center">{error}</Text>
          <Group gap="sm">
            <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={retry}>
              Retry
            </Button>
            {onClose && (
              <Button variant="light" onClick={onClose}>
                Close
              </Button>
            )}
          </Group>
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
            <Text fw={600} size="lg">{title}</Text>
            {description && (
              <Text size="sm" c="dimmed">{description}</Text>
            )}
          </Box>
          <Group gap="xs">
            <Badge color="red" variant="light" leftSection={<IconBroadcast size={12} />}>
              HLS
            </Badge>
            {onClose && (
              <ActionIcon variant="light" onClick={onClose}>
                ×
              </ActionIcon>
            )}
          </Group>
        </Group>

        {/* Video Container */}
        <Box
          style={{
            position: 'relative',
            width: '100%',
            height: '400px',
            backgroundColor: '#000',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          {isLoading && (
            <Box
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10
              }}
            >
              <Stack gap="md" align="center">
                <Loader size="lg" />
                <Text size="sm" c="white">Loading HLS stream...</Text>
              </Stack>
            </Box>
          )}

          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            autoPlay={autoPlay}
            muted={isMuted}
            playsInline
          />

          {/* Custom Controls Overlay */}
          {showControls && (
            <Box
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                padding: '16px',
                zIndex: 5
              }}
            >
              <Stack gap="sm">
                {/* Progress Bar */}
                <Box>
                  <Progress
                    value={(currentTime / duration) * 100}
                    size="sm"
                    color="red"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const newTime = (clickX / rect.width) * duration;
                      handleSeek(newTime);
                    }}
                  />
                  <Group justify="space-between" mt="xs">
                    <Text size="xs" c="white">{formatTime(currentTime)}</Text>
                    <Text size="xs" c="white">{formatTime(duration)}</Text>
                  </Group>
                </Box>

                {/* Control Buttons */}
                <Group justify="space-between">
                  <Group gap="xs">
                    <ActionIcon
                      variant="light"
                      color="white"
                      onClick={togglePlay}
                      size="lg"
                    >
                      {isPlaying ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
                    </ActionIcon>
                    
                    <ActionIcon
                      variant="light"
                      color="white"
                      onClick={toggleMute}
                    >
                      {isMuted ? <IconVolumeOff size={16} /> : <IconVolume size={16} />}
                    </ActionIcon>

                    <Text size="sm" c="white" style={{ minWidth: '40px' }}>
                      {Math.round(volume * 100)}%
                    </Text>
                  </Group>

                  <Group gap="xs">
                    {qualityLevels.length > 1 && (
                      <ActionIcon
                        variant="light"
                        color="white"
                        title="Quality Settings"
                      >
                        <IconSettings size={16} />
                      </ActionIcon>
                    )}
                    
                    <ActionIcon
                      variant="light"
                      color="white"
                      title="Download"
                    >
                      <IconDownload size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Stack>
            </Box>
          )}
        </Box>

        {/* Quality Levels */}
        {qualityLevels.length > 1 && (
          <Box>
            <Text size="sm" fw={500} mb="xs">Quality Levels</Text>
            <Group gap="xs">
              {qualityLevels.map((level, index) => (
                <Button
                  key={index}
                  variant={currentQuality === index ? "filled" : "light"}
                  size="xs"
                  onClick={() => handleQualityChange(index)}
                >
                  {level.height}p
                </Button>
              ))}
            </Group>
          </Box>
        )}

        {/* Stream Info */}
        <Divider />
        <Grid>
          <Grid.Col span={6}>
            <Text size="sm" fw={500}>Stream URL</Text>
            <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {hlsUrl}
            </Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm" fw={500}>Status</Text>
            <Group gap="xs">
              <Badge color={isPlaying ? "green" : "gray"} variant="light">
                {isPlaying ? "Playing" : "Paused"}
              </Badge>
              <Badge color={hlsSupported ? "green" : "red"} variant="light">
                {hlsSupported ? "HLS Supported" : "HLS Not Supported"}
              </Badge>
            </Group>
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  );
}
