# Part 3.6: Implementation Guide

## Quick Start (5 Minutes)

### Step 1: Initialize Analytics

```javascript
// Create optimizer instance
const optimizer = new ImageOptimizer();

// Initialize analytics tracking
const tracking = optimizer.initializeAnalyticsTracking({
  enableTracking: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  trackingPreferences: {
    trackViews: true,
    trackDownloads: true,
    trackInteractions: true
  }
});

console.log('Analytics initialized:', tracking);
```

### Step 2: Track Views

```javascript
// When image is viewed
document.addEventListener('imageload', (event) => {
  const viewEvent = optimizer.trackImageView(event.imageId, {
    duration: 5000,
    viewportPosition: event.aboveFold ? 'above-fold' : 'below-fold',
    deviceType: detectDeviceType(),
    loadTime: event.loadTime,
    renderTime: event.renderTime
  });
  
  console.log('View tracked:', viewEvent);
});
```

### Step 3: Track Downloads

```javascript
// When user downloads image
document.addEventListener('downloadclick', (event) => {
  const downloadEvent = optimizer.trackImageDownload(event.imageId, {
    format: event.format, // webp, avif, jpg
    size: event.fileSize,
    downloadTime: event.duration,
    deviceType: detectDeviceType(),
    quality: 'high'
  });
  
  console.log('Download tracked:', downloadEvent);
});
```

### Step 4: Generate Report

```javascript
// Generate analytics report
const report = optimizer.generateAnalyticsReport('product-001', {
  views: viewEvents,
  downloads: downloadEvents,
  performance: performanceMetrics,
  seo: seoMetrics
});

console.log('Analytics Report:', report);
```

### Step 5: Export Results

```javascript
// Export as CSV
const csv = optimizer.exportAnalyticsToCSV('product-001', allEvents);

// Save to file
const link = document.createElement('a');
link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
link.download = `analytics-${Date.now()}.csv`;
link.click();
```

---

## Common Tasks

### Task 1: Set Up View Tracking

**Objective**: Track when images are viewed

**Code**:
```javascript
// In image component render
const handleImageLoad = (imageElement) => {
  const startTime = performance.now();
  
  // Wait for image to be visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const endTime = performance.now();
        
        const viewEvent = optimizer.trackImageView(imageId, {
          duration: calculateViewDuration(imageElement),
          viewportPosition: entry.boundingClientRect.top > 0 ? 'above-fold' : 'below-fold',
          deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
          loadTime: endTime - startTime,
          renderTime: measureRenderTime(imageElement)
        });
        
        observer.disconnect();
      }
    });
  });
  
  observer.observe(imageElement);
};

// Attach handler to images
document.querySelectorAll('img').forEach(img => {
  img.addEventListener('load', () => handleImageLoad(img));
});
```

**Verification**:
```javascript
// Check if events are being tracked
const events = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
console.log(`Tracked ${events.length} view events`);
console.log('Sample event:', events[0]);
```

### Task 2: Set Up Download Tracking

**Objective**: Track when users download images

**Code**:
```javascript
// In download button handler
const handleDownload = (imageId, format) => {
  const startTime = performance.now();
  
  fetch(`/api/download/${imageId}?format=${format}`)
    .then(response => {
      const endTime = performance.now();
      const contentLength = response.headers.get('content-length');
      
      const downloadEvent = optimizer.trackImageDownload(imageId, {
        format: format,
        size: parseInt(contentLength),
        downloadTime: endTime - startTime,
        deviceType: navigator.userAgentData?.mobile ? 'mobile' : 'desktop',
        quality: 'high'
      });
      
      return response.blob();
    })
    .then(blob => {
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image.${format}`;
      a.click();
    });
};

