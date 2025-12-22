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
  Progress,
  Code,
  Collapse,
  SimpleGrid
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconMaximize,
  IconDeviceMobile,
  IconQrcode,
  IconClock,
  IconInfoCircle,
  IconChartBar
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

// CMCD (Common Media Client Data) interface for BBC TAMS compliance
interface CMCDData {
  // CMCD-Object fields
  ot: 'v' | 'a' | 'm' | 'c'; // Object type (video, audio, manifest, caption)
  d: number; // Object duration in seconds
  br: number; // Bitrate in kbps
  w: number; // Width in pixels (video)
  h: number; // Height in pixels (video)
  f: number; // Frame rate (video)
  sr: number; // Sample rate (audio)
  ch: number; // Channels (audio)
  
  // CMCD-Request fields
  su: boolean; // Start up
  nor: string; // Next object request
  nrr: string; // Next range request
  bu: string; // Buffer underrun
  
  // CMCD-Status fields
  bs: boolean; // Buffer starvation
  rtp: number; // Requested throughput
  dl: number; // Deadline
  mtp: number; // Measured throughput
  
  // CMCD-Device fields
  dt: 's' | 't' | 'c' | 'h'; // Device type (smartphone, tablet, console, handheld)
  tb: number; // Top bitrate
  bl: number; // Buffer length
  bs_device: boolean; // Buffer starvation (device)
  cid: string; // Content ID
  pr: number; // Playback rate
  sf: string; // Stream format
  sid: string; // Session ID
  st: 'v' | 'l' | 'f'; // Stream type (vod, live, offline)
  v: number; // Version
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
  const [showCMCD, setShowCMCD] = useState(false);
  const [cmcdData, setCmcdData] = useState<CMCDData | null>(null);

