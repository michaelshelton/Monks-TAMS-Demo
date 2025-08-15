import React from 'react';
import {
  Group,
  Button,
  Text,
  Select,
  Stack,
  Box,
  Divider,
  Badge,
  Tooltip,
  ActionIcon
} from '@mantine/core';
import { 
  IconChevronLeft, 
  IconChevronRight, 
  IconChevronLeftPipe, 
  IconChevronRightPipe,
  IconInfoCircle,
  IconRefresh
} from '@tabler/icons-react';
import { BBCPaginationMeta, getAllNavigationCursors } from '../services/api';

// Standardized BBC TAMS Pagination Props
interface BBCPaginationProps {
  // BBC TAMS pagination metadata
  paginationMeta: BBCPaginationMeta;
  
  // Callbacks for navigation
  onPageChange: (cursor: string) => void;
  onLimitChange: (limit: number) => void;
  
  // UI options
  showLimitSelector?: boolean;
  showBBCMetadata?: boolean;
  showNavigationButtons?: boolean;
  disabled?: boolean;
  className?: string;
  
  // Custom styling
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'filled' | 'outline' | 'light' | 'white' | 'subtle' | 'gradient';
}

/**
 * Standardized BBC TAMS Pagination Component
 * 
 * This component provides cursor-based pagination following BBC TAMS v6.0 specification.
 * It automatically handles Link headers, pagination metadata, and navigation cursors.
 * 
 * @example
 * ```tsx
 * <BBCPagination
 *   paginationMeta={response.pagination}
 *   onPageChange={(cursor) => fetchData({ page: cursor })}
 *   onLimitChange={(limit) => fetchData({ limit })}
 *   showBBCMetadata={true}
 *   showLimitSelector={true}
 * />
 * ```
 */
const BBCPagination: React.FC<BBCPaginationProps> = ({
  paginationMeta,
  onPageChange,
  onLimitChange,
  showLimitSelector = true,
  showBBCMetadata = true,
  showNavigationButtons = true,
  disabled = false,
  className,
  size = 'md',
  variant = 'outline'
}) => {
  // Extract navigation cursors from BBC TAMS response
  const cursors = getAllNavigationCursors({ 
    data: [], 
    pagination: paginationMeta, 
    links: [] 
  });
  
  // Common page size options following BBC TAMS recommendations
  const pageSizeOptions = [
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: '50', label: '50 per page' },
    { value: '100', label: '100 per page' },
    { value: '250', label: '250 per page' },
    { value: '500', label: '500 per page' },
    { value: '1000', label: '1000 per page' }
  ];

  const handleLimitChange = (value: string | null) => {
    if (value) {
      onLimitChange(parseInt(value));
    }
  };

  const handleNextPage = () => {
    if (cursors.next) {
      onPageChange(cursors.next);
    }
  };

  const handlePreviousPage = () => {
    if (cursors.prev) {
      onPageChange(cursors.prev);
    }
  };

  const handleFirstPage = () => {
    if (cursors.first) {
      onPageChange(cursors.first);
    }
  };

  const handleLastPage = () => {
    if (cursors.last) {
      onPageChange(cursors.last);
    }
  };

  return (
    <Box {...(className ? { className } : {})}>
      {/* BBC TAMS Pagination Metadata */}
      {showBBCMetadata && (
        <Box mb="md" p="xs" bg="blue.0" style={{ borderRadius: '4px', border: '1px solid #dee2e6' }}>
          <Stack gap="xs">
            <Group gap="md" align="center">
              <IconInfoCircle size={16} color="#228be6" />
              <Text size="sm" fw={500} color="blue">BBC TAMS Pagination Info</Text>
            </Group>
            
            <Group gap="lg" wrap="wrap">
              {paginationMeta.limit && (
                <Group gap="xs">
                  <Text size="xs" fw={500}>Limit:</Text>
                  <Badge variant="outline" size="sm">{paginationMeta.limit}</Badge>
                </Group>
              )}
              
              {paginationMeta.count !== undefined && (
                <Group gap="xs">
                  <Text size="xs" fw={500}>Items:</Text>
                  <Badge variant="outline" size="sm">{paginationMeta.count}</Badge>
                </Group>
              )}
              
              {paginationMeta.timerange && (
                <Group gap="xs">
                  <Text size="xs" fw={500}>Timerange:</Text>
                  <Badge variant="outline" size="sm" style={{ fontFamily: 'monospace' }}>
                    {paginationMeta.timerange}
                  </Badge>
                </Group>
              )}
              
              {paginationMeta.reverseOrder && (
                <Group gap="xs">
                  <Text size="xs" fw={500}>Order:</Text>
                  <Badge variant="outline" size="sm" color="orange">Reverse</Badge>
                </Group>
              )}
            </Group>
          </Stack>
        </Box>
      )}

      {/* Navigation Controls */}
      {showNavigationButtons && (
        <Group gap="xs" justify="center" align="center">
          {/* First Page */}
          <Tooltip label="First Page">
            <ActionIcon
              variant={variant}
              size={size}
              onClick={handleFirstPage}
              disabled={disabled || !cursors.first}
              aria-label="Go to first page"
            >
              <IconChevronLeftPipe size={16} />
            </ActionIcon>
          </Tooltip>

          {/* Previous Page */}
          <Tooltip label="Previous Page">
            <ActionIcon
              variant={variant}
              size={size}
              onClick={handlePreviousPage}
              disabled={disabled || !cursors.prev}
              aria-label="Go to previous page"
            >
              <IconChevronLeft size={16} />
            </ActionIcon>
          </Tooltip>

          {/* Page Info */}
          <Group gap="xs" align="center">
            <Text size="sm" c="dimmed">
              {paginationMeta.count !== undefined ? `${paginationMeta.count} items` : 'Items'}
            </Text>
            {paginationMeta.limit && (
              <Text size="sm" c="dimmed">
                (limit: {paginationMeta.limit})
              </Text>
            )}
          </Group>

          {/* Next Page */}
          <Tooltip label="Next Page">
            <ActionIcon
              variant={variant}
              size={size}
              onClick={handleNextPage}
              disabled={disabled || !cursors.next}
              aria-label="Go to next page"
            >
              <IconChevronRight size={16} />
            </ActionIcon>
          </Tooltip>

          {/* Last Page */}
          <Tooltip label="Last Page">
            <ActionIcon
              variant={variant}
              size={size}
              onClick={handleLastPage}
              disabled={disabled || !cursors.last}
              aria-label="Go to last page"
            >
              <IconChevronRightPipe size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      )}

      {/* Limit Selector */}
      {showLimitSelector && (
        <Group gap="xs" justify="center" mt="md">
          <Text size="sm" c="dimmed">Items per page:</Text>
          <Select
            data={pageSizeOptions}
            value={paginationMeta.limit?.toString() || '25'}
            onChange={handleLimitChange}
            size="xs"
            style={{ minWidth: '120px' }}
            disabled={disabled}
          />
        </Group>
      )}

      {/* Divider */}
      <Divider my="md" />
    </Box>
  );
};

export default BBCPagination;
export type { BBCPaginationProps };