// Attach to download buttons
document.querySelectorAll('[data-download]').forEach(btn => {
  btn.addEventListener('click', () => {
    const imageId = btn.dataset.imageId;
    const format = btn.dataset.format;
    handleDownload(imageId, format);
  });
});
```

**Verification**:
```javascript
const events = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
const downloadEvents = events.filter(e => e.eventType === 'download');
console.log(`Tracked ${downloadEvents.length} download events`);
```

### Task 3: Set Up Interaction Tracking

**Objective**: Track user interactions (zoom, share, etc.)

**Code**:
```javascript
// Create interaction tracker
class InteractionTracker {
  constructor(imageElement, imageId) {
    this.imageElement = imageElement;
    this.imageId = imageId;
    this.startTime = null;
    this.actionCount = 0;
    this.actions = [];
  }
  
  trackZoom(zoomLevel) {
    this.actions.push('zoom');
    this.actionCount++;
    
    // Track after zoom completes
    setTimeout(() => this.recordInteraction('zoom'), 1000);
  }
  
  trackShare(platform) {
    this.actions.push('share');
    this.actionCount++;
    
    optimizer.trackImageInteraction(this.imageId, {
      interactionType: 'share',
      duration: Date.now() - this.startTime,
      actionCount: this.actionCount,
      deviceType: this.detectDevice()
    });
  }
  
  trackHover(hovering) {
    if (hovering) {
      this.startTime = Date.now();
      this.actions.push('hover');
    }
  }
  
  recordInteraction(type) {
    optimizer.trackImageInteraction(this.imageId, {
      interactionType: type,
      duration: Date.now() - this.startTime,
      actionCount: this.actionCount,
      deviceType: this.detectDevice()
    });
  }
  
  detectDevice() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }
}

// Initialize for all images
document.querySelectorAll('[data-interactive]').forEach(img => {
  const tracker = new InteractionTracker(img, img.dataset.imageId);
  
  img.addEventListener('mouseenter', () => tracker.trackHover(true));
  img.addEventListener('mouseleave', () => tracker.trackHover(false));
  img.addEventListener('wheel', () => tracker.trackZoom(event.deltaY));
});
```

**Verification**:
```javascript
const events = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
const interactions = events.filter(e => e.eventType === 'interaction');
console.log(`Tracked ${interactions.length} interaction events`);
console.log('Interaction types:', [...new Set(interactions.map(e => e.details.interactionType))]);
```

### Task 4: Calculate Performance Metrics

**Objective**: Measure image performance improvements

**Code**:
```javascript
// Collect performance data
function getPerformanceData(imageId, imageElement) {
  // Get Core Web Vitals
  const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
  const lcp = lcpEntries[lcpEntries.length - 1]?.startTime || 0;
  
  const clsEntries = performance.getEntriesByType('layout-shift');
  const cls = clsEntries.reduce((sum, entry) => sum + entry.value, 0);
  
  const inpEntries = performance.getEntriesByType('event');
  const inp = Math.max(...inpEntries.map(e => e.duration)) || 0;
  
  // Get resource timing
  const resourceEntry = performance.getEntriesByName(imageElement.src)[0];
  const transferSize = resourceEntry?.transferSize || 0;
  const decodedSize = resourceEntry?.decodedBodySize || 0;
  const duration = resourceEntry?.duration || 0;
  
  return {
    imageId,
    lcp,
    cls,
    inp,
    loadTime: duration,
    renderTime: imageElement.naturalHeight > 0 ? 0 : duration,
    decodeTime: 0, // Would be measured with additional perf markers
    transferSize,
    decodedSize,
    networkType: navigator.connection?.effectiveType || '4g',
    bandwidth: navigator.connection?.downlink || 0
  };
}

// Calculate metrics
const imageElement = document.getElementById('product-image');
const perfData = getPerformanceData('product-001', imageElement);
const metrics = optimizer.calculateImagePerformanceMetrics('product-001', perfData);

