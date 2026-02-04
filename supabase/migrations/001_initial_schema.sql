-- filepath: supabase/migrations/001_initial_schema.sql
-- Initial database schema for CanadaClothes.ca
-- 
-- This migration creates tables for:
-- - products: Product catalog from Printify
-- - orders: Customer orders
-- - order_items: Line items within orders
-- - product_cache: Cached product list for performance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table (for future reference/search optimization)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- in cents (CAD)
  image TEXT,
  variants JSONB,
  source TEXT DEFAULT 'printify',
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT price_non_negative CHECK (price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_products_synced_at ON products(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_title ON products USING GIN (to_tsvector('english', title));

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number SERIAL NOT NULL UNIQUE,
  email TEXT NOT NULL,
  total INTEGER NOT NULL, -- in cents (CAD)
  status TEXT DEFAULT 'pending', -- pending, processing, completed, cancelled
  notes TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT email_not_empty CHECK (email != ''),
  CONSTRAINT total_non_negative CHECK (total >= 0),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price_at_purchase INTEGER NOT NULL, -- in cents (CAD)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT quantity_positive CHECK (quantity > 0),
  CONSTRAINT price_non_negative CHECK (price_at_purchase >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Product cache table (for storing latest products from Printify)
CREATE TABLE IF NOT EXISTS product_cache (
  id INTEGER PRIMARY KEY DEFAULT 1,
  products JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT only_one_row CHECK (id = 1)
);

-- Row Level Security (RLS) Policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read product_cache (public)
CREATE POLICY "product_cache_select" ON product_cache
  FOR SELECT USING (true);

-- Prevent direct writes to product_cache from frontend
CREATE POLICY "product_cache_no_insert" ON product_cache
  FOR INSERT WITH CHECK (false);

CREATE POLICY "product_cache_no_update" ON product_cache
  FOR UPDATE USING (false);

CREATE POLICY "product_cache_no_delete" ON product_cache
  FOR DELETE USING (false);

-- Allow inserting orders (public checkout)
CREATE POLICY "orders_insert" ON orders
  FOR INSERT WITH CHECK (true);

-- Don't allow reading orders from frontend (privacy)
CREATE POLICY "orders_no_select" ON orders
  FOR SELECT USING (false);

-- Don't allow updating orders from frontend
CREATE POLICY "orders_no_update" ON orders
  FOR UPDATE USING (false);

-- Don't allow deleting orders from frontend
CREATE POLICY "orders_no_delete" ON orders
  FOR DELETE USING (false);

-- Allow inserting order items (public checkout)
CREATE POLICY "order_items_insert" ON order_items
  FOR INSERT WITH CHECK (true);

-- Don't allow reading order items from frontend
CREATE POLICY "order_items_no_select" ON order_items
  FOR SELECT USING (false);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for orders.updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for products.updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (assumes anon role for frontend, authenticated for backend)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON product_cache TO anon;
GRANT INSERT ON orders TO anon;
GRANT INSERT ON order_items TO anon;
GRANT USAGE, SELECT ON SEQUENCE orders_order_number_seq TO anon;
