import type { CartItem } from '../types/order';

export const STORE_NAME = (import.meta.env.VITE_STORE_NAME as string) || 'Sai Darshan Shopping Mart';
export const STORE_WHATSAPP_NUMBER = (import.meta.env.VITE_STORE_WHATSAPP_NUMBER as string) || '+91 73541 55669';
export const STORE_WHATSAPP_CLEAN = STORE_WHATSAPP_NUMBER.replace(/\D/g, '') || '917354155669';
export const STORE_PHONE_NUMBER = (import.meta.env.VITE_STORE_PHONE as string) || STORE_WHATSAPP_CLEAN.slice(-10);
export const STORE_EMAIL = (import.meta.env.VITE_STORE_EMAIL as string) || 'saidarshanmart@gmail.com';
export const STORE_UPI_ID = (import.meta.env.VITE_STORE_UPI_ID as string) || `${STORE_PHONE_NUMBER}@upi`;
export const STORE_ADDRESS = (import.meta.env.VITE_STORE_ADDRESS as string) || '1117 Sanjeevni Nagar Main Road, Jabalpur, Madhya Pradesh, Pin: 482003';
export const STORE_DELIVERY_RADIUS = (import.meta.env.VITE_STORE_DELIVERY_RADIUS as string) || '5–10 km across Jabalpur';
export const STORE_TIMINGS = (import.meta.env.VITE_STORE_TIMINGS as string) || '8:00 AM to 10:30 PM';
export const STORE_DAYS = (import.meta.env.VITE_STORE_DAYS as string) || 'Open All Days of the week (Saaton Din Khula)';

/**
 * Generate standard UPI deep link for 1-tap payment in Google Pay / PhonePe / Paytm / BHIM.
 */
export function getUpiPaymentUrl(params?: { amount?: number; orderId?: string; note?: string }): string {
  const upiId = STORE_UPI_ID;
  const payeeName = STORE_NAME;
  let url = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&cu=INR`;
  if (params?.amount && params.amount > 0) {
    url += `&am=${params.amount.toFixed(2)}`;
  }
  if (params?.orderId) {
    url += `&tr=${encodeURIComponent(params.orderId)}&tn=${encodeURIComponent(`Order ${params.orderId}`)}`;
  } else if (params?.note) {
    url += `&tn=${encodeURIComponent(params.note)}`;
  }
  return url;
}

/**
 * Generate a unique order ID in format: SDM-YYMMDD-XXXX
 * XXXX is a random 4-digit alphanumeric string for uniqueness.
 */
export function generateOrderId(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous: I, O, 0, 1
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SDM-${yy}${mm}${dd}-${suffix}`;
}

/**
 * Build the WhatsApp pre-filled order message for a cart order.
 */
export function buildCartWhatsAppMessage(params: {
  orderId?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  mapLink: string | null;
}): string {
  const { orderId, items, subtotal, deliveryFee, total, customerName, customerPhone, deliveryAddress, mapLink } = params;

  let msg = `${STORE_NAME} - Order Details\n`;
  if (orderId) {
    msg += `Order ID: ${orderId}\n`;
  }
  msg += `\n`;

  msg += `Items:\n`;
  items.forEach((item, index) => {
    const itemTotal = (item.quantity * item.product_price).toFixed(2);
    const unitText = item.unit_size ? ` (${item.unit_size})` : '';
    msg += `${index + 1}. ${item.product_name}${unitText}\n`;
    msg += `   Qty: ${item.quantity} x Rs. ${item.product_price.toFixed(2)} = Rs. ${itemTotal}\n\n`;
  });

  msg += `--------------------------------\n`;
  msg += `Items Subtotal: Rs. ${subtotal.toFixed(2)}\n`;
  if (deliveryFee > 0) {
    msg += `Delivery Fee: Rs. ${deliveryFee.toFixed(2)}\n`;
  } else {
    msg += `Delivery Fee: Free (Rs. 0)\n`;
  }
  msg += `Total Amount: Rs. ${total.toFixed(2)}\n`;
  msg += `--------------------------------\n\n`;

  msg += `Customer Details:\n`;
  msg += `Name: ${customerName}\n`;
  msg += `Phone: ${customerPhone}\n\n`;

  msg += `Delivery Address:\n`;
  msg += `${deliveryAddress}\n\n`;

  if (mapLink) {
    msg += `Delivery Location Map:\n`;
    msg += `${mapLink}\n`;
  }

  return msg;
}

/**
 * Build the WhatsApp pre-filled message for a Quick Order.
 */
export function buildQuickOrderWhatsAppMessage(params: {
  orderId?: string;
  shoppingList?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  mapLink: string | null;
  hasAttachedImage?: boolean;
  isPhotoOrder?: boolean;
}): string {
  const { orderId, shoppingList, customerName, customerPhone, deliveryAddress, mapLink, hasAttachedImage, isPhotoOrder } = params;

  let msg = `${STORE_NAME} - Quick Order\n`;
  if (orderId) {
    msg += `Order ID: ${orderId}\n`;
  }
  msg += `\n`;

  if (isPhotoOrder || hasAttachedImage) {
    msg += `Order Type: Handwritten List Photo\n`;
    msg += `Note: I am sending the photo of my grocery shopping list in this chat. Please check the items, pack them, and confirm the order.\n\n`;
  }

  const cleanedText = shoppingList
    ? shoppingList.replace('(Handwritten grocery list photo attached)', '').trim()
    : '';

  if (cleanedText) {
    msg += `Shopping List:\n`;
    msg += `${cleanedText}\n\n`;
  }

  msg += `--------------------------------\n`;
  msg += `Customer Details:\n`;
  msg += `Name: ${customerName}\n`;
  msg += `Phone: ${customerPhone}\n\n`;

  msg += `Delivery Address:\n`;
  msg += `${deliveryAddress}\n\n`;

  if (mapLink) {
    msg += `Delivery Location Map:\n`;
    msg += `${mapLink}\n`;
  }

  return msg;
}

/**
 * Open WhatsApp with a pre-filled message.
 * Uses the wa.me URL scheme which works on both mobile and desktop.
 */
export function openWhatsApp(phoneNumber: string, message: string): void {
  // Remove any non-digit characters from phone number
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Format price for display in INR.
 */
export function formatPrice(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

/**
 * Format an order ID for display (already human-readable).
 */
export function formatOrderId(orderId: string): string {
  return orderId;
}
