/**
 * CMCD (Common Media Client Data) Service
 * Implements CTA-5004 standard for tracking video playback metrics
 * https://cdn.cta.tech/cta/media/media/resources/standards/pdfs/cta-5004-final.pdf
 */

export interface CMCDMetrics {
  // Client-side metrics
  bandwidth?: number; // Available bandwidth in kbps
  bufferLength?: number; // Buffer length in seconds
  decodedFrames?: number; // Number of decoded frames
  droppedFrames?: number; // Number of dropped frames
  loadTime?: number; // Time to load segment in ms
  measuredThroughput?: number; // Measured throughput in kbps
  objectDuration?: number; // Duration of media object in seconds
  playbackRate?: number; // Playback rate (1.0 = normal)
  startupTime?: number; // Time to start playback in ms
  
  // Quality metrics
  qualityLevel?: number; // Current quality level index
  qualityChanges?: number; // Number of quality changes
  rebufferingEvents?: number; // Number of rebuffering events
  rebufferingTime?: number; // Total rebuffering time in seconds
  
  // Session metrics
  sessionId: string; // Unique session identifier
  timestamp: number; // Timestamp when metrics were collected
  userId?: string; // User identifier if available
  
  // BBC TAMS specific
  flowId?: string | undefined; // Associated flow ID
  segmentId?: string | undefined; // Associated segment ID
  sourceId?: string | undefined; // Associated source ID
}

export interface CMCDRequest {
  url: string;
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
  responseTime?: number;
  statusCode?: number;
  error?: string;
}

export interface CMCDSession {
  id: string;
  startTime: number;
  endTime?: number;
  metrics: CMCDMetrics[];
  requests: CMCDRequest[];
  userAgent: string;
  deviceInfo: {
    screenWidth: number;
    screenHeight: number;
    connectionType?: string;
    effectiveType?: string;
  };
}

class CMCDFormatter {
  /**
   * Format CMCD metrics according to CTA-5004 standard
   */
  static formatMetrics(metrics: CMCDMetrics): string {
    const params: string[] = [];
    
    if (metrics.bandwidth) params.push(`CMCD-Bandwidth=${Math.round(metrics.bandwidth)}`);
    if (metrics.bufferLength) params.push(`CMCD-BufferLength=${Math.round(metrics.bufferLength * 1000)}`);
    if (metrics.decodedFrames) params.push(`CMCD-DecodedFrames=${metrics.decodedFrames}`);
    if (metrics.droppedFrames) params.push(`CMCD-DroppedFrames=${metrics.droppedFrames}`);
    if (metrics.loadTime) params.push(`CMCD-LoadTime=${metrics.loadTime}`);
    if (metrics.measuredThroughput) params.push(`CMCD-MeasuredThroughput=${Math.round(metrics.measuredThroughput)}`);
    if (metrics.objectDuration) params.push(`CMCD-ObjectDuration=${Math.round(metrics.objectDuration * 1000)}`);
    if (metrics.playbackRate) params.push(`CMCD-PlaybackRate=${metrics.playbackRate}`);
    if (metrics.startupTime) params.push(`CMCD-StartupTime=${metrics.startupTime}`);
    if (metrics.qualityLevel !== undefined) params.push(`CMCD-QualityLevel=${metrics.qualityLevel}`);
    if (metrics.qualityChanges) params.push(`CMCD-QualityChanges=${metrics.qualityChanges}`);
    if (metrics.rebufferingEvents) params.push(`CMCD-RebufferingEvents=${metrics.rebufferingEvents}`);
    if (metrics.rebufferingTime) params.push(`CMCD-RebufferingTime=${Math.round(metrics.rebufferingTime * 1000)}`);
    
    // BBC TAMS specific parameters
    if (metrics.flowId) params.push(`CMCD-FlowId=${metrics.flowId}`);
    if (metrics.segmentId) params.push(`CMCD-SegmentId=${metrics.segmentId}`);
    if (metrics.sourceId) params.push(`CMCD-SourceId=${metrics.sourceId}`);
    
    return params.join(',');
  }
  
