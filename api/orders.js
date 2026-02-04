/**
 * filepath: api/orders.js
 * POST /api/orders
 * 
 * Creates an order in the database.
 * 
 * Request body:
 * {
 *   email: string (valid email),
 *   items: [{ productId: string, quantity: number, price: number }],
 *   total: number (total in cents),
 *   shippingAddress: { ... } (optional, from Stripe)
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   orderId: string,
 *   orderNumber: number,
 *   status: string,
 *   createdAt: ISO string
 * }
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate order items
 * @param {Array} items
 * @returns {boolean}
 */
function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) return false;

  return items.every(item => {
    return (
      item.productId &&
      typeof item.quantity === 'number' &&
      item.quantity > 0 &&
      typeof item.price === 'number' &&
      item.price >= 0
    );
  });
}

/**
 * Create order and order items in database
 */
async function createOrder(email, items, total) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      email,
      total,
      status: 'pending',
      notes: null,
    })
    .select()
    .single();

  if (orderError) {
    throw new Error(`Failed to create order: ${orderError.message}`);
  }

  // Insert order items
  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    price_at_purchase: item.price,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    // Rollback order if items fail
    await supabase.from('orders').delete().eq('id', order.id);
    throw new Error(`Failed to create order items: ${itemsError.message}`);
  }

  return order;
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, items, total, shippingAddress } = req.body;

    // Validate input
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address',
      });
    }

    if (!items || !validateItems(items)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid items in request',
      });
    }

    if (typeof total !== 'number' || total < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid total amount',
      });
    }

    // Verify cart total matches sum of items
    const calculatedTotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (Math.abs(calculatedTotal - total) > 100) { // Allow $1 rounding difference
      return res.status(400).json({
        success: false,
        error: 'Cart total mismatch',
      });
    }

    // Create order
    const order = await createOrder(email, items, total);

    console.log(`Order created: ${order.id} for ${email}`);

    return res.status(201).json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.status,
      createdAt: order.created_at,
      message: `Order ${order.order_number} created successfully`,
    });
  } catch (error) {
    console.error('Error creating order:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to create order',
      message: error.message,
    });
  }
}
