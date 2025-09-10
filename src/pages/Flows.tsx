import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextInput,
  ActionIcon,
  ThemeIcon,
} from '@mantine/core';
import {
  IconVideo,
  IconRefresh,
  IconSearch,
  IconPlayerPlay,
  IconDatabase,
} from '@tabler/icons-react';
import { apiClient } from '../services/api';

interface Flow {
  id?: string;
  _id?: string;
  source_id?: string;
  format: string;
  codec?: string;
  label?: string;
  description?: string;
  created?: string;
  tags?: Record<string, string>;
  container?: string;
  segments_count?: number;
  total_segments?: number;
}

export default function Flows() {
  const navigate = useNavigate();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFlows = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.flows.list();
      setFlows(Array.isArray(response) ? response : response.flows || []);
    } catch (err) {
      setError('Failed to fetch flows');
      console.error(err);
      setFlows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  const getFormatIcon = (format: string) => {
    if (format?.includes('video')) return <IconVideo size={16} />;
    if (format?.includes('data')) return <IconDatabase size={16} />;
    return <IconVideo size={16} />;
  };

  const getFormatColor = (format: string) => {
    if (format?.includes('video')) return 'blue';
    if (format?.includes('audio')) return 'green';
    if (format?.includes('data')) return 'orange';
    return 'gray';
  };

  const filteredFlows = flows.filter(flow => {
    const flowId = flow.id || flow._id || '';
    return (
      flowId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flow.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flow.source_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Special handling for webcam flow
  const webcamFlow = flows.find(f => (f.id || f._id) === '11111111-1111-4111-8111-111111111111');

  return (
    <Container size="xl">
      <Group justify="space-between" mb="lg">
        <Group gap="sm">
          <ThemeIcon size="xl" radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan', deg: 45 }}>
            <IconVideo size={28} />
          </ThemeIcon>
          <div>
            <Title order={1}>Flows</Title>
            <Text size="sm" c="dimmed">Manage video flows and streams</Text>
          </div>
        </Group>
        <Group>
          <TextInput
            placeholder="Search flows..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
          />
          <ActionIcon onClick={fetchFlows} variant="default" size="lg">
            <IconRefresh size={18} />
          </ActionIcon>
        </Group>
      </Group>

      {webcamFlow && (
        <Alert color="blue" mb="lg" title="Live Webcam Feed">
          <Group justify="space-between">
            <Text size="sm">
              Webcam stream is active with {webcamFlow.total_segments || webcamFlow.segments_count || 0} segments
            </Text>
            <Button
              size="xs"
              leftSection={<IconPlayerPlay size={14} />}
              onClick={() => navigate(`/flow-details/${webcamFlow.id || webcamFlow._id}`)}
            >
              View Stream
            </Button>
          </Group>
        </Alert>
      )}

      {loading && (
        <Box ta="center" py="xl">
          <Loader size="lg" />
          <Text mt="md" c="dimmed">Loading flows...</Text>
        </Box>
      )}

      {error && (
        <Alert color="red" mb="lg">
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <Card withBorder>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Flow ID</Table.Th>
                <Table.Th>Label</Table.Th>
                <Table.Th>Format</Table.Th>
                <Table.Th>Codec</Table.Th>
                <Table.Th>Source</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredFlows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" c="dimmed" py="lg">
                      No flows found
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredFlows.map((flow) => {
                  const flowId = flow.id || flow._id || '';
                  return (
                  <Table.Tr key={flowId}>
                    <Table.Td>
                      <Group gap="xs">
                        {getFormatIcon(flow.format)}
                        <Text size="sm" fw={500}>
                          {flowId.length > 20 ? `${flowId.substring(0, 20)}...` : flowId}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{flow.label || '-'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getFormatColor(flow.format)} size="sm">
                        {flow.format?.replace('urn:x-nmos:format:', '') || 'unknown'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{flow.codec || '-'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {flow.source_id ? flow.source_id.substring(0, 12) + '...' : '-'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => navigate(`/flow-details/${flowId}`)}
                        >
                          View
                        </Button>
                        {flow.format?.includes('video') && (
                          <Button
                            size="xs"
                            variant="light"
                            color="green"
                            leftSection={<IconPlayerPlay size={14} />}
                            onClick={() => {
                              const url = apiClient.flows.getManifest(flowId);
                              window.open(url, '_blank');
                            }}
                          >
                            Play
                          </Button>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </Card>
      )}
    </Container>
  );
}