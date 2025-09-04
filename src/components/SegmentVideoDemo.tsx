import React, { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Group,
  Button,
  Alert,
  Badge,
  Box
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconInfoCircle,
  IconAlertCircle
} from '@tabler/icons-react';
import VastTamsVideoPlayer from './VastTamsVideoPlayer';

interface SegmentVideoDemoProps {
  segment: {
    id: string;
    object_id: string;
    timerange: string;
    get_urls?: Array<{ url: string; label?: string }>;
    description?: string;
    size?: number;
    tags?: Record<string, any>;
  };
  flowLabel?: string;
}

export default function SegmentVideoDemo({ segment, flowLabel }: SegmentVideoDemoProps) {
  const [showPlayer, setShowPlayer] = useState(false);

  const hasVideoUrls = segment.get_urls && segment.get_urls.length > 0;

  return (
    <Container size="md" py="md">
      <Title order={3} mb="lg">Segment Video Player Demo</Title>
      
      <Card withBorder p="lg">
        <Stack gap="md">
          <Group justify="space-between">
            <Box>
              <Title order={4}>{segment.description || segment.object_id}</Title>
              <Text size="sm" c="dimmed">
                {flowLabel} • {segment.timerange}
              </Text>
            </Box>
            <Badge color={hasVideoUrls ? 'green' : 'red'} variant="light">
              {hasVideoUrls ? 'Playable' : 'No Video URLs'}
            </Badge>
          </Group>

          {segment.tags && Object.keys(segment.tags).length > 0 && (
            <Box>
              <Text size="sm" fw={500} mb="xs">Tags</Text>
              <Group gap="xs">
                {Object.entries(segment.tags).map(([key, value]) => (
                  <Badge key={key} color="blue" variant="light" size="sm">
                    {key}: {String(value)}
                  </Badge>
                ))}
              </Group>
            </Box>
          )}

          {hasVideoUrls ? (
            <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
              <Text size="sm">
                This segment has {segment.get_urls?.length} presigned URL(s) available for video playback.
                Click the button below to open the VAST TAMS video player.
              </Text>
            </Alert>
          ) : (
            <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light">
              <Text size="sm">
                This segment does not have video URLs available. This could be because:
                <br />• The segment is still being processed
                <br />• The file upload failed
                <br />• The segment contains non-video content
              </Text>
            </Alert>
          )}

          <Group justify="center">
            <Button
              leftSection={<IconPlayerPlay size={16} />}
              onClick={() => setShowPlayer(true)}
              disabled={!hasVideoUrls}
              size="lg"
            >
              {hasVideoUrls ? 'Play Video' : 'No Video Available'}
            </Button>
          </Group>

          {hasVideoUrls && (
            <Box>
              <Text size="sm" fw={500} mb="xs">Available URLs</Text>
              <Stack gap="xs">
                {segment.get_urls?.map((url, index) => (
                  <Box key={index}>
                    <Text size="xs" c="dimmed">{url.label}</Text>
                    <Text size="xs" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {url.url}
                    </Text>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </Card>

      {/* Video Player Modal */}
      {showPlayer && hasVideoUrls && (
        <VastTamsVideoPlayer
          segment={{
            id: segment.id,
            timerange: segment.timerange,
            get_urls: segment.get_urls || [],
            format: 'video/mp4',
            codec: 'h264',
            size: segment.size,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            tags: segment.tags,
            deleted: false,
            deleted_at: null,
            deleted_by: null
          }}
          title={segment.description || segment.object_id}
          description={`VAST TAMS segment playback for ${flowLabel}`}
          onClose={() => setShowPlayer(false)}
          showControls={true}
          autoPlay={true}
          onError={(error) => {
            console.error('Video Player Error:', error);
          }}
        />
      )}
    </Container>
  );
}
