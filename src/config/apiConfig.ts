/**
 * Local TAMS API Configuration
 * Simplified configuration for local TAMS setup
 */

export interface BackendApiConfig {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  type: 'local-tams';
  version: string;
  features: {
    supportsHLS: boolean;
    supportsWebSocket: boolean;
    supportsStorage: boolean;
  };
  endpoints: {
    sources: string;
    flows: string;
    segments: string;
    storage: string;
    health: string;
  };
}

/**
 * Local TAMS Backend Configuration
 */
export const BACKEND_APIS: Record<string, BackendApiConfig> = {
  'local-tams': {
    id: 'local-tams',
    name: 'Local TAMS',
    description: 'Local TAMS API with webcam support',
    baseUrl: '/api',
    type: 'local-tams',
    version: '1.0',
    features: {
      supportsHLS: true,
      supportsWebSocket: true,
      supportsStorage: true,
    },
    endpoints: {
      sources: '/sources',
      flows: '/flows',
      segments: '/flows/{flow_id}/segments',
      storage: '/flows/{flow_id}/storage',
      health: '/health',
    },
  },
};

/**
 * Default backend configuration
 */
export const DEFAULT_BACKEND = 'local-tams';

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
  return BACKEND_APIS[DEFAULT_BACKEND];
}