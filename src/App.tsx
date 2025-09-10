import { MantineProvider, AppShell, Anchor, Box, createTheme, rem, Text, Group } from '@mantine/core';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Flows from './pages/Flows';
import FlowDetails from './pages/FlowDetails';
import Sources from './pages/Sources';
import SourceDetails from './pages/SourceDetails';
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

// Main navigation items
const mainNavLinks = [
  { label: 'Home', to: '/' },
  { label: 'Sources', to: '/sources' },
  { label: 'Flows', to: '/flows' },
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
      © 2025 Local TAMS Explorer
    </footer>
  );
}

function AppLayout() {
  const location = useLocation();

  return (
    <AppShell padding="md">
      <AppShell.Header h={60} p="md" withBorder={false} style={{ position: 'static' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {/* Left: Title */}
          <Text size="lg" fw={700} c="blue">TAMS Explorer</Text>
          
          {/* Center: Main Navigation */}
          <div style={{ display: 'flex', gap: 20, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
          </div>
          
          {/* Right: API Status */}
          <Text size="sm" c="dimmed">API: localhost:3000</Text>
        </div>
      </AppShell.Header>
      
      <AppShell.Main m="xl">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/source-details/:sourceId" element={<SourceDetails />} />
          <Route path="/flows" element={<Flows />} />
          <Route path="/flow-details/:flowId" element={<FlowDetails />} />
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