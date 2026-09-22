export interface Product {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  price: number;
  unit_size: string;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  is_archived: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  /** Joined from categories table in queries */
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category'>;
export type ProductUpdate = Partial<ProductInsert>;

/** Product data as it appears in an Excel import row */
export interface ExcelProductRow {
  sku: string;
  name: string;
  category: string;
  price: number;
  unit_size: string;
  image_url: string;
  is_available: boolean;
}

/** Validation result for a single Excel row */
export interface ExcelValidationError {
  row: number;
  field: string;
  message: string;
}

/** Result of an Excel import operation */
export interface ExcelImportResult {
  success_count: number;
  error_count: number;
  errors: ExcelValidationError[];
  skipped_duplicates: number;
}
