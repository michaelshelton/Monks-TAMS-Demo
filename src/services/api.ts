/**
 * Local TAMS API Service
 * Simple API client for local TAMS setup
 */

import { getCurrentBackendConfig } from '../config/apiConfig';

const config = getCurrentBackendConfig();
const BASE_URL = config.baseUrl;

// Helper function for making API requests
async function request(endpoint: string, options?: RequestInit) {
  const url = `${BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

// Flow APIs
export const flowsApi = {
  list: (params?: { tag?: Record<string, string> }) => {
    const queryParams = new URLSearchParams();
    if (params?.tag) {
      Object.entries(params.tag).forEach(([key, value]) => {
        queryParams.append(`tag.${key}`, value);
      });
    }
    const query = queryParams.toString();
    return request(`/flows${query ? `?${query}` : ''}`);
  },
  
  get: (id: string) => request(`/flows/${id}`),
  
  create: (id: string, data: any) => 
    request(`/flows/${id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) => 
    request(`/flows/${id}`, {
      method: 'DELETE',
    }),
  
  getManifest: (id: string) => `${BASE_URL}/flows/${id}/stream.m3u8?duration=14400`,
  
  getSegments: (id: string, params?: { limit?: number; timerange?: string; duration?: number }) => {
    // The TAMS API uses time-based queries for segments
    // Default is last 5 minutes, so we need to specify a longer duration
    const queryParams = new URLSearchParams();
    if (params?.timerange) queryParams.append('timerange', params.timerange);
    // Add duration parameter (in seconds) to get segments from a longer time period
    if (params?.duration) queryParams.append('duration', params.duration.toString());
    const query = queryParams.toString();
    return request(`/flows/${id}/segments${query ? `?${query}` : ''}`);
  },
};

// Source APIs
export const sourcesApi = {
  list: () => request('/sources'),
  
  get: (id: string) => request(`/sources/${id}`),
  
  create: (id: string, data: any) => 
    request(`/sources/${id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) => 
    request(`/sources/${id}`, {
      method: 'DELETE',
    }),
};

// Segment APIs
export const segmentsApi = {
  getProxyUrl: (flowId: string, segmentId: string) => 
    `${BASE_URL}/flows/${flowId}/segments/${segmentId}`,
  
  register: (flowId: string, data: any) => 
    request(`/flows/${flowId}/segments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// WebSocket connection for real-time updates
export function connectWebSocket(flowId: string, onMessage: (data: any) => void) {
  const ws = new WebSocket('ws://localhost:3001');
  
  ws.onopen = () => {
    console.log('WebSocket connected');
    ws.send(JSON.stringify({ type: 'subscribe', flow_id: flowId }));
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('WebSocket message parse error:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  return ws;
}

// Export a single API client object
export const apiClient = {
  flows: flowsApi,
  sources: sourcesApi,
  segments: segmentsApi,
  connectWebSocket,
};

// BBC TAMS compatibility exports
export const BBC_TAMS_BASE_URL = BASE_URL;
export type BBCApiOptions = any;
export type BBCApiResponse<T> = { data: T[]; meta?: any };
export type BBCPaginationMeta = { 
  total: number; 
  page: number; 
  per_page: number; 
  total_pages: number; 
};