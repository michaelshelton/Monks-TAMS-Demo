import { useState, useEffect } from 'react';
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
  Tabs,
  Alert,
  SimpleGrid,
  Paper
} from '@mantine/core';
import {
  IconBroadcast,
  IconQrcode,
  IconActivity,
  IconDeviceMobile,
  IconPlayerPlay,
  IconDownload,
  IconShare,
  IconSettings,
  IconRefresh,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconVideo,
  IconTimeline,
  IconChartBar,
  IconInfoCircle
} from '@tabler/icons-react';

import VideoCompilationEngine from '../components/VideoCompilationEngine';
import QRCodeGeneratorWithAnalytics from '../components/QRCodeGeneratorWithAnalytics';
import HydrolixAnalytics from '../components/HydrolixAnalytics';
import MobileVideoPlayer from '../components/MobileVideoPlayer';

// Types for the integrated workflow
interface CompilationWorkflow {
  compilationId: string;
  videoUrl: string;
  mobileUrl: string;
  qrCodeId: string;
  sessionId: string;
  status: 'compiling' | 'ready' | 'playing' | 'completed';
  createdAt: string;
  analytics: any;
}

export default function VideoCompilation() {
  const [workflow, setWorkflow] = useState<CompilationWorkflow | null>(null);
  const [activeTab, setActiveTab] = useState<string>('compilation');
  const [showMobilePlayer, setShowMobilePlayer] = useState(false);

  // Real video segments for compilation
  const mockSegments = [
    {
      id: 'seg_001',
      object_id: 'obj_uhd_4096_2160',
      flow_id: 'flow_test_videos',
      timerange: {
        start: '2025-01-25T10:00:00Z',
        end: '2025-01-25T10:00:15Z'
      },
      url: '/videos/2932301-uhd_4096_2160_24fps.mp4',
      format: 'video',
      codec: 'h264',
      size: 24117248 // 23MB
    },
    {
      id: 'seg_002',
      object_id: 'obj_hd_1920_1080',
      flow_id: 'flow_test_videos',
      timerange: {
        start: '2025-01-25T10:02:30Z',
        end: '2025-01-25T10:04:45Z'
      },
      url: '/videos/852038-hd_1920_1080_30fps.mp4',
      format: 'video',
      codec: 'h264',
      size: 23068672 // 22MB
    },
    {
      id: 'seg_003',
      object_id: 'obj_uhd_3840_2160',
      flow_id: 'flow_test_videos',
      timerange: {
        start: '2025-01-25T10:04:45Z',
        end: '2025-01-25T10:07:30Z'
      },
      url: '/videos/3125907-uhd_3840_2160_25fps.mp4',
      format: 'video',
      codec: 'h264',
      size: 30408704 // 29MB
    }
  ];

  const handleCompilationComplete = (compilationId: string, outputUrl: string) => {
    setWorkflow({
      compilationId,
      videoUrl: outputUrl,
      mobileUrl: outputUrl,
      qrCodeId: `qr_${compilationId}`,
      sessionId: `sess_${Date.now()}`,
      status: 'ready',
      createdAt: new Date().toISOString(),
      analytics: {}
    });
  };

  const handleQRGenerated = (qrData: any) => {
    if (workflow) {
      setWorkflow(prev => prev ? {
        ...prev,
        qrCodeId: qrData.id
      } : null);
    }
  };

  const handleAnalyticsUpdate = (analytics: any) => {
    if (workflow) {
      setWorkflow(prev => prev ? {
        ...prev,
        analytics
      } : null);
    }
  };

  const handleMobilePlay = () => {
    setWorkflow(prev => prev ? { ...prev, status: 'playing' } : null);
    setShowMobilePlayer(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compiling': return 'blue';
      case 'ready': return 'green';
      case 'playing': return 'orange';
      case 'completed': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compiling': return <IconVideo size={16} />;
      case 'ready': return <IconCheck size={16} />;
      case 'playing': return <IconPlayerPlay size={16} />;
      case 'completed': return <IconCheck size={16} />;
      default: return <IconAlertCircle size={16} />;
    }
  };

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Page Header with Info Box */}
        <Card withBorder p="xl">
          <Stack gap="md">
            <Group justify="space-between">
              <Box>
                <Title order={2}>Video Compilation Engine</Title>
                <Text c="dimmed" size="lg">
                  Advanced video compilation and workflow management with CMCD analytics
                </Text>
              </Box>
              <Badge size="lg" color="blue" variant="light">
                BBC TAMS Compliant
              </Badge>
            </Group>
            
            <Alert
              icon={<IconInfoCircle size={20} />}
              title="What is this page?"
              color="blue"
              variant="light"
            >
              <Text size="sm">
                The Video Compilation Engine allows you to combine multiple video segments into cohesive compilations 
                while maintaining full BBC TAMS compliance. This page provides:
              </Text>
              <Text size="sm" mt="xs">
                • <strong>Multi-segment compilation</strong> - Combine video segments with precise timing control<br/>
                • <strong>CMCD analytics</strong> - Common Media Client Data collection for performance optimization<br/>
                • <strong>Mobile optimization</strong> - Responsive video delivery across all devices<br/>
                • <strong>QR code integration</strong> - Easy sharing and access to compiled videos<br/>
                • <strong>Real-time monitoring</strong> - Track compilation progress and performance metrics
              </Text>
              <Text size="sm" mt="xs">
                All video operations include comprehensive CMCD data collection for BBC TAMS compliance and enhanced analytics.
              </Text>
            </Alert>
          </Stack>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'compilation')}>
          <Tabs.List>
            <Tabs.Tab value="compilation" leftSection={<IconVideo size={16} />}>
              Compilation Engine
            </Tabs.Tab>
            <Tabs.Tab value="mobile" leftSection={<IconDeviceMobile size={16} />}>
              Mobile Player
            </Tabs.Tab>
            <Tabs.Tab value="analytics" leftSection={<IconActivity size={16} />}>
              Analytics
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="compilation" pt="md">
            <VideoCompilationEngine
              segments={mockSegments}
              onCompilationComplete={handleCompilationComplete}
            />
          </Tabs.Panel>

          <Tabs.Panel value="mobile" pt="md">
            {mockSegments.length > 0 && mockSegments[0] && (
              <Card withBorder p="md">
                <Stack gap="lg">
                  <Group justify="space-between">
                    <Box>
                      <Title order={4}>Mobile Video Player</Title>
                      <Text c="dimmed" size="sm">
                        Test the demo video on mobile devices
                      </Text>
                    </Box>
                    
                    <Group>
                      <Button
                        leftSection={<IconPlayerPlay size={16} />}
                        onClick={() => setShowMobilePlayer(true)}
                      >
                        Play on Mobile
                      </Button>
                      <Button
                        variant="light"
                        leftSection={<IconDownload size={16} />}
                      >
                        Download
                      </Button>
                      <Button
                        variant="light"
                        leftSection={<IconShare size={16} />}
                      >
                        Share
                      </Button>
                    </Group>
                  </Group>

                  {/* Mobile Player Preview */}
                  <Card withBorder p="md">
                    <Stack gap="md">
                      <Title order={5}>Mobile Player Preview</Title>
                      
                      <Box
                        style={{
                          width: '100%',
                          height: '300px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px dashed #ccc'
                        }}
                      >
                        <Stack gap="md" align="center">
                          <IconDeviceMobile size={48} color="#666" />
                          <Text c="dimmed" size="sm" ta="center">
                            Mobile Video Player<br />
                            Ready for mobile testing
                          </Text>
                          <Button
                            size="sm"
                            onClick={() => setShowMobilePlayer(true)}
                          >
                            Launch Mobile Player
                          </Button>
                        </Stack>
                      </Box>

                      <Group justify="space-between">
                        <Group>
                          <Badge color="blue" variant="light">
                            {mockSegments[0].url}
                          </Badge>
                          <Badge color="green" variant="light">
                            {`https://mobile.tams.demo/play/${mockSegments[0].id}`}
                          </Badge>
                        </Group>
                        
                        <Group>
                          <Badge color="orange" variant="light">
                            Session: demo_sess_{Date.now()}
                          </Badge>
                          <Badge color="purple" variant="light">
                            QR: qr_{mockSegments[0].id}
                          </Badge>
                        </Group>
                      </Group>
                    </Stack>
                  </Card>
                </Stack>
              </Card>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="analytics" pt="md">
            {mockSegments.length > 0 && mockSegments[0] && (
              <HydrolixAnalytics
                videoId={mockSegments[0].id}
                sessionId={`demo_sess_${Date.now()}`}
                onAnalyticsUpdate={handleAnalyticsUpdate}
              />
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Mobile Player Modal */}
      {showMobilePlayer && mockSegments.length > 0 && mockSegments[0] && (
        <MobileVideoPlayer
          videoUrl={mockSegments[0].url}
          videoId={mockSegments[0].id}
          title="Mobile Video Player"
          onAnalyticsUpdate={handleAnalyticsUpdate}
        />
      )}
    </Container>
  );
}
