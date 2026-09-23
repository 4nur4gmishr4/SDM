import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { CartItem } from '../types/order';
import { useSnackbar } from './SnackbarContext';

/* --------------------------------------------------------
   Cart State
   -------------------------------------------------------- */

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { product_id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { product_id: string; quantity: number } }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; payload: CartItem[] };

const CART_STORAGE_KEY = 'sdm_cart';

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.product_id === action.payload.product_id);
      if (existing) {
        return {
          items: state.items.map(i =>
            i.product_id === action.payload.product_id
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, action.payload] };
    }
    case 'REMOVE_ITEM':
      return {
        items: state.items.filter(i => i.product_id !== action.payload.product_id),
      };
    case 'UPDATE_QUANTITY':
      if (action.payload.quantity <= 0) {
        return {
          items: state.items.filter(i => i.product_id !== action.payload.product_id),
        };
      }
      return {
        items: state.items.map(i =>
          i.product_id === action.payload.product_id
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
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
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function getInitialCart(): CartState {
  try {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(CART_STORAGE_KEY) : null;
    if (stored) {
      const parsed = JSON.parse(stored) as CartItem[];
      if (Array.isArray(parsed)) {
        return { items: parsed };
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

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.items.reduce(
    (sum, item) => sum + item.quantity * item.product_price,
    0
  );

  const value: CartContextValue = {
    items: state.items,
    itemCount,
    subtotal,
    addItem: (item) => {
      dispatch({ type: 'ADD_ITEM', payload: item });
      showSnackbar(`Added ${item.product_name} to cart`);
    },
    removeItem: (productId) => dispatch({ type: 'REMOVE_ITEM', payload: { product_id: productId } }),
    updateQuantity: (productId, quantity) =>
      dispatch({ type: 'UPDATE_QUANTITY', payload: { product_id: productId, quantity } }),
    clearCart: () => dispatch({ type: 'CLEAR' }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
