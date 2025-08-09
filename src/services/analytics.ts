/**
 * Analytics Service for CMCD (Common Media Client Data) tracking
 * 
 * This service provides a unified interface for sending analytics data
 * to Hydrolix. It works with mock data during development and
 * switches to real Hydrolix integration in production.
 */

export interface CMCDData {
  session_id: string;
  video_id?: string;
  compilation_id?: string;
  event: 'play' | 'pause' | 'stop' | 'time_update' | 'qr_scan' | 'compilation_start' | 'compilation_complete';
  watch_time?: number;
  device_type: 'mobile' | 'desktop' | 'tablet';
  qr_scan?: boolean;
  user_agent?: string;
  ip_address?: string;
  timestamp: string;
  video_quality?: string;
  bandwidth?: number;
  buffer_level?: number;
  [key: string]: any; // Allow additional fields
}

export interface AnalyticsData {
  session_views: number;
  mobile_access: number;
  qr_scans: number;
  avg_watch_time: number;
  total_compilations: number;
  recent_activity: Array<{
    timestamp: string;
    event: string;
    video_id: string;
  }>;
}

export interface AnalyticsConfig {
  hydrolixEnabled: boolean;
  hydrolixEndpoint?: string;
  mockMode: boolean;
  batchSize: number;
  flushInterval: number; // milliseconds
}

