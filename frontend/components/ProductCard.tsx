'use client';

import { Product } from '@/types';
import Image from 'next/image';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: number) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-64 bg-gray-200">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-blue-600">{product.formatted_price}</p>
            <p className="text-sm text-gray-500">
              {product.stock_quantity} in stock
            </p>
          </div>

          <button
            onClick={() => onAddToCart(product.id)}
            disabled={!product.in_stock}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              product.in_stock
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}