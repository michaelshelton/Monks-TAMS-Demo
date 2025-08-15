import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Badge,
  Group,
  Box,
  Button,
  Progress,
  Alert,
  Modal,
  ActionIcon,
  Tooltip,
  SimpleGrid,
  Paper,
  Slider,
  Switch,
  Code
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconVolumeOff,
  IconMaximize,
  IconMinimize,
  IconRotate,
  IconDeviceMobile,
  IconBattery,
  IconWifi,
  IconSettings,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconAlertCircle,
  IconDownload,
  IconShare,
  IconChartBar,
  IconInfoCircle
} from '@tabler/icons-react';

import { analyticsService } from '../services/analytics';

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
  cid: string; // Content ID
  pr: number; // Playback rate
  sf: string; // Stream format
  sid: string; // Session ID
  st: 'v' | 'l' | 'f'; // Stream type (vod, live, offline)
  v: number; // Version
}

// Types for mobile video player
interface VideoSource {
  url: string;
  quality: 'low' | 'medium' | 'high';
  format: 'mp4' | 'webm' | 'hls';
  bitrate: number;
}

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  quality: 'low' | 'medium' | 'high';
  isFullscreen: boolean;
  buffering: boolean;
  error: string | null;
}

interface MobileAnalytics {
  sessionId: string;
  videoId: string;
  deviceInfo: {
    userAgent: string;
    screenSize: string;
    networkType: string;
    batteryLevel: number;
  };
  playbackEvents: Array<{
    type: 'play' | 'pause' | 'seek' | 'quality_change' | 'fullscreen' | 'error';
    timestamp: string;
    data?: any;
  }>;
  performanceMetrics: {
    bufferingTime: number;
    errorCount: number;
    qualityChanges: number;
    completionRate: number;
  };
}

interface MobileVideoPlayerProps {
  videoUrl: string;
  videoId: string;
  title?: string;
  onAnalyticsUpdate?: (analytics: MobileAnalytics) => void;
}

