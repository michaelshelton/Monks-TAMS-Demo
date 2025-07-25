import { useState } from 'react';
import { Container, Title, TextInput, Stack, Card, Text, Badge, Group, rem } from '@mantine/core';

const dummyResults = [
  { id: 1, type: 'Flow', name: 'Live News Feed', tags: ['news', 'live'] },
  { id: 2, type: 'Segment', name: '00:01:00 - 00:02:30', tags: ['interview'] },
  { id: 3, type: 'Flow', name: 'Sports Highlights', tags: ['sports'] },
];

export default function Search() {
  const [query, setQuery] = useState('');
  return (
    <Container size="xl" px="xl" py="xl">
      <Title order={2} mb="lg" style={{ color: '#333333', fontSize: rem(32), fontWeight: 600, lineHeight: rem(40) }}>Search</Title>
      <TextInput
        placeholder="Search flows, segments, tags..."
        value={query}
        onChange={e => setQuery(e.currentTarget.value)}
        mb="md"
        style={{ fontSize: rem(16) }}
      />
      <Stack gap="md">
        {dummyResults.filter(r => r.name.toLowerCase().includes(query.toLowerCase())).map(result => (
          <Card key={result.id} withBorder shadow="sm" radius="md" p="md" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: rem(8) }}>
            <Group justify="space-between">
              <Text fw={600} style={{ color: '#333333', fontSize: rem(16), lineHeight: rem(24) }}>{result.name}</Text>
              <Badge color={result.type === 'Flow' ? 'orange' : 'gray'} style={{ borderRadius: rem(6) }}>{result.type}</Badge>
            </Group>
            <Group gap="xs" mt="xs">
              {result.tags.map(tag => (
                <Badge key={tag} color="gray" variant="outline" style={{ borderRadius: rem(6), fontSize: rem(12) }}>{tag}</Badge>
              ))}
            </Group>
          </Card>
        ))}
      </Stack>
    </Container>
  );
} 