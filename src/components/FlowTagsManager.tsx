import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Group,
  Badge,
  ActionIcon,
  Button,
  Modal,
  TextInput,
  Stack,
  Divider,
  Alert,
  Loader,
  Box,
  Flex,
  Title
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconTags,
  IconX,
  IconCheck
} from '@tabler/icons-react';
import { getFlowTags, updateFlowTag, deleteFlowTag } from '../services/bbcTamsApi';

interface FlowTagsManagerProps {
  flowId: string;
  initialTags?: Record<string, string>;
  disabled?: boolean;
  readOnly?: boolean;
  onTagsChange?: (tags: Record<string, string>) => void;
}

interface TagEditState {
  name: string;
  value: string;
  originalName: string;
  isEditing: boolean;
}

export function FlowTagsManager({ flowId, initialTags = {}, disabled = false, readOnly = false, onTagsChange }: FlowTagsManagerProps) {
  const [tags, setTags] = useState<Record<string, string>>(initialTags);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTag, setEditingTag] = useState<TagEditState>({ name: '', value: '', originalName: '', isEditing: false });
  const [deletingTag, setDeletingTag] = useState<string>('');
  const [newTag, setNewTag] = useState({ name: '', value: '' });

  // Initialize tags from props and load from API if needed
  useEffect(() => {
    if (flowId) {
      // If we have initial tags, use them and notify parent
      if (Object.keys(initialTags).length > 0) {
        setTags(initialTags);
        if (onTagsChange) {
          onTagsChange(initialTags);
        }
        console.log('Using initial tags from flow data:', initialTags);
      } else {
        // No initial tags, try to load from API
        loadTags();
      }
    }
  }, [flowId, initialTags]);

  const loadTags = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading tags for flow:', flowId);
      const flowTags = await getFlowTags(flowId);
      console.log('Received flow tags:', flowTags);
      
      // Handle different response formats
      const tags = flowTags && typeof flowTags === 'object' ? flowTags : {};
      setTags(tags);
      if (onTagsChange) {
        onTagsChange(tags);
      }
    } catch (err: any) {
      console.error('Error loading flow tags:', err);
      
      // Check if it's a backend not available error
      if (err.message && err.message.includes('404')) {
        console.log('Flow tags endpoint not available, using initial tags or empty state');
        // Don't set error if we have initial tags, just use them
        if (Object.keys(initialTags).length > 0) {
          setTags(initialTags);
          if (onTagsChange) {
            onTagsChange(initialTags);
          }
        } else {
          setError('Flow tags endpoint not available. Tags cannot be loaded from the backend.');
        }
      } else {
        setError(`Failed to load flow tags: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.name.trim() || !newTag.value.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('Adding new tag:', { name: newTag.name.trim(), value: newTag.value.trim() });
      
      // Check if tag already exists
      if (tags[newTag.name.trim()]) {
        setError(`Tag "${newTag.name.trim()}" already exists. Use edit mode to modify existing tags.`);
        return;
      }
      
      await updateFlowTag(flowId, newTag.name.trim(), newTag.value.trim());
      console.log('Tag added successfully');
      
      // Refresh tags
      await loadTags();
      
      // Reset form and close modal
      setNewTag({ name: '', value: '' });
      setShowAddModal(false);
    } catch (err: any) {
      console.error('Error adding tag:', err);
      setError(`Failed to add tag: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTag = async () => {
    if (!editingTag.name.trim() || !editingTag.value.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      await updateFlowTag(flowId, editingTag.name.trim(), editingTag.value.trim());
      
      // Refresh tags
      await loadTags();
      
      // Reset form and close modal
      setEditingTag({ name: '', value: '', originalName: '', isEditing: false });
      setShowEditModal(false);
    } catch (err: any) {
      setError('Failed to update tag');
      console.error('Error updating tag:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async () => {
    if (!deletingTag) return;
    
    setLoading(true);
    setError(null);
    try {
      await deleteFlowTag(flowId, deletingTag);
      
      // Refresh tags
      await loadTags();
      
      // Close modal
      setShowDeleteModal(false);
      setDeletingTag('');
    } catch (err: any) {
      setError('Failed to delete tag');
      console.error('Error deleting tag:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (tagName: string, tagValue: string) => {
    setEditingTag({ name: tagName, value: tagValue, originalName: tagName, isEditing: true });
    setShowEditModal(true);
  };

  const handleRenameTag = async (oldName: string, newName: string, value: string) => {
    if (!newName.trim() || newName.trim() === oldName) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('Renaming tag:', { oldName, newName, value });
      
      // Check if new name already exists
      if (tags[newName.trim()] && newName.trim() !== oldName) {
        setError(`Tag "${newName.trim()}" already exists. Choose a different name.`);
        return;
      }
      
      // Create new tag with new name
      await updateFlowTag(flowId, newName.trim(), value);
      console.log('New tag created successfully');
      
      // Delete old tag
      await deleteFlowTag(flowId, oldName);
      console.log('Old tag deleted successfully');
      
      // Refresh tags
      await loadTags();
      
      // Close modal
      setShowEditModal(false);
      setEditingTag({ name: '', value: '', originalName: '', isEditing: false });
    } catch (err: any) {
      console.error('Error renaming tag:', err);
      setError(`Failed to rename tag: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (tagName: string) => {
    setDeletingTag(tagName);
    setShowDeleteModal(true);
  };

  const tagEntries = Object.entries(tags);

  if (loading && tagEntries.length === 0) {
    return (
      <Card withBorder>
        <Stack gap="md" align="center" py="xl">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">Loading flow tags...</Text>
        </Stack>
      </Card>
    );
  }

  return (
    <>
      <Card withBorder>
        <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between" align="flex-start">
            <Box>
              <Group gap="sm" align="center">
                <IconTags size={20} color="#228be6" />
                <Title order={4}>Flow Tags</Title>
                <Badge variant="light" color="blue">
                  {tagEntries.length} tag{tagEntries.length !== 1 ? 's' : ''}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed" mt="xs">
                Manage metadata tags for this flow. Tags help organize and categorize flows.
                {error?.includes('Backend not available') && (
                  <Text component="span" c="blue" fw={500}> Demo mode - using sample data</Text>
                )}
                {readOnly && (
                  <Text component="span" c="red" fw={500}> Read-only mode - tags cannot be modified</Text>
                )}
              </Text>
            </Box>
            
            <Button
              variant="light"
              size="sm"
              leftSection={<IconPlus size={14} />}
              onClick={() => setShowAddModal(true)}
              disabled={disabled || readOnly || (error?.includes('Backend not available') || false)}
            >
              Add Tag
            </Button>
          </Group>

          <Divider />

          {/* Tags Display */}
          {error && (
            <Alert 
              icon={<IconX size={16} />} 
              color={error.includes('Backend not available') ? 'blue' : 'red'} 
              withCloseButton 
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {tagEntries.length === 0 ? (
            <Alert icon={<IconTags size={16} />} color="blue" variant="light">
              <Text size="sm">No tags defined for this flow. Click "Add Tag" to get started.</Text>
            </Alert>
          ) : (
            <Stack gap="md">
              {tagEntries.map(([tagName, tagValue]) => (
                <Card key={tagName} withBorder variant="light" p="md">
                  <Group justify="space-between" align="flex-start">
                    <Box style={{ flex: 1 }}>
                      <Group gap="sm" mb="xs">
                        <Badge variant="outline" color="blue" size="sm">
                          {tagName}
                        </Badge>
                        <Text size="sm" fw={500}>
                          {tagValue}
                        </Text>
                      </Group>
                    </Box>
                    
                    <Group gap="xs">
                      <ActionIcon
                        size="sm"
                        variant="light"
                        color="blue"
                        onClick={() => openEditModal(tagName, tagValue)}
                        disabled={disabled || readOnly}
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        variant="light"
                        color="red"
                        onClick={() => openDeleteModal(tagName)}
                        disabled={disabled || readOnly}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}

          {/* Refresh Button */}
          <Group justify="flex-end">
            <Button
              variant="subtle"
              size="sm"
              onClick={loadTags}
              loading={loading}
              disabled={disabled || readOnly}
            >
              Refresh Tags
            </Button>
          </Group>
        </Stack>
      </Card>

      {/* Add Tag Modal */}
      <Modal
        opened={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Tag"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Add a new metadata tag to this flow. Tag names should be descriptive and values can contain any text.
          </Text>
          
          <TextInput
            label="Tag Name"
            placeholder="e.g., category, priority, location"
            value={newTag.name}
            onChange={(event) => setNewTag({ ...newTag, name: event.currentTarget.value })}
            required
          />
          
          <TextInput
            label="Tag Value"
            placeholder="e.g., news, high, studio-a"
            value={newTag.value}
            onChange={(event) => setNewTag({ ...newTag, value: event.currentTarget.value })}
            required
          />
          
          <Group gap="xs" justify="flex-end">
            <Button variant="light" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddTag}
              loading={loading}
              disabled={!newTag.name.trim() || !newTag.value.trim()}
            >
              Add Tag
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit Tag Modal */}
      <Modal
        opened={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Tag"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Update the tag name and/or value. Changing the tag name will create a new tag and delete the old one.
          </Text>
          
          <TextInput
            label="Tag Name"
            placeholder="Enter new tag name"
            value={editingTag.name}
            onChange={(event) => setEditingTag({ ...editingTag, name: event.currentTarget.value })}
            required
          />
          
          <TextInput
            label="Tag Value"
            placeholder="Enter new tag value"
            value={editingTag.value}
            onChange={(event) => setEditingTag({ ...editingTag, value: event.currentTarget.value })}
            required
          />
          
          <Group gap="xs" justify="flex-end">
            <Button variant="light" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingTag.name !== editingTag.originalName) {
                  // Name changed, use rename function
                  handleRenameTag(editingTag.originalName, editingTag.name, editingTag.value);
                } else {
                  // Only value changed, use regular edit function
                  handleEditTag();
                }
              }}
              loading={loading}
              disabled={!editingTag.name.trim() || !editingTag.value.trim()}
            >
              {editingTag.name !== editingTag.originalName ? 'Rename & Update' : 'Update Tag'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Tag Modal */}
      <Modal
        opened={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Tag"
        size="md"
      >
        <Stack gap="md">
          <Alert icon={<IconX size={16} />} color="red" variant="light">
            <Text size="sm">
              Are you sure you want to delete the tag <strong>"{deletingTag}"</strong>? 
              This action cannot be undone.
            </Text>
          </Alert>
          
          <Group gap="xs" justify="flex-end">
            <Button variant="light" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDeleteTag}
              loading={loading}
            >
              Delete Tag
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
