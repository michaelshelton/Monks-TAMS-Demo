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
} from '@mantine/core';
import {
  IconArrowLeft,
  IconServer,
  IconRefresh,
} from '@tabler/icons-react';
import { apiClient } from '../services/api';

interface Source {
  id: string;
  label?: string;
  description?: string;
  format?: string;
  created?: string;
  tags?: Record<string, string>;
}

interface Flow {
  id?: string;
  _id?: string;
  source_id?: string;
  format: string;
  codec?: string;
  label?: string;
  total_segments?: number;
}

export default function SourceDetails() {
  const { sourceId } = useParams<{ sourceId: string }>();
  const navigate = useNavigate();
  const [source, setSource] = useState<Source | null>(null);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSourceDetails = async () => {
    if (!sourceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const sourceData = await apiClient.sources.get(sourceId);
      setSource(sourceData);
      
      // Fetch flows for this source
      const flowsData = await apiClient.flows.list();
      const allFlows = Array.isArray(flowsData) ? flowsData : flowsData.flows || [];
      const sourceFlows = allFlows.filter((flow: Flow) => flow.source_id === sourceId);
      setFlows(sourceFlows);
    } catch (err) {
      setError('Failed to fetch source details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSourceDetails();
  }, [sourceId]);

  if (loading) {
    return (
      <Container size="xl">
        <Box ta="center" py="xl">
          <Loader size="lg" />
          <Text mt="md" c="dimmed">Loading source details...</Text>
        </Box>
      </Container>
    );
  }

  if (error || !source) {
    return (
      <Container size="xl">
        <Alert color="red" mb="lg">
          {error || 'Source not found'}
        </Alert>
        <Button onClick={() => navigate('/sources')} leftSection={<IconArrowLeft size={16} />}>
          Back to Sources
        </Button>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Group justify="space-between" mb="lg">
        <Group>
          <Button 
            variant="subtle" 
            onClick={() => navigate('/sources')}
            leftSection={<IconArrowLeft size={16} />}
          >
            Back
          </Button>
          <Title order={1}>Source Details</Title>
        </Group>
        <Button onClick={fetchSourceDetails} leftSection={<IconRefresh size={16} />}>
          Refresh
        </Button>
      </Group>

      <SimpleGrid cols={2} spacing="lg" mb="lg">
        <Card withBorder>
          <Title order={3} mb="md">Source Information</Title>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={500}>ID:</Text>
              <Text size="sm" c="dimmed">{source.id}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Label:</Text>
              <Text size="sm">{source.label || '-'}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Description:</Text>
              <Text size="sm">{source.description || '-'}</Text>
            </Group>
            {source.format && (
              <Group justify="space-between">
                <Text fw={500}>Format:</Text>
                <Badge color="blue" size="sm">
                  {source.format.replace('urn:x-nmos:format:', '')}
                </Badge>
              </Group>
            )}
            {source.created && (
              <Group justify="space-between">
                <Text fw={500}>Created:</Text>
                <Text size="sm" c="dimmed">
                  {new Date(source.created).toLocaleString()}
                </Text>
              </Group>
            )}
          </Stack>
        </Card>

        <Card withBorder>
          <Title order={3} mb="md">Statistics</Title>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={500}>Associated Flows:</Text>
              <Badge variant="filled" color="gray">
                {flows.length}
              </Badge>
            </Group>
            {source.tags && Object.keys(source.tags).length > 0 && (
              <>
                <Text fw={500}>Tags:</Text>
                <Group gap="xs">
                  {Object.entries(source.tags).map(([key, value]) => (
                    <Badge key={key} variant="light">
                      {key}: {value}
                    </Badge>
                  ))}
                </Group>
              </>
            )}
          </Stack>
        </Card>
      </SimpleGrid>

      <Card withBorder>
        <Title order={3} mb="md">Associated Flows</Title>
        {flows.length === 0 ? (
          <Text ta="center" c="dimmed" py="lg">
            No flows associated with this source
          </Text>
        ) : (
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Flow ID</Table.Th>
                <Table.Th>Label</Table.Th>
                <Table.Th>Format</Table.Th>
                <Table.Th>Codec</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {flows.map((flow) => {
                const flowId = flow.id || flow._id || '';
                return (
                <Table.Tr key={flowId}>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {flowId.length > 20 ? `${flowId.substring(0, 20)}...` : flowId}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{flow.label || '-'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color="blue" size="sm">
                      {flow.format?.replace('urn:x-nmos:format:', '') || 'unknown'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{flow.codec || '-'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => navigate(`/flow-details/${flowId}`)}
                    >
                      View Flow
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