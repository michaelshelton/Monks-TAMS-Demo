// Search Service - Real BBC TAMS API Integration
// Handles search queries, results, and content discovery

import { 
  getFlows, 
  getFlowSegments, 
  getSources, 
  BBCApiOptions, 
  BBCApiResponse 
} from './bbcTamsApi';

// Search result interface for real API data
export interface SearchResult {
  id: string;
  type: 'segment' | 'flow' | 'source';
  title: string;
  description?: string;
  gameInfo: {
    homeTeam: string;
    awayTeam: string;
    date: string;
    venue: string;
    score?: string;
  };
  playerInfo?: {
    number: string;
    name: string;
    team: string;
    position: string;
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
  previewUrl?: string;
}

// Search query interface
export interface SearchQuery {
  query: string;
  searchMode: 'basic' | 'advanced' | 'flow' | 'ai';
  aiSearchEnabled: boolean;
  aiConfidence: number;
  playerNumber?: string;
  playerName?: string;
  team?: string;
  eventType?: string | undefined;
  timerange?: string | undefined;
  format?: string | undefined;
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
    description: flow.description || 'Football game flow',
    gameInfo: {
      homeTeam: flow.tags?.home_team || flow.tags?.team_a || 'Team A',
      awayTeam: flow.tags?.away_team || flow.tags?.team_b || 'Team B',
      date: flow.tags?.date || flow.tags?.game_date || 'Unknown',
      venue: flow.tags?.venue || flow.tags?.stadium || 'Unknown',
      score: flow.tags?.score || flow.tags?.final_score
    },
    ...(flow.tags?.player_number ? {
      playerInfo: {
        number: flow.tags.player_number,
        name: flow.tags.player_name || `Player ${flow.tags.player_number}`,
        team: flow.tags.player_team || flow.tags.home_team || 'Unknown',
        position: flow.tags.player_position || 'Unknown'
      }
    } : {}),
    timing: {
      start: flow.tags?.start_time || '00:00:00',
      end: flow.tags?.end_time || '00:00:00',
      duration: flow.tags?.duration || flow.tags?.game_duration || 90 * 60 // 90 minutes default
    },
    metadata: {
      format: flow.format || 'video/h264',
      quality: flow.tags?.quality || flow.tags?.resolution || '1080p',
      tags: flow.tags || {}
    },
    thumbnail: flow.tags?.thumbnail || `https://via.placeholder.com/320x180/1f2937/ffffff?text=${encodeURIComponent(flow.label || 'Flow')}`,
    previewUrl: flow.tags?.preview_url || flow.tags?.video_url || flow.tags?.media_url || flow.tags?.stream_url || flow.tags?.file_url
  };
}

// Convert BBC TAMS segment data to SearchResult format
function convertSegmentToSearchResult(segment: any, flowData?: any): SearchResult {
  const flowTags = flowData?.tags || {};
  
  return {
    id: segment.id,
    type: 'segment',
    title: segment.label || segment.name || `Segment ${segment.id}`,
    description: segment.description || 'Video segment',
    gameInfo: {
      homeTeam: segment.tags?.home_team || flowTags.home_team || flowTags.team_a || 'Team A',
      awayTeam: segment.tags?.away_team || flowTags.away_team || flowTags.team_b || 'Team B',
      date: segment.tags?.date || flowTags.date || flowTags.game_date || 'Unknown',
      venue: segment.tags?.venue || flowTags.venue || flowTags.stadium || 'Unknown',
      score: segment.tags?.score || flowTags.score || flowTags.final_score
    },
    ...(segment.tags?.player_number ? {
      playerInfo: {
        number: segment.tags.player_number,
        name: segment.tags.player_name || `Player ${segment.tags.player_number}`,
        team: segment.tags.player_team || flowTags.home_team || 'Unknown',
        position: segment.tags.player_position || 'Unknown'
      }
    } : {}),
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
    previewUrl: segment.tags?.preview_url || segment.tags?.video_url || segment.content_url || segment.media_url || segment.stream_url || segment.file_url
  };
}

