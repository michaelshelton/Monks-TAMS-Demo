/**
 * API Service Layer for TAMS Frontend
 * Handles all communication with the backend API
 */

const API_BASE_URL = 'http://localhost:8000';

// Generic API response types
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

// API Client class
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

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
    return this.request('/health');
  }

  // Metrics
  async getMetrics(): Promise<any> {
    return this.request('/metrics');
  }

  // Service information
  async getService(): Promise<any> {
    return this.request('/service');
  }

  // Sources
  async getSources(params?: {
    page?: number;
    page_size?: number;
    show_deleted?: boolean;
    [key: string]: any;
  }): Promise<PaginatedResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/sources${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getSource(id: string): Promise<any> {
    return this.request(`/sources/${id}`);
  }

  async createSource(source: any): Promise<any> {
    return this.request('/sources', {
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

  // Flows
  async getFlows(): Promise<PaginatedResponse<any>> {
    return this.request('/flows');
  }

  async getFlow(id: string): Promise<any> {
    return this.request(`/flows/${id}`);
  }

  async createFlow(flow: any): Promise<any> {
    return this.request('/flows', {
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

  // Objects
  async getObjects(params?: {
    page?: number;
    page_size?: number;
    show_deleted?: boolean;
    [key: string]: any;
  }): Promise<PaginatedResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/objects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
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

  // Segments
  async getFlowSegments(flowId: string, params?: {
    timerange?: string;
    [key: string]: any;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/flows/${flowId}/segments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
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

  // Webhooks
  async getWebhooks(): Promise<PaginatedResponse<any>> {
    return this.request('/service/webhooks');
  }

  async createWebhook(webhook: any): Promise<any> {
    return this.request('/service/webhooks', {
      method: 'POST',
      body: JSON.stringify(webhook),
    });
  }

  // OpenAPI specification
  async getOpenApiSpec(): Promise<any> {
    return this.request('/openapi.json');
  }

  // Root endpoints
  async getRootEndpoints(): Promise<string[]> {
    return this.request('/');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types for use in components
export type { ApiResponse, PaginatedResponse };
export { ApiClient };
