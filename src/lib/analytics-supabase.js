import {
  insertAnalyticsEvent,
  insertPerformanceMetrics,
  insertSEOMetrics,
  getProductAnalytics,
  getPerformanceMetrics,
  getSEOMetrics
} from './supabase';

/**
 * Track analytics event and sync to Supabase
 * @param {string} productId - Product ID
 * @param {string} imageId - Image ID
 * @param {object} event - Analytics event from Part 3.6
 */
export async function syncAnalyticsEvent(productId, imageId, event) {
  try {
    const analyticsEvent = {
      product_id: productId,
      image_id: imageId,
      event_type: event.eventType,
      event_timestamp: new Date(event.timestamp).toISOString(),
      session_id: event.sessionId || null,
      device_type: event.deviceType,
      duration_ms: event.duration,
      engagement_score: event.engagement,
      load_time_ms: event.loadTime,
      viewport_position: event.details?.viewportPosition || null,
      metadata: JSON.stringify(event.details)
    };

    const { data, error } = await insertAnalyticsEvent(analyticsEvent);
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Sync analytics error:', error.message);
    return { data: null, error };
  }
}

/**
 * Sync performance metrics to Supabase
 * @param {string} productId - Product ID
 * @param {string} imageId - Image ID
 * @param {object} metrics - Performance metrics from Part 3.6
 */
export async function syncPerformanceMetrics(productId, imageId, metrics) {
  try {
    const performanceMetrics = {
      product_id: productId,
      image_id: imageId,
      lcp_ms: metrics.coreWebVitals?.lcp?.value || null,
      cls_value: metrics.coreWebVitals?.cls?.value || null,
      inp_ms: metrics.coreWebVitals?.inp?.value || null,
      load_time_ms: metrics.imageMetrics?.loadTime || null,
      render_time_ms: metrics.imageMetrics?.renderTime || null,
      decode_time_ms: metrics.imageMetrics?.decodeTime || null,
      transfer_size: metrics.imageMetrics?.transferSize || null,
      decoded_size: metrics.imageMetrics?.decodedSize || null,
      compression_ratio: metrics.imageMetrics?.compressionRatio || null,
      quality_score: metrics.imageMetrics?.qualityScore || null,
      performance_grade: metrics.performance?.grade || null,
      network_type: metrics.performance?.networkType || null,
      bandwidth_mbps: metrics.performance?.bandwidth || null
    };

    const { data, error } = await insertPerformanceMetrics(performanceMetrics);
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Sync performance metrics error:', error.message);
    return { data: null, error };
  }
}

/**
 * Sync SEO metrics to Supabase
 * @param {string} productId - Product ID
 * @param {string} imageId - Image ID
 * @param {object} seoImpact - SEO impact from Part 3.6
 */
export async function syncSEOMetrics(productId, imageId, seoImpact) {
  try {
    const seoMetrics = {
      product_id: productId,
      image_id: imageId,
      search_impressions: seoImpact.googleImagesVisibility?.impressions || 0,
      search_clicks: seoImpact.googleImagesVisibility?.clicks || 0,
      click_through_rate: seoImpact.googleImagesVisibility?.ctr || null,
      average_rank: seoImpact.googleImagesVisibility?.averageRank || null,
      google_lens_compliant: seoImpact.googleLensCompliance?.compliant || false,
      seo_score: seoImpact.seoMetrics?.score || null,
      metadata_quality: Math.max(
        seoImpact.seoMetrics?.metadataQuality?.altText || 0,
        seoImpact.seoMetrics?.metadataQuality?.title || 0,
        seoImpact.seoMetrics?.metadataQuality?.caption || 0
      ),
      schema_valid: seoImpact.seoMetrics?.schemaValid || false,
      traffic_estimate: seoImpact.trafficImpact?.potentialTraffic || null
    };

    const { data, error } = await insertSEOMetrics(seoMetrics);
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Sync SEO metrics error:', error.message);
    return { data: null, error };
  }
}

/**
 * Get analytics dashboard data
 * @param {string} productId - Product ID
 * @param {number} days - Last N days (default 30)
 */
export async function getAnalyticsDashboard(productId, days = 30) {
  try {
    const [analytics, performance, seo] = await Promise.all([
      getProductAnalytics(productId, null, days),
      getPerformanceMetrics(productId, days),
      getSEOMetrics(productId)
    ]);

    if (analytics.error || performance.error) {
      throw new Error('Failed to fetch analytics');
    }

    // Calculate statistics
    const stats = {
      views: (analytics.data || []).filter(e => e.event_type === 'view').length,
      downloads: (analytics.data || []).filter(e => e.event_type === 'download').length,
      interactions: (analytics.data || []).filter(e => e.event_type === 'interaction').length,
      avgEngagement: analytics.data?.length > 0
        ? Math.round(
            analytics.data.reduce((sum, e) => sum + (e.engagement_score || 0), 0) / 
            analytics.data.length
          )
        : 0,
      avgLoadTime: performance.data?.length > 0
        ? Math.round(
            performance.data.reduce((sum, m) => sum + (m.load_time_ms || 0), 0) / 
            performance.data.length
          )
        : 0,
      avgPerformanceGrade: performance.data?.[0]?.performance_grade || 'N/A',
      seoScore: seo.data?.seo_score || 0
    };

    return { 
      data: {
        stats,
        analytics: analytics.data || [],
        performance: performance.data || [],
        seo: seo.data
      },
      error: null 
    };
  } catch (error) {
    console.error('Get dashboard error:', error.message);
    return { data: null, error };
  }
}

export default {
  syncAnalyticsEvent,
  syncPerformanceMetrics,
  syncSEOMetrics,
  getAnalyticsDashboard
};