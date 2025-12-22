/**
 * Unified API Service Layer for TAMS Frontend
 * Handles all communication with the backend API using BBC TAMS v6.0 specification
 * 
 * This service consolidates BBC TAMS API functionality with VAST TAMS extensions
 * while maintaining full BBC TAMS compliance for future flexibility.
 */

// Use proxy in development, Vercel proxy in production
const API_BASE_URL = import.meta.env.DEV 
  ? '/api'  // Use Vite dev server proxy
  : '/api/proxy'; // Use Vercel proxy in production

// BBC TAMS API Configuration
export const BBC_TAMS_BASE_URL = API_BASE_URL;

// Import IBC Thiago API functions
import { 
  getIBCThiagoSources,
  getIBCThiagoSource,
  getIBCThiagoFlows,
  getIBCThiagoFlow,
  getIBCThiagoFlowSegments,
  getIBCThiagoHLSManifest,
  createIBCThiagoMarker,
  updateIBCThiagoMarker,
  deleteIBCThiagoMarker,
  getIBCThiagoHealth,
  getIBCThiagoStorage,
  ibcThiagoWebSocket,
  extractMarkersFromSource,
  extractVideoFlowsFromSource,
  isMarkerFlow,
  getMarkerColor,
  getMarkerDisplayType,
  isMarkerEditable,
  type IBCThiagoSource,
  type IBCThiagoFlow,
  type IBCThiagoSegment,
  type IBCThiagoMarker
} from './ibcThiagoApi';

// BBC TAMS API Response Types
export interface BBCPaginationMeta {
  link?: string;
  limit?: number;
  nextKey?: string;
  prevKey?: string;
  firstKey?: string;
  lastKey?: string;
  timerange?: string;
  count?: number;
  reverseOrder?: boolean;
}

export interface BBCLinkHeader {
  url: string;
  rel: string;
  params?: Record<string, string>;
}

export interface BBCApiResponse<T> {
  data: T[];
  pagination: BBCPaginationMeta;
  links: BBCLinkHeader[];
}

export interface BBCApiOptions {
  page?: string; // Cursor for pagination
  limit?: number; // Number of items per page
  timerange?: string; // BBC timerange format
  format?: string; // Content format filter
  codec?: string; // Codec filter
  tags?: Record<string, string>; // Tag filters
  tagExists?: Record<string, boolean>; // Tag existence filters
  custom?: Record<string, any>; // Custom filters
}

// Legacy API response types (for backward compatibility)
interface ApiResponse<T> {
  data: T;
  paging?: any;
}

interface PaginatedResponse<T> {
  data: T[];
  paging?: {
    page: number;
    size: number;
    total: number;
  };
}

// BBC TAMS Utility Functions

/**
 * Parse BBC TAMS Link header according to RFC 5988
 */
export function parseLinkHeader(linkHeader: string): BBCLinkHeader[] {
  if (!linkHeader) return [];
  
  const links: BBCLinkHeader[] = [];
  const linkRegex = /<([^>]+)>;\s*rel="([^"]+)"(?:;\s*([^,]+))?/g;
  
  let match;
  while ((match = linkRegex.exec(linkHeader)) !== null) {
    const [, url, rel, paramsString] = match;
    const params: Record<string, string> = {};
    
    if (paramsString) {
      const paramRegex = /([^=]+)="([^"]+)"/g;
      let paramMatch;
      while ((paramMatch = paramRegex.exec(paramsString)) !== null) {
        const [, key, value] = paramMatch;
        if (key && value) {
          params[key] = value;
        }
      }
    }
    
    if (url && rel) {
      try {
        // Handle both absolute and relative URLs
        let urlObj: URL;
        try {
          urlObj = new URL(url);
        } catch {
          // If URL is relative, construct absolute URL using current origin
          // For API responses, relative URLs are relative to the API base
          urlObj = new URL(url, window.location.origin);
        }
        
        const queryParams = urlObj.searchParams;
        
        // Extract BBC TAMS specific parameters
        if (queryParams.has('page')) {
          params.page = queryParams.get('page') || '';
        }
        if (queryParams.has('limit')) {
          params.limit = queryParams.get('limit') || '';
        }
        if (queryParams.has('timerange')) {
          params.timerange = queryParams.get('timerange') || '';
        }
        if (queryParams.has('format')) {
          params.format = queryParams.get('format') || '';
        }
        if (queryParams.has('codec')) {
          params.codec = queryParams.get('codec') || '';
        }
        if (queryParams.has('label')) {
          params.label = queryParams.get('label') || '';
        }
      } catch (error) {
        // Silently ignore Link header parsing errors - they're non-fatal
        // The URL might be relative or malformed, but we can still use the response data
      }
      
      links.push({ url, rel, params });
    }
  }
  
  return links;
}

