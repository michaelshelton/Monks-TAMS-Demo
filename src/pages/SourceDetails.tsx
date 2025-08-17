import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Group,
  Badge,
  Button,
  Stack,
  Card,
  Grid,
  Tabs,
  Alert,
  Loader,
  Box,
  Paper,
  Divider,
  ActionIcon,
  Tooltip,
  Breadcrumbs,
  Anchor
} from '@mantine/core';
import {
  IconArrowLeft,
  IconActivity,
  IconVideo,
  IconMusic,
  IconDatabase,
  IconPhoto,
  IconTags,
  IconSettings,
  IconChartBar,
  IconHeart,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconAlertCircle,
  IconInfoCircle,
  IconCalendar,
  IconMapPin,
  IconNetwork,
  IconGauge
} from '@tabler/icons-react';
import { SourceHealthMonitor } from '../components/SourceHealthMonitor';
import { SourceConfigManager } from '../components/SourceConfigManager';
import { EnhancedDeleteModal, DeleteOptions } from '../components/EnhancedDeleteModal';
import { apiClient } from '../services/api';
import { getSource } from '../services/bbcTamsApi';

// Football-specific metadata interface
interface FootballGameMetadata {
  sport: string;
  league: string;
  venue: string;
  season: string;
  homeTeam?: string;
  awayTeam?: string;
  gameDate?: string;
  score?: string;
  duration?: string;
  highlights?: string[];
}

// Enhanced Source interface with football metadata
interface Source {
  id: string;
  format: string;
  label?: string;
  description?: string;
  created_by?: string;
  updated_by?: string;
  created?: string;
  updated?: string;
  tags?: Record<string, string>;
  source_collection?: Array<{ id: string; label?: string }>;
  collected_by?: string[];
  // New soft delete fields for backend v6.0
  deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
  // Football-specific metadata
  footballMetadata?: FootballGameMetadata;
}

