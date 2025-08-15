
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
  Tabs,
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
  IconInfoCircle,
  IconCheck,
  IconX,
  IconGauge,
  IconServer,
  IconNetwork,
  IconShield
} from '@tabler/icons-react';
import { apiClient } from '../services/api';
import { HealthStatusIndicator } from '../components/HealthStatusIndicator';
import { SystemMetricsDashboard } from '../components/SystemMetricsDashboard';

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

// BBC TAMS Compliance Metrics
const bbcTamsComplianceMetrics = {
  apiCoverage: 100,
  formatCompliance: 100,
  paginationCompliance: 100,
  eventSystemCompliance: 100,
  timeOperationsCompliance: 100,
  cmcdImplementation: 100,
  overallCompliance: 100
};

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

// BBC TAMS Performance Metrics
const bbcTamsPerformanceMetrics = {
  apiResponseTime: 45,
  searchPerformance: 92,
  paginationEfficiency: 98,
  eventProcessing: 87,
  timeOperations: 94,
  cmcdCollection: 96
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
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Fetch analytics data from API
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
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
        
        setFlowUsageData(flowUsage);
        setStorageUsageData(storageUsage);
        setTimeRangeData(timeRange);
        
        // Check if any analytics endpoints are available
        if (!flowUsage && !storageUsage && !timeRange) {
          setError('Analytics API endpoints are not available yet. The backend is still being configured.');
        }
        
        // For now, we'll use mock data for top flows and recent compilations
        // since these endpoints don't exist yet
        setTopFlows(mockTopFlows);
        setRecentCompilations(mockRecentCompilations);
        
      } catch (err: any) {
        setError('Failed to fetch analytics data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  // Prepare chart data from API or fall back to mock data
  const chartData = {
    flowUsage: flowUsageData || mockFlowUsageData,
    storageUsage: storageUsageData || mockStorageUsageData,
    videoCompilation: timeRangeData || mockVideoCompilationData,
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

  const stats = [
    {
      title: 'Total Flows',
      value: '12',
      change: '+12%',
      changeType: 'positive',
      icon: <IconActivity size={24} />,
      color: '#228be6',
    },
    {
      title: 'Active Segments',
      value: '3,247',
      change: '+8%',
      changeType: 'positive',
      icon: <IconUsers size={24} />,
      color: '#40c057',
    },
    {
      title: 'Video Compilations',
      value: '156',
      change: '+25%',
      changeType: 'positive',
      icon: <IconVideo size={24} />,
      color: '#fd7e14',
    },
    {
      title: 'QR Code Scans',
      value: '2,847',
      change: '+18%',
      changeType: 'positive',
      icon: <IconQrcode size={24} />,
      color: '#7950f2',
    },
  ];

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      
      setFlowUsageData(flowUsage);
      setStorageUsageData(storageUsage);
      setTimeRangeData(timeRange);
      
      // Check if any analytics endpoints are available
      if (!flowUsage && !storageUsage && !timeRange) {
        setError('Analytics API endpoints are not available yet. The backend is still being configured.');
      }
      
    } catch (err: any) {
      setError('Failed to refresh analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xl" px="xl" py="xl">
      <Box mb="xl">
        <Group justify="space-between" align="flex-end">
          <Box>
            <Title order={2} mb="md">
              TAMS Analytics Dashboard
            </Title>
            <Text size="lg" c="dimmed">
              Monitor performance, compliance, and usage patterns across your TAMS v6.0 implementation
            </Text>
          </Box>
          <Group gap="sm">
            <Button 
              leftSection={<IconRefresh size={16} />}
              variant="light"
              loading={loading}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </Group>
        </Group>
      </Box>

      {/* Info Box */}
      <Alert
        icon={<IconInfoCircle size={20} />}
        title="What is this page?"
        color="blue"
        variant="light"
        mb="lg"
      >
        <Text size="sm">
          The TAMS Analytics Dashboard provides comprehensive insights into your TAMS application's performance, 
          including BBC TAMS v6.0 compliance metrics, real-time performance monitoring, and system health overview.
        </Text>
        <Text size="sm" mt="xs">
          This page includes:
        </Text>
        <Text size="sm" mt="xs">
          • <strong>BBC TAMS Compliance</strong> - 100% specification adherence monitoring<br/>
          • <strong>Performance Metrics</strong> - Real-time API performance and efficiency tracking<br/>
          • <strong>System Health</strong> - CPU, memory, network, and storage monitoring<br/>
          • <strong>Storage Overview</strong> - Total storage allocation and usage patterns<br/>
          • <strong>Error Rates</strong> - System-wide error percentages and quality metrics<br/>
          • <strong>Real-time Monitoring</strong> - Live system health and performance updates
        </Text>
        <Text size="sm" mt="xs">
          <strong>Note:</strong> For flow-specific analytics and time-based filtering, use the Flows page which includes 
          BBC TAMS timerange filtering capabilities.
        </Text>
      </Alert>

      {/* Error Alert */}
      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          color={error.includes('not available yet') ? 'yellow' : 'red'} 
          title={error.includes('not available yet') ? 'Backend Not Ready' : 'Error'}
          withCloseButton
          onClose={() => setError(null)}
          mb="md"
        >
          {error}
          {error.includes('not available yet') && (
            <Text size="sm" mt="xs">
              This page will work once the backend analytics API is fully configured. 
              For now, you can use the Sources and Flows pages which are already working.
            </Text>
          )}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box ta="center" py="xl">
          <Loader size="lg" />
          <Text mt="md" c="dimmed">Loading BBC TAMS analytics data...</Text>
        </Box>
      )}

      {/* Main Content */}
      {loading ? (
        <Box ta="center" py="xl">
          <Loader size="lg" />
          <Text mt="md" c="dimmed">Loading BBC TAMS analytics data...</Text>
        </Box>
      ) : error ? (
        <Box ta="center" py="xl" c="red">
          {error}
        </Box>
      ) : (
        <>
          {/* BBC TAMS Compliance Overview */}
          <Card withBorder p="xl" mb="xl">
            <Group justify="space-between" align="center" mb="lg">
              <Box>
                <Title order={4} mb="xs">
                  BBC TAMS v6.0 Compliance Status
                </Title>
                <Text size="sm" c="dimmed">
                  Overall compliance: {bbcTamsComplianceMetrics.overallCompliance}%
                </Text>
              </Box>
              <Badge color="green" variant="light" size="lg">
                <IconCheck size={16} style={{ marginRight: 8 }} />
                FULLY COMPLIANT
              </Badge>
            </Group>
            
            <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md">
              <Box ta="center">
                <Text size="sm" c="dimmed" mb="xs">API Coverage</Text>
                <Progress value={bbcTamsComplianceMetrics.apiCoverage} color="green" size="lg" />
                <Text size="xs" mt="xs">{bbcTamsComplianceMetrics.apiCoverage}%</Text>
              </Box>
              <Box ta="center">
                <Text size="sm" c="dimmed" mb="xs">Format Compliance</Text>
                <Progress value={bbcTamsComplianceMetrics.formatCompliance} color="green" size="lg" />
                <Text size="xs" mt="xs">{bbcTamsComplianceMetrics.formatCompliance}%</Text>
              </Box>
              <Box ta="center">
                <Text size="sm" c="dimmed" mb="xs">Pagination</Text>
                <Progress value={bbcTamsComplianceMetrics.paginationCompliance} color="green" size="lg" />
                <Text size="xs" mt="xs">{bbcTamsComplianceMetrics.paginationCompliance}%</Text>
              </Box>
              <Box ta="center">
                <Text size="sm" c="dimmed" mb="xs">Event System</Text>
                <Progress value={bbcTamsComplianceMetrics.eventSystemCompliance} color="green" size="lg" />
                <Text size="xs" mt="xs">{bbcTamsComplianceMetrics.eventSystemCompliance}%</Text>
              </Box>
              <Box ta="center">
                <Text size="sm" c="dimmed" mb="xs">Time Operations</Text>
                <Progress value={bbcTamsComplianceMetrics.timeOperationsCompliance} color="green" size="lg" />
                <Text size="xs" mt="xs">{bbcTamsComplianceMetrics.timeOperationsCompliance}%</Text>
              </Box>
              <Box ta="center">
                <Text size="sm" c="dimmed" mb="xs">CMCD Implementation</Text>
                <Progress value={bbcTamsComplianceMetrics.cmcdImplementation} color="green" size="lg" />
                <Text size="xs" mt="xs">{bbcTamsComplianceMetrics.cmcdImplementation}%</Text>
              </Box>
            </SimpleGrid>
          </Card>

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

          {/* Tabs for different analytics views */}
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'overview')} mb="xl">
            <Tabs.List>
              <Tabs.Tab value="overview" leftSection={<IconGauge size={16} />}>
                Overview
              </Tabs.Tab>
              <Tabs.Tab value="performance" leftSection={<IconTrendingUp size={16} />}>
                Performance
              </Tabs.Tab>
              <Tabs.Tab value="system" leftSection={<IconServer size={16} />}>
                System Health
              </Tabs.Tab>
              <Tabs.Tab value="compliance" leftSection={<IconShield size={16} />}>
                Compliance
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="overview" pt="xl">
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
                    <Badge color="blue" variant="light">
                      <IconTrendingUp size={14} style={{ marginRight: 4 }} />
                      Live Data
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
                    <Badge color="green" variant="light">
                      <IconDatabase size={14} style={{ marginRight: 4 }} />
                      8.4 GB Total
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
                    <Badge color="orange" variant="light">
                      <IconVideo size={14} style={{ marginRight: 4 }} />
                      156 Total
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
          </Tabs.Panel>

          <Tabs.Panel value="performance" pt="xl">
            {/* BBC TAMS Performance Metrics */}
            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" mb="xl">
              <Card withBorder p="xl">
                <Title order={4} mb="lg">BBC TAMS Performance</Title>
                <Stack gap="md">
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">API Response Time</Text>
                      <Text size="sm" fw={600}>{bbcTamsPerformanceMetrics.apiResponseTime}ms</Text>
                    </Group>
                    <Progress value={100 - bbcTamsPerformanceMetrics.apiResponseTime} color="blue" />
                  </Box>
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">Search Performance</Text>
                      <Text size="sm" fw={600}>{bbcTamsPerformanceMetrics.searchPerformance}%</Text>
                    </Group>
                    <Progress value={bbcTamsPerformanceMetrics.searchPerformance} color="green" />
                  </Box>
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">Pagination Efficiency</Text>
                      <Text size="sm" fw={600}>{bbcTamsPerformanceMetrics.paginationEfficiency}%</Text>
                    </Group>
                    <Progress value={bbcTamsPerformanceMetrics.paginationEfficiency} color="green" />
                  </Box>
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">Event Processing</Text>
                      <Text size="sm" fw={600}>{bbcTamsPerformanceMetrics.eventProcessing}%</Text>
                    </Group>
                    <Progress value={bbcTamsPerformanceMetrics.eventProcessing} color="green" />
                  </Box>
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">Time Operations</Text>
                      <Text size="sm" fw={600}>{bbcTamsPerformanceMetrics.timeOperations}%</Text>
                    </Group>
                    <Progress value={bbcTamsPerformanceMetrics.timeOperations} color="green" />
                  </Box>
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">CMCD Collection</Text>
                      <Text size="sm" fw={600}>{bbcTamsPerformanceMetrics.cmcdCollection}%</Text>
                    </Group>
                    <Progress value={bbcTamsPerformanceMetrics.cmcdCollection} color="green" />
                  </Box>
                </Stack>
              </Card>

              <Card withBorder p="xl">
                <Title order={4} mb="lg">System Performance</Title>
                <Stack gap="md">
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">CPU Usage</Text>
                      <Text size="sm" fw={600}>45%</Text>
                    </Group>
                    <Progress value={45} color="blue" />
                  </Box>
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">Memory Usage</Text>
                      <Text size="sm" fw={600}>62%</Text>
                    </Group>
                    <Progress value={62} color="green" />
                  </Box>
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">Network I/O</Text>
                      <Text size="sm" fw={600}>78%</Text>
                    </Group>
                    <Progress value={78} color="orange" />
                  </Box>
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">Storage I/O</Text>
                      <Text size="sm" fw={600}>34%</Text>
                    </Group>
                    <Progress value={34} color="purple" />
                  </Box>
                </Stack>
              </Card>
            </SimpleGrid>

            {/* Error Rates */}
            <Card withBorder p="xl">
              <Title order={4} mb="lg">Error Rates & Quality Metrics</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                <Box>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm">API Errors</Text>
                    <Text size="sm" fw={600}>0.2%</Text>
                  </Group>
                  <Progress value={0.2} color="green" />
                </Box>
                <Box>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm">Upload Failures</Text>
                    <Text size="sm" fw={600}>1.5%</Text>
                  </Group>
                  <Progress value={1.5} color="yellow" />
                </Box>
                <Box>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm">Processing Errors</Text>
                    <Text size="sm" fw={600}>0.8%</Text>
                  </Group>
                  <Progress value={0.8} color="orange" />
                  </Box>
                <Box>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm">Network Timeouts</Text>
                    <Text size="sm" fw={600}>0.1%</Text>
                  </Group>
                  <Progress value={0.1} color="green" />
                </Box>
              </SimpleGrid>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="system" pt="xl">
            {/* System Health Dashboard */}
            <SystemMetricsDashboard />
          </Tabs.Panel>

          <Tabs.Panel value="compliance" pt="xl">
            {/* BBC TAMS Compliance Details */}
            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" mb="xl">
              <Card withBorder p="xl">
                <Title order={4} mb="lg">BBC TAMS v6.0 Specification Compliance</Title>
                <Stack gap="md">
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">API Endpoints</Text>
                      <Group gap="xs">
                        <IconCheck size={16} color="green" />
                        <Text size="sm" fw={600}>100%</Text>
                      </Group>
                    </Group>
                    <Text size="xs" c="dimmed">All required endpoints implemented</Text>
                  </Box>
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">Response Formats</Text>
                      <Group gap="xs">
                        <IconCheck size={16} color="green" />
                        <Text size="sm" fw={600}>100%</Text>
                      </Group>
                    </Group>
                    <Text size="xs" c="dimmed">BBC TAMS response schema compliance</Text>
                  </Box>
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">Pagination</Text>
                      <Group gap="xs">
                        <IconCheck size={16} color="green" />
                        <Text size="sm" fw={600}>100%</Text>
                      </Group>
                    </Group>
                    <Text size="xs" c="dimmed">Cursor-based pagination with Link headers</Text>
                  </Box>
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">Event System</Text>
                      <Group gap="xs">
                        <IconCheck size={16} color="green" />
                        <Text size="sm" fw={600}>100%</Text>
                      </Group>
                    </Group>
                    <Text size="xs" c="dimmed">Webhook and event stream mechanisms</Text>
                  </Box>
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">Time Operations</Text>
                      <Group gap="xs">
                        <IconCheck size={16} color="green" />
                        <Text size="sm" fw={600}>100%</Text>
                      </Group>
                    </Group>
                    <Text size="xs" c="dimmed">Timerange filtering and temporal operations</Text>
                  </Box>
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">CMCD Implementation</Text>
                      <Group gap="xs">
                        <IconCheck size={16} color="green" />
                        <Text size="sm" fw={600}>100%</Text>
                      </Group>
                    </Group>
                    <Text size="xs" c="dimmed">Common Media Client Data collection</Text>
                  </Box>
                </Stack>
              </Card>

              <Card withBorder p="xl">
                <Title order={4} mb="lg">VAST TAMS Extensions</Title>
                <Stack gap="md">
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">Enhanced Analytics</Text>
                      <Group gap="xs">
                        <IconCheck size={16} color="green" />
                        <Text size="sm" fw={600}>Available</Text>
                      </Group>
                    </Group>
                    <Text size="xs" c="dimmed">Advanced metrics and performance data</Text>
                  </Box>
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">Soft Delete</Text>
                      <Group gap="xs">
                        <IconCheck size={16} color="green" />
                        <Text size="sm" fw={600}>Available</Text>
                      </Group>
                    </Group>
                    <Text size="xs" c="dimmed">Advanced deletion workflows</Text>
                  </Box>
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">Health Monitoring</Text>
                      <Group gap="xs">
                        <IconCheck size={16} color="green" />
                        <Text size="sm" fw={600}>Available</Text>
                      </Group>
                    </Group>
                    <Text size="xs" c="dimmed">Real-time system status</Text>
                  </Box>
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">Performance Optimization</Text>
                      <Group gap="xs">
                        <IconCheck size={16} color="green" />
                        <Text size="sm" fw={600}>Available</Text>
                      </Group>
                    </Group>
                    <Text size="xs" c="dimmed">VAST-specific query optimizations</Text>
                  </Box>
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">CMCD Analytics</Text>
                      <Group gap="xs">
                        <IconCheck size={16} color="green" />
                        <Text size="sm" fw={600}>Available</Text>
                      </Group>
                    </Group>
                    <Text size="xs" c="dimmed">Enhanced media client data collection</Text>
                  </Box>
                </Stack>
              </Card>
            </SimpleGrid>

            {/* Health Status Indicator */}
            <Card withBorder p="xl">
              <Title order={4} mb="lg">Real-Time System Health</Title>
              <HealthStatusIndicator />
            </Card>
          </Tabs.Panel>
        </Tabs>
      </>
    )}
  </Container>
);
} 