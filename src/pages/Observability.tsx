import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Stack,
  Tabs,
  Card,
  Box,
  Badge,
  Alert,
  Button,
  Grid,
  Divider,
  Loader,
  SimpleGrid,
  Progress,
  Table
} from '@mantine/core';
import {
  IconActivity,
  IconHeart,
  IconChartBar,
  IconServer,
  IconDatabase,
  IconCloud,
  IconAlertTriangle,
  IconInfoCircle,
  IconRefresh,
  IconTrendingUp,
  IconTrendingDown,
  IconShieldCheck,
  IconCheck,
  IconGauge,
  IconShield,
  IconNetwork,
  IconClock
} from '@tabler/icons-react';
import { apiClient } from '../services/api';

// Live data interfaces
interface LiveHealthEndpoint {
  path: string;
  method: string;
  description: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  response_time: number;
  last_check: string;
}

interface LiveSystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  network_io: number;
  storage_io: number;
  api_response_time: number;
  database_query_time: number;
  timestamp: string;
}

interface LiveTamsMetrics {
  total_flows: number;
  total_segments: number;
  total_sources: number;
  storage_bytes: number;
  query_performance: number;
  connection_status: 'connected' | 'disconnected' | 'degraded';
  last_sync: string;
}

export default function Observability() {
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Live data state
  const [healthEndpoints, setHealthEndpoints] = useState<LiveHealthEndpoint[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<LiveSystemMetrics | null>(null);
  const [tamsMetrics, setTamsMetrics] = useState<LiveTamsMetrics | null>(null);
  const [overallHealth, setOverallHealth] = useState<'healthy' | 'unhealthy' | 'degraded'>('healthy');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [qcStatistics, setQcStatistics] = useState<any>(null);
  const [flowBreakdown, setFlowBreakdown] = useState<{ video: number; audio: number; data: number; markers: number }>({ video: 0, audio: 0, data: 0, markers: 0 });
  const [healthServices, setHealthServices] = useState<Record<string, string>>({});

  // Helper function to safely extract data from Promise results
  const safeExtractData = (result: PromiseSettledResult<any>, defaultValue: any = null) => {
    if (result.status === 'fulfilled' && result.value && typeof result.value === 'object') {
      return result.value;
    }
    return defaultValue;
  };

  // Helper function to check if a response indicates healthy status
  const isHealthyResponse = (data: any): boolean => {
    if (!data) return false;
    // Check for various health response formats
    if (data.status === 'healthy') return true;
    if (data.health === 'healthy') return true;
    if (data.data && data.data.status === 'healthy') return true;
    // If no status field, assume healthy if we got a response
    return true;
  };

  // Fetch live observability data
  const fetchLiveData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startTime = performance.now();
      
      // Fetch real data from API endpoints
      // Note: Don't use .catch() here - let Promise.allSettled handle rejections
      const [
        healthResult,
        sourcesResult,
        flowsResult,
        qcStatsResult
      ] = await Promise.allSettled([
        apiClient.getHealth(),
        apiClient.getSources(),
        apiClient.getFlows(),
        apiClient.getQCStatistics()
      ]);

      // Optionally fetch flow stats for a sample of flows to aggregate segment/storage data
      // We'll fetch stats for up to 10 flows to get aggregate metrics
      let totalSegments = 0;
      let totalStorageBytes = 0;
      let flowsWithStats = 0;
      
      if (flowsResult.status === 'fulfilled') {
        const flowsResponse = safeExtractData(flowsResult);
        let flowsData: any[] = [];
        
        if (flowsResponse && flowsResponse.data && Array.isArray(flowsResponse.data)) {
          flowsData = flowsResponse.data;
        } else if (Array.isArray(flowsResponse)) {
          flowsData = flowsResponse;
        } else if (flowsResponse && 'flows' in flowsResponse && Array.isArray((flowsResponse as any).flows)) {
          flowsData = (flowsResponse as any).flows;
        }
        
        // Fetch stats for up to 10 flows (to avoid too many requests)
        const flowsToCheck = flowsData.slice(0, 10).filter((f: any) => f.id || f._id);
        const flowStatsPromises = flowsToCheck.map((flow: any) => {
          const flowId = flow.id || flow._id;
          return apiClient.getFlowStats?.(flowId).catch(() => null); // Silently fail if stats not available
        });
        
        if (flowStatsPromises.length > 0) {
          const flowStatsResults = await Promise.allSettled(flowStatsPromises);
          flowStatsResults.forEach((result) => {
            if (result.status === 'fulfilled' && result.value) {
              const stats = result.value;
              if (stats.total_segments) {
                totalSegments += stats.total_segments;
              }
              if (stats.total_size_bytes) {
                totalStorageBytes += stats.total_size_bytes;
              }
              if (stats.total_segments || stats.total_size_bytes) {
                flowsWithStats++;
              }
            }
          });
        }
      }
      
      // Log any rejected promises for debugging
      [healthResult, sourcesResult, flowsResult, qcStatsResult].forEach((result, index) => {
        if (result.status === 'rejected') {
          const endpointNames = ['health', 'sources', 'flows', 'qcStatistics'];
          console.error(`${endpointNames[index]} fetch rejected:`, result.reason);
        }
      });

      const responseTime = Math.round(performance.now() - startTime);

      // Check if health check failed - this is critical
      if (healthResult.status === 'rejected') {
        const error = healthResult.reason;
        const errorMessage = error?.message || String(error) || 'Unknown error';
        const errorStack = error?.stack || '';
        console.error('Health check failed - Full error details:', {
          error,
          message: errorMessage,
          stack: errorStack,
          result: healthResult
        });
        
        // Provide more specific error message
        if (errorMessage.includes('Network error') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_')) {
          setError(`Cannot connect to backend API. Please ensure the TAMS API is running on http://localhost:3000. 
          
Error details: ${errorMessage}

Please check:
1. Is the backend running? Try: curl http://localhost:3000/health
2. Is the Vite proxy configured correctly?
3. Check the browser console for more details.`);
        } else {
          setError(`Failed to fetch health data: ${errorMessage}. 

Please check:
1. Backend connectivity
2. Browser console for details
3. Network tab for failed requests

Full error: ${errorMessage}`);
        }
        setLoading(false);
        return; // Exit early if health check fails
      }

      // Extract health data (real API structure: { status, timestamp, services: { mongodb, minio, kafka } })
      const healthData = safeExtractData(healthResult);
      
      // If health data is null/empty, it might indicate a problem
      if (!healthData || !healthData.status) {
        console.warn('Health data is missing or incomplete:', healthData);
        // Don't fail completely, but log a warning
      }
      const healthStatus = healthData?.status || 'unknown';
      const services = healthData?.services || {};
      setHealthServices(services);
      const healthTimestamp = healthData?.timestamp || new Date().toISOString();

      // Extract sources and flows data
      const sourcesResponse = safeExtractData(sourcesResult);
      const flowsResponse = safeExtractData(flowsResult);
      
      // Handle different response formats (bbcTamsGet normalizes to { data: [...], pagination: { count: ... } })
      let sourcesData: any[] = [];
      let totalSources = 0;
      if (sourcesResponse) {
        if (Array.isArray(sourcesResponse)) {
          sourcesData = sourcesResponse;
          totalSources = sourcesResponse.length;
        } else if (sourcesResponse.data && Array.isArray(sourcesResponse.data)) {
          sourcesData = sourcesResponse.data;
          // Prioritize pagination count (total) over array length (may be paginated)
          totalSources = sourcesResponse.pagination?.count ?? sourcesResponse.data.length;
        } else if (sourcesResponse.sources && Array.isArray(sourcesResponse.sources)) {
          sourcesData = sourcesResponse.sources;
          totalSources = sourcesResponse.count ?? sourcesResponse.sources.length;
        }
      }
      
      let flowsData: any[] = [];
      let totalFlows = 0;
      if (flowsResponse) {
        if (Array.isArray(flowsResponse)) {
          flowsData = flowsResponse;
          totalFlows = flowsResponse.length;
        } else if (flowsResponse.data && Array.isArray(flowsResponse.data)) {
          flowsData = flowsResponse.data;
          // Prioritize pagination count (total) over array length (may be paginated)
          totalFlows = flowsResponse.pagination?.count ?? flowsResponse.data.length;
        } else if (flowsResponse.flows && Array.isArray(flowsResponse.flows)) {
          flowsData = flowsResponse.flows;
          totalFlows = flowsResponse.count ?? flowsResponse.flows.length;
        }
      }

      // Extract QC statistics
      const qcStats = safeExtractData(qcStatsResult);
      setQcStatistics(qcStats);

      // Calculate flow statistics
      const videoFlows = flowsData.filter((f: any) => f.format === 'urn:x-nmos:format:video').length;
      const audioFlows = flowsData.filter((f: any) => f.format === 'urn:x-nmos:format:audio').length;
      const dataFlows = flowsData.filter((f: any) => f.format === 'urn:x-nmos:format:data').length;
      const markerFlows = flowsData.filter((f: any) => f.format === 'application/x-marker+json').length;
      
      // Update flow breakdown state
      setFlowBreakdown({
        video: videoFlows,
        audio: audioFlows,
        data: dataFlows,
        markers: markerFlows
      });

      // Process health endpoints based on actual API response
      const endpoints: LiveHealthEndpoint[] = [
        {
          path: '/health',
          method: 'GET',
          description: 'Overall system health check',
          status: healthStatus === 'healthy' ? 'healthy' : healthStatus === 'degraded' ? 'degraded' : 'unhealthy',
          response_time: responseTime,
          last_check: healthTimestamp
        }
      ];

      // Add service-specific health endpoints based on actual services in health response
      if (services.mongodb) {
        endpoints.push({
          path: '/health (mongodb)',
          method: 'GET',
          description: 'MongoDB database health check',
          status: services.mongodb === 'healthy' ? 'healthy' : 'unhealthy',
          response_time: responseTime,
          last_check: healthTimestamp
        });
      }

      if (services.minio) {
        endpoints.push({
          path: '/health (minio)',
          method: 'GET',
          description: 'MinIO S3 storage health check',
          status: services.minio === 'healthy' ? 'healthy' : 'unhealthy',
          response_time: responseTime,
          last_check: healthTimestamp
        });
      }

      if (services.kafka) {
        endpoints.push({
          path: '/health (kafka)',
          method: 'GET',
          description: 'Kafka message broker health check',
          status: services.kafka === 'healthy' ? 'healthy' : 'unhealthy',
          response_time: responseTime,
          last_check: healthTimestamp
        });
      }

      // Try to fetch metrics endpoint
      try {
        const metricsResponse = await fetch(import.meta.env.DEV ? '/api/metrics' : '/api/proxy/metrics');
        endpoints.push({
          path: '/metrics',
          method: 'GET',
          description: 'Prometheus metrics endpoint',
          status: metricsResponse.ok ? 'healthy' : 'unhealthy',
          response_time: 0,
          last_check: new Date().toISOString()
        });
      } catch {
        endpoints.push({
          path: '/metrics',
          method: 'GET',
          description: 'Prometheus metrics endpoint',
          status: 'unhealthy',
          response_time: 0,
          last_check: new Date().toISOString()
        });
        }
      
      setHealthEndpoints(endpoints);

      // Calculate TAMS metrics from real data
      // Note: total_segments and storage_bytes are aggregated from a sample of flows (up to 10)
      // For exact system-wide totals, would need to query stats for all flows (expensive)
      const tamsData: LiveTamsMetrics = {
        total_flows: totalFlows,
        total_segments: totalSegments, // Aggregated from sample flows (if available)
        total_sources: totalSources,
        storage_bytes: totalStorageBytes, // Aggregated from sample flows (if available)
        query_performance: responseTime < 100 ? 95 : responseTime < 500 ? 85 : 70,
        connection_status: healthStatus === 'healthy' ? 'connected' : healthStatus === 'degraded' ? 'degraded' : 'disconnected',
        last_sync: healthTimestamp
      };
      
      setTamsMetrics(tamsData);

      // Calculate overall health from actual services
      const serviceStatuses = Object.values(services);
      const healthyServices = serviceStatuses.filter((s: any) => s === 'healthy').length;
      const totalServices = serviceStatuses.length || 1;
      const healthPercentage = (healthyServices / totalServices) * 100;
      
      if (healthPercentage === 100 && healthStatus === 'healthy') {
        setOverallHealth('healthy');
      } else if (healthPercentage >= 50 || healthStatus === 'degraded') {
        setOverallHealth('degraded');
      } else {
        setOverallHealth('unhealthy');
      }

      // Calculate system metrics from real data (only what's available from API)
      setSystemMetrics({
        cpu_usage: 0, // Not available from API - will not display
        memory_usage: 0, // Not available from API - will not display
        network_io: 0, // Not available from API - will not display
        storage_io: 0, // Not available from API - will not display
        api_response_time: responseTime, // Real: measured from actual API calls
        database_query_time: 0, // Not available from API - removed misleading estimate
        timestamp: new Date().toISOString()
      });

      setLastUpdate(new Date().toLocaleTimeString());
      
    } catch (err: any) {
      console.error('Failed to fetch observability data:', err);
      const errorMessage = err?.message || 'Unknown error';
      
      // Provide more specific error messages
      if (errorMessage.includes('Network error') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        setError(`Cannot connect to backend API. Please ensure the TAMS API is running on http://localhost:3000. Error: ${errorMessage}`);
      } else if (errorMessage.includes('CORS')) {
        setError(`CORS error: The backend may not be configured to allow requests from this origin. Error: ${errorMessage}`);
      } else {
        setError(`Failed to fetch observability data: ${errorMessage}. Please check backend connectivity and console for details.`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
          const interval = setInterval(fetchLiveData, 7200000); // Refresh every 2 hours instead of every minute
    return () => clearInterval(interval);
  }, []);



  if (loading && !error) {
    return (
      <Container size="xl" px="xl" py="xl">
        <Box display="flex" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <Loader variant="dots" />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" px="xl" py="xl">
        <Box display="flex" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <Stack align="center">
            <Alert icon={<IconAlertTriangle size={16} />} color="red" title="Error" mb="md">
              {error}
            </Alert>
            <Button onClick={() => window.location.reload()} leftSection={<IconRefresh size={16} />}>
              Retry
            </Button>
          </Stack>
        </Box>
      </Container>
    );
  }

  return (
    <Container size="xl" px="xl" py="xl">
      {/* Header */}
      <Box mb="xl">
        <Group justify="space-between" align="flex-end">
          <Box>
            <Title order={2} mb="md">
              System Observability Dashboard
            </Title>
            <Text size="lg" c="dimmed">
              Monitor system performance, health, and metrics in real-time
            </Text>
          </Box>
          <Group gap="sm">
            <Badge 
              color={overallHealth === 'healthy' ? 'green' : overallHealth === 'degraded' ? 'yellow' : 'red'} 
              variant="filled"
              size="lg"
              radius="xl"
              leftSection={<IconShieldCheck size={16} />}
              style={{ 
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.5px'
              }}
            >
              TAMS - {overallHealth.toUpperCase()}
            </Badge>
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </Group>
        </Group>
      </Box>

      {/* TAMS Info Box */}
      <Alert
        icon={<IconInfoCircle size={20} />}
        title="What is this page?"
        color="blue"
        variant="light"
        mb="lg"
      >
        <Text size="sm">
          The System Observability Dashboard provides comprehensive monitoring of your TAMS application's 
          performance, health, and system metrics in real-time, including health monitoring 
          and comprehensive system tracking.
        </Text>
        <Text size="sm" mt="xs">
          This page includes:
        </Text>
        <Text size="sm" mt="xs">
          • <strong>Overview</strong> - System status overview and key features<br/>
          • <strong>Health Status</strong> - Live system health and service status<br/>
          • <strong>Performance</strong> - Performance monitoring and optimization insights
        </Text>
        <Text size="sm" mt="xs">
          <strong>Note:</strong> This page demonstrates TAMS observability capabilities 
          with enhanced monitoring and health features.
        </Text>
      </Alert>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab 
            value="overview" 
            leftSection={<IconActivity size={16} />}
          >
            Overview
          </Tabs.Tab>
          <Tabs.Tab 
            value="health" 
            leftSection={<IconHeart size={16} />}
          >
            Health Status
          </Tabs.Tab>
          <Tabs.Tab 
            value="performance" 
            leftSection={<IconTrendingUp size={16} />}
          >
            Performance
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="lg">
          <Stack gap="lg">
            {/* Quick Status Overview - Live Metrics */}
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card 
                  withBorder
                  p="lg"
                  radius="md"
                  style={{
                    background: overallHealth === 'healthy' 
                      ? 'linear-gradient(135deg, rgba(40, 199, 111, 0.1) 0%, rgba(40, 199, 111, 0.05) 100%)'
                      : overallHealth === 'degraded'
                      ? 'linear-gradient(135deg, rgba(250, 176, 5, 0.1) 0%, rgba(250, 176, 5, 0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(250, 82, 82, 0.1) 0%, rgba(250, 82, 82, 0.05) 100%)',
                    borderColor: overallHealth === 'healthy' 
                      ? 'var(--mantine-color-green-4)' 
                      : overallHealth === 'degraded'
                      ? 'var(--mantine-color-yellow-4)'
                      : 'var(--mantine-color-red-4)',
                    borderWidth: '2px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Stack align="center" gap="sm">
                    <Box
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: overallHealth === 'healthy'
                          ? 'linear-gradient(135deg, #40c057 0%, #37b24d 100%)'
                          : overallHealth === 'degraded'
                          ? 'linear-gradient(135deg, #fab005 0%, #f59f00 100%)'
                          : 'linear-gradient(135deg, #fa5252 0%, #e03131 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        marginBottom: '8px'
                      }}
                    >
                      <IconHeart 
                        size={32} 
                        color="white"
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' }}
                      />
                    </Box>
                    <Title order={4} fw={600}>System Health</Title>
                    <Badge 
                      color={overallHealth === 'healthy' ? 'green' : overallHealth === 'degraded' ? 'yellow' : 'red'} 
                      variant="filled"
                      size="lg"
                      radius="xl"
                      style={{ 
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        letterSpacing: '0.5px'
                      }}
                    >
                      {overallHealth.toUpperCase()}
                    </Badge>
                    {healthServices && Object.keys(healthServices).length > 0 && (
                      <Text size="sm" c="dimmed" mt="xs" ta="center" fw={500}>
                        {Object.values(healthServices).filter((s: any) => s === 'healthy').length} / {Object.keys(healthServices).length} services healthy
                      </Text>
                    )}
                  </Stack>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card 
                  withBorder
                  p="lg"
                  radius="md"
                  style={{
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
                    borderColor: 'var(--mantine-color-blue-4)',
                    borderWidth: '2px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Stack align="center" gap="sm">
                    <Box
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                        marginBottom: '8px'
                      }}
                    >
                      <IconActivity size={32} color="white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' }} />
                    </Box>
                    <Title order={4} fw={600}>Total Sources</Title>
                    <Text size="2.5rem" fw={700} c="blue" lh={1}>
                      {tamsMetrics?.total_sources ?? 0}
                    </Text>
                    <Text size="sm" c="dimmed" mt="xs" fw={500}>
                      Active sources
                    </Text>
                  </Stack>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card 
                  withBorder
                  p="lg"
                  radius="md"
                  style={{
                    background: 'linear-gradient(135deg, rgba(40, 199, 111, 0.1) 0%, rgba(40, 199, 111, 0.05) 100%)',
                    borderColor: 'var(--mantine-color-green-4)',
                    borderWidth: '2px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(40, 199, 111, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Stack align="center" gap="sm">
                    <Box
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #40c057 0%, #37b24d 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(40, 199, 111, 0.3)',
                        marginBottom: '8px'
                      }}
                    >
                      <IconChartBar size={32} color="white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' }} />
                    </Box>
                    <Title order={4} fw={600}>Total Flows</Title>
                    <Text size="2.5rem" fw={700} c="green" lh={1}>
                      {tamsMetrics?.total_flows ?? 0}
                    </Text>
                    <Text size="sm" c="dimmed" mt="xs" fw={500}>
                      {flowBreakdown.video + flowBreakdown.audio + flowBreakdown.data + flowBreakdown.markers} active
                    </Text>
                  </Stack>
                </Card>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Card 
                  withBorder
                  p="lg"
                  radius="md"
                  style={{
                    background: systemMetrics?.api_response_time 
                      ? (systemMetrics.api_response_time < 100
                          ? 'linear-gradient(135deg, rgba(40, 199, 111, 0.1) 0%, rgba(40, 199, 111, 0.05) 100%)'
                          : systemMetrics.api_response_time < 500
                          ? 'linear-gradient(135deg, rgba(250, 176, 5, 0.1) 0%, rgba(250, 176, 5, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(250, 82, 82, 0.1) 0%, rgba(250, 82, 82, 0.05) 100%)')
                      : 'linear-gradient(135deg, rgba(134, 142, 150, 0.1) 0%, rgba(134, 142, 150, 0.05) 100%)',
                    borderColor: systemMetrics?.api_response_time
                      ? (systemMetrics.api_response_time < 100
                          ? 'var(--mantine-color-green-4)'
                          : systemMetrics.api_response_time < 500
                          ? 'var(--mantine-color-yellow-4)'
                          : 'var(--mantine-color-red-4)')
                      : 'var(--mantine-color-gray-4)',
                    borderWidth: '2px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Stack align="center" gap="sm">
                    <Box
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: systemMetrics?.api_response_time
                          ? (systemMetrics.api_response_time < 100
                              ? 'linear-gradient(135deg, #40c057 0%, #37b24d 100%)'
                              : systemMetrics.api_response_time < 500
                              ? 'linear-gradient(135deg, #fab005 0%, #f59f00 100%)'
                              : 'linear-gradient(135deg, #fa5252 0%, #e03131 100%)')
                          : 'linear-gradient(135deg, #868e96 0%, #6c757d 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        marginBottom: '8px'
                      }}
                    >
                      <IconTrendingUp 
                        size={32} 
                        color="white"
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' }}
                      />
                    </Box>
                    <Title order={4} fw={600}>API Response</Title>
                    <Text size="2.5rem" fw={700} c={systemMetrics?.api_response_time ? (systemMetrics.api_response_time < 100 ? 'green' : systemMetrics.api_response_time < 500 ? 'yellow' : 'red') : 'gray'} lh={1}>
                      {systemMetrics?.api_response_time ?? 0}ms
                    </Text>
                    <Text size="sm" c="dimmed" mt="xs" fw={500}>
                      {tamsMetrics?.query_performance ?? 0}% performance
                    </Text>
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>

            {/* System Statistics */}
            {tamsMetrics && (
              <Card withBorder>
                <Title order={4} mb="md">System Statistics</Title>
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                  <Box
                    p="md"
                    style={{
                      background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0.03) 100%)',
                      borderRadius: '8px',
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Text size="sm" c="dimmed" mb="xs" fw={500}>Total Sources</Text>
                    <Text size="2rem" fw={700} c="blue" lh={1}>{tamsMetrics.total_sources}</Text>
                  </Box>
                  <Box
                    p="md"
                    style={{
                      background: 'linear-gradient(135deg, rgba(40, 199, 111, 0.08) 0%, rgba(40, 199, 111, 0.03) 100%)',
                      borderRadius: '8px',
                      border: '1px solid rgba(40, 199, 111, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 199, 111, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Text size="sm" c="dimmed" mb="xs" fw={500}>Total Flows</Text>
                    <Text size="2rem" fw={700} c="green" lh={1}>{tamsMetrics.total_flows}</Text>
                  </Box>
                  <Box
                    p="md"
                    style={{
                      background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0.03) 100%)',
                      borderRadius: '8px',
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Text size="sm" c="dimmed" mb="xs" fw={500}>Video Flows</Text>
                    <Text size="2rem" fw={700} c="blue" lh={1}>{flowBreakdown.video}</Text>
                  </Box>
                  <Box
                    p="md"
                    style={{
                      background: 'linear-gradient(135deg, rgba(40, 199, 111, 0.08) 0%, rgba(40, 199, 111, 0.03) 100%)',
                      borderRadius: '8px',
                      border: '1px solid rgba(40, 199, 111, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 199, 111, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Text size="sm" c="dimmed" mb="xs" fw={500}>Audio Flows</Text>
                    <Text size="2rem" fw={700} c="green" lh={1}>{flowBreakdown.audio}</Text>
                  </Box>
                  <Box
                    p="md"
                    style={{
                      background: 'linear-gradient(135deg, rgba(250, 176, 5, 0.08) 0%, rgba(250, 176, 5, 0.03) 100%)',
                      borderRadius: '8px',
                      border: '1px solid rgba(250, 176, 5, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(250, 176, 5, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Text size="sm" c="dimmed" mb="xs" fw={500}>Data Flows</Text>
                    <Text size="2rem" fw={700} c="orange" lh={1}>{flowBreakdown.data}</Text>
                  </Box>
                  <Box
                    p="md"
                    style={{
                      background: 'linear-gradient(135deg, rgba(134, 142, 150, 0.08) 0%, rgba(134, 142, 150, 0.03) 100%)',
                      borderRadius: '8px',
                      border: '1px solid rgba(134, 142, 150, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(134, 142, 150, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Text size="sm" c="dimmed" mb="xs" fw={500}>Marker Flows</Text>
                    <Text size="2rem" fw={700} c="gray" lh={1}>{flowBreakdown.markers}</Text>
                  </Box>
                  <Box
                    p="md"
                    style={{
                      background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(6, 182, 212, 0.03) 100%)',
                      borderRadius: '8px',
                      border: '1px solid rgba(6, 182, 212, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(6, 182, 212, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Text size="sm" c="dimmed" mb="xs" fw={500}>API Response Time</Text>
                    <Text size="2rem" fw={700} c="cyan" lh={1}>{systemMetrics?.api_response_time || 0}ms</Text>
                  </Box>
                  <Box
                    p="md"
                    style={{
                      background: tamsMetrics.query_performance >= 90
                        ? 'linear-gradient(135deg, rgba(40, 199, 111, 0.08) 0%, rgba(40, 199, 111, 0.03) 100%)'
                        : tamsMetrics.query_performance >= 70
                        ? 'linear-gradient(135deg, rgba(250, 176, 5, 0.08) 0%, rgba(250, 176, 5, 0.03) 100%)'
                        : 'linear-gradient(135deg, rgba(250, 82, 82, 0.08) 0%, rgba(250, 82, 82, 0.03) 100%)',
                      borderRadius: '8px',
                      border: `1px solid ${tamsMetrics.query_performance >= 90 ? 'rgba(40, 199, 111, 0.2)' : tamsMetrics.query_performance >= 70 ? 'rgba(250, 176, 5, 0.2)' : 'rgba(250, 82, 82, 0.2)'}`,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Text size="sm" c="dimmed" mb="xs" fw={500}>Query Performance</Text>
                    <Text size="2rem" fw={700} c={tamsMetrics.query_performance >= 90 ? 'green' : tamsMetrics.query_performance >= 70 ? 'yellow' : 'red'} lh={1}>
                      {tamsMetrics.query_performance}%
                    </Text>
                  </Box>
                </SimpleGrid>
              </Card>
            )}

            {/* QC Statistics */}
            {qcStatistics && (
              <Card 
                withBorder
                p="xl"
                radius="md"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
                }}
              >
                <Title order={4} mb="lg" fw={700}>Quality Control Statistics</Title>
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
                  <Box
                    p="md"
                    style={{
                      background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0.03) 100%)',
                      borderRadius: '8px',
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Text size="sm" c="dimmed" mb="xs" fw={500}>Videos Analyzed</Text>
                    <Text size="2rem" fw={700} c="blue" lh={1}>{qcStatistics.total_videos_analyzed || 0}</Text>
                  </Box>
                  <Box
                    p="md"
                    style={{
                      background: 'linear-gradient(135deg, rgba(40, 199, 111, 0.08) 0%, rgba(40, 199, 111, 0.03) 100%)',
                      borderRadius: '8px',
                      border: '1px solid rgba(40, 199, 111, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 199, 111, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Text size="sm" c="dimmed" mb="xs" fw={500}>Chunks Analyzed</Text>
                    <Text size="2rem" fw={700} c="green" lh={1}>{qcStatistics.total_chunks_analyzed || 0}</Text>
                  </Box>
                  <Box
                    p="md"
                    style={{
                      background: 'linear-gradient(135deg, rgba(40, 199, 111, 0.08) 0%, rgba(40, 199, 111, 0.03) 100%)',
                      borderRadius: '8px',
                      border: '1px solid rgba(40, 199, 111, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 199, 111, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Text size="sm" c="dimmed" mb="xs" fw={500}>Passed Chunks</Text>
                    <Text size="2rem" fw={700} c="green" lh={1}>{qcStatistics.passed_chunks || 0}</Text>
                  </Box>
                  <Box
                    p="md"
                    style={{
                      background: 'linear-gradient(135deg, rgba(250, 82, 82, 0.08) 0%, rgba(250, 82, 82, 0.03) 100%)',
                      borderRadius: '8px',
                      border: '1px solid rgba(250, 82, 82, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(250, 82, 82, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Text size="sm" c="dimmed" mb="xs" fw={500}>Failed Chunks</Text>
                    <Text size="2rem" fw={700} c="red" lh={1}>{qcStatistics.failed_chunks || 0}</Text>
                  </Box>
                  <Box
                    p="md"
                    style={{
                      background: qcStatistics.average_quality_score >= 90
                        ? 'linear-gradient(135deg, rgba(40, 199, 111, 0.08) 0%, rgba(40, 199, 111, 0.03) 100%)'
                        : qcStatistics.average_quality_score >= 70
                        ? 'linear-gradient(135deg, rgba(250, 176, 5, 0.08) 0%, rgba(250, 176, 5, 0.03) 100%)'
                        : 'linear-gradient(135deg, rgba(250, 82, 82, 0.08) 0%, rgba(250, 82, 82, 0.03) 100%)',
                      borderRadius: '8px',
                      border: `1px solid ${qcStatistics.average_quality_score >= 90 ? 'rgba(40, 199, 111, 0.2)' : qcStatistics.average_quality_score >= 70 ? 'rgba(250, 176, 5, 0.2)' : 'rgba(250, 82, 82, 0.2)'}`,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Text size="sm" c="dimmed" mb="xs" fw={500}>Avg Quality Score</Text>
                    <Text size="2rem" fw={700} c={qcStatistics.average_quality_score >= 90 ? 'green' : qcStatistics.average_quality_score >= 70 ? 'yellow' : 'red'} lh={1}>
                      {qcStatistics.average_quality_score?.toFixed(1) || '0.0'}
                    </Text>
                  </Box>
                </SimpleGrid>
                {qcStatistics.quality_distribution && (
                  <Box mt="md">
                    <Text fw={500} mb="xs">Quality Distribution:</Text>
                    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
                      <Badge color="green" variant="light" size="lg">Excellent: {qcStatistics.quality_distribution.excellent || 0}</Badge>
                      <Badge color="blue" variant="light" size="lg">Good: {qcStatistics.quality_distribution.good || 0}</Badge>
                      <Badge color="yellow" variant="light" size="lg">Fair: {qcStatistics.quality_distribution.fair || 0}</Badge>
                      <Badge color="red" variant="light" size="lg">Poor: {qcStatistics.quality_distribution.poor || 0}</Badge>
                    </SimpleGrid>
                  </Box>
                )}
              </Card>
            )}

            {/* Key Features */}
            <Card>
              <Title order={4} mb="md">Observability Features</Title>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="md">
                    <Group>
                      <IconHeart size={20} color="green" />
                      <Box>
                        <Text fw={500}>System Health Monitoring</Text>
                        <Text size="sm" c="dimmed">
                          Real-time health status for MongoDB, MinIO, and Kafka services
                        </Text>
                      </Box>
                    </Group>
                    
                    <Group>
                      <IconTrendingUp size={20} color="orange" />
                      <Box>
                        <Text fw={500}>API Performance Metrics</Text>
                        <Text size="sm" c="dimmed">
                          API response times and query performance from actual requests
                        </Text>
                      </Box>
                    </Group>
                    
                    <Group>
                      <IconActivity size={20} color="blue" />
                      <Box>
                        <Text fw={500}>System Statistics</Text>
                        <Text size="sm" c="dimmed">
                          Real-time counts of sources, flows, and flow type breakdowns
                        </Text>
                      </Box>
                    </Group>
                  </Stack>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="md">
                    
                    <Group>
                      <IconChartBar size={20} color="cyan" />
                      <Box>
                        <Text fw={500}>Quality Control Statistics</Text>
                        <Text size="sm" c="dimmed">
                          QC analysis results including passed/failed chunks and quality scores
                        </Text>
                      </Box>
                    </Group>
                    
                    <Group>
                      <IconServer size={20} color="red" />
                      <Box>
                        <Text fw={500}>System Health Monitoring</Text>
                        <Text size="sm" c="dimmed">
                          Real-time health status for MongoDB, MinIO, and Kafka services
                        </Text>
                      </Box>
                    </Group>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card>

            {/* API Endpoints */}
            <Card>
              <Title order={4} mb="md">Available API Endpoints</Title>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="sm">
                    <Group>
                      <Badge color="blue" variant="light">GET</Badge>
                      <Text size="sm" style={{ fontFamily: 'monospace' }}>/health</Text>
                      <Text size="sm" c="dimmed">System health check</Text>
                    </Group>
                    <Group>
                      <Badge color="green" variant="light">GET</Badge>
                      <Text size="sm" style={{ fontFamily: 'monospace' }}>/sources</Text>
                      <Text size="sm" c="dimmed">List all sources</Text>
                    </Group>
                    <Group>
                      <Badge color="green" variant="light">GET</Badge>
                      <Text size="sm" style={{ fontFamily: 'monospace' }}>/flows</Text>
                      <Text size="sm" c="dimmed">List all flows</Text>
                    </Group>
                  </Stack>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="sm">
                    <Group>
                      <Badge color="green" variant="light">GET</Badge>
                      <Text size="sm" style={{ fontFamily: 'monospace' }}>/qc/statistics</Text>
                      <Text size="sm" c="dimmed">QC statistics</Text>
                    </Group>
                    <Group>
                      <Badge color="green" variant="light">GET</Badge>
                      <Text size="sm" style={{ fontFamily: 'monospace' }}>/qc/failed-chunks</Text>
                      <Text size="sm" c="dimmed">QC failed chunks</Text>
                    </Group>
                    <Group>
                      <Badge color="green" variant="light">GET</Badge>
                      <Text size="sm" style={{ fontFamily: 'monospace' }}>/qc/by-quality</Text>
                      <Text size="sm" c="dimmed">QC results by quality</Text>
                    </Group>
                    <Group>
                      <Badge color="green" variant="light">GET</Badge>
                      <Text size="sm" style={{ fontFamily: 'monospace' }}>/sources/:id</Text>
                      <Text size="sm" c="dimmed">Get source details</Text>
                    </Group>
                    <Group>
                      <Badge color="green" variant="light">GET</Badge>
                      <Text size="sm" style={{ fontFamily: 'monospace' }}>/flows/:id</Text>
                      <Text size="sm" c="dimmed">Get flow details</Text>
                    </Group>
                    <Group>
                      <Badge color="green" variant="light">GET</Badge>
                      <Text size="sm" style={{ fontFamily: 'monospace' }}>/flows/:id/qc-markers</Text>
                      <Text size="sm" c="dimmed">QC markers for flow</Text>
                    </Group>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="health" pt="lg">
          <Stack gap="lg">
            {/* Overall System Health */}
            <Card 
              withBorder
              p="xl"
              radius="md"
              style={{
                background: overallHealth === 'healthy'
                  ? 'linear-gradient(135deg, rgba(40, 199, 111, 0.1) 0%, rgba(40, 199, 111, 0.05) 100%)'
                  : overallHealth === 'degraded'
                  ? 'linear-gradient(135deg, rgba(250, 176, 5, 0.1) 0%, rgba(250, 176, 5, 0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(250, 82, 82, 0.1) 0%, rgba(250, 82, 82, 0.05) 100%)',
                borderColor: overallHealth === 'healthy'
                  ? 'var(--mantine-color-green-4)'
                  : overallHealth === 'degraded'
                  ? 'var(--mantine-color-yellow-4)'
                  : 'var(--mantine-color-red-4)',
                borderWidth: '2px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              <Group justify="space-between" align="flex-start" mb="lg">
                <Box>
                  <Title order={4} mb="xs" fw={700}>System Health Status</Title>
                  <Text size="sm" c="dimmed">
                    Last updated: {lastUpdate || 'Never'}
                  </Text>
                </Box>
                <Badge 
                  color={overallHealth === 'healthy' ? 'green' : overallHealth === 'degraded' ? 'yellow' : 'red'} 
                  variant="filled"
                  size="lg"
                  radius="xl"
                  style={{ 
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    letterSpacing: '0.5px'
                  }}
                >
                  {overallHealth.toUpperCase()}
                </Badge>
              </Group>
              
              {healthServices && Object.keys(healthServices).length > 0 && (
                <Box>
                  <Text size="sm" fw={500} mb="md">Service Status</Text>
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                    {Object.entries(healthServices).map(([serviceName, status]) => (
                      <Card 
                        key={serviceName}
                        withBorder
                        p="md"
                        radius="md"
                        style={{
                          background: status === 'healthy'
                            ? 'linear-gradient(135deg, rgba(40, 199, 111, 0.08) 0%, rgba(40, 199, 111, 0.03) 100%)'
                            : 'linear-gradient(135deg, rgba(250, 82, 82, 0.08) 0%, rgba(250, 82, 82, 0.03) 100%)',
                          borderColor: status === 'healthy'
                            ? 'var(--mantine-color-green-4)'
                            : 'var(--mantine-color-red-4)',
                          borderWidth: '1px'
                        }}
                      >
                        <Group justify="space-between" align="center">
                          <Box>
                            <Text fw={600} size="sm" mb={4}>
                              {serviceName === 'mongodb' ? 'MongoDB' : serviceName === 'minio' ? 'MinIO' : serviceName === 'kafka' ? 'Kafka' : serviceName}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {serviceName === 'mongodb' ? 'Database' : serviceName === 'minio' ? 'S3 Storage' : serviceName === 'kafka' ? 'Message Broker' : 'Service'}
                            </Text>
                          </Box>
                          <Badge 
                            color={status === 'healthy' ? 'green' : 'red'} 
                            variant="light"
                            size="md"
                          >
                            {status === 'healthy' ? 'Healthy' : 'Unhealthy'}
                          </Badge>
                        </Group>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Box>
              )}
            </Card>

            {/* Health Endpoints */}
            {healthEndpoints.length > 0 && (
              <Card 
                withBorder
                p="xl"
                radius="md"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
                }}
              >
                <Title order={4} mb="lg" fw={700}>Health Endpoints</Title>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Endpoint</Table.Th>
                      <Table.Th>Method</Table.Th>
                      <Table.Th>Description</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Response Time</Table.Th>
                      <Table.Th>Last Check</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {healthEndpoints.map((endpoint, index) => (
                      <Table.Tr key={index}>
                        <Table.Td>
                          <Text size="sm" style={{ fontFamily: 'monospace' }}>{endpoint.path}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color="blue" variant="light" size="sm">{endpoint.method}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{endpoint.description}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge 
                            color={endpoint.status === 'healthy' ? 'green' : endpoint.status === 'degraded' ? 'yellow' : 'red'} 
                            variant="light" 
                            size="sm"
                          >
                            {endpoint.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{endpoint.response_time}ms</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {new Date(endpoint.last_check).toLocaleString()}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Card>
            )}
            
            <Alert icon={<IconInfoCircle size={16} />} color="blue">
              <Text size="sm">
                The health status shows real-time system health information from the TAMS API, including 
                service status for MongoDB, MinIO, and Kafka. Health checks are performed automatically 
                and updated regularly.
              </Text>
            </Alert>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="performance" pt="lg">
          <Stack gap="lg">
            {/* API Performance Metrics - Real Data Only */}
            <Card 
              withBorder
              p="xl"
              radius="md"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              <Title order={4} mb="lg" fw={700}>API Performance Metrics</Title>
              <Stack gap="lg">
                {systemMetrics && systemMetrics.api_response_time > 0 && (
                  <Box
                    p="md"
                    style={{
                      background: systemMetrics.api_response_time < 100
                        ? 'linear-gradient(135deg, rgba(40, 199, 111, 0.08) 0%, rgba(40, 199, 111, 0.03) 100%)'
                        : systemMetrics.api_response_time < 500
                        ? 'linear-gradient(135deg, rgba(250, 176, 5, 0.08) 0%, rgba(250, 176, 5, 0.03) 100%)'
                        : 'linear-gradient(135deg, rgba(250, 82, 82, 0.08) 0%, rgba(250, 82, 82, 0.03) 100%)',
                      borderRadius: '8px',
                      border: `1px solid ${systemMetrics.api_response_time < 100 ? 'rgba(40, 199, 111, 0.2)' : systemMetrics.api_response_time < 500 ? 'rgba(250, 176, 5, 0.2)' : 'rgba(250, 82, 82, 0.2)'}`
                    }}
                  >
                    <Group justify="space-between" mb="xs">
                      <Box>
                        <Text fw={600} size="sm" mb={4}>API Response Time</Text>
                        <Text size="xs" c="dimmed">
                          Time taken for health check endpoint
                        </Text>
                      </Box>
                      <Text size="xl" fw={700} c={systemMetrics.api_response_time < 100 ? 'green' : systemMetrics.api_response_time < 500 ? 'yellow' : 'red'}>
                        {systemMetrics.api_response_time.toFixed(0)}ms
                      </Text>
                    </Group>
                    <Progress 
                      value={Math.min(100, Math.max(0, 100 - (systemMetrics.api_response_time / 10)))} 
                      color={systemMetrics.api_response_time < 100 ? 'green' : systemMetrics.api_response_time < 500 ? 'yellow' : 'red'}
                      size="md"
                      radius="xl"
                    />
                  </Box>
                )}
                
                {tamsMetrics && tamsMetrics.query_performance > 0 && (
                  <Box
                    p="md"
                    style={{
                      background: tamsMetrics.query_performance >= 90
                        ? 'linear-gradient(135deg, rgba(40, 199, 111, 0.08) 0%, rgba(40, 199, 111, 0.03) 100%)'
                        : tamsMetrics.query_performance >= 70
                        ? 'linear-gradient(135deg, rgba(250, 176, 5, 0.08) 0%, rgba(250, 176, 5, 0.03) 100%)'
                        : 'linear-gradient(135deg, rgba(250, 82, 82, 0.08) 0%, rgba(250, 82, 82, 0.03) 100%)',
                      borderRadius: '8px',
                      border: `1px solid ${tamsMetrics.query_performance >= 90 ? 'rgba(40, 199, 111, 0.2)' : tamsMetrics.query_performance >= 70 ? 'rgba(250, 176, 5, 0.2)' : 'rgba(250, 82, 82, 0.2)'}`
                    }}
                  >
                    <Group justify="space-between" mb="xs">
                      <Box>
                        <Text fw={600} size="sm" mb={4}>Query Performance Score</Text>
                        <Text size="xs" c="dimmed">
                          Calculated from API response times (95% if &lt;100ms, 85% if &lt;500ms, 70% otherwise)
                        </Text>
                      </Box>
                      <Text size="xl" fw={700} c={tamsMetrics.query_performance >= 90 ? 'green' : tamsMetrics.query_performance >= 70 ? 'yellow' : 'red'}>
                        {tamsMetrics.query_performance}%
                      </Text>
                    </Group>
                    <Progress 
                      value={tamsMetrics.query_performance} 
                      color={tamsMetrics.query_performance >= 90 ? 'green' : tamsMetrics.query_performance >= 70 ? 'yellow' : 'red'}
                      size="md"
                      radius="xl"
                    />
                  </Box>
                )}
              </Stack>
            </Card>

            {/* Connection Status */}
            {tamsMetrics && (
              <Card 
                withBorder
                p="xl"
                radius="md"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
                }}
              >
                <Title order={4} mb="lg" fw={700}>Connection Status</Title>
                <Stack gap="md">
                  <Box
                    p="md"
                    style={{
                      background: tamsMetrics.connection_status === 'connected'
                        ? 'linear-gradient(135deg, rgba(40, 199, 111, 0.08) 0%, rgba(40, 199, 111, 0.03) 100%)'
                        : tamsMetrics.connection_status === 'degraded'
                        ? 'linear-gradient(135deg, rgba(250, 176, 5, 0.08) 0%, rgba(250, 176, 5, 0.03) 100%)'
                        : 'linear-gradient(135deg, rgba(250, 82, 82, 0.08) 0%, rgba(250, 82, 82, 0.03) 100%)',
                      borderRadius: '8px',
                      border: `1px solid ${tamsMetrics.connection_status === 'connected' ? 'rgba(40, 199, 111, 0.2)' : tamsMetrics.connection_status === 'degraded' ? 'rgba(250, 176, 5, 0.2)' : 'rgba(250, 82, 82, 0.2)'}`
                    }}
                  >
                    <Group justify="space-between" align="center">
                      <Box>
                        <Text fw={600} size="sm" mb={4}>API Connection</Text>
                        <Text size="xs" c="dimmed">
                          Connection status based on system health
                        </Text>
                      </Box>
                      <Badge 
                        color={tamsMetrics.connection_status === 'connected' ? 'green' : tamsMetrics.connection_status === 'degraded' ? 'yellow' : 'red'} 
                        variant="filled"
                        size="lg"
                        radius="xl"
                        style={{ 
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          letterSpacing: '0.5px'
                        }}
                      >
                        {tamsMetrics.connection_status.toUpperCase()}
                      </Badge>
                    </Group>
                    {tamsMetrics.last_sync && (
                      <Text size="xs" c="dimmed" mt="md">
                        Last sync: {new Date(tamsMetrics.last_sync).toLocaleString()}
                      </Text>
                    )}
                  </Box>
                </Stack>
              </Card>
            )}

            {/* Performance Information */}
            <Card 
              withBorder
              p="xl"
              radius="md"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              <Title order={4} mb="md" fw={700}>About Performance Metrics</Title>
              <Text c="dimmed" mb="md" size="sm">
                Real-time performance metrics from the TAMS API. Only metrics available from the API are displayed.
              </Text>
              
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <Box
                  p="md"
                  style={{
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(37, 99, 235, 0.02) 100%)',
                    borderRadius: '8px',
                    border: '1px solid rgba(37, 99, 235, 0.2)'
                  }}
                >
                  <Text fw={600} size="sm" mb="xs">API Response Times</Text>
                  <Text size="xs" c="dimmed">
                    Monitor API endpoint response times from health checks and data queries. Measured from actual API calls.
                  </Text>
                </Box>
                
                <Box
                  p="md"
                  style={{
                    background: 'linear-gradient(135deg, rgba(40, 199, 111, 0.05) 0%, rgba(40, 199, 111, 0.02) 100%)',
                    borderRadius: '8px',
                    border: '1px solid rgba(40, 199, 111, 0.2)'
                  }}
                >
                  <Text fw={600} size="sm" mb="xs">Connection Status</Text>
                  <Text size="xs" c="dimmed">
                    Track API connection status and service availability based on health endpoint responses.
                  </Text>
                </Box>
              </SimpleGrid>
            </Card>
            
            <Alert icon={<IconInfoCircle size={16} />} color="blue">
              <Text size="sm">
                <strong>Note:</strong> This page displays only data available from the TAMS API endpoints. 
                System-level metrics (CPU, memory, network I/O, database query times) are not available from the API and are not shown.
              </Text>
            </Alert>
          </Stack>
        </Tabs.Panel>



      </Tabs>
    </Container>
  );
}
