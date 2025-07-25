
import { Container, Title, Text, Card, Stack, Badge, Group, Slider, rem } from '@mantine/core';

export default function FlowDetails() {
  return (
    <Container size="xl" px="xl" py="xl">
      <Title order={2} mb="md" style={{ color: '#333333', fontSize: rem(32), fontWeight: 600, lineHeight: rem(40) }}>Flow Details</Title>
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: rem(8) }}>
        <Stack gap="md">
          <Title order={4} style={{ color: '#333333', fontSize: rem(20), fontWeight: 600, lineHeight: rem(28) }}>Live News Feed</Title>
          <Text size="sm" c="dimmed" style={{ fontSize: rem(14), lineHeight: rem(20) }}>24/7 news video stream. (Dummy data)</Text>
          <Group gap="xs">
            <Badge color="orange" style={{ borderRadius: rem(6) }}>Video</Badge>
            <Badge color="gray" variant="outline" style={{ borderRadius: rem(6), fontSize: rem(12) }}>news</Badge>
            <Badge color="gray" variant="outline" style={{ borderRadius: rem(6), fontSize: rem(12) }}>live</Badge>
          </Group>
          <Card withBorder p="md" radius="sm" style={{ background: '#F8F9FA', border: '1px solid #E5E7EB', borderRadius: rem(6) }}>
            <Text ta="center" c="dimmed" style={{ fontSize: rem(14), lineHeight: rem(20) }}>[Media Player Placeholder]</Text>
            <Slider mt="md" value={30} min={0} max={100} label={(v) => `${v}s`} color="orange" />
          </Card>
          <Text size="xs" style={{ fontSize: rem(12), lineHeight: rem(16) }}>Current Time: 00:00:30</Text>
        </Stack>
      </Card>
    </Container>
  );
} 