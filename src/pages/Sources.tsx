import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Button,
  Group,
  Table,
  Text,
  Badge,
  ActionIcon,
  Modal,
  Stack,
  TextInput,
  Textarea,
  Select,
  Pagination,
  Box,
  Card,
  Grid,
  Input,
  Chip,
  Flex,
  Tooltip,
  Menu,
  Divider,
  Alert,
  Loader
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconFilter,
  IconVideo,
  IconMusic,
  IconDatabase,
  IconPhoto,
  IconEye,
  IconDots,
  IconSettings,
  IconRefresh,
  IconAlertCircle
} from '@tabler/icons-react';
import AdvancedFilter, { FilterOption, FilterState, FilterPreset } from '../components/AdvancedFilter';
import { useFilterPersistence } from '../hooks/useFilterPersistence';
import { EnhancedDeleteModal, DeleteOptions } from '../components/EnhancedDeleteModal';
import { 
  validateTAMSEntity, 
  VALID_CONTENT_FORMATS, 
  ContentFormat,
  sanitizeForBackend,
  formatValidationErrors 
} from '../utils/enhancedValidation';
import { apiClient } from '../services/api';

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
  // New soft delete fields for backend v6.0
  deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

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
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false); // New state for showing deleted items
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Advanced filtering
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useFilterPersistence('sources');
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);

  // Define filter options
  const filterOptions: any[] = [ // Assuming FilterOption is not directly imported here
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
    },
    {
      key: 'deleted',
      label: 'Show Deleted',
      type: 'boolean',
      placeholder: 'Include deleted items'
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

    // Deleted filter
    const deletedFilter = filters.deleted;
    const matchesDeleted = !deletedFilter || (source.deleted === deletedFilter);

    return matchesSearch && matchesFormat && matchesCreated && matchesTags && matchesDeleted;
  });

  useEffect(() => {
    const fetchSources = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getSources({
          page: currentPage,
          page_size: 10,
          show_deleted: showDeleted
        });
        setSources(response.data);
      } catch (err) {
        setError('Failed to fetch sources');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSources();
  }, [currentPage, showDeleted, filters]);

  const handleCreateSource = async (newSource: Omit<Source, 'id' | 'created' | 'updated'>) => {
    try {
      setLoading(true);
      const response = await apiClient.createSource(newSource);
      setSources(prev => [...prev, response.data]);
      setShowCreateModal(false);
    } catch (err) {
      setError('Failed to create source');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSource = async (updatedSource: Source) => {
    try {
      setLoading(true);
      const response = await apiClient.updateSource(updatedSource.id, updatedSource);
      setSources(prev => prev.map(s => s.id === updatedSource.id ? response.data : s));
      setShowEditModal(false);
      setSelectedSource(null);
    } catch (err) {
      setError('Failed to update source');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (source: Source) => {
    setSelectedSource(source);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (options: DeleteOptions) => {
    if (selectedSource) {
      try {
        setLoading(true);
        await apiClient.deleteSource(selectedSource.id, options);
        setSources(prev => prev.filter(s => s.id !== selectedSource.id));
        setShowDeleteModal(false);
        setSelectedSource(null);
      } catch (err) {
        setError('Failed to delete source');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleView = (source: Source) => {
    setSelectedSource(source);
    setShowEditModal(true); // Reusing edit modal for view
  };

  const handleEdit = (source: Source) => {
    setSelectedSource(source);
    setShowEditModal(true);
  };

  const handleRestore = async (source: Source) => {
    try {
      setLoading(true);
      await apiClient.restoreSource(source.id);
      setSources(prev => prev.map(s => 
        s.id === source.id 
          ? { 
              ...s, 
              deleted: false, 
              deleted_at: null, 
              deleted_by: null 
            }
          : s
      ));
      setShowDeleteModal(false);
      setSelectedSource(null);
    } catch (err) {
      setError('Failed to restore source');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const paginatedSources = filteredSources.slice((currentPage - 1) * 10, currentPage * 10);

  return (
    <Container size="xl" px="xl" py="xl">
      {/* Title and Header */}
      <Group justify="space-between" mb="lg">
        <Title order={2}>Sources</Title>
        <Group>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={() => {
              setCurrentPage(1);
              setError(null);
              // Trigger a refresh by changing the dependency
              setCurrentPage(prev => prev);
            }}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setShowCreateModal(true)}
          >
            Add Source
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

      {/* Filter Controls */}
      <Group justify="space-between" mb="md">
        <Group>
          <Button
            variant="light"
            leftSection={<IconFilter size={16} />}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            {showAdvancedFilters ? 'Hide' : 'Show'} Filters
          </Button>
          {hasActiveFilters && (
            <Button
              variant="subtle"
              color="red"
              size="sm"
              onClick={clearFilters}
            >
              Clear All Filters
            </Button>
          )}
          <Chip
            checked={showDeleted}
            onChange={(checked) => setShowDeleted(checked)}
            variant="outline"
            color="gray"
          >
            Show Deleted Items
          </Chip>
        </Group>
      </Group>

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
              <Table.Th>Updated</Table.Th>
              <Table.Th>Tags</Table.Th>
              <Table.Th>Status</Table.Th>
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
            ) : paginatedSources.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} ta="center">
                  <Text c="dimmed">No sources found matching your filters</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              paginatedSources.map((source) => (
                <Table.Tr 
                  key={source.id}
                  style={{ 
                    opacity: source.deleted ? 0.6 : 1,
                    backgroundColor: source.deleted ? '#f8f9fa' : 'transparent'
                  }}
                >
                  <Table.Td>
                    <Group gap="sm">
                      {getFormatIcon(source.format)}
                      <Box>
                        <Group gap="xs" align="center">
                          <Text fw={500} size="sm">
                            {source.label || 'Unnamed Source'}
                          </Text>
                          {source.deleted && (
                            <Badge size="xs" color="red">DELETED</Badge>
                          )}
                        </Group>
                        <Text size="xs" c="dimmed">
                          {source.description || 'No description'}
                        </Text>
                      </Box>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="blue">
                      {getFormatLabel(source.format)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {source.created ? new Date(source.created).toLocaleDateString() : 'Unknown'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {source.updated ? new Date(source.updated).toLocaleDateString() : 'Never'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {source.tags && Object.entries(source.tags).slice(0, 2).map(([key, value]) => (
                        <Badge key={key} size="xs" variant="light">
                          {key}: {value}
                        </Badge>
                      ))}
                      {source.tags && Object.keys(source.tags).length > 2 && (
                        <Badge size="xs" variant="light" color="gray">
                          +{Object.keys(source.tags).length - 2} more
                        </Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    {source.deleted ? (
                      <Badge color="red" variant="light" size="sm">
                        Deleted
                      </Badge>
                    ) : (
                      <Badge color="green" variant="light" size="sm">
                        Active
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="View Details">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => handleView(source)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      {!source.deleted ? (
                        <>
                          <Tooltip label="Edit Source">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => handleEdit(source)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete Source">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => handleDelete(source)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip label="Restore Source">
                          <ActionIcon
                            variant="subtle"
                            color="green"
                            onClick={() => handleRestore(source)}
                          >
                            <IconRefresh size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
        
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
      </Card>

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
        <EnhancedDeleteModal
          opened={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Source"
          itemName={selectedSource.label || 'Unnamed Source'}
          itemType="source"
          showCascadeOption={true}
          defaultDeletedBy="admin"
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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    const validation = validateTAMSEntity('source', formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }
    
    // Clear validation errors
    setValidationErrors([]);
    
    onSubmit(formData);
    setFormData({ label: '', description: '', format: 'urn:x-nmos:format:video' });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create New Source" size="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Validation Errors">
              <Text size="sm">{formatValidationErrors(validationErrors)}</Text>
            </Alert>
          )}
          
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
            data={VALID_CONTENT_FORMATS.map(format => ({
              value: format,
              label: getFormatLabel(format)
            }))}
            value={formData.format}
            onChange={(value) => setFormData({ ...formData, format: value as ContentFormat || 'urn:x-nmos:format:video' })}
            required
            description="Select the content format according to TAMS v6.0 specification"
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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    const validation = validateTAMSEntity('source', formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }
    
    // Clear validation errors
    setValidationErrors([]);
    
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
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Validation Errors">
              <Text size="sm">{formatValidationErrors(validationErrors)}</Text>
            </Alert>
          )}
          
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