  // Initialize CMCD data
  useEffect(() => {
    if (!videoRef.current) {
      return;
    }
    
    const video = videoRef.current;
    
    // Set up CMCD data collection
    const updateCMCDData = () => {
      const newCmcdData: CMCDData = {
        ot: 'v', // Object type: video
        d: duration,
        br: 0, // Will be updated when metadata is available
        w: 0, // Will be updated when metadata is available
        h: 0, // Will be updated when metadata is available
        f: 0, // Will be updated when metadata is available
        sr: 0, // Not applicable for video
        ch: 0, // Not applicable for video
        su: true, // Start up
        nor: '',
        nrr: '',
        bu: '',
        bs: false,
        rtp: 0,
        dl: 0,
        mtp: 0,
        dt: /mobile|android|iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) ? 's' : 'c',
        tb: 0,
        bl: 0,
        bs_device: false,
        cid: videoId,
        pr: 1,
        sf: 'dash', // Assuming DASH for BBC TAMS
        sid: analyticsService.getSessionId(),
        st: 'v', // VOD
        v: 1
      };
      
      setCmcdData(newCmcdData);
    };

    // Update CMCD data when metadata is loaded
    const handleLoadedMetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        setCmcdData(prev => prev ? {
          ...prev,
          w: video.videoWidth,
          h: video.videoHeight,
          f: 30, // Default frame rate, could be extracted from metadata
          br: Math.round((video.duration * 8 * 1024) / 1000) // Rough bitrate calculation
        } : null);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    updateCMCDData();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoId, duration]);

  // Enhanced analytics tracking with CMCD
  const trackVideoEvent = (event: string, data: any = {}) => {
    if (!analyticsEnabled) return;

    try {
      // Include CMCD data in analytics
      const eventData = {
        ...data,
        cmcd: cmcdData,
        timestamp: new Date().toISOString(),
        videoId,
        compilationId
      };

      switch (event) {
        case 'play':
          analyticsService.trackVideoPlay(videoId, compilationId);
          // Send CMCD play event
          if (cmcdData) {
            analyticsService.trackCMCDEvent('play', {
              ...cmcdData,
              su: true,
              pr: 1
            });
          }
          break;
        case 'pause':
          analyticsService.trackVideoPause(videoId, currentTime, compilationId);
          // Send CMCD pause event
          if (cmcdData) {
            analyticsService.trackCMCDEvent('pause', {
              ...cmcdData,
              pr: 0
            });
          }
          break;
        case 'time_update':
          // Only track every 5 seconds to avoid spam
          if (currentTime - lastAnalyticsTime >= 5) {
            analyticsService.trackVideoTimeUpdate(videoId, currentTime, compilationId);
            // Send CMCD progress event
            if (cmcdData) {
              analyticsService.trackCMCDEvent('progress', {
                ...cmcdData,
                dl: Math.round((duration - currentTime) * 1000), // Deadline in ms
                bl: Math.round((videoRef.current?.buffered.length ? videoRef.current.buffered.end(0) - currentTime : 0) * 1000)
              });
            }
            setLastAnalyticsTime(currentTime);
          }
          break;
        case 'seek':
          analyticsService.trackVideoSeek(videoId, currentTime, compilationId);
          // Send CMCD seek event
          if (cmcdData) {
            analyticsService.trackCMCDEvent('seek', {
              ...cmcdData,
              su: false,
              nrr: `${currentTime}-${Math.min(currentTime + 10, duration)}`
            });
          }
          break;
        case 'quality_change':
          analyticsService.trackVideoQualityChange(videoId, data.quality, compilationId);
          // Send CMCD quality change event
          if (cmcdData) {
            analyticsService.trackCMCDEvent('quality_change', {
              ...cmcdData,
              tb: data.bitrate || 0
            });
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

  const handleSeeked = () => {
    if (videoRef.current) {
      trackVideoEvent('seek', { seekTime: videoRef.current.currentTime });
    }
  };

  const handleLoadedData = () => {
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

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // CMCD data display
  const renderCMCDData = () => {
    if (!cmcdData) return null;

    return (
      <Collapse in={showCMCD}>
        <Card mt="md" withBorder>
          <Group justify="space-between" mb="sm">
            <Title order={6}>CMCD Data (Common Media Client Data)</Title>
            <Badge color="blue">TAMS Compliant</Badge>
          </Group>
          <SimpleGrid cols={2} spacing="xs">
            <Box>
              <Text size="xs" c="dimmed">Object Type</Text>
              <Code style={{ fontSize: '0.75rem' }}>{cmcdData.ot}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Duration</Text>
              <Code style={{ fontSize: '0.75rem' }}>{cmcdData.d}s</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Resolution</Text>
              <Code style={{ fontSize: '0.75rem' }}>{cmcdData.w}x{cmcdData.h}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Frame Rate</Text>
              <Code style={{ fontSize: '0.75rem' }}>{cmcdData.f}fps</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Device Type</Text>
              <Code style={{ fontSize: '0.75rem' }}>{cmcdData.dt}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Session ID</Text>
              <Code style={{ fontSize: '0.75rem' }}>{cmcdData.sid}</Code>
            </Box>
          </SimpleGrid>
        </Card>
      </Collapse>
    );
  };

  return (
    <Card shadow="sm" p="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Box>
            <Title order={4}>{title}</Title>
            {description && (
              <Text c="dimmed" size="sm">{description}</Text>
            )}
          </Box>
          <Group>
            <Button
              variant="light"
              size="xs"
              leftSection={<IconChartBar size={16} />}
              onClick={() => setShowCMCD(!showCMCD)}
            >
              {showCMCD ? 'Hide' : 'Show'} CMCD
            </Button>
            <Button
              variant="light"
              size="xs"
              leftSection={<IconInfoCircle size={16} />}
              onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
            >
              {analyticsEnabled ? 'Disable' : 'Enable'} Analytics
            </Button>
          </Group>
        </Group>

        {/* Video Player */}
        <Box pos="relative">
          <video
            ref={videoRef}
            src={src}
            style={{ width: '100%', maxHeight: '400px' }}
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onSeeked={handleSeeked}
            onLoadedData={handleLoadedData}
            onVolumeChange={handleVolumeChange}

            controls
          />
        </Box>

        {/* Video Controls */}
        <Group justify="space-between">
          <Group>
            <Button
              variant={isPlaying ? 'filled' : 'outline'}
              size="sm"
              leftSection={isPlaying ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
              onClick={isPlaying ? handlePause : handlePlay}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Text size="sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </Group>
          
          <Group>
            <Button
              variant="light"
              size="sm"
              leftSection={<IconMaximize size={16} />}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
            {onQRScan && (
              <Button
                variant="light"
                size="sm"
                leftSection={<IconQrcode size={16} />}
                onClick={onQRScan}
              >
                QR Code
              </Button>
            )}
          </Group>
        </Group>

        {/* Progress Bar */}
        <Progress
          value={(currentTime / duration) * 100}
          size="sm"
          color="blue"
        />

        {/* CMCD Data Display */}
        {renderCMCDData()}

        {/* Analytics Status */}
        {showAnalytics && (
          <Alert
            icon={<IconInfoCircle size={16} />}
            title="Analytics & CMCD"
            color={analyticsEnabled ? 'green' : 'gray'}
          >
            <Text size="sm">
              {analyticsEnabled 
                ? 'CMCD data collection is active. Video playback events are being tracked for TAMS compliance and analytics.'
                : 'Analytics and CMCD data collection is disabled.'
              }
            </Text>
          </Alert>
        )}
      </Stack>
    </Card>
  );
}
