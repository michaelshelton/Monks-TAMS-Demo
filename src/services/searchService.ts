// Search Service - Real BBC TAMS API Integration
// Handles search queries, results, and content discovery using real backend endpoints

import { apiClient, BBCApiOptions, BBCApiResponse } from './api';

// Search result interface for real API data
export interface SearchResult {
  id: string;
  type: 'segment' | 'flow' | 'source';
  title: string;
  description?: string;
  contentInfo: {
    category: string;
    contentType: string;
    organization: string;
    date: string;
    venue?: string;
  };
  timing: {
    start: string;
    end: string;
    duration: number; // seconds
  };
  metadata: {
    format: string;
    quality: string;
    tags: Record<string, string>;
  };
  thumbnail?: string;
  // Presigned URLs from backend
  get_urls?: Array<{
    url: string;
    label: string;
  }>;
  // Legacy field for backward compatibility
  previewUrl?: string;
}

// Search query interface
export interface SearchQuery {
  query: string;
  searchMode: 'basic' | 'advanced' | 'flow' | 'ai';
  aiSearchEnabled: boolean;
  aiConfidence: number;
  category?: string;
  contentType?: string;
  organization?: string;
  format?: string | undefined;
  timerange?: string | undefined;
  codec?: string | undefined;
  searchStrategy: {
    sources: boolean;
    flows: boolean;
    segments: boolean;
    searchOrder: 'bbc-tams' | 'custom';
    customOrder?: ('sources' | 'flows' | 'segments')[];
    deduplication: boolean;
    relationshipMapping: boolean;
  };
}

// Search response interface
export interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
  };
}

// Convert BBC TAMS flow data to SearchResult format
function convertFlowToSearchResult(flow: any): SearchResult {
  return {
    id: flow.id,
    type: 'flow',
    title: flow.label || flow.name || `Flow ${flow.id}`,
    description: flow.description || 'Media content flow',
    contentInfo: {
      category: flow.tags?.category || flow.tags?.content_category || 'General',
      contentType: flow.tags?.content_type || flow.tags?.type || 'Media',
      organization: flow.tags?.organization || flow.tags?.company || 'Unknown',
      date: flow.tags?.date || flow.tags?.created_date || 'Unknown',
      venue: flow.tags?.venue || flow.tags?.location
    },
    timing: {
      start: flow.tags?.start_time || '00:00:00',
      end: flow.tags?.end_time || '00:00:00',
      duration: flow.tags?.duration || flow.tags?.content_duration || 60 * 60 // 1 hour default
    },
    metadata: {
      format: flow.format || 'video/h264',
      quality: flow.tags?.quality || flow.tags?.resolution || '1080p',
      tags: flow.tags || {}
    },
    thumbnail: flow.tags?.thumbnail || `https://via.placeholder.com/320x180/1f2937/ffffff?text=${encodeURIComponent(flow.label || 'Flow')}`,
    // Use presigned URLs if available, fallback to legacy fields
    get_urls: flow.get_urls || undefined,
    previewUrl: flow.get_urls?.[0]?.url || flow.tags?.preview_url || flow.tags?.video_url || flow.tags?.media_url || flow.tags?.stream_url || flow.tags?.file_url
  };
}

