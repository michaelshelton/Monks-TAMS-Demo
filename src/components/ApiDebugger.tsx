import React, { useState } from 'react';
import {
  Card,
  Stack,
  Button,
  Text,
  Code,
  Alert,
  Group,
  Badge,
  Loader,
  Center
} from '@mantine/core';
import { IconBug, IconRefresh } from '@tabler/icons-react';
import { apiClient } from '../services/api';

export default function ApiDebugger() {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDebugTest = async () => {
    setLoading(true);
    setError(null);
    setDebugData(null);

    try {
      console.log('🔍 Starting API debug test...');
      
      // Test health endpoint
      console.log('Testing /health...');
      const health = await apiClient.getHealth();
      console.log('Health response:', health);

      // Test sources endpoint
      console.log('Testing /sources...');
      const sourcesResponse = await apiClient.getSources({ limit: 5 });
      console.log('Sources response:', sourcesResponse);
      console.log('Sources data length:', sourcesResponse.data?.length);
      console.log('Sources pagination:', sourcesResponse.pagination);

      // Test flows endpoint
      console.log('Testing /flows...');
      const flowsResponse = await apiClient.getFlows({ limit: 5 });
      console.log('Flows response:', flowsResponse);
      console.log('Flows data length:', flowsResponse.data?.length);
      console.log('Flows pagination:', flowsResponse.pagination);

      // Test segments if we have flows
      let segmentsResponse = null;
      if (flowsResponse.data && flowsResponse.data.length > 0) {
        console.log('Testing segments for first flow...');
        const firstFlow = flowsResponse.data[0];
        console.log('First flow:', firstFlow);
        
        try {
          segmentsResponse = await apiClient.getFlowSegments(firstFlow.id, { limit: 5 });
          console.log('Segments response:', segmentsResponse);
          console.log('Segments data length:', segmentsResponse.data?.length);
          console.log('Segments pagination:', segmentsResponse.pagination);
        } catch (segmentError) {
          console.error('Segments error:', segmentError);
        }
      }

      setDebugData({
        health,
        sources: {
          response: sourcesResponse,
          dataLength: sourcesResponse.data?.length || 0,
          pagination: sourcesResponse.pagination
        },
        flows: {
          response: flowsResponse,
          dataLength: flowsResponse.data?.length || 0,
          pagination: flowsResponse.pagination
        },
        segments: segmentsResponse ? {
          response: segmentsResponse,
          dataLength: segmentsResponse.data?.length || 0,
          pagination: segmentsResponse.pagination
        } : null
      });

    } catch (err) {
      console.error('Debug test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card p="md" withBorder>
      <Stack>
        <Group>
          <IconBug size={20} />
          <Text fw={600}>API Debugger</Text>
          <Button
            size="xs"
            leftSection={<IconRefresh size={14} />}
            onClick={runDebugTest}
            loading={loading}
          >
            Run Debug Test
          </Button>
        </Group>

        {loading && (
          <Center py="xl">
            <Loader size="md" />
          </Center>
        )}

        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        {debugData && (
          <Stack>
            <Text fw={500}>Debug Results:</Text>
            
            <div>
              <Text size="sm" fw={500} mb="xs">Health Status:</Text>
              <Badge color="green" size="sm" mb="xs">
                {debugData.health ? 'Connected' : 'Failed'}
              </Badge>
              <Code block>{JSON.stringify(debugData.health, null, 2)}</Code>
            </div>

            <div>
              <Text size="sm" fw={500} mb="xs">Sources:</Text>
              <Group mb="xs">
                <Badge color="blue" size="sm">
                  Data Length: {debugData.sources.dataLength}
                </Badge>
                <Badge color="blue" size="sm">
                  Count: {debugData.sources.pagination?.count || 'N/A'}
                </Badge>
              </Group>
              <Code block>{JSON.stringify(debugData.sources, null, 2)}</Code>
            </div>

            <div>
              <Text size="sm" fw={500} mb="xs">Flows:</Text>
              <Group mb="xs">
                <Badge color="purple" size="sm">
                  Data Length: {debugData.flows.dataLength}
                </Badge>
                <Badge color="purple" size="sm">
                  Count: {debugData.flows.pagination?.count || 'N/A'}
                </Badge>
              </Group>
              <Code block>{JSON.stringify(debugData.flows, null, 2)}</Code>
            </div>

            {debugData.segments && (
              <div>
                <Text size="sm" fw={500} mb="xs">Segments:</Text>
                <Group mb="xs">
                  <Badge color="orange" size="sm">
                    Data Length: {debugData.segments.dataLength}
                  </Badge>
                  <Badge color="orange" size="sm">
                    Count: {debugData.segments.pagination?.count || 'N/A'}
                  </Badge>
                </Group>
                <Code block>{JSON.stringify(debugData.segments, null, 2)}</Code>
              </div>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