export default function SourceDetails() {
  const { sourceId } = useParams<{ sourceId: string }>();
  const navigate = useNavigate();
  const [source, setSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'analytics' | 'configuration' | 'history'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [disabled, setDisabled] = useState(false);

  // Load source data
  useEffect(() => {
    if (sourceId) {
      loadSource();
    }
  }, [sourceId]);

  const loadSource = async () => {
    if (!sourceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try BBC TAMS API first
      const sourceData = await getSource(sourceId);
      setSource(sourceData);
    } catch (err) {
      console.error('BBC TAMS API error:', err);
      
      // Fallback to mock data for demo
      const mockSource: Source = {
        id: sourceId,
        format: 'urn:x-nmos:format:video',
        label: 'Manchester United vs Arsenal - Premier League 2024',
        description: 'Live broadcast of the Premier League match between Manchester United and Arsenal',
        created_by: 'admin',
        updated_by: 'admin',
        created: '2024-01-15T10:00:00Z',
        updated: '2024-01-15T10:00:00Z',
        tags: {
          sport: 'football',
          league: 'Premier League',
          venue: 'Old Trafford',
          season: '2024',
          priority: 'high',
          quality: '4K'
        },
        footballMetadata: {
          sport: 'football',
          league: 'Premier League',
          venue: 'Old Trafford',
          season: '2024',
          homeTeam: 'Manchester United',
          awayTeam: 'Arsenal',
          gameDate: '2024-01-15',
          score: '2-1',
          duration: '90 minutes',
          highlights: [
            'Opening goal by Rashford (15\')',
            'Equalizer by Saka (45\')',
            'Winning goal by Fernandes (78\')'
          ]
        }
      };
      
      setSource(mockSource);
      setError('BBC TAMS API unavailable, using demo data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (options: DeleteOptions) => {
    if (!source) return;
    
    try {
      setLoading(true);
      await apiClient.deleteSource(source.id, options);
      navigate('/sources');
    } catch (err) {
      console.error('Failed to delete source:', err);
      setError('Failed to delete source');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const getFormatLabel = (format: string) => {
    const formatMap: Record<string, string> = {
      'urn:x-nmos:format:video': 'Video',
      'urn:x-nmos:format:audio': 'Audio',
      'urn:x-nmos:format:data': 'Data',
      'urn:x-tam:format:image': 'Image'
    };
    return formatMap[format] || format;
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'urn:x-nmos:format:video': return <IconVideo size={20} color="#228be6" />;
      case 'urn:x-nmos:format:audio': return <IconMusic size={20} color="#40c057" />;
      case 'urn:x-nmos:format:data': return <IconDatabase size={20} color="#fd7e14" />;
      case 'urn:x-tam:format:image': return <IconPhoto size={20} color="#7950f2" />;
      default: return <IconDatabase size={20} color="#868e96" />;
    }
  };

  const getStatusColor = (deleted?: boolean) => {
    return deleted ? 'red' : 'green';
  };

  if (loading) {
    return (
      <Container size="xl" px="xl" py="xl">
        <Stack gap="xl" align="center" py="xl">
          <Loader size="lg" />
          <Text size="lg" c="dimmed">Loading source details...</Text>
        </Stack>
      </Container>
    );
  }

  if (!source) {
    return (
      <Container size="xl" px="xl" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Source Not Found">
          The requested source could not be found. Please check the source ID and try again.
        </Alert>
      </Container>
    );
  }

  const breadcrumbs = [
    { title: 'Sources', href: '/sources' },
    { title: source.label || 'Source Details', href: '#' }
  ];

  return (
    <Container size="xl" px="xl" py="xl">
      {/* Breadcrumbs */}
      <Breadcrumbs mb="lg">
        {breadcrumbs.map((item, index) => (
          <Anchor
            key={index}
            href={item.href}
            onClick={(e) => {
              if (index < breadcrumbs.length - 1) {
                e.preventDefault();
                navigate(item.href);
              }
            }}
            c={index === breadcrumbs.length - 1 ? 'dimmed' : 'blue'}
          >
            {item.title}
          </Anchor>
        ))}
      </Breadcrumbs>

      {/* Header */}
      <Group justify="space-between" align="flex-start" mb="lg">
        <Box>
          <Group gap="sm" align="center" mb="xs">
            {getFormatIcon(source.format)}
            <Title order={2}>{source.label || 'Unnamed Source'}</Title>
            <Badge 
              variant="light" 
              color={getStatusColor(source.deleted)}
              size="lg"
            >
              {source.deleted ? 'Deleted' : 'Active'}
            </Badge>
          </Group>
          <Text c="dimmed" size="sm" mb="xs">
            {source.description || 'No description available'}
          </Text>
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              ID: {source.id}
            </Text>
            {source.created && (
              <Text size="xs" c="dimmed">
                Created: {new Date(source.created).toLocaleDateString()}
              </Text>
            )}
            {source.updated && (
              <Text size="xs" c="dimmed">
                Updated: {new Date(source.updated).toLocaleDateString()}
              </Text>
            )}
          </Group>
        </Box>
        
        <Group gap="xs">
          <Button
            variant="light"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/sources')}
          >
            Back to Sources
          </Button>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={loadSource}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            variant="light"
            leftSection={<IconEdit size={16} />}
            onClick={() => {/* TODO: Implement edit */}}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={() => setShowDeleteModal(true)}
          >
            Delete
          </Button>
        </Group>
      </Group>

      {/* Error Alert */}
      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          color="red" 
          title="Error"
          withCloseButton
          onClose={() => setError(null)}
          mb="lg"
        >
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value as any)}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconInfoCircle size={16} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="health" leftSection={<IconHeart size={16} />}>
            Health & Performance
          </Tabs.Tab>
          <Tabs.Tab value="analytics" leftSection={<IconChartBar size={16} />}>
            Analytics
          </Tabs.Tab>
          <Tabs.Tab value="configuration" leftSection={<IconSettings size={16} />}>
            Configuration
          </Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconCalendar size={16} />}>
            History
          </Tabs.Tab>
        </Tabs.List>

        {/* Overview Tab */}
        <Tabs.Panel value="overview" pt="xl">
          <Stack gap="xl">
            {/* Basic Information */}
            <Card withBorder>
              <Title order={4} mb="md">Basic Information</Title>
              <Grid>
                <Grid.Col span={6}>
                  <Stack gap="md">
                    <Box>
                      <Text size="sm" fw={500} c="dimmed">Format</Text>
                      <Group gap="sm">
                        {getFormatIcon(source.format)}
                        <Text>{getFormatLabel(source.format)}</Text>
                      </Group>
                    </Box>
                    <Box>
                      <Text size="sm" fw={500} c="dimmed">Status</Text>
                      <Badge 
                        variant="light" 
                        color={getStatusColor(source.deleted)}
                        size="lg"
                      >
                        {source.deleted ? 'Deleted' : 'Active'}
                      </Badge>
                    </Box>
                    <Box>
                      <Text size="sm" fw={500} c="dimmed">Created By</Text>
                      <Text>{source.created_by || 'Unknown'}</Text>
                    </Box>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Stack gap="md">
                    <Box>
                      <Text size="sm" fw={500} c="dimmed">Updated By</Text>
                      <Text>{source.updated_by || 'Never'}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" fw={500} c="dimmed">Created Date</Text>
                      <Text>{source.created ? new Date(source.created).toLocaleString() : 'Unknown'}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" fw={500} c="dimmed">Last Updated</Text>
                      <Text>{source.updated ? new Date(source.updated).toLocaleString() : 'Never'}</Text>
                    </Box>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card>

            {/* Football Metadata */}
            {source.footballMetadata && (
              <Card withBorder>
                <Title order={4} mb="md">Game Information</Title>
                <Grid>
                  <Grid.Col span={6}>
                    <Stack gap="md">
                      <Box>
                        <Group gap="xs" mb={4}>
                          <IconActivity size={16} />
                          <Text size="sm" fw={500}>Teams</Text>
                        </Group>
                        <Group gap="md">
                          <Badge size="lg" variant="light" color="red">
                            {source.footballMetadata.homeTeam}
                          </Badge>
                          <Text size="lg" fw={700}>vs</Text>
                          <Badge size="lg" variant="light" color="blue">
                            {source.footballMetadata.awayTeam}
                          </Badge>
                        </Group>
                      </Box>
                      <Box>
                        <Group gap="xs" mb={4}>
                          <IconCalendar size={16} />
                          <Text size="sm" fw={500}>Game Date</Text>
                        </Group>
                        <Text>{source.footballMetadata.gameDate}</Text>
                      </Box>
                      <Box>
                        <Group gap="xs" mb={4}>
                          <IconMapPin size={16} />
                          <Text size="sm" fw={500}>Venue</Text>
                        </Group>
                        <Text>{source.footballMetadata.venue}</Text>
                      </Box>
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Stack gap="md">
                      <Box>
                        <Group gap="xs" mb={4}>
                          <IconActivity size={16} />
                          <Text size="sm" fw={500}>Score</Text>
                        </Group>
                        <Text size="xl" fw={700} c="green">
                          {source.footballMetadata.score}
                        </Text>
                      </Box>
                      <Box>
                        <Group gap="xs" mb={4}>
                          <IconGauge size={16} />
                          <Text size="sm" fw={500}>Duration</Text>
                        </Group>
                        <Text>{source.footballMetadata.duration}</Text>
                      </Box>
                      <Box>
                        <Group gap="xs" mb={4}>
                          <IconActivity size={16} />
                          <Text size="sm" fw={500}>League & Season</Text>
                        </Group>
                        <Group gap="md">
                          <Badge size="md" variant="light" color="green">
                            {source.footballMetadata.league}
                          </Badge>
                          <Badge size="md" variant="light" color="blue">
                            Season {source.footballMetadata.season}
                          </Badge>
                        </Group>
                      </Box>
                    </Stack>
                  </Grid.Col>
                </Grid>

                {/* Highlights */}
                {source.footballMetadata.highlights && source.footballMetadata.highlights.length > 0 && (
                  <Box mt="lg">
                    <Text fw={500} mb="md">Key Highlights</Text>
                    <Grid>
                      {source.footballMetadata.highlights.map((highlight, index) => (
                        <Grid.Col key={index} span={4}>
                          <Paper withBorder p="md" ta="center">
                            <Text size="sm" fw={500} c="dimmed">Highlight {index + 1}</Text>
                            <Text>{highlight}</Text>
                          </Paper>
                        </Grid.Col>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Card>
            )}

            {/* Tags */}
            {source.tags && Object.keys(source.tags).length > 0 && (
              <Card withBorder>
                <Title order={4} mb="md">Tags & Metadata</Title>
                <Group gap="xs" wrap="wrap">
                  {Object.entries(source.tags).map(([key, value]) => (
                    <Badge key={key} size="lg" variant="light" color="blue">
                      {key}: {value}
                    </Badge>
                  ))}
                </Group>
              </Card>
            )}

            {/* Source Collection */}
            {source.source_collection && source.source_collection.length > 0 && (
              <Card withBorder>
                <Title order={4} mb="md">Source Collection</Title>
                <Stack gap="md">
                  {source.source_collection.map((collection) => (
                    <Paper key={collection.id} withBorder p="md">
                      <Group justify="space-between">
                        <Box>
                          <Text fw={500}>{collection.label || 'Unnamed Collection'}</Text>
                          <Text size="sm" c="dimmed">ID: {collection.id}</Text>
                        </Box>
                        <Button variant="light" size="sm">
                          View Collection
                        </Button>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Card>
            )}
          </Stack>
        </Tabs.Panel>

        {/* Health Tab */}
        <Tabs.Panel value="health" pt="xl">
          <Stack gap="xl">
            <SourceHealthMonitor 
              sourceId={sourceId || ''}
              autoRefresh={true}
              refreshInterval={7200000}
            />
          </Stack>
        </Tabs.Panel>

        {/* Analytics Tab */}
        <Tabs.Panel value="analytics" pt="xl">
          <Stack gap="xl">
            <Card withBorder>
              <Stack gap="md" align="center" py="xl">
                <IconChartBar size={64} color="#ccc" />
                <Title order={4} c="dimmed">Source Analytics</Title>
                <Text size="lg" c="dimmed" ta="center">
                  Comprehensive analytics and performance metrics for this source
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  This feature will provide detailed usage statistics, performance analysis, 
                  and trend data when the analytics API endpoints are implemented.
                </Text>
              </Stack>
            </Card>
          </Stack>
        </Tabs.Panel>

        {/* Configuration Tab */}
        <Tabs.Panel value="configuration" pt="xl">
          <Stack gap="xl">
            <SourceConfigManager 
              sourceId={sourceId || ''}
              onConfigChange={(config) => {
                console.log('Source configuration updated:', config);
                // In a real implementation, this would update the source
              }}
            />
          </Stack>
        </Tabs.Panel>

        {/* History Tab */}
        <Tabs.Panel value="history" pt="xl">
          <Stack gap="xl">
            <Card withBorder>
              <Stack gap="md" align="center" py="xl">
                <IconCalendar size={64} color="#ccc" />
                <Title order={4} c="dimmed">Source History</Title>
                <Text size="lg" c="dimmed" ta="center">
                  Complete history and audit trail for this source
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  This feature will show the complete history of changes, 
                  modifications, and events related to this source when the history API is implemented.
                </Text>
              </Stack>
            </Card>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Delete Confirmation Modal */}
      <EnhancedDeleteModal
        opened={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Source"
        itemName={source.label || 'Unnamed Source'}
        itemType="source"
        showCascadeOption={true}
        defaultDeletedBy="admin"
      />
    </Container>
  );
}
