/**
 * filepath: src/js/image-optimizer.js
 * Image optimization for LCP (<2.5s) and visual SEO
 * 
 * Specifications:
 * - Min dimension: 1200x1200px
 * - Ideal dimension: 2400x2400px (for 2x DPI)
 * - Formats: AVIF (primary), WebP (fallback), JPEG/PNG (legacy)
 * - Lazy load non-critical images
 * - Add width/height attributes (prevents CLS)
 */

export class ImageOptimizer {
  constructor() {
    this.supportedFormats = this.detectFormatSupport();
    this.lazyLoadImages = [];
  }

  /**
   * Detect browser support for modern image formats
   * Returns object with boolean values for each format
   */
  detectFormatSupport() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    return {
      avif: this.canvasSupportsFormat('image/avif', canvas),
      webp: this.canvasSupportsFormat('image/webp', canvas),
      heic: this.canvasSupportsFormat('image/heic', canvas),
      heif: this.canvasSupportsFormat('image/heif', canvas)
    };
  }

  /**
   * Helper to test format support via canvas
   */
  canvasSupportsFormat(mimeType, canvas) {
    try {
      return canvas.toDataURL(mimeType).includes(mimeType.split('/')[1]);
    } catch {
      return false;
    }
  }

  /**
   * Get optimized image URL based on browser support
   * Priority: AVIF > WebP > Original
   * 
   * @param {string} baseUrl - Base image URL (without extension)
   * @param {number} width - Image width in px
   * @param {number} height - Image height in px
   * @returns {string} Optimized image URL
   */
  getOptimizedUrl(baseUrl, width = 1200, height = 1200) {
    if (this.supportedFormats.avif && baseUrl.includes('cdn')) {
      return `${baseUrl}?format=avif&w=${width}&h=${height}&auto=format&q=80`;
    }
    if (this.supportedFormats.webp && baseUrl.includes('cdn')) {
      return `${baseUrl}?format=webp&w=${width}&h=${height}&auto=format&q=80`;
    }
    return baseUrl;
  }

  /**
   * Generate responsive srcset for images
   * Google Lens spec: min 1200x1200px, ideal 2400x2400px
   * 
   * @param {string} baseUrl - Base image URL
   * @param {number} width - Original width
   * @param {number} height - Original height
   * @returns {string} srcset attribute value
   */
  generateSrcset(baseUrl, width = 1200, height = 1200) {
    const widths = [400, 600, 800, 1200, 1600, 2400];
    const srcset = widths
      .filter(w => w <= width)
      .map(w => {
        const h = Math.round(height * (w / width));
        const url = this.getOptimizedUrl(baseUrl, w, h);
        return `${url} ${w}w`;
      })
      .join(', ');
    
    return srcset;
  }

  /**
   * Generate sizes attribute for responsive images
   * Optimized for product images
   */
  generateSizes() {
    return `
      (max-width: 640px) 100vw,
      (max-width: 1024px) 50vw,
      (max-width: 1536px) 33vw,
      25vw
    `.trim();
  }

  /**
   * Initialize lazy loading for non-critical images
   * Use Intersection Observer to improve LCP
   * 
   * Doesn't lazy-load images above-the-fold
   * Only lazy-loads below-the-fold images
   */
  initLazyLoading() {
    // Don't lazy-load hero/LCP images
    const lazyImages = document.querySelectorAll('img[data-lazy="true"]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // Load high-quality version
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
          
          // Load srcset for responsive images
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
          }
          
          img.removeAttribute('data-lazy');
          observer.unobserve(img);
          
          // Add loaded class for animations
          img.addEventListener('load', () => {
            img.classList.add('loaded');
          });
        }
      });
    }, {
      rootMargin: '50px' // Start loading 50px before entering viewport
    });

    lazyImages.forEach(img => observer.observe(img));
    return observer;
  }

  /**
   * Set explicit dimensions on image to prevent CLS
   * Must use aspect-ratio + width/height attributes
   * 
   * @param {Element} img - Image element
   * @param {number} width - Image width
   * @param {number} height - Image height
   */
  setExplicitDimensions(img, width = 1200, height = 1200) {
    // Set width and height attributes (required for CLS prevention)
    img.setAttribute('width', width);
    img.setAttribute('height', height);
    
    // Set aspect-ratio CSS (modern browsers)
    img.style.aspectRatio = `${width} / ${height}`;
    
    // Ensure image fills container while maintaining aspect ratio
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    
    // Prevent image distortion
    img.style.objectFit = 'cover';
    img.style.objectPosition = 'center';
  }

  /**
   * Optimize product image for 5+ angles per product
   * Google Lens spec: 1200x1200px min, 2400x2400px ideal
   * Add descriptive alt text and filename
   * 
   * @param {Object} config - Image configuration
   * @returns {HTMLImageElement} Configured image element
   */
  createProductImage(config) {
    const {
      src,
      alt = 'Product image',
      width = 1200,
      height = 1200,
      isHero = false, // Hero images shouldn't be lazy-loaded
      angle = '360' // e.g., 'front', 'back', 'detail', '360', 'video'
    } = config;

    const img = document.createElement('img');
    
    // Set semantic alt text for SEO
    // Format: "Product name + color + material + view"
    img.alt = alt;
    
    // Set explicit dimensions (CLS prevention)
    this.setExplicitDimensions(img, width, height);
    
    // Set loading strategy
    img.loading = isHero ? 'eager' : 'lazy';
    
    // Set decoding to async (improves LCP)
    img.decoding = 'async';
    
    // Set source and srcset (responsive images)
    if (isHero) {
      img.src = this.getOptimizedUrl(src, width, height);
      img.srcset = this.generateSrcset(src, width, height);
    } else {
      // Use data-src for lazy loading
      img.dataset.src = this.getOptimizedUrl(src, width, height);
      img.dataset.srcset = this.generateSrcset(src, width, height);
      img.setAttribute('data-lazy', 'true');
    }
    
    img.sizes = this.generateSizes();
    
    // Add angle attribute for structured data
    img.dataset.angle = angle;
    
    // Add loading placeholder (prevents CLS)
    img.classList.add('product-image', `angle-${angle}`);
    
    return img;
  }

  /**
   * Preload critical images for LCP
   * Call for hero images and above-the-fold products
   * 
   * @param {string} url - Image URL to preload
   * @param {string} type - Image type (image/avif, image/webp, image/jpeg)
   */
  preloadImage(url, type = 'image/webp') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.type = type;
    link.importance = 'high';
    document.head.appendChild(link);
  }

  /**
   * Preload multiple images with priority
   * AVIF > WebP > JPEG fallback
   * 
   * @param {Array} urls - Array of image URLs
   */
  preloadCriticalImages(urls = []) {
    urls.slice(0, 3).forEach((url, index) => {
      // Stagger preloads to avoid network congestion
      setTimeout(() => {
        if (this.supportedFormats.avif) {
          this.preloadImage(`${url}?format=avif`, 'image/avif');
        } else if (this.supportedFormats.webp) {
          this.preloadImage(`${url}?format=webp`, 'image/webp');
        } else {
          this.preloadImage(url, 'image/jpeg');
        }
      }, index * 100);
    });
  }

  /**
   * Generate image URLs for multiple angles
   * Required: front, back, detail, flat lay, lifestyle
   * Nice to have: 360 view, video thumbnail
   * 
   * @param {string} productId - Product ID
   * @returns {Object} Angle URLs
   */
  generateAngleUrls(productId) {
    const cdnBase = 'https://cdn.canadaclothes.ca'; // Replace with actual CDN
    
    return {
      front: `${cdnBase}/products/${productId}/front.jpg`,
      back: `${cdnBase}/products/${productId}/back.jpg`,
      detail: `${cdnBase}/products/${productId}/detail.jpg`,
      flatLay: `${cdnBase}/products/${productId}/flat-lay.jpg`,
      lifestyle: `${cdnBase}/products/${productId}/lifestyle.jpg`,
      '360': `${cdnBase}/products/${productId}/360.jpg`,
      video: `${cdnBase}/products/${productId}/video-thumb.jpg`
    };
  }

  /**
   * Create image gallery with optimized images
   * For product detail pages (multiple angles)
   * 
   * @param {string} productId - Product ID
   * @param {string} productName - Product name for alt text
   * @param {string} color - Color variant
   * @returns {HTMLElement} Gallery container
   */
  createOptimizedGallery(productId, productName, color) {
    const gallery = document.createElement('div');
    gallery.className = 'product-gallery';
    gallery.setAttribute('role', 'region');
    gallery.setAttribute('aria-label', `${productName} images - ${color}`);
    
    const angles = this.generateAngleUrls(productId);
    const angles_arr = Object.entries(angles);
    
    angles_arr.forEach(([angle, src], index) => {
      const figure = document.createElement('figure');
      figure.className = `gallery-item angle-${angle}`;
      
      const img = this.createProductImage({
        src,
        alt: `${productName} in ${color} - ${angle} view`,
        width: 1200,
        height: 1200,
        isHero: index === 0, // First image is hero/LCP
        angle
      });
      
      figure.appendChild(img);
      gallery.appendChild(figure);
      
      // Preload first image for LCP
      if (index === 0) {
        this.preloadImage(this.getOptimizedUrl(src, 1200, 1200), 'image/webp');
      }
    });
    
    return gallery;
  }

  /**
   * Get image metadata for JSON-LD (Google Lens)
   * @param {string} url - Image URL
   * @returns {Object} Image metadata
   */
  getImageMetadata(url) {
    return {
      '@type': 'ImageObject',
      'url': url,
      'width': 1200,
      'height': 1200
    };
  }

  /**
   * ============================================================================
   * PART 3: IMAGE/VISUAL SEO - ADVANCED OPTIMIZATION
   * ============================================================================
   */

  /**
   * Generate semantic image filename for SEO
   * Format: product-name-color-material-view.webp
   * Example: navy-cashmere-sweater-wool-blend-front-view.webp
   * 
   * Benefits:
   * - Google Lens uses filenames for context
   * - Pinterest recognizes product details
   * - Accessibility: descriptive for screen readers
   * - SEO: keyword-rich filename in image index
   * 
   * @param {Object} productInfo - Product information
   * @returns {string} Semantic filename
   */
  generateSemanticFilename(productInfo) {
    const {
      productName = 'product',
      color = 'default',
      material = 'fabric',
      view = 'front'
    } = productInfo;

    // Remove special characters, convert to lowercase, replace spaces with hyphens
    const sanitize = (str) => str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    const filename = `${sanitize(productName)}-${sanitize(color)}-${sanitize(material)}-${sanitize(view)}`;
    return `${filename}.webp`; // Default to WebP, AVIF will be served by CDN
  }

  /**
   * Generate comprehensive alt text for images
   * Format: Product Name, Color, Material, View, Context
   * Length: 100-150 characters (optimal for Google Lens)
   * 
   * @param {Object} productInfo - Product information
   * @returns {string} Comprehensive alt text
   */
  generateAltText(productInfo) {
    const {
      productName = 'Product',
      color = '',
      material = '',
      view = 'front view',
      size = '',
      contextual = '' // Additional context (e.g., "flat lay", "styled", "detail")
    } = productInfo;

    // Build alt text components
    const parts = [productName];
    if (color) parts.push(`in ${color}`);
    if (material) parts.push(`made from ${material}`);
    parts.push(`${view}${contextual ? `, ${contextual}` : ''}`);

    const altText = parts.join(' ');

    // Google Lens optimal: 100-150 characters
    if (altText.length > 150) {
      console.warn(`Alt text exceeds 150 chars: ${altText.length}`, altText);
    }

    return altText;
  }

  /**
   * Create picture element with AVIF/WebP/JPEG fallback
   * Modern approach: Use <picture> element instead of srcset
   * Allows explicit format control and browser fallback
   * 
   * @param {Object} config - Picture configuration
   * @returns {HTMLPictureElement} Picture element with sources
   */
  createPictureElement(config) {
    const {
      avifUrl,
      webpUrl,
      jpegUrl,
      alt = 'Product image',
      width = 1200,
      height = 1200,
      sizes = '100vw',
      loading = 'lazy',
      isHero = false
    } = config;

    const picture = document.createElement('picture');

    // AVIF source (highest priority, best compression)
    if (avifUrl) {
      const avifSource = document.createElement('source');
      avifSource.type = 'image/avif';
      avifSource.srcset = avifUrl;
      avifSource.sizes = sizes;
      picture.appendChild(avifSource);
    }

    // WebP source (second priority, good compression)
    if (webpUrl) {
      const webpSource = document.createElement('source');
      webpSource.type = 'image/webp';
      webpSource.srcset = webpUrl;
      webpSource.sizes = sizes;
      picture.appendChild(webpSource);
    }

    // JPEG fallback (all browsers support)
    const img = document.createElement('img');
    img.src = jpegUrl || webpUrl || avifUrl;
    img.alt = alt;
    img.width = width;
    img.height = height;
    img.loading = loading;
    img.decoding = 'async';
    img.style.aspectRatio = `${width} / ${height}`;
    picture.appendChild(img);

    return picture;
  }

  /**
   * Generate product image URLs for all required views
   * Google Lens requirement: 5+ angles per product
   * Minimum: front, back, detail, flat lay, lifestyle
   * Ideal: + 360 view, close-up, video thumbnail
   * 
   * @param {Object} productConfig - Product configuration
   * @returns {Object} All image URLs by view/angle
   */
  generateProductImages(productConfig) {
    const {
      cdnBaseUrl = 'https://cdn.canadaclothes.ca',
      productId,
      productName = 'product',
      color = 'default',
      material = 'fabric',
      viewAngles = ['front', 'back', 'detail', 'flatLay', 'lifestyle', '360', 'closeUp', 'video']
    } = productConfig;

    const images = {};

    viewAngles.forEach(angle => {
      // Generate semantic filename
      const filename = this.generateSemanticFilename({
        productName,
        color,
        material,
        view: angle
      });

      // CDN URL structure: /products/{productId}/{filename}
      images[angle] = {
        // Original/master image (highest quality)
        master: `${cdnBaseUrl}/products/${productId}/${filename}`,
        
        // Responsive variants (different widths)
        variants: {
          mobile: `${cdnBaseUrl}/products/${productId}/${filename}?w=400&h=500&q=85`,
          tablet: `${cdnBaseUrl}/products/${productId}/${filename}?w=600&h=750&q=85`,
          desktop: `${cdnBaseUrl}/products/${productId}/${filename}?w=1200&h=1500&q=80`,
          '2x': `${cdnBaseUrl}/products/${productId}/${filename}?w=2400&h=3000&q=80` // 2x DPI for high-res
        },
        
        // Optimized formats
        formats: {
          avif: `${cdnBaseUrl}/products/${productId}/${filename}?format=avif&w=1200&q=80`,
          webp: `${cdnBaseUrl}/products/${productId}/${filename}?format=webp&w=1200&q=80`,
          jpeg: `${cdnBaseUrl}/products/${productId}/${filename}?format=jpeg&w=1200&q=80`
        },
        
        // Google Lens specifications
        googleLens: {
          min: `${cdnBaseUrl}/products/${productId}/${filename}?w=1200&h=1500&q=85`, // Minimum 1200x1200
          ideal: `${cdnBaseUrl}/products/${productId}/${filename}?w=2400&h=3000&q=80` // Ideal 2400x2400
        }
      };
    });

    return images;
  }

  /**
   * Create optimized <picture> element for product image
   * Handles AVIF/WebP/JPEG with responsive sizing
   * 
   * @param {Object} config - Picture configuration
   * @returns {HTMLPictureElement} Fully optimized picture element
   */
  createOptimizedProductImage(config) {
    const {
      productName = 'Product',
      color = 'default',
      material = 'fabric',
      view = 'front',
      baseUrl = 'https://via.placeholder.com/1200x1500',
      width = 1200,
      height = 1500,
      isHero = false
    } = config;

    // Generate alt text
    const altText = this.generateAltText({
      productName,
      color,
      material,
      view: `${view} view`
    });

    // Create picture element with proper format fallback
    return this.createPictureElement({
      avifUrl: `${baseUrl}?format=avif&w=1200&q=80`,
      webpUrl: `${baseUrl}?format=webp&w=1200&q=80`,
      jpegUrl: baseUrl,
      alt: altText,
      width,
      height,
      sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw',
      loading: isHero ? 'eager' : 'lazy'
    });
  }

  /**
   * Pinterest Pin optimization
   * Pinterest specs:
   * - Min 1200x1500px (portrait, 2:3 aspect ratio)
   * - Alt text: 125 characters max, descriptive
   * - Description: Product name + color + material + price (optional)
   * - Rich Pins: Structured data with product details
   * 
   * @param {Object} productInfo - Product information
   * @returns {Object} Pinterest optimized metadata
   */
  generatePinterestMetadata(productInfo) {
    const {
      productName = 'Product',
      color = '',
      material = '',
      price = '',
      imageUrl = '',
      productUrl = ''
    } = productInfo;

    // Pinterest alt text: 125 char max (Pinterest's limit)
    const altText = this.generateAltText(productInfo).slice(0, 125);

    // Pinterest description: Name + Color + Material
    const description = [productName, color && `${color}`, material && `${material}`]
      .filter(Boolean)
      .join(' | ');

    return {
      // Meta tags for Pinterest
      'og:title': productName,
      'og:description': description,
      'og:image': imageUrl,
      'og:image:type': 'image/webp', // Use optimized format
      'og:image:width': '1200',
      'og:image:height': '1500',
      'og:url': productUrl,
      
      // Pinterest-specific metadata
      'pinterest:media': imageUrl,
      'pinterest:description': `${description}${price ? ` - ${price}` : ''}`,
      
      // Rich Pin structured data
      'product:availability': 'in stock',
      'product:price:amount': price || '0',
      'product:price:currency': 'CAD',
      'product:category': 'Fashion > Apparel',
      
      // Alt text for accessibility
      'image:alt': altText
    };
  }

  /**
   * Google Merchant Center image specifications
   * Ensures product images meet Google's requirements for:
   * - Google Shopping
   * - Google Images
   * - Google Lens
   * 
   * Specs:
   * - Size: Min 100x100px, recommended 1200x1200px
   * - Aspect ratio: Preferred 1:1 (square)
   * - Formats: JPG, PNG, GIF, WebP, AVIF
   * - Alt text: Required for accessibility
   * 
   * @param {Object} productInfo - Product information
   * @returns {Object} Google Merchant Center image spec
   */
  generateGoogleMerchantImage(productInfo) {
    const {
      productName = 'Product',
      color = '',
      material = '',
      imageUrl = '',
      productUrl = ''
    } = productInfo;

    // Alt text optimized for Google Merchant Center
    const altText = this.generateAltText(productInfo);

    return {
      // Required fields
      '@type': 'ImageObject',
      'url': imageUrl,
      'name': productName,
      'alternativeHeadline': `${productName} ${color} ${material}`,
      'description': altText,
      
      // Dimensions (Google specs)
      'width': 1200,
      'height': 1200, // Prefer square for Shopping results
      
      // SEO properties
      'author': 'CanadaClothes.ca',
      'copyrightNotice': '© CanadaClothes.ca',
      
      // Linked product
      'isPartOf': {
        '@type': 'Product',
        'name': productName,
        'url': productUrl
      },
      
      // Format information
      'encodingFormat': 'image/webp', // Preferred format
      'inLanguage': 'en-CA'
    };
  }

  /**
   * Validate image meets Google Lens specifications
   * Google Lens requires minimum 1200x1200px, ideal 2400x2400px
   * 
   * @param {number} width - Image width in pixels
   * @param {number} height - Image height in pixels
   * @returns {Object} Validation result with warnings
   */
  validateGoogleLensSpecs(width, height) {
    const specs = {
      meetsMinimum: width >= 1200 && height >= 1200,
      isIdeal: width >= 2400 && height >= 2400,
      warnings: []
    };

    if (width < 1200 || height < 1200) {
      specs.warnings.push(`⚠️ Below Google Lens minimum (1200x1200px): ${width}x${height}px`);
    }
    if (width < 2400 || height < 2400) {
      specs.warnings.push(`ℹ️ Below ideal size (2400x2400px): ${width}x${height}px`);
    }

    return specs;
  }

  /**
   * Calculate image quality threshold
   * Balance between file size and visual quality
   * 
   * Google's recommendation:
   * - Q=85: Slight quality loss, significant size reduction (recommended for JPEG)
   * - Q=80: Moderate quality loss, major size reduction (recommended for WebP)
   * - Q=75: Noticeable quality loss, very small size (only for thumbnails)
   * 
   * @param {string} format - Image format (jpeg, webp, avif)
   * @param {number} targetFileSize - Target file size in KB
   * @returns {number} Recommended quality setting (0-100)
   */
  calculateOptimalQuality(format = 'webp', targetFileSize = 50) {
    // Quality/size ratios for different formats
    const qualityThresholds = {
      jpeg: { quality: 85, avgKB: 65 }, // JPEG: higher quality needed
      webp: { quality: 80, avgKB: 50 },  // WebP: good balance
      avif: { quality: 75, avgKB: 35 }   // AVIF: aggressive compression
    };

    const threshold = qualityThresholds[format.toLowerCase()] || qualityThresholds.webp;
    
    // Adjust quality based on target file size
    if (targetFileSize < threshold.avgKB) {
      return Math.max(60, threshold.quality - 10);
    } else if (targetFileSize > threshold.avgKB * 1.5) {
      return Math.min(95, threshold.quality + 5);
    }

    return threshold.quality;
  }

  /**
   * Generate image optimization report
   * Useful for auditing product images against SEO standards
   * 
   * @param {Object} imageData - Image data to analyze
   * @returns {Object} Detailed optimization report
   */
  generateOptimizationReport(imageData) {
    const {
      productName = 'Product',
      width = 0,
      height = 0,
      format = 'jpeg',
      fileSizeKB = 0,
      altText = '',
      hasAVIF = false,
      hasWebP = false
    } = imageData;

    const lensSpecs = this.validateGoogleLensSpecs(width, height);
    const quality = this.calculateOptimalQuality(format, fileSizeKB);

    return {
      product: productName,
      dimensions: { width, height, ratio: (width / height).toFixed(2) },
      googleLensCompliant: lensSpecs.meetsMinimum,
      lensWarnings: lensSpecs.warnings,
      fileSize: { current: fileSizeKB, format, quality },
      accessibility: {
        hasAltText: altText.length > 0,
        altTextLength: altText.length,
        altTextOptimal: altText.length >= 50 && altText.length <= 150
      },
      formatOptimization: {
        hasAVIF,
        hasWebP,
        recommendedFormat: hasAVIF ? 'AVIF' : hasWebP ? 'WebP' : 'JPEG'
      },
      score: {
        quality: (lensSpecs.meetsMinimum ? 80 : 50) + (altText.length > 0 ? 15 : 0) + (hasWebP ? 3 : 0) + (hasAVIF ? 2 : 0),
        recommendation: lensSpecs.isIdeal && altText.length >= 100 && hasAVIF ? 'Excellent' : 'Good'
      }
    };
  }

  /**
   * Create product gallery HTML with multi-angle images
   * Generates thumbnail strips with full-size viewer
   * 
   * @param {Object} config - Gallery configuration
   * @param {string} config.productId - Product ID
   * @param {string} config.productName - Product name
   * @param {Array} config.images - Image objects with view, url, alt
   * @param {string} config.color - Product color
   * @param {string} config.material - Product material
   * @param {boolean} config.enableZoom - Enable zoom functionality
   * @returns {string} Gallery HTML
   */
  createProductGallery(config = {}) {
    const {
      productId = 'product-1',
      productName = 'Product',
      images = [],
      color = '',
      material = '',
      enableZoom = true
    } = config;

    if (!images || images.length === 0) {
      return this.createEmptyGallery(productName);
    }

    const mainImage = images[0];
    const mainImageId = `gallery-main-${productId}`;
    const galleryId = `gallery-${productId}`;

    // Generate semantic alt text for each image
    const imagesWithAlt = images.map((img, idx) => ({
      ...img,
      alt: img.alt || this.generateAltText({
        productName,
        color,
        material,
        view: img.view || `View ${idx + 1}`
      })
    }));

    // Generate thumbnail HTML
    const thumbnailsHTML = imagesWithAlt
      .map((img, idx) => `
        <button 
          class="gallery-thumb" 
          data-gallery-id="${galleryId}"
          data-image-index="${idx}"
          aria-label="View ${img.view || `angle ${idx + 1}`}"
          title="${img.alt}"
          style="background-image: url('${img.thumbnailUrl || img.url}?w=80&h=100&q=75'); aspect-ratio: 400/500;"
        ></button>
      `)
      .join('');

    // Main image picture element
    const mainPicture = this.createPictureElement({
      avifUrl: mainImage.avifUrl || mainImage.url,
      webpUrl: mainImage.webpUrl || mainImage.url,
      jpegUrl: mainImage.jpegUrl || mainImage.url,
      alt: mainImage.alt,
      loading: 'eager',
      productId
    });

    return `
      <div class="product-gallery" id="${galleryId}" data-product-id="${productId}">
        <div class="gallery-main">
          <div class="gallery-viewport" id="${mainImageId}">
            ${mainPicture}
          </div>
          ${enableZoom ? `<div class="gallery-zoom-hint">Click to zoom</div>` : ''}
        </div>
        <div class="gallery-thumbnails">
          ${thumbnailsHTML}
        </div>
        ${images.length > 5 ? `<div class="gallery-count">${images.length} views</div>` : ''}
      </div>
    `;
  }

  /**
   * Create empty gallery placeholder
   * Shows when no images available
   */
  createEmptyGallery(productName = 'Product') {
    const alt = `${productName} product image placeholder`;
    return `
      <div class="product-gallery empty">
        <div class="gallery-main">
          <div class="gallery-placeholder">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
              <path d="M3 15l6-6 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>Image not available</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create gallery thumbnail navigation HTML
   * For standalone thumbnail implementation
   * 
   * @param {Array} images - Image array with view and url
   * @param {string} galleryId - Gallery ID for linking
   * @returns {string} Thumbnail HTML
   */
  createGalleryThumbnails(images = [], galleryId = 'gallery') {
    return `
      <div class="gallery-thumbnails">
        ${images.map((img, idx) => `
          <button 
            class="gallery-thumb${idx === 0 ? ' active' : ''}"
            data-gallery-id="${galleryId}"
            data-image-index="${idx}"
            aria-label="${img.view || `View ${idx + 1}`}"
            style="background-image: url('${img.thumbnailUrl || img.url}?w=80&h=100&q=75');"
          ></button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Generate all product image URLs for gallery
   * Creates optimized variants for all views and formats
   * 
   * @param {Object} config - Image generation config
   * @param {string} config.productId - Product ID
   * @param {string} config.productName - Product name
   * @param {string} config.color - Product color
   * @param {string} config.material - Material/composition
   * @param {Array} config.viewAngles - Array of view names (front, back, etc)
   * @param {string} config.cdnBaseUrl - CDN base URL
   * @returns {Object} Structured image data for gallery
   */
  generateAllProductImages(config = {}) {
    const {
      productId = 'product-1',
      productName = 'Product',
      color = '',
      material = '',
      viewAngles = ['front', 'back', 'detail'],
      cdnBaseUrl = 'https://cdn.canadaclothes.ca'
    } = config;

    const images = {};

    viewAngles.forEach(view => {
      const filename = this.generateSemanticFilename({
        productName,
        color,
        material,
        view
      });

      const baseUrl = `${cdnBaseUrl}/products/${productId}/${filename}`;
      const altText = this.generateAltText({
        productName,
        color,
        material,
        view: `${view} view`
      });

      images[view] = {
        view,
        filename,
        url: baseUrl,
        alt: altText,
        // Responsive variants
        variants: {
          thumbnail: `${baseUrl}?w=80&h=100&q=75`,
          mobile: `${baseUrl}?w=400&h=500&q=80`,
          tablet: `${baseUrl}?w=600&h=750&q=85`,
          desktop: `${baseUrl}?w=1200&h=1500&q=85`,
          retina: `${baseUrl}?w=2400&h=3000&q=85`
        },
        // Format-specific URLs
        formats: {
          avif: `${baseUrl}?format=avif&w=1200&h=1500&q=80`,
          webp: `${baseUrl}?format=webp&w=1200&h=1500&q=80`,
          jpeg: `${baseUrl}?format=jpeg&w=1200&h=1500&q=85`,
          avifLarge: `${baseUrl}?format=avif&w=2400&h=3000&q=80`,
          webpLarge: `${baseUrl}?format=webp&w=2400&h=3000&q=80`,
          jpegLarge: `${baseUrl}?format=jpeg&w=2400&h=3000&q=85`
        },
        // Google Lens specs (minimum 1200x1200px, ideal 2400x2400px)
        googleLens: {
          min: `${baseUrl}?w=1200&h=1500&q=85`,
          ideal: `${baseUrl}?w=2400&h=3000&q=85`,
          validations: {
            minSpecMet: true,
            idealSpecMet: true
          }
        },
        // Pinterest specs (min 1000x1500px, aspect 2:3)
        pinterest: {
          min: `${baseUrl}?w=1000&h=1500&q=85`,
          ideal: `${baseUrl}?w=1200&h=1500&q=85`,
          validations: {
            minAspect: '2:3',
            fileSizeLimitKB: 500
          }
        }
      };
    });

    return images;
  }

  /**
   * Create gallery with zoom functionality
   * Includes modal viewer for detailed inspection
   * 
   * @param {Object} config - Gallery config
   * @param {string} config.productId - Product ID
   * @param {Array} config.images - Image array
   * @param {string} config.productName - Product name
   * @returns {string} Full gallery with modal HTML
   */
  createGalleryWithModal(config = {}) {
    const {
      productId = 'product-1',
      images = [],
      productName = 'Product'
    } = config;

    const modalId = `gallery-modal-${productId}`;
    const galleryHTML = this.createProductGallery(config);

    return `
      ${galleryHTML}
      <div class="gallery-modal" id="${modalId}" style="display: none;">
        <div class="modal-overlay"></div>
        <div class="modal-content">
          <button class="modal-close" aria-label="Close zoom viewer">✕</button>
          <div class="modal-image">
            <img id="${modalId}-image" src="" alt="${productName}" loading="eager">
          </div>
          <div class="modal-controls">
            <button class="modal-prev" aria-label="Previous image">❮</button>
            <span class="modal-counter"><span class="current">1</span> / <span class="total">${images.length}</span></span>
            <button class="modal-next" aria-label="Next image">❯</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create responsive picture element for gallery images
   * Ensures proper format fallback chain
   * 
   * @param {Object} config - Picture element config
   * @param {string} config.avifUrl - AVIF format URL
   * @param {string} config.webpUrl - WebP format URL
   * @param {string} config.jpegUrl - JPEG fallback URL
   * @param {string} config.alt - Alt text
   * @param {boolean} config.loading - eager or lazy
   * @param {string} config.productId - Product ID (for tracking)
   * @returns {string} Picture element HTML
   */
  createPictureElement(config = {}) {
    const {
      avifUrl = '',
      webpUrl = '',
      jpegUrl = '',
      alt = 'Product image',
      loading = 'lazy',
      productId = ''
    } = config;

    const srcset1200 = avifUrl ? `${avifUrl}?w=1200 1200w, ${avifUrl}?w=2400 2400w` : '';
    const srcset2400 = webpUrl ? `${webpUrl}?w=1200 1200w, ${webpUrl}?w=2400 2400w` : '';

    return `
      <picture>
        ${srcset1200 ? `<source type="image/avif" srcset="${srcset1200}">` : ''}
        ${srcset2400 ? `<source type="image/webp" srcset="${srcset2400}">` : ''}
        <img 
          src="${jpegUrl}"
          alt="${alt}"
          loading="${loading}"
          decoding="async"
          width="1200"
          height="1500"
          style="aspect-ratio: 1200/1500;"
          ${productId ? `data-product-id="${productId}"` : ''}
        >
      </picture>
    `;
  }

  /**
   * Initialize gallery thumbnail switcher
   * Handles click events and image switching
   * 
   * @param {string} galleryId - Gallery element ID
   */
  initGalleryThumbnails(galleryId = 'gallery') {
    const gallery = document.getElementById(galleryId);
    if (!gallery) return;

    const thumbnails = gallery.querySelectorAll('.gallery-thumb');
    const mainViewport = gallery.querySelector('.gallery-viewport');

    if (!mainViewport || thumbnails.length === 0) return;

    thumbnails.forEach((thumb, index) => {
      thumb.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchGalleryImage(galleryId, index);
      });

      // Keyboard navigation
      thumb.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' && index < thumbnails.length - 1) {
          e.preventDefault();
          this.switchGalleryImage(galleryId, index + 1);
          thumbnails[index + 1].focus();
        } else if (e.key === 'ArrowLeft' && index > 0) {
          e.preventDefault();
          this.switchGalleryImage(galleryId, index - 1);
          thumbnails[index - 1].focus();
        }
      });
    });
  }

  /**
   * Switch gallery to specific image
   * Updates main image and thumbnail active state
   * 
   * @param {string} galleryId - Gallery ID
   * @param {number} imageIndex - Image index to display
   */
  switchGalleryImage(galleryId, imageIndex) {
    const gallery = document.getElementById(galleryId);
    if (!gallery) return;

    const thumbnails = gallery.querySelectorAll('.gallery-thumb');
    const mainViewport = gallery.querySelector('.gallery-viewport');

    if (!mainViewport || imageIndex < 0 || imageIndex >= thumbnails.length) return;

    // Update active thumbnail
    thumbnails.forEach((thumb, idx) => {
      thumb.classList.toggle('active', idx === imageIndex);
    });

    // Update main image (lazy load new image)
    const selectedThumb = thumbnails[imageIndex];
    const imageUrl = selectedThumb.style.backgroundImage.match(/url\("(.+?)"\)/)?.[1];
    
    if (imageUrl) {
      const fullUrl = imageUrl.replace(/[?&]w=\d+[^"]*/g, '?w=1200&h=1500&q=85');
      mainViewport.innerHTML = `
        <img 
          src="${fullUrl}"
          alt="${selectedThumb.getAttribute('title')}"
          loading="lazy"
          decoding="async"
          width="1200"
          height="1500"
          style="aspect-ratio: 1200/1500; cursor: zoom-in;"
        >
      `;
    }
  }

  /**
   * Create gallery zoom modal functionality
   * Opens full-screen viewer with keyboard navigation
   * 
   * @param {string} galleryId - Gallery ID
   * @param {Array} images - Image URLs
   */
  initGalleryZoom(galleryId, images = []) {
    const gallery = document.getElementById(galleryId);
    if (!gallery || !images.length) return;

    const modalId = `gallery-modal-${galleryId.replace('gallery-', '')}`;
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const modalImg = modal.querySelector('img');
    const closeBtn = modal.querySelector('.modal-close');
    const prevBtn = modal.querySelector('.modal-prev');
    const nextBtn = modal.querySelector('.modal-next');
    const currentSpan = modal.querySelector('.modal-counter .current');
    let currentIndex = 0;

    // Open modal from main image
    gallery.querySelector('.gallery-main').addEventListener('click', () => {
      modal.style.display = 'flex';
      this.updateModalImage(modalImg, currentSpan, images[currentIndex], currentIndex, images.length);
    });

    // Close modal
    closeBtn?.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.querySelector('.modal-overlay')?.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    // Navigation
    const updateImage = (delta) => {
      currentIndex = (currentIndex + delta + images.length) % images.length;
      this.updateModalImage(modalImg, currentSpan, images[currentIndex], currentIndex, images.length);
    };

    prevBtn?.addEventListener('click', () => updateImage(-1));
    nextBtn?.addEventListener('click', () => updateImage(1));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (modal.style.display !== 'flex') return;
      if (e.key === 'ArrowLeft') updateImage(-1);
      if (e.key === 'ArrowRight') updateImage(1);
      if (e.key === 'Escape') modal.style.display = 'none';
    });
  }

  /**
   * Update modal image display
   * @private
   */
  updateModalImage(imgElement, counterElement, imageUrl, index, total) {
    imgElement.src = imageUrl;
    if (counterElement) {
      counterElement.textContent = index + 1;
    }
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * PART 3.4: GOOGLE LENS OPTIMIZATION & PINTEREST INTEGRATION
   * ─────────────────────────────────────────────────────────────────────────
   * 
   * Google Lens:
   * - Validates image dimensions (1200x1200 min, 2400x2400 ideal)
   * - Generates Google Lens metadata
   * - Creates optimization report
   * 
   * Pinterest:
   * - Generates Pinterest-specific metadata
   * - Creates Rich Pin structured data
   * - Generates "Save to Pinterest" HTML
   * - Creates Pinterest-optimized image URLs
   * ─────────────────────────────────────────────────────────────────────────
   */

  /**
   * Validate image for Google Lens compliance
   * Checks dimensions and quality standards
   * 
   * @param {Object} imageData - Image information
   * @param {number} imageData.width - Image width in pixels
   * @param {number} imageData.height - Image height in pixels
   * @param {string} imageData.url - Image URL
   * @param {string} imageData.alt - Alt text
   * @param {string} imageData.format - Image format (avif, webp, jpeg)
   * @returns {Object} Validation report
   */
  validateGoogleLensCompliance(imageData = {}) {
    const {
      width = 0,
      height = 0,
      url = '',
      alt = '',
      format = 'jpeg'
    } = imageData;

    const minWidth = 1200;
    const minHeight = 1200;
    const idealWidth = 2400;
    const idealHeight = 2400;

    const report = {
      url,
      dimensions: { width, height },
      meetsMinimum: width >= minWidth && height >= minHeight,
      meetsIdeal: width >= idealWidth && height >= idealHeight,
      compliance: {
        dimensionScore: 0,
        altTextScore: 0,
        formatScore: 0,
        totalScore: 0
      },
      issues: [],
      recommendations: [],
      status: 'UNKNOWN'
    };

    // Validate dimensions
    if (width < minWidth || height < minHeight) {
      report.issues.push(`Dimension too small: ${width}x${height}px (minimum: ${minWidth}x${minHeight}px)`);
      report.compliance.dimensionScore = 30;
      report.recommendations.push(`Increase image to minimum ${minWidth}x${minHeight}px`);
    } else if (width < idealWidth || height < idealHeight) {
      report.compliance.dimensionScore = 70;
      report.recommendations.push(`Consider upgrading to ideal ${idealWidth}x${idealHeight}px for better Google Lens recognition`);
    } else {
      report.compliance.dimensionScore = 100;
    }

    // Validate alt text
    if (!alt || alt.length === 0) {
      report.issues.push('Missing alt text');
      report.compliance.altTextScore = 0;
      report.recommendations.push('Add descriptive alt text (100-150 characters)');
    } else if (alt.length < 50) {
      report.compliance.altTextScore = 50;
      report.recommendations.push('Alt text too short - aim for 100-150 characters');
    } else if (alt.length > 150) {
      report.compliance.altTextScore = 70;
      report.recommendations.push('Alt text too long - limit to 150 characters for optimal Google Lens extraction');
    } else {
      report.compliance.altTextScore = 100;
    }

    // Validate format
    const preferredFormats = ['avif', 'webp'];
    if (preferredFormats.includes(format)) {
      report.compliance.formatScore = 100;
    } else if (format === 'jpeg' || format === 'jpg') {
      report.compliance.formatScore = 70;
      report.recommendations.push('Consider converting to AVIF or WebP for better compression');
    } else {
      report.compliance.formatScore = 50;
    }

    // Calculate total score
    report.compliance.totalScore = Math.round(
      (report.compliance.dimensionScore * 0.5 +
       report.compliance.altTextScore * 0.3 +
       report.compliance.formatScore * 0.2)
    );

    // Determine status
    if (report.meetsIdeal && report.compliance.altTextScore >= 100 && report.compliance.formatScore >= 100) {
      report.status = 'EXCELLENT';
    } else if (report.meetsMinimum && report.compliance.totalScore >= 80) {
      report.status = 'GOOD';
    } else if (report.meetsMinimum && report.compliance.totalScore >= 60) {
      report.status = 'ACCEPTABLE';
    } else {
      report.status = 'NEEDS_IMPROVEMENT';
    }

    return report;
  }

  /**
   * Generate Google Lens metadata for image
   * Creates structured data for Google Lens recognition
   * 
   * @param {Object} imageData - Image information
   * @param {string} imageData.url - Image URL
   * @param {string} imageData.alt - Alt text
   * @param {number} imageData.width - Image width
   * @param {number} imageData.height - Image height
   * @param {string} imageData.productName - Product name
   * @param {string} imageData.productId - Product ID
   * @param {string} imageData.uploadDate - Upload date ISO
   * @returns {Object} Google Lens metadata
   */
  generateGoogleLensMetadata(imageData = {}) {
    const {
      url = '',
      alt = '',
      width = 1200,
      height = 1500,
      productName = 'Product',
      productId = 'product-1',
      uploadDate = new Date().toISOString()
    } = imageData;

    return {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      'url': url,
      'name': `${productName} - Product Image`,
      'description': alt,
      'width': width,
      'height': height,
      'uploadDate': uploadDate,
      'isPartOf': {
        '@type': 'Product',
        '@id': `product:${productId}`
      },
      'author': {
        '@type': 'Organization',
        'name': 'CanadaClothes.ca'
      },
      'copyrightNotice': '© CanadaClothes.ca. All rights reserved.',
      'creditText': 'CanadaClothes.ca',
      // Google Lens specific metadata
      'associatedMedia': [
        {
          '@type': 'ImageObject',
          'url': url,
          'representation': 'primary'
        }
      ]
    };
  }

  /**
   * Create Google Lens submit-ready image data
   * Prepares image for Google Lens visual search indexing
   * 
   * @param {Object} config - Configuration
   * @param {string} config.productId - Product ID
   * @param {string} config.productName - Product name
   * @param {string} config.productUrl - Product URL
   * @param {Array} config.images - Array of image URLs
   * @returns {Object} Google Lens ready data
   */
  prepareForGoogleLens(config = {}) {
    const {
      productId = 'product-1',
      productName = 'Product',
      productUrl = '',
      images = []
    } = config;

    return {
      product: {
        id: productId,
        name: productName,
        url: productUrl
      },
      images: images.map((imgUrl, idx) => ({
        url: imgUrl,
        position: idx + 1,
        specification: {
          minimumDimension: '1200x1200px',
          idealDimension: '2400x2400px',
          formats: ['avif', 'webp', 'jpeg']
        }
      })),
      submission: {
        service: 'Google Lens',
        type: 'visual-search',
        coverage: 'product-catalog',
        lastUpdated: new Date().toISOString()
      }
    };
  }

  /**
   * ═════════════════════════════════════════════════════════════════════════
   * PINTEREST INTEGRATION - Rich Pins & Product Metadata
   * ═════════════════════════════════════════════════════════════════════════
   */

  /**
   * Create Pinterest-optimized image format (1000x1500px, 2:3 aspect)
   * Generates all URLs needed for Pinterest
   * 
   * @param {Object} config - Configuration
   * @param {string} config.baseUrl - Base image URL
   * @param {string} config.alt - Alt text
   * @param {string} config.productName - Product name
   * @returns {Object} Pinterest image data
   */
  generatePinterestImageFormat(config = {}) {
    const {
      baseUrl = '',
      alt = '',
      productName = 'Product'
    } = config;

    // Pinterest aspect ratio: 2:3 (1000x1500 minimum)
    const sizes = [
      { width: 800, height: 1200, label: 'mobile' },
      { width: 1000, height: 1500, label: 'tablet' },
      { width: 1200, height: 1500, label: 'desktop' },
      { width: 1500, height: 2250, label: 'retina' }
    ];

    return {
      baseUrl,
      alt,
      productName,
      // Generate URL variants
      variants: Object.fromEntries(
        sizes.map(({ width, height, label }) => [
          label,
          {
            url: `${baseUrl}?w=${width}&h=${height}&q=85&fit=crop&crop=center`,
            width,
            height,
            aspectRatio: '2:3',
            quality: 85
          }
        ])
      ),
      // Pinterest-specific formats
      formats: {
        avif: `${baseUrl}?format=avif&w=1000&h=1500&q=85`,
        webp: `${baseUrl}?format=webp&w=1000&h=1500&q=85`,
        jpeg: `${baseUrl}?format=jpeg&w=1000&h=1500&q=85`,
        // Large format for hover preview
        avifLarge: `${baseUrl}?format=avif&w=1500&h=2250&q=85`,
        webpLarge: `${baseUrl}?format=webp&w=1500&h=2250&q=85`,
        jpegLarge: `${baseUrl}?format=jpeg&w=1500&h=2250&q=85`
      },
      // Metadata
      metadata: {
        minDimension: '1000x1500px',
        idealDimension: '1500x2250px',
        aspectRatio: '2:3',
        maxFileSize: '5MB',
        supportedFormats: ['png', 'jpg', 'gif', 'webp']
      }
    };
  }

  /**
   * Generate Pinterest Rich Pin metadata
   * Creates all required Open Graph and Pinterest tags
   * 
   * @param {Object} config - Configuration
   * @param {string} config.productName - Product name
   * @param {string} config.description - Product description
   * @param {string} config.imageUrl - Product image URL (1000x1500px ideal)
   * @param {string} config.productUrl - Product URL
   * @param {number} config.price - Price in cents
   * @param {string} config.currency - Currency (CAD, USD, etc)
   * @param {string} config.availability - in stock/out of stock
   * @param {string} config.category - Product category
   * @returns {Object} Pinterest metadata
   */
  generatePinterestMetadata(config = {}) {
    const {
      productName = 'Product',
      description = '',
      imageUrl = '',
      productUrl = '',
      price = 0,
      currency = 'CAD',
      availability = 'in stock',
      category = 'Shopping'
    } = config;

    const priceFormatted = (price / 100).toFixed(2);

    return {
      // Open Graph tags (for Pinterest sharing)
      openGraph: {
        'og:title': productName,
        'og:description': description.substring(0, 160) || `Shop ${productName} on CanadaClothes.ca`,
        'og:image': imageUrl,
        'og:image:width': 1000,
        'og:image:height': 1500,
        'og:url': productUrl,
        'og:type': 'product',
        'og:site_name': 'CanadaClothes.ca'
      },
      // Pinterest-specific metadata
      pinterest: {
        'pinterest:description': description.substring(0, 125),
        'pinterest:title': productName,
        'pinterest:media': imageUrl,
        'pinterest:url': productUrl,
        'pinterest:data': {
          // Pinterest Rich Pin data
          richpin: {
            type: 'product',
            product: {
              name: productName,
              description: description.substring(0, 200),
              image: imageUrl,
              url: productUrl,
              price: priceFormatted,
              currency: currency,
              availability: availability
            }
          }
        }
      },
      // Twitter Card (for cross-platform sharing)
      twitter: {
        'twitter:card': 'product',
        'twitter:title': productName,
        'twitter:description': description.substring(0, 160),
        'twitter:image': imageUrl,
        'twitter:site': '@canadaclothes'
      }
    };
  }

  /**
   * Create Pinterest save button HTML
   * Generates pinnable image element with save button
   * 
   * @param {Object} config - Configuration
   * @param {string} config.imageUrl - Image URL
   * @param {string} config.productName - Product name
   * @param {string} config.description - Product description
   * @param {string} config.productUrl - Product URL
   * @param {string} config.style - Button style (round, rect, large)
   * @returns {string} HTML for Pinterest save button
   */
  createPinterestSaveButton(config = {}) {
    const {
      imageUrl = '',
      productName = 'Product',
      description = '',
      productUrl = '',
      style = 'round'
    } = config;

    const encodedDescription = encodeURIComponent(description || productName);
    const encodedUrl = encodeURIComponent(productUrl);
    const pinterestUrl = `https://www.pinterest.com/pin/create/button/?media=${encodeURIComponent(imageUrl)}&description=${encodedDescription}&url=${encodedUrl}`;

    // Button styles
    const styles = {
      round: 'width: 40px; height: 40px; border-radius: 50%;',
      rect: 'padding: 12px 24px; border-radius: 4px;',
      large: 'padding: 16px 32px; font-size: 14px; border-radius: 4px;'
    };

    return `
      <a 
        href="${pinterestUrl}"
        class="pinterest-save-btn"
        data-pin-custom="true"
        data-pin-shape="round"
        data-pin-log="button"
        style="${styles[style] || styles.round}"
        title="Save to Pinterest"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Save ${productName} to Pinterest"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
        ${style !== 'round' ? `<span>${productName}</span>` : ''}
      </a>
    `;
  }

  /**
   * Generate Pinterest board recommendations
   * Suggests boards for product based on category
   * 
   * @param {Object} config - Configuration
   * @param {string} config.productName - Product name
   * @param {string} config.category - Product category
   * @param {Array} config.tags - Product tags
   * @returns {Array} Recommended board names
   */
  generatePinterestBoardRecommendations(config = {}) {
    const {
      productName = '',
      category = '',
      tags = []
    } = config;

    const boardSuggestions = [];

    // Category-based suggestions
    const categoryBoards = {
      'apparel': ['Fashion', 'Casual Wear', 'Wardrobe Inspiration', 'Style Ideas'],
      'accessories': ['Accessories', 'Fashion Accessories', 'Must Have Accessories'],
      'shoes': ['Shoes', 'Footwear', 'Shoe Styles', 'Designer Shoes'],
      'outerwear': ['Outerwear', 'Coats & Jackets', 'Fall Fashion', 'Winter Style'],
      'home': ['Home Decor', 'Interior Design', 'Home Inspiration'],
      'beauty': ['Beauty', 'Skincare', 'Makeup']
    };

    // Add category-specific boards
    const lowerCategory = category.toLowerCase();
    for (const [key, boards] of Object.entries(categoryBoards)) {
      if (lowerCategory.includes(key)) {
        boardSuggestions.push(...boards);
      }
    }

    // Add tag-based suggestions
    tags.forEach(tag => {
      boardSuggestions.push(
        `${tag}`,
        `${tag} Inspiration`,
        `DIY ${tag}`
      );
    });

    // Add generic boards
    boardSuggestions.push(
      'Canadian Fashion',
      'Sustainable Fashion',
      'Handmade Fashion',
      'Ethical Shopping',
      'Quality Basics'
    );

    // Remove duplicates and return first 10
    return [...new Set(boardSuggestions)].slice(0, 10);
  }

  /**
   * Create complete Pinterest Rich Pin HTML
   * Full integration of image + metadata + save button
   * 
   * @param {Object} config - Complete Pinterest configuration
   * @returns {string} Complete Pinterest-ready HTML
   */
  createPinterestRichPin(config = {}) {
    const {
      productId = 'product-1',
      productName = 'Product',
      description = '',
      imageUrl = '',
      productUrl = '',
      price = 0,
      currency = 'CAD',
      availability = 'in stock',
      category = ''
    } = config;

    const pinterestImage = this.generatePinterestImageFormat({
      baseUrl: imageUrl,
      alt: productName,
      productName
    });

    const pinMetadata = this.generatePinterestMetadata({
      productName,
      description,
      imageUrl: pinterestImage.formats.jpeg,
      productUrl,
      price,
      currency,
      availability,
      category
    });

    const saveButton = this.createPinterestSaveButton({
      imageUrl: pinterestImage.formats.jpeg,
      productName,
      description,
      productUrl,
      style: 'round'
    });

    // Generate board recommendations
    const boardRecs = this.generatePinterestBoardRecommendations({
      productName,
      category,
      tags: [currency === 'CAD' ? 'Canadian' : 'Made in Canada']
    });

    return {
      image: pinterestImage,
      metadata: pinMetadata,
      saveButton,
      boardRecommendations: boardRecs,
      // Ready-to-use HTML
      html: `
        <div class="pinterest-rich-pin" data-product-id="${productId}">
          <div class="pin-image">
            <img 
              src="${pinterestImage.variants.tablet.url}"
              srcset="${pinterestImage.variants.mobile.url} 800w, ${pinterestImage.variants.tablet.url} 1000w, ${pinterestImage.variants.desktop.url} 1200w"
              alt="${productName}"
              width="1000"
              height="1500"
              style="aspect-ratio: 1000/1500; object-fit: cover;"
            >
            <div class="pin-overlay">
              ${saveButton}
            </div>
          </div>
          <div class="pin-details">
            <h3 class="pin-title">${productName}</h3>
            <p class="pin-description">${description}</p>
            <div class="pin-price">
              <span class="price">${(price / 100).toFixed(2)}</span>
              <span class="currency">${currency}</span>
            </div>
            <div class="pin-availability">${availability}</div>
            <div class="pin-boards">
              <p>Save to:</p>
              <ul>
                ${boardRecs.slice(0, 5).map(board => `<li>${board}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      `
    };
  }

  /**
   * ═════════════════════════════════════════════════════════════════════════
   * PART 3.5: IMAGE METADATA OPTIMIZATION
   * ═════════════════════════════════════════════════════════════════════════
   */

  /**
   * Generate optimized filename from product data
   * Creates SEO-friendly filenames with dimensions and format
   * Format: {product-id}-{view}-{dimensions}.{format}
   * Example: 123-front-2400x3000.webp
   * 
   * @param {Object} config - Configuration
   * @param {string} config.productId - Product ID
   * @param {string} config.productName - Product name (for readable name variant)
   * @param {string} config.view - View angle (front, back, detail, etc.)
   * @param {number} config.width - Image width
   * @param {number} config.height - Image height
   * @param {string} config.format - File format (webp, avif, jpeg)
   * @returns {Object} Filenames in multiple formats
   */
  generateOptimizedFilename(config = {}) {
    const {
      productId = '',
      productName = '',
      view = 'product',
      width = 0,
      height = 0,
      format = 'webp'
    } = config;

    // Convert product name to slug (lowercase, hyphens, no special chars)
    const nameSlug = productName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')      // Remove special characters
      .replace(/\s+/g, '-')           // Replace spaces with hyphens
      .replace(/-+/g, '-')            // Remove consecutive hyphens
      .substring(0, 50);              // Limit length

    // Sanitize view name
    const viewSlug = view
      .toLowerCase()
      .replace(/[^\w-]/g, '')
      .substring(0, 20);

    // Generate multiple filename variants
    return {
      // ID-based (preferred for databases)
      idBased: `${productId}-${viewSlug}-${width}x${height}.${format}`,
      
      // Name-based (readable, SEO-friendly)
      nameBased: `${nameSlug}-${viewSlug}-${width}x${height}.${format}`,
      
      // Full descriptive (maximum SEO value)
      descriptive: `${nameSlug}-${viewSlug}-product-image-${width}x${height}.${format}`,
      
      // CDN path variants
      cdnPath: {
        base: `products/${productId}/${viewSlug}`,
        withDimensions: `products/${productId}/${viewSlug}-${width}x${height}`,
        formatted: `products/${productId}/${viewSlug}-${width}x${height}-${format}`
      },

      // URL-encoded variants
      urlEncoded: {
        idBased: encodeURIComponent(`${productId}-${viewSlug}-${width}x${height}.${format}`),
        nameBased: encodeURIComponent(`${nameSlug}-${viewSlug}-${width}x${height}.${format}`)
      },

      // Metadata
      metadata: {
        productId,
        view: viewSlug,
        dimensions: `${width}x${height}`,
        format,
        aspect: this._calculateAspectRatio(width, height),
        descriptive: `${nameSlug} ${viewSlug} view ${width}x${height}`
      }
    };
  }

  /**
   * Calculate aspect ratio from dimensions
   * Returns ratio and common names
   * 
   * @param {number} width - Width in pixels
   * @param {number} height - Height in pixels
   * @returns {Object} Aspect ratio details
   */
  _calculateAspectRatio(width, height) {
    if (!width || !height) return { ratio: '1:1', name: 'square', decimal: 1 };

    const decimal = width / height;
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    const w = width / divisor;
    const h = height / divisor;

    let name = 'custom';
    if (w === 4 && h === 5) name = 'portrait';
    else if (w === 3 && h === 4) name = 'portrait';
    else if (w === 1 && h === 1) name = 'square';
    else if (w === 16 && h === 9) name = 'widescreen';
    else if (w === 2 && h === 3) name = 'pinterest';

    return {
      ratio: `${w}:${h}`,
      name,
      decimal: parseFloat(decimal.toFixed(3))
    };
  }

  /**
   * Generate comprehensive image metadata
   * Creates EXIF-like metadata for image indexing
   * 
   * @param {Object} config - Configuration
   * @param {string} config.productId - Product ID
   * @param {string} config.productName - Product name
   * @param {string} config.description - Product description
   * @param {string} config.category - Product category
   * @param {Array} config.tags - Product tags
   * @param {number} config.width - Image width
   * @param {number} config.height - Image height
   * @param {string} config.format - Image format
   * @param {string} config.view - View angle
   * @param {string} config.uploadDate - Upload date (ISO 8601)
   * @param {string} config.creator - Image creator/photographer
   * @returns {Object} Complete metadata object
   */
  generateImageMetadata(config = {}) {
    const {
      productId = '',
      productName = '',
      description = '',
      category = '',
      tags = [],
      width = 0,
      height = 0,
      format = 'webp',
      view = 'product',
      uploadDate = new Date().toISOString(),
      creator = 'Canada Clothes Co.'
    } = config;

    const aspectRatio = this._calculateAspectRatio(width, height);
    const filename = this.generateOptimizedFilename({
      productId, productName, view, width, height, format
    });

    return {
      // Basic metadata
      id: `${productId}-${view}`,
      productId,
      filename: filename.idBased,
      filenameVariants: {
        idBased: filename.idBased,
        nameBased: filename.nameBased,
        descriptive: filename.descriptive
      },

      // Image dimensions & format
      dimensions: {
        width,
        height,
        aspectRatio: aspectRatio.ratio,
        aspectName: aspectRatio.name,
        dpi: 96,                    // Web standard
        fileSize: this._estimateFileSize(width, height, format),
        estimatedCompression: this._estimateCompression(format)
      },

      // Content metadata
      content: {
        productName,
        productId,
        category,
        description: description.substring(0, 200),  // Limit for metadata
        keywords: this._generateKeywords({
          productName, category, view, tags
        }),
        tags: [...tags, category, view],
        view: view,
        type: 'product-photo'
      },

      // Creator & copyright
      creator: {
        name: creator,
        url: 'https://canadaclothes.ca',
        license: 'proprietary',
        rights: `© ${new Date().getFullYear()} ${creator}. All rights reserved.`,
        credit: `Photo by ${creator}`
      },

      // Dates
      dates: {
        created: uploadDate,
        modified: uploadDate,
        published: uploadDate,
        indexed: new Date().toISOString()
      },

      // SEO metadata
      seo: {
        title: `${productName} - ${view} view`,
        description: `High-quality ${width}x${height} product image of ${productName}`,
        keywords: `${productName}, ${category}, product image, ${view} view, ${width}x${height}`,
        canonical: `https://canadaclothes.ca/products/${productId}/${view}`
      },

      // Technical metadata
      technical: {
        mimeType: this._getMimeType(format),
        format: format.toUpperCase(),
        colorSpace: 'sRGB',
        bitDepth: 8,
        orientation: 0,  // 0 = normal, not rotated
        interlaced: false
      },

      // Quality assessment
      quality: {
        estimatedSharpness: 0.85,   // 0-1 scale
        estimatedContrast: 0.78,
        estimatedColorAccuracy: 0.92,
        idealFor: ['Google Lens', 'Pinterest', 'Google Images', 'Social Media']
      },

      // Usage metadata
      usage: {
        cdn: {
          base: `https://cdn.canadaclothes.ca/${filename.cdnPath.formatted}`,
          variants: {
            thumbnail: `https://cdn.canadaclothes.ca/${filename.cdnPath.formatted}?w=200&h=200`,
            small: `https://cdn.canadaclothes.ca/${filename.cdnPath.formatted}?w=400`,
            medium: `https://cdn.canadaclothes.ca/${filename.cdnPath.formatted}?w=800`,
            large: `https://cdn.canadaclothes.ca/${filename.cdnPath.formatted}?w=1200`,
            original: `https://cdn.canadaclothes.ca/${filename.cdnPath.formatted}`
          }
        },
        webUsage: {
          displayName: productName,
          altText: `${productName} - ${view} view`,
          title: `${productName} Product Photo`,
          caption: `High-quality product image: ${productName}`
        }
      },

      // Export formats
      export: {
        json: JSON.stringify(this._cleanMetadataForExport({
          productId, productName, description, category, 
          width, height, format, view, uploadDate, creator
        }), null, 2),
        
        csv: this._generateMetadataCSV({
          productId, productName, description, category,
          width, height, format, view, uploadDate, creator
        })
      }
    };
  }

  /**
   * Generate copyright and attribution information
   * Creates legal metadata for image usage
   * 
   * @param {Object} config - Configuration
   * @param {string} config.productName - Product name
   * @param {string} config.photoDate - Photo date
   * @param {string} config.photographer - Photographer name
   * @param {string} config.studio - Studio/location
   * @param {string} config.license - License type
   * @returns {Object} Copyright & attribution data
   */
  generateCopyrightMetadata(config = {}) {
    const {
      productName = '',
      photoDate = new Date().getFullYear().toString(),
      photographer = 'Canada Clothes Co.',
      studio = 'Canada Clothes Studio',
      license = 'proprietary'
    } = config;

    const year = parseInt(photoDate) || new Date().getFullYear();

    return {
      // Copyright statement
      copyright: {
        symbol: '©',
        year,
        owner: 'Canada Clothes Co.',
        statement: `© ${year} Canada Clothes Co. All rights reserved.`,
        disclaimer: 'These images are proprietary. Unauthorized use is prohibited.'
      },

      // Attribution
      attribution: {
        required: true,
        text: `Photo by ${photographer}`,
        studio: studio,
        photographer: photographer,
        url: 'https://canadaclothes.ca',
        format: {
          short: `© ${photographer}`,
          medium: `Photo by ${photographer} for Canada Clothes`,
          full: `This image is property of Canada Clothes Co. Photo by ${photographer}, ${studio}. © ${year}. All rights reserved.`
        }
      },

      // License information
      license: {
        type: license,
        name: this._getLicenseName(license),
        url: this._getLicenseUrl(license),
        restrictions: this._getLicenseRestrictions(license),
        permissions: this._getLicensePermissions(license)
      },

      // Usage rights
      usage: {
        canUseCommercially: license === 'cc-by' || license === 'proprietary',
        canModify: license === 'cc-by-sa',
        canDistribute: license === 'cc-by',
        needsAttribution: true,
        canUseSocially: true,
        commercialRestrictions: this._getCommercialRestrictions(license)
      },

      // Watermark information
      watermark: {
        hasWatermark: false,
        watermarkText: 'Canada Clothes',
        watermarkPosition: 'bottom-right',
        watermarkOpacity: 0.3,
        shouldAdd: license === 'proprietary'
      },

      // Export formats
      standardStatements: {
        mla: `"${productName}." Canada Clothes Co., ${year}. Photograph.`,
        apa: `Canada Clothes Co. (${year}). ${productName} [Photograph].`,
        chicago: `Canada Clothes Co. "${productName}." Photograph, ${year}.`,
        html: `<p>&copy; ${year} Canada Clothes Co. Photo by ${photographer}. All rights reserved.</p>`
      }
    };
  }

  /**
   * Get MIME type from format
   * @private
   */
  _getMimeType(format) {
    const types = {
      webp: 'image/webp',
      avif: 'image/avif',
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      svg: 'image/svg+xml'
    };
    return types[format.toLowerCase()] || 'image/jpeg';
  }

  /**
   * Estimate file size based on dimensions and format
   * @private
   */
  _estimateFileSize(width, height, format) {
    const pixels = width * height;
    const baseSize = pixels / 1000;  // Rough estimate

    const compression = {
      avif: 0.4,    // AVIF is most efficient
      webp: 0.6,    // WebP is efficient
      jpeg: 1.0,    // JPEG baseline
      png: 1.5,     // PNG less efficient
      jpg: 1.0
    };

    const factor = compression[format.toLowerCase()] || 1.0;
    const estimatedKB = Math.round(baseSize * factor);
    
    return {
      estimated: `${estimatedKB} KB`,
      estimatedBytes: estimatedKB * 1024,
      range: `${Math.round(estimatedKB * 0.8)} - ${Math.round(estimatedKB * 1.2)} KB`,
      maxRecommended: width > 2000 ? 300 : 200
    };
  }

  /**
   * Estimate compression efficiency
   * @private
   */
  _estimateCompression(format) {
    const compression = {
      avif: { efficiency: 0.95, ratio: 4.5 },
      webp: { efficiency: 0.85, ratio: 3.5 },
      jpeg: { efficiency: 0.65, ratio: 2.2 },
      png: { efficiency: 0.40, ratio: 1.4 },
      jpg: { efficiency: 0.65, ratio: 2.2 }
    };
    return compression[format.toLowerCase()] || { efficiency: 0.5, ratio: 1.5 };
  }

  /**
   * Generate keywords from product data
   * @private
   */
  _generateKeywords(config = {}) {
    const { productName = '', category = '', view = '', tags = [] } = config;
    const keywords = new Set();

    // Add base keywords
    if (productName) keywords.add(productName);
    if (category) keywords.add(category);
    if (view) keywords.add(`${view} view`);

    // Add all tags
    tags.forEach(tag => keywords.add(tag));

    // Add combinations
    if (productName && category) keywords.add(`${category} ${productName}`);
    if (productName && view) keywords.add(`${productName} ${view}`);

    // Add generic keywords
    keywords.add('product image');
    keywords.add('ecommerce');
    keywords.add('shopping');

    return Array.from(keywords).slice(0, 20);  // Limit to 20 keywords
  }

  /**
   * Get license name from type
   * @private
   */
  _getLicenseName(license) {
    const names = {
      proprietary: 'Proprietary - All Rights Reserved',
      cc0: 'CC0 - Public Domain',
      'cc-by': 'CC BY - Attribution Required',
      'cc-by-sa': 'CC BY-SA - Attribution + Share Alike',
      'cc-by-nc': 'CC BY-NC - Non-Commercial',
      commercial: 'Commercial License'
    };
    return names[license] || 'Proprietary';
  }

  /**
   * Get license URL
   * @private
   */
  _getLicenseUrl(license) {
    const urls = {
      'cc0': 'https://creativecommons.org/publicdomain/zero/1.0/',
      'cc-by': 'https://creativecommons.org/licenses/by/4.0/',
      'cc-by-sa': 'https://creativecommons.org/licenses/by-sa/4.0/',
      'cc-by-nc': 'https://creativecommons.org/licenses/by-nc/4.0/'
    };
    return urls[license] || 'https://canadaclothes.ca/license';
  }

  /**
   * Get license restrictions
   * @private
   */
  _getLicenseRestrictions(license) {
    const restrictions = {
      proprietary: ['Commercial use prohibited', 'Modification prohibited', 'Distribution prohibited'],
      cc0: [],
      'cc-by': ['Must provide attribution'],
      'cc-by-sa': ['Must provide attribution', 'Derivatives must use same license'],
      'cc-by-nc': ['Non-commercial use only', 'Must provide attribution'],
      commercial: ['Commercial use allowed']
    };
    return restrictions[license] || [];
  }

  /**
   * Get license permissions
   * @private
   */
  _getLicensePermissions(license) {
    const permissions = {
      proprietary: [],
      cc0: ['Commercial use', 'Modification', 'Distribution'],
      'cc-by': ['Commercial use', 'Modification', 'Distribution'],
      'cc-by-sa': ['Commercial use', 'Modification with same license'],
      'cc-by-nc': ['Modification', 'Distribution'],
      commercial: ['Commercial use', 'Modification', 'Distribution']
    };
    return permissions[license] || [];
  }

  /**
   * Get commercial restrictions
   * @private
   */
  _getCommercialRestrictions(license) {
    if (license === 'cc-by-nc') return { allowed: false, reason: 'Non-commercial license' };
    if (license === 'proprietary') return { allowed: false, reason: 'All rights reserved' };
    return { allowed: true, reason: 'License permits commercial use' };
  }

  /**
   * Clean metadata for export
   * @private
   */
  _cleanMetadataForExport(config) {
    return {
      id: config.productId,
      product: config.productName,
      description: config.description,
      category: config.category,
      dimensions: `${config.width}x${config.height}`,
      format: config.format,
      view: config.view,
      uploadDate: config.uploadDate,
      creator: config.creator
    };
  }

  /**
   * Generate metadata CSV
   * @private
   */
  _generateMetadataCSV(config = {}) {
    const headers = ['Product ID', 'Product Name', 'Category', 'View', 'Dimensions', 'Format', 'Creator', 'Upload Date'];
    const values = [
      config.productId,
      config.productName,
      config.category,
      config.view,
      `${config.width}x${config.height}`,
      config.format,
      config.creator,
      config.uploadDate
    ];

    const escapedValues = values.map(v => {
      if (typeof v === 'string' && v.includes(',')) return `"${v}"`;
      return v;
    });

    return headers.join(',') + '\n' + escapedValues.join(',');
  }

  // ============================================
  // PART 3.6: Analytics & Performance Tracking
  // ============================================

  /**
   * Initialize analytics tracking for images
   * @param {Object} config - Analytics configuration
   * @returns {Object} Analytics tracking object
   */
  initializeAnalyticsTracking(config = {}) {
    const trackingConfig = {
      enabled: config.enabled !== false,
      trackViews: config.trackViews !== false,
      trackDownloads: config.trackDownloads !== false,
      trackInteractions: config.trackInteractions !== false,
      trackPerformance: config.trackPerformance !== false,
      trackSEOImpact: config.trackSEOImpact !== false,
      sessionId: config.sessionId || this._generateSessionId(),
      userId: config.userId || null,
      startTime: new Date(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      referrer: document.referrer || 'direct',
      userAgent: navigator.userAgent
    };

    this.analyticsConfig = trackingConfig;

    return {
      enabled: trackingConfig.enabled,
      sessionId: trackingConfig.sessionId,
      startTime: trackingConfig.startTime,
      metrics: {
        totalViews: 0,
        totalDownloads: 0,
        totalInteractions: 0,
        averageViewDuration: 0,
        averageEngagementTime: 0
      }
    };
  }

  /**
   * Track image view event
   * @param {string} imageId - Image ID
   * @param {Object} details - View details
   * @returns {Object} View event data
   */
  trackImageView(imageId, details = {}) {
    const viewEvent = {
      eventType: 'image_view',
      imageId,
      timestamp: new Date().toISOString(),
      sessionId: this.analyticsConfig?.sessionId,
      duration: details.duration || 0,
      viewportPosition: details.viewportPosition || 'below-fold',
      deviceType: details.deviceType || this._detectDeviceType(),
      screenSize: details.screenSize || `${window.innerWidth}x${window.innerHeight}`,
      interactionType: details.interactionType || 'passive_view',
      source: details.source || 'page_load',
      engagementScore: this._calculateEngagementScore(details),
      metadata: {
        imageFormat: details.imageFormat || 'unknown',
        imageSize: details.imageSize || 0,
        loadTime: details.loadTime || 0,
        renderTime: details.renderTime || 0
      }
    };

    return viewEvent;
  }

  /**
   * Track image download event
   * @param {string} imageId - Image ID
   * @param {Object} details - Download details
   * @returns {Object} Download event data
   */
  trackImageDownload(imageId, details = {}) {
    const downloadEvent = {
      eventType: 'image_download',
      imageId,
      timestamp: new Date().toISOString(),
      sessionId: this.analyticsConfig?.sessionId,
      downloadFormat: details.downloadFormat || 'original',
      downloadSize: details.downloadSize || 0,
      downloadTime: details.downloadTime || 0,
      downloadSpeed: this._calculateDownloadSpeed(details.downloadSize, details.downloadTime),
      source: details.source || 'user_action',
      deviceType: details.deviceType || this._detectDeviceType(),
      downloadQuality: details.downloadQuality || 'full',
      intent: details.intent || 'unknown'
    };

    return downloadEvent;
  }

  /**
   * Track image interaction event
   * @param {string} imageId - Image ID
   * @param {Object} details - Interaction details
   * @returns {Object} Interaction event data
   */
  trackImageInteraction(imageId, details = {}) {
    const interactionEvent = {
      eventType: 'image_interaction',
      imageId,
      timestamp: new Date().toISOString(),
      sessionId: this.analyticsConfig?.sessionId,
      interactionType: details.interactionType || 'unknown',
      duration: details.duration || 0,
      actionCount: details.actionCount || 1,
      specificActions: details.specificActions || [],
      userEngagementLevel: this._calculateEngagementLevel(details),
      sentiment: details.sentiment || 'neutral',
      deviceType: details.deviceType || this._detectDeviceType(),
      annotations: {
        hover: details.hover || false,
        click: details.click || false,
        scroll: details.scroll || false,
        zoom: details.zoom || false,
        share: details.share || false,
        save: details.save || false
      }
    };

    return interactionEvent;
  }

  /**
   * Calculate image performance metrics
   * @param {string} imageId - Image ID
   * @param {Object} details - Performance details
   * @returns {Object} Performance metrics
   */
  calculateImagePerformanceMetrics(imageId, details = {}) {
    const metrics = {
      imageId,
      timestamp: new Date().toISOString(),
      pageLoadImpact: {
        lcp: details.lcp || 0,
        lcpImprovement: this._calculateLCPImprovement(details.lcp),
        cls: details.cls || 0,
        clsImprovement: this._calculateCLSImprovement(details.cls),
        inp: details.inp || 0,
        inpImprovement: this._calculateINPImprovement(details.inp)
      },
      imageSpecificMetrics: {
        loadTime: details.loadTime || 0,
        renderTime: details.renderTime || 0,
        decodeTime: details.decodeTime || 0,
        transferSize: details.transferSize || 0,
        resourceSize: details.resourceSize || 0,
        compressionRatio: this._calculateCompressionRatio(details.transferSize, details.resourceSize),
        cacheHitRate: details.cacheHitRate || 0
      },
      memoryImpact: {
        memoryUsed: details.memoryUsed || 0,
        decodedSize: details.decodedSize || 0,
        decodedSizeReduction: this._calculateDecodedSizeReduction(details.decodedSize)
      },
      networkMetrics: {
        networkType: details.networkType || 'unknown',
        effectiveType: details.effectiveType || '4g',
        bandwidth: details.bandwidth || 0,
        latency: details.latency || 0,
        timeToFirstByte: details.timeToFirstByte || 0
      },
      qualityScore: this._calculateQualityScore(details),
      performanceGrade: this._assignPerformanceGrade(details)
    };

    return metrics;
  }

  /**
   * Measure SEO impact from image optimization
   * @param {string} imageId - Image ID
   * @param {Object} metrics - SEO metrics
   * @returns {Object} SEO impact analysis
   */
  measureSEOImpact(imageId, metrics = {}) {
    const seoImpact = {
      imageId,
      timestamp: new Date().toISOString(),
      searchVisibility: {
        googleImagesVisibility: metrics.googleImagesVisibility || false,
        googleLensCompliant: metrics.googleLensCompliant || false,
        imageSearchRank: metrics.imageSearchRank || 'unknown',
        impressions: metrics.impressions || 0,
        clicks: metrics.clicks || 0,
        ctr: this._calculateCTR(metrics.clicks, metrics.impressions)
      },
      metadataOptimization: {
        filenameOptimized: metrics.filenameOptimized || false,
        altTextPresent: metrics.altTextPresent || false,
        altTextQuality: metrics.altTextQuality || 0,
        captionPresent: metrics.captionPresent || false,
        schemaMarkup: metrics.schemaMarkup || false,
        structuredDataValid: metrics.structuredDataValid || false
      },
      contentRelevance: {
        contextualRelevance: metrics.contextualRelevance || 0,
        keywordAlignment: metrics.keywordAlignment || 0,
        imageToContentSimilarity: metrics.imageToContentSimilarity || 0
      },
      visibilityMetrics: {
        onSitemap: metrics.onSitemap || false,
        indexedByGoogle: metrics.indexedByGoogle || false,
        externalLinks: metrics.externalLinks || 0,
        socialShares: metrics.socialShares || 0
      },
      seoScore: this._calculateSEOScore(metrics),
      improvementOpportunities: this._identifySEOImprovements(metrics),
      estimatedTrafficImpact: this._estimateTrafficImpact(metrics)
    };

    return seoImpact;
  }

  /**
   * Generate comprehensive analytics report
   * @param {string} imageId - Image ID
   * @param {Object} allMetrics - All collected metrics
   * @returns {Object} Comprehensive analytics report
   */
  generateAnalyticsReport(imageId, allMetrics = {}) {
    const report = {
      imageId,
      reportDate: new Date().toISOString(),
      reportPeriod: allMetrics.reportPeriod || 'session',
      summary: {
        totalViews: allMetrics.totalViews || 0,
        totalDownloads: allMetrics.totalDownloads || 0,
        totalInteractions: allMetrics.totalInteractions || 0,
        uniqueVisitors: allMetrics.uniqueVisitors || 0,
        engagementRate: this._calculateEngagementRate(allMetrics),
        conversionRate: allMetrics.conversionRate || 0
      },
      performanceSummary: {
        averageLoadTime: allMetrics.averageLoadTime || 0,
        averageRenderTime: allMetrics.averageRenderTime || 0,
        performanceGrade: allMetrics.performanceGrade || 'N/A',
        coreWebVitalsScore: allMetrics.coreWebVitalsScore || 0
      },
      seoSummary: {
        seoScore: allMetrics.seoScore || 0,
        googleImagesImpressions: allMetrics.googleImagesImpressions || 0,
        googleImagesClicks: allMetrics.googleImagesClicks || 0,
        averageRank: allMetrics.averageRank || 'N/A',
        trendDirection: allMetrics.trendDirection || 'stable'
      },
      audienceInsights: {
        topDevices: allMetrics.topDevices || [],
        topLocations: allMetrics.topLocations || [],
        topReferrers: allMetrics.topReferrers || [],
        avgSessionDuration: allMetrics.avgSessionDuration || 0,
        bounceRate: allMetrics.bounceRate || 0
      },
      recommendations: this._generateAnalyticsRecommendations(allMetrics),
      exportFormats: {
        json: this._prepareJSONExport(imageId, allMetrics),
        csv: this._prepareCSVExport(imageId, allMetrics),
        pdf: 'PDF export format available'
      }
    };

    return report;
  }

  /**
   * Export analytics data to CSV
   * @param {string} imageId - Image ID
   * @param {Array} events - Events to export
   * @returns {string} CSV formatted data
   */
  exportAnalyticsToCSV(imageId, events = []) {
    const headers = ['Event Date', 'Event Type', 'Image ID', 'Session ID', 'Device Type', 'Duration (ms)', 'Engagement Score', 'Load Time (ms)', 'Event Details'];
    
    const rows = events.map(event => {
      const values = [
        event.timestamp,
        event.eventType,
        imageId,
        event.sessionId || 'unknown',
        event.deviceType || 'unknown',
        event.duration || 0,
        event.engagementScore || 0,
        event.metadata?.loadTime || 0,
        JSON.stringify(event.metadata || {}).replace(/"/g, '""')
      ];

      const escapedValues = values.map(v => {
        if (typeof v === 'string' && (v.includes(',') || v.includes('"') || v.includes('\n'))) {
          return `"${v.replace(/"/g, '""')}"`;
        }
        return v;
      });

      return escapedValues.join(',');
    });

    return headers.join(',') + '\n' + rows.join('\n');
  }

  // Helper Methods for Analytics

  _generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _detectDeviceType() {
    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod/.test(ua)) return 'mobile';
    if (/tablet|ipad/.test(ua)) return 'tablet';
    return 'desktop';
  }

  _calculateEngagementScore(details) {
    let score = 50; // Base score
    if (details.duration > 3000) score += 15;
    if (details.viewportPosition === 'visible') score += 15;
    if (details.interactionType !== 'passive_view') score += 20;
    return Math.min(score, 100);
  }

  _calculateEngagementLevel(details) {
    const actionCount = details.actionCount || 0;
    if (actionCount === 0) return 'none';
    if (actionCount === 1) return 'low';
    if (actionCount <= 3) return 'medium';
    return 'high';
  }

  _calculateDownloadSpeed(size, time) {
    if (time === 0) return 0;
    return (size / time * 8 / 1000); // Convert to Mbps
  }

  _calculateCompressionRatio(transferSize, resourceSize) {
    if (resourceSize === 0) return 0;
    return ((1 - (transferSize / resourceSize)) * 100).toFixed(2);
  }

  _calculateLCPImprovement(lcp) {
    if (lcp === 0) return 0;
    return Math.max(0, ((4000 - lcp) / 4000 * 100)).toFixed(2);
  }

  _calculateCLSImprovement(cls) {
    if (cls === 0) return 0;
    return Math.max(0, ((0.1 - cls) / 0.1 * 100)).toFixed(2);
  }

  _calculateINPImprovement(inp) {
    if (inp === 0) return 0;
    return Math.max(0, ((200 - inp) / 200 * 100)).toFixed(2);
  }

  _calculateDecodedSizeReduction(decodedSize) {
    if (decodedSize === 0) return '0%';
    const reduction = (decodedSize * 0.25); // Estimated 25% reduction from optimization
    return ((reduction / decodedSize) * 100).toFixed(2) + '%';
  }

  _calculateQualityScore(details) {
    let score = 70;
    if (details.loadTime < 1000) score += 10;
    if (details.renderTime < 500) score += 10;
    if (details.cacheHitRate > 0.8) score += 10;
    return Math.min(score, 100);
  }

  _assignPerformanceGrade(details) {
    const score = this._calculateQualityScore(details);
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  _calculateCTR(clicks, impressions) {
    if (impressions === 0) return 0;
    return ((clicks / impressions) * 100).toFixed(2);
  }

  _calculateSEOScore(metrics) {
    let score = 50;
    if (metrics.filenameOptimized) score += 10;
    if (metrics.altTextPresent) score += 10;
    if (metrics.schemaMarkup) score += 15;
    if (metrics.googleImagesVisibility) score += 15;
    return Math.min(score, 100);
  }

  _identifySEOImprovements(metrics) {
    const improvements = [];
    if (!metrics.filenameOptimized) improvements.push('Optimize image filename for SEO');
    if (!metrics.altTextPresent) improvements.push('Add descriptive alt text');
    if (!metrics.schemaMarkup) improvements.push('Add schema markup for images');
    if (!metrics.indexedByGoogle) improvements.push('Request image indexing in Search Console');
    return improvements;
  }

  _estimateTrafficImpact(metrics) {
    const baseTraffic = metrics.impressions || 0;
    const ctr = this._calculateCTR(metrics.clicks, metrics.impressions) / 100;
    return {
      estimatedMonthlyClicks: Math.round(baseTraffic * 30 * ctr),
      estimatedMonthlyVisitors: Math.round(baseTraffic * 30 * ctr * 0.7),
      estimatedTrafficValue: 'Consult analytics for detailed value'
    };
  }

  _calculateEngagementRate(metrics) {
    const totalEvents = (metrics.totalViews || 0) + (metrics.totalInteractions || 0);
    if (totalEvents === 0) return 0;
    return (((metrics.totalInteractions || 0) / totalEvents) * 100).toFixed(2);
  }

  _generateAnalyticsRecommendations(metrics) {
    const recommendations = [];
    if ((metrics.averageLoadTime || 0) > 2000) {
      recommendations.push('Optimize image loading speed - aim for < 2 seconds');
    }
    if ((metrics.performanceGrade || 'F') === 'F') {
      recommendations.push('Implement performance optimization strategies');
    }
    if ((metrics.seoScore || 0) < 70) {
      recommendations.push('Improve SEO optimization - focus on metadata and schema');
    }
    if ((metrics.engagementRate || 0) < 10) {
      recommendations.push('Increase user engagement through interactive features');
    }
    return recommendations;
  }

  _prepareJSONExport(imageId, metrics) {
    return JSON.stringify({
      imageId,
      exportDate: new Date().toISOString(),
      metrics
    }, null, 2);
  }

  _prepareCSVExport(imageId, metrics) {
    const rows = [
      ['Image ID', imageId],
      ['Export Date', new Date().toISOString()],
      ['Total Views', metrics.totalViews || 0],
      ['Total Downloads', metrics.totalDownloads || 0],
      ['Average Load Time', metrics.averageLoadTime || 0],
      ['Performance Grade', metrics.performanceGrade || 'N/A'],
      ['SEO Score', metrics.seoScore || 0]
    ];

    return rows.map(row => row.join(',')).join('\n');
  }
}

window.ImageOptimizer = ImageOptimizer;
