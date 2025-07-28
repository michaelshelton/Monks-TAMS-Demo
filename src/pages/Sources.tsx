import { useState } from 'react';
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
  Divider,
  Pagination
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
  IconSearch
} from '@tabler/icons-react';

// Mock data structure based on backend API models
interface Source {
  id: string;
  format: string;
  label?: string;
  description?: string;
  created_by?: string;
  updated_by?: string;
  created?: string;
  updated?: string;
  tags?: Record<string, string>;
  source_collection?: Array<{ id: string; label?: string }>;
  collected_by?: string[];
}

const dummySources: Source[] = [
  {
    id: '1',
    format: 'urn:x-nmos:format:video',
    label: 'BBC News Studio',
    description: 'Primary news studio camera feed with 24/7 coverage',
    created_by: 'admin',
    created: '2025-01-15T10:00:00Z',
    updated: '2025-01-15T10:00:00Z',
    tags: { location: 'london', type: 'news', quality: 'hd' },
    source_collection: [
      { id: '1', label: 'News Collection' }
    ]
  },
  {
    id: '2',
    format: 'urn:x-nmos:format:audio',
    label: 'Radio Studio A',
    description: 'Main radio studio audio feed',
    created_by: 'admin',
    created: '2025-01-10T09:00:00Z',
    updated: '2025-01-12T14:30:00Z',
    tags: { location: 'manchester', type: 'radio', quality: 'stereo' }
  },
  {
    id: '3',
    format: 'urn:x-nmos:format:video',
    label: 'Sports Arena Camera',
    description: 'Live sports coverage from main arena',
    created_by: 'admin',
    created: '2025-01-08T16:00:00Z',
    updated: '2025-01-08T16:00:00Z',
    tags: { location: 'birmingham', type: 'sports', quality: '4k' }
  },
  {
    id: '4',
    format: 'urn:x-tam:format:image',
    label: 'Photo Studio',
    description: 'High-resolution photography studio feed',
    created_by: 'admin',
    created: '2025-01-05T11:00:00Z',
    updated: '2025-01-05T11:00:00Z',
    tags: { location: 'edinburgh', type: 'photography', quality: 'raw' }
  }
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

export default function Sources() {
  const [sources, setSources] = useState<Source[]>(dummySources);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Advanced filtering
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useFilterPersistence('sources');
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);

  // Define filter options
  const filterOptions: FilterOption[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search sources by name or description...'
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

  const filteredSources = sources.filter(source => {
    // Search filter
    const searchTerm = filters.search?.toLowerCase();
    const matchesSearch = !searchTerm || 
      source.label?.toLowerCase().includes(searchTerm) ||
      source.description?.toLowerCase().includes(searchTerm);

    // Format filter
    const formatFilter = filters.format;
    const matchesFormat = !formatFilter || source.format === formatFilter;

    // Created date filter
    const createdFilter = filters.created;
    const matchesCreated = !createdFilter || (() => {
      // Simplified date filtering for demo
      // In real implementation, this would compare actual dates
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
      (source.tags && Object.entries(source.tags).some(([key, value]) => 
        `${key}:${value}`.toLowerCase().includes(tagsFilter.toLowerCase())
      ));

    return matchesSearch && matchesFormat && matchesCreated && matchesTags;
  });

  const handleCreateSource = (newSource: Omit<Source, 'id' | 'created' | 'updated'>) => {
    const source: Source = {
      ...newSource,
      id: (sources.length + 1).toString(),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      created_by: 'admin'
    };
    setSources([...sources, source]);
    setShowCreateModal(false);
  };

  const handleUpdateSource = (updatedSource: Source) => {
    setSources(sources.map(s => s.id === updatedSource.id ? updatedSource : s));
    setShowEditModal(false);
    setSelectedSource(null);
  };

  const handleDeleteSource = (sourceId: string) => {
    setSources(sources.filter(s => s.id !== sourceId));
    setShowDeleteModal(false);
    setSelectedSource(null);
  };

  const rows = filteredSources.map((source) => (
    <Table.Tr key={source.id}>
      <Table.Td>
        <Box>
          <Group gap="xs" mb={4}>
            {getFormatIcon(source.format)}
            <Text fw={600}>
              {source.label || 'Unnamed Source'}
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            {source.description || 'No description'}
          </Text>
        </Box>
      </Table.Td>
      
      <Table.Td>
        <Badge color="blue" variant="light">
          {getFormatLabel(source.format)}
        </Badge>
      </Table.Td>
      
      <Table.Td>
        <Text size="xs">
          {source.created ? new Date(source.created).toLocaleDateString() : 'Unknown'}
        </Text>
      </Table.Td>
      
      <Table.Td>
        <Group gap="xs">
          {source.tags && Object.entries(source.tags).map(([key, value]) => (
            <Badge 
              key={key} 
              color="gray" 
              variant="outline"
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
              setSelectedSource(source);
              setShowEditModal(true);
            }}
          >
            <IconEye size={16} />
          </ActionIcon>
          <ActionIcon 
            size="sm" 
            variant="subtle"
            onClick={() => {
              setSelectedSource(source);
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
              setSelectedSource(source);
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
              Media Sources
            </Title>
            <Text size="lg" c="dimmed">
              Manage and monitor your media sources and feeds
            </Text>
          </Box>
          <Button 
            leftSection={<IconPlus size={16} />}
            onClick={() => setShowCreateModal(true)}
          >
            Add Source
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

      {/* Sources Table */}
      <Card withBorder>
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Source Name</Table.Th>
              <Table.Th>Format</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Tags</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows}
          </Table.Tbody>
        </Table>
        
        {filteredSources.length === 0 && (
          <Box ta="center" py="xl">
            <Text c="dimmed">No sources found matching your filters</Text>
          </Box>
        )}
      </Card>

      {/* Pagination */}
      {filteredSources.length > 0 && (
        <Group justify="center" mt="lg">
          <Pagination 
            total={Math.ceil(filteredSources.length / 10)} 
            value={currentPage} 
            onChange={setCurrentPage}
          />
        </Group>
      )}

      {/* Create Source Modal */}
      <CreateSourceModal 
        opened={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSource}
      />

      {/* Edit Source Modal */}
      {selectedSource && (
        <EditSourceModal
          source={selectedSource}
          opened={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSource(null);
          }}
          onSubmit={handleUpdateSource}
        />
      )}

      {/* Delete Confirmation Modal */}
      {selectedSource && (
        <DeleteSourceModal
          source={selectedSource}
          opened={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedSource(null);
          }}
          onConfirm={() => handleDeleteSource(selectedSource.id)}
        />
      )}
    </Container>
  );
}

// Modal Components
interface CreateSourceModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (source: Omit<Source, 'id' | 'created' | 'updated'>) => void;
}

function CreateSourceModal({ opened, onClose, onSubmit }: CreateSourceModalProps) {
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    format: 'urn:x-nmos:format:video'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ label: '', description: '', format: 'urn:x-nmos:format:video' });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create New Source" size="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Source Name"
            placeholder="Enter source name"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.currentTarget.value })}
            required
          />
          <Textarea
            label="Description"
            placeholder="Enter source description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
            rows={3}
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
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create Source</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

