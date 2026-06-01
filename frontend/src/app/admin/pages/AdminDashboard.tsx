import React, { useState } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { usePOS } from '../../../context/POSContext';
import { useInventory } from '../../../context/InventoryContext';
import { TrendingUp, TrendingDown, PackageOpen, ShoppingCart, Users, DollarSign, ArrowRight, Plus, Package, Warehouse, ReceiptText } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { user } = useAdminAuth();
  const { transactions } = usePOS();
  const { items, getCriticalStockItems } = useInventory();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('week'); // week, month, year

  // Calculate revenue from transactions
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const todayRevenue = transactions
    .filter(t => {
      const txDate = new Date(t.date).toDateString();
      return txDate === new Date().toDateString();
    })
    .reduce((sum, t) => sum + t.total, 0);
  
  const criticalItems = getCriticalStockItems();
  const lowStockCount = items.filter(i => i.quantity < 10 && i.quantity >= 5).length;

  // Revenue trend data
  const revenueTrendData = [
    { day: 'Lun', revenue: 2400, target: 2800 },
    { day: 'Mar', revenue: 1398, target: 2800 },
    { day: 'Mer', revenue: 9800, target: 2800 },
    { day: 'Jeu', revenue: 3908, target: 2800 },
    { day: 'Ven', revenue: 4800, target: 2800 },
    { day: 'Sam', revenue: 3800, target: 2800 },
    { day: 'Dim', revenue: 4300, target: 2800 },
  ];

  // Top products
  const topProductsData = [
    { name: 'Filtre aquatique', sales: 48, revenue: 2400 },
    { name: 'Chlore 1kg', sales: 38, revenue: 2210 },
    { name: 'Pompe à eau', sales: 32, revenue: 2290 },
    { name: 'Test pH', sales: 24, revenue: 2000 },
    { name: 'Brom', sales: 18, revenue: 1800 },
  ];

  // Payment methods
  const paymentData = [
    { name: 'Espèces', value: 45, color: '#0ea5e9' },
    { name: 'Carte', value: 35, color: '#10b981' },
    { name: 'Chèque', value: 12, color: '#f59e0b' },
    { name: 'Virement', value: 8, color: '#8b5cf6' },
  ];

  const stats = [
    {
      label: 'Chiffre d\'affaires',
      value: `${totalRevenue.toFixed(2)} XAF`,
      change: `${todayRevenue.toFixed(2)} XAF aujourd'hui`,
      trend: 'up',
      icon: DollarSign,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Commandes',
      value: transactions.length.toString(),
      change: `${transactions.length} commandées`,
      trend: 'up',
      icon: ShoppingCart,
      color: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Produits',
      value: items.length.toString(),
      change: `${criticalItems.length} critiques, ${lowStockCount} faibles`,
      trend: criticalItems.length > 0 ? 'down' : 'up',
      icon: PackageOpen,
      color: criticalItems.length > 0 ? 'bg-red-50' : 'bg-amber-50',
      iconColor: criticalItems.length > 0 ? 'text-red-600' : 'text-amber-600',
    },
    {
      label: 'Clients actifs',
      value: '1,247',
      change: '+24 ce mois',
      trend: 'up',
      icon: Users,
      color: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
  ];

  const recentActivities = [
    { 
      type: 'order', 
      description: 'Nouvelle commande #' + (transactions.length > 0 ? transactions[transactions.length - 1].id : 'N/A'), 
      timestamp: '5 minutes', 
      icon: ShoppingCart,
      color: 'bg-blue-100 text-blue-600'
    },
    { 
      type: 'product', 
      description: topProductsData[0].name + ' vendu (' + topProductsData[0].sales + ' fois)', 
      timestamp: '18 minutes', 
      icon: Package,
      color: 'bg-purple-100 text-purple-600'
    },
    { 
      type: 'alert', 
      description: criticalItems.length > 0 ? `${criticalItems.length} article(s) en stock critique` : 'Stock optimal', 
      timestamp: 'Maintenant', 
      icon: criticalItems.length > 0 ? TrendingDown : TrendingUp,
      color: criticalItems.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
    },
    { 
      type: 'sale', 
      description: `Vente POS ${todayRevenue.toFixed(2)} XAF aujourd'hui`, 
      timestamp: 'Aujourd\'hui', 
      icon: DollarSign,
      color: 'bg-green-100 text-green-600'
    },
    { 
      type: 'inventory', 
      description: lowStockCount > 0 ? `${lowStockCount} produits en stock faible` : 'Tous les produits OK', 
      timestamp: 'Dernière mise à jour', 
      icon: Warehouse,
      color: lowStockCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
    },
  ];

  const quickActions = [
    { label: 'Nouveau produit', icon: Plus, path: '/admin/products', color: 'blue' },
    { label: 'Nouvelle vente', icon: ShoppingCart, path: '/admin/pos', color: 'green' },
    { label: 'Entrée stock', icon: Package, path: '/admin/inventory', color: 'amber' },
    { label: 'Historique', icon: ReceiptText, path: '/admin/receipts', color: 'purple' },
  ];

  return (
    <AdminLayout
      title="Tableau de bord"
      breadcrumbs={[
        { label: 'Accueil' },
      ]}
    >
      {/* Welcome Card */}
      <div className="mb-8 p-6 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 rounded-xl text-white">
        <h2 className="text-2xl font-bold mb-2">Bienvenue, {user?.name}! 👋</h2>
        <p className="text-slate-300">
          {criticalItems.length > 0 && `⚠️ ${criticalItems.length} produit(s) en stock critique • `}
          {transactions.length} commande(s) traitée(s) • Chiffre d'affaires: {totalRevenue.toFixed(2)} XAF
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.color} p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-200`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-slate-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.iconColor}`}>
                  <Icon size={24} />
                </div>
              </div>
              <div className="flex items-center gap-1">
                {stat.trend === 'up' && <TrendingUp size={16} className="text-green-600" />}
                {stat.trend === 'down' && <TrendingDown size={16} className="text-red-600" />}
                <p className={`text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-slate-600'
                }`}>
                  {stat.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Tendance des revenus</h3>
            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="year">Cette année</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#0ea5e9" 
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', r: 4 }}
                name="Revenus réels"
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#cbd5e1" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#cbd5e1', r: 3 }}
                name="Objectif"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Produits les plus vendus</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProductsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              />
              <Bar dataKey="sales" fill="#10b981" name="Ventes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Activités récentes</h3>
          </div>
          <div className="divide-y divide-slate-200">
            {recentActivities.map((activity, index) => {
              const ActivityIcon = activity.icon as any;
              return (
                <div key={index} className="px-6 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activity.color}`}>
                      <ActivityIcon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{activity.description}</p>
                      <p className="text-xs text-slate-500">{activity.timestamp}</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-600 transition" />
                </div>
              );
            })}
          </div>
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-2">
              Voir tout l'historique
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Payment Methods & Quick Actions */}
        <div className="space-y-6">
          {/* Payment Methods Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Méthodes de paiement</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2 text-sm">
              {paymentData.map((method, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: method.color }}></div>
                    <span className="text-slate-600">{method.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{method.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Actions rapides</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => {
                const ActionIcon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={() => navigate(action.path)}
                    className={`w-full p-3 text-left rounded-lg border border-slate-200 hover:border-slate-300 transition-all flex items-center gap-3 group
                      ${action.color === 'blue' ? 'hover:bg-blue-50' : ''}
                      ${action.color === 'green' ? 'hover:bg-green-50' : ''}
                      ${action.color === 'amber' ? 'hover:bg-amber-50' : ''}
                      ${action.color === 'purple' ? 'hover:bg-purple-50' : ''}
                    `}
                  >
                    <div className={`p-2 rounded-lg
                      ${action.color === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
                      ${action.color === 'green' ? 'bg-green-100 text-green-600' : ''}
                      ${action.color === 'amber' ? 'bg-amber-100 text-amber-600' : ''}
                      ${action.color === 'purple' ? 'bg-purple-100 text-purple-600' : ''}
                    `}>
                      <ActionIcon size={18} />
                    </div>
                    <span className="text-sm font-medium text-slate-900 group-hover:text-slate-950">{action.label}</span>
                    <ArrowRight size={14} className="ml-auto text-slate-400 group-hover:text-slate-600" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
