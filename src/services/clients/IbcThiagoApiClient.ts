/**
 * IBC Thiago API Client
 * 
 * Specialized API client for the IBC Thiago BBC TAMS v3 demo backend.
 * Implements the IApiClient interface with IBC Thiago specific features
 * including HLS streaming, real-time markers, and WebSocket connections.
 */

import { IApiClient, BackendFeature, ApiClientOptions } from '../interfaces/IApiClient';
import { BackendApiConfig } from '../../config/apiConfig';
import { BBCApiResponse, BBCApiOptions } from '../api';
import { 
  getIBCThiagoSources,
  getIBCThiagoSource,
  getIBCThiagoFlows,
  getIBCThiagoFlow,
  getIBCThiagoFlowSegments,
  getIBCThiagoHLSManifest,
  createIBCThiagoMarker,
  updateIBCThiagoMarker,
  deleteIBCThiagoMarker,
  getIBCThiagoHealth,
  getIBCThiagoStorage,
  ibcThiagoWebSocket,
  extractMarkersFromSource,
  extractVideoFlowsFromSource,
  isMarkerFlow,
  getMarkerColor,
  getMarkerDisplayType,
  isMarkerEditable,
  type IBCThiagoSource,
  type IBCThiagoFlow,
  type IBCThiagoSegment,
  type IBCThiagoMarker
} from '../ibcThiagoApi';

