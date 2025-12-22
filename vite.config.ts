import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Get backend configuration from environment
// Simplified to use local TAMS API
const getBackendTarget = () => {
  return process.env.VITE_BACKEND_VAST_TAMS_URL || 'http://localhost:3000';
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
            console.error('Proxy error:', err);
          });
          // Only log errors and non-2xx/3xx responses (except 503 from /health which is expected for degraded status)
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Filter out expected status codes to reduce noise
            const isHealthEndpoint = req.url?.includes('/health');
            const isExpectedStatus = proxyRes.statusCode === 503 && isHealthEndpoint;
            
            // Only log if it's an error status and not an expected degraded health response
            if (proxyRes.statusCode >= 400 && !isExpectedStatus) {
              console.warn(`Proxy response: ${proxyRes.statusCode} ${req.method} ${req.url}`);
            }
          });
        },
      },
      // Proxy MinIO uploads to handle Docker internal IPs
      // This allows presigned URLs with Docker IPs to work through localhost
      // We connect to localhost:9000 but preserve the original Host header for signature validation
      '/minio-proxy': {
        target: 'http://localhost:9000',
        changeOrigin: false, // Don't change origin - we'll set Host header manually
        rewrite: (path) => {
          // Extract path and query from /minio-proxy/http://HOST/PATH?QUERY
          const match = path.match(/^\/minio-proxy\/http:\/\/[^\/]+(\/[^?]*)(\?.*)?$/);
          if (match) {
            return match[1] + (match[2] || '');
          }
          return path.replace(/^\/minio-proxy/, '');
        },
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('MinIO proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Extract the original host from the URL path to set correct Host header
            // This is critical for presigned URL signature validation
            const originalHostMatch = req.url?.match(/\/minio-proxy\/http:\/\/([^\/]+)/);
            if (originalHostMatch) {
              const originalHost = originalHostMatch[1];
              // Remove the old Host header and set the correct one
              proxyReq.removeHeader('host');
              proxyReq.setHeader('Host', originalHost);
              console.log(`MinIO proxy: Setting Host header to ${originalHost} for signature validation`);
            }
          });
        },
      },
      // Commented out - no longer needed with single backend
      // '/api-vast': {
      //   target: process.env.VITE_BACKEND_VAST_TAMS_URL || 'http://localhost:3000',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api-vast/, ''),
      // },
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