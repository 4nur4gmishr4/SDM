# Sai Darshan Shopping Mart — Web Storefront & Management System

[![Lead Architect](https://img.shields.io/badge/Lead%20Architect-4nur4gmishr4-1E8E3E?style=for-the-badge&logo=github&logoColor=white)](https://github.com/4nur4gmishr4)
[![Main Contributor](https://img.shields.io/badge/Main%20Contributor-4nur4gmishr4-F7C600?style=for-the-badge&logo=github&logoColor=black)](https://github.com/4nur4gmishr4)
[![Repository](https://img.shields.io/badge/GitHub-SaiDarshanMart-blue?style=for-the-badge&logo=github)](https://github.com/amit-saidarshan/SaiDarshanMart)
[![CI/CD Pipeline](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/amit-saidarshan/SaiDarshanMart/actions)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20Ready-orange?style=for-the-badge&logo=pwa&logoColor=white)](https://saidarshanmart.com)

> **Store Address:** 1117 Sanjeevni Nagar Main Road, Jabalpur, Madhya Pradesh 482003  
> **Contact / WhatsApp:** +91 73541 55669  
> **UPI ID:** `7354155669@upi` | **ICICI POS Terminal:** `ibkPOS.EP116181@icici`  
> **Store Operating Hours:** 8:00 AM to 10:30 PM (Open All 7 Days)  
> **Store Motto:** *"There is only one Boss: The Customer."*

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Architecture & Technology Stack](#2-architecture--technology-stack)
3. [Purified Master Catalog (1,827 Items)](#3-purified-master-catalog-1827-items)
4. [Storefront & Customer Features](#4-storefront--customer-features)
5. [Order Pipeline, SRE Outbox & Dynamic UPI](#5-order-pipeline-sre-outbox--dynamic-upi)
6. [Geolocation & Reverse Geocoding](#6-geolocation--reverse-geocoding)
7. [Admin Management Suite](#7-admin-management-suite)
8. [Database Schema & Cloud Storage](#8-database-schema--cloud-storage)
9. [Design System, Theme Engine & PWA](#9-design-system-theme-engine--pwa)
10. [Local Development & Configuration](#10-local-development--configuration)
11. [Production Build & CI/CD Pipeline](#11-production-build--cicd-pipeline)
12. [Lead Architect & Primary Contributor](#12-lead-architect--primary-contributor)

---

## 1. Project Overview

Sai Darshan Shopping Mart is an enterprise-grade e-commerce storefront and store management web application custom-built for a premier supermarket in Jabalpur, Madhya Pradesh. The system provides:

- **Customer Storefront**: Lightning-fast grocery discovery, multi-variant unit selection, and doorstep delivery across a 5–10 km radius in Jabalpur.
- **Dual Checkout System**: Standard full-featured cart checkout alongside a frictionless "Quick Order" text-list submission interface.
- **Dynamic UPI & ICICI POS Integration**: Instant 1-tap UPI app intent triggering (`7354155669@upi`), real-time dynamic QR code generation, and official ICICI Bank Merchant POS Standee support (`ibkPOS.EP116181@icici`).
- **Google SRE-Grade Offline Outbox**: Resilient IndexedDB vault buffering orders during poor network or offline conditions, guaranteeing zero lost orders.
- **Interactive Admin Suite**: Real-time order status tracking with 1-click WhatsApp customer messaging, in-browser drag-and-drop Excel inventory catalog importer, promotional banner scheduler, category organizer, and PRD #33 compliant traffic analytics.
- **Zero-Binary Cloud Media**: Product photos, store visual tours, banners, and category tiles stream directly from Supabase Storage CDN, keeping the codebase lean and lightning-fast.

---

## 2. Architecture & Technology Stack

### Core Frameworks & Tooling
| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime & UI** | React | 19.x | Component-driven declarative UI architecture |
| **Language** | TypeScript | 5.8+ / strict | Full static type safety (`noUnusedLocals`, `noUnusedParameters`) |
| **Bundler** | Vite | 6.x / 8.x | ES module dev server with Rolldown-accelerated chunking |
| **Routing** | React Router | 7.x | Single Page Application (SPA) client-side routing |
| **Backend & Auth** | Supabase JS Client | 2.x | PostgreSQL queries, Session Auth, and Cloud Storage CDN |
| **Mapping Engine** | Leaflet + OpenStreetMap / ESRI | 1.9.x | Interactive delivery pin location picker with multi-layer views |
| **Animation Engine**| GSAP | 3.x | Hardware-accelerated SVG stroke text and view transitions |
| **Data Processing**| SheetJS (XLSX) | 0.18.x | In-browser Excel catalog parsing and batch database ingestion |
| **PWA & Offline** | Vite Plugin PWA + Workbox | 1.3.x | Service worker caching, offline asset precaching, and Web Manifest |
| **SEO & Metadata** | React Helmet Async | 3.x | Dynamic per-route OpenGraph, Twitter cards, and meta tags |

### Repository Structure
```
SDMWEB/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI/CD (lint, strict tsc, build & smoke tests)
├── public/                    # Static assets & routing fallbacks
│   ├── _headers               # Production security & cache-control headers
│   ├── _redirects             # SPA routing fallback for Netlify/Cloudflare (/* -> /index.html 200)
│   ├── favicon.ico            # Supermarket brand favicon
│   ├── robots.txt             # Search crawler indexing configuration
│   └── sai-darshan-upi-qr-card.svg # Official merchant POS standee graphic
├── src/
│   ├── components/
│   │   ├── admin/             # AdminShell, ExcelImportWidget, ImageUploadField...
│   │   ├── common/            # AppShell, Footer, ErrorBoundary, Skeleton, StrokeText...
│   │   ├── customer/          # ProductTile, ProductGrid, IOSBannerCarousel, SearchBar...
│   │   └── payment/           # DynamicUpiPayment (QR code generator, 1-tap UPI app intents)
│   ├── contexts/              # Auth, Cart, Location, Snackbar, Theme state providers
│   ├── data/                  # Store media metadata & permanent visual walkthrough assets
│   ├── hooks/                 # Custom hooks (useProducts, useCategories, useTrafficTracker...)
│   ├── lib/                   # Supabase client, orderOutbox (IndexedDB), backupPipeline, geocoding
│   ├── pages/
│   │   ├── admin/             # Dashboard, Orders, Products, Categories, Banners, Analytics, Settings
│   │   └── customer/          # Home, Shop, ProductDetail, Cart, Checkout, QuickOrder, About...
│   ├── styles/                # tokens.css (M3 design tokens) & global.css (fluid typography, resets)
│   ├── types/                 # Strict TypeScript schemas (product, order, category, banner)
│   ├── App.tsx                # Client-side router & application provider tree
│   ├── main.tsx               # Application bootstrap with root error boundaries
│   └── vite-env.d.ts          # Environment variable typings
├── .env.example               # Environment configuration template
├── package.json               # Dependencies, build scripts & metadata
├── tsconfig.json              # Strict TypeScript compiler options
├── vercel.json                # Vercel deployment & rewrite configuration
└── vite.config.ts             # Vite chunk splitting & PWA service worker setup
```

---

## 3. Purified Master Catalog (1,827 Items)

The live database contains a purified master catalog of **1,827 verified active products** rigorously audited and standardized:

1. **100% Active Image Coverage**: Every single item is mapped to a verified, publicly accessible HTTP 200 high-resolution product photograph hosted on the Supabase CDN.
2. **Zero Shorthand Abbreviations**: Standardized canonical brand and product names. Truncated abbreviations (such as *"bri"* for Britannia, *"suh"* for Suhana, *"cad"* for Cadbury, *"ever"* for Everest) were completely resolved to their official trade names.
3. **Strict 1-to-1 Exact Match**: Image-to-title parity audited line by line to eliminate cross-item mismatch anomalies.
4. **Transparent Pricing & Pack Sizes**: Explicit Maximum Retail Price (MRP), selling price with calculated savings badges, and exact pack weights/volumes (e.g., 200g, 500g, 1kg, 5L).
5. **Department Categorization**: Spans all 21 supermarket departments and promotional offer tabs:
   - *SaiDarshan specials* (`sai-darshan-specials`)
   - *Grocery staples* (`grocery-staples`)
   - *Food grains (Atta & Dals)* (`food-grains-atta-dals`)
   - *Dairy products* (`dairy-products`)
   - *Bakery products* (`bakery-products`)
   - *Cooking oils & Ghee* (`cooking-oils-ghee`)
   - *Spices & Seasonings* (`spices-seasonings`)
   - *Beverages & Cold Drinks* (`beverages-drinks`)
   - *Chocolates & Confectionery* (`chocolates-confectionery`)
   - *Personal care & Hygiene* (`personal-care`)
   - *Baby care* (`baby-care`)
   - *Home cleaners* (`home-cleaners`)
   - *Plastic items & Storage* (`plastic-items-storage`)
   - *Stationeries & School supplies* (`stationery-supplies`)
   - *Appliances* (`appliances`)
   - *Electricals & Electronics* (`electricals-electronics`)
   - *Dining chairs & Furniture* (`dining-chairs-furniture`)
   - *Pet supplies* (`pet-supplies`)
   - *Mid Month Offer* (`mid-month-offer`)
   - *Buy 1 Get 1 Offers* (`buy-1-get-1`)
   - *Buy More Get More* (`buy-more-get-more`)

---

## 4. Storefront & Customer Features

### 1. Storefront Home (`/`)
- **iOS-Grade Banner Carousel**: Touch-draggable and mouse-draggable carousel supporting autoplay, slide pause on hover, slide indicators, and a dedicated 1:1 skeleton loader.
- **Desktop Hero Landing Brief**: Desktop-exclusive showcase featuring animated SVG `StrokeText` displaying *"Sai Darshan Shopping Mart"*, store badges, and quick-access customer guarantees.
- **Curated Category Rail**: Horizontal scroll rail displaying product categories with thumbnail badges and direct navigation to filtered catalog views.
- **Featured Products Grid**: Displays items marked with `is_featured = true` directly on the homepage.
- **Watermark Banner**: Branded marquee ticker displaying store guarantees, location details, and direct contact numbers.

### 2. Catalog & Shopping (`/shop` & `/shop/:categorySlug`)
- **Department Navigation**: Seamless filtering across all 21 departments and promotional offer tabs with URL synchronization.
- **Instant Search**: Real-time keyword filtering across item names, brands, descriptions, and SKUs with instant result feedback.
- **Product Card (`ProductTile`)**:
  - High-res image display with lazy loading and fallback placeholders.
  - MRP, selling price, and automatic discount percentage badge calculation.
  - Dynamic multi-variant selector (e.g., 250g, 500g, 1kg) updating prices and stock live.
  - One-tap add to cart with inline quantity stepper.

### 3. Product Details (`/product/:id`)
- Deep-linked detail view with high-resolution image viewing.
- Full product specifications, variant picker, and real-time availability status.
- Direct *"Add to Cart"* and *"Order via WhatsApp"* quick actions.

### 4. About Store & Heritage (`/about`)
- Store heritage overview and customer philosophy.
- **Master Visual Showcase**: High-resolution photo gallery of aisles, billing counter, and product racks.
- Video tour player showcasing store layout.
- Embedded Google Maps location with 1-tap navigation trigger.
- **Merchant POS Standee Widget**: Digitalized ICICI Bank UPI Standee card with instant download action.

---

## 5. Order Pipeline, SRE Outbox & Dynamic UPI

```
Customer Order (Cart or Quick Order)
            │
            ▼
Google SRE-Grade IndexedDB Vault (`sdm_offline_vault`)
  ↳ Staged locally before network dispatch (zero lost orders)
            │
            ▼
Supabase PostgreSQL (`orders` & `order_items` tables)
            │
       ┌────┴────────────────────────┐
       ▼                             ▼
Dynamic UPI QR & App Intent    WhatsApp Pre-Formatted Dispatch
• VPA: 7354155669@upi         • Order ID (SDM-YYMMDD-XXXX)
• Terminal: ibkPOS.EP116181   • Itemized list with unit sizes
• Pre-filled exact amount      • Delivery address & live GPS pin
• 1-tap GPay/PhonePe/Paytm     • Direct customer-to-merchant chat
```

### 1. Dual Order Flows
- **Standard Cart Checkout (`/checkout`)**: Itemized cart items, subtotal calculation, automated delivery fee (free above threshold), customer details validation, and map GPS pin link.
- **Quick Order Interface (`/quick-order`)**: Dedicated screen for customers submitting handwritten or pasted grocery lists with instant order creation and WhatsApp routing.

### 2. SRE-Grade Offline Outbox (`orderOutbox.ts`)
- Utilizes browser `IndexedDB` (`sdm_offline_vault`) to stage orders locally before attempting network dispatch.
- Automatically retries syncing orders with Supabase when network connectivity resumes.
- Eliminates transaction failure and cart abandonment caused by spotty 2G/3G mobile data.

### 3. Dynamic UPI Payment Engine (`DynamicUpiPayment.tsx`)
- Standardized `upi://pay` URI format with pre-filled exact order total, transaction note, and merchant identifiers.
- Real-time High Error Correction ('H') QR code rendered dynamically using brand colors (`#0D652D`).
- Direct 1-tap intent buttons for Google Pay, PhonePe, Paytm, BHIM, Cred, and other UPI apps on mobile devices.
- Official ICICI Bank POS Terminal integration (`ibkPOS.EP116181@icici`).

---

## 6. Geolocation & Reverse Geocoding

Local delivery accuracy across Jabalpur is powered by a multi-tier reverse geocoding engine:

### 1. Interactive Map Picker (`LocationPickerModal`)
- Leaflet-powered draggable center pin picker with three switchable map layers:
  - **Street View**: Standard OpenStreetMap cartography.
  - **Satellite View**: High-resolution ESRI World Imagery.
  - **Terrain View**: OpenTopoMap elevation topography.
- One-tap *"Use Current Location"* querying the browser Geolocation API.

### 2. Multi-Tier Geocoding Fallback Engine
1. **Primary**: ArcGIS World Geocode API (fast, keyless, browser CORS supported).
2. **Secondary Fallback**: BigDataCloud Client Reverse Geocoding API.
3. **Tertiary Fallback**: OpenStreetMap Nominatim.

### 3. 0ms Offline Jabalpur Landmark Dataset
Built-in fuzzy matching covering major Jabalpur localities for zero-latency address suggestions:
- *Napier Town, Civil Lines, Wright Town, Vijay Nagar, Madan Mahal, Gorakhpur, Sadar Bazar, Russell Chowk, Golbazar, Garha, Tilhari, Bilhari, Dhanvantri Nagar, Ranjhi, Adhartal, Gwarighat, and Bhedaghat.*

---

## 7. Admin Management Suite

The administrative portal (`/admin`) is protected by Supabase authentication and client-side session guards.

### 1. Security & Brute-Force Protection (`/admin/login`)
- Email and password verification through Supabase Auth.
- Brute-force lockout mechanism: Locks the login form for 60 seconds after 5 consecutive failed attempts, storing state in `sessionStorage`.

### 2. Operational Dashboard (`/admin`)
- Metric cards showing active products, total categories, live banners, and today's unique visitors.
- Quick link to the complete analytics report and recent activity summary.

### 3. Order Management (`/admin/orders`)
- Real-time orders table displaying Order ID, customer contact, delivery address, order type, and amount.
- Lifecycle status transitions: `pending` → `processing` → `shipped` → `delivered` → `cancelled`.
- Modal view showing itemized line items, unit sizes, and GPS map pin links.
- 1-tap WhatsApp chat button to message the customer directly with pre-filled status notifications.
- 1-tap Excel export (`exportOrdersToExcel`) downloading all orders and line items.

### 4. Product Catalog & Variant Manager (`/admin/products`)
- Full CRUD operations: create, edit, archive, and delete products across all 21 departments.
- Multi-variant configuration: assign pack sizes (e.g. 500g, 1kg) with individual prices, MRPs, and stock quantities per product.
- Filter by department, search by product name or SKU, and toggle `is_available` or `is_featured` flags.
- Image uploads: direct drag-and-drop file upload to Supabase Storage bucket `store-media`.
- 1-tap Excel catalog export (`exportProductsToExcel`).

### 5. In-Browser Excel Batch Catalog Importer (`ExcelImportWidget`)
- In-browser client-side `.xlsx` spreadsheet parser powered by SheetJS (XLSX).
- Automated column header detection (SKU, Name, Category, Price, MRP, Pack Size).
- Smart category classification rules matching item keywords against existing store categories.
- Pre-import validation screen displaying row errors, missing fields, and duplicates before committing writes to Supabase.

### 6. Category Management (`/admin/categories`)
- Add new categories, update descriptions, and upload thumbnail images across all 21 departments and promotional offer tabs.
- Re-order display sequence numbers and toggle visibility.

### 7. Banner & Promotion Manager (`/admin/banners`)
- Create and schedule homepage carousel slides with custom headline text, banner images, and target links.
- Re-order slides and toggle active states.
- Default Logo Banner manager: customize the permanent fallback brand banner with instant preview.

### 8. Analytics & Traffic Suite (`/admin/analytics`) — PRD 4.2 #33 Compliant
- **Website Traffic & Activity Metrics**:
  - Live total page views with today's real-time count.
  - Daily unique visitors count with 7-day bar chart visualization.
  - Per-route page impressions breakdown (Storefront Home, Catalog, Quick Order, Cart, Checkout, About).
  - Visitor device distribution (Mobile phones vs Desktop laptops vs Tablets).
- **Order Counts & Status Distribution**:
  - Orders categorized by lifecycle status: `pending`, `processing`, `shipped`, `delivered`, and `cancelled`.
  - Channel distribution: Standard Cart checkout orders vs Quick Order list submissions.
- **Strict PRD #33 Scope Adherence**: Explicitly excludes revenue totals, rupee calculations, or commercial sums.

### 9. Store Settings & Disaster Recovery (`/admin/settings`)
- Configure flat delivery fee (₹) and free delivery qualifying order threshold.
- Modify delivery policy terms and store operating hours.
- **1-Click Disaster Recovery JSON Snapshot**: Generates an offline JSON snapshot of all store database tables for full backup.

---

## 8. Database Schema & Cloud Storage

### Relational PostgreSQL Schema

```sql
-- Categories table
categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  thumbnail_url text,
  display_order int default 0,
  is_visible boolean default true,
  is_offer_category boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Products table
products (
  id uuid primary key default gen_random_uuid(),
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
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Product variants table
product_variants (
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
  title text not null,
  text text,
  image_url text not null,
  link_url text,
  is_active boolean default true,
  display_order int default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
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
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Order line items table
order_items (
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
  rules_text text,
  flat_fee numeric default 30,
  free_delivery_threshold numeric default 499,
  is_active boolean default true,
  updated_at timestamp with time zone default now()
);

-- Key-value store configuration table
store_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text not null,
  updated_at timestamp with time zone default now()
);
```

### Storage Bucket: `store-media`
All binary files are hosted under the public `store-media` Supabase Storage bucket:
- `banners/`: Homepage promotional graphics and brand logos.
- `categories/`: Category thumbnail images.
- `products/`: Product packaging photos.
- `store/`: Store visual walkthrough photos and video files.

---

## 9. Design System, Theme Engine & PWA

### 1. Theme Engine & Anti-FOUT Architecture
- Fully supports **Light Mode**, **Dark Mode**, and **System Preference**.
- The `index.html` file includes an inline script executing before the first paint to prevent theme flashing (Flash of Unstyled Theme - FOUT):
```js
var saved = localStorage.getItem('sdm-theme');
var isDark = saved === 'dark' || (saved !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
```

### 2. Design Tokens (`src/styles/tokens.css`)
- **Brand Colors**:
  - Primary Supermarket Green: `#1E8E3E` (Dark Mode: `#81C995`)
  - Accent / Secondary Yellow: `#F9AB00` (Dark Mode: `#FDD663`)
  - Status Colors: `#BA1A1A` (Error), `#137333` (Success)
- **Surfaces & Elevation**:
  - Light Surface: `#FFFFFF` / `#F8F9FA`
  - Dark Surface: `#121212` / `#1E1E1E`
  - Material 3 drop shadows from elevation 1 to elevation 5.

### 3. Progressive Web App (PWA)
- Offline-ready with Workbox service worker caching assets and API requests.
- Installable Web Manifest with custom supermarket icons and standalone display mode.

---

## 10. Local Development & Configuration

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Setup Steps
1. **Clone the repository:**
   ```bash
   git clone https://github.com/amit-saidarshan/SaiDarshanMart.git
   cd SDMWEB
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Provide your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://otyojqnnwbrteknyqcpi.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

---

## 11. Production Build & CI/CD Pipeline

### Production Build
Execute the build pipeline to compile TypeScript and bundle assets:
```bash
npm run build
```
This runs:
1. `tsc -b`: Type-checks all modules in strict mode with zero permitted errors.
2. `vite build`: Bundles assets, optimizes tree-shaking, splits vendor chunks, and generates the PWA service worker.

### Production Output (`dist/`)
- `dist/index.html`: Optimized HTML entry point.
- `dist/assets/vendor-react-*.js`: React, React-DOM, and React Router runtime chunk.
- `dist/assets/vendor-supabase-*.js`: Supabase client chunk.
- `dist/assets/vendor-leaflet-*.js`: Leaflet map engine chunk (lazy-loaded).
- `dist/assets/vendor-xlsx-*.js`: Spreadsheet engine chunk (lazy-loaded for admin).
- `dist/sw.js`: PWA service worker for offline caching.

### Automated CI/CD Workflow (`.github/workflows/ci.yml`)
- Triggers on every push and pull request to `main` and `master`.
- Executes dependency installation (`npm ci`), strict type verification (`tsc -b`), production bundling (`npm run build`), and automated Playwright headless responsive smoke tests.

---

## 12. Lead Architect & Primary Contributor

<div align="center">
  <a href="https://github.com/4nur4gmishr4">
    <img src="https://github.com/4nur4gmishr4.png" width="110px" style="border-radius: 50%; box-shadow: 0 6px 18px rgba(0,0,0,0.2);" alt="4nur4gmishr4" />
    <br />
    <br />
    <b>@4nur4gmishr4</b>
  </a>
  <p><b>Lead Architect, Full-Stack Engineer & Core Maintainer</b></p>
  <p>
    Spearheaded the complete end-to-end architecture, responsive web storefront, interactive admin suite, database schemas, PWA implementation, offline transaction vault, dynamic UPI integration, and automated catalog purification engine for Sai Darshan Mart.
  </p>
  <p>
    <a href="https://github.com/4nur4gmishr4">
      <img src="https://img.shields.io/badge/GitHub-Profile-black?style=flat-square&logo=github" alt="GitHub Profile" />
    </a>
    &nbsp;
    <a href="https://github.com/4nur4gmishr4?tab=repositories">
      <img src="https://img.shields.io/badge/Repositories-View%20Projects-1E8E3E?style=flat-square&logo=github" alt="Repositories" />
    </a>
  </p>
</div>
