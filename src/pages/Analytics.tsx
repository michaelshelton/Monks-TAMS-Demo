
import { useState, useEffect } from 'react';
import { 
  Container, 
  Title, 
  Card, 
  SimpleGrid, 
  Text, 
  Group, 
  Badge, 
  Box,
  Select,
  Stack,
  Progress,
  Table,
  ActionIcon,
  Button,
  Alert,
  Loader,
  Divider
} from '@mantine/core';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';
import { 
  IconTrendingUp, 
  IconUsers, 
  IconClock, 
  IconActivity,
  IconDatabase,
  IconVideo,
  IconMusic,
  IconPhoto,
  IconRefresh,
  IconDownload,
  IconEye,
  IconQrcode,
  IconDeviceMobile,
  IconAlertCircle,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { apiClient, BBCApiOptions, BBCApiResponse, BBCPaginationMeta } from '../services/api';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  ChartTitle, 
  Tooltip, 
  Legend
);



// Mock analytics data for overall application
const mockFlowUsageData = {
  labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
  datasets: [
    {
      label: 'Video Flows',
      data: [45, 52, 68, 89, 95, 78, 62],
      borderColor: '#228be6',
      backgroundColor: 'rgba(34, 139, 230, 0.1)',
      tension: 0.4,
      borderWidth: 3,
    },
    {
      label: 'Audio Flows',
      data: [23, 28, 35, 42, 38, 31, 25],
      borderColor: '#40c057',
      backgroundColor: 'rgba(64, 192, 87, 0.1)',
      tension: 0.4,
      borderWidth: 3,
    },
    {
      label: 'Image Flows',
      data: [12, 15, 18, 22, 19, 16, 14],
      borderColor: '#fd7e14',
      backgroundColor: 'rgba(253, 126, 20, 0.1)',
      tension: 0.4,
      borderWidth: 3,
    }
  ],
};

const mockStorageUsageData = {
  labels: ['Video', 'Audio', 'Image', 'Data', 'Metadata'],
  datasets: [
    {
      data: [65, 20, 10, 3, 2],
      backgroundColor: [
        '#228be6',
        '#40c057', 
        '#fd7e14',
        '#fa5252',
        '#7950f2'
      ],
      borderWidth: 2,
      borderColor: '#ffffff',
    },
  ],
};

const mockVideoCompilationData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Video Compilations',
      data: [12, 19, 15, 25, 22, 18, 14],
      backgroundColor: '#228be6',
      borderColor: '#228be6',
      borderWidth: 1,
    },
  ],
};

const mockQRCodeUsageData = {
  labels: ['Mobile', 'Desktop', 'Tablet'],
  datasets: [
    {
      data: [75, 20, 5],
      backgroundColor: [
        '#40c057',
        '#228be6', 
        '#fd7e14'
      ],
      borderWidth: 2,
      borderColor: '#ffffff',
    },
  ],
};



const mockTopFlows = [
  {
    id: '1',
    name: 'BBC News Studio',
    type: 'Video',
    views: 1247,
    duration: '24h',
    storage: '2.3 GB',
    growth: '+15%'
  },
  {
    id: '2', 
    name: 'Sports Arena Camera',
    type: 'Video',
    views: 2156,
    duration: '8h',
    storage: '4.1 GB',
    growth: '+8%'
  },
  {
    id: '3',
    name: 'Radio Studio A',
    type: 'Audio',
    views: 892,
    duration: '12h',
    storage: '1.2 GB',
    growth: '+12%'
  },
  {
    id: '4',
    name: 'Photo Studio Feed',
    type: 'Image',
    views: 567,
    duration: '6h',
    storage: '0.8 GB',
    growth: '+5%'
  }
];

