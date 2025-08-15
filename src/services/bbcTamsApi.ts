// BBC TAMS API Service - Implements BBC TAMS v6.0 specification
// Handles cursor-based pagination, Link headers, and metadata parsing

export interface BBCPaginationMeta {
  link?: string;
  limit?: number;
  nextKey?: string;
  timerange?: string;
  count?: number;
  reverseOrder?: boolean;
}

export interface BBCLinkHeader {
  url: string;
  rel: string;
  params?: Record<string, string>;
}

export interface BBCApiResponse<T> {
  data: T[];
  pagination: BBCPaginationMeta;
  links: BBCLinkHeader[];
}

export interface BBCApiOptions {
  page?: string; // Cursor for pagination
  limit?: number; // Number of items per page
  timerange?: string; // BBC timerange format
  format?: string; // Content format filter
  codec?: string; // Codec filter
  tags?: Record<string, string>; // Tag filters
  tagExists?: Record<string, boolean>; // Tag existence filters
  custom?: Record<string, any>; // Custom filters
}

// Parse BBC TAMS Link header according to RFC 5988
export function parseLinkHeader(linkHeader: string): BBCLinkHeader[] {
  if (!linkHeader) return [];
  
  const links: BBCLinkHeader[] = [];
  const linkRegex = /<([^>]+)>;\s*rel="([^"]+)"(?:;\s*([^,]+))?/g;
  
  let match;
  while ((match = linkRegex.exec(linkHeader)) !== null) {
    const [, url, rel, paramsString] = match;
    const params: Record<string, string> = {};
    
    if (paramsString) {
      const paramRegex = /([^=]+)="([^"]+)"/g;
      let paramMatch;
      while ((paramMatch = paramRegex.exec(paramsString)) !== null) {
        const [, key, value] = paramMatch;
        if (key && value) {
          params[key] = value;
        }
      }
    }
    
    if (url && rel) {
      links.push({ url, rel, params });
    }
  }
  
  return links;
}

// Parse BBC TAMS response headers for pagination metadata
export function parseBBCHeaders(headers: Headers): BBCPaginationMeta {
  const linkHeader = headers.get('Link');
  const limitHeader = headers.get('X-Paging-Limit');
  const nextKeyHeader = headers.get('X-Paging-NextKey');
  const timerangeHeader = headers.get('X-Paging-Timerange');
  const countHeader = headers.get('X-Paging-Count');
  const reverseOrderHeader = headers.get('X-Paging-ReverseOrder');
  
  const result: BBCPaginationMeta = {
    reverseOrder: reverseOrderHeader === 'true'
  };
  
  if (linkHeader) result.link = linkHeader;
  if (limitHeader) {
    const limit = parseInt(limitHeader);
    if (!isNaN(limit)) result.limit = limit;
  }
  if (nextKeyHeader) result.nextKey = nextKeyHeader;
  if (timerangeHeader) result.timerange = timerangeHeader;
  if (countHeader) {
    const count = parseInt(countHeader);
    if (!isNaN(count)) result.count = count;
  }
  
  return result;
}

// Build BBC TAMS query string from options
export function buildBBCQueryString(options: BBCApiOptions): string {
  const params: string[] = [];
  
  if (options.page) {
    params.push(`page=${encodeURIComponent(options.page)}`);
  }
  
  if (options.limit) {
    params.push(`limit=${options.limit}`);
  }
  
  if (options.timerange) {
    params.push(`timerange=${encodeURIComponent(options.timerange)}`);
  }
  
  if (options.format) {
    params.push(`format=${encodeURIComponent(options.format)}`);
  }
  
  if (options.codec) {
    params.push(`codec=${encodeURIComponent(options.codec)}`);
  }
  
  if (options.tags) {
    Object.entries(options.tags).forEach(([key, value]) => {
      params.push(`tag.${key}=${encodeURIComponent(value)}`);
    });
  }
  
  if (options.tagExists) {
    Object.entries(options.tagExists).forEach(([key, exists]) => {
      params.push(`tag_exists.${key}=${exists}`);
    });
  }
  
  if (options.custom) {
    Object.entries(options.custom).forEach(([key, value]) => {
      params.push(`${key}=${encodeURIComponent(String(value))}`);
    });
  }
  
  return params.length > 0 ? `?${params.join('&')}` : '';
}

// BBC TAMS API utility functions

