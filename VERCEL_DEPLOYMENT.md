# Vercel Deployment Guide

## 🚀 Automatic Deployment Setup

Your TAMS frontend is now configured for automatic deployment with Vercel!

### ✅ Current Status
- **Production URL**: https://frontend-1xlw91qtl-mikes-projects-04fdbb79.vercel.app
- **GitHub Integration**: Connected to `michaelshelton/Monks-TAMS-Demo`
- **Automatic Deployments**: Enabled

### 🔄 How It Works

1. **Push to GitHub**: Any push to the `main` branch triggers automatic deployment
2. **Vercel Build**: Vercel automatically builds and deploys your React app
3. **Live Updates**: Your demo is always up-to-date with the latest changes

### 📁 Configuration Files

- **`vercel.json`**: Vercel configuration for React SPA routing
- **`tsconfig.json`**: TypeScript configuration optimized for deployment
- **`.vercel/`**: Vercel project settings (auto-generated)

### 🎯 Deployment Commands

```bash
# Manual deployment
vercel --prod

# Check deployment status
vercel ls

# View deployment logs
vercel inspect [deployment-url] --logs

# Connect to GitHub (already done)
vercel git connect https://github.com/michaelshelton/Monks-TAMS-Demo.git
```

### 🌐 Access Your Demo

- **Production**: https://frontend-1xlw91qtl-mikes-projects-04fdbb79.vercel.app
- **Vercel Dashboard**: https://vercel.com/mikes-projects-04fdbb79/frontend

### 🔧 Environment Variables

If you need to add environment variables for production:

```bash
vercel env add VITE_API_URL
vercel env add VITE_APP_TITLE
```

### 📊 Build Information

- **Framework**: Vite + React
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x (auto-detected)

### 🎪 Conference Demo Ready

Your TAMS demo is now live and ready for conference booth demonstrations! The landing page showcases all interactive features with live demo data.

### 🔄 Workflow

1. Make changes to your code
2. Commit and push to GitHub: `git push origin main`
3. Vercel automatically deploys the updates
4. Your demo is live within minutes!

---

**Next Steps**: 
- Test the live demo at the production URL
- Share the URL for conference demonstrations
- Monitor deployments in the Vercel dashboard 