# 🏗️ Production Architecture: Video Compilation, QR Codes & Hydrolix Integration

## 📋 **Overview**

This document explains how the video compilation workflow, QR code generation, and Hydrolix analytics would work together in production with VAST as the core infrastructure.

## 🏛️ **System Architecture**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCTION ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │   FRONTEND      │    │   BACKEND       │    │   INFRASTRUCTURE │        │
│  │   (React)       │    │   (FastAPI)     │    │   (VAST/S3)     │        │
│  │                 │    │                 │    │                 │        │
│  │ • Video Player  │◄──►│ • TAMS API      │◄──►│ • VAST Database │        │
│  │ • QR Generator  │    │ • Video Compiler│    │ • S3 Storage    │        │
│  │ • Analytics UI  │    │ • QR Service    │    │ • Hydrolix      │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 **Production Workflow**

### **1. Video Segment Storage (VAST + S3)**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VIDEO SEGMENT STORAGE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   Camera    │───►│   VAST      │───►│   S3        │───►│   Metadata  │ │
│  │   Sources   │    │   Database  │    │   Storage   │    │   Index      │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘ │
│                                                                             │
│  • Time-addressable segments stored in VAST                               │
│  • Media files stored in S3 with presigned URLs                           │
│  • Metadata indexed for fast querying                                     │
│  • Time ranges: [0:0_10:0), [10:0_20:0), etc.                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **2. Video Compilation Process**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VIDEO COMPILATION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   Frontend  │───►│   Backend   │───►│   Compiler  │───►│   Storage   │ │
│  │   Request   │    │   API       │    │   Service   │    │   (S3)      │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘ │
│                                                                             │
│  • User selects segments via frontend                                     │
│  • Backend validates segments and creates compilation job                  │
│  • Compiler service downloads segments from S3                            │
│  • FFmpeg/MediaCodec merges segments into single video                   │
│  • Compiled video uploaded back to S3                                    │
│  • Metadata stored in VAST with compilation record                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **3. QR Code Generation**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           QR CODE GENERATION                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   Backend   │───►│   QR        │───►│   Mobile    │───►│   Video      │ │
│  │   API       │    │   Service   │    │   URL       │    │   Player     │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘ │
│                                                                             │
│  • Backend generates unique mobile URL for compiled video                 │
│  • QR code service creates QR code pointing to mobile URL                 │
│  • Mobile URL: https://mobile.tams.com/play/{compilation_id}             │
│  • Mobile player optimized for touch and mobile viewing                   │
│  • QR codes can be printed, shared, or displayed on screens              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **4. Hydrolix Analytics (CMCD)**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HYDROLIX ANALYTICS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   Video     │───►│   CMCD      │───►│   Hydrolix  │───►│   Analytics │ │
│  │   Player    │    │   Client    │    │   Ingest    │    │   Dashboard  │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘ │
│                                                                             │
│  • Video player sends CMCD (Common Media Client Data)                     │
│  • Real-time streaming to Hydrolix for high-volume analytics              │
│  • Track: session views, watch time, mobile access, QR scans             │
│  • Analytics dashboard shows real-time metrics                            │
│  • CMCD fields: session_id, video_id, watch_time, device_type, etc.      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🎯 **Where VAST Fits In**

### **VAST as the Core Infrastructure**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VAST INTEGRATION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                           VAST DATABASE                                │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │   Sources   │  │    Flows    │  │  Segments   │  │   Objects   │   │ │
│  │  │   Table     │  │   Table     │  │   Table     │  │   Table     │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  │                                                                         │ │
│  │  • High-performance columnar storage                                   │ │
│  │  • Time-series optimized for media segments                            │ │
│  │  • Fast queries for time-range based operations                        │ │
│  │  • Metadata storage for all TAMS entities                             │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                           VAST S3 STORAGE                             │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │   Media     │  │  Compiled   │  │   Thumbnail │  │   Metadata  │   │ │
│  │  │  Segments   │  │   Videos    │  │   Images    │  │   Files     │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  │                                                                         │ │
│  │  • S3-compatible storage for large media files                        │ │
│  │  • Presigned URLs for secure access                                   │ │
│  │  • Hierarchical organization by date/time                             │ │
│  │  • Scalable storage for video segments and compilations               │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔧 **Production Components**

### **1. Backend Services**

