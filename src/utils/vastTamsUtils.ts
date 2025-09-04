/**
 * VAST TAMS Utility Functions
 * 
 * Helper functions for working with VAST TAMS API data structures
 * and converting them to formats compatible with existing video players
 */

import { VastTamsSegment } from '../services/vastTamsApi';

/**
 * Extract video playback URL from VAST TAMS segment
 * Returns the GET URL for video playback
 */
export function getSegmentPlaybackUrl(segment: VastTamsSegment): string | null {
  if (!segment.get_urls || segment.get_urls.length === 0) {
    return null;
  }

  // Find the GET URL for video playback
  const getUrl = segment.get_urls.find(url => 
        url.label?.toLowerCase().includes('get') &&
    !url.label?.toLowerCase().includes('head')
  );

  return getUrl ? getUrl.url : null;
}

/**
 * Extract metadata URL from VAST TAMS segment
 * Returns the HEAD URL for metadata retrieval
 */
export function getSegmentMetadataUrl(segment: VastTamsSegment): string | null {
  if (!segment.get_urls || segment.get_urls.length === 0) {
    return null;
  }

  // Find the HEAD URL for metadata
  const headUrl = segment.get_urls.find(url => 
    url.label?.toLowerCase().includes('head')
  );

  return headUrl ? headUrl.url : null;
}

/**
 * Get all available URLs from VAST TAMS segment
 * Returns an object with both GET and HEAD URLs
 */
export function getAllSegmentUrls(segment: VastTamsSegment): {
  playbackUrl: string | null;
  metadataUrl: string | null;
  allUrls: Array<{ url: string; label: string | undefined; type: 'GET' | 'HEAD' }>;
} {
  const allUrls = segment.get_urls?.map(url => ({
    url: url.url,
    label: url.label,
    type: url.label?.toLowerCase().includes('head') ? 'HEAD' as const : 'GET' as const
  })) || [];

  return {
    playbackUrl: getSegmentPlaybackUrl(segment),
    metadataUrl: getSegmentMetadataUrl(segment),
    allUrls
  };
}

/**
 * Check if a segment has valid video URLs
 */
export function hasValidVideoUrls(segment: VastTamsSegment): boolean {
  return getSegmentPlaybackUrl(segment) !== null;
}

/**
 * Get segment metadata for display
 */
export function getSegmentDisplayInfo(segment: VastTamsSegment): {
  id: string;
  title: string;
  description: string;
  duration: string;
  format: string;
  codec: string;
  size: string;
  hasVideo: boolean;
  hasMetadata: boolean;
} {
  const urls = getAllSegmentUrls(segment);
  
  // Parse timerange to get duration
  let duration = 'Unknown';
  if (segment.timerange) {
    try {
      // Handle ISO 8601 duration format or start/end format
      if (segment.timerange.includes('/')) {
        const [start, end] = segment.timerange.split('/');
        if (start && end) {
          const startTime = new Date(start);
          const endTime = new Date(end);
          const durationMs = endTime.getTime() - startTime.getTime();
          duration = formatDuration(durationMs);
        }
      } else {
        // Assume it's a duration string
        duration = segment.timerange;
      }
    } catch (error) {
      console.warn('Failed to parse timerange:', error);
    }
  }

  // Format file size
  const size = segment.size ? formatFileSize(segment.size) : 'Unknown';

  return {
    id: segment.id,
    title: segment.id, // Use ID as title if no label
    description: `Segment ${segment.id}`,
    duration,
    format: segment.format || 'Unknown',
    codec: segment.codec || 'Unknown',
    size,
    hasVideo: urls.playbackUrl !== null,
    hasMetadata: urls.metadataUrl !== null
  };
}

/**
 * Format duration in milliseconds to human readable format
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  } else if (minutes > 0) {
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format file size in bytes to human readable format
 */
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Convert VAST TAMS segment to legacy format for backward compatibility
 * This allows existing video players to work with VAST TAMS data
 */
export function convertVastTamsSegmentToLegacy(segment: VastTamsSegment): {
  id: string;
  url: string;
  title: string;
  description: string;
  format: string;
  codec: string;
  size: number;
  timerange: string;
  tags: Record<string, any>;
} {
  const playbackUrl = getSegmentPlaybackUrl(segment);
  
  if (!playbackUrl) {
    throw new Error(`No playback URL available for segment ${segment.id}`);
  }

  return {
    id: segment.id,
    url: playbackUrl,
    title: segment.id,
    description: `VAST TAMS Segment ${segment.id}`,
    format: segment.format || 'video/mp4',
    codec: segment.codec || 'h264',
    size: segment.size || 0,
    timerange: segment.timerange,
    tags: segment.tags || {}
  };
}

/**
 * Validate VAST TAMS segment data
 */
export function validateVastTamsSegment(segment: any): segment is VastTamsSegment {
  return (
    segment &&
    typeof segment.id === 'string' &&
    typeof segment.timerange === 'string' &&
    Array.isArray(segment.get_urls) &&
    segment.get_urls.length > 0 &&
    segment.get_urls.every((url: any) => 
      typeof url.url === 'string' && 
      typeof url.label === 'string'
    )
  );
}

/**
 * Get segment quality information from tags
 */
export function getSegmentQuality(segment: VastTamsSegment): {
  quality: 'low' | 'medium' | 'high';
  resolution: string;
  bitrate: number | null;
} {
  const tags = segment.tags || {};
  
  // Try to determine quality from various tag fields
  let quality: 'low' | 'medium' | 'high' = 'medium';
  let resolution = 'Unknown';
  let bitrate: number | null = null;

  // Check for quality indicators
  if (tags.quality) {
    const qualityStr = tags.quality.toLowerCase();
    if (qualityStr.includes('low') || qualityStr.includes('360')) {
      quality = 'low';
    } else if (qualityStr.includes('medium') || qualityStr.includes('720')) {
      quality = 'medium';
    } else if (qualityStr.includes('high') || qualityStr.includes('1080') || qualityStr.includes('uhd') || qualityStr.includes('4k')) {
      quality = 'high';
    }
  }

  // Check for resolution
  if (tags.resolution) {
    resolution = tags.resolution;
  } else if (tags.frame_width && tags.frame_height) {
    resolution = `${tags.frame_width}x${tags.frame_height}`;
  }

  // Check for bitrate
  if (tags.bitrate) {
    bitrate = parseInt(tags.bitrate);
  } else if (tags.max_bit_rate) {
    bitrate = parseInt(tags.max_bit_rate);
  }

  return { quality, resolution, bitrate };
}

/**
 * Create video source array for adaptive streaming
 */
export function createVideoSources(segment: VastTamsSegment): Array<{
  url: string;
  quality: 'low' | 'medium' | 'high';
  format: string;
  bitrate: number;
}> {
  const playbackUrl = getSegmentPlaybackUrl(segment);
  if (!playbackUrl) {
    return [];
  }

  const qualityInfo = getSegmentQuality(segment);
  
  return [{
    url: playbackUrl,
    quality: qualityInfo.quality,
    format: segment.format || 'video/mp4',
    bitrate: qualityInfo.bitrate || 1000000
  }];
}