interface EditSourceModalProps {
  source: Source;
  opened: boolean;
  onClose: () => void;
  onSubmit: (source: Source) => void;
}

function EditSourceModal({ source, opened, onClose, onSubmit }: EditSourceModalProps) {
  const [formData, setFormData] = useState({
    label: source.label || '',
    description: source.description || '',
    format: source.format
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...source,
      ...formData,
      updated: new Date().toISOString(),
      updated_by: 'admin'
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Source" size="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Source Name"
            placeholder="Enter source name"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.currentTarget.value })}
            required
          />
          <Textarea
            label="Description"
            placeholder="Enter source description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
            rows={3}
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
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={onClose}>Cancel</Button>
            <Button type="submit">Update Source</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

interface DeleteSourceModalProps {
  source: Source;
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteSourceModal({ source, opened, onClose, onConfirm }: DeleteSourceModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Delete Source" size="sm">
      <Stack gap="md">
        <Text>
          Are you sure you want to delete the source "{source.label || 'Unnamed Source'}"?
        </Text>
        <Text size="sm" c="dimmed">
          This action cannot be undone. All associated flows and segments will also be affected.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="light" onClick={onClose}>Cancel</Button>
          <Button color="red" onClick={onConfirm}>Delete Source</Button>
        </Group>
      </Stack>
    </Modal>
  );
} 