  /**
   * Parse CMCD string back to metrics object
   */
  static parseMetrics(cmcdString: string): Partial<CMCDMetrics> {
    const metrics: Partial<CMCDMetrics> = {};
    const params = cmcdString.split(',');
    
    for (const param of params) {
      const [key, value] = param.split('=');
      if (!key || !value) continue;
      
      switch (key) {
        case 'CMCD-Bandwidth':
          metrics.bandwidth = parseInt(value);
          break;
        case 'CMCD-BufferLength':
          metrics.bufferLength = parseInt(value) / 1000;
          break;
        case 'CMCD-DecodedFrames':
          metrics.decodedFrames = parseInt(value);
          break;
        case 'CMCD-DroppedFrames':
          metrics.droppedFrames = parseInt(value);
          break;
        case 'CMCD-LoadTime':
          metrics.loadTime = parseInt(value);
          break;
        case 'CMCD-MeasuredThroughput':
          metrics.measuredThroughput = parseInt(value);
          break;
        case 'CMCD-ObjectDuration':
          metrics.objectDuration = parseInt(value) / 1000;
          break;
        case 'CMCD-PlaybackRate':
          metrics.playbackRate = parseFloat(value);
          break;
        case 'CMCD-StartupTime':
          metrics.startupTime = parseInt(value);
          break;
        case 'CMCD-QualityLevel':
          metrics.qualityLevel = parseInt(value);
          break;
        case 'CMCD-QualityChanges':
          metrics.qualityChanges = parseInt(value);
          break;
        case 'CMCD-RebufferingEvents':
          metrics.rebufferingEvents = parseInt(value);
          break;
        case 'CMCD-RebufferingTime':
          metrics.rebufferingTime = parseInt(value) / 1000;
          break;
        case 'CMCD-FlowId':
          metrics.flowId = value;
          break;
        case 'CMCD-SegmentId':
          metrics.segmentId = value;
          break;
        case 'CMCD-SourceId':
          metrics.sourceId = value;
          break;
      }
    }
    
    return metrics;
  }
}

class CMCDTracker {
  private session: CMCDSession;
  private videoElement?: HTMLVideoElement;
  private metricsInterval?: number;
  private isTracking = false;
  
  constructor() {
    this.session = {
      id: this.generateSessionId(),
      startTime: Date.now(),
      metrics: [],
      requests: [],
      userAgent: navigator.userAgent,
      deviceInfo: {
        screenWidth: screen.width,
        screenHeight: screen.height,
        connectionType: (navigator as any).connection?.type,
        effectiveType: (navigator as any).connection?.effectiveType,
      }
    };
  }
  
  /**
   * Start tracking video playback metrics
   */
  startVideoTracking(videoElement: HTMLVideoElement, flowId?: string, segmentId?: string, sourceId?: string): void {
    this.videoElement = videoElement;
    this.isTracking = true;
    
    // Track video events
    videoElement.addEventListener('loadstart', () => this.trackEvent('loadstart'));
    videoElement.addEventListener('loadedmetadata', () => this.trackEvent('loadedmetadata'));
    videoElement.addEventListener('canplay', () => this.trackEvent('canplay'));
    videoElement.addEventListener('canplaythrough', () => this.trackEvent('canplaythrough'));
    videoElement.addEventListener('play', () => this.trackEvent('play'));
    videoElement.addEventListener('pause', () => this.trackEvent('pause'));
    videoElement.addEventListener('ended', () => this.trackEvent('ended'));
    videoElement.addEventListener('error', (e) => this.trackEvent('error', e));
    videoElement.addEventListener('waiting', () => this.trackEvent('waiting'));
    videoElement.addEventListener('stalled', () => this.trackEvent('stalled'));
    videoElement.addEventListener('progress', () => this.trackEvent('progress'));
    
    // Start metrics collection
    this.startMetricsCollection(flowId, segmentId, sourceId);
  }
  
  /**
   * Stop tracking video playback metrics
   */
  stopVideoTracking(): void {
    this.isTracking = false;
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = 0;
    }
    
    if (this.videoElement) {
      // Remove event listeners
      this.videoElement.removeEventListener('loadstart', () => {});
      this.videoElement.removeEventListener('loadedmetadata', () => {});
      this.videoElement.removeEventListener('canplay', () => {});
      this.videoElement.removeEventListener('canplaythrough', () => {});
      this.videoElement.removeEventListener('play', () => {});
      this.videoElement.removeEventListener('pause', () => {});
      this.videoElement.removeEventListener('ended', () => {});
      this.videoElement.removeEventListener('error', () => {});
      this.videoElement.removeEventListener('waiting', () => {});
      this.videoElement.removeEventListener('stalled', () => {});
      this.videoElement.removeEventListener('progress', () => {});
    }
    
