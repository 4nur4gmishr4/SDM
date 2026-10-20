/**
 * Google Chrome Micro-Haptics Engine
 * Provides subtle tactile feedback on mobile devices using navigator.vibrate
 * Gracefully degrades to no-op on desktop or unsupported devices.
 */

export const haptics = {
  /** Subtle 10ms tap for primary button clicks & add-to-cart */
  tap: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } catch {
      // Ignore silence
    }
  },

  /** Light 8ms selection tick for quantity adjustments */
  selection: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(8);
      }
    } catch {
      // Ignore silence
    }
  },

  /** Rhythmic success pattern for order placed [35ms vibrate, 50ms pause, 35ms vibrate] */
  success: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([35, 50, 35]);
      }
    } catch {
      // Ignore silence
    }
  },

  /** Error or validation failure vibration */
  warning: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([50, 60, 50]);
      }
    } catch {
      // Ignore silence
    }
  }
};