// Convert BBC TAMS segment data to SearchResult format
function convertSegmentToSearchResult(segment: any, flowData?: any): SearchResult {
  const flowTags = flowData?.tags || {};
  
  return {
    id: segment.id,
    type: 'segment',
    title: segment.label || segment.name || `Segment ${segment.id}`,
    description: segment.description || 'Media segment',
    contentInfo: {
      category: segment.tags?.category || flowTags.category || flowTags.content_category || 'General',
      contentType: segment.tags?.content_type || flowTags.content_type || flowTags.type || 'Media',
      organization: segment.tags?.organization || flowTags.organization || flowTags.company || 'Unknown',
      date: segment.tags?.date || flowTags.date || flowTags.created_date || 'Unknown',
      venue: segment.tags?.venue || flowTags.venue || flowTags.location
    },
    timing: {
      start: segment.timerange?.start || segment.tags?.start_time || '00:00:00',
      end: segment.timerange?.end || segment.tags?.end_time || '00:00:00',
      duration: segment.timerange?.duration || segment.tags?.duration || 30 // 30 seconds default
    },
    metadata: {
      format: segment.format || flowData?.format || 'video/h264',
      quality: segment.tags?.quality || flowTags.quality || flowTags.resolution || '1080p',
      tags: { ...flowTags, ...segment.tags }
    },
    thumbnail: segment.tags?.thumbnail || `https://via.placeholder.com/320x180/1f2937/ffffff?text=${encodeURIComponent(segment.label || 'Segment')}`,
    // Use presigned URLs if available, fallback to legacy fields
    get_urls: segment.get_urls || undefined,
    previewUrl: segment.get_urls?.[0]?.url || segment.tags?.preview_url || segment.tags?.video_url || segment.content_url || segment.media_url || segment.stream_url || segment.file_url
  };
}

// Convert BBC TAMS source data to SearchResult format
function convertSourceToSearchResult(source: any): SearchResult {
  return {
    id: source.id,
    type: 'source',
    title: source.label || source.name || `Source ${source.id}`,
    description: source.description || 'Original content source',
    contentInfo: {
      category: source.tags?.category || source.tags?.content_category || 'General',
      contentType: source.tags?.content_type || source.tags?.type || 'Media',
      organization: source.tags?.organization || source.tags?.company || 'Unknown',
      date: source.tags?.date || source.tags?.created_date || 'Unknown',
      venue: source.tags?.venue || source.tags?.location
    },
    timing: {
      start: source.tags?.start_time || '00:00:00',
      end: source.tags?.end_time || '00:00:00',
      duration: source.tags?.duration || source.tags?.content_duration || 60 * 60 // 1 hour default
    },
    metadata: {
      format: source.format || 'video/h264',
      quality: source.tags?.quality || source.tags?.resolution || '1080p',
      tags: source.tags || {}
    },
    thumbnail: source.tags?.thumbnail || `https://via.placeholder.com/320x180/1f2937/ffffff?text=${encodeURIComponent(source.label || 'Source')}`,
    // Use presigned URLs if available, fallback to legacy fields
    get_urls: source.get_urls || undefined,
    previewUrl: source.get_urls?.[0]?.url || source.tags?.preview_url || source.tags?.video_url || source.tags?.media_url || source.tags?.stream_url || source.tags?.file_url
  };
}

// Build BBC TAMS API options from search query
function buildSearchOptions(query: SearchQuery): BBCApiOptions {
  const options: BBCApiOptions = {
    limit: 50, // Default limit
    tags: {},
    tagExists: {}
  };

  // Add basic filters based on VAST TAMS API capabilities
  if (query.category) {
    options.tags!['category'] = query.category;
  }
  
  if (query.contentType) {
    options.tags!['content_type'] = query.contentType;
  }
  
  if (query.organization) {
    options.tags!['organization'] = options.tags!['company'] = query.organization;
  }
  
  if (query.timerange) {
    options.timerange = query.timerange;
  }
  
  if (query.format && query.format.trim() !== '') {
    // Map generic format names to proper API format values
    const formatMapping: Record<string, string> = {
      'video': 'urn:x-nmos:format:video',
      'audio': 'urn:x-nmos:format:audio',
      'data': 'urn:x-nmos:format:data',
      'image': 'urn:x-nmos:format:image'
    };
    const mappedFormat = formatMapping[query.format] || query.format;
    options.format = mappedFormat;
    console.log('🔍 Search Service: Format mapping:', query.format, '->', mappedFormat);
  }
  
  if (query.codec) {
    options.codec = query.codec;
  }

  // Add common media content tags
  if (query.query) {
    // Use the search query as a label filter for better matching
    // options.label = query.query; // Not supported in BBCApiOptions
  }
  
  console.log('🔍 Search Service: Final search options being sent to API:', options);
  
  return options;
}

