import React, { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import * as commerce from '../../../services/commerce';
import type { Discount, DiscountState, DiscountType, ShippingZone } from '../../../services/commerce';
import { toast } from 'sonner';
import {
  AlertCircle, Edit2, Loader2, Mail, Plus, Tag, Trash2, Truck, X,
} from 'lucide-react';
import { fetchSubscribers } from '../../../services/newsletter';

/**
 * Écran commercial : codes promo, zones de livraison, lettre d'information.
 *
 * Les trois sont réunis parce qu'ils répondent à la même question — comment on
 * facture et comment on garde le contact — et qu'aucun ne justifie un écran
 * complet à lui seul.
 */

type TabId = 'discounts' | 'shipping' | 'newsletter';

const xaf = (value: number) => `${Math.round(value).toLocaleString('fr-FR')} XAF`;

const STATE_META: Record<DiscountState, { label: string; tone: string }> = {
  running:   { label: 'En cours',  tone: 'bg-green-100 text-green-700' },
  scheduled: { label: 'Programmé', tone: 'bg-blue-100 text-blue-700' },
  expired:   { label: 'Expiré',    tone: 'bg-slate-100 text-slate-500' },
  exhausted: { label: 'Épuisé',    tone: 'bg-amber-100 text-amber-700' },
  inactive:  { label: 'Inactif',   tone: 'bg-slate-100 text-slate-500' },
};

export const MarketingPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();

  const canDiscounts = hasPermission('manage_discounts');
  const canShipping = hasPermission('manage_shipping');
  const canNewsletter = hasPermission('manage_newsletter');

  const firstTab: TabId = canDiscounts ? 'discounts' : canShipping ? 'shipping' : 'newsletter';
  const [tab, setTab] = useState<TabId>(firstTab);

  if (!canDiscounts && !canShipping && !canNewsletter) {
    return (
      <AdminLayout title="Commercial">
        <div className="py-12 text-center">
          <p className="font-semibold text-red-600">Accès refusé</p>
        </div>
      </AdminLayout>
    );
  }

  const tabs: Array<{ id: TabId; label: string; icon: React.ElementType; allowed: boolean }> = [
    { id: 'discounts',  label: 'Codes promo',        icon: Tag,   allowed: canDiscounts },
    { id: 'shipping',   label: 'Zones de livraison', icon: Truck, allowed: canShipping },
    { id: 'newsletter', label: "Lettre d'information", icon: Mail, allowed: canNewsletter },
  ];

  return (
    <AdminLayout
      title="Commercial"
      breadcrumbs={[{ label: 'Dashboard', path: '/admin/dashboard' }, { label: 'Commercial' }]}
    >
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 border-b border-slate-200">
          {tabs.filter(t => t.allowed).map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                  tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'discounts' && canDiscounts && <DiscountsTab />}
      {tab === 'shipping' && canShipping && <ShippingTab />}
      {tab === 'newsletter' && canNewsletter && <NewsletterTab />}
    </AdminLayout>
  );
};

// ═══════════════════════════════════════════════════
// CODES PROMO
// ═══════════════════════════════════════════════════

