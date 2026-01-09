'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import ProductCard from '@/components/ProductCard';
import CartSidebar from '@/components/CartSidebar';
import { Product } from '@/types';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = Cookies.get('access_token');
      const response = await axios.get('http://localhost:8000/api/products/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: number) => {
    try {
      const token = Cookies.get('access_token');
      const response = await axios.post(
        'http://localhost:8000/api/cart/add-item/',
        {
          product_id: productId,
          quantity: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setCartItemCount(response.data.data.item_count);
        setCartOpen(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to add to cart');
    }
  };

  const handleLogout = () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Shopping Cart System</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/analytics')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Analytics
              </button>
              <button
                onClick={() => router.push('/orders')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                My Orders
              </button>
              <button
                onClick={() => setCartOpen(true)}
                className="relative px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Cart
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Premium Products</h2>
          <p className="mt-2 text-gray-600">
            Browse our exclusive collection of luxury items
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>

        {products.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products available</p>
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCartUpdate={(count) => setCartItemCount(count)}
      />
    </div>
  );
}