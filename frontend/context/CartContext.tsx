'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';
import type { CartItem, AddToCartData } from '@/types';

interface CartContextType {
  cart: CartItem[];
  loading: boolean;
  cartTotal: number;
  cartCount: number;
  addToCart: (productId: string, options?: Omit<AddToCartData, 'productId'>) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      setCart([]);
    }
  }, [user]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const data = await api.getCart();
      setCart(data.cartItems || []);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, options: Omit<AddToCartData, 'productId'> = {}) => {
    try {
      await api.addToCart({ productId, ...options });
      await loadCart();
    } catch (error) {
      throw error;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      await api.updateCartItem(itemId, { quantity });
      await loadCart();
    } catch (error) {
      throw error;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await api.removeFromCart(itemId);
      await loadCart();
    } catch (error) {
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await api.clearCart();
      setCart([]);
    } catch (error) {
      throw error;
    }
  };

  const cartTotal = cart.reduce((total, item) => {
    return total + (item.productId?.price || 0) * item.quantity;
  }, 0);

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        cartTotal,
        cartCount,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart: loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}