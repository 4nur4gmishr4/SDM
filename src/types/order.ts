/** Cart item stored in client-side cart state */
export interface CartItem {
  product_id: string;
  variant_id?: string | null;
  product_name: string;
  product_sku: string;
  product_price: number;
  original_price?: number | null;
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
