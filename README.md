# Monks - TAMS Frontend Application

A comprehensive React-based frontend for the Time Addressable Media Storage (TAMS) demo application, featuring advanced media management, observability, QC statistics, and video streaming capabilities. Built with Mantine UI components and Vite.

Primary backend: [`monks_tams_api`](https://github.com/FormulaMonks/tams-api)

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd vastDemoTAMS/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:5173](http://localhost:5173)

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets and videos
├── src/
│   ├── pages/             # Page components
│   │   ├── Landing.tsx           # Home / dashboard
│   │   ├── Sources.tsx           # Media sources table
│   │   ├── SourceDetails.tsx     # Source details view
│   │   ├── Flows.tsx             # Media flows table
│   │   ├── FlowDetails.tsx       # Flow details view (segments, analytics, QC)
│   │   ├── Search.tsx            # Advanced search interface
│   │   ├── SearchResults.tsx     # Search results display
│   │   ├── Upload.tsx            # Media upload interface
│   │   ├── VideoCompilation.tsx  # Video compilation engine
│   │   ├── Observability.tsx     # System observability
│   │   ├── Objects.tsx           # Object storage browser
│   │   ├── QCStatistics.tsx      # QC statistics dashboard
│   │   ├── Service.tsx           # Service management
│   │   ├── Webhooks.tsx          # Webhook management
│   │   ├── DeletionRequests.tsx  # Deletion request management
│   │   ├── HLSTestPage.tsx       # HLS video testing
│   │   └── VastTamsWorkflow.tsx  # TAMS workflow guide
│   ├── components/        # Reusable UI components (43 components)
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── FlowCollectionManager.tsx
│   │   ├── HLSVideoPlayer.tsx
│   │   ├── VideoCompilationEngine.tsx
│   │   ├── WebhookManagerMantine.tsx
│   │   └── ... (38 more components)
│   ├── services/          # API and business logic services
│   │   ├── clients/       # API client implementations
│   │   ├── interfaces/    # TypeScript interfaces
│   │   ├── analytics.ts
│   │   ├── searchService.ts
│   │   └── ... (10 more services)
│   ├── contexts/          # React contexts
│   │   └── BackendContext.tsx
│   ├── hooks/             # Custom React hooks
│   │   ├── useBackendFeatures.ts
│   │   ├── useBackendStatus.ts
│   │   └── useFilterPersistence.ts
│   ├── utils/             # Utility functions
│   │   ├── videoMerger.ts
│   │   ├── vastTamsUtils.ts
│   │   └── ... (3 more utilities)
│   ├── types/             # TypeScript type definitions
│   │   └── backend.ts
│   ├── config/            # Configuration files
│   │   └── apiConfig.ts
│   ├── styles/            # CSS and styling
│   │   └── tams.css
│   ├── App.tsx            # Main app component with routing
│   └── main.tsx           # App entry point
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite configuration
└── README.md             # This file
```

## ✨ Key Features

### 🎥 **Media Management**
- **Sources** – Create, configure, and monitor media sources from `monks_tams_api`
- **Flows** – Organize and track media flows with advanced filtering
- **Segments in FlowDetails** – Inspect, filter, and play flow segments inline
- **Video Upload** – Upload and register new media segments
- **Video Compilation** – Merge and process multiple segments into compilations

### 🔍 **Advanced Search & Discovery**
- **Multi-Entity Search** – Search across sources, flows, and segments
- **Advanced Filtering** – Rich filter combinations with temporal and tag filters
- **Search Results** – Rich result display with previews and metadata

### 📊 **Observability & QC**
- **Observability** – System and backend health view (via `monks_tams_api` health/metrics)
- **QC Statistics** – QC-focused statistics dashboard
- **Flow Analytics** – Per-flow stats and segment analytics in `FlowDetails`

### 🎬 **Video Streaming & Playback**
- **HLS Video Player** – HTTP Live Streaming support
- **TAMS Segment Player** – Segment playback with CMCD metrics
- **Inline Segment Player** – Quick inspection of individual segments

### 🔧 **System Administration**
- **Webhook Management** – Configure and monitor webhooks
- **Deletion Requests** – Manage content deletion workflows
- **Service Management** – View core backend service metadata
- **Backend Context** – Swappable backend support (with `monks_tams_api` as the primary)

### 🎨 **User Experience**
- **Dark Mode Dashboard** – Custom dark theme aligned with TAMS design
- **Responsive Layout** – Sidebar + content layout tuned for desktop and large screens

## 🛠️ Technology Stack

- **React 19.1.0** - UI library
- **Vite 7.0.6** - Build tool and dev server
- **Mantine v8.2.1** - UI component library with hooks
- **React Router v7.7.1** - Client-side routing
- **Chart.js 4.5.0** - Data visualization
- **React Chart.js 2 5.3.0** - Chart.js React integration
- **HLS.js 1.6.11** - HTTP Live Streaming video player
- **Tabler Icons 3.34.1** - Icon library
- **TypeScript 5.5.0** - Type safety

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🧭 Navigation Structure

The application uses a left-hand sidebar navigation:

- **Logo** – Returns to the `Landing` dashboard
- **Sources** – Media sources table
- **Flows** – Media flows table
- **Search** – Advanced search interface
- **Observability** – System observability view
- **Statistics** – QC statistics (`/qc-statistics`)
- **Service** – Service / backend metadata
- **Webhooks** – Webhook configuration and monitoring
- **Deletion Requests** – Flow deletion request management

## 🎨 Design System

The application uses a custom design system with:
- **TAMS Design Tokens** - Colors, spacing, typography
- **Mantine Components** - Pre-built UI components
- **Responsive Design** - Mobile-friendly layouts
- **Custom Components** - 43 specialized UI components

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `frontend` directory (or configure via your hosting provider):

```env
VITE_BACKEND_VAST_TAMS_URL=http://localhost:3000
VITE_APP_TITLE=TAMS Demo
```

In development, the app uses a Vite proxy on `/api` to reach `monks_tams_api` and avoid CORS issues.  
In production (e.g. Vercel), requests go through the serverless proxy in `api/proxy`.

### Backend Integration

This frontend is designed to work primarily with the `monks_tams_api` backend.  
Ensure `monks_tams_api` is running and reachable at the configured `VITE_BACKEND_VAST_TAMS_URL` before testing API features.

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### Deploy to Netlify

1. Build the project: `npm run build`
2. Drag the `dist/` folder to Netlify

### Kubernetes / Helm Deployment (TAMS Frontend)

This repository also includes a **stub Helm chart** for deploying the frontend as part of a Kubernetes stack:

- Chart location: `charts/tams-frontend/`
- Purpose: run the built React app behind nginx, and proxy `/api` calls to the Monks TAMS API.

Key points:

- The chart expects a built Docker image for the frontend (configured via `values.yaml`):
  - `image.repository`: your container registry/repo
  - `image.tag`: the image tag (usually set by CI)
- The nginx container exposes port **80** and serves the static app from `/usr/share/nginx/html`.
- The backend API endpoint is configured via the **`BACKEND_URL`** environment variable:
  - Default: `http://tams-api:3000`
  - This should point at the `tams-api` Service from the `monks_tams_api` Helm charts.
- The Deployment includes HTTP `/health` liveness/readiness probes that hit the nginx health endpoint.

This chart is intentionally minimal and is meant to be wired into a larger Helm deployment together with:

- `monks_tams_api/charts/tams-api/` (TAMS API)
- `monks_tams_api/charts/mongodb/` (MongoDB)
- `monks_tams_api/charts/minio/` (MinIO / S3-compatible storage)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit: `git commit -m 'Add feature'`
5. Push: `git push origin feature-name`
6. Submit a pull request

## 📝 License

This project leverages the TAMS demo application.

## 🆘 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**Node modules issues**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Mantine styles not loading**
- Ensure `@mantine/core/styles.css` is imported in `main.tsx`
- Check that `withCssVariables` is set on `MantineProvider`

## 📞 Support

For issues related to:
- **Frontend**: Check this README and the codebase
- **Backend**: See the backend repository documentation