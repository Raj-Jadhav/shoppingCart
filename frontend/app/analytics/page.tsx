'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardStats {
  summary: {
    total_orders: number;
    formatted_revenue: string;
    formatted_avg: string;
    period_days: number;
  };
  most_ordered_products: any[];
  least_ordered_products: any[];
  never_ordered_products: any[];
  order_frequency: any[];
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const router = useRouter();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/analytics/dashboard/?days=${period}`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <div className="flex items-center gap-4">
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                ← Back to Shop
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-blue-600">
              {stats.summary.total_orders}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600">
              {stats.summary.formatted_revenue}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm mb-1">Avg Order Value</p>
            <p className="text-3xl font-bold text-purple-600">
              {stats.summary.formatted_avg}
            </p>
          </div>
        </div>

        {/* Order Frequency Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Frequency</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.order_frequency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#8884d8"
                strokeWidth={2}
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Most Ordered Products */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Most Ordered Products
          </h2>
          {stats.most_ordered_products.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.most_ordered_products.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product__name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_quantity" fill="#82ca9d" name="Quantity Sold" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>

        {/* Product Performance Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Least Ordered */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Products Needing Promotion
            </h2>
            {stats.least_ordered_products.length > 0 ? (
              <div className="space-y-2">
                {stats.least_ordered_products.slice(0, 5).map((product: any) => (
                  <div
                    key={product.product__id}
                    className="flex justify-between items-center p-3 bg-yellow-50 rounded"
                  >
                    <span className="font-medium">{product.product__name}</span>
                    <span className="text-sm text-gray-600">
                      {product.total_quantity} sold
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">All products selling well!</p>
            )}
          </div>

          {/* Never Ordered */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Products Never Ordered
            </h2>
            {stats.never_ordered_products.length > 0 ? (
              <div className="space-y-2">
                {stats.never_ordered_products.slice(0, 5).map((product: any) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center p-3 bg-red-50 rounded"
                  >
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm text-red-600">Consider discount</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                All products have been ordered!
              </p>
            )}
          </div>
        </div>

        {/* Insights Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">💡 Business Insights</h2>
          <ul className="space-y-2 text-blue-800">
            <li>
              • {stats.summary.total_orders} orders placed in the last {period} days
            </li>
            <li>
              • {stats.most_ordered_products.length} products have been ordered
            </li>
            {stats.never_ordered_products.length > 0 && (
              <li>
                • Consider offering discounts on {stats.never_ordered_products.length}{' '}
                products that haven't been ordered
              </li>
            )}
            {stats.least_ordered_products.length > 0 && (
              <li>
                • {stats.least_ordered_products.length} products need promotional campaigns
              </li>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}