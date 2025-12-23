/**
 * BBC TAMS API Client
 * 
 * BBC TAMS specification compliance API client without VAST extensions.
 * Implements the IApiClient interface with BBC TAMS core features only.
 */

import { IApiClient, BackendFeature, ApiClientOptions } from '../interfaces/IApiClient';
import { BackendApiConfig } from '../../config/apiConfig';
import { BBCApiResponse, BBCApiOptions, buildBBCQueryString, parseBBCHeaders, parseLinkHeader } from '../api';

export class BbcTamsApiClient implements IApiClient {
  private config: BackendApiConfig;
  private options: ApiClientOptions;
  private baseUrl: string;
  private connectionStatus: {
    connected: boolean;
    lastCheck: Date;
    responseTime?: number;
    error?: string;
  } = {
    connected: false,
    lastCheck: new Date(),
  };

  constructor(config: BackendApiConfig, options: ApiClientOptions = {}) {
    this.config = config;
    this.options = {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      debug: false,
      ...options,
    };
    this.baseUrl = config.baseUrl;
  }

  // ============================================================================
  // INITIALIZATION AND CONFIGURATION
  // ============================================================================

  async initialize(): Promise<void> {
    try {
      await this.testConnection();
      console.log('BBC TAMS API client initialized successfully');
    } catch (error) {
      console.error('BBC TAMS API client initialization failed:', error);
      throw error;
    }
  }

  setBackendConfig(config: BackendApiConfig): void {
    this.config = config;
    this.baseUrl = config.baseUrl;
  }

  getBackendConfig(): BackendApiConfig {
    return this.config;
  }

  async testConnection(): Promise<boolean> {
    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        this.connectionStatus = {
          connected: true,
          lastCheck: new Date(),
          responseTime,
        };
        return true;
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      this.connectionStatus = {
        connected: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      return false;
    }
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }

  // ============================================================================
  // CORE TAMS OPERATIONS
  // ============================================================================

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

  async deleteSource(id: string, options: any = {}): Promise<any> {
    // BBC TAMS doesn't support soft delete
    return this.request(`/sources/${id}`, { method: 'DELETE' });
  }

  async restoreSource(id: string): Promise<any> {
    throw new Error('Source restoration not supported by BBC TAMS backend');
  }

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

  async deleteFlow(id: string, options: any = {}): Promise<any> {
    // BBC TAMS doesn't support soft delete
    return this.request(`/flows/${id}`, { method: 'DELETE' });
  }

  async restoreFlow(id: string): Promise<any> {
    throw new Error('Flow restoration not supported by BBC TAMS backend');
  }

  async getFlowSegments(flowId: string, options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    return this.bbcTamsGet(`/flows/${flowId}/segments`, options);
  }

  async createFlowSegment(flowId: string, segment: any, file?: File): Promise<any> {
    if (file) {
      const formData = new FormData();
      formData.append('segment_data', JSON.stringify(segment));
      formData.append('file', file);
      
      return this.request(`/flows/${flowId}/segments`, {
        method: 'POST',
        body: formData,
      });
    } else {
      return this.request(`/flows/${flowId}/segments`, {
        method: 'POST',
        body: JSON.stringify(segment),
      });
    }
  }

