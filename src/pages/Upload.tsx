import { useState, useEffect } from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Button, 
  Stack, 
  Card, 
  Group, 
  Badge,
  Select,
  TextInput,
  FileInput,
  Progress,
  Alert,
  Box,
  Divider,
  Table,
  ActionIcon,
  Loader
} from '@mantine/core';
import { 
  IconUpload, 
  IconFile, 
  IconPlayerPlay, 
  IconTrash, 
  IconAlertCircle,
  IconCheck,
  IconX,
  IconRefresh
} from '@tabler/icons-react';
import { apiClient } from '../services/api';

// Mock data for flows (will be replaced with real API calls)
const dummyFlows = [
  { id: '1', label: 'BBC News Studio Feed', format: 'Video', source: 'BBC News Studio' },
  { id: '2', label: 'Radio Studio A', format: 'Audio', source: 'Radio Studio A' },
  { id: '3', label: 'Sports Arena Camera', format: 'Video', source: 'Sports Arena Camera' },
  { id: '4', label: 'Photo Studio Feed', format: 'Image', source: 'Photo Studio' }
];

// Mock upload history
const dummyUploadHistory = [
  {
    id: '1',
    fileName: 'news_segment_001.mp4',
    flowName: 'BBC News Studio Feed',
    status: 'completed',
    progress: 100,
    uploadedAt: '2025-01-25T10:30:00Z',
    size: '15.2 MB'
  },
  {
    id: '2',
    fileName: 'radio_segment_001.wav',
    flowName: 'Radio Studio A',
    status: 'uploading',
    progress: 65,
    uploadedAt: '2025-01-25T10:25:00Z',
    size: '8.7 MB'
  },
  {
    id: '3',
    fileName: 'sports_segment_001.mp4',
    flowName: 'Sports Arena Camera',
    status: 'failed',
    progress: 0,
    uploadedAt: '2025-01-25T10:20:00Z',
    size: '45.1 MB'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'green';
    case 'uploading':
      return 'blue';
    case 'failed':
      return 'red';
    default:
      return 'gray';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <IconCheck size={16} />;
    case 'uploading':
      return <IconUpload size={16} />;
    case 'failed':
      return <IconX size={16} />;
    default:
      return <IconFile size={16} />;
  }
};

