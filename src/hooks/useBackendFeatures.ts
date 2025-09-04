/**
 * useBackendFeatures Hook
 * 
 * React hook for detecting backend capabilities and feature availability.
 * Provides type-safe feature checking and helper methods for conditional rendering.
 */

import { useMemo } from 'react';
import { useBackend } from '../contexts/BackendContext';
import { BackendFeature } from '../services/interfaces/IApiClient';

/**
 * Hook for backend feature detection and availability
 */
export function useBackendFeatures() {
  const { currentBackend } = useBackend();

  // Memoize feature detection to avoid recalculation on every render
  const features = useMemo(() => {
    return {
      // Core TAMS features
      canUseSoftDelete: currentBackend.features.supportsSoftDelete,
      canUseCMCD: currentBackend.features.supportsCMCD,
      canUseWebhooks: currentBackend.features.supportsWebhooks,
      canUseStorageAllocation: currentBackend.features.supportsStorageAllocation,
      canUseFlowCollections: currentBackend.features.supportsFlowCollections,
      canUseAdvancedSearch: currentBackend.features.supportsAdvancedSearch,
      canUseAsyncOperations: currentBackend.features.supportsAsyncOperations,
      canUseHealthMonitoring: currentBackend.features.supportsHealthMonitoring,

      // Backend-specific features
      canUseHLSStreaming: currentBackend.id === 'ibc-thiago',
      canUseRealTimeMarkers: currentBackend.id === 'ibc-thiago',
      canUseWebSocketUpdates: currentBackend.id === 'ibc-thiago',

      // Generic feature checking
      supports: (feature: BackendFeature): boolean => {
        const featureMap: Record<BackendFeature, boolean> = {
          softDelete: currentBackend.features.supportsSoftDelete,
          cmcd: currentBackend.features.supportsCMCD,
          webhooks: currentBackend.features.supportsWebhooks,
          storageAllocation: currentBackend.features.supportsStorageAllocation,
          flowCollections: currentBackend.features.supportsFlowCollections,
          advancedSearch: currentBackend.features.supportsAdvancedSearch,
          asyncOperations: currentBackend.features.supportsAsyncOperations,
          healthMonitoring: currentBackend.features.supportsHealthMonitoring,
          hlsStreaming: currentBackend.id === 'ibc-thiago',
          realTimeMarkers: currentBackend.id === 'ibc-thiago',
          webSocketUpdates: currentBackend.id === 'ibc-thiago',
        };
        return featureMap[feature] || false;
      },

      // Get all unsupported features
      getUnsupportedFeatures: (): BackendFeature[] => {
        const allFeatures: BackendFeature[] = [
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

        return allFeatures.filter(feature => {
          const featureMap: Record<BackendFeature, boolean> = {
            softDelete: currentBackend.features.supportsSoftDelete,
            cmcd: currentBackend.features.supportsCMCD,
            webhooks: currentBackend.features.supportsWebhooks,
            storageAllocation: currentBackend.features.supportsStorageAllocation,
            flowCollections: currentBackend.features.supportsFlowCollections,
            advancedSearch: currentBackend.features.supportsAdvancedSearch,
            asyncOperations: currentBackend.features.supportsAsyncOperations,
            healthMonitoring: currentBackend.features.supportsHealthMonitoring,
            hlsStreaming: currentBackend.id === 'ibc-thiago',
            realTimeMarkers: currentBackend.id === 'ibc-thiago',
            webSocketUpdates: currentBackend.id === 'ibc-thiago',
          };
          return !featureMap[feature];
        });
      },

      // Get all supported features
      getSupportedFeatures: (): BackendFeature[] => {
        const allFeatures: BackendFeature[] = [
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

        return allFeatures.filter(feature => {
          const featureMap: Record<BackendFeature, boolean> = {
            softDelete: currentBackend.features.supportsSoftDelete,
            cmcd: currentBackend.features.supportsCMCD,
            webhooks: currentBackend.features.supportsWebhooks,
            storageAllocation: currentBackend.features.supportsStorageAllocation,
            flowCollections: currentBackend.features.supportsFlowCollections,
            advancedSearch: currentBackend.features.supportsAdvancedSearch,
            asyncOperations: currentBackend.features.supportsAsyncOperations,
            healthMonitoring: currentBackend.features.supportsHealthMonitoring,
            hlsStreaming: currentBackend.id === 'ibc-thiago',
            realTimeMarkers: currentBackend.id === 'ibc-thiago',
            webSocketUpdates: currentBackend.id === 'ibc-thiago',
          };
          return featureMap[feature];
        });
      },

      // Feature availability summary
      getFeatureSummary: () => {
        const supported = features.getSupportedFeatures();
        const unsupported = features.getUnsupportedFeatures();
        
        return {
          total: supported.length + unsupported.length,
          supported: supported.length,
          unsupported: unsupported.length,
          percentage: Math.round((supported.length / (supported.length + unsupported.length)) * 100),
        };
      },

      // Check if backend supports any advanced features
      hasAdvancedFeatures: () => {
        return currentBackend.features.supportsSoftDelete ||
               currentBackend.features.supportsCMCD ||
               currentBackend.features.supportsStorageAllocation ||
               currentBackend.features.supportsFlowCollections ||
               currentBackend.features.supportsAsyncOperations ||
               currentBackend.id === 'ibc-thiago';
      },

      // Check if backend is basic (minimal features)
      isBasicBackend: () => {
        return !features.hasAdvancedFeatures();
      },

      // Get feature display information
      getFeatureDisplayInfo: (feature: BackendFeature) => {
        const featureInfo: Record<BackendFeature, { name: string; description: string; category: string }> = {
          softDelete: {
            name: 'Soft Delete',
            description: 'Allows recovery of deleted items',
            category: 'Data Management'
          },
          cmcd: {
            name: 'CMCD Analytics',
            description: 'Common Media Client Data analytics',
            category: 'Analytics'
          },
          webhooks: {
            name: 'Webhooks',
            description: 'Real-time event notifications',
            category: 'Integration'
          },
          storageAllocation: {
            name: 'Storage Allocation',
            description: 'Advanced storage management',
            category: 'Storage'
          },
          flowCollections: {
            name: 'Flow Collections',
            description: 'Group flows into collections',
            category: 'Organization'
          },
          advancedSearch: {
            name: 'Advanced Search',
            description: 'Complex search capabilities',
            category: 'Search'
          },
          asyncOperations: {
            name: 'Async Operations',
            description: 'Background processing support',
            category: 'Performance'
          },
          healthMonitoring: {
            name: 'Health Monitoring',
            description: 'System health tracking',
            category: 'Monitoring'
          },
          hlsStreaming: {
            name: 'HLS Streaming',
            description: 'HTTP Live Streaming support',
            category: 'Streaming'
          },
          realTimeMarkers: {
            name: 'Real-time Markers',
            description: 'Live event markers',
            category: 'Streaming'
          },
          webSocketUpdates: {
            name: 'WebSocket Updates',
            description: 'Real-time data updates',
            category: 'Real-time'
          },
        };

        return featureInfo[feature] || {
          name: feature,
          description: 'Unknown feature',
          category: 'Other'
        };
      },
    };
  }, [currentBackend]);

  return features;
}

/**
 * Hook for checking specific feature availability
 */
export function useFeatureSupport(feature: BackendFeature): boolean {
  const { supports } = useBackendFeatures();
  return supports(feature);
}

/**
 * Hook for getting feature availability for multiple features
 */
export function useMultipleFeatureSupport(features: BackendFeature[]): Record<BackendFeature, boolean> {
  const { supports } = useBackendFeatures();
  
  return features.reduce((acc, feature) => {
    acc[feature] = supports(feature);
    return acc;
  }, {} as Record<BackendFeature, boolean>);
}

/**
 * Hook for conditional rendering based on feature support
 */
export function useFeatureConditional(feature: BackendFeature) {
  const isSupported = useFeatureSupport(feature);
  
  return {
    isSupported,
    renderIfSupported: <T>(component: T): T | null => isSupported ? component : null,
    renderIfNotSupported: <T>(component: T): T | null => !isSupported ? component : null,
  };
}

/**
 * Hook for getting backend capability summary
 */
export function useBackendCapabilities() {
  const { currentBackend } = useBackend();
  const { getFeatureSummary, hasAdvancedFeatures, isBasicBackend } = useBackendFeatures();

  return {
    backendType: currentBackend.type,
    backendName: currentBackend.name,
    backendVersion: currentBackend.version,
    featureSummary: getFeatureSummary(),
    hasAdvancedFeatures: hasAdvancedFeatures(),
    isBasicBackend: isBasicBackend(),
    capabilities: {
      coreTams: true, // All backends support core TAMS
      advancedFeatures: hasAdvancedFeatures(),
      streaming: currentBackend.id === 'ibc-thiago',
      realTime: currentBackend.id === 'ibc-thiago',
      analytics: currentBackend.features.supportsCMCD,
      dataManagement: currentBackend.features.supportsSoftDelete,
      storage: currentBackend.features.supportsStorageAllocation,
      integration: currentBackend.features.supportsWebhooks,
    },
  };
}
