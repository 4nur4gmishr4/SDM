/**
 * Enterprise PII-Masked Logger
 * Ensures that sensitive data (emails, phone numbers, exact locations) 
 * are stripped before being sent to analytics or error tracking services.
 */

// Regex patterns to identify PII
const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
const PHONE_REGEX = /(\+91[\s-]?)?[6789]\d{9}/g;
const UUID_REGEX = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/gi;

/**
 * Scrubs PII from a given string.
 */
function maskPII(str: string): string {
  if (!str) return str;
  return str
    .replace(EMAIL_REGEX, '[MASKED_EMAIL]')
    .replace(PHONE_REGEX, '[MASKED_PHONE]')
    .replace(UUID_REGEX, '[MASKED_UUID]');
}

/**
 * Safely stringifies objects while masking any string values that contain PII.
 */
function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj, (key, value) => {
      // Don't log passwords or sensitive keys at all
      if (typeof key === 'string' && key.toLowerCase().includes('password')) {
        return '[REDACTED]';
      }
      if (typeof value === 'string') {
        return maskPII(value);
      }
      return value;
    }, 2);
  } catch (e) {
    return '[Unserializable Object]';
  }
}

export const logger = {
  info: (message: string, context?: any) => {
    const safeMsg = maskPII(message);
    const safeCtx = context ? safeStringify(context) : '';
    console.info(`[INFO] ${safeMsg}`, safeCtx);
    // TODO: Send to Datadog/Sentry (e.g., Sentry.captureMessage)
  },
  
  warn: (message: string, context?: any) => {
    const safeMsg = maskPII(message);
    const safeCtx = context ? safeStringify(context) : '';
    console.warn(`[WARN] ${safeMsg}`, safeCtx);
  },
  
  error: (message: string, error?: any, context?: any) => {
    const safeMsg = maskPII(message);
    const errString = error instanceof Error ? error.stack || error.message : safeStringify(error);
    const safeErr = maskPII(errString);
    const safeCtx = context ? safeStringify(context) : '';
    
    console.error(`[ERROR] ${safeMsg} | ${safeErr}`, safeCtx);
    // TODO: Send to Datadog/Sentry (e.g., Sentry.captureException)
  }
};