const mockRecentCompilations = [
  {
    id: 'comp_1',
    name: 'News Highlights Compilation',
    segments: 5,
    duration: '2m 30s',
    views: 156,
    qrScans: 23,
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'comp_2',
    name: 'Sports Reel Compilation',
    segments: 8,
    duration: '4m 15s',
    views: 89,
    qrScans: 12,
    createdAt: '2024-01-15T09:15:00Z'
  },
  {
    id: 'comp_3',
    name: 'Event Coverage Compilation',
    segments: 3,
    duration: '1m 45s',
    views: 234,
    qrScans: 45,
    createdAt: '2024-01-15T08:45:00Z'
  }
];

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      labels: { 
        color: '#333333',
        font: { size: 14 },
        padding: 20,
      },
    },
    title: {
      display: false,
    },
  },
  scales: {
    x: { 
      ticks: { color: '#545b64', font: { size: 12 } }, 
      grid: { color: '#E5E7EB', drawBorder: false } 
    },
    y: { 
      ticks: { color: '#545b64', font: { size: 12 } }, 
      grid: { color: '#E5E7EB', drawBorder: false } 
    },
  },
  elements: {
    point: {
      hoverRadius: 8,
    },
  },
};

const doughnutOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { 
        color: '#333333',
        font: { size: 12 },
        padding: 15,
      },
    },
  },
};

const barOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: { 
      ticks: { color: '#545b64', font: { size: 12 } }, 
      grid: { color: '#E5E7EB', drawBorder: false } 
    },
    y: { 
      ticks: { color: '#545b64', font: { size: 12 } }, 
      grid: { color: '#E5E7EB', drawBorder: false } 
    },
  },
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'Video': return <IconVideo size={16} />;
    case 'Audio': return <IconMusic size={16} />;
    case 'Image': return <IconPhoto size={16} />;
    default: return <IconDatabase size={16} />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'Video': return 'blue';
    case 'Audio': return 'green';
    case 'Image': return 'orange';
    default: return 'gray';
  }
};

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flowUsageData, setFlowUsageData] = useState<any>(null);
  const [storageUsageData, setStorageUsageData] = useState<any>(null);
  const [timeRangeData, setTimeRangeData] = useState<any>(null);
  const [topFlows, setTopFlows] = useState<any[]>([]);
  const [recentCompilations, setRecentCompilations] = useState<any[]>([]);
  
  // BBC TAMS API state
  const [bbcPagination, setBbcPagination] = useState<BBCPaginationMeta>({});
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);

  // Fetch analytics data using VAST TAMS API
  const fetchAnalyticsDataVastTams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching analytics from VAST TAMS API...');
      
      // Fetch all analytics data in parallel
      const [flowUsage, storageUsage, timeRange] = await Promise.all([
        apiClient.getFlowUsageAnalytics().catch(err => {
          console.warn('Flow usage analytics not available:', err);
          return null;
        }),
        apiClient.getStorageUsageAnalytics().catch(err => {
          console.warn('Storage usage analytics not available:', err);
          return null;
        }),
        apiClient.getTimeRangeAnalytics().catch(err => {
          console.warn('Time range analytics not available:', err);
          return null;
        })
      ]);
      
      console.log('VAST TAMS Analytics API responses:', { flowUsage, storageUsage, timeRange });
      
      setFlowUsageData(flowUsage);
      setStorageUsageData(storageUsage);
      setTimeRangeData(timeRange);
      
      // Check if any analytics endpoints are available
      if (!flowUsage && !storageUsage && !timeRange) {
        setError('VAST TAMS analytics endpoints are not available yet. The backend is still being configured.');
      }
      
      // For now, we'll use mock data for top flows and recent compilations
      // since these endpoints don't exist yet
      setTopFlows(mockTopFlows);
      setRecentCompilations(mockRecentCompilations);
      
    } catch (err: any) {
      console.error('VAST TAMS Analytics API error:', err);
      
      // Set appropriate error message based on error type
      if (err?.message?.includes('500') || err?.message?.includes('Internal Server Error')) {
        setError('VAST TAMS backend temporarily unavailable - please try again later');
      } else if (err?.message?.includes('Network') || err?.message?.includes('fetch') || err?.message?.includes('CORS')) {
        setError('Network connection issue - please check your connection and try again');
      } else if (err?.message?.includes('404')) {
        setError('VAST TAMS analytics endpoints not found - please check backend configuration');
      } else {
        setError(`VAST TAMS analytics error: ${err?.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics data on component mount
  useEffect(() => {
    fetchAnalyticsDataVastTams();
  }, []);

  // Prepare chart data from API or fall back to mock data
  const chartData = {
    flowUsage: flowUsageData ? {
      labels: flowUsageData.labels || mockFlowUsageData.labels,
      datasets: flowUsageData.datasets || mockFlowUsageData.datasets
    } : mockFlowUsageData,
    storageUsage: storageUsageData ? {
      labels: storageUsageData.labels || mockStorageUsageData.labels,
      datasets: storageUsageData.datasets || mockStorageUsageData.datasets
    } : mockStorageUsageData,
    videoCompilation: timeRangeData ? {
      labels: timeRangeData.labels || mockVideoCompilationData.labels,
      datasets: timeRangeData.datasets || mockVideoCompilationData.datasets
    } : mockVideoCompilationData,
    qrCodeUsage: mockQRCodeUsageData // No API endpoint for this yet
  };

  // Update table data to use state variables
  const flowRows = topFlows.map((flow) => (
    <Table.Tr key={flow.id}>
      <Table.Td>
        <Group gap="xs">
          {getTypeIcon(flow.type)}
          <Text fw={600}>{flow.name}</Text>
        </Group>
      </Table.Td>
      
      <Table.Td>
        <Badge color={getTypeColor(flow.type)} variant="light">
          {flow.type}
        </Badge>
      </Table.Td>
      
      <Table.Td>
        <Text>{flow.views.toLocaleString()}</Text>
      </Table.Td>
      
      <Table.Td>
        <Text>{flow.duration}</Text>
      </Table.Td>
      
      <Table.Td>
        <Text>{flow.storage}</Text>
      </Table.Td>
      
      <Table.Td>
        <Badge 
          color={flow.growth.startsWith('+') ? 'green' : 'red'} 
          variant="light"
        >
          {flow.growth}
        </Badge>
      </Table.Td>
      
      <Table.Td>
        <Group gap="xs">
          <ActionIcon size="sm" variant="subtle">
            <IconEye size={16} />
          </ActionIcon>
          <ActionIcon size="sm" variant="subtle">
            <IconDownload size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  const compilationRows = recentCompilations.map((comp) => (
    <Table.Tr key={comp.id}>
      <Table.Td>
        <Text fw={600}>{comp.name}</Text>
      </Table.Td>
      
      <Table.Td>
        <Text>{comp.segments}</Text>
      </Table.Td>
      
      <Table.Td>
        <Text>{comp.duration}</Text>
      </Table.Td>
      
      <Table.Td>
        <Text>{comp.views}</Text>
      </Table.Td>
      
      <Table.Td>
        <Text>{comp.qrScans}</Text>
      </Table.Td>
      
      <Table.Td>
        <Text size="sm" c="dimmed">
          {new Date(comp.createdAt).toLocaleDateString()}
        </Text>
      </Table.Td>
      
      <Table.Td>
        <Group gap="xs">
          <ActionIcon size="sm" variant="subtle">
            <IconEye size={16} />
          </ActionIcon>
          <ActionIcon size="sm" variant="subtle">
            <IconQrcode size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  // Dynamic stats based on real data when available
  const stats = [
    {
      title: 'Total Flows',
      value: flowUsageData?.total_flows?.toString() || '12',
      change: '+12%',
      changeType: 'positive',
      icon: <IconActivity size={24} />,
      color: '#228be6',
    },
    {
      title: 'Active Segments',
      value: timeRangeData?.total_segments?.toString() || '3,247',
      change: '+8%',
      changeType: 'positive',
      icon: <IconUsers size={24} />,
      color: '#40c057',
    },
    {
      title: 'Storage Used',
      value: storageUsageData?.total_size_bytes ? 
        `${(storageUsageData.total_size_bytes / (1024 * 1024 * 1024)).toFixed(1)} GB` : '8.4 GB',
      change: '+15%',
      changeType: 'positive',
      icon: <IconDatabase size={24} />,
      color: '#fd7e14',
    },
    {
      title: 'Total Objects',
      value: storageUsageData?.total_objects?.toString() || '2,847',
      change: '+18%',
      changeType: 'positive',
      icon: <IconQrcode size={24} />,
      color: '#7950f2',
    },
  ];

  const handleRefresh = async () => {
    await fetchAnalyticsDataVastTams();
  };

  return (
    <Container size="xl" px="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Box>
          <Title order={2} className="dark-text-primary">Analytics Dashboard</Title>
          <Text c="dimmed" size="sm" mt="xs" className="dark-text-secondary">
            Monitor performance, compliance, and usage patterns across your VAST TAMS implementation
          </Text>
        </Box>
        <Group>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={() => {
              fetchAnalyticsDataVastTams();
              setError(null);
            }}
            loading={loading}
          >
            Refresh
          </Button>
        </Group>
      </Group>

      {/* Error Alert */}
      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          color={error.includes('not available yet') ? 'yellow' : 'red'} 
          title={error.includes('not available yet') ? 'VAST TAMS Backend Not Ready' : 'VAST TAMS Connection Error'}
          withCloseButton
          onClose={() => setError(null)}
          mb="md"
        >
          {error}
          {error.includes('not available yet') && (
            <Text size="sm" mt="xs">
              This page will work once the VAST TAMS backend analytics API is fully configured. 
              For now, you can use the Sources and Flows pages which are already working.
            </Text>
          )}
        </Alert>
      )}


      {/* Loading State */}
      {loading && (
        <Box ta="center" py="xl">
          <Loader size="lg" />
          <Text mt="md" c="dimmed">Loading VAST TAMS analytics data...</Text>
        </Box>
      )}

      {/* Main Content */}
      {loading ? (
        <Box ta="center" py="xl">
          <Loader size="lg" />
          <Text mt="md" c="dimmed">Loading VAST TAMS analytics data...</Text>
        </Box>
      ) : error ? (
        <Box ta="center" py="xl" c="red">
          {error}
        </Box>
      ) : (
        <>


          {/* Statistics */}
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl">
            {stats.map((stat, index) => (
              <Card key={index} withBorder p="xl">
                <Group justify="space-between" align="flex-start">
                  <Box>
                    <Text size="sm" c="dimmed" mb={8}>
                      {stat.title}
                    </Text>
                    <Title order={3}>
                      {stat.value}
                    </Title>
                    <Group gap="xs" mt="xs">
                      <Badge 
                        color={stat.changeType === 'positive' ? 'green' : 'red'} 
                        variant="light"
                      >
                        {stat.change}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        vs last period
                      </Text>
                    </Group>
                  </Box>
                  <Box 
                    style={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: 12,
                      background: `${stat.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: stat.color,
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Group>
              </Card>
            ))}
          </SimpleGrid>

          {/* Analytics Overview - No tabs needed, just show overview content */}

          {/* Charts Grid */}
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" mb="xl">
                {/* Flow Usage Chart */}
                <Card withBorder p="xl">
                  <Group justify="space-between" align="center" mb="lg">
                    <Box>
                      <Title order={4} mb="xs">
                        Flow Usage Over Time
                      </Title>
                      <Text size="sm" c="dimmed">
                        Active flows by type and time period
                      </Text>
                    </Box>
                    <Badge color={flowUsageData ? "green" : "blue"} variant="light">
                      <IconTrendingUp size={14} style={{ marginRight: 4 }} />
                      {flowUsageData ? "Live Data" : "Demo Data"}
                    </Badge>
                  </Group>
                  <Line data={chartData.flowUsage} options={chartOptions} />
                </Card>

                {/* Storage Usage Chart */}
                <Card withBorder p="xl">
                  <Group justify="space-between" align="center" mb="lg">
                    <Box>
                      <Title order={4} mb="xs">
                        Storage Usage Distribution
                      </Title>
                      <Text size="sm" c="dimmed">
                        Storage allocation by media type
                      </Text>
                    </Box>
                    <Badge color={storageUsageData ? "green" : "blue"} variant="light">
                      <IconDatabase size={14} style={{ marginRight: 4 }} />
                      {storageUsageData ? 
                        `${(storageUsageData.total_size_bytes / (1024 * 1024 * 1024)).toFixed(1)} GB Total` : 
                        "8.4 GB Total"
                      }
                    </Badge>
                  </Group>
                  <Doughnut data={chartData.storageUsage} options={doughnutOptions} />
                </Card>
              </SimpleGrid>

              {/* Video Compilation Analytics */}
              <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" mb="xl">
                {/* Video Compilation Chart */}
                <Card withBorder p="xl">
                  <Group justify="space-between" align="center" mb="lg">
                    <Box>
                      <Title order={4} mb="xs">
                        Video Compilations This Week
                      </Title>
                      <Text size="sm" c="dimmed">
                        Daily compilation activity
                      </Text>
                    </Box>
                    <Badge color={timeRangeData ? "green" : "orange"} variant="light">
                      <IconVideo size={14} style={{ marginRight: 4 }} />
                      {timeRangeData?.total_segments || "156"} Total
                    </Badge>
                  </Group>
                  <Bar data={chartData.videoCompilation} options={barOptions} />
                </Card>

                {/* QR Code Usage Chart */}
                <Card withBorder p="xl">
                  <Group justify="space-between" align="center" mb="lg">
                    <Box>
                      <Title order={4} mb="xs">
                        QR Code Access by Device
                      </Title>
                      <Text size="sm" c="dimmed">
                        Mobile vs desktop QR code usage
                      </Text>
                    </Box>
                    <Badge color="purple" variant="light">
                      <IconDeviceMobile size={14} style={{ marginRight: 4 }} />
                      2,847 Scans
                    </Badge>
                  </Group>
                  <Doughnut data={chartData.qrCodeUsage} options={doughnutOptions} />
                </Card>
              </SimpleGrid>

              {/* Top Performing Flows */}
              <Card withBorder p="xl" mb="xl">
                <Group justify="space-between" align="center" mb="lg">
                  <Box>
                    <Title order={4} mb="xs">
                      Top Performing Flows
                    </Title>
                    <Text size="sm" c="dimmed">
                      Most viewed and active media streams
                    </Text>
                  </Box>
                  <Button variant="light" size="sm">
                    View All
                  </Button>
                </Group>
                
                <Table striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Flow Name</Table.Th>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Views</Table.Th>
                      <Table.Th>Duration</Table.Th>
                      <Table.Th>Storage</Table.Th>
                      <Table.Th>Growth</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {flowRows}
                  </Table.Tbody>
                </Table>
              </Card>

              {/* Recent Video Compilations */}
              <Card withBorder p="xl">
                <Group justify="space-between" align="center" mb="lg">
                <Box>
                  <Title order={4} mb="xs">
                    Recent Video Compilations
                  </Title>
                  <Text size="sm" c="dimmed">
                    Latest compiled videos and their performance
                  </Text>
                </Box>
                <Button variant="light" size="sm">
                  View All
                </Button>
              </Group>
              
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Compilation Name</Table.Th>
                    <Table.Th>Segments</Table.Th>
                    <Table.Th>Duration</Table.Th>
                    <Table.Th>Views</Table.Th>
                    <Table.Th>QR Scans</Table.Th>
                    <Table.Th>Created</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {compilationRows}
                </Table.Tbody>
              </Table>
            </Card>
      </>
    )}
  </Container>
);
} 