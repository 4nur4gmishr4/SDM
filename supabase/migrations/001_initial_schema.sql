-- 001_initial_schema.sql

-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLES
-- ==========================================

CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    thumbnail_url TEXT,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    is_offer_category BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    unit_size TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL UNIQUE,
    order_type TEXT NOT NULL CHECK (order_type IN ('cart', 'quick')),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    map_link TEXT,
    quick_order_text TEXT,
    subtotal NUMERIC(10,2),
    delivery_fee NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'completed', 'cancelled')),
    whatsapp_opened BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT NOT NULL,
    product_price NUMERIC(10,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(10,2) NOT NULL
);

CREATE TABLE public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_type TEXT NOT NULL CHECK (offer_type IN ('daily', 'mid_month', 'b1g1', 'buy_more', 'general')),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    text TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.delivery_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rules_text TEXT NOT NULL,
    flat_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_path TEXT NOT NULL,
    visitor_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ==========================================
-- 2. INDEXES
-- ==========================================
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_archived ON public.products(is_archived);
CREATE INDEX idx_products_available ON public.products(is_available);
CREATE INDEX idx_products_featured ON public.products(is_featured);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at);


-- ==========================================
-- 3. RLS POLICIES
-- ==========================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Categories: public can read visible, admin can do everything
CREATE POLICY "Public can view visible categories" ON public.categories FOR SELECT USING (is_visible = true);
CREATE POLICY "Admin full access categories" ON public.categories TO authenticated USING (true);

-- Products: public can read unarchived, admin can do everything
CREATE POLICY "Public can view unarchived products" ON public.products FOR SELECT USING (is_archived = false);
CREATE POLICY "Admin full access products" ON public.products TO authenticated USING (true);

-- Orders: public can only insert, admin can select and update
CREATE POLICY "Public can insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can update orders" ON public.orders FOR UPDATE TO authenticated USING (true);

-- Order Items: public can only insert, admin can select
CREATE POLICY "Public can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view order items" ON public.order_items FOR SELECT TO authenticated USING (true);

-- Offers: public can read active, admin can do everything
CREATE POLICY "Public can view active offers" ON public.offers FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access offers" ON public.offers TO authenticated USING (true);

-- Banners: public can read active, admin can do everything
CREATE POLICY "Public can view active banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access banners" ON public.banners TO authenticated USING (true);

-- Delivery Settings: public can read, admin can update
CREATE POLICY "Public can view delivery settings" ON public.delivery_settings FOR SELECT USING (true);
CREATE POLICY "Admin can update delivery settings" ON public.delivery_settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can insert delivery settings" ON public.delivery_settings FOR INSERT TO authenticated WITH CHECK (true);

-- Store Settings: public can read, admin can update
CREATE POLICY "Public can view store settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admin can update store settings" ON public.store_settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can insert store settings" ON public.store_settings FOR INSERT TO authenticated WITH CHECK (true);

-- Page Views: public can insert, admin can read
CREATE POLICY "Public can insert page views" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view page views" ON public.page_views FOR SELECT TO authenticated USING (true);


-- ==========================================
-- 4. SEED DATA
-- ==========================================

-- Insert the 21 client-requested categories
INSERT INTO public.categories (name, slug, display_order, is_offer_category) VALUES
    ('Bakery Products', 'bakery-products', 1, false),
    ('Dairy Products', 'dairy-products', 2, false),
    ('Food Grains', 'food-grains', 3, false),
    ('Grocery', 'grocery', 4, false),
    ('Spices', 'spices', 5, false),
    ('Chocolates', 'chocolates', 6, false),
    ('Oil and Spices', 'oil-and-spices', 7, false),
    ('Home Cleaners', 'home-cleaners', 8, false),
    ('Personal Care', 'personal-care', 9, false),
    ('Appliances', 'appliances', 10, false),
    ('SDSM Specials', 'sdsm-specials', 11, false),
    ('Stationeries', 'stationeries', 12, false),
    ('Plastic Items', 'plastic-items', 13, false),
    ('Baby Care', 'baby-care', 14, false),
    ('Dining Chair', 'dining-chair', 15, false),
    ('PETS', 'pets', 16, false),
    ('BeverUAGES', 'beverages', 17, false),
    ('Electricals & Electronics', 'electricals-electronics', 18, false),
    ('Mid Month Offer', 'mid-month-offer', 19, true),
    ('Buy 1 Get 1 Offers', 'buy-1-get-1-offers', 20, true),
    ('Buy More Get More', 'buy-more-get-more', 21, true);

-- Default delivery settings
INSERT INTO public.delivery_settings (rules_text, flat_fee) VALUES
    ('Free delivery within 5km radius for orders above ₹500.', 0.00);

-- Default store settings
INSERT INTO public.store_settings (key, value) VALUES
    ('store_name', 'Sai Darshan Mart'),
    ('store_phone', '+910000000000'),
    ('store_whatsapp', '+910000000000'),
    ('store_address', '1117 Sanjeevni Nagar Main Road, Jabalpur, Madhya Pradesh, 482003'),
    ('store_hours', '9:00 AM - 10:00 PM'),
    ('store_tagline', 'There is only one Boss: The Customer'),
    ('store_map_embed', '');
