export interface DeliverySettings {
  id: string;
  rules_text: string;
  flat_fee: number;
  free_delivery_threshold?: number;
  is_active: boolean;
  updated_at?: string;
}
