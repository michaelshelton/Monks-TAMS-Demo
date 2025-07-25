# TAMS Frontend Deployment Guide

This guide covers deploying the TAMS frontend application to various hosting platforms.

## 🚀 Quick Deploy Options

### Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel
   ```

3. **Follow the prompts**
   - Link to existing project or create new
   - Set build command: `npm run build`
   - Set output directory: `dist`
   - Set install command: `npm install`

### Netlify

1. **Build the project**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy**
   - Drag the `dist` folder to [Netlify Drop](https://app.netlify.com/drop)
   - Or connect your GitHub repository

### GitHub Pages

1. **Add GitHub Pages dependency**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add scripts to package.json**
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

## 🔧 Environment Configuration

### Production Environment Variables

Create a `.env.production` file:

```env
VITE_API_URL=https://your-backend-api.com
VITE_APP_TITLE=TAMS Demo
VITE_ENABLE_ANALYTICS=true
```

### Platform-Specific Configuration

#### Vercel
- Environment variables can be set in the Vercel dashboard
- Automatic deployments on git push

#### Netlify
- Environment variables in Site settings > Environment variables
- Build command: `npm run build`
- Publish directory: `dist`

#### AWS S3 + CloudFront
1. Build: `npm run build`
2. Upload `dist` contents to S3 bucket
3. Configure CloudFront distribution
4. Set up custom domain

## 📦 Build Optimization

### Production Build
```bash
npm run build
```

### Analyze Bundle
```bash
npm install --save-dev vite-bundle-analyzer
```

Add to `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mantine: ['@mantine/core', '@mantine/hooks'],
          charts: ['chart.js', 'react-chartjs-2'],
        },
      },
    },
  },
})
```

## 🔒 Security Considerations

### Content Security Policy
Add to `index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

### HTTPS
- Ensure all production deployments use HTTPS
- Configure redirects from HTTP to HTTPS

## 📊 Performance Monitoring

### Core Web Vitals
- Monitor LCP, FID, CLS
- Use Lighthouse CI for automated testing

### Bundle Analysis
```bash
npm install --save-dev vite-bundle-analyzer
```

## 🐛 Troubleshooting

### Build Failures
1. Check Node.js version (>=18)
2. Clear cache: `rm -rf node_modules package-lock.json && npm install`
3. Check TypeScript errors: `npm run type-check`

### Runtime Errors
1. Check browser console for errors
2. Verify environment variables are set
3. Check API connectivity

### Performance Issues
1. Analyze bundle size
2. Check for unused dependencies
3. Optimize images and assets

## 📞 Support

For deployment issues:
1. Check platform-specific documentation
2. Review build logs
3. Test locally with production build: `npm run preview` 