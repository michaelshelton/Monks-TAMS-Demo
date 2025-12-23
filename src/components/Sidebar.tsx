import React from 'react';
import { AppShell, NavLink, Stack, Group, Text, Box, Divider } from '@mantine/core';
import { useLocation, Link } from 'react-router-dom';
import { 
  IconHome, 
  IconVideo, 
  IconPlayerPlay, 
  IconContainer,
  IconSearch,
  IconChartBar,
  IconActivity,
  IconSettings,
  IconPlugConnected,
  IconTrash,
  IconRoute
} from '@tabler/icons-react';

interface SidebarProps {
  opened?: boolean;
}

export function Sidebar({ opened = true }: SidebarProps) {
  const location = useLocation();

  // Primary navigation – core entities
  const primaryNavItems = [
    {
      label: 'Sources',
      to: '/sources',
      icon: IconVideo,
    },
    {
      label: 'Flows',
      to: '/flows',
      icon: IconPlayerPlay,
    },
  ];

  // Dedicated search entry
  const searchNavItem = {
    label: 'Search',
    to: '/search',
    icon: IconSearch,
  };

  // Observability and statistics
  const featureNavItems = [
    {
      label: 'Observability',
      to: '/observability',
      icon: IconActivity,
    },
    {
      label: 'Statistics',
      to: '/qc-statistics',
      icon: IconChartBar,
    },
  ];

  // Other navigation links
  const otherNavItems = [
    {
      label: 'Service',
      to: '/service',
      icon: IconSettings,
    },
    {
      label: 'Webhooks',
      to: '/webhooks',
      icon: IconPlugConnected,
    },
    {
      label: 'Deletion Requests',
      to: '/deletion-requests',
      icon: IconTrash,
    },
  ];

  return (
    <AppShell.Navbar
      p={8}
      style={{
        backgroundColor: '#0f0f0f',
        borderRight: '1px solid #333333',
      }}
    >
      <Stack gap="md">
        {/* LiveVision Logo */}
        <Box style={{ paddingBottom: '4px' }}>
          <Link to="/" style={{ display: 'inline-block' }}>
            <img 
              src="/images/live.vision-logo-light.png" 
              alt="LiveVision" 
              style={{
                height: 'auto',
                maxWidth: '180px',
                width: '100%',
                objectFit: 'contain'
              }}
            />
          </Link>
        </Box>

        {/* Primary Navigation: Sources, Flows */}
        <Stack gap={2}>
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || 
              (item.to === '/' && location.pathname === '/') ||
              (item.to !== '/' && location.pathname.startsWith(item.to));

            return (
              <NavLink
                key={item.to}
                component={Link}
                to={item.to}
                label={item.label}
                leftSection={<Icon size={20} />}
                active={isActive}
                style={{
                  borderRadius: '6px',
                  color: isActive ? '#ffffff' : '#b3b3b3',
                  backgroundColor: isActive ? '#262626' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                }}
                styles={{
                  root: {
                    '&:hover': {
                      backgroundColor: '#262626',
                    },
                  },
                  label: {
                    fontSize: '14px',
                  },
                }}
              />
            );
          })}
        </Stack>

        {/* Separator before Search */}
        <Divider my={2} color="#333333" />

        {/* Search */}
        <Stack gap={2}>
          {(() => {
            const Icon = searchNavItem.icon;
            const isActive = location.pathname === searchNavItem.to || 
              (searchNavItem.to !== '/' && location.pathname.startsWith(searchNavItem.to));

            return (
              <NavLink
                key={searchNavItem.to}
                component={Link}
                to={searchNavItem.to}
                label={searchNavItem.label}
                leftSection={<Icon size={20} />}
                active={isActive}
                style={{
                  borderRadius: '6px',
                  color: isActive ? '#ffffff' : '#b3b3b3',
                  backgroundColor: isActive ? '#262626' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                }}
                styles={{
                  root: {
                    '&:hover': {
                      backgroundColor: '#262626',
                    },
                  },
                  label: {
                    fontSize: '14px',
                  },
                }}
              />
            );
          })()}
        </Stack>

        {/* Separator before Observability / Statistics */}
        <Divider my={2} color="#333333" />

        {/* Observability & Statistics */}
        <Stack gap={2}>
          {featureNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || 
              (item.to === '/' && location.pathname === '/') ||
              (item.to !== '/' && location.pathname.startsWith(item.to));

            return (
              <NavLink
                key={item.to}
                component={Link}
                to={item.to}
                label={item.label}
                leftSection={<Icon size={20} />}
                active={isActive}
                style={{
                  borderRadius: '6px',
                  color: isActive ? '#ffffff' : '#b3b3b3',
                  backgroundColor: isActive ? '#262626' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                }}
                styles={{
                  root: {
                    '&:hover': {
                      backgroundColor: '#262626',
                    },
                  },
                  label: {
                    fontSize: '14px',
                  },
                }}
              />
            );
          })}
        </Stack>

        {/* Separator before remaining links */}
        <Divider my="sm" color="#333333" />

        {/* Other Navigation */}
        <Stack gap={2}>
          <Text size="xs" c="#666666" px={4} mb={2}>
            Other
          </Text>
          {otherNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || 
              (item.to === '/' && location.pathname === '/') ||
              (item.to !== '/' && location.pathname.startsWith(item.to));

            return (
              <NavLink
                key={item.to}
                component={Link}
                to={item.to}
                label={item.label}
                leftSection={<Icon size={20} />}
                active={isActive}
                style={{
                  borderRadius: '6px',
                  color: isActive ? '#ffffff' : '#b3b3b3',
                  backgroundColor: isActive ? '#262626' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                }}
                styles={{
                  root: {
                    '&:hover': {
                      backgroundColor: '#262626',
                    },
                  },
                  label: {
                    fontSize: '14px',
                  },
                }}
              />
            );
          })}
        </Stack>
      </Stack>
    </AppShell.Navbar>
  );
}

