
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
  IconTags,
  IconShieldCheck,
  IconClipboardCheck,
  IconTrash
} from '@tabler/icons-react';
import { apiClient } from '../services/api';
import AdvancedFilter, { FilterOption, FilterPreset } from '../components/AdvancedFilter';
import { useFilterPersistence } from '../hooks/useFilterPersistence';
import { cmcdTracker, type CMCDMetrics } from '../services/cmcdService';
import { FlowTagsManager } from '../components/FlowTagsManager';
import { FlowDescriptionManager } from '../components/FlowDescriptionManager';
// FlowCollectionManager removed - backend doesn't support /flows/:id/flow_collection endpoint
import { FlowReadOnlyManager } from '../components/FlowReadOnlyManager';

import HLSVideoPlayer from '../components/HLSVideoPlayer';
import VastTamsVideoPlayer from '../components/VastTamsVideoPlayer';
import { transformSegmentUrls } from '../utils/s3Proxy';

// BBC TAMS Flow interface based on real API response
interface FlowDetails {
  id: string;
  source_id: string;
  format: string;
  codec?: string;
  label?: string;
  description?: string;
  created_by?: string;
  updated_by?: string;
  created?: string;
  metadata_updated?: string; // API uses metadata_updated, not "updated"
  segments_updated?: string;
  tags?: Record<string, string | string[]>; // Tags can be arrays or strings
  read_only?: boolean;
  
  // Essence parameters (nested structure for video/audio)
  essence_parameters?: {
    // Video essence parameters
    frame_width?: number;
    frame_height?: number;
    frame_rate?: {
      numerator: number;
      denominator?: number;
    };
    interlace_mode?: 'progressive' | 'interlaced_tff' | 'interlaced_bff' | 'interlaced_psf';
    colorspace?: 'BT601' | 'BT709' | 'BT2020' | 'BT2100';
    transfer_characteristic?: 'SDR' | 'HLG' | 'PQ';
    bit_depth?: number; // Used for both video and audio
    // Audio essence parameters
    sample_rate?: number;
    channels?: number;
  };
  
  // Common fields from flow-core.json
  container?: string;
  avg_bit_rate?: number; // in 1000 bits/second
  max_bit_rate?: number; // in 1000 bits/second
  segment_duration?: {
    numerator: number;
    denominator?: number;
  };
  
  // Additional fields added by controller
  total_segments?: number; // Added by controller from segment stats
  total_duration?: number; // Added by controller from segment stats
  total_bytes?: number; // Total storage bytes (from stats or flow data)
  last_segment?: any; // Last segment information
  