// Perform search using BBC TAMS API
export async function performSearch(query: SearchQuery, page: number = 1, limit: number = 20): Promise<SearchResponse> {
  const startTime = Date.now();
  console.log('🔍 Search Service: Starting search with query:', query);
  
  const searchOptions = buildSearchOptions(query);
  console.log('🔍 Search Service: Built search options:', searchOptions);
  
  searchOptions.limit = limit;
  console.log('🔍 Search Service: Set limit to:', limit);
  
  // Add pagination cursor if not first page
  if (page > 1) {
    // For now, we'll use a simple offset-based approach
    // In production, this should use proper cursor-based pagination
    searchOptions.page = `page_${page}`;
  }

  try {
    const results: SearchResult[] = [];
    let totalResults = 0;
    let hasNextPage = false;
    let hasPreviousPage = false;
    let nextCursor: string | undefined;
    let previousCursor: string | undefined;

    // Execute search based on strategy
    if (query.searchStrategy.sources) {
      try {
        const sourcesResponse = await apiClient.getSources(searchOptions);
        console.log('🔍 Search Service: Sources API response:', sourcesResponse);
        
        const sourceResults = sourcesResponse.data.map(convertSourceToSearchResult);
        console.log('🔍 Search Service: Converted source results:', sourceResults);
        
        results.push(...sourceResults);
        totalResults += sourcesResponse.data.length;
        
        // Update pagination info
        if (sourcesResponse.pagination) {
          hasNextPage = hasNextPage || !!sourcesResponse.pagination.nextKey;
          hasPreviousPage = hasPreviousPage || !!sourcesResponse.pagination.prevKey;
          nextCursor = nextCursor || sourcesResponse.pagination.nextKey;
          previousCursor = previousCursor || sourcesResponse.pagination.prevKey;
        }
      } catch (error) {
        console.warn('Failed to search sources:', error);
      }
    }

    if (query.searchStrategy.flows) {
      try {
        console.log('🔍 Search Service: Searching flows with options:', searchOptions);
        const flowsResponse = await apiClient.getFlows(searchOptions);
        console.log('🔍 Search Service: Flows API response:', flowsResponse);
        const flowResults = flowsResponse.data.map(convertFlowToSearchResult);
        console.log('🔍 Search Service: Converted flow results:', flowResults);
        results.push(...flowResults);
        totalResults += flowsResponse.data.length;
        
        // Update pagination info
        if (flowsResponse.pagination) {
          hasNextPage = hasNextPage || !!flowsResponse.pagination.nextKey;
          hasPreviousPage = hasPreviousPage || !!flowsResponse.pagination.prevKey;
          nextCursor = nextCursor || flowsResponse.pagination.nextKey;
          previousCursor = previousCursor || flowsResponse.pagination.prevKey;
        }
      } catch (error) {
        console.warn('Failed to search flows:', error);
      }
    }

    if (query.searchStrategy.segments) {
      try {
        // Use the actual /search endpoint which searches segments by marker descriptions
        if (query.query && query.query.trim().length > 0) {
          const searchResponse = await apiClient.searchSegments(query.query, {
            limit: limit,
            page: page
          });
          
          console.log('🔍 Search Service: Search API response:', searchResponse);
          
          // The backend returns { items: [{ _id, word_count, words, result: [segments], thumbnail }], page, limit }
          // Each item contains segments that matched the query words
          const segmentResults: SearchResult[] = [];
          const seenSegmentIds = new Set<string>();
          
          if (searchResponse.items && Array.isArray(searchResponse.items)) {
            for (const item of searchResponse.items) {
              if (item.result && Array.isArray(item.result)) {
                for (const segment of item.result) {
                  // Avoid duplicates (same segment might appear in multiple items)
                  const segmentId = segment.id || segment._id || segment.object_id;
                  if (segmentId && !seenSegmentIds.has(segmentId)) {
                    seenSegmentIds.add(segmentId);
                    
                    // Convert backend segment format to SearchResult
                    // The segment has flow_id, object_id, and other fields
                    const searchResult = convertSegmentToSearchResult(segment);
                    
                    // Use thumbnail from item if available
                    if (item.thumbnail) {
                      searchResult.thumbnail = item.thumbnail;
                      searchResult.previewUrl = item.thumbnail;
                    }
                    
                    segmentResults.push(searchResult);
                  }
                }
              }
            }
          }
          
          results.push(...segmentResults);
          totalResults = segmentResults.length;
          
          console.log('🔍 Search Service: Converted segment results:', segmentResults);
        } else {
          // If no query, fall back to getting segments from flows (but this isn't really "search")
          console.warn('No search query provided, cannot use /search endpoint');
        }
      } catch (error) {
        console.warn('Failed to search segments:', error);
        // If search endpoint fails, try fallback approach
        try {
          const flowsResponse = await apiClient.getFlows(searchOptions);
          for (const flow of flowsResponse.data.slice(0, 5)) {
            try {
              const segmentsResponse = await apiClient.getFlowSegments(flow.id, searchOptions);
              const segmentResults = segmentsResponse.data.map(segment => 
                convertSegmentToSearchResult(segment, flow)
              );
              results.push(...segmentResults);
              totalResults += segmentsResponse.data.length;
            } catch (err) {
              console.warn(`Failed to get segments for flow ${flow.id}:`, err);
            }
          }
        } catch (fallbackError) {
          console.warn('Fallback segment search also failed:', fallbackError);
        }
      }
    }

    // Apply deduplication if enabled
    let finalResults = results;
    if (query.searchStrategy.deduplication) {
      const seen = new Set<string>();
      finalResults = results.filter(result => {
        const key = `${result.type}-${result.id}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    }

    // Sort results by relevance (simple implementation)
    finalResults.sort((a, b) => {
      // Prioritize segments, then flows, then sources
      const typePriority = { segment: 3, flow: 2, source: 1 };
      return typePriority[b.type] - typePriority[a.type];
    });

    const searchTime = Date.now() - startTime;
    
    console.log('🔍 Search Service: Final results:', finalResults);
    console.log('🔍 Search Service: Total results:', finalResults.length);
    console.log('🔍 Search Service: Search time:', searchTime);

    return {
      results: finalResults,
      totalResults: finalResults.length,
      searchTime,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(finalResults.length / limit),
        hasNextPage,
        hasPreviousPage,
        ...(nextCursor && { nextCursor }),
        ...(previousCursor && { previousCursor })
      }
    };

  } catch (error) {
    console.error('Search failed:', error);
    throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}



// Get specific flow details for video playback using REAL API
export async function getFlowDetails(flowId: string): Promise<any> {
  try {
    return await apiClient.getFlow(flowId);
  } catch (error) {
    console.error('Failed to get flow details:', error);
    throw error;
  }
}

// Get segment content URL for video playback using REAL API
export async function getSegmentContentUrl(flowId: string, segmentId: string): Promise<string> {
  try {
    const segment = await apiClient.getFlowSegments(flowId, {});
    
    // Find the specific segment
    const targetSegment = segment.data.find((s: any) => s.id === segmentId);
    if (!targetSegment) {
      throw new Error(`Segment ${segmentId} not found in flow ${flowId}`);
    }
    
    // Return the presigned URL for video playback
    if (targetSegment.get_urls && targetSegment.get_urls.length > 0) {
      // Find the GET URL (for video playback)
      const getUrl = targetSegment.get_urls.find((url: any) => url.label.includes('GET'));
      if (getUrl) {
        return getUrl.url;
      }
    }
    
    // Fallback to legacy URL fields
    const contentUrl = targetSegment.content_url || 
                      targetSegment.video_url || 
                      targetSegment.url || 
                      targetSegment.media_url ||
                      targetSegment.stream_url ||
                      targetSegment.file_url ||
                      '';
    
    return contentUrl;
  } catch (error) {
    console.error('Failed to get segment content URL:', error);
    throw error;
  }
}

// Get available media sources
export async function getMediaSources(): Promise<SearchResult[]> {
  try {
    const options: BBCApiOptions = {
      limit: 20
    };

    const sourcesResponse = await apiClient.getSources(options);
    return sourcesResponse.data.map(convertSourceToSearchResult);
  } catch (error) {
    console.error('Failed to get media sources:', error);
    // Return empty array on error to prevent UI crashes
    return [];
  }
}