  async deleteFlowSegments(flowId: string, options: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    if (options.timerange) queryParams.append('timerange', options.timerange);
    
    const endpoint = `/flows/${flowId}/segments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint, { method: 'DELETE' });
  }

  async cleanupFlow(id: string, hours: number = 24): Promise<any> {
    throw new Error('cleanupFlow is not supported by BBC TAMS backend');
  }

  async updateFlowSegment(flowId: string, segmentId: string, updates: any): Promise<any> {
    throw new Error('updateFlowSegment is not supported by BBC TAMS backend');
  }

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

  async deleteObject(id: string, options: any = {}): Promise<any> {
    return this.request(`/objects/${id}`, { method: 'DELETE' });
  }

  // ============================================================================
  // ADVANCED FEATURES (BBC TAMS Core Only)
  // ============================================================================

  async getFlowUsageAnalytics(): Promise<any> {
    return this.request('/analytics/flow-usage');
  }

  async getStorageUsageAnalytics(): Promise<any> {
    return this.request('/analytics/storage-usage');
  }

  async getTimeRangeAnalytics(): Promise<any> {
    return this.request('/analytics/time-range-analysis');
  }

  async getWebhooks(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    return this.bbcTamsGet('/webhooks', options);
  }

  async createWebhook(webhookData: any): Promise<any> {
    return this.bbcTamsPost('/webhooks', webhookData);
  }

  async updateWebhook(webhookId: string, webhookData: any): Promise<any> {
    return this.bbcTamsPut(`/webhooks/${webhookId}`, webhookData);
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    return this.bbcTamsDelete(`/webhooks/${webhookId}`);
  }

  async testWebhook(webhookId: string): Promise<any> {
    return this.request(`/webhooks/${webhookId}/test`, { method: 'POST' });
  }

  async getWebhookHistory(webhookId: string): Promise<any> {
    return this.request(`/webhooks/${webhookId}/history`);
  }

  async getWebhookStats(webhookId: string): Promise<any> {
    return this.request(`/webhooks/${webhookId}/stats`);
  }

  async getWebhookEventTypes(): Promise<string[]> {
    try {
      const response = await this.request<{ events?: string[] }>('/webhook-events');
      return response.events || [];
    } catch (error) {
      console.warn('Could not retrieve webhook event types, using fallback:', error);
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

  // Flow Management - Basic BBC TAMS features only
  async getFlowTags(flowId: string): Promise<Record<string, string>> {
    return this.request(`/flows/${flowId}/tags`);
  }

  async setFlowTag(flowId: string, tagName: string, tagValue: string): Promise<any> {
    return this.request(`/flows/${flowId}/tags/${tagName}`, {
      method: 'PUT',
      body: JSON.stringify({ value: tagValue }),
    });
  }

  async deleteFlowTag(flowId: string, tagName: string): Promise<any> {
    return this.request(`/flows/${flowId}/tags/${tagName}`, { method: 'DELETE' });
  }

  // BBC TAMS doesn't support flow collections
  async getFlowCollection(flowId: string): Promise<any> {
    throw new Error('Flow collections not supported by BBC TAMS backend');
  }

  async setFlowCollection(flowId: string, collectionId: string): Promise<any> {
    throw new Error('Flow collections not supported by BBC TAMS backend');
  }

  async removeFlowFromCollection(flowId: string): Promise<any> {
    throw new Error('Flow collections not supported by BBC TAMS backend');
  }

  async getFlowReadOnly(flowId: string): Promise<{ read_only: boolean }> {
    throw new Error('Flow read-only status not supported by BBC TAMS backend');
  }

  async setFlowReadOnly(flowId: string, readOnly: boolean): Promise<any> {
    throw new Error('Flow read-only status not supported by BBC TAMS backend');
  }

  async getFlowDescription(flowId: string): Promise<{ description: string }> {
    return this.request(`/flows/${flowId}/description`);
  }

  async setFlowDescription(flowId: string, description: string): Promise<any> {
    return this.request(`/flows/${flowId}/description`, {
      method: 'PUT',
      body: JSON.stringify({ description }),
    });
  }

  async getFlowLabel(flowId: string): Promise<{ label: string }> {
    return this.request(`/flows/${flowId}/label`);
  }

  async setFlowLabel(flowId: string, label: string): Promise<any> {
    return this.request(`/flows/${flowId}/label`, {
      method: 'PUT',
      body: JSON.stringify({ label }),
    });
  }

  // Field Operations
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

  async getEntityFields(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    options?: BBCApiOptions
  ): Promise<string[]> {
    try {
      const response = await this.bbcTamsHead(`/${entityType}/${entityId}`, options);
      
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

  // BBC TAMS doesn't support storage allocation
  async getStorage(flowId: string): Promise<any> {
    throw new Error('Storage allocation not supported by BBC TAMS backend');
  }

  async getHealth(): Promise<any> {
    return this.request('/health');
  }

  async getMetrics(): Promise<any> {
    return this.request('/metrics');
  }

  async getService(): Promise<any> {
    return this.request('/service');
  }

  // ============================================================================
  // BACKEND-SPECIFIC FEATURES (Not applicable for BBC TAMS)
  // ============================================================================

  async getHLSManifest?(flowId: string): Promise<any> {
    throw new Error('HLS manifest not supported by BBC TAMS backend');
  }

  async createMarker?(markerData: any): Promise<any> {
    throw new Error('Marker creation not supported by BBC TAMS backend');
  }

  async updateMarker?(markerId: string, updates: any): Promise<any> {
    throw new Error('Marker updates not supported by BBC TAMS backend');
  }

  async deleteMarker?(markerId: string): Promise<void> {
    throw new Error('Marker deletion not supported by BBC TAMS backend');
  }

  async connectWebSocket?(): Promise<void> {
    throw new Error('WebSocket not supported by BBC TAMS backend');
  }

  disconnectWebSocket?(): void {
    throw new Error('WebSocket not supported by BBC TAMS backend');
  }

  subscribeToWebSocket?(eventType: string, callback: (data: any) => void): void {
    throw new Error('WebSocket not supported by BBC TAMS backend');
  }

  unsubscribeFromWebSocket?(eventType: string, callback: (data: any) => void): void {
    throw new Error('WebSocket not supported by BBC TAMS backend');
  }

  isWebSocketConnected?(): boolean {
    return false;
  }

  extractMarkersFromSource?(source: any): any[] {
    return [];
  }

  extractVideoFlowsFromSource?(source: any): any[] {
    return source.flows || [];
  }

  isMarkerFlow?(flow: any): boolean {
    return false;
  }

  getMarkerColor?(marker: any): string {
    return '#00ff00';
  }

  getMarkerDisplayType?(marker: any): string {
    return 'square';
  }

  isMarkerEditable?(marker: any): boolean {
    return true;
  }

  // ============================================================================
  // FEATURE DETECTION
  // ============================================================================

  supportsFeature(feature: string): boolean {
    const featureMap: Record<string, boolean> = {
      softDelete: false,
      cmcd: true,
      webhooks: true,
      storageAllocation: false,
      flowCollections: false,
      advancedSearch: true,
      asyncOperations: false,
      healthMonitoring: false,
      hlsStreaming: false,
      realTimeMarkers: false,
      webSocketUpdates: false,
    };
    return featureMap[feature] || false;
  }

  getSupportedFeatures(): string[] {
    return [
      'cmcd',
      'webhooks',
      'advancedSearch',
    ];
  }

  getUnsupportedFeatures(): string[] {
    return [
      'softDelete',
      'storageAllocation',
      'flowCollections',
      'asyncOperations',
      'healthMonitoring',
      'hlsStreaming',
      'realTimeMarkers',
      'webSocketUpdates',
    ];
  }

  supportsSoftDelete(): boolean {
    return false;
  }

  supportsCMCD(): boolean {
    return true;
  }

  supportsWebhooks(): boolean {
    return true;
  }

  supportsStorageAllocation(): boolean {
    return false;
  }

  supportsFlowCollections(): boolean {
    return false;
  }

  supportsAdvancedSearch(): boolean {
    return true;
  }

  supportsAsyncOperations(): boolean {
    return false;
  }

  supportsHealthMonitoring(): boolean {
    return false;
  }

  // ============================================================================
  // BACKEND METADATA
  // ============================================================================

  getBackendId(): string {
    return this.config.id;
  }

  getBackendName(): string {
    return this.config.name;
  }

  getBackendType(): string {
    return this.config.type;
  }

  getBackendVersion(): string {
    return this.config.version;
  }

  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  getDescription(): string {
    return this.config.description;
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  async handleError(error: any, context?: string): Promise<never> {
    const message = this.getErrorMessage(error);
    const fullMessage = context ? `${context}: ${message}` : message;
    console.error('BBC TAMS API Error:', fullMessage, error);
    throw new Error(fullMessage);
  }

  validateResponse(response: any, expectedType?: string): boolean {
    if (!response) return false;
    if (expectedType && typeof response !== expectedType) return false;
    return true;
  }

  getErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error?.message) {
      return error.message;
    }
    return 'Unknown error occurred';
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async bbcTamsGet<T>(endpoint: string, options: BBCApiOptions = {}): Promise<BBCApiResponse<T>> {
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

    const data = responseData.data || responseData;
    const backendPaging = responseData.paging;

    return {
      data,
      pagination: pagination || backendPaging,
      links
    };
  }

  private async bbcTamsPost<T>(endpoint: string, body: any, options: BBCApiOptions = {}): Promise<T> {
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

  private async bbcTamsPut<T>(endpoint: string, body: any, options: BBCApiOptions = {}): Promise<T> {
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

  private async bbcTamsDelete(endpoint: string, options: BBCApiOptions = {}): Promise<void> {
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

  private async bbcTamsHead(endpoint: string, options: BBCApiOptions = {}): Promise<any> {
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

      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request error for ${endpoint}:`, error);
      throw error;
    }
  }
}
