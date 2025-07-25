
import { Container, Title, Card, Stack, Badge, Group, Text, rem } from '@mantine/core';

const dummySegments = [
  { id: 1, start: '00:00:00', end: '00:01:00', tags: ['intro', 'news'], description: 'Opening segment.' },
  { id: 2, start: '00:01:00', end: '00:02:30', tags: ['interview'], description: 'Guest interview.' },
  { id: 3, start: '00:02:30', end: '00:03:00', tags: ['sports'], description: 'Sports update.' },
];

export default function Segments() {
  return (
    <Container size="xl" px="xl" py="xl">
      <Title order={2} mb="lg" style={{ color: '#333333', fontSize: rem(32), fontWeight: 600, lineHeight: rem(40) }}>Segments / Clips</Title>
      <Stack gap="md">
        {dummySegments.map(seg => (
          <Card key={seg.id} withBorder shadow="sm" radius="md" p="md" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: rem(8) }}>
            <Group justify="space-between">
              <Text size="sm" fw={600} style={{ color: '#333333', fontSize: rem(14), lineHeight: rem(20) }}>{seg.start} - {seg.end}</Text>
              <Group gap="xs">
                {seg.tags.map(tag => (
                  <Badge key={tag} color="gray" variant="outline" style={{ borderRadius: rem(6), fontSize: rem(12) }}>{tag}</Badge>
                ))}
              </Group>
            </Group>
            <Text size="sm" c="dimmed" style={{ fontSize: rem(14), lineHeight: rem(20) }}>{seg.description}</Text>
          </Card>
        ))}
      </Stack>
    </Container>
  );
} 