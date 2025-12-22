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
  Stack,
  Alert,
  Loader,
  SimpleGrid,
  Tooltip,
  Divider,
  Collapse,
  Paper
} from '@mantine/core';
import {
  IconContainer,
  IconVideo,
  IconLink,
  IconRefresh,
  IconInfoCircle,
  IconArrowRight,
  IconDatabase,
  IconEye
} from '@tabler/icons-react';
import { apiClient, BBCApiOptions, BBCApiResponse, BBCPaginationMeta } from '../services/api';
import { Pagination } from '@mantine/core';

interface TAMSObject {
  id: string;
  referenced_by_flows?: string[];
  first_referenced_by_flow?: string;
  [key: string]: any;
}

export default function Objects() {
  const navigate = useNavigate();
  const [objects, setObjects] = useState<TAMSObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfoBox, setShowInfoBox] = useState(true);
  
  // BBC TAMS API state
  const [bbcPagination, setBbcPagination] = useState<BBCPaginationMeta>({});
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  
  // Client-side pagination state
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 10;

  // Fetch objects using BBC TAMS API
  // Note: The /objects endpoint is not implemented in the backend yet
  // This is a placeholder that will work once the endpoint is added
  const fetchObjects = async (cursor?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const options: BBCApiOptions = {
        // Note: limit parameter causes validation errors - API expects integer but query strings are strings
        // Backend team needs to fix query parameter type conversion
        // For now, don't use limit - API will return all objects (when implemented)
        // limit: 50, // Commented out until backend fixes query parameter validation
      };
      
      if (cursor) {
        options.page = cursor;
      }

      console.log('Fetching objects from TAMS API with options:', options);
      const response: BBCApiResponse<TAMSObject> = await apiClient.getObjects(options);
      console.log('TAMS objects API response:', response);
      
      // Handle different response formats
      let objectsData: TAMSObject[] = [];
      let paginationData: BBCPaginationMeta = {};
      
      if (response && response.data && Array.isArray(response.data)) {
        // Normalized BBC TAMS format
        objectsData = response.data;
        paginationData = response.pagination || {};
      } else {
        const responseAny = response as any;
        if (responseAny && responseAny.objects && Array.isArray(responseAny.objects)) {
          // Alternative format: { objects: [...], count }
          objectsData = responseAny.objects;
          paginationData = {
            count: responseAny.count || responseAny.objects.length,
            ...(options.limit !== undefined ? { limit: options.limit } : {})
          };
        } else if (Array.isArray(response)) {
          // Direct array response
          objectsData = response;
          paginationData = {
            count: response.length,
            ...(options.limit !== undefined ? { limit: options.limit } : {})
          };
        }
      }
      
      setObjects(objectsData);
      setBbcPagination(paginationData);
      
      // Extract cursor from pagination
      if (response.pagination?.nextKey) {
        setCurrentCursor(response.pagination.nextKey);
      } else {
        setCurrentCursor(null);
      }
      
      // Reset to first page when objects change
      setActivePage(1);
      
    } catch (err: any) {
      console.error('Error fetching objects:', err);
      
      // Set appropriate error message based on error type
      let errorMessage = 'Unknown error';
      
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.response) {
        errorMessage = `HTTP ${err.response.status}: ${err.response.statusText || 'Error'}`;
      } else if (err?.name === 'TypeError' && err?.message?.includes('fetch')) {
        errorMessage = 'Network error: Could not connect to API. Is the backend running?';
      } else if (err?.name === 'AbortError') {
        errorMessage = 'Request timeout - please try again';
      }
      
      // Check if it's a 404 (endpoint not implemented)
      if (errorMessage.includes('404') || errorMessage.includes('Cannot GET') || errorMessage.includes('Not Found')) {
        setError('The /objects endpoint is not yet implemented in the TAMS API. Objects are referenced by segments but there is no dedicated endpoint to list them. This feature will be available once the backend implements the objects endpoint.');
      } else {
        setError(errorMessage.includes('TAMS API error') ? errorMessage : `TAMS API error: ${errorMessage}`);
      }
      
      setObjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjects();
  }, []);

  const handleRefresh = () => {
    fetchObjects();
  };

  const formatObjectId = (id: string): string => {
    // Truncate long IDs for display
    if (id.length > 40) {
      return `${id.substring(0, 20)}...${id.substring(id.length - 10)}`;
    }
    return id;
  };

  // Client-side pagination for objects
  const totalPages = Math.ceil(objects.length / itemsPerPage);
  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedObjects = objects.slice(startIndex, endIndex);

  // Calculate stats
  const stats = {
    total: objects.length,
    withReferences: objects.filter(obj => obj.referenced_by_flows && obj.referenced_by_flows.length > 0).length,
    orphaned: objects.filter(obj => !obj.referenced_by_flows || obj.referenced_by_flows.length === 0).length,
    totalReferences: objects.reduce((sum, obj) => sum + (obj.referenced_by_flows?.length || 0), 0)
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Box>
            <Title order={2}>Objects</Title>
            <Text c="dimmed" size="sm" mt="xs">
              Browse and explore media objects stored in TAMS
            </Text>
          </Box>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefresh}
            variant="light"
          >
            Refresh
          </Button>
        </Group>

        {/* Info Box */}
        <Collapse in={showInfoBox}>
          <Alert
            icon={<IconInfoCircle size={16} />}
            title="About Objects"
            color="blue"
            variant="light"
            onClose={() => setShowInfoBox(false)}
            withCloseButton
          >
            <Text size="sm">
              <strong>Objects</strong> represent stored media files in the TAMS system (stored in MinIO/S3). Each object can be referenced by multiple flows through segments.
              Objects show which flows are using them, helping you understand storage relationships and dependencies.
            </Text>
            <Text size="sm" mt="xs" c="dimmed">
              <strong>Note:</strong> The <code>/objects</code> endpoint is not yet implemented in the backend API. Objects are created when segments are uploaded to flows, but there is currently no dedicated endpoint to list all objects. This page will display objects once the backend implements the endpoint.
            </Text>
          </Alert>
        </Collapse>

        {/* Stats Cards */}
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          <Card withBorder p="md">
            <Stack gap="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total Objects</Text>
              <Text size="xl" fw={700}>{stats.total}</Text>
            </Stack>
          </Card>
          <Card withBorder p="md">
            <Stack gap="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>With References</Text>
              <Text size="xl" fw={700}>{stats.withReferences}</Text>
            </Stack>
          </Card>
          <Card withBorder p="md">
            <Stack gap="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Orphaned</Text>
              <Text size="xl" fw={700}>{stats.orphaned}</Text>
            </Stack>
          </Card>
          <Card withBorder p="md">
            <Stack gap="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total References</Text>
              <Text size="xl" fw={700}>{stats.totalReferences}</Text>
            </Stack>
          </Card>
        </SimpleGrid>

        {/* Error State */}
        {error && (
          <Alert icon={<IconInfoCircle size={16} />} color="red" title="Error">
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box ta="center" py="xl">
            <Loader size="lg" />
            <Text mt="md" c="dimmed">Loading objects...</Text>
          </Box>
        )}

        {/* Objects Table */}
        {!loading && !error && (
          <>
            <Card withBorder p="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Title order={4}>All Objects</Title>
                  <Text size="sm" c="dimmed">
                    {objects.length} {objects.length === 1 ? 'object' : 'objects'}
                  </Text>
                </Group>
                
                {objects.length === 0 ? (
                  <Paper p="xl" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                    <Stack align="center" gap="md">
                      <IconContainer size={48} style={{ color: 'var(--mantine-color-gray-5)' }} />
                      <Text c="dimmed" ta="center">
                        No objects found in the system.
                        <br />
                        Objects are created when segments are uploaded to flows.
                      </Text>
                    </Stack>
                  </Paper>
                ) : (
                  <Table.ScrollContainer minWidth={800}>
                    <Table highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Object ID</Table.Th>
                          <Table.Th>Referenced By</Table.Th>
                          <Table.Th>First Reference</Table.Th>
                          <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {paginatedObjects.map((obj) => (
                          <Table.Tr key={obj.id}>
                            <Table.Td>
                              <Group gap="xs">
                                <IconContainer size={16} style={{ color: 'var(--mantine-color-blue-6)' }} />
                                <Tooltip label={obj.id}>
                                  <Text size="sm" ff="monospace" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {formatObjectId(obj.id)}
                                  </Text>
                                </Tooltip>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              {obj.referenced_by_flows && obj.referenced_by_flows.length > 0 ? (
                                <Group gap="xs">
                                  <Badge variant="light" color="blue">
                                    {obj.referenced_by_flows.length} {obj.referenced_by_flows.length === 1 ? 'flow' : 'flows'}
                                  </Badge>
                                  {obj.referenced_by_flows.slice(0, 2).map((flowId: string) => (
                                    <Button
                                      key={flowId}
                                      variant="subtle"
                                      size="xs"
                                      rightSection={<IconArrowRight size={12} />}
                                      onClick={() => navigate(`/flow-details/${flowId}`)}
                                    >
                                      {formatObjectId(flowId)}
                                    </Button>
                                  ))}
                                  {obj.referenced_by_flows.length > 2 && (
                                    <Text size="xs" c="dimmed">
                                      +{obj.referenced_by_flows.length - 2} more
                                    </Text>
                                  )}
                                </Group>
                              ) : (
                                <Badge variant="light" color="gray">No references</Badge>
                              )}
                            </Table.Td>
                            <Table.Td>
                              {obj.first_referenced_by_flow ? (
                                <Button
                                  variant="subtle"
                                  size="xs"
                                  rightSection={<IconArrowRight size={12} />}
                                  onClick={() => navigate(`/flow-details/${obj.first_referenced_by_flow}`)}
                                >
                                  {formatObjectId(obj.first_referenced_by_flow)}
                                </Button>
                              ) : (
                                <Text size="sm" c="dimmed">—</Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                {obj.referenced_by_flows && obj.referenced_by_flows.length > 0 && (
                                  <Tooltip label="View all referencing flows">
                                    <Button
                                      variant="light"
                                      size="xs"
                                      leftSection={<IconEye size={14} />}
                                      onClick={() => {
                                        // Navigate to flows page filtered by this object
                                        navigate(`/flows?object_id=${obj.id}`);
                                      }}
                                    >
                                      View Flows
                                    </Button>
                                  </Tooltip>
                                )}
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                )}
              </Stack>
            </Card>

            {/* Pagination */}
            {objects.length > itemsPerPage && (
              <Group justify="center" mt="lg">
                <Pagination
                  value={activePage}
                  onChange={setActivePage}
                  total={totalPages}
                  size="sm"
                />
              </Group>
            )}
            
            {/* Results count */}
            {!loading && objects.length > 0 && (
              <Group justify="center" mt="md">
                <Text size="sm" c="dimmed">
                  Showing {startIndex + 1}-{Math.min(endIndex, objects.length)} of {objects.length} objects
                </Text>
              </Group>
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}

