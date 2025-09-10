import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Card,
  Text,
  Badge,
  Group,
  Box,
  Button,
  Table,
  Alert,
  Loader,
  Stack,
  SimpleGrid,
  Divider,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconVideo,
  IconClock,
  IconDatabase,
  IconPlayerPlay,
  IconRefresh,
} from '@tabler/icons-react';
import { apiClient } from '../services/api';
import HLSVideoPlayer from '../components/HLSVideoPlayer';

interface Flow {
  id: string;
  source_id: string;
  format: string;
  codec: string;
  label?: string;
  description?: string;
  created?: string;
  tags?: Record<string, string>;
  container?: string;
  total_segments?: number;
  total_bytes?: number;
  total_duration?: number;
  last_segment?: string;
}

interface Segment {
  segment_id: string;
  timestamp: number;
  duration?: number;
  size?: number;
  url?: string;
  
  // Legacy fields that might not be present
  id?: string;
  flow_id?: string;
  timerange?: string;
  created?: string;
  object_id?: string;
}

export default function FlowDetails() {
  const { flowId } = useParams<{ flowId: string }>();
  const navigate = useNavigate();
  const [flow, setFlow] = useState<Flow | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  const fetchFlowDetails = async () => {
    if (!flowId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch flow data first
      const flowData = await apiClient.flows.get(flowId);
      setFlow(flowData);
      
      // Try to fetch segments with a 24-hour duration to get all recent segments
      try {
        const segmentsData = await apiClient.flows.getSegments(flowId, { 
          duration: 86400 // 24 hours in seconds
        });
        setSegments(Array.isArray(segmentsData) ? segmentsData : segmentsData.segments || []);
      } catch (segErr) {
        console.warn('Segments endpoint returned error, using flow metadata instead:', segErr);
        // Segments endpoint might not be returning data, but we can show count from flow
        setSegments([]);
      }
    } catch (err) {
      setError('Failed to fetch flow details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlowDetails();
    
    // Set up WebSocket for real-time updates
    if (flowId) {
      const ws = apiClient.connectWebSocket(flowId, (data) => {
        if (data.type === 'segment_added') {
          // Refresh segments when new ones are added
          fetchFlowDetails();
        }
      });
      
      return () => {
        ws.close();
      };
    }
  }, [flowId]);

  const parseTimerange = (timerange: string) => {
    // Parse BBC TAMS timerange format: "[seconds:nanoseconds_seconds:nanoseconds)"
    // Example: "[0:66016000_10:133016000)"
    if (!timerange) return { start: '-', duration: '-' };
    
    // Check if it's TAMS format
    const tamsMatch = timerange.match(/\[(\d+):(\d+)_(\d+):(\d+)\)/);
    if (tamsMatch) {
      const startSec = parseInt(tamsMatch[1]);
      const startNano = parseInt(tamsMatch[2]);
      const endSec = parseInt(tamsMatch[3]);
      const endNano = parseInt(tamsMatch[4]);
      
      const startTime = startSec + startNano / 1e9;
      const endTime = endSec + endNano / 1e9;
      const duration = endTime - startTime;
      
      // Format start time as HH:MM:SS
      const hours = Math.floor(startTime / 3600);
      const minutes = Math.floor((startTime % 3600) / 60);
      const seconds = Math.floor(startTime % 60);
      
      return {
        start: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        duration: `${duration.toFixed(2)}s`,
      };
    }
    
    // Fallback to ISO 8601 format: "2025-01-10T12:00:00.000Z/2025-01-10T12:00:10.000Z"
    const parts = timerange.split('/');
    if (parts.length !== 2) return { start: timerange, duration: '-' };
    
    const start = new Date(parts[0]);
    const end = new Date(parts[1]);
    const duration = (end.getTime() - start.getTime()) / 1000; // in seconds
    
    return {
      start: start.toLocaleTimeString(),
      duration: `${duration.toFixed(1)}s`,
    };
  };

  if (loading) {
    return (
      <Container size="xl">
        <Box ta="center" py="xl">
          <Loader size="lg" />
          <Text mt="md" c="dimmed">Loading flow details...</Text>
        </Box>
      </Container>
    );
  }

  if (error || !flow) {
    return (
      <Container size="xl">
        <Alert color="red" mb="lg">
          {error || 'Flow not found'}
        </Alert>
        <Button onClick={() => navigate('/flows')} leftSection={<IconArrowLeft size={16} />}>
          Back to Flows
        </Button>
      </Container>
    );
  }

  const isWebcamFlow = flow.id === '11111111-1111-4111-8111-111111111111';
  const manifestUrl = apiClient.flows.getManifest(flow.id);

  return (
    <Container size="xl">
      <Group justify="space-between" mb="lg">
        <Group>
          <Button 
            variant="subtle" 
            onClick={() => navigate('/flows')}
            leftSection={<IconArrowLeft size={16} />}
          >
            Back
          </Button>
          <Title order={1}>Flow Details</Title>
        </Group>
        <Button onClick={fetchFlowDetails} leftSection={<IconRefresh size={16} />}>
          Refresh
        </Button>
      </Group>

      {isWebcamFlow && (
        <Alert color="blue" mb="lg" title="Live Webcam Stream">
          This is the live webcam feed with real-time segments being added via TAMS ingest.
        </Alert>
      )}

      <SimpleGrid cols={2} spacing="lg" mb="lg">
        <Card withBorder>
          <Title order={3} mb="md">Flow Information</Title>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={500}>ID:</Text>
              <Text size="sm" c="dimmed">{flow.id}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Label:</Text>
              <Text size="sm">{flow.label || '-'}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Format:</Text>
              <Badge color="blue" size="sm">
                {flow.format?.replace('urn:x-nmos:format:', '') || 'unknown'}
              </Badge>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Codec:</Text>
              <Text size="sm">{flow.codec || '-'}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Container:</Text>
              <Text size="sm">{flow.container || '-'}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Source ID:</Text>
              <Text size="sm" c="dimmed">{flow.source_id || '-'}</Text>
            </Group>
          </Stack>
        </Card>

        <Card withBorder>
          <Title order={3} mb="md">Stream Options</Title>
          <Stack gap="md">
            <Button
              fullWidth
              leftSection={<IconPlayerPlay size={16} />}
              onClick={() => setShowPlayer(!showPlayer)}
              color={showPlayer ? 'red' : 'green'}
            >
              {showPlayer ? 'Hide Player' : 'Show HLS Player'}
            </Button>
            <Button
              fullWidth
              variant="light"
              leftSection={<IconVideo size={16} />}
              onClick={() => window.open(manifestUrl, '_blank')}
            >
              Open HLS Manifest
            </Button>
            <Text size="xs" c="dimmed" ta="center">
              {manifestUrl}
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>

      {showPlayer && (
        <Card withBorder mb="lg">
          <Title order={3} mb="md">HLS Player</Title>
          <HLSVideoPlayer 
            hlsUrl={manifestUrl}
            autoPlay={false}
            showControls={true}
          />
        </Card>
      )}

      <Card withBorder>
        <Group justify="space-between" mb="md">
          <Title order={3}>
            Segments {flow?.total_segments ? `(${flow.total_segments} total)` : `(${segments.length})`}
          </Title>
          {isWebcamFlow && (
            <Badge color="green" variant="dot">
              Live - Auto-updating
            </Badge>
          )}
        </Group>
        
        <Divider mb="md" />
        
        {segments.length === 0 && flow?.total_segments > 0 ? (
          <Text ta="center" c="dimmed" py="lg">
            This flow has {flow.total_segments} segments stored. 
            The detailed segment list is currently unavailable.
          </Text>
        ) : segments.length === 0 ? (
          <Text ta="center" c="dimmed" py="lg">
            No segments available
          </Text>
        ) : (
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Index</Table.Th>
                <Table.Th>Segment ID</Table.Th>
                <Table.Th>Start Time</Table.Th>
                <Table.Th>Duration</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {segments.map((segment, index) => {
                // Format timestamp to time
                const date = new Date(segment.timestamp);
                const timeStr = date.toLocaleTimeString();
                
                // Format duration from milliseconds to seconds
                const durationStr = segment.duration ? `${(segment.duration / 1000).toFixed(2)}s` : '-';
                
                // Extract segment ID for display (last part after underscore)
                const displayId = segment.segment_id?.split('_').pop() || segment.segment_id;
                
                return (
                  <Table.Tr key={segment.segment_id}>
                    <Table.Td>
                      <Text size="sm" fw={500}>#{index + 1}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {displayId}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <IconClock size={14} />
                        <Text size="sm">{timeStr}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{durationStr}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => {
                          // Use the URL directly from the segment if available
                          if (segment.url) {
                            window.open(segment.url, '_blank');
                          } else {
                            // Fallback to proxy URL
                            const segmentUrl = apiClient.segments.getProxyUrl(flowId!, segment.segment_id);
                            window.open(segmentUrl, '_blank');
                          }
                        }}
                      >
                        Download
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Container>
  );
}