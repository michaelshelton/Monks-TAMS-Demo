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
} from '@mantine/core';
import {
  IconServer,
  IconRefresh,
  IconSearch,
  IconPlus,
} from '@tabler/icons-react';
import { apiClient } from '../services/api';

interface Source {
  id: string;
  label?: string;
  description?: string;
  format?: string;
  created?: string;
  tags?: Record<string, string>;
  flows_count?: number;
}

export default function Sources() {
  const navigate = useNavigate();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSources = async () => {
    setLoading(true);
    setError(null);
    try {
      const sourcesResponse = await apiClient.sources.list();
      const sourcesData = Array.isArray(sourcesResponse) ? sourcesResponse : sourcesResponse.sources || [];
      
      // Fetch flows to count per source
      const flowsResponse = await apiClient.flows.list();
      const flowsData = Array.isArray(flowsResponse) ? flowsResponse : flowsResponse.flows || [];
      
      // Add flow count to each source
      const sourcesWithCounts = sourcesData.map((source: Source) => ({
        ...source,
        flows_count: flowsData.filter((flow: any) => flow.source_id === source.id).length
      }));
      
      setSources(sourcesWithCounts);
    } catch (err) {
      setError('Failed to fetch sources');
      console.error(err);
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const filteredSources = sources.filter(source => 
    source.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    source.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    source.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container size="xl">
      <Group justify="space-between" mb="lg">
        <Title order={1}>Sources</Title>
        <Group>
          <TextInput
            placeholder="Search sources..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
          />
          <ActionIcon onClick={fetchSources} variant="default" size="lg">
            <IconRefresh size={18} />
          </ActionIcon>
        </Group>
      </Group>

      {loading && (
        <Box ta="center" py="xl">
          <Loader size="lg" />
          <Text mt="md" c="dimmed">Loading sources...</Text>
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
                <Table.Th>Source ID</Table.Th>
                <Table.Th>Label</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Format</Table.Th>
                <Table.Th>Flows</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredSources.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" c="dimmed" py="lg">
                      No sources found
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredSources.map((source) => (
                  <Table.Tr key={source.id}>
                    <Table.Td>
                      <Group gap="xs">
                        <IconServer size={16} />
                        <Text size="sm" fw={500}>
                          {source.id.length > 20 ? `${source.id.substring(0, 20)}...` : source.id}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{source.label || '-'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" lineClamp={1}>
                        {source.description || '-'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {source.format && (
                        <Badge color="blue" size="sm">
                          {source.format.replace('urn:x-nmos:format:', '')}
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="filled" color="gray">
                        {source.flows_count || 0}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => navigate(`/source-details/${source.id}`)}
                      >
                        View
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Card>
      )}
    </Container>
  );
}