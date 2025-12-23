/**
 * VAST TAMS API Client Implementation
 * 
 * Implements the IApiClient interface for VAST TAMS backend
 * Provides full BBC TAMS v6.0 compliance with VAST TAMS extensions
 */

import { IApiClient, BackendType, BackendFeature } from '../interfaces/IApiClient';
import { BBCApiResponse, BBCApiOptions } from '../api';
import { BackendApiConfig } from '../../config/apiConfig';
import { VastTamsApiClient as VastTamsService, createVastTamsApiClient } from '../vastTamsApi';

export class VastTamsApiClient implements IApiClient {
  private service: VastTamsService;
  private config: BackendApiConfig;
  private connectionStatus = {
    connected: false,
    lastCheck: new Date(),
    responseTime: undefined as number | undefined,
    error: undefined as string | undefined
  };

  constructor(config: BackendApiConfig) {
    this.config = config;
    this.service = createVastTamsApiClient(config);
  }

  // Initialization
  async initialize(): Promise<void> {
    try {
      // Test connection during initialization
      await this.testConnection();
      console.log('VAST TAMS API client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize VAST TAMS API client:', error);
      throw error;
    }
  }

  setBackendConfig(config: BackendApiConfig): void {
    this.config = config;
    this.service = createVastTamsApiClient(config);
  }

  getBackendConfig(): BackendApiConfig {
    return this.config;
  }

