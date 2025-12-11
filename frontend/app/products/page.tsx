'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';

import type { Product, ProductFilters } from '@/types';
import AIChat from '@/components/chats/AiChat';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination state
  const [page, setPage] = useState<number>(0); // 0-indexed
  const [pageSize, setPageSize] = useState<number>(12);
  const [total, setTotal] = useState<number>(0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const [filters, setFilters] = useState<ProductFilters>({
    search: searchParams.get('search') || '',
    category: searchParams.get('category')?.trim() || 'all',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt',
    order: 'desc',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  // reload products when filters, page, or pageSize change
  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, pageSize]);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(['all', ...(data.categories || [])]);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);

      // Build params for backend that expects limit & offset
      const params: ProductFilters & { limit?: number; offset?: number } = {
        ...filters,
        // keep 'all' as 'all' if you want backend to treat it specially. 
        // Your backend currently checks for category && category !== 'all'
        category: filters.category === 'all' ? 'all' : filters.category,
        limit: pageSize,
        offset: page * pageSize,
      };

      // api.getProducts should accept these params (converted to query)
      const data = await api.getProducts(params);

      setProducts(data.products || []);
      setTotal(typeof data.total === 'number' ? data.total : 0);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset to first page whenever filters change
  const handleFilterChange = (key: keyof ProductFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= totalPages) return;
    setPage(newPage);
    // Optionally scroll to top of product list:
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(0); // go back to first page when page size changes
  };

  return (
    <>
      <div className="space-y-6 text-black">
        <h1 className="text-3xl font-bold">Products</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid md:grid-cols-4 gap-4">
            <input
              type="text text-black"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />

            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none text-black focus:ring-2 focus:ring-indigo-600"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />

            <input
              type="number"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div className="mt-4 flex gap-4 items-center">
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="createdAt">Date Added</option>
              <option value="price">Price</option>
              <option value="name">Name</option>
            </select>

            <select
              value={filters.order}
              onChange={(e) => handleFilterChange('order', e.target.value)}
              className="px-4 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>

            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm text-gray-600">Per page</label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
                className="px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                {[8, 12, 24, 48].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No products found</div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex items-center justify-center gap-3 text-black">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={loading || page === 0}
                className="px-3 py-1 rounded border disabled:opacity-50 cursor-pointer"
              >
                Prev
              </button>

              {/* show a small window of page numbers */}
              <div className="flex gap-1 items-center ">
                {Array.from({ length: totalPages }).map((_, i) => {
                  // show first, last, around current page
                  const shouldShow =
                    i === 0 ||
                    i === totalPages - 1 ||
                    (i >= page - 2 && i <= page + 2) ||
                    totalPages <= 7;

                  if (!shouldShow) {
                    // show ellipsis when skipping
                    const isEllipsis =
                      i === page - 3 || i === page + 3 || (i === 1 && page > 4) || (i === totalPages - 2 && page < totalPages - 5);
                    return isEllipsis ? (
                      <span key={`ellipsis-${i} `} className="px-2 ">…</span>
                    ) : null;
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      disabled={loading}
                      className={`px-3 py-1 rounded border cursor-pointer text-black ${i === page ? 'bg-indigo-600 text-white cursor-pointer' : ''}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={loading || page >= totalPages - 1}
                className="px-3 py-1  rounded border disabled:opacity-50 cursor-pointer text-black"
              >
                Next
              </button>
            </div>

            <div className="mt-2 text-center  text-sm text-black">
              Showing {(page * pageSize) + 1} - {Math.min((page + 1) * pageSize, total)} of {total} products
            </div>
          </>
        )}
      </div>

      <AIChat products={products} />
    </>
  );
}
