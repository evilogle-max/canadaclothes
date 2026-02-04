/**
 * filepath: api/products.js
 * GET /api/products
 * 
 * Fetches products from Printify API and caches in Supabase.
 * Returns list of products with prices in cents (CAD).
 * 
 * This endpoint:
 * 1. Fetches from Supabase cache first (fresh within 1 hour)
 * 2. Falls back to Printify API if cache is stale
 * 3. Stores results in Supabase for future requests
 * 4. Returns products in standard format
 * 
 * Response:
 * {
 *   products: [
 *     { id, title, price, image, source: 'supabase'|'printify' },
 *     ...
 *   ],
 *   cached: boolean,
 *   cachedAt: ISO string
 * }
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID;
const CACHE_DURATION_HOURS = 1;

/**
 * Fetch products from Printify API
 * @returns {Promise<Array>} Products from Printify
 */
async function fetchFromPrintify() {
  if (!PRINTIFY_API_KEY || !PRINTIFY_SHOP_ID) {
    throw new Error('Missing Printify credentials');
  }

  const response = await fetch(
    `https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/products.json`,
    {
      headers: {
        'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Printify API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Transform Printify product to standardized format
 * @param {Object} product - Raw Printify product
 * @returns {Object} Standardized product
 */
function transformProduct(product) {
  const variant = product.variants?.[0];
  const price = variant?.price || 0; // Price already in cents from Printify
  const image = product.images?.[0]?.src || product.thumbnail_url || null;

  return {
    id: product.id,
    title: product.title,
    description: product.description || '',
    price: Math.round(price), // Ensure integer cents
    image: image,
    variants: (product.variants || []).map(v => ({
      id: v.id,
      title: v.title,
      price: v.price,
    })),
    createdAt: product.created_at,
  };
}

/**
 * Fetch from Supabase cache if available
 * @returns {Promise<Object|null>} Cached products or null
 */
async function fetchFromCache() {
  try {
    const { data, error } = await supabase
      .from('product_cache')
      .select('*')
      .single()
      .limit(1);

    if (error) {
      console.log('Cache miss or error:', error.message);
      return null;
    }

    if (!data) return null;

    const cachedAt = new Date(data.cached_at);
    const now = new Date();
    const hoursSinceCache = (now - cachedAt) / (1000 * 60 * 60);

    if (hoursSinceCache > CACHE_DURATION_HOURS) {
      console.log(`Cache expired (${hoursSinceCache.toFixed(1)} hours old)`);
      return null;
    }

    console.log(`Using cached products (${hoursSinceCache.toFixed(2)} hours old)`);
    return {
      products: data.products,
      cached: true,
      cachedAt: data.cached_at,
    };
  } catch (error) {
    console.error('Cache fetch error:', error);
    return null;
  }
}

/**
 * Save products to Supabase cache
 * @param {Array} products - Products to cache
 */
async function saveToCache(products) {
  try {
    const { error } = await supabase
      .from('product_cache')
      .upsert(
        {
          id: 1,
          products: products,
          cached_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Cache save error:', error);
    } else {
      console.log(`Cached ${products.length} products`);
    }
  } catch (error) {
    console.error('Cache operation error:', error);
  }
}

/**
 * Sync Printify products to Supabase for analytics tracking
 * @param {Array} printifyProducts - Raw Printify products
 */
async function syncToSupabase(printifyProducts) {
  try {
    console.log(`Syncing ${printifyProducts.length} products to Supabase...`);

    for (const product of printifyProducts) {
      const variant = product.variants?.[0];
      const price = variant?.price || 0;

      // 1. Upsert product record
      const { data: supabaseProduct, error: productError } = await supabase
        .from('products')
        .upsert(
          {
            id: product.id,
            shop_id: process.env.SHOP_ID || 'default-shop',
            name: product.title,
            description: product.description || '',
            sku: product.id,
            price: price / 100, // Convert cents to dollars
            stock_quantity: 999, // Printify manages inventory
            category: product.tags?.[0] || 'General',
            is_published: true,
            printify_product_id: product.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (productError) {
        console.error(`Error syncing product ${product.id}:`, productError);
        continue;
      }

      // 2. Sync product images
      const images = product.images || [];
      for (const image of images) {
        const { error: imageError } = await supabase
          .from('product_images')
          .upsert(
            {
              product_id: supabaseProduct.id,
              image_url: image.src || image.url,
              alt_text: product.title,
              display_order: image.position || 0,
              width: image.width,
              height: image.height,
              format: image.src?.includes('.webp') ? 'webp' : 'jpg',
            },
            { onConflict: 'product_id,display_order' }
          );

        if (imageError) {
          console.error(`Error syncing image for ${product.id}:`, imageError);
        }
      }

      console.log(`✓ Synced product: ${product.title}`);
    }

    console.log('Sync complete');
  } catch (error) {
    console.error('Supabase sync error:', error);
    // Don't throw - let the API still return products even if sync fails
  }
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try cache first
    let result = await fetchFromCache();

    // If cache miss, fetch from Printify
    if (!result) {
      console.log('Fetching from Printify API...');
      const printifyProducts = await fetchFromPrintify();
      const products = printifyProducts.map(transformProduct);

      // Sync to Supabase in background (don't wait for it)
      syncToSupabase(printifyProducts).catch(error => {
        console.error('Background sync failed:', error);
      });

      // Save to cache for next request
      await saveToCache(products);

      result = {
        products,
        cached: false,
        fetchedAt: new Date().toISOString(),
        synced: 'background',
      };
    }

    // Return products
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching products:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: error.message,
    });
  }
}
