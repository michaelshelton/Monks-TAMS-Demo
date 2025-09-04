/**
 * API Client Interface
 * 
 * Standardized interface for all backend API clients in the swappable backend architecture.
 * This interface ensures consistent behavior across different backend implementations
 * while allowing for backend-specific features and optimizations.
 */

import { BBCApiResponse, BBCApiOptions } from '../api';

/**
 * Core TAMS operations that all backends must support
 */
export interface ICoreTamsOperations {
  // Sources API
  getSources(options?: BBCApiOptions): Promise<BBCApiResponse<any>>;
  getSource(id: string): Promise<any>;
  createSource(source: any): Promise<any>;
  updateSource(id: string, source: any): Promise<any>;
  deleteSource(id: string, options?: any): Promise<any>;
  restoreSource(id: string): Promise<any>;

  // Flows API
  getFlows(options?: BBCApiOptions): Promise<BBCApiResponse<any>>;
  getFlow(id: string): Promise<any>;
  createFlow(flow: any): Promise<any>;
  updateFlow(id: string, flow: any): Promise<any>;
  deleteFlow(id: string, options?: any): Promise<any>;
  restoreFlow(id: string): Promise<any>;

  // Segments API
  getFlowSegments(flowId: string, options?: BBCApiOptions): Promise<BBCApiResponse<any>>;
  createFlowSegment(flowId: string, segment: any, file?: File): Promise<any>;
  deleteFlowSegments(flowId: string, options?: any): Promise<any>;

  // Objects API
  getObjects(options?: BBCApiOptions): Promise<BBCApiResponse<any>>;
  getObject(id: string): Promise<any>;
  createObject(object: any): Promise<any>;
  deleteObject(id: string, options?: any): Promise<any>;
}

/**
 * Advanced features that may not be supported by all backends
 */
export interface IAdvancedFeatures {
  // Analytics
  getFlowUsageAnalytics(): Promise<any>;
  getStorageUsageAnalytics(): Promise<any>;
  getTimeRangeAnalytics(): Promise<any>;

  // Webhooks
  getWebhooks(options?: BBCApiOptions): Promise<BBCApiResponse<any>>;
  createWebhook(webhookData: any): Promise<any>;
  updateWebhook(webhookId: string, webhookData: any): Promise<any>;
  deleteWebhook(webhookId: string): Promise<void>;
  testWebhook(webhookId: string): Promise<any>;
  getWebhookHistory(webhookId: string): Promise<any>;
  getWebhookStats(webhookId: string): Promise<any>;
  getWebhookEventTypes(): Promise<string[]>;

  // Flow Management
  getFlowTags(flowId: string): Promise<Record<string, string>>;
  setFlowTag(flowId: string, tagName: string, tagValue: string): Promise<any>;
  deleteFlowTag(flowId: string, tagName: string): Promise<any>;
  getFlowCollection(flowId: string): Promise<any>;
  setFlowCollection(flowId: string, collectionId: string): Promise<any>;
  removeFlowFromCollection(flowId: string): Promise<any>;
  getFlowReadOnly(flowId: string): Promise<{ read_only: boolean }>;
  setFlowReadOnly(flowId: string, readOnly: boolean): Promise<any>;
  getFlowDescription(flowId: string): Promise<{ description: string | null }>;
  setFlowDescription(flowId: string, description: string): Promise<any>;
  getFlowLabel(flowId: string): Promise<{ label: string | null }>;
  setFlowLabel(flowId: string, label: string): Promise<any>;

  // Field Operations
  getFieldValue<T = any>(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    options?: BBCApiOptions
  ): Promise<T>;
  updateFieldValue<T = any>(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    value: T,
    options?: BBCApiOptions
  ): Promise<BBCApiResponse<T>>;
  deleteField(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    options?: BBCApiOptions
  ): Promise<BBCApiResponse<void>>;
  getFieldMetadata(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    options?: BBCApiOptions
  ): Promise<BBCApiResponse<any>>;
  getEntityFields(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    options?: BBCApiOptions
  ): Promise<string[]>;

  // Storage Management
  getStorage(flowId: string): Promise<any>;

  // Health and Monitoring
  getHealth(): Promise<any>;
  getMetrics(): Promise<any>;
  getService(): Promise<any>;
}

/**
 * Backend-specific features that are unique to certain implementations
 */
export interface IBackendSpecificFeatures {
  // IBC Thiago specific features
  getHLSManifest?(flowId: string): Promise<any>;
  createMarker?(markerData: any): Promise<any>;
  updateMarker?(markerId: string, updates: any): Promise<any>;
  deleteMarker?(markerId: string): Promise<void>;
  connectWebSocket?(): Promise<void>;
  disconnectWebSocket?(): void;
  subscribeToWebSocket?(eventType: string, callback: (data: any) => void): void;
  unsubscribeFromWebSocket?(eventType: string, callback: (data: any) => void): void;
  isWebSocketConnected?(): boolean;

