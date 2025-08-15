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

// BBC TAMS Pagination metadata from response headers
interface BBCPaginationMeta {
  // Link header for navigation (e.g., '<http://...>; rel="next"')
  link?: string;
  // Current page limit
  limit?: number;
  // Next page cursor
  nextKey?: string;
  // Timerange for segments (if applicable)
  timerange?: string;
  // Count of items in current page
  count?: number;
  // Reverse order flag
  reverseOrder?: boolean;
}

interface BBCPaginationProps {
  // Current pagination state
  currentPage: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage: number;
  
  // BBC-specific pagination data
  paginationMeta: BBCPaginationMeta;
  
  // Callbacks
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onNextPage: (nextKey: string) => void;
  onPreviousPage: () => void;
  onFirstPage: () => void;
  onLastPage: () => void;
  
  // UI options
  showPageNumbers?: boolean;
  showLimitSelector?: boolean;
  showBBCMetadata?: boolean;
  showNavigationButtons?: boolean;
  disabled?: boolean;
  className?: string;
}

// Parse Link header for navigation
const parseLinkHeader = (linkHeader: string): Record<string, string> => {
  const links: Record<string, string> = {};
  
  if (!linkHeader) return links;
  
  // Parse: <http://...>; rel="next", <http://...>; rel="prev"
  const linkParts = linkHeader.split(',');
  
  linkParts.forEach(part => {
    const trimmed = part.trim();
    const urlMatch = trimmed.match(/<([^>]+)>/);
    const relMatch = trimmed.match(/rel="([^"]+)"/);
    
    if (urlMatch && relMatch && relMatch[1] && urlMatch[1]) {
      links[relMatch[1]] = urlMatch[1];
    }
  });
  
  return links;
};

// Extract cursor from URL
const extractCursorFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('page');
  } catch {
    return null;
  }
};

const BBCPagination: React.FC<BBCPaginationProps> = ({
  currentPage,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage,
  paginationMeta,
  onPageChange,
  onLimitChange,
  onNextPage,
  onPreviousPage,
  onFirstPage,
  onLastPage,
  showPageNumbers = true,
  showLimitSelector = true,
  showBBCMetadata = true,
  showNavigationButtons = true,
  disabled = false,
  className
}) => {
  // Parse Link header for navigation
  const links = parseLinkHeader(paginationMeta.link || '');
  const hasNextPage = !!paginationMeta.nextKey || !!links.next;
  const hasPreviousPage = !!links.prev;
  
  // Common page size options
  const pageSizeOptions = [
    { value: '10', label: '10 per page' },
    { value: '25', label: '25 per page' },
    { value: '50', label: '50 per page' },
    { value: '100', label: '100 per page' },
    { value: '250', label: '250 per page' },
    { value: '500', label: '500 per page' },
    { value: '1000', label: '1000 per page' }
  ];

  const handleNextPage = () => {
    if (paginationMeta.nextKey) {
      onNextPage(paginationMeta.nextKey);
    } else if (links.next) {
      const cursor = extractCursorFromUrl(links.next);
      if (cursor) {
        onNextPage(cursor);
      }
    }
  };

  const handlePreviousPage = () => {
    if (links.prev) {
      const cursor = extractCursorFromUrl(links.prev);
      if (cursor) {
        onPageChange(parseInt(cursor) || currentPage - 1);
      } else {
        onPreviousPage();
      }
    } else {
      onPreviousPage();
    }
  };

  const handleLimitChange = (value: string | null) => {
    if (value) {
      onLimitChange(parseInt(value));
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
              
              {paginationMeta.nextKey && (
                <Group gap="xs">
                  <Text size="xs" fw={500}>Next Key:</Text>
                  <Badge variant="outline" size="sm" style={{ fontFamily: 'monospace' }}>
                    {paginationMeta.nextKey.substring(0, 8)}...
                  </Badge>
                </Group>
              )}
            </Group>
            
            {/* Link Header Information */}
            {paginationMeta.link && (
              <Box mt="xs">
                <Text size="xs" fw={500} mb="xs">Navigation Links:</Text>
                <Group gap="xs" wrap="wrap">
                  {links.first && (
                    <Badge variant="light" size="xs" color="blue">
                      First: {extractCursorFromUrl(links.first) || 'Available'}
                    </Badge>
                  )}
                  {links.prev && (
                    <Badge variant="light" size="xs" color="green">
                      Previous: {extractCursorFromUrl(links.prev) || 'Available'}
                    </Badge>
                  )}
                  {links.next && (
                    <Badge variant="light" size="xs" color="orange">
                      Next: {extractCursorFromUrl(links.next) || 'Available'}
                    </Badge>
                  )}
                  {links.last && (
                    <Badge variant="light" size="xs" color="red">
                      Last: {extractCursorFromUrl(links.last) || 'Available'}
                    </Badge>
                  )}
                </Group>
              </Box>
            )}
          </Stack>
        </Box>
      )}

      {/* Main Pagination Controls */}
      <Group justify="space-between" align="center">
        {/* Left: Page Info */}
        <Group gap="md">
          <Text size="sm" color="dimmed">
            Showing page {currentPage}
            {totalPages > 1 && ` of ${totalPages}`}
            {totalItems > 0 && ` (${totalItems} total items)`}
          </Text>
          
          {showLimitSelector && (
            <Select
              size="sm"
              value={itemsPerPage.toString()}
              onChange={handleLimitChange}
              data={pageSizeOptions}
              disabled={disabled}
              style={{ width: '140px' }}
            />
          )}
        </Group>

        {/* Center: Navigation Buttons */}
        {showNavigationButtons && (
          <Group gap="xs">
            <Tooltip label="First page">
              <ActionIcon
                variant="outline"
                size="md"
                onClick={onFirstPage}
                disabled={disabled || currentPage === 1}
              >
                <IconChevronLeftPipe size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Previous page">
              <ActionIcon
                variant="outline"
                size="md"
                onClick={handlePreviousPage}
                disabled={disabled || !hasPreviousPage}
              >
                <IconChevronLeft size={16} />
              </ActionIcon>
            </Tooltip>

            {/* Page Numbers (if enabled) */}
            {showPageNumbers && totalPages > 1 && (
              <Group gap="xs">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'filled' : 'outline'}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      disabled={disabled}
                      style={{ minWidth: '40px' }}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                {totalPages > 5 && (
                  <Text size="sm" c="dimmed">...</Text>
                )}
              </Group>
            )}

            <Tooltip label="Next page">
              <ActionIcon
                variant="outline"
                size="md"
                onClick={handleNextPage}
                disabled={disabled || !hasNextPage}
              >
                <IconChevronRight size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Last page">
              <ActionIcon
                variant="outline"
                size="md"
                onClick={onLastPage}
                disabled={disabled || currentPage === totalPages}
              >
                <IconChevronRightPipe size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}

        {/* Right: Additional Actions */}
        <Group gap="xs">
          <Tooltip label="Refresh current page">
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => onPageChange(currentPage)}
              disabled={disabled}
            >
              <IconRefresh size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* BBC TAMS Compliance Note */}
      <Text size="xs" c="dimmed" mt="xs" ta="center">
        BBC TAMS v6.0 compliant pagination with cursor-based navigation
      </Text>
    </Box>
  );
};

export default BBCPagination;
