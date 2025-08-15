/**
 * Unified API Service Layer for TAMS Frontend
 * Handles all communication with the backend API using BBC TAMS v6.0 specification
 * 
 * This service consolidates BBC TAMS API functionality with VAST TAMS extensions
 * while maintaining full BBC TAMS compliance for future flexibility.
 */

const API_BASE_URL = 'http://localhost:8000';

// BBC TAMS API Configuration
export const BBC_TAMS_BASE_URL = API_BASE_URL;

// BBC TAMS API Response Types
export interface BBCPaginationMeta {
  link?: string;
  limit?: number;
  nextKey?: string;
  prevKey?: string;
  firstKey?: string;
  lastKey?: string;
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

// Legacy API response types (for backward compatibility)
interface ApiResponse<T> {
  data: T;
  paging?: any;
}

interface PaginatedResponse<T> {
  data: T[];
  paging?: {
    page: number;
    size: number;
    total: number;
  };
}

// BBC TAMS Utility Functions

/**
 * Parse BBC TAMS Link header according to RFC 5988
 */
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
      try {
        const urlObj = new URL(url);
        const queryParams = urlObj.searchParams;
        
        // Extract BBC TAMS specific parameters
        if (queryParams.has('page')) {
          params.page = queryParams.get('page') || '';
        }
        if (queryParams.has('limit')) {
          params.limit = queryParams.get('limit') || '';
        }
        if (queryParams.has('timerange')) {
          params.timerange = queryParams.get('timerange') || '';
        }
        if (queryParams.has('format')) {
          params.format = queryParams.get('format') || '';
        }
        if (queryParams.has('codec')) {
          params.codec = queryParams.get('codec') || '';
        }
        if (queryParams.has('label')) {
          params.label = queryParams.get('label') || '';
        }
      } catch (error) {
        console.warn('Failed to parse URL parameters from Link header:', error);
      }
      
      links.push({ url, rel, params });
    }
  }
  
  return links;
}

/**
 * Parse BBC TAMS response headers for pagination metadata
 */
export function parseBBCHeaders(headers: Headers): BBCPaginationMeta {
  const linkHeader = headers.get('Link');
  const limitHeader = headers.get('X-Paging-Limit');
  const nextKeyHeader = headers.get('X-Paging-NextKey');
  const prevKeyHeader = headers.get('X-Paging-PrevKey');
  const firstKeyHeader = headers.get('X-Paging-FirstKey');
  const lastKeyHeader = headers.get('X-Paging-LastKey');
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
  if (prevKeyHeader) result.prevKey = prevKeyHeader;
  if (firstKeyHeader) result.firstKey = firstKeyHeader;
  if (lastKeyHeader) result.lastKey = lastKeyHeader;
  if (timerangeHeader) result.timerange = timerangeHeader;
  if (countHeader) {
    const count = parseInt(countHeader);
    if (!isNaN(count)) result.count = count;
  }
  
  return result;
}

/**
 * Build BBC TAMS query string from options
 */
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

/**
 * Extract all available navigation cursors from BBC TAMS response
 */
export function getAllNavigationCursors(response: BBCApiResponse<any>): {
  next?: string;
  prev?: string;
  first?: string;
  last?: string;
} {
  const cursors: { next?: string; prev?: string; first?: string; last?: string } = {};
  
  if (response.links) {
    response.links.forEach(link => {
      if (link.rel === 'next' && link.params?.page) {
        cursors.next = link.params.page;
      } else if (link.rel === 'prev' && link.params?.page) {
        cursors.prev = link.params.page;
      } else if (link.rel === 'first' && link.params?.page) {
        cursors.first = link.params.page;
      } else if (link.rel === 'last' && link.params?.page) {
        cursors.last = link.params.page;
      }
    });
  }
  
  // Also check pagination metadata for backward compatibility
  if (response.pagination) {
    if (response.pagination.nextKey) cursors.next = response.pagination.nextKey;
    if (response.pagination.prevKey) cursors.prev = response.pagination.prevKey;
    if (response.pagination.firstKey) cursors.first = response.pagination.firstKey;
    if (response.pagination.lastKey) cursors.last = response.pagination.lastKey;
  }
  
  return cursors;
}