  // Utility methods for IBC Thiago
  extractMarkersFromSource?(source: any): any[];
  extractVideoFlowsFromSource?(source: any): any[];
  isMarkerFlow?(flow: any): boolean;
  getMarkerColor?(marker: any): string;
  getMarkerDisplayType?(marker: any): string;
  isMarkerEditable?(marker: any): boolean;
}

/**
 * Feature detection and capability checking
 */
export interface IFeatureDetection {
  /**
   * Check if the backend supports a specific feature
   */
  supportsFeature(feature: string): boolean;

  /**
   * Get all supported features
   */
  getSupportedFeatures(): string[];

  /**
   * Get all unsupported features
   */
  getUnsupportedFeatures(): string[];

  /**
   * Check if the backend supports soft delete operations
   */
  supportsSoftDelete(): boolean;

  /**
   * Check if the backend supports CMCD analytics
   */
  supportsCMCD(): boolean;

  /**
   * Check if the backend supports webhooks
   */
  supportsWebhooks(): boolean;

  /**
   * Check if the backend supports storage allocation
   */
  supportsStorageAllocation(): boolean;

  /**
   * Check if the backend supports flow collections
   */
  supportsFlowCollections(): boolean;

  /**
   * Check if the backend supports advanced search
   */
  supportsAdvancedSearch(): boolean;

  /**
   * Check if the backend supports async operations
   */
  supportsAsyncOperations(): boolean;

  /**
   * Check if the backend supports health monitoring
   */
  supportsHealthMonitoring(): boolean;
}

/**
 * Backend configuration and metadata
 */
export interface IBackendMetadata {
  /**
   * Get the backend ID
   */
  getBackendId(): string;

  /**
   * Get the backend name
   */
  getBackendName(): string;

  /**
   * Get the backend type
   */
  getBackendType(): string;

  /**
   * Get the backend version
   */
  getBackendVersion(): string;

  /**
   * Get the base URL
   */
  getBaseUrl(): string;

  /**
   * Get the backend description
   */
  getDescription(): string;
}

/**
 * Error handling and validation
 */
export interface IErrorHandling {
  /**
   * Handle API errors consistently
   */
  handleError(error: any, context?: string): Promise<never>;

  /**
   * Validate API responses
   */
  validateResponse(response: any, expectedType?: string): boolean;

  /**
   * Get error message from API response
   */
  getErrorMessage(error: any): string;
}

/**
 * Main API Client Interface
 * 
 * This interface combines all the above interfaces to provide a complete
 * API client contract that all backend implementations must follow.
 */
export interface IApiClient 
  extends ICoreTamsOperations, 
          IAdvancedFeatures, 
          IBackendSpecificFeatures, 
          IFeatureDetection, 
          IBackendMetadata, 
          IErrorHandling {
  
  /**
   * Initialize the API client
   */
  initialize(): Promise<void>;

  /**
   * Set the backend configuration
   */
  setBackendConfig(config: any): void;

  /**
   * Get the current backend configuration
   */
  getBackendConfig(): any;

  /**
   * Test connection to the backend
   */
  testConnection(): Promise<boolean>;

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    lastCheck: Date;
    responseTime?: number;
    error?: string;
  };
}

/**
 * API Client Factory Interface
 */
export interface IApiClientFactory {
  /**
   * Create an API client for the specified backend type
   */
  createClient(backendType: string, config: any): Promise<IApiClient>;

  /**
   * Get available backend types
   */
  getAvailableBackendTypes(): string[];

  /**
   * Validate backend configuration
   */
  validateConfig(backendType: string, config: any): boolean;

  /**
   * Get default configuration for backend type
   */
  getDefaultConfig(backendType: string): any;
}

/**
 * Feature types for type safety
 */
export type BackendFeature = 
  | 'softDelete'
  | 'cmcd'
  | 'webhooks'
  | 'storageAllocation'
  | 'flowCollections'
  | 'advancedSearch'
  | 'asyncOperations'
  | 'healthMonitoring'
  | 'hlsStreaming'
  | 'realTimeMarkers'
  | 'webSocketUpdates';

/**
 * Backend types for type safety
 */
export type BackendType = 'vast-tams' | 'bbc-tams' | 'custom' | 'ibc-thiago';

/**
 * API Client creation options
 */
export interface ApiClientOptions {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  debug?: boolean;
  features?: Record<string, boolean>;
}
