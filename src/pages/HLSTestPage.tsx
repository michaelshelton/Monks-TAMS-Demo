import React, { useState } from 'react';
import { Container, Title, Text, Button, Stack, Alert, Group } from '@mantine/core';
import { IconPlayerPlay, IconAlertCircle } from '@tabler/icons-react';
import HLSVideoPlayer from '../components/HLSVideoPlayer';

export default function HLSTestPage() {
  const [showPlayer, setShowPlayer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backend = import.meta.env.VITE_DEFAULT_BACKEND;
  const hlsUrl = backend === 'vast' 
    ? 'http://localhost:8000/flows/webcam-main/stream.m3u8'
    : 'http://localhost:3002/flows/webcam-main/stream.m3u8';

  const handlePlayTest = () => {
    setError(null);
    setShowPlayer(true);
  };

  return (
    <Container size="xl" px="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="md">HLS Video Player Test</Title>
          <Text size="lg" c="dimmed" mb="lg">
            Test the HLS video player with the IBC_Thiago backend video stream
          </Text>
        </div>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
            {error}
          </Alert>
        )}

        <Group>
          <Button 
            leftSection={<IconPlayerPlay size={16} />} 
            onClick={handlePlayTest}
            size="lg"
          >
            Test HLS Video Player
          </Button>
        </Group>

        {showPlayer && (
          <HLSVideoPlayer
            hlsUrl={hlsUrl}
            title="Test HLS Stream"
            description="Testing HLS video playback from IBC_Thiago backend"
            onClose={() => setShowPlayer(false)}
            showControls={true}
            autoPlay={true}
            onError={(error) => {
              console.error('HLS Test Error:', error);
              setError(error);
            }}
          />
        )}

        <Alert icon={<IconAlertCircle size={16} />} color="blue" title="Test Information">
          <Stack gap="sm">
            <Text size="sm">
              <strong>HLS URL:</strong> {hlsUrl}
            </Text>
            <Text size="sm">
              <strong>Backend:</strong> IBC_Thiago (localhost:3002)
            </Text>
            <Text size="sm">
              <strong>Flow ID:</strong> webcam-main
            </Text>
            <Text size="sm">
              <strong>Expected:</strong> HLS stream with 250+ video segments
            </Text>
          </Stack>
        </Alert>
      </Stack>
    </Container>
  );
}
