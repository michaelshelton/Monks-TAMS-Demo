
import { useState } from 'react';
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
  Button
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
  IconEye
} from '@tabler/icons-react';

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

// Mock analytics data based on backend API structure
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

const mockTimeRangeData = {
  labels: ['Last Hour', 'Last 6 Hours', 'Last 24 Hours', 'Last Week', 'Last Month'],
  datasets: [
    {
      label: 'Active Segments',
      data: [156, 892, 3247, 18923, 45678],
      backgroundColor: '#228be6',
      borderColor: '#228be6',
      borderWidth: 1,
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
  const [timeRange, setTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(false);

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
      title: 'Storage Used',
      value: '8.4 GB',
      change: '+15%',
      changeType: 'positive',
      icon: <IconDatabase size={24} />,
      color: '#fd7e14',
    },
    {
      title: 'Avg. Response Time',
      value: '45ms',
      change: '-5%',
      changeType: 'positive',
      icon: <IconClock size={24} />,
      color: '#7950f2',
    },
  ];

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const rows = mockTopFlows.map((flow) => (
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

  return (
    <Container size="xl" px="xl" py="xl">
      <Box mb="xl">
        <Group justify="space-between" align="flex-end">
          <Box>
            <Title order={2} mb="md">
              Analytics Dashboard
            </Title>
            <Text size="lg" c="dimmed">
              Monitor performance and usage patterns across your media streams
            </Text>
          </Box>
          <Group gap="sm">
            <Select
              value={timeRange}
              onChange={(value) => setTimeRange(value || '24h')}
              data={[
                { value: '1h', label: 'Last Hour' },
                { value: '6h', label: 'Last 6 Hours' },
                { value: '24h', label: 'Last 24 Hours' },
                { value: '7d', label: 'Last Week' },
                { value: '30d', label: 'Last Month' }
              ]}
              size="sm"
            />
            <Button 
              leftSection={<IconRefresh size={16} />}
              variant="light"
              loading={isLoading}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </Group>
        </Group>
      </Box>

      {/* Stats Cards */}
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
          <Line data={mockFlowUsageData} options={chartOptions} />
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
          <Doughnut data={mockStorageUsageData} options={doughnutOptions} />
        </Card>
      </SimpleGrid>

      {/* Time Range Analysis */}
      <Card withBorder p="xl" mb="xl">
        <Group justify="space-between" align="center" mb="lg">
          <Box>
            <Title order={4} mb="xs">
              Time Range Analysis
            </Title>
            <Text size="sm" c="dimmed">
              Active segments across different time periods
            </Text>
          </Box>
          <Badge color="orange" variant="light">
            <IconActivity size={14} style={{ marginRight: 4 }} />
            Segment Count
          </Badge>
        </Group>
        <Bar data={mockTimeRangeData} options={barOptions} />
      </Card>

      {/* Top Performing Flows */}
      <Card withBorder p="xl">
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
            {rows}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Performance Metrics */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" mt="xl">
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

        <Card withBorder p="xl">
          <Title order={4} mb="lg">Error Rates</Title>
          <Stack gap="md">
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
          </Stack>
        </Card>
      </SimpleGrid>
    </Container>
  );
} 