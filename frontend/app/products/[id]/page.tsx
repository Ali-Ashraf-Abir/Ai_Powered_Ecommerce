"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Star, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

import type { Product } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import AIChat from "@/components/chats/AiChat";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage(props: ProductDetailPageProps) {
  const { id } = use(props.params); // ← FIX applied here

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [adding, setAdding] = useState<boolean>(false);

  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const data = await api.getProductById(id);
      setProduct(data.product);
      setSelectedSize(data.product.sizes?.[0] || "");
      setSelectedColor(data.product.colors?.[0] || "");
    } catch (error) {
      console.error("Failed to load product:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleAddToCart = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    if (!product) return;

    try {
      setAdding(true);
      await addToCart(product._id, {
        quantity,
        selectedSize,
        selectedColor,
      });
      alert('Added to cart!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">Loading product...</div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <button
          onClick={() => router.push('/products')}
          className="text-indigo-600 hover:underline"
        >
          Back to products
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-indigo-600 hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-sm p-8 grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-gray-400 text-9xl">👕</div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-gray-600 mb-4">{product.description}</p>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl font-bold text-indigo-600">
                  ${product.price}
                </div>
                {product.analytics?.averageRating && product.analytics.averageRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">
                      {product.analytics.averageRating.toFixed(1)}
                    </span>
                    <span className="text-gray-600 text-sm">
                      ({product.analytics.reviewCount} reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Size</label>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border rounded-lg ${
                        selectedSize === size
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'hover:border-indigo-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 border rounded-lg capitalize ${
                        selectedColor === color
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'hover:border-indigo-600'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <input
                type="number"
                min="1"
                max={product.stockQuantity}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-24 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <span className="ml-3 text-sm text-gray-600">
                {product.stockQuantity} in stock
              </span>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={adding || product.stockQuantity === 0}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {adding
                ? 'Adding...'
                : product.stockQuantity === 0
                ? 'Out of Stock'
                : 'Add to Cart'}
            </button>

            {!user && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center text-sm">
                Please{' '}
                <button
                  onClick={() => router.push('/auth')}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  login
                </button>{' '}
                to add items to cart
              </div>
            )}

            {/* Product Details */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Product Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Category:</dt>
                  <dd className="font-medium capitalize">{product.category}</dd>
                </div>
                {product.material && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Material:</dt>
                    <dd className="font-medium">{product.material}</dd>
                  </div>
                )}
                {product.brand && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Brand:</dt>
                    <dd className="font-medium">{product.brand}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>

      <AIChat products={[product]} />
    </>
  );
}