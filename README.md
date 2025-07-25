# Monks - TAMS Frontend Application on VAST

A React-based frontend for the Time Addressable Media Storage (TAMS) demo application, built with Mantine UI components and Vite.

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
├── public/                 # Static assets
├── src/
│   ├── pages/             # Page components
│   │   ├── Landing.tsx    # Home page
│   │   ├── Flows.tsx      # Media flows table
│   │   ├── Analytics.tsx  # Analytics dashboard
│   │   ├── Search.tsx     # Search interface
│   │   ├── Upload.tsx     # Upload interface
│   │   ├── Segments.tsx   # Media segments
│   │   └── FlowDetails.tsx # Flow details
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # App entry point
│   └── styles/            # CSS files
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite configuration
└── README.md             # This file
```

## 🛠️ Technology Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Mantine v8** - UI component library
- **React Router** - Client-side routing
- **Chart.js** - Data visualization
- **Tabler Icons** - Icon library
- **TypeScript** - Type safety

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🎨 Design System

The application uses a custom design system with:
- **TAMS Design Tokens** - Colors, spacing, typography
- **Mantine Components** - Pre-built UI components
- **Responsive Design** - Mobile-friendly layouts

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
