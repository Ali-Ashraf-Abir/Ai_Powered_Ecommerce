'use client';

import Link from 'next/link';
import { ShoppingCart, LogOut, Package } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';


export default function Header() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              AI Fashion Store
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/" className="text-gray-700 hover:text-indigo-600">
                Home
              </Link>
              <Link href="/products" className="text-gray-700 hover:text-indigo-600">
                Products
              </Link>
            </nav>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/cart"
                  className="relative p-2 text-gray-700 hover:text-indigo-600"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/orders"
                  className="p-2 text-gray-700 hover:text-indigo-600"
                >
                  <Package className="w-6 h-6" />
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-gray-700 hover:text-indigo-600"
                  title="Logout"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}