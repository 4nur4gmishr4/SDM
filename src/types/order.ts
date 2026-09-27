export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  map_link: string | null;
  quick_order_text: string | null;
  is_quick_order?: boolean;
  subtotal_amount: number;
  delivery_fee: number;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  /** Joined order_items for cart orders */
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id?: string | null;
  product_name: string;
  product_sku: string;
  product_price: number;
  unit_size?: string;
  quantity: number;
  line_total: number;
}

/** Cart item stored in client-side cart state */
export interface CartItem {
  product_id: string;
  variant_id?: string | null;
  product_name: string;
  product_sku: string;
  product_price: number;
  product_image_url: string | null;
  unit_size: string;
  quantity: number;
}

/** Checkout form data collected from the customer */
export interface CheckoutFormData {
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  map_link: string | null;
}

/** Quick order form data */
export interface QuickOrderFormData {
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  map_link: string | null;
  shopping_list: string;
}
