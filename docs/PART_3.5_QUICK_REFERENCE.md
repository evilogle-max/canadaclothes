# Part 3.5: Quick Reference Card

**Methods | Signatures | Properties | Specs**

---

## ImageOptimizer Methods

### `generateOptimizedFilename(config) → Object`

**Input:**
```javascript
{
  productId: string,
  productName: string,
  view: string,
  width: number,
  height: number,
  format: string  // webp, avif, jpeg
}
```

**Output:**
```javascript
{
  idBased: string,              // "123-front-2400x3000.webp"
  nameBased: string,            // "navy-blue-coat-front-2400x3000.webp"
  descriptive: string,          // Full descriptive filename
  cdnPath: object,              // CDN path variants
  metadata: object              // Filename metadata
}
```

**Time:** <1ms | **Size:** 1-5 KB

---

### `generateImageMetadata(config) → Object`

**Input:**
```javascript
{
  productId: string,
  productName: string,
  description: string,
  category: string,
  tags: string[],
  width: number,
  height: number,
  format: string,
  view: string,
  uploadDate: ISO8601,
  creator: string
}
```

**Output:** Large object with sections:
- `dimensions` - Width, height, aspect ratio, file size
- `content` - Product info, keywords, tags
- `creator` - Copyright info, credit
- `dates` - Created, modified, published
- `seo` - Title, description, keywords
- `technical` - MIME type, format, color space
- `quality` - Sharpness, contrast, color accuracy
- `usage` - CDN paths, alt text, captions

**Time:** 2-3ms | **Size:** 20-30 KB per image

---

### `generateCopyrightMetadata(config) → Object`

**Input:**
```javascript
{
  productName: string,
  photoDate: string,           // "2026"
  photographer: string,
  studio: string,
  license: string  // proprietary, cc0, cc-by, cc-by-sa, cc-by-nc
}
```

**Output:**
```javascript
{
  copyright: object,           // Statement, year, owner
  attribution: object,         // Required formats
  license: object,             // Type, restrictions, permissions
  usage: object,               // Commercial, modification rights
  watermark: object,           // Watermark info
  standardStatements: object   // MLA, APA, Chicago, HTML
}
```

**Time:** <1ms | **Size:** 5-10 KB per product

---

## SchemaManager Methods

### `injectImageMetadataSchema(config)`

**Injects:** ImageObject schema with full metadata

**Output:** JSON-LD in page for search engines

**Impact:** +1-2 KB per injection

---

### `injectImageSitemapSchema(config)`

**Injects:** ImageObjectCollection + sitemap link in head

**Output:** XML-compatible image sitemap structure

**Impact:** +15-30 KB total (multiple images)

---

### `injectCopyrightSchema(config)`

**Injects:** CreativeWork schema with copyright info

**Output:** Copyright information in schema form

**Impact:** +2-3 KB per injection

---

### `injectImageQualitySchema(config)`

**Input Quality Metrics:**
```javascript
{
  qualityLevel: 0.85,          // 0-1 scale
  sharpness: 0.85,
  contrast: 0.78,
  colorAccuracy: 0.92
}
```

**Injects:** ImageObject with quality metrics

**Impact:** +1 KB per injection

---

### `injectImageOptimizationReportSchema(config)`

**Injects:** Report schema with optimization metrics

**Output:** Structured optimization data

**Impact:** +2-3 KB

---

### `injectFilenameSchemaMetadata(config)`

**Injects:** Meta tags + JSON-LD for filename conventions

**Output:** Machine-readable filename structure

**Impact:** +1-2 KB

---

## App Integration Methods

| Method | Purpose | Impact | Notes |
|--------|---------|--------|-------|
| `optimizeImageFilenames()` | Generate filenames for all products | <500ms | Caches in `filenameMappings` |
| `generateImageMetadata()` | Generate metadata for all products | <500ms | Caches in `imageMetadata` |
| `generateCopyrightMetadata()` | Generate copyright for all products | <500ms | Caches in `copyrightMetadata` |
| `injectImageMetadataSchemas()` | Inject schemas for top 10 | <100ms | Performance optimized |
| `injectImageSitemap()` | Create image sitemap (50 products) | <100ms | Once per page |
| `injectFilenameMetadata()` | Inject filename conventions (5 products) | <50ms | Sample injection |
| `injectImageQualityAssessment()` | Inject quality for 10 products | <100ms | Quality signals |
| `generateImageOptimizationReport()` | Create optimization report | <50ms | Returns summary |
| `exportMetadataForBulkOperations()` | Export CSV | <100ms | All products |
| `disposeMetadataOptimization()` | Cleanup caches | <10ms | Call on unload |

---

## License Types Reference

| License | Commercial | Modify | Distribute | Attribution | Use Case |
|---------|-----------|--------|-----------|------------|----------|
| **proprietary** | ❌ No | ❌ No | ❌ No | Yes | Exclusive photos |
| **cc0** | ✅ Yes | ✅ Yes | ✅ Yes | No | Public domain |
| **cc-by** | ✅ Yes | ✅ Yes | ✅ Yes | Yes | Open w/ credit |
| **cc-by-sa** | ✅ Yes | ✅ Yes | ✅ Yes | Yes | Open w/ same license |
| **cc-by-nc** | ❌ No | ✅ Yes | ✅ Yes | Yes | Non-commercial |
| **commercial** | ✅ Yes | ✅ Yes | ✅ Yes | Optional | Licensed photos |