export default function MobileVideoPlayer({ 
  videoUrl, 
  videoId, 
  title = 'Mobile Video Player',
  onAnalyticsUpdate 
}: MobileVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    quality: 'high',
    isFullscreen: false,
    buffering: false,
    error: null
  });
  const [showCMCD, setShowCMCD] = useState(false);
  const [cmcdData, setCmcdData] = useState<CMCDData | null>(null);
  const [lastAnalyticsTime, setLastAnalyticsTime] = useState(0);

  const [analytics, setAnalytics] = useState<MobileAnalytics>({
    sessionId: `mobile_sess_${Date.now()}`,
    videoId,
    deviceInfo: {
      userAgent: navigator.userAgent,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      networkType: 'unknown',
      batteryLevel: 0
    },
    playbackEvents: [],
    performanceMetrics: {
      bufferingTime: 0,
      errorCount: 0,
      qualityChanges: 0,
      completionRate: 0
    }
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Mock video sources
  const videoSources: VideoSource[] = [
    {
      url: videoUrl,
      quality: 'high',
      format: 'mp4',
      bitrate: 5000000
    },
    {
      url: videoUrl.replace('.mp4', '_medium.mp4'),
      quality: 'medium',
      format: 'mp4',
      bitrate: 2500000
    },
    {
      url: videoUrl.replace('.mp4', '_low.mp4'),
      quality: 'low',
      format: 'mp4',
      bitrate: 1000000
    }
  ];

  useEffect(() => {
    // Initialize device info
    const updateDeviceInfo = async () => {
      try {
        // Check if getBattery is available (Chrome/Edge)
        if ('getBattery' in navigator) {
          const battery = await (navigator as any).getBattery();
          setAnalytics(prev => ({
            ...prev,
            deviceInfo: {
              ...prev.deviceInfo,
              batteryLevel: Math.round(battery.level * 100)
            }
          }));
        }
        
        // Get connection info
        if ('connection' in navigator) {
          const connection = (navigator as any).connection;
          setAnalytics(prev => ({
            ...prev,
            deviceInfo: {
              ...prev.deviceInfo,
              networkType: connection.effectiveType || 'unknown'
            }
          }));
        }
      } catch (error) {
        console.log('Device info not available:', error);
      }
    };

    updateDeviceInfo();
  }, []);

  // Enhanced analytics tracking with CMCD
  const trackVideoEvent = (event: string, data: any = {}) => {
    try {
      // Include CMCD data in analytics
      const eventData = {
        ...data,
        cmcd: cmcdData,
        timestamp: new Date().toISOString(),
        videoId,
        deviceType: 'mobile'
      };

      switch (event) {
        case 'play':
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
          // Send CMCD pause event
          if (cmcdData) {
            analyticsService.trackCMCDEvent('pause', {
              ...cmcdData,
              pr: 0
            });
          }
          break;
        case 'seek':
          // Send CMCD seek event
          if (cmcdData) {
            analyticsService.trackCMCDEvent('seek', {
              ...cmcdData,
              su: false,
              nrr: `${playbackState.currentTime}-${Math.min(playbackState.currentTime + 10, playbackState.duration)}`
            });
          }
          break;
        case 'quality_change':
          // Send CMCD quality change event
          if (cmcdData) {
            analyticsService.trackCMCDEvent('quality_change', {
              ...cmcdData,
              tb: data.bitrate || 0
            });
          }
          break;
        case 'buffer_starvation':
          // Send CMCD buffer starvation event
          if (cmcdData) {
            analyticsService.trackCMCDEvent('buffer_starvation', {
              ...cmcdData,
              bs: true
            });
          }
          break;
      }

      // Update mobile analytics
      if (onAnalyticsUpdate) {
        const mobileAnalytics: MobileAnalytics = {
          sessionId: analyticsService.getSessionId(),
          videoId,
          deviceInfo: {
            userAgent: navigator.userAgent,
            screenSize: `${screen.width}x${screen.height}`,
            networkType: 'unknown', // Could be enhanced with Network Information API
            batteryLevel: 0 // Could be enhanced with Battery API
          },
          playbackEvents: [{
            type: event as any,
            timestamp: new Date().toISOString(),
            data: eventData
          }],
          performanceMetrics: {
            bufferingTime: 0,
            errorCount: 0,
            qualityChanges: 0,
            completionRate: 0
          }
        };
        onAnalyticsUpdate(mobileAnalytics);
      }
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  };

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setPlaybackState(prev => ({ ...prev, isPlaying: true }));
      trackVideoEvent('play');
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setPlaybackState(prev => ({ ...prev, isPlaying: false }));
      trackVideoEvent('pause');
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setPlaybackState(prev => ({ ...prev, currentTime: time }));
      trackVideoEvent('seek', { position: time });
    }
  };

  const handleVolumeChange = (volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      setPlaybackState(prev => ({ 
        ...prev, 
        volume,
        isMuted: volume === 0
      }));
    }
  };

  const handleQualityChange = (quality: 'low' | 'medium' | 'high') => {
    setPlaybackState(prev => ({ ...prev, quality }));
    trackVideoEvent('quality_change', { quality });
    
    setAnalytics(prev => ({
      ...prev,
      performanceMetrics: {
        ...prev.performanceMetrics,
        qualityChanges: prev.performanceMetrics.qualityChanges + 1
      }
    }));
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (!playbackState.isFullscreen) {
        videoRef.current.requestFullscreen?.();
        setPlaybackState(prev => ({ ...prev, isFullscreen: true }));
        trackVideoEvent('fullscreen', { action: 'enter' });
      } else {
        document.exitFullscreen?.();
        setPlaybackState(prev => ({ ...prev, isFullscreen: false }));
        trackVideoEvent('fullscreen', { action: 'exit' });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setPlaybackState(prev => ({
        ...prev,
        currentTime: videoRef.current!.currentTime,
        duration: videoRef.current!.duration
      }));
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setPlaybackState(prev => ({
        ...prev,
        duration: videoRef.current!.duration
      }));
    }
  };

  const handleError = (error: string) => {
    setPlaybackState(prev => ({ ...prev, error }));
    trackVideoEvent('error', { error });
    
    setAnalytics(prev => ({
      ...prev,
      performanceMetrics: {
        ...prev.performanceMetrics,
        errorCount: prev.performanceMetrics.errorCount + 1
      }
    }));
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'green';
      case 'medium': return 'yellow';
      case 'low': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Container size="xl">
      <Card shadow="sm" p="xl">
        <Stack gap="lg">
          <Group justify="space-between">
            <Box>
              <Title order={3}>{title}</Title>
              <Text c="dimmed" size="sm">
                Mobile-optimized video player with analytics
              </Text>
            </Box>
            <Group>
              <Button
                size="sm"
                variant="light"
                leftSection={<IconDeviceMobile size={16} />}
                onClick={() => setShowAnalytics(true)}
              >
                Analytics
              </Button>
              <Button
                size="sm"
                variant="light"
                leftSection={<IconSettings size={16} />}
                onClick={() => setShowSettings(true)}
              >
                Settings
              </Button>
            </Group>
          </Group>

          {/* Video Player */}
          <Card withBorder p="md">
            <Stack gap="md">
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
                {/* Video Element */}
                <video
                  ref={videoRef}
                  src={videoUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onError={() => handleError('Video playback error')}
                  onWaiting={() => setPlaybackState(prev => ({ ...prev, buffering: true }))}
                  onCanPlay={() => setPlaybackState(prev => ({ ...prev, buffering: false }))}
                />

                {/* Video Controls Overlay */}
                {showControls && (
                  <Box
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                      padding: '20px',
                      color: 'white'
                    }}
                  >
                    <Stack gap="md">
                      {/* Progress Bar */}
                      <Slider
                        value={playbackState.currentTime}
                        max={playbackState.duration}
                        onChange={handleSeek}
                        label={formatTime}
                        size="sm"
                        color="blue"
                      />

                      {/* Control Buttons */}
                      <Group justify="space-between">
                        <Group>
                          <ActionIcon
                            size="lg"
                            variant="light"
                            color="white"
                            onClick={playbackState.isPlaying ? handlePause : handlePlay}
                          >
                            {playbackState.isPlaying ? (
                              <IconPlayerPause size={20} />
                            ) : (
                              <IconPlayerPlay size={20} />
                            )}
                          </ActionIcon>

                          <ActionIcon
                            size="lg"
                            variant="light"
                            color="white"
                            onClick={() => handleVolumeChange(playbackState.isMuted ? 1 : 0)}
                          >
                            {playbackState.isMuted ? (
                              <IconVolumeOff size={20} />
                            ) : (
                              <IconVolume size={20} />
                            )}
                          </ActionIcon>

                          <Text size="sm" c="white">
                            {formatTime(playbackState.currentTime)} / {formatTime(playbackState.duration)}
                          </Text>
                        </Group>

                        <Group>
                          <Badge color={getQualityColor(playbackState.quality)} variant="light">
                            {playbackState.quality}
                          </Badge>
                          
                          <ActionIcon
                            size="lg"
                            variant="light"
                            color="white"
                            onClick={handleFullscreen}
                          >
                            {playbackState.isFullscreen ? (
                              <IconMinimize size={20} />
                            ) : (
                              <IconMaximize size={20} />
                            )}
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Stack>
                  </Box>
                )}

                {/* Buffering Indicator */}
                {playbackState.buffering && (
                  <Box
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: 'white'
                    }}
                  >
                    <Text size="lg">Buffering...</Text>
                  </Box>
                )}

                {/* Error Display */}
                {playbackState.error && (
                  <Alert
                    icon={<IconAlertCircle size={16} />}
                    color="red"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '80%'
                    }}
                  >
                    {playbackState.error}
                  </Alert>
                )}
              </Box>

              {/* Video Info */}
              <Group justify="space-between">
                <Group>
                  <Badge color="blue" variant="light">
                    {analytics.deviceInfo.screenSize}
                  </Badge>
                  <Badge color="green" variant="light">
                    {analytics.deviceInfo.networkType}
                  </Badge>
                  <Badge color="orange" variant="light">
                    Battery: {analytics.deviceInfo.batteryLevel}%
                  </Badge>
                </Group>

                <Group>
                  <Button size="sm" variant="light" leftSection={<IconDownload size={14} />}>
                    Download
                  </Button>
                  <Button size="sm" variant="light" leftSection={<IconShare size={14} />}>
                    Share
                  </Button>
                </Group>
              </Group>
            </Stack>
          </Card>

          {/* Quality Selection */}
          <Card withBorder p="md">
            <Stack gap="md">
              <Title order={4}>Video Quality</Title>
              
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                {videoSources.map((source) => (
                  <Paper
                    key={source.quality}
                    p="md"
                    withBorder
                    style={{
                      cursor: 'pointer',
                      borderColor: playbackState.quality === source.quality ? '#228be6' : undefined
                    }}
                    onClick={() => handleQualityChange(source.quality)}
                  >
                    <Stack gap="xs" align="center">
                      <Badge color={getQualityColor(source.quality)} size="lg">
                        {source.quality.toUpperCase()}
                      </Badge>
                      <Text size="sm" fw={500}>
                        {(source.bitrate / 1000000).toFixed(1)} Mbps
                      </Text>
                      <Text size="xs" c="dimmed">
                        {source.format.toUpperCase()}
                      </Text>
                    </Stack>
                  </Paper>
                ))}
              </SimpleGrid>
            </Stack>
          </Card>

          {/* CMCD Data Display */}
          <Card withBorder p="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={4}>CMCD Data</Title>
                <Button
                  variant="light"
                  size="xs"
                  leftSection={<IconChartBar size={16} />}
                  onClick={() => setShowCMCD(!showCMCD)}
                >
                  {showCMCD ? 'Hide' : 'Show'} CMCD
                </Button>
              </Group>
              
              {showCMCD && cmcdData && (
                <SimpleGrid cols={2} spacing="xs">
                  <Box>
                    <Text size="xs" c="dimmed">Object Type</Text>
                    <Code>{cmcdData.ot}</Code>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Duration</Text>
                    <Code>{cmcdData.d}s</Code>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Resolution</Text>
                    <Code>{cmcdData.w}x{cmcdData.h}</Code>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Frame Rate</Text>
                    <Code>{cmcdData.f}fps</Code>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Device Type</Text>
                    <Code>{cmcdData.dt}</Code>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Session ID</Text>
                    <Code>{cmcdData.sid}</Code>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Content ID</Text>
                    <Code>{cmcdData.cid}</Code>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Stream Format</Text>
                    <Code>{cmcdData.sf}</Code>
                  </Box>
                </SimpleGrid>
              )}

              <Alert
                icon={<IconInfoCircle size={16} />}
                title="CMCD Analytics"
                color="blue"
              >
                <Text size="sm">
                  Common Media Client Data (CMCD) is being collected for BBC TAMS compliance and enhanced video analytics.
                  This data helps optimize video delivery and provides insights into playback performance.
                </Text>
              </Alert>
            </Stack>
          </Card>
        </Stack>
      </Card>

      {/* Settings Modal */}
      <Modal
        opened={showSettings}
        onClose={() => setShowSettings(false)}
        title="Player Settings"
        size="md"
      >
        <Stack gap="lg">
          <Switch
            label="Auto-play videos"
            checked={autoPlay}
            onChange={(event) => setAutoPlay(event.currentTarget.checked)}
          />
          
          <Switch
            label="Show controls"
            checked={showControls}
            onChange={(event) => setShowControls(event.currentTarget.checked)}
          />

          <Stack gap="xs">
            <Text size="sm" fw={500}>Volume</Text>
            <Slider
              value={playbackState.volume}
              onChange={handleVolumeChange}
              max={1}
              step={0.1}
              label={(value) => `${Math.round(value * 100)}%`}
            />
          </Stack>

          <Group>
            <Button onClick={() => setShowSettings(false)}>
              Save Settings
            </Button>
            <Button variant="light" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Analytics Modal */}
      <Modal
        opened={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        title="Mobile Analytics"
        size="lg"
      >
        <Stack gap="lg">
          <Card withBorder p="md">
            <Stack gap="md">
              <Title order={4}>Device Information</Title>
              
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Group>
                  <Text size="sm" fw={500}>Screen Size:</Text>
                  <Text size="sm">{analytics.deviceInfo.screenSize}</Text>
                </Group>
                
                <Group>
                  <Text size="sm" fw={500}>Network:</Text>
                  <Text size="sm">{analytics.deviceInfo.networkType}</Text>
                </Group>
                
                <Group>
                  <Text size="sm" fw={500}>Battery:</Text>
                  <Text size="sm">{analytics.deviceInfo.batteryLevel}%</Text>
                </Group>
                
                <Group>
                  <Text size="sm" fw={500}>Session ID:</Text>
                  <Text size="sm" style={{ fontFamily: 'monospace' }}>
                    {analytics.sessionId}
                  </Text>
                </Group>
              </SimpleGrid>
            </Stack>
          </Card>

          <Card withBorder p="md">
            <Stack gap="md">
              <Title order={4}>Performance Metrics</Title>
              
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Paper p="md" withBorder>
                  <Stack gap="xs" align="center">
                    <Text size="lg" fw={700} c="blue">
                      {analytics.performanceMetrics.errorCount}
                    </Text>
                    <Text size="xs" c="dimmed">Errors</Text>
                  </Stack>
                </Paper>
                
                <Paper p="md" withBorder>
                  <Stack gap="xs" align="center">
                    <Text size="lg" fw={700} c="orange">
                      {analytics.performanceMetrics.qualityChanges}
                    </Text>
                    <Text size="xs" c="dimmed">Quality Changes</Text>
                  </Stack>
                </Paper>
                
                <Paper p="md" withBorder>
                  <Stack gap="xs" align="center">
                    <Text size="lg" fw={700} c="green">
                      {analytics.performanceMetrics.completionRate}%
                    </Text>
                    <Text size="xs" c="dimmed">Completion Rate</Text>
                  </Stack>
                </Paper>
                
                <Paper p="md" withBorder>
                  <Stack gap="xs" align="center">
                    <Text size="lg" fw={700} c="purple">
                      {analytics.playbackEvents.length}
                    </Text>
                    <Text size="xs" c="dimmed">Events Tracked</Text>
                  </Stack>
                </Paper>
              </SimpleGrid>
            </Stack>
          </Card>
        </Stack>
      </Modal>
    </Container>
  );
}
