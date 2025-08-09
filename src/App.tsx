import { MantineProvider, AppShell, Anchor, createTheme, rem } from '@mantine/core';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Flows from './pages/Flows';
import FlowDetails from './pages/FlowDetails';
import Sources from './pages/Sources';
import Objects from './pages/Objects';
import Segments from './pages/Segments';
import Analytics from './pages/Analytics';
import Service from './pages/Service';
import Search from './pages/Search';
import Upload from './pages/Upload';
import VideoCompilation from './pages/VideoCompilation';

const theme = createTheme({
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  primaryColor: 'blue',
  defaultRadius: 'md',
});

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Sources', to: '/sources' },
  { label: 'Flows', to: '/flows' },
  { label: 'Segments', to: '/segments' },
  { label: 'Objects', to: '/objects' },
  { label: 'Analytics', to: '/analytics' },
  { label: 'Search', to: '/search' },
  { label: 'Upload', to: '/upload' },
  { label: 'Video Compilation', to: '/video-compilation' },
  { label: 'Admin', to: '/service' },
];

function AppFooter() {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '20px 0',
      fontSize: rem(14),
    }}>
      © 2025 Monks + VAST TAMS Demo
    </footer>
  );
}

function AppLayout() {
  const location = useLocation();
  return (
    <AppShell padding="md">
      <AppShell.Header h={60} p="md">
        {/* Center: Navigation */}
        <div style={{ display: 'flex', gap: 20, flex: 1, justifyContent: 'center' }}>
          {navLinks.map((link) => (
            <Anchor
              key={link.to}
              component={Link}
              to={link.to}
              fw={500}
              size="md"
              c={location.pathname === link.to ? 'blue' : 'gray'}
            >
              {link.label}
            </Anchor>
          ))}
        </div>
        {/* Right: Empty for now (future user/profile/actions) */}
        <div style={{ width: 40 }} />
      </AppShell.Header>
      <AppShell.Main m="xl">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/flows" element={<Flows />} />
          <Route path="/flow-details/:flowId" element={<FlowDetails />} />
          <Route path="/objects" element={<Objects />} />
          <Route path="/segments" element={<Segments />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/service" element={<Service />} />
          <Route path="/search" element={<Search />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/video-compilation" element={<VideoCompilation />} />
        </Routes>
      </AppShell.Main>
      <AppShell.Footer h={64}>
        <AppFooter />
      </AppShell.Footer>
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