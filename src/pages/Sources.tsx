import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Button,
  Group,
  Table,
  Text,
  Badge,
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
  Loader,
  SimpleGrid,
  Image,
  Collapse
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconVideo,
  IconMusic,
  IconDatabase,
  IconPhoto,
  IconDots,
  IconSettings,
  IconRefresh,
  IconAlertCircle,
  IconCalendar,
  IconMapPin,
  IconActivity,
  IconInfoCircle,
  IconArrowLeft
} from '@tabler/icons-react';
import AdvancedFilter, { FilterOption, FilterState, FilterPreset } from '../components/AdvancedFilter';
import { useFilterPersistence } from '../hooks/useFilterPersistence';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  validateTAMSEntity, 
  VALID_CONTENT_FORMATS, 
  ContentFormat,
  sanitizeForBackend,
  formatValidationErrors 
} from '../utils/enhancedValidation';
import { apiClient, BBCApiOptions, BBCApiResponse, BBCPaginationMeta } from '../services/api';

// Enhanced Source interface
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

// TAMS Sources - fetched from real backend API

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
  const navigate = useNavigate();
  const location = useLocation();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false); // New state for showing deleted items
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showInfoBox, setShowInfoBox] = useState(true); // State for collapsible info box
  
  // BBC TAMS API state
  const [bbcPagination, setBbcPagination] = useState<BBCPaginationMeta>({});
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  
  // Client-side pagination state
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 10;
  
  // Advanced filtering
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useFilterPersistence('sources');
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);

  // Define filter options for media sources
  const filterOptions: any[] = [
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
      key: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'technology', label: 'Technology' },
        { value: 'education', label: 'Education' },
        { value: 'entertainment', label: 'Entertainment' },
        { value: 'business', label: 'Business' },
        { value: 'news', label: 'News' }
      ]
    },
    {
      key: 'content_type',
      label: 'Content Type',
      type: 'select',
      options: [
        { value: 'conference', label: 'Conference' },
        { value: 'podcast', label: 'Podcast' },
        { value: 'training', label: 'Training' },
        { value: 'presentation', label: 'Presentation' },
        { value: 'webinar', label: 'Webinar' }
      ]
    },
    {
      key: 'year',
      label: 'Year',
      type: 'select',
      options: [
        { value: '2024', label: '2024' },
        { value: '2023', label: '2023' },
        { value: '2022', label: '2022' }
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

  // Client-side filtering for filters not supported by API
  // Note: Format, category, content_type, and year filters are applied server-side via API
  const filteredSources = sources.filter(source => {
    // Search filter (client-side since API uses 'label' parameter, not full-text search)
    const searchTerm = filters.search?.toLowerCase();
    const matchesSearch = !searchTerm || 
      source.label?.toLowerCase().includes(searchTerm) ||
      source.description?.toLowerCase().includes(searchTerm);

    // Tags filter (client-side for complex tag matching)
    const tagsFilter = filters.tags;
    const matchesTags = !tagsFilter || 
      (source.tags && Object.entries(source.tags).some(([key, value]) => 
        `${key}:${value}`.toLowerCase().includes(tagsFilter.toLowerCase())
      ));

    // Created date filter (client-side, API doesn't support date range filtering)
    const createdFilter = filters.created;
    const matchesCreated = !createdFilter || (() => {
      // Simplified date filtering - in real implementation, this would compare actual dates
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

    // Deleted filter (client-side, API may not support this)
    const deletedFilter = filters.deleted;
    const matchesDeleted = !deletedFilter || (source.deleted === deletedFilter);

    // Format, category, content_type, and year are filtered server-side via API
    return matchesSearch && matchesTags && matchesCreated && matchesDeleted;
  });

  // Fetch sources using TAMS API
  const fetchSourcesTams = async (cursor?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const options: BBCApiOptions = {
        // Note: limit parameter causes validation errors - API expects integer but query strings are strings
        // Backend team needs to fix query parameter type conversion
        // For now, don't use limit - API will return all sources
        // limit: 10, // Commented out until backend fixes query parameter validation
        // Note: show_deleted is not a valid query parameter for the API (schema rejects additionalProperties)
        // Filtering deleted sources will be handled client-side if needed
      };
      
      if (cursor) {
        options.page = cursor;
      }

      // Apply filters to TAMS API (server-side filtering)
      if (filters.format) {
        options.format = filters.format;
      }
      if (filters.label || filters.search) {
        // API uses 'label' parameter for search
        options.custom = { ...options.custom, label: filters.label || filters.search };
      }
      // Tag filters - API supports tag.<name> query parameters
      if (filters.category) {
        options.tags = { ...(options.tags || {}), category: filters.category };
      }
      if (filters.content_type) {
        options.tags = { ...(options.tags || {}), content_type: filters.content_type };
      }
      if (filters.year) {
        options.tags = { ...(options.tags || {}), year: filters.year };
      }

      console.log('Fetching sources from TAMS API with options:', options);
      const response = await apiClient.getSources(options);
      console.log('TAMS API response:', response);
      
      // Handle different response formats
      // bbcTamsGet normalizes to { data: [...], pagination: {...} }
      // But also handle direct { sources: [...], count } format
      let sourcesData: Source[] = [];
      let paginationData: BBCPaginationMeta = {};
      
      if (response && response.data && Array.isArray(response.data)) {
        // Normalized BBC TAMS format
        sourcesData = response.data;
        paginationData = response.pagination || {};
      } else {
        const responseAny = response as any;
        if (responseAny && responseAny.sources && Array.isArray(responseAny.sources)) {
          // Direct API format: { sources: [...], count }
          sourcesData = responseAny.sources;
          paginationData = {
            count: responseAny.count || responseAny.sources.length,
            ...(options.limit !== undefined ? { limit: options.limit } : {})
          };
        } else if (Array.isArray(response)) {
          // Direct array response
          sourcesData = response;
          paginationData = {
            count: response.length,
            ...(options.limit !== undefined ? { limit: options.limit } : {})
          };
        }
      }
      
      setSources(sourcesData);
      setBbcPagination(paginationData);
      setCurrentCursor(cursor || null);
      setError(null);
      // Reset to first page when sources change
      setActivePage(1);
    } catch (err: any) {
      console.error('TAMS API error:', err);
      console.error('Error details:', {
        message: err?.message,
        stack: err?.stack,
        response: err?.response,
        name: err?.name
      });
      
      // Set appropriate error message based on error type
      let errorMessage = 'Unknown error';
      
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.response) {
        errorMessage = `HTTP ${err.response.status}: ${err.response.statusText || 'Error'}`;
      } else if (err?.name === 'TypeError' && err?.message?.includes('fetch')) {
        errorMessage = 'Network error: Could not connect to API. Is the backend running?';
      } else if (err?.name === 'AbortError') {
        errorMessage = 'Request timeout - please try again';
      }
      
      // Set appropriate error message based on error type
      if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
        setError('TAMS backend temporarily unavailable - please try again later');
      } else if (errorMessage.includes('Network') || errorMessage.includes('fetch') || errorMessage.includes('CORS') || errorMessage.includes('Could not connect')) {
        setError('Network connection issue - please check your connection and try again. Make sure the TAMS API is running on http://localhost:3000');
      } else if (errorMessage.includes('404')) {
        setError('TAMS API endpoint not found - please check backend configuration');
      } else {
        // Use error message directly
        setError(errorMessage.includes('TAMS API error') ? errorMessage : `TAMS API error: ${errorMessage}`);
      }
      
      // Clear sources on error
      setSources([]);
      setBbcPagination({});
      setCurrentCursor(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sources when component mounts, filters change, or when navigating to this page
  useEffect(() => {
    if (location.pathname === '/sources') {
      console.log('Sources component: Fetching sources, location:', location.pathname);
      fetchSourcesTams();
    }
  }, [location.pathname, showDeleted, filters]);


  const handleCreateSource = async (newSource: Omit<Source, 'id' | 'created' | 'updated'>) => {
    try {
      setLoading(true);
      // Generate a UUID for the source ID (required by API)
      const sourceId = crypto.randomUUID();
      
      // The API expects POST /sources/:id with the source data
      const sourceData = {
        id: sourceId,
        ...newSource
      };
      
      const response = await apiClient.createSource(sourceId, sourceData);
      
      // Refresh the sources list to get the new source
      await fetchSourcesTams();
      setShowCreateModal(false);
      setError(null);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to create source';
      setError(errorMsg);
      console.error('Create source error:', err);
    } finally {
      setLoading(false);
    }
  };


  // Client-side pagination for filtered sources
  const totalPages = Math.ceil(filteredSources.length / itemsPerPage);
  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSources = filteredSources.slice(startIndex, endIndex);

  return (
    <Container size="xl" px="xl" py="xl">
      {/* Title and Header */}
      <Group justify="space-between" mb="lg">
        <Box>
          <Title order={2} className="dark-text-primary">Media Sources</Title>
          <Text c="dimmed" size="sm" mt="xs" className="dark-text-secondary">
            Original media inputs and content containers in the TAMS workflow
          </Text>
        </Box>
        <Group>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={() => {
              fetchSourcesTams();
              setError(null);
            }}
            loading={loading}
            className="dark-button"
          >
            Refresh
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setShowCreateModal(true)}
            className="dark-button"
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
          title="TAMS Connection Error"
          withCloseButton
          onClose={() => setError(null)}
          mb="md"
        >
          {error}
        </Alert>
      )}

      {/* TAMS Info - Toggleable */}
      {!error && (
        <Alert 
          icon={<IconInfoCircle size={16} />} 
          color="blue" 
          title={
            <Group justify="space-between" w="100%">
              <Text>What are Sources in TAMS?</Text>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setShowInfoBox(!showInfoBox)}
                rightSection={showInfoBox ? <IconArrowLeft size={12} /> : <IconArrowLeft size={12} style={{ transform: 'rotate(-90deg)' }} />}
              >
                {showInfoBox ? 'Hide' : 'Show'} Info
              </Button>
            </Group>
          }
          mb="md"
        >
          <Collapse in={showInfoBox}>
            <Stack gap="xs">
              <Text size="sm">
                <strong>Sources</strong> represent the original media inputs in the TAMS system - think of them as the "containers" 
                that hold your media content before it gets processed into flows and segments.
              </Text>
              <Text size="sm">
                Each source contains metadata like format (video/audio/data), description, tags, and creation information. 
                Sources are the first step in the TAMS workflow - they define what content is available to be processed.
              </Text>
            </Stack>
          </Collapse>
        </Alert>
      )}

      {/* Filter Controls */}
      <Group justify="space-between" mb="md">
        <Group>
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
      <Card withBorder className="search-interface">
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Source Information</Table.Th>
              <Table.Th>Format</Table.Th>
              <Table.Th>Created Date</Table.Th>
              <Table.Th>Category & Type</Table.Th>
              <Table.Th>Duration</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <Table.Tr>
                <Table.Td colSpan={6} ta="center">
                  <Loader />
                </Table.Td>
              </Table.Tr>
            ) : error ? (
              <Table.Tr>
                <Table.Td colSpan={6} ta="center" c="red">
                  {error}
                </Table.Td>
              </Table.Tr>
            ) : paginatedSources.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6} ta="center">
                  <Text c="dimmed">
                    {sources.length === 0 
                      ? "No sources available from TAMS backend" 
                      : "No sources found matching your filters"
                    }
                  </Text>
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
                          <Text 
                            fw={500} 
                            size="sm" 
                            style={{ cursor: 'pointer', color: 'var(--mantine-color-blue-6)' }}
                            onClick={() => navigate(`/source-details/${source.id}`)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                          >
                            {source.label || 'Unnamed Source'}
                          </Text>
                          {source.deleted && (
                            <Badge size="xs" color="red">DELETED</Badge>
                          )}
                        </Group>
                        <Text size="xs" c="dimmed">
                          {source.description || 'No description'}
                        </Text>
                        {/* Source Tags */}
                        {source.tags && (
                          <Group gap="xs" mt="xs">
                            {source.tags.category && (
                              <Badge size="xs" variant="light" color="blue">
                                {source.tags.category}
                              </Badge>
                            )}
                            {source.tags.content_type && (
                              <Badge size="xs" variant="light" color="green">
                                {source.tags.content_type}
                              </Badge>
                            )}
                          </Group>
                        )}
                      </Box>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="blue">
                      {getFormatLabel(source.format)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" align="center">
                      <IconCalendar size={14} />
                      <Text size="sm">
                        {source.created ? new Date(source.created).toLocaleDateString() : 'Unknown'}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap="xs">
                      <Group gap="xs" align="center">
                        <IconMapPin size={14} />
                        <Text size="sm" fw={500}>
                          {source.tags?.['category'] || 'Unknown Category'}
                        </Text>
                      </Group>
                      <Badge size="xs" variant="light" color="green">
                        {source.tags?.['content_type'] || source.tags?.['event_type'] || 'Unknown Type'}
                      </Badge>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap="xs">
                      <Group gap="xs" align="center">
                        <IconActivity size={14} />
                        <Text size="sm" fw={500}>
                          {source.tags?.['duration'] || 'Unknown'}
                        </Text>
                      </Group>
                      {source.tags?.['year'] && (
                        <Text size="xs" c="dimmed">
                          Year: {source.tags.year}
                        </Text>
                      )}
                    </Stack>
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
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
        
        {/* Pagination */}
        {filteredSources.length > itemsPerPage && (
          <Group justify="center" mt="lg">
            <Pagination
              value={activePage}
              onChange={setActivePage}
              total={totalPages}
              size="sm"
            />
          </Group>
        )}
        
        {/* Results count */}
        {!loading && filteredSources.length > 0 && (
          <Group justify="center" mt="md">
            <Text size="sm" c="dimmed">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredSources.length)} of {filteredSources.length} sources
            </Text>
          </Group>
        )}
      </Card>



      {/* Create Source Modal */}
      <CreateSourceModal 
        opened={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSource}
      />



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
    format: 'urn:x-nmos:format:video',
    // Generic media fields
    category: '',
    contentType: '',
    year: '2024',
    duration: '',
    speaker: '',
    venue: ''
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
    
    // Create source with generic metadata
    const sourceData = {
      label: formData.label,
      description: formData.description,
      format: formData.format,
      tags: {
        category: formData.category,
        content_type: formData.contentType,
        year: formData.year,
        duration: formData.duration,
        speaker: formData.speaker,
        venue: formData.venue
      }
    };
    
    onSubmit(sourceData);
    setFormData({ 
      label: '', 
      description: '', 
      format: 'urn:x-nmos:format:video',
      category: '',
      contentType: '',
      year: '2024',
      duration: '',
      speaker: '',
      venue: ''
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create New Media Source" size="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Validation Errors">
              <Text size="sm">{formatValidationErrors(validationErrors)}</Text>
            </Alert>
          )}
          
          <TextInput
            label="Source Title"
            placeholder="e.g., Conference Presentation 2024"
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

          {/* Generic media fields */}
          <SimpleGrid cols={2}>
            <TextInput
              label="Category"
              placeholder="e.g., Technology"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.currentTarget.value })}
              required
            />
            <TextInput
              label="Content Type"
              placeholder="e.g., Conference"
              value={formData.contentType}
              onChange={(e) => setFormData({ ...formData, contentType: e.currentTarget.value })}
              required
            />
          </SimpleGrid>

          <SimpleGrid cols={2}>
            <TextInput
              label="Venue"
              placeholder="e.g., Convention Center"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.currentTarget.value })}
              required
            />
            <TextInput
              label="Year"
              placeholder="e.g., 2024"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.currentTarget.value })}
              required
            />
          </SimpleGrid>

          <SimpleGrid cols={2}>
            <TextInput
              label="Speaker"
              placeholder="e.g., 2024"
              value={formData.speaker}
              onChange={(e) => setFormData({ ...formData, speaker: e.currentTarget.value })}
              required
            />
            <TextInput
              label="Duration"
              placeholder="e.g., 45:00"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.currentTarget.value })}
            />
          </SimpleGrid>

          <TextInput
            label="Duration"
            placeholder="e.g., 45:00"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.currentTarget.value })}
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


 