interface DiscountForm {
  id: number | null;
  code: string;
  label: string;
  type: DiscountType;
  value: string;
  min_subtotal: string;
  max_uses: string;
  max_uses_per_user: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

const EMPTY_DISCOUNT: DiscountForm = {
  id: null, code: '', label: '', type: 'percent', value: '',
  min_subtotal: '', max_uses: '', max_uses_per_user: '',
  starts_at: '', ends_at: '', is_active: true,
};

const DiscountsTab: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DiscountForm>(EMPTY_DISCOUNT);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Discount | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    commerce.fetchDiscounts()
      .then(res => setDiscounts(res?.data ?? []))
      .catch(() => toast('Chargement des codes promo impossible', { icon: '⚠️' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const openForm = (discount?: Discount) => {
    setForm(discount
      ? {
          id: discount.id,
          code: discount.code,
          label: discount.label ?? '',
          type: discount.type,
          value: String(discount.value),
          min_subtotal: discount.min_subtotal != null ? String(discount.min_subtotal) : '',
          max_uses: discount.max_uses != null ? String(discount.max_uses) : '',
          max_uses_per_user: discount.max_uses_per_user != null ? String(discount.max_uses_per_user) : '',
          starts_at: discount.starts_at ? discount.starts_at.slice(0, 16) : '',
          ends_at: discount.ends_at ? discount.ends_at.slice(0, 16) : '',
          is_active: discount.is_active,
        }
      : EMPTY_DISCOUNT);
    setFormError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    const code = form.code.trim().toUpperCase();
    const value = Number(form.value);

    if (!code) { setFormError('Le code est obligatoire.'); return; }
    if (!/^[A-Z0-9_-]+$/.test(code)) {
      setFormError('Le code ne peut contenir que des lettres, chiffres, tirets et underscores.');
      return;
    }
    if (!Number.isFinite(value) || value <= 0) { setFormError('Indiquez une valeur de remise valide.'); return; }
    if (form.type === 'percent' && value > 100) { setFormError('Un pourcentage ne peut pas dépasser 100.'); return; }

    setSaving(true);
    setFormError(null);
    try {
      const payload: Record<string, any> = {
        code,
        label: form.label.trim() || null,
        type: form.type,
        value,
        min_subtotal: form.min_subtotal ? Number(form.min_subtotal) : null,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        max_uses_per_user: form.max_uses_per_user ? Number(form.max_uses_per_user) : null,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        is_active: form.is_active,
      };

      if (form.id) {
        await commerce.updateDiscount(form.id, payload);
        toast('Code promo mis à jour', { icon: '✅' });
      } else {
        await commerce.createDiscount(payload);
        toast('Code promo créé', { icon: '✅' });
      }

      setShowForm(false);
      load();
    } catch (e: any) {
      setFormError(e?.data?.errors?.code?.[0] ?? e?.data?.message ?? 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (discount: Discount) => {
    setDeleting(null);
    try {
      const res: any = await commerce.deleteDiscount(discount.id);
      toast(res?.message ?? 'Code promo supprimé', { icon: '✅' });
      load();
    } catch (e: any) {
      toast(e?.data?.message ?? 'Suppression impossible', { icon: '⚠️' });
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Les codes sont saisis par le client au moment du paiement. La remise s'applique au sous-total,
          avant les frais de livraison.
        </p>
        <button
          onClick={() => openForm()}
          className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Nouveau code
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">
            <Loader2 size={20} className="mx-auto mb-2 animate-spin" />
            Chargement…
          </div>
        ) : discounts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Tag size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-900">Aucun code promo</p>
            <p className="mt-1 text-xs text-slate-500">
              Un code de bienvenue est le moyen le plus simple de convertir une première visite.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-left text-sm font-semibold text-slate-900">
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Remise</th>
                  <th className="px-6 py-4">Conditions</th>
                  <th className="px-6 py-4 text-center">Utilisations</th>
                  <th className="px-6 py-4 text-center">Statut</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {discounts.map(discount => {
                  const state = STATE_META[discount.state];

                  return (
                    <tr key={discount.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <code className="rounded bg-slate-100 px-2 py-1 font-mono text-sm font-semibold text-slate-900">
                          {discount.code}
                        </code>
                        {discount.label && <p className="mt-1 text-xs text-slate-400">{discount.label}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {discount.type === 'percent' ? `−${discount.value} %` : `−${xaf(discount.value)}`}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {discount.min_subtotal ? <p>Panier ≥ {xaf(discount.min_subtotal)}</p> : <p>Sans minimum</p>}
                        {discount.max_uses_per_user && <p>{discount.max_uses_per_user} usage(s) par client</p>}
                        {discount.ends_at && (
                          <p>Jusqu'au {new Date(discount.ends_at).toLocaleDateString('fr-FR')}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-slate-700">
                        {discount.used_count}
                        {discount.max_uses != null && <span className="text-slate-400"> / {discount.max_uses}</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${state.tone}`}>
                          {state.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openForm(discount)}
                            aria-label={`Modifier ${discount.code}`}
                            className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleting(discount)}
                            aria-label={`Supprimer ${discount.code}`}
                            className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <Modal title={form.id ? 'Modifier le code promo' : 'Nouveau code promo'} onClose={() => setShowForm(false)}>
          <div className="space-y-4">
            {formError && <FormError message={formError} />}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Code *</span>
                <input
                  type="text" value={form.code} autoFocus
                  onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="BIENVENUE10"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 font-mono text-sm uppercase outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="mt-1 block text-xs text-slate-400">
                  La casse n'importe pas : le client peut taper en minuscules.
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Libellé interne</span>
                <input
                  type="text" value={form.label}
                  onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="Campagne rentrée"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Type de remise</span>
                <div className="grid grid-cols-2 gap-2">
                  {([['percent', 'Pourcentage'], ['fixed', 'Montant fixe']] as const).map(([type, label]) => (
                    <button
                      key={type}
                      onClick={() => setForm(f => ({ ...f, type: type as DiscountType }))}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                        form.type === type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Valeur * {form.type === 'percent' ? '(%)' : '(XAF)'}
                </span>
                <input
                  type="number" min={0} max={form.type === 'percent' ? 100 : undefined} value={form.value}
                  onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Panier minimum (XAF)</span>
              <input
                type="number" min={0} value={form.min_subtotal}
                onChange={(e) => setForm(f => ({ ...f, min_subtotal: e.target.value }))}
                placeholder="Vide = sans minimum"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Utilisations totales</span>
                <input
                  type="number" min={1} value={form.max_uses}
                  onChange={(e) => setForm(f => ({ ...f, max_uses: e.target.value }))}
                  placeholder="Vide = illimité"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Par client</span>
                <input
                  type="number" min={1} value={form.max_uses_per_user}
                  onChange={(e) => setForm(f => ({ ...f, max_uses_per_user: e.target.value }))}
                  placeholder="Vide = illimité"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="mt-1 block text-xs text-slate-400">
                  Ne s'applique qu'aux clients connectés.
                </span>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Début</span>
                <input
                  type="datetime-local" value={form.starts_at}
                  onChange={(e) => setForm(f => ({ ...f, starts_at: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Fin</span>
                <input
                  type="datetime-local" value={form.ends_at}
                  onChange={(e) => setForm(f => ({ ...f, ends_at: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50">
              <input
                type="checkbox" checked={form.is_active}
                onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-900">Code actif</span>
            </label>
          </div>

          <ModalActions
            onCancel={() => setShowForm(false)}
            onConfirm={handleSave}
            saving={saving}
            confirmLabel={form.id ? 'Enregistrer' : 'Créer'}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title={`Supprimer « ${deleting.code} » ?`}
          message={
            deleting.used_count > 0
              ? `Ce code a déjà servi ${deleting.used_count} fois : il sera désactivé plutôt que supprimé, pour que l'historique des commandes reste lisible.`
              : 'Cette action est définitive.'
          }
          onCancel={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
        />
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════
// ZONES DE LIVRAISON
// ═══════════════════════════════════════════════════

interface ZoneForm {
  id: number | null;
  name: string;
  description: string;
  fee: string;
  free_above: string;
  delay: string;
  is_active: boolean;
  sort_order: string;
}

const EMPTY_ZONE: ZoneForm = {
  id: null, name: '', description: '', fee: '', free_above: '',
  delay: '', is_active: true, sort_order: '0',
};

const ShippingTab: React.FC = () => {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ZoneForm>(EMPTY_ZONE);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ShippingZone | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    commerce.fetchAdminShippingZones()
      .then(setZones)
      .catch(() => toast('Chargement des zones impossible', { icon: '⚠️' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const openForm = (zone?: ShippingZone) => {
    setForm(zone
      ? {
          id: zone.id,
          name: zone.name,
          description: zone.description ?? '',
          fee: String(zone.fee),
          free_above: zone.free_above != null ? String(zone.free_above) : '',
          delay: zone.delay ?? '',
          is_active: zone.is_active ?? true,
          sort_order: String(zone.sort_order ?? 0),
        }
      : EMPTY_ZONE);
    setFormError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const fee = Number(form.fee);

    if (!name) { setFormError('Le nom de la zone est obligatoire.'); return; }
    if (!Number.isFinite(fee) || fee < 0) { setFormError('Indiquez un tarif valide (0 pour une livraison offerte).'); return; }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name,
        description: form.description.trim() || null,
        fee,
        free_above: form.free_above ? Number(form.free_above) : null,
        delay: form.delay.trim() || null,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
      };

      if (form.id) {
        await commerce.updateShippingZone(form.id, payload);
        toast('Zone mise à jour', { icon: '✅' });
      } else {
        await commerce.createShippingZone(payload);
        toast('Zone créée', { icon: '✅' });
      }

      setShowForm(false);
      load();
    } catch (e: any) {
      setFormError(e?.data?.message ?? 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zone: ShippingZone) => {
    setDeleting(null);
    try {
      const res: any = await commerce.deleteShippingZone(zone.id);
      toast(res?.message ?? 'Zone supprimée', { icon: '✅' });
      load();
    } catch (e: any) {
      toast(e?.data?.message ?? 'Suppression impossible', { icon: '⚠️' });
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Le client choisit sa zone au moment de commander. Sans zone active, aucun frais de livraison
          n'est facturé.
        </p>
        <button
          onClick={() => openForm()}
          className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Nouvelle zone
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          <Loader2 size={20} className="mx-auto mb-2 animate-spin" />
          Chargement…
        </div>
      ) : zones.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
          <Truck size={32} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-900">Aucune zone de livraison</p>
          <p className="mt-1 text-xs text-slate-500">
            Tant qu'aucune zone n'existe, la livraison est gratuite pour tout le monde.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {zones.map(zone => (
            <article
              key={zone.id}
              className={`rounded-xl border bg-white p-4 ${zone.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900">{zone.name}</h3>
                  {zone.delay && <p className="mt-0.5 text-xs text-slate-400">{zone.delay}</p>}
                </div>
                {!zone.is_active && (
                  <span className="flex-shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    Inactive
                  </span>
                )}
              </div>

              {zone.description && (
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">{zone.description}</p>
              )}

              <div className="mt-3 space-y-1">
                <p className="text-lg font-bold text-slate-900">
                  {zone.fee === 0 ? 'Gratuite' : xaf(zone.fee)}
                </p>
                {zone.free_above != null && (
                  <p className="text-xs text-green-700">Offerte dès {xaf(zone.free_above)}</p>
                )}
                {!!zone.orders_count && (
                  <p className="text-xs text-slate-400">{zone.orders_count} commande(s)</p>
                )}
              </div>

              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => openForm(zone)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                >
                  <Edit2 size={14} />
                  Modifier
                </button>
                <button
                  onClick={() => setDeleting(zone)}
                  aria-label={`Supprimer ${zone.name}`}
                  className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={form.id ? 'Modifier la zone' : 'Nouvelle zone de livraison'} onClose={() => setShowForm(false)}>
          <div className="space-y-4">
            {formError && <FormError message={formError} />}

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Nom *</span>
              <input
                type="text" value={form.name} autoFocus
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Yaoundé — centre"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Quartiers couverts</span>
              <textarea
                rows={2} value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Bastos, Nlongkak, Mvog-Mbi, Essos"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="mt-1 block text-xs text-slate-400">
                Affiché au client pour qu'il choisisse la bonne zone.
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Tarif (XAF) *</span>
                <input
                  type="number" min={0} value={form.fee}
                  onChange={(e) => setForm(f => ({ ...f, fee: e.target.value }))}
                  placeholder="0 pour une livraison offerte"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Franco de port (XAF)</span>
                <input
                  type="number" min={0} value={form.free_above}
                  onChange={(e) => setForm(f => ({ ...f, free_above: e.target.value }))}
                  placeholder="Vide = jamais offerte"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="mt-1 block text-xs text-slate-400">
                  Au-delà de ce montant, la livraison passe à 0.
                </span>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Délai annoncé</span>
                <input
                  type="text" value={form.delay}
                  onChange={(e) => setForm(f => ({ ...f, delay: e.target.value }))}
                  placeholder="24 à 48 h"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Ordre d'affichage</span>
                <input
                  type="number" min={0} value={form.sort_order}
                  onChange={(e) => setForm(f => ({ ...f, sort_order: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="mt-1 block text-xs text-slate-400">Le plus petit apparaît en premier.</span>
              </label>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50">
              <input
                type="checkbox" checked={form.is_active}
                onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-900">Proposée aux clients</span>
            </label>
          </div>

          <ModalActions
            onCancel={() => setShowForm(false)}
            onConfirm={handleSave}
            saving={saving}
            confirmLabel={form.id ? 'Enregistrer' : 'Créer'}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title={`Supprimer « ${deleting.name} » ?`}
          message={
            deleting.orders_count
              ? `${deleting.orders_count} commande(s) utilisent cette zone : elle sera désactivée plutôt que supprimée.`
              : 'Cette action est définitive.'
          }
          onCancel={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
        />
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════
// NEWSLETTER
// ═══════════════════════════════════════════════════

const NewsletterTab: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Array<{ id: number; email: string; source: string; unsubscribed_at: string | null; created_at: string | null }>>([]);
  const [stats, setStats] = useState<{ active: number; unsubscribed: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'active' | 'unsubscribed' | 'all'>('active');

  useEffect(() => {
    setLoading(true);
    fetchSubscribers({ status: status === 'all' ? undefined : status })
      .then(res => {
        setSubscribers(res?.data ?? []);
        setStats(res?.stats ?? null);
      })
      .catch(() => toast('Chargement des inscrits impossible', { icon: '⚠️' }))
      .finally(() => setLoading(false));
  }, [status]);

  const exportCsv = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(
        `${(await import('../../../services/api')).API_BASE}/admin/newsletter/export`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      if (!res.ok) throw new Error();

      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast('Export impossible', { icon: '⚠️' });
    }
  };

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-xs font-medium text-green-600">Inscrits actifs</p>
          <p className="mt-1 text-2xl font-bold text-green-900">{stats?.active ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">Désinscrits</p>
          <p className="mt-1 text-2xl font-bold text-slate-700">{stats?.unsubscribed ?? '—'}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {([['active', 'Actifs'], ['unsubscribed', 'Désinscrits'], ['all', 'Tous']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatus(key as typeof status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                status === key ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={exportCsv}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Exporter les actifs en CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">
            <Loader2 size={20} className="mx-auto mb-2 animate-spin" />
            Chargement…
          </div>
        ) : subscribers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Mail size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-900">Aucun inscrit</p>
            <p className="mt-1 text-xs text-slate-500">
              Le formulaire du pied de page alimente cette liste.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-left text-sm font-semibold text-slate-900">
                <th className="px-6 py-4">Adresse</th>
                <th className="px-6 py-4">Origine</th>
                <th className="px-6 py-4">Inscrit le</th>
                <th className="px-6 py-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {subscribers.map(s => (
                <tr key={s.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-3 text-sm text-slate-900">{s.email}</td>
                  <td className="px-6 py-3 text-xs text-slate-500">{s.source}</td>
                  <td className="px-6 py-3 text-xs text-slate-500">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.unsubscribed_at ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'
                    }`}>
                      {s.unsubscribed_at ? 'Désinscrit' : 'Actif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════
// Briques partagées
// ═══════════════════════════════════════════════════

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />
    <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <button onClick={onClose} aria-label="Fermer" className="text-slate-400 hover:text-slate-700">
          <X size={20} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const ModalActions: React.FC<{
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
  confirmLabel: string;
}> = ({ onCancel, onConfirm, saving, confirmLabel }) => (
  <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
    <button
      onClick={onCancel}
      className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
    >
      Annuler
    </button>
    <button
      onClick={onConfirm}
      disabled={saving}
      className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:bg-slate-300"
    >
      {saving && <Loader2 size={16} className="animate-spin" />}
      {confirmLabel}
    </button>
  </div>
);

const FormError: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
    <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-600" />
    <p className="text-xs text-red-700">{message}</p>
  </div>
);

const ConfirmDialog: React.FC<{
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ title, message, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/40" onClick={onCancel} aria-hidden />
    <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Confirmer
        </button>
      </div>
    </div>
  </div>
);
