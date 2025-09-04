# VAST TAMS S3 Access Guide

This guide explains how to access the VAST TAMS S3 bucket videos in development environments.

## 🔍 Current Infrastructure

Based on the VAST TAMS configuration:

- **S3 Endpoint**: `http://100.100.0.2:9090` (internal)
- **S3 Bucket**: `jthaloor-s3`
- **Presigned URLs**: Point to `http://10.0.11.54/tams-s3/...` (internal)
- **VAST TAMS API**: `http://34.216.9.25:8000` (public)

## 🚀 Method 1: SSH Tunnel (Recommended)

### Prerequisites
- SSH access to a machine that can reach the internal S3 network
- The machine should be able to access `10.0.11.54:80` or `100.100.0.2:9090`

### Setup SSH Tunnel

```bash
# Option 1: Tunnel to the S3 endpoint directly
ssh -L 8080:100.100.0.2:9090 user@vast-tams-server

# Option 2: Tunnel to the presigned URL endpoint
ssh -L 8080:10.0.11.54:80 user@vast-gateway-server

# Option 3: If you have access to the VAST TAMS server
ssh -L 8080:localhost:9090 user@34.216.9.25
```

### Test the Tunnel

```bash
# Test if the tunnel is working
curl -I http://localhost:8080/tams-s3/jthaloor-s3/

# Test with a specific segment
curl -I "http://localhost:8080/tams-s3/74d268a4-54c8-4c85-b8b8-932a1f67e97c/2025/09/03/test_segment_001"
```

## 🔧 Method 2: Frontend Proxy Configuration

The frontend has been updated to automatically proxy S3 requests in development mode.

### How it Works

1. **Automatic Detection**: The frontend detects S3 URLs and transforms them for local proxy
2. **URL Transformation**: `http://10.0.11.54/tams-s3/...` → `http://localhost:8080/tams-s3/...`
3. **Development Only**: Only active in development mode

### Configuration

The proxy is configured in `frontend/src/utils/s3Proxy.ts`:

```typescript
// Automatically transforms S3 URLs in development
export function transformS3Url(originalUrl: string): string {
  if (!isDevelopmentMode()) {
    return originalUrl;
  }
  
  // Transform internal S3 URLs to use localhost tunnel
  return originalUrl.replace('http://10.0.11.54', 'http://localhost:8080');
}
```

## 🌐 Method 3: VPN Access

If you have VPN access to the VAST TAMS network:

1. **Connect to VPN**: Establish VPN connection to the internal network
2. **Direct Access**: Access S3 URLs directly without tunneling
3. **Update Configuration**: Modify the proxy settings to disable URL transformation

## 🔄 Method 4: API Proxy Endpoint

Create a proxy endpoint in the VAST TAMS API to serve S3 content:

### Backend Proxy Implementation

```python
# Add to vasttams/app/segments_router.py
@router.get("/proxy/{flow_id}/{path:path}")
async def proxy_s3_content(flow_id: str, path: str):
    """Proxy S3 content through the API"""
    # Implementation to fetch from S3 and stream to client
    pass
```

### Frontend Configuration

```typescript
// Use API proxy instead of direct S3 access
const proxyUrl = `${API_BASE_URL}/proxy/${flowId}/${s3Path}`;
```

## 🧪 Testing Video Playback

### 1. Start SSH Tunnel

```bash
ssh -L 8080:10.0.11.54:80 user@vast-gateway-server
```

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

### 3. Test Video Playback

1. Navigate to: `http://localhost:5173/flow-details/74d268a4-54c8-4c85-b8b8-932a1f67e97c`
2. Go to the **Segments** tab
3. Click **Play** on any segment
4. The video player should now load the video through the tunnel

## 🔍 Troubleshooting

### Common Issues

1. **Connection Refused**
   ```bash
   # Check if tunnel is active
   netstat -an | grep 8080
   
   # Test tunnel connectivity
   curl -v http://localhost:8080/
   ```

2. **CORS Errors**
   - Ensure the S3 server allows CORS from `localhost:5173`
   - Check browser developer tools for CORS headers

3. **Video Not Loading**
   - Verify the presigned URL is still valid
   - Check if the video file exists in S3
   - Test the URL directly in browser

### Debug Commands

```bash
# Check tunnel status
lsof -i :8080

# Test S3 connectivity
curl -v "http://localhost:8080/tams-s3/jthaloor-s3/"

# Check presigned URL
curl -I "http://localhost:8080/tams-s3/74d268a4-54c8-4c85-b8b8-932a1f67e97c/2025/09/03/test_segment_001?AWSAccessKeyId=..."
```

## 📝 Environment Variables

Add these to your `.env` file for custom configuration:

```bash
# S3 Proxy Configuration
VITE_S3_PROXY_ENABLED=true
VITE_S3_PROXY_PORT=8080
VITE_S3_PROXY_HOST=localhost

# Development Mode
VITE_DEV_MODE=true
```

## 🚀 Production Considerations

For production deployment:

1. **Remove Proxy**: Disable S3 URL transformation
2. **Direct Access**: Ensure S3 is accessible from production environment
3. **CDN**: Consider using a CDN for video delivery
4. **Security**: Implement proper authentication and authorization

## 📚 Additional Resources

- [VAST TAMS API Documentation](http://34.216.9.25:8000/docs)
- [SSH Tunnel Guide](https://www.ssh.com/academy/ssh/tunneling/example)
- [S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-urls.html)
