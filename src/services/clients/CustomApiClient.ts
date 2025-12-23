/**
 * Custom API Client
 * 
 * Generic API client for custom backends with limited feature set.
 * Implements the IApiClient interface with basic functionality only.
 */

import { IApiClient, BackendFeature, ApiClientOptions } from '../interfaces/IApiClient';
import { BackendApiConfig } from '../../config/apiConfig';
import { BBCApiResponse, BBCApiOptions } from '../api';

export class CustomApiClient implements IApiClient {
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
      console.log('Custom API client initialized successfully');
    } catch (error) {
      console.error('Custom API client initialization failed:', error);
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
      const response = await fetch(`${this.baseUrl}/api/health`, {
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
  // CORE TAMS OPERATIONS (Limited Implementation)
  // ============================================================================

  async getSources(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    return this.customGet('/api/sources', options);
  }

  async getSource(id: string): Promise<any> {
    return this.request(`/api/sources/${id}`);
  }

  async createSource(source: any): Promise<any> {
    return this.request('/api/sources', {
      method: 'POST',
      body: JSON.stringify(source),
    });
  }

  async updateSource(id: string, source: any): Promise<any> {
    return this.request(`/api/sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(source),
    });
  }

  async deleteSource(id: string, options: any = {}): Promise<any> {
    return this.request(`/api/sources/${id}`, { method: 'DELETE' });
  }

  async restoreSource(id: string): Promise<any> {
    throw new Error('Source restoration not supported by custom backend');
  }

  async getFlows(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    return this.customGet('/api/flows', options);
  }

  async getFlow(id: string): Promise<any> {
    return this.request(`/api/flows/${id}`);
  }

  async createFlow(flow: any): Promise<any> {
    return this.request('/api/flows', {
      method: 'POST',
      body: JSON.stringify(flow),
    });
  }

  async updateFlow(id: string, flow: any): Promise<any> {
    return this.request(`/api/flows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(flow),
    });
  }

  async deleteFlow(id: string, options: any = {}): Promise<any> {
    return this.request(`/api/flows/${id}`, { method: 'DELETE' });
  }

  async restoreFlow(id: string): Promise<any> {
    throw new Error('Flow restoration not supported by custom backend');
  }

  async getFlowSegments(flowId: string, options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    return this.customGet(`/api/segments`, options);
  }

  async createFlowSegment(flowId: string, segment: any, file?: File): Promise<any> {
    if (file) {
      const formData = new FormData();
      formData.append('segment_data', JSON.stringify(segment));
      formData.append('file', file);
      
      return this.request(`/api/segments`, {
        method: 'POST',
        body: formData,
      });
    } else {
      return this.request(`/api/segments`, {
        method: 'POST',
        body: JSON.stringify(segment),
      });
    }
  }

  async deleteFlowSegments(flowId: string, options: any = {}): Promise<any> {
    return this.request(`/api/segments`, { method: 'DELETE' });
  }

   async cleanupFlow(id: string, hours: number = 24): Promise<any> {
    throw new Error('cleanupFlow is not supported by custom backend');
  }

  async updateFlowSegment(flowId: string, segmentId: string, updates: any): Promise<any> {
    throw new Error('updateFlowSegment is not supported by custom backend');
  }

  async getObjects(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    return this.customGet('/api/objects', options);
  }

  async getObject(id: string): Promise<any> {
    return this.request(`/api/objects/${id}`);
  }

  async createObject(object: any): Promise<any> {
    return this.request('/api/objects', {
      method: 'POST',
      body: JSON.stringify(object),
    });
  }

  async deleteObject(id: string, options: any = {}): Promise<any> {
    return this.request(`/api/objects/${id}`, { method: 'DELETE' });
  }

  // ============================================================================
  // ADVANCED FEATURES (Not Supported by Custom Backend)
  // ============================================================================

  async getFlowUsageAnalytics(): Promise<any> {
    throw new Error('Analytics not supported by custom backend');
  }

  async getStorageUsageAnalytics(): Promise<any> {
    throw new Error('Analytics not supported by custom backend');
  }

  async getTimeRangeAnalytics(): Promise<any> {
    throw new Error('Analytics not supported by custom backend');
  }

  async getWebhooks(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    throw new Error('Webhooks not supported by custom backend');
  }

  async createWebhook(webhookData: any): Promise<any> {
    throw new Error('Webhooks not supported by custom backend');
  }

  async updateWebhook(webhookId: string, webhookData: any): Promise<any> {
    throw new Error('Webhooks not supported by custom backend');
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    throw new Error('Webhooks not supported by custom backend');
  }

  async testWebhook(webhookId: string): Promise<any> {
    throw new Error('Webhooks not supported by custom backend');
  }

  async getWebhookHistory(webhookId: string): Promise<any> {
    throw new Error('Webhooks not supported by custom backend');
  }

  async getWebhookStats(webhookId: string): Promise<any> {
    throw new Error('Webhooks not supported by custom backend');
  }

  async getWebhookEventTypes(): Promise<string[]> {
    return [];
  }

  // Flow Management - Not supported by custom backend
  async getFlowTags(flowId: string): Promise<Record<string, string>> {
    throw new Error('Flow tags not supported by custom backend');
  }

  async setFlowTag(flowId: string, tagName: string, tagValue: string): Promise<any> {
    throw new Error('Flow tags not supported by custom backend');
  }

  async deleteFlowTag(flowId: string, tagName: string): Promise<any> {
    throw new Error('Flow tags not supported by custom backend');
  }

  async getFlowCollection(flowId: string): Promise<any> {
    throw new Error('Flow collections not supported by custom backend');
  }

  async setFlowCollection(flowId: string, collectionId: string): Promise<any> {
    throw new Error('Flow collections not supported by custom backend');
  }

  async removeFlowFromCollection(flowId: string): Promise<any> {
    throw new Error('Flow collections not supported by custom backend');
  }

  async getFlowReadOnly(flowId: string): Promise<{ read_only: boolean }> {
    throw new Error('Flow read-only status not supported by custom backend');
  }

  async setFlowReadOnly(flowId: string, readOnly: boolean): Promise<any> {
    throw new Error('Flow read-only status not supported by custom backend');
  }

  async getFlowDescription(flowId: string): Promise<{ description: string }> {
    throw new Error('Flow description not supported by custom backend');
  }

  async setFlowDescription(flowId: string, description: string): Promise<any> {
    throw new Error('Flow description not supported by custom backend');
  }

  async getFlowLabel(flowId: string): Promise<{ label: string }> {
    throw new Error('Flow label not supported by custom backend');
  }

  async setFlowLabel(flowId: string, label: string): Promise<any> {
    throw new Error('Flow label not supported by custom backend');
  }

  // Field Operations - Not supported by custom backend
  async getFieldValue<T = any>(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    options?: BBCApiOptions
  ): Promise<T> {
    throw new Error('Field operations not supported by custom backend');
  }

  async updateFieldValue<T = any>(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    value: T,
    options?: BBCApiOptions
  ): Promise<BBCApiResponse<T>> {
    throw new Error('Field operations not supported by custom backend');
  }

  async deleteField(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    options?: BBCApiOptions
  ): Promise<BBCApiResponse<void>> {
    throw new Error('Field operations not supported by custom backend');
  }

  async getFieldMetadata(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    options?: BBCApiOptions
  ): Promise<BBCApiResponse<any>> {
    throw new Error('Field operations not supported by custom backend');
  }

  async getEntityFields(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    options?: BBCApiOptions
  ): Promise<string[]> {
    return ['id', 'name', 'created', 'updated'];
  }

  async getStorage(flowId: string): Promise<any> {
    throw new Error('Storage allocation not supported by custom backend');
  }

  async getHealth(): Promise<any> {
    return this.request('/api/health');
  }

  async getMetrics(): Promise<any> {
    throw new Error('Metrics not supported by custom backend');
  }

  async getService(): Promise<any> {
    throw new Error('Service info not supported by custom backend');
  }

  // ============================================================================
  // BACKEND-SPECIFIC FEATURES (Not applicable for Custom Backend)
  // ============================================================================

  async getHLSManifest?(flowId: string): Promise<any> {
    throw new Error('HLS manifest not supported by custom backend');
  }

  async createMarker?(markerData: any): Promise<any> {
    throw new Error('Marker creation not supported by custom backend');
  }

  async updateMarker?(markerId: string, updates: any): Promise<any> {
    throw new Error('Marker updates not supported by custom backend');
  }

  async deleteMarker?(markerId: string): Promise<void> {
    throw new Error('Marker deletion not supported by custom backend');
  }

  async connectWebSocket?(): Promise<void> {
    throw new Error('WebSocket not supported by custom backend');
  }

  disconnectWebSocket?(): void {
    throw new Error('WebSocket not supported by custom backend');
  }

  subscribeToWebSocket?(eventType: string, callback: (data: any) => void): void {
    throw new Error('WebSocket not supported by custom backend');
  }

  unsubscribeFromWebSocket?(eventType: string, callback: (data: any) => void): void {
    throw new Error('WebSocket not supported by custom backend');
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
      cmcd: false,
      webhooks: false,
      storageAllocation: false,
      flowCollections: false,
      advancedSearch: false,
      asyncOperations: false,
      healthMonitoring: false,
      hlsStreaming: false,
      realTimeMarkers: false,
      webSocketUpdates: false,
    };
    return featureMap[feature] || false;
  }

  getSupportedFeatures(): string[] {
    return []; // Custom backend has minimal features
  }

  getUnsupportedFeatures(): string[] {
    return [
      'softDelete',
      'cmcd',
      'webhooks',
      'storageAllocation',
      'flowCollections',
      'advancedSearch',
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
    return false;
  }

  supportsWebhooks(): boolean {
    return false;
  }

  supportsStorageAllocation(): boolean {
    return false;
  }

  supportsFlowCollections(): boolean {
    return false;
  }

  supportsAdvancedSearch(): boolean {
    return false;
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
    console.error('Custom API Error:', fullMessage, error);
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

  private async customGet<T>(endpoint: string, options: BBCApiOptions = {}): Promise<BBCApiResponse<T>> {
    const queryParams = new URLSearchParams();
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.page) queryParams.append('page', options.page);
    
    const url = `${this.baseUrl}${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Custom API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      data: data.data || data,
      pagination: {},
      links: []
    };
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
