/**
 * Backend Selector Component
 * 
 * User interface for switching between different backend APIs.
 * Shows backend information, feature availability, and switching controls.
 */

import React, { useState } from 'react';
import {
  Select,
  Group,
  Text,
  Badge,
  Tooltip,
  ActionIcon,
  Modal,
  Stack,
  Title,
  Table,
  Button,
  Alert,
  Loader,
  Box,
  Divider,
} from '@mantine/core';
import { IconInfoCircle, IconRefresh, IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import { useBackend, useBackendFeatures } from '../contexts/BackendContext';
import { getBackendComparison } from '../config/apiConfig';
import { BackendFeature } from '../types/backend';

interface BackendSelectorProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'filled' | 'unstyled';
  showInfo?: boolean;
  showFeatures?: boolean;
  showComparison?: boolean;
}

export function BackendSelector({
  size = 'md',
  variant = 'default',
  showInfo = true,
  showFeatures = true,
  showComparison = true,
}: BackendSelectorProps) {
  const { currentBackend, availableBackends, switchBackend, isLoading, error } = useBackend();
  const features = useBackendFeatures();
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  // Handle backend switching
  const handleBackendSwitch = async (backendId: string | null) => {
    if (!backendId || backendId === currentBackend.id) return;
    
    try {
      setSwitchingTo(backendId);
      await switchBackend(backendId);
    } catch (error) {
      console.error('Failed to switch backend:', error);
    } finally {
      setSwitchingTo(null);
    }
  };

  // Get feature badge color
  const getFeatureBadgeColor = (supported: boolean) => {
    return supported ? 'green' : 'red';
  };

  // Get feature icon
  const getFeatureIcon = (supported: boolean) => {
    return supported ? <IconCheck size={12} /> : <IconX size={12} />;
  };

  // Get backend type badge color
  const getBackendTypeColor = (type: string) => {
    switch (type) {
      case 'vast-tams':
        return 'blue';
      case 'bbc-tams':
        return 'green';
      case 'custom':
        return 'orange';
      default:
        return 'gray';
    }
  };

  // Get backend status color
  const getBackendStatusColor = () => {
    if (error) return 'red';
    if (isLoading) return 'yellow';
    return 'green';
  };

  // Get backend status text
  const getBackendStatusText = () => {
    if (error) return 'Error';
    if (isLoading) return 'Loading';
    return 'Connected';
  };

  // Get backend status icon
  const getBackendStatusIcon = () => {
    if (error) return <IconX size={14} />;
    if (isLoading) return <Loader size={14} />;
    return <IconCheck size={14} />;
  };

  // Feature comparison data
  const comparisonData = getBackendComparison();

  return (
    <>
      <Group gap="xs" align="center">
        {/* Backend Type Badge */}
        <Badge
          color={getBackendTypeColor(currentBackend.type)}
          variant="light"
          size="sm"
        >
          {currentBackend.type.toUpperCase()}
        </Badge>

        {/* Backend Status */}
        <Badge
          color={getBackendStatusColor()}
          variant="light"
          size="sm"
          leftSection={getBackendStatusIcon()}
        >
          {getBackendStatusText()}
        </Badge>

        {/* Backend Selector */}
        <Select
          label="Backend"
          placeholder="Select backend"
          value={currentBackend.id}
          onChange={handleBackendSwitch}
          data={availableBackends.map(backend => ({
            value: backend.id,
            label: backend.name,
            description: backend.description,
          }))}
          size={size}
          variant={variant}
          disabled={isLoading || !!switchingTo}
          rightSection={switchingTo ? <Loader size={16} /> : undefined}
          styles={{
            label: { fontSize: '0.75rem', fontWeight: 500 },
            input: { minWidth: 150 },
          }}
        />

        {/* Info Button */}
        {showInfo && (
          <Tooltip label="Backend Information">
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => setShowComparisonModal(true)}
              disabled={isLoading}
            >
              <IconInfoCircle size={16} />
            </ActionIcon>
          </Tooltip>
        )}

        {/* Error Display */}
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Backend Error"
            color="red"
            variant="light"
            styles={{ root: { maxWidth: 200 } }}
          >
            <Text size="xs" truncate>
              {error}
            </Text>
          </Alert>
        )}
      </Group>

      {/* Feature Availability */}
      {showFeatures && (
        <Group gap="xs" mt="xs">
          <Text size="xs" c="dimmed">
            Features:
          </Text>
          {Object.entries(features).map(([key, value]) => {
            if (key === 'supports' || key === 'getUnsupportedFeatures' || key === 'getSupportedFeatures') return null;
            
            const featureName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const isSupported = typeof value === 'boolean' ? value : false;
            
            return (
              <Tooltip key={key} label={`${featureName}: ${isSupported ? 'Supported' : 'Not Supported'}`}>
                <Badge
                  size="xs"
                  variant="dot"
                  color={getFeatureBadgeColor(isSupported)}
                  leftSection={getFeatureIcon(isSupported)}
                >
                  {featureName}
                </Badge>
              </Tooltip>
            );
          })}
        </Group>
      )}

      {/* Comparison Modal */}
      <Modal
        opened={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        title="Backend Comparison"
        size="lg"
        centered
      >
        <Stack gap="md">
          {/* Current Backend Info */}
          <Box>
            <Title order={4} mb="xs">
              Current Backend: {currentBackend.name}
            </Title>
            <Text size="sm" c="dimmed" mb="xs">
              {currentBackend.description}
            </Text>
            <Group gap="xs">
              <Badge color={getBackendTypeColor(currentBackend.type)}>
                {currentBackend.type}
              </Badge>
              <Badge variant="light">v{currentBackend.version}</Badge>
              <Badge variant="light" color="blue">
                {currentBackend.baseUrl}
              </Badge>
            </Group>
          </Box>

          <Divider />

          {/* Feature Comparison Table */}
          {showComparison && (
            <Box>
              <Title order={5} mb="xs">
                Feature Comparison
              </Title>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Feature</Table.Th>
                    <Table.Th>TAMS</Table.Th>
                    <Table.Th>IBC Thiago</Table.Th>
                    <Table.Th>IBC Thiago Imported</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {comparisonData.map((row) => (
                    <Table.Tr key={row.feature}>
                      <Table.Td>
                        <Text size="sm">{row.feature}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="xs"
                          color={getFeatureBadgeColor(row.vastTams)}
                          leftSection={getFeatureIcon(row.vastTams)}
                        >
                          {row.vastTams ? 'Yes' : 'No'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="xs"
                          color={getFeatureBadgeColor(row.ibcThiago)}
                          leftSection={getFeatureIcon(row.ibcThiago)}
                        >
                          {row.ibcThiago ? 'Yes' : 'No'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="xs"
                          color={getFeatureBadgeColor(row.ibcThiagoImported)}
                          leftSection={getFeatureIcon(row.ibcThiagoImported)}
                        >
                          {row.ibcThiagoImported ? 'Yes' : 'No'}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          )}

          {/* Available Backends */}
          <Box>
            <Title order={5} mb="xs">
              Available Backends
            </Title>
            <Stack gap="xs">
              {availableBackends.map((backend) => (
                <Group key={backend.id} justify="space-between" p="xs" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-sm)' }}>
                  <Box>
                    <Text size="sm" fw={500}>
                      {backend.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {backend.description}
                    </Text>
                    <Group gap="xs" mt="xs">
                      <Badge size="xs" color={getBackendTypeColor(backend.type)}>
                        {backend.type}
                      </Badge>
                      <Badge size="xs" variant="light">
                        v{backend.version}
                      </Badge>
                    </Group>
                  </Box>
                  <Button
                    size="xs"
                    variant={currentBackend.id === backend.id ? 'filled' : 'outline'}
                    disabled={currentBackend.id === backend.id || isLoading}
                    onClick={() => handleBackendSwitch(backend.id)}
                    loading={switchingTo === backend.id}
                  >
                    {currentBackend.id === backend.id ? 'Current' : 'Switch To'}
                  </Button>
                </Group>
              ))}
            </Stack>
          </Box>

          {/* Close Button */}
          <Button
            variant="light"
            onClick={() => setShowComparisonModal(false)}
            fullWidth
          >
            Close
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
