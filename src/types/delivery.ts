export interface DeliverySettings {
  id: string;
  rules_text: string;
  flat_fee: number;
  free_delivery_threshold?: number;
  is_active: boolean;
  updated_at?: string;
}

export type DeliverySettingsUpdate = Pick<DeliverySettings, 'rules_text' | 'flat_fee' | 'is_active'>;

export interface StoreSettings {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

/** Well-known store setting keys */
export type StoreSettingKey =
  | 'store_name'
  | 'store_phone'
  | 'store_whatsapp'
  | 'store_address'
  | 'store_hours'
  | 'store_map_embed'
  | 'store_tagline';
