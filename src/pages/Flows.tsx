import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Card,
  Text,
  Badge,
  Group,
  Box,
  Button,
  Table,
  ActionIcon,
  Modal,
  TextInput,
  Select,
  Textarea,
  Stack,
  NumberInput,
  MultiSelect,
  Alert,
  Pagination,
  TextInput as MantineTextInput
} from '@mantine/core';
import AdvancedFilter, { FilterOption, FilterState, FilterPreset } from '../components/AdvancedFilter';
import { useFilterPersistence } from '../hooks/useFilterPersistence';
import { 
  IconVideo, 
  IconMusic, 
  IconDatabase, 
  IconPhoto, 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconEye,
  IconFilter,
  IconSearch,
  IconDots,
  IconTag,
  IconClock,
  IconAlertCircle,
  IconX
} from '@tabler/icons-react';

// Mock data structure based on backend API models
interface Flow {
  id: string;
  source_id: string;
  format: string;
  codec: string;
  label?: string;
  description?: string;
  created_by?: string;
  updated_by?: string;
  created?: string;
  updated?: string;
  tags?: Record<string, string>;
  // Video-specific fields
  frame_width?: number;
  frame_height?: number;
  frame_rate?: string;
  // Audio-specific fields
  sample_rate?: number;
  bits_per_sample?: number;
  channels?: number;
  // Common fields
  container?: string;
  read_only?: boolean;
  status?: string;
  views?: number;
  duration?: string;
}

const dummyFlows: Flow[] = [
  {
    id: '1',
    source_id: '1',
    format: 'urn:x-nmos:format:video',
    codec: 'video/mp4',
    label: 'Live News Feed',
    description: '24/7 news video stream with real-time updates and breaking news coverage.',
    created_by: 'admin',
    created: '2025-01-15T10:00:00Z',
    updated: '2025-01-15T10:00:00Z',
    tags: { category: 'news', type: 'live', quality: 'hd' },
    frame_width: 1920,
    frame_height: 1080,
    frame_rate: '25/1',
    container: 'mp4',
    status: 'active',
    views: 1247,
    duration: '24h'
  },
  {
    id: '2',
    source_id: '2',
    format: 'urn:x-nmos:format:audio',
    codec: 'audio/wav',
    label: 'Nature Audio',
    description: 'Ambient nature sounds for relaxation and focus.',
    created_by: 'admin',
    created: '2025-01-10T09:00:00Z',
    updated: '2025-01-12T14:30:00Z',
    tags: { category: 'nature', type: 'ambient', mood: 'relaxing' },
    sample_rate: 44100,
    bits_per_sample: 16,
    channels: 2,
    container: 'wav',
    status: 'active',
    views: 892,
    duration: '2h'
  },
  {
    id: '3',
    source_id: '3',
    format: 'urn:x-nmos:format:video',
    codec: 'video/mp4',
    label: 'Sports Highlights',
    description: 'Daily sports highlight clips and game summaries.',
    created_by: 'admin',
    created: '2025-01-08T16:00:00Z',
    updated: '2025-01-08T16:00:00Z',
    tags: { category: 'sports', type: 'highlights', quality: '4k' },
    frame_width: 3840,
    frame_height: 2160,
    frame_rate: '30/1',
    container: 'mp4',
    status: 'processing',
    views: 2156,
    duration: '1h'
  },
  {
    id: '4',
    source_id: '4',
    format: 'urn:x-tam:format:image',
    codec: 'image/jpeg',
    label: 'Photo Studio Feed',
    description: 'High-resolution photography studio feed.',
    created_by: 'admin',
    created: '2025-01-05T11:00:00Z',
    updated: '2025-01-05T11:00:00Z',
    tags: { category: 'photography', type: 'studio', quality: 'raw' },
    frame_width: 6000,
    frame_height: 4000,
    container: 'jpeg',
    status: 'active',
    views: 567,
    duration: '8h'
  }
];

const dummySources = [
  { id: '1', label: 'BBC News Studio' },
  { id: '2', label: 'Radio Studio A' },
  { id: '3', label: 'Sports Arena Camera' },
  { id: '4', label: 'Photo Studio' }
];

const getFormatIcon = (format: string) => {
  switch (format) {
    case 'urn:x-nmos:format:video':
      return <IconVideo size={16} />;
    case 'urn:x-nmos:format:audio':
      return <IconMusic size={16} />;
    case 'urn:x-nmos:format:data':
      return <IconDatabase size={16} />;
    case 'urn:x-tam:format:image':
      return <IconPhoto size={16} />;
    default:
      return <IconDatabase size={16} />;
  }
};