export default function Upload() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New form state variables
  const [flowLabel, setFlowLabel] = useState('');
  const [flowDescription, setFlowDescription] = useState('');
  const [contentFormat, setContentFormat] = useState<string | null>(null);
  const [codec, setCodec] = useState('');

  // Fetch sources from API
  useEffect(() => {
    const fetchSources = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const sourcesResponse = await apiClient.getSources();
        setSources(sourcesResponse.data || []);
        
      } catch (err: any) {
        setError('Failed to fetch sources');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSources();
  }, []);

  const refreshSources = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const sourcesResponse = await apiClient.getSources();
      setSources(sourcesResponse.data || []);
      
    } catch (err: any) {
      setError('Failed to refresh sources');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedSource || !flowLabel || !contentFormat || !codec) {
      setUploadError('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Create a flow object based on the selected format
      let flowData: any = {
        id: `flow_${Date.now()}`,
        source_id: selectedSource,
        format: contentFormat,
        codec: codec,
        label: flowLabel,
        description: flowDescription || undefined,
        created_by: 'admin',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };

      // Add format-specific fields
      if (contentFormat === "urn:x-nmos:format:video") {
        flowData = {
          ...flowData,
          frame_width: 1920,
          frame_height: 1080,
          frame_rate: "25/1",
          interlace_mode: "progressive",
          color_sampling: "4:2:2",
          color_space: "BT709",
          transfer_characteristics: "BT709",
          color_primaries: "BT709"
        };
      } else if (contentFormat === "urn:x-nmos:format:audio") {
        flowData = {
          ...flowData,
          sample_rate: 48000,
          bits_per_sample: 16,
          channels: 2
        };
      }

      // Create the flow using the API
      const response = await apiClient.createFlow(flowData);
      
      // Update progress to 100%
      setUploadProgress(100);
      
      // Add to upload history
      const newUpload = {
        id: Date.now().toString(),
        fileName: flowLabel,
        flowName: `Created Flow: ${flowLabel}`,
        status: 'completed',
        progress: 100,
        uploadedAt: new Date().toISOString(),
        size: `${contentFormat} - ${codec}`
      };
      setUploadHistory([newUpload, ...uploadHistory]);
      
      // Reset form
      setUploadFile(null);
      setSelectedSource(null);
      setFlowLabel('');
      setFlowDescription('');
      setContentFormat(null);
      setCodec('');
      
    } catch (err: any) {
      setUploadError('Flow creation failed. Please try again.');
      console.error('Flow creation error:', err);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteUpload = (uploadId: string) => {
    setUploadHistory(uploadHistory.filter(upload => upload.id !== uploadId));
  };

  const rows = uploadHistory.map((upload) => (
    <Table.Tr key={upload.id}>
      <Table.Td>
        <Box>
          <Group gap="xs" mb={4}>
            {getStatusIcon(upload.status)}
            <Text fw={600}>
              {upload.fileName}
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            {upload.flowName}
          </Text>
        </Box>
      </Table.Td>
      
      <Table.Td>
        <Text size="sm">{upload.size}</Text>
      </Table.Td>
      
      <Table.Td>
        <Badge color={getStatusColor(upload.status)} variant="light">
          {upload.status}
        </Badge>
      </Table.Td>
      
      <Table.Td>
        <Text size="xs">
          {new Date(upload.uploadedAt).toLocaleString()}
        </Text>
      </Table.Td>
      
      <Table.Td>
        <Group gap="xs">
          <ActionIcon 
            size="sm" 
            variant="subtle"
            color="blue"
          >
            <IconPlayerPlay size={16} />
          </ActionIcon>
          <ActionIcon 
            size="sm" 
            variant="subtle" 
            color="red"
            onClick={() => handleDeleteUpload(upload.id)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl" px="xl" py="xl">
      <Box mb="xl">
        <Group justify="space-between" align="flex-end">
          <Box>
            <Title order={2} mb="md">
              Flow Creation
            </Title>
            <Text size="lg" c="dimmed">
              Create new media flows from your sources
            </Text>
          </Box>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={refreshSources}
            loading={loading}
          >
            Refresh
          </Button>
        </Group>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          color="red" 
          title="Error"
          withCloseButton
          onClose={() => setError(null)}
          mb="md"
        >
          {error}
        </Alert>
      )}

      {/* Upload Form */}
      {loading ? (
        <Box ta="center" py="xl">
          <Loader size="lg" />
          <Text mt="md" c="dimmed">Loading sources...</Text>
        </Box>
      ) : sources.length === 0 ? (
        <Box ta="center" py="xl">
          <Text c="dimmed">No sources available. Please create some sources first.</Text>
        </Box>
      ) : (
        <Card withBorder mb="lg">
          <Stack gap="md">
            <Title order={3} size="h4">
              Create New Flow
            </Title>
            
            <Select
              label="Select Source"
              placeholder="Choose a source for the flow"
              data={sources.map(source => ({
                value: source.id,
                label: `${source.label || source.id} (${source.format})`,
                description: `ID: ${source.id}`
              }))}
              value={selectedSource}
              onChange={setSelectedSource}
              required
              disabled={loading}
            />
            
            <TextInput
              label="Flow Label"
              placeholder="Enter a descriptive label for the flow"
              value={flowLabel}
              onChange={(e) => setFlowLabel(e.target.value)}
              required
            />
            
            <TextInput
              label="Flow Description"
              placeholder="Optional description of the flow"
              value={flowDescription}
              onChange={(e) => setFlowDescription(e.target.value)}
            />
            
            <Select
              label="Content Format"
              placeholder="Select the content format"
              data={[
                { value: "urn:x-nmos:format:video", label: "Video" },
                { value: "urn:x-nmos:format:audio", label: "Audio" },
                { value: "urn:x-tam:format:image", label: "Image" },
                { value: "urn:x-nmos:format:data", label: "Data" },
                { value: "urn:x-nmos:format:multi", label: "Multi" }
              ]}
              value={contentFormat}
              onChange={setContentFormat}
              required
            />
            
            <TextInput
              label="Codec (MIME Type)"
              placeholder="e.g., video/mp4, audio/wav"
              value={codec}
              onChange={(e) => setCodec(e.target.value)}
              required
            />
            
            <FileInput
              label="Media File (Optional)"
              placeholder="Select media file for reference"
              accept="video/*,audio/*,image/*"
              value={uploadFile}
              onChange={setUploadFile}
              leftSection={<IconFile size={16} />}
            />
            
            {uploadError && (
              <Alert icon={<IconAlertCircle size={16} />} color="red">
                {uploadError}
              </Alert>
            )}
            
            {isUploading && (
              <Box>
                <Text size="sm" mb="xs">Creating flow...</Text>
                <Progress value={uploadProgress} size="md" />
              </Box>
            )}
            
            <Button
              leftSection={<IconUpload size={16} />}
              onClick={handleUpload}
              disabled={!selectedSource || !flowLabel || !contentFormat || !codec || isUploading}
              loading={isUploading}
            >
              Create Flow
            </Button>
          </Stack>
        </Card>
      )}

      {/* Upload History */}
      <Card withBorder>
        <Box mb="md">
          <Title order={3} size="h4">
            Flow Creation History
          </Title>
          <Text size="sm" c="dimmed">
            Recent flows created and their status
          </Text>
        </Box>
        
        {loading ? (
          <Box ta="center" py="xl">
            <Loader size="sm" />
            <Text mt="md" c="dimmed">Loading...</Text>
          </Box>
        ) : (
          <>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Flow Name</Table.Th>
                  <Table.Th>Format & Codec</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Created Date</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows}
              </Table.Tbody>
            </Table>
            
            {uploadHistory.length === 0 && (
              <Box ta="center" py="xl">
                <Text c="dimmed">No uploads yet</Text>
              </Box>
            )}
          </>
        )}
      </Card>
    </Container>
  );
} 