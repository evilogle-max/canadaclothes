/**
 * filepath: src/js/performance-optimizer.js
 * Core Web Vitals Optimization for 2026 SEO
 * 
 * Targets:
 * - INP (Interaction to Next Paint): <200ms
 * - LCP (Largest Contentful Paint): <2.5s
 * - CLS (Cumulative Layout Shift): <0.1
 */

export class PerformanceOptimizer {
  constructor() {
    this.metrics = {
      inp: null,
      lcp: null,
      cls: null
    };
    this.observers = new Map();
  }

  /**
   * Initialize Core Web Vitals monitoring
   * Reports metrics to analytics for visibility
   */
  initWebVitalsMonitoring() {
    // INP: Interaction to Next Paint
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > this.metrics.inp || !this.metrics.inp) {
          this.metrics.inp = entry.duration;
          this.logMetric('INP', entry.duration);
          
          // Alert if INP exceeds 200ms
          if (entry.duration > 200) {
            console.warn(`⚠️ INP exceeded 200ms: ${entry.duration.toFixed(0)}ms`);
          }
        }
      }
    });

    try {
      observer.observe({ type: 'first-input', buffered: true });
      observer.observe({ type: 'longest-interaction-to-next-paint', buffered: true });
      this.observers.set('inp', observer);
    } catch (e) {
      console.debug('INP observer not supported');
    }

    // LCP: Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
      this.logMetric('LCP', this.metrics.lcp);
      
      if (this.metrics.lcp > 2500) {
        console.warn(`⚠️ LCP exceeded 2.5s: ${(this.metrics.lcp / 1000).toFixed(2)}s`);
      }
    });

    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.set('lcp', lcpObserver);
    } catch (e) {
      console.debug('LCP observer not supported');
    }

    // CLS: Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.metrics.cls = clsValue;
          this.logMetric('CLS', clsValue);
          
          if (clsValue > 0.1) {
            console.warn(`⚠️ CLS exceeded 0.1: ${clsValue.toFixed(3)}`);
          }
        }
      }
    });

    try {
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.set('cls', clsObserver);
    } catch (e) {
      console.debug('CLS observer not supported');
    }
  }

  /**
   * Debounce function calls to reduce INP
   * Used for cart interactions, quantity changes
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in ms (default 300ms for INP <200ms)
   */
  debounce(fn, delay = 150) {
    let timeoutId;
    return function debounced(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  /**
   * Throttle function calls (for scroll, resize events)
   * @param {Function} fn - Function to throttle
   * @param {number} interval - Minimum interval between calls (ms)
   */
  throttle(fn, interval = 100) {
    let lastTime = 0;
    return function throttled(...args) {
      const now = Date.now();
      if (now - lastTime >= interval) {
        lastTime = now;
        fn(...args);
      }
    };
  }

  /**
   * Optimize images for LCP
   * Add height/width attributes to prevent CLS
   * @param {Element} img - Image element
   * @param {number} width - Image width
   * @param {number} height - Image height
   */
  setImageDimensions(img, width = 400, height = 500) {
    img.style.aspectRatio = `${width} / ${height}`;
    img.setAttribute('width', width);
    img.setAttribute('height', height);
  }

  /**
   * Prevent layout shift from modal/drawer
   * Reserve space before content loads
   * @param {Element} container - Container to add spacing to
   * @param {number} height - Height in pixels
   */
  reserveSpace(container, height = 300) {
    const spacer = document.createElement('div');
    spacer.style.height = `${height}px`;
    spacer.style.transition = 'all 0.3s ease';
    spacer.setAttribute('aria-hidden', 'true');
    container.appendChild(spacer);
    return spacer;
  }

  /**
   * Request Idle Callback (for non-critical tasks)
   * Reduces main thread blocking
   */
  runWhenIdle(fn) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(fn);
    } else {
      // Fallback for browsers without rIC
      setTimeout(fn, 0);
    }
  }

  /**
   * Batch DOM updates to reduce reflows/repaints
   * @param {Function} updates - Function containing DOM updates
   */
  batchDOMUpdates(updates) {
    if (document.hidden) {
      updates();
    } else {
      requestAnimationFrame(() => {
        updates();
      });
    }
  }

  /**
   * Log performance metric
   * Can be sent to analytics service
   */
  logMetric(metricName, value) {
    const logValue = metricName === 'LCP' ? `${(value / 1000).toFixed(2)}s` : 
                     metricName === 'CLS' ? value.toFixed(3) :
                     `${value.toFixed(0)}ms`;
    
    console.debug(`📊 ${metricName}: ${logValue}`);

    // Send to analytics (example: Google Analytics)
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        'web_vitals_metric': metricName,
        'web_vitals_value': value
      });
    }
  }

  /**
   * Get current metrics
   * @returns {Object} Current metric values
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Cleanup observers (call on page unload)
   */
  dispose() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Initialize globally
window.PerformanceOptimizer = PerformanceOptimizer;