/**
 * Parse BBC TAMS response headers for pagination metadata
 */
export function parseBBCHeaders(headers: Headers): BBCPaginationMeta {
  const linkHeader = headers.get('Link');
  const limitHeader = headers.get('X-Paging-Limit');
  const nextKeyHeader = headers.get('X-Paging-NextKey');
  const prevKeyHeader = headers.get('X-Paging-PrevKey');
  const firstKeyHeader = headers.get('X-Paging-FirstKey');
  const lastKeyHeader = headers.get('X-Paging-LastKey');
  const timerangeHeader = headers.get('X-Paging-Timerange');
  const countHeader = headers.get('X-Paging-Count');
  const reverseOrderHeader = headers.get('X-Paging-ReverseOrder');
  
  const result: BBCPaginationMeta = {
    reverseOrder: reverseOrderHeader === 'true'
  };
  
  if (linkHeader) result.link = linkHeader;
  if (limitHeader) {
    const limit = parseInt(limitHeader);
    if (!isNaN(limit)) result.limit = limit;
  }
  if (nextKeyHeader) result.nextKey = nextKeyHeader;
  if (prevKeyHeader) result.prevKey = prevKeyHeader;
  if (firstKeyHeader) result.firstKey = firstKeyHeader;
  if (lastKeyHeader) result.lastKey = lastKeyHeader;
  if (timerangeHeader) result.timerange = timerangeHeader;
  if (countHeader) {
    const count = parseInt(countHeader);
    if (!isNaN(count)) result.count = count;
  }
  
  return result;
}

/**
 * Build BBC TAMS query string from options
 */
export function buildBBCQueryString(options: BBCApiOptions): string {
  const params: string[] = [];
  
  if (options.page) {
    params.push(`page=${encodeURIComponent(options.page)}`);
  }
  
  if (options.limit) {
    // Ensure limit is an integer (API validation requires integer type)
    const limitValue = typeof options.limit === 'number' ? options.limit : parseInt(String(options.limit), 10);
    if (!isNaN(limitValue)) {
      params.push(`limit=${limitValue}`);
    }
  }
  
  if (options.timerange) {
    params.push(`timerange=${encodeURIComponent(options.timerange)}`);
  }
  
  if (options.format) {
    params.push(`format=${encodeURIComponent(options.format)}`);
  }
  
  if (options.codec) {
    params.push(`codec=${encodeURIComponent(options.codec)}`);
  }
  
  if (options.tags) {
    Object.entries(options.tags).forEach(([key, value]) => {
      params.push(`tag.${key}=${encodeURIComponent(value)}`);
    });
  }
  
  if (options.tagExists) {
    Object.entries(options.tagExists).forEach(([key, exists]) => {
      params.push(`tag_exists.${key}=${exists}`);
    });
  }
  
  if (options.custom) {
    Object.entries(options.custom).forEach(([key, value]) => {
      params.push(`${key}=${encodeURIComponent(String(value))}`);
    });
  }
  
  return params.length > 0 ? `?${params.join('&')}` : '';
}

/**
 * Extract all available navigation cursors from BBC TAMS response
 */
export function getAllNavigationCursors(response: BBCApiResponse<any>): {
  next?: string;
  prev?: string;
  first?: string;
  last?: string;
} {
  const cursors: { next?: string; prev?: string; first?: string; last?: string } = {};
  
  if (response.links) {
    response.links.forEach(link => {
      if (link.rel === 'next' && link.params?.page) {
        cursors.next = link.params.page;
      } else if (link.rel === 'prev' && link.params?.page) {
        cursors.prev = link.params.page;
      } else if (link.rel === 'first' && link.params?.page) {
        cursors.first = link.params.page;
      } else if (link.rel === 'last' && link.params?.page) {
        cursors.last = link.params.page;
      }
    });
  }
  
  // Also check pagination metadata for backward compatibility
  if (response.pagination) {
    if (response.pagination.nextKey) cursors.next = response.pagination.nextKey;
    if (response.pagination.prevKey) cursors.prev = response.pagination.prevKey;
    if (response.pagination.firstKey) cursors.first = response.pagination.firstKey;
    if (response.pagination.lastKey) cursors.last = response.pagination.lastKey;
  }
  
  return cursors;
}

