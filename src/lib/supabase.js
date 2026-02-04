import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// AUTHENTICATION HELPERS
// ============================================

/**
 * Sign up a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {object} metadata - Additional user metadata
 * @returns {object} User and session data
 */
export async function signUp(email, password, metadata = {}) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Sign up error:', error.message);
    return { data: null, error };
  }
}

/**
 * Sign in user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {object} User and session data
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Sign in error:', error.message);
    return { data: null, error };
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error.message);
    return { error };
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { data: data.session, error: null };
  } catch (error) {
    console.error('Get session error:', error.message);
    return { data: null, error };
  }
}

/**
 * Get current user
 */
export async function getUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { data: data.user, error: null };
  } catch (error) {
    console.error('Get user error:', error.message);
    return { data: null, error };
  }
}

// ============================================
// USER PROFILE HELPERS
// ============================================

/**
 * Get user profile
 * @param {string} userId - User ID
 */
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get profile error:', error.message);
    return { data: null, error };
  }
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {object} updates - Profile updates
 */
export async function updateUserProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Update profile error:', error.message);
    return { data: null, error };
  }
}

/**
 * Create user profile
 * @param {string} userId - User ID
 * @param {object} profile - Profile data
 */
export async function createUserProfile(userId, profile) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{
        id: userId,
        email: profile.email,
        full_name: profile.full_name || '',
        ...profile
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Create profile error:', error.message);
    return { data: null, error };
  }
}

// ============================================
// PRODUCT HELPERS
// ============================================

/**
 * Get all published products (with pagination)
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @param {string} category - Filter by category
 */
export async function getPublishedProducts(page = 1, pageSize = 20, category = null) {
  try {
    let query = supabase
      .from('products')
      .select('*, product_images(*)', { count: 'exact' })
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const { data, error, count } = await query.range(start, end);

    if (error) throw error;
    return { 
      data, 
      count, 
      page, 
      pageSize, 
      totalPages: Math.ceil((count || 0) / pageSize),
      error: null 
    };
  } catch (error) {
    console.error('Get products error:', error.message);
    return { data: null, error };
  }
}

/**
 * Get product by ID
 * @param {string} productId - Product ID
 */
