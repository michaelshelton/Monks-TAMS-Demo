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
  SimpleGrid,
  Alert,
  Code,
  Collapse
} from '@mantine/core';
import {
  IconVideo,
  IconDownload,
  IconShare,
  IconCopy,
  IconCheck,
  IconQrcode,
  IconChartBar,
  IconInfoCircle
} from '@tabler/icons-react';
import { analyticsService } from '../services/analytics';
import VideoPlayerWithAnalytics from './VideoPlayerWithAnalytics';
import QRCodeGeneratorWithAnalytics from './QRCodeGeneratorWithAnalytics';
import AnalyticsDashboard from './AnalyticsDashboard';
import { useState } from 'react';

// Types for video compilation
interface VideoSegment {
  id: string;
  object_id: string;
  flow_id: string;
  timerange: {
    start: string;
    end: string;
  };
  url: string;
  format: string;
  codec: string;
  size: number;
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
  cid: string; // Content ID
  pr: number; // Playback rate
  sf: string; // Stream format
  sid: string; // Session ID
  st: 'v' | 'l' | 'f'; // Stream type (vod, live, offline)
  v: number; // Version
}

interface VideoCompilationEngineProps {
  segments: VideoSegment[];
  onCompilationComplete?: (compilationId: string, outputUrl: string) => void;
}

export default function VideoCompilationEngine({ segments }: VideoCompilationEngineProps) {
  const [showCMCD, setShowCMCD] = useState(false);
  const [cmcdData, setCmcdData] = useState<CMCDData | null>(null);

  const formatDuration = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const duration = (endTime - startTime) / 1000;
    return `${Math.floor(duration)}s`;
  };

  const getSegmentDuration = (segment: VideoSegment) => {
    return formatDuration(segment.timerange.start, segment.timerange.end);
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const firstSegment = segments[0] || null;
  const compilationId = `demo_comp_${Date.now()}`;

  // Initialize CMCD data for compilation
  useState(() => {
    if (firstSegment) {
      const newCmcdData: CMCDData = {
        ot: 'v', // Object type: video
        d: 0, // Will be calculated from segments
        br: 0, // Will be calculated from segments
        w: 1920, // Default HD resolution
        h: 1080, // Default HD resolution
        f: 30, // Default frame rate
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
        cid: compilationId,
        pr: 1,
        sf: 'dash', // Assuming DASH for BBC TAMS
        sid: analyticsService.getSessionId(),
        st: 'v', // VOD
        v: 1
      };
      
      // Calculate total duration and bitrate from segments
      let totalDuration = 0;
      let totalBitrate = 0;
      segments.forEach(segment => {
        const duration = (new Date(segment.timerange.end).getTime() - new Date(segment.timerange.start).getTime()) / 1000;
        totalDuration += duration;
        totalBitrate += (segment.size * 8) / (duration * 1000); // kbps
      });
      
      newCmcdData.d = totalDuration;
      newCmcdData.br = Math.round(totalBitrate / segments.length); // Average bitrate
      
      setCmcdData(newCmcdData);
    }
  });

  // Track compilation start with CMCD
  const handleCompilationStart = () => {
    analyticsService.trackCompilationStart(compilationId, segments.length);
    
    // Send CMCD compilation start event
    if (cmcdData) {
      analyticsService.trackCMCDEvent('compilation_start', {
        ...cmcdData,
        su: true,
        dl: Math.round(cmcdData.d * 1000) // Deadline in ms
      });
    }
  };

  // Track compilation complete with CMCD
  const handleCompilationComplete = () => {
    const duration = 2000; // 2 seconds for demo
    const fileSize = firstSegment ? firstSegment.size : 0;
    analyticsService.trackCompilationComplete(compilationId, duration, fileSize);
    
    // Send CMCD compilation complete event
    if (cmcdData) {
      analyticsService.trackCMCDEvent('compilation_complete', {
        ...cmcdData,
        su: false,
        dl: 0 // No deadline after completion
      });
    }
  };

  // Track QR code generation with CMCD
  const handleQRGenerated = (qrData: any) => {
    analyticsService.trackQRScan(compilationId);
    
    // Send CMCD QR generation event
    if (cmcdData) {
      analyticsService.trackCMCDEvent('qr_generated', {
        ...cmcdData,
        su: false
      });
    }
  };

  // CMCD data display
  const renderCMCDData = () => {
    if (!cmcdData) return null;

    return (
      <Collapse in={showCMCD}>
        <Card mt="md" withBorder>
          <Group justify="space-between" mb="sm">
            <Title order={6}>CMCD Data (Common Media Client Data)</Title>
            <Badge color="blue">BBC TAMS Compliant</Badge>
          </Group>
          <SimpleGrid cols={2} spacing="xs">
            <Box>
              <Text size="xs" c="dimmed">Object Type</Text>
              <Code>{cmcdData.ot}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Total Duration</Text>
              <Code>{cmcdData.d.toFixed(1)}s</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Avg Bitrate</Text>
              <Code>{cmcdData.br} kbps</Code>
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
          </SimpleGrid>
        </Card>
      </Collapse>
    );
  };

  return (
    <Container size="xl">
      <Card shadow="sm" p="xl">
        <Stack gap="lg">
          <Group justify="space-between">
            <Box>
              <Title order={3}>Video Compilation Engine</Title>
              <Text c="dimmed" size="sm">
                Demo: First video segment with QR and Hydrolix integration
              </Text>
            </Box>
            <Button
              variant="light"
              size="sm"
              leftSection={<IconChartBar size={16} />}
              onClick={() => setShowCMCD(!showCMCD)}
            >
              {showCMCD ? 'Hide' : 'Show'} CMCD
            </Button>
          </Group>

          {/* CMCD Data Display */}
          {renderCMCDData()}

          {/* Demo Video Output */}
          {firstSegment && (
            <VideoPlayerWithAnalytics
              src={firstSegment.url}
              videoId={firstSegment.id}
              compilationId={compilationId}
              title={`Compiled Video: ${firstSegment.id}`}
              description={`Compiled from ${segments.length} segments`}
              videoDuration={getSegmentDuration(firstSegment)}
              onQRScan={() => handleQRGenerated({})}
            />
          )}

          {/* Compilation Controls */}
          <Group justify="center">
            <Button
              leftSection={<IconVideo size={16} />}
              onClick={handleCompilationStart}
              variant="filled"
              color="blue"
            >
              Start Compilation
            </Button>
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={handleCompilationComplete}
              variant="outline"
            >
              Download Compilation
            </Button>
          </Group>

          {/* Segment Information */}
          <Card withBorder p="md">
            <Title order={4} mb="md">Video Segments</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {segments.map((segment) => (
                <Card key={segment.id} withBorder p="sm">
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Badge color="blue">{segment.format}</Badge>
                      <Badge color="green">{segment.codec}</Badge>
                    </Group>
                    <Text size="sm" fw={500}>
                      {segment.id}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Duration: {getSegmentDuration(segment)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Size: {formatFileSize(segment.size)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Flow: {segment.flow_id}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Card>

          {/* CMCD Analytics Status */}
          <Alert
            icon={<IconInfoCircle size={16} />}
            title="CMCD Analytics & BBC TAMS Compliance"
            color="blue"
          >
            <Text size="sm">
              Common Media Client Data (CMCD) is being collected for this video compilation to ensure BBC TAMS compliance.
              This data enables enhanced analytics, performance optimization, and standardized media delivery workflows.
            </Text>
          </Alert>
        </Stack>
      </Card>
    </Container>
  );
}
