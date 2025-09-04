/**
 * IBC Thiago Backend API Service
 * 
 * Specialized service for the IBC Thiago BBC TAMS v3 demo backend
 * Handles HLS streaming, real-time markers, and WebSocket connections
 */

import { BBCApiResponse, BBCApiOptions } from './api';

// IBC Thiago specific configuration
export const IBC_THIAGO_BASE_URL = import.meta.env.VITE_BACKEND_IBC_THIAGO_URL || 'http://localhost:3000';
export const IBC_THIAGO_WS_URL = import.meta.env.VITE_BACKEND_IBC_THIAGO_WS_URL || 'ws://localhost:3001';

// IBC Thiago with imported data configuration
export const IBC_THIAGO_IMPORTED_BASE_URL = import.meta.env.VITE_BACKEND_IBC_THIAGO_IMPORTED_URL || 'http://localhost:3002';
export const IBC_THIAGO_IMPORTED_WS_URL = import.meta.env.VITE_BACKEND_IBC_THIAGO_IMPORTED_WS_URL || 'ws://localhost:3003';

// Helper function to get the correct base URL based on backend configuration
export function getIBCThiagoBaseUrl(): string {
  const defaultBackend = import.meta.env.VITE_DEFAULT_BACKEND;
  if (defaultBackend === 'ibc-thiago-imported') {
    return IBC_THIAGO_IMPORTED_BASE_URL;
  }
  return IBC_THIAGO_BASE_URL;
}

// IBC Thiago specific types
export interface IBCThiagoSource {
  id: string;
  label: string;
  description?: string;
  tags: Record<string, string[]>;
  created: string;
  updated: string;
  flows?: IBCThiagoFlow[];
}

export interface IBCThiagoFlow {
  id: string;
  source_id: string;
  label: string;
  description?: string;
  format: string;
  codec?: string;
  container?: string;
  resolution?: string;
  fps?: number;
  tags: Record<string, string[]>;
  created: string;
  updated: string;
}

export interface IBCThiagoSegment {
  segment_id: string;
  timestamp: string;
  duration: number;
  url: string;
  format: string;
  size: number;
}

export interface IBCThiagoMarker {
  id: string;
  source_id: string;
  label: string;
  description?: string;
  format: 'application/x-marker+json';
  tags: {
    content_type: ['marker'];
    marker_type?: string[];
    display?: string[];
    color?: string[];
    editable?: string[];
  };
  metadata?: {
    timerange?: string;
    message?: string;
    segment_index?: number;
  };
  created: string;
  updated: string;
}

export interface IBCThiagoHLSManifest {
  manifest: string;
  segments: IBCThiagoSegment[];
  duration: number;
}

export interface IBCThiagoWebSocketMessage {
  type: 'marker_created' | 'marker_updated' | 'marker_deleted' | 'segment_added';
  data: any;
}

// WebSocket connection management
class IBCThiagoWebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  private getWebSocketUrl(): string {
    // Check if we're using the imported backend
    const defaultBackend = import.meta.env.VITE_DEFAULT_BACKEND;
    if (defaultBackend === 'ibc-thiago-imported') {
      return IBC_THIAGO_IMPORTED_WS_URL;
    }
    return IBC_THIAGO_WS_URL;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.getWebSocketUrl();
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('Connected to IBC Thiago WebSocket');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: IBCThiagoWebSocketMessage = JSON.parse(event.data);
            this.notifyListeners(message.type, message.data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('IBC Thiago WebSocket disconnected');
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('IBC Thiago WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect to IBC Thiago WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  subscribe(eventType: string, callback: (data: any) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  unsubscribe(eventType: string, callback: (data: any) => void): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private notifyListeners(eventType: string, data: any): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton WebSocket manager
export const ibcThiagoWebSocket = new IBCThiagoWebSocketManager();

// IBC Thiago API functions
export async function getIBCThiagoSources(options: BBCApiOptions = {}): Promise<BBCApiResponse<IBCThiagoSource>> {
  const queryParams = new URLSearchParams();
  
  // IBC Thiago API has validation issues with limit parameter, so we'll skip it for now
  // The API defaults to 10 results anyway, which is what we typically want
  // if (options.limit) queryParams.append('limit', options.limit.toString());
  
  if (options.page) queryParams.append('page', options.page);
  
  // Add tag filters if present
  if (options.tags) {
    Object.entries(options.tags).forEach(([key, value]) => {
      queryParams.append(`tag.${key}`, value);
    });
  }
  
  const url = `${getIBCThiagoBaseUrl()}/sources${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`IBC Thiago API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    data: data.sources || data,
    pagination: {},
    links: []
  };
}

export async function getIBCThiagoSource(sourceId: string): Promise<IBCThiagoSource> {
  const response = await fetch(`${getIBCThiagoBaseUrl()}/sources/${sourceId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`IBC Thiago API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getIBCThiagoFlows(options: BBCApiOptions = {}): Promise<BBCApiResponse<IBCThiagoFlow>> {
  const queryParams = new URLSearchParams();
  if (options.limit) queryParams.append('limit', options.limit.toString());
  if (options.page) queryParams.append('page', options.page);
  if (options.tags) {
    Object.entries(options.tags).forEach(([key, value]) => {
      queryParams.append(`tag.${key}`, value);
    });
  }
  
  const url = `${getIBCThiagoBaseUrl()}/flows${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`IBC Thiago API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    data: data.flows || data,
    pagination: {},
    links: []
  };
}

export async function getIBCThiagoFlow(flowId: string): Promise<IBCThiagoFlow> {
  const response = await fetch(`${getIBCThiagoBaseUrl()}/flows/${flowId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`IBC Thiago API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getIBCThiagoFlowSegments(flowId: string, options: BBCApiOptions = {}): Promise<BBCApiResponse<IBCThiagoSegment>> {
  const queryParams = new URLSearchParams();
  if (options.limit) queryParams.append('limit', options.limit.toString());
  if (options.timerange) queryParams.append('timerange', options.timerange);
  if (options.custom?.duration) queryParams.append('duration', options.custom.duration.toString());
  
  const url = `${getIBCThiagoBaseUrl()}/flows/${flowId}/segments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`IBC Thiago API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    data: data.segments || data,
    pagination: {},
    links: []
  };
}

export async function getIBCThiagoHLSManifest(flowId: string): Promise<IBCThiagoHLSManifest> {
  const response = await fetch(`${getIBCThiagoBaseUrl()}/flows/${flowId}/stream.m3u8`, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.apple.mpegurl, application/x-mpegURL, application/octet-stream'
    }
  });

  if (!response.ok) {
    throw new Error(`IBC Thiago HLS error: ${response.status} ${response.statusText}`);
  }

  const manifest = await response.text();
  
  // Parse the manifest to extract segment information
  const segments: IBCThiagoSegment[] = [];
  const lines = manifest.split('\n');
  let currentSegment: Partial<IBCThiagoSegment> = {};
  
  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const parts = line.split(':')[1]?.split(',');
      if (parts && parts[0]) {
        const duration = parseFloat(parts[0]);
        currentSegment.duration = duration * 1000; // Convert to milliseconds
      }
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      currentSegment.url = line;
      currentSegment.segment_id = line.split('/').pop() || '';
      currentSegment.format = 'ts';
      currentSegment.size = 0; // Size not available in manifest
      currentSegment.timestamp = new Date().toISOString(); // Approximate
      
      if (currentSegment.segment_id && currentSegment.url) {
        segments.push(currentSegment as IBCThiagoSegment);
      }
      currentSegment = {};
    }
  }

