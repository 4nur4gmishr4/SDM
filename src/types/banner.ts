export interface Banner {
  id: string;
  title: string;
  text: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type BannerInsert = Omit<Banner, 'id' | 'created_at' | 'updated_at'>;
export type BannerUpdate = Partial<BannerInsert>;
