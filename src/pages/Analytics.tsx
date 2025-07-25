
import { Container, Title, Card, SimpleGrid, Text, Group, Badge, Box } from '@mantine/core';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';
import { IconTrendingUp, IconUsers, IconClock, IconActivity } from '@tabler/icons-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend);

const usageData = {
  labels: ['10:00', '10:10', '10:20', '10:30', '10:40', '10:50', '11:00'],
  datasets: [
    {
      label: 'Views',
      data: [12, 19, 15, 22, 30, 28, 35],
      borderColor: '#228be6',
      backgroundColor: 'rgba(34, 139, 230, 0.1)',
      tension: 0.4,
      borderWidth: 3,
      pointBackgroundColor: '#228be6',
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
      pointRadius: 6,
    },
  ],
};

const usageOptions = {
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

const stats = [
  {
    title: 'Total Flows',
    value: '3',
    change: '+12%',
    changeType: 'positive',
    icon: <IconActivity size={24} />,
    color: '#228be6',
  },
  {
    title: 'Active Users',
    value: '1,247',
    change: '+8%',
    changeType: 'positive',
    icon: <IconUsers size={24} />,
    color: '#40c057',
  },
  {
    title: 'Avg. Session',
    value: '24m',
    change: '+5%',
    changeType: 'positive',
    icon: <IconClock size={24} />,
    color: '#fd7e14',
  },
];

export default function Analytics() {
  return (
    <Container size="xl" px="xl" py="xl">
      <Box mb="xl">
        <Title order={2} mb="md">
          Analytics Dashboard
        </Title>
        <Text size="lg" c="dimmed">
          Monitor performance and usage patterns across your media streams
        </Text>
      </Box>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="xl">
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
                    vs last week
                  </Text>
                </Group>
              </Box>
              <Box 
                className="tams-spacing-sm"
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

      {/* Chart Section */}
      <Card withBorder p="xl">
        <Group justify="space-between" align="center" mb="lg">
          <Box>
            <Title order={4} mb="xs">
              Usage Over Time
            </Title>
            <Text size="sm" c="dimmed">
              Real-time view count and engagement metrics
            </Text>
          </Box>
          <Group gap="xs">
            <Badge color="blue" variant="light">
              <IconTrendingUp size={14} style={{ marginRight: 4 }} />
              Trending Up
            </Badge>
          </Group>
        </Group>
        <Line data={usageData} options={usageOptions} />
      </Card>
    </Container>
  );
} 