---

## Filename Convention

**Format:** `{product-id}-{view}-{width}x{height}.{format}`

**Examples:**
```
123-front-2400x3000.webp
456-back-2400x3000.avif
789-detail-1200x1500.jpeg
```

**View Types:**
- `front` - Front view
- `back` - Back view
- `detail` - Close-up detail
- `flat-lay` - Flat lay style
- `lifestyle` - In-use lifestyle photo

**Formats:**
- `webp` - Modern, best compression (60% size)
- `avif` - Best quality (40% size)
- `jpeg` - Widespread (100% baseline)

---

## Performance Specs

### Generation Time (50 products)

| Operation | Time | Per Item |
|-----------|------|----------|
| Filename generation | <50ms | <1ms |
| Metadata generation | 100-150ms | 2-3ms |
| Copyright generation | <50ms | <1ms |
| Schema injection (10) | <100ms | 10ms |
| CSV export | 10-20ms | 0.2ms |
| **Total** | **~350ms** | **~7ms** |

### Memory Impact

| Data | Size | Total (50) |
|------|------|-----------|
| Filename mapping | 2-3 KB | 100-150 KB |
| Metadata per image | 20-30 KB | 1000-1500 KB |
| Copyright per product | 5 KB | 250 KB |
| Schemas injected | 1-3 KB | 100+ KB |
| **Total** | | **~1.5-2 MB** |

### Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS/Android)

---

## CSS Classes

### Metadata Display

```css
.image-metadata        /* Main container */
.metadata-card         /* Individual card */
.metadata-item         /* Key-value pair */
.filename-info         /* Filename display */
.copyright-badge       /* Copyright symbol */
```

### Quality & Assessment

```css
.quality-assessment    /* Quality metrics */
.quality-metric        /* Individual metric */
.optimization-report   /* Full report */
```

### Keywords & Tags

```css
.keywords-display      /* Keyword container */
.keyword-tag           /* Individual tag */
```

### Utilities

```css
.export-button         /* Export button */
.cdn-path-display      /* CDN path */
.copy-button           /* Copy button */
```

---

## Metadata Structure

### Top-Level Keys

```javascript
{
  dimensions: {...},
  content: {...},
  creator: {...},
  dates: {...},
  seo: {...},
  technical: {...},
  quality: {...},
  usage: {...}
}
```

### Common Property Access

```javascript
// Filename
metadata.filename
metadata.productId
metadata.view

// Dimensions
metadata.dimensions.width
metadata.dimensions.height
metadata.dimensions.aspectRatio

// CDN
metadata.usage.cdn.base
metadata.usage.cdn.variants.medium

// Keywords
metadata.content.keywords  // Array

// Alt text
metadata.usage.webUsage.altText
```

---

## CSV Export Format

**Columns:**
```
Product ID | Product Name | View | Filename | CDN Path | Dimensions | Format | Keywords | Description
```

**Example Row:**
```
123,Navy Blue Coat,front,123-front-2400x3000.webp,products/123/front-2400x3000-webp,2400x3000,webp,navy blue coat;wool,Premium wool coat
```

---

## Quick Initialization

```javascript
// In app.js init()
this.imageOptimizer = new ImageOptimizer();
this.schemaManager = new SchemaManager();

// One-line complete initialization:
this.optimizeImageFilenames() &&
this.generateImageMetadata() &&
this.generateCopyrightMetadata() &&
this.injectImageMetadataSchemas() &&
this.injectImageSitemap() &&
this.injectImageQualityAssessment();
```

---

## Debugging Commands

```javascript
// Check if optimizer exists
console.log(app.imageOptimizer);

// Check generated filenames
console.log(app.filenameMappings);

// Check metadata
console.log(app.imageMetadata);

// Check copyright
console.log(app.copyrightMetadata);

// Generate report
console.log(app.generateImageOptimizationReport());

// Export CSV
console.log(app.exportMetadataForBulkOperations());

// Verify schemas injected
console.log(document.querySelectorAll('script[type="application/ld+json"]').length);
```

---

## Common Pattern: Product Image Setup

```javascript
// Get product
const product = app.products[0];

// Get filename
const filename = app.filenameMappings[product.id].front.idBased;

// Get metadata
const metadata = app.imageMetadata[product.id + '-front'];

// Get copyright
const copyright = app.copyrightMetadata[product.id];

// Create image element
const img = document.createElement('img');
img.src = metadata.usage.cdn.base;
img.alt = metadata.usage.webUsage.altText;
img.title = metadata.usage.webUsage.title;

// Add copyright notice
const notice = document.createElement('p');
notice.textContent = copyright.copyright.statement;
```

---

## Tips & Tricks

| Tip | Usage |
|-----|-------|
| **Get all keywords** | `Object.values(app.imageMetadata).flatMap(m => m.content.keywords)` |
| **Find high-quality images** | `Object.values(app.imageMetadata).filter(m => m.quality.estimatedSharpness > 0.8)` |
| **Get all CDN paths** | `Object.values(app.imageMetadata).map(m => m.usage.cdn.base)` |
| **Count optimizations** | `app.generateImageOptimizationReport().metrics.schemasInjected` |
| **Export for import** | `app.exportMetadataForBulkOperations()` |

---

**More Info**: See PART_3.5_IMAGE_METADATA_OPTIMIZATION.md for complete documentation.

