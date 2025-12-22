/**
 * Backend Context
 * 
 * React Context for managing backend selection and API client throughout the application.
 * Provides backend switching functionality, feature detection, and connection testing.
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { 
  BackendContextState, 
  BackendContextValue, 
  BackendContextActions,
  BackendHealthStatus,
  BackendConnectionTest,
  BackendSwitchEvent,
  BackendPerformanceMetrics,
  BackendFeature
} from '../types/backend';
import { 
  getBackendConfig, 
  getCurrentBackendConfig, 
  getAvailableBackends,
  validateBackendConfig 
} from '../config/apiConfig';

// Action types for the reducer
type BackendAction = 
  | { type: 'SET_CURRENT_BACKEND'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_HEALTH_STATUS'; payload: BackendHealthStatus }
  | { type: 'ADD_CONNECTION_TEST'; payload: BackendConnectionTest }
  | { type: 'ADD_SWITCH_EVENT'; payload: BackendSwitchEvent }
  | { type: 'SET_PERFORMANCE_METRICS'; payload: BackendPerformanceMetrics }
  | { type: 'CLEAR_ERROR' }
  | { type: 'REFRESH_BACKENDS' };

// Initial state
const initialState: BackendContextState = {
  currentBackend: getCurrentBackendConfig(),
  availableBackends: getAvailableBackends(),
  isLoading: false,
  error: null,
  lastSwitchTime: null,
};

// Reducer function
function backendReducer(state: BackendContextState, action: BackendAction): BackendContextState {
  switch (action.type) {
    case 'SET_CURRENT_BACKEND':
      const newBackend = getBackendConfig(action.payload);
      if (newBackend) {
        return {
          ...state,
          currentBackend: newBackend,
          lastSwitchTime: new Date(),
        };
      }
      return state;
      
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
      
    case 'SET_HEALTH_STATUS':
      return {
        ...state,
        currentBackend: {
          ...state.currentBackend,
          // Update health status in current backend if needed
        },
      };
      
    case 'ADD_CONNECTION_TEST':
      return {
        ...state,
        // Store connection test history if needed
      };
      
    case 'ADD_SWITCH_EVENT':
      return {
        ...state,
        // Store switch event history if needed
      };
      
    case 'SET_PERFORMANCE_METRICS':
      return {
        ...state,
        // Store performance metrics if needed
      };
      
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
      
    case 'REFRESH_BACKENDS':
      return {
        ...state,
        availableBackends: getAvailableBackends(),
      };
      
    default:
      return state;
  }
}

// Create the context
const BackendContext = createContext<BackendContextValue | undefined>(undefined);

// Provider component
interface BackendProviderProps {
  children: ReactNode;
}

export function BackendProvider({ children }: BackendProviderProps) {
  const [state, dispatch] = useReducer(backendReducer, initialState);

  // Initialize backend on mount
  useEffect(() => {
    const initializeBackend = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Get stored backend preference or use default
        const storedBackend = localStorage.getItem('selectedBackend');
        const backendToUse = storedBackend && getBackendConfig(storedBackend) 
          ? storedBackend 
          : state.currentBackend.id;
        
        if (storedBackend && getBackendConfig(storedBackend)) {
          dispatch({ type: 'SET_CURRENT_BACKEND', payload: storedBackend });
        }
        
        // Test connection to current backend (only if health endpoint is configured)
        // Skip health check on initial mount to avoid unnecessary requests
        // Health checks should be done explicitly by components that need them
        const config = getBackendConfig(backendToUse);
        if (config?.endpoints?.health) {
          // Only check health if explicitly needed - comment out to disable auto health check
          // await testBackendConnection(backendToUse);
        }
        
      } catch (error) {
        console.error('Failed to initialize backend:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize backend' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - only run on mount

  // Test backend connection
  const testBackendConnection = useCallback(async (backendId: string): Promise<boolean> => {
    try {
      const config = getBackendConfig(backendId);
      if (!config) {
        throw new Error(`Backend configuration not found: ${backendId}`);
      }

      const startTime = Date.now();
      
      // Test health endpoint if available
      if (config.endpoints.health) {
        const response = await fetch(`${config.baseUrl}${config.endpoints.health}`);
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          const healthData = await response.json();
          
          const healthStatus: BackendHealthStatus = {
            status: healthData.status || 'healthy',
            responseTime,
            lastCheck: new Date(),
            features: {
              softDelete: config.features.supportsSoftDelete,
              cmcd: config.features.supportsCMCD,
              webhooks: config.features.supportsWebhooks,
              storageAllocation: config.features.supportsStorageAllocation,
              flowCollections: config.features.supportsFlowCollections,
              advancedSearch: config.features.supportsAdvancedSearch,
              asyncOperations: config.features.supportsAsyncOperations,
              healthMonitoring: config.features.supportsHealthMonitoring,
            },
          };
          
          dispatch({ type: 'SET_HEALTH_STATUS', payload: healthStatus });
          return true;
        }
      } else {
        // Fallback: test base URL connectivity
        const response = await fetch(config.baseUrl);
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error(`Connection test failed for ${backendId}:`, error);
      return false;
    }
  }, []);

  // Switch backend
  const switchBackend = useCallback(async (backendId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Validate backend configuration
      const config = getBackendConfig(backendId);
      if (!config) {
        throw new Error(`Backend configuration not found: ${backendId}`);
      }

      const validationErrors = validateBackendConfig(config);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid backend configuration: ${validationErrors.join(', ')}`);
      }

      // Test connection before switching (skip for IBC Thiago if it's not running)
      if (backendId !== 'ibc-thiago') {
        const isConnected = await testBackendConnection(backendId);
        if (!isConnected) {
          throw new Error(`Failed to connect to backend: ${backendId}`);
        }
      } else {
        // For IBC Thiago, we'll test the connection but not fail if it's not available
        try {
          await testBackendConnection(backendId);
        } catch (error) {
          console.warn('IBC Thiago backend not available, but allowing switch for demo purposes:', error);
        }
      }

      // Store selection in localStorage
      localStorage.setItem('selectedBackend', backendId);
      
      // Update context
      dispatch({ type: 'SET_CURRENT_BACKEND', payload: backendId });
      
      // Update the API client backend
      const { apiClient } = await import('../services/api');
      apiClient.setBackend(backendId);
      
      // Record switch event
      const switchEvent: BackendSwitchEvent = {
        from: state.currentBackend.id,
        to: backendId,
        timestamp: new Date(),
        reason: 'user',
        success: true,
      };
      
      dispatch({ type: 'ADD_SWITCH_EVENT', payload: switchEvent });
      
      console.log(`Successfully switched to backend: ${backendId}`);
      
    } catch (error) {
      console.error('Failed to switch backend:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to switch backend' });
      
      // Record failed switch event
      const switchEvent: BackendSwitchEvent = {
        from: state.currentBackend.id,
        to: backendId,
        timestamp: new Date(),
        reason: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      dispatch({ type: 'ADD_SWITCH_EVENT', payload: switchEvent });
      
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentBackend.id, testBackendConnection]);

  // Refresh backend
  const refreshBackend = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Refresh available backends
      dispatch({ type: 'REFRESH_BACKENDS' });
      
      // Test current backend connection
      await testBackendConnection(state.currentBackend.id);
      
    } catch (error) {
      console.error('Failed to refresh backend:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to refresh backend' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentBackend.id, testBackendConnection]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Context value
  const contextValue: BackendContextValue = {
    ...state,
    switchBackend,
    refreshBackend,
    testBackendConnection,
    clearError,
  };

  return (
    <BackendContext.Provider value={contextValue}>
      {children}
    </BackendContext.Provider>
  );
}

// Custom hook to use the backend context
export function useBackend(): BackendContextValue {
  const context = useContext(BackendContext);
  if (context === undefined) {
    throw new Error('useBackend must be used within a BackendProvider');
  }
  return context;
}

// Custom hook for backend features
export function useBackendFeatures() {
  const { currentBackend } = useBackend();
  
  return {
    canUseSoftDelete: currentBackend.features.supportsSoftDelete,
    canUseCMCD: currentBackend.features.supportsCMCD,
    canUseWebhooks: currentBackend.features.supportsWebhooks,
    canUseStorageAllocation: currentBackend.features.supportsStorageAllocation,
    canUseFlowCollections: currentBackend.features.supportsFlowCollections,
    canUseAdvancedSearch: currentBackend.features.supportsAdvancedSearch,
    canUseAsyncOperations: currentBackend.features.supportsAsyncOperations,
    canUseHealthMonitoring: currentBackend.features.supportsHealthMonitoring,
    supports: (feature: BackendFeature) => {
      const featureMap: Record<BackendFeature, boolean> = {
        softDelete: currentBackend.features.supportsSoftDelete,
        cmcd: currentBackend.features.supportsCMCD,
        webhooks: currentBackend.features.supportsWebhooks,
        storageAllocation: currentBackend.features.supportsStorageAllocation,
        flowCollections: currentBackend.features.supportsFlowCollections,
        advancedSearch: currentBackend.features.supportsAdvancedSearch,
        asyncOperations: currentBackend.features.supportsAsyncOperations,
        healthMonitoring: currentBackend.features.supportsHealthMonitoring,
      };
      return featureMap[feature] || false;
    },
    getUnsupportedFeatures: () => {
      const features: BackendFeature[] = ['softDelete', 'cmcd', 'webhooks', 'storageAllocation', 'flowCollections', 'advancedSearch', 'asyncOperations', 'healthMonitoring'];
      return features.filter(feature => !currentBackend.features[`supports${feature.charAt(0).toUpperCase() + feature.slice(1)}` as keyof typeof currentBackend.features]);
    },
    getSupportedFeatures: () => {
      const features: BackendFeature[] = ['softDelete', 'cmcd', 'webhooks', 'storageAllocation', 'flowCollections', 'advancedSearch', 'asyncOperations', 'healthMonitoring'];
      return features.filter(feature => currentBackend.features[`supports${feature.charAt(0).toUpperCase() + feature.slice(1)}` as keyof typeof currentBackend.features]);
    },
  };
}

// Custom hook for backend status
export function useBackendStatus() {
  const { currentBackend, isLoading, error } = useBackend();
  
  return {
    isConnected: !error && currentBackend.baseUrl,
    healthStatus: {
      status: 'unknown' as const,
      responseTime: 0,
      lastCheck: new Date(),
      features: {
        softDelete: currentBackend.features.supportsSoftDelete,
        cmcd: currentBackend.features.supportsCMCD,
        webhooks: currentBackend.features.supportsWebhooks,
        storageAllocation: currentBackend.features.supportsStorageAllocation,
        flowCollections: currentBackend.features.supportsFlowCollections,
        advancedSearch: currentBackend.features.supportsAdvancedSearch,
        asyncOperations: currentBackend.features.supportsAsyncOperations,
        healthMonitoring: currentBackend.features.supportsHealthMonitoring,
      },
    },
    lastConnectionTest: null,
    connectionHistory: [],
    switchHistory: [],
    performanceMetrics: null,
    isLoading,
    error,
  };
}