export class IbcThiagoApiClient implements IApiClient {
  private config: BackendApiConfig;
  private options: ApiClientOptions;
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
  }

  // ============================================================================
  // INITIALIZATION AND CONFIGURATION
  // ============================================================================

  async initialize(): Promise<void> {
    try {
      // Test initial connection
      await this.testConnection();
      console.log('IBC Thiago API client initialized successfully');
    } catch (error) {
      console.warn('IBC Thiago API client initialization warning:', error);
      // Don't throw error for IBC Thiago as it might not be running
    }
  }

  setBackendConfig(config: BackendApiConfig): void {
    this.config = config;
  }

  getBackendConfig(): BackendApiConfig {
    return this.config;
  }

  async testConnection(): Promise<boolean> {
    try {
      const startTime = Date.now();
      const health = await getIBCThiagoHealth();
      const responseTime = Date.now() - startTime;

      this.connectionStatus = {
        connected: true,
        lastCheck: new Date(),
        responseTime,
      };

      return true;
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
    return getIBCThiagoSources(options);
  }

  async getSource(id: string): Promise<any> {
    return getIBCThiagoSource(id);
  }

  async createSource(source: any): Promise<any> {
    throw new Error('Source creation not supported by IBC Thiago backend');
  }

  async updateSource(id: string, source: any): Promise<any> {
    throw new Error('Source updates not supported by IBC Thiago backend');
  }

  async deleteSource(id: string, options?: any): Promise<any> {
    throw new Error('Source deletion not supported by IBC Thiago backend');
  }

  async restoreSource(id: string): Promise<any> {
    throw new Error('Source restoration not supported by IBC Thiago backend');
  }

  async getFlows(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    return getIBCThiagoFlows(options);
  }

  async getFlow(id: string): Promise<any> {
    return getIBCThiagoFlow(id);
  }

  async createFlow(flow: any): Promise<any> {
    throw new Error('Flow creation not supported by IBC Thiago backend');
  }

  async updateFlow(id: string, flow: any): Promise<any> {
    throw new Error('Flow updates not supported by IBC Thiago backend');
  }

  async deleteFlow(id: string, options?: any): Promise<any> {
    throw new Error('Flow deletion not supported by IBC Thiago backend');
  }

  async restoreFlow(id: string): Promise<any> {
    throw new Error('Flow restoration not supported by IBC Thiago backend');
  }

  async getFlowSegments(flowId: string, options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    return getIBCThiagoFlowSegments(flowId, options);
  }

  async createFlowSegment(flowId: string, segment: any, file?: File): Promise<any> {
    throw new Error('Segment creation not supported by IBC Thiago backend');
  }

  async deleteFlowSegments(flowId: string, options?: any): Promise<any> {
    throw new Error('Segment deletion not supported by IBC Thiago backend');
  }

  async cleanupFlow(id: string, hours: number = 24): Promise<any> {
    throw new Error('cleanupFlow is not supported by IBC Thiago backend');
  }

  async updateFlowSegment(flowId: string, segmentId: string, updates: any): Promise<any> {
    throw new Error('updateFlowSegment is not supported by IBC Thiago backend');
  }

  async getObjects(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    throw new Error('Objects API not supported by IBC Thiago backend');
  }

  async getObject(id: string): Promise<any> {
    throw new Error('Objects API not supported by IBC Thiago backend');
  }

  async createObject(object: any): Promise<any> {
    throw new Error('Objects API not supported by IBC Thiago backend');
  }

  async deleteObject(id: string, options?: any): Promise<any> {
    throw new Error('Objects API not supported by IBC Thiago backend');
  }

  // ============================================================================
  // ADVANCED FEATURES
  // ============================================================================

  async getFlowUsageAnalytics(): Promise<any> {
    console.warn('Analytics not supported by IBC Thiago backend, returning empty analytics');
    return {
      flows: [],
      totalFlows: 0,
      activeFlows: 0,
      inactiveFlows: 0,
      usage: {
        total: 0,
        active: 0,
        inactive: 0
      }
    };
  }

  async getStorageUsageAnalytics(): Promise<any> {
    console.warn('Analytics not supported by IBC Thiago backend, returning empty storage analytics');
    return {
      totalStorage: 0,
      usedStorage: 0,
      availableStorage: 0,
      flows: [],
      usage: {
        total: 0,
        used: 0,
        available: 0
      }
    };
  }

  async getTimeRangeAnalytics(): Promise<any> {
    console.warn('Analytics not supported by IBC Thiago backend, returning empty time range analytics');
    return {
      timeRanges: [],
      totalSegments: 0,
      totalDuration: 0,
      averageDuration: 0,
      usage: {
        total: 0,
        average: 0
      }
    };
  }

  async getWebhooks(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    throw new Error('Webhooks API not supported by IBC Thiago backend');
  }

  async createWebhook(webhookData: any): Promise<any> {
    throw new Error('Webhooks API not supported by IBC Thiago backend');
  }

  async updateWebhook(webhookId: string, webhookData: any): Promise<any> {
    throw new Error('Webhooks API not supported by IBC Thiago backend');
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    throw new Error('Webhooks API not supported by IBC Thiago backend');
  }

  async testWebhook(webhookId: string): Promise<any> {
    throw new Error('Webhooks API not supported by IBC Thiago backend');
  }

  async getWebhookHistory(webhookId: string): Promise<any> {
    throw new Error('Webhooks API not supported by IBC Thiago backend');
  }

  async getWebhookStats(webhookId: string): Promise<any> {
    throw new Error('Webhooks API not supported by IBC Thiago backend');
  }

  async getWebhookEventTypes(): Promise<string[]> {
    return [];
  }

  // Flow Management - Not supported by IBC Thiago
  async getFlowTags(flowId: string): Promise<Record<string, string>> {
    console.warn('Flow tags not supported by IBC Thiago backend, returning empty tags');
    return {};
  }

  async setFlowTag(flowId: string, tagName: string, tagValue: string): Promise<any> {
    console.warn('Flow tags not supported by IBC Thiago backend, operation ignored');
    return { success: false, message: 'Flow tags not supported by IBC Thiago backend' };
  }

  async deleteFlowTag(flowId: string, tagName: string): Promise<any> {
    console.warn('Flow tags not supported by IBC Thiago backend, operation ignored');
    return { success: false, message: 'Flow tags not supported by IBC Thiago backend' };
  }

  async getFlowCollection(flowId: string): Promise<any> {
    console.warn('Flow collections not supported by IBC Thiago backend, returning null');
    return null;
  }

  async setFlowCollection(flowId: string, collectionId: string): Promise<any> {
    console.warn('Flow collections not supported by IBC Thiago backend, operation ignored');
    return { success: false, message: 'Flow collections not supported by IBC Thiago backend' };
  }

  async removeFlowFromCollection(flowId: string): Promise<any> {
    console.warn('Flow collections not supported by IBC Thiago backend, operation ignored');
    return { success: false, message: 'Flow collections not supported by IBC Thiago backend' };
  }

  async getFlowReadOnly(flowId: string): Promise<{ read_only: boolean }> {
    console.warn('Flow read-only status not supported by IBC Thiago backend, returning false');
    return { read_only: false };
  }

  async setFlowReadOnly(flowId: string, readOnly: boolean): Promise<any> {
    console.warn('Flow read-only status not supported by IBC Thiago backend, operation ignored');
    return { success: false, message: 'Flow read-only status not supported by IBC Thiago backend' };
  }

  async getFlowDescription(flowId: string): Promise<{ description: string | null }> {
    console.warn('Flow description not supported by IBC Thiago backend, returning null');
    return { description: null };
  }

  async setFlowDescription(flowId: string, description: string): Promise<any> {
    console.warn('Flow description not supported by IBC Thiago backend, operation ignored');
    return { success: false, message: 'Flow description not supported by IBC Thiago backend' };
  }

  async getFlowLabel(flowId: string): Promise<{ label: string | null }> {
    console.warn('Flow label not supported by IBC Thiago backend, returning null');
    return { label: null };
  }

  async setFlowLabel(flowId: string, label: string): Promise<any> {
    console.warn('Flow label not supported by IBC Thiago backend, operation ignored');
    return { success: false, message: 'Flow label not supported by IBC Thiago backend' };
  }

  // Field Operations - Not supported by IBC Thiago
  async getFieldValue<T = any>(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    options?: BBCApiOptions
  ): Promise<T> {
    throw new Error('Field operations not supported by IBC Thiago backend');
  }

  async updateFieldValue<T = any>(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    value: T,
    options?: BBCApiOptions
  ): Promise<BBCApiResponse<T>> {
    throw new Error('Field operations not supported by IBC Thiago backend');
  }

  async deleteField(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    options?: BBCApiOptions
  ): Promise<BBCApiResponse<void>> {
    throw new Error('Field operations not supported by IBC Thiago backend');
  }

  async getFieldMetadata(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    options?: BBCApiOptions
  ): Promise<BBCApiResponse<any>> {
    throw new Error('Field operations not supported by IBC Thiago backend');
  }

  async getEntityFields(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    options?: BBCApiOptions
  ): Promise<string[]> {
    return ['id', 'label', 'description', 'tags', 'created', 'updated'];
  }

  async getStorage(flowId: string): Promise<any> {
    return getIBCThiagoStorage(flowId);
  }

  async getHealth(): Promise<any> {
    return getIBCThiagoHealth();
  }

  async getMetrics(): Promise<any> {
    throw new Error('Metrics not supported by IBC Thiago backend');
  }

  async getService(): Promise<any> {
    throw new Error('Service info not supported by IBC Thiago backend');
  }

  // ============================================================================
  // IBC THIAGO SPECIFIC FEATURES
  // ============================================================================

  async getHLSManifest(flowId: string): Promise<any> {
    return getIBCThiagoHLSManifest(flowId);
  }

  async createMarker(markerData: any): Promise<any> {
    return createIBCThiagoMarker(markerData);
  }

  async updateMarker(markerId: string, updates: any): Promise<any> {
    return updateIBCThiagoMarker(markerId, updates);
  }

  async deleteMarker(markerId: string): Promise<void> {
    return deleteIBCThiagoMarker(markerId);
  }

  async connectWebSocket(): Promise<void> {
    return ibcThiagoWebSocket.connect();
  }

  disconnectWebSocket(): void {
    ibcThiagoWebSocket.disconnect();
  }

  subscribeToWebSocket(eventType: string, callback: (data: any) => void): void {
    ibcThiagoWebSocket.subscribe(eventType, callback);
  }

  unsubscribeFromWebSocket(eventType: string, callback: (data: any) => void): void {
    ibcThiagoWebSocket.unsubscribe(eventType, callback);
  }

  isWebSocketConnected(): boolean {
    return ibcThiagoWebSocket.isConnected();
  }

  extractMarkersFromSource(source: any): any[] {
    return extractMarkersFromSource(source);
  }

  extractVideoFlowsFromSource(source: any): any[] {
    return extractVideoFlowsFromSource(source);
  }

  isMarkerFlow(flow: any): boolean {
    return isMarkerFlow(flow);
  }

  getMarkerColor(marker: any): string {
    return getMarkerColor(marker);
  }

  getMarkerDisplayType(marker: any): string {
    return getMarkerDisplayType(marker);
  }

  isMarkerEditable(marker: any): boolean {
    return isMarkerEditable(marker);
  }

  // ============================================================================
  // FEATURE DETECTION
  // ============================================================================

  supportsFeature(feature: string): boolean {
    const featureMap: Record<string, boolean> = {
      softDelete: false,
      cmcd: false,
      webhooks: true, // WebSocket support
      storageAllocation: true,
      flowCollections: false,
      advancedSearch: true,
      asyncOperations: false,
      healthMonitoring: true,
      hlsStreaming: true,
      realTimeMarkers: true,
      webSocketUpdates: true,
    };
    return featureMap[feature] || false;
  }

  getSupportedFeatures(): string[] {
    return [
      'webhooks',
      'storageAllocation',
      'advancedSearch',
      'healthMonitoring',
      'hlsStreaming',
      'realTimeMarkers',
      'webSocketUpdates',
    ];
  }

  getUnsupportedFeatures(): string[] {
    return [
      'softDelete',
      'cmcd',
      'flowCollections',
      'asyncOperations',
    ];
  }

  supportsSoftDelete(): boolean {
    return false;
  }

  supportsCMCD(): boolean {
    return false;
  }

  supportsWebhooks(): boolean {
    return true; // WebSocket support
  }

  supportsStorageAllocation(): boolean {
    return true;
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
    return true;
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
    console.error('IBC Thiago API Error:', fullMessage, error);
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
}
