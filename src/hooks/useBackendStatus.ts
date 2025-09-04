/**
 * useBackendStatus Hook
 * 
 * React hook for backend health monitoring, connection status, and performance tracking.
 * Provides real-time status information and connection testing capabilities.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useBackend } from '../contexts/BackendContext';

/**
 * Backend connection status
 */
export interface BackendConnectionStatus {
  connected: boolean;
  lastCheck: Date;
  responseTime?: number;
  error?: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
}

/**
 * Backend performance metrics
 */
export interface BackendPerformanceMetrics {
  averageResponseTime: number;
  successRate: number;
  totalRequests: number;
  lastUpdated: Date;
  errorCount: number;
  uptime: number;
}

/**
 * Backend status history entry
 */
export interface BackendStatusHistoryEntry {
  timestamp: Date;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
}

/**
 * Hook for backend status monitoring and health checking
 */
export function useBackendStatus() {
  const { currentBackend, testBackendConnection, isLoading, error } = useBackend();
  
  // State for connection status
  const [connectionStatus, setConnectionStatus] = useState<BackendConnectionStatus>({
    connected: false,
    lastCheck: new Date(),
    status: 'unknown',
  });

  // State for performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState<BackendPerformanceMetrics>({
    averageResponseTime: 0,
    successRate: 100,
    totalRequests: 0,
    lastUpdated: new Date(),
    errorCount: 0,
    uptime: 0,
  });

  // State for status history
  const [statusHistory, setStatusHistory] = useState<BackendStatusHistoryEntry[]>([]);

  // State for auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Test backend connection
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      const startTime = Date.now();
      const isConnected = await testBackendConnection(currentBackend.id);
      const responseTime = Date.now() - startTime;

      const newStatus: BackendConnectionStatus = {
        connected: isConnected,
        lastCheck: new Date(),
        responseTime,
        status: isConnected ? 'healthy' : 'unhealthy',
        ...(isConnected ? {} : { error: 'Connection failed' }),
      };

      setConnectionStatus(newStatus);

      // Add to history
      const historyEntry: BackendStatusHistoryEntry = {
        timestamp: new Date(),
        status: newStatus.status,
        responseTime,
        ...(newStatus.error ? { error: newStatus.error } : {}),
      };

      setStatusHistory(prev => {
        const newHistory = [historyEntry, ...prev].slice(0, 50); // Keep last 50 entries
        return newHistory;
      });

      // Update performance metrics
      setPerformanceMetrics(prev => {
        const totalRequests = prev.totalRequests + 1;
        const errorCount = isConnected ? prev.errorCount : prev.errorCount + 1;
        const successRate = Math.round(((totalRequests - errorCount) / totalRequests) * 100);
        const averageResponseTime = prev.averageResponseTime === 0 
          ? responseTime 
          : Math.round((prev.averageResponseTime + responseTime) / 2);

        return {
          averageResponseTime,
          successRate,
          totalRequests,
          lastUpdated: new Date(),
          errorCount,
          uptime: isConnected ? prev.uptime + (Date.now() - prev.lastUpdated.getTime()) : prev.uptime,
        };
      });

      return isConnected;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const newStatus: BackendConnectionStatus = {
        connected: false,
        lastCheck: new Date(),
        status: 'unhealthy',
        error: errorMessage,
      };

      setConnectionStatus(newStatus);

      // Add to history
      const historyEntry: BackendStatusHistoryEntry = {
        timestamp: new Date(),
        status: 'unhealthy',
        error: errorMessage,
      };

      setStatusHistory(prev => {
        const newHistory = [historyEntry, ...prev].slice(0, 50);
        return newHistory;
      });

      // Update performance metrics
      setPerformanceMetrics(prev => {
        const totalRequests = prev.totalRequests + 1;
        const errorCount = prev.errorCount + 1;
        const successRate = Math.round(((totalRequests - errorCount) / totalRequests) * 100);

        return {
          ...prev,
          successRate,
          totalRequests,
          lastUpdated: new Date(),
          errorCount,
        };
      });

      return false;
    }
  }, [currentBackend.id, testBackendConnection]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      testConnection();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, testConnection]);

  // Initial connection test
  useEffect(() => {
    testConnection();
  }, [currentBackend.id]); // Test when backend changes

  // Memoized status information
  const statusInfo = useMemo(() => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'healthy': return 'green';
        case 'degraded': return 'yellow';
        case 'unhealthy': return 'red';
        default: return 'gray';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'healthy': return '✅';
        case 'degraded': return '⚠️';
        case 'unhealthy': return '❌';
        default: return '❓';
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'healthy': return 'Healthy';
        case 'degraded': return 'Degraded';
        case 'unhealthy': return 'Unhealthy';
        default: return 'Unknown';
      }
    };

    return {
      statusColor: getStatusColor(connectionStatus.status),
      statusIcon: getStatusIcon(connectionStatus.status),
      statusText: getStatusText(connectionStatus.status),
      isHealthy: connectionStatus.status === 'healthy',
      isDegraded: connectionStatus.status === 'degraded',
      isUnhealthy: connectionStatus.status === 'unhealthy',
      isUnknown: connectionStatus.status === 'unknown',
    };
  }, [connectionStatus.status]);

  // Memoized performance summary
  const performanceSummary = useMemo(() => {
    const getPerformanceGrade = (successRate: number) => {
      if (successRate >= 99) return 'A+';
      if (successRate >= 95) return 'A';
      if (successRate >= 90) return 'B';
      if (successRate >= 80) return 'C';
      if (successRate >= 70) return 'D';
      return 'F';
    };

    const getPerformanceColor = (successRate: number) => {
      if (successRate >= 95) return 'green';
      if (successRate >= 85) return 'yellow';
      return 'red';
    };

    return {
      grade: getPerformanceGrade(performanceMetrics.successRate),
      color: getPerformanceColor(performanceMetrics.successRate),
      uptimeHours: Math.round(performanceMetrics.uptime / (1000 * 60 * 60) * 100) / 100,
      averageResponseTimeMs: performanceMetrics.averageResponseTime,
      totalRequests: performanceMetrics.totalRequests,
      errorCount: performanceMetrics.errorCount,
      successRate: performanceMetrics.successRate,
    };
  }, [performanceMetrics]);

  // Memoized recent history
  const recentHistory = useMemo(() => {
    return statusHistory.slice(0, 10); // Last 10 entries
  }, [statusHistory]);

  // Memoized health trends
  const healthTrends = useMemo(() => {
    const last24Hours = statusHistory.filter(entry => 
      Date.now() - entry.timestamp.getTime() < 24 * 60 * 60 * 1000
    );

    const healthyCount = last24Hours.filter(entry => entry.status === 'healthy').length;
    const totalCount = last24Hours.length;

    return {
      last24Hours: {
        total: totalCount,
        healthy: healthyCount,
        unhealthy: totalCount - healthyCount,
        uptime: totalCount > 0 ? Math.round((healthyCount / totalCount) * 100) : 0,
      },
      trend: totalCount > 0 ? (healthyCount / totalCount) * 100 : 0,
    };
  }, [statusHistory]);

  return {
    // Connection status
    connectionStatus,
    isConnected: connectionStatus.connected,
    lastCheck: connectionStatus.lastCheck,
    responseTime: connectionStatus.responseTime,
    error: connectionStatus.error,

    // Status information
    statusInfo,
    isHealthy: statusInfo.isHealthy,
    isDegraded: statusInfo.isDegraded,
    isUnhealthy: statusInfo.isUnhealthy,
    isUnknown: statusInfo.isUnknown,

    // Performance metrics
    performanceMetrics,
    performanceSummary,

    // Status history
    statusHistory,
    recentHistory,
    healthTrends,

    // Auto-refresh controls
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,

    // Actions
    testConnection,
    clearHistory: () => setStatusHistory([]),
    resetMetrics: () => setPerformanceMetrics({
      averageResponseTime: 0,
      successRate: 100,
      totalRequests: 0,
      lastUpdated: new Date(),
      errorCount: 0,
      uptime: 0,
    }),

    // Loading state
    isLoading,
  };
}

/**
 * Hook for simple backend health check
 */
export function useBackendHealth() {
  const { isConnected, isHealthy, lastCheck, responseTime, error } = useBackendStatus();
  
  return {
    isHealthy,
    isConnected,
    lastCheck,
    responseTime,
    error,
  };
}

/**
 * Hook for backend performance monitoring
 */
export function useBackendPerformance() {
  const { performanceMetrics, performanceSummary, healthTrends } = useBackendStatus();
  
  return {
    metrics: performanceMetrics,
    summary: performanceSummary,
    trends: healthTrends,
  };
}

/**
 * Hook for backend status history
 */
export function useBackendHistory() {
  const { statusHistory, recentHistory, healthTrends } = useBackendStatus();
  
  return {
    fullHistory: statusHistory,
    recent: recentHistory,
    trends: healthTrends,
  };
}
