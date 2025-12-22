import React from 'react';
import {
  Card,
  Text,
  Group,
  Stack,
  Divider,
  Box,
  Title,
  Badge
} from '@mantine/core';
import {
  IconFileDescription,
  IconTag
} from '@tabler/icons-react';

interface FlowDescriptionManagerProps {
  initialDescription?: string;
  initialLabel?: string;
}

export function FlowDescriptionManager({ 
  initialDescription = '', 
  initialLabel = ''
}: FlowDescriptionManagerProps) {

  return (
    <Card withBorder>
      <Stack gap="lg">
        {/* Header */}
        <Box>
          <Group gap="sm" align="center">
            <IconFileDescription size={20} color="#228be6" />
            <Title order={4}>Flow Description & Label</Title>
          </Group>
          <Text size="sm" c="dimmed" mt="xs">
            Flow description and label information.
          </Text>
        </Box>

        <Divider />

        {/* Description Section */}
        <Box>
          <Group gap="xs" mb="xs">
            <IconFileDescription size={16} color="#228be6" />
            <Text size="sm" fw={500}>Description</Text>
          </Group>
          
          {initialDescription ? (
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {initialDescription}
            </Text>
          ) : (
            <Text size="sm" c="dimmed" fs="italic">
              No description provided.
            </Text>
          )}
        </Box>

        {/* Label Section */}
        <Box>
          <Group gap="xs" mb="xs">
            <IconTag size={16} color="#40c057" />
            <Text size="sm" fw={500}>Label</Text>
          </Group>
          
          {initialLabel ? (
            <Badge color="blue" variant="light" size="lg">
              {initialLabel}
            </Badge>
          ) : (
            <Text size="sm" c="dimmed" fs="italic">
              No label set.
            </Text>
          )}
        </Box>
      </Stack>
    </Card>
  );
}
