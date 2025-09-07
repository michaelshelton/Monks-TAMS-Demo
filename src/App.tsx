import { MantineProvider, AppShell, Anchor, Box, createTheme, rem, Text, Menu, Button, Group } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Flows from './pages/Flows';
import FlowDetails from './pages/FlowDetails';
import Sources from './pages/Sources';
import SourceDetails from './pages/SourceDetails';
import Analytics from './pages/Analytics';
import Service from './pages/Service';
import Search from './pages/Search';
import SearchResults from './pages/SearchResults';
import Upload from './pages/Upload';
import VideoCompilation from './pages/VideoCompilation';
import Observability from './pages/Observability';
import DeletionRequests from './pages/DeletionRequests';
import HLSTestPage from './pages/HLSTestPage';
import VastTamsWorkflow from './pages/VastTamsWorkflow';
import { Webhooks } from './pages/Webhooks';
import FlowCollections from './pages/FlowCollections';
import { BackendProvider } from './contexts/BackendContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import './styles/dark-mode-fixed.css';

const theme = createTheme({
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  primaryColor: 'blue',
  defaultRadius: 'md',
  colors: {
    dark: [
      '#0f0f0f', // dark-0 - Deepest background
      '#1a1a1a', // dark-1 - Primary surface
      '#262626', // dark-2 - Secondary surface (navbar)
      '#333333', // dark-3 - Tertiary surface
      '#404040', // dark-4 - Quaternary surface
      '#4d4d4d', // dark-5 - Elevated surface
      '#666666', // dark-6 - Text tertiary
      '#808080', // dark-7 - Text quaternary
      '#b3b3b3', // dark-8 - Text secondary
      '#e5e5e5', // dark-9 - Text primary
    ],
  },
  primaryShade: { light: 6, dark: 4 },
  defaultGradient: {
    from: 'blue',
    to: 'cyan',
    deg: 45,
  },
});

// Main navigation items (always visible)
const mainNavLinks = [
  { label: 'Search', to: '/search' },
  { label: 'Sources', to: '/sources' },
  { label: 'Flows', to: '/flows' },
  { label: 'Flow Collections', to: '/flow-collections' },
];

// Additional navigation items (in dropdown)
const additionalNavLinks = [
  { label: 'Home', to: '/' },
  { label: 'TAMS Workflow', to: '/vast-tams-workflow' },
  { label: 'Service', to: '/service' },
  { label: 'Webhooks', to: '/webhooks' },
  { label: 'Analytics', to: '/analytics' },
  { label: 'Observability', to: '/observability' },
  { label: 'Deletion Requests', to: '/deletion-requests' },
];

function AppFooter() {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '8px 0',
      fontSize: rem(12),
      opacity: 0.7,
      transition: 'opacity 0.2s ease',
    }}
    >
      © 2025 Monks + VAST TAMS Demo
    </footer>
  );
}

function AppLayout() {
  const location = useLocation();

  return (
    <AppShell padding="md">
      <AppShell.Header h={60} p="md" withBorder={false} style={{ position: 'static' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {/* Left: Theme Toggle */}
          <ThemeToggle />
          
          {/* Center: Main Navigation + Dropdown */}
          <div style={{ display: 'flex', gap: 20, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {/* Main Navigation Links */}
            <Group gap="sm">
              {mainNavLinks.map((link) => (
                <Anchor
                  key={link.to}
                  component={Link}
                  to={link.to}
                  fw={500}
                  size="sm"
                  c={location.pathname === link.to ? 'blue' : 'gray'}
                  className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
                  style={{ 
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                    color: location.pathname === link.to 
                      ? 'var(--mantine-color-blue-6)' 
                      : 'var(--mantine-color-gray-6)',
                    ...(location.pathname === link.to && {
                      backgroundColor: 'var(--mantine-color-blue-0)',
                      color: 'var(--mantine-color-blue-7)'
                    })
                  }}
                >
                  {link.label}
                </Anchor>
              ))}
            </Group>
            
            {/* Separator */}
            <div className="nav-separator" style={{ 
              width: 1, 
              height: 24, 
              backgroundColor: 'var(--mantine-color-gray-3)',
              margin: '0 8px'
            }} />
            
            {/* Additional Navigation Dropdown */}
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button
                  variant="subtle"
                  rightSection={<IconChevronDown size={14} />}
                  size="sm"
                  fw={500}
                  c="gray"
                  className="nav-link"
                  style={{ 
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                    color: 'var(--mantine-color-gray-6)',
                  }}
                >
                  More
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {additionalNavLinks.map((link) => (
                  <Menu.Item
                    key={link.to}
                    component={Link}
                    to={link.to}
                    style={{
                      color: location.pathname === link.to ? 'var(--mantine-color-blue-7)' : 'var(--mantine-color-gray-7)',
                      fontWeight: location.pathname === link.to ? 600 : 400,
                    }}
                  >
                    {link.label}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          </div>
          
          {/* Right: Empty space for balance */}
          <div style={{ width: '120px' }} />
        </div>
        
      </AppShell.Header>
      
      <AppShell.Main m="xl">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/source-details/:sourceId" element={<SourceDetails />} />
          <Route path="/flows" element={<Flows />} />
          <Route path="/flow-details/:flowId" element={<FlowDetails />} />
          <Route path="/flow-collections" element={<FlowCollections />} />
          <Route path="/search" element={<Search />} />
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/video-compilation" element={<VideoCompilation />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/observability" element={<Observability />} />
          <Route path="/service" element={<Service />} />
          <Route path="/webhooks" element={<Webhooks />} />
          <Route path="/deletion-requests" element={<DeletionRequests />} />
          <Route path="/hls-test" element={<HLSTestPage />} />
          
          <Route path="/vast-tams-workflow" element={<VastTamsWorkflow />} />
        </Routes>
        
        {/* Footer at bottom of content */}
        <Box mt="xl" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <AppFooter />
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}

function AppContent() {
  const { colorScheme } = useTheme();
  
  return (
    <MantineProvider theme={theme} withCssVariables>
      <BackendProvider>
        <Router>
          <AppLayout />
        </Router>
      </BackendProvider>
    </MantineProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
} 