#### **Video Compilation Service**
```python
# vasttams/app/compilation_service.py
class VideoCompilationService:
    def __init__(self, vast_store: VASTStore):
        self.vast_store = vast_store
        self.ffmpeg_path = "/usr/bin/ffmpeg"
    
    async def compile_video(self, segment_ids: List[str], output_format: str = "mp4") -> str:
        """
        Compile multiple video segments into a single video file
        """
        # 1. Fetch segments from VAST/S3
        segments = await self.vast_store.get_segments_by_ids(segment_ids)
        
        # 2. Download segments to temporary storage
        temp_files = await self._download_segments(segments)
        
        # 3. Compile using FFmpeg
        output_file = await self._compile_with_ffmpeg(temp_files, output_format)
        
        # 4. Upload compiled video to S3
        compilation_id = f"comp_{uuid.uuid4()}"
        s3_url = await self.vast_store.s3_store.upload_compiled_video(
            compilation_id, output_file
        )
        
        # 5. Store compilation metadata in VAST
        await self.vast_store.create_compilation_record(
            compilation_id, segment_ids, s3_url, output_format
        )
        
        return compilation_id
```

#### **QR Code Service**
```python
# vasttams/app/qr_service.py
class QRCodeService:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.qr_generator = qrcode.QRCode(version=1, box_size=10, border=5)
    
    async def generate_qr_code(self, compilation_id: str) -> str:
        """
        Generate QR code for mobile access to compiled video
        """
        mobile_url = f"{self.base_url}/mobile/play/{compilation_id}"
        
        # Generate QR code
        self.qr_generator.clear()
        self.qr_generator.add_data(mobile_url)
        self.qr_generator.make(fit=True)
        
        # Create QR code image
        qr_image = self.qr_generator.make_image(fill_color="black", back_color="white")
        
        # Save to S3 and return URL
        qr_url = await self._save_qr_image(compilation_id, qr_image)
        return qr_url
```

#### **Hydrolix Integration**
```python
# vasttams/app/hydrolix_service.py
class HydrolixService:
    def __init__(self, hydrolix_endpoint: str, api_key: str):
        self.endpoint = hydrolix_endpoint
        self.api_key = api_key
        self.client = httpx.AsyncClient()
    
    async def send_cmcd_data(self, session_data: Dict[str, Any]):
        """
        Send CMCD (Common Media Client Data) to Hydrolix
        """
        cmcd_payload = {
            "session_id": session_data.get("session_id"),
            "video_id": session_data.get("video_id"),
            "watch_time": session_data.get("watch_time"),
            "device_type": session_data.get("device_type"),
            "qr_scan": session_data.get("qr_scan", False),
            "timestamp": datetime.utcnow().isoformat(),
            "user_agent": session_data.get("user_agent"),
            "ip_address": session_data.get("ip_address")
        }
        
        # Send to Hydrolix ingest endpoint
        response = await self.client.post(
            f"{self.endpoint}/ingest/cmcd",
            json=cmcd_payload,
            headers={"Authorization": f"Bearer {self.api_key}"}
        )
        
        return response.status_code == 200
```

### **2. Frontend Integration**

#### **Video Compilation Engine (Production)**
```typescript
// frontend/src/components/VideoCompilationEngine.tsx (Production)
export default function VideoCompilationEngine({ segments }: VideoCompilationEngineProps) {
  const [compilationStatus, setCompilationStatus] = useState<'idle' | 'compiling' | 'completed' | 'error'>('idle');
  const [compilationId, setCompilationId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  const startCompilation = async () => {
    try {
      setCompilationStatus('compiling');
      
      // 1. Call backend compilation API
      const response = await fetch('/api/compilations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segment_ids: segments.map(s => s.id),
          output_format: 'mp4',
          quality: 'high'
        })
      });
      
      const { compilation_id } = await response.json();
      setCompilationId(compilation_id);
      
      // 2. Generate QR code
      const qrResponse = await fetch(`/api/qr/generate/${compilation_id}`);
      const { qr_url } = await qrResponse.json();
      setQrCodeUrl(qr_url);
      
      // 3. Get analytics data
      const analyticsResponse = await fetch(`/api/analytics/${compilation_id}`);
      const analytics = await analyticsResponse.json();
      setAnalyticsData(analytics);
      
      setCompilationStatus('completed');
      
    } catch (error) {
      setCompilationStatus('error');
      console.error('Compilation failed:', error);
    }
  };

  // Send CMCD data to Hydrolix
  const sendAnalytics = async (event: string, data: any) => {
    await fetch('/api/analytics/cmcd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionStorage.getItem('session_id'),
        video_id: compilationId,
        event,
        ...data
      })
    });
  };

  return (
    <Container size="xl">
      {/* Compilation UI */}
      <Button onClick={startCompilation} disabled={compilationStatus === 'compiling'}>
        {compilationStatus === 'compiling' ? 'Compiling...' : 'Start Compilation'}
      </Button>
      
      {/* QR Code Display */}
      {qrCodeUrl && (
        <Card>
          <Title>QR Code for Mobile Access</Title>
          <img src={qrCodeUrl} alt="QR Code" />
          <Text>Scan to access video on mobile</Text>
        </Card>
      )}
      
      {/* Analytics Dashboard */}
      {analyticsData && (
        <Card>
          <Title>Hydrolix Analytics</Title>
          <Text>Session Views: {analyticsData.session_views}</Text>
          <Text>Mobile Access: {analyticsData.mobile_access}%</Text>
          <Text>QR Scans: {analyticsData.qr_scans}</Text>
        </Card>
      )}
    </Container>
  );
}
```

