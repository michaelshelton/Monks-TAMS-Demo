import { useRef, useEffect, useState } from 'react';
import {
  Box,
  Card,
  Title,
  Text,
  Group,
  Badge,
  Stack,
  Button,
  Alert,
  Progress
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconMaximize,
  IconDeviceMobile,
  IconQrcode,
  IconClock
} from '@tabler/icons-react';
import { analyticsService } from '../services/analytics';

interface VideoPlayerWithAnalyticsProps {
  src: string;
  videoId: string;
  compilationId?: string;
  title?: string;
  description?: string;
  videoDuration?: string;
  showAnalytics?: boolean;
  onQRScan?: () => void;
}

export default function VideoPlayerWithAnalytics({
  src,
  videoId,
  compilationId,
  title = 'Video Player',
  description,
  videoDuration,
  showAnalytics = true,
  onQRScan
}: VideoPlayerWithAnalyticsProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [lastAnalyticsTime, setLastAnalyticsTime] = useState(0);

  // Analytics tracking
  const trackVideoEvent = (event: string, data: any = {}) => {
    if (!analyticsEnabled) return;

    try {
      switch (event) {
        case 'play':
          analyticsService.trackVideoPlay(videoId, compilationId);
          break;
        case 'pause':
          analyticsService.trackVideoPause(videoId, currentTime, compilationId);
          break;
        case 'time_update':
          // Only track every 5 seconds to avoid spam
          if (currentTime - lastAnalyticsTime >= 5) {
            analyticsService.trackVideoTimeUpdate(videoId, currentTime, compilationId);
            setLastAnalyticsTime(currentTime);
          }
          break;
        case 'qr_scan':
          analyticsService.trackQRScan(compilationId || videoId);
          break;
      }
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  };

  // Video event handlers
  const handlePlay = () => {
    setIsPlaying(true);
    trackVideoEvent('play');
  };

  const handlePause = () => {
    setIsPlaying(false);
    trackVideoEvent('pause');
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      trackVideoEvent('time_update');
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVolumeChange = () => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume);
    }
  };

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  // Custom controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleQRScanClick = () => {
    trackVideoEvent('qr_scan');
    onQRScan?.();
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Add event listeners
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('volumechange', handleVolumeChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('volumechange', handleVolumeChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [currentTime, lastAnalyticsTime]);

  return (
    <Card withBorder p="md">
      <Stack gap="md">
        {/* Video Header */}
        <Group justify="space-between">
          <Box>
            <Title order={4}>{title}</Title>
            {description && (
              <Text size="sm" c="dimmed">
                {description}
              </Text>
            )}
            {/* Enhanced Duration Display */}
            {videoDuration && (
              <Group gap="xs" mt="xs">
                <IconClock size={16} color="#228be6" />
                <Text size="sm" fw={500} c="blue">
                  Duration: {videoDuration}
                </Text>
              </Group>
            )}
          </Box>
          <Group>
            <Badge color="blue" variant="light" size="lg">
              {formatTime(currentTime)} / {videoDuration || formatTime(duration)}
            </Badge>
            {analyticsEnabled && (
              <Badge color="green" variant="light">
                Analytics Active
              </Badge>
            )}
          </Group>
        </Group>

        {/* Video Player */}
        <Box
          style={{
            width: '100%',
            height: '400px',
            backgroundColor: '#000',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <video
            ref={videoRef}
            src={src}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            controls={false} // We'll use custom controls
            preload="metadata"
          />

          {/* Custom Controls Overlay */}
          <Box
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              padding: '20px',
              color: 'white'
            }}
          >
            {/* Progress Bar */}
            <Progress
              value={progressPercentage}
              color="blue"
              size="sm"
              style={{ marginBottom: '10px' }}
            />

            {/* Control Buttons */}
            <Group justify="space-between">
              <Group>
                <Button
                  size="sm"
                  variant="light"
                  color="white"
                  onClick={togglePlay}
                  leftSection={isPlaying ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>

                <Button
                  size="sm"
                  variant="light"
                  color="white"
                  leftSection={<IconVolume size={16} />}
                >
                  {Math.round(volume * 100)}%
                </Button>
              </Group>

              <Group>
                {onQRScan && (
                  <Button
                    size="sm"
                    variant="light"
                    color="white"
                    onClick={handleQRScanClick}
                    leftSection={<IconQrcode size={16} />}
                  >
                    QR Code
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="light"
                  color="white"
                  onClick={toggleFullscreen}
                  leftSection={<IconMaximize size={16} />}
                >
                  {isFullscreen ? 'Exit' : 'Fullscreen'}
                </Button>
              </Group>
            </Group>
          </Box>
        </Box>

        {/* Analytics Info */}
        {showAnalytics && (
          <Alert icon={<IconDeviceMobile size={16} />} color="blue" variant="light">
            <Text size="sm">
              <strong>Analytics Tracking:</strong> This video player automatically tracks viewing behavior, 
              device type, and interaction patterns. Data is collected anonymously and used to improve 
              the video experience.
            </Text>
            <Group mt="xs">
              <Button
                size="xs"
                variant="light"
                onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
              >
                {analyticsEnabled ? 'Disable' : 'Enable'} Analytics
              </Button>
              <Text size="xs" c="dimmed">
                Session ID: {sessionStorage.getItem('tams_session_id')?.slice(0, 8)}...
              </Text>
            </Group>
          </Alert>
        )}

        {/* Video Info */}
        <Group justify="space-between">
          <Group>
            <Text size="sm" c="dimmed">
              Video ID: {videoId}
            </Text>
            {videoDuration && (
              <Text size="sm" c="dimmed">
                Duration: {videoDuration}
              </Text>
            )}
          </Group>
          {compilationId && (
            <Text size="sm" c="dimmed">
              Compilation: {compilationId}
            </Text>
          )}
        </Group>
      </Stack>
    </Card>
  );
}
