# Sai Darshan Mart — Web Storefront & Management System

> **Store Address:** 1117 Sanjeevni Nagar Main Road, Jabalpur, MP 482003  
> **Contact / WhatsApp:** +91 79991 57430  
> **UPI ID:** 7999157430@upi  
> **Store Motto:** *"There is only one Boss: The Customer."*

---

## Table of Contents
1. [Project Overview](#phase-1-project-overview)
2. [Architecture & Technology Stack](#phase-2-architecture--technology-stack)
3. [Storefront & Customer Features](#phase-3-storefront--customer-features)
4. [Order Processing & Checkout Pipeline](#phase-4-order-processing--checkout-pipeline)
5. [Geolocation & Address Resolution](#phase-5-geolocation--address-resolution)
6. [Admin Management Suite](#phase-6-admin-management-suite)
7. [Supabase Cloud Database & Storage](#phase-7-supabase-cloud-database--storage)
8. [Design System & Theme Engine](#phase-8-design-system--theme-engine)
9. [Local Development & Environment Setup](#phase-9-local-development--environment-setup)
10. [Production Build & Deployment](#phase-10-production-build--deployment)

---

## Phase 1: Project Overview

Sai Darshan Mart is an end-to-end e-commerce web application tailored for a local supermarket in Jabalpur, Madhya Pradesh. The system provides:

- A consumer storefront optimized for fast product discovery, variant selection, and local doorstep delivery across a 5–10 km radius.
- Dual order workflows: a standard cart-based checkout and a "Quick Order" paste-list interface.
- Native WhatsApp pre-filled order routing accompanied by automated UPI 1-tap payment deep linking.
- An admin portal for inventory management, Excel catalog batch ingestion, live order tracking, category ordering, banner management, and store configurations.
- Cloud-hosted media architecture where product photos, store tour videos, banners, and category tiles load from Supabase Storage CDN, keeping the local repository free of binary assets.

---

## Phase 2: Architecture & Technology Stack

### Core Frameworks & Tooling
| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime / UI** | React | 19.x | Component-driven UI architecture |
| **Language** | TypeScript | 6.x | Strict type safety (`noUnusedLocals`, `noUnusedParameters`) |
| **Bundler** | Vite | 8.x | ES module dev server & optimized production rollup |
| **Routing** | React Router | 7.x | Single Page Application client routing |
| **Backend & Auth** | Supabase JS Client | 2.x | Postgres database queries, Auth, and Storage CDN |
| **Mapping** | Leaflet + OpenStreetMap / ArcGIS | 1.9.x | Interactive delivery pin location picker |
| **Animation** | GSAP | 3.x | Stroke text and entrance transitions |
| **Data Processing**| XLSX (SheetJS) | 0.18.x | In-browser Excel catalog parsing and validation |
| **SEO / Meta** | React Helmet Async | 3.x | Per-route document titles and meta descriptions |
| **PWA** | Vite Plugin PWA | 1.3.x | Service worker generation and offline manifest |

### Directory Structure
```
SDMWEB/
├── public/                     # Static assets (favicons, redirects, headers)
│   ├── _headers               # Cache-Control and security headers
│   ├── _redirects             # SPA fallback (/* -> /index.html 200)
│   └── favicon.svg            # Store brand SVG favicon
├── src/
│   ├── components/
│   │   ├── admin/             # AdminShell, ExcelImportWidget, ImageUploadField
│   │   ├── common/            # AppShell, Skeleton, StrokeText, Footer, ErrorBoundary
│   │   └── customer/          # ProductTile, ProductGrid, IOSBannerCarousel, SearchBar...
│   ├── contexts/              # Auth, Cart, Location, Snackbar, Theme
│   ├── data/                  # Static store media metadata (Supabase CDN references)
│   ├── hooks/                 # Data hooks (useProducts, useCategories, useBanners...)
│   ├── lib/                   # Supabase client, geocoding, orderUtils, validation
│   ├── pages/
│   │   ├── admin/             # Dashboard, Orders, Products, Categories, Banners, Settings
│   │   └── customer/          # Home, Shop, ProductDetail, Cart, Checkout, QuickOrder...
│   ├── styles/                # global.css (resets & typography) and tokens.css (theme tokens)
│   ├── types/                 # TypeScript models (product, category, order, banner...)
│   ├── App.tsx                # Route definitions & provider tree
│   ├── main.tsx               # Application bootstrap
│   └── vite-env.d.ts          # Environment typings
├── .env.example               # Environment variables template
├── .gitignore                 # Strict ignore rules
├── package.json               # Dependencies and scripts
└── vite.config.ts             # Vite build & chunking configuration
```

---

## Phase 3: Storefront & Customer Features

### 1. Home Page (`/`)
- **iOS-Style Banner Carousel**: Touch-draggable and mouse-draggable carousel supporting autoplay, slide pause on hover, slide indicators, and a dedicated 1:1 skeleton loader.
- **Desktop Hero Landing Brief**: Desktop-only showcase featuring animated SVG `StrokeText` displaying *"Sai Darshan Mart"*, store badges, and quick-access customer guarantees.
- **Curated Category Rail**: Horizontal scroll rail displaying product categories with thumbnail badges and direct navigation to filtered catalog views.
- **Featured Products Grid**: Displays items marked with `is_featured = true` directly on the homepage.
- **Watermark Banner**: Branded marquee ticker displaying store guarantees, location details, and direct contact numbers.

### 2. Catalog & Shopping Page (`/shop`)
- **Category Navigation**: 21 product departments and promotional offer tabs matching PRD Section 3:
  1. SaiDarshan specials (`sai-darshan-specials`)
  2. Grocery staples (`grocery-staples`)
  3. Food grains (Atta & Dals) (`food-grains-atta-dals`)
  4. Dairy products (`dairy-products`)
  5. Bakery products (`bakery-products`)
  6. Cooking oils & Ghee (`cooking-oils-ghee`)
  7. Spices & Seasonings (`spices-seasonings`)
  8. Beverages & Cold Drinks (`beverages-drinks`)
  9. Chocolates & Confectionery (`chocolates-confectionery`)
  10. Personal care & Hygiene (`personal-care`)
  11. Baby care (`baby-care`)
  12. Home cleaners (`home-cleaners`)
  13. Plastic items & Storage (`plastic-items-storage`)
  14. Stationeries & School supplies (`stationery-supplies`)
  15. Appliances (`appliances`)
  16. Electricals & Electronics (`electricals-electronics`)
  17. Dining chairs & Furniture (`dining-chairs-furniture`)
  18. Pet supplies (`pet-supplies`)
  19. Mid Month Offer (`mid-month-offer` — promotional offer tab)
  20. Buy 1 Get 1 Offers (`buy-1-get-1` — promotional offer tab)
  21. Buy More Get More (`buy-more-get-more` — promotional offer tab)
- **Live Search**: Instant keyword filtering across item names, brands, descriptions, and SKUs.
- **Product Card (`ProductTile`)**:
  - Displays product image, brand, title, pack size, selling price, and maximum retail price (MRP) with calculated savings badges.
  - Multi-variant selector (e.g., 250g, 500g, 1kg) dynamically recalculating prices and stock availability.
  - One-tap add to cart with inline quantity stepper.

### 3. Product Details Page (`/product/:id`)
- Deep-linked detail view with high-resolution image viewing.
- Full product specifications, variant picker, and real-time availability status.
- Direct *"Add to Cart"* and *"Order via WhatsApp"* quick actions.

### 4. About & Store Visuals (`/about`)
- Store heritage overview and customer philosophy.
- Interactive media gallery featuring real photos of store aisles, billing counter, and product racks.
- Video tour player showcasing store layout.
- Embedded Google Maps location with 1-tap navigation trigger.

---

## Phase 4: Order Processing & Checkout Pipeline

### Order Workflows

```
Customer Cart / Quick Order
           │
           ▼
Input Sanitization & Validation (10-digit Indian Mobile, Address)
           │
           ▼
Order Inserted into Supabase `orders` & `order_items` tables
           │
      ┌────┴────────────────────────┐
      ▼                             ▼
UPI Deep Link               WhatsApp Order Dispatch
(gpay/phonepe/paytm/bhim)   (Pre-formatted message with Order ID,
                             line items, subtotal & GPS map pin)
```

### 1. Standard Cart Checkout (`/cart` & `/checkout`)
- **Cart Management**: Persistent state stored in browser `localStorage`.
- **Dynamic Delivery Fee**: Calculated from `delivery_settings` table (flat fee applied, waived when order meets or exceeds `free_delivery_threshold`).
- **Validation**: Enforces clean 10-digit mobile number normalization (stripping leading zeros, `+91`, or spaces) and minimum address length.
- **Order ID Generation**: Generates unique reference code in the format `SDM-YYMMDD-XXXX`.
- **UPI Deep Link Generation**: Creates standard `upi://pay` URI pre-populated with:
  - Payee VPA: `7999157430@upi`
  - Payee Name: `Sai Darshan Mart`
  - Amount: Exact order total in INR
  - Transaction Note: Order reference code
- **WhatsApp Message Formulation**: Formats markdown message detailing:
  - Header with Order ID
  - Itemized list with quantities, unit sizes, and line totals
  - Subtotal, delivery fee, and final payable amount
  - Customer name, phone, delivery address, and live GPS map pin link.

### 2. Quick Order Interface (`/quick-order`)
- Designed for customers who prefer typing or pasting handwritten grocery lists.
- Captures customer name, phone number, address, and free-form grocery list text.
- Generates an order in Supabase with `is_quick_order = true` and dispatches formatted text directly to WhatsApp.

### 3. Order Confirmation (`/order-confirmation`)
- Summary screen displaying order reference code, delivery expectations, and a persistent button to re-open the WhatsApp conversation if closed accidentally.

---

## Phase 5: Geolocation & Address Resolution

Delivery accuracy across Jabalpur is powered by a multi-tier reverse geocoding engine:

### 1. Interactive Map Picker (`LocationPickerModal`)
- Powered by Leaflet with three switchable map layer views:
  - **Street View**: Standard OpenStreetMap cartography.
  - **Satellite View**: High-resolution ESRI World Imagery.
  - **Terrain View**: OpenTopoMap elevation topography.
- Draggable center pin that triggers reverse geocoding on movement end.
- One-tap *"Use Current Location"* button querying the browser Geolocation API.

### 2. Reverse Geocoding Providers
- **Primary**: ArcGIS World Geocode API (fast reverse geocoding with zero API key dependencies and browser CORS support).
- **Secondary Fallback**: BigDataCloud Client Reverse Geocoding API.
- **Tertiary Fallback**: OpenStreetMap Nominatim.

### 3. Offline Jabalpur Local Landmark Matching
- Built-in dataset covering major Jabalpur localities for 0ms offline address suggestions:
  - Napier Town, Civil Lines, Wright Town, Vijay Nagar, Madan Mahal, Gorakhpur, Sadar Bazar, Russell Chowk, Golbazar, Garha, Tilhari, Bilhari, Dhanvantri Nagar, Ranjhi, Adhartal, Gwarighat, and Bhedaghat.

---

## Phase 6: Admin Management Suite

The admin interface (`/admin`) is protected by Supabase authentication and client-side session guards.

### 1. Authentication & Security (`/admin/login`)
- Email and password verification through Supabase Auth.
- Brute-force lockout mechanism: Locks the login form for 60 seconds after 5 consecutive failed attempts, storing lockout state in `sessionStorage`.

### 2. Dashboard (`/admin`)
- Real-time operational metric cards:
  - Total website orders and pending orders count.
  - Today's unique visitors and all-time page impressions.
  - Active catalog product count and live promotional banner count.
- Direct quick-action link to the comprehensive Analytics Suite.

### 3. Analytics & Traffic Suite (`/admin/analytics`) — PRD 4.2 #33 Compliant
- **Website Traffic & Activity Metrics**:
  - Live total page views with today's real-time count.
  - Daily unique visitors count with 7-day bar chart visualization.
  - Per-route page impressions breakdown (Storefront Home, Catalog, Quick Order, Cart, Checkout, About).
  - Visitor device distribution (Mobile phones vs Desktop laptops vs Tablets).
- **Order Counts & Status Distribution**:
  - Orders categorized by lifecycle status: `New / Pending`, `Processing`, `Delivered`, and `Cancelled`.
  - Channel distribution: Standard Cart checkout orders vs Quick Order list submissions.
- **Strict PRD #33 Scope Adherence**: Explicitly excludes revenue totals, rupee calculations, or commercial sums.

### 4. Order Management (`/admin/orders`)
- Real-time orders table displaying Order ID, customer contact, delivery address, total amount, and timestamp.
- Status management transitions: `pending` → `processing` → `shipped` → `delivered` → `cancelled`.
- Modal view expanding itemized product lines, quantities, and GPS coordinates.
- Direct 1-tap WhatsApp chat button to message the customer directly from the table.

### 5. Product Catalog & Variant Manager (`/admin/products`)
- Full CRUD capabilities: create, view, edit, archive, and delete products across all 21 departments.
- Multi-variant configuration: assign multiple unit sizes (e.g. 500g, 1kg) with individual prices, MRPs, and stock quantities per product.
- Filter by department/category and instant search by product name or SKU.
- Toggle flags: `is_available` (in stock) and `is_featured` (pinned to homepage).
- Image uploads: direct drag-and-drop file upload to Supabase Storage with CDN URL generation.

### 6. Excel Batch Catalog Importer (`ExcelImportWidget`)
- Upload `.xlsx` or `.xls` spreadsheets containing hundreds of products at once.
- Automated column header mapping (detects SKU, Name, Category, Price, MRP, Pack Size).
- Smart category classification rules matching item keywords against existing store categories.
- Pre-import validation screen: shows row errors, missing fields, and duplicates before committing writes to Supabase.

### 7. Category Management (`/admin/categories`)
- Add new categories, update descriptions, and upload thumbnail images across all 21 departments and promotional offer tabs.
- Drag or re-order display sequence numbers.
- Visibility toggles to hide out-of-season departments without deleting data.

### 8. Banner & Promotion Manager (`/admin/banners`)
- Create and schedule homepage carousel slides with custom headline text, banner images, and target links (e.g. `/shop/mid-month-offer`, `/shop/buy-1-get-1`).
- Re-order slides and toggle active states.
- Default Logo Banner manager: customize the permanent fallback brand banner with instant preview.

### 9. Store & Delivery Settings (`/admin/settings`)
- Update flat delivery fee (₹) and free delivery qualifying order threshold.
- Modify delivery policy terms and store operating hours.

### 10. Pipelines & Automation Control Center (`/admin/pipelines`)
- **CI/CD Deployment Pipeline (GitHub Actions)**:
  - Automated workflow (`.github/workflows/ci.yml`) triggering on pushes to `master`.
  - Strict TypeScript checking (`tsc -b`), production bundle rollup (`vite build`), and Playwright responsive smoke tests.
  - Live status badge and direct links to GitHub Actions run history.
- **Order Webhook & Notification Pipeline**:
  - Outbound webhook automation dispatching real-time JSON payloads to Discord, Telegram, Make.com, Zapier, or Google Sheets upon new customer checkout.
  - Manual endpoint test ping utility with instant response verification.
- **1-Click Database & Catalog Backup Pipeline**:
  - 1-tap Excel export (`.xlsx`) of all 21 categories, products, prices, MRPs, and variants.
  - 1-tap Excel export (`.xlsx`) of all customer orders, itemized lines, and delivery GPS links.
  - Complete disaster recovery JSON snapshot export.
- **System Health Diagnostics**:
  - Live Supabase database ping latency (ms) and real-time operational status.

---

## Phase 7: Supabase Cloud Database & Storage

### Relational Schema

```sql
-- Categories table
categories (
  id uuid primary key,
  name text not null,
  slug text unique not null,
  description text,
  thumbnail_url text,
  display_order int default 0,
  is_visible boolean default true,
  is_offer_category boolean default false,
  created_at timestamp,
  updated_at timestamp
);

-- Products table
products (
  id uuid primary key,
  sku text unique not null,
  name text not null,
  brand text,
  category_id uuid references categories(id),
  price numeric not null,
  mrp numeric,
  unit_size text not null,
  stock_quantity int default 0,
  description text,
  image_url text,
  is_available boolean default true,
  is_archived boolean default false,
  is_featured boolean default false,
  created_at timestamp,
  updated_at timestamp
);

-- Product variants table
product_variants (
  id uuid primary key,
  product_id uuid references products(id) on delete cascade,
  unit_size text not null,
  price numeric not null,
  mrp numeric,
  stock_quantity int default 0,
  is_available boolean default true,
  sku text
);

-- Promotional banners table
banners (
  id uuid primary key,
  title text not null,
  text text,
  image_url text not null,
  link_url text,
  is_active boolean default true,
  display_order int default 0,
  created_at timestamp,
  updated_at timestamp
);

-- Customer orders table
orders (
  id text primary key,
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  map_link text,
  quick_order_text text,
  is_quick_order boolean default false,
  subtotal_amount numeric not null,
  delivery_fee numeric default 0,
  total_amount numeric not null,
  status text default 'pending',
  created_at timestamp,
  updated_at timestamp
);

-- Order line items table
order_items (
  id uuid primary key,
  order_id text references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  product_name text not null,
  product_sku text not null,
  product_price numeric not null,
  unit_size text,
  quantity int not null,
  line_total numeric not null
);

-- Store delivery settings table
delivery_settings (
  id uuid primary key,
  rules_text text,
  flat_fee numeric default 30,
  free_delivery_threshold numeric default 499,
  is_active boolean default true,
  updated_at timestamp
);

-- Key-value store configuration table
store_settings (
  id uuid primary key,
  key text unique not null,
  value text not null,
  updated_at timestamp
);
```

### Storage Bucket: `store-media`
All binary files are hosted under the public `store-media` bucket:
- `banners/`: Homepage promotional graphics and brand logos.
- `categories/`: Category square thumbnail images.
- `products/`: Product packaging photos.
- `store/`: Store visual walkthrough photos and video MP4 files.

---

## Phase 8: Design System & Theme Engine

The user interface uses Vanilla CSS organized around standardized CSS custom properties (design tokens).

### 1. Theme Support
- Supports **Light Mode**, **Dark Mode**, and **System Preference**.
- The `index.html` file includes an early script snippet executing before first paint to prevent theme flashing (FOUT) on load:
```js
var saved = localStorage.getItem('sdm-theme');
var isDark = saved === 'dark' || (saved !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
```

### 2. Design Tokens (`src/styles/tokens.css`)
- **Brand Colors**:
  - Primary Brand Green: `#1E8E3E` (Dark Mode: `#81C995`)
  - Accent / Secondary Yellow: `#F9AB00` (Dark Mode: `#FDD663`)
  - Status Colors: `#BA1A1A` (Error), `#137333` (Success)
- **Surfaces & Backgrounds**:
  - Light Surface: `#FFFFFF` / `#F8F9FA`
  - Dark Surface: `#121212` / `#1E1E1E`
- **Elevation**: Material-grade layered drop shadows from elevation 1 to elevation 5.

### 3. Layout Responsiveness
- Desktop viewport: Max-width layout container (`1280px`), multi-column product grids, persistent location bar, and hero presentation.
- Mobile viewport: Bottom-docked sticky navigation bar, full-width touch-friendly product cards, and bottom sheet dialogs.

---

## Phase 9: Local Development & Environment Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Setup Steps
1. **Clone the repository:**
   ```bash
   git clone https://github.com/4nur4gmishr4/SDM.git
   cd SDMWEB
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy `.env.example` to `.env` (or `.env.local`):
   ```bash
   cp .env.example .env
   ```
   Provide your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

---

## Phase 10: Production Build & Deployment

### Build Verification
Before deploying, execute the production build pipeline to verify type correctness and bundling:
```bash
npm run build
```
This runs:
1. `tsc -b`: Compiles TypeScript with zero emitted errors, validating all exports, locals, and parameters.
2. `vite build`: Tree-shakes unused code, bundles assets, splits vendor libraries into separate chunks, and generates service worker manifests.

### Production Output
The compiled production bundle is generated inside the `dist/` folder:
- `dist/index.html`: Entry point with preloaded fonts and styles.
- `dist/assets/vendor-react-*.js`: React, React-DOM, and React Router runtime chunk.
- `dist/assets/vendor-supabase-*.js`: Supabase client chunk.
- `dist/assets/vendor-leaflet-*.js`: Leaflet map engine chunk (lazy-loaded).
- `dist/assets/vendor-xlsx-*.js`: Spreadsheet engine chunk (lazy-loaded for admin).
- `dist/sw.js`: Workbox PWA service worker for asset caching.

### Hosting Guidelines
Deploy `dist/` to any static web hosting provider (Cloudflare Pages, Vercel, Netlify):
- Ensure `public/_redirects` or host rewrite rules redirect all paths to `/index.html` with HTTP status `200` to support client-side routing.
- Set environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in your hosting provider's dashboard.
