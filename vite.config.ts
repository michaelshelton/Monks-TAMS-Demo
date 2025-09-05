import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Get backend configuration from environment
const getBackendTarget = () => {
  const defaultBackend = process.env.VITE_DEFAULT_BACKEND || 'vast-tams';
  
  switch (defaultBackend) {
    case 'ibc-thiago':
      return process.env.VITE_BACKEND_IBC_THIAGO_URL || 'http://localhost:3000';
    case 'ibc-thiago-imported':
      return process.env.VITE_BACKEND_IBC_THIAGO_IMPORTED_URL || 'http://localhost:3002';
    case 'vast-tams':
      return process.env.VITE_BACKEND_VAST_TAMS_URL || 'http://34.216.9.25:8000';
    default:
      return 'http://34.216.9.25:8000'; // Default to VAST TAMS
  }
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: true,
    proxy: {
      // Proxy API requests to bypass CORS - dynamically routes to selected backend
      '/api': {
        target: getBackendTarget(),
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      // Dedicated dev proxy for VAST TAMS regardless of selected backend
      '/api-vast': {
        target: process.env.VITE_BACKEND_VAST_TAMS_URL || 'http://34.216.9.25:8000',
        changeOrigin: true,
        rewrite: (path) => {
          const newPath = path.replace(/^\/api-vast/, '');
          console.log('VAST TAMS proxy rewrite:', path, '->', newPath);
          return newPath;
        },
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('VAST TAMS proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('VAST TAMS Request to Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('VAST TAMS Response from Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mantine: ['@mantine/core', '@mantine/hooks'],
          charts: ['chart.js', 'react-chartjs-2'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@mantine/core', '@mantine/hooks'],
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
}) 