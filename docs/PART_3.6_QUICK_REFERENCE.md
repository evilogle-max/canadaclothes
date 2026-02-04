# Part 3.6: Quick Reference Card

## Method Reference

### ImageOptimizer Analytics Methods

#### Event Tracking

| Method | Purpose | Parameters | Returns |
|--------|---------|-----------|---------|
| `trackImageView(imageId, details)` | Track image view | imageId, {duration, viewportPosition, deviceType, loadTime, renderTime} | View event object |
| `trackImageDownload(imageId, details)` | Track image download | imageId, {format, size, downloadTime, deviceType, quality} | Download event object |
| `trackImageInteraction(imageId, details)` | Track user interaction | imageId, {interactionType, duration, actionCount, deviceType} | Interaction event object |

#### Analytics & Reporting

| Method | Purpose | Parameters | Returns |
|--------|---------|-----------|---------|
| `initializeAnalyticsTracking(config)` | Initialize tracking system | config object (optional) | Tracking initialization object |
| `calculateImagePerformanceMetrics(imageId, details)` | Calculate performance metrics | imageId, {lcp, cls, inp, loadTime, renderTime, ...} | Performance metrics object |
| `measureSEOImpact(imageId, metrics)` | Measure SEO impact | imageId, {impressions, clicks, rank, ctr, metadata} | SEO impact object |
| `generateAnalyticsReport(imageId, allMetrics)` | Generate report | imageId, all metrics | Complete report object |
| `exportAnalyticsToCSV(imageId, events)` | Export to CSV | imageId, events array | CSV string |

---

## SchemaManager Methods

| Method | Purpose | Parameters | Returns |
|--------|---------|-----------|---------|
| `injectImageAnalyticsSchema(analyticsEvent)` | Inject event schema | event object | JSON-LD schema |
| `injectImagePerformanceSchema(performanceMetrics)` | Inject performance schema | metrics object | JSON-LD schema |
| `injectSEOImpactSchema(seoImpact)` | Inject SEO schema | SEO data | JSON-LD schema |
| `injectAnalyticsAggregationSchema(analyticsData)` | Inject aggregation schema | aggregated data | JSON-LD schema |
| `injectUserEngagementSchema(engagementData)` | Inject engagement schema | engagement data | JSON-LD schema |
| `injectConversionTrackingSchema(conversionData)` | Inject conversion schema | conversion data | JSON-LD schema |
| `injectDeviceNetworkSchema(deviceData)` | Inject device schema | device data | JSON-LD schema |
| `injectRecommendationSchema(recommendations)` | Inject recommendation schema | recommendations array | JSON-LD schema |

---

## App Integration Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `initializeAnalyticsTracking()` | Initialize system | Initialization status |
| `trackAllImageViews()` | Track all views | Array of view events |
| `trackImageDownloads()` | Track downloads | Array of download events |
| `trackImageInteractions()` | Track interactions | Array of interaction events |
| `calculateAllImagePerformanceMetrics()` | Calc all metrics | Aggregated metrics |
| `measureAllImagesSEOImpact()` | Measure all SEO | Aggregated SEO metrics |
| `generateComprehensiveAnalyticsReport()` | Generate report | Complete report |
| `exportAnalyticsToCSV()` | Export data | CSV string |
| `generateUserEngagementInsights()` | Generate insights | Insights object |
| `injectDeviceNetworkAnalytics()` | Inject device data | Device analytics |
| `disposeAnalyticsOptimization()` | Cleanup | Cleanup status |

---

## Quick Code Snippets

### Initialize Analytics
```javascript
const tracking = optimizer.initializeAnalyticsTracking({
  enableTracking: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
});
```

### Track View
```javascript
optimizer.trackImageView('product-001', {
  duration: 5000,
  viewportPosition: 'above-fold',
  deviceType: 'mobile',
  loadTime: 850,
  renderTime: 320
});
```

### Track Download
```javascript
optimizer.trackImageDownload('product-001', {
  format: 'webp',
  size: 245000,
  downloadTime: 3000,
  deviceType: 'desktop',
  quality: 'high'
});
```

### Track Interaction
```javascript
optimizer.trackImageInteraction('product-001', {
  interactionType: 'zoom',
  duration: 8000,
  actionCount: 3,
  deviceType: 'mobile'
});
```

### Calculate Metrics
```javascript
const metrics = optimizer.calculateImagePerformanceMetrics('product-001', {
  lcp: 2100,
  cls: 0.08,
  inp: 180,
  loadTime: 850,
  renderTime: 320,
  decodeTime: 150,
  transferSize: 245000,
  decodedSize: 1920000,
  networkType: 'wifi',
  bandwidth: 45.5
});
```

