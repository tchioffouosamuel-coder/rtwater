import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import {
  TrendingUp, TrendingDown, PackageOpen, ShoppingCart, Users, DollarSign,
  ArrowRight, Plus, Package, Warehouse, ReceiptText, Loader2,
  CheckCircle, Clock, Truck, XCircle,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { fetchAnalytics, type AnalyticsData, type AnalyticsPeriod } from '../../../services/analytics';

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending:   <Clock size={14} className="text-yellow-500" />,
  paid:      <CheckCircle size={14} className="text-green-500" />,
  shipped:   <Truck size={14} className="text-brand-500" />,
  delivered: <CheckCircle size={14} className="text-emerald-600" />,
  cancelled: <XCircle size={14} className="text-red-500" />,
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente', paid: 'Payée', shipped: 'Expédiée',
  delivered: 'Livrée', cancelled: 'Annulée',
};

export const AdminDashboard: React.FC = () => {
  const { user } = useAdminAuth();
  const navigate = useNavigate();

  const [period, setPeriod] = useState<AnalyticsPeriod>('week');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchAnalytics(period)
      .then(d => { if (mounted) setData(d); })
      .catch(() => { if (mounted) setError('Impossible de charger les données.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [period]);

  const kpis = data?.kpis;
  const revenueTrend   = data?.revenue_trend   ?? [];
  const topProducts    = data?.top_products     ?? [];
  const paymentMethods = data?.payment_methods  ?? [];
  const recentOrders   = data?.recent_orders    ?? [];

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}k`
      : n.toFixed(0);

  const stats = kpis
    ? [
        {
          label: "Chiffre d'affaires",
          value: `${fmt(kpis.total_revenue)} XAF`,
          change: `${fmt(kpis.today_revenue)} XAF aujourd'hui`,
          pct: kpis.revenue_change_pct,
          icon: DollarSign, color: 'bg-brand-50', iconColor: 'text-brand-600',
        },
        {
          label: 'Commandes',
          value: kpis.total_orders.toString(),
          change: kpis.orders_change_pct !== null
            ? `${kpis.orders_change_pct > 0 ? '+' : ''}${kpis.orders_change_pct}% vs période préc.`
            : 'Première période',
          pct: kpis.orders_change_pct,
          icon: ShoppingCart, color: 'bg-green-50', iconColor: 'text-green-600',
        },
        {
          label: 'Produits actifs',
          value: kpis.products_count.toString(),
          change: kpis.critical_stock_count > 0
            ? `${kpis.critical_stock_count} épuisé(s), ${kpis.low_stock_count} faible(s)`
            : kpis.low_stock_count > 0
            ? `${kpis.low_stock_count} en stock faible`
            : 'Stock optimal',
          pct: kpis.critical_stock_count > 0 ? -1 : null,
          icon: PackageOpen,
          color: kpis.critical_stock_count > 0 ? 'bg-red-50' : kpis.low_stock_count > 0 ? 'bg-amber-50' : 'bg-green-50',
          iconColor: kpis.critical_stock_count > 0 ? 'text-red-600' : kpis.low_stock_count > 0 ? 'text-amber-600' : 'text-green-600',
        },
        {
          label: 'Clients uniques',
          value: kpis.total_customers.toString(),
          change: `Panier moyen ${fmt(kpis.avg_order_value)} XAF`,
          pct: null,
          icon: Users, color: 'bg-purple-50', iconColor: 'text-purple-600',
        },
      ]
    : [];

  const quickActions = [
    { label: 'Nouveau produit',  icon: Plus,        path: '/admin/products',  color: 'blue'   },
    { label: 'Nouvelle vente',   icon: ShoppingCart, path: '/admin/pos',      color: 'green'  },
    { label: 'Entrée stock',     icon: Package,     path: '/admin/inventory', color: 'amber'  },
    { label: 'Historique',       icon: ReceiptText, path: '/admin/receipts',  color: 'purple' },
  ];

  return (
    <AdminLayout title="Tableau de bord" breadcrumbs={[{ label: 'Accueil' }]}>

      {/* Welcome */}
      <div className="mb-8 p-6 bg-gradient-to-r from-ink-700 via-ink-800 to-ink-900 rounded-xl text-white">
        <h2 className="text-2xl font-bold mb-1">Bienvenue, {user?.name}! 👋</h2>
        <p className="text-ink-300 text-sm">
          {kpis
            ? `${kpis.total_orders} commande(s) • CA : ${fmt(kpis.total_revenue)} XAF${kpis.critical_stock_count > 0 ? ` • ⚠️ ${kpis.critical_stock_count} produit(s) épuisé(s)` : ''}`
            : 'Chargement des données…'}
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-brand-500" size={36} />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700 mb-8">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              const isUp = stat.pct === null ? null : stat.pct >= 0;
              return (
                <div key={i} className={`${stat.color} p-6 rounded-xl border border-ink-200 hover:shadow-lg transition-all`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-ink-600 text-sm font-medium">{stat.label}</p>
                      <p className="text-3xl font-bold text-ink-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.iconColor}`}><Icon size={24} /></div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isUp === true  && <TrendingUp  size={16} className="text-green-600" />}
                    {isUp === false && <TrendingDown size={16} className="text-red-600"   />}
                    <p className={`text-sm font-medium ${isUp === true ? 'text-green-600' : isUp === false ? 'text-red-600' : 'text-ink-600'}`}>
                      {stat.change}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue trend */}
            <div className="bg-white rounded-xl border border-ink-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-ink-900">Tendance des revenus</h3>
                <select
                  value={period}
                  onChange={e => setPeriod(e.target.value as AnalyticsPeriod)}
                  className="px-3 py-1 text-sm border border-ink-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                  <option value="year">Cette année</option>
                </select>
              </div>
              {revenueTrend.length === 0 ? (
                <p className="text-sm text-ink-400 text-center py-16">Aucune commande sur cette période.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" tickFormatter={v => fmt(v)} />
                    <Tooltip
                      formatter={(v: number) => [`${v.toFixed(0)} XAF`, 'Revenus']}
                      contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2}
                      dot={{ fill: '#0ea5e9', r: 4 }} name="Revenus" />
                    <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2}
                      dot={{ fill: '#10b981', r: 3 }} name="Commandes" yAxisId={undefined} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top products */}
            <div className="bg-white rounded-xl border border-ink-200 p-6">
              <h3 className="text-lg font-semibold text-ink-900 mb-4">Produits les plus vendus</h3>
              {topProducts.length === 0 ? (
                <p className="text-sm text-ink-400 text-center py-16">Aucune vente sur cette période.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" angle={-35} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      formatter={(v: number, name: string) => [name === 'sales' ? `${v} ventes` : `${v.toFixed(0)} XAF`, name === 'sales' ? 'Ventes' : 'Revenu']}
                      contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}
                    />
                    <Bar dataKey="sales" fill="#10b981" name="Ventes" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Bottom grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent orders */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-ink-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-ink-200">
                <h3 className="text-lg font-semibold text-ink-900">Commandes récentes</h3>
              </div>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-ink-400 text-center py-10">Aucune commande.</p>
              ) : (
                <div className="divide-y divide-ink-100">
                  {recentOrders.map(order => (
                    <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-ink-50 transition group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
                          #{order.id}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-ink-900">{order.customer}</p>
                          <p className="text-xs text-ink-500">{order.created_at}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-ink-800">{fmt(order.total)} XAF</span>
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-ink-100 text-ink-700">
                          {STATUS_ICON[order.status]}
                          {STATUS_LABEL[order.status] ?? order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="px-6 py-3 bg-ink-50 border-t border-ink-200">
                <button
                  onClick={() => navigate('/admin/orders')}
                  className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-2"
                >
                  Voir toutes les commandes <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Payment methods */}
              <div className="bg-white rounded-xl border border-ink-200 p-6">
                <h3 className="text-lg font-semibold text-ink-900 mb-4">Méthodes de paiement</h3>
                {paymentMethods.every(p => p.value === 0) ? (
                  <p className="text-sm text-ink-400 text-center py-6">Aucun paiement enregistré.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={paymentMethods} cx="50%" cy="50%"
                          innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                          {paymentMethods.map((m, i) => (
                            <Cell key={i} fill={m.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${v}%`]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-3 space-y-1.5 text-sm">
                      {paymentMethods.map((m, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                            <span className="text-ink-600">{m.name}</span>
                          </div>
                          <span className="font-semibold text-ink-900">{m.value}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Quick actions */}
              <div className="bg-white rounded-xl border border-ink-200 p-6">
                <h3 className="text-lg font-semibold text-ink-900 mb-4">Actions rapides</h3>
                <div className="space-y-3">
                  {quickActions.map((action, i) => {
                    const ActionIcon = action.icon;
                    const colors: Record<string, string> = {
                      blue: 'bg-brand-100 text-brand-600 hover:bg-brand-50',
                      green: 'bg-green-100 text-green-600 hover:bg-green-50',
                      amber: 'bg-amber-100 text-amber-600 hover:bg-amber-50',
                      purple: 'bg-purple-100 text-purple-600 hover:bg-purple-50',
                    };
                    return (
                      <button key={i} onClick={() => navigate(action.path)}
                        className={`w-full p-3 text-left rounded-lg border border-ink-200 hover:border-ink-300 transition-all flex items-center gap-3 group ${colors[action.color].split(' ').slice(2).join(' ')}`}
                      >
                        <div className={`p-2 rounded-lg ${colors[action.color].split(' ').slice(0, 2).join(' ')}`}>
                          <ActionIcon size={18} />
                        </div>
                        <span className="text-sm font-medium text-ink-900">{action.label}</span>
                        <ArrowRight size={14} className="ml-auto text-ink-400 group-hover:text-ink-600" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};
