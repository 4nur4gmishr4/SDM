/**
 * Input sanitization and validation utilities for Sai Darshan Shopping Mart
 * Enforces production-grade constraints on customer and order data.
 */

/**
 * Normalizes an Indian phone number by removing country codes (+91, 91), leading zeroes,
 * spaces, hyphens, and parentheses, returning the 10-digit clean string if possible.
 */
function cleanIndianPhone(rawPhone: string): string {
  if (!rawPhone) return '';
  
  // Remove all non-numeric characters
  let digits = rawPhone.replace(/\D/g, '');

  // Handle +91 or 91 prefix for 12 digit inputs
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }

  // Handle 0 prefix for 11 digit inputs
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits;
}

/**
 * Validates whether the given phone number is a valid 10-digit Indian mobile number
 * (starting with 6, 7, 8, or 9).
 */
function isValidIndianPhone(rawPhone: string): boolean {
  const cleaned = cleanIndianPhone(rawPhone);
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Sanitizes plain text input by trimming and removing potential script tags or control characters.
 */
function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // strip literal angle brackets
    .slice(0, 1000); // cap length to prevent payload abuse
}

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
 */
export function validateOrderInput(params: {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  shoppingList?: string;
  hasImage?: boolean;
}): OrderValidationResult {
  const cleanedName = sanitizeText(params.customerName);
  if (!cleanedName || cleanedName.length < 2) {
    return {
      isValid: false,
      error: 'Please enter your full name (at least 2 characters).'
    };
  }

  const cleanedPhone = cleanIndianPhone(params.customerPhone);
  if (!isValidIndianPhone(cleanedPhone)) {
    return {
      isValid: false,
      error: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).'
    };
  }

  const cleanedAddress = sanitizeText(params.deliveryAddress);
  if (!cleanedAddress || cleanedAddress.length < 5) {
    return {
      isValid: false,
      error: 'Please enter a complete delivery address with landmark.'
    };
  }

  if (params.shoppingList !== undefined || params.hasImage !== undefined) {
    const cleanedList = sanitizeText(params.shoppingList || '');
    const hasImage = Boolean(params.hasImage);

    if (!hasImage && (!cleanedList || cleanedList.length < 3)) {
      return {
        isValid: false,
        error: 'Please enter your grocery list items or snap/upload a photo of your list.'
      };
    }

    return {
      isValid: true,
      cleanedName,
      cleanedPhone,
      cleanedAddress,
      cleanedList: cleanedList || (hasImage ? '(Handwritten grocery list photo attached)' : '')
    };
  }

  return {
    isValid: true,
    cleanedName,
    cleanedPhone,
    cleanedAddress
  };
}
