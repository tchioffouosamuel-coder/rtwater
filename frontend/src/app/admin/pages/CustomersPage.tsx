import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import * as customersService from '../../../services/customers';
import type {
  Customer, CustomerDetail, CustomerSegment, CustomerSort, CustomerStats,
} from '../../../services/customers';
import { toast } from 'sonner';
import {
  ArrowLeft, Download, Loader2, Mail, MapPin, Phone, Search, ShoppingBag,
  TrendingUp, UserPlus, Users, X,
} from 'lucide-react';

const xaf = (value: number) => `${Math.round(value).toLocaleString('fr-FR')} XAF`;

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const SEGMENTS: Array<{ key: CustomerSegment; label: string }> = [
  { key: 'all', label: 'Tous' },
  { key: 'with_orders', label: 'Ont commandé' },
  { key: 'without_orders', label: 'Jamais commandé' },
  { key: 'guests', label: 'Sans compte' },
];

const SORTS: Array<{ key: CustomerSort; label: string }> = [
  { key: 'recent', label: 'Commande récente' },
  { key: 'spent', label: 'Montant dépensé' },
  { key: 'orders', label: 'Nombre de commandes' },
  { key: 'created', label: 'Inscription' },
];

const ORDER_STATUS: Record<string, { label: string; tone: string }> = {
  pending:   { label: 'En attente', tone: 'bg-amber-100 text-amber-700' },
  paid:      { label: 'Payée',      tone: 'bg-blue-100 text-blue-700' },
  shipped:   { label: 'Expédiée',   tone: 'bg-violet-100 text-violet-700' },
  delivered: { label: 'Livrée',     tone: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulée',    tone: 'bg-slate-100 text-slate-500' },
};

export const CustomersPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [pagination, setPagination] = useState<{ current_page: number; last_page: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<CustomerSegment>('all');
  const [sort, setSort] = useState<CustomerSort>('recent');
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Recherche différée : évite une requête par frappe
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(() => {
    setLoading(true);
    customersService.fetchCustomers({ page, search, segment, sort })
      .then(res => {
        setCustomers(res?.data ?? []);
        setPagination(res?.pagination ?? null);
        setStats(res?.stats ?? null);
      })
      .catch(() => toast('Chargement des clients impossible', { icon: '⚠️' }))
      .finally(() => setLoading(false));
  }, [page, search, segment, sort]);

  useEffect(load, [load]);

  const openCustomer = async (customer: Customer) => {
    setDetailLoading(true);
    try {
      setSelected(await customersService.fetchCustomer(customer.id));
    } catch {
      toast('Fiche client indisponible', { icon: '⚠️' });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await customersService.downloadCustomersCsv();
      toast('Export téléchargé', { icon: '✅' });
    } catch {
      toast('Export impossible', { icon: '⚠️' });
    } finally {
      setExporting(false);
    }
  };

  const topCustomer = useMemo(
    () => customers.reduce<Customer | null>((best, c) => (!best || c.total_spent > best.total_spent ? c : best), null),
    [customers],
  );

  if (!hasPermission('manage_customers')) {
    return (
      <AdminLayout title="Clients">
        <div className="py-12 text-center">
          <p className="font-semibold text-red-600">Accès refusé</p>
          <p className="mt-1 text-sm text-slate-500">Votre rôle ne donne pas accès aux fiches clients.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Clients"
      breadcrumbs={[{ label: 'Dashboard', path: '/admin/dashboard' }, { label: 'Clients' }]}
    >
      {/* Indicateurs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          tone="blue" icon={<Users size={18} />}
          label="Clients" value={stats ? String(stats.total) : '—'}
        />
        <StatCard
          tone="green" icon={<UserPlus size={18} />}
          label="Nouveaux (30 j)" value={stats ? String(stats.new_30d) : '—'}
        />
        <StatCard
          tone="violet" icon={<ShoppingBag size={18} />}
          label="Ont acheté" value={stats ? String(stats.buyers) : '—'}
        />
        <StatCard
          tone="amber" icon={<TrendingUp size={18} />}
          label="Panier moyen" value={stats ? xaf(stats.average_cart) : '—'}
        />
      </div>

      {/* Barre d'outils */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher par nom, e-mail ou téléphone…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-12 pr-4 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value as CustomerSort); setPage(1); }}
          aria-label="Trier les clients"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SORTS.map(s => <option key={s.key} value={s.key}>Tri : {s.label}</option>)}
        </select>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          Exporter en CSV
        </button>
      </div>

      {/* Segments */}
      <div className="mb-4 flex flex-wrap gap-2">
        {SEGMENTS.map(s => (
          <button
            key={s.key}
            onClick={() => { setSegment(s.key); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              segment === s.key ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">
            <Loader2 size={20} className="mx-auto mb-2 animate-spin" />
            Chargement…
          </div>
        ) : customers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-900">Aucun client dans cette sélection</p>
            <p className="mt-1 text-xs text-slate-500">
              {search
                ? 'Essayez un autre terme de recherche.'
                : 'Les clients apparaissent ici dès leur première commande ou inscription.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-left text-sm font-semibold text-slate-900">
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4 text-center">Commandes</th>
                    <th className="px-6 py-4 text-right">Total dépensé</th>
                    <th className="px-6 py-4">Dernière commande</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {customers.map(customer => (
                    <tr key={customer.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-semibold text-white">
                            {(customer.name || '?').charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{customer.name || 'Sans nom'}</p>
                            <p className="text-xs text-slate-400">Inscrit le {formatDate(customer.created_at)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5 text-xs text-slate-600">
                          {customer.email && <p className="truncate">{customer.email}</p>}
                          {customer.phone && <p>{customer.phone}</p>}
                          {customer.is_guest && (
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                              Commande sans compte
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                          customer.orders_count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {customer.orders_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                        {customer.total_spent > 0 ? xaf(customer.total_spent) : '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{formatDate(customer.last_order_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openCustomer(customer)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                        >
                          Voir la fiche
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.last_page > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                <p className="text-xs text-slate-500">
                  Page {pagination.current_page} sur {pagination.last_page} · {pagination.total} client(s)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={pagination.current_page <= 1}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={pagination.current_page >= pagination.last_page}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {topCustomer && topCustomer.total_spent > 0 && !loading && (
        <p className="mt-4 text-xs text-slate-500">
          Meilleur client de cette page : <strong className="text-slate-700">{topCustomer.name}</strong> —{' '}
          {xaf(topCustomer.total_spent)} sur {topCustomer.orders_count} commande(s).
        </p>
      )}

      {/* Fiche client */}
      {(selected || detailLoading) && (
        <CustomerDrawer
          customer={selected}
          loading={detailLoading}
          onClose={() => setSelected(null)}
        />
      )}
    </AdminLayout>
  );
};

// ═══════════════════════════════════════════════════

const TONES = {
  blue:   'border-blue-200 bg-blue-50 text-blue-600 text-blue-900',
  green:  'border-green-200 bg-green-50 text-green-600 text-green-900',
  violet: 'border-violet-200 bg-violet-50 text-violet-600 text-violet-900',
  amber:  'border-amber-200 bg-amber-50 text-amber-600 text-amber-900',
} as const;

const StatCard: React.FC<{
  tone: keyof typeof TONES;
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ tone, icon, label, value }) => {
  const [border, bg, labelColor, valueColor] = TONES[tone].split(' ');

  return (
    <div className={`rounded-xl border p-4 ${border} ${bg}`}>
      <div className={`flex items-center gap-2 text-xs font-medium ${labelColor}`}>
        {icon}
        {label}
      </div>
      <p className={`mt-2 text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
};

const CustomerDrawer: React.FC<{
  customer: CustomerDetail | null;
  loading: boolean;
  onClose: () => void;
}> = ({ customer, loading, onClose }) => (
  <div className="fixed inset-0 z-50 flex justify-end">
    <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />

    <div className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
      <div className="sticky top-0 flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-4">
        <button
          onClick={onClose}
          aria-label="Fermer la fiche client"
          className="text-slate-400 transition hover:text-slate-700"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="flex-1 text-base font-semibold text-slate-900">
          {loading ? 'Chargement…' : customer?.name || 'Fiche client'}
        </h2>
        <button onClick={onClose} aria-label="Fermer" className="text-slate-400 transition hover:text-slate-700">
          <X size={20} />
        </button>
      </div>

      {loading || !customer ? (
        <div className="py-20 text-center text-sm text-slate-400">
          <Loader2 size={20} className="mx-auto mb-2 animate-spin" />
          Chargement de la fiche…
        </div>
      ) : (
        <div className="space-y-6 p-6">
          {/* Coordonnées */}
          <div className="space-y-2 rounded-xl border border-slate-200 p-4">
            {customer.email && (
              <p className="flex items-center gap-2 text-sm text-slate-700">
                <Mail size={14} className="flex-shrink-0 text-slate-400" />
                <a href={`mailto:${customer.email}`} className="truncate hover:text-blue-600">{customer.email}</a>
              </p>
            )}
            {customer.phone && (
              <p className="flex items-center gap-2 text-sm text-slate-700">
                <Phone size={14} className="flex-shrink-0 text-slate-400" />
                <a href={`tel:${customer.phone}`} className="hover:text-blue-600">{customer.phone}</a>
              </p>
            )}
            {customer.address && (
              <p className="flex items-start gap-2 text-sm text-slate-700">
                <MapPin size={14} className="mt-0.5 flex-shrink-0 text-slate-400" />
                <span>{customer.address}</span>
              </p>
            )}
            {customer.is_guest && (
              <p className="pt-1 text-xs text-slate-500">
                Ce client a commandé sans créer de compte : aucune adresse e-mail exploitable.
              </p>
            )}
          </div>

          {/* Chiffres */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 p-3 text-center">
              <p className="text-xs text-slate-500">Commandes</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{customer.orders_count}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 text-center">
              <p className="text-xs text-slate-500">Total</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{xaf(customer.total_spent)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 text-center">
              <p className="text-xs text-slate-500">Panier moyen</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{xaf(customer.average_cart)}</p>
            </div>
          </div>

          {/* Historique */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              Historique des commandes
              {customer.orders.length > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-400">
                  ({customer.orders.length} affichée{customer.orders.length > 1 ? 's' : ''})
                </span>
              )}
            </h3>

            {customer.orders.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                Aucune commande pour ce client.
              </p>
            ) : (
              <ul className="space-y-3">
                {customer.orders.map(order => {
                  const status = ORDER_STATUS[order.status] ?? { label: order.status, tone: 'bg-slate-100 text-slate-600' };

                  return (
                    <li key={order.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-slate-500">{order.reference}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-semibold text-slate-900">{xaf(order.total)}</p>
                          <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${status.tone}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>

                      <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3">
                        {order.items.map((item, i) => (
                          <li key={i} className="flex justify-between gap-2 text-xs text-slate-600">
                            <span className="truncate">{item.quantity} × {item.name}</span>
                            <span className="flex-shrink-0 text-slate-400">{xaf(item.price * item.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
);
