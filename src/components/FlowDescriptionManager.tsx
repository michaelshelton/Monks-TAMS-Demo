import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Group,
  Button,
  Modal,
  TextInput,
  Textarea,
  Stack,
  Divider,
  Alert,
  Loader,
  Box,
  Title,
  ActionIcon,
  Tooltip,
  Badge
} from '@mantine/core';
import {
  IconEdit,
  IconCheck,
  IconX,
  IconFileDescription,
  IconTag,
  IconInfoCircle
} from '@tabler/icons-react';
import { getFlowDescription, setFlowDescription, getFlowLabel, setFlowLabel } from '../services/bbcTamsApi';

interface FlowDescriptionManagerProps {
  flowId: string;
  initialDescription?: string;
  initialLabel?: string;
  disabled?: boolean;
  onDescriptionChange?: (description: string) => void;
  onLabelChange?: (label: string) => void;
}

export function FlowDescriptionManager({ 
  flowId, 
  initialDescription = '', 
  initialLabel = '',
  disabled = false,
  onDescriptionChange,
  onLabelChange 
}: FlowDescriptionManagerProps) {
  const [description, setDescription] = useState(initialDescription);
  const [label, setLabel] = useState(initialLabel);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [editingDescription, setEditingDescription] = useState(initialDescription);
  const [editingLabel, setEditingLabel] = useState(initialLabel);

  // Load initial data from API if not provided
  useEffect(() => {
    if (flowId) {
      loadInitialData();
    }
  }, [flowId]);

  // Update local state when props change
  useEffect(() => {
    setDescription(initialDescription);
    setLabel(initialLabel);
  }, [initialDescription, initialLabel]);

  const loadInitialData = async () => {
    if (!initialDescription || !initialLabel) {
      setLoading(true);
      try {
        if (!initialDescription) {
          const descResponse = await getFlowDescription(flowId);
          setDescription(descResponse.description);
        }
        if (!initialLabel) {
          const labelResponse = await getFlowLabel(flowId);
          setLabel(labelResponse.label);
        }
      } catch (err: any) {
        console.error('Error loading initial data:', err);
        // Use props as fallback
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateDescription = async () => {
    if (!editingDescription.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      await setFlowDescription(flowId, editingDescription.trim());
      
      const newDescription = editingDescription.trim();
      setDescription(newDescription);
      if (onDescriptionChange) {
        onDescriptionChange(newDescription);
      }
      
      setShowDescriptionModal(false);
    } catch (err: any) {
      setError('Failed to update description');
      console.error('Error updating description:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLabel = async () => {
    if (!editingLabel.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      await setFlowLabel(flowId, editingLabel.trim());
      
      const newLabel = editingLabel.trim();
      setLabel(newLabel);
      if (onLabelChange) {
        onLabelChange(newLabel);
      }
      
      setShowLabelModal(false);
    } catch (err: any) {
      setError('Failed to update label');
      console.error('Error updating label:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDescriptionModal = () => {
    setEditingDescription(description);
    setShowDescriptionModal(true);
  };

  const openLabelModal = () => {
    setEditingLabel(label);
    setShowLabelModal(true);
  };

  return (
    <>
      <Card withBorder>
        <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between" align="flex-start">
            <Box>
              <Group gap="sm" align="center">
                <IconFileDescription size={20} color="#228be6" />
                <Title order={4}>Flow Description & Label</Title>
              </Group>
              <Text size="sm" c="dimmed" mt="xs">
                Manage the flow description and label for better organization and identification.
              </Text>
            </Box>
          </Group>

          <Divider />

          {/* Error Display */}
          {error && (
            <Alert icon={<IconX size={16} />} color="red" withCloseButton onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Description Section */}
          <Box>
            <Group justify="space-between" align="center" mb="xs">
              <Group gap="xs">
                <IconFileDescription size={16} color="#228be6" />
                <Text size="sm" fw={500}>Description</Text>
              </Group>
              <Button
                variant="light"
                size="xs"
                leftSection={<IconEdit size={14} />}
                onClick={openDescriptionModal}
                disabled={disabled}
              >
                Edit
              </Button>
            </Group>
            
            {description ? (
              <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                {description}
              </Text>
            ) : (
              <Text size="sm" c="dimmed" fs="italic">
                No description provided. Click "Edit" to add one.
              </Text>
            )}
          </Box>

          {/* Label Section */}
          <Box>
            <Group justify="space-between" align="center" mb="xs">
              <Group gap="xs">
                <IconTag size={16} color="#40c057" />
                <Text size="sm" fw={500}>Label</Text>
              </Group>
              <Button
                variant="light"
                size="xs"
                leftSection={<IconEdit size={14} />}
                onClick={openLabelModal}
                disabled={disabled}
              >
                Edit
              </Button>
            </Group>
            
            {label ? (
              <Badge color="blue" variant="light" size="lg">
                {label}
              </Badge>
            ) : (
              <Text size="sm" c="dimmed" fs="italic">
                No label set. Click "Edit" to add one.
              </Text>
            )}
          </Box>
        </Stack>
      </Card>

      {/* Description Edit Modal */}
      <Modal
        opened={showDescriptionModal}
        onClose={() => setShowDescriptionModal(false)}
        title="Edit Flow Description"
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Update the flow description. Use this field to provide detailed information about the flow's purpose, content, or any other relevant details.
          </Text>
          
          <Textarea
            label="Description"
            placeholder="Enter a detailed description of this flow..."
            value={editingDescription}
            onChange={(event) => setEditingDescription(event.currentTarget.value)}
            rows={6}
            required
          />
          
          <Group gap="xs" justify="flex-end">
            <Button variant="light" onClick={() => setShowDescriptionModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateDescription}
              loading={loading}
              disabled={!editingDescription.trim()}
            >
              Update Description
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Label Edit Modal */}
      <Modal
        opened={showLabelModal}
        onClose={() => setShowLabelModal(false)}
        title="Edit Flow Label"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Update the flow label. Labels are short identifiers that help organize and categorize flows.
          </Text>
          
          <TextInput
            label="Label"
            placeholder="Enter a short label for this flow..."
            value={editingLabel}
            onChange={(event) => setEditingLabel(event.currentTarget.value)}
            required
          />
          
          <Group gap="xs" justify="flex-end">
            <Button variant="light" onClick={() => setShowLabelModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateLabel}
              loading={loading}
              disabled={!editingLabel.trim()}
            >
              Update Label
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
