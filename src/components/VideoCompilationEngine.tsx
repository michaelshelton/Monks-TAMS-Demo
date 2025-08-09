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
  Alert
} from '@mantine/core';
import {
  IconVideo,
  IconDownload,
  IconShare,
  IconCopy,
  IconCheck,
  IconQrcode
} from '@tabler/icons-react';
import { analyticsService } from '../services/analytics';
import VideoPlayerWithAnalytics from './VideoPlayerWithAnalytics';
import QRCodeGeneratorWithAnalytics from './QRCodeGeneratorWithAnalytics';
import AnalyticsDashboard from './AnalyticsDashboard';

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

interface VideoCompilationEngineProps {
  segments: VideoSegment[];
  onCompilationComplete?: (compilationId: string, outputUrl: string) => void;
}

export default function VideoCompilationEngine({ segments }: VideoCompilationEngineProps) {
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

  // Track compilation start
  const handleCompilationStart = () => {
    analyticsService.trackCompilationStart(compilationId, segments.length);
  };

  // Track compilation complete
  const handleCompilationComplete = () => {
    const duration = 2000; // 2 seconds for demo
    const fileSize = firstSegment ? firstSegment.size : 0;
    analyticsService.trackCompilationComplete(compilationId, duration, fileSize);
  };

  // Track QR code generation
  const handleQRGenerated = (qrData: any) => {
    analyticsService.trackQRScan(compilationId);
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
          </Group>

          {/* Demo Video Output */}
          {firstSegment && (
            <VideoPlayerWithAnalytics
              src={firstSegment.url}
              videoId={firstSegment.id}
              compilationId={compilationId}
              title="Demo Video Output"
              description="Compiled video with analytics tracking"
              videoDuration={getSegmentDuration(firstSegment)}
              showAnalytics={true}
              onQRScan={() => analyticsService.trackQRScan(compilationId)}
            />
          )}

          {/* Compilation Actions */}
          <Card withBorder p="md">
            <Stack gap="md">
              <Title order={4}>Compilation Actions</Title>
              
              <Group>
                <Button
                  size="lg"
                  leftSection={<IconVideo size={20} />}
                  onClick={handleCompilationStart}
                >
                  Start Compilation
                </Button>
                
                <Button
                  size="lg"
                  variant="light"
                  leftSection={<IconQrcode size={20} />}
                  onClick={handleCompilationComplete}
                >
                  Complete Compilation
                </Button>
              </Group>

              <Alert icon={<IconCheck size={16} />} color="green">
                Demo video ready with QR code access and Hydrolix analytics integration!
              </Alert>
            </Stack>
          </Card>

          {/* Individual Video Segments */}
          <Card withBorder p="md">
            <Stack gap="md">
              <Title order={4}>Available Video Segments</Title>
              <Text c="dimmed" size="sm">
                These are the video segments available for compilation
              </Text>
              
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {segments.map((segment, index) => (
                  <Card key={segment.id} withBorder p="md">
                    <Stack gap="md">
                      <Group justify="space-between">
                        <Box>
                          <Title order={5}>Video {index + 1}</Title>
                          <Text size="sm" c="dimmed">
                            {segment.object_id}
                          </Text>
                        </Box>
                        <Badge color="blue" variant="light">
                          {formatFileSize(segment.size)}
                        </Badge>
                      </Group>

                      <Box
                        style={{
                          width: '100%',
                          height: '200px',
                          backgroundColor: '#000',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}
                      >
                        <video
                          src={segment.url}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                          }}
                          controls
                          preload="metadata"
                        />
                      </Box>

                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text size="sm" fw={500}>Duration</Text>
                          <Text size="sm">{getSegmentDuration(segment)}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm" fw={500}>Format</Text>
                          <Text size="sm">{segment.format.toUpperCase()}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm" fw={500}>Codec</Text>
                          <Text size="sm">{segment.codec}</Text>
                        </Group>
                      </Stack>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            </Stack>
          </Card>
        </Stack>
      </Card>
    </Container>
  );
}
