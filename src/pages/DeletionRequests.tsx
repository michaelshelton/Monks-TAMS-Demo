import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Stack,
  Card,
  Table,
  Badge,
  Button,
  Modal,
  TextInput,
  Textarea,
  Select,
  Pagination,
  Box,
  Alert,
  ActionIcon,
  Tooltip,
  Grid,
  Divider,
  Chip,
  Progress
} from '@mantine/core';
import {
  IconPlus,
  IconEye,
  IconCheck,
  IconX,
  IconClock,
  IconAlertTriangle,
  IconTrash,
  IconRefresh,
  IconFilter,
  IconSearch,
  IconHistory,
  IconUser,
  IconCalendar,
  IconInfoCircle
} from '@tabler/icons-react';
import AdvancedFilter, { FilterOption, FilterState, FilterPreset } from '../components/AdvancedFilter';
import { useFilterPersistence } from '../hooks/useFilterPersistence';

// Deletion Request interface for backend v6.0
interface DeletionRequest {
  request_id: string;
  flow_id: string;
  flow_name: string;
  flow_format: string;
  reason: string;
  requested_by: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_size: number;
  segments_count: number;
  soft_delete: boolean;
  cascade: boolean;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  processed_at?: string;
  notes?: string;
  tags?: Record<string, string>;
}

// Mock data for development
const mockDeletionRequests: DeletionRequest[] = [
  {
    request_id: 'del_req_001',
    flow_id: 'flow_001',
    flow_name: 'BBC News Studio',
    flow_format: 'urn:x-nmos:format:video',
    reason: 'Content no longer needed - news cycle completed',
    requested_by: 'user_123',
    requested_at: '2025-01-25T10:00:00Z',
    status: 'pending',
    priority: 'medium',
    estimated_size: 107374182400, // 100 GB
    segments_count: 1247,
    soft_delete: true,
    cascade: true,
    notes: 'Archive after 30 days if approved'
  },
  {
    request_id: 'del_req_002',
    flow_id: 'flow_002',
    flow_name: 'Sports Arena Camera',
    flow_format: 'urn:x-nmos:format:video',
    reason: 'Season ended, storage cleanup required',
    requested_by: 'user_456',
    requested_at: '2025-01-25T09:30:00Z',
    status: 'approved',
    priority: 'high',
    estimated_size: 53687091200, // 50 GB
    segments_count: 892,
    soft_delete: false,
    cascade: true,
    approved_by: 'admin_001',
    approved_at: '2025-01-25T11:00:00Z',
    processed_at: '2025-01-25T11:15:00Z',
    notes: 'Hard delete approved - content no longer needed'
  },
  {
    request_id: 'del_req_003',
    flow_id: 'flow_003',
    flow_name: 'Radio Studio A',
    flow_format: 'urn:x-nmos:format:audio',
    reason: 'Technical issues - corrupted segments',
    requested_by: 'user_789',
    requested_at: '2025-01-25T08:45:00Z',
    status: 'rejected',
    priority: 'urgent',
    estimated_size: 21474836480, // 20 GB
    segments_count: 156,
    soft_delete: true,
    cascade: false,
    rejected_by: 'admin_001',
    rejected_at: '2025-01-25T10:30:00Z',
    rejection_reason: 'Content may be recoverable. Please investigate corruption extent first.',
    notes: 'Rejected pending investigation'
  },
  {
    request_id: 'del_req_004',
    flow_id: 'flow_004',
    flow_name: 'Photo Studio Feed',
    flow_format: 'urn:x-tam:format:image',
    reason: 'Storage optimization - low priority content',
    requested_by: 'user_123',
    requested_at: '2025-01-25T07:15:00Z',
    status: 'processing',
    priority: 'low',
    estimated_size: 10737418240, // 10 GB
    segments_count: 89,
    soft_delete: true,
    cascade: true,
    approved_by: 'admin_002',
    approved_at: '2025-01-25T09:00:00Z',
    notes: 'Processing in background'
  }
];

