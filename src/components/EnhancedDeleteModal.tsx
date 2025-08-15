import React, { useState } from 'react';
import {
  Modal,
  Stack,
  Text,
  Group,
  Button,
  Checkbox,
  TextInput,
  Alert,
  Divider,
  Badge,
  Box
} from '@mantine/core';
import { IconAlertCircle, IconTrash, IconShieldCheck } from '@tabler/icons-react';

export interface DeleteOptions {
  softDelete: boolean;
  cascade: boolean;
  deletedBy: string;
}

interface EnhancedDeleteModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (options: DeleteOptions) => void;
  title: string;
  itemName: string;
  itemType: 'source' | 'flow' | 'segment' | 'object';
  showCascadeOption?: boolean;
  defaultDeletedBy?: string;
}

export function EnhancedDeleteModal({
  opened,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType,
  showCascadeOption = true,
  defaultDeletedBy = 'admin'
}: EnhancedDeleteModalProps) {
  const [options, setOptions] = useState<DeleteOptions>({
    softDelete: true,
    cascade: true,
    deletedBy: defaultDeletedBy
  });

  const handleConfirm = () => {
    onConfirm(options);
  };

  const getItemTypeInfo = () => {
    switch (itemType) {
      case 'source':
        return {
          description: 'This will affect all associated flows and segments.',
          cascadeDescription: 'Delete all associated flows and segments',
          icon: <IconTrash size={16} />
        };
      case 'flow':
        return {
          description: 'This will affect all associated segments and data.',
          cascadeDescription: 'Delete all associated segments and data',
          icon: <IconTrash size={16} />
        };
      case 'segment':
        return {
          description: 'This will remove the media segment data.',
          cascadeDescription: 'Delete associated media files',
          icon: <IconTrash size={16} />
        };
      case 'object':
        return {
          description: 'This will remove the media object data.',
          cascadeDescription: 'Delete associated media files',
          icon: <IconTrash size={16} />
        };
      default:
        return {
          description: 'This action cannot be undone.',
          cascadeDescription: 'Delete associated data',
          icon: <IconTrash size={16} />
        };
    }
  };

  const itemTypeInfo = getItemTypeInfo();

  return (
    <Modal opened={opened} onClose={onClose} title={title} size="md">
      <Stack gap="md">
        {/* Warning Alert */}
        <Alert icon={<IconAlertCircle size={16} />} color="red">
          <Text fw={500}>Warning: This action cannot be undone!</Text>
          <Text size="sm">{itemTypeInfo.description}</Text>
        </Alert>

        {/* Item to Delete */}
        <Box>
          <Text size="sm" fw={500} mb="xs">Item to Delete:</Text>
          <Badge size="lg" variant="light" color="red" leftSection={itemTypeInfo.icon}>
            {itemName || 'Unnamed Item'}
          </Badge>
        </Box>

        <Divider />

        {/* Delete Options */}
        <Box>
          <Text size="sm" fw={500} mb="md">Delete Options:</Text>
          
          {/* Soft Delete Option */}
          <Checkbox
            label="Soft Delete (mark as deleted, can be restored)"
            description="Data remains in the system but is marked as deleted"
            checked={options.softDelete}
            onChange={(event) => setOptions({ ...options, softDelete: event.currentTarget.checked })}
            mb="sm"
          />

          {/* Cascade Delete Option */}
          {showCascadeOption && (
            <Checkbox
              label="Cascade Delete"
              description={itemTypeInfo.cascadeDescription}
              checked={options.cascade}
              onChange={(event) => setOptions({ ...options, cascade: event.currentTarget.checked })}
              mb="sm"
            />
          )}

          {/* Deleted By Input */}
          <TextInput
            label="Deleted By"
            description="User or system performing the deletion"
            placeholder="Enter user identifier"
            value={options.deletedBy}
            onChange={(event) => setOptions({ ...options, deletedBy: event.currentTarget.value })}
            required
          />
        </Box>

        {/* Soft Delete Benefits */}
        {options.softDelete && (
          <Alert icon={<IconShieldCheck size={16} />} color="blue">
            <Text size="sm" fw={500}>Soft Delete Benefits:</Text>
            <Text size="xs">
              • Data can be restored if needed<br/>
              • Maintains referential integrity<br/>
              • Provides audit trail<br/>
              • Meets compliance requirements
            </Text>
          </Alert>
        )}

        {/* Hard Delete Warning */}
        {!options.softDelete && (
          <Alert icon={<IconAlertCircle size={16} />} color="orange">
            <Text size="sm" fw={500}>Hard Delete Warning:</Text>
            <Text size="xs">
              • Data will be permanently removed<br/>
              • Cannot be restored<br/>
              • May break referential relationships<br/>
              • Use only when absolutely necessary
            </Text>
          </Alert>
        )}

        {/* Action Buttons */}
        <Group justify="flex-end" gap="sm">
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            color={options.softDelete ? "orange" : "red"} 
            onClick={handleConfirm}
            leftSection={options.softDelete ? <IconShieldCheck size={16} /> : <IconTrash size={16} />}
          >
            {options.softDelete ? 'Soft Delete' : 'Hard Delete'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