  async testConnection(): Promise<boolean> {
    const startTime = Date.now();
    try {
      const health = await this.service.getHealth();
      const responseTime = Date.now() - startTime;
      
      // 503 responses are valid for degraded service - still consider it connected
      // Accept 'degraded', 'healthy', 'ok', or any truthy status as connected
      const status = health?.status?.toLowerCase() || '';
      const isConnected = status === 'degraded' || status === 'healthy' || status === 'ok' || status === 'up';
      
      this.connectionStatus = {
        connected: isConnected,
        lastCheck: new Date(),
        responseTime,
        error: status === 'degraded' ? 'Service is degraded' : undefined
      };
      
      return isConnected;
    } catch (error) {
      // If health check fails completely, mark as not connected
      this.connectionStatus = {
        connected: false,
        lastCheck: new Date(),
        responseTime: undefined,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      return false;
    }
  }

  getConnectionStatus() {
    return {
      connected: this.connectionStatus.connected,
      lastCheck: this.connectionStatus.lastCheck,
      ...(this.connectionStatus.responseTime !== undefined ? { responseTime: this.connectionStatus.responseTime } : {}),
      ...(this.connectionStatus.error ? { error: this.connectionStatus.error } : {})
    };
  }

  // Backend Metadata
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

  // Feature Detection
  supportsFeature(feature: string): boolean {
    const featureMap: Record<string, keyof BackendApiConfig['features']> = {
      'softDelete': 'supportsSoftDelete',
      'cmcd': 'supportsCMCD',
      'webhooks': 'supportsWebhooks',
      'storageAllocation': 'supportsStorageAllocation',
      'flowCollections': 'supportsFlowCollections',
      'advancedSearch': 'supportsAdvancedSearch',
      'asyncOperations': 'supportsAsyncOperations',
      'healthMonitoring': 'supportsHealthMonitoring'
    };

    const configKey = featureMap[feature];
    return configKey ? this.config.features[configKey] : false;
  }

  getSupportedFeatures(): string[] {
    const features: string[] = [];
    if (this.config.features.supportsSoftDelete) features.push('softDelete');
    if (this.config.features.supportsCMCD) features.push('cmcd');
    if (this.config.features.supportsWebhooks) features.push('webhooks');
    if (this.config.features.supportsStorageAllocation) features.push('storageAllocation');
    if (this.config.features.supportsFlowCollections) features.push('flowCollections');
    if (this.config.features.supportsAdvancedSearch) features.push('advancedSearch');
    if (this.config.features.supportsAsyncOperations) features.push('asyncOperations');
    if (this.config.features.supportsHealthMonitoring) features.push('healthMonitoring');
    return features;
  }

  getUnsupportedFeatures(): string[] {
    const allFeatures = ['softDelete', 'cmcd', 'webhooks', 'storageAllocation', 'flowCollections', 'advancedSearch', 'asyncOperations', 'healthMonitoring'];
    const supported = this.getSupportedFeatures();
    return allFeatures.filter(feature => !supported.includes(feature));
  }

  supportsSoftDelete(): boolean {
    return this.config.features.supportsSoftDelete;
  }

  supportsCMCD(): boolean {
    return this.config.features.supportsCMCD;
  }

  supportsWebhooks(): boolean {
    return this.config.features.supportsWebhooks;
  }

  supportsStorageAllocation(): boolean {
    return this.config.features.supportsStorageAllocation;
  }

  supportsFlowCollections(): boolean {
    return this.config.features.supportsFlowCollections;
  }

  supportsAdvancedSearch(): boolean {
    return this.config.features.supportsAdvancedSearch;
  }

  supportsAsyncOperations(): boolean {
    return this.config.features.supportsAsyncOperations;
  }

  supportsHealthMonitoring(): boolean {
    return this.config.features.supportsHealthMonitoring;
  }

  // Error Handling
  async handleError(error: any, context?: string): Promise<never> {
    const message = this.getErrorMessage(error);
    const fullMessage = context ? `${context}: ${message}` : message;
    console.error('VAST TAMS API Error:', fullMessage, error);
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

  // Core TAMS Operations - Sources
  async getSources(options?: BBCApiOptions): Promise<BBCApiResponse<any>> {
    return this.service.getSources(options);
  }

  async getSource(id: string): Promise<any> {
    return this.service.getSource(id);
  }

  async createSource(source: any): Promise<any> {
    return this.service.createSource(source);
  }

  async updateSource(id: string, source: any): Promise<any> {
    return this.service.updateSource(id, source);
  }

  async deleteSource(id: string, options?: any): Promise<any> {
    return this.service.deleteSource(id, options);
  }

  async restoreSource(id: string): Promise<any> {
    return this.service.restoreSource(id);
  }

  // Core TAMS Operations - Flows
  async getFlows(options?: BBCApiOptions): Promise<BBCApiResponse<any>> {
    return this.service.getFlows(options);
  }

  async getFlow(id: string): Promise<any> {
    return this.service.getFlow(id);
  }

  async createFlow(flow: any): Promise<any> {
    return this.service.createFlow(flow);
  }

  async updateFlow(id: string, flow: any): Promise<any> {
    return this.service.updateFlow(id, flow);
  }

  async deleteFlow(id: string, options?: any): Promise<any> {
    return this.service.deleteFlow(id, options);
  }

  async restoreFlow(id: string): Promise<any> {
    return this.service.restoreFlow(id);
  }

  async cleanupFlow(id: string, hours: number = 24): Promise<any> {
    const url = `${this.config.baseUrl}/flows/${id}/cleanup?hours=${hours}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`TAMS API error: ${response.status} ${response.statusText}`);
    }

    // Backend may return 204 No Content for successful cleanup
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  // Core TAMS Operations - Segments
  async getFlowSegments(flowId: string, options?: BBCApiOptions): Promise<BBCApiResponse<any>> {
    return this.service.getFlowSegments(flowId, options);
  }

  async getFlowStats(flowId: string): Promise<any> {
    // Use the service's request method via a direct fetch call
    // The service's makeRequest is private, so we'll make the request directly
    const url = `${this.config.baseUrl}/flows/${flowId}/stats`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`TAMS API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  async createFlowSegment(flowId: string, segment: any, file?: File): Promise<any> {
    return this.service.createFlowSegment(flowId, segment, file);
  }

  async deleteFlowSegments(flowId: string, options?: any): Promise<any> {
    return this.service.deleteFlowSegments(flowId, options);
  }

  async updateFlowSegment(flowId: string, segmentId: string, updates: any): Promise<any> {
    const url = `${this.config.baseUrl}/flows/${flowId}/segments/${segmentId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`TAMS API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  // Core TAMS Operations - Objects
  async getObjects(options?: BBCApiOptions): Promise<BBCApiResponse<any>> {
    return this.service.getObjects(options);
  }

  async getObject(id: string): Promise<any> {
    return this.service.getObject(id);
  }

  async createObject(object: any): Promise<any> {
    return this.service.createObject(object);
  }

  async deleteObject(id: string, options?: any): Promise<any> {
    return this.service.deleteObject(id, options);
  }

  // Advanced Features - Analytics
  async getFlowUsageAnalytics(): Promise<any> {
    return this.service.getFlowUsageAnalytics();
  }

  async getStorageUsageAnalytics(): Promise<any> {
    return this.service.getStorageUsageAnalytics();
  }

  async getTimeRangeAnalytics(): Promise<any> {
    return this.service.getTimeRangeAnalytics();
  }

  // Advanced Features - Webhooks
  async getWebhooks(options?: BBCApiOptions): Promise<BBCApiResponse<any>> {
    return this.service.getWebhooks(options);
  }

  async createWebhook(webhookData: any): Promise<any> {
    return this.service.createWebhook(webhookData);
  }

  async updateWebhook(webhookId: string, webhookData: any): Promise<any> {
    return this.service.updateWebhook(webhookId, webhookData);
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    return this.service.deleteWebhook(webhookId);
  }

  async testWebhook(webhookId: string): Promise<any> {
    return this.service.testWebhook(webhookId);
  }

  async getWebhookHistory(webhookId: string): Promise<any> {
    return this.service.getWebhookHistory(webhookId);
  }

  async getWebhookStats(webhookId: string): Promise<any> {
    return this.service.getWebhookStats(webhookId);
  }

  async getWebhookEventTypes(): Promise<string[]> {
    return this.service.getWebhookEventTypes();
  }

  // Advanced Features - Flow Management
  async getFlowTags(flowId: string): Promise<Record<string, string>> {
    return this.service.getFlowTags(flowId);
  }

  async setFlowTag(flowId: string, tagName: string, tagValue: string): Promise<any> {
    return this.service.setFlowTag(flowId, tagName, tagValue);
  }

  async deleteFlowTag(flowId: string, tagName: string): Promise<any> {
    return this.service.deleteFlowTag(flowId, tagName);
  }

  async getFlowCollection(flowId: string): Promise<any> {
    return this.service.getFlowCollection(flowId);
  }

  async setFlowCollection(flowId: string, collectionId: string): Promise<any> {
    return this.service.setFlowCollection(flowId, collectionId);
  }

  async removeFlowFromCollection(flowId: string): Promise<any> {
    return this.service.removeFlowFromCollection(flowId);
  }

  async getFlowReadOnly(flowId: string): Promise<{ read_only: boolean }> {
    return this.service.getFlowReadOnly(flowId);
  }

  async setFlowReadOnly(flowId: string, readOnly: boolean): Promise<any> {
    return this.service.setFlowReadOnly(flowId, readOnly);
  }

  async getFlowDescription(flowId: string): Promise<{ description: string }> {
    return this.service.getFlowDescription(flowId);
  }

  async setFlowDescription(flowId: string, description: string): Promise<any> {
    return this.service.setFlowDescription(flowId, description);
  }

  async getFlowLabel(flowId: string): Promise<{ label: string }> {
    return this.service.getFlowLabel(flowId);
  }

  async setFlowLabel(flowId: string, label: string): Promise<any> {
    return this.service.setFlowLabel(flowId, label);
  }

  // Advanced Features - Field Operations
  async getFieldValue<T = any>(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    options?: BBCApiOptions
  ): Promise<T> {
    if (entityType === 'flows') {
      return this.service.getFlowField<T>(entityId, fieldKey, options);
    }
    // For sources and segments, we'd need to implement similar methods
    throw new Error(`Field operations for ${entityType} not yet implemented`);
  }

  async updateFieldValue<T = any>(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    value: T,
    options?: BBCApiOptions
  ): Promise<BBCApiResponse<T>> {
    if (entityType === 'flows') {
      const result = await this.service.updateFlowField<T>(entityId, fieldKey, value, options);
      return {
        data: [result],
        pagination: {},
        links: []
      };
    }
    // For sources and segments, we'd need to implement similar methods
    throw new Error(`Field operations for ${entityType} not yet implemented`);
  }

  async deleteField(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    options?: BBCApiOptions
  ): Promise<BBCApiResponse<void>> {
    if (entityType === 'flows') {
      await this.service.deleteFlowField(entityId, fieldKey, options);
      return {
        data: [],
        pagination: {},
        links: []
      };
    }
    // For sources and segments, we'd need to implement similar methods
    throw new Error(`Field operations for ${entityType} not yet implemented`);
  }

  async getFieldMetadata(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    options?: BBCApiOptions
  ): Promise<BBCApiResponse<any>> {
    // This would require a HEAD request implementation
    throw new Error('Field metadata retrieval not yet implemented');
  }

  async getEntityFields(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    options?: BBCApiOptions
  ): Promise<string[]> {
    // Return common BBC TAMS fields for now
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
    
    return commonFields;
  }

  // Advanced Features - Storage Management
  async getStorage(flowId: string): Promise<any> {
    return this.service.getStorageAllocation(flowId);
  }

  // Health and Monitoring
  async getHealth(): Promise<any> {
    return this.service.getHealth();
  }

  async getMetrics(): Promise<any> {
    return this.service.getMetrics();
  }

  async getService(): Promise<any> {
    return this.service.getService();
  }

  // VAST TAMS Specific Features
  async getSegmentContentUrl(flowId: string, segmentId: string): Promise<string> {
    return this.service.getSegmentContentUrl(flowId, segmentId);
  }

  async getSegmentMetadataUrl(flowId: string, segmentId: string): Promise<string> {
    return this.service.getSegmentMetadataUrl(flowId, segmentId);
  }

  async getFlowDeleteRequests(options?: BBCApiOptions): Promise<BBCApiResponse<any>> {
    return this.service.getFlowDeleteRequests(options);
  }

  async getFlowDeleteRequest(requestId: string): Promise<any> {
    return this.service.getFlowDeleteRequest(requestId);
  }

  async createFlowDeleteRequest(requestData: any): Promise<any> {
    return this.service.createFlowDeleteRequest(requestData);
  }

  async updateFlowDeleteRequest(requestId: string, updates: any): Promise<any> {
    return this.service.updateFlowDeleteRequest(requestId, updates);
  }

  async getOpenApiSpec(): Promise<any> {
    return this.service.getOpenApiSpec();
  }
}