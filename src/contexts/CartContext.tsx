import { createContext, useContext, useReducer, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import type { CartItem } from '../types/order';
import { useSnackbar } from './SnackbarContext';
import { haptics } from '../lib/haptics';

/* --------------------------------------------------------
   Cart State
   -------------------------------------------------------- */

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { product_id: string; item_key?: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { product_id: string; quantity: number; item_key?: string } }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; payload: CartItem[] };

const CART_STORAGE_KEY = 'sdsm_cart';

export function getCartItemKey(item: { product_id: string; variant_id?: string | null; unit_size?: string }): string {
  return `${item.product_id}_${item.variant_id || item.unit_size || 'default'}`;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const targetKey = getCartItemKey(action.payload);
      const existing = state.items.find(i => getCartItemKey(i) === targetKey);
      if (existing) {
        return {
          items: state.items.map(i =>
            getCartItemKey(i) === targetKey
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, action.payload] };
    }
    case 'REMOVE_ITEM':
      return {
        items: state.items.filter(i => {
          if (action.payload.item_key) {
            return getCartItemKey(i) !== action.payload.item_key;
          }
          return i.product_id !== action.payload.product_id;
        }),
      };
    case 'UPDATE_QUANTITY':
      if (action.payload.quantity <= 0) {
        return {
          items: state.items.filter(i => {
            if (action.payload.item_key) {
              return getCartItemKey(i) !== action.payload.item_key;
            }
            return i.product_id !== action.payload.product_id;
          }),
        };
      }
      return {
        items: state.items.map(i => {
          const isMatch = action.payload.item_key
            ? getCartItemKey(i) === action.payload.item_key
            : i.product_id === action.payload.product_id;
          return isMatch ? { ...i, quantity: action.payload.quantity } : i;
        }),
      };
    case 'CLEAR':
      return { items: [] };
    case 'LOAD':
      return { items: action.payload };
    default:
      return state;
  }
}

/* --------------------------------------------------------
   Context
   -------------------------------------------------------- */

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  originalTotal: number;
  savings: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, itemKey?: string) => void;
  updateQuantity: (productId: string, quantity: number, itemKey?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function getInitialCart(): CartState {
  try {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(CART_STORAGE_KEY) : null;
    if (stored) {
      const parsed = JSON.parse(stored) as CartItem[];
      if (Array.isArray(parsed)) {
        // Sanitize and validate items from storage to prevent poisoned cart injection
        const sanitized: CartItem[] = parsed
          .filter(item => (
            item &&
            typeof item.product_id === 'string' &&
            item.product_id.trim().length > 0 &&
            typeof item.product_name === 'string' &&
            typeof item.product_price === 'number' &&
            Number.isFinite(item.product_price) &&
            item.product_price >= 0 &&
            typeof item.quantity === 'number' &&
            Number.isFinite(item.quantity) &&
            item.quantity > 0
          ))
          .map(item => ({
            ...item,
            quantity: Math.max(1, Math.min(999, Math.floor(item.quantity))),
            product_price: Math.max(0, Number(item.product_price.toFixed(2))),
            original_price: (item.original_price != null && Number.isFinite(item.original_price))
              ? Math.max(item.product_price, Number(item.original_price.toFixed(2)))
              : item.product_price,
          }));
        return { items: sanitized };
      }
    }
  } catch {
    // Corrupted storage — start fresh
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }
  return { items: [] };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, getInitialCart);
  const { showSnackbar } = useSnackbar();

  // Persist cart to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // Storage full or unavailable — fail silently
    }
  }, [state.items]);

  const itemCount = useMemo(
    () => state.items.reduce((sum, item) => sum + item.quantity, 0),
    [state.items]
  );

  // Google Chrome App Icon Badging API
  useEffect(() => {
    try {
      if (typeof navigator !== 'undefined') {
        if ('setAppBadge' in navigator && itemCount > 0) {
          (navigator as any).setAppBadge(itemCount).catch(() => {});
        } else if ('clearAppBadge' in navigator && itemCount === 0) {
          (navigator as any).clearAppBadge().catch(() => {});
        }
      }
    } catch {
      // Ignore unsupported platforms
    }
  }, [itemCount]);

  const subtotal = useMemo(
    () => state.items.reduce((sum, item) => {
      const price = Number.isFinite(item.product_price) ? Math.max(0, item.product_price) : 0;
      const qty = Number.isFinite(item.quantity) ? Math.max(1, Math.min(999, Math.floor(item.quantity))) : 1;
      return sum + (price * qty);
    }, 0),
    [state.items]
  );

  const originalTotal = useMemo(
    () => state.items.reduce((sum, item) => {
      const orig = (item.original_price && Number.isFinite(item.original_price) && item.original_price > item.product_price)
        ? item.original_price
        : item.product_price;
      const price = Number.isFinite(orig) ? Math.max(0, orig) : 0;
      const qty = Number.isFinite(item.quantity) ? Math.max(1, Math.min(999, Math.floor(item.quantity))) : 1;
      return sum + (price * qty);
    }, 0),
    [state.items]
  );

  const savings = useMemo(
    () => Math.max(0, originalTotal - subtotal),
    [originalTotal, subtotal]
  );

  const addItem = useCallback((item: CartItem) => {
    if (!item || !item.product_id || typeof item.product_price !== 'number' || item.product_price < 0) {
      return;
    }
    const cleanItem: CartItem = {
      ...item,
      quantity: Math.max(1, Math.min(999, Math.floor(item.quantity || 1))),
      product_price: Math.max(0, Number(item.product_price.toFixed(2))),
      original_price: (item.original_price != null && Number.isFinite(item.original_price) && item.original_price > item.product_price)
        ? Number(item.original_price.toFixed(2))
        : item.product_price,
    };
    haptics.tap();
    dispatch({ type: 'ADD_ITEM', payload: cleanItem });
    const variantSuffix = cleanItem.unit_size ? ` (${cleanItem.unit_size})` : '';
    showSnackbar(`Added ${cleanItem.product_name}${variantSuffix} to cart`);
  }, [showSnackbar]);

  const removeItem = useCallback((productId: string, itemKey?: string) => {
    haptics.selection();
    dispatch({ type: 'REMOVE_ITEM', payload: { product_id: productId, item_key: itemKey } });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, itemKey?: string) => {
    haptics.selection();
    const cleanQty = Number.isFinite(quantity) ? Math.max(0, Math.min(999, Math.floor(quantity))) : 0;
    dispatch({ type: 'UPDATE_QUANTITY', payload: { product_id: productId, quantity: cleanQty, item_key: itemKey } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const value: CartContextValue = useMemo(() => ({
    items: state.items,
    itemCount,
    subtotal,
    originalTotal,
    savings,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  }), [state.items, itemCount, subtotal, originalTotal, savings, addItem, removeItem, updateQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
