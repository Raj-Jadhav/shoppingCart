'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Cart } from '@/types';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCartUpdate: (count: number) => void;
}

export default function CartSidebar({ isOpen, onClose, onCartUpdate }: CartSidebarProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await api.get('/cart/');
      if (response.data.success) {
        setCart(response.data.data);
        onCartUpdate(response.data.data.item_count);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      const response = await api.put(`/cart/update-item/${itemId}/`, { quantity });
      if (response.data.success) {
        setCart(response.data.data);
        onCartUpdate(response.data.data.item_count);
      }
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Failed to update quantity');
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      const response = await api.delete(`/cart/remove-item/${itemId}/`);
      if (response.data.success) {
        setCart(response.data.data);
        onCartUpdate(response.data.data.item_count);
      }
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Failed to remove item');
    }
  };

  const handleCheckout = async () => {
    if (!amountPaid || parseFloat(amountPaid) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setCheckoutLoading(true);
    try {
      const response = await api.post('/orders/checkout/', {
        amount_paid: amountPaid,
      });

      if (response.data.success) {
        const { payment_details } = response.data.data;
        alert(
          `✅ ${response.data.message}\n\n` +
          `Total: ${payment_details.formatted_total}\n` +
          `Paid: ${payment_details.formatted_paid}\n` +
          `Change: ${payment_details.formatted_change}`
        );
        setAmountPaid('');
        onClose();
        router.push('/');
      }
    } catch (error: any) {
      const errorData = error.response?.data?.error;
      if (errorData?.code === 'insufficient_payment') {
        alert(
          `❌ Insufficient Payment!\n\n` +
          `Required: ${errorData.details.formatted_required}\n` +
          `Provided: ${errorData.details.formatted_provided}\n` +
          `Shortage: ${errorData.details.formatted_shortage}`
        );
      } else {
        alert(errorData?.message || 'Checkout failed');
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Shopping Cart</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : cart && cart.items.length > 0 ? (
            <>
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-semibold">{item.product.name}</h3>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      {item.product.formatted_price} each
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock_quantity}
                          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                      <p className="font-bold text-blue-600">{item.formatted_subtotal}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-xl font-bold mb-4">
                  <span>Total:</span>
                  <span className="text-blue-600">{cart.formatted_total}</span>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Paid (UGX)
                  </label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading || !amountPaid}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  {checkoutLoading ? 'Processing...' : 'Checkout'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}