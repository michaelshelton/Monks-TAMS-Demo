/**
 * Backend Type Definitions
 * 
 * TypeScript interfaces and types for the swappable backend architecture
 */

import { BackendApiConfig } from '../config/apiConfig';

/**
 * Backend selection context state
 */
export interface BackendContextState {
  currentBackend: BackendApiConfig;
  availableBackends: BackendApiConfig[];
  isLoading: boolean;
  error: string | null;
  lastSwitchTime: Date | null;
}

/**
 * Backend context actions
 */
export interface BackendContextActions {
  switchBackend: (backendId: string) => Promise<void>;
  refreshBackend: () => Promise<void>;
  testBackendConnection: (backendId: string) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Backend context value
 */
export interface BackendContextValue extends BackendContextState, BackendContextActions {}

/**
 * Backend feature types
 */
export type BackendFeature = 
  | 'softDelete'
  | 'cmcd'
  | 'webhooks'
  | 'storageAllocation'
  | 'flowCollections'
  | 'advancedSearch'
  | 'asyncOperations'
  | 'healthMonitoring';

/**
 * Backend feature support map
 */
export type BackendFeatureSupport = Record<BackendFeature, boolean>;

/**
 * Backend health status
 */
export interface BackendHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastCheck: Date;
  error?: string;
  features: BackendFeatureSupport;
}

/**
 * Backend connection test result
 */
export interface BackendConnectionTest {
  backendId: string;
  success: boolean;
  responseTime: number;
  error?: string;
  timestamp: Date;
}

/**
 * Backend switching event
 */
export interface BackendSwitchEvent {
  from: string;
  to: string;
  timestamp: Date;
  reason: 'user' | 'error' | 'auto';
  success: boolean;
  error?: string;
}

/**
 * Backend performance metrics
 */
export interface BackendPerformanceMetrics {
  backendId: string;
  averageResponseTime: number;
  successRate: number;
  totalRequests: number;
  lastUpdated: Date;
}

/**
 * Backend configuration validation result
 */
export interface BackendValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Backend feature comparison result
 */
export interface BackendFeatureComparison {
  feature: string;
  vastTams: boolean;
  bbcTamsDemo: boolean;
  ibcThiago: boolean;
  description: string;
}

/**
 * Backend environment configuration
 */
export interface BackendEnvironmentConfig {
  defaultBackend: string;
  backendUrls: Record<string, string>;
  corsEnabled: boolean;
  debugMode: boolean;
}

/**
 * Backend API response wrapper
 */
export interface BackendApiResponse<T = any> {
  data: T;
  backend: string;
  timestamp: Date;
  responseTime: number;
  success: boolean;
  error?: string;
}

/**
 * Backend API error
 */
export interface BackendApiError {
  code: string;
  message: string;
  details?: any;
  backend: string;
  timestamp: Date;
}

/**
 * Backend switching options
 */
export interface BackendSwitchOptions {
  preserveState?: boolean;
  clearCache?: boolean;
  validateConnection?: boolean;
  showNotification?: boolean;
}

/**
 * Backend feature availability hook result
 */
export interface BackendFeatureAvailability {
  canUseSoftDelete: boolean;
  canUseCMCD: boolean;
  canUseWebhooks: boolean;
  canUseStorageAllocation: boolean;
  canUseFlowCollections: boolean;
  canUseAdvancedSearch: boolean;
  canUseAsyncOperations: boolean;
  canUseHealthMonitoring: boolean;
  supports: (feature: BackendFeature) => boolean;
  getUnsupportedFeatures: () => BackendFeature[];
  getSupportedFeatures: () => BackendFeature[];
}

/**
 * Backend status hook result
 */
export interface BackendStatus {
  isConnected: boolean;
  healthStatus: BackendHealthStatus;
  lastConnectionTest: BackendConnectionTest | null;
  connectionHistory: BackendConnectionTest[];
  switchHistory: BackendSwitchEvent[];
  performanceMetrics: BackendPerformanceMetrics | null;
  isLoading: boolean;
  error: string | null;
}
