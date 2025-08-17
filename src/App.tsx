import { MantineProvider, AppShell, Anchor, Box, createTheme, rem, Text } from '@mantine/core';
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
import BBCDemo from './pages/BBCDemo';
import { Webhooks } from './pages/Webhooks';
import { HealthStatusIndicator } from './components/HealthStatusIndicator';

const theme = createTheme({
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  primaryColor: 'blue',
  defaultRadius: 'md',
});

const navLinks = [
  // Content Management (BBC TAMS Core)
  { label: 'Sources', to: '/sources', group: 'content' },
  { label: 'Flows', to: '/flows', group: 'content' },
  { label: 'Upload', to: '/upload', group: 'content' },
  
  // Discovery & Search (VAST TAMS Extensions)
  { label: 'Search', to: '/search', group: 'discovery' },
  { label: 'Video Compilation', to: '/video-compilation', group: 'discovery' },
  
  // System & Monitoring (Mixed BBC TAMS + Extensions)
  { label: 'Service', to: '/service', group: 'system' },
  { label: 'Webhooks', to: '/webhooks', group: 'system' },
  { label: 'Analytics', to: '/analytics', group: 'system' },
  { label: 'Observability', to: '/observability', group: 'system' },
  
  // Administration (BBC TAMS Core + Demo)
  { label: 'Deletion Requests', to: '/deletion-requests', group: 'admin' },
  { label: 'BBC TAMS Demo', to: '/bbc-demo', group: 'admin' },
];

function AppFooter() {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '8px 0',
      fontSize: rem(12),
      opacity: 0.7,
      transition: 'opacity 0.2s ease',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.opacity = '1';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.opacity = '0.7';
    }}
    title="Click to toggle footer visibility"
    onClick={(e) => {
      const footer = e.currentTarget;
      if (footer.style.display === 'none') {
        footer.style.display = 'block';
        footer.style.opacity = '0.7';
      } else {
        footer.style.display = 'none';
      }
    }}
    >
      © 2025 Monks + VAST TAMS Demo
    </footer>
  );
}

function AppLayout() {
  const location = useLocation();
  
  // Group navigation links by their group
  const groupedNavLinks = navLinks.reduce((groups, link) => {
    const group = link.group || 'other';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(link);
    return groups;
  }, {} as Record<string, typeof navLinks>);

  return (
    <AppShell padding="md">
      <AppShell.Header h={60} p="md" withBorder={false} style={{ position: 'static' }}>
        {/* Center: Grouped Navigation */}
        <div style={{ display: 'flex', gap: 20, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {Object.entries(groupedNavLinks).map(([groupKey, groupLinks], groupIndex) => (
            <div key={groupKey} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Group Links */}
              {groupLinks.map((link) => (
                <Anchor
                  key={link.to}
                  component={Link}
                  to={link.to}
                  fw={500}
                  size="sm"
                  c={location.pathname === link.to ? 'blue' : 'gray'}
                  style={{ 
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                    ...(location.pathname === link.to && {
                      backgroundColor: 'var(--mantine-color-blue-0)',
                      color: 'var(--mantine-color-blue-7)'
                    })
                  }}
                >
                  {link.label}
                </Anchor>
              ))}
              
              {/* Group Separator (except for last group) */}
              {groupIndex < Object.keys(groupedNavLinks).length - 1 && (
                <div style={{ 
                  width: 1, 
                  height: 24, 
                  backgroundColor: 'var(--mantine-color-gray-3)',
                  margin: '0 8px'
                }} />
              )}
            </div>
          ))}
        </div>
        
        {/* Right: Health Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <HealthStatusIndicator showDetails={false} refreshInterval={7200000} />
        </div>
      </AppShell.Header>
      
      <AppShell.Main m="xl">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/source-details/:sourceId" element={<SourceDetails />} />
          <Route path="/flows" element={<Flows />} />
          <Route path="/flow-details/:flowId" element={<FlowDetails />} />
          <Route path="/search" element={<Search />} />
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/video-compilation" element={<VideoCompilation />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/observability" element={<Observability />} />
          <Route path="/service" element={<Service />} />
          <Route path="/webhooks" element={<Webhooks />} />
          <Route path="/deletion-requests" element={<DeletionRequests />} />
          <Route path="/bbc-demo" element={<BBCDemo />} />
        </Routes>
        
        {/* Footer at bottom of content */}
        <Box mt="xl" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <AppFooter />
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}

export default function App() {
  return (
    <MantineProvider theme={theme} withCssVariables>
      <Router>
        <AppLayout />
      </Router>
    </MantineProvider>
  );
} 