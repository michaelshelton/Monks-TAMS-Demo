# Monks - TAMS Frontend Application on VAST

A comprehensive React-based frontend for the Time Addressable Media Storage (TAMS) demo application, featuring advanced media management, analytics, observability, and video streaming capabilities. Built with Mantine UI components and Vite.

Backend: https://github.com/jesseVast/vasttams

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
│   ├── pages/             # Page components (17 pages)
│   │   ├── Landing.tsx           # Home page
│   │   ├── Sources.tsx           # Media sources management
│   │   ├── SourceDetails.tsx     # Source details view
│   │   ├── Flows.tsx             # Media flows table
│   │   ├── FlowDetails.tsx       # Flow details view
│   │   ├── FlowCollections.tsx   # Flow collections management
│   │   ├── Search.tsx            # Advanced search interface
│   │   ├── SearchResults.tsx     # Search results display
│   │   ├── Upload.tsx            # Media upload interface
│   │   ├── VideoCompilation.tsx  # Video compilation engine
│   │   ├── Analytics.tsx         # Analytics dashboard
│   │   ├── Observability.tsx     # System observability
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
- **Sources Management** - Create, configure, and monitor media sources
- **Flow Management** - Organize and track media flows with advanced filtering
- **Flow Collections** - Group related flows for better organization
- **Video Upload** - Upload and manage media files
- **Video Compilation** - Merge and process multiple video segments

### 🔍 **Advanced Search & Discovery**
- **Multi-Entity Search** - Search across sources, flows, and segments
- **Advanced Filtering** - Complex filter combinations with temporal ranges
- **Search Results** - Rich result display with previews and metadata

### 📊 **Analytics & Monitoring**
- **Analytics Dashboard** - Comprehensive data visualization
- **System Observability** - Real-time system health monitoring
- **Flow Analytics** - Detailed flow performance metrics
- **Health Monitoring** - Source and flow health indicators

### 🎬 **Video Streaming & Playback**
- **HLS Video Player** - HTTP Live Streaming support
- **Video Player with Analytics** - Playback metrics and CMCD support
- **Segment Video Demo** - Interactive segment exploration

### 🔧 **System Administration**
- **Webhook Management** - Configure and monitor webhooks
- **Deletion Requests** - Manage content deletion workflows
- **Service Management** - System service configuration
- **Backend Context** - Multi-backend API support

### 🎨 **User Experience**
- **Responsive Design** - Mobile-first responsive layouts
- **Advanced UI Components** - Rich interactive components

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

The application features a clean, organized navigation system:

### **Main Navigation** (Always Visible)
- **Search** - Advanced search interface
- **Sources** - Media sources management
- **Flows** - Media flows table
- **Flow Collections** - Flow collections management

### **Additional Navigation** (Dropdown Menu)
- **Home** - Landing page
- **TAMS Workflow** - Workflow guide and documentation
- **Service** - Service management
- **Webhooks** - Webhook configuration
- **Analytics** - Analytics dashboard
- **Observability** - System monitoring
- **Deletion Requests** - Content deletion management

## 🎨 Design System

The application uses a custom design system with:
- **TAMS Design Tokens** - Colors, spacing, typography
- **Mantine Components** - Pre-built UI components
- **Responsive Design** - Mobile-friendly layouts
- **Custom Components** - 43 specialized UI components

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_TITLE=TAMS Demo
```

### Backend Integration

This frontend is designed to work with the VAST TAMS backend API. Ensure the backend is running on the configured port before testing API features.

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit: `git commit -m 'Add feature'`
5. Push: `git push origin feature-name`
6. Submit a pull request

## 📝 License

This project leverages the VAST TAMS demo application.

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
- **VAST Platform**: Contact VAST Data support
