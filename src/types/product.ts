export interface ProductVariant {
  id: string;
  unit_size: string; // e.g. "50g", "100g", "250g", "500g", "1kg", "1L"
  price: number; // selling price
  mrp?: number; // original maximum retail price
  stock_quantity?: number; // stock count
  is_available: boolean;
  sku?: string;
  image_url?: string | null;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand?: string;
  category_id: string;
  price: number;
  mrp?: number;
  unit_size: string;
  stock_quantity?: number;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  is_archived: boolean;
  is_featured: boolean;
  variants?: ProductVariant[]; // Multiple content quantity options per item
  created_at: string;
  updated_at: string;
  /** Joined from categories table in queries */
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}