const getFormatLabel = (format: string) => {
  switch (format) {
    case 'urn:x-nmos:format:video':
      return 'Video';
    case 'urn:x-nmos:format:audio':
      return 'Audio';
    case 'urn:x-nmos:format:data':
      return 'Data';
    case 'urn:x-tam:format:image':
      return 'Image';
    default:
      return 'Unknown';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'green';
    case 'processing': return 'orange';
    case 'error': return 'red';
    default: return 'gray';
  }
};

export default function Flows() {
  const navigate = useNavigate();
  const [flows, setFlows] = useState<Flow[]>(dummyFlows);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
    // Advanced filtering
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useFilterPersistence('flows');
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);

  // Define filter options
  const filterOptions: FilterOption[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search flows by name or description...'
    },
    {
      key: 'format',
      label: 'Format',
      type: 'select',
      options: [
        { value: 'urn:x-nmos:format:video', label: 'Video' },
        { value: 'urn:x-nmos:format:audio', label: 'Audio' },
        { value: 'urn:x-nmos:format:data', label: 'Data' },
        { value: 'urn:x-tam:format:image', label: 'Image' }
      ]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'processing', label: 'Processing' },
        { value: 'error', label: 'Error' }
      ]
    },
    {
      key: 'created',
      label: 'Created Date',
      type: 'date',
      placeholder: 'Select date range'
    },
    {
      key: 'tags',
      label: 'Tags',
      type: 'text',
      placeholder: 'Filter by tag key:value'
    }
  ];

  const filteredFlows = flows.filter(flow => {
    // Search filter
    const searchTerm = filters.search?.toLowerCase();
    const matchesSearch = !searchTerm || 
      flow.label?.toLowerCase().includes(searchTerm) ||
      flow.description?.toLowerCase().includes(searchTerm);

    // Format filter
    const formatFilter = filters.format;
    const matchesFormat = !formatFilter || flow.format === formatFilter;

    // Status filter
    const statusFilter = filters.status;
    const matchesStatus = !statusFilter || flow.status === statusFilter;

    // Created date filter
    const createdFilter = filters.created;
    const matchesCreated = !createdFilter || (() => {
      // Simplified date filtering for demo
      switch (createdFilter) {
        case 'today':
        case 'yesterday':
        case 'last_7_days':
        case 'last_30_days':
        case 'last_90_days':
        case 'this_month':
        case 'last_month':
        case 'this_year':
        case 'last_year':
          return true; // For demo, show all items
        default:
          return true;
      }
    })();

    // Tags filter
    const tagsFilter = filters.tags;
    const matchesTags = !tagsFilter || 
      (flow.tags && Object.entries(flow.tags).some(([key, value]) => 
        `${key}:${value}`.toLowerCase().includes(tagsFilter.toLowerCase())
      ));

    return matchesSearch && matchesFormat && matchesStatus && matchesCreated && matchesTags;
  });

  const handleCreateFlow = (newFlow: Omit<Flow, 'id' | 'created' | 'updated'>) => {
    const flow: Flow = {
      ...newFlow,
      id: (flows.length + 1).toString(),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      created_by: 'admin',
      status: 'active',
      views: 0,
      duration: '0h'
    };
    setFlows([...flows, flow]);
    setShowCreateModal(false);
  };

  const handleUpdateFlow = (updatedFlow: Flow) => {
    setFlows(flows.map(f => f.id === updatedFlow.id ? updatedFlow : f));
    setShowEditModal(false);
    setSelectedFlow(null);
  };

  const handleDeleteFlow = (flowId: string) => {
    setFlows(flows.filter(f => f.id !== flowId));
    setShowDeleteModal(false);
    setSelectedFlow(null);
  };

  const rows = filteredFlows.map((flow) => (
    <Table.Tr key={flow.id}>
      <Table.Td>
        <Box>
          <Group gap="xs" mb={4}>
            {getFormatIcon(flow.format)}
            <Text 
              fw={600} 
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/flow-details/${flow.id}`)}
              c="blue"
            >
              {flow.label || 'Unnamed Flow'}
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            {flow.description || 'No description'}
          </Text>
        </Box>
      </Table.Td>
      
      <Table.Td>
        <Badge color="blue" variant="light">
          {getFormatLabel(flow.format)}
        </Badge>
      </Table.Td>
      
      <Table.Td>
        <Badge 
          color={getStatusColor(flow.status || 'unknown')} 
          variant="dot"
        >
          {flow.status || 'unknown'}
        </Badge>
      </Table.Td>
      
      <Table.Td>
        <Group gap="xs">
          <Group gap={4}>
            <IconEye size={14} />
            <Text size="xs">
              {flow.views?.toLocaleString() || '0'}
            </Text>
          </Group>
        </Group>
      </Table.Td>
      
      <Table.Td>
        <Group gap="xs">
          <Group gap={4}>
            <IconClock size={14} />
            <Text size="xs">
              {flow.duration || '0h'}
            </Text>
          </Group>
        </Group>
      </Table.Td>
      
      <Table.Td>
        <Group gap="xs">
          {flow.tags && Object.entries(flow.tags).map(([key, value]) => (
            <Badge 
              key={key} 
              color="gray" 
              variant="outline"
              leftSection={<IconTag size={10} />}
              size="xs"
            >
              {key}: {value}
            </Badge>
          ))}
        </Group>
      </Table.Td>
      
      <Table.Td>
        <Group gap="xs">
          <ActionIcon 
            size="sm" 
            variant="subtle"
            onClick={() => {
              setSelectedFlow(flow);
              setShowEditModal(true);
            }}
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon 
            size="sm" 
            variant="subtle" 
            color="red"
            onClick={() => {
              setSelectedFlow(flow);
              setShowDeleteModal(true);
            }}
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
              Media Flows
            </Title>
            <Text size="lg" c="dimmed">
              Manage and monitor your time-addressable media streams
            </Text>
          </Box>
          <Button 
            leftSection={<IconPlus size={16} />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Flow
          </Button>
        </Group>
      </Box>

      {/* Advanced Filters */}
      <AdvancedFilter
        filters={filterOptions}
        value={filters}
        onChange={updateFilters}
        presets={savedPresets}
        onPresetSave={(preset) => setSavedPresets([...savedPresets, preset])}
        onPresetDelete={(presetId) => setSavedPresets(savedPresets.filter(p => p.id !== presetId))}
      />

      {/* Flows Table */}
      <Card withBorder>
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Flow Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Views</Table.Th>
              <Table.Th>Duration</Table.Th>
              <Table.Th>Tags</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows}
          </Table.Tbody>
        </Table>
        
        {filteredFlows.length === 0 && (
          <Box ta="center" py="xl">
            <Text c="dimmed">No flows found matching your filters</Text>
          </Box>
        )}
      </Card>

      {/* Pagination */}
      {filteredFlows.length > 0 && (
        <Group justify="center" mt="lg">
          <Pagination 
            total={Math.ceil(filteredFlows.length / 10)} 
            value={currentPage} 
            onChange={setCurrentPage}
          />
        </Group>
      )}

      {/* Create Flow Modal */}
      <CreateFlowModal 
        opened={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateFlow}
      />

      {/* Edit Flow Modal */}
      {selectedFlow && (
        <EditFlowModal
          flow={selectedFlow}
          opened={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedFlow(null);
          }}
          onSubmit={handleUpdateFlow}
        />
      )}

      {/* Delete Confirmation Modal */}
      {selectedFlow && (
        <DeleteFlowModal
          flow={selectedFlow}
          opened={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedFlow(null);
          }}
          onConfirm={() => handleDeleteFlow(selectedFlow.id)}
        />
      )}
    </Container>
  );
}

// Modal Components
interface CreateFlowModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (flow: Omit<Flow, 'id' | 'created' | 'updated'>) => void;
}

function CreateFlowModal({ opened, onClose, onSubmit }: CreateFlowModalProps) {
  const [formData, setFormData] = useState({
    source_id: '',
    format: 'urn:x-nmos:format:video',
    codec: '',
    label: '',
    description: '',
    frame_width: 1920,
    frame_height: 1080,
    frame_rate: '25/1',
    sample_rate: 44100,
    bits_per_sample: 16,
    channels: 2,
    container: '',
    tags: {} as Record<string, string>
  });

  const [tagKey, setTagKey] = useState('');
  const [tagValue, setTagValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      source_id: '',
      format: 'urn:x-nmos:format:video',
      codec: '',
      label: '',
      description: '',
      frame_width: 1920,
      frame_height: 1080,
      frame_rate: '25/1',
      sample_rate: 44100,
      bits_per_sample: 16,
      channels: 2,
      container: '',
      tags: {}
    });
  };

  const addTag = () => {
    if (tagKey && tagValue) {
      setFormData({
        ...formData,
        tags: { ...formData.tags, [tagKey]: tagValue }
      });
      setTagKey('');
      setTagValue('');
    }
  };

  const removeTag = (key: string) => {
    const newTags = { ...formData.tags };
    delete newTags[key];
    setFormData({ ...formData, tags: newTags });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create New Flow" size="lg">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Select
            label="Source"
            placeholder="Select source"
            data={dummySources.map(source => ({
              value: source.id,
              label: source.label
            }))}
            value={formData.source_id}
            onChange={(value) => setFormData({ ...formData, source_id: value || '' })}
            required
          />
          
          <Select
            label="Format"
            data={[
              { value: 'urn:x-nmos:format:video', label: 'Video' },
              { value: 'urn:x-nmos:format:audio', label: 'Audio' },
              { value: 'urn:x-nmos:format:data', label: 'Data' },
              { value: 'urn:x-tam:format:image', label: 'Image' }
            ]}
            value={formData.format}
            onChange={(value) => setFormData({ ...formData, format: value || 'urn:x-nmos:format:video' })}
            required
          />
          
          <TextInput
            label="Codec"
            placeholder="e.g., video/mp4, audio/wav"
            value={formData.codec}
            onChange={(e) => setFormData({ ...formData, codec: e.currentTarget.value })}
            required
          />
          
          <TextInput
            label="Label"
            placeholder="Flow name"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.currentTarget.value })}
            required
          />
          
          <Textarea
            label="Description"
            placeholder="Flow description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
            rows={3}
          />
          
          <TextInput
            label="Container"
            placeholder="e.g., mp4, wav, jpeg"
            value={formData.container}
            onChange={(e) => setFormData({ ...formData, container: e.currentTarget.value })}
          />
          
          {/* Video-specific fields */}
          {formData.format === 'urn:x-nmos:format:video' && (
            <Group grow>
                             <NumberInput
                 label="Frame Width"
                 value={formData.frame_width}
                 onChange={(value) => setFormData({ ...formData, frame_width: typeof value === 'number' ? value : 1920 })}
                 min={1}
               />
               <NumberInput
                 label="Frame Height"
                 value={formData.frame_height}
                 onChange={(value) => setFormData({ ...formData, frame_height: typeof value === 'number' ? value : 1080 })}
                 min={1}
               />
              <TextInput
                label="Frame Rate"
                placeholder="e.g., 25/1"
                value={formData.frame_rate}
                onChange={(e) => setFormData({ ...formData, frame_rate: e.currentTarget.value })}
              />
            </Group>
          )}
          
          {/* Audio-specific fields */}
          {formData.format === 'urn:x-nmos:format:audio' && (
            <Group grow>
                             <NumberInput
                 label="Sample Rate"
                 value={formData.sample_rate}
                 onChange={(value) => setFormData({ ...formData, sample_rate: typeof value === 'number' ? value : 44100 })}
                 min={1}
               />
               <NumberInput
                 label="Bits Per Sample"
                 value={formData.bits_per_sample}
                 onChange={(value) => setFormData({ ...formData, bits_per_sample: typeof value === 'number' ? value : 16 })}
                 min={1}
               />
               <NumberInput
                 label="Channels"
                 value={formData.channels}
                 onChange={(value) => setFormData({ ...formData, channels: typeof value === 'number' ? value : 2 })}
                 min={1}
               />
            </Group>
          )}
          
          {/* Tags */}
          <Box>
            <Text size="sm" fw={500} mb="xs">Tags</Text>
            <Group gap="xs" mb="xs">
              <TextInput
                placeholder="Tag key"
                value={tagKey}
                onChange={(e) => setTagKey(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <TextInput
                placeholder="Tag value"
                value={tagValue}
                onChange={(e) => setTagValue(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <Button size="sm" onClick={addTag}>Add</Button>
            </Group>
            <Group gap="xs">
              {Object.entries(formData.tags).map(([key, value]) => (
                <Badge 
                  key={key} 
                  color="blue" 
                  variant="light"
                  rightSection={
                    <ActionIcon 
                      size="xs" 
                      variant="subtle" 
                      onClick={() => removeTag(key)}
                    >
                      <IconX size={10} />
                    </ActionIcon>
                  }
                >
                  {key}: {value}
                </Badge>
              ))}
            </Group>
          </Box>
          
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create Flow</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

interface EditFlowModalProps {
  flow: Flow;
  opened: boolean;
  onClose: () => void;
  onSubmit: (flow: Flow) => void;
}

function EditFlowModal({ flow, opened, onClose, onSubmit }: EditFlowModalProps) {
  const [formData, setFormData] = useState({
    ...flow,
    tags: flow.tags || {}
  });

  const [tagKey, setTagKey] = useState('');
  const [tagValue, setTagValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...flow,
      ...formData,
      updated: new Date().toISOString(),
      updated_by: 'admin'
    });
  };

  const addTag = () => {
    if (tagKey && tagValue) {
      setFormData({
        ...formData,
        tags: { ...formData.tags, [tagKey]: tagValue }
      });
      setTagKey('');
      setTagValue('');
    }
  };

  const removeTag = (key: string) => {
    const newTags = { ...formData.tags };
    delete newTags[key];
    setFormData({ ...formData, tags: newTags });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Flow" size="lg">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Label"
            placeholder="Flow name"
            value={formData.label || ''}
            onChange={(e) => setFormData({ ...formData, label: e.currentTarget.value })}
            required
          />
          
          <Textarea
            label="Description"
            placeholder="Flow description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
            rows={3}
          />
          
          <TextInput
            label="Codec"
            placeholder="e.g., video/mp4, audio/wav"
            value={formData.codec}
            onChange={(e) => setFormData({ ...formData, codec: e.currentTarget.value })}
            required
          />
          
          <TextInput
            label="Container"
            placeholder="e.g., mp4, wav, jpeg"
            value={formData.container || ''}
            onChange={(e) => setFormData({ ...formData, container: e.currentTarget.value })}
          />
          
          {/* Video-specific fields */}
          {formData.format === 'urn:x-nmos:format:video' && (
            <Group grow>
                             <NumberInput
                 label="Frame Width"
                 value={formData.frame_width || 1920}
                 onChange={(value) => setFormData({ ...formData, frame_width: typeof value === 'number' ? value : 1920 })}
                 min={1}
               />
               <NumberInput
                 label="Frame Height"
                 value={formData.frame_height || 1080}
                 onChange={(value) => setFormData({ ...formData, frame_height: typeof value === 'number' ? value : 1080 })}
                 min={1}
               />
              <TextInput
                label="Frame Rate"
                placeholder="e.g., 25/1"
                value={formData.frame_rate || ''}
                onChange={(e) => setFormData({ ...formData, frame_rate: e.currentTarget.value })}
              />
            </Group>
          )}
          
          {/* Audio-specific fields */}
          {formData.format === 'urn:x-nmos:format:audio' && (
            <Group grow>
                             <NumberInput
                 label="Sample Rate"
                 value={formData.sample_rate || 44100}
                 onChange={(value) => setFormData({ ...formData, sample_rate: typeof value === 'number' ? value : 44100 })}
                 min={1}
               />
               <NumberInput
                 label="Bits Per Sample"
                 value={formData.bits_per_sample || 16}
                 onChange={(value) => setFormData({ ...formData, bits_per_sample: typeof value === 'number' ? value : 16 })}
                 min={1}
               />
               <NumberInput
                 label="Channels"
                 value={formData.channels || 2}
                 onChange={(value) => setFormData({ ...formData, channels: typeof value === 'number' ? value : 2 })}
                 min={1}
               />
            </Group>
          )}
          
          {/* Tags */}
          <Box>
            <Text size="sm" fw={500} mb="xs">Tags</Text>
            <Group gap="xs" mb="xs">
              <TextInput
                placeholder="Tag key"
                value={tagKey}
                onChange={(e) => setTagKey(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <TextInput
                placeholder="Tag value"
                value={tagValue}
                onChange={(e) => setTagValue(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <Button size="sm" onClick={addTag}>Add</Button>
            </Group>
            <Group gap="xs">
              {Object.entries(formData.tags).map(([key, value]) => (
                <Badge 
                  key={key} 
                  color="blue" 
                  variant="light"
                  rightSection={
                    <ActionIcon 
                      size="xs" 
                      variant="subtle" 
                      onClick={() => removeTag(key)}
                    >
                      <IconX size={10} />
                    </ActionIcon>
                  }
                >
                  {key}: {value}
                </Badge>
              ))}
            </Group>
          </Box>
          
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={onClose}>Cancel</Button>
            <Button type="submit">Update Flow</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

interface DeleteFlowModalProps {
  flow: Flow;
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteFlowModal({ flow, opened, onClose, onConfirm }: DeleteFlowModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Delete Flow" size="sm">
      <Stack gap="md">
        <Alert icon={<IconAlertCircle size={16} />} color="red">
          <Text fw={500}>Warning: This action cannot be undone!</Text>
          <Text size="sm">
            Deleting this flow will also remove all associated segments and data.
          </Text>
        </Alert>
        <Text>
          Are you sure you want to delete the flow "{flow.label || 'Unnamed Flow'}"?
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="light" onClick={onClose}>Cancel</Button>
          <Button color="red" onClick={onConfirm}>Delete Flow</Button>
        </Group>
      </Stack>
    </Modal>
  );
} 