import type { CartItem } from '../types/order';

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
  orderId: string;
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

  let msg = `🛒 *New Order — Sai Darshan Mart*\n`;
  msg += `Order ID: ${orderId}\n`;
  msg += `──────────────\n\n`;

  msg += `*Items:*\n`;
  for (const item of items) {
    msg += `• ${item.product_name} (${item.unit_size})\n`;
    msg += `  ${item.quantity} × ₹${item.product_price.toFixed(2)} = ₹${(item.quantity * item.product_price).toFixed(2)}\n`;
  }

  msg += `\n──────────────\n`;
  msg += `Subtotal: ₹${subtotal.toFixed(2)}\n`;
  if (deliveryFee > 0) {
    msg += `Delivery Fee: ₹${deliveryFee.toFixed(2)}\n`;
  }
  msg += `*Total: ₹${total.toFixed(2)}*\n`;
  msg += `──────────────\n\n`;

  msg += `*Customer Details:*\n`;
  msg += `Name: ${customerName}\n`;
  msg += `Phone: ${customerPhone}\n`;
  msg += `Address: ${deliveryAddress}\n`;
  if (mapLink) {
    msg += `Location: ${mapLink}\n`;
  }

  return msg;
}

/**
 * Build the WhatsApp pre-filled message for a Quick Order.
 */
export function buildQuickOrderWhatsAppMessage(params: {
  orderId: string;
  shoppingList: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  mapLink: string | null;
}): string {
  const { orderId, shoppingList, customerName, customerPhone, deliveryAddress, mapLink } = params;

  let msg = `📝 *Quick Order — Sai Darshan Mart*\n`;
  msg += `Order ID: ${orderId}\n`;
  msg += `──────────────\n\n`;

  msg += `*Shopping List:*\n`;
  msg += `${shoppingList}\n\n`;

  msg += `──────────────\n`;
  msg += `*Customer Details:*\n`;
  msg += `Name: ${customerName}\n`;
  msg += `Phone: ${customerPhone}\n`;
  msg += `Address: ${deliveryAddress}\n`;
  if (mapLink) {
    msg += `Location: ${mapLink}\n`;
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