  // Optional metadata
  metadata_version?: string;
  generation?: number;
  timerange?: {
    start: string;
    end: string;
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

// Mock data for demo mode - matches actual API structure
const createMockFlowData = (): FlowDetails => {
  const now = new Date();
  const created = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  const metadataUpdated = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

  return {
    id: 'demo-flow-12345-67890-abcdef-ghijkl',
    source_id: 'demo-source-12345-67890-abcdef-ghijkl',
    format: 'urn:x-nmos:format:video',
    codec: 'video/h264',
    label: 'Demo Video Flow - Conference Recording',
    description: 'This is a demo flow showing the FlowDetails page with mock data. All tabs and features can be tested here.',
    created_by: 'demo-user',
    updated_by: 'demo-user',
    created: created.toISOString(),
    metadata_updated: metadataUpdated.toISOString(),
    segments_updated: metadataUpdated.toISOString(),
    tags: {
      category: 'conference',
      content_type: 'presentation',
      year: '2024',
      quality: 'high',
      location: 'London',
      speaker: 'John Doe'
    },
    read_only: false,
    essence_parameters: {
      frame_width: 1920,
      frame_height: 1080,
      frame_rate: {
        numerator: 25,
        denominator: 1
      },
      interlace_mode: 'progressive',
      colorspace: 'BT709',
      transfer_characteristic: 'SDR',
      bit_depth: 8
    },
    container: 'video/mp4',
    avg_bit_rate: 5000000, // 5 Mbps in 1000 bits/second
    max_bit_rate: 8000000, // 8 Mbps in 1000 bits/second
    total_segments: 15, // Added by controller
    total_duration: 150 // Added by controller (15 segments * 10 min)
  };
};

// SegmentItem interface - used for segments display
interface SegmentItem {
  id: string;
  _id?: string; // MongoDB _id - needed for backend updates (ObjectId format)
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
  format?: string; // Segment format (e.g., 'mp2t', 'mp4')
  created_at?: string;
  updated_at?: string;
  is_live?: boolean;
}

const createMockSegments = (): SegmentItem[] => {
  const segments: SegmentItem[] = [];
  const baseTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
  
  for (let i = 0; i < 10; i++) {
    const startTime = new Date(baseTime.getTime() + i * 10 * 60 * 1000); // 10 min intervals
    const endTime = new Date(startTime.getTime() + 10 * 60 * 1000); // 10 min duration
    
    segments.push({
      id: `demo-segment-${i + 1}`,
      object_id: `obj-${i + 1}`,
      timerange: {
        start: startTime.toISOString(),
        end: endTime.toISOString()
      },
      description: `Demo Segment ${i + 1} - Conference Recording Part ${i + 1}`,
      size: 104857600 + (i * 10485760), // ~100MB + variation
      status: i < 8 ? 'active' : 'processing',
      last_duration: 'PT10M',
      key_frame_count: 1500,
      get_urls: [
        {
          url: `https://example.com/segments/segment-${i + 1}.mp4`,
          label: 'GET'
        }
      ],
      tags: {
        category: 'conference',
        content_type: 'presentation',
        quality: i % 2 === 0 ? 'high' : 'medium'
      },
      flow_format: 'urn:x-nmos:format:video',
      created_at: startTime.toISOString(),
      updated_at: endTime.toISOString(),
      is_live: i === 9 // Last segment is live
    });
  }
  
  return segments;
};

const createMockQCMarkers = (): any[] => {
  const markers: any[] = [];
  const baseTime = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
  
  for (let i = 0; i < 8; i++) {
    const timestamp = new Date(baseTime.getTime() + i * 5 * 60 * 1000); // 5 min intervals
    const qualityScore = 70 + (i * 3) + Math.random() * 10; // 70-100 range
    
    markers.push({
      id: `demo-qc-marker-${i + 1}`,
      _id: `demo-qc-marker-${i + 1}`,
      label: `QC Analysis ${i + 1}`,
      tags: {
        marker_type: i % 2 === 0 ? 'quality_control' : 'qc_summary',
        quality_verdict: qualityScore >= 80 ? 'PASS' : qualityScore >= 70 ? 'PASS' : 'FAIL',
        quality_score: qualityScore.toFixed(1),
        blur_type: i % 3 === 0 ? 'motion' : i % 3 === 1 ? 'focus' : 'none'
      },
      created: timestamp.toISOString(),
      created_at: timestamp.toISOString()
    });
  }
  
  return markers;
};

export default function FlowDetails() {
  const { flowId } = useParams<{ flowId: string }>();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const isDemoMode = flowId === 'demo' || searchParams.get('demo') === 'true';
  
  // Removed unused searchParams
  const [flow, setFlow] = useState<FlowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'segments' | 'tags' | 'technical' | 'analytics' | 'qc'>('overview');

  // Disabled state for operations
  const [disabled, setDisabled] = useState(false);

  // Segments state (flow-scoped)
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
  
  // QC Markers state
  const [qcMarkers, setQcMarkers] = useState<any[]>([]);
  const [qcMarkersLoading, setQcMarkersLoading] = useState(false);
  const [qcMarkersError, setQcMarkersError] = useState<string | null>(null);

  // Cleanup state
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupHours, setCleanupHours] = useState<number>(24);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{ deleted_segments: number; freed_bytes: number; freed_gb: string } | null>(null);


  useEffect(() => {
    const fetchFlowDetails = async () => {
      if (!flowId) return;
      
      // Demo mode: use mock data
      if (isDemoMode) {
        setLoading(true);
        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));
          const mockFlow = createMockFlowData();
          setFlow(mockFlow);
          setError(null);
        } catch (err) {
          setError('Failed to load demo data');
        } finally {
          setLoading(false);
        }
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching flow details from VAST TAMS API for ID:', flowId);
        
        let response: any;
        try {
          // First, try direct flow lookup
          response = await apiClient.getFlow(flowId);
          console.log('VAST TAMS flow details response (direct):', response);
        } catch (directErr: any) {
          // If direct lookup fails with ObjectId error (Issue #6), fall back to list and filter
          // Check for various error patterns that indicate the ObjectId issue
          const errorMsg = directErr?.message || '';
          const isObjectIdError = 
            errorMsg.includes('24 character hex string') || 
            errorMsg.includes('ObjectId') ||
            errorMsg.includes('InternalError') ||
            errorMsg.includes('500') ||
            errorMsg.includes('Internal Server Error') ||
            (errorMsg.includes('VAST TAMS API error') && errorMsg.includes('500'));
          
          if (isObjectIdError) {
            console.warn('Direct flow lookup failed (Issue #6 - non-ObjectId ID), falling back to flows list');
            
            try {
              // Fetch all flows and find the one matching our ID
              const flowsResponse = await apiClient.getFlows();
              console.log('Flows list response:', flowsResponse);
              
              let flowsData: any[] = [];
              
              if (flowsResponse && flowsResponse.data && Array.isArray(flowsResponse.data)) {
                flowsData = flowsResponse.data;
              } else if (Array.isArray(flowsResponse)) {
                flowsData = flowsResponse;
              } else if (flowsResponse && 'flows' in flowsResponse && Array.isArray((flowsResponse as any).flows)) {
                flowsData = (flowsResponse as any).flows;
              }
              
              console.log(`Found ${flowsData.length} flows in list, searching for flow ID: ${flowId}`);
              
              // Find flow by matching _id or id (case-insensitive string comparison)
              const foundFlow = flowsData.find((f: any) => {
                const fId = f.id || f._id;
                return fId && (
                  fId === flowId ||
                  String(fId) === String(flowId) ||
                  String(fId).toLowerCase() === String(flowId).toLowerCase()
                );
              });
              
              if (foundFlow) {
                response = foundFlow;
                console.log('VAST TAMS flow details response (from list):', response);
              } else {
                console.error(`Flow ${flowId} not found in ${flowsData.length} flows. Available IDs:`, 
                  flowsData.slice(0, 5).map((f: any) => f.id || f._id));
                throw new Error(`Flow ${flowId} not found in flows list (searched ${flowsData.length} flows)`);
              }
            } catch (listErr: any) {
              console.error('Failed to fetch flows list for fallback:', listErr);
              throw new Error(`Failed to load flow: ${directErr.message}. Fallback also failed: ${listErr.message}`);
            }
          } else {
            // Re-throw other errors
            throw directErr;
          }
        }
        
        // Normalize _id to id (API returns _id from MongoDB)
        const normalizedFlow = {
          ...response,
          id: response.id || response._id || flowId // Normalize _id to id, fallback to flowId from URL
        };
        
        // Convert tags from array format to string format if needed
        if (normalizedFlow.tags) {
          const convertedTags: Record<string, string> = {};
          Object.entries(normalizedFlow.tags).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              // Convert array to comma-separated string
              convertedTags[key] = value.join(', ');
            } else if (typeof value === 'string') {
              convertedTags[key] = value;
            } else {
              convertedTags[key] = String(value);
            }
          });
          normalizedFlow.tags = convertedTags;
        }
        
        // Clear any previous errors and set the flow
        setError(null);
        setFlow(normalizedFlow);
      } catch (err: any) {
        console.error('TAMS flow details API error:', err);
        
        // Set appropriate error message based on error type
        if (err?.message?.includes('500') || err.message?.includes('Internal Server Error')) {
          setError('TAMS backend temporarily unavailable - please try again later');
        } else if (err?.message?.includes('Network') || err?.message?.includes('fetch') || err?.message?.includes('CORS')) {
          setError('Network connection issue - please check your connection and try again');
        } else if (err?.message?.includes('404') || err?.message?.includes('not found')) {
          setError(`Flow not found: ${flowId}. Please check the flow ID and try again.`);
        } else {
          // Use error message directly if it already contains "TAMS API error", otherwise prefix it
          const errorMsg = err?.message || 'Unknown error';
          setError(errorMsg.includes('TAMS API error') ? errorMsg : `TAMS API error: ${errorMsg}`);
        }
        
        // Clear flow on error
        setFlow(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFlowDetails();
  }, [flowId, isDemoMode]);

  // Load analytics when analytics tab is selected
  useEffect(() => {
    if (activeTab === 'analytics' && !analyticsData) {
      loadAnalytics();
    }
  }, [activeTab, analyticsData]);

  // Load QC markers when QC tab is selected
  useEffect(() => {
    if (activeTab === 'qc' && flowId && qcMarkers.length === 0 && !qcMarkersLoading) {
      loadQCMarkers();
    }
  }, [activeTab, flowId, qcMarkers.length, qcMarkersLoading]);

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
    if (!flowId) return;
    
    setAnalyticsLoading(true);
    try {
      // Use GET /flows/:id/stats endpoint (backend supports this)
      // Note: This endpoint has Issue #6 (fails for non-ObjectId IDs), so we need workaround
      let statsData: any = null;
      try {
        // Try direct stats endpoint
        const response = await fetch(`http://localhost:3000/flows/${flowId}/stats`);
        if (response.ok) {
          statsData = await response.json();
        }
      } catch (directErr: any) {
        // If direct lookup fails with ObjectId error (Issue #6), calculate from flow data
        console.warn('Direct stats lookup failed (Issue #6), using flow data');
        // Use flow data that already has total_segments and total_bytes from GET /flows
        statsData = {
          flow_id: flowId,
          total_segments: flow?.total_segments || 0,
          total_size_bytes: flow?.total_bytes || 0,
          average_segment_size: flow?.total_bytes && flow?.total_segments 
            ? Math.round(flow.total_bytes / flow.total_segments) 
            : 0,
          oldest_segment: null,
          newest_segment: flow?.last_segment || null,
          segments_per_hour: 0,
          bandwidth_mbps: '0.00',
          storage_used_gb: flow?.total_bytes 
            ? (flow.total_bytes / (1024 * 1024 * 1024)).toFixed(2)
            : '0.00'
        };
      }
      
      setAnalyticsData({
        stats: statsData,
        flowUsage: {
          total_flows: 1, // This is a single flow page
          average_flow_size: statsData?.total_size_bytes || 0,
          estimated_storage_bytes: statsData?.total_size_bytes || 0,
          format_distribution: flow?.format ? { [flow.format]: 1 } : {}
        }
      });
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadQCMarkers = async () => {
    if (!flowId) return;
    
    // Demo mode: use mock QC markers
    if (isDemoMode) {
      setQcMarkersLoading(true);
      setQcMarkersError(null);
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        const mockMarkers = createMockQCMarkers();
        setQcMarkers(mockMarkers);
      } catch (err) {
        setQcMarkersError('Failed to load demo QC markers');
        setQcMarkers([]);
      } finally {
        setQcMarkersLoading(false);
      }
      return;
    }
    
    setQcMarkersLoading(true);
    setQcMarkersError(null);
    
    try {
      console.log('Fetching QC markers for flow:', flowId);
      const response = await apiClient.getQCMarkersForFlow(flowId);
      console.log('QC markers response:', response);
      
      // Handle different response formats
      let markers: any[] = [];
      if (response && response.markers && Array.isArray(response.markers)) {
        markers = response.markers;
      } else if (Array.isArray(response)) {
        markers = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        markers = response.data;
      }
      
      setQcMarkers(markers);
    } catch (err: any) {
      console.error('Failed to load QC markers:', err);
      const errorMsg = err?.message || 'Unknown error';
      setQcMarkersError(errorMsg.includes('TAMS API error') ? errorMsg : `TAMS API error: ${errorMsg}`);
      setQcMarkers([]);
    } finally {
      setQcMarkersLoading(false);
    }
  };

  const handleCleanupFlow = async () => {
    if (!flowId) return;
    
    try {
      setCleaningUp(true);
      setError(null);
      
      console.log(`Cleaning up flow ${flowId}, removing segments older than ${cleanupHours} hours`);
      const result = await apiClient.cleanupFlow(flowId, cleanupHours);
      console.log('Cleanup result:', result);
      
      setCleanupResult(result);
      
      // Refresh segments and flow details after cleanup
      await fetchSegments();
      await refreshFlowDetails();
      
      // Close modal after a short delay to show results
      setTimeout(() => {
        setShowCleanupModal(false);
        setCleanupResult(null);
        setCleanupHours(24);
      }, 3000);
    } catch (err: any) {
      console.error('Failed to cleanup flow:', err);
      const errorMsg = err?.message || 'Unknown error';
      setError(`Failed to cleanup segments: ${errorMsg}`);
      setCleanupResult(null);
    } finally {
      setCleaningUp(false);
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
    
    // Demo mode: use mock segments
    if (isDemoMode) {
      setSegmentsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        const mockSegments = createMockSegments();
        setSegments(mockSegments);
        setSegmentsError(null);
        setLastUpdateTime(new Date());
      } catch (err) {
        setSegmentsError('Failed to load demo segments');
      } finally {
        setSegmentsLoading(false);
      }
      return;
    }
    
    try {
      setSegmentsLoading(true);
      setSegmentsError(null);
      const flowSegments = await apiClient.getFlowSegments(flowId);
      console.log('VAST TAMS segments response:', flowSegments);
      
      // Handle different response formats - could be array directly or wrapped in data
      let segmentsData: any[] = [];
      if (Array.isArray(flowSegments)) {
        segmentsData = flowSegments;
      } else if (flowSegments?.data && Array.isArray(flowSegments.data)) {
        segmentsData = flowSegments.data;
      } else if ((flowSegments as any)?.segments && Array.isArray((flowSegments as any).segments)) {
        segmentsData = (flowSegments as any).segments;
      }
      
      // Helper function to parse TAI timerange format: [seconds:nanoseconds_seconds:nanoseconds)
      const parseTAITimerange = (timerangeStr: string): { start: string; end: string } => {
        try {
          // Remove brackets/parentheses: [1766290849:0_1766290859:0) -> 1766290849:0_1766290859:0
          const clean = timerangeStr.replace(/^[\[\(]|[\]\)]$/g, '');
          
          if (clean.includes('_')) {
            const [startStr, endStr] = clean.split('_', 2);
            
            // Parse start: "1766290849:0" -> seconds: 1766290849, nanoseconds: 0
            let startSeconds = 0;
            if (startStr && startStr.includes(':')) {
              const [sec, nano] = startStr.split(':');
              startSeconds = parseInt(sec || '0', 10) + (parseInt(nano || '0', 10) / 1e9);
            } else if (startStr) {
              startSeconds = parseInt(startStr, 10) || 0;
            }
            
            // Parse end: "1766290859:0" -> seconds: 1766290859, nanoseconds: 0
            let endSeconds = startSeconds + 10; // Default 10 seconds if not parseable
            if (endStr && endStr.includes(':')) {
              const [sec, nano] = endStr.split(':');
              endSeconds = parseInt(sec || '0', 10) + (parseInt(nano || '0', 10) / 1e9);
            } else if (endStr) {
              const parsed = parseInt(endStr, 10);
              endSeconds = isNaN(parsed) ? startSeconds + 10 : parsed;
            }
            
            // Convert to ISO date strings (using Unix epoch)
            const startDate = new Date(startSeconds * 1000).toISOString();
            const endDate = new Date(endSeconds * 1000).toISOString();
            
            return { start: startDate, end: endDate };
          } else {
            // Single timestamp
            let seconds = 0;
            if (clean.includes(':')) {
              const [sec, nano] = clean.split(':');
              seconds = parseInt(sec || '0', 10) + (parseInt(nano || '0', 10) / 1e9);
            } else {
              const parsed = parseInt(clean, 10);
              seconds = isNaN(parsed) ? 0 : parsed;
            }
            const date = new Date(seconds * 1000).toISOString();
            return { start: date, end: date };
          }
        } catch (err) {
          console.warn('Failed to parse TAI timerange:', timerangeStr, err);
          const now = new Date().toISOString();
          return { start: now, end: now };
        }
      };
      
      const transformed = segmentsData.map((seg: any): SegmentItem => {
        // Parse timerange - handle TAI format: [1766290849:0_1766290859:0)
        let timerange = { start: new Date().toISOString(), end: new Date().toISOString() };
        if (seg.timerange) {
          if (typeof seg.timerange === 'string') {
            // Check if it's TAI format (contains brackets and underscores)
            if (seg.timerange.includes('[') || seg.timerange.includes('_')) {
              timerange = parseTAITimerange(seg.timerange);
            } else if (seg.timerange.includes('/')) {
              // VAST TAMS format: "start/end" (ISO dates)
            const [start, end] = seg.timerange.split('/');
            timerange = { start: start || new Date().toISOString(), end: end || new Date().toISOString() };
            } else {
              // Single timestamp
              timerange = { start: seg.timerange, end: seg.timerange };
            }
          } else if (seg.timerange.start && seg.timerange.end) {
            // Already in object format
            timerange = seg.timerange;
          }
        }
        
        // Normalize get_urls - backend may return object or array
        let getUrls: Array<{ url: string; label?: string }> = [];
        if (seg.get_urls) {
          if (Array.isArray(seg.get_urls)) {
            getUrls = seg.get_urls;
          } else if (typeof seg.get_urls === 'object' && seg.get_urls.url) {
            // Backend returns { url: "..." } - convert to array format
            getUrls = [{ url: seg.get_urls.url, label: seg.get_urls.label || 'GET' }];
          }
        }
        
        // Calculate duration from timerange if not provided
        let duration = seg.duration; // Duration in milliseconds from backend
        let lastDuration: string | undefined = seg.last_duration;
        
        if (!duration && timerange.start && timerange.end) {
          const startMs = new Date(timerange.start).getTime();
          const endMs = new Date(timerange.end).getTime();
          duration = endMs - startMs; // Duration in milliseconds
        }
        
        // Convert duration to ISO 8601 duration format (PT10S) if we have it
        if (duration && !lastDuration) {
          const seconds = Math.round(duration / 1000);
          lastDuration = `PT${seconds}S`;
        }
        
        // Use _id for backend operations (MongoDB ObjectId), but keep id for display
        // Backend expects ObjectId format for updates, not UUIDs
        const segmentId = seg._id || seg.id || seg.segment_id || `${flowId}_${seg.object_id}_${Date.now()}`;
        const segmentItem = {
          id: segmentId, // For display and React keys
          _id: seg._id || (seg.id && seg.id.length === 24 && /^[0-9a-fA-F]{24}$/.test(seg.id) ? seg.id : undefined), // MongoDB _id (ObjectId format) for backend operations
          object_id: seg.object_id || seg.id || seg._id || 'unknown',
          timerange,
          description: seg.description || `Segment ${seg.object_id || seg._id || 'unknown'}`,
          size: seg.size || 0,
          status: seg.status || 'active',
          last_duration: lastDuration,
          key_frame_count: seg.key_frame_count,
          get_urls: getUrls,
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
      // Convert HH:MM:SS format to TAI timerange format
        const parseTimeToSeconds = (timeStr: string | undefined): number => {
          if (!timeStr) return 0;
          const parts = timeStr.split(':').map(Number);
          if (parts.length === 3) {
            return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
          } else if (parts.length === 2) {
            return (parts[0] || 0) * 60 + (parts[1] || 0);
          }
          return 0;
        };

      // Parse timerange from form input (HH:MM:SS_HH:MM:SS) or use current time
      let timerange: string;
      if (segmentData.timerange && segmentData.timerange.includes('_')) {
        // Already in format like "00:00:00_00:00:10"
        const [startStr, endStr] = segmentData.timerange.split('_');
        const startSeconds = parseTimeToSeconds(startStr);
        const endSeconds = parseTimeToSeconds(endStr);
        // Use current time as base, or 0 if start is 0
        const baseTime = startSeconds === 0 ? Math.floor(Date.now() / 1000) : startSeconds;
        timerange = `[${baseTime}:0_${baseTime + (endSeconds - startSeconds)}:0)`;
      } else {
        // Default: 10 second segment starting now
        const now = Math.floor(Date.now() / 1000);
        timerange = `[${now}:0_${now + 10}:0)`;
      }

      // Create segment metadata in VAST TAMS format
      // Note: object_id will be set from storage response, not from form
      const segment = {
        timerange: timerange,
        duration: file.size > 0 ? Math.round(file.size / 1000) : 10000, // Estimate or default 10s
        format: 'mp4', // MP4 for uploaded files
        codec: 'h264',
        size: file.size,
        description: segmentData.description || 'Uploaded segment',
        tags: segmentData.tags || {}
      };

      console.log('Uploading segment to VAST TAMS:', segment);
      
      // Step 1: Get presigned URL for file upload
      console.log('Step 1: Getting presigned URL for file upload...');
      const storageResponse = await apiClient.getStorage(flowId);
      console.log('Storage response:', storageResponse);
      
      if (!storageResponse || !storageResponse.media_objects || storageResponse.media_objects.length === 0) {
        throw new Error('Failed to get storage URL from backend');
      }
      
      const mediaObject = storageResponse.media_objects[0];
      const objectId = mediaObject.object_id;
      let putUrl = mediaObject.put_url?.url;
      
      if (!putUrl) {
        throw new Error('Storage response missing put_url');
      }
      
      // Replace Docker internal IP with Vite proxy path (for browser access)
      // The presigned signature will work because we preserve the original Host header
      const dockerInternalIpMatch = putUrl.match(/http:\/\/(172\.\d+\.\d+\.\d+):(\d+)(\/[^?]*)(\?.*)?/);
      if (dockerInternalIpMatch) {
        const dockerHost = dockerInternalIpMatch[1] + ':' + dockerInternalIpMatch[2];
        const path = dockerInternalIpMatch[3];
        const query = dockerInternalIpMatch[4] || '';
        console.log(`Proxying Docker internal IP (${dockerHost}) through Vite proxy for browser access`);
        // Use Vite proxy to forward to MinIO, including original host in path so proxy can preserve it
        // Format: /minio-proxy/http://HOST/PATH?QUERY
        putUrl = `http://localhost:5173/minio-proxy/http://${dockerHost}${path}${query}`;
      }
      
      console.log(`Step 2: Uploading file to storage (object_id: ${objectId})...`);
      console.log(`Upload URL: ${putUrl.substring(0, 100)}...`); // Log first 100 chars
      
      // Step 2: Upload file to presigned URL
      const uploadResponse = await fetch(putUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'video/mp4',
          'Content-Length': file.size.toString()
        },
        body: file
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Failed to upload file to storage: ${uploadResponse.status} ${errorText}`);
      }
      
      console.log('File uploaded successfully to storage');
      
      // Step 3: Register segment metadata with the object_id
      console.log('Step 3: Registering segment metadata...');
      const segmentWithObjectId = {
        ...segment,
        object_id: objectId // Use the object_id from storage response
      };
      
      const response = await apiClient.createFlowSegment(flowId, segmentWithObjectId);
      console.log('VAST TAMS upload response:', response);
      
      if (response) {
        // Refresh segments to show the new one
        await fetchSegments();
        
        // Show success notification
        setShowNewSegmentsNotification(true);
        setNewSegmentsCount(prev => prev + 1);
        
        // Close upload modal and reset form
        setShowUploadModal(false);
        setSelectedFile(null);
      }
    } catch (error: any) {
      console.error('Failed to upload segment to VAST TAMS:', error);
      const errorMessage = error?.message || 'Unknown error';
      
      // Provide more helpful error messages
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('CORS')) {
        setSegmentsError('Network error: Could not connect to the API. Make sure the TAMS API is running at http://localhost:3000');
      } else if (errorMessage.includes('400') || errorMessage.includes('ValidationError')) {
        setSegmentsError(`Upload validation failed: ${errorMessage}. Check that all required fields are filled correctly.`);
      } else if (errorMessage.includes('413') || errorMessage.includes('too large')) {
        setSegmentsError('File too large: The video file exceeds the maximum upload size.');
      } else {
        setSegmentsError(`Failed to upload segment: ${errorMessage}`);
      }
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

  // Segment filters - client-side filtering on current page (no navigation)
  // Filter options are dynamically generated from available segment data
  const segmentFilterOptions: FilterOption[] = [
    { 
      key: 'search', 
      label: 'Search', 
      type: 'text', 
      placeholder: 'Search segments by description, ID, tags, or format...' 
    },
    { 
      key: 'format', 
      label: 'Format', 
      type: 'select', 
      options: [
      { value: 'urn:x-nmos:format:video', label: 'Video' },
      { value: 'urn:x-nmos:format:audio', label: 'Audio' },
      { value: 'urn:x-nmos:format:data', label: 'Data' },
        { value: 'urn:x-tam:format:image', label: 'Image' },
        { value: 'mp2t', label: 'MP2T' }
      ]
    },
    { 
      key: 'status', 
      label: 'Status', 
      type: 'select', 
      options: [
      { value: 'active', label: 'Active' },
      { value: 'processing', label: 'Processing' },
      { value: 'error', label: 'Error' },
      { value: 'deleted', label: 'Deleted' }
      ]
    },
    { 
      key: 'timerange', 
      label: 'Time Range', 
      type: 'text', 
      placeholder: 'Search in timestamps (e.g., "2025-12-21" or "04:20")' 
    },
    { 
      key: 'tags', 
      label: 'Tags', 
      type: 'text', 
      placeholder: 'Search tags by key, value, or key:value (e.g., "quality" or "quality:high")' 
    }
  ];

  // Client-side filtering - filters segments on the current page without navigation
  const filteredSegments = segments.filter(segment => {
    // Search filter - search across multiple fields
    const searchTerm = segFilters.search?.toLowerCase().trim();
    const matchesSearch = !searchTerm || (() => {
      const searchFields = [
        segment.description,
        segment.object_id,
        segment.id,
        ...(segment.tags ? Object.values(segment.tags).map(v => String(v)) : []),
        segment.flow_format,
        segment.status
      ].filter(Boolean).map(f => String(f).toLowerCase());
      
      return searchFields.some(field => field.includes(searchTerm));
    })();

    // Format filter
    const formatFilter = segFilters.format;
    const matchesFormat = !formatFilter || 
      (segment.flow_format === formatFilter) ||
      (segment.format === formatFilter);

    // Status filter (optional - segments may not have status)
    const statusFilter = segFilters.status;
    const matchesStatus = !statusFilter || 
      !segment.status || // If no status field, allow through
      (segment.status?.toLowerCase() === statusFilter.toLowerCase());

    // Timerange filter - search in formatted date strings
    const timerangeFilter = segFilters.timerange?.trim();
    const matchesTimerange = !timerangeFilter || (() => {
      try {
        const startDate = new Date(segment.timerange.start);
        const endDate = new Date(segment.timerange.end);
        const startStr = startDate.toLocaleString().toLowerCase();
        const endStr = endDate.toLocaleString().toLowerCase();
        const isoStart = segment.timerange.start.toLowerCase();
        const isoEnd = segment.timerange.end.toLowerCase();
        
        return startStr.includes(timerangeFilter.toLowerCase()) ||
               endStr.includes(timerangeFilter.toLowerCase()) ||
               isoStart.includes(timerangeFilter.toLowerCase()) ||
               isoEnd.includes(timerangeFilter.toLowerCase());
      } catch {
        return segment.timerange.start.includes(timerangeFilter) ||
      segment.timerange.end.includes(timerangeFilter);
      }
    })();

    // Tags filter - search for key:value pairs
    const tagsFilter = segFilters.tags?.trim();
    const matchesTags = !tagsFilter || (() => {
      if (!segment.tags) return false;
      const searchLower = tagsFilter.toLowerCase();
      return Object.entries(segment.tags).some(([key, value]) => {
        const keyLower = key.toLowerCase();
        const valueStr = String(value).toLowerCase();
        return keyLower.includes(searchLower) ||
               valueStr.includes(searchLower) ||
               `${keyLower}:${valueStr}`.includes(searchLower);
      });
    })();

    return matchesSearch && matchesFormat && matchesStatus && 
           matchesTimerange && matchesTags;
  });

  // Removed URL sync - tab state managed locally



  const refreshFlowDetails = async () => {
    if (!flowId) return;
    
    try {
      setRefreshing(true);
      setError(null);
      
      let response: any;
      try {
        // First, try direct flow lookup
        response = await apiClient.getFlow(flowId);
      } catch (directErr: any) {
        // If direct lookup fails with ObjectId error (Issue #6), fall back to list and filter
        const errorMsg = directErr?.message || '';
        const isObjectIdError = 
          errorMsg.includes('24 character hex string') || 
          errorMsg.includes('ObjectId') ||
          errorMsg.includes('InternalError') ||
          errorMsg.includes('500') ||
          errorMsg.includes('Internal Server Error') ||
          (errorMsg.includes('VAST TAMS API error') && errorMsg.includes('500'));
        
        if (isObjectIdError) {
          console.warn('Direct flow lookup failed (Issue #6), falling back to flows list');
          
          // Fetch all flows and find the one matching our ID
          const flowsResponse = await apiClient.getFlows();
          let flowsData: any[] = [];
          
          if (flowsResponse && flowsResponse.data && Array.isArray(flowsResponse.data)) {
            flowsData = flowsResponse.data;
          } else if (Array.isArray(flowsResponse)) {
            flowsData = flowsResponse;
          } else if (flowsResponse && 'flows' in flowsResponse && Array.isArray((flowsResponse as any).flows)) {
            flowsData = (flowsResponse as any).flows;
          }
          
          // Find flow by matching _id or id
          const foundFlow = flowsData.find((f: any) => 
            (f._id === flowId || f.id === flowId) ||
            (f._id && String(f._id) === String(flowId)) ||
            (f.id && String(f.id) === String(flowId))
          );
          
          if (foundFlow) {
            response = foundFlow;
          } else {
            throw new Error(`Flow ${flowId} not found in flows list`);
          }
        } else {
          throw directErr;
        }
      }
      
      // Normalize _id to id (API returns _id from MongoDB)
      const normalizedFlow = {
        ...response,
        id: response.id || response._id || flowId // Normalize _id to id, fallback to flowId from URL
      };
      
      // Convert tags from array format to string format if needed
      if (normalizedFlow.tags) {
        const convertedTags: Record<string, string> = {};
        Object.entries(normalizedFlow.tags).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            // Convert array to comma-separated string
            convertedTags[key] = value.join(', ');
          } else if (typeof value === 'string') {
            convertedTags[key] = value;
          } else {
            convertedTags[key] = String(value);
          }
        });
        normalizedFlow.tags = convertedTags;
      }
      
      // Note: essence_parameters structure is preserved as-is from API
      // Video: essence_parameters.frame_width, essence_parameters.frame_height, etc.
      // Audio: essence_parameters.sample_rate, essence_parameters.channels, etc.
      
      setFlow(normalizedFlow);
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
      
      let response: any;
      try {
        // First, try direct flow lookup
        response = await apiClient.getFlow(flowId);
      } catch (directErr: any) {
        // If direct lookup fails with ObjectId error (Issue #6), fall back to list and filter
        const errorMsg = directErr?.message || '';
        const isObjectIdError = 
          errorMsg.includes('24 character hex string') || 
          errorMsg.includes('ObjectId') ||
          errorMsg.includes('InternalError') ||
          errorMsg.includes('500') ||
          errorMsg.includes('Internal Server Error') ||
          (errorMsg.includes('VAST TAMS API error') && errorMsg.includes('500'));
        
        if (isObjectIdError) {
          console.warn('Direct flow lookup failed (Issue #6), falling back to flows list');
          
          // Fetch all flows and find the one matching our ID
          const flowsResponse = await apiClient.getFlows();
          let flowsData: any[] = [];
          
          if (flowsResponse && flowsResponse.data && Array.isArray(flowsResponse.data)) {
            flowsData = flowsResponse.data;
          } else if (Array.isArray(flowsResponse)) {
            flowsData = flowsResponse;
          } else if (flowsResponse && 'flows' in flowsResponse && Array.isArray((flowsResponse as any).flows)) {
            flowsData = (flowsResponse as any).flows;
          }
          
          // Find flow by matching _id or id
          const foundFlow = flowsData.find((f: any) => 
            (f._id === flowId || f.id === flowId) ||
            (f._id && String(f._id) === String(flowId)) ||
            (f.id && String(f.id) === String(flowId))
          );
          
          if (foundFlow) {
            response = foundFlow;
          } else {
            throw new Error(`Flow ${flowId} not found in flows list`);
          }
        } else {
          throw directErr;
        }
      }
      
      // Normalize _id to id (API returns _id from MongoDB)
      const normalizedFlow = {
        ...response,
        id: response.id || response._id || flowId // Normalize _id to id, fallback to flowId from URL
      };
      
      // Convert tags from array format to string format if needed
      if (normalizedFlow.tags) {
        const convertedTags: Record<string, string> = {};
        Object.entries(normalizedFlow.tags).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            // Convert array to comma-separated string
            convertedTags[key] = value.join(', ');
          } else if (typeof value === 'string') {
            convertedTags[key] = value;
          } else {
            convertedTags[key] = String(value);
          }
        });
        normalizedFlow.tags = convertedTags;
      }
      
      // Note: essence_parameters structure is preserved as-is from API
      // Video: essence_parameters.frame_width, essence_parameters.frame_height, etc.
      // Audio: essence_parameters.sample_rate, essence_parameters.channels, etc.
      
      setFlow(normalizedFlow);
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
    ? (import.meta.env.VITE_API_URL || 'http://localhost:3000')
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

  // Only show error screen if there's an error AND no flow loaded
  // If we have a flow, show it even if there was a previous error
  if (error && !flow) {
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
              {flow.read_only !== undefined && (
                <Badge color={flow.read_only ? 'orange' : 'blue'} variant="light">
                  {flow.read_only ? 'Read Only' : 'Editable'}
                </Badge>
              )}
            </Group>
            <Title order={2} mb="md" className="dark-text-primary">{flow.label}</Title>
            <Text size="lg" c="dimmed" mb="md" className="dark-text-secondary">{flow.description}</Text>
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

      {/* Demo Mode Alert */}
      {isDemoMode && (
        <Alert 
          icon={<IconInfoCircle size={16} />} 
          color="blue" 
          title="Demo Mode - Mock Data"
          mb="lg"
        >
          <Text size="sm">
            You are viewing the FlowDetails page in <strong>demo mode</strong> with mock data. 
            This allows you to test all features and tabs without requiring a real flow ID from the API.
            Navigate to <code>/flow-details/demo</code> or add <code>?demo=true</code> to any flow details URL to enable demo mode.
          </Text>
        </Alert>
      )}

      {/* VAST TAMS Info - Toggleable */}
      {!error && !isDemoMode && (
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
                This page shows detailed information about a specific <strong>Flow</strong> - a container for media segments 
                with technical specifications and encoding details. Here you can view and play segments, manage tags, 
                configure storage, and analyze performance.
              </Text>
              <Text size="sm">
                Flows contain detailed metadata like format, codec, resolution, bitrates, and custom tags. 
                <strong>Note:</strong> Flows themselves do not contain playable video content - only their segments are playable.
              </Text>
              <Text size="sm">
                <strong>Demo Note:</strong> This page shows live data from the TAMS backend powered by VAST, demonstrating real-time
                media flow details and segment management capabilities.
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
          <Card withBorder p="xl" mb="lg" className="search-interface">
            <Group justify="space-between" mb="md">
              <Group gap="sm">
                <Title order={3} className="dark-text-primary">Flow Segments</Title>
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
                <Button 
                  leftSection={<IconPlus size={16} />} 
                  size="sm" 
                  onClick={() => {
                    console.log('Upload Segment button clicked, opening modal');
                    setShowUploadModal(true);
                  }}
                >
                  Upload Segment
                </Button>
              </Group>
            </Group>

            {/* Segment Statistics */}
            <Group gap="md" mb="md" wrap="wrap">
              <Group gap="xs">
                <IconTimeline size={16} color="#228be6" />
                <Text size="sm" c="dimmed">Segments:</Text>
                <Text size="sm" fw={600}>
                  {filteredSegments.length}
                  {segments.length !== filteredSegments.length && (
                    <Text component="span" c="dimmed" size="xs" ml={4}>
                      of {segments.length}
                    </Text>
                  )}
                </Text>
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
              <Box ta="center" py="xl">
                <Text c="dimmed" mb="xs">
                  {segments.length === 0 
                    ? 'No segments found for this flow.' 
                    : 'No segments match the current filters.'}
                </Text>
                {segments.length > 0 && Object.keys(segFilters).length > 0 && (
                  <Button 
                    variant="light" 
                    size="xs" 
                    mt="md"
                    onClick={() => updateSegFilters({})}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>
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
          <Tabs.Tab value="technical" leftSection={<IconSettings size={16} />}>
            Technical Details
          </Tabs.Tab>
          <Tabs.Tab value="analytics" leftSection={<IconChartBar size={16} />}>
            Analytics
          </Tabs.Tab>
          <Tabs.Tab value="qc" leftSection={<IconShieldCheck size={16} />}>
            Quality Control
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="xl">
              <Stack gap="lg">
                {/* Flow Information */}
                <Card withBorder p="xl" className="search-interface">
                  <Title order={4} mb="md" className="dark-text-primary">Flow Information</Title>
                  <Grid>
                    <Grid.Col span={6}>
                      <Stack gap="md">
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Flow ID</Text>
                          <Text size="sm" style={{ fontFamily: 'monospace' }}>
                            {flow.id || flowId || 'N/A'}
                          </Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Source ID</Text>
                          <Text size="sm" style={{ fontFamily: 'monospace' }}>{flow.source_id}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Created By</Text>
                          <Text size="sm">{flow.created_by || 'N/A'}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Created</Text>
                          <Text size="sm">{flow.created ? formatTimestamp(flow.created) : 'N/A'}</Text>
                        </Box>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Stack gap="md">
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Format</Text>
                          <Text size="sm">{flow.format}</Text>
                        </Box>
                        {flow.codec && (
                          <Box>
                            <Text size="sm" fw={500} c="dimmed">Codec</Text>
                            <Text size="sm">{flow.codec}</Text>
                          </Box>
                        )}
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Updated By</Text>
                          <Text size="sm">{flow.updated_by || 'N/A'}</Text>
                        </Box>
                        <Box>
                          <Text size="sm" fw={500} c="dimmed">Metadata Updated</Text>
                          <Text size="sm">{flow.metadata_updated ? formatTimestamp(flow.metadata_updated) : 'N/A'}</Text>
                        </Box>
                        {flow.segments_updated && (
                          <Box>
                            <Text size="sm" fw={500} c="dimmed">Segments Updated</Text>
                            <Text size="sm">{formatTimestamp(flow.segments_updated)}</Text>
                          </Box>
                        )}
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Card>

                {/* Description & Label Management */}
                  <FlowDescriptionManager
                    {...(flow.description !== undefined ? { initialDescription: flow.description } : {})}
                    {...(flow.label !== undefined ? { initialLabel: flow.label } : {})}
                />


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
                {...(flow.tags ? {
                  initialTags: Object.fromEntries(
                    Object.entries(flow.tags).map(([key, value]) => [
                      key,
                      Array.isArray(value) ? value.join(', ') : String(value ?? '')
                    ])
                  )
                } : {})}
                disabled={disabled}
                {...(flow.read_only !== undefined ? { readOnly: flow.read_only } : {})}
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




        <Tabs.Panel value="technical" pt="xl">
          <Grid>
            {/* Video Specifications - only show if format is video and essence_parameters exist */}
            {flow.format === 'urn:x-nmos:format:video' && flow.essence_parameters && (
              <Grid.Col span={6}>
                <Card withBorder p="xl">
                  <Title order={4} mb="md">Video Specifications</Title>
                  <Stack gap="md">
                    {flow.essence_parameters.frame_width && flow.essence_parameters.frame_height && (
                      <Box>
                        <Text size="sm" fw={500} mb="xs">Resolution</Text>
                        <Text size="sm">{flow.essence_parameters.frame_width} x {flow.essence_parameters.frame_height}</Text>
                      </Box>
                    )}
                    {flow.essence_parameters.frame_rate && (
                      <Box>
                        <Text size="sm" fw={500} mb="xs">Frame Rate</Text>
                        <Text size="sm">
                          {flow.essence_parameters.frame_rate.numerator}
                          {flow.essence_parameters.frame_rate.denominator && flow.essence_parameters.frame_rate.denominator !== 1
                            ? `/${flow.essence_parameters.frame_rate.denominator}`
                            : ''} fps
                        </Text>
                      </Box>
                    )}
                    {flow.essence_parameters.interlace_mode && (
                      <Box>
                        <Text size="sm" fw={500} mb="xs">Interlace Mode</Text>
                        <Text size="sm">{flow.essence_parameters.interlace_mode}</Text>
                      </Box>
                    )}
                    {flow.essence_parameters.colorspace && (
                      <Box>
                        <Text size="sm" fw={500} mb="xs">Colorspace</Text>
                        <Text size="sm">{flow.essence_parameters.colorspace}</Text>
                      </Box>
                    )}
                    {flow.essence_parameters.transfer_characteristic && (
                      <Box>
                        <Text size="sm" fw={500} mb="xs">Transfer Characteristic</Text>
                        <Text size="sm">{flow.essence_parameters.transfer_characteristic}</Text>
                      </Box>
                    )}
                    {flow.essence_parameters.bit_depth && (
                      <Box>
                        <Text size="sm" fw={500} mb="xs">Bit Depth</Text>
                        <Text size="sm">{flow.essence_parameters.bit_depth} bit</Text>
                      </Box>
                    )}
                  </Stack>
                </Card>
              </Grid.Col>
            )}

            {/* Audio Specifications - only show if format is audio and essence_parameters exist */}
            {flow.format === 'urn:x-nmos:format:audio' && flow.essence_parameters && (
              <Grid.Col span={6}>
                <Card withBorder p="xl">
                  <Title order={4} mb="md">Audio Specifications</Title>
                  <Stack gap="md">
                    {flow.essence_parameters.sample_rate && (
                      <Box>
                        <Text size="sm" fw={500} mb="xs">Sample Rate</Text>
                        <Text size="sm">{flow.essence_parameters.sample_rate} Hz</Text>
                      </Box>
                    )}
                    {flow.essence_parameters.channels && (
                      <Box>
                        <Text size="sm" fw={500} mb="xs">Channels</Text>
                        <Text size="sm">{flow.essence_parameters.channels} channels</Text>
                      </Box>
                    )}
                    {flow.essence_parameters.bit_depth && (
                      <Box>
                        <Text size="sm" fw={500} mb="xs">Bit Depth</Text>
                        <Text size="sm">{flow.essence_parameters.bit_depth} bit</Text>
                      </Box>
                    )}
                  </Stack>
                </Card>
              </Grid.Col>
            )}

            {/* Common Flow Properties */}
            <Grid.Col span={flow.format === 'urn:x-nmos:format:video' || flow.format === 'urn:x-nmos:format:audio' ? 6 : 12}>
              <Card withBorder p="xl">
                <Title order={4} mb="md">Flow Properties</Title>
                <Stack gap="md">
                  <Box>
                    <Text size="sm" fw={500} mb="xs">Format</Text>
                    <Text size="sm">{flow.format}</Text>
                  </Box>
                  {flow.codec && (
                    <Box>
                      <Text size="sm" fw={500} mb="xs">Codec</Text>
                      <Text size="sm">{flow.codec}</Text>
                    </Box>
                  )}
                  {flow.container && (
                    <Box>
                      <Text size="sm" fw={500} mb="xs">Container</Text>
                      <Text size="sm">{flow.container}</Text>
                    </Box>
                  )}
                  {flow.avg_bit_rate && (
                    <Box>
                      <Text size="sm" fw={500} mb="xs">Average Bit Rate</Text>
                      <Text size="sm">{Math.round(flow.avg_bit_rate / 1000)} kbps</Text>
                    </Box>
                  )}
                  {flow.max_bit_rate && (
                    <Box>
                      <Text size="sm" fw={500} mb="xs">Maximum Bit Rate</Text>
                      <Text size="sm">{Math.round(flow.max_bit_rate / 1000)} kbps</Text>
                    </Box>
                  )}
                  {flow.total_segments !== undefined && (
                    <Box>
                      <Text size="sm" fw={500} mb="xs">Total Segments</Text>
                      <Text size="sm">{flow.total_segments}</Text>
                    </Box>
                  )}
                  {flow.total_duration !== undefined && (
                    <Box>
                      <Text size="sm" fw={500} mb="xs">Total Duration</Text>
                      <Text size="sm">{flow.total_duration} seconds</Text>
                    </Box>
                  )}
                  {flow.read_only !== undefined && (
                    <Box>
                      <Text size="sm" fw={500} mb="xs">Read Only</Text>
                      <Badge color={flow.read_only ? 'red' : 'green'} variant="light">
                        {flow.read_only ? 'Yes' : 'No'}
                      </Badge>
                    </Box>
                  )}
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
            ) : (
              <>
                {/* Flow Statistics - using GET /flows/:id/stats endpoint */}
                <Card withBorder>
                  <Title order={4} mb="md">Flow Statistics</Title>
                  <Text size="sm" c="dimmed" mb="lg">
                    Statistics from GET /flows/:id/stats endpoint. Includes segment counts, storage usage, and bandwidth metrics.
                  </Text>
                  <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                    <Paper withBorder p="md" ta="center">
                      <Text size="xl" fw={700} c="blue">
                        {analyticsData?.stats?.total_segments ?? flow?.total_segments ?? 0}
                      </Text>
                      <Text size="sm" c="dimmed">Total Segments</Text>
                      <Text size="xs" c="dimmed" mt="xs">
                        From stats endpoint
                      </Text>
                    </Paper>
                    <Paper withBorder p="md" ta="center">
                      <Text size="xl" fw={700} c="green">
                        {analyticsData?.stats?.storage_used_gb 
                          ? `${analyticsData.stats.storage_used_gb} GB` 
                          : flow?.total_bytes 
                            ? `${(flow.total_bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
                            : 'N/A'}
                      </Text>
                      <Text size="sm" c="dimmed">Storage Used</Text>
                      <Text size="xs" c="dimmed" mt="xs">
                        From stats endpoint
                      </Text>
                    </Paper>
                    <Paper withBorder p="md" ta="center">
                      <Text size="xl" fw={700} c="orange">
                        {analyticsData?.stats?.bandwidth_mbps 
                          ? `${analyticsData.stats.bandwidth_mbps} Mbps` 
                          : flow?.avg_bit_rate 
                            ? `${Math.round(flow.avg_bit_rate / 1000)} kbps`
                            : 'N/A'}
                      </Text>
                      <Text size="sm" c="dimmed">Bandwidth</Text>
                      <Text size="xs" c="dimmed" mt="xs">
                        From stats endpoint
                      </Text>
                    </Paper>
                    <Paper withBorder p="md" ta="center">
                      <Text size="xl" fw={700} c="purple">
                        {analyticsData?.stats?.average_segment_size 
                          ? `${(analyticsData.stats.average_segment_size / (1024 * 1024)).toFixed(2)} MB` 
                          : 'N/A'}
                      </Text>
                      <Text size="sm" c="dimmed">Avg Segment Size</Text>
                      <Text size="xs" c="dimmed" mt="xs">
                        From stats endpoint
                      </Text>
                    </Paper>
                  </SimpleGrid>
                  
                  {analyticsData?.stats && (
                    <Stack gap="md" mt="md">
                      <Divider />
                      <Grid>
                        <Grid.Col span={6}>
                          <Box>
                            <Text size="sm" fw={500} mb="xs">Oldest Segment</Text>
                            <Text size="sm" c="dimmed">
                              {analyticsData.stats.oldest_segment 
                                ? new Date(analyticsData.stats.oldest_segment).toLocaleString()
                                : 'N/A'}
                            </Text>
                          </Box>
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Box>
                            <Text size="sm" fw={500} mb="xs">Newest Segment</Text>
                            <Text size="sm" c="dimmed">
                              {analyticsData.stats.newest_segment 
                                ? new Date(analyticsData.stats.newest_segment).toLocaleString()
                                : 'N/A'}
                            </Text>
                          </Box>
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Box>
                            <Text size="sm" fw={500} mb="xs">Segments Per Hour</Text>
                            <Text size="sm" c="dimmed">
                              {analyticsData.stats.segments_per_hour || 0}
                            </Text>
                          </Box>
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Box>
                            <Text size="sm" fw={500} mb="xs">Total Size</Text>
                            <Text size="sm" c="dimmed">
                              {analyticsData.stats.total_size_bytes 
                                ? `${(analyticsData.stats.total_size_bytes / (1024 * 1024)).toFixed(2)} MB`
                                : 'N/A'}
                            </Text>
                          </Box>
                        </Grid.Col>
                      </Grid>
                    </Stack>
                  )}
                  
                  {flow?.format && (
                    <Box mt="md">
                      <Text size="sm" fw={500} mb="sm">Flow Format</Text>
                      <Badge size="lg" variant="light" color="blue">
                        {flow.format.split(':').pop() || flow.format}
                      </Badge>
                    </Box>
                  )}
                </Card>

                {/* Note: Statistics are from the GET /flows/:id/stats endpoint. 
                    If the endpoint fails due to Issue #6 (non-ObjectId IDs), statistics are calculated from flow data.
                    Commented out per user request - not showing publicly */}
                {/* <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                  <Text size="sm">
                    <strong>Note:</strong> Statistics are from the <code>GET /flows/:id/stats</code> endpoint. 
                    If the endpoint fails due to Issue #6 (non-ObjectId IDs), statistics are calculated from flow data.
                  </Text>
                </Alert> */}
              </>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="qc" pt="xl">
          <Stack gap="xl">
            {qcMarkersLoading ? (
              <Card withBorder>
                <Stack gap="md" align="center" py="xl">
                  <Loader size="lg" />
                  <Text size="lg" c="dimmed">Loading QC markers...</Text>
                </Stack>
              </Card>
            ) : qcMarkersError ? (
              <Card withBorder>
                <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error Loading QC Markers">
                  {qcMarkersError}
                </Alert>
                <Button 
                  variant="light" 
                  onClick={loadQCMarkers}
                  loading={qcMarkersLoading}
                  mt="md"
                >
                  Retry
                </Button>
              </Card>
            ) : qcMarkers.length === 0 ? (
              <Card withBorder>
                <Stack gap="md" align="center" py="xl">
                  <IconShieldCheck size={64} color="#ccc" />
                  <Title order={4} c="dimmed">No QC Markers</Title>
                  <Text size="lg" c="dimmed" ta="center">
                    No quality control markers found for this flow
                  </Text>
                  <Button 
                    variant="light" 
                    onClick={loadQCMarkers}
                    loading={qcMarkersLoading}
                  >
                    Refresh
                  </Button>
                </Stack>
              </Card>
            ) : (
              <>
                <Card withBorder>
                  <Group justify="space-between" mb="md">
                    <Title order={4}>QC Markers</Title>
                    <Group gap="xs">
                      <Badge size="lg" variant="light" color="blue">
                        {qcMarkers.length} marker{qcMarkers.length !== 1 ? 's' : ''}
                      </Badge>
                      <Button
                        variant="light"
                        size="sm"
                        leftSection={<IconRefresh size={14} />}
                        onClick={loadQCMarkers}
                        loading={qcMarkersLoading}
                      >
                        Refresh
                      </Button>
                    </Group>
                  </Group>
                  
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Marker ID</Table.Th>
                        <Table.Th>Label</Table.Th>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>Quality Verdict</Table.Th>
                        <Table.Th>Quality Score</Table.Th>
                        <Table.Th>Timestamp</Table.Th>
                        <Table.Th>Details</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {qcMarkers.map((marker: any, index: number) => (
                        <Table.Tr key={marker.id || marker._id || `marker-${index}`}>
                          <Table.Td>
                            <Text size="sm" ff="monospace" c="dimmed">
                              {marker.id || marker._id || 'N/A'}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={500}>{marker.label || 'Unnamed Marker'}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light" color="blue">
                              {marker.tags?.marker_type || marker.tags?.['marker_type'] || 'unknown'}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            {marker.tags?.quality_verdict || marker.tags?.['quality_verdict'] ? (
                              <Badge 
                                color={
                                  (marker.tags?.quality_verdict || marker.tags?.['quality_verdict']) === 'PASS' 
                                    ? 'green' 
                                    : (marker.tags?.quality_verdict || marker.tags?.['quality_verdict']) === 'FAIL'
                                    ? 'red'
                                    : 'gray'
                                }
                                variant="light"
                              >
                                {marker.tags?.quality_verdict || marker.tags?.['quality_verdict']}
                              </Badge>
                            ) : (
                              <Text size="sm" c="dimmed">N/A</Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            {marker.tags?.quality_score || marker.tags?.['quality_score'] ? (
                              <Group gap="xs">
                                <Text fw={500}>
                                  {parseFloat(marker.tags?.quality_score || marker.tags?.['quality_score'] || '0').toFixed(1)}
                                </Text>
                                <Badge 
                                  size="sm"
                                  color={
                                    parseFloat(marker.tags?.quality_score || marker.tags?.['quality_score'] || '0') >= 90
                                      ? 'green'
                                      : parseFloat(marker.tags?.quality_score || marker.tags?.['quality_score'] || '0') >= 70
                                      ? 'blue'
                                      : parseFloat(marker.tags?.quality_score || marker.tags?.['quality_score'] || '0') >= 50
                                      ? 'yellow'
                                      : 'red'
                                  }
                                  variant="light"
                                >
                                  {parseFloat(marker.tags?.quality_score || marker.tags?.['quality_score'] || '0') >= 90
                                    ? 'Excellent'
                                    : parseFloat(marker.tags?.quality_score || marker.tags?.['quality_score'] || '0') >= 70
                                    ? 'Good'
                                    : parseFloat(marker.tags?.quality_score || marker.tags?.['quality_score'] || '0') >= 50
                                    ? 'Fair'
                                    : 'Poor'}
                                </Badge>
                              </Group>
                            ) : (
                              <Text size="sm" c="dimmed">N/A</Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            {marker.created || marker.created_at ? (
                              <Text size="sm">
                                {new Date(marker.created || marker.created_at).toLocaleString()}
                              </Text>
                            ) : (
                              <Text size="sm" c="dimmed">N/A</Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Button
                              variant="light"
                              size="xs"
                              onClick={() => {
                                setSelectedSegment(marker as any);
                                setShowDetailsModal(true);
                              }}
                            >
                              View Details
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Card>

                {/* QC Summary Statistics */}
                {qcMarkers.length > 0 && (
                  <Card withBorder>
                    <Title order={4} mb="md">QC Summary</Title>
                    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                      <Paper withBorder p="md" ta="center">
                        <Text size="xl" fw={700} c="blue">
                          {qcMarkers.length}
                        </Text>
                        <Text size="sm" c="dimmed">Total Markers</Text>
                      </Paper>
                      <Paper withBorder p="md" ta="center">
                        <Text size="xl" fw={700} c="green">
                          {qcMarkers.filter((m: any) => 
                            (m.tags?.quality_verdict || m.tags?.['quality_verdict']) === 'PASS'
                          ).length}
                        </Text>
                        <Text size="sm" c="dimmed">Passed</Text>
                      </Paper>
                      <Paper withBorder p="md" ta="center">
                        <Text size="xl" fw={700} c="red">
                          {qcMarkers.filter((m: any) => 
                            (m.tags?.quality_verdict || m.tags?.['quality_verdict']) === 'FAIL'
                          ).length}
                        </Text>
                        <Text size="sm" c="dimmed">Failed</Text>
                      </Paper>
                      <Paper withBorder p="md" ta="center">
                        <Text size="xl" fw={700} c="blue">
                          {qcMarkers.length > 0
                            ? (qcMarkers.reduce((sum: number, m: any) => {
                                const score = parseFloat(m.tags?.quality_score || m.tags?.['quality_score'] || '0');
                                return sum + score;
                              }, 0) / qcMarkers.length).toFixed(1)
                            : '0.0'}
                        </Text>
                        <Text size="sm" c="dimmed">Avg Score</Text>
                      </Paper>
                    </SimpleGrid>
                  </Card>
                )}
              </>
            )}
          </Stack>
        </Tabs.Panel>
          </Tabs>
        </Grid.Col>

        <Grid.Col span={4}>
          <Stack gap="lg">
            {/* Segment Player Box */}
            <Card withBorder p="xl" className="video-player-container">
              <Title order={4} mb="md" className="dark-text-primary">Segment Player</Title>
              <Stack gap="md">
                {!selectedSegment ? (
                  <Box
                    style={{
                      width: '100%',
                      height: '200px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed #dee2e6'
                    }}
                  >
                    <Stack gap="md" align="center">
                      <IconVideo size={48} color="#6c757d" />
                      <Text c="dimmed" size="sm" ta="center">
                        Select a segment to play
                      </Text>
                      <Text size="xs" c="dimmed" ta="center">
                        Flows contain segments, not direct video content
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
                        <Text c="white" size="sm">Loading segment player...</Text>
                      </Box>
                    )}
                  </Box>
                )}
              </Stack>
              
              {/* CMCD Data Display */}
              {renderCMCDData()}
            </Card>

            {/* Segment Metadata */}
              <Card withBorder p="md" className="now-playing-card">
              <Title order={5} mb="sm" className="dark-text-primary">
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
                      {flow.read_only !== undefined && (
                        <Badge color={flow.read_only ? 'orange' : 'blue'} variant="light" size="sm">
                          {flow.read_only ? 'Read Only' : 'Editable'}
                        </Badge>
                      )}
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
            <Card withBorder p="xl" className="quick-actions-card">
              <Title order={4} mb="md" className="dark-text-primary">Quick Actions</Title>
              <Stack gap="sm">
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
                {flowId && (
                  <Button 
                    variant="light" 
                    color="orange"
                    leftSection={<IconTrash size={16} />} 
                    onClick={() => {
                      setCleanupHours(24);
                      setCleanupResult(null);
                      setShowCleanupModal(true);
                    }}
                    fullWidth
                  >
                    Cleanup Segments
                  </Button>
                )}
                      </Stack>
                    </Card>

            {/* Read-Only Status Management */}
            {flowId ? (
              <FlowReadOnlyManager
                flowId={flowId}
                {...(flow.read_only !== undefined ? { initialReadOnly: flow.read_only } : {})}
                disabled={disabled}
                currentFlow={flow}
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
                          ...(flow?.codec ? { codec: flow.codec } : {}),
                          size: selectedSegment.size,
                          created: selectedSegment.created_at,
                          updated: selectedSegment.updated_at,
                          tags: selectedSegment.tags,
                          deleted: false,
                          deleted_at: null,
                          deleted_by: null
                        }}
                        {...(selectedSegment.description || flow.label ? { title: selectedSegment.description || flow.label || '' } : {})}
                        description={`VAST TAMS segment playback for ${flow.label || 'segment'}`}
                        onClose={handleVideoPlayerClose}
                        showControls={true}
                        autoPlay={true}
                        onError={(error) => {
                          console.error('VAST TAMS Video Player Error:', error);
                          setError(`Video playback error: ${error}`);
                        }}
                      />
                    ) : (
                      // No video content available for segments without presigned URLs
                      <Box
                        style={{
                          width: '100%',
                          height: '400px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px dashed #dee2e6'
                        }}
                      >
                        <Stack gap="md" align="center">
                          <IconAlertCircle size={48} color="#6c757d" />
                          <Text c="dimmed" size="lg" ta="center">
                            No video content available
                          </Text>
                          <Text size="sm" c="dimmed" ta="center">
                            This segment does not have playable video URLs
                          </Text>
                        </Stack>
                      </Box>
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



      {/* Upload Segment Modal */}
      <Modal
        opened={showUploadModal}
        onClose={() => {
          console.log('Closing upload modal');
          setShowUploadModal(false);
          setSelectedFile(null);
        }}
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
            value={selectedFile}
            onChange={setSelectedFile}
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
            <Button variant="light" onClick={() => {
              setShowUploadModal(false);
              setSelectedFile(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                console.log('Upload Segment button clicked in modal');
                try {
                const objectIdInput = document.getElementById('object-id') as HTMLInputElement;
                const startTimeInput = document.getElementById('start-time') as HTMLInputElement;
                const endTimeInput = document.getElementById('end-time') as HTMLInputElement;
                const descriptionInput = document.getElementById('description') as HTMLTextAreaElement;
                const tagsInput = document.getElementById('tags') as HTMLInputElement;
                
                  console.log('Form inputs found:', {
                    selectedFile: !!selectedFile,
                    objectIdInput: !!objectIdInput,
                    startTimeInput: !!startTimeInput,
                    endTimeInput: !!endTimeInput,
                    descriptionInput: !!descriptionInput,
                    tagsInput: !!tagsInput
                  });
                  
                  if (selectedFile) {
                    console.log('File selected:', selectedFile.name, selectedFile.size, 'bytes');
                  
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
                    handleUploadSegment(selectedFile, segmentData);
                } else {
                    console.warn('No file selected');
                  setError('Please select a file to upload');
                  }
                } catch (err) {
                  console.error('Error in upload button handler:', err);
                  setError(`Error preparing upload: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

      {/* Cleanup Segments Modal */}
      <Modal
        opened={showCleanupModal}
        onClose={() => {
          setShowCleanupModal(false);
          setCleanupResult(null);
          setCleanupHours(24);
        }}
        title="Cleanup Flow Segments"
        size="md"
      >
        <Stack gap="md">
          {cleanupResult ? (
            <>
              <Alert icon={<IconCheck size={16} />} color="green" title="Cleanup Complete">
                <Text size="sm">
                  Successfully cleaned up segments older than {cleanupHours} hours.
                </Text>
              </Alert>
              <Card withBorder p="md">
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>Deleted Segments:</Text>
                    <Text size="sm" fw={600}>{cleanupResult.deleted_segments}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>Freed Storage:</Text>
                    <Text size="sm" fw={600}>{cleanupResult.freed_gb} GB</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>Freed Bytes:</Text>
                    <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>
                      {cleanupResult.freed_bytes.toLocaleString()}
                    </Text>
                  </Group>
                </Stack>
              </Card>
              <Text size="xs" c="dimmed" ta="center">
                This modal will close automatically in a few seconds...
              </Text>
            </>
          ) : (
            <>
              <Alert icon={<IconInfoCircle size={16} />} color="blue" title="Cleanup Segments">
                <Text size="sm">
                  This will remove all segments older than the specified number of hours. 
                  The flow metadata will be preserved, but the old segments will be permanently deleted.
                </Text>
              </Alert>
              <NumberInput
                label="Keep Segments From Last (Hours)"
                description="Segments older than this will be deleted"
                value={cleanupHours}
                onChange={(value) => setCleanupHours(typeof value === 'number' ? value : 24)}
                min={1}
                max={8760}
                required
              />
              <Group justify="flex-end" mt="md">
                <Button
                  variant="subtle"
                  onClick={() => {
                    setShowCleanupModal(false);
                    setCleanupResult(null);
                    setCleanupHours(24);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="orange"
                  leftSection={<IconTrash size={16} />}
                  onClick={handleCleanupFlow}
                  loading={cleaningUp}
                >
                  Cleanup Segments
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>

    </Container>
  );
} 