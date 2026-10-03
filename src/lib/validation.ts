import { z } from 'zod';

/**
 * Input sanitization and validation utilities for Sai Darshan Shopping Mart
 * Enforces production-grade constraints on customer and order data using Zod.
 */

/**
 * Normalizes an Indian phone number by removing country codes (+91, 91), leading zeroes,
 * spaces, hyphens, and parentheses, returning the 10-digit clean string if possible.
 */
export function cleanIndianPhone(rawPhone: string): string {
  if (!rawPhone) return '';
  let digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

export function sanitizeText(input: string): string {
  if (!input) return '';
  return input.trim().replace(/[<>]/g, '').slice(0, 1000);
}

// ============================================================================
// ZOD SCHEMAS (Professional strict runtime validation)
// ============================================================================

export const CustomerPhoneSchema = z.string()
  .transform(cleanIndianPhone)
  .refine((val) => /^[6-9]\d{9}$/.test(val), {
    message: "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)."
  });

export const CustomerNameSchema = z.string()
  .transform(sanitizeText)
  .refine((val) => val.length >= 2, {
    message: "Please enter your full name (at least 2 characters)."
  });

export const DeliveryAddressSchema = z.string()
  .transform(sanitizeText)
  .refine((val) => val.length >= 5, {
    message: "Please enter a complete delivery address with landmark."
  });

export const CheckoutOrderSchema = z.object({
  customerName: CustomerNameSchema,
  customerPhone: CustomerPhoneSchema,
  deliveryAddress: DeliveryAddressSchema,
});

export const QuickOrderSchema = CheckoutOrderSchema.extend({
  shoppingList: z.string().optional().transform((val) => sanitizeText(val || '')),
  hasImage: z.boolean().optional(),
}).refine((data) => {
  if (!data.hasImage && data.shoppingList.length < 3) {
    return false;
  }
  return true;
}, {
  message: "Please enter your grocery list items or snap/upload a photo of your list.",
  path: ["shoppingList"], // attach error to this field
});

interface OrderValidationResult {
  isValid: boolean;
  error?: string;
  cleanedName?: string;
  cleanedPhone?: string;
  cleanedAddress?: string;
  cleanedList?: string;
}

/**
 * Validates checkout and quick order inputs before dispatching to Supabase or WhatsApp.
 * (Preserved original signature for backwards compatibility with existing components)
 */
export function validateOrderInput(params: {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  shoppingList?: string;
  hasImage?: boolean;
}): OrderValidationResult {
  
  if (params.shoppingList !== undefined || params.hasImage !== undefined) {
    const result = QuickOrderSchema.safeParse(params);
    if (!result.success) {
      return {
        isValid: false,
        error: result.error.issues[0].message
      };
    }
    const data = result.data;
    return {
      isValid: true,
      cleanedName: data.customerName,
      cleanedPhone: data.customerPhone,
      cleanedAddress: data.deliveryAddress,
      cleanedList: data.shoppingList || (data.hasImage ? '(Handwritten grocery list photo attached)' : '')
    };
  }

  const result = CheckoutOrderSchema.safeParse(params);
  if (!result.success) {
    return {
      isValid: false,
      error: result.error.issues[0].message
    };
  }
  
  return {
    isValid: true,
    cleanedName: result.data.customerName,
    cleanedPhone: result.data.customerPhone,
    cleanedAddress: result.data.deliveryAddress
  };
}
