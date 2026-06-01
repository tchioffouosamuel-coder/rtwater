import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { usePOS } from '../../../context/POSContext';
import { useInventory } from '../../../context/InventoryContext';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package,
  Download, Filter, Calendar, Eye, MoreVertical, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();
  const { getTodayTransactions } = usePOS();
  const { items } = useInventory();

  const [selectedDetail, setSelectedDetail] = useState<'none' | 'revenue' | 'products' | 'customers'>('none');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  if (!hasPermission('view_analytics')) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 font-semibold">Accès refusé</p>
        </div>
      </AdminLayout>
    );
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Get today's transactions for demo
  const todayTransactions = getTodayTransactions();

  // Generate mock analytics data based on date range
  const generateChartData = () => {
    const days = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 365;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayNum = date.getDate();
      data.push({
        date: `${dayNum}/${date.getMonth() + 1}`,
        revenue: Math.floor(Math.random() * 5000) + 1000,
        orders: Math.floor(Math.random() * 50) + 10,
        customers: Math.floor(Math.random() * 30) + 5,
      });
    }
    return data;
  };

  const chartData = useMemo(() => generateChartData(), [dateRange]);

  // Top products data
  const topProducts = useMemo(() => {
    return [
      { name: 'Filtre à eau premium', sales: 245, revenue: 4900 },
      { name: 'Système RO complet', sales: 189, revenue: 9450 },
      { name: 'Cartouche remplacement', sales: 456, revenue: 3192 },
      { name: 'Pompe submersible', sales: 123, revenue: 6150 },
      { name: 'Tuyauterie complète', sales: 87, revenue: 2610 },
    ];
  }, []);

  // Payment methods data
  const paymentData = useMemo(() => {
    return [
      { name: 'Carte bancaire', value: 45 },
      { name: 'Espèces', value: 35 },
      { name: 'Virement', value: 15 },
      { name: 'Chèque', value: 5 },
    ];
  }, []);

  // Key metrics
  const metrics = useMemo(() => {
    const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0);
    const avgOrderValue = totalRevenue / totalOrders;
    const lastDayRevenue = chartData[chartData.length - 1]?.revenue || 0;
    const prevDayRevenue = chartData[chartData.length - 2]?.revenue || 0;
    const revenueChange = ((lastDayRevenue - prevDayRevenue) / prevDayRevenue) * 100;

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      revenueChange,
      uniqueCustomers: Math.floor(chartData.reduce((sum, d) => sum + d.customers, 0) * 0.8),
    };
  }, [chartData]);

  const COLORS = ['#2563eb', '#059669', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const handleExport = () => {
    try {
      const csvContent = [
        ['Date', 'Revenu', 'Commandes', 'Clients'],
        ...chartData.map(d => [d.date, d.revenue, d.orders, d.customers]),
      ]
        .map(row => row.join(','))
        .join('\n');

      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
      element.setAttribute('download', `analytics_${new Date().toISOString().split('T')[0]}.csv`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      showToast('Rapport exporté avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de l\'export', 'error');
    }
  };

  return (
    <AdminLayout
      title="Analytiques"
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Analytiques' },
      ]}
    >
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header with Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble de vos performances</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Exporter</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Revenu total</p>
              <p className="text-2xl font-bold text-gray-900">{(metrics.totalRevenue / 1000).toFixed(1)}k XAF</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <DollarSign size={24} className="text-blue-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            <ArrowUpRight size={14} className="text-green-600" />
            <span className="text-green-600">+12.5%</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Commandes</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalOrders}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <ShoppingCart size={24} className="text-green-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            <ArrowUpRight size={14} className="text-green-600" />
            <span className="text-green-600">+8.2%</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Panier moyen</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.avgOrderValue.toFixed(0)} XAF</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <TrendingUp size={24} className="text-orange-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            {metrics.revenueChange >= 0 ? (
              <>
                <ArrowUpRight size={14} className="text-green-600" />
                <span className="text-green-600">+{metrics.revenueChange.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <ArrowDownRight size={14} className="text-red-600" />
                <span className="text-red-600">{metrics.revenueChange.toFixed(1)}%</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Clients uniques</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.uniqueCustomers}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users size={24} className="text-purple-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            <ArrowUpRight size={14} className="text-green-600" />
            <span className="text-green-600">+5.3%</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Produits actifs</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
            <div className="bg-pink-100 p-3 rounded-lg">
              <Package size={24} className="text-pink-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            <ArrowUpRight size={14} className="text-green-600" />
            <span className="text-green-600">+2</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tendance des revenus</h3>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <MoreVertical size={18} className="text-gray-600" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Méthodes de paiement</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders & Customers & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Orders Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Commandes par jour</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="orders" fill="#059669" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customers Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clients par jour</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Line
                type="monotone"
                dataKey="customers"
                stroke="#8b5cf6"
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 produits</h3>
          <div className="space-y-3">
            {topProducts.map((product, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <span className="text-xs font-semibold text-gray-600">{product.sales} ventes</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(product.sales / topProducts[0].sales) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">{product.revenue.toFixed(0)} XAF</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Product */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Ventes par produit</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Produit</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Ventes</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Revenu</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topProducts.map((product, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{product.name}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">{product.sales}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      {product.revenue.toFixed(0)} XAF
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="space-y-6">
          {/* Conversion Rate */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Taux de conversion</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Visites</span>
                  <span className="text-sm font-semibold text-gray-900">1,245</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Panier créé</span>
                  <span className="text-sm font-semibold text-gray-900">567</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Paiements complétés</span>
                  <span className="text-sm font-semibold text-gray-900">423</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '34%' }} />
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">Taux de conversion global: <span className="font-semibold text-gray-900">34%</span></p>
          </div>

          {/* Performance Insights */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights de performance</h3>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-900 font-medium">✓ Meilleure journée</p>
                <p className="text-xs text-green-700 mt-1">Samedi avec 4,850 XAF de revenu</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 font-medium">★ Produit phare</p>
                <p className="text-xs text-blue-700 mt-1">Système RO avec 189 ventes</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-900 font-medium">⚡ Heure de pointe</p>
                <p className="text-xs text-orange-700 mt-1">Entre 14h et 16h (42 commandes)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
