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
  Stack,
  Alert,
  Loader,
  SimpleGrid,
  Progress,
  RingProgress,
  Table,
  Paper,
  Divider,
  Tooltip,
  Collapse,
  Grid,
  NumberInput
} from '@mantine/core';
import {
  IconChartBar,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconRefresh,
  IconInfoCircle,
  IconVideo,
  IconTrendingUp,
  IconTrendingDown,
  IconArrowRight,
  IconEye,
  IconFilter
} from '@tabler/icons-react';
import { apiClient } from '../services/api';

interface QCStatistics {
  total_videos_analyzed: number;
  total_chunks_analyzed: number;
  passed_chunks: number;
  failed_chunks: number;
  average_quality_score: number;
  blur_types: Record<string, number>;
  quality_distribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
}

interface FailedChunk {
  id: string;
  flow_id?: string;
  tags?: {
    quality_verdict?: string;
    quality_score?: string;
    blur_type?: string;
  };
  [key: string]: any;
}

export default function QCStatistics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<QCStatistics | null>(null);
  const [failedChunks, setFailedChunks] = useState<FailedChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfoBox, setShowInfoBox] = useState(true);
  
  // Quality range filter state
  const [qualityRangeMin, setQualityRangeMin] = useState<number>(0);
  const [qualityRangeMax, setQualityRangeMax] = useState<number>(100);
  const [filteredChunks, setFilteredChunks] = useState<FailedChunk[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [showFilteredResults, setShowFilteredResults] = useState(false);

  const fetchQCData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch QC statistics from /api/v1/qc/statistics
      let qcStats: QCStatistics | null = null;
      try {
        console.log('Fetching QC statistics from /api/v1/qc/statistics');
        const statsResponse = await apiClient.getQCStatistics();
        if (statsResponse && typeof statsResponse === 'object') {
          qcStats = statsResponse as QCStatistics;
          console.log('QC statistics received:', qcStats);
        }
      } catch (err: any) {
        console.warn('Failed to fetch QC statistics:', err);
        // Continue - we'll show an error if both fail
      }

      // Fetch failed chunks from /api/v1/qc/failed-chunks
      let failed: FailedChunk[] = [];
      try {
        console.log('Fetching failed chunks from /api/v1/qc/failed-chunks');
        const failedResponse = await apiClient.getQCFailedChunks(20, 0);
        if (failedResponse && typeof failedResponse === 'object') {
          // Handle different response formats
          if (Array.isArray(failedResponse)) {
            failed = failedResponse;
          } else if (failedResponse.failed_chunks && Array.isArray(failedResponse.failed_chunks)) {
            failed = failedResponse.failed_chunks;
          } else if (failedResponse.chunks && Array.isArray(failedResponse.chunks)) {
            failed = failedResponse.chunks;
          }
          console.log('Failed chunks received:', failed.length);
        }
      } catch (err: any) {
        console.warn('Failed to fetch failed chunks:', err);
        // Continue - not critical if this fails
      }

      setStats(qcStats);
      setFailedChunks(failed);

      // Only show error if we couldn't get any data
      if (!qcStats && failed.length === 0) {
        setError('QC statistics are not available. No quality control data has been processed yet.');
      } else if (!qcStats) {
        // If we have failed chunks but no stats, that's okay
        setError(null);
      } else {
        // Clear error if we have data
        setError(null);
      }
    } catch (err: any) {
      console.error('Error fetching QC data:', err);
      const errorMsg = err?.message || 'Failed to load QC statistics';
      setError(errorMsg.includes('TAMS API error') ? errorMsg : `TAMS API error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQCData();
  }, []);

  const handleRefresh = () => {
    fetchQCData();
    setShowFilteredResults(false);
  };

  const handleQualityRangeFilter = async () => {
    if (qualityRangeMin < 0 || qualityRangeMax > 100 || qualityRangeMin > qualityRangeMax) {
      setError('Invalid quality range. Min must be 0-100, Max must be 0-100, and Min must be ≤ Max.');
      return;
    }

    setFilterLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching QC chunks by quality range: ${qualityRangeMin}-${qualityRangeMax}`);
      const response = await apiClient.getQCByQuality(qualityRangeMin, qualityRangeMax);
      console.log('QC by quality response:', response);
      
      // Handle different response formats
      let chunks: FailedChunk[] = [];
      if (Array.isArray(response)) {
        chunks = response;
      } else if (response && response.chunks && Array.isArray(response.chunks)) {
        chunks = response.chunks;
      } else if (response && response.data && Array.isArray(response.data)) {
        chunks = response.data;
      } else if (response && response.failed_chunks && Array.isArray(response.failed_chunks)) {
        chunks = response.failed_chunks;
      }
      
      setFilteredChunks(chunks);
      setShowFilteredResults(true);
    } catch (err: any) {
      console.error('Failed to fetch QC chunks by quality range:', err);
      const errorMsg = err?.message || 'Unknown error';
      setError(errorMsg.includes('TAMS API error') ? errorMsg : `TAMS API error: ${errorMsg}`);
      setFilteredChunks([]);
    } finally {
      setFilterLoading(false);
    }
  };

  // Calculate percentages
  const passRate = stats && stats.total_chunks_analyzed > 0
    ? (stats.passed_chunks / stats.total_chunks_analyzed) * 100
    : 0;

  const failRate = stats && stats.total_chunks_analyzed > 0
    ? (stats.failed_chunks / stats.total_chunks_analyzed) * 100
    : 0;

  const getQualityColor = (score: number): string => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'blue';
    if (score >= 50) return 'yellow';
    return 'red';
  };

  const getQualityLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Box>
            <Title order={2}>QC Statistics</Title>
            <Text c="dimmed" size="sm" mt="xs">
              Quality control metrics and analysis for media content
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
            title="About QC Statistics"
            color="blue"
            variant="light"
            onClose={() => setShowInfoBox(false)}
            withCloseButton
          >
            <Text size="sm">
              Quality Control (QC) statistics show analysis results for media content, including quality scores,
              blur detection, and pass/fail verdicts. This helps identify quality issues and track content quality over time.
            </Text>
          </Alert>
        </Collapse>

        {/* Quality Range Filter */}
        <Card withBorder p="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={4}>Filter by Quality Range</Title>
              <IconFilter size={20} />
            </Group>
            <Text size="sm" c="dimmed">
              Filter QC chunks by quality score range (0-100)
            </Text>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <NumberInput
                  label="Minimum Quality Score"
                  placeholder="0"
                  min={0}
                  max={100}
                  value={qualityRangeMin}
                  onChange={(value) => setQualityRangeMin(typeof value === 'number' ? value : 0)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <NumberInput
                  label="Maximum Quality Score"
                  placeholder="100"
                  min={0}
                  max={100}
                  value={qualityRangeMax}
                  onChange={(value) => setQualityRangeMax(typeof value === 'number' ? value : 100)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Box style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                  <Button
                    fullWidth
                    leftSection={<IconFilter size={16} />}
                    onClick={handleQualityRangeFilter}
                    loading={filterLoading}
                  >
                    Apply Filter
                  </Button>
                </Box>
              </Grid.Col>
            </Grid>
            {showFilteredResults && (
              <Alert color="blue" variant="light">
                Found {filteredChunks.length} chunk{filteredChunks.length !== 1 ? 's' : ''} with quality scores between {qualityRangeMin} and {qualityRangeMax}
              </Alert>
            )}
          </Stack>
        </Card>

        {/* Error State */}
        {error && !loading && (
          <Alert icon={<IconInfoCircle size={16} />} color="yellow" title="QC Data Unavailable">
            {error}
            <Text size="sm" mt="xs" c="dimmed">
              QC statistics are generated when quality control analysis is performed on media flows.
            </Text>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box ta="center" py="xl">
            <Loader size="lg" />
            <Text mt="md" c="dimmed">Loading QC statistics...</Text>
          </Box>
        )}

        {/* QC Statistics Dashboard */}
        {!loading && stats && (
          <>
            {/* Overview Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
              <Card withBorder p="md">
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Videos Analyzed</Text>
                    <IconVideo size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
                  </Group>
                  <Text size="xl" fw={700}>{stats.total_videos_analyzed}</Text>
                </Stack>
              </Card>
              <Card withBorder p="md">
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Chunks Analyzed</Text>
                    <IconChartBar size={20} style={{ color: 'var(--mantine-color-purple-6)' }} />
                  </Group>
                  <Text size="xl" fw={700}>{stats.total_chunks_analyzed}</Text>
                </Stack>
              </Card>
              <Card withBorder p="md">
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Passed</Text>
                    <IconCheck size={20} style={{ color: 'var(--mantine-color-green-6)' }} />
                  </Group>
                  <Text size="xl" fw={700} c="green">{stats.passed_chunks}</Text>
                  <Text size="xs" c="dimmed">{passRate.toFixed(1)}% pass rate</Text>
                </Stack>
              </Card>
              <Card withBorder p="md">
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Failed</Text>
                    <IconX size={20} style={{ color: 'var(--mantine-color-red-6)' }} />
                  </Group>
                  <Text size="xl" fw={700} c="red">{stats.failed_chunks}</Text>
                  <Text size="xs" c="dimmed">{failRate.toFixed(1)}% fail rate</Text>
                </Stack>
              </Card>
            </SimpleGrid>

            {/* Quality Score and Distribution */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              {/* Average Quality Score */}
              <Card withBorder p="md">
                <Stack gap="md">
                  <Title order={4}>Average Quality Score</Title>
                  <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <RingProgress
                      size={200}
                      thickness={16}
                      sections={[
                        { value: stats.average_quality_score, color: getQualityColor(stats.average_quality_score) }
                      ]}
                      label={
                        <Text ta="center" size="xl" fw={700}>
                          {stats.average_quality_score.toFixed(1)}
                        </Text>
                      }
                    />
                  </Box>
                  <Text ta="center" size="sm" c="dimmed">
                    {getQualityLabel(stats.average_quality_score)} Quality
                  </Text>
                </Stack>
              </Card>

              {/* Quality Distribution */}
              <Card withBorder p="md">
                <Stack gap="md">
                  <Title order={4}>Quality Distribution</Title>
                  <Stack gap="sm">
                    <Box>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>Excellent (≥90)</Text>
                        <Badge color="green">{stats.quality_distribution.excellent}</Badge>
                      </Group>
                      <Progress
                        value={(stats.quality_distribution.excellent / stats.total_chunks_analyzed) * 100}
                        color="green"
                        size="lg"
                      />
                    </Box>
                    <Box>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>Good (70-89)</Text>
                        <Badge color="blue">{stats.quality_distribution.good}</Badge>
                      </Group>
                      <Progress
                        value={(stats.quality_distribution.good / stats.total_chunks_analyzed) * 100}
                        color="blue"
                        size="lg"
                      />
                    </Box>
                    <Box>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>Fair (50-69)</Text>
                        <Badge color="yellow">{stats.quality_distribution.fair}</Badge>
                      </Group>
                      <Progress
                        value={(stats.quality_distribution.fair / stats.total_chunks_analyzed) * 100}
                        color="yellow"
                        size="lg"
                      />
                    </Box>
                    <Box>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>Poor (&lt;50)</Text>
                        <Badge color="red">{stats.quality_distribution.poor}</Badge>
                      </Group>
                      <Progress
                        value={(stats.quality_distribution.poor / stats.total_chunks_analyzed) * 100}
                        color="red"
                        size="lg"
                      />
                    </Box>
                  </Stack>
                </Stack>
              </Card>
            </SimpleGrid>

            {/* Blur Types Analysis */}
            {stats.blur_types && Object.keys(stats.blur_types).length > 0 && (
              <Card withBorder p="md">
                <Stack gap="md">
                  <Title order={4}>Blur Type Distribution</Title>
                  <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                    {Object.entries(stats.blur_types).map(([blurType, count]) => (
                      <Paper key={blurType} p="sm" withBorder>
                        <Stack gap="xs">
                          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                            {blurType === 'unknown' ? 'Unknown' : blurType}
                          </Text>
                          <Text size="lg" fw={700}>{count}</Text>
                        </Stack>
                      </Paper>
                    ))}
                  </SimpleGrid>
                </Stack>
              </Card>
            )}

            {/* Filtered Chunks by Quality Range */}
            {showFilteredResults && filteredChunks.length > 0 && (
              <Card withBorder p="md">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Title order={4}>
                      Chunks with Quality Score {qualityRangeMin}-{qualityRangeMax}
                    </Title>
                    <Group gap="xs">
                      <Badge color="blue" variant="light">
                        {filteredChunks.length} chunk{filteredChunks.length !== 1 ? 's' : ''}
                      </Badge>
                      <Button
                        variant="subtle"
                        size="xs"
                        onClick={() => setShowFilteredResults(false)}
                      >
                        Clear Filter
                      </Button>
                    </Group>
                  </Group>
                  <Table.ScrollContainer minWidth={600}>
                    <Table highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Flow ID</Table.Th>
                          <Table.Th>Quality Score</Table.Th>
                          <Table.Th>Quality Verdict</Table.Th>
                          <Table.Th>Blur Type</Table.Th>
                          <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {filteredChunks.slice(0, 20).map((chunk, i) => (
                          <Table.Tr key={chunk.id || i}>
                            <Table.Td>
                              {chunk.flow_id ? (
                                <Button
                                  variant="subtle"
                                  size="xs"
                                  rightSection={<IconArrowRight size={12} />}
                                  onClick={() => navigate(`/flow-details/${chunk.flow_id}`)}
                                >
                                  {chunk.flow_id.substring(0, 30)}...
                                </Button>
                              ) : (
                                <Text size="sm" c="dimmed">—</Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              {chunk.tags?.quality_score ? (
                                <Badge color={getQualityColor(parseFloat(chunk.tags.quality_score))}>
                                  {parseFloat(chunk.tags.quality_score).toFixed(1)}
                                </Badge>
                              ) : (
                                <Text size="sm" c="dimmed">—</Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              {chunk.tags?.quality_verdict ? (
                                <Badge 
                                  color={chunk.tags.quality_verdict === 'PASS' ? 'green' : 'red'}
                                  variant="light"
                                >
                                  {chunk.tags.quality_verdict}
                                </Badge>
                              ) : (
                                <Text size="sm" c="dimmed">—</Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              {chunk.tags?.blur_type ? (
                                <Badge variant="light" color="orange">
                                  {chunk.tags.blur_type}
                                </Badge>
                              ) : (
                                <Text size="sm" c="dimmed">—</Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              {chunk.flow_id && (
                                <Button
                                  variant="light"
                                  size="xs"
                                  leftSection={<IconEye size={14} />}
                                  onClick={() => navigate(`/flow-details/${chunk.flow_id}`)}
                                >
                                  View Flow
                                </Button>
                              )}
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                  {filteredChunks.length > 20 && (
                    <Text size="sm" c="dimmed" ta="center">
                      Showing first 20 of {filteredChunks.length} results
                    </Text>
                  )}
                </Stack>
              </Card>
            )}

            {/* Failed Chunks */}
            {!showFilteredResults && failedChunks.length > 0 && (
              <Card withBorder p="md">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Title order={4}>Recent Failed Chunks</Title>
                    <Badge color="red" variant="light">
                      {failedChunks.length} failed
                    </Badge>
                  </Group>
                  <Table.ScrollContainer minWidth={600}>
                    <Table highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Flow ID</Table.Th>
                          <Table.Th>Quality Score</Table.Th>
                          <Table.Th>Blur Type</Table.Th>
                          <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {failedChunks.slice(0, 10).map((chunk, i) => (
                          <Table.Tr key={chunk.id || i}>
                            <Table.Td>
                              {chunk.flow_id ? (
                                <Button
                                  variant="subtle"
                                  size="xs"
                                  rightSection={<IconArrowRight size={12} />}
                                  onClick={() => navigate(`/flow-details/${chunk.flow_id}`)}
                                >
                                  {chunk.flow_id.substring(0, 30)}...
                                </Button>
                              ) : (
                                <Text size="sm" c="dimmed">—</Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              {chunk.tags?.quality_score ? (
                                <Badge color={getQualityColor(parseFloat(chunk.tags.quality_score))}>
                                  {parseFloat(chunk.tags.quality_score).toFixed(1)}
                                </Badge>
                              ) : (
                                <Text size="sm" c="dimmed">—</Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              {chunk.tags?.blur_type ? (
                                <Badge variant="light" color="orange">
                                  {chunk.tags.blur_type}
                                </Badge>
                              ) : (
                                <Text size="sm" c="dimmed">—</Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              {chunk.flow_id && (
                                <Button
                                  variant="light"
                                  size="xs"
                                  leftSection={<IconEye size={14} />}
                                  onClick={() => navigate(`/flow-details/${chunk.flow_id}`)}
                                >
                                  View Flow
                                </Button>
                              )}
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                </Stack>
              </Card>
            )}
          </>
        )}

        {/* Placeholder when no data */}
        {!loading && !stats && !error && (
          <Paper p="xl" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
            <Stack align="center" gap="md">
              <IconChartBar size={48} style={{ color: 'var(--mantine-color-gray-5)' }} />
              <Text c="dimmed" ta="center">
                No QC statistics available yet.
                <br />
                Quality control data will appear here once analysis has been performed on media flows.
              </Text>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}