export async function getProduct(productId) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images(*),
        image_analytics(*),
        performance_metrics(*),
        seo_metrics(*),
        product_reviews(*)
      `)
      .eq('id', productId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get product error:', error.message);
    return { data: null, error };
  }
}

/**
 * Get shop's products
 * @param {string} shopId - Shop owner ID
 * @param {number} page - Page number
 */
export async function getShopProducts(shopId, page = 1, pageSize = 20) {
  try {
    let query = supabase
      .from('products')
      .select('*, product_images(*)', { count: 'exact' })
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const { data, error, count } = await query.range(start, end);

    if (error) throw error;
    return { 
      data, 
      count, 
      page, 
      pageSize, 
      totalPages: Math.ceil((count || 0) / pageSize),
      error: null 
    };
  } catch (error) {
    console.error('Get shop products error:', error.message);
    return { data: null, error };
  }
}

/**
 * Create product (shop owner only)
 * @param {string} shopId - Shop owner ID
 * @param {object} product - Product data
 */
export async function createProduct(shopId, product) {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        shop_id: shopId,
        ...product
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Create product error:', error.message);
    return { data: null, error };
  }
}

/**
 * Update product
 * @param {string} productId - Product ID
 * @param {object} updates - Product updates
 */
export async function updateProduct(productId, updates) {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Update product error:', error.message);
    return { data: null, error };
  }
}

/**
 * Delete product
 * @param {string} productId - Product ID
 */
export async function deleteProduct(productId) {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Delete product error:', error.message);
    return { error };
  }
}

// ============================================
// PRODUCT IMAGE HELPERS
// ============================================

/**
 * Add product image
 * @param {string} productId - Product ID
 * @param {object} image - Image data
 */
export async function addProductImage(productId, image) {
  try {
    const { data, error } = await supabase
      .from('product_images')
      .insert([{
        product_id: productId,
        ...image
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Add image error:', error.message);
    return { data: null, error };
  }
}

/**
 * Update product image
 * @param {string} imageId - Image ID
 * @param {object} updates - Image updates
 */
export async function updateProductImage(imageId, updates) {
  try {
    const { data, error } = await supabase
      .from('product_images')
      .update(updates)
      .eq('id', imageId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Update image error:', error.message);
    return { data: null, error };
  }
}

/**
 * Delete product image
 * @param {string} imageId - Image ID
 */
export async function deleteProductImage(imageId) {
  try {
    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Delete image error:', error.message);
    return { error };
  }
}

// ============================================
// ANALYTICS HELPERS (Part 3.6 Integration)
// ============================================

/**
 * Insert analytics event
 * @param {object} event - Analytics event data
 */
export async function insertAnalyticsEvent(event) {
  try {
    const { data, error } = await supabase
      .from('image_analytics')
      .insert([event])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Insert analytics error:', error.message);
    return { data: null, error };
  }
}

/**
 * Insert performance metrics
 * @param {object} metrics - Performance metrics
 */
export async function insertPerformanceMetrics(metrics) {
  try {
    const { data, error } = await supabase
      .from('performance_metrics')
      .insert([metrics])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Insert metrics error:', error.message);
    return { data: null, error };
  }
}

/**
 * Insert SEO metrics
 * @param {object} metrics - SEO metrics
 */
export async function insertSEOMetrics(metrics) {
  try {
    const { data, error } = await supabase
      .from('seo_metrics')
      .insert([metrics])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Insert SEO metrics error:', error.message);
    return { data: null, error };
  }
}

/**
 * Get product analytics
 * @param {string} productId - Product ID
 * @param {string} eventType - Filter by event type (optional)
 * @param {number} days - Last N days (default 30)
 */
export async function getProductAnalytics(productId, eventType = null, days = 30) {
  try {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    let query = supabase
      .from('image_analytics')
      .select('*')
      .eq('product_id', productId)
      .gte('event_timestamp', fromDate.toISOString());

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get analytics error:', error.message);
    return { data: null, error };
  }
}

/**
 * Get performance metrics for product
 * @param {string} productId - Product ID
 * @param {number} days - Last N days
 */
export async function getPerformanceMetrics(productId, days = 30) {
  try {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const { data, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('product_id', productId)
      .gte('measured_at', fromDate.toISOString())
      .order('measured_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get performance metrics error:', error.message);
    return { data: null, error };
  }
}

/**
 * Get SEO metrics for product
 * @param {string} productId - Product ID
 */
export async function getSEOMetrics(productId) {
  try {
    const { data, error } = await supabase
      .from('seo_metrics')
      .select('*')
      .eq('product_id', productId)
      .order('measured_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { data: error?.code === 'PGRST116' ? null : data, error: null };
  } catch (error) {
    console.error('Get SEO metrics error:', error.message);
    return { data: null, error };
  }
}

// ============================================
// ORDER HELPERS
// ============================================

/**
 * Create order
 * @param {string} customerId - Customer ID
 * @param {object} order - Order data
 */
export async function createOrder(customerId, order) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        customer_id: customerId,
        order_number: `ORD-${Date.now()}`,
        ...order
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Create order error:', error.message);
    return { data: null, error };
  }
}

/**
 * Get customer orders
 * @param {string} customerId - Customer ID
 */
export async function getCustomerOrders(customerId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get orders error:', error.message);
    return { data: null, error };
  }
}

// ============================================
// STORAGE HELPERS
// ============================================

/**
 * Upload product image
 * @param {string} productId - Product ID
 * @param {File} file - Image file
 * @param {string} path - Storage path (optional)
 */
export async function uploadProductImage(productId, file, path = null) {
  try {
    const filename = `${productId}/${Date.now()}-${file.name}`;
    const filepath = path || filename;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filepath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filepath);

    return { data: urlData.publicUrl, error: null };
  } catch (error) {
    console.error('Upload image error:', error.message);
    return { data: null, error };
  }
}

/**
 * Delete product image from storage
 * @param {string} filepath - Storage path
 */
export async function deleteProductImageFile(filepath) {
  try {
    const { error } = await supabase.storage
      .from('product-images')
      .remove([filepath]);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Delete file error:', error.message);
    return { error };
  }
}

/**
 * Upload user avatar
 * @param {string} userId - User ID
 * @param {File} file - Avatar file
 */
export async function uploadUserAvatar(userId, file) {
  try {
    const filename = `${userId}/${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from('user-avatars')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(filename);

    return { data: urlData.publicUrl, error: null };
  } catch (error) {
    console.error('Upload avatar error:', error.message);
    return { data: null, error };
  }
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to product changes
 * @param {string} productId - Product ID
 * @param {function} callback - Callback function
 */
export function subscribeToProduct(productId, callback) {
  const subscription = supabase
    .from(`products:id=eq.${productId}`)
    .on('*', (payload) => {
      callback(payload);
    })
    .subscribe();

  return subscription;
}

/**
 * Subscribe to analytics events
 * @param {string} productId - Product ID
 * @param {function} callback - Callback function
 */
export function subscribeToAnalytics(productId, callback) {
  const subscription = supabase
    .from(`image_analytics:product_id=eq.${productId}`)
    .on('INSERT', (payload) => {
      callback(payload);
    })
    .subscribe();

  return subscription;
}

// ============================================
// EXPORT
// ============================================

export default supabase;