    this.session.endTime = Date.now();
  }
  
  /**
   * Track a video event
   */
  private trackEvent(eventType: string, error?: Event): void {
    if (!this.isTracking || !this.videoElement) return;
    
    const metrics: CMCDMetrics = {
      sessionId: this.session.id,
      timestamp: Date.now(),
      flowId: this.session.metrics[0]?.flowId,
      segmentId: this.session.metrics[0]?.segmentId,
      sourceId: this.session.metrics[0]?.sourceId,
    };
    
    switch (eventType) {
      case 'loadstart':
        metrics.startupTime = Date.now() - this.session.startTime;
        break;
      case 'canplay':
        metrics.startupTime = Date.now() - this.session.startTime;
        break;
      case 'error':
        // Track error details
        break;
      case 'waiting':
      case 'stalled':
        metrics.rebufferingEvents = (metrics.rebufferingEvents || 0) + 1;
        break;
    }
    
    this.session.metrics.push(metrics);
  }
  
  /**
   * Start collecting metrics at regular intervals
   */
  private startMetricsCollection(flowId?: string, segmentId?: string, sourceId?: string): void {
    this.metricsInterval = setInterval(() => {
      if (!this.isTracking || !this.videoElement) return;
      
      const metrics: CMCDMetrics = {
        sessionId: this.session.id,
        timestamp: Date.now(),
        flowId,
        segmentId,
        sourceId,
        bufferLength: this.videoElement.buffered.length > 0 ? 
          this.videoElement.buffered.end(this.videoElement.buffered.length - 1) - this.videoElement.currentTime : 0,
        playbackRate: this.videoElement.playbackRate,
        objectDuration: this.videoElement.duration || 0,
        decodedFrames: (this.videoElement as any).webkitDecodedFrameCount || 0,
        droppedFrames: (this.videoElement as any).webkitDroppedFrameCount || 0,
      };
      
      // Estimate bandwidth if possible
      if (this.videoElement.readyState >= 2) {
        const videoTrack = this.videoElement.srcObject ? 
          (this.videoElement.srcObject as MediaStream).getVideoTracks()[0] : null;
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          if (settings.width && settings.height) {
            // Rough bandwidth estimation based on resolution
            const pixels = settings.width * settings.height;
            metrics.bandwidth = Math.round(pixels * 0.1); // Rough estimate
          }
        }
      }
      
      this.session.metrics.push(metrics);
    }, 1000); // Collect metrics every second
  }
  
  /**
   * Track an API request
   */
  trackRequest(request: Omit<CMCDRequest, 'timestamp'>): void {
    this.session.requests.push({
      ...request,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Get current session data
   */
  getSession(): CMCDSession {
    return { ...this.session };
  }
  
  /**
   * Get formatted CMCD string for current metrics
   */
  getFormattedCMCD(): string {
    if (this.session.metrics.length === 0) return '';
    
    const latestMetrics = this.session.metrics[this.session.metrics.length - 1];
    if (!latestMetrics) return '';
    return CMCDFormatter.formatMetrics(latestMetrics);
  }
  
  /**
   * Get all metrics as CMCD strings
   */
  getAllFormattedCMCD(): string[] {
    return this.session.metrics.map(metrics => CMCDFormatter.formatMetrics(metrics));
  }
  
  /**
   * Send metrics to analytics endpoint
   */
  async sendMetricsToAnalytics(endpoint: string): Promise<void> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CMCD-Data': this.getFormattedCMCD(),
        },
        body: JSON.stringify({
          session: this.session,
          metrics: this.session.metrics,
          requests: this.session.requests,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send metrics: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send CMCD metrics:', error);
    }
  }
  
  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `cmcd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Reset session
   */
  resetSession(): void {
    this.session = {
      id: this.generateSessionId(),
      startTime: Date.now(),
      metrics: [],
      requests: [],
      userAgent: navigator.userAgent,
      deviceInfo: {
        screenWidth: screen.width,
        screenHeight: screen.height,
        connectionType: (navigator as any).connection?.type,
        effectiveType: (navigator as any).connection?.effectiveType,
      }
    };
  }
}

// Export singleton instance
export const cmcdTracker = new CMCDTracker();

// Export utility functions
export const formatCMCD = CMCDFormatter.formatMetrics;
export const parseCMCD = CMCDFormatter.parseMetrics;

// Types are already exported at the top of the file