### Measure SEO Impact
```javascript
const seoImpact = optimizer.measureSEOImpact('product-001', {
  searchImpressions: 1250,
  searchClicks: 85,
  averageRank: 4.5,
  ctr: 6.8,
  metadata: { altText: 100, title: 95, caption: 85 }
});
```

### Generate Report
```javascript
const report = optimizer.generateAnalyticsReport('product-001', metrics);
```

### Export CSV
```javascript
const csv = optimizer.exportAnalyticsToCSV('product-001', events);
const link = document.createElement('a');
link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
link.download = 'analytics.csv';
link.click();
```

---

## Event Object Structure

### View Event
```javascript
{
  timestamp: 1705276800000,
  eventType: 'view',
  imageId: 'product-123',
  deviceType: 'mobile',
  duration: 5000,
  engagement: 75,
  loadTime: 850,
  details: {
    viewportPosition: 'above-fold',
    renderTime: 320
  }
}
```

### Download Event
```javascript
{
  timestamp: 1705276800000,
  eventType: 'download',
  imageId: 'product-123',
  deviceType: 'desktop',
  duration: 3000,
  engagement: 85,
  details: {
    format: 'webp',
    size: 245000,
    downloadSpeed: 81.67,
    quality: 'high'
  }
}
```

### Interaction Event
```javascript
{
  timestamp: 1705276800000,
  eventType: 'interaction',
  imageId: 'product-123',
  deviceType: 'mobile',
  duration: 8000,
  engagement: 92,
  details: {
    interactionType: 'zoom',
    actionCount: 3,
    annotations: ['hover', 'click', 'zoom']
  }
}
```

---

## Performance Metrics Grades

| Grade | Range | Performance Level |
|-------|-------|------------------|
| A | > 90 | Excellent |
| B | > 75 | Very Good |
| C | > 60 | Good |
| D | > 40 | Fair |
| F | ≤ 40 | Poor |

---

## Core Web Vitals Targets

| Metric | Target | Baseline | Improvement |
|--------|--------|----------|------------|
| LCP | < 2.5s | 4.0s | 37.5% |
| CLS | < 0.1 | 0.25 | 60.0% |
| INP | < 200ms | 500ms | 60.0% |

---

## SEO Score Components

| Component | Weight | Range |
|-----------|--------|-------|
| Metadata Quality | 30% | 0-100 |
| Technical Optimization | 25% | 0-100 |
| Schema Markup | 25% | 0-100 |
| Content Relevance | 20% | 0-100 |
| **Overall Score** | - | **0-100** |

---

## Engagement Levels

| Level | Score Range | Characteristics |
|-------|-------------|-----------------|
| None | 0-25 | Passive view, minimal interaction |
| Low | 26-50 | Brief interaction, single action |
| Medium | 51-75 | Sustained engagement, multiple interactions |
| High | 76-100 | Deep engagement, multiple actions |

---

## CSS Classes Reference

### Analytics Container
```css
.analytics-dashboard      /* Main container */
.analytics-card          /* Individual metric card */
.analytics-card.views    /* Views card variant */
.analytics-card.downloads /* Downloads card variant */
.analytics-card.performance /* Performance card variant */
```

### Metric Display
```css
.metric-box              /* Single metric box */
.metric-label            /* Metric label */
.metric-value            /* Metric numeric value */
.metric-status           /* Status indicator */
.metric-status.good      /* Good status (green) */
.metric-status.warning   /* Warning status (yellow) */
.metric-status.critical  /* Critical status (red) */
```

### Performance Charts
```css
.performance-metrics     /* Performance section */
.performance-chart       /* Chart container */
.metric-bar              /* Bar visualization */
.metric-fill             /* Bar fill */
```

### SEO Display
```css
.seo-impact-section      /* SEO section */
.seo-score-circle        /* Circular score display */
.seo-score-number        /* Score number */
.seo-metrics-grid        /* Metrics grid */
.seo-metric-item         /* Individual metric */
.seo-metric-item.active  /* Active metric */
.seo-metric-item.inactive /* Inactive metric */
```

### Timeline
```css
.event-timeline          /* Timeline container */
.timeline-event          /* Individual event */
.timeline-event.view     /* View event marker */
.timeline-event.download /* Download event marker */
.timeline-content        /* Event content */
```

### Export & Controls
```css
.analytics-export-btn    /* Export button */
.device-breakdown        /* Device breakdown section */
.device-stat             /* Individual device stat */
.engagement-insights     /* Engagement insights section */
.insight-card            /* Insight card */
```

---

## Helper Methods (Private)

