/**
 * API Service Factory
 * 
 * Factory pattern implementation for creating appropriate API client instances
 * based on backend type and configuration. This enables dynamic backend switching
 * and ensures consistent API client creation across the application.
 */

import { IApiClient, IApiClientFactory, BackendType, ApiClientOptions } from './interfaces/IApiClient';
import { BackendApiConfig } from '../config/apiConfig';

/**
 * API Service Factory Implementation
 */
export class ApiServiceFactory implements IApiClientFactory {
  private static instance: ApiServiceFactory;
  private clientCache: Map<string, IApiClient> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ApiServiceFactory {
    if (!ApiServiceFactory.instance) {
      ApiServiceFactory.instance = new ApiServiceFactory();
    }
    return ApiServiceFactory.instance;
  }

  /**
   * Create an API client for the specified backend type
   */
  async createClient(backendType: BackendType, config: BackendApiConfig): Promise<IApiClient> {
    const cacheKey = `${backendType}-${config.id}`;
    
    // Check if client is already cached
    if (this.clientCache.has(cacheKey)) {
      const cachedClient = this.clientCache.get(cacheKey)!;
      // Test connection to ensure client is still valid
      try {
        const isConnected = await cachedClient.testConnection();
        if (isConnected) {
          return cachedClient;
        }
      } catch (error) {
        console.warn('Cached client connection test failed, creating new client:', error);
      }
      // Remove invalid cached client
      this.clientCache.delete(cacheKey);
    }

    let client: IApiClient;

    try {
      switch (backendType) {
        case 'vast-tams':
          client = await this.createVastTamsClient(config);
          break;
        case 'bbc-tams':
          client = await this.createBbcTamsClient(config);
          break;
        case 'ibc-thiago':
          client = await this.createIbcThiagoClient(config);
          break;
        case 'custom':
          client = await this.createCustomClient(config);
          break;
        default:
          throw new Error(`Unsupported backend type: ${backendType}`);
      }

      // Initialize the client
      await client.initialize();

      // Test connection
      const isConnected = await client.testConnection();
      if (!isConnected) {
        throw new Error(`Failed to connect to ${backendType} backend`);
      }

      // Cache the client
      this.clientCache.set(cacheKey, client);

      console.log(`Successfully created and connected to ${backendType} client`);
      return client;

    } catch (error) {
      console.error(`Failed to create ${backendType} client:`, error);
      throw error;
    }
  }

  /**
   * Create VAST TAMS API client
   */
  private async createVastTamsClient(config: BackendApiConfig): Promise<IApiClient> {
    const { VastTamsApiClient } = await import('./clients/VastTamsApiClient');
    return new VastTamsApiClient(config);
  }

  /**
   * Create BBC TAMS API client
   */
  private async createBbcTamsClient(config: BackendApiConfig): Promise<IApiClient> {
    const { BbcTamsApiClient } = await import('./clients/BbcTamsApiClient');
    return new BbcTamsApiClient(config);
  }

  /**
   * Create IBC Thiago API client
   */
  private async createIbcThiagoClient(config: BackendApiConfig): Promise<IApiClient> {
    const { IbcThiagoApiClient } = await import('./clients/IbcThiagoApiClient');
    return new IbcThiagoApiClient(config);
  }

  /**
   * Create Custom API client
   */
  private async createCustomClient(config: BackendApiConfig): Promise<IApiClient> {
    const { CustomApiClient } = await import('./clients/CustomApiClient');
    return new CustomApiClient(config);
  }

  /**
   * Get available backend types
   */
  getAvailableBackendTypes(): string[] {
    return ['vast-tams', 'bbc-tams', 'ibc-thiago', 'custom'];
  }

  /**
   * Validate backend configuration
   */
  validateConfig(backendType: BackendType, config: BackendApiConfig): boolean {
    try {
      // Basic validation
      if (!config.id || !config.name || !config.baseUrl || !config.type) {
        return false;
      }

      // Type-specific validation
      switch (backendType) {
        case 'vast-tams':
          return this.validateVastTamsConfig(config);
        case 'bbc-tams':
          return this.validateBbcTamsConfig(config);
        case 'ibc-thiago':
          return this.validateIbcThiagoConfig(config);
        case 'custom':
          return this.validateCustomConfig(config);
        default:
          return false;
      }
    } catch (error) {
      console.error('Configuration validation error:', error);
      return false;
    }
  }

  /**
   * Validate VAST TAMS configuration
   */
  private validateVastTamsConfig(config: BackendApiConfig): boolean {
    // VAST TAMS should have all advanced features
    return config.features.supportsSoftDelete &&
           config.features.supportsCMCD &&
           config.features.supportsWebhooks &&
           config.features.supportsStorageAllocation;
  }

  /**
   * Validate BBC TAMS configuration
   */
  private validateBbcTamsConfig(config: BackendApiConfig): boolean {
    // BBC TAMS should have core features but not VAST extensions
    return config.features.supportsCMCD &&
           config.features.supportsWebhooks &&
           !config.features.supportsSoftDelete &&
           !config.features.supportsStorageAllocation;
  }

  /**
   * Validate IBC Thiago configuration
   */
  private validateIbcThiagoConfig(config: BackendApiConfig): boolean {
    // IBC Thiago should have HLS streaming and real-time features
    return config.features.supportsWebhooks &&
           config.features.supportsStorageAllocation &&
           config.features.supportsHealthMonitoring;
  }

