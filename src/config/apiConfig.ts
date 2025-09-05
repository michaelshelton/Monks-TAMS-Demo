/**
 * Backend API Configuration System
 * 
 * This system allows the frontend to seamlessly switch between different backend APIs
 * while maintaining a standardized user experience. Each backend configuration defines
 * its capabilities, endpoints, and feature support.
 */

/**
 * Get backend URL with conditional proxy support
 * 
 * @param backendType - The backend type identifier
 * @param baseUrl - The base URL from environment variables
 * @returns The URL to use for API requests (with proxy if needed)
 */
function getBackendUrl(backendType: string, baseUrl: string): string {
  // Use proxy for vast-tams to avoid CORS issues
  if (backendType === 'vast-tams') {
    // In development, use main API proxy to avoid CORS issues
    if (import.meta.env.DEV) return '/api';
    // In production (Vercel), use serverless proxy handler
    return '/api/proxy';
  }

  // Direct connection for other backends (ibc-thiago-imported, etc.)
  return baseUrl;
}

export interface BackendApiConfig {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  type: 'vast-tams' | 'bbc-tams' | 'ibc-thiago' | 'custom';
  version: string;
  features: {
    supportsSoftDelete: boolean;
    supportsCMCD: boolean;
    supportsWebhooks: boolean;
    supportsStorageAllocation: boolean;
    supportsFlowCollections: boolean;
    supportsAdvancedSearch: boolean;
    supportsAsyncOperations: boolean;
    supportsHealthMonitoring: boolean;
  };
  endpoints: {
    sources: string;
    flows: string;
    segments: string;
    objects: string;
    analytics: string;
    webhooks: string;
    health: string;
    metrics: string;
    storage: string;
    flowDeleteRequests: string;
  };
  auth?: {
    type: 'none' | 'api-key' | 'bearer' | 'oauth2';
    apiKeyHeader?: string;
    tokenEndpoint?: string;
  };
  cors?: {
    enabled: boolean;
    credentials: boolean;
  };
  rateLimiting?: {
    enabled: boolean;
    requestsPerMinute: number;
  };
}

/**
 * Available Backend API Configurations
 */
export const BACKEND_APIS: Record<string, BackendApiConfig> = {
  'vast-tams': {
    id: 'vast-tams',
    name: 'VAST TAMS',
    description: 'Full-featured VAST TAMS backend with all advanced features',
    baseUrl: getBackendUrl('vast-tams', import.meta.env.VITE_BACKEND_VAST_TAMS_URL || 'http://34.216.9.25:8000'),
    type: 'vast-tams',
    version: '6.0',
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
    auth: {
      type: 'none',
    },
    cors: {
      enabled: true,
      credentials: false,
    },
    rateLimiting: {
      enabled: false,
      requestsPerMinute: 1000,
    },
  },
  'ibc-thiago': {
    id: 'ibc-thiago',
    name: 'IBC Thiago Demo',
    description: 'BBC TAMS v3 demo with HLS streaming and real-time markers',
    baseUrl: getBackendUrl('ibc-thiago', import.meta.env.VITE_BACKEND_IBC_THIAGO_URL || 'http://localhost:3000'),
    type: 'bbc-tams',
    version: '3.0',
    features: {
      supportsSoftDelete: false,
      supportsCMCD: false,
      supportsWebhooks: true, // WebSocket support for real-time updates
      supportsStorageAllocation: true, // MinIO integration
      supportsFlowCollections: false,
      supportsAdvancedSearch: true, // Basic search with tags
      supportsAsyncOperations: false,
      supportsHealthMonitoring: true, // Basic health endpoint
    },
    endpoints: {
      sources: '/sources',
      flows: '/flows',
      segments: '/flows/{flow_id}/segments',
      objects: '/objects',
      analytics: '/analytics',
      webhooks: '/websocket', // WebSocket endpoint for real-time updates
      health: '/health',
      metrics: '/metrics',
      storage: '/flows/{flow_id}/storage',
      flowDeleteRequests: '/flow-delete-requests',
    },
    auth: {
      type: 'none',
    },
    cors: {
      enabled: true,
      credentials: false,
    },
    rateLimiting: {
      enabled: false,
      requestsPerMinute: 1000,
    },
  },
  'ibc-thiago-imported': {
    id: 'ibc-thiago-imported',
    name: 'IBC Thiago with Imported Data',
    description: 'BBC TAMS v3 demo with imported MinIO/MongoDB data and HLS streaming',
    baseUrl: getBackendUrl('ibc-thiago-imported', import.meta.env.VITE_BACKEND_IBC_THIAGO_IMPORTED_URL || 'http://localhost:3002'),
    type: 'ibc-thiago',
    version: '3.0',
    features: {
      supportsSoftDelete: false,
      supportsCMCD: false,
      supportsWebhooks: true, // WebSocket support for real-time updates
      supportsStorageAllocation: true, // MinIO integration with imported data
      supportsFlowCollections: false,
      supportsAdvancedSearch: true, // Basic search with tags
      supportsAsyncOperations: false,
      supportsHealthMonitoring: true, // Basic health endpoint
    },
    endpoints: {
      sources: '/sources',
      flows: '/flows',
      segments: '/flows/{flow_id}/segments',
      objects: '/objects',
      analytics: '/analytics',
      webhooks: '/websocket', // WebSocket endpoint for real-time updates
      health: '/health',
      metrics: '/metrics',
      storage: '/flows/{flow_id}/storage',
      flowDeleteRequests: '/flow-delete-requests',
    },
    auth: {
      type: 'none',
    },
    cors: {
      enabled: true,
      credentials: false,
    },
    rateLimiting: {
      enabled: false,
      requestsPerMinute: 1000,
    },
  },
};

