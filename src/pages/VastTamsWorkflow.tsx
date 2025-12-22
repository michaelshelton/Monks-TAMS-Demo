import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Group,
  Button,
  Badge,
  SimpleGrid,
  Alert,
  Tabs,
  Box,
  Progress,
  Timeline,
  ActionIcon,
  Tooltip,
  Divider,
  Paper,
  Grid,
  ThemeIcon,
  Loader,
  Center
} from '@mantine/core';
import {
  IconBroadcast,
  IconVideo,
  IconDatabase,
  IconClock,
  IconPlayerPlay,
  IconDownload,
  IconSearch,
  IconSettings,
  IconActivity,
  IconShield,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
  IconArrowRight,
  IconTarget,
  IconTimeline,
  IconLink,
  IconWebhook,
  IconTrash,
  IconRestore
} from '@tabler/icons-react';
import { apiClient } from '../services/api';

// VAST TAMS Workflow Demo Component
export default function VastTamsWorkflow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [workflowData, setWorkflowData] = useState<{
    sources: any[];
    flows: any[];
    segments: any[];
    analytics: any;
    webhooks: any[];
    health: any;
  }>({
    sources: [],
    flows: [],
    segments: [],
    analytics: null,
    webhooks: [],
    health: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Workflow steps based on VAST TAMS API capabilities
  const workflowSteps = [
    {
      id: 'health',
      title: 'System Health',
      description: 'Check TAMS API connectivity and system status',
      icon: <IconShield size={24} />,
      color: 'green',
      endpoint: '/health'
    },
    {
      id: 'sources',
      title: 'Media Sources',
      description: 'Manage media input sources with TAMS v6.0 compliance',
      icon: <IconBroadcast size={24} />,
      color: 'blue',
      endpoint: '/sources'
    },
    {
      id: 'flows',
      title: 'Media Flows',
      description: 'Create and manage processing flows with advanced features',
      icon: <IconVideo size={24} />,
      color: 'purple',
      endpoint: '/flows'
    },
    {
      id: 'segments',
      title: 'Time-Addressable Segments',
      description: 'Upload and manage media segments with dual URL support',
      icon: <IconTimeline size={24} />,
      color: 'orange',
      endpoint: '/flows/{flow_id}/segments'
    },
    {
      id: 'analytics',
      title: 'Analytics & Monitoring',
      description: 'View real-time usage analytics and performance metrics',
      icon: <IconActivity size={24} />,
      color: 'teal',
      endpoint: '/analytics'
    },
    {
      id: 'webhooks',
      title: 'Event Webhooks',
      description: 'Configure real-time event notifications and automation',
      icon: <IconWebhook size={24} />,
      color: 'red',
      endpoint: '/service/webhooks'
    }
  ];

  // Load data for current step
  const loadStepData = async (stepId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      switch (stepId) {
        case 'health':
          const health = await apiClient.getHealth();
          setWorkflowData(prev => ({ ...prev, health }));
          break;
          
        case 'sources':
          const sourcesResponse = await apiClient.getSources({ limit: 10 });
          setWorkflowData(prev => ({ ...prev, sources: sourcesResponse.data }));
          break;
          
        case 'flows':
          const flowsResponse = await apiClient.getFlows({ limit: 10 });
          setWorkflowData(prev => ({ ...prev, flows: flowsResponse.data }));
          break;
          
        case 'segments':
          // Get segments from first available flow
          if (workflowData.flows.length > 0) {
            const firstFlow = workflowData.flows[0];
            const segmentsResponse = await apiClient.getFlowSegments(firstFlow.id, { limit: 5 });
            setWorkflowData(prev => ({ ...prev, segments: segmentsResponse.data }));
          }
          break;
          
        case 'analytics':
          try {
            const [flowUsage, storageUsage, timeRange] = await Promise.all([
              apiClient.getFlowUsageAnalytics(),
              apiClient.getStorageUsageAnalytics(),
              apiClient.getTimeRangeAnalytics()
            ]);
            setWorkflowData(prev => ({ 
              ...prev, 
              analytics: { flowUsage, storageUsage, timeRange }
            }));
          } catch (analyticsError) {
            console.warn('Analytics endpoints not available:', analyticsError);
            setWorkflowData(prev => ({ 
              ...prev, 
              analytics: { 
                flowUsage: { message: 'Analytics endpoint not available' },
                storageUsage: { message: 'Analytics endpoint not available' },
                timeRange: { message: 'Analytics endpoint not available' }
              }
            }));
          }
          break;
          
        case 'webhooks':
          try {
            const webhooksResponse = await apiClient.getWebhooks();
            setWorkflowData(prev => ({ ...prev, webhooks: webhooksResponse.data }));
          } catch (webhookError) {
            console.warn('Webhooks endpoint not available:', webhookError);
            setWorkflowData(prev => ({ ...prev, webhooks: [] }));
          }
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-load data when step changes
  useEffect(() => {
    if (currentStep < workflowSteps.length) {
      const currentStepData = workflowSteps[currentStep];
      if (currentStepData) {
        loadStepData(currentStepData.id);
      }
    }
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep < workflowSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const renderStepContent = () => {
    const currentStepData = workflowSteps[currentStep];
    if (!currentStepData) return null;
    
    switch (currentStepData.id) {
      case 'health':
        return (
          <Card>
            <Stack>
              <Group>
                <ThemeIcon color="green" size="lg">
                  <IconShield size={20} />
                </ThemeIcon>
                <div>
                  <Title order={4}>System Health Status</Title>
                  <Text size="sm" c="dimmed">API connectivity and system metrics</Text>
                </div>
              </Group>
              
              {loading ? (
                <Center py="xl">
                  <Loader size="md" />
                </Center>
              ) : workflowData.health ? (
                <Stack>
                  <Alert icon={<IconCheck size={16} />} color="green" title="API Connected">
                    TAMS API is responding successfully
                  </Alert>
                  <SimpleGrid cols={2} spacing="md">
                    <Paper p="md" withBorder>
                      <Text size="sm" fw={500}>Status</Text>
                      <Text size="lg" c="green">Healthy</Text>
                    </Paper>
                    <Paper p="md" withBorder>
                      <Text size="sm" fw={500}>Version</Text>
                      <Text size="lg">{workflowData.health.version || 'TAMS v6.0'}</Text>
                    </Paper>
                  </SimpleGrid>
                </Stack>
              ) : error ? (
                <Alert icon={<IconAlertCircle size={16} />} color="red" title="Connection Error">
                  {error}
                </Alert>
              ) : null}
            </Stack>
          </Card>
        );

      case 'sources':
        return (
          <Card>
            <Stack>
              <Group>
                <ThemeIcon color="blue" size="lg">
                  <IconBroadcast size={20} />
                </ThemeIcon>
                <div>
                  <Title order={4}>Media Sources</Title>
                  <Text size="sm" c="dimmed">TAMS v6.0 compliant source management</Text>
                </div>
              </Group>
              
              {loading ? (
                <Center py="xl">
                  <Loader size="md" />
                </Center>
              ) : (
                <Stack>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      {workflowData.sources.length} sources available
                    </Text>
                    <Button size="xs" variant="light">
                      Create Source
                    </Button>
                  </Group>
                  
                  {workflowData.sources.length > 0 ? (
                    <SimpleGrid cols={1} spacing="sm">
                      {workflowData.sources.slice(0, 3).map((source: any) => (
                        <Paper key={source.id} p="sm" withBorder>
                          <Group justify="space-between">
                            <div>
                              <Text fw={500}>{source.label || source.id}</Text>
                              <Text size="xs" c="dimmed">
                                Format: {source.format || 'Unknown'} | 
                                Created: {new Date(source.created).toLocaleDateString()}
                              </Text>
                            </div>
                            <Badge color="blue" size="sm">
                              Active
                            </Badge>
                          </Group>
                        </Paper>
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Alert color="blue" title="No Sources Found">
                      Create your first media source to get started with TAMS
                    </Alert>
                  )}
                </Stack>
              )}
            </Stack>
          </Card>
        );

      case 'flows':
        return (
          <Card>
            <Stack>
              <Group>
                <ThemeIcon color="purple" size="lg">
                  <IconVideo size={20} />
                </ThemeIcon>
                <div>
                  <Title order={4}>Media Flows</Title>
                  <Text size="sm" c="dimmed">Processing flows with advanced TAMS features</Text>
                </div>
              </Group>
              
              {loading ? (
                <Center py="xl">
                  <Loader size="md" />
                </Center>
              ) : (
                <Stack>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      {workflowData.flows.length} flows available
                    </Text>
                    <Button size="xs" variant="light">
                      Create Flow
                    </Button>
                  </Group>
                  
                  {workflowData.flows.length > 0 ? (
                    <SimpleGrid cols={1} spacing="sm">
                      {workflowData.flows.slice(0, 3).map((flow: any) => (
                        <Paper key={flow.id} p="sm" withBorder>
                          <Group justify="space-between">
                            <div>
                              <Text fw={500}>{flow.label || flow.id}</Text>
                              <Text size="xs" c="dimmed">
                                Source: {flow.source_id} | 
                                Codec: {flow.codec || 'Unknown'}
                              </Text>
                            </div>
                            <Group gap="xs">
                              <Badge color="purple" size="sm">
                                Processing
                              </Badge>
                              <ActionIcon size="sm" variant="light">
                                <IconPlayerPlay size={14} />
                              </ActionIcon>
                            </Group>
                          </Group>
                        </Paper>
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Alert color="purple" title="No Flows Found">
                      Create flows to process your media sources
                    </Alert>
                  )}
                </Stack>
              )}
            </Stack>
          </Card>
        );

      case 'segments':
        return (
          <Card>
            <Stack>
              <Group>
                <ThemeIcon color="orange" size="lg">
                  <IconTimeline size={20} />
                </ThemeIcon>
                <div>
                  <Title order={4}>Time-Addressable Segments</Title>
                  <Text size="sm" c="dimmed">Media segments with dual URL support (GET/HEAD)</Text>
                </div>
              </Group>
              
              {loading ? (
                <Center py="xl">
                  <Loader size="md" />
                </Center>
              ) : (
                <Stack>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      {workflowData.segments.length} segments available
                    </Text>
                    <Button size="xs" variant="light">
                      Upload Segment
                    </Button>
                  </Group>
                  
                  {workflowData.segments.length > 0 ? (
                    <SimpleGrid cols={1} spacing="sm">
                      {workflowData.segments.slice(0, 3).map((segment: any) => (
                        <Paper key={segment.id} p="sm" withBorder>
                          <Group justify="space-between">
                            <div>
                              <Text fw={500}>Segment {segment.id}</Text>
                              <Text size="xs" c="dimmed">
                                Time Range: {segment.timerange} | 
                                Format: {segment.format || 'Unknown'}
                              </Text>
                              {segment.get_urls && segment.get_urls.length > 0 && (
                                <Group gap="xs" mt="xs">
                                  {segment.get_urls.map((url: any, index: number) => (
                                    <Badge 
                                      key={index} 
                                      size="xs" 
                                      color={url.label.includes('GET') ? 'green' : 'blue'}
                                    >
                                      {url.label.includes('GET') ? 'GET' : 'HEAD'}
                                    </Badge>
                                  ))}
                                </Group>
                              )}
                            </div>
                            <Group gap="xs">
                              <ActionIcon size="sm" variant="light">
                                <IconPlayerPlay size={14} />
                              </ActionIcon>
                              <ActionIcon size="sm" variant="light">
                                <IconDownload size={14} />
                              </ActionIcon>
                            </Group>
                          </Group>
                        </Paper>
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Alert color="orange" title="No Segments Found">
                      Upload segments to your flows to enable time-addressable media access
                    </Alert>
                  )}
                </Stack>
              )}
            </Stack>
          </Card>
        );

      case 'analytics':
        return (
          <Card>
            <Stack>
              <Group>
                <ThemeIcon color="teal" size="lg">
                  <IconActivity size={20} />
                </ThemeIcon>
                <div>
                  <Title order={4}>Analytics & Monitoring</Title>
                  <Text size="sm" c="dimmed">Real-time usage analytics and performance metrics</Text>
                </div>
              </Group>
              
              {loading ? (
                <Center py="xl">
                  <Loader size="md" />
                </Center>
              ) : workflowData.analytics ? (
                <Stack>
                  <SimpleGrid cols={3} spacing="md">
                    <Paper p="md" withBorder>
                      <Text size="sm" fw={500}>Flow Usage</Text>
                      <Text size="lg" c="teal">
                        {workflowData.analytics.flowUsage?.total_flows || 'N/A'}
                      </Text>
                      <Text size="xs" c="dimmed">Active Flows</Text>
                    </Paper>
                    <Paper p="md" withBorder>
                      <Text size="sm" fw={500}>Storage Usage</Text>
                      <Text size="lg" c="teal">
                        {workflowData.analytics.storageUsage?.total_size || 'N/A'}
                      </Text>
                      <Text size="xs" c="dimmed">Total Storage</Text>
                    </Paper>
                    <Paper p="md" withBorder>
                      <Text size="sm" fw={500}>Time Range</Text>
                      <Text size="lg" c="teal">
                        {workflowData.analytics.timeRange?.coverage || 'N/A'}
                      </Text>
                      <Text size="xs" c="dimmed">Coverage</Text>
                    </Paper>
                  </SimpleGrid>
                  
                  {workflowData.analytics.flowUsage?.message && (
                    <Alert color="yellow" title="Analytics Note">
                      {workflowData.analytics.flowUsage.message}
                    </Alert>
                  )}
                </Stack>
              ) : null}
            </Stack>
          </Card>
        );

      case 'webhooks':
        return (
          <Card>
            <Stack>
              <Group>
                <ThemeIcon color="red" size="lg">
                  <IconWebhook size={20} />
                </ThemeIcon>
                <div>
                  <Title order={4}>Event Webhooks</Title>
                  <Text size="sm" c="dimmed">Real-time event notifications and automation</Text>
                </div>
              </Group>
              
              {loading ? (
                <Center py="xl">
                  <Loader size="md" />
                </Center>
              ) : (
                <Stack>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      {workflowData.webhooks.length} webhooks configured
                    </Text>
                    <Button size="xs" variant="light">
                      Create Webhook
                    </Button>
                  </Group>
                  
                  {workflowData.webhooks.length > 0 ? (
                    <SimpleGrid cols={1} spacing="sm">
                      {workflowData.webhooks.slice(0, 3).map((webhook: any) => (
                        <Paper key={webhook.id} p="sm" withBorder>
                          <Group justify="space-between">
                            <div>
                              <Text fw={500}>Webhook {webhook.id}</Text>
                              <Text size="xs" c="dimmed">
                                URL: {webhook.url} | 
                                Events: {webhook.events?.length || 0}
                              </Text>
                            </div>
                            <Badge color="red" size="sm">
                              Active
                            </Badge>
                          </Group>
                        </Paper>
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Alert color="red" title="No Webhooks Configured">
                      Set up webhooks to receive real-time event notifications
                    </Alert>
                  )}
                </Stack>
              )}
            </Stack>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Title order={1} mb="sm">
            TAMS Workflow Demo (Monks + VAST)
          </Title>
          <Text size="lg" c="dimmed" mb="md">
            Interactive demonstration of Time Addressable Media Store API using VAST data storage.
          </Text>
          
          {/* Progress indicator */}
          <Progress 
            value={(currentStep + 1) / workflowSteps.length * 100} 
            size="sm" 
            mb="md"
          />
        </div>

        {/* Workflow Steps Navigation */}
        <Card>
          <Stack>
            <Title order={3}>Workflow Steps</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {workflowSteps.map((step, index) => (
                <Paper
                  key={step.id}
                  p="md"
                  withBorder
                  style={{
                    cursor: 'pointer',
                    borderColor: currentStep === index ? step.color : undefined,
                    backgroundColor: currentStep === index ? `var(--mantine-color-${step.color}-0)` : undefined
                  }}
                  onClick={() => goToStep(index)}
                >
                  <Group>
                    <ThemeIcon color={step.color} size="lg">
                      {step.icon}
                    </ThemeIcon>
                    <div style={{ flex: 1 }}>
                      <Text fw={500} size="sm">
                        {index + 1}. {step.title}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {step.description}
                      </Text>
                    </div>
                    {currentStep === index && (
                      <Badge color={step.color} size="sm">
                        Current
                      </Badge>
                    )}
                  </Group>
                </Paper>
              ))}
            </SimpleGrid>
          </Stack>
        </Card>

        {/* Current Step Content */}
        {renderStepContent()}

        {/* Navigation Controls */}
        <Group justify="space-between">
          <Button
            variant="light"
            leftSection={<IconArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />}
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          <Group>
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={() => {
                const currentStepData = workflowSteps[currentStep];
                if (currentStepData) {
                  loadStepData(currentStepData.id);
                }
              }}
              loading={loading}
            >
              Refresh
            </Button>
            
            <Button
              rightSection={<IconArrowRight size={16} />}
              onClick={nextStep}
              disabled={currentStep === workflowSteps.length - 1}
            >
              Next
            </Button>
          </Group>
        </Group>

        {/* API Endpoint Information */}
        <Card>
          <Stack>
            <Title order={4}>Current API Endpoint</Title>
            <Group>
              <Badge color={workflowSteps[currentStep]?.color || 'gray'} size="lg">
                {workflowSteps[currentStep]?.endpoint || 'Unknown'}
              </Badge>
              <Text size="sm" c="dimmed">
                TAMS v6.0 Compliant
              </Text>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
