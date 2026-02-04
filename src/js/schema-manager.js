/**
 * filepath: src/js/schema-manager.js
 * Schema.org JSON-LD management for SEO (2026 GEO strategy)
 * 
 * Generates and injects structured data for:
 * - Organization (E-E-A-T, brand authority)
 * - ProductGroup (variants, multi-SKU support)
 * - Product (individual items)
 * - BreadcrumbList (site navigation, crawler guidance)
 * - FAQPage (Q-A-V framework)
 */

class SchemaManager {
  constructor(config = {}) {
    this.config = {
      organization: {
        name: 'CanadaClothes.ca',
        url: 'https://canadaclothes.ca',
        logo: 'https://canadaclothes.ca/logo.svg',
        description: 'Premium Canadian-made apparel and accessories for modern lifestyle',
        country: 'CA',
        // E-E-A-T: Expertise, Trustworthiness
        sameAs: [
          'https://www.linkedin.com/company/canadaclothes',
          'https://www.instagram.com/canadaclothes',
          'https://www.twitter.com/canadaclothes'
        ],
        contactPoint: {
          type: 'CustomerService',
          email: 'support@canadaclothes.ca',
          telephone: '+1-555-0123'
        }
      },
      ...config
    };
  }

  /**
   * Inject Organization schema (homepage + all pages)
   * Establishes brand authority for E-E-A-T
   */
  injectOrganizationSchema() {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${this.config.organization.url}/#organization`,
      'name': this.config.organization.name,
      'url': this.config.organization.url,
      'logo': {
        '@type': 'ImageObject',
        'url': this.config.organization.logo,
        'width': 280,
        'height': 60
      },
      'description': this.config.organization.description,
      'areaServed': this.config.organization.country,
      'sameAs': this.config.organization.sameAs,
      'contactPoint': {
        '@type': this.config.organization.contactPoint.type,
        'email': this.config.organization.contactPoint.email,
        'telephone': this.config.organization.contactPoint.telephone
      },
      'foundingDate': '2024',
      'founder': {
        '@type': 'Person',
        'name': 'Founder Name',
        'sameAs': 'https://www.linkedin.com/in/founder'
      }
    };
    this.injectSchema(schema);
  }

  /**
   * Inject ProductGroup schema (multi-variant products)
   * Critical for 2026: Links all SKUs, color variants, sizes
   * @param {Object} product - Product data from store
   * @param {Array} variants - Product variants (color, size, etc)
   */
  injectProductGroupSchema(product, variants = []) {
    const baseUrl = window.location.origin;
    const productUrl = `${baseUrl}/product/${product.id}`;

    const variantItems = variants.map(variant => ({
      '@type': 'Product',
      '@id': `${productUrl}?sku=${variant.sku}`,
      'sku': variant.sku,
      'name': `${product.title} - ${variant.title}`,
      'color': variant.color || undefined,
      'size': variant.size || undefined,
      'description': product.description,
      'image': product.image,
      'brand': {
        '@type': 'Brand',
        'name': 'CanadaClothes.ca'
      },
      'offers': {
        '@type': 'Offer',
        'url': `${productUrl}?sku=${variant.sku}`,
        'priceCurrency': 'CAD',
        'price': (variant.price / 100).toFixed(2),
        'priceValidUntil': new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        'availability': 'InStock',
        'seller': {
          '@type': 'Organization',
          'name': 'CanadaClothes.ca'
        }
      },
      'isVariantOf': {
        '@type': 'ProductGroup',
        '@id': `${productUrl}#product-group`
      }
    }));

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ProductGroup',
      '@id': `${productUrl}#product-group`,
      'name': product.title,
      'description': product.description,
      'url': productUrl,
      'image': product.image,
      'brand': {
        '@type': 'Brand',
        'name': 'CanadaClothes.ca'
      },
      'variesBy': this.getVariationDimensions(variants),
      'hasVariant': variantItems,
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'reviewCount': '127',
        'bestRating': '5',
        'worstRating': '1'
      }
    };

    this.injectSchema(schema);
  }

  /**
   * Inject BreadcrumbList schema
   * Helps Google understand site structure, improves SERP appearance
   * @param {Array} breadcrumbs - [{name: 'Home', url: '/'}, ...]
   */
  injectBreadcrumbSchema(breadcrumbs = []) {
    const items = [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': `${window.location.origin}/`
      },
      ...breadcrumbs.map((crumb, i) => ({
        '@type': 'ListItem',
        'position': i + 2,
        'name': crumb.name,
        'item': crumb.url
      }))
    ];

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': items
    };

    this.injectSchema(schema);
  }

  /**
   * Inject FAQPage schema (Q-A-V framework)
   * Google's AI extracts this for AI Overviews (AIO)
   * @param {Array} qaItems - [{question: '...', answer: '...', atomic: true}]
   */
  injectFAQPageSchema(qaItems = []) {
    const mainEntity = qaItems.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer,
        // Mark atomic answers for AI extraction
        'isAtomic': item.atomic || false
      }
    }));

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': mainEntity
    };

    this.injectSchema(schema);
  }

  /**
   * Inject Article/BlogPosting schema (for brand storytelling)
   * E-E-A-T: Shows original expertise
   * @param {Object} article - {title, description, image, author, datePublished}
   */
  injectArticleSchema(article) {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': article.title,
      'description': article.description,
      'image': article.image,
      'author': {
        '@type': 'Person',
        'name': article.author,
        'sameAs': article.authorUrl || 'https://www.linkedin.com/in/author'
      },
      'datePublished': article.datePublished || new Date().toISOString(),
      'dateModified': article.dateModified || new Date().toISOString(),
      'publisher': {
        '@type': 'Organization',
        'name': 'CanadaClothes.ca',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://canadaclothes.ca/logo.svg'
        }
      },
      'articleBody': article.content || ''
    };

    this.injectSchema(schema);
  }

  /**
   * Helper: Determine variation dimensions from variants
   */
  getVariationDimensions(variants) {
    const dimensions = new Set();
    variants.forEach(v => {
      if (v.color) dimensions.add('color');
      if (v.size) dimensions.add('size');
      if (v.material) dimensions.add('material');
    });
    return Array.from(dimensions);
  }

  /**
   * Helper: Inject schema into <head>
   */
  injectSchema(schema) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  /**
   * Helper: Build multiple schemas (combine into graph)
   */
  injectSchemaGraph(schemas = []) {
    const graph = {
      '@context': 'https://schema.org',
      '@graph': schemas
    };
    this.injectSchema(graph);
  }

  /**
   * ============================================================================
   * PART 3: IMAGE/VISUAL SEO - IMAGEOBJECT & PRODUCT IMAGE SCHEMA
   * ============================================================================
   */

  /**
   * Inject ImageObject schema for individual product images
   * Google Lens optimization: Structured image data for visual search
   * 
   * Specs:
   * - Min 1200x1200px for Google Lens indexing
   * - Ideal 2400x2400px for high-quality visual search results
   * - Alt text required for accessibility & SEO
   * - Multiple angles improve visual search ranking
   * 
   * @param {Object} imageData - Image information
   */
  injectImageObjectSchema(imageData) {
    const {
      url = 'https://via.placeholder.com/1200x1200',
      productName = 'Product',
      productUrl = '',
      width = 1200,
      height = 1200,
      altText = 'Product image',
      angles = [] // Array of views: 'front', 'back', 'detail', etc.
    } = imageData;

    const imageSchema = {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      '@id': `${productUrl}#image`,
      'url': url,
      'name': `${productName} - Product Image`,
      'description': altText,
      'width': {
        '@type': 'QuantitativeValue',
        'value': width
      },
      'height': {
        '@type': 'QuantitativeValue',
        'value': height
      },
      'uploadDate': new Date().toISOString(),
      // Link to product
      'isPartOf': {
        '@type': 'Product',
        '@id': productUrl
      },
      // Author/creator (for E-E-A-T)
      'author': {
        '@type': 'Organization',
        'name': 'CanadaClothes.ca'
      },
      // Copyright information
      'copyrightNotice': '© CanadaClothes.ca',
      'inLanguage': 'en-CA',
      // Accessibility
      'text': altText,
      // Additional angles for multi-view products
      ...(angles.length > 0 && {
        'isPartOf': {
          '@type': 'ImageObjectCollection',
          'hasPart': angles.map((angle, idx) => ({
            '@type': 'ImageObject',
            'url': url.replace(/\.[^.]+$/, `-${angle}.${'webp'}`),
            'name': `${productName} - ${angle}`,
            'position': idx + 1
          }))
        }
      })
    };

    this.injectSchema(imageSchema);
  }

  /**
   * Inject Product schema with enhanced image properties
   * Google Shopping, Google Images, Google Lens optimization
   * 
   * @param {Object} productData - Full product information
   */
  injectProductWithImagesSchema(productData) {
    const {
      id = 'product-1',
      name = 'Product',
      description = '',
      price = 0,
      currency = 'CAD',
      url = `https://canadaclothes.ca/product/${id}`,
      // Image properties (Part 3)
      images = [],
      primaryImage = '',
      color = '',
      material = '',
      // Availability
      available = true,
      // Rating (if applicable)
      rating = null,
      reviews = []
    } = productData;

    // Build image array with all angles
    const imageObjects = images.map((img, idx) => ({
      '@type': 'ImageObject',
      '@id': `${url}#image-${idx}`,
      'url': img.url || img,
      'name': img.alt || `${name} - Image ${idx + 1}`,
      'description': img.alt || `${name} ${color || ''} product image`,
      'width': 1200,
      'height': 1200,
      'position': idx + 1
    }));

    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${url}#product`,
      'sku': id,
      'name': name,
      'description': description,
      'url': url,
      // Primary image (hero image)
      'image': primaryImage || (images.length > 0 ? images[0].url || images[0] : null),
      // All images for visual search
      ...(images.length > 1 && {
        'images': imageObjects.map(img => img.url)
      }),
      // Product details
      'brand': {
        '@type': 'Brand',
        'name': 'CanadaClothes.ca'
      },
      // Offers (pricing)
      'offers': {
        '@type': 'Offer',
        'url': url,
        'priceCurrency': currency,
        'price': (price / 100).toString(), // Convert cents to dollars
        'availability': available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        'seller': {
          '@type': 'Organization',
          'name': 'CanadaClothes.ca',
          'url': 'https://canadaclothes.ca'
        }
      },
      // Product attributes (for variant linking)
      ...(color && { 'color': color }),
      ...(material && { 'material': material }),
      // Reviews and ratings
      ...(rating && {
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': rating.value,
          'bestRating': '5',
          'worstRating': '1',
          'ratingCount': rating.count
        }
      }),
      ...(reviews.length > 0 && {
        'review': reviews.map(review => ({
          '@type': 'Review',
          'author': review.author || 'Customer',
          'reviewRating': {
            '@type': 'Rating',
            'ratingValue': review.rating
          },
          'reviewBody': review.text
        }))
      }),
      // E-E-A-T signals
      'manufacturer': {
        '@type': 'Organization',
        'name': 'CanadaClothes.ca',
        'url': 'https://canadaclothes.ca',
        'sameAs': [
          'https://www.linkedin.com/company/canadaclothes',
          'https://www.instagram.com/canadaclothes'
        ]
      }
    };

    this.injectSchema(productSchema);
  }

  /**
   * Inject Pinterest Rich Pin metadata (embedded in Product schema)
   * Pinterest requires specific schema structure for Rich Pins
   * 
   * @param {Object} productData - Product information
   */
  injectPinterestRichPinSchema(productData) {
    const {
      name = 'Product',
      description = '',
      price = 0,
      currency = 'CAD',
      image = '',
      url = ''
    } = productData;

    // Pinterest Rich Pin uses Product schema with specific properties
    const richPinSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': name,
      'description': description,
      'image': image,
      'price': (price / 100).toString(),
      'priceCurrency': currency,
      'url': url,
      // Pinterest requires availability
      'offers': {
        '@type': 'Offer',
        'availability': 'https://schema.org/InStock',
        'price': (price / 100).toString(),
        'priceCurrency': currency
      }
    };

    this.injectSchema(richPinSchema);
  }

  /**
   * Inject Google Merchant Center image specifications
   * Ensures product images meet Google Shopping requirements
   * 
   * @param {Object} imageData - Image information
   */
  injectGoogleMerchantImageSchema(imageData) {
    const {
      productId = 'product-1',
      productName = 'Product',
      productUrl = '',
      images = [],
      primaryImage = ''
    } = imageData;

    // Google Merchant Center primary image
    const merchantSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${productUrl}#merchant`,
      'sku': productId,
      'name': productName,
      'url': productUrl,
      // Primary image (required for Google Shopping)
      'image': primaryImage || (images.length > 0 ? images[0] : null),
      // Additional images (up to 10)
      'additionalImages': images.slice(1, 10).filter(Boolean)
    };

    this.injectSchema(merchantSchema);
  }

  /**
   * Inject Collection/Gallery schema for multi-angle product images
   * Useful for product galleries showing multiple views
   * 
   * @param {Object} galleryData - Gallery information
   */
  injectImageGallerySchema(galleryData) {
    const {
      productName = 'Product',
      productUrl = '',
      images = []
    } = galleryData;

    const gallerySchema = {
      '@context': 'https://schema.org',
      '@type': 'ImageObjectCollection',
      'name': `${productName} Gallery`,
      'url': productUrl,
      'hasPart': images.map((image, idx) => ({
        '@type': 'ImageObject',
        'url': typeof image === 'string' ? image : image.url,
        'name': typeof image === 'string' ? `${productName} Image ${idx + 1}` : image.alt || `${productName} Image ${idx + 1}`,
        'description': typeof image === 'string' ? null : image.description,
        'position': idx + 1
      }))
    };

    this.injectSchema(gallerySchema);
  }

  /**
   * Inject comprehensive product gallery schema
   * Includes all image views with semantic labeling
   * Used for Google Image Search ranking improvements
   * 
   * @param {Object} galleryConfig - Gallery configuration
   * @param {string} galleryConfig.productId - Product ID
   * @param {string} galleryConfig.productName - Product name
   * @param {string} galleryConfig.productUrl - Product URL
   * @param {string} galleryConfig.productDescription - Product description
   * @param {Object} galleryConfig.imageCollection - Collection of images by view
   * @param {string} galleryConfig.color - Product color
   * @param {string} galleryConfig.material - Product material
   * @param {number} galleryConfig.price - Product price in cents
   * @param {string} galleryConfig.currency - Currency (default: CAD)
   * @param {boolean} galleryConfig.available - In stock status
   */
  injectComprehensiveGallerySchema(galleryConfig) {
    const {
      productId = 'product-1',
      productName = 'Product',
      productUrl = '',
      productDescription = '',
      imageCollection = {},
      color = '',
      material = '',
      price = 0,
      currency = 'CAD',
      available = true
    } = galleryConfig;

    // Build image array from collection with semantic information
    const images = Object.entries(imageCollection).map(([view, imageData], idx) => {
      const url = typeof imageData === 'string' ? imageData : imageData.url;
      const alt = typeof imageData === 'string' ? 
        `${productName} ${view} view` : 
        (imageData.alt || `${productName} ${view} view`);

      return {
        '@type': 'ImageObject',
        '@id': `${productUrl}#image-${view}`,
        'url': url,
        'name': `${productName} - ${view.charAt(0).toUpperCase() + view.slice(1)} View`,
        'description': alt,
        'height': imageData.height || 1500,
        'width': imageData.width || 1200,
        'uploadDate': new Date().toISOString(),
        'position': idx + 1,
        'isPartOf': {
          '@type': 'ImageObjectCollection',
          '@id': `${productUrl}#gallery`
        }
      };
    });

    // Main product schema with all images
    const comprehensiveSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${productUrl}#product`,
      'sku': productId,
      'name': productName,
      'description': productDescription,
      'url': productUrl,
      // Primary image (first image for Google Shopping)
      'image': images.length > 0 ? images[0].url : null,
      // All images in gallery
      'hasImage': images,
      // Variant information
      'color': color || undefined,
      'material': material || undefined,
      // Pricing
      'offers': {
        '@type': 'Offer',
        'price': (price / 100).toFixed(2),
        'priceCurrency': currency,
        'availability': available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        'url': productUrl
      },
      // Gallery collection
      'gallery': {
        '@type': 'ImageObjectCollection',
        '@id': `${productUrl}#gallery`,
        'name': `${productName} Gallery`,
        'hasPart': images
      }
    };

    this.injectSchema(comprehensiveSchema);
  }

  /**
   * Inject gallery image collection schema
   * Creates ImageObjectCollection for multi-angle galleries
   * Improves ranking in Google Images
   * 
   * @param {Object} collectionConfig - Collection config
   * @param {string} collectionConfig.productUrl - Product URL
   * @param {string} collectionConfig.productName - Product name
   * @param {Array} collectionConfig.images - Array of images with view, url, alt
   * @param {number} collectionConfig.totalImages - Total number of images
   */
  injectGalleryCollectionSchema(collectionConfig) {
    const {
      productUrl = '',
      productName = 'Product',
      images = [],
      totalImages = 0
    } = collectionConfig;

    const collectionSchema = {
      '@context': 'https://schema.org',
      '@type': 'ImageObjectCollection',
      '@id': `${productUrl}#gallery`,
      'name': `${productName} Product Gallery`,
      'description': `Collection of ${totalImages > 0 ? totalImages : images.length} product images showing different angles and views of ${productName}`,
      'url': productUrl,
      'numberOfItems': totalImages > 0 ? totalImages : images.length,
      'hasPart': images.map((img, idx) => ({
        '@type': 'ImageObject',
        '@id': `${productUrl}#image-${idx + 1}`,
        'url': img.url || img,
        'name': img.name || img.view || `${productName} - View ${idx + 1}`,
        'description': img.alt || img.description || `${productName} product image ${idx + 1}`,
        'position': idx + 1,
        'height': img.height || 1500,
        'width': img.width || 1200
      }))
    };

    this.injectSchema(collectionSchema);
  }

  /**
   * Inject multi-view product schema
   * Structured data for products with multiple viewing angles
   * Optimized for Google Images and visual search
   * 
   * @param {Object} viewConfig - Multi-view configuration
   * @param {string} viewConfig.productId - Product ID
   * @param {string} viewConfig.productName - Product name
   * @param {string} viewConfig.productUrl - Product URL
   * @param {Array} viewConfig.views - Array of view objects {name, url, alt}
   * @param {string} viewConfig.description - Product description
   * @param {number} viewConfig.price - Price in cents
   * @param {string} viewConfig.currency - Currency code
   */
  injectMultiViewProductSchema(viewConfig) {
    const {
      productId = '',
      productName = '',
      productUrl = '',
      views = [],
      description = '',
      price = 0,
      currency = 'CAD'
    } = viewConfig;

    // Build image object with all views
    const imageObjects = views.map((view, idx) => ({
      '@type': 'ImageObject',
      'url': view.url,
      'name': `${productName} - ${view.name || `View ${idx + 1}`}`,
      'description': view.alt || `${productName} shown in ${view.name || `angle ${idx + 1}`}`,
      'uploadDate': new Date().toISOString(),
      'isPartOf': `${productUrl}#gallery`
    }));

    const multiViewSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${productUrl}#product`,
      'sku': productId,
      'name': productName,
      'description': description,
      'url': productUrl,
      'image': views.length > 0 ? views[0].url : null,
      'hasImage': imageObjects,
      'offers': {
        '@type': 'Offer',
        'price': (price / 100).toFixed(2),
        'priceCurrency': currency,
        'availability': 'https://schema.org/InStock',
        'url': productUrl
      }
    };

    this.injectSchema(multiViewSchema);
  }

  /**
   * Inject gallery breadcrumb navigation schema
   * For navigation within product gallery
   * 
   * @param {Object} breadcrumbConfig - Breadcrumb configuration
   * @param {string} breadcrumbConfig.currentView - Current view name
   * @param {number} breadcrumbConfig.currentIndex - Current image index
   * @param {number} breadcrumbConfig.totalViews - Total views count
   * @param {string} breadcrumbConfig.productUrl - Product URL
   * @param {string} breadcrumbConfig.productName - Product name
   */
  injectGalleryBreadcrumbSchema(breadcrumbConfig) {
    const {
      currentView = 'Gallery',
      currentIndex = 1,
      totalViews = 1,
      productUrl = '',
      productName = 'Product'
    } = breadcrumbConfig;

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': productName,
          'item': productUrl
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': 'Gallery',
          'item': `${productUrl}#gallery`
        },
        {
          '@type': 'ListItem',
          'position': 3,
          'name': `${currentView} (${currentIndex} of ${totalViews})`,
          'item': `${productUrl}#image-${currentIndex}`
        }
      ]
    };

    this.injectSchema(breadcrumbSchema);
  }

  /**
   * ═════════════════════════════════════════════════════════════════════════
   * PART 3.4: GOOGLE LENS & PINTEREST INTEGRATION SCHEMAS
   * ═════════════════════════════════════════════════════════════════════════
   */

  /**
   * Inject Google Lens optimized schema for visual search
   * Creates ImageObject with all Google Lens requirements
   * 
   * @param {Object} lensConfig - Google Lens configuration
   * @param {string} lensConfig.productId - Product ID
   * @param {string} lensConfig.productName - Product name
   * @param {string} lensConfig.productUrl - Product URL
   * @param {string} lensConfig.imageUrl - Image URL (min 1200x1200)
   * @param {string} lensConfig.altText - Alt text (100-150 chars)
   * @param {number} lensConfig.width - Image width
   * @param {number} lensConfig.height - Image height
   * @param {string} lensConfig.color - Product color
   * @param {string} lensConfig.material - Material/composition
   */
  injectGoogleLensSchema(lensConfig) {
    const {
      productId = '',
      productName = '',
      productUrl = '',
      imageUrl = '',
      altText = '',
      width = 2400,
      height = 2400,
      color = '',
      material = ''
    } = lensConfig;

    const lensSchema = {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      '@id': `${productUrl}#image-lens`,
      'url': imageUrl,
      'name': `${productName} - Product Image for Google Lens`,
      'description': altText,
      'width': width,
      'height': height,
      'encodingFormat': 'image/webp',
      'uploadDate': new Date().toISOString(),
      'datePublished': new Date().toISOString(),
      // Google Lens context
      'isPartOf': {
        '@type': 'Product',
        '@id': `${productUrl}#product`,
        'name': productName,
        'color': color || undefined,
        'material': material || undefined
      },
      // Creator/Publisher info (E-E-A-T)
      'author': {
        '@type': 'Organization',
        'name': 'CanadaClothes.ca',
        'url': 'https://canadaclothes.ca',
        'sameAs': [
          'https://www.instagram.com/canadaclothes',
          'https://www.pinterest.com/canadaclothes'
        ]
      },
      'copyrightNotice': '© CanadaClothes.ca',
      'creditText': 'CanadaClothes.ca - Premium Canadian Fashion',
      // Visual search metadata
      'representation': 'primary',
      'semanticMetadata': {
        'productCategory': 'apparel',
        'hasAttribute': [
          { '@type': 'PropertyValue', 'name': 'Color', 'value': color },
          { '@type': 'PropertyValue', 'name': 'Material', 'value': material }
        ]
      }
    };

    this.injectSchema(lensSchema);
  }

  /**
   * Inject Pinterest Rich Pin schema
   * Creates structured data specifically for Pinterest visual discovery
   * 
   * @param {Object} pinConfig - Pinterest configuration
   * @param {string} pinConfig.productId - Product ID
   * @param {string} pinConfig.productName - Product name
   * @param {string} pinConfig.description - Product description
   * @param {string} pinConfig.productUrl - Product URL
   * @param {string} pinConfig.imageUrl - Image URL (1000x1500 ideal)
   * @param {number} pinConfig.price - Price in cents
   * @param {string} pinConfig.currency - Currency (CAD, USD, etc)
   * @param {boolean} pinConfig.available - In stock status
   * @param {string} pinConfig.category - Product category
   */
  injectPinterestRichPin(pinConfig) {
    const {
      productId = '',
      productName = '',
      description = '',
      productUrl = '',
      imageUrl = '',
      price = 0,
      currency = 'CAD',
      available = true,
      category = ''
    } = pinConfig;

    const priceFormatted = (price / 100).toFixed(2);

    const pinSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${productUrl}#pinterest`,
      'sku': productId,
      'name': productName,
      'description': description.substring(0, 200),
      'url': productUrl,
      'image': imageUrl,
      // Pinterest specific image format
      'visual': {
        '@type': 'ImageObject',
        'url': imageUrl,
        'width': 1000,
        'height': 1500,
        'aspectRatio': '2:3',
        'representation': 'primary'
      },
      // Pricing
      'offers': {
        '@type': 'Offer',
        'price': priceFormatted,
        'priceCurrency': currency,
        'availability': available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        'url': productUrl,
        'seller': {
          '@type': 'Organization',
          'name': 'CanadaClothes.ca',
          'url': 'https://canadaclothes.ca'
        }
      },
      // Category for Pinterest discovery
      'category': category || 'Fashion',
      // Brand information
      'brand': {
        '@type': 'Brand',
        'name': 'CanadaClothes.ca',
        'url': 'https://canadaclothes.ca'
      },
      // Hashtags for Pinterest social discovery
      'keywords': `${productName}, ${category}, handmade, Canadian, sustainable`,
      // Pinterest pinning metadata
      'potentialAction': {
        '@type': 'PinAction',
        'name': `Save "${productName}" to Pinterest`,
        'url': `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(productUrl)}&media=${encodeURIComponent(imageUrl)}`
      }
    };

    this.injectSchema(pinSchema);
  }

  /**
   * Inject comprehensive social commerce schema
   * Optimizes for Pinterest, Instagram, and other visual platforms
   * 
   * @param {Object} socialConfig - Social commerce configuration
   * @param {string} socialConfig.productId - Product ID
   * @param {string} socialConfig.productName - Product name
   * @param {string} socialConfig.description - Product description
   * @param {string} socialConfig.productUrl - Product URL
   * @param {string} socialConfig.imageUrl - Product image
   * @param {number} socialConfig.price - Price in cents
   * @param {string} socialConfig.currency - Currency code
   * @param {Array} socialConfig.socialLinks - Social media links
   */
  injectSocialCommerceSchema(socialConfig) {
    const {
      productId = '',
      productName = '',
      description = '',
      productUrl = '',
      imageUrl = '',
      price = 0,
      currency = 'CAD',
      socialLinks = []
    } = socialConfig;

    const socialSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${productUrl}#social`,
      'sku': productId,
      'name': productName,
      'description': description,
      'url': productUrl,
      'image': imageUrl,
      'offers': {
        '@type': 'Offer',
        'price': (price / 100).toFixed(2),
        'priceCurrency': currency,
        'availability': 'https://schema.org/InStock'
      },
      // Social media presence
      'sameAs': socialLinks,
      // Shoppable content metadata
      'isAccessibleForFree': false,
      'isShoppable': true,
      // Creator/Organization info
      'creator': {
        '@type': 'Organization',
        'name': 'CanadaClothes.ca',
        'url': 'https://canadaclothes.ca',
        'sameAs': [
          'https://www.instagram.com/canadaclothes',
          'https://www.pinterest.com/canadaclothes',
          'https://www.facebook.com/canadaclothes'
        ],
        'contactPoint': {
          '@type': 'ContactPoint',
          'contactType': 'Customer Service',
          'email': 'hello@canadaclothes.ca'
        }
      }
    };

    this.injectSchema(socialSchema);
  }

  /**
   * Inject visual search optimization schema
   * Comprehensive schema for Google Images, Google Lens, and visual search
   * 
   * @param {Object} visualConfig - Visual search configuration
   * @param {string} visualConfig.productId - Product ID
   * @param {string} visualConfig.productName - Product name
   * @param {string} visualConfig.productUrl - Product URL
   * @param {Array} visualConfig.images - Array of images {url, alt, view}
   * @param {number} visualConfig.price - Price in cents
   * @param {string} visualConfig.currency - Currency
   */
  injectVisualSearchSchema(visualConfig) {
    const {
      productId = '',
      productName = '',
      productUrl = '',
      images = [],
      price = 0,
      currency = 'CAD'
    } = visualConfig;

    const visualSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${productUrl}#visual`,
      'sku': productId,
      'name': productName,
      'url': productUrl,
      'image': images.map(img => img.url || img),
      'offers': {
        '@type': 'Offer',
        'price': (price / 100).toFixed(2),
        'priceCurrency': currency,
        'availability': 'https://schema.org/InStock'
      },
      // Visual content collection
      'hasImage': images.map((img, idx) => ({
        '@type': 'ImageObject',
        'url': img.url || img,
        'name': img.name || img.view || `Product Image ${idx + 1}`,
        'description': img.alt || '',
        'position': idx + 1,
        'isPartOf': `${productUrl}#visual-collection`
      })),
      // Visual search optimization
      'visualSearch': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': 'https://lens.google.com/uploadbyurl?url={url}'
        }
      }
    };

    this.injectSchema(visualSchema);
  }

  /**
   * Inject product image collection for visual commerce
   * Creates structured data for product galleries with multiple angles
   * 
   * @param {Object} collectionConfig - Collection configuration
   * @param {string} collectionConfig.productId - Product ID
   * @param {string} collectionConfig.productName - Product name
   * @param {Array} collectionConfig.images - Images with metadata
   * @param {string} collectionConfig.primaryImage - Primary image URL
   */
  injectProductImageCollection(collectionConfig) {
    const {
      productId = '',
      productName = '',
      images = [],
      primaryImage = ''
    } = collectionConfig;

    const collectionSchema = {
      '@context': 'https://schema.org',
      '@type': 'ImageObjectCollection',
      '@id': `product:${productId}#images`,
      'name': `${productName} - Image Collection`,
      'description': `Multiple views of ${productName}`,
      'numberOfItems': images.length,
      'image': primaryImage,
      'hasPart': images.map((img, idx) => ({
        '@type': 'ImageObject',
        '@id': `product:${productId}#image-${idx}`,
        'url': img.url,
        'name': img.name || `View ${idx + 1}`,
        'description': img.alt || '',
        'uploadDate': new Date().toISOString(),
        'position': idx + 1
      }))
    };

    this.injectSchema(collectionSchema);
  }

  /**
   * ═════════════════════════════════════════════════════════════════════════
   * PART 3.5: IMAGE METADATA OPTIMIZATION SCHEMAS
   * ═════════════════════════════════════════════════════════════════════════
   */

  /**
   * Inject image metadata schema for search engines
   * Embeds comprehensive EXIF-like metadata in schema
   * 
   * @param {Object} metadataConfig - Metadata configuration
   * @param {string} metadataConfig.imageUrl - Image URL
   * @param {string} metadataConfig.productName - Product name
   * @param {string} metadataConfig.description - Product description
   * @param {number} metadataConfig.width - Image width
   * @param {number} metadataConfig.height - Image height
   * @param {string} metadataConfig.format - Image format
   * @param {string} metadataConfig.uploadDate - Upload date (ISO 8601)
   * @param {string} metadataConfig.photographer - Photographer name
   * @param {Array} metadataConfig.keywords - Keywords array
   */
  injectImageMetadataSchema(metadataConfig = {}) {
    const {
      imageUrl = '',
      productName = '',
      description = '',
      width = 0,
      height = 0,
      format = 'webp',
      uploadDate = new Date().toISOString(),
      photographer = 'Canada Clothes Co.',
      keywords = []
    } = metadataConfig;

    const metadataSchema = {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      'url': imageUrl,
      'name': productName,
      'description': description.substring(0, 200),
      'width': width,
      'height': height,
      'encodingFormat': this._getMimeType(format),
      'inLanguage': 'en-CA',
      
      // Technical metadata
      'about': {
        '@type': 'Thing',
        'name': 'Image Metadata',
        'additionalProperty': [
          { 'name': 'format', 'value': format },
          { 'name': 'photographer', 'value': photographer },
          { 'name': 'quality', 'value': 'professional' },
          { 'name': 'usage', 'value': 'ecommerce-product' }
        ]
      },

      // Dates
      'datePublished': uploadDate,
      'dateCreated': uploadDate,
      'dateModified': new Date().toISOString(),

      // Creator information
      'creator': {
        '@type': 'Organization',
        'name': photographer,
        'url': 'https://canadaclothes.ca'
      },

      // Copyright
      'copyrightHolder': {
        '@type': 'Organization',
        'name': 'Canada Clothes Co.',
        'url': 'https://canadaclothes.ca'
      },
      'copyrightYear': new Date().getFullYear(),

      // Keywords for discoverability
      'keywords': keywords.join(', '),

      // Licensing
      'license': 'https://canadaclothes.ca/license',
      'usageRights': 'Proprietary - All Rights Reserved',

      // Author/E-E-A-T
      'author': {
        '@type': 'Organization',
        'name': 'Canada Clothes Co.',
        'url': 'https://canadaclothes.ca',
        'logo': 'https://canadaclothes.ca/logo.png'
      },

      // Representation
      'representativeOfPage': true,
      'isPartOf': {
        '@type': 'Product',
        'url': `https://canadaclothes.ca/products`
      }
    };

    this.injectSchema(metadataSchema);
  }

  /**
   * Inject image sitemap schema
   * Helps search engines discover and index images
   * 
   * @param {Object} sitemapConfig - Sitemap configuration
   * @param {Array} sitemapConfig.images - Array of image objects
   * @param {string} sitemapConfig.lastModified - Last modified date
   */
  injectImageSitemapSchema(sitemapConfig = {}) {
    const {
      images = [],
      lastModified = new Date().toISOString()
    } = sitemapConfig;

    // Create sitemap schema
    const imageSitemapSchema = {
      '@context': 'https://schema.org',
      '@type': 'ImageObjectCollection',
      'name': 'Product Image Sitemap',
      'description': 'Complete collection of product images',
      'dateModified': lastModified,
      'publisher': {
        '@type': 'Organization',
        'name': 'Canada Clothes Co.',
        'url': 'https://canadaclothes.ca'
      },
      'image': images.map(img => ({
        '@type': 'ImageObject',
        'url': img.url || '',
        'name': img.name || '',
        'description': img.description || '',
        'width': img.width || 0,
        'height': img.height || 0,
        'uploadDate': img.uploadDate || lastModified
      }))
    };

    this.injectSchema(imageSitemapSchema);

    // Also inject structured sitemap URL
    const sitemapMeta = document.createElement('link');
    sitemapMeta.rel = 'sitemap';
    sitemapMeta.type = 'application/xml';
    sitemapMeta.href = '/sitemap-images.xml';
    document.head.appendChild(sitemapMeta);
  }

  /**
   * Inject copyright and attribution schema
   * Makes copyright information machine-readable
   * 
   * @param {Object} copyrightConfig - Copyright configuration
   * @param {string} copyrightConfig.copyrightHolder - Copyright holder name
   * @param {number} copyrightConfig.copyrightYear - Copyright year
   * @param {string} copyrightConfig.license - License type
   * @param {string} copyrightConfig.photographer - Photographer name
   */
  injectCopyrightSchema(copyrightConfig = {}) {
    const {
      copyrightHolder = 'Canada Clothes Co.',
      copyrightYear = new Date().getFullYear(),
      license = 'proprietary',
      photographer = 'Canada Clothes Studio'
    } = copyrightConfig;

    const copyrightSchema = {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      'name': 'Product Photography',
      'creator': {
        '@type': 'Person',
        'name': photographer
      },
      'copyrightHolder': {
        '@type': 'Organization',
        'name': copyrightHolder,
        'url': 'https://canadaclothes.ca'
      },
      'copyrightYear': copyrightYear,
      'license': this._getLicenseUrl(license),
      'usageRights': this._getLicenseName(license),
      'datePublished': new Date().toISOString(),
      'inLanguage': 'en-CA'
    };

    this.injectSchema(copyrightSchema);
  }

  /**
   * Inject image quality assessment schema
   * Signals image optimization to search engines
   * 
   * @param {Object} qualityConfig - Quality configuration
   * @param {string} qualityConfig.imageUrl - Image URL
   * @param {string} qualityConfig.quality - Quality level (professional, high, standard)
   * @param {number} qualityConfig.sharpness - Sharpness score (0-1)
   * @param {number} qualityConfig.contrast - Contrast score (0-1)
   * @param {number} qualityConfig.colorAccuracy - Color accuracy score (0-1)
   */
  injectImageQualitySchema(qualityConfig = {}) {
    const {
      imageUrl = '',
      quality = 'professional',
      sharpness = 0.85,
      contrast = 0.78,
      colorAccuracy = 0.92
    } = qualityConfig;

    const qualitySchema = {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      'url': imageUrl,
      'name': 'Image Quality Assessment',
      'about': {
        '@type': 'Thing',
        'name': 'Quality Metrics',
        'additionalProperty': [
          {
            'name': 'quality-level',
            'value': quality,
            'propertyID': 'https://schema.org/Text'
          },
          {
            'name': 'sharpness',
            'value': (sharpness * 100).toFixed(0),
            'unitText': 'percent',
            'propertyID': 'https://schema.org/Number'
          },
          {
            'name': 'contrast',
            'value': (contrast * 100).toFixed(0),
            'unitText': 'percent',
            'propertyID': 'https://schema.org/Number'
          },
          {
            'name': 'color-accuracy',
            'value': (colorAccuracy * 100).toFixed(0),
            'unitText': 'percent',
            'propertyID': 'https://schema.org/Number'
          },
          {
            'name': 'optimization-status',
            'value': 'optimized-for-web',
            'propertyID': 'https://schema.org/Text'
          }
        ]
      }
    };

    this.injectSchema(qualitySchema);
  }

  /**
   * Inject image optimization report schema
   * Creates structured data for image optimization metrics
   * 
   * @param {Object} reportConfig - Report configuration
   * @param {string} reportConfig.productId - Product ID
   * @param {string} reportConfig.productName - Product name
   * @param {Array} reportConfig.optimizations - List of applied optimizations
   * @param {number} reportConfig.compressionRatio - Compression ratio
   * @param {string} reportConfig.generatedDate - Generation date
   */
  injectImageOptimizationReportSchema(reportConfig = {}) {
    const {
      productId = '',
      productName = '',
      optimizations = [],
      compressionRatio = 0,
      generatedDate = new Date().toISOString()
    } = reportConfig;

    const reportSchema = {
      '@context': 'https://schema.org',
      '@type': 'Report',
      'name': `Image Optimization Report - ${productName}`,
      'url': `https://canadaclothes.ca/products/${productId}`,
      'datePublished': generatedDate,
      'about': {
        '@type': 'Product',
        'identifier': productId,
        'name': productName
      },
      'author': {
        '@type': 'Organization',
        'name': 'Canada Clothes Co.',
        'url': 'https://canadaclothes.ca'
      },
      'text': 'Image Optimization Report',
      'articleBody': optimizations.join('; '),
      'keywords': optimizations.join(', '),
      'additionalProperty': [
        {
          'name': 'compression-ratio',
          'value': compressionRatio,
          'unitText': 'percent'
        },
        {
          'name': 'optimizations-applied',
          'value': optimizations.length,
          'unitText': 'count'
        },
        {
          'name': 'format-variants',
          'value': ['AVIF', 'WebP', 'JPEG'].join(', ')
        }
      ]
    };

    this.injectSchema(reportSchema);
  }

  /**
   * Inject structured image filename schema
   * Makes filename conventions machine-readable
   * 
   * @param {Object} filenameConfig - Filename configuration
   * @param {string} filenameConfig.productId - Product ID
   * @param {string} filenameConfig.filename - Actual filename
   * @param {string} filenameConfig.view - View angle/perspective
   * @param {string} filenameConfig.dimensions - Image dimensions
   * @param {string} filenameConfig.format - File format
   */
  injectFilenameSchemaMetadata(filenameConfig = {}) {
    const {
      productId = '',
      filename = '',
      view = '',
      dimensions = '',
      format = ''
    } = filenameConfig;

    // Meta tags for filename parsing
    const fileMeta = document.createElement('meta');
    fileMeta.name = 'image-filename';
    fileMeta.content = filename;
    document.head.appendChild(fileMeta);

    const viewMeta = document.createElement('meta');
    viewMeta.name = 'image-view';
    viewMeta.content = view;
    document.head.appendChild(viewMeta);

    const dimMeta = document.createElement('meta');
    dimMeta.name = 'image-dimensions';
    dimMeta.content = dimensions;
    document.head.appendChild(dimMeta);

    const formatMeta = document.createElement('meta');
    formatMeta.name = 'image-format';
    formatMeta.content = format;
    document.head.appendChild(formatMeta);

    // Structured data
    const filenameSchema = {
      '@context': 'https://schema.org',
      '@type': 'Thing',
      'identifier': productId,
      'name': filename,
      'description': `Product image: ${view} view`,
      'url': filename,
      'additionalProperty': [
        {
          'name': 'filename-convention',
          'value': `${productId}-${view}-${dimensions}.${format}`
        },
        {
          'name': 'product-id',
          'value': productId
        },
        {
          'name': 'view-angle',
          'value': view
        },
        {
          'name': 'image-dimensions',
          'value': dimensions
        },
        {
          'name': 'file-format',
          'value': format
        }
      ]
    };

    this.injectSchema(filenameSchema);
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
      gif: 'image/gif'
    };
    return types[format.toLowerCase()] || 'image/jpeg';
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

  // ============================================
  // PART 3.6: Analytics & Performance Schemas
  // ============================================

  /**
   * Inject image analytics event schema
   * @param {Object} analyticsEvent - Analytics event data
   */
  injectImageAnalyticsSchema(analyticsEvent = {}) {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: `Image ${analyticsEvent.eventType || 'interaction'} tracked`,
      startDate: analyticsEvent.timestamp,
      url: window.location.href,
      location: {
        '@type': 'Place',
        name: 'Web Page'
      },
      isAccessibleForFree: true,
      image: {
        '@type': 'ImageObject',
        url: analyticsEvent.imageId,
        description: `Analytics for image: ${analyticsEvent.imageId}`
      },
      recordedIn: {
        '@type': 'CreativeWork',
        name: 'Image Analytics',
        description: `Event: ${analyticsEvent.eventType}, Device: ${analyticsEvent.deviceType}, Duration: ${analyticsEvent.duration}ms`
      }
    };

    this._injectSchema(schema);
  }

  /**
   * Inject image performance metrics schema
   * @param {Object} performanceMetrics - Performance metrics
   */
  injectImagePerformanceSchema(performanceMetrics = {}) {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Image Performance Metrics',
      description: 'Comprehensive image performance analysis',
      mainEntity: {
        '@type': 'Dataset',
        name: 'Image Performance Metrics',
        description: 'Core Web Vitals and image-specific metrics',
        temporalCoverage: 'session',
        distribution: {
          '@type': 'DataDownload',
          encodingFormat: 'JSON',
          contentUrl: '#'
        },
        measurementTechnique: [
          `LCP: ${performanceMetrics.pageLoadImpact?.lcp || 0}ms`,
          `CLS: ${performanceMetrics.pageLoadImpact?.cls || 0}`,
          `INP: ${performanceMetrics.pageLoadImpact?.inp || 0}ms`,
          `Load Time: ${performanceMetrics.imageSpecificMetrics?.loadTime || 0}ms`,
          `Render Time: ${performanceMetrics.imageSpecificMetrics?.renderTime || 0}ms`,
          `Compression Ratio: ${performanceMetrics.imageSpecificMetrics?.compressionRatio || 0}%`
        ]
      }
    };

    this._injectSchema(schema);
  }

  /**
   * Inject SEO impact analysis schema
   * @param {Object} seoImpact - SEO impact data
   */
  injectSEOImpactSchema(seoImpact = {}) {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: 'SEO Impact Analysis',
      description: 'Image SEO performance and impact metrics',
      author: {
        '@type': 'Organization',
        name: 'Canada Clothes Co.'
      },
      datePublished: seoImpact.timestamp,
      keywords: [
        'Google Images',
        'SEO',
        'Image Optimization',
        'Search Visibility',
        'Image Rank'
      ],
      about: {
        '@type': 'Thing',
        name: 'Image Search Visibility',
        description: `Google Images Impressions: ${seoImpact.searchVisibility?.impressions || 0}, Clicks: ${seoImpact.searchVisibility?.clicks || 0}, CTR: ${seoImpact.searchVisibility?.ctr || 0}%`
      },
      review: {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: seoImpact.seoScore || 0,
          bestRating: 100,
          worstRating: 0
        },
        reviewBody: `SEO Optimization Score: ${seoImpact.seoScore || 0}/100. ${seoImpact.improvementOpportunities?.join(', ') || 'Optimization complete.'}`
      }
    };

    this._injectSchema(schema);
  }

  /**
   * Inject analytics aggregation schema
   * @param {Object} analyticsData - Aggregated analytics data
   */
  injectAnalyticsAggregationSchema(analyticsData = {}) {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Report',
      name: 'Image Analytics Report',
      description: 'Comprehensive image analytics and performance report',
      datePublished: analyticsData.reportDate,
      author: {
        '@type': 'Organization',
        name: 'Canada Clothes Co.'
      },
      about: {
        '@type': 'Dataset',
        name: 'Image Performance Dataset',
        description: 'Analytics for images across all platforms'
      },
      hasPart: [
        {
          '@type': 'Table',
          name: 'Performance Summary',
          description: `Views: ${analyticsData.summary?.totalViews || 0}, Downloads: ${analyticsData.summary?.totalDownloads || 0}, Interactions: ${analyticsData.summary?.totalInteractions || 0}`
        },
        {
          '@type': 'Table',
          name: 'SEO Summary',
          description: `SEO Score: ${analyticsData.seoSummary?.seoScore || 0}, Google Images Impressions: ${analyticsData.seoSummary?.googleImagesImpressions || 0}`
        },
        {
          '@type': 'Table',
          name: 'Audience Insights',
          description: `Avg Session Duration: ${analyticsData.audienceInsights?.avgSessionDuration || 0}s, Bounce Rate: ${analyticsData.audienceInsights?.bounceRate || 0}%`
        }
      ]
    };

    this._injectSchema(schema);
  }

  /**
   * Inject user engagement tracking schema
   * @param {Object} engagementData - User engagement data
   */
  injectUserEngagementSchema(engagementData = {}) {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: 'User Engagement Metrics',
      description: 'Tracking user interactions with images',
      interactionStatistic: [
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/ViewAction',
          userInteractionCount: engagementData.totalViews || 0
        },
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/DownloadAction',
          userInteractionCount: engagementData.totalDownloads || 0
        },
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/InteractAction',
          userInteractionCount: engagementData.totalInteractions || 0
        }
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: engagementData.engagementScore || 0,
        ratingCount: engagementData.interactionCount || 0,
        bestRating: 100,
        worstRating: 0
      }
    };

    this._injectSchema(schema);
  }

  /**
   * Inject conversion tracking schema
   * @param {Object} conversionData - Conversion tracking data
   */
  injectConversionTrackingSchema(conversionData = {}) {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: 'Image Conversion Event',
      description: 'Tracking conversions related to image interactions',
      startDate: conversionData.timestamp,
      location: {
        '@type': 'VirtualLocation',
        url: window.location.href
      },
      offers: {
        '@type': 'Offer',
        url: conversionData.conversionUrl || window.location.href,
        price: conversionData.conversionValue || '0',
        priceCurrency: conversionData.currency || 'CAD'
      },
      result: {
        '@type': 'Thing',
        name: conversionData.conversionType || 'Unknown Conversion',
        description: `Conversion ID: ${conversionData.conversionId || 'N/A'}, Attribution: ${conversionData.attribution || 'Direct'}`
      }
    };

    this._injectSchema(schema);
  }

  /**
   * Inject device and network information schema
   * @param {Object} deviceData - Device and network data
   */
  injectDeviceNetworkSchema(deviceData = {}) {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Image Analytics - Device & Network',
      description: 'Device and network metrics for image delivery',
      operatingSystem: deviceData.operatingSystem || 'Unknown',
      browserVersion: deviceData.browserVersion || 'Unknown',
      potentialAction: {
        '@type': 'TrackAction',
        name: 'Network Monitoring',
        target: {
          '@type': 'EntryPoint',
          httpMethod: 'POST',
          contentType: 'application/json',
          properties: [
            { name: 'deviceType', value: deviceData.deviceType || 'Unknown' },
            { name: 'networkType', value: deviceData.networkType || 'Unknown' },
            { name: 'effectiveType', value: deviceData.effectiveType || '4g' },
            { name: 'bandwidth', value: `${deviceData.bandwidth || 0} Mbps` },
            { name: 'latency', value: `${deviceData.latency || 0}ms` }
          ]
        }
      }
    };

    this._injectSchema(schema);
  }

  /**
   * Inject image recommendation schema based on analytics
   * @param {Object} recommendations - Recommendations data
   */
  injectRecommendationSchema(recommendations = {}) {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'RecommendationEngine',
      name: 'Image Optimization Recommendations',
      description: 'AI-powered recommendations based on analytics',
      recommendationCount: (recommendations.recommendations || []).length,
      recommendation: (recommendations.recommendations || []).map((rec, index) => ({
        '@type': 'Recommendation',
        name: `Recommendation ${index + 1}`,
        description: rec,
        priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
        potentialAction: {
          '@type': 'Action',
          name: 'Apply Recommendation',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: window.location.href
          }
        }
      }))
    };

    this._injectSchema(schema);
  }
}

// Export for use in app.js
window.SchemaManager = SchemaManager;
