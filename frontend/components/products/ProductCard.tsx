'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import type { Product } from '@/types';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

function ImageGallery({ images = [], alt = "" }: { images: string[], alt?: string }) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-9xl">👗</div>;
  }

  return (
    <div>
      <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
        <img
          src={images[index]}
          alt={alt}
          className="w-full h-full object-cover rounded-lg cursor-pointer"
          onClick={() => setLightboxOpen(true)}
          loading="lazy"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <button key={src} onClick={() => setIndex(i)} className={`w-16 h-20 rounded-md overflow-hidden border ${i === index ? 'border-indigo-600' : 'border-transparent'}`}>
              <img src={src} alt={`${alt} thumbnail ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Simple Lightbox */}
      {lightboxOpen && (
        <div onClick={() => setLightboxOpen(false)} className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <img src={images[index]} alt={alt} className="max-h-full max-w-full rounded" />
        </div>
      )}
    </div>
  );
}
export default function ProductCard({ product }: ProductCardProps) {


  return (
    <Link href={`/products/${product._id}`}>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
        <div className="aspect-square bg-gray-200 flex items-center justify-center">
          {product.images?.[0] ? (
            // <img
            //   src={product.images[0]}
            //   alt={product.name}
            //   className="w-full h-full object-cover"
            // />
            <ImageGallery images={product.images} alt={product.name} />
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