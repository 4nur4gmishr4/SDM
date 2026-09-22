export type OfferType = 'daily' | 'mid_month' | 'b1g1' | 'buy_more' | 'general';

export interface Offer {
  id: string;
  offer_type: OfferType;
  title: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OfferInsert = Omit<Offer, 'id' | 'created_at' | 'updated_at'>;
export type OfferUpdate = Partial<OfferInsert>;