console.log('Performance Metrics:');
console.log('- Grade:', metrics.performance.grade);
console.log('- LCP Improvement:', metrics.coreWebVitals.lcp.improvement, '%');
console.log('- CLS Improvement:', metrics.coreWebVitals.cls.improvement, '%');
console.log('- Compression Ratio:', metrics.imageMetrics.compressionRatio, '%');
```

### Task 5: Measure SEO Impact

**Objective**: Measure SEO improvements from image optimization

**Code**:
```javascript
// Get SEO data (from analytics backend)
async function getSEOData(imageId) {
  const response = await fetch(`/api/seo/image/${imageId}`);
  return response.json();
}

// Measure impact
async function measureSEOImpact(imageId) {
  const seoData = await getSEOData(imageId);
  
  const impact = optimizer.measureSEOImpact(imageId, {
    searchImpressions: seoData.impressions,
    searchClicks: seoData.clicks,
    averageRank: seoData.rank,
    ctr: (seoData.clicks / seoData.impressions) * 100,
    metadata: {
      altText: seoData.altScore,
      title: seoData.titleScore,
      caption: seoData.captionScore
    }
  });
  
  return impact;
}

// Use it
const seoImpact = await measureSEOImpact('product-001');
console.log('SEO Score:', seoImpact.seoMetrics.score);
console.log('Google Images CTR:', seoImpact.googleImagesVisibility.ctr, '%');
console.log('Traffic Estimate:', seoImpact.trafficImpact.estimatedIncrease, '%');
```

### Task 6: Generate Analytics Report

**Objective**: Create comprehensive analytics report

**Code**:
```javascript
// Collect all metrics
function generateReport(imageId) {
  const events = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
  const imageEvents = events.filter(e => e.imageId === imageId);
  
  const viewEvents = imageEvents.filter(e => e.eventType === 'view');
  const downloadEvents = imageEvents.filter(e => e.eventType === 'download');
  const interactionEvents = imageEvents.filter(e => e.eventType === 'interaction');
  
  const report = optimizer.generateAnalyticsReport(imageId, {
    views: viewEvents,
    downloads: downloadEvents,
    interactions: interactionEvents,
    performance: calculateAverageMetrics(imageEvents),
    seo: calculateSEOMetrics(imageEvents)
  });
  
  return report;
}

// Display report
function displayReport(report) {
  const container = document.getElementById('analytics-report');
  
  container.innerHTML = `
    <h2>Analytics Report for ${report.imageId}</h2>
    
    <section>
      <h3>Summary</h3>
      <p>Views: ${report.viewCount}</p>
      <p>Downloads: ${report.downloadCount}</p>
      <p>Interactions: ${report.interactionCount}</p>
    </section>
    
    <section>
      <h3>Performance</h3>
      <p>Average Load Time: ${report.averageLoadTime}ms</p>
      <p>Performance Grade: ${report.performanceGrade}</p>
      <p>Compression Ratio: ${report.compressionRatio}%</p>
    </section>
    
    <section>
      <h3>SEO Impact</h3>
      <p>SEO Score: ${report.seoScore}</p>
      <p>Google Images CTR: ${report.googleImagesCTR}%</p>
      <p>Estimated Traffic Increase: ${report.trafficIncrease}%</p>
    </section>
  `;
}

// Generate and display
const report = generateReport('product-001');
displayReport(report);
```

### Task 7: Export Analytics to CSV

**Objective**: Export analytics data for further analysis

**Code**:
```javascript
// Prepare events for export
function prepareExport(imageId) {
  const events = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
  const imageEvents = events.filter(e => e.imageId === imageId);
  
  return imageEvents;
}

// Export to CSV
function exportAnalytics(imageId, filename = null) {
  const events = prepareExport(imageId);
  
  if (events.length === 0) {
    console.warn('No events to export');
    return;
  }
  
  const csv = optimizer.exportAnalyticsToCSV(imageId, events);
  
  // Save file
  const link = document.createElement('a');
  link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
  link.download = filename || `analytics-${imageId}-${Date.now()}.csv`;
  link.click();
  
  console.log(`Exported ${events.length} events to ${link.download}`);
}

// Use it
exportAnalytics('product-001');

