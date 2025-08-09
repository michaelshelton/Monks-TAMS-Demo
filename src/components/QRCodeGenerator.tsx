import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Badge,
  Group,
  Box,
  Button,
  TextInput,
  Select,
  Modal,
  Alert,
  ActionIcon,
  Tooltip,
  Code,
  Divider,
  SimpleGrid,
  Paper
} from '@mantine/core';
import {
  IconQrcode,
  IconDownload,
  IconShare,
  IconCopy,
  IconExternalLink,
  IconDeviceMobile,
  IconBroadcast,
  IconLink,
  IconRefresh,
  IconSettings,
  IconEye,
  IconEyeOff,
  IconCheck,
  IconX
} from '@tabler/icons-react';

// Types for QR code generation
interface QRCodeData {
  id: string;
  type: 'video' | 'session' | 'mobile';
  url: string;
  title: string;
  description?: string;
  expiresAt?: string;
  accessCount: number;
  createdAt: string;
  isActive: boolean;
}

interface QRCodeGeneratorProps {
  videoId?: string;
  sessionId?: string;
  mobileUrl?: string;
  onQRGenerated?: (qrData: QRCodeData) => void;
}

export default function QRCodeGenerator({ 
  videoId, 
  sessionId, 
  mobileUrl, 
  onQRGenerated 
}: QRCodeGeneratorProps) {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);
  const [qrType, setQrType] = useState<'video' | 'session' | 'mobile'>('video');
  const [qrTitle, setQrTitle] = useState('');
  const [qrDescription, setQrDescription] = useState('');
  const [qrExpiry, setQrExpiry] = useState<string>('');

  // Mock QR codes data
  useEffect(() => {
    const mockQRCodes: QRCodeData[] = [
      {
        id: 'qr_001',
        type: 'video',
        url: 'https://mobile.tams.demo/play/comp_1706123456789',
        title: 'BBC News Compilation',
        description: 'Real-time news segments compilation',
        accessCount: 47,
        createdAt: '2025-01-25T10:30:00Z',
        isActive: true
      },
      {
        id: 'qr_002',
        type: 'session',
        url: 'https://mobile.tams.demo/session/sess_1706123456789',
        title: 'Live Sports Session',
        description: 'Real-time sports coverage',
        accessCount: 23,
        createdAt: '2025-01-25T09:15:00Z',
        isActive: true
      },
      {
        id: 'qr_003',
        type: 'mobile',
        url: 'https://mobile.tams.demo/play/comp_1706123456790',
        title: 'Radio Studio Feed',
        description: 'Live radio broadcast',
        accessCount: 12,
        createdAt: '2025-01-25T08:45:00Z',
        isActive: false
      }
    ];
    setQrCodes(mockQRCodes);
  }, []);

  const generateQRCode = () => {
    const qrId = `qr_${Date.now()}`;
    const baseUrl = 'https://mobile.tams.demo';
    
    let url = '';
    let title = qrTitle || 'Generated QR Code';
    
    switch (qrType) {
      case 'video':
        url = `${baseUrl}/play/${videoId || 'comp_' + Date.now()}`;
        title = title || 'Video Access QR';
        break;
      case 'session':
        url = `${baseUrl}/session/${sessionId || 'sess_' + Date.now()}`;
        title = title || 'Session Access QR';
        break;
      case 'mobile':
        url = mobileUrl || `${baseUrl}/mobile/${Date.now()}`;
        title = title || 'Mobile Access QR';
        break;
    }

    const newQR: QRCodeData = {
      id: qrId,
      type: qrType,
      url,
      title,
      description: qrDescription,
      expiresAt: qrExpiry || undefined,
      accessCount: 0,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    setQrCodes(prev => [newQR, ...prev]);
    setShowGeneratorModal(false);
    onQRGenerated?.(newQR);
    
    // Reset form
    setQrTitle('');
    setQrDescription('');
    setQrExpiry('');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <IconBroadcast size={16} />;
      case 'session': return <IconDeviceMobile size={16} />;
      case 'mobile': return <IconLink size={16} />;
      default: return <IconQrcode size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'blue';
      case 'session': return 'green';
      case 'mobile': return 'orange';
      default: return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <Container size="xl">
      <Card shadow="sm" p="xl">
        <Stack gap="lg">
          <Group justify="space-between">
            <Box>
              <Title order={3}>QR Code Generator</Title>
              <Text c="dimmed" size="sm">
                Generate QR codes for mobile video access
              </Text>
            </Box>
            <Button
              leftSection={<IconQrcode size={16} />}
              onClick={() => setShowGeneratorModal(true)}
            >
              Generate QR Code
            </Button>
          </Group>

          {/* QR Codes List */}
          <Card withBorder p="md">
            <Stack gap="md">
              <Title order={4}>Generated QR Codes</Title>
              
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {qrCodes.map((qr) => (
                  <Card key={qr.id} withBorder p="md">
                    <Stack gap="sm">
                      <Group justify="space-between">
                        <Group gap="xs">
                          {getTypeIcon(qr.type)}
                          <Badge color={getTypeColor(qr.type)} variant="light" size="sm">
                            {qr.type}
                          </Badge>
                        </Group>
                        <Badge 
                          color={qr.isActive ? 'green' : 'gray'} 
                          variant="light" 
                          size="xs"
                        >
                          {qr.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Group>

                      <Box>
                        <Text fw={500} size="sm" mb={4}>
                          {qr.title}
                        </Text>
                        {qr.description && (
                          <Text size="xs" c="dimmed" mb={8}>
                            {qr.description}
                          </Text>
                        )}
                      </Box>

                      <Group gap="xs">
                        <Text size="xs" c="dimmed">
                          Created: {formatDate(qr.createdAt)}
                        </Text>
                        <Text size="xs" c="dimmed">
                          • {qr.accessCount} accesses
                        </Text>
                      </Group>

                      <Group gap="xs">
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconEye size={12} />}
                          onClick={() => {
                            setSelectedQR(qr);
                            setShowQRModal(true);
                          }}
                        >
                          View QR
                        </Button>
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconCopy size={12} />}
                          onClick={() => copyToClipboard(qr.url)}
                        >
                          Copy URL
                        </Button>
                        <ActionIcon
                          size="sm"
                          variant="light"
                          color="red"
                        >
                          <IconX size={12} />
                        </ActionIcon>
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            </Stack>
          </Card>

          {/* Mobile Access Statistics */}
          <Card withBorder p="md">
            <Stack gap="md">
              <Title order={4}>Mobile Access Statistics</Title>
              
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                <Paper p="md" withBorder>
                  <Stack gap="xs" align="center">
                    <Text size="lg" fw={700} c="blue">
                      {qrCodes.reduce((sum, qr) => sum + qr.accessCount, 0)}
                    </Text>
                    <Text size="xs" c="dimmed">Total Accesses</Text>
                  </Stack>
                </Paper>
                
                <Paper p="md" withBorder>
                  <Stack gap="xs" align="center">
                    <Text size="lg" fw={700} c="green">
                      {qrCodes.filter(qr => qr.isActive).length}
                    </Text>
                    <Text size="xs" c="dimmed">Active QR Codes</Text>
                  </Stack>
                </Paper>
                
                <Paper p="md" withBorder>
                  <Stack gap="xs" align="center">
                    <Text size="lg" fw={700} c="orange">
                      {qrCodes.length}
                    </Text>
                    <Text size="xs" c="dimmed">Total QR Codes</Text>
                  </Stack>
                </Paper>
                
                <Paper p="md" withBorder>
                  <Stack gap="xs" align="center">
                    <Text size="lg" fw={700} c="purple">
                      {qrCodes.length > 0 
                        ? Math.round(qrCodes.reduce((sum, qr) => sum + qr.accessCount, 0) / qrCodes.length)
                        : 0
                      }
                    </Text>
                    <Text size="xs" c="dimmed">Avg. Accesses</Text>
                  </Stack>
                </Paper>
              </SimpleGrid>
            </Stack>
          </Card>
        </Stack>
      </Card>

      {/* QR Code Generator Modal */}
      <Modal
        opened={showGeneratorModal}
        onClose={() => setShowGeneratorModal(false)}
        title="Generate QR Code"
        size="md"
      >
        <Stack gap="lg">
          <Select
            label="QR Code Type"
            value={qrType}
            onChange={(value) => setQrType(value as 'video' | 'session' | 'mobile')}
            data={[
              { value: 'video', label: 'Video Access' },
              { value: 'session', label: 'Session Access' },
              { value: 'mobile', label: 'Mobile Access' }
            ]}
          />

          <TextInput
            label="Title"
            placeholder="Enter QR code title"
            value={qrTitle}
            onChange={(e) => setQrTitle(e.target.value)}
          />

          <TextInput
            label="Description (Optional)"
            placeholder="Enter description"
            value={qrDescription}
            onChange={(e) => setQrDescription(e.target.value)}
          />

          <TextInput
            label="Expiry Date (Optional)"
            placeholder="YYYY-MM-DD"
            value={qrExpiry}
            onChange={(e) => setQrExpiry(e.target.value)}
          />

          <Group>
            <Button onClick={generateQRCode}>
              Generate QR Code
            </Button>
            <Button variant="light" onClick={() => setShowGeneratorModal(false)}>
              Cancel
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* QR Code Display Modal */}
      <Modal
        opened={showQRModal}
        onClose={() => setShowQRModal(false)}
        title={selectedQR?.title || 'QR Code'}
        size="sm"
      >
        {selectedQR && (
          <Stack gap="lg" align="center">
            <Box
              style={{
                width: '200px',
                height: '200px',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                border: '2px dashed #ccc'
              }}
            >
              <Text c="dimmed" size="sm" ta="center">
                QR Code Image<br />
                (Would be generated here)
              </Text>
            </Box>

            <Stack gap="xs" style={{ width: '100%' }}>
              <Text size="sm" fw={500}>Access URL:</Text>
              <Code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                {selectedQR.url}
              </Code>
            </Stack>

            <Group>
              <Button
                size="sm"
                leftSection={<IconDownload size={14} />}
              >
                Download QR
              </Button>
              <Button
                size="sm"
                variant="light"
                leftSection={<IconShare size={14} />}
              >
                Share
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