## 🚀 **Deployment Architecture**

### **Kubernetes Deployment**
```yaml
# vasttams/k8s/compilation-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: video-compilation-service
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: compilation-service
        image: tams-compilation:latest
        env:
        - name: VAST_ENDPOINT
          valueFrom:
            secretKeyRef:
              name: vast-secrets
              key: endpoint
        - name: S3_ENDPOINT
          valueFrom:
            secretKeyRef:
              name: s3-secrets
              key: endpoint
        - name: HYDROLIX_API_KEY
          valueFrom:
            secretKeyRef:
              name: hydrolix-secrets
              key: api-key
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

### **Service Dependencies**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE DEPENDENCIES                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Frontend (React)                                                          │
│  ├── Backend API (FastAPI)                                                 │
│  │   ├── VAST Database (Metadata)                                          │
│  │   ├── VAST S3 (Media Storage)                                          │
│  │   ├── Video Compilation Service                                         │
│  │   ├── QR Code Service                                                   │
│  │   └── Hydrolix Analytics Service                                        │
│  │                                                                         │
│  Mobile App                                                                │
│  ├── Mobile Video Player                                                   │
│  ├── QR Code Scanner                                                       │
│  └── Hydrolix CMCD Client                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📊 **Data Flow**

### **1. Video Segment Ingestion**
```
Camera/Device → VAST Database (Metadata) → S3 Storage (Media) → Index
```

### **2. Video Compilation**
```
Frontend Request → Backend API → Compilation Service → FFmpeg → S3 → VAST
```

### **3. QR Code Generation**
```
Compilation Complete → QR Service → QR Image → S3 → Frontend Display
```

### **4. Analytics Collection**
```
Video Playback → CMCD Client → Hydrolix → Analytics Dashboard
```

## 🔐 **Security Considerations**

### **Authentication & Authorization**
- **VAST Access**: API keys for database and S3 access
- **QR Codes**: Time-limited mobile URLs with session tokens
- **Analytics**: Secure CMCD data transmission to Hydrolix
- **Mobile Access**: JWT tokens for mobile video playback

### **Data Privacy**
- **CMCD Data**: Anonymized session data sent to Hydrolix
- **Video Storage**: Encrypted at rest in S3
- **QR Codes**: Temporary access tokens, not permanent URLs
- **Analytics**: GDPR-compliant data collection

## 📈 **Scaling Considerations**

### **Performance Optimization**
- **VAST Database**: Columnar storage for fast time-series queries
- **S3 Storage**: CDN integration for global video delivery
- **Compilation**: Distributed processing with queue-based jobs
- **Analytics**: Real-time streaming to Hydrolix for high-volume data

### **High Availability**
- **VAST Cluster**: Multi-node deployment for database redundancy
- **S3 Storage**: Cross-region replication for media files
- **Compilation Services**: Auto-scaling based on queue depth
- **Mobile Access**: Load-balanced mobile video endpoints

## 🎯 **Summary**

In production, this system would work as follows:

1. **VAST** serves as the core infrastructure for metadata storage and S3-compatible media storage
2. **Video Compilation** happens server-side using FFmpeg with distributed processing
3. **QR Codes** are generated dynamically and point to mobile-optimized video URLs
4. **Hydrolix** receives real-time CMCD data for analytics and insights
5. **Mobile Access** provides optimized video playback for QR code users

The key advantage is that VAST provides the high-performance, time-series optimized storage needed for media segments, while the additional services handle the specialized requirements of video compilation, QR code generation, and analytics collection.

---

**Last Updated**: January 2025  
**Next Review**: After production deployment