// Unified API Client class with BBC TAMS compliance
class UnifiedApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * BBC TAMS compliant GET request with pagination support
   */
  async bbcTamsGet<T>(endpoint: string, options: BBCApiOptions = {}): Promise<BBCApiResponse<T>> {
    const queryString = buildBBCQueryString(options);
    const url = `${this.baseUrl}${endpoint}${queryString}`;
    
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

    const responseData = await response.json();
    const pagination = parseBBCHeaders(response.headers);
    const links = parseLinkHeader(response.headers.get('Link') || '');

    // Extract data from the response structure
    const data = responseData.data || responseData;
    const backendPaging = responseData.paging;

    return {
      data,
      pagination: pagination || backendPaging,
      links
    };
  }

  /**
   * BBC TAMS compliant POST request
   */
  async bbcTamsPost<T>(endpoint: string, body: any, options: BBCApiOptions = {}): Promise<T> {
    const queryString = buildBBCQueryString(options);
    const url = `${this.baseUrl}${endpoint}${queryString}`;
    
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

  /**
   * BBC TAMS compliant PUT request
   */
  async bbcTamsPut<T>(endpoint: string, body: any, options: BBCApiOptions = {}): Promise<T> {
    const queryString = buildBBCQueryString(options);
    const url = `${this.baseUrl}${endpoint}${queryString}`;
    
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

  /**
   * BBC TAMS compliant DELETE request
   */
  async bbcTamsDelete(endpoint: string, options: BBCApiOptions = {}): Promise<void> {
    const queryString = buildBBCQueryString(options);
    const url = `${this.baseUrl}${endpoint}${queryString}`;
    
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

  /**
   * BBC TAMS compliant HEAD request for metadata
   */
  async bbcTamsHead(endpoint: string, options: BBCApiOptions = {}): Promise<BBCPaginationMeta> {
    const queryString = buildBBCQueryString(options);
    const url = `${this.baseUrl}${endpoint}${queryString}`;
    
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

  /**
   * Legacy request method for backward compatibility
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      // Handle empty responses
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async getHealth(): Promise<any> {
    return this.request('/health');
  }

  // Metrics
  async getMetrics(): Promise<any> {
    return this.request('/metrics');
  }

  // Service information
  async getService(): Promise<any> {
    return this.request('/service');
  }

  // BBC TAMS Sources API
  async getSources(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    return this.bbcTamsGet('/sources', options);
  }

  async getSource(id: string): Promise<any> {
    return this.request(`/sources/${id}`);
  }

  async createSource(source: any): Promise<any> {
    return this.request('/sources', {
      method: 'POST',
      body: JSON.stringify(source),
    });
  }

  async updateSource(id: string, source: any): Promise<any> {
    return this.request(`/sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(source),
    });
  }

  async deleteSource(id: string, options: any): Promise<any> {
    const queryParams = new URLSearchParams();
    if (options.softDelete) queryParams.append('soft_delete', 'true');
    if (options.cascade) queryParams.append('cascade', 'true');
    if (options.deletedBy) queryParams.append('deleted_by', options.deletedBy);
    
    const endpoint = `/sources/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  async restoreSource(id: string): Promise<any> {
    return this.request(`/sources/${id}/restore`, {
      method: 'POST',
    });
  }

  // BBC TAMS Flows API
  async getFlows(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    return this.bbcTamsGet('/flows', options);
  }

  async getFlow(id: string): Promise<any> {
    return this.request(`/flows/${id}`);
  }

  async createFlow(flow: any): Promise<any> {
    return this.request('/flows', {
      method: 'POST',
      body: JSON.stringify(flow),
    });
  }

  async updateFlow(id: string, flow: any): Promise<any> {
    return this.request(`/flows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(flow),
    });
  }

  async deleteFlow(id: string, options: any): Promise<any> {
    const queryParams = new URLSearchParams();
    if (options.softDelete) queryParams.append('soft_delete', 'true');
    if (options.cascade) queryParams.append('cascade', 'true');
    if (options.deletedBy) queryParams.append('deleted_by', options.deletedBy);
    
    const endpoint = `/flows/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  async restoreFlow(id: string): Promise<any> {
    return this.request(`/flows/${id}/restore`, {
      method: 'POST',
    });
  }

  // BBC TAMS Segments API
  async getFlowSegments(flowId: string, options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    return this.bbcTamsGet(`/flows/${flowId}/segments`, options);
  }

  async createFlowSegment(flowId: string, segment: any, file?: File): Promise<any> {
    if (file) {
      // Handle file upload with multipart form data
      const formData = new FormData();
      formData.append('segment_data', JSON.stringify(segment));
      formData.append('file', file);
      
      return this.request(`/flows/${flowId}/segments`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData, let the browser set it
        },
      });
    } else {
      // Handle JSON-only segment creation
      return this.request(`/flows/${flowId}/segments`, {
        method: 'POST',
        body: JSON.stringify(segment),
      });
    }
  }

  async deleteFlowSegments(flowId: string, options: any): Promise<any> {
    const queryParams = new URLSearchParams();
    if (options.timerange) queryParams.append('timerange', options.timerange);
    if (options.softDelete !== undefined) queryParams.append('soft_delete', options.softDelete.toString());
    if (options.deletedBy) queryParams.append('deleted_by', options.deletedBy);
    
    const endpoint = `/flows/${flowId}/segments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // BBC TAMS Objects API
  async getObjects(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    return this.bbcTamsGet('/objects', options);
  }

  async getObject(id: string): Promise<any> {
    return this.request(`/objects/${id}`);
  }

  async createObject(object: any): Promise<any> {
    return this.request('/objects', {
      method: 'POST',
      body: JSON.stringify(object),
    });
  }

  async deleteObject(id: string, options: any): Promise<any> {
    const queryParams = new URLSearchParams();
    if (options.softDelete !== undefined) queryParams.append('soft_delete', options.softDelete.toString());
    if (options.deletedBy) queryParams.append('deleted_by', options.deletedBy);
    
    const endpoint = `/objects/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // BBC TAMS Field Operations API
  async getFieldValue<T = any>(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    options?: BBCApiOptions
  ): Promise<T> {
    const url = `/${entityType}/${entityId}/${fieldKey}`;
    const response = await this.bbcTamsGet<T>(url, options);
    return response.data as T;
  }

  async updateFieldValue<T = any>(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    value: T,
    options?: BBCApiOptions
  ): Promise<BBCApiResponse<T>> {
    const url = `/${entityType}/${entityId}/${fieldKey}`;
    const response = await this.bbcTamsPut<T>(url, value, options);
    return response as unknown as BBCApiResponse<T>;
  }

  async deleteField(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    options?: BBCApiOptions
  ): Promise<BBCApiResponse<void>> {
    const url = `/${entityType}/${entityId}/${fieldKey}`;
    const response = await this.bbcTamsDelete(url, options);
    return response as unknown as BBCApiResponse<void>;
  }

  async getFieldMetadata(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    options?: BBCApiOptions
  ): Promise<BBCApiResponse<any>> {
    const url = `/${entityType}/${entityId}/${fieldKey}`;
    const response = await this.bbcTamsHead(url, options);
    return response as unknown as BBCApiResponse<any>;
  }

  // Get all available fields for an entity
  async getEntityFields(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    options?: BBCApiOptions
  ): Promise<string[]> {
    try {
      // Try to get field information from HEAD request
      const response = await this.bbcTamsHead(`/${entityType}/${entityId}`, options);
      
      // For now, return common BBC TAMS fields since the backend might not expose field discovery yet
      const commonFields = [
        'label',
        'description', 
        'format',
        'codec',
        'frame_width',
        'frame_height',
        'frame_rate',
        'sample_rate',
        'channels',
        'max_bit_rate',
        'tags',
        'created',
        'updated'
      ];
      
      console.log('Using common BBC TAMS fields for', entityType, entityId);
      return commonFields;
      
    } catch (error) {
      console.warn('Could not retrieve entity fields from backend, using fallback:', error);
      
      // Fallback to common fields if backend doesn't support field discovery
      const fallbackFields = [
        'label',
        'description',
        'format',
        'codec',
        'tags'
      ];
      
      return fallbackFields;
    }
  }

  // Analytics
  async getFlowUsageAnalytics(): Promise<any> {
    return this.request('/analytics/flow-usage');
  }

  async getStorageUsageAnalytics(): Promise<any> {
    return this.request('/analytics/storage-usage');
  }

  async getTimeRangeAnalytics(): Promise<any> {
    return this.request('/analytics/time-range-analysis');
  }

  // BBC TAMS Webhooks API
  async getWebhooks(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    return this.bbcTamsGet('/service/webhooks', options);
  }

  async createWebhook(webhookData: {
    url: string;
    events: string[];
    api_key_name?: string;
    api_key_value?: string;
    owner_id?: string;
  }): Promise<any> {
    return this.bbcTamsPost('/service/webhooks', webhookData);
  }

  async updateWebhook(
    webhookId: string,
    webhookData: {
      url: string;
      events: string[];
      api_key_name?: string;
      api_key_value?: string;
      owner_id?: string;
    }
  ): Promise<any> {
    return this.bbcTamsPut(`/service/webhooks/${webhookId}`, webhookData);
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    return this.bbcTamsDelete(`/service/webhooks/${webhookId}`);
  }

  async testWebhook(webhookId: string): Promise<any> {
    return this.request(`/service/webhooks/${webhookId}/test`, {
      method: 'POST',
    });
  }

  async getWebhookHistory(webhookId: string): Promise<any> {
    return this.request(`/service/webhooks/${webhookId}/history`);
  }

  async getWebhookStats(webhookId: string): Promise<any> {
    return this.request(`/service/webhooks/${webhookId}/stats`);
  }

  async getWebhookEventTypes(): Promise<string[]> {
    try {
      const response = await this.request<{ events?: string[] }>('/service/webhook-events');
      return response.events || [];
    } catch (error) {
      console.warn('Could not retrieve webhook event types, using fallback:', error);
      // Fallback to common BBC TAMS webhook events
      return [
        'flow.created',
        'flow.updated',
        'flow.deleted',
        'source.created',
        'source.updated',
        'source.deleted',
        'segment.created',
        'segment.updated',
        'segment.deleted'
      ];
    }
  }

  // OpenAPI specification
  async getOpenApiSpec(): Promise<any> {
    return this.request('/openapi.json');
  }

  // Root endpoints
  async getRootEndpoints(): Promise<string[]> {
    return this.request('/');
  }
}

// Export singleton instance
export const apiClient = new UnifiedApiClient();

// Export types for use in components
export type { 
  ApiResponse, 
  PaginatedResponse
};
export { UnifiedApiClient };

// Legacy exports for backward compatibility
export { apiClient as legacyApiClient };