class AnalyticsService {
  private config: AnalyticsConfig;
  private eventQueue: CMCDData[] = [];
  private sessionId: string;
  private flushTimer?: ReturnType<typeof setTimeout>;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.sessionId = this.getOrCreateSessionId();
    this.startFlushTimer();
  }

  /**
   * Get or create a session ID for tracking
   */
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('tams_session_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('tams_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Detect device type from user agent
   */
  private getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/.test(userAgent)) {
      return /tablet|ipad/.test(userAgent) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  }

  /**
   * Start the flush timer for batching events
   */
  private startFlushTimer(): void {
    if (this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flushEvents();
      }, this.config.flushInterval);
    }
  }

  /**
   * Add an event to the queue
   */
  private queueEvent(data: CMCDData): void {
    this.eventQueue.push({
      ...data,
      session_id: this.sessionId,
      device_type: this.getDeviceType(),
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    // Flush immediately if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flushEvents();
    }
  }

  /**
   * Flush events to Hydrolix or mock endpoint
   */
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      if (this.config.mockMode) {
        // Store in localStorage for mock analytics
        this.storeMockEvents(events);
      } else {
        // Send to real Hydrolix endpoint
        await this.sendToHydrolix(events);
      }
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-queue events on failure
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Store events in localStorage for mock analytics
   */
  private storeMockEvents(events: CMCDData[]): void {
    const existingEvents = JSON.parse(localStorage.getItem('tams_mock_events') || '[]');
    const allEvents = [...existingEvents, ...events];
    
    // Keep only last 1000 events to prevent localStorage overflow
    if (allEvents.length > 1000) {
      allEvents.splice(0, allEvents.length - 1000);
    }
    
    localStorage.setItem('tams_mock_events', JSON.stringify(allEvents));
  }

  /**
   * Send events to Hydrolix
   */
  private async sendToHydrolix(events: CMCDData[]): Promise<void> {
    if (!this.config.hydrolixEndpoint) {
      throw new Error('Hydrolix endpoint not configured');
    }

    const response = await fetch('/api/analytics/cmcd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events,
        batch_size: events.length,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Hydrolix API error: ${response.status}`);
    }
  }

  /**
   * Track video play event
   */
  public trackVideoPlay(videoId: string, compilationId?: string, watchTime: number = 0) {
    const eventData: CMCDData = {
      event: 'play',
      video_id: videoId,
      watch_time: watchTime,
      session_id: this.sessionId,
      device_type: this.getDeviceType(),
      timestamp: new Date().toISOString()
    };
    
    if (compilationId) {
      eventData.compilation_id = compilationId;
    }
    
    this.queueEvent(eventData);
  }

  /**
   * Track video pause event
   */
  public trackVideoPause(videoId: string, watchTime: number, compilationId?: string) {
    const eventData: CMCDData = {
      event: 'pause',
      video_id: videoId,
      watch_time: watchTime,
      session_id: this.sessionId,
      device_type: this.getDeviceType(),
      timestamp: new Date().toISOString()
    };
    
    if (compilationId) {
      eventData.compilation_id = compilationId;
    }
    
    this.queueEvent(eventData);
  }

  /**
   * Track video time update
   */
  public trackVideoTimeUpdate(videoId: string, watchTime: number, compilationId?: string) {
    const eventData: CMCDData = {
      event: 'time_update',
      video_id: videoId,
      watch_time: watchTime,
      session_id: this.sessionId,
      device_type: this.getDeviceType(),
      timestamp: new Date().toISOString()
    };
    
    if (compilationId) {
      eventData.compilation_id = compilationId;
    }
    
    this.queueEvent(eventData);
  }

  /**
   * Track QR code scan
   */
  public trackQRScan(compilationId: string) {
    this.queueEvent({
      event: 'qr_scan',
      compilation_id: compilationId,
      session_id: this.sessionId,
      device_type: this.getDeviceType(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track compilation start
   */
  public trackCompilationStart(compilationId: string, segmentCount: number) {
    this.queueEvent({
      event: 'compilation_start',
      compilation_id: compilationId,
      segment_count: segmentCount,
      session_id: this.sessionId,
      device_type: this.getDeviceType(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track compilation complete
   */
  public trackCompilationComplete(compilationId: string, compilationDuration: number, fileSize: number) {
    this.queueEvent({
      event: 'compilation_complete',
      compilation_id: compilationId,
      compilation_duration: compilationDuration,
      file_size: fileSize,
      session_id: this.sessionId,
      device_type: this.getDeviceType(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get mock analytics data for display
   */
  public getMockAnalytics(): AnalyticsData {
    const events = JSON.parse(localStorage.getItem('tams_mock_events') || '[]');
    
    const sessionViews = new Set(events.map((e: CMCDData) => e.session_id)).size;
    const mobileAccess = events.filter((e: CMCDData) => e.device_type === 'mobile').length;
    const qrScans = events.filter((e: CMCDData) => e.event === 'qr_scan').length;
    const watchTimes = events.filter((e: CMCDData) => e.watch_time).map((e: CMCDData) => e.watch_time || 0);
    const avgWatchTime = watchTimes.length > 0 ? watchTimes.reduce((a: number, b: number) => a + b, 0) / watchTimes.length : 0;
    const totalCompilations = events.filter((e: CMCDData) => e.event === 'compilation_complete').length;
    
    const recentActivity = events
      .slice(-10)
      .map((e: CMCDData) => ({
        timestamp: e.timestamp,
        event: e.event,
        video_id: e.video_id || 'unknown'
      }));
    
    return {
      session_views: sessionViews,
      mobile_access: mobileAccess,
      qr_scans: qrScans,
      avg_watch_time: avgWatchTime,
      total_compilations: totalCompilations,
      recent_activity: recentActivity
    };
  }

  /**
   * Get real analytics from Hydrolix
   */
  public async getRealAnalytics(compilationId?: string): Promise<AnalyticsData> {
    try {
      const url = compilationId 
        ? `/api/analytics/${compilationId}`
        : '/api/analytics/overview';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Fallback to mock data
      return this.getMockAnalytics();
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushEvents(); // Final flush
  }
}

// Create default analytics service instance
export const analyticsService = new AnalyticsService({
  hydrolixEnabled: false, // Will be true when Hydrolix is provisioned
  mockMode: true, // Will be false in production
  batchSize: 10,
  flushInterval: 5000 // 5 seconds
});

export default AnalyticsService;
