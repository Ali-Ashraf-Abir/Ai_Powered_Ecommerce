'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package } from 'lucide-react';
import { api } from '@/lib/api';

import type { Order, Product } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">
          Please login to view orders
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

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">Loading orders...</div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
        <p className="text-gray-600 mb-6">Your orders will appear here</p>
        <button
          onClick={() => router.push('/products')}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order._id} order={order} />
        ))}
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: Order;
}

function OrderCard({ order }: OrderCardProps) {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Order Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-sm text-gray-600">
            Order #{order._id.slice(-8)}
          </div>
          <div className="text-sm text-gray-600">
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
            order.status
          )}`}
        >
          {order.status}
        </span>
      </div>

      {/* Order Items */}
      <div className="space-y-2 mb-4">
        {order.items.map((item, idx) => {
          const product = (item.productSnapshot || item.productId) as Product;
          return (
            <div
              key={idx}
              className="flex justify-between items-center text-sm py-2 border-b last:border-b-0"
            >
              <div className="flex-1">
                <div className="font-medium">{product?.name || 'Product'}</div>
                <div className="text-gray-600">
                  Quantity: {item.quantity}
                  {item.selectedSize && ` | Size: ${item.selectedSize}`}
                  {item.selectedColor && ` | Color: ${item.selectedColor}`}
                </div>
              </div>
              <div className="font-medium">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Total */}
      <div className="border-t pt-4 flex justify-between items-center">
        <span className="font-semibold">Total:</span>
        <span className="text-xl font-bold text-indigo-600">
          ${order.totalAmount.toFixed(2)}
        </span>
      </div>

      {/* Shipping Address */}
      {order.shippingAddress && (
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-gray-600">Shipping to:</div>
          <div className="text-sm">
            {order.shippingAddress.street}, {order.shippingAddress.city},{' '}
            {order.shippingAddress.state} {order.shippingAddress.zip}
          </div>
        </div>
      )}
    </div>
  );
}