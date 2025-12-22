/**
 * VAST TAMS API Service Client
 * 
 * Specialized service for the VAST TAMS BBC TAMS v6.0 compliant backend
 * Handles all BBC TAMS endpoints with VAST TAMS extensions including:
 * - Soft Delete functionality
 * - Webhooks management
 * - Storage allocation
 * - Flow collections
 * - Dual URL support (GET/HEAD presigned URLs)
 */

import { BBCApiResponse, BBCApiOptions, parseBBCHeaders, parseLinkHeader, buildBBCQueryString } from './api';
import { BackendApiConfig } from '../config/apiConfig';

// VAST TAMS specific types
export interface VastTamsSegment {
  id: string;
  timerange: string;
  get_urls: Array<{
    url: string;
    label?: string; // "GET access for segment {id}" or "HEAD access for segment {id}"
  }>;
  format?: string;
  codec?: string;
  size?: number | undefined;
  created?: string | undefined;
  updated?: string | undefined;
  tags?: Record<string, any> | undefined;
  deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export interface VastTamsFlow {
  id: string;
  source_id: string;
  format: string;
  codec?: string;
  label: string;
  description?: string;
  frame_width?: number;
  frame_height?: number;
  frame_rate?: string;
  read_only?: boolean;
  max_bit_rate?: number;
  avg_bit_rate?: number;
  created?: string;
  updated?: string;
  tags?: Record<string, any>;
  deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export interface VastTamsSource {
  id: string;
  format: string;
  label: string;
  description?: string;
  created?: string;
  updated?: string;
  tags?: Record<string, any>;
  source_collection?: Array<{ id: string; label: string }>;
  collected_by?: string[];
  deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export interface VastTamsObject {
  id: string;
  flow_id: string;
  segment_id: string;
  created?: string;
  updated?: string;
  tags?: Record<string, any>;
  deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export interface VastTamsWebhook {
  id: string;
  url: string;
  events: string[];
  api_key_name?: string;
  api_key_value?: string;
  owner_id?: string;
  created?: string;
  updated?: string;
  active?: boolean;
}

export interface VastTamsHealth {
  status: string;
  timestamp: string;
  version: string;
  system: {
    memory_usage_bytes: number;
    memory_total_bytes: number;
    cpu_percent: number;
    uptime_seconds: number;
  };
  telemetry: {
    tracing_enabled: boolean;
    metrics_enabled: boolean;
  };
}

export interface VastTamsAnalytics {
  flow_usage?: any;
  storage_usage?: any;
  time_range_analysis?: any;
}

export interface VastTamsStorageAllocation {
  flow_id: string;
  total_size_bytes: number;
  segments_count: number;
  s3_bucket: string;
  s3_prefix: string;
  created?: string;
  updated?: string;
}

export interface VastTamsFlowCollection {
  id: string;
  label: string;
  description?: string;
  flow_ids: string[];
  created?: string;
  updated?: string;
  tags?: Record<string, any>;
}

export interface VastTamsFlowDeleteRequest {
  id: string;
  flow_id: string;
  requested_by: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created?: string;
  updated?: string;
  approved_by?: string;
  approved_at?: string;
  completed_at?: string;
}

// VAST TAMS API Client
export class VastTamsApiClient {
  private baseUrl: string;
  private config: BackendApiConfig;

  constructor(config: BackendApiConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl;
  }

  /**
   * Helper function to safely get the first item from response data
   */
  private getFirstItem<T>(response: BBCApiResponse<T>, errorMessage: string): T {
    if (!response.data || response.data.length === 0) {
      throw new Error(errorMessage);
    }
    return response.data[0] as T;
  }

  /**
   * Make a BBC TAMS compliant request
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    queryParams: BBCApiOptions = {}
  ): Promise<BBCApiResponse<T>> {
    const queryString = buildBBCQueryString(queryParams);
    const url = `${this.baseUrl}${endpoint}${queryString}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      // 503 is valid for health endpoint (degraded service) - handle it specially
      // Check if this is a health endpoint request
      const isHealthEndpoint = endpoint === '/health' || endpoint.endsWith('/health');
      
      if (!response.ok) {
        // For health endpoint, 503 means degraded but available
        if (isHealthEndpoint && response.status === 503) {
          // Try to parse the response body for health data, or return degraded status
          try {
            const responseData = await response.json();
            // Handle both direct object and wrapped in data property
            const healthData = responseData.data || responseData;
            return {
              data: Array.isArray(healthData) ? healthData : [healthData],
              pagination: {},
              links: []
            } as BBCApiResponse<T>;
          } catch {
            // If response body can't be parsed, return degraded status
            return {
              data: [{
                status: 'degraded',
                version: 'unknown',
                timestamp: new Date().toISOString(),
                system: {
                  memory_usage_bytes: 0,
                  memory_total_bytes: 0,
                  cpu_percent: 0,
                  uptime_seconds: 0
                }
              } as T],
              pagination: {},
              links: []
            } as BBCApiResponse<T>;
          }
        }
        throw new Error(`TAMS API error: ${response.status} ${response.statusText}`);
      }

      // Handle empty responses
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {
          data: [] as T[],
          pagination: {},
          links: []
        };
      }

      const responseData = await response.json();
      const pagination = parseBBCHeaders(response.headers);
      const links = parseLinkHeader(response.headers.get('Link') || '');

      // Extract data from the response structure
      // Handle different API response formats:
      // 1. BBC TAMS format: { data: [...] }
      // 2. monks_tams_api format: { sources: [...], count: N }
      // 3. Direct array: [...]
      let data: any;
      if (responseData.data) {
        // BBC TAMS format
        data = responseData.data;
      } else if (responseData.sources && Array.isArray(responseData.sources)) {
        // monks_tams_api format: { sources: [...], count: N }
        data = responseData.sources;
        // Also extract count if available
        if (responseData.count !== undefined && !pagination.count) {
          pagination.count = responseData.count;
        }
      } else if (Array.isArray(responseData)) {
        // Direct array response
        data = responseData;
      } else {
        // Single object or unknown format
        data = responseData;
      }

      return {
        data: Array.isArray(data) ? data : [data],
        pagination: pagination || responseData.paging || {},
        links
      };
    } catch (error) {
      console.error(`VAST TAMS API request error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health and System Information
  async getHealth(): Promise<VastTamsHealth> {
    // Health endpoint can return 503 for degraded service, which is valid
    // The makeRequest method now handles 503 for /health endpoint specially
    const response = await this.makeRequest<VastTamsHealth>('/health');
    return this.getFirstItem(response, 'Health data not available');
  }

  async getMetrics(): Promise<any> {
    const response = await this.makeRequest<any>('/metrics');
    return this.getFirstItem(response, 'Metrics data not available');
  }

  async getService(): Promise<any> {
    const response = await this.makeRequest<any>('/');
    return this.getFirstItem(response, 'Service data not available');
  }

  // Sources API
  async getSources(options: BBCApiOptions = {}): Promise<BBCApiResponse<VastTamsSource>> {
    return this.makeRequest<VastTamsSource>('/sources', { method: 'GET' }, options);
  }

  async getSource(id: string): Promise<VastTamsSource> {
    const response = await this.makeRequest<VastTamsSource>(`/sources/${id}`);
    return this.getFirstItem(response, `Source ${id} not found`);
  }

  async createSource(source: Partial<VastTamsSource>): Promise<VastTamsSource> {
    const response = await this.makeRequest<VastTamsSource>('/sources', {
      method: 'POST',
      body: JSON.stringify(source)
    });
    return this.getFirstItem(response, 'Data not available');
  }

  async updateSource(id: string, source: Partial<VastTamsSource>): Promise<VastTamsSource> {
    const response = await this.makeRequest<VastTamsSource>(`/sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(source)
    });
    return this.getFirstItem(response, 'Data not available');
  }

  async deleteSource(id: string, options: { softDelete?: boolean; cascade?: boolean; deletedBy?: string } = {}): Promise<void> {
    const queryParams: BBCApiOptions = {};
    if (options.softDelete) queryParams.custom = { soft_delete: 'true' };
    if (options.cascade) queryParams.custom = { ...queryParams.custom, cascade: 'true' };
    if (options.deletedBy) queryParams.custom = { ...queryParams.custom, deleted_by: options.deletedBy };

    await this.makeRequest(`/sources/${id}`, { method: 'DELETE' }, queryParams);
  }

  async restoreSource(id: string): Promise<VastTamsSource> {
    const response = await this.makeRequest<VastTamsSource>(`/sources/${id}/restore`, {
      method: 'POST'
    });
    return this.getFirstItem(response, 'Data not available');
  }

  // Flows API
  async getFlows(options: BBCApiOptions = {}): Promise<BBCApiResponse<VastTamsFlow>> {
    return this.makeRequest<VastTamsFlow>('/flows', { method: 'GET' }, options);
  }

  async getFlow(id: string): Promise<VastTamsFlow> {
    const response = await this.makeRequest<VastTamsFlow>(`/flows/${id}`);
    return this.getFirstItem(response, 'Data not available');
  }

  async createFlow(flow: Partial<VastTamsFlow>): Promise<VastTamsFlow> {
    const response = await this.makeRequest<VastTamsFlow>('/flows', {
      method: 'POST',
      body: JSON.stringify(flow)
    });
    return this.getFirstItem(response, 'Data not available');
  }

  async updateFlow(id: string, flow: Partial<VastTamsFlow>): Promise<VastTamsFlow> {
    const response = await this.makeRequest<VastTamsFlow>(`/flows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(flow)
    });
    return this.getFirstItem(response, 'Data not available');
  }

  async deleteFlow(id: string, options: { softDelete?: boolean; cascade?: boolean; deletedBy?: string } = {}): Promise<void> {
    const queryParams: BBCApiOptions = {};
    if (options.softDelete) queryParams.custom = { soft_delete: 'true' };
    if (options.cascade) queryParams.custom = { ...queryParams.custom, cascade: 'true' };
    if (options.deletedBy) queryParams.custom = { ...queryParams.custom, deleted_by: options.deletedBy };

    await this.makeRequest(`/flows/${id}`, { method: 'DELETE' }, queryParams);
  }

  async restoreFlow(id: string): Promise<VastTamsFlow> {
    const response = await this.makeRequest<VastTamsFlow>(`/flows/${id}/restore`, {
      method: 'POST'
    });
    return this.getFirstItem(response, 'Data not available');
  }

  // Segments API
  async getFlowSegments(flowId: string, options: BBCApiOptions = {}): Promise<BBCApiResponse<VastTamsSegment>> {
    return this.makeRequest<VastTamsSegment>(`/flows/${flowId}/segments`, { method: 'GET' }, options);
  }

  async createFlowSegment(flowId: string, segment: Partial<VastTamsSegment>, file?: File): Promise<VastTamsSegment> {
    if (file) {
      // Handle file upload with multipart form data
      const formData = new FormData();
      formData.append('segment_data', JSON.stringify(segment));
      formData.append('file', file);
      
      const response = await this.makeRequest<VastTamsSegment>(`/flows/${flowId}/segments`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData, let the browser set it
        }
      });
      return this.getFirstItem(response, 'Data not available');
    } else {
      // Handle JSON-only segment creation
      const response = await this.makeRequest<VastTamsSegment>(`/flows/${flowId}/segments`, {
        method: 'POST',
        body: JSON.stringify(segment)
      });
      return this.getFirstItem(response, 'Data not available');
    }
  }

  async deleteFlowSegments(flowId: string, options: { timerange?: string; softDelete?: boolean; deletedBy?: string } = {}): Promise<void> {
    const queryParams: BBCApiOptions = {};
    if (options.timerange) queryParams.timerange = options.timerange;
    if (options.softDelete) queryParams.custom = { soft_delete: 'true' };
    if (options.deletedBy) queryParams.custom = { ...queryParams.custom, deleted_by: options.deletedBy };

    await this.makeRequest(`/flows/${flowId}/segments`, { method: 'DELETE' }, queryParams);
  }

  // Objects API
  async getObjects(options: BBCApiOptions = {}): Promise<BBCApiResponse<VastTamsObject>> {
    return this.makeRequest<VastTamsObject>('/objects', { method: 'GET' }, options);
  }

  async getObject(id: string): Promise<VastTamsObject> {
    const response = await this.makeRequest<VastTamsObject>(`/objects/${id}`);
    return this.getFirstItem(response, 'Data not available');
  }

  async createObject(object: Partial<VastTamsObject>): Promise<VastTamsObject> {
    const response = await this.makeRequest<VastTamsObject>('/objects', {
      method: 'POST',
      body: JSON.stringify(object)
    });
    return this.getFirstItem(response, 'Data not available');
  }

  async deleteObject(id: string, options: { softDelete?: boolean; deletedBy?: string } = {}): Promise<void> {
    const queryParams: BBCApiOptions = {};
    if (options.softDelete) queryParams.custom = { soft_delete: 'true' };
    if (options.deletedBy) queryParams.custom = { ...queryParams.custom, deleted_by: options.deletedBy };

    await this.makeRequest(`/objects/${id}`, { method: 'DELETE' }, queryParams);
  }

  // Flow Field Operations
  async getFlowField<T = any>(flowId: string, fieldKey: string, options?: BBCApiOptions): Promise<T> {
    const response = await this.makeRequest<T>(`/flows/${flowId}/${fieldKey}`, { method: 'GET' }, options);
    return this.getFirstItem(response, 'Data not available');
  }

  async updateFlowField<T = any>(flowId: string, fieldKey: string, value: T, options?: BBCApiOptions): Promise<T> {
    const response = await this.makeRequest<T>(`/flows/${flowId}/${fieldKey}`, {
      method: 'PUT',
      body: JSON.stringify(value)
    }, options);
    return this.getFirstItem(response, 'Data not available');
  }

  async deleteFlowField(flowId: string, fieldKey: string, options?: BBCApiOptions): Promise<void> {
    await this.makeRequest(`/flows/${flowId}/${fieldKey}`, { method: 'DELETE' }, options);
  }

  // Flow Tags Management
  async getFlowTags(flowId: string): Promise<Record<string, string>> {
    const response = await this.makeRequest<Record<string, string>>(`/flows/${flowId}/tags`);
    return this.getFirstItem(response, 'Data not available');
  }

  async setFlowTag(flowId: string, tagName: string, tagValue: string): Promise<any> {
    const response = await this.makeRequest<any>(`/flows/${flowId}/tags/${tagName}`, {
      method: 'PUT',
      body: JSON.stringify({ value: tagValue })
    });
    return this.getFirstItem(response, 'Data not available');
  }

  async deleteFlowTag(flowId: string, tagName: string): Promise<void> {
    await this.makeRequest(`/flows/${flowId}/tags/${tagName}`, { method: 'DELETE' });
  }

  // Flow Collection Management
  async getFlowCollection(flowId: string): Promise<VastTamsFlowCollection> {
    const response = await this.makeRequest<VastTamsFlowCollection>(`/flows/${flowId}/flow_collection`);
    return this.getFirstItem(response, 'Data not available');
  }

  async setFlowCollection(flowId: string, collectionId: string): Promise<VastTamsFlowCollection> {
    const response = await this.makeRequest<VastTamsFlowCollection>(`/flows/${flowId}/flow_collection`, {
      method: 'PUT',
      body: JSON.stringify({ collection_id: collectionId })
    });
    return this.getFirstItem(response, 'Data not available');
  }

  async removeFlowFromCollection(flowId: string): Promise<void> {
    await this.makeRequest(`/flows/${flowId}/flow_collection`, { method: 'DELETE' });
  }

  // Flow Read-Only Status Management
  async getFlowReadOnly(flowId: string): Promise<{ read_only: boolean }> {
    const response = await this.makeRequest<{ read_only: boolean }>(`/flows/${flowId}/read_only`);
    return this.getFirstItem(response, 'Data not available');
  }

  async setFlowReadOnly(flowId: string, readOnly: boolean): Promise<{ read_only: boolean }> {
    const response = await this.makeRequest<{ read_only: boolean }>(`/flows/${flowId}/read_only`, {
      method: 'PUT',
      body: JSON.stringify({ read_only: readOnly })
    });
    return this.getFirstItem(response, 'Data not available');
  }

  // Flow Description Management
  async getFlowDescription(flowId: string): Promise<{ description: string }> {
    const response = await this.makeRequest<{ description: string }>(`/flows/${flowId}/description`);
    return this.getFirstItem(response, 'Data not available');
  }

  async setFlowDescription(flowId: string, description: string): Promise<{ description: string }> {
    const response = await this.makeRequest<{ description: string }>(`/flows/${flowId}/description`, {
      method: 'PUT',
      body: JSON.stringify({ description })
    });
    return this.getFirstItem(response, 'Data not available');
  }

  // Flow Label Management
  async getFlowLabel(flowId: string): Promise<{ label: string }> {
    const response = await this.makeRequest<{ label: string }>(`/flows/${flowId}/label`);
    return this.getFirstItem(response, 'Data not available');
  }

  async setFlowLabel(flowId: string, label: string): Promise<{ label: string }> {
    const response = await this.makeRequest<{ label: string }>(`/flows/${flowId}/label`, {
      method: 'PUT',
      body: JSON.stringify({ label })
    });
    return this.getFirstItem(response, 'Data not available');
  }

  // Analytics API
  async getFlowUsageAnalytics(): Promise<any> {
    const response = await this.makeRequest<any>('/analytics/flow-usage');
    return this.getFirstItem(response, 'Data not available');
  }

  async getStorageUsageAnalytics(): Promise<any> {
    const response = await this.makeRequest<any>('/analytics/storage-usage');
    return this.getFirstItem(response, 'Data not available');
  }

  async getTimeRangeAnalytics(): Promise<any> {
    const response = await this.makeRequest<any>('/analytics/time-range-analysis');
    return this.getFirstItem(response, 'Data not available');
  }

  // Webhooks API
  async getWebhooks(options: BBCApiOptions = {}): Promise<BBCApiResponse<VastTamsWebhook>> {
    return this.makeRequest<VastTamsWebhook>('/service/webhooks', { method: 'GET' }, options);
  }

  async createWebhook(webhookData: {
    url: string;
    events: string[];
    api_key_name?: string;
    api_key_value?: string;
    owner_id?: string;
  }): Promise<VastTamsWebhook> {
    const response = await this.makeRequest<VastTamsWebhook>('/service/webhooks', {
      method: 'POST',
      body: JSON.stringify(webhookData)
    });
    return this.getFirstItem(response, 'Data not available');
  }

  async updateWebhook(webhookId: string, webhookData: {
    url: string;
    events: string[];
    api_key_name?: string;
    api_key_value?: string;
    owner_id?: string;
  }): Promise<VastTamsWebhook> {
    const response = await this.makeRequest<VastTamsWebhook>(`/service/webhooks/${webhookId}`, {
      method: 'PUT',
      body: JSON.stringify(webhookData)
    });
    return this.getFirstItem(response, 'Data not available');
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    await this.makeRequest(`/service/webhooks/${webhookId}`, { method: 'DELETE' });
  }

  async testWebhook(webhookId: string): Promise<any> {
    const response = await this.makeRequest<any>(`/service/webhooks/${webhookId}/test`, {
      method: 'POST'
    });
    return this.getFirstItem(response, 'Data not available');
  }

  async getWebhookHistory(webhookId: string): Promise<any> {
    const response = await this.makeRequest<any>(`/service/webhooks/${webhookId}/history`);
    return this.getFirstItem(response, 'Data not available');
  }

  async getWebhookStats(webhookId: string): Promise<any> {
    const response = await this.makeRequest<any>(`/service/webhooks/${webhookId}/stats`);
    return this.getFirstItem(response, 'Data not available');
  }

  async getWebhookEventTypes(): Promise<string[]> {
    try {
      const response = await this.makeRequest<{ events?: string[] }>('/service/webhook-events');
      return response.data[0]?.events || [];
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

  // Storage Allocation API
  async getStorageAllocation(flowId: string): Promise<VastTamsStorageAllocation> {
    const response = await this.makeRequest<VastTamsStorageAllocation>(`/flows/${flowId}/storage`);
    return this.getFirstItem(response, 'Data not available');
  }

  // Flow Delete Requests API
  async getFlowDeleteRequests(options: BBCApiOptions = {}): Promise<BBCApiResponse<VastTamsFlowDeleteRequest>> {
    return this.makeRequest<VastTamsFlowDeleteRequest>('/flow-delete-requests', { method: 'GET' }, options);
  }

  async getFlowDeleteRequest(requestId: string): Promise<VastTamsFlowDeleteRequest> {
    const response = await this.makeRequest<VastTamsFlowDeleteRequest>(`/flow-delete-requests/${requestId}`);
    return this.getFirstItem(response, 'Data not available');
  }

  async createFlowDeleteRequest(requestData: {
    flow_id: string;
    requested_by: string;
    reason?: string;
  }): Promise<VastTamsFlowDeleteRequest> {
    const response = await this.makeRequest<VastTamsFlowDeleteRequest>('/flow-delete-requests', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    return this.getFirstItem(response, 'Data not available');
  }

  async updateFlowDeleteRequest(requestId: string, updates: {
    status?: 'pending' | 'approved' | 'rejected' | 'completed';
    approved_by?: string;
    reason?: string;
  }): Promise<VastTamsFlowDeleteRequest> {
    const response = await this.makeRequest<VastTamsFlowDeleteRequest>(`/flow-delete-requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return this.getFirstItem(response, 'Data not available');
  }

  // Utility methods for VAST TAMS specific features
  async getSegmentContentUrl(flowId: string, segmentId: string): Promise<string> {
    const segments = await this.getFlowSegments(flowId);
    const segment = segments.data.find(s => s.id === segmentId);
    
    if (!segment) {
      throw new Error(`Segment ${segmentId} not found in flow ${flowId}`);
    }
    
    // Return the GET URL for video playback
    if (segment.get_urls && segment.get_urls.length > 0) {
      const getUrl = segment.get_urls.find(url => url.label?.includes('GET'));
      if (getUrl) {
        return getUrl.url;
      }
    }
    
    throw new Error(`No GET URL found for segment ${segmentId}`);
  }

  async getSegmentMetadataUrl(flowId: string, segmentId: string): Promise<string> {
    const segments = await this.getFlowSegments(flowId);
    const segment = segments.data.find(s => s.id === segmentId);
    
    if (!segment) {
      throw new Error(`Segment ${segmentId} not found in flow ${flowId}`);
    }
    
    // Return the HEAD URL for metadata
    if (segment.get_urls && segment.get_urls.length > 0) {
      const headUrl = segment.get_urls.find(url => url.label?.includes('HEAD'));
      if (headUrl) {
        return headUrl.url;
      }
    }
    
    throw new Error(`No HEAD URL found for segment ${segmentId}`);
  }

  // OpenAPI specification
  async getOpenApiSpec(): Promise<any> {
    const response = await this.makeRequest<any>('/openapi.json');
    return this.getFirstItem(response, 'Data not available');
  }
}

// Export singleton instance factory
export function createVastTamsApiClient(config: BackendApiConfig): VastTamsApiClient {
  return new VastTamsApiClient(config);
}
