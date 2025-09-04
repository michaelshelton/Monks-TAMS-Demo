/**
 * S3 Proxy Utilities for VAST TAMS
 * 
 * Handles proxying S3 requests through SSH tunnels or other proxy methods
 * for accessing internal S3 storage in development environments.
 */

/**
 * Check if we're in development mode and need to proxy S3 requests
 */
export function isDevelopmentMode(): boolean {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
}

/**
 * Get the proxy base URL for S3 requests
 */
export function getS3ProxyBaseUrl(): string {
  if (isDevelopmentMode()) {
    // Use localhost tunnel port
    return 'http://localhost:8080';
  }
  return '';
}

/**
 * Transform S3 URL to use proxy in development
 */
export function transformS3Url(originalUrl: string): string {
  if (!isDevelopmentMode()) {
    return originalUrl;
  }

  // Extract the path from the original URL
  try {
    const url = new URL(originalUrl);
    const proxyBase = getS3ProxyBaseUrl();
    
    // Reconstruct URL with proxy base
    return `${proxyBase}${url.pathname}${url.search}`;
  } catch (error) {
    console.warn('Failed to transform S3 URL:', error);
    return originalUrl;
  }
}

/**
 * Check if a URL is an S3 URL that needs proxying
 */
export function isS3Url(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('10.0.11.54') || 
           urlObj.hostname.includes('100.100.0.2') ||
           urlObj.pathname.includes('/tams-s3/');
  } catch {
    return false;
  }
}

/**
 * Transform segment URLs for development proxy
 */
export function transformSegmentUrls(segment: any): any {
  if (!segment.get_urls || !isDevelopmentMode()) {
    return segment;
  }

  return {
    ...segment,
    get_urls: segment.get_urls.map((urlObj: any) => ({
      ...urlObj,
      url: isS3Url(urlObj.url) ? transformS3Url(urlObj.url) : urlObj.url
    }))
  };
}
