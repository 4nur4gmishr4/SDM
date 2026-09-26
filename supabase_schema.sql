-- ============================================================================
-- SAI DARSHAN MART — COMPLETE SUPABASE DATABASE SCHEMA
-- ============================================================================
-- Run this script in your Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- It sets up all required tables, variants, indexes, triggers, storage, and RLS policies.
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
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
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
-- 6. STORE SETTINGS TABLE (KEY-VALUE STORE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================================
-- 7. ORDERS TABLE
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
-- 8. ORDER ITEMS TABLE (NORMALIZED CART LINE ITEMS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    price_at_time NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================================
-- 9. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_archived, is_available);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_categories_display ON public.categories(display_order);
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active, display_order);

-- ============================================================================
-- 10. AUTO-UPDATING TIMESTAMPS
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

DROP TRIGGER IF EXISTS trigger_banners_updated_at ON public.banners;
CREATE TRIGGER trigger_banners_updated_at
    BEFORE UPDATE ON public.banners
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_delivery_updated_at ON public.delivery_settings;
CREATE TRIGGER trigger_delivery_updated_at
    BEFORE UPDATE ON public.delivery_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER trigger_store_settings_updated_at
    BEFORE UPDATE ON public.store_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON public.orders;
CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

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

-- Store Settings RLS
DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;
CREATE POLICY "Public can view store settings" ON public.store_settings
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins have full access to store settings" ON public.store_settings;
CREATE POLICY "Admins have full access to store settings" ON public.store_settings
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Orders RLS
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders" ON public.orders
    FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
CREATE POLICY "Public can view orders" ON public.orders
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
CREATE POLICY "Admins have full access to orders" ON public.orders
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Order Items RLS
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
CREATE POLICY "Public can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
CREATE POLICY "Public can view order items" ON public.order_items
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins have full access to order items" ON public.order_items;
CREATE POLICY "Admins have full access to order items" ON public.order_items
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================================================
-- 12. STORAGE BUCKET SETUP (STORE MEDIA)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-media', 'store-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access to store-media bucket
DROP POLICY IF EXISTS "Public can view store media" ON storage.objects;
CREATE POLICY "Public can view store media" ON storage.objects
    FOR SELECT USING (bucket_id = 'store-media');

-- Authenticated admins can upload/update/delete media in store-media bucket
DROP POLICY IF EXISTS "Admins can manage store media" ON storage.objects;
CREATE POLICY "Admins can manage store media" ON storage.objects
    FOR ALL USING (bucket_id = 'store-media' AND (auth.role() = 'authenticated' OR auth.role() = 'service_role'));

-- ============================================================================
-- 13. PRE-SEEDED BASE CATEGORIES & DEFAULT SETTINGS
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
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    display_order = EXCLUDED.display_order,
    is_visible = EXCLUDED.is_visible,
    is_active = EXCLUDED.is_active;

INSERT INTO public.delivery_settings (id, rules_text, flat_fee, free_delivery_threshold, is_active)
VALUES (
    'd1111111-1111-1111-1111-111111111111',
    'Doorstep grocery delivery across Jabalpur. Free delivery on orders above ₹500.',
    30.00,
    500.00,
    TRUE
)
ON CONFLICT (id) DO UPDATE SET
    rules_text = EXCLUDED.rules_text,
    flat_fee = EXCLUDED.flat_fee,
    free_delivery_threshold = EXCLUDED.free_delivery_threshold;

INSERT INTO public.store_settings (key, value)
VALUES
    ('store_name', 'Sai Darshan Mart'),
    ('store_phone', '+91 79991 57430'),
    ('store_whatsapp', '+91 79991 57430'),
    ('store_address', 'Sai Darshan Mart, Near Home Science College Road, Jabalpur, Madhya Pradesh 482001'),
    ('store_hours', '8:00 AM - 10:30 PM Daily'),
    ('store_tagline', 'Jabalpur''s trusted neighborhood supermarket • Daily fresh essentials & doorstep delivery')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value;