  return {
    manifest,
    segments,
    duration: segments.reduce((total, seg) => total + seg.duration, 0)
  };
}

export async function createIBCThiagoMarker(markerData: Partial<IBCThiagoMarker>): Promise<IBCThiagoMarker> {
  const response = await fetch(`${getIBCThiagoBaseUrl()}/flows/${markerData.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      source_id: markerData.source_id,
      label: markerData.label,
      description: markerData.description,
      format: 'application/x-marker+json',
      tags: {
        content_type: ['marker'],
        marker_type: markerData.tags?.marker_type || ['system_status'],
        display: markerData.tags?.display || ['square'],
        color: markerData.tags?.color || ['#00ff00'],
        editable: markerData.tags?.editable || ['true']
      },
      metadata: markerData.metadata
    })
  });

  if (!response.ok) {
    throw new Error(`IBC Thiago API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function updateIBCThiagoMarker(markerId: string, updates: Partial<IBCThiagoMarker>): Promise<IBCThiagoMarker> {
  const response = await fetch(`${getIBCThiagoBaseUrl()}/flows/${markerId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    throw new Error(`IBC Thiago API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function deleteIBCThiagoMarker(markerId: string): Promise<void> {
  const response = await fetch(`${getIBCThiagoBaseUrl()}/flows/${markerId}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`IBC Thiago API error: ${response.status} ${response.statusText}`);
  }
}

export async function getIBCThiagoHealth(): Promise<any> {
  const response = await fetch(`${getIBCThiagoBaseUrl()}/health`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`IBC Thiago health check failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getIBCThiagoStorage(flowId: string): Promise<any> {
  const response = await fetch(`${getIBCThiagoBaseUrl()}/flows/${flowId}/storage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    throw new Error(`IBC Thiago storage error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Utility functions for IBC Thiago specific features
export function extractMarkersFromSource(source: IBCThiagoSource): IBCThiagoMarker[] {
  if (!source.flows) return [];
  
  return source.flows.filter(flow => 
    flow.tags?.content_type?.includes('marker')
  ) as IBCThiagoMarker[];
}

export function extractVideoFlowsFromSource(source: IBCThiagoSource): IBCThiagoFlow[] {
  if (!source.flows) return [];
  
  return source.flows.filter(flow => 
    !flow.tags?.content_type?.includes('marker')
  );
}

export function isMarkerFlow(flow: IBCThiagoFlow): boolean {
  return flow.tags?.content_type?.includes('marker') || false;
}

export function getMarkerColor(marker: IBCThiagoMarker): string {
  return marker.tags?.color?.[0] || '#00ff00';
}

export function getMarkerDisplayType(marker: IBCThiagoMarker): string {
  return marker.tags?.display?.[0] || 'square';
}

export function isMarkerEditable(marker: IBCThiagoMarker): boolean {
  return marker.tags?.editable?.[0] === 'true';
}