// Unified API Client class with BBC TAMS compliance
// This class now acts as a facade over the new service factory architecture
class UnifiedApiClient {
  private baseUrl: string;
  private currentBackend: string;
  private apiClient: any = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.currentBackend = this.detectBackend();
    this.baseUrl = this.getBackendUrl();
    // Initialize API client asynchronously
    this.initializeApiClient().catch(error => {
      console.warn('Failed to initialize API client:', error);
    });
  }

  /**
   * Detect which backend is currently being used
   * Always defaults to 'vast-tams' (monks_tams_api) unless explicitly overridden
   */
  private detectBackend(): string {
    // Check environment variable first
    const defaultBackend = import.meta.env.VITE_DEFAULT_BACKEND;
    if (defaultBackend) {
      return defaultBackend;
    }
    
    // Check localStorage for backend selection
    const storedBackend = localStorage.getItem('selectedBackend');
    if (storedBackend) {
      return storedBackend;
    }
    
    // Default to vast-tams (monks_tams_api)
    return 'vast-tams';
  }

  /**
   * Get the correct backend URL based on the current backend configuration
   */
  private getBackendUrl(): string {
    // Simplified to always use local TAMS API
    // In development, use Vite proxy (/api) which forwards to localhost:3000
    // In production, use /api/proxy (Vercel proxy)
    return import.meta.env.DEV ? '/api' : '/api/proxy';
  }

  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize the appropriate API client using the service factory
   * Always uses vast-tams (monks_tams_api) backend
   */
  private async initializeApiClient(): Promise<void> {
    // If already initialized, return immediately
    if (this.apiClient) {
      return;
    }

    // If already initializing, return the existing promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        const { apiServiceFactory } = await import('./apiServiceFactory');
        const { getCurrentBackendConfig } = await import('../config/apiConfig');
        
        // Ensure we're using vast-tams backend (monks_tams_api)
        const config = getCurrentBackendConfig();
        
        // Override to ensure vast-tams if not already set
        if (config.id !== 'vast-tams') {
          const { getBackendConfig } = await import('../config/apiConfig');
          const vastTamsConfig = getBackendConfig('vast-tams');
          if (vastTamsConfig) {
            this.apiClient = await apiServiceFactory.createClient(
              'vast-tams',
              vastTamsConfig
            );
            console.log('Initialized API client with vast-tams (monks_tams_api) backend');
            this.initializationPromise = null; // Clear promise on success
            return;
          }
        }
        
        this.apiClient = await apiServiceFactory.createClient(
          config.type as any,
          config
        );
        console.log(`Initialized API client with ${config.id} backend`);
        this.initializationPromise = null; // Clear promise on success
      } catch (error) {
        console.warn('Failed to initialize API client with service factory, falling back to legacy mode:', error);
        // Clear promise on failure so we can retry if needed
        this.initializationPromise = null;
        // Fall back to legacy implementation
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Ensure API client is initialized before making requests
   */
  private async ensureApiClientInitialized(): Promise<void> {
    // If already initialized, no need to wait
    if (this.apiClient) {
      return;
    }

    // If initializing, wait for it
    if (this.initializationPromise) {
      await this.initializationPromise;
      return;
    }

    // Otherwise, start initialization
    await this.initializeApiClient();
  }

  /**
   * Set the current backend
   */
  async setBackend(backendId: string): Promise<void> {
    this.currentBackend = backendId;
    this.baseUrl = this.getBackendUrl();
    
    try {
      const { apiServiceFactory } = await import('./apiServiceFactory');
      const { getBackendConfig } = await import('../config/apiConfig');
      
      const config = getBackendConfig(backendId);
      if (config) {
        this.apiClient = await apiServiceFactory.createClient(
          config.type as any,
          config
        );
      }
    } catch (error) {
      console.error('Failed to switch backend:', error);
      throw error;
    }
  }

  /**
   * Check if using IBC Thiago backend
   */
  private isIBCThiagoBackend(): boolean {
    return this.currentBackend === 'ibc-thiago' || this.currentBackend === 'ibc-thiago-imported';
  }

  /**
   * Get the current API client instance
   */
  private getApiClient(): any {
    return this.apiClient;
  }

  /**
   * BBC TAMS compliant GET request with pagination support
   * Handles multiple response formats from different API versions
   */
  async bbcTamsGet<T>(endpoint: string, options: BBCApiOptions = {}): Promise<BBCApiResponse<T>> {
    const queryString = buildBBCQueryString(options);
    const url = `${this.baseUrl}${endpoint}${queryString}`;
    
    let responseData;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Check response status first
      if (!response.ok) {
        // Try to parse error response
        try {
          const errorData = await response.json();
          if (errorData.error) {
            throw new Error(`TAMS API error: ${errorData.error.message || errorData.error.code || 'Unknown error'}`);
          }
        } catch (parseError) {
          // If we can't parse the error, use status text
        }
        throw new Error(`TAMS API error: ${response.status} ${response.statusText || 'Bad Request'}`);
      }

      // Parse successful response
      responseData = await response.json();

      // Check if response contains an error (even if status is 200)
      if (responseData.error) {
        // Handle both string and object error formats
        let errorMessage = 'Unknown error';
        if (typeof responseData.error === 'string') {
          // Error is a string (e.g., "ValidationError")
          errorMessage = responseData.message || responseData.error;
        } else if (responseData.error.message) {
          // Error is an object with message property
          errorMessage = responseData.error.message;
        } else if (responseData.error.code) {
          // Error is an object with code property
          errorMessage = responseData.error.code;
        } else if (responseData.message) {
          // Fallback to top-level message
          errorMessage = responseData.message;
        }
        throw new Error(`TAMS API error: ${errorMessage}`);
      }

      // Continue with response processing
      const pagination = parseBBCHeaders(response.headers);
      const links = parseLinkHeader(response.headers.get('Link') || '');

      // Handle different response formats from new API vs BBC TAMS format
      let data: T[];
      let count: number | undefined;

      if (Array.isArray(responseData)) {
        // New API format: direct array (e.g., /flows returns array)
        data = responseData;
        count = responseData.length;
      } else if (responseData.data) {
        // BBC TAMS format: { data: [...], pagination: {...} }
        data = Array.isArray(responseData.data) ? responseData.data : [responseData.data];
        count = responseData.pagination?.count;
      } else if (responseData.sources) {
        // New API format: { sources: [...], count }
        data = responseData.sources;
        count = responseData.count;
      } else if (responseData.flows) {
        // Alternative format: { flows: [...], count }
        data = responseData.flows;
        count = responseData.count;
      } else {
        // Single object or unknown format
        data = [responseData];
        count = 1;
      }

      // Merge pagination info from headers and response
      const mergedPagination: BBCPaginationMeta = {
        ...pagination,
        count: count || pagination.count || data.length
      };

      return {
        data,
        pagination: mergedPagination,
        links
      };
    } catch (error: any) {
      // Re-throw if it's already an Error with a message
      if (error instanceof Error && error.message.includes('TAMS API error')) {
        throw error;
      }
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Network error: Could not connect to ${url}. Is the backend running on http://localhost:3000?`);
      }
      // Handle JSON parse errors
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON response from API: ${error.message}`);
      }
      // Re-throw other errors with more context
      const errorMsg = error?.message || String(error) || 'Unknown error';
      throw new Error(`TAMS API error: ${errorMsg}`);
    }
  }

  /**
   * BBC TAMS compliant POST request
   */
  async bbcTamsPost<T>(endpoint: string, body: any, options: BBCApiOptions = {}): Promise<T> {
    const queryString = buildBBCQueryString(options);
    const url = `${this.baseUrl}${endpoint}${queryString}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`TAMS API error: ${response.status} ${response.statusText || 'Bad Request'}`);
    }

    return response.json();
  }

  /**
   * BBC TAMS compliant PUT request
   */
  async bbcTamsPut<T>(endpoint: string, body: any, options: BBCApiOptions = {}): Promise<T> {
    const queryString = buildBBCQueryString(options);
    const url = `${this.baseUrl}${endpoint}${queryString}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`TAMS API error: ${response.status} ${response.statusText || 'Bad Request'}`);
    }

    return response.json();
  }

  /**
   * BBC TAMS compliant DELETE request
   */
  async bbcTamsDelete(endpoint: string, options: BBCApiOptions = {}): Promise<void> {
    const queryString = buildBBCQueryString(options);
    const url = `${this.baseUrl}${endpoint}${queryString}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`TAMS API error: ${response.status} ${response.statusText || 'Bad Request'}`);
    }
  }

  /**
   * BBC TAMS compliant HEAD request for metadata
   */
  async bbcTamsHead(endpoint: string, options: BBCApiOptions = {}): Promise<BBCPaginationMeta> {
    const queryString = buildBBCQueryString(options);
    const url = `${this.baseUrl}${endpoint}${queryString}`;
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`TAMS API error: ${response.status} ${response.statusText || 'Bad Request'}`);
    }

    return parseBBCHeaders(response.headers);
  }

  /**
   * Legacy request method for backward compatibility
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      // Handle empty responses
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async getHealth(): Promise<any> {
    const client = this.getApiClient();
    if (client) {
      return client.getHealth();
    }
    
    if (this.isIBCThiagoBackend()) {
      return getIBCThiagoHealth();
    }
    
    // Health endpoint returns a single object: { status, timestamp, services }
    // Use direct request since it's not a collection endpoint
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Health endpoint can return 200 (healthy) or 503 (degraded/unhealthy)
      // Both are valid responses, so we only throw on network errors
      if (!response.ok && response.status !== 503) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText || 'Bad Request'}`);
      }

      const healthData = await response.json();
      return healthData;
    } catch (error: any) {
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Network error: Could not connect to ${this.baseUrl}/health. Is the backend running on http://localhost:3000?`);
      }
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // Metrics
  async getMetrics(): Promise<any> {
    return this.request('/metrics');
  }

  // Service information
  async getService(): Promise<any> {
    return this.request('/service');
  }

  // Storage backends
  async getStorageBackends(): Promise<any> {
    return this.request('/service/storage-backends');
  }

  // Search - searches segments by marker descriptions
  // Note: Backend schema only accepts 'query' parameter (additionalProperties: false)
  // The backend uses default limit=10 and page=1
  async searchSegments(query: string, options: { limit?: number; page?: number } = {}): Promise<any> {
    await this.ensureApiClientInitialized();
    
    // Backend schema validation only allows 'query' parameter
    // Limit and page are not accepted by the schema, so we only send query
    const queryParams = new URLSearchParams();
    queryParams.append('query', query);
    
    const url = `${this.baseUrl}/search?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TAMS API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  // BBC TAMS Sources API
  async getSources(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    // Ensure API client is initialized before making the request
    await this.ensureApiClientInitialized();
    
    // Always use the service factory API client (monks_tams_api / vast-tams)
    const client = this.getApiClient();
    if (client) {
      return client.getSources(options);
    }
    
    // Fallback: ensure we're using vast-tams backend (monks_tams_api)
    // Remove IBC Thiago fallback - we only use monks_tams_api
    console.warn('API client not initialized after wait, using direct bbcTamsGet for vast-tams backend');
    return this.bbcTamsGet('/sources', options);
  }

  async getSource(id: string): Promise<any> {
    if (this.isIBCThiagoBackend()) {
      return getIBCThiagoSource(id);
    }
    return this.request(`/sources/${id}`);
  }

  async createSource(sourceId: string, source: any): Promise<any> {
    return this.request(`/sources/${sourceId}`, {
      method: 'POST',
      body: JSON.stringify(source),
    });
  }

  async updateSource(id: string, source: any): Promise<any> {
    return this.request(`/sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(source),
    });
  }

  async deleteSource(id: string, options: any): Promise<any> {
    const queryParams = new URLSearchParams();
    if (options.softDelete) queryParams.append('soft_delete', 'true');
    if (options.cascade) queryParams.append('cascade', 'true');
    if (options.deletedBy) queryParams.append('deleted_by', options.deletedBy);
    
    const endpoint = `/sources/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  async restoreSource(id: string): Promise<any> {
    return this.request(`/sources/${id}/restore`, {
      method: 'POST',
    });
  }

  // BBC TAMS Flows API
  async getFlows(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    if (this.isIBCThiagoBackend()) {
      return getIBCThiagoFlows(options);
    }
    return this.bbcTamsGet('/flows', options);
  }

  async getFlow(id: string): Promise<any> {
    if (this.isIBCThiagoBackend()) {
      return getIBCThiagoFlow(id);
    }
    return this.request(`/flows/${id}`);
  }

  async createFlow(flowId: string, flow: any): Promise<any> {
    return this.request(`/flows/${flowId}`, {
      method: 'POST',
      body: JSON.stringify(flow),
    });
  }

  async updateFlow(id: string, flow: any): Promise<any> {
    return this.request(`/flows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(flow),
    });
  }

  async deleteFlow(id: string, options: any): Promise<any> {
    const queryParams = new URLSearchParams();
    if (options.softDelete) queryParams.append('soft_delete', 'true');
    if (options.cascade) queryParams.append('cascade', 'true');
    if (options.deletedBy) queryParams.append('deleted_by', options.deletedBy);
    
    const endpoint = `/flows/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  async restoreFlow(id: string): Promise<any> {
    return this.request(`/flows/${id}/restore`, {
      method: 'POST',
    });
  }

  async cleanupFlow(id: string, hours: number = 24): Promise<any> {
    return this.request(`/flows/${id}/cleanup?hours=${hours}`, {
      method: 'DELETE',
    });
  }

  // BBC TAMS Flow Tags Management
  async getFlowTags(flowId: string): Promise<Record<string, string>> {
    return this.request(`/flows/${flowId}/tags`);
  }

  async setFlowTag(flowId: string, tagName: string, tagValue: string): Promise<any> {
    return this.request(`/flows/${flowId}/tags/${tagName}`, {
      method: 'PUT',
      body: JSON.stringify({ value: tagValue }),
    });
  }

  async deleteFlowTag(flowId: string, tagName: string): Promise<any> {
    return this.request(`/flows/${flowId}/tags/${tagName}`, {
      method: 'DELETE',
    });
  }

  // BBC TAMS Source Tags Management
  async getSourceTags(sourceId: string): Promise<Record<string, string>> {
    // Source tags are included in the source details response
    const source = await this.getSource(sourceId);
    return source.tags || {};
  }

  async setSourceTag(sourceId: string, tagName: string, tagValue: string): Promise<any> {
    // API expects array of values according to BBC TAMS spec
    return this.request(`/sources/${sourceId}/tags/${tagName}`, {
      method: 'PUT',
      body: JSON.stringify([tagValue]),
    });
  }

  async deleteSourceTag(sourceId: string, tagName: string): Promise<any> {
    return this.request(`/sources/${sourceId}/tags/${tagName}`, {
      method: 'DELETE',
    });
  }

  // BBC TAMS Flow Collection Management
  async getFlowCollection(flowId: string): Promise<any> {
    return this.request(`/flows/${flowId}/flow_collection`);
  }

  async setFlowCollection(flowId: string, collectionId: string): Promise<any> {
    return this.request(`/flows/${flowId}/flow_collection`, {
      method: 'PUT',
      body: JSON.stringify({ collection_id: collectionId }),
    });
  }

  async removeFlowFromCollection(flowId: string): Promise<any> {
    return this.request(`/flows/${flowId}/flow_collection`, {
      method: 'DELETE',
    });
  }

  // BBC TAMS Flow Read-Only Status Management
  async getFlowReadOnly(flowId: string): Promise<{ read_only: boolean }> {
    return this.request(`/flows/${flowId}/read_only`);
  }

  async setFlowReadOnly(flowId: string, readOnly: boolean): Promise<any> {
    return this.request(`/flows/${flowId}/read_only`, {
      method: 'PUT',
      body: JSON.stringify({ read_only: readOnly }),
    });
  }

  // BBC TAMS Flow Description Management
  async getFlowDescription(flowId: string): Promise<{ description: string }> {
    return this.request(`/flows/${flowId}/description`);
  }

  async setFlowDescription(flowId: string, description: string): Promise<any> {
    return this.request(`/flows/${flowId}/description`, {
      method: 'PUT',
      body: JSON.stringify({ description }),
    });
  }

  // BBC TAMS Flow Label Management
  async getFlowLabel(flowId: string): Promise<{ label: string }> {
    return this.request(`/flows/${flowId}/label`);
  }

  async setFlowLabel(flowId: string, label: string): Promise<any> {
    return this.request(`/flows/${flowId}/label`, {
      method: 'PUT',
      body: JSON.stringify({ label }),
    });
  }

  // BBC TAMS Source Label Management
  async setSourceLabel(sourceId: string, label: string): Promise<any> {
    return this.request(`/sources/${sourceId}/label`, {
      method: 'PUT',
      body: JSON.stringify({ label }),
    });
  }

  async deleteSourceLabel(sourceId: string): Promise<any> {
    return this.request(`/sources/${sourceId}/label`, {
      method: 'DELETE',
    });
  }

  async setSourceDescription(sourceId: string, description: string): Promise<any> {
    return this.request(`/sources/${sourceId}/description`, {
      method: 'PUT',
      body: JSON.stringify({ description }),
    });
  }

  async deleteSourceDescription(sourceId: string): Promise<any> {
    return this.request(`/sources/${sourceId}/description`, {
      method: 'DELETE',
    });
  }

  // BBC TAMS Segments API
  async getFlowStats(flowId: string): Promise<any> {
    return this.request(`/flows/${flowId}/stats`);
  }

  async getFlowSegments(flowId: string, options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    if (this.isIBCThiagoBackend()) {
      return getIBCThiagoFlowSegments(flowId, options);
    }
    return this.bbcTamsGet(`/flows/${flowId}/segments`, options);
  }

  async createFlowSegment(flowId: string, segment: any, file?: File): Promise<any> {
    if (file) {
      // Handle file upload with multipart form data
      const formData = new FormData();
      formData.append('segment_data', JSON.stringify(segment));
      formData.append('file', file);
      
      return this.request(`/flows/${flowId}/segments`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData, let the browser set it
        },
      });
    } else {
      // Handle JSON-only segment creation
      return this.request(`/flows/${flowId}/segments`, {
        method: 'POST',
        body: JSON.stringify(segment),
      });
    }
  }

  async deleteFlowSegments(flowId: string, options: any): Promise<any> {
    const queryParams = new URLSearchParams();
    if (options.timerange) queryParams.append('timerange', options.timerange);
    if (options.softDelete !== undefined) queryParams.append('soft_delete', options.softDelete.toString());
    if (options.deletedBy) queryParams.append('deleted_by', options.deletedBy);
    
    const endpoint = `/flows/${flowId}/segments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  async updateFlowSegment(flowId: string, segmentId: string, updates: any): Promise<any> {
    return this.request(`/flows/${flowId}/segments/${segmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // BBC TAMS Objects API
  async getObjects(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    return this.bbcTamsGet('/objects', options);
  }

  async getObject(id: string): Promise<any> {
    return this.request(`/objects/${id}`);
  }

  async createObject(object: any): Promise<any> {
    return this.request('/objects', {
      method: 'POST',
      body: JSON.stringify(object),
    });
  }

  async deleteObject(id: string, options: any): Promise<any> {
    const queryParams = new URLSearchParams();
    if (options.softDelete !== undefined) queryParams.append('soft_delete', options.softDelete.toString());
    if (options.deletedBy) queryParams.append('deleted_by', options.deletedBy);
    
    const endpoint = `/objects/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // QC (Quality Control) API
  async getQCStatistics(): Promise<any> {
    return this.request('/api/v1/qc/statistics');
  }

  async getQCFailedChunks(limit: number = 20, offset: number = 0): Promise<any> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    if (offset) queryParams.append('offset', offset.toString());
    const endpoint = `/api/v1/qc/failed-chunks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getQCMarkersForFlow(flowId: string): Promise<any> {
    return this.request(`/api/v1/flows/${flowId}/qc-markers`);
  }

  async getQCByQuality(min: number = 0, max: number = 100): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append('min', min.toString());
    queryParams.append('max', max.toString());
    return this.request(`/api/v1/qc/by-quality?${queryParams.toString()}`);
  }

  // BBC TAMS Field Operations API
  async getFieldValue<T = any>(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    options?: BBCApiOptions
  ): Promise<T> {
    const url = `/${entityType}/${entityId}/${fieldKey}`;
    const response = await this.bbcTamsGet<T>(url, options);
    return response.data as T;
  }

  async updateFieldValue<T = any>(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    value: T,
    options?: BBCApiOptions
  ): Promise<BBCApiResponse<T>> {
    const url = `/${entityType}/${entityId}/${fieldKey}`;
    const response = await this.bbcTamsPut<T>(url, value, options);
    return response as unknown as BBCApiResponse<T>;
  }

  async deleteField(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    options?: BBCApiOptions
  ): Promise<BBCApiResponse<void>> {
    const url = `/${entityType}/${entityId}/${fieldKey}`;
    const response = await this.bbcTamsDelete(url, options);
    return response as unknown as BBCApiResponse<void>;
  }

  async getFieldMetadata(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    fieldKey: string,
    options?: BBCApiOptions
  ): Promise<BBCApiResponse<any>> {
    const url = `/${entityType}/${entityId}/${fieldKey}`;
    const response = await this.bbcTamsHead(url, options);
    return response as unknown as BBCApiResponse<any>;
  }

  // Get all available fields for an entity
  async getEntityFields(
    entityType: 'flows' | 'sources' | 'segments',
    entityId: string,
    options?: BBCApiOptions
  ): Promise<string[]> {
    try {
      // Try to get field information from HEAD request
      const response = await this.bbcTamsHead(`/${entityType}/${entityId}`, options);
      
      // For now, return common BBC TAMS fields since the backend might not expose field discovery yet
      const commonFields = [
        'label',
        'description', 
        'format',
        'codec',
        'frame_width',
        'frame_height',
        'frame_rate',
        'sample_rate',
        'channels',
        'max_bit_rate',
        'tags',
        'created',
        'updated'
      ];
      
      console.log('Using common BBC TAMS fields for', entityType, entityId);
      return commonFields;
      
    } catch (error) {
      console.warn('Could not retrieve entity fields from backend, using fallback:', error);
      
      // Fallback to common fields if backend doesn't support field discovery
      const fallbackFields = [
        'label',
        'description',
        'format',
        'codec',
        'tags'
      ];
      
      return fallbackFields;
    }
  }

  // Analytics
  async getFlowUsageAnalytics(): Promise<any> {
    return this.request('/analytics/flow-usage');
  }

  async getStorageUsageAnalytics(): Promise<any> {
    return this.request('/analytics/storage-usage');
  }

  async getTimeRangeAnalytics(): Promise<any> {
    return this.request('/analytics/time-range-analysis');
  }

  // BBC TAMS Webhooks API
  async getWebhooks(options: BBCApiOptions = {}): Promise<BBCApiResponse<any>> {
    return this.bbcTamsGet('/service/webhooks', options);
  }

  async createWebhook(webhookData: {
    url: string;
    events: string[];
    api_key_name?: string;
    api_key_value?: string;
    owner_id?: string;
  }): Promise<any> {
    return this.bbcTamsPost('/service/webhooks', webhookData);
  }

  async updateWebhook(
    webhookId: string,
    webhookData: {
      url: string;
      events: string[];
      api_key_name?: string;
      api_key_value?: string;
      owner_id?: string;
    }
  ): Promise<any> {
    return this.bbcTamsPut(`/service/webhooks/${webhookId}`, webhookData);
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    return this.bbcTamsDelete(`/service/webhooks/${webhookId}`);
  }

  async testWebhook(webhookId: string): Promise<any> {
    return this.request(`/service/webhooks/${webhookId}/test`, {
      method: 'POST',
    });
  }

  async getWebhookHistory(webhookId: string): Promise<any> {
    return this.request(`/service/webhooks/${webhookId}/history`);
  }

  async getWebhookStats(webhookId: string): Promise<any> {
    return this.request(`/service/webhooks/${webhookId}/stats`);
  }

  async getWebhookEventTypes(): Promise<string[]> {
    try {
      const response = await this.request<{ events?: string[] }>('/service/webhook-events');
      return response.events || [];
    } catch (error) {
      console.warn('Could not retrieve webhook event types, using fallback:', error);
      // Fallback to common BBC TAMS webhook events
      return [
        'flow.created',
        'flow.updated',
        'flow.deleted',
        'source.created',
        'source.updated',
        'source.deleted',
        'segment.created',
        'segment.updated',
        'segment.deleted'
      ];
    }
  }

  // OpenAPI specification
  async getOpenApiSpec(): Promise<any> {
    return this.request('/openapi.json');
  }

  // Root endpoints
  async getRootEndpoints(): Promise<string[]> {
    return this.request('/');
  }

  // IBC Thiago specific methods
  async getHLSManifest(flowId: string): Promise<any> {
    if (this.isIBCThiagoBackend()) {
      return getIBCThiagoHLSManifest(flowId);
    }
    throw new Error('HLS manifest not supported by current backend');
  }

  async createMarker(markerData: any): Promise<any> {
    if (this.isIBCThiagoBackend()) {
      return createIBCThiagoMarker(markerData);
    }
    throw new Error('Marker creation not supported by current backend');
  }

  async updateMarker(markerId: string, updates: any): Promise<any> {
    if (this.isIBCThiagoBackend()) {
      return updateIBCThiagoMarker(markerId, updates);
    }
    throw new Error('Marker updates not supported by current backend');
  }

  async deleteMarker(markerId: string): Promise<void> {
    if (this.isIBCThiagoBackend()) {
      return deleteIBCThiagoMarker(markerId);
    }
    throw new Error('Marker deletion not supported by current backend');
  }

  async getStorage(flowId: string): Promise<any> {
    if (this.isIBCThiagoBackend()) {
      return getIBCThiagoStorage(flowId);
    }
    return this.request(`/flows/${flowId}/storage`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  }

  // WebSocket management for IBC Thiago
  connectWebSocket(): Promise<void> {
    if (this.isIBCThiagoBackend()) {
      return ibcThiagoWebSocket.connect();
    }
    throw new Error('WebSocket not supported by current backend');
  }

  disconnectWebSocket(): void {
    if (this.isIBCThiagoBackend()) {
      ibcThiagoWebSocket.disconnect();
    }
  }

  subscribeToWebSocket(eventType: string, callback: (data: any) => void): void {
    if (this.isIBCThiagoBackend()) {
      ibcThiagoWebSocket.subscribe(eventType, callback);
    }
  }

  unsubscribeFromWebSocket(eventType: string, callback: (data: any) => void): void {
    if (this.isIBCThiagoBackend()) {
      ibcThiagoWebSocket.unsubscribe(eventType, callback);
    }
  }

  isWebSocketConnected(): boolean {
    if (this.isIBCThiagoBackend()) {
      return ibcThiagoWebSocket.isConnected();
    }
    return false;
  }

  // Utility methods for IBC Thiago
  extractMarkersFromSource(source: any): any[] {
    if (this.isIBCThiagoBackend()) {
      return extractMarkersFromSource(source);
    }
    return [];
  }

  extractVideoFlowsFromSource(source: any): any[] {
    if (this.isIBCThiagoBackend()) {
      return extractVideoFlowsFromSource(source);
    }
    return source.flows || [];
  }

  isMarkerFlow(flow: any): boolean {
    if (this.isIBCThiagoBackend()) {
      return isMarkerFlow(flow);
    }
    return false;
  }

  getMarkerColor(marker: any): string {
    if (this.isIBCThiagoBackend()) {
      return getMarkerColor(marker);
    }
    return '#00ff00';
  }

  getMarkerDisplayType(marker: any): string {
    if (this.isIBCThiagoBackend()) {
      return getMarkerDisplayType(marker);
    }
    return 'square';
  }

  isMarkerEditable(marker: any): boolean {
    if (this.isIBCThiagoBackend()) {
      return isMarkerEditable(marker);
    }
    return true;
  }
}

// Export singleton instance
export const apiClient = new UnifiedApiClient();

// Export types for use in components
export type { 
  ApiResponse, 
  PaginatedResponse
};
export { UnifiedApiClient };

// Legacy exports for backward compatibility
export { apiClient as legacyApiClient };
