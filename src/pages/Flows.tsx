import { Container, Title, Card, Text, Badge, Group, Box, Button, Table, ActionIcon } from '@mantine/core';
import { IconVideo, IconMusic, IconEye, IconClock, IconTag, IconDots } from '@tabler/icons-react';

const dummyFlows = [
  { 
    id: 1, 
    name: 'Live News Feed', 
    type: 'Video', 
    tags: ['news', 'live'], 
    description: '24/7 news video stream with real-time updates and breaking news coverage.',
    status: 'active',
    views: 1247,
    duration: '24h',
  },
  { 
    id: 2, 
    name: 'Nature Audio', 
    type: 'Audio', 
    tags: ['nature', 'relax'], 
    description: 'Ambient nature sounds for relaxation and focus.',
    status: 'active',
    views: 892,
    duration: '2h',
  },
  { 
    id: 3, 
    name: 'Sports Highlights', 
    type: 'Video', 
    tags: ['sports', 'highlights'], 
    description: 'Daily sports highlight clips and game summaries.',
    status: 'processing',
    views: 2156,
    duration: '1h',
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'green';
    case 'processing': return 'orange';
    case 'error': return 'red';
    default: return 'gray';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'Video': return <IconVideo size={16} />;
    case 'Audio': return <IconMusic size={16} />;
    default: return <IconVideo size={16} />;
  }
};

export default function Flows() {
  const rows = dummyFlows.map((flow) => (
    <Table.Tr key={flow.id}>
      <Table.Td>
        <Box>
          <Group gap="xs" mb={4}>
            {getTypeIcon(flow.type)}
            <Text fw={600}>
              {flow.name}
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            {flow.description}
          </Text>
        </Box>
      </Table.Td>
      
      <Table.Td>
        <Badge color="blue" variant="light">
          {flow.type}
        </Badge>
      </Table.Td>
      
      <Table.Td>
        <Badge 
          color={getStatusColor(flow.status)} 
          variant="dot"
        >
          {flow.status}
        </Badge>
      </Table.Td>
      
      <Table.Td>
        <Group gap="xs">
          <Group gap={4}>
            <IconEye size={14} />
            <Text size="xs">
              {flow.views.toLocaleString()}
            </Text>
          </Group>
        </Group>
      </Table.Td>
      
      <Table.Td>
        <Group gap="xs">
          <Group gap={4}>
            <IconClock size={14} />
            <Text size="xs">
              {flow.duration}
            </Text>
          </Group>
        </Group>
      </Table.Td>
      
      <Table.Td>
        <Group gap="xs">
          {flow.tags.map(tag => (
            <Badge 
              key={tag} 
              color="gray" 
              variant="outline"
              leftSection={<IconTag size={10} />}
            >
              {tag}
            </Badge>
          ))}
        </Group>
      </Table.Td>
      
      <Table.Td>
        <Group gap="xs">
          <Button size="xs" variant="light">
            View
          </Button>
          <ActionIcon size="sm" variant="subtle">
            <IconDots size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl" px="xl" py="xl">
      <Box mb="xl">
        <Title order={2} mb="md">
          Media Flows
        </Title>
        <Text size="lg" c="dimmed">
          Manage and monitor your time-addressable media streams
        </Text>
      </Box>

      <Card withBorder>
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Flow Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Views</Table.Th>
              <Table.Th>Duration</Table.Th>
              <Table.Th>Tags</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows}
          </Table.Tbody>
        </Table>
      </Card>
    </Container>
  );
} 