  /**
   * Validate Custom configuration
   */
  private validateCustomConfig(config: BackendApiConfig): boolean {
    // Custom backends have minimal requirements
    return !!(config.endpoints.sources && config.endpoints.flows);
  }

  /**
   * Get default configuration for backend type
   */
  getDefaultConfig(backendType: BackendType): Partial<BackendApiConfig> {
    switch (backendType) {
      case 'vast-tams':
        return {
          type: 'vast-tams',
          features: {
            supportsSoftDelete: true,
            supportsCMCD: true,
            supportsWebhooks: true,
            supportsStorageAllocation: true,
            supportsFlowCollections: true,
            supportsAdvancedSearch: true,
            supportsAsyncOperations: true,
            supportsHealthMonitoring: true,
          },
          endpoints: {
            sources: '/sources',
            flows: '/flows',
            segments: '/flows/{flow_id}/segments',
            objects: '/objects',
            analytics: '/analytics',
            webhooks: '/service/webhooks',
            health: '/health',
            metrics: '/metrics',
            storage: '/flows/{flow_id}/storage',
            flowDeleteRequests: '/flow-delete-requests',
          },
        };
      case 'bbc-tams':
        return {
          type: 'bbc-tams',
          features: {
            supportsSoftDelete: false,
            supportsCMCD: true,
            supportsWebhooks: true,
            supportsStorageAllocation: false,
            supportsFlowCollections: false,
            supportsAdvancedSearch: true,
            supportsAsyncOperations: false,
            supportsHealthMonitoring: false,
          },
          endpoints: {
            sources: '/sources',
            flows: '/flows',
            segments: '/flows/{flow_id}/segments',
            objects: '/objects',
            analytics: '/analytics',
            webhooks: '/webhooks',
            health: '/health',
            metrics: '/metrics',
            storage: '/flows/{flow_id}/storage',
            flowDeleteRequests: '/flow-delete-requests',
          },
        };
      case 'ibc-thiago':
        return {
          type: 'bbc-tams',
          features: {
            supportsSoftDelete: false,
            supportsCMCD: false,
            supportsWebhooks: true,
            supportsStorageAllocation: true,
            supportsFlowCollections: false,
            supportsAdvancedSearch: true,
            supportsAsyncOperations: false,
            supportsHealthMonitoring: true,
          },
          endpoints: {
            sources: '/sources',
            flows: '/flows',
            segments: '/flows/{flow_id}/segments',
            objects: '/objects',
            analytics: '/analytics',
            webhooks: '/websocket',
            health: '/health',
            metrics: '/metrics',
            storage: '/flows/{flow_id}/storage',
            flowDeleteRequests: '/flow-delete-requests',
          },
        };
      case 'custom':
        return {
          type: 'custom',
          features: {
            supportsSoftDelete: false,
            supportsCMCD: false,
            supportsWebhooks: false,
            supportsStorageAllocation: false,
            supportsFlowCollections: false,
            supportsAdvancedSearch: false,
            supportsAsyncOperations: false,
            supportsHealthMonitoring: false,
          },
          endpoints: {
            sources: '/api/sources',
            flows: '/api/flows',
            segments: '/api/segments',
            objects: '/api/objects',
            analytics: '/api/analytics',
            webhooks: '/api/webhooks',
            health: '/api/health',
            metrics: '/api/metrics',
            storage: '/api/storage',
            flowDeleteRequests: '/api/delete-requests',
          },
        };
      default:
        throw new Error(`Unknown backend type: ${backendType}`);
    }
  }

  /**
   * Clear client cache
   */
  clearCache(): void {
    this.clientCache.clear();
  }

  /**
   * Remove specific client from cache
   */
  removeFromCache(backendType: BackendType, configId: string): void {
    const cacheKey = `${backendType}-${configId}`;
    this.clientCache.delete(cacheKey);
  }

  /**
   * Get cached client
   */
  getCachedClient(backendType: BackendType, configId: string): IApiClient | undefined {
    const cacheKey = `${backendType}-${configId}`;
    return this.clientCache.get(cacheKey);
  }

  /**
   * Get all cached clients
   */
  getAllCachedClients(): Map<string, IApiClient> {
    return new Map(this.clientCache);
  }
}

/**
 * Singleton factory instance
 */
export const apiServiceFactory = ApiServiceFactory.getInstance();

/**
 * Convenience function to create API client
 */
export async function createApiClient(backendType: BackendType, config: BackendApiConfig): Promise<IApiClient> {
  return apiServiceFactory.createClient(backendType, config);
}

/**
 * Convenience function to get available backend types
 */
export function getAvailableBackendTypes(): string[] {
  return apiServiceFactory.getAvailableBackendTypes();
}

/**
 * Convenience function to validate configuration
 */
export function validateBackendConfig(backendType: BackendType, config: BackendApiConfig): boolean {
  return apiServiceFactory.validateConfig(backendType, config);
}

/**
 * Convenience function to get default configuration
 */
export function getDefaultBackendConfig(backendType: BackendType): Partial<BackendApiConfig> {
  return apiServiceFactory.getDefaultConfig(backendType);
}
