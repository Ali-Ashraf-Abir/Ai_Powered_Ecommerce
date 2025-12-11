'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';

import type { Product } from '@/types';
import AIChat from '@/components/chats/AiChat';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts({ limit: 6 });
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-12">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-12 text-center">
          <h1 className="text-5xl font-bold mb-4">Your AI Shopping Assistant</h1>
          <p className="text-xl mb-8">
            Let AI guide you to the perfect outfit
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/products"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100"
            >
              Shop Now
            </Link>
            <button className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600">
              Chat with AI
            </button>
          </div>
        </section>

        {/* Features */}
        <section className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon="🤖"
            title="AI Powered"
            description="Get personalized recommendations from our AI assistant"
          />
          <FeatureCard
            icon="🎯"
            title="Smart Search"
            description="Find exactly what you need with natural language"
          />
          <FeatureCard
            icon="💬"
            title="Conversational"
            description="Shop through chat - it's like having a personal stylist"
          />
        </section>

        {/* Featured Products */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <Link
              href="/products"
              className="text-indigo-600 hover:underline font-medium"
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Loading products...
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>

      <AIChat products={products} />
    </>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}