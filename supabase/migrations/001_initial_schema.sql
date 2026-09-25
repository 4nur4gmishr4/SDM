-- ============================================================================
-- SAI DARSHAN MART — COMPLETE SUPABASE DATABASE SCHEMA MIGRATION
-- ============================================================================
-- 001_initial_schema.sql
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    display_order INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_offer_category BOOLEAN DEFAULT FALSE,
    thumbnail_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================================
-- 3. PRODUCTS TABLE (WITH CONTENT QUANTITY / VARIANTS SUPPORT)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    mrp NUMERIC(10, 2),
    unit_size TEXT DEFAULT '1 unit',
    stock_quantity INT DEFAULT 50,
    description TEXT,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    -- JSONB Array storing multiple content quantity options (e.g. 50g, 100g, 250g, 500g, 1kg)
    -- Structure: [{"id": "v-1", "unit_size": "250g", "price": 120, "mrp": 140, "stock_quantity": 25, "is_available": true}]
    variants JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================================
-- 4. BANNERS & OFFERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    text TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================================
-- 5. DELIVERY SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.delivery_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rules_text TEXT DEFAULT 'Doorstep grocery delivery across Jabalpur. Free delivery on orders above ₹500.',
    flat_fee NUMERIC(10, 2) DEFAULT 30.00,
    free_delivery_threshold NUMERIC(10, 2) DEFAULT 500.00,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================================
-- 6. ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- e.g. "SDM-2026-XXXX"
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    map_link TEXT,
    subtotal_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
    items JSONB DEFAULT '[]'::jsonb,
    is_quick_order BOOLEAN DEFAULT FALSE,
    quick_order_text TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================================
-- 7. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_archived, is_available);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_display ON public.categories(display_order);

-- ============================================================================
-- 8. AUTO-UPDATING TIMESTAMPS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_categories_updated_at ON public.categories;
CREATE TRIGGER trigger_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_delivery_updated_at ON public.delivery_settings;
CREATE TRIGGER trigger_delivery_updated_at
    BEFORE UPDATE ON public.delivery_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON public.orders;
CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Categories RLS
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories" ON public.categories
    FOR SELECT USING (is_visible = TRUE OR is_active = TRUE);

DROP POLICY IF EXISTS "Admins have full access to categories" ON public.categories;
CREATE POLICY "Admins have full access to categories" ON public.categories
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Products RLS
DROP POLICY IF EXISTS "Public can view non-archived products" ON public.products;
CREATE POLICY "Public can view non-archived products" ON public.products
    FOR SELECT USING (is_archived = FALSE);

DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;
CREATE POLICY "Admins have full access to products" ON public.products
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Banners RLS
DROP POLICY IF EXISTS "Public can view active banners" ON public.banners;
CREATE POLICY "Public can view active banners" ON public.banners
    FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins have full access to banners" ON public.banners;
CREATE POLICY "Admins have full access to banners" ON public.banners
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Delivery Settings RLS
DROP POLICY IF EXISTS "Public can view active delivery settings" ON public.delivery_settings;
CREATE POLICY "Public can view active delivery settings" ON public.delivery_settings
    FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins have full access to delivery settings" ON public.delivery_settings;
CREATE POLICY "Admins have full access to delivery settings" ON public.delivery_settings
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Orders RLS
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders" ON public.orders
    FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Public can view their own order by ID" ON public.orders;
CREATE POLICY "Public can view their own order by ID" ON public.orders
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
CREATE POLICY "Admins have full access to orders" ON public.orders
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================================================
-- 10. PRE-SEEDED BASE CATEGORIES & DEFAULT SETTINGS
-- ============================================================================
INSERT INTO public.categories (id, name, slug, display_order, is_visible, is_active, description)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 'Fresh Vegetables & Fruits', 'fresh-vegetables', 1, TRUE, TRUE, 'Fresh produce direct from farms'),
    ('c2222222-2222-2222-2222-222222222222', 'Dairy & Bakery', 'dairy-bakery', 2, TRUE, TRUE, 'Fresh milk, paneer, butter, bread and eggs'),
    ('c3333333-3333-3333-3333-333333333333', 'Atta, Rice & Dals', 'atta-rice-dals', 3, TRUE, TRUE, 'Premium grains, whole wheat flour, and pulses'),
    ('c4444444-4444-4444-4444-444444444444', 'Snacks & Munchies', 'snacks', 4, TRUE, TRUE, 'Biscuits, namkeen, chips, and quick bites'),
    ('c5555555-5555-5555-5555-555555555555', 'Oils & Masalas', 'masalas-oils', 5, TRUE, TRUE, 'Cooking oils, ghee, whole and blended spices'),
    ('c6666666-6666-6666-6666-666666666666', 'Beverages & Drinks', 'beverages', 6, TRUE, TRUE, 'Tea, coffee, health drinks, and juices'),
    ('c7777777-7777-7777-7777-777777777777', 'Household & Cleaning', 'household', 7, TRUE, TRUE, 'Detergents, dishwash, cleaners, and pooja items'),
    ('c8888888-8888-8888-8888-888888888888', 'Personal Care & Beauty', 'personal-care', 8, TRUE, TRUE, 'Soaps, shampoos, skincare, and hygiene essentials'),
    ('c9999999-9999-9999-9999-999999999999', 'Baby Care', 'baby-care', 9, TRUE, TRUE, 'Diapers, baby food, and gentle care products'),
    ('caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Plastics & Kitchenware', 'kitchenware', 10, TRUE, TRUE, 'Storage containers, bottles, buckets, and utilities')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.delivery_settings (id, rules_text, flat_fee, free_delivery_threshold, is_active)
VALUES (
    'd1111111-1111-1111-1111-111111111111',
    'Doorstep grocery delivery across Jabalpur. Free delivery on orders above ₹500.',
    30.00,
    500.00,
    TRUE
)
ON CONFLICT (id) DO NOTHING;
