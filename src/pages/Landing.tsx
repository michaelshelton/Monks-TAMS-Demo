import React from 'react';
import { Container, Title, Text, Button, Box, Group, Card, SimpleGrid, Stack, Badge } from '@mantine/core';
import { IconClock, IconSearch, IconDatabase, IconPlayerPlay, IconArrowRight } from '@tabler/icons-react';

const benefits = [
  {
    icon: <IconClock size={40} />,
    title: 'Time-Addressable Access',
    desc: 'Instantly access any moment in your media streams with precise time-based navigation and search capabilities.',
  },
  {
    icon: <IconSearch size={40} />,
    title: 'Intelligent Search',
    desc: 'Find specific content across vast media libraries using AI-powered semantic search and metadata tagging.',
  },
  {
    icon: <IconDatabase size={40} />,
    title: 'Scalable Storage',
    desc: 'Handle petabytes of media data with VAST Data Platform\'s high-performance, cost-effective storage.',
  },
];

export default function Landing() {
  return (
    <Box>
      {/* Hero Section */}
      <Box py="xl">
        <Container size="xl" px="xl">
          <Stack align="center" gap="xl">
            <Badge size="lg" variant="light">
              Time Addressable Media Storage
            </Badge>
            <Title order={1} ta="center" maw={800}>
              Transform How You Store, Search, and Analyze Media
            </Title>
            <Text size="lg" ta="center" maw={700} c="dimmed">
              Access any moment in your media streams instantly with AI-powered time-addressable storage. 
              From live broadcasts to archived content, TAMS revolutionizes your media workflows.
            </Text>
            <Group justify="center" gap="md">
              <Button size="lg" rightSection={<IconArrowRight size={20} />}>
                Explore the Demo
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Container size="xl" px="xl" py="xl">
        <Stack align="center" gap="xl">
          <Box ta="center" maw={600}>
            <Title order={2} mb="md">
              Why Choose TAMS?
            </Title>
            <Text size="lg" c="dimmed">
              Powerful features designed for modern media workflows
            </Text>
          </Box>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl" w="100%">
            {benefits.map((benefit, i) => (
              <Card key={i} withBorder p="xl" ta="center">
                <Box mb="md">{benefit.icon}</Box>
                <Title order={3} mb="md">
                  {benefit.title}
                </Title>
                <Text c="dimmed">
                  {benefit.desc}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>

      {/* CTA Section */}
      <Box py="xl">
        <Container size="xl" px="xl">
          <Stack align="center" gap="xl">
            <Box ta="center" maw={700}>
              <Title order={2} mb="lg">
                Ready to Transform Your Media Storage?
              </Title>
              <Text size="lg" mb="xl" c="dimmed">
                Experience the power of time-addressable media storage with our interactive demo. 
                See how TAMS can revolutionize your media workflows.
              </Text>
            </Box>
            <Button size="xl" rightSection={<IconPlayerPlay size={24} />}>
              Start Demo Now
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
} 