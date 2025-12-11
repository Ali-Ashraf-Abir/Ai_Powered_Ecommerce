'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product._id}`}>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
        <div className="aspect-square bg-gray-200 flex items-center justify-center">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400 text-6xl">👕</div>
          )}
        </div>
        <div className="p-4">
          <h4 className="font-semibold mb-1 line-clamp-1">{product.name}</h4>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-indigo-600">
              ${product.price}
            </span>
            {product.analytics?.averageRating && product.analytics.averageRating > 0 && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {product.analytics.averageRating.toFixed(1)}
              </div>
            )}
          </div>
          {product.category && (
            <div className="mt-2">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {product.category}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}