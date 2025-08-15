import React, { useState, useEffect, useCallback } from 'react';
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
  TextInput as MantineTextInput,
  Loader
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
  IconX,
  IconRefresh
} from '@tabler/icons-react';
import BBCAdvancedFilter, { BBCFilterPatterns } from '../components/BBCAdvancedFilter';
import { EnhancedDeleteModal, DeleteOptions } from '../components/EnhancedDeleteModal';
import { apiClient } from '../services/api';

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
  // New soft delete fields for backend v6.0
  deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

// BBC TAMS content formats and codecs
const BBC_CONTENT_FORMATS = [
  'urn:x-nmos:format:video',
  'urn:x-nmos:format:audio', 
  'urn:x-nmos:format:data',
  'urn:x-nmos:format:multi',
  'urn:x-tam:format:image'
];

const COMMON_CODECS = [
  'video/h264',
  'video/h265',
  'video/mp4',
  'audio/aac',
  'audio/mp3',
  'audio/wav',
  'application/json',
  'text/plain'
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
  const [flows, setFlows] = useState<Flow[]>([]);
  const [sources, setSources] = useState<Array<{ id: string; label?: string }>>([]);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Advanced filtering
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useFilterPersistence('flows');
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);
  
  // BBC TAMS compliant filtering
  const [bbcFilters, setBbcFilters] = useState<BBCFilterPatterns>({
    label: '',
    format: '',
    codec: '',
    tags: {},
    tagExists: {},
    timerange: '',
    page: '',
    limit: 50
  });

  // Fetch flows and sources on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch flows and sources in parallel
        const [flowsResponse, sourcesResponse] = await Promise.all([
          apiClient.getFlows(),
          apiClient.getSources()
        ]);
        
        setFlows(flowsResponse.data);
        setSources(sourcesResponse.data);
      } catch (err) {
        setError('Failed to fetch flows and sources');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  // Refresh data function
  const handleRefresh = () => {
    setCurrentPage(1);
    setError(null);
    // Trigger a refresh by changing the dependency
    setCurrentPage(prev => prev);
  };

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

  const handleCreateFlow = async (newFlow: Omit<Flow, 'id' | 'created' | 'updated'>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.createFlow(newFlow);
      setFlows(prev => [...prev, response]);
      setShowCreateModal(false);
    } catch (err) {
      setError('Failed to create flow');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFlow = async (updatedFlow: Flow) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.updateFlow(updatedFlow.id, updatedFlow);
      setFlows(prev => prev.map(f => f.id === updatedFlow.id ? response : f));
      setShowEditModal(false);
      setSelectedFlow(null);
    } catch (err) {
      setError('Failed to update flow');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (flow: Flow) => {
    setSelectedFlow(flow);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (options: DeleteOptions) => {
    if (selectedFlow) {
      try {
        setLoading(true);
        setError(null);
        await apiClient.deleteFlow(selectedFlow.id, options);
        setFlows(prev => prev.filter(f => f.id !== selectedFlow.id));
        setShowDeleteModal(false);
        setSelectedFlow(null);
      } catch (err) {
        setError('Failed to delete flow');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRestore = async (flow: Flow) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.restoreFlow(flow.id);
      setFlows(prev => prev.map(f => 
        f.id === flow.id 
          ? { 
              ...f, 
              deleted: false, 
              deleted_at: null, 
              deleted_by: null 
            }
          : f
      ));
      setShowDeleteModal(false);
      setSelectedFlow(null);
    } catch (err) {
      setError('Failed to restore flow');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // BBC TAMS filter handlers
  const handleBbcFiltersChange = useCallback((newFilters: any) => {
    setBbcFilters(newFilters);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, []);

  const handleBbcFiltersReset = useCallback(() => {
    setBbcFilters({
      label: '',
      format: '',
      codec: '',
      tags: {},
      tagExists: {},
      timerange: '',
      page: '',
      limit: 50
    });
    setCurrentPage(1);
  }, []);

  const handleBbcFiltersApply = useCallback(() => {
    // Apply BBC filters - this would typically make an API call
    console.log('Applying BBC filters:', bbcFilters);
    // For now, just log the filters - in production this would update the API call
  }, [bbcFilters]);

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
            onClick={() => handleDelete(flow)}
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
        <Group justify="space-between" mb="lg">
          <Title order={2}>Flows</Title>
          <Group>
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={handleRefresh}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setShowCreateModal(true)}
            >
              Add Flow
            </Button>
          </Group>
        </Group>

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

      {/* BBC TAMS Compliant Filters */}
      <Box mb="lg">
        <BBCAdvancedFilter
          filters={bbcFilters}
          onFiltersChange={handleBbcFiltersChange}
          onReset={handleBbcFiltersReset}
          onApply={handleBbcFiltersApply}
          availableFormats={BBC_CONTENT_FORMATS}
          availableCodecs={COMMON_CODECS}
          availableTags={['quality', 'source', 'metadata', 'processing']}
          showTimerange={true}
          showFormatSpecific={true}
          showTagFilters={true}
          showPagination={true}
          collapsed={false}
          disabled={loading}
        />
      </Box>

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
            {loading ? (
              <Table.Tr>
                <Table.Td colSpan={7} ta="center">
                  <Loader />
                </Table.Td>
              </Table.Tr>
            ) : error ? (
              <Table.Tr>
                <Table.Td colSpan={7} ta="center" c="red">
                  {error}
                </Table.Td>
              </Table.Tr>
            ) : filteredFlows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} ta="center">
                  <Text c="dimmed">No flows found matching your filters</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows
            )}
          </Table.Tbody>
        </Table>
        
        {filteredFlows.length > 0 && (
          <Group justify="center" mt="lg">
            <Pagination 
              total={Math.ceil(filteredFlows.length / 10)} 
              value={currentPage} 
              onChange={setCurrentPage}
            />
          </Group>
        )}
      </Card>

      {/* Create Flow Modal */}
      <CreateFlowModal 
        opened={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateFlow}
        sources={sources}
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
        <EnhancedDeleteModal
          opened={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Flow"
          itemName={selectedFlow.label || 'Unnamed Flow'}
          itemType="flow"
          showCascadeOption={true}
          defaultDeletedBy="admin"
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
  sources: Array<{ id: string; label?: string }>;
}

function CreateFlowModal({ opened, onClose, onSubmit, sources }: CreateFlowModalProps) {
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
            data={sources.map(source => ({
              value: source.id,
              label: source.label || 'Unknown Source'
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