// Or with custom filename
exportAnalytics('product-001', 'product-001-analytics-jan-2026.csv');
```

### Task 8: Monitor Performance Degradation

**Objective**: Set up alerts for performance issues

**Code**:
```javascript
// Create performance monitor
class PerformanceMonitor {
  constructor(imageId, thresholds = {}) {
    this.imageId = imageId;
    this.thresholds = {
      maxLoadTime: 2000,      // ms
      minPerformanceGrade: 'B',
      minSEOScore: 75,
      ...thresholds
    };
  }
  
  check() {
    const events = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
    const imageEvents = events.filter(e => e.imageId === this.imageId);
    
    if (imageEvents.length === 0) return;
    
    // Calculate averages
    const avgLoadTime = imageEvents.reduce((sum, e) => sum + (e.loadTime || 0), 0) / imageEvents.length;
    const avgGrade = this.calculateAverageGrade(imageEvents);
    const avgSEOScore = this.calculateAverageSEO(imageEvents);
    
    // Check thresholds
    const alerts = [];
    
    if (avgLoadTime > this.thresholds.maxLoadTime) {
      alerts.push({
        type: 'LOAD_TIME',
        severity: 'WARNING',
        message: `Load time ${avgLoadTime.toFixed(0)}ms exceeds threshold ${this.thresholds.maxLoadTime}ms`
      });
    }
    
    if (this.gradeToNumber(avgGrade) < this.gradeToNumber(this.thresholds.minPerformanceGrade)) {
      alerts.push({
        type: 'PERFORMANCE_GRADE',
        severity: 'WARNING',
        message: `Performance grade ${avgGrade} below threshold ${this.thresholds.minPerformanceGrade}`
      });
    }
    
    if (avgSEOScore < this.thresholds.minSEOScore) {
      alerts.push({
        type: 'SEO_SCORE',
        severity: 'WARNING',
        message: `SEO score ${avgSEOScore.toFixed(0)} below threshold ${this.thresholds.minSEOScore}`
      });
    }
    
    return alerts;
  }
  
  gradeToNumber(grade) {
    return { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1 }[grade] || 0;
  }
  
  calculateAverageGrade(events) {
    // Implementation details...
    return 'A';
  }
  
  calculateAverageSEO(events) {
    // Implementation details...
    return 85;
  }
}

// Use monitor
const monitor = new PerformanceMonitor('product-001', {
  maxLoadTime: 1500,
  minPerformanceGrade: 'A',
  minSEOScore: 85
});

// Check periodically
setInterval(() => {
  const alerts = monitor.check();
  alerts.forEach(alert => {
    console.warn(`[${alert.type}] ${alert.message}`);
    // Send to logging service
    logAlert(alert);
  });
}, 60000); // Check every minute
```

---

## Checklists

### Pre-Implementation Checklist

- [ ] ImageOptimizer class imported and instantiated
- [ ] SchemaManager class imported and integrated
- [ ] App class updated with analytics methods
- [ ] CSS file includes analytics styling
- [ ] localStorage API available in target browsers
- [ ] Performance API available in target browsers
- [ ] Intersection Observer API available
- [ ] User consent mechanism in place
- [ ] Analytics backend API endpoints defined
- [ ] Error logging/monitoring set up

### Implementation Checklist

- [ ] Analytics initialization code deployed
- [ ] View tracking events firing correctly
- [ ] Download tracking events firing correctly
- [ ] Interaction tracking events firing correctly
- [ ] Performance metrics calculating accurately
- [ ] SEO impact measuring correctly
- [ ] Analytics report generating properly
- [ ] CSV export functioning
- [ ] Schema injection working
- [ ] Data privacy compliant
- [ ] Error handling in place
- [ ] Monitoring alerts configured

### Testing Checklist

- [ ] View events tracked on image load
- [ ] Download events tracked on download click
- [ ] Interaction events tracked on user action
- [ ] Performance metrics match actual performance
- [ ] SEO metrics reflect search data
- [ ] Report shows correct totals
- [ ] CSV export valid and complete
- [ ] Analytics dashboard displays correctly
- [ ] Mobile view working properly
- [ ] No JavaScript errors in console
- [ ] localStorage quota not exceeded
- [ ] Privacy settings respected

### Deployment Checklist

- [ ] All code minified for production
- [ ] Analytics endpoints have correct domain
- [ ] Error logging configured for production
- [ ] User consent banner implemented
- [ ] Privacy policy updated
- [ ] Analytics documentation published
- [ ] Team trained on analytics system
- [ ] Monitoring alerts configured
- [ ] Backup/disaster recovery plan ready
- [ ] Analytics retention policy defined

---

## Debug Guide

### Problem: Events Not Being Tracked

**Symptoms**:
- No events in localStorage
- Analytics report is empty
- CSV export has no data

**Diagnosis**:
```javascript
// Check if tracking is initialized
console.log('Tracking initialized:', window.analyticsTracking);