// Convert BBC TAMS source data to SearchResult format
function convertSourceToSearchResult(source: any): SearchResult {
  return {
    id: source.id,
    type: 'source',
    title: source.label || source.name || `Source ${source.id}`,
    description: source.description || 'Original content source',
    gameInfo: {
      homeTeam: source.tags?.home_team || source.tags?.team_a || 'Team A',
      awayTeam: source.tags?.away_team || source.tags?.team_b || 'Team B',
      date: source.tags?.date || source.tags?.game_date || 'Unknown',
      venue: source.tags?.venue || source.tags?.stadium || 'Unknown',
      score: source.tags?.score || source.tags?.final_score
    },
    ...(source.tags?.player_number ? {
      playerInfo: {
        number: source.tags.player_number,
        name: source.tags.player_name || `Player ${source.tags.player_number}`,
        team: source.tags.player_team || source.tags.home_team || 'Unknown',
        position: source.tags.player_position || 'Unknown'
      }
    } : {}),
    timing: {
      start: source.tags?.start_time || '00:00:00',
      end: source.tags?.end_time || '00:00:00',
      duration: source.tags?.duration || source.tags?.game_duration || 90 * 60 // 90 minutes default
    },
    metadata: {
      format: source.format || 'video/h264',
      quality: source.tags?.quality || source.tags?.resolution || '1080p',
      tags: source.tags || {}
    },
    thumbnail: source.tags?.thumbnail || `https://via.placeholder.com/320x180/1f2937/ffffff?text=${encodeURIComponent(source.label || 'Source')}`,
    previewUrl: source.tags?.preview_url || source.tags?.video_url || source.tags?.media_url || source.tags?.stream_url || source.tags?.file_url
  };
}

// Build BBC TAMS API options from search query
function buildSearchOptions(query: SearchQuery): BBCApiOptions {
  const options: BBCApiOptions = {
    limit: 50, // Default limit
    tags: {},
    tagExists: {}
  };

  // Add basic filters
  if (query.playerNumber) {
    options.tags!['player_number'] = query.playerNumber;
  }
  
  if (query.playerName) {
    options.tags!['player_name'] = query.playerName;
  }
  
  if (query.team) {
    options.tags!['home_team'] = query.team;
    // Also search in away team
    options.tags!['away_team'] = query.team;
  }
  
  if (query.eventType) {
    options.tags!['event_type'] = query.eventType;
  }
  
  if (query.timerange) {
    options.timerange = query.timerange;
  }
  
  if (query.format) {
    options.format = query.format;
  }
  
  if (query.codec) {
    options.codec = query.codec;
  }

  // Add sport-specific tags
  options.tags!['sport'] = 'football';
  
  return options;
}

// Perform search using BBC TAMS API
export async function performSearch(query: SearchQuery, page: number = 1, limit: number = 20): Promise<SearchResponse> {
  const startTime = Date.now();
  const searchOptions = buildSearchOptions(query);
  searchOptions.limit = limit;
  
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
        const sourcesResponse = await getSources(searchOptions);
        const sourceResults = sourcesResponse.data.map(convertSourceToSearchResult);
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
        const flowsResponse = await getFlows(searchOptions);
        const flowResults = flowsResponse.data.map(convertFlowToSearchResult);
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
        // For segments, we need to search flows first, then get their segments
        const flowsResponse = await getFlows(searchOptions);
        
        for (const flow of flowsResponse.data.slice(0, 5)) { // Limit to first 5 flows to avoid too many API calls
          try {
            const segmentsResponse = await getFlowSegments(flow.id, searchOptions);
            const segmentResults = segmentsResponse.data.map(segment => 
              convertSegmentToSearchResult(segment, flow)
            );
            results.push(...segmentResults);
            totalResults += segmentsResponse.data.length;
          } catch (error) {
            console.warn(`Failed to get segments for flow ${flow.id}:`, error);
          }
        }
      } catch (error) {
        console.warn('Failed to search segments:', error);
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

// Use proxy in development, Vercel proxy in production
const API_BASE_URL = import.meta.env.DEV 
  ? '/api'  // Use Vite dev server proxy
  : '/api/proxy'; // Use Vercel proxy in production

// Get specific flow details for video playback
export async function getFlowDetails(flowId: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/flows/${flowId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get flow details: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to get flow details:', error);
    throw error;
  }
}

// Get segment content URL for video playback
export async function getSegmentContentUrl(flowId: string, segmentId: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/flows/${flowId}/segments/${segmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get segment details: ${response.status} ${response.statusText}`);
    }

    const segment = await response.json();
    
    // Return the content URL for video playback
    // Try multiple possible URL fields that BBC TAMS might use
    const contentUrl = segment.content_url || 
                      segment.video_url || 
                      segment.url || 
                      segment.media_url ||
                      segment.stream_url ||
                      segment.file_url ||
                      '';
    
    // If we have a relative URL, make it absolute
    if (contentUrl && !contentUrl.startsWith('http')) {
      return `${API_BASE_URL}${contentUrl}`;
    }
    
    return contentUrl;
  } catch (error) {
    console.error('Failed to get segment content URL:', error);
    throw error;
  }
}

// Get available football games (sources)
export async function getFootballGames(): Promise<SearchResult[]> {
  try {
    const options: BBCApiOptions = {
      tags: { sport: 'football' },
      limit: 20
    };

    const sourcesResponse = await getSources(options);
    return sourcesResponse.data.map(convertSourceToSearchResult);
  } catch (error) {
    console.error('Failed to get football games:', error);
    // Return empty array on error to prevent UI crashes
    return [];
  }
}