// Generic GET request with BBC TAMS pagination support
export async function bbcTamsGet<T>(endpoint: string, options: BBCApiOptions = {}): Promise<BBCApiResponse<T>> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const queryString = buildBBCQueryString(options);
  const url = `${baseUrl}${endpoint}${queryString}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`BBC TAMS API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const pagination = parseBBCHeaders(response.headers);
  const links = parseLinkHeader(response.headers.get('Link') || '');

  return {
    data,
    pagination,
    links
  };
}

// Generic POST request
export async function bbcTamsPost<T>(endpoint: string, body: any, options: BBCApiOptions = {}): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const queryString = buildBBCQueryString(options);
  const url = `${baseUrl}${endpoint}${queryString}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`BBC TAMS API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Generic PUT request
export async function bbcTamsPut<T>(endpoint: string, body: any, options: BBCApiOptions = {}): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const queryString = buildBBCQueryString(options);
  const url = `${baseUrl}${endpoint}${queryString}`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`BBC TAMS API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Generic DELETE request
export async function bbcTamsDelete(endpoint: string, options: BBCApiOptions = {}): Promise<void> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const queryString = buildBBCQueryString(options);
  const url = `${baseUrl}${endpoint}${queryString}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`BBC TAMS API error: ${response.status} ${response.statusText}`);
  }
}

// HEAD request for metadata (BBC TAMS supports this)
export async function bbcTamsHead(endpoint: string, options: BBCApiOptions = {}): Promise<BBCPaginationMeta> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const queryString = buildBBCQueryString(options);
  const url = `${baseUrl}${endpoint}${queryString}`;
  
  const response = await fetch(url, {
    method: 'HEAD',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`BBC TAMS API error: ${response.status} ${response.statusText}`);
  }

  return parseBBCHeaders(response.headers);
}

// Specific BBC TAMS API functions

// Get flows with BBC TAMS pagination
export async function getFlows(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
  return bbcTamsGet('/flows', options);
}

// Get flow segments with BBC TAMS pagination
export async function getFlowSegments(flowId: string, options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
  return bbcTamsGet(`/flows/${flowId}/segments`, options);
}

// Get sources with BBC TAMS pagination
export async function getSources(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
  return bbcTamsGet('/sources', options);
}

// Get objects with BBC TAMS pagination
export async function getObjects(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
  return bbcTamsGet('/objects', options);
}

// Get service information
export async function getService(): Promise<any> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const response = await fetch(`${baseUrl}/service`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`BBC TAMS API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Create flow deletion request
export async function createDeletionRequest(flowId: string, reason?: string): Promise<any> {
  return bbcTamsPost('/flow-delete-requests', {
    flow_id: flowId,
    reason: reason || 'User requested deletion'
  });
}

// Get deletion requests
export async function getDeletionRequests(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
  return bbcTamsGet('/flow-delete-requests', options);
}

// Utility functions for working with BBC TAMS data

// Extract next page cursor from BBC TAMS response
export function getNextPageCursor(response: BBCApiResponse<any>): string | null {
  const nextLink = response.links.find(link => link.rel === 'next');
  if (nextLink?.params?.page) {
    return nextLink.params.page;
  }
  return response.pagination.nextKey || null;
}

// Extract previous page cursor from BBC TAMS response
export function getPreviousPageCursor(response: BBCApiResponse<any>): string | null {
  const prevLink = response.links.find(link => link.rel === 'prev');
  return prevLink?.params?.page || null;
}

// Extract first page cursor from BBC TAMS response
export function getFirstPageCursor(response: BBCApiResponse<any>): string | null {
  const firstLink = response.links.find(link => link.rel === 'first');
  return firstLink?.params?.page || null;
}

// Extract last page cursor from BBC TAMS response
export function getLastPageCursor(response: BBCApiResponse<any>): string | null {
  const lastLink = response.links.find(link => link.rel === 'last');
  return lastLink?.params?.page || null;
}

// Check if there's a next page available
export function hasNextPage(response: BBCApiResponse<any>): boolean {
  return !!getNextPageCursor(response);
}

// Check if there's a previous page available
export function hasPreviousPage(response: BBCApiResponse<any>): boolean {
  return !!getPreviousPageCursor(response);
}

// Get total count from BBC TAMS response
export function getTotalCount(response: BBCApiResponse<any>): number {
  return response.pagination.count || 0;
}

// Get current limit from BBC TAMS response
export function getCurrentLimit(response: BBCApiResponse<any>): number {
  return response.pagination.limit || 0;
}

// Get timerange from BBC TAMS response
export function getResponseTimerange(response: BBCApiResponse<any>): string | null {
  return response.pagination.timerange || null;
}