-- ============================================================================
-- 14. PRE-SEEDED PROMOTIONAL BANNERS
-- ============================================================================
INSERT INTO public.banners (id, title, text, image_url, link_url, display_order, is_active)
VALUES
    (
        'b1111111-1111-1111-1111-111111111111',
        'Welcome to Sai Darshan Mart',
        'Jabalpur''s favorite supermarket with quick doorstep delivery. Shop fresh daily essentials now!',
        '/images/store/interior-wide-1.jpg',
        '/shop',
        1,
        TRUE
    ),
    (
        'b2222222-2222-2222-2222-222222222222',
        'Fresh Dairy & Bakery Every Morning',
        'Milk, paneer, fresh bread, butter and farm eggs delivered right to your home in Jabalpur.',
        '/images/store/produce-counter-1.jpg',
        '/shop?category=dairy-bakery',
        2,
        TRUE
    ),
    (
        'b3333333-3333-3333-3333-333333333333',
        'Super Savings on Monthly Staples',
        'Top quality Atta, Basmati Rice, Dals, and Cooking Oils at wholesale prices every day.',
        '/images/store/shelf-grocery-1.jpg',
        '/shop?category=atta-rice-dals',
        3,
        TRUE
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    text = EXCLUDED.text,
    image_url = EXCLUDED.image_url,
    link_url = EXCLUDED.link_url,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active;

-- ============================================================================
-- 15. PRE-SEEDED ESSENTIAL PRODUCTS (INSTANT CATALOG)
-- ============================================================================
INSERT INTO public.products (sku, name, brand, category_id, price, mrp, unit_size, stock_quantity, description, is_available, is_featured, variants)
VALUES
    (
        'SDM-GRN-001',
        'Aashirvaad Shudh Chakki Atta',
        'Aashirvaad',
        'c3333333-3333-3333-3333-333333333333',
        235.00,
        265.00,
        '5 kg',
        100,
        '100% pure whole wheat flour processed with traditional chakki process.',
        TRUE,
        TRUE,
        '[{"id": "v-atta-5k", "unit_size": "5 kg", "price": 235, "mrp": 265, "stock_quantity": 50, "is_available": true}, {"id": "v-atta-10k", "unit_size": "10 kg", "price": 455, "mrp": 510, "stock_quantity": 30, "is_available": true}]'::jsonb
    ),
    (
        'SDM-GRN-002',
        'Fortune Sunlite Refined Sunflower Oil',
        'Fortune',
        'c5555555-5555-5555-5555-555555555555',
        138.00,
        165.00,
        '1 L',
        80,
        'Light and healthy refined sunflower oil enriched with vitamins A & D.',
        TRUE,
        TRUE,
        '[{"id": "v-oil-1l", "unit_size": "1 L", "price": 138, "mrp": 165, "stock_quantity": 50, "is_available": true}, {"id": "v-oil-5l", "unit_size": "5 L", "price": 670, "mrp": 780, "stock_quantity": 20, "is_available": true}]'::jsonb
    ),
    (
        'SDM-DAI-001',
        'Amul Butter Pasteurised',
        'Amul',
        'c2222222-2222-2222-2222-222222222222',
        56.00,
        60.00,
        '100 g',
        60,
        'Utterly butterly delicious fresh pasteurised Amul table butter.',
        TRUE,
        TRUE,
        '[{"id": "v-but-100", "unit_size": "100 g", "price": 56, "mrp": 60, "stock_quantity": 40, "is_available": true}, {"id": "v-but-500", "unit_size": "500 g", "price": 275, "mrp": 285, "stock_quantity": 25, "is_available": true}]'::jsonb
    ),
    (
        'SDM-DAI-002',
        'Amul Malai Fresh Paneer',
        'Amul',
        'c2222222-2222-2222-2222-222222222222',
        88.00,
        95.00,
        '200 g',
        40,
        'Rich, soft and creamy fresh cottage cheese for delicious curry and snacks.',
        TRUE,
        TRUE,
        '[{"id": "v-pan-200", "unit_size": "200 g", "price": 88, "mrp": 95, "stock_quantity": 30, "is_available": true}, {"id": "v-pan-500", "unit_size": "500 g", "price": 210, "mrp": 225, "stock_quantity": 15, "is_available": true}]'::jsonb
    ),
    (
        'SDM-BEV-001',
        'Brooke Bond Red Label Natural Care Tea',
        'Brooke Bond',
        'c6666666-6666-6666-6666-666666666666',
        145.00,
        160.00,
        '250 g',
        75,
        'Infused with 5 Ayurvedic ingredients: Tulsi, Ashwagandha, Mulethi, Ginger & Cardamom.',
        TRUE,
        TRUE,
        '[{"id": "v-tea-250", "unit_size": "250 g", "price": 145, "mrp": 160, "stock_quantity": 45, "is_available": true}, {"id": "v-tea-500", "unit_size": "500 g", "price": 280, "mrp": 310, "stock_quantity": 30, "is_available": true}]'::jsonb
    ),
    (
        'SDM-SNK-001',
        'Maggi 2-Minute Masala Instant Noodles',
        'Nestle',
        'c4444444-4444-4444-4444-444444444444',
        14.00,
        14.00,
        '70 g',
        120,
        'Classic favorite instant noodles with authentic Indian spice mix tastemaker.',
        TRUE,
        TRUE,
        '[{"id": "v-mag-1p", "unit_size": "70 g", "price": 14, "mrp": 14, "stock_quantity": 80, "is_available": true}, {"id": "v-mag-4p", "unit_size": "280 g (Pack of 4)", "price": 54, "mrp": 56, "stock_quantity": 40, "is_available": true}]'::jsonb
    ),
    (
        'SDM-SNK-002',
        'Haldiram''s Nagpur Classic Bhujia Sev',
        'Haldiram''s',
        'c4444444-4444-4444-4444-444444444444',
        52.00,
        55.00,
        '200 g',
        90,
        'Crispy spiced gram flour noodles with signature savory flavor.',
        TRUE,
        TRUE,
        '[{"id": "v-bhu-200", "unit_size": "200 g", "price": 52, "mrp": 55, "stock_quantity": 50, "is_available": true}, {"id": "v-bhu-400", "unit_size": "400 g", "price": 100, "mrp": 105, "stock_quantity": 40, "is_available": true}]'::jsonb
    ),
    (
        'SDM-HOU-001',
        'Surf Excel Easy Wash Detergent Powder',
        'Surf Excel',
        'c7777777-7777-7777-7777-777777777777',
        138.00,
        155.00,
        '1 kg',
        65,
        'Superior stain removal powder formulated for quick hand and bucket wash.',
        TRUE,
        TRUE,
        '[{"id": "v-det-1k", "unit_size": "1 kg", "price": 138, "mrp": 155, "stock_quantity": 40, "is_available": true}, {"id": "v-det-3k", "unit_size": "3 kg", "price": 395, "mrp": 440, "stock_quantity": 25, "is_available": true}]'::jsonb
    ),
    (
        'SDM-HOU-002',
        'Vim Dishwash Liquid Gel Lemon',
        'Vim',
        'c7777777-7777-7777-7777-777777777777',
        55.00,
        60.00,
        '250 ml',
        85,
        'Concentrated dishwash gel with real lemon juice for grease-free clean dishes.',
        TRUE,
        TRUE,
        '[{"id": "v-vim-250", "unit_size": "250 ml", "price": 55, "mrp": 60, "stock_quantity": 50, "is_available": true}, {"id": "v-vim-500", "unit_size": "500 ml", "price": 105, "mrp": 115, "stock_quantity": 35, "is_available": true}]'::jsonb
    ),
    (
        'SDM-PER-001',
        'Dettol Original Germ Protection Bathing Soap',
        'Dettol',
        'c8888888-8888-8888-8888-888888888888',
        140.00,
        160.00,
        '125 g (Buy 4 Get 1 Free)',
        50,
        'Trusted 99.9% germ defense soap for whole family health and hygiene.',
        TRUE,
        TRUE,
        '[]'::jsonb
    ),
    (
        'SDM-VEG-001',
        'Fresh Farm Potatoes (Aloo)',
        'Local Produce',
        'c1111111-1111-1111-1111-111111111111',
        25.00,
        30.00,
        '1 kg',
        150,
        'Freshly harvested local potatoes, clean, firm and ideal for everyday cooking.',
        TRUE,
        TRUE,
        '[{"id": "v-pot-1k", "unit_size": "1 kg", "price": 25, "mrp": 30, "stock_quantity": 80, "is_available": true}, {"id": "v-pot-2k", "unit_size": "2 kg", "price": 48, "mrp": 60, "stock_quantity": 40, "is_available": true}]'::jsonb
    ),
    (
        'SDM-VEG-002',
        'Fresh Farm Onions (Pyaz)',
        'Local Produce',
        'c1111111-1111-1111-1111-111111111111',
        35.00,
        40.00,
        '1 kg',
        120,
        'Crisp, pungent red onions sourced fresh every morning for Jabalpur households.',
        TRUE,
        TRUE,
        '[{"id": "v-oni-1k", "unit_size": "1 kg", "price": 35, "mrp": 40, "stock_quantity": 70, "is_available": true}, {"id": "v-oni-2k", "unit_size": "2 kg", "price": 68, "mrp": 80, "stock_quantity": 30, "is_available": true}]'::jsonb
    )
ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category_id = EXCLUDED.category_id,
    price = EXCLUDED.price,
    mrp = EXCLUDED.mrp,
    unit_size = EXCLUDED.unit_size,
    description = EXCLUDED.description,
    is_available = EXCLUDED.is_available,
    is_featured = EXCLUDED.is_featured,
    variants = EXCLUDED.variants;