// Check if events are stored
const events = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
console.log('Stored events:', events.length);

// Check if tracking is enabled
if (!navigator.onLine) {
  console.warn('No internet connection');
}

// Check browser console for errors
console.log('Errors in console:', true);
```

**Solutions**:
1. Ensure `initializeAnalyticsTracking()` is called before tracking events
2. Check that events are being fired (add console.log to event handlers)
3. Verify localStorage is not full (clear old data)
4. Check browser privacy settings (don't block localStorage)
5. Ensure user has given consent for analytics

### Problem: Inaccurate Performance Metrics

**Symptoms**:
- Performance grades seem wrong
- Metrics don't match actual performance
- Improvements calculating incorrectly

**Diagnosis**:
```javascript
// Verify Core Web Vitals measurement
const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
console.log('LCP entries:', lcpEntries);

const clsEntries = performance.getEntriesByType('layout-shift');
console.log('CLS entries:', clsEntries);

// Check resource timing
const resourceEntries = performance.getEntriesByType('resource');
console.log('Resource entries:', resourceEntries);

// Verify calculations
const metrics = optimizer.calculateImagePerformanceMetrics('product-001', {
  lcp: 2100,
  cls: 0.08,
  inp: 180
});
console.log('Calculated metrics:', metrics);
```

**Solutions**:
1. Use real measurements from Performance API instead of estimates
2. Allow time for Core Web Vitals to populate (they're cumulative)
3. Clear performance buffer if data is stale
4. Use multiple measurements and average them
5. Validate measurements are within expected ranges

### Problem: CSV Export Not Working

**Symptoms**:
- CSV file downloads but is empty
- CSV file is corrupted
- Wrong data in CSV

**Diagnosis**:
```javascript
// Test CSV generation directly
const events = [
  { eventType: 'view', imageId: 'test', timestamp: Date.now() }
];

const csv = optimizer.exportAnalyticsToCSV('test', events);
console.log('CSV output:', csv);

// Check if data looks correct
console.log('CSV length:', csv.length);
console.log('Has headers:', csv.includes('Date'));

// Test file download
const link = document.createElement('a');
link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
link.download = 'test.csv';
console.log('Download link:', link.href);
```

**Solutions**:
1. Ensure events array is not empty before exporting
2. Verify CSV format has proper headers and data rows
3. Check that special characters are properly escaped
4. Use proper MIME type for CSV download
5. Test in different browsers (some have download restrictions)

### Problem: Analytics Dashboard Not Displaying

**Symptoms**:
- Dashboard HTML not showing
- Styling not applied
- Data not populated

**Diagnosis**:
```javascript
// Check if DOM element exists
const dashboard = document.getElementById('analytics-dashboard');
console.log('Dashboard element:', dashboard);

// Check CSS classes applied
console.log('CSS classes:', document.querySelectorAll('.analytics-dashboard').length);

// Check if data is available
const events = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
console.log('Available events:', events.length);

