import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Button,
  SimpleGrid,
  Card,
  Group,
  Stack,
  Badge,
} from '@mantine/core';
import {
  IconVideo,
  IconServer,
  IconDatabase,
  IconPlayerPlay,
  IconHeartbeat,
} from '@tabler/icons-react';

export default function Landing() {
  const navigate = useNavigate();

  // Feature cards with icons
  const features = [
    {
      icon: IconVideo,
      title: 'Flows',
      description: 'Browse and manage video flows with HLS streaming support',
      action: () => navigate('/flows'),
      color: 'blue',
      badge: 'Live',
    },
    {
      icon: IconServer,
      title: 'Sources',
      description: 'Manage media sources and their associated flows',
      action: () => navigate('/sources'),
      color: 'green',
    },
    {
      icon: IconDatabase,
      title: 'Segments',
      description: 'View time-addressable media segments with metadata',
      action: () => navigate('/flows'),
      color: 'orange',
    },
    {
      icon: IconHeartbeat,
      title: 'Health & Performance',
      description: 'Monitor system health, storage metrics, and performance',
      action: () => navigate('/health-performance'),
      color: 'purple',
      badge: 'Monitor',
    },
  ];

  return (
    <Container size="lg">
      <Stack gap="xl" align="center" py="xl">
        <div style={{ textAlign: 'center' }}>
          <Title order={1} size="h1" mb="md">
            TAMS Explorer
          </Title>
          <Text size="lg" c="dimmed" maw={600} mx="auto">
            Time-Addressable Media Store browser for local TAMS setup.
            Explore flows, sources, and segments with real-time updates.
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" w="100%" mt="xl">
          {features.map((feature) => (
            <Card
              key={feature.title}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={feature.action}
            >
              <Stack gap="md">
                <Group justify="space-between">
                  {React.createElement(feature.icon, { 
                    size: 32, 
                    color: `var(--mantine-color-${feature.color}-6)` 
                  })}
                  {feature.badge && (
                    <Badge color={feature.color} variant="dot">
                      {feature.badge}
                    </Badge>
                  )}
                </Group>
                <div>
                  <Text size="lg" fw={500} mb="xs">
                    {feature.title}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {feature.description}
                  </Text>
                </div>
                <Button
                  fullWidth
                  variant="light"
                  color={feature.color}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    feature.action();
                  }}
                >
                  {feature.title === 'Health & Performance' ? 'View Metrics' : `Explore ${feature.title}`}
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>

        <Card withBorder p="lg" radius="md" w="100%" mt="xl">
          <Stack gap="md">
            <Group>
              <IconPlayerPlay size={24} color="var(--mantine-color-blue-6)" />
              <Title order={3}>Webcam Stream Status</Title>
            </Group>
            <Text size="sm" c="dimmed">
              Check if your webcam stream is being ingested into TAMS
            </Text>
            <Group>
              <Button
                variant="filled"
                color="blue"
                onClick={() => navigate('/flow-details/11111111-1111-4111-8111-111111111111')}
                leftSection={<IconVideo size={16} />}
              >
                View Webcam Stream
              </Button>
              <Button
                variant="light"
                onClick={() => navigate('/flows')}
              >
                Browse All Flows
              </Button>
            </Group>
          </Stack>
        </Card>

        <Text size="xs" c="dimmed" ta="center" mt="xl">
          Connected to TAMS API at localhost:3000
        </Text>
      </Stack>
    </Container>
  );
}