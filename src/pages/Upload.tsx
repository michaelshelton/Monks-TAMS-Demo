import { useState } from 'react';
import { Container, Title, TextInput, Button, Stack, Card, Text, rem } from '@mantine/core';

const dummyUploads = [
  { id: 1, name: 'My Video Clip', status: 'Uploaded' },
  { id: 2, name: 'Nature Audio', status: 'Processing' },
];

export default function Upload() {
  const [fileName, setFileName] = useState('');
  return (
    <Container size="xl" px="xl" py="xl">
      <Title order={2} mb="lg" style={{ color: '#333333', fontSize: rem(32), fontWeight: 600, lineHeight: rem(40) }}>Upload Media (Demo)</Title>
      <Stack gap="md">
        <TextInput
          placeholder="File name (demo only)"
          value={fileName}
          onChange={e => setFileName(e.currentTarget.value)}
          style={{ fontSize: rem(16) }}
        />
        <Button disabled={!fileName} color="orange" style={{ fontWeight: 600, fontSize: rem(16), borderRadius: rem(6) }}>Upload</Button>
        <Title order={4} mt="lg" style={{ color: '#333333', fontSize: rem(20), fontWeight: 600, lineHeight: rem(28) }}>Your Uploads</Title>
        {dummyUploads.map(upload => (
          <Card key={upload.id} withBorder shadow="sm" radius="md" p="md" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: rem(8) }}>
            <Text fw={600} style={{ color: '#333333', fontSize: rem(16), lineHeight: rem(24) }}>{upload.name}</Text>
            <Text size="sm" c="dimmed" style={{ fontSize: rem(14), lineHeight: rem(20) }}>Status: {upload.status}</Text>
          </Card>
        ))}
      </Stack>
    </Container>
  );
} 