// Helper functions
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return 'yellow';
    case 'approved': return 'blue';
    case 'rejected': return 'red';
    case 'processing': return 'orange';
    case 'completed': return 'green';
    case 'cancelled': return 'gray';
    default: return 'gray';
  }
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'low': return 'gray';
    case 'medium': return 'blue';
    case 'high': return 'orange';
    case 'urgent': return 'red';
    default: return 'gray';
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function DeletionRequests() {
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>(mockDeletionRequests);
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Advanced filtering
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useFilterPersistence('deletion-requests');
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);

  // Define filter options
  const filterOptions: FilterOption[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by flow name, reason, or requester'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'processing', label: 'Processing' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' }
      ]
    },
    {
      key: 'format',
      label: 'Format',
      type: 'select',
      options: [
        { value: 'urn:x-nmos:format:video', label: 'Video' },
        { value: 'urn:x-nmos:format:audio', label: 'Audio' },
        { value: 'urn:x-tam:format:image', label: 'Image' },
        { value: 'urn:x-nmos:format:data', label: 'Data' }
      ]
    },
    {
      key: 'soft_delete',
      label: 'Delete Type',
      type: 'select',
      options: [
        { value: 'true', label: 'Soft Delete' },
        { value: 'false', label: 'Hard Delete' }
      ]
    }
  ];

  // Filter deletion requests
  const filteredRequests = deletionRequests.filter(request => {
    const searchFilter = filters.search?.toLowerCase();
    const statusFilter = filters.status;
    const priorityFilter = filters.priority;
    const formatFilter = filters.format;
    const softDeleteFilter = filters.soft_delete;

    // Search filter
    const matchesSearch = !searchFilter || 
      request.flow_name.toLowerCase().includes(searchFilter) ||
      request.reason.toLowerCase().includes(searchFilter) ||
      request.requested_by.toLowerCase().includes(searchFilter);

    // Status filter
    const matchesStatus = !statusFilter || request.status === statusFilter;

    // Priority filter
    const matchesPriority = !priorityFilter || request.priority === priorityFilter;

    // Format filter
    const matchesFormat = !formatFilter || request.flow_format === formatFilter;

    // Soft delete filter
    const matchesSoftDelete = !softDeleteFilter || request.soft_delete.toString() === softDeleteFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesFormat && matchesSoftDelete;
  });

  const paginatedRequests = filteredRequests.slice((currentPage - 1) * 10, currentPage * 10);

  const handleCreateRequest = (requestData: Partial<DeletionRequest>) => {
    const newRequest: DeletionRequest = {
      request_id: `del_req_${Date.now()}`,
      flow_id: requestData.flow_id || '',
      flow_name: requestData.flow_name || '',
      flow_format: requestData.flow_format || 'urn:x-nmos:format:video',
      reason: requestData.reason || '',
      requested_by: 'user_123', // TODO: Get from current user context
      requested_at: new Date().toISOString(),
      status: 'pending',
      priority: requestData.priority || 'medium',
      estimated_size: requestData.estimated_size || 0,
      segments_count: requestData.segments_count || 0,
      soft_delete: requestData.soft_delete || true,
      cascade: requestData.cascade || true,
      notes: requestData.notes || ''
    };

    setDeletionRequests([newRequest, ...deletionRequests]);
    setShowCreateModal(false);
  };

  const handleApproveRequest = (requestId: string) => {
    setDeletionRequests(requests => 
      requests.map(req => 
        req.request_id === requestId 
          ? { 
              ...req, 
              status: 'approved' as const, 
              approved_by: 'admin_001', // TODO: Get from current user context
              approved_at: new Date().toISOString() 
            }
          : req
      )
    );
  };

  const handleRejectRequest = (requestId: string, reason: string) => {
    setDeletionRequests(requests => 
      requests.map(req => 
        req.request_id === requestId 
          ? { 
              ...req, 
              status: 'rejected' as const, 
              rejected_by: 'admin_001', // TODO: Get from current user context
              rejected_at: new Date().toISOString(),
              rejection_reason: reason
            }
          : req
      )
    );
  };

  const handleViewDetails = (request: DeletionRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  return (
    <Container size="xl" px="xl" py="xl">
      {/* Header */}
      <Box mb="xl">
        <Group justify="space-between" align="flex-end">
          <Box>
            <Title order={2} mb="md">
              Deletion Requests Management
            </Title>
            <Text size="lg" c="dimmed">
              Manage and track deletion requests for flows and segments
            </Text>
          </Box>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Request
          </Button>
        </Group>
      </Box>

      {/* Info Alert */}
      <Alert 
        icon={<IconInfoCircle size={16} />} 
        color="blue" 
        title="Deletion Requests Management"
        mb="md"
      >
        <Text size="sm">
          This page manages deletion requests for TAMS flows and segments. Deletion requests provide 
          a controlled way to request removal of content with approval workflows, audit trails, and 
          soft delete capabilities.
        </Text>
        <Text size="sm" mt="xs">
          <strong>Note:</strong> This page currently displays mock data for demonstration purposes. 
          In a production environment, this would connect to the TAMS backend API for real 
          deletion request management.
        </Text>
      </Alert>

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
        </Group>
        <Group gap="xs">
          <Text size="sm" c="dimmed">
            {filteredRequests.length} of {deletionRequests.length} requests
          </Text>
        </Group>
      </Group>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card mb="lg">
          <AdvancedFilter
            filters={filterOptions}
            value={filters}
            onChange={updateFilters}
            presets={savedPresets}
            onPresetSave={(preset) => setSavedPresets([...savedPresets, preset])}
            onPresetDelete={(presetId) => setSavedPresets(savedPresets.filter(p => p.id !== presetId))}
          />
        </Card>
      )}

      {/* Deletion Requests Table */}
      <Card>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Request ID</Table.Th>
              <Table.Th>Flow</Table.Th>
              <Table.Th>Reason</Table.Th>
              <Table.Th>Requester</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Priority</Table.Th>
              <Table.Th>Size</Table.Th>
              <Table.Th>Delete Type</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedRequests.map((request) => (
              <Table.Tr key={request.request_id}>
                <Table.Td>
                  <Text size="sm" style={{ fontFamily: 'monospace' }} fw={500}>
                    {request.request_id}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Box>
                    <Text fw={500} size="sm">{request.flow_name}</Text>
                    <Text size="xs" c="dimmed">{request.flow_format}</Text>
                  </Box>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" lineClamp={2}>
                    {request.reason}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{request.requested_by}</Text>
                  <Text size="xs" c="dimmed">
                    {new Date(request.requested_at).toLocaleDateString()}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={getStatusColor(request.status)} variant="light">
                    {request.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color={getPriorityColor(request.priority)} variant="light">
                    {request.priority}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{formatBytes(request.estimated_size)}</Text>
                  <Text size="xs" c="dimmed">{request.segments_count} segments</Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Badge 
                      color={request.soft_delete ? "orange" : "red"} 
                      variant="light" 
                      size="xs"
                    >
                      {request.soft_delete ? 'Soft' : 'Hard'}
                    </Badge>
                    {request.cascade && (
                      <Badge color="blue" variant="light" size="xs">
                        Cascade
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="View Details">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => handleViewDetails(request)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Tooltip>
                    
                    {request.status === 'pending' && (
                      <>
                        <Tooltip label="Approve Request">
                          <ActionIcon
                            variant="subtle"
                            color="green"
                            onClick={() => handleApproveRequest(request.request_id)}
                          >
                            <IconCheck size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Reject Request">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleRejectRequest(request.request_id, 'Rejected by admin')}
                          >
                            <IconX size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Pagination */}
      {filteredRequests.length > 10 && (
        <Group justify="center" mt="lg">
          <Pagination
            total={Math.ceil(filteredRequests.length / 10)}
            value={currentPage}
            onChange={setCurrentPage}
          />
        </Group>
      )}

      {/* Create Request Modal */}
      <CreateRequestModal
        opened={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateRequest}
      />

      {/* Request Details Modal */}
      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          opened={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          onApprove={() => {
            handleApproveRequest(selectedRequest.request_id);
            setShowDetailsModal(false);
          }}
          onReject={(reason) => {
            handleRejectRequest(selectedRequest.request_id, reason);
            setShowDetailsModal(false);
          }}
        />
      )}
    </Container>
  );
}

// Create Request Modal Component
interface CreateRequestModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<DeletionRequest>) => void;
}

function CreateRequestModal({ opened, onClose, onSubmit }: CreateRequestModalProps) {
  const [formData, setFormData] = useState({
    flow_id: '',
    flow_name: '',
    flow_format: 'urn:x-nmos:format:video' as string,
    reason: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    estimated_size: 0,
    segments_count: 0,
    soft_delete: true,
    cascade: true,
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create Deletion Request" size="lg">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Flow ID"
                value={formData.flow_id}
                onChange={(e) => setFormData({ ...formData, flow_id: e.currentTarget.value })}
                placeholder="flow_001"
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Flow Name"
                value={formData.flow_name}
                onChange={(e) => setFormData({ ...formData, flow_name: e.currentTarget.value })}
                placeholder="BBC News Studio"
                required
              />
            </Grid.Col>
          </Grid>
          
          <Select
            label="Flow Format"
            value={formData.flow_format}
            onChange={(value) => setFormData({ ...formData, flow_format: value || 'urn:x-nmos:format:video' })}
            data={[
              { value: 'urn:x-nmos:format:video', label: 'Video' },
              { value: 'urn:x-nmos:format:audio', label: 'Audio' },
              { value: 'urn:x-tam:format:image', label: 'Image' },
              { value: 'urn:x-nmos:format:data', label: 'Data' }
            ]}
            required
          />
          
          <Textarea
            label="Reason for Deletion"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.currentTarget.value })}
            placeholder="Explain why this content should be deleted..."
            rows={3}
            required
          />
          
          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Priority"
                value={formData.priority}
                onChange={(value) => setFormData({ ...formData, priority: value as any || 'medium' })}
                data={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' }
                ]}
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Estimated Size (bytes)"
                type="number"
                value={formData.estimated_size}
                onChange={(e) => setFormData({ ...formData, estimated_size: parseInt(e.currentTarget.value) || 0 })}
                placeholder="107374182400"
              />
            </Grid.Col>
          </Grid>
          
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Segments Count"
                type="number"
                value={formData.segments_count}
                onChange={(e) => setFormData({ ...formData, segments_count: parseInt(e.currentTarget.value) || 0 })}
                placeholder="1247"
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.currentTarget.value })}
                placeholder="Additional notes..."
              />
            </Grid.Col>
          </Grid>
          
          <Group>
            <Chip
              checked={formData.soft_delete}
              onChange={(checked) => setFormData({ ...formData, soft_delete: checked })}
              variant="outline"
            >
              Soft Delete
            </Chip>
            <Chip
              checked={formData.cascade}
              onChange={(checked) => setFormData({ ...formData, cascade: checked })}
              variant="outline"
            >
              Cascade Delete
            </Chip>
          </Group>
          
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Request
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// Request Details Modal Component
interface RequestDetailsModalProps {
  request: DeletionRequest;
  opened: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

function RequestDetailsModal({ request, opened, onClose, onApprove, onReject }: RequestDetailsModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');

  return (
    <Modal opened={opened} onClose={onClose} title="Deletion Request Details" size="lg">
      <Stack gap="lg">
        {/* Request Overview */}
        <Card>
          <Title order={4} mb="md">Request Information</Title>
          <Grid>
            <Grid.Col span={6}>
              <Text size="sm" fw={500}>Request ID</Text>
              <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>{request.request_id}</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" fw={500}>Status</Text>
              <Badge color={getStatusColor(request.status)}>{request.status}</Badge>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" fw={500}>Priority</Text>
              <Badge color={getPriorityColor(request.priority)}>{request.priority}</Badge>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" fw={500}>Requested At</Text>
              <Text size="sm" c="dimmed">{new Date(request.requested_at).toLocaleString()}</Text>
            </Grid.Col>
          </Grid>
        </Card>

        {/* Flow Information */}
        <Card>
          <Title order={4} mb="md">Flow Details</Title>
          <Grid>
            <Grid.Col span={6}>
              <Text size="sm" fw={500}>Flow Name</Text>
              <Text size="sm">{request.flow_name}</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" fw={500}>Flow Format</Text>
              <Text size="sm" c="dimmed">{request.flow_format}</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" fw={500}>Estimated Size</Text>
              <Text size="sm">{formatBytes(request.estimated_size)}</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" fw={500}>Segments Count</Text>
              <Text size="sm">{request.segments_count}</Text>
            </Grid.Col>
          </Grid>
        </Card>

        {/* Deletion Details */}
        <Card>
          <Title order={4} mb="md">Deletion Configuration</Title>
          <Grid>
            <Grid.Col span={6}>
              <Text size="sm" fw={500}>Delete Type</Text>
              <Badge color={request.soft_delete ? "orange" : "red"}>
                {request.soft_delete ? 'Soft Delete' : 'Hard Delete'}
              </Badge>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" fw={500}>Cascade</Text>
              <Badge color={request.cascade ? "blue" : "gray"}>
                {request.cascade ? 'Yes' : 'No'}
              </Badge>
            </Grid.Col>
          </Grid>
          
          <Box mt="md">
            <Text size="sm" fw={500}>Reason for Deletion</Text>
            <Text size="sm" c="dimmed">{request.reason}</Text>
          </Box>
          
          {request.notes && (
            <Box mt="md">
              <Text size="sm" fw={500}>Notes</Text>
              <Text size="sm" c="dimmed">{request.notes}</Text>
            </Box>
          )}
        </Card>

        {/* Approval/Rejection Actions */}
        {request.status === 'pending' && (
          <Card>
            <Title order={4} mb="md">Actions</Title>
            <Group>
              <Button
                color="green"
                leftSection={<IconCheck size={16} />}
                onClick={onApprove}
              >
                Approve Request
              </Button>
              <Button
                color="red"
                leftSection={<IconX size={16} />}
                onClick={() => onReject(rejectionReason || 'Rejected by admin')}
              >
                Reject Request
              </Button>
            </Group>
            
            <TextInput
              label="Rejection Reason (optional)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.currentTarget.value)}
              placeholder="Explain why this request was rejected..."
              mt="md"
            />
          </Card>
        )}

        {/* Status History */}
        <Card>
          <Title order={4} mb="md">Status History</Title>
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm">Requested</Text>
              <Text size="sm" c="dimmed">{new Date(request.requested_at).toLocaleString()}</Text>
            </Group>
            
            {request.approved_at && (
              <Group justify="space-between">
                <Text size="sm">Approved by {request.approved_by}</Text>
                <Text size="sm" c="dimmed">{new Date(request.approved_at).toLocaleString()}</Text>
              </Group>
            )}
            
            {request.rejected_at && (
              <Group justify="space-between">
                <Text size="sm">Rejected by {request.rejected_by}</Text>
                <Text size="sm" c="dimmed">{new Date(request.rejected_at).toLocaleString()}</Text>
              </Group>
            )}
            
            {request.processed_at && (
              <Group justify="space-between">
                <Text size="sm">Processed</Text>
                <Text size="sm" c="dimmed">{new Date(request.processed_at).toLocaleString()}</Text>
              </Group>
            )}
          </Stack>
        </Card>

        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
