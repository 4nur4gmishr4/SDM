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

export interface DefaultLogoBannerConfig {
  image_url: string;
  local_url?: string;
  title: string;
  subtitle: string;
  link_url: string;
  is_enabled: boolean;
  updated_at?: string;
}
