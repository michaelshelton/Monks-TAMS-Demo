
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Badge,
  Group,
  Box,
  Button,
  ActionIcon,
  Tooltip,
  Progress,
  Divider,
  Alert,
  Table,
  ScrollArea,
  Grid,
  Paper,
  SimpleGrid,
  Tabs,
  List,
  ThemeIcon,
  Modal,
  TextInput,
  Select,
  Textarea,
  NumberInput,
  Switch,
  Timeline,
  RingProgress,
  Code,
  Loader,
  FileInput,
  Collapse
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconDownload,
  IconEdit,
  IconEye,
  IconClock,
  IconTag,
  IconVideo,
  IconMusic,
  IconPhoto,
  IconDatabase,
  IconPlus,
  IconFilter,
  IconSearch,
  IconTimeline,
  IconCalendar,
  IconInfoCircle,
  IconLink,
  IconExternalLink,
  IconCopy,
  IconShare,
  IconFolder,
  IconFile,
  IconDatabase as IconStorage,
  IconNetwork,
  IconServer,
  IconActivity,
  IconAlertCircle,
  IconSettings,
  IconRefresh,
  IconArrowLeft,
  IconBroadcast,
  IconSignalE,
  IconPalette,
  IconCode,
  IconContainer,
  IconChartBar,
  IconUpload,
  IconRadio,
  IconTags
} from '@tabler/icons-react';
import { apiClient } from '../services/api';
import AdvancedFilter, { FilterOption, FilterPreset } from '../components/AdvancedFilter';
import { useFilterPersistence } from '../hooks/useFilterPersistence';
import { cmcdTracker, type CMCDMetrics } from '../services/cmcdService';
import { StorageAllocationManager } from '../components/StorageAllocationManager';
import { FlowTagsManager } from '../components/FlowTagsManager';
import { FlowDescriptionManager } from '../components/FlowDescriptionManager';
import { FlowCollectionManager } from '../components/FlowCollectionManager';
import { FlowReadOnlyManager } from '../components/FlowReadOnlyManager';

import HLSVideoPlayer from '../components/HLSVideoPlayer';
import VastTamsVideoPlayer from '../components/VastTamsVideoPlayer';
import { transformSegmentUrls } from '../utils/s3Proxy';

// VAST TAMS Flow interface based on real API response
interface FlowDetails {
  id: string;
  source_id: string;
  format: string;
  codec: string;
  label: string;
  description: string;
  created_by: string;
  updated_by: string;
  created: string;
  updated: string;
  tags: Record<string, string>;
  read_only: boolean;
  
  // Video-specific fields from VAST TAMS API
  frame_width?: number;
  frame_height?: number;
  frame_rate?: string;
  interlace_mode?: string;
  color_sampling?: string;
  color_space?: string;
  transfer_characteristics?: string;
  color_primaries?: string;
  
  // Audio-specific fields
  sample_rate?: number;
  bits_per_sample?: number;
  channels?: number;
  
  // Common fields
  container?: string;
  
  // Bitrate fields from VAST TAMS API
  avg_bit_rate?: number;
  max_bit_rate?: number;
  
  // Multi-flow fields
  flow_collection?: string[];
  
  // Collection fields
  collection_id?: string;
  collection_label?: string;
  
  // VAST TAMS soft delete fields
  deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
  
  // Status field
  status?: string;
  
  // Storage information
  storage?: {
    total_segments: number;
    total_size: number;
  };
}



const getFormatIcon = (format: string) => {
  switch (format) {
    case 'urn:x-nmos:format:video': return <IconVideo size={16} />;
    case 'urn:x-nmos:format:audio': return <IconMusic size={16} />;
    case 'urn:x-tam:format:image': return <IconPhoto size={16} />;
    default: return <IconDatabase size={16} />;
  }
};

const getFormatLabel = (format: string) => {
  switch (format) {
    case 'urn:x-nmos:format:video': return 'Video';
    case 'urn:x-nmos:format:audio': return 'Audio';
    case 'urn:x-tam:format:image': return 'Image';
    default: return 'Data';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'green';
    case 'inactive': return 'gray';
    case 'processing': return 'yellow';
    case 'error': return 'red';
    default: return 'gray';
  }
};

const formatFileSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDuration = (start: string, end: string) => {
  const startTime = new Date(start);
  const endTime = new Date(end);
  const durationMs = endTime.getTime() - startTime.getTime();
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

export default function FlowDetails() {
  const { flowId } = useParams<{ flowId: string }>();
  const navigate = useNavigate();
  // Removed unused searchParams
  const [flow, setFlow] = useState<FlowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'segments' | 'tags' | 'storage' | 'technical' | 'analytics'>('overview');

  // Disabled state for operations
  const [disabled, setDisabled] = useState(false);

  // Segments state (flow-scoped)
  interface SegmentItem {
    id: string;
    object_id: string;
    timerange: { start: string; end: string };
    description?: string;
    size?: number;
    status: string;
    last_duration?: string;
    key_frame_count?: number;
    get_urls?: Array<{ url: string; label?: string }>;
    tags?: Record<string, string>;
    flow_format?: string;
    created_at?: string;
    updated_at?: string;
    is_live?: boolean;
  }
  const [segments, setSegments] = useState<SegmentItem[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [segmentsError, setSegmentsError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('list');
  const [selectedSegment, setSelectedSegment] = useState<SegmentItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const { filters: segFilters, updateFilters: updateSegFilters } = useFilterPersistence('flow_segments');
  const [segSavedPresets, setSegSavedPresets] = useState<FilterPreset[]>([]);

  // Live segments state
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveUpdateInterval, setLiveUpdateInterval] = useState<number | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [newSegmentsCount, setNewSegmentsCount] = useState(0);
  const [showNewSegmentsNotification, setShowNewSegmentsNotification] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingSegment, setUploadingSegment] = useState(false);

  // CMCD tracking state
  const [cmcdMetrics, setCmcdMetrics] = useState<CMCDMetrics[]>([]);
  const [showCMCDPanel, setShowCMCDPanel] = useState(false);
  const [cmcdSessionActive, setCmcdSessionActive] = useState(false);
  const [showCMCD, setShowCMCD] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Info box toggle state
  const [showInfoBox, setShowInfoBox] = useState(true);
  
  // Inline video player state
  const [showInlineVideoPlayer, setShowInlineVideoPlayer] = useState(false);
  const [inlineVideoUrl, setInlineVideoUrl] = useState<string | null>(null);
  const [inlineVideoError, setInlineVideoError] = useState<string | null>(null);
  
  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    const fetchFlowDetails = async () => {
      if (!flowId) return;
      
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching flow details from VAST TAMS API for ID:', flowId);
        const response = await apiClient.getFlow(flowId);
        console.log('VAST TAMS flow details response:', response);
        
        // Convert tags from array format to string format if needed
        if (response.tags) {
          const convertedTags: Record<string, string> = {};
          Object.entries(response.tags).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              // Convert array to comma-separated string
              convertedTags[key] = value.join(', ');
            } else if (typeof value === 'string') {
              convertedTags[key] = value;
            } else {
              convertedTags[key] = String(value);
            }
          });
          response.tags = convertedTags;
        }
        
        setFlow(response);
      } catch (err: any) {
        console.error('VAST TAMS flow details API error:', err);
        
        // Set appropriate error message based on error type
        if (err?.message?.includes('500') || err?.message?.includes('Internal Server Error')) {
          setError('VAST TAMS backend temporarily unavailable - please try again later');
        } else if (err?.message?.includes('Network') || err?.message?.includes('fetch') || err?.message?.includes('CORS')) {
          setError('Network connection issue - please check your connection and try again');
        } else if (err?.message?.includes('404')) {
          setError('Flow not found - please check the flow ID and try again');
        } else {
          setError(`VAST TAMS API error: ${err?.message || 'Unknown error'}`);
        }
        
        // Clear flow on error
        setFlow(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFlowDetails();
  }, [flowId]);

  // Load analytics when analytics tab is selected
  useEffect(() => {
    if (activeTab === 'analytics' && !analyticsData) {
      loadAnalytics();
    }
  }, [activeTab, analyticsData]);

  // CMCD metrics tracking effect
  useEffect(() => {
    if (cmcdSessionActive) {
      const interval = setInterval(() => {
        const session = cmcdTracker.getSession();
        if (session.metrics && session.metrics.length > 0) {
          setCmcdMetrics(session.metrics);
        }
      }, 1000); // Update every second

      return () => clearInterval(interval);
    }
    return undefined;
  }, [cmcdSessionActive]);

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      // Fetch analytics data from VAST TAMS
      const [flowUsage, storageUsage, timeRangeAnalysis] = await Promise.all([
        fetch('/api/analytics/flow-usage').then(res => res.json()),
        fetch('/api/analytics/storage-usage').then(res => res.json()),
        fetch('/api/analytics/time-range-analysis').then(res => res.json())
      ]);
      
      setAnalyticsData({
        flowUsage,
        storageUsage,
        timeRangeAnalysis
      });
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // CMCD data display function
  const renderCMCDData = () => {
    if (!cmcdMetrics || cmcdMetrics.length === 0) return null;

    const latestMetric = cmcdMetrics[cmcdMetrics.length - 1];
    if (!latestMetric) return null;

    return (
      <Collapse in={showCMCD}>
        <Card mt="md" withBorder>
          <Group justify="space-between" mb="sm">
            <Title order={6}>CMCD Data (Common Media Client Data)</Title>
            <Badge color="blue">VAST TAMS Compliant</Badge>
          </Group>
          <SimpleGrid cols={2} spacing="xs">
            <Box>
              <Text size="xs" c="dimmed">Object Type</Text>
              <Code style={{ fontSize: '0.75rem' }}>v</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Duration</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.objectDuration?.toFixed(1) || 'N/A'}s</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Session ID</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.sessionId || 'N/A'}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Load Time</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.loadTime ? `${latestMetric.loadTime}ms` : 'N/A'}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Bitrate</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.bandwidth ? `${(latestMetric.bandwidth / 1000).toFixed(0)}kbps` : 'N/A'}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Buffer Length</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.bufferLength?.toFixed(1) || 'N/A'}s</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Playback Rate</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.playbackRate?.toFixed(2) || 'N/A'}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Quality Level</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.qualityLevel || 'N/A'}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Startup Time</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.startupTime ? `${latestMetric.startupTime.toFixed(2)}s` : 'N/A'}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Rebuffering Events</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.rebufferingEvents || 0}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Decoded Frames</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.decodedFrames || 0}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Dropped Frames</Text>
              <Code style={{ fontSize: '0.75rem' }}>{latestMetric.droppedFrames || 0}</Code>
            </Box>
          </SimpleGrid>
        </Card>
      </Collapse>
    );
  };

  // Fetch flow-scoped segments
  const fetchSegments = async () => {
    if (!flowId) return;
    try {
      setSegmentsLoading(true);
      setSegmentsError(null);
      const flowSegments = await apiClient.getFlowSegments(flowId);
      console.log('VAST TAMS segments response:', flowSegments);
      
      const transformed = (flowSegments.data || []).map((seg: any): SegmentItem => {
        // Parse VAST TAMS timerange format (e.g., "2025-01-25T10:00:00Z/2025-01-25T10:00:15Z")
        let timerange = { start: new Date().toISOString(), end: new Date().toISOString() };
        if (seg.timerange) {
          if (typeof seg.timerange === 'string') {
            // VAST TAMS format: "start/end"
            const [start, end] = seg.timerange.split('/');
            timerange = { start: start || new Date().toISOString(), end: end || new Date().toISOString() };
          } else if (seg.timerange.start && seg.timerange.end) {
            // Already in object format
            timerange = seg.timerange;
          }
        }
        
        const segmentItem = {
          id: seg.id || `${flowId}_${timerange.start}_${Date.now()}`,
          object_id: seg.object_id || seg.id || 'unknown',
          timerange,
          description: seg.description || 'No description',
          size: seg.size,
          status: seg.status || 'active',
          last_duration: seg.last_duration,
          key_frame_count: seg.key_frame_count,
          get_urls: seg.get_urls || [],
          tags: seg.tags || {},
          flow_format: seg.flow_format || seg.format || flow?.format,
          created_at: seg.created_at || seg.created,
          updated_at: seg.updated_at || seg.updated,
          is_live: seg.is_live
        };

        // Transform S3 URLs for development proxy
        return transformSegmentUrls(segmentItem);
      });
      
      // Check for new segments if in live mode
      if (isLiveMode && segments.length > 0) {
        const newSegments = transformed.filter(newSeg => 
          !segments.some(existingSeg => existingSeg.id === newSeg.id)
        );
        if (newSegments.length > 0) {
          setNewSegmentsCount(prev => prev + newSegments.length);
          setShowNewSegmentsNotification(true);
          
          // Auto-hide notification after 5 seconds
          setTimeout(() => {
            setShowNewSegmentsNotification(false);
          }, 5000);
        }
      }
      
      setSegments(transformed);
      setLastUpdateTime(new Date());
    } catch (err: any) {
      setSegmentsError('Failed to fetch segments');
      // Error logged by component
    } finally {
      setSegmentsLoading(false);
    }
  };

  // Live segment updates
  const startLiveMode = () => {
    setIsLiveMode(true);
    setNewSegmentsCount(0);
    
    // Set up polling every 10 minutes for live segments (demo-optimized)
    const interval = window.setInterval(() => {
      fetchSegments();
    }, 600000); // 10 minutes = 600,000ms
    
    setLiveUpdateInterval(interval);
  };

  const stopLiveMode = () => {
    setIsLiveMode(false);
    if (liveUpdateInterval) {
      clearInterval(liveUpdateInterval);
      setLiveUpdateInterval(null);
    }
    setNewSegmentsCount(0);
  };

  const toggleLiveMode = () => {
    if (isLiveMode) {
      stopLiveMode();
    } else {
      startLiveMode();
    }
  };

  // Upload segment functionality
  const handleUploadSegment = async (file: File, segmentData: any) => {
    if (!flowId) return;
    
    setUploadingSegment(true);
    try {
      // Create segment metadata in VAST TAMS format
      const segment = {
        object_id: segmentData.object_id || `seg_${Date.now()}`,
        timerange: segmentData.timerange || `${segmentData.startTime || '00:00:00'}_${segmentData.endTime || '00:01:00'}`,
        description: segmentData.description || 'Uploaded segment',
        tags: segmentData.tags || {},
        format: flow?.format || 'urn:x-nmos:format:video',
        codec: flow?.codec || 'h264'
      };

      console.log('Uploading segment to VAST TAMS:', segment);
      
      // Upload segment to VAST TAMS backend
      const response = await apiClient.createFlowSegment(flowId, segment, file);
      console.log('VAST TAMS upload response:', response);
      
      if (response) {
        // Refresh segments to show the new one
        await fetchSegments();
        
        // Show success notification
        setShowNewSegmentsNotification(true);
        setNewSegmentsCount(prev => prev + 1);
        
        // Close upload modal
        setShowUploadModal(false);
      }
    } catch (error) {
      console.error('Failed to upload segment to VAST TAMS:', error);
      setSegmentsError(`Failed to upload segment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingSegment(false);
    }
  };

  // Cleanup live mode on unmount
  useEffect(() => {
    return () => {
      if (liveUpdateInterval) {
        clearInterval(liveUpdateInterval);
      }
    };
  }, [liveUpdateInterval]);

  // Load segments automatically when component mounts and flow is loaded
  useEffect(() => {
    if (flow && flowId) {
      fetchSegments();
      // Auto-start live mode for segments to show real-time updates
      if (!isLiveMode) {
        startLiveMode();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow, flowId]);

  // Stop live mode when component unmounts
  useEffect(() => {
    return () => {
      if (isLiveMode) {
        stopLiveMode();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatIsoDuration = (duration: string) => {
    return duration.replace('PT', '').replace('H', 'h ').replace('M', 'm ').replace('S', 's').trim();
  };

  // Generate HLS stream URL for the flow
  const getHLSStreamUrl = (flowId: string): string => {
    const backend = import.meta.env.VITE_DEFAULT_BACKEND;
    if (backend === 'ibc-thiago-imported') {
      return `http://localhost:3002/flows/${flowId}/stream.m3u8`;
    } else if (backend === 'vast') {
      // VAST TAMS backend
      return `${import.meta.env.VITE_VAST_API_URL || 'http://localhost:8000'}/flows/${flowId}/stream.m3u8`;
    }
    // Fallback to other backends
    return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/flows/${flowId}/stream.m3u8`;
  };

  const handlePlaySegment = (segment: SegmentItem) => {
    console.log('Playing segment:', segment);
    console.log('Segment get_urls:', segment.get_urls);
    
    // Check if segment has presigned URLs from VAST TAMS
    if (!segment.get_urls || segment.get_urls.length === 0) {
      setError('No playback URLs available for this segment');
      return;
    }
    
    // Load segment into inline video player
    setSelectedSegment(segment);
    setShowInlineVideoPlayer(true);
    
    // Get the first available URL for playback
    const playbackUrl = segment.get_urls.find(url => url.label?.includes('GET'))?.url || segment.get_urls[0]?.url;
    if (playbackUrl) {
      setInlineVideoUrl(playbackUrl);
      setInlineVideoError(null);
    } else {
      setInlineVideoError('No valid playback URL found for this segment');
    }
    
    // Reset CMCD tracking for new segment
    cmcdTracker.resetSession();
    setCmcdMetrics([]);
    setCmcdSessionActive(true);
  };

  // Helper function to check if a segment can be played
  const canPlaySegment = (segment: SegmentItem): boolean => {
    const format = segment.flow_format || flow?.format;
    
    // Support both legacy mp2t format and VAST TAMS video formats
    return format === 'video/mp2t' || 
           format === 'urn:x-nmos:format:video' ||
           (format && format.includes('video')) ||
           !!(segment.get_urls && segment.get_urls.length > 0);
  };

  const handlePlayFlow = () => {
    if (!flowId) return;
    setSelectedSegment({
      id: flowId,
      object_id: flowId,
      timerange: { start: new Date().toISOString(), end: new Date().toISOString() },
      description: flow?.label || 'Flow Stream',
      status: 'active',
      flow_format: flow?.format || 'video/mp2t'
    });
    setShowVideoPlayer(true);
    // Reset CMCD tracking for new flow
    cmcdTracker.resetSession();
    setCmcdMetrics([]);
    setCmcdSessionActive(true);
  };

  const handleLoadInlineVideo = async () => {
    if (!flowId) return;
    
    try {
      setInlineVideoError(null);
      setShowInlineVideoPlayer(true);
      
      // Get the HLS stream URL for the flow
      const hlsUrl = getHLSStreamUrl(flowId);
      setInlineVideoUrl(hlsUrl);
      
      // Start CMCD tracking for inline video
      cmcdTracker.resetSession();
      setCmcdSessionActive(true);
      setCmcdMetrics([]);
      
      console.log('Loading inline video for flow:', flowId, 'URL:', hlsUrl);
    } catch (error) {
      console.error('Failed to load inline video:', error);
      setInlineVideoError('Failed to load video stream');
    }
  };

  const handleInlineVideoClose = () => {
    setShowInlineVideoPlayer(false);
    setInlineVideoUrl(null);
    setInlineVideoError(null);
    setCmcdSessionActive(false);
    setCmcdMetrics([]);
  };

  // CMCD tracking for inline video
  useEffect(() => {
    if (cmcdSessionActive && videoRef.current) {
      // Start CMCD tracking for the video element
      cmcdTracker.startVideoTracking(videoRef.current, flowId, undefined, flow?.source_id);
      
      // Cleanup
      return () => {
        cmcdTracker.stopVideoTracking();
      };
    }
    return undefined;
  }, [cmcdSessionActive, flowId, flow?.source_id]);


  // Handle video player close
  const handleVideoPlayerClose = () => {
    setShowVideoPlayer(false);
    setCmcdSessionActive(false);
    setShowCMCDPanel(false);
    setSelectedSegment(null);
  };

  // Segment filters (no flow selector, since scoped to this flow)
  const segmentFilterOptions: FilterOption[] = [
    { key: 'search', label: 'Search', type: 'text', placeholder: 'Search segments by description...' },
    { key: 'format', label: 'Format', type: 'select', options: [
      { value: 'urn:x-nmos:format:video', label: 'Video' },
      { value: 'urn:x-nmos:format:audio', label: 'Audio' },
      { value: 'urn:x-nmos:format:data', label: 'Data' },
      { value: 'urn:x-tam:format:image', label: 'Image' }
    ]},
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: 'active', label: 'Active' },
      { value: 'processing', label: 'Processing' },
      { value: 'error', label: 'Error' },
      { value: 'deleted', label: 'Deleted' }
    ]},
    { key: 'category', label: 'Category', type: 'select', options: [
      { value: 'technology', label: 'Technology' },
      { value: 'education', label: 'Education' },
      { value: 'entertainment', label: 'Entertainment' },
      { value: 'business', label: 'Business' },
      { value: 'news', label: 'News' }
    ]},
    { key: 'content_type', label: 'Content Type', type: 'select', options: [
      { value: 'conference', label: 'Conference' },
      { value: 'podcast', label: 'Podcast' },
      { value: 'training', label: 'Training' },
      { value: 'presentation', label: 'Presentation' },
      { value: 'webinar', label: 'Webinar' }
    ]},
    { key: 'timerange', label: 'Time Range', type: 'text', placeholder: 'Filter by time range (HH:MM:SS)' },
    { key: 'tags', label: 'Tags', type: 'text', placeholder: 'Filter by tag key:value' }
  ];

  const filteredSegments = segments.filter(segment => {
    const searchTerm = segFilters.search?.toLowerCase();
    const matchesSearch = !searchTerm ||
      segment.description?.toLowerCase().includes(searchTerm);

    const formatFilter = segFilters.format;
    const matchesFormat = !formatFilter || (segment.flow_format === formatFilter);

    const statusFilter = segFilters.status;
    const matchesStatus = !statusFilter || segment.status === statusFilter;

    // Category filter
    const categoryFilter = segFilters.category;
    const matchesCategory = !categoryFilter || 
      segment.tags?.['category'] === categoryFilter;

    // Content type filter
    const contentTypeFilter = segFilters.content_type;
    const matchesContentType = !contentTypeFilter || 
      segment.tags?.['content_type'] === contentTypeFilter ||
      segment.tags?.['event_type'] === contentTypeFilter;

    const timerangeFilter = segFilters.timerange;
    const matchesTimerange = !timerangeFilter ||
      segment.timerange.start.includes(timerangeFilter) ||
      segment.timerange.end.includes(timerangeFilter);

    const tagsFilter = segFilters.tags;
    const matchesTags = !tagsFilter || (segment.tags && Object.entries(segment.tags).some(([key, value]) => `${key}:${value}`.toLowerCase().includes(tagsFilter.toLowerCase())));

    return matchesSearch && matchesFormat && matchesStatus && matchesCategory && matchesContentType && matchesTimerange && matchesTags;
  });

  // Removed URL sync - tab state managed locally


  // Storage allocation handlers
  const handleStorageAllocated = async (allocation: any) => {
    console.log('Storage allocated:', allocation);
    // TODO: Update flow storage information
    // This could trigger a refresh of the flow data
  };

  const handleStorageDeleted = async (allocationId: string) => {
    console.log('Storage deleted:', allocationId);
    // TODO: Update flow storage information
    // This could trigger a refresh of the flow data
  };

  const refreshFlowDetails = async () => {
    if (!flowId) return;
    
    try {
      setRefreshing(true);
      setError(null);
      const response = await apiClient.getFlow(flowId);
      
      // Convert tags from array format to string format if needed
      if (response.tags) {
        const convertedTags: Record<string, string> = {};
        Object.entries(response.tags).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            // Convert array to comma-separated string
            convertedTags[key] = value.join(', ');
          } else if (typeof value === 'string') {
            convertedTags[key] = value;
          } else {
            convertedTags[key] = String(value);
          }
        });
        response.tags = convertedTags;
      }
      
      setFlow(response);
    } catch (err: any) {
      // Check if it's a 404 error (backend not ready)
      if (err.message && err.message.includes('404')) {
        setError('Backend Not Ready - Flow details endpoint is not available');
      } else {
        setError('Failed to refresh flow details');
      }
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const retryFlowDetails = async () => {
    if (!flowId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getFlow(flowId);
      
      // Convert tags from array format to string format if needed
      if (response.tags) {
        const convertedTags: Record<string, string> = {};
        Object.entries(response.tags).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            // Convert array to comma-separated string
            convertedTags[key] = value.join(', ');
          } else if (typeof value === 'string') {
            convertedTags[key] = value;
          } else {
            convertedTags[key] = String(value);
          }
        });
        response.tags = convertedTags;
      }
      
      setFlow(response);
    } catch (err: any) {
      // Check if it's a 404 error (backend not ready)
      if (err.message && err.message.includes('404')) {
        setError('Backend Not Ready - Flow details endpoint is not available');
      } else {
        setError('Failed to fetch flow details');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const API_BASE_URL = import.meta.env.DEV 
    ? (import.meta.env.VITE_API_URL || 'http://localhost:8000')
    : '/api/proxy';

  if (loading && !flow) {
    return (
      <Container size="xl" px="xl" py="xl">
        <Box ta="center" py="xl">
          <Loader />
          <Text mt="md">Loading flow details...</Text>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" px="xl" py="xl">
        <Box mb="xl">
          <Group gap="sm" mb="md">
            <Button
              variant="light"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate('/flows')}
            >
              Back to Flows
            </Button>
          </Group>
        </Box>
        
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          color="red" 
          title="Backend Not Ready"
          mb="xl"
        >
          The flow details endpoint is not available. This usually means the backend dependencies are not fully configured.
          <br /><br />
          <Text size="sm" c="dimmed">
            • Check that the backend is running at {API_BASE_URL}<br />
            • Verify that all required Python packages are installed<br />
            • Check backend logs for dependency errors
          </Text>
        </Alert>
        
        <Card withBorder>
          <Box ta="center" py="xl">
            <IconAlertCircle size={48} color="red" />
            <Title order={3} mt="md" mb="sm">Flow Details Unavailable</Title>
            <Text c="dimmed" mb="lg">
              Unable to load flow details from the backend API
            </Text>
            <Button 
              variant="light" 
              leftSection={<IconRefresh size={16} />}
              onClick={retryFlowDetails}
              loading={loading}
            >
              Try Again
            </Button>
          </Box>
        </Card>
      </Container>
    );
  }

  if (!flow) {
    return (
      <Container size="xl" px="xl" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} color="red">
          Flow not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" px="xl" py="xl">
      {/* Header */}
      <Box mb="xl">
        <Group justify="space-between" align="flex-start">
          <Box>
            <Group gap="sm" mb="md">
              <Button
                variant="light"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => navigate('/flows')}
              >
                Back to Flows
              </Button>
              <Badge color={getStatusColor(flow.status || 'unknown')} variant="light">
                {flow.status}
              </Badge>
            </Group>
            <Title order={2} mb="md">{flow.label}</Title>
            <Text size="lg" c="dimmed" mb="md">{flow.description}</Text>
            <Group gap="xs" wrap="wrap">
              {getFormatIcon(flow.format)}
              <Text size="sm">{getFormatLabel(flow.format)}</Text>
              <Text size="sm" c="dimmed">•</Text>
              <Text size="sm" c="dimmed">Source ID: {flow.source_id}</Text>
              <Text size="sm" c="dimmed">•</Text>
              <Text size="sm" c="dimmed">Codec: {flow.codec}</Text>
            </Group>
          </Box>
          <Group gap="sm">
            <Button variant="light" leftSection={<IconEdit size={16} />} onClick={() => setShowEditModal(true)}>
              Edit Flow
            </Button>
            <Button 
              variant="light" 
              leftSection={<IconRefresh size={16} />} 
              onClick={refreshFlowDetails}
              loading={refreshing}
            >
              Refresh
            </Button>
          </Group>
        </Group>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          color="red" 
          title="Error"
          withCloseButton
          onClose={() => setError(null)}
          mb="md"
        >
          {error}
        </Alert>
      )}

      {/* VAST TAMS Info - Toggleable */}
      {!error && (
        <Alert 
          icon={<IconInfoCircle size={16} />} 
          color="blue" 
          title={
            <Group justify="space-between" w="100%">
              <Text>Flow Details in TAMS</Text>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setShowInfoBox(!showInfoBox)}
                rightSection={showInfoBox ? <IconArrowLeft size={12} /> : <IconArrowLeft size={12} style={{ transform: 'rotate(-90deg)' }} />}
              >
                {showInfoBox ? 'Hide' : 'Show'} Info
              </Button>
            </Group>
          }
          mb="lg"
        >
          <Collapse in={showInfoBox}>
            <Stack gap="xs">
              <Text size="sm">
                This page shows detailed information about a specific <strong>Flow</strong> - a processed media stream 
                with technical specifications and encoding details. Here you can view segments, manage tags, 
                configure storage, and analyze performance.
              </Text>
              <Text size="sm">
                Flows contain detailed metadata like format, codec, resolution, bitrates, and custom tags. 
                This detailed view helps you understand the technical specifications and manage flow properties.
              </Text>
              <Text size="sm">
                <strong>Demo Note:</strong> This page shows live data from the TAMS backend powered by VAST, demonstrating real-time
                media flow details and management capabilities.
              </Text>
            </Stack>
          </Collapse>
        </Alert>
      )}


      {/* Backend Status Note */}
      {error && error.includes('Backend Not Ready') && (
        <Alert 
          icon={<IconInfoCircle size={16} />} 
          color="blue" 
          title="Backend Status"
          mb="md"
        >
          The backend API endpoints for flows are not responding. This is likely due to missing Python dependencies (like 'ibis') that prevent the flows router from loading properly.
          <br /><br />
          <Text size="sm" c="dimmed">
            To fix this, the backend needs to have all required Python packages installed and running correctly.
          </Text>
        </Alert>
      )}

      {/* Main Content - Segments First */}
      <Grid mb="xl">
            <Grid.Col span={8}>
          {/* Segments Section - Primary Focus */}
          <Card withBorder p="xl" mb="lg">
            <Group justify="space-between" mb="md">
              <Group gap="sm">
                <Title order={3}>Flow Segments</Title>
                {segmentsLoading && <Loader size="sm" />}
                {isLiveMode && (
                  <Badge color="red" variant="filled" leftSection={<IconRadio size={12} />}>
                    LIVE
                  </Badge>
                )}
                {newSegmentsCount > 0 && (
                  <Badge color="green" variant="light">
                    +{newSegmentsCount} new
                  </Badge>
                )}
              </Group>
              <Group gap="xs">
                <Button
                  variant={isLiveMode ? "filled" : "light"}
                  color={isLiveMode ? "red" : "blue"}
                  leftSection={isLiveMode ? <IconRadio size={16} /> : <IconRadio size={16} />}
                  size="sm"
                  onClick={toggleLiveMode}
                >
                  {isLiveMode ? 'Stop Real-time' : 'Start Real-time'}
                </Button>
                <Select
                  value={viewMode}
                  onChange={(value) => setViewMode((value as 'timeline' | 'list') || 'timeline')}
                  data={[{ value: 'timeline', label: 'Timeline View' }, { value: 'list', label: 'List View' }]}
                  size="sm"
                />
                <Button variant="light" leftSection={<IconRefresh size={16} />} size="sm" onClick={fetchSegments} loading={segmentsLoading}>
                  Refresh
                </Button>
                <Button leftSection={<IconPlus size={16} />} size="sm" onClick={() => setShowUploadModal(true)}>
                  Upload Segment
                </Button>
              </Group>
            </Group>

            {/* Segment Statistics */}
            <Group gap="md" mb="md" wrap="wrap">
              <Group gap="xs">
                <IconTimeline size={16} color="#228be6" />
                <Text size="sm" c="dimmed">Segments:</Text>
                <Text size="sm" fw={600}>{filteredSegments.length}</Text>
              </Group>
              <Group gap="xs">
                <IconClock size={16} color="#40c057" />
                <Text size="sm" c="dimmed">Duration:</Text>
                <Text size="sm" fw={600}>{filteredSegments.reduce((acc, s) => acc + (parseInt((s.last_duration || '').replace(/\D/g, '')) || 0), 0)}s</Text>
              </Group>
              <Group gap="xs">
                <IconDatabase size={16} color="#fd7e14" />
                <Text size="sm" c="dimmed">Size:</Text>
                <Text size="sm" fw={600}>{formatFileSize(filteredSegments.reduce((acc, s) => acc + (s.size || 0), 0))}</Text>
              </Group>
              <Group gap="xs">
                <IconRadio size={16} color="#fa5252" />
                <Text size="sm" c="dimmed">Live:</Text>
                <Text size="sm" fw={600}>{filteredSegments.filter(s => s.is_live).length}</Text>
              </Group>
            </Group>

            {/* Live mode info */}
            {isLiveMode && (
                              <Alert icon={<IconRadio size={16} />} color="red" variant="light" mb="md">
                <Group justify="space-between" align="center">
                  <Text size="sm">
                    <strong>Real-time Mode Active:</strong> Segments are automatically updating every 10 minutes
                    {lastUpdateTime && ` • Last update: ${lastUpdateTime.toLocaleTimeString()}`}
                  </Text>
                </Group>
              </Alert>
            )}

            {/* New segments notification */}
            {showNewSegmentsNotification && newSegmentsCount > 0 && (
              <Alert icon={<IconPlus size={16} />} color="green" variant="light" mb="md" withCloseButton onClose={() => setShowNewSegmentsNotification(false)}>
                <Group justify="space-between" align="center">
                  <Text size="sm">
                    <strong>New Segments Detected!</strong> {newSegmentsCount} new segment{newSegmentsCount > 1 ? 's' : ''} have been added to this flow.
                  </Text>
                  <Button variant="subtle" size="xs" onClick={() => setShowNewSegmentsNotification(false)}>
                    Dismiss
                  </Button>
                </Group>
              </Alert>
            )}

            {segmentsError && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md" withCloseButton onClose={() => setSegmentsError(null)}>
                {segmentsError}
              </Alert>
            )}

            <AdvancedFilter
              filters={segmentFilterOptions}
              value={segFilters}
              onChange={updateSegFilters}
              presets={segSavedPresets}
              onPresetSave={(preset) => setSegSavedPresets([...segSavedPresets, preset])}
              onPresetDelete={(presetId) => setSegSavedPresets(segSavedPresets.filter(p => p.id !== presetId))}
            />

            {segmentsLoading ? (
              <Box ta="center" py="xl"><Loader size="lg" /><Text mt="md" c="dimmed">Loading segments...</Text></Box>
            ) : filteredSegments.length === 0 ? (
              <Box ta="center" py="xl"><Text c="dimmed">No segments found.</Text></Box>
            ) : viewMode === 'timeline' ? (
              <Timeline active={filteredSegments.length - 1} bulletSize={24} lineWidth={2}>
                {filteredSegments
                  .slice()
                  .sort((a, b) => new Date(a.timerange.start).getTime() - new Date(b.timerange.start).getTime())
                  .map((segment) => (
                  <Timeline.Item key={segment.id} bullet={getFormatIcon(segment.flow_format || flow.format)} title={
                    <Group gap="xs" align="center">
                      <Text fw={600}>{flow.label}</Text>
                      <Badge color={getStatusColor(segment.status)} variant="light" size="sm">{segment.status}</Badge>
                      {segment.is_live && (
                        <Badge color="red" variant="filled" size="xs" leftSection={<IconRadio size={10} />}>
                          LIVE
                        </Badge>
                      )}
                      {segment.created_at && isLiveMode && (
                        <Badge color="green" variant="light" size="xs">
                          {new Date(segment.created_at).toLocaleTimeString()}
                        </Badge>
                      )}
                    </Group>
                  }>
                    <Card withBorder p="md" mt="xs">
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Group gap="xs">
                            <IconClock size={14} />
                            <Text size="sm">{formatTimestamp(segment.timerange.start)} - {formatTimestamp(segment.timerange.end)}</Text>
                          </Group>
                          <Group gap="xs">
                            <Badge color="blue" variant="light" size="sm">{formatIsoDuration(segment.last_duration || 'PT0S')}</Badge>
                            {segment.size && (<Badge color="gray" variant="light" size="sm">{formatFileSize(segment.size)}</Badge>)}
                          </Group>
                        </Group>
                        <Text size="sm" c="dimmed">{segment.description}</Text>
                        {segment.tags && (
                          <Group gap="xs" wrap="wrap">{Object.entries(segment.tags).map(([k,v]) => (<Badge key={k} color="gray" variant="outline" size="xs">{k}: {v}</Badge>))}</Group>
                        )}
                        <Group gap="xs" mt="xs">
                          <Button size="xs" variant="light" leftSection={<IconEye size={14} />} onClick={() => { setSelectedSegment(segment); setShowDetailsModal(true); }}>Details</Button>
                          <Button size="xs" variant="light" leftSection={<IconPlayerPlay size={14} />} onClick={() => handlePlaySegment(segment)} disabled={!canPlaySegment(segment)}>Play</Button>
                          <Button 
                            size="xs" 
                            variant="light" 
                            leftSection={<IconDownload size={14} />}
                            onClick={() => {
                              if (segment.get_urls && segment.get_urls.length > 0) {
                                const downloadUrl = segment.get_urls.find(url => url.label?.includes('GET'))?.url;
                                if (downloadUrl) {
                                  window.open(downloadUrl, '_blank');
                                } else {
                                  setError('No download URL available for this segment');
                                }
                              } else {
                                setError('No download URLs available for this segment');
                              }
                            }}
                          >
                            Download
                          </Button>
                        </Group>
                      </Stack>
                    </Card>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <ScrollArea h={600}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Segment</Table.Th>
                      <Table.Th>Time Range</Table.Th>
                      <Table.Th>Duration</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Size</Table.Th>
                      <Table.Th>Tags</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                  {filteredSegments.map((segment) => (
                      <Table.Tr key={segment.id}>
                        <Table.Td>
                          <Group gap="xs">
                            {getFormatIcon(segment.flow_format || flow.format)}
                            <Box>
                              <Text 
                                size="sm" 
                                fw={500} 
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => handlePlaySegment(segment)}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#228be6'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
                              >
                                {segment.description}
                              </Text>
                            {segment.is_live && (
                                <Badge color="red" variant="filled" size="xs" leftSection={<IconRadio size={8} />}>
                                LIVE
                              </Badge>
                            )}
                            </Box>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs">{formatTimestamp(segment.timerange.start)}</Text>
                          <Text size="xs" c="dimmed">to {formatTimestamp(segment.timerange.end)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs">{formatIsoDuration(segment.last_duration || 'PT0S')}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getStatusColor(segment.status)} variant="light" size="sm">
                            {segment.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs">{segment.size ? formatFileSize(segment.size) : 'N/A'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" wrap="wrap">
                            {segment.tags && Object.entries(segment.tags).slice(0, 2).map(([k,v]) => (
                              <Badge key={k} color="gray" variant="outline" size="xs">{k}: {v}</Badge>
                            ))}
                            {segment.tags && Object.keys(segment.tags).length > 2 && (
                              <Badge color="gray" variant="outline" size="xs">+{Object.keys(segment.tags).length - 2}</Badge>
                            )}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Tooltip label="View Details">
                              <ActionIcon size="sm" variant="light" onClick={() => { setSelectedSegment(segment); setShowDetailsModal(true); }}>
                                <IconEye size={12} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Play Segment">
                              <ActionIcon size="sm" variant="light" onClick={() => handlePlaySegment(segment)} disabled={!canPlaySegment(segment)}>
                                <IconPlayerPlay size={12} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Download">
                              <ActionIcon 
                                size="sm" 
                                variant="light"
                                onClick={() => {
                                  if (segment.get_urls && segment.get_urls.length > 0) {
                                    const downloadUrl = segment.get_urls.find(url => url.label?.includes('GET'))?.url;
                                    if (downloadUrl) {
                                      window.open(downloadUrl, '_blank');
                                    } else {
                                      setError('No download URL available for this segment');
                                    }
                                  } else {
                                    setError('No download URLs available for this segment');
                                  }
                                }}
                              >
                                <IconDownload size={12} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                  ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            )}
          </Card>

          {/* Secondary Tabs */}
      <Tabs value={activeTab} onChange={(val) => setActiveTab((val as any) || 'overview')}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconInfoCircle size={16} />}>
                Flow Overview
          </Tabs.Tab>
          <Tabs.Tab value="tags" leftSection={<IconTags size={16} />}>
            Tags
          </Tabs.Tab>
          <Tabs.Tab value="storage" leftSection={<IconStorage size={16} />}>
            Storage
          </Tabs.Tab>
          <Tabs.Tab value="technical" leftSection={<IconSettings size={16} />}>
            Technical Details
          </Tabs.Tab>
          <Tabs.Tab value="analytics" leftSection={<IconChartBar size={16} />}>
            Analytics
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="xl">
              <Stack gap="lg">
                {/* Flow Information */}
                <Card withBorder p="xl">
                  <Title order={4} mb="md">Flow Information</Title>
                  <Grid>
                    <Grid.Col span={6}>
                      <Stack gap="md">
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Flow ID</Text>
                          <Text size="sm" style={{ fontFamily: 'monospace' }}>{flow.id}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Source ID</Text>
                          <Text size="sm" style={{ fontFamily: 'monospace' }}>{flow.source_id}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Created By</Text>
                          <Text size="sm">{flow.created_by}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Created</Text>
                          <Text size="sm">{formatTimestamp(flow.created)}</Text>
                        </Box>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Stack gap="md">
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Format</Text>
                          <Text size="sm">{flow.format}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Codec</Text>
                          <Text size="sm">{flow.codec}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Updated By</Text>
                          <Text size="sm">{flow.updated_by}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Last Updated</Text>
                          <Text size="sm">{formatTimestamp(flow.updated)}</Text>
                        </Box>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Card>

                {/* Collection Management */}
                <Card withBorder p="xl">
                  <Group justify="space-between" mb="md">
                    <Title order={4}>Collection Management</Title>
                              <Button 
                      size="sm"
                                variant="light" 
                      onClick={() => navigate('/flow-collections')}
                    >
                      Manage Collections
                              </Button>
                  </Group>
                  <Stack gap="md">
                    {flow.collection_id ? (
                      <Group gap="md">
                        <Badge variant="light" color="purple" size="lg">
                          {flow.collection_label || 'Collection'}
                        </Badge>
                        <Text size="sm" c="dimmed">
                          This flow is part of a collection
                        </Text>
                              <Button 
                                size="xs" 
                                variant="light" 
                          onClick={() => navigate(`/flow-collections/${flow.collection_id}`)}
                              >
                          View Collection
                              </Button>
                      </Group>
                    ) : (
                      <Group gap="md">
                        <Text size="sm" c="dimmed">
                          This flow is not part of any collection
                        </Text>
                        <Button
                          size="sm"
                          variant="light"
                          onClick={() => navigate('/flow-collections')}
                        >
                          Add to Collection
                        </Button>
                      </Group>
                    )}
                            </Stack>
                </Card>

                {/* Description & Label Management */}
                {flowId ? (
                  <FlowDescriptionManager
                    flowId={flowId}
                    initialDescription={flow.description}
                    initialLabel={flow.label}
                    disabled={disabled}
                    onDescriptionChange={(description) => setFlow({ ...flow, description })}
                    onLabelChange={(label) => setFlow({ ...flow, label })}
                  />
                ) : (
                  <Card withBorder p="xl">
                    <Title order={4} mb="md">Description & Label</Title>
                    <Text size="sm" c="dimmed">Flow ID is required to manage description and label.</Text>
                  </Card>
                )}

                {/* Flow Collection Management */}
                {flowId ? (
                  <FlowCollectionManager
                    flowId={flowId}
                    initialCollection={flow.flow_collection || []}
                    disabled={disabled}
                    onCollectionChange={(collection) => setFlow({ ...flow, flow_collection: collection })}
                  />
                ) : (
                  <Card withBorder p="xl">
                    <Title order={4} mb="md">Flow Collection</Title>
                    <Text size="sm" c="dimmed">Flow ID is required to manage flow collection.</Text>
                  </Card>
                )}

                {/* Current Tags Display */}
                <Card withBorder p="xl">
                  <Title order={4} mb="md">Current Tags</Title>
                  {Object.keys(flow.tags || {}).length > 0 ? (
                    <Group gap="xs" wrap="wrap">
                      {Object.entries(flow.tags || {}).map(([key, value]) => (
                        <Badge key={key} color="blue" variant="light" size="lg">
                          {key}: {value}
                        </Badge>
                      ))}
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed" fs="italic">
                      No tags defined for this flow. Use the Tags tab to add and manage tags.
                    </Text>
                  )}
                  <Button
                    variant="light"
                    size="sm"
                    leftSection={<IconTags size={16} />}
                    onClick={() => setActiveTab('tags')}
                    mt="md"
                  >
                    Manage Tags
                  </Button>
                </Card>
              </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="tags" pt="xl">
          <Stack gap="xl">
            {flowId ? (
              <FlowTagsManager 
                flowId={flowId}
                initialTags={flow.tags || {}}
                disabled={disabled}
                readOnly={flow.read_only}
                onTagsChange={(tags: Record<string, string>) => {
                  // Update flow tags in parent component
                  setFlow(prev => prev ? { ...prev, tags } : null);
                  console.log('Flow tags updated:', tags);
                }}
              />
            ) : (
              <Alert icon={<IconAlertCircle size={16} />} color="red" title="Flow ID Required">
                Flow ID is required to manage flow tags.
              </Alert>
            )}
          </Stack>
        </Tabs.Panel>



        <Tabs.Panel value="storage" pt="xl">
          <Stack gap="xl">
            <Card withBorder>
              <Title order={3} mb="md">Storage Allocation Manager</Title>
              <Text size="sm" c="dimmed" mb="lg">
                Allocate storage for this flow to enable media uploads. Storage allocation provides pre-signed URLs for direct uploads.
              </Text>
              
              {flowId ? (
                <StorageAllocationManager 
                  flowId={flowId}
                  onAllocate={handleStorageAllocated}
                  onDelete={handleStorageDeleted}
                />
              ) : (
                <Alert icon={<IconAlertCircle size={16} />} color="red" title="Flow ID Required">
                  Flow ID is required to manage storage allocation.
                </Alert>
              )}
            </Card>
              </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="technical" pt="xl">
          <Grid>
            <Grid.Col span={6}>
                <Card withBorder p="xl">
                <Title order={4} mb="md">Video Specifications</Title>
                  <Stack gap="md">
                    <Box>
                    <Text size="sm" fw={500} mb="xs">Resolution</Text>
                    <Text size="sm">{flow.frame_width} x {flow.frame_height}</Text>
                    </Box>
                    <Box>
                    <Text size="sm" fw={500} mb="xs">Frame Rate</Text>
                    <Text size="sm">{flow.frame_rate}</Text>
                    </Box>
                      <Box>
                    <Text size="sm" fw={500} mb="xs">Interlace Mode</Text>
                    <Text size="sm">{flow.interlace_mode || 'N/A'}</Text>
                      </Box>
                      <Box>
                    <Text size="sm" fw={500} mb="xs">Color Sampling</Text>
                    <Text size="sm">{flow.color_sampling || 'N/A'}</Text>
                      </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Color Space</Text>
                    <Text size="sm">{flow.color_space || 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Transfer Characteristics</Text>
                    <Text size="sm">{flow.transfer_characteristics || 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Color Primaries</Text>
                    <Text size="sm">{flow.color_primaries || 'N/A'}</Text>
                  </Box>
                  </Stack>
                </Card>
            </Grid.Col>

            <Grid.Col span={6}>
                  <Card withBorder p="xl">
                <Title order={4} mb="md">Audio Specifications</Title>
                <Stack gap="md">
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Sample Rate</Text>
                    <Text size="sm">{flow.sample_rate ? `${flow.sample_rate} Hz` : 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Bits Per Sample</Text>
                    <Text size="sm">{flow.bits_per_sample ? `${flow.bits_per_sample} bit` : 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Channels</Text>
                    <Text size="sm">{flow.channels ? `${flow.channels} channels` : 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Container</Text>
                    <Text size="sm">{flow.container || 'N/A'}</Text>
                  </Box>
              </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="analytics" pt="xl">
          <Stack gap="xl">
            {analyticsLoading ? (
              <Card withBorder>
                <Stack gap="md" align="center" py="xl">
                  <Loader size="lg" />
                  <Text size="lg" c="dimmed">Loading analytics data...</Text>
                </Stack>
              </Card>
            ) : analyticsData ? (
              <>
                {/* Flow Usage Analytics */}
                <Card withBorder>
                  <Title order={4} mb="md">Flow Usage Statistics</Title>
                  <Grid>
                    <Grid.Col span={4}>
                      <Paper withBorder p="md" ta="center">
                        <Text size="xl" fw={700} c="blue">
                          {analyticsData.flowUsage.total_flows}
                        </Text>
                        <Text size="sm" c="dimmed">Total Flows</Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Paper withBorder p="md" ta="center">
                        <Text size="xl" fw={700} c="green">
                          {Math.round(analyticsData.flowUsage.average_flow_size / 1024 / 1024)} MB
                        </Text>
                        <Text size="sm" c="dimmed">Average Flow Size</Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Paper withBorder p="md" ta="center">
                        <Text size="xl" fw={700} c="orange">
                          {Math.round(analyticsData.flowUsage.estimated_storage_bytes / 1024 / 1024)} MB
                        </Text>
                        <Text size="sm" c="dimmed">Total Storage</Text>
                      </Paper>
                    </Grid.Col>
                  </Grid>
                  
                  {analyticsData.flowUsage.format_distribution && (
                    <Box mt="md">
                      <Text size="sm" fw={500} mb="sm">Format Distribution</Text>
                      <Group gap="xs">
                        {Object.entries(analyticsData.flowUsage.format_distribution).map(([format, count]) => (
                          <Badge key={format} size="lg" variant="light" color="blue">
                            {format.split(':').pop()}: {count as number}
                  </Badge>
                        ))}
                      </Group>
                    </Box>
                  )}
                </Card>

                {/* Storage Usage Analytics */}
                {analyticsData.storageUsage && (
                  <Card withBorder>
                    <Title order={4} mb="md">Storage Usage Analysis</Title>
                    <Text size="sm" c="dimmed">
                      Storage usage patterns and access statistics from VAST TAMS backend.
                    </Text>
                    {/* Add more storage analytics when available */}
                  </Card>
                )}

                {/* Time Range Analysis */}
                {analyticsData.timeRangeAnalysis && (
                  <Card withBorder>
                    <Title order={4} mb="md">Time Range Patterns</Title>
                    <Text size="sm" c="dimmed">
                      Time range patterns and duration analysis from VAST TAMS backend.
                    </Text>
                    {/* Add more time range analytics when available */}
                  </Card>
                )}
              </>
            ) : (
              <Card withBorder>
                <Stack gap="md" align="center" py="xl">
                  <IconChartBar size={64} color="#ccc" />
                  <Title order={4} c="dimmed">Analytics Unavailable</Title>
                  <Text size="lg" c="dimmed" ta="center">
                    Unable to load analytics data from VAST TAMS backend
                  </Text>
                <Button
                    variant="light" 
                    onClick={loadAnalytics}
                    loading={analyticsLoading}
                  >
                    Retry
                </Button>
                </Stack>
              </Card>
            )}
          </Stack>
        </Tabs.Panel>
          </Tabs>
        </Grid.Col>

        <Grid.Col span={4}>
          <Stack gap="lg">
            {/* Video Player Box */}
            <Card withBorder p="xl">
              <Title order={4} mb="md">Video Player</Title>
              <Stack gap="md">
                {!showInlineVideoPlayer ? (
                  <Box
                    style={{
                      width: '100%',
                      height: '200px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed #dee2e6',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={handleLoadInlineVideo}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e9ecef';
                      e.currentTarget.style.borderColor = '#adb5bd';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#dee2e6';
                    }}
                  >
                    <Stack gap="md" align="center">
                      <IconPlayerPlay size={48} color="#6c757d" />
                      <Text c="dimmed" size="sm" ta="center">
                        Click to load flow stream
                  </Text>
                      <Text size="xs" c="dimmed" ta="center">
                        {flow.label}
                      </Text>
                    </Stack>
                  </Box>
                ) : (
                  <Box
                    style={{
                      width: '100%',
                      height: '200px',
                      backgroundColor: '#000',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {showInlineVideoPlayer && inlineVideoUrl ? (
                      <Stack gap="md">
                        {inlineVideoError && (
                          <Alert color="red" icon={<IconAlertCircle size={16} />}>
                            {inlineVideoError}
              </Alert>
            )}
                        <Box 
                          style={{ 
                            position: 'relative',
                            cursor: 'pointer'
                          }}
                          onClick={handleInlineVideoClose}
                          title="Click to close video player"
                        >
                          <video
                            ref={videoRef}
                            controls
                            autoPlay
                            muted
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              console.error('Video playback error:', e);
                              setInlineVideoError(`Video playback error: ${e.currentTarget.error?.message || 'Unknown error'}`);
                            }}
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking video controls
                          >
                            <source src={inlineVideoUrl} type="application/x-mpegURL" />
                            <source src={inlineVideoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </Box>
                        {cmcdSessionActive && (
                          <Group gap="xs" justify="center">
                            <Badge color="green" variant="light" size="sm">
                              CMCD Tracking Active
                            </Badge>
                            <Text size="xs" c="dimmed">
                              Metrics: {cmcdMetrics.length}
                  </Text>
                            <Button
                              variant="light"
                              size="xs"
                              onClick={() => setShowCMCD(!showCMCD)}
                            >
                              {showCMCD ? 'Hide' : 'Show'} CMCD
                  </Button>
                </Group>
                        )}
                      </Stack>
                    ) : (
                      <Box
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#000'
                        }}
                      >
                        <Text c="white" size="sm">Loading video player...</Text>
                      </Box>
                    )}
                  </Box>
                )}
              </Stack>
              
              {/* CMCD Data Display */}
              {renderCMCDData()}
            </Card>

            {/* Segment Metadata */}
              <Card withBorder p="md">
              <Title order={5} mb="sm">
                {selectedSegment ? 'Segment Details' : 'Flow Overview'}
              </Title>
              <Stack gap="sm">
                {selectedSegment ? (
                  <>
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">Segment</Text>
                      <Text size="sm" fw={500} c="blue">{selectedSegment.description}</Text>
                </Group>
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">Format</Text>
                      <Badge variant="light" color="blue" size="sm">
                        {getFormatLabel(selectedSegment.flow_format || flow.format)}
                      </Badge>
                </Group>
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">Status</Text>
                      <Badge color={getStatusColor(selectedSegment.status)} variant="light" size="sm">
                        {selectedSegment.status}
                      </Badge>
                </Group>
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">Duration</Text>
                      <Text size="sm" fw={500}>{formatIsoDuration(selectedSegment.last_duration || 'PT0S')}</Text>
                </Group>
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">Size</Text>
                      <Text size="sm" fw={500}>{selectedSegment.size ? formatFileSize(selectedSegment.size) : 'N/A'}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">Time Range</Text>
                      <Text size="xs">{formatTimestamp(selectedSegment.timerange.start)}</Text>
                    </Group>
                    {selectedSegment.is_live && (
                      <Group justify="space-between">
                        <Text size="xs" c="dimmed">Status</Text>
                        <Badge color="red" variant="filled" size="sm" leftSection={<IconRadio size={8} />}>
                          LIVE
                        </Badge>
                      </Group>
                    )}
                    {selectedSegment.tags && Object.keys(selectedSegment.tags).length > 0 && (
                      <Box>
                        <Text size="xs" c="dimmed" mb="xs">Tags</Text>
                        <Group gap="xs" wrap="wrap">
                          {Object.entries(selectedSegment.tags).map(([k,v]) => (
                            <Badge key={k} color="gray" variant="outline" size="xs">{k}: {v}</Badge>
                          ))}
                        </Group>
                      </Box>
                    )}
                  </>
                ) : (
                  <>
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">Format</Text>
                      <Badge variant="light" color="blue" size="sm">
                        {getFormatLabel(flow.format)}
                      </Badge>
                    </Group>
                        <Group justify="space-between">
                      <Text size="xs" c="dimmed">Codec</Text>
                      <Badge variant="light" color="green" size="sm">
                        {flow.codec}
                      </Badge>
                          </Group>
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">Status</Text>
                      <Badge color={getStatusColor(flow.status || 'unknown')} variant="light" size="sm">
                        {flow.status || 'Unknown'}
                      </Badge>
                          </Group>
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">Read Only</Text>
                      <Badge color={flow.read_only ? 'red' : 'green'} variant="light" size="sm">
                        {flow.read_only ? 'Yes' : 'No'}
                      </Badge>
                        </Group>
                    {flow.avg_bit_rate && (
                      <Group justify="space-between">
                        <Text size="xs" c="dimmed">Avg Bitrate</Text>
                        <Text size="sm" fw={500}>{Math.round(flow.avg_bit_rate / 1000000)} Mbps</Text>
                      </Group>
                    )}
                    {flow.max_bit_rate && (
                      <Group justify="space-between">
                        <Text size="xs" c="dimmed">Max Bitrate</Text>
                        <Text size="sm" fw={500}>{Math.round(flow.max_bit_rate / 1000000)} Mbps</Text>
                      </Group>
                    )}
                  </>
                )}
              </Stack>
            </Card>

            {/* Quick Actions */}
            <Card withBorder p="xl">
              <Title order={4} mb="md">Quick Actions</Title>
              <Stack gap="sm">
                          <Button 
                            variant="light" 
                  leftSection={<IconEdit size={16} />} 
                  onClick={() => setShowEditModal(true)}
                  fullWidth
                >
                  Edit Flow
                          </Button>
                <Button 
                  variant="light" 
                  leftSection={<IconRefresh size={16} />} 
                  onClick={refreshFlowDetails}
                  loading={refreshing}
                  fullWidth
                >
                  Refresh Data
                </Button>
                <Button 
                  variant="light" 
                  leftSection={<IconTags size={16} />} 
                  onClick={() => setActiveTab('tags')}
                  fullWidth
                >
                  Manage Tags
                </Button>
                <Button 
                  variant="light" 
                  leftSection={<IconStorage size={16} />} 
                  onClick={() => setActiveTab('storage')}
                  fullWidth
                >
                  Storage Settings
                </Button>
                      </Stack>
                    </Card>

            {/* Read-Only Status Management */}
            {flowId ? (
              <FlowReadOnlyManager
                flowId={flowId}
                initialReadOnly={flow.read_only}
                disabled={disabled}
                onReadOnlyChange={(readOnly) => setFlow({ ...flow, read_only: readOnly })}
              />
            ) : (
              <Card withBorder p="xl">
                <Title order={4} mb="md">Read-Only Status</Title>
                <Text size="sm" c="dimmed">Flow ID is required to manage read-only status.</Text>
              </Card>
                            )}
                          </Stack>
                        </Grid.Col>
                      </Grid>

          {/* Segment Details Modal */}
          {selectedSegment && (
            <Modal opened={showDetailsModal} onClose={() => setShowDetailsModal(false)} title="Segment Details" size="lg">
              <Stack gap="md">
                <Group gap="md">
                  <Box>
                    <Text size="sm" fw={500}>Flow</Text>
                    <Text size="sm">{flow.label}</Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500}>Format</Text>
                    <Group gap="xs">{getFormatIcon(selectedSegment.flow_format || flow.format)}<Text size="sm">{getFormatLabel(selectedSegment.flow_format || flow.format)}</Text></Group>
                  </Box>
                  <Box>
                    <Text size="sm" fw={500}>Status</Text>
                    <Badge color={getStatusColor(selectedSegment.status)} variant="light">{selectedSegment.status}</Badge>
                  </Box>
                </Group>
                <Divider />
                <Group gap="md">
                  <Box><Text size="sm" fw={500}>Start Time</Text><Text size="sm">{formatTimestamp(selectedSegment.timerange.start)}</Text></Box>
                  <Box><Text size="sm" fw={500}>End Time</Text><Text size="sm">{formatTimestamp(selectedSegment.timerange.end)}</Text></Box>
                  <Box><Text size="sm" fw={500}>Duration</Text><Text size="sm">{formatIsoDuration(selectedSegment.last_duration || 'PT0S')}</Text></Box>
                </Group>
                {selectedSegment.size && (<Box><Text size="sm" fw={500}>File Size</Text><Text size="sm">{formatFileSize(selectedSegment.size)}</Text></Box>)}
                {selectedSegment.description && (<Box><Text size="sm" fw={500}>Description</Text><Text size="sm">{selectedSegment.description}</Text></Box>)}
                {selectedSegment.tags && (
                  <Box>
                    <Text size="sm" fw={500}>Tags</Text>
                    <Group gap="xs" wrap="wrap">{Object.entries(selectedSegment.tags).map(([k,v]) => (<Badge key={k} color="gray" variant="outline">{k}: {v}</Badge>))}</Group>
                  </Box>
                )}
                <Group gap="xs" mt="md">
                  <Button leftSection={<IconPlayerPlay size={16} />} onClick={() => handlePlaySegment(selectedSegment)} disabled={!canPlaySegment(selectedSegment)}>Play Segment</Button>
                  <Button variant="light" leftSection={<IconDownload size={16} />}>Download</Button>
                </Group>
              </Stack>
            </Modal>
          )}


          {/* Video Player Modal */}
          {selectedSegment && canPlaySegment(selectedSegment) && (
        <Modal opened={showVideoPlayer} onClose={handleVideoPlayerClose} title={`Video Player - ${flow.label}`} size="xl" fullScreen>
              <Stack gap="md">
                <Group justify="space-between">
                  <Box>
                    <Title order={4}>{selectedSegment.description}</Title>
                    <Text size="sm" c="dimmed">{flow.label} • HLS Stream • {formatFileSize(selectedSegment.size || 0)}</Text>
                  </Box>
                  <Group>
                    <Button variant="light" leftSection={<IconDownload size={16} />}>Download</Button>
                    <Button variant="light" leftSection={<IconChartBar size={16} />} onClick={() => setShowCMCDPanel(!showCMCDPanel)}>
                      {showCMCDPanel ? 'Hide' : 'Show'} Analytics
                    </Button>
                    <Button variant="light" onClick={() => setShowVideoPlayer(false)}>Close</Button>
                  </Group>
                </Group>
                
                <Grid>
                  <Grid.Col span={showCMCDPanel ? 8 : 12}>
                    {selectedSegment.get_urls && selectedSegment.get_urls.length > 0 ? (
                      // Use VAST TAMS Video Player for segments with presigned URLs
                      <VastTamsVideoPlayer
                        segment={{
                          id: selectedSegment.id,
                          timerange: `${selectedSegment.timerange.start}/${selectedSegment.timerange.end}`,
                          get_urls: selectedSegment.get_urls,
                          format: selectedSegment.flow_format || flow?.format,
                          codec: flow?.codec,
                          size: selectedSegment.size,
                          created: selectedSegment.created_at,
                          updated: selectedSegment.updated_at,
                          tags: selectedSegment.tags,
                          deleted: false,
                          deleted_at: null,
                          deleted_by: null
                        }}
                        title={selectedSegment.description || flow.label}
                        description={`VAST TAMS segment playback for ${flow.label}`}
                    onClose={handleVideoPlayerClose}
                        showControls={true}
                        autoPlay={true}
                        onError={(error) => {
                          console.error('VAST TAMS Video Player Error:', error);
                          setError(`Video playback error: ${error}`);
                        }}
                      />
                    ) : (
                      // Fallback to HLS stream
                      <HLSVideoPlayer
                        hlsUrl={getHLSStreamUrl(flowId || '')}
                        title={selectedSegment.description || flow.label}
                        description={`HLS stream for ${flow.label}`}
                    onClose={handleVideoPlayerClose}
                        showControls={true}
                        autoPlay={true}
                        onError={(error) => {
                          console.error('HLS Video Player Error:', error);
                          setError(`Video playback error: ${error}`);
                        }}
                      />
                    )}
                  </Grid.Col>
                  
                  {showCMCDPanel && (
                    <Grid.Col span={4}>
                      <Card withBorder p="md" h="70vh">
                        <Stack gap="md">
                          <Group justify="space-between">
                            <Title order={5}>CMCD Analytics</Title>
                        <Group gap="xs">
                          <Badge color="green" variant="light">Live</Badge>
                          {cmcdSessionActive && <Badge color="blue" variant="light">Active</Badge>}
                        </Group>
                          </Group>
                          
                          <Divider />
                          
                          {/* Real-time metrics */}
                          <Box>
                            <Text size="sm" fw={500} mb="xs">Current Metrics</Text>
                        {cmcdMetrics.length > 0 ? (
                              <Stack gap="xs">
                                <Group gap="xs">
                                  <Text size="xs" c="dimmed">Buffer:</Text>
                                  <Text size="xs" fw={500}>
                                    {(() => {
                                      const bufferLength = cmcdMetrics[cmcdMetrics.length - 1]?.bufferLength;
                                      return bufferLength ? `${Math.round(bufferLength)}s` : 'N/A';
                                    })()}
                                  </Text>
                                </Group>
                                <Group gap="xs">
                                  <Text size="xs" c="dimmed">Playback Rate:</Text>
                                  <Text size="xs" fw={500}>
                                    {(() => {
                                      const playbackRate = cmcdMetrics[cmcdMetrics.length - 1]?.playbackRate;
                                      return playbackRate ? `${playbackRate}x` : 'N/A';
                                    })()}
                                  </Text>
                                </Group>
                                <Group gap="xs">
                                  <Text size="xs" c="dimmed">Duration:</Text>
                                  <Text size="xs" fw={500}>
                                    {(() => {
                                      const objectDuration = cmcdMetrics[cmcdMetrics.length - 1]?.objectDuration;
                                      return objectDuration ? `${Math.round(objectDuration)}s` : 'N/A';
                                    })()}
                                  </Text>
                                </Group>
                                <Group gap="xs">
                                  <Text size="xs" c="dimmed">Bandwidth:</Text>
                                  <Text size="xs" fw={500}>
                                    {(() => {
                                      const bandwidth = cmcdMetrics[cmcdMetrics.length - 1]?.bandwidth;
                                      return bandwidth ? `${Math.round(bandwidth)} kbps` : 'N/A';
                                    })()}
                                  </Text>
                                </Group>
                            <Group gap="xs">
                              <Text size="xs" c="dimmed">Quality Level:</Text>
                              <Text size="xs" fw={500}>
                                {(() => {
                                  const qualityLevel = cmcdMetrics[cmcdMetrics.length - 1]?.qualityLevel;
                                  return qualityLevel !== undefined ? `${qualityLevel}` : 'N/A';
                                })()}
                              </Text>
                            </Group>
                              </Stack>
                        ) : (
                          <Text size="xs" c="dimmed" ta="center" py="md">
                            {cmcdSessionActive ? 'Collecting metrics...' : 'Start video playback to see metrics'}
                          </Text>
                            )}
                          </Box>
                          
                          <Divider />
                          
                          {/* Performance indicators */}
                          <Box>
                            <Text size="sm" fw={500} mb="xs">Performance</Text>
                            <Stack gap="xs">
                              <Group gap="xs">
                                <Text size="xs" c="dimmed">Startup Time:</Text>
                                <Text size="xs" fw={500}>
                                  {(() => {
                                    const startupMetric = cmcdMetrics.find(m => m.startupTime);
                                    return startupMetric?.startupTime ? `${Math.round(startupMetric.startupTime)}ms` : 'N/A';
                                  })()}
                                </Text>
                              </Group>
                              <Group gap="xs">
                                <Text size="xs" c="dimmed">Rebuffering:</Text>
                                <Text size="xs" fw={500}>
                                  {(() => {
                                    const rebufferingMetric = cmcdMetrics.find(m => m.rebufferingEvents);
                                    return rebufferingMetric?.rebufferingEvents || 0;
                                  })()} events
                                </Text>
                              </Group>
                              <Group gap="xs">
                                <Text size="xs" c="dimmed">Frames:</Text>
                                <Text size="xs" fw={500}>
                                  {(() => {
                                    const framesMetric = cmcdMetrics.find(m => m.decodedFrames);
                                    return framesMetric?.decodedFrames || 0;
                                  })()} decoded
                                </Text>
                              </Group>
                          <Group gap="xs">
                            <Text size="xs" c="dimmed">Dropped Frames:</Text>
                            <Text size="xs" fw={500}>
                              {(() => {
                                const droppedMetric = cmcdMetrics.find(m => m.droppedFrames);
                                return droppedMetric?.droppedFrames || 0;
                              })()} frames
                            </Text>
                          </Group>
                            </Stack>
                          </Box>
                          
                          <Divider />
                          
                      {/* Hydrolix Integration */}
                          <Box>
                        <Text size="sm" fw={500} mb="xs">Hydrolix Integration</Text>
                            <Stack gap="xs">
                          <Button 
                            size="xs" 
                            variant="light" 
                            leftSection={<IconUpload size={14} />}
                            onClick={async () => {
                              try {
                                await cmcdTracker.sendMetricsToAnalytics('/api/analytics/cmcd');
                                // Show success feedback
                                console.log('CMCD data sent to Hydrolix successfully');
                              } catch (error) {
                                console.error('Failed to send CMCD data to Hydrolix:', error);
                              }
                            }}
                          >
                            Send to Hydrolix
                          </Button>
                              <Button 
                                size="xs" 
                                variant="light" 
                                leftSection={<IconDownload size={14} />}
                                onClick={() => {
                                  const session = cmcdTracker.getSession();
                                  const dataStr = JSON.stringify(session, null, 2);
                                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                  const url = URL.createObjectURL(dataBlob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `cmcd_${selectedSegment.id}_${Date.now()}.json`;
                                  link.click();
                                  URL.revokeObjectURL(url);
                                }}
                              >
                                Export Session
                              </Button>
                              <Button 
                                size="xs" 
                                variant="light" 
                            leftSection={<IconActivity size={14} />}
                                onClick={() => {
                              // Simulate real-time data streaming to Hydrolix
                              const interval = setInterval(() => {
                                if (cmcdSessionActive && cmcdMetrics.length > 0) {
                                  cmcdTracker.sendMetricsToAnalytics('/api/analytics/cmcd/stream');
                                } else {
                                  clearInterval(interval);
                                }
                              }, 5000);
                            }}
                          >
                            Stream to Hydrolix
                              </Button>
                            </Stack>
                          </Box>
                          
                          <Box style={{ flex: 1 }} />
                          
                          {/* Session info */}
                          <Box>
                            <Text size="xs" c="dimmed">Session ID</Text>
                            <Text size="xs" style={{ fontFamily: 'monospace' }}>
                              {cmcdTracker.getSession().id}
                            </Text>
                        <Text size="xs" c="dimmed" mt="xs">Metrics Count: {cmcdMetrics.length}</Text>
                          </Box>
                        </Stack>
                      </Card>
                    </Grid.Col>
                  )}
                </Grid>
              </Stack>
            </Modal>
          )}

      {/* Edit Flow Modal */}
      <Modal
        opened={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Flow"
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Label"
            value={flow.label}
            onChange={(event) => setFlow({ ...flow, label: event.currentTarget.value })}
          />
          <Textarea
            label="Description"
            value={flow.description}
            onChange={(event) => setFlow({ ...flow, description: event.currentTarget.value })}
            rows={3}
          />
          <Select
            label="Status"
            value={flow.status || null}
            onChange={(value) => setFlow({ ...flow, status: value as 'active' | 'inactive' | 'processing' | 'error' })}
            data={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'processing', label: 'Processing' },
              { value: 'error', label: 'Error' }
            ]}
          />
          <Switch
            label="Read Only"
            checked={flow.read_only}
            onChange={(event) => setFlow({ ...flow, read_only: event.currentTarget.checked })}
          />
          <Group gap="xs" justify="flex-end">
            <Button variant="light" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={async () => {
              if (!flowId) return;
              
              try {
                await apiClient.updateFlow(flowId, flow);
                setShowEditModal(false);
              } catch (err: any) {
                setError('Failed to update flow');
                console.error(err);
              }
            }}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>


      {/* Upload Segment Modal */}
      <Modal
        opened={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Media Segment"
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Upload a new media segment to this flow. The segment will be immediately available for playback.
          </Text>
          
          <FileInput
            label="Media File"
            placeholder="Select media file"
            accept="video/*,audio/*"
            required
            id="segment-file"
          />
          
          <TextInput
            id="object-id"
            label="Object ID"
            placeholder="Auto-generated if empty"
            description="Unique identifier for this segment"
          />
          
          <Group grow>
            <TextInput
              id="start-time"
              label="Start Time"
              placeholder="HH:MM:SS"
              description="Segment start time"
            />
            <TextInput
              id="end-time"
              label="End Time"
              placeholder="HH:MM:SS"
              description="Segment end time"
            />
          </Group>
          
          <Textarea
            id="description"
            label="Description"
            placeholder="Segment description"
            rows={3}
          />
          
          <TextInput
            id="tags"
            label="Tags"
            placeholder="key1:value1,key2:value2"
            description="Comma-separated key-value pairs"
          />
          
          <Group gap="xs" justify="flex-end">
            <Button variant="light" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const fileInput = document.getElementById('segment-file') as HTMLInputElement;
                const objectIdInput = document.getElementById('object-id') as HTMLInputElement;
                const startTimeInput = document.getElementById('start-time') as HTMLInputElement;
                const endTimeInput = document.getElementById('end-time') as HTMLInputElement;
                const descriptionInput = document.getElementById('description') as HTMLTextAreaElement;
                const tagsInput = document.getElementById('tags') as HTMLInputElement;
                
                if (fileInput?.files?.[0]) {
                  const file = fileInput.files[0];
                  
                  // Parse tags from comma-separated string
                  const tags: Record<string, string> = {};
                  if (tagsInput?.value) {
                    tagsInput.value.split(',').forEach(tag => {
                      const [key, value] = tag.trim().split(':');
                      if (key && value) {
                        tags[key] = value;
                      }
                    });
                  }
                  
                  const segmentData = {
                    object_id: objectIdInput?.value || undefined,
                    timerange: `${startTimeInput?.value || '00:00:00'}_${endTimeInput?.value || '00:01:00'}`,
                    description: descriptionInput?.value || 'Uploaded segment',
                    tags
                  };
                  
                  console.log('Uploading segment with data:', segmentData);
                  handleUploadSegment(file, segmentData);
                } else {
                  setError('Please select a file to upload');
                }
              }}
              loading={uploadingSegment}
              disabled={uploadingSegment}
            >
              Upload Segment
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
} 