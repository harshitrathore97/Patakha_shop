import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; product: Product }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'CLEAR_CART' };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.product._id === action.product._id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product._id === action.product._id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { product: action.product, quantity: 1 }] };
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter((i) => i.product._id !== action.productId) };
    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        return { items: state.items.filter((i) => i.product._id !== action.productId) };
      }
      return {
        items: state.items.map((i) =>
          i.product._id === action.productId ? { ...i, quantity: action.quantity } : i
        ),
      };
    }
    case 'CLEAR_CART':
      return { items: [] };
    default:
      return state;
  }
};

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const addItem = useCallback((product: Product) => dispatch({ type: 'ADD_ITEM', product }), []);
  const removeItem = useCallback((productId: string) => dispatch({ type: 'REMOVE_ITEM', productId }), []);
  const updateQuantity = useCallback(
    (productId: string, quantity: number) => dispatch({ type: 'UPDATE_QUANTITY', productId, quantity }),
    []
  );
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items: state.items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
