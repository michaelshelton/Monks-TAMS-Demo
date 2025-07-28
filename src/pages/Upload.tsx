import { useState } from 'react';
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
  ActionIcon
} from '@mantine/core';
import { 
  IconUpload, 
  IconFile, 
  IconPlayerPlay, 
  IconTrash, 
  IconAlertCircle,
  IconCheck,
  IconX
} from '@tabler/icons-react';

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
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadHistory, setUploadHistory] = useState(dummyUploadHistory);

  const handleUpload = async () => {
    if (!selectedFlow || !uploadFile) {
      setUploadError('Please select a flow and file');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          
          // Add to upload history
          const newUpload = {
            id: Date.now().toString(),
            fileName: uploadFile.name,
            flowName: dummyFlows.find(f => f.id === selectedFlow)?.label || 'Unknown Flow',
            status: 'completed',
            progress: 100,
            uploadedAt: new Date().toISOString(),
            size: `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB`
          };
          setUploadHistory([newUpload, ...uploadHistory]);
          setUploadFile(null);
          setSelectedFlow(null);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate potential error
    if (Math.random() < 0.1) {
      setTimeout(() => {
        clearInterval(interval);
        setIsUploading(false);
        setUploadError('Upload failed. Please try again.');
        setUploadProgress(0);
      }, 2000);
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
        {upload.status === 'uploading' ? (
          <Progress value={upload.progress} size="sm" />
        ) : (
          <Text size="xs">
            {new Date(upload.uploadedAt).toLocaleString()}
          </Text>
        )}
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
        <Title order={2} mb="md">
          Segment Upload
        </Title>
        <Text size="lg" c="dimmed">
          Upload media segments to your flows
        </Text>
      </Box>

      {/* Upload Form */}
      <Card withBorder mb="lg">
        <Stack gap="md">
          <Title order={3} size="h4">
            Upload New Segment
          </Title>
          
          <Select
            label="Select Flow"
            placeholder="Choose a flow to upload to"
            data={dummyFlows.map(flow => ({
              value: flow.id,
              label: `${flow.label} (${flow.format})`,
              description: `Source: ${flow.source}`
            }))}
            value={selectedFlow}
            onChange={setSelectedFlow}
            required
          />
          
          <FileInput
            label="Media File"
            placeholder="Select media file to upload"
            accept="video/*,audio/*,image/*"
            value={uploadFile}
            onChange={setUploadFile}
            required
            leftSection={<IconFile size={16} />}
          />
          
          {uploadError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              {uploadError}
            </Alert>
          )}
          
          {isUploading && (
            <Box>
              <Text size="sm" mb="xs">Uploading...</Text>
              <Progress value={uploadProgress} size="md" />
            </Box>
          )}
          
          <Button
            leftSection={<IconUpload size={16} />}
            onClick={handleUpload}
            disabled={!selectedFlow || !uploadFile || isUploading}
            loading={isUploading}
          >
            Upload Segment
          </Button>
        </Stack>
      </Card>

      {/* Upload History */}
      <Card withBorder>
        <Box mb="md">
          <Title order={3} size="h4">
            Upload History
          </Title>
          <Text size="sm" c="dimmed">
            Recent segment uploads and their status
          </Text>
        </Box>
        
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>File Name</Table.Th>
              <Table.Th>Size</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Progress/Date</Table.Th>
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
      </Card>
    </Container>
  );
} 