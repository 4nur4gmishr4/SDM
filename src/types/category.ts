export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  thumbnail_url: string | null;
  is_visible: boolean;
  is_offer_category: boolean;
  created_at: string;
  updated_at: string;
}

export type CategoryInsert = Omit<Category, 'id' | 'created_at' | 'updated_at'>;
export type CategoryUpdate = Partial<CategoryInsert>;