// Check for JavaScript errors
console.error('Check console for errors');
```

**Solutions**:
1. Verify HTML container element with ID 'analytics-dashboard' exists
2. Check that CSS file is loaded (check Network tab)
3. Ensure analytics data is collected before rendering dashboard
4. Check browser console for JavaScript errors
5. Verify CSS class names match between HTML and stylesheet

### Problem: SEO Metrics Seem Incorrect

**Symptoms**:
- SEO score is always the same
- CTR calculations wrong
- Traffic estimates unrealistic

**Diagnosis**:
```javascript
// Verify SEO data source
async function checkSEOData(imageId) {
  try {
    const response = await fetch(`/api/seo/image/${imageId}`);
    const data = await response.json();
    console.log('SEO data from API:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch SEO data:', error);
    return null;
  }
}

// Test SEO calculation
const seoImpact = optimizer.measureSEOImpact('product-001', {
  searchImpressions: 1250,
  searchClicks: 85,
  averageRank: 4.5,
  ctr: 6.8
});
console.log('Calculated SEO impact:', seoImpact);
```

**Solutions**:
1. Ensure SEO data is coming from actual search analytics (Google Search Console)
2. Allow time for data to accumulate (minimum 30 days recommended)
3. Verify rank, impressions, and clicks are accurate
4. Check that calculation formulas match expected values
5. Compare with Google Search Console data to validate

---

## Integration Examples

### Integration with React

```javascript
import { useEffect, useState } from 'react';

function ProductImage({ imageId, src }) {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      // Track view
      const viewEvent = window.optimizer.trackImageView(imageId, {
        duration: 5000,
        viewportPosition: 'above-fold',
        deviceType: 'desktop',
        loadTime: 850,
        renderTime: 320
      });
      
      // Calculate metrics
      const perfMetrics = window.optimizer.calculateImagePerformanceMetrics(imageId, {
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
      
      setMetrics(perfMetrics);
    };
    
    img.src = src;
  }, [imageId, src]);
  
  return (
    <div>
      <img src={src} alt={imageId} />
      {metrics && (
        <div className="analytics-card">
          <p>Performance Grade: {metrics.performance.grade}</p>
          <p>Load Time: {metrics.imageMetrics.loadTime}ms</p>
        </div>
      )}
    </div>
  );
}
```

### Integration with Vue

```vue
<template>
  <div class="product-image">
    <img :src="src" @load="onImageLoad" />
    <div v-if="metrics" class="analytics-card">
      <p>Performance Grade: {{ metrics.performance.grade }}</p>
      <p>Load Time: {{ metrics.imageMetrics.loadTime }}ms</p>
    </div>
  </div>
</template>

<script>
export default {
  props: ['imageId', 'src'],
  data() {
    return {
      metrics: null
    };
  },
  methods: {
    onImageLoad() {
      // Track view
      this.$optimizer.trackImageView(this.imageId, {
        duration: 5000,
        viewportPosition: 'above-fold',
        deviceType: 'desktop',
        loadTime: 850,
        renderTime: 320
      });
      
      // Calculate metrics
      this.metrics = this.$optimizer.calculateImagePerformanceMetrics(this.imageId, {
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
    }
  }
};
</script>
```

### Integration with Backend

```javascript
// Send analytics to backend periodically
function syncAnalyticsToBackend() {
  const events = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
  
  if (events.length === 0) return;
  
  fetch('/api/analytics/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      events: events,
      timestamp: Date.now(),
      sessionId: localStorage.getItem('sessionId')
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Clear local events after successful sync
      localStorage.removeItem('analyticsEvents');
      console.log('Synced', events.length, 'events to backend');
    }
  })
  .catch(error => console.error('Sync failed:', error));
}

// Sync every 5 minutes
setInterval(syncAnalyticsToBackend, 300000);

// Also sync on page unload
window.addEventListener('beforeunload', syncAnalyticsToBackend);
```

---

## Conclusion

This implementation guide provides step-by-step instructions for deploying and using the Part 3.6 analytics system. Follow the quick start for immediate implementation, use common tasks for specific features, and refer to checklists for quality assurance.

For detailed API documentation, see the main Part 3.6 documentation.