/**
 * Default backend configuration
 */
export const DEFAULT_BACKEND = import.meta.env.VITE_DEFAULT_BACKEND || 'vast-tams';

/**
 * Get backend configuration by ID
 */
export function getBackendConfig(id: string): BackendApiConfig | null {
  return BACKEND_APIS[id] || null;
}

/**
 * Get current backend configuration
 */
export function getCurrentBackendConfig(): BackendApiConfig {
  const storedBackend = localStorage.getItem('selectedBackend');
  const backendId = storedBackend || DEFAULT_BACKEND;
  const config = getBackendConfig(backendId);
  if (!config) {
    const defaultConfig = BACKEND_APIS[DEFAULT_BACKEND];
    if (!defaultConfig) {
      throw new Error(`Default backend configuration not found: ${DEFAULT_BACKEND}`);
    }
    return defaultConfig;
  }
  return config;
}

/**
 * Get all available backend configurations
 */
export function getAvailableBackends(): BackendApiConfig[] {
  return Object.values(BACKEND_APIS);
}

/**
 * Check if a backend supports a specific feature
 */
export function backendSupportsFeature(backendId: string, feature: keyof BackendApiConfig['features']): boolean {
  const config = getBackendConfig(backendId);
  return config?.features[feature] || false;
}

/**
 * Get backend feature summary
 */
export function getBackendFeatureSummary(backendId: string): Record<string, boolean> {
  const config = getBackendConfig(backendId);
  if (!config) return {};
  
  return config.features;
}

/**
 * Validate backend configuration
 */
export function validateBackendConfig(config: BackendApiConfig): string[] {
  const errors: string[] = [];
  
  if (!config.id) errors.push('Backend ID is required');
  if (!config.name) errors.push('Backend name is required');
  if (!config.baseUrl) errors.push('Base URL is required');
  if (!config.type) errors.push('Backend type is required');
  if (!config.version) errors.push('Version is required');
  
  // Validate endpoints
  Object.entries(config.endpoints).forEach(([key, value]) => {
    if (!value) errors.push(`Endpoint ${key} is required`);
  });
  
  return errors;
}

/**
 * Get backend comparison data
 */
export function getBackendComparison(): Array<{
  feature: string;
  vastTams: boolean;
  ibcThiago: boolean;
  ibcThiagoImported: boolean;
}> {
  const features = [
    'Soft Delete',
    'CMCD Analytics',
    'Webhooks',
    'Storage Allocation',
    'Flow Collections',
    'Advanced Search',
    'Async Operations',
    'Health Monitoring',
  ];
  
  return features.map(feature => {
    const key = feature.toLowerCase().replace(/\s+/g, '') as keyof BackendApiConfig['features'];
    const vastTams = BACKEND_APIS['vast-tams']?.features[key] || false;
    const ibcThiago = BACKEND_APIS['ibc-thiago']?.features[key] || false;
    const ibcThiagoImported = BACKEND_APIS['ibc-thiago-imported']?.features[key] || false;
    
    return {
      feature,
      vastTams,
      ibcThiago,
      ibcThiagoImported,
    };
  });
}
