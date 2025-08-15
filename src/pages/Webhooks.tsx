import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Text,
  Paper,
  Card,
  Group,
  Badge,
  Alert,
  Divider,
  Title
} from '@mantine/core';
import { IconWebhook, IconCalendarEvent, IconBell, IconInfoCircle } from '@tabler/icons-react';
import { WebhookManagerMantine } from '../components/WebhookManagerMantine';
import { EventHistoryMantine } from '../components/EventHistoryMantine';
import { NotificationCenterMantine } from '../components/NotificationCenterMantine';

interface TabPanelProps {
  children?: React.ReactNode;
  index: string;
  value: string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`webhook-tabpanel-${index}`}
      aria-labelledby={`webhook-tab-${index}`}
      {...other}
    >
      {value !== index ? null : (
        <Box py="md">
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `webhook-tab-${index}`,
    'aria-controls': `webhook-tabpanel-${index}`,
  };
}

export const Webhooks: React.FC = () => {
  const [tabValue, setTabValue] = useState('webhooks');

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  const handleWebhookUpdate = (webhook: any) => {
    console.log('Webhook updated:', webhook);
    // TODO: Handle webhook updates
  };

  const handleWebhookDelete = (webhookId: string) => {
    console.log('Webhook deleted:', webhookId);
    // TODO: Handle webhook deletion
  };

  const handleEventSelect = (event: any) => {
    console.log('Event selected:', event);
    // TODO: Handle event selection
  };

  const handleNotificationAction = (notification: any, action: string) => {
    console.log('Notification action:', { notification, action });
    // TODO: Handle notification actions
  };

  return (
    <Box>
      {/* Page Header */}
      <Box mb="md">
        <Title order={1} mb="xs" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <IconWebhook size="1.2em" color="var(--mantine-color-blue-6)" />
          BBC TAMS Event System
        </Title>
        <Text size="lg" c="dimmed" mb="xs">
          Phase 3: Webhook Management, Event History & Real-time Notifications
        </Text>
        <Text c="dimmed">
          Manage webhook configurations, monitor event history, and receive real-time notifications for BBC TAMS events.
        </Text>
      </Box>

      {/* Main Content */}
      <Paper shadow="xs" p="md">
        <Tabs value={tabValue} onChange={(value) => setTabValue(value || 'webhooks')}>
          <Tabs.List>
            <Tabs.Tab value="webhooks" leftSection={<IconWebhook size="1rem" />}>
              Webhook Management
            </Tabs.Tab>
            <Tabs.Tab value="events" leftSection={<IconCalendarEvent size="1rem" />}>
              Event History
            </Tabs.Tab>
            <Tabs.Tab value="notifications" leftSection={<IconBell size="1rem" />}>
              Notifications
            </Tabs.Tab>
            <Tabs.Tab value="info" leftSection={<IconInfoCircle size="1rem" />}>
              System Info
            </Tabs.Tab>
          </Tabs.List>

          <TabPanel value={tabValue} index="webhooks">
            <WebhookManagerMantine
              onWebhookUpdate={handleWebhookUpdate}
              onWebhookDelete={handleWebhookDelete}
            />
          </TabPanel>

          <TabPanel value={tabValue} index="events">
            <EventHistoryMantine
              onEventSelect={handleEventSelect}
              refreshInterval={30}
            />
          </TabPanel>

          <TabPanel value={tabValue} index="notifications">
            <NotificationCenterMantine
              onNotificationAction={handleNotificationAction}
              refreshInterval={15}
            />
          </TabPanel>

          <TabPanel value={tabValue} index="info">
            <Card>
              <Card.Section p="md">
                <Title order={3} mb="md">System Information</Title>
                <Group gap="md">
                  <Badge color="green" variant="light">System Status: Operational</Badge>
                  <Badge color="blue" variant="light">Version: 1.0.0</Badge>
                  <Badge color="orange" variant="light">Last Updated: {new Date().toLocaleString()}</Badge>
                </Group>
              </Card.Section>
              <Card.Section p="md">
                <Alert icon={<IconInfoCircle size="1rem" />} title="BBC TAMS Event System" color="blue">
                  This system provides comprehensive webhook management, event monitoring, and real-time notifications for the BBC TAMS platform.
                </Alert>
              </Card.Section>
            </Card>
          </TabPanel>
        </Tabs>
      </Paper>
    </Box>
  );
};
