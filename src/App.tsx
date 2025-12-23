import { MantineProvider, AppShell, createTheme } from '@mantine/core';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Flows from './pages/Flows';
import FlowDetails from './pages/FlowDetails';
import Sources from './pages/Sources';
import SourceDetails from './pages/SourceDetails';
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
import Objects from './pages/Objects';
import QCStatistics from './pages/QCStatistics';
import { BackendProvider } from './contexts/BackendContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Sidebar } from './components/Sidebar';
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


function AppLayout() {
  return (
    <AppShell
      padding={0}
      navbar={{
        width: 240,
        breakpoint: 'sm',
      }}
      style={{
        backgroundColor: '#0f0f0f',
      }}
    >
      <Sidebar />
      
      <AppShell.Main 
        style={{ 
          padding: 0, 
          margin: 0,
          backgroundColor: '#0f0f0f',
          minHeight: '100vh',
          borderLeft: '1px solid #333333',
        }}
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/sources" element={<Sources key="sources" />} />
          <Route path="/source-details/:sourceId" element={<SourceDetails />} />
          <Route path="/flows" element={<Flows />} />
          <Route path="/flow-details/:flowId" element={<FlowDetails />} />
          <Route path="/search" element={<Search />} />
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/video-compilation" element={<VideoCompilation />} />
          <Route path="/observability" element={<Observability />} />
          <Route path="/service" element={<Service />} />
          <Route path="/webhooks" element={<Webhooks />} />
          <Route path="/deletion-requests" element={<DeletionRequests />} />
          <Route path="/hls-test" element={<HLSTestPage />} />
          <Route path="/objects" element={<Objects />} />
          <Route path="/qc-statistics" element={<QCStatistics />} />
          
          <Route path="/vast-tams-workflow" element={<VastTamsWorkflow />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

function AppContent() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark" withCssVariables>
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