| Method | Purpose |
|--------|---------|
| `_generateSessionId()` | Generate unique session ID |
| `_detectDeviceType()` | Detect mobile/tablet/desktop |
| `_calculateEngagementScore(details)` | Calculate 0-100 score |
| `_calculateEngagementLevel(details)` | Classify engagement level |
| `_calculateDownloadSpeed(size, time)` | Calculate Mbps |
| `_calculateCompressionRatio(transfer, resource)` | Calculate compression % |
| `_calculateLCPImprovement(lcp)` | Calculate LCP improvement % |
| `_calculateCLSImprovement(cls)` | Calculate CLS improvement % |
| `_calculateINPImprovement(inp)` | Calculate INP improvement % |
| `_calculateDecodedSizeReduction(size)` | Calculate memory savings |
| `_calculateQualityScore(details)` | Calculate quality 0-100 |
| `_assignPerformanceGrade(details)` | Assign letter grade A-F |

---

## Data Storage

### localStorage Keys
```javascript
analyticsEvents          // All tracked events array
analyticsSessionId       // Current session ID
analyticsPref erences    // User preferences
analyticsLastSync        // Last sync timestamp
```

### Data Limits
```javascript
MAX_EVENTS = 1000        // Maximum events to store
STORAGE_LIMIT = 5MB      // localStorage size limit
RETENTION_DAYS = 30      // Keep 30 days of data
```

---

## Export Format

### CSV Headers
```
Date,Type,ID,Device,Duration,Engagement,LoadTime,Details
```

### CSV Example
```csv
2026-01-10T12:00:00Z,view,product-001,mobile,5000,75,850,"viewportPosition: above-fold, renderTime: 320"
2026-01-10T12:05:00Z,download,product-001,desktop,3000,85,0,"format: webp, size: 245000, quality: high"
2026-01-10T12:08:00Z,interaction,product-001,mobile,8000,92,0,"interactionType: zoom, actionCount: 3"
```

---

## Error Codes

| Code | Message | Solution |
|------|---------|----------|
| ERR_001 | Tracking not initialized | Call initializeAnalyticsTracking() first |
| ERR_002 | Invalid imageId | Ensure imageId is non-empty string |
| ERR_003 | Missing event details | Provide all required detail fields |
| ERR_004 | localStorage quota exceeded | Clear old events or increase quota |
| ERR_005 | API endpoint unreachable | Check network connection and API URL |
| ERR_006 | Invalid metrics data | Verify metrics object structure |
| ERR_007 | User consent not given | Get user permission before tracking |

---

## Useful Resources

### Performance Measurement
```javascript
// Get Core Web Vitals
const lcp = performance.getEntriesByType('largest-contentful-paint')[0]?.startTime;
const cls = performance.getEntriesByType('layout-shift').reduce((s, e) => s + e.value, 0);
const inp = Math.max(...performance.getEntriesByType('event').map(e => e.duration)) || 0;

// Get resource timing
const resources = performance.getEntriesByType('resource');
const imageResource = resources.find(r => r.name.includes('image'));
const transferSize = imageResource?.transferSize;
const decodedSize = imageResource?.decodedBodySize;

// Get network info
const connection = navigator.connection;
const networkType = connection?.effectiveType;
const bandwidth = connection?.downlink;
```

### Device Detection
```javascript
function detectDeviceType() {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}

function getNetworkType() {
  return navigator.connection?.effectiveType || '4g';
}

function getBandwidth() {
  return navigator.connection?.downlink || 0;
}
```

### CSV Download
```javascript
function downloadCSV(csvContent, filename) {
  const link = document.createElement('a');
  link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvContent);
  link.download = filename;
  link.click();
}

downloadCSV(csv, `analytics-${Date.now()}.csv`);
```

---

## Best Practice Checklist

- [ ] Initialize tracking at app start
- [ ] Track complete event details
- [ ] Use real performance measurements
- [ ] Batch analytics uploads
- [ ] Cleanup old data regularly
- [ ] Respect user privacy
- [ ] Handle errors gracefully
- [ ] Monitor performance metrics
- [ ] Validate exported data
- [ ] Test across devices
- [ ] Secure analytics endpoints
- [ ] Document custom implementations

---

## Common Issues & Solutions

### Issue: No Events Recorded
**Solution**: Check if tracking is initialized and events are being triggered

### Issue: Performance Grades Wrong
**Solution**: Use real Performance API measurements instead of estimates

### Issue: CSV Not Downloading
**Solution**: Ensure events exist and CSV format is valid

### Issue: Analytics Dashboard Blank
**Solution**: Verify DOM element exists and CSS is loaded

### Issue: SEO Metrics Incorrect
**Solution**: Validate SEO data source and calculation formulas

### Issue: High Storage Usage
**Solution**: Implement data cleanup and batch uploads

---

**Last Updated**: January 2026
**Version**: 1.0
**Status**: Production Ready
