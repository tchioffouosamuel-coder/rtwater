import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package,
  Download, ArrowUpRight, ArrowDownRight, Loader2, AlertCircle,
} from 'lucide-react';
import { fetchAnalytics, type AnalyticsData, type AnalyticsPeriod } from '../../../services/analytics';

export const AnalyticsPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();

  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const [data, setData]     = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchAnalytics(period)
      .then(d => { if (mounted) setData(d); })
      .catch(() => { if (mounted) setError('Impossible de charger les analytics.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [period]);

  if (!hasPermission('view_analytics')) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 font-semibold">Accès refusé</p>
        </div>
      </AdminLayout>
    );
  }

  const kpis         = data?.kpis;
  const trend        = data?.revenue_trend   ?? [];
  const topProducts  = data?.top_products    ?? [];
  const payments     = data?.payment_methods ?? [];

  const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
    n >= 1_000     ? `${(n / 1_000).toFixed(1)}k`     :
    n.toFixed(0);

  const handleExport = () => {
    if (!trend.length) return;
    const csv = [
      ['Date', 'Revenu (XAF)', 'Commandes'],
      ...trend.map(d => [d.date, d.revenue, d.orders]),
    ].map(r => r.join(',')).join('\n');

    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `analytics_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const COLORS = ['#2563eb', '#059669', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const maxSales = topProducts[0]?.sales ?? 1;

  return (
    <AdminLayout
      title="Analytiques"
      breadcrumbs={[{ label: 'Dashboard', path: '/admin/dashboard' }, { label: 'Analytiques' }]}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Analytics</h1>
          <p className="text-ink-500 text-sm mt-0.5">Données réelles — commandes, paiements, produits</p>
        </div>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as AnalyticsPeriod)}
            className="px-4 py-2 border border-ink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
          <button
            onClick={handleExport}
            disabled={!trend.length}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition disabled:opacity-40 text-sm"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Exporter CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-brand-500" size={40} />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[
              {
                label: 'Revenu total',
                value: `${fmt(kpis!.total_revenue)} XAF`,
                icon: DollarSign, bg: 'bg-brand-100', color: 'text-brand-600',
                pct: kpis!.revenue_change_pct,
              },
              {
                label: 'Commandes',
                value: kpis!.total_orders.toString(),
                icon: ShoppingCart, bg: 'bg-green-100', color: 'text-green-600',
                pct: kpis!.orders_change_pct,
              },
              {
                label: 'Panier moyen',
                value: `${fmt(kpis!.avg_order_value)} XAF`,
                icon: TrendingUp, bg: 'bg-orange-100', color: 'text-orange-600',
                pct: null,
              },
              {
                label: 'Clients uniques',
                value: kpis!.total_customers.toString(),
                icon: Users, bg: 'bg-purple-100', color: 'text-purple-600',
                pct: null,
              },
              {
                label: 'Produits actifs',
                value: kpis!.products_count.toString(),
                icon: Package, bg: 'bg-pink-100', color: 'text-pink-600',
                pct: null,
              },
            ].map((s, i) => {
              const Icon = s.icon;
              const up = s.pct !== null && s.pct >= 0;
              return (
                <div key={i} className="bg-white rounded-xl border border-ink-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-ink-500 mb-1">{s.label}</p>
                      <p className="text-xl font-bold text-ink-900">{s.value}</p>
                    </div>
                    <div className={`${s.bg} p-2.5 rounded-lg`}>
                      <Icon size={20} className={s.color} />
                    </div>
                  </div>
                  {s.pct !== null && (
                    <div className="flex items-center gap-1 mt-2 text-xs">
                      {up
                        ? <><ArrowUpRight   size={13} className="text-green-600" /><span className="text-green-600">+{s.pct}%</span></>
                        : <><ArrowDownRight size={13} className="text-red-600"   /><span className="text-red-600">{s.pct}%</span></>
                      }
                      <span className="text-ink-400">vs période préc.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Revenue area + Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-ink-200 p-6">
              <h3 className="text-base font-semibold text-ink-900 mb-4">Évolution du chiffre d'affaires</h3>
              {trend.length === 0 ? (
                <p className="text-sm text-ink-400 text-center py-16">Aucune donnée sur cette période.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: 11 }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: 11 }} tickFormatter={v => fmt(v)} />
                    <Tooltip
                      formatter={(v: number) => [`${v.toFixed(0)} XAF`, 'Revenu']}
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#colorRev)" name="Revenu" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-xl border border-ink-200 p-6">
              <h3 className="text-base font-semibold text-ink-900 mb-4">Méthodes de paiement</h3>
              {payments.every(p => p.value === 0) ? (
                <p className="text-sm text-ink-400 text-center py-12">Aucun paiement.</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={payments} cx="50%" cy="50%" outerRadius={75}
                        dataKey="value" labelLine={false}
                        label={({ name, value }) => `${name.split(' ')[0]}: ${value}%`}
                      >
                        {payments.map((m, i) => (
                          <Cell key={i} fill={m.color ?? COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v}%`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-1.5 text-sm">
                    {payments.map((m, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color ?? COLORS[i % COLORS.length] }} />
                          <span className="text-ink-600">{m.name}</span>
                        </div>
                        <span className="font-semibold text-ink-900">{m.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Orders bar + Customers line + Top products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-ink-200 p-6">
              <h3 className="text-base font-semibold text-ink-900 mb-4">Commandes par période</h3>
              {trend.length === 0 ? (
                <p className="text-sm text-ink-400 text-center py-12">Aucune donnée.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: 11 }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, color: '#fff' }} />
                    <Bar dataKey="orders" fill="#059669" name="Commandes" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-xl border border-ink-200 p-6">
              <h3 className="text-base font-semibold text-ink-900 mb-4">Revenu journalier</h3>
              {trend.length === 0 ? (
                <p className="text-sm text-ink-400 text-center py-12">Aucune donnée.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: 11 }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: 11 }} tickFormatter={v => fmt(v)} />
                    <Tooltip
                      formatter={(v: number) => [`${v.toFixed(0)} XAF`, 'Revenu']}
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8, color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#8b5cf6"
                      dot={{ fill: '#8b5cf6', r: 3 }} activeDot={{ r: 5 }} name="Revenu" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-xl border border-ink-200 p-6">
              <h3 className="text-base font-semibold text-ink-900 mb-4">Top 5 produits</h3>
              {topProducts.length === 0 ? (
                <p className="text-sm text-ink-400 text-center py-12">Aucune vente.</p>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((p, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium text-ink-900 truncate pr-2">{p.name}</p>
                        <span className="text-xs font-semibold text-ink-500 whitespace-nowrap">{p.sales} ventes</span>
                      </div>
                      <div className="w-full bg-ink-100 rounded-full h-2">
                        <div
                          className="bg-brand-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.round((p.sales / maxSales) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-ink-400 mt-0.5">{fmt(p.revenue)} XAF</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-base font-semibold text-ink-900">Détail des ventes par produit</h3>
            </div>
            {topProducts.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-10">Aucune donnée.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-ink-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-ink-700">#</th>
                      <th className="px-6 py-3 text-left font-semibold text-ink-700">Produit</th>
                      <th className="px-6 py-3 text-center font-semibold text-ink-700">Quantité vendue</th>
                      <th className="px-6 py-3 text-right font-semibold text-ink-700">Revenu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {topProducts.map((p, i) => (
                      <tr key={i} className="hover:bg-ink-50 transition">
                        <td className="px-6 py-4 text-ink-400 font-medium">{i + 1}</td>
                        <td className="px-6 py-4 font-medium text-ink-900">{p.name}</td>
                        <td className="px-6 py-4 text-center text-ink-600">{p.sales}</td>
                        <td className="px-6 py-4 text-right font-semibold text-ink-900">{fmt(p.revenue)} XAF</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
};
