'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2 } from 'lucide-react';

import { api } from '@/lib/api';
import type { CartItem } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, cartTotal, updateQuantity, removeItem } = useCart();
  const [checkingOut, setCheckingOut] = useState<boolean>(false);

  if (!user) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">
          Please login to view cart
        </h2>
        <button
          onClick={() => router.push('/auth')}
          className="text-indigo-600 hover:underline"
        >
          Go to login
        </button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Start shopping to add items</p>
        <button
          onClick={() => router.push('/products')}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
        >
          Browse Products
        </button>
      </div>
    );
  }

  const handleCheckout = async () => {
    try {
      setCheckingOut(true);
      await api.createOrder({
        shippingAddress: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          zip: '12345',
          country: 'Country',
        },
        paymentMethod: 'card',
      });
      alert('Order placed successfully!');
      router.push('/orders');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

      <div className="space-y-4 mb-8">
        {cart.map((item) => (
          <CartItemCard
            key={item._id}
            item={item}
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
          />
        ))}
      </div>

      {/* Cart Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal:</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Shipping:</span>
            <span>Free</span>
          </div>
          <div className="border-t pt-2 flex justify-between items-center">
            <span className="text-xl font-semibold">Total:</span>
            <span className="text-2xl font-bold text-indigo-600">
              ${cartTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={checkingOut}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300"
        >
          {checkingOut ? 'Processing...' : 'Proceed to Checkout'}
        </button>

        <button
          onClick={() => router.push('/products')}
          className="w-full mt-3 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
}

function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const [updating, setUpdating] = useState<boolean>(false);
  const [removing, setRemoving] = useState<boolean>(false);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      setUpdating(true);
      await onUpdateQuantity(item._id, newQuantity);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    try {
      setRemoving(true);
      await onRemove(item._id);
    } catch (error: any) {
      alert(error.message);
      setRemoving(false);
    }
  };

  const product = item.productId;
  if (!product) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex gap-4">
      {/* Product Image */}
      <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="text-gray-400 text-3xl">👕</div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold mb-1 truncate">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2">
          {item.selectedSize && `Size: ${item.selectedSize}`}
          {item.selectedSize && item.selectedColor && ' | '}
          {item.selectedColor && `Color: ${item.selectedColor}`}
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center border rounded-lg">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={updating || item.quantity <= 1}
              className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
            >
              -
            </button>
            <span className="px-4 py-1 border-x">{item.quantity}</span>
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={updating || item.quantity >= product.stockQuantity}
              className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
            >
              +
            </button>
          </div>
          <span className="font-semibold text-lg">
            ${(product.price * item.quantity).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={handleRemove}
        disabled={removing}
        className="text-red-600 hover:text-red-700 p-2"
        title="Remove from cart"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}