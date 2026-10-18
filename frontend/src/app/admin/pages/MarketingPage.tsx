import React, { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import * as commerce from '../../../services/commerce';
import type { Discount, DiscountState, DiscountType, ShippingZone } from '../../../services/commerce';
import { toast } from 'sonner';
import {
  AlertCircle, ArrowLeft, Edit2, Loader2, Mail, Megaphone, Plus, Tag, Trash2, Truck, X,
} from 'lucide-react';
import { fetchSubscribers } from '../../../services/newsletter';
import { AnnouncementsPanel } from './AnnouncementsPanel';

/**
 * Écran commercial : codes promo, zones de livraison, lettre d'information.
 *
 * Les trois sont réunis parce qu'ils répondent à la même question — comment on
 * facture et comment on garde le contact — et qu'aucun ne justifie un écran
 * complet à lui seul.
 */

type TabId = 'discounts' | 'announcements' | 'shipping' | 'newsletter';

const xaf = (value: number) => `${Math.round(value).toLocaleString('fr-FR')} XAF`;

const STATE_META: Record<DiscountState, { label: string; tone: string }> = {
  running:   { label: 'En cours',  tone: 'bg-green-100 text-green-700' },
  scheduled: { label: 'Programmé', tone: 'bg-brand-100 text-brand-700' },
  expired:   { label: 'Expiré',    tone: 'bg-ink-100 text-ink-500' },
  exhausted: { label: 'Épuisé',    tone: 'bg-amber-100 text-amber-700' },
  inactive:  { label: 'Inactif',   tone: 'bg-ink-100 text-ink-500' },
};

export const MarketingPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();

  const canDiscounts = hasPermission('manage_discounts');
  const canShipping = hasPermission('manage_shipping');
  const canNewsletter = hasPermission('manage_newsletter');

  // Les annonces suivent la même permission que les codes promo : même métier,
  // même personne au clavier.
  const canAnnouncements = canDiscounts;

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
    { id: 'discounts',  label: 'Codes promo',        icon: Tag,      allowed: canDiscounts },
    { id: 'announcements', label: 'Annonces & pubs',  icon: Megaphone, allowed: canAnnouncements },
    { id: 'shipping',   label: 'Zones de livraison', icon: Truck, allowed: canShipping },
    { id: 'newsletter', label: "Lettre d'information", icon: Mail, allowed: canNewsletter },
  ];

  return (
    <AdminLayout
      title="Commercial"
      breadcrumbs={[{ label: 'Dashboard', path: '/admin/dashboard' }, { label: 'Commercial' }]}
    >
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 border-b border-ink-200">
          {tabs.filter(t => t.allowed).map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                  tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-800'
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
      {tab === 'announcements' && canAnnouncements && <AnnouncementsPanel />}
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
        <p className="text-sm text-ink-500">
          Les codes sont saisis par le client au moment du paiement. La remise s'applique au sous-total,
          avant les frais de livraison.
        </p>
        <button
          onClick={() => openForm()}
          className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white transition hover:bg-brand-700"
        >
          <Plus size={18} />
          Nouveau code
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
        {loading ? (
          <div className="py-16 text-center text-sm text-ink-400">
            <Loader2 size={20} className="mx-auto mb-2 animate-spin" />
            Chargement…
          </div>
        ) : discounts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Tag size={32} className="mx-auto text-ink-300" />
            <p className="mt-3 text-sm font-medium text-ink-900">Aucun code promo</p>
            <p className="mt-1 text-xs text-ink-500">
              Un code de bienvenue est le moyen le plus simple de convertir une première visite.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ink-50">
                <tr className="border-b border-ink-200 text-left text-sm font-semibold text-ink-900">
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Remise</th>
                  <th className="px-6 py-4">Conditions</th>
                  <th className="px-6 py-4 text-center">Utilisations</th>
                  <th className="px-6 py-4 text-center">Statut</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {discounts.map(discount => {
                  const state = STATE_META[discount.state];

                  return (
                    <tr key={discount.id} className="transition-colors hover:bg-ink-50">
                      <td className="px-6 py-4">
                        <code className="rounded bg-ink-100 px-2 py-1 font-mono text-sm font-semibold text-ink-900">
                          {discount.code}
                        </code>
                        {discount.label && <p className="mt-1 text-xs text-ink-400">{discount.label}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-ink-900">
                        {discount.type === 'percent' ? `−${discount.value} %` : `−${xaf(discount.value)}`}
                      </td>
                      <td className="px-6 py-4 text-xs text-ink-500">
                        {discount.min_subtotal ? <p>Panier ≥ {xaf(discount.min_subtotal)}</p> : <p>Sans minimum</p>}
                        {discount.max_uses_per_user && <p>{discount.max_uses_per_user} usage(s) par client</p>}
                        {discount.ends_at && (
                          <p>Jusqu'au {new Date(discount.ends_at).toLocaleDateString('fr-FR')}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-ink-700">
                        {discount.used_count}
                        {discount.max_uses != null && <span className="text-ink-400"> / {discount.max_uses}</span>}
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
                            className="rounded-lg p-1.5 text-brand-600 transition hover:bg-brand-50"
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
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Code *</span>
                <input
                  type="text" value={form.code} autoFocus
                  onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="BIENVENUE10"
                  className="w-full rounded-lg border border-ink-200 px-4 py-2.5 font-mono text-sm uppercase outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="mt-1 block text-xs text-ink-400">
                  La casse n'importe pas : le client peut taper en minuscules.
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Libellé interne</span>
                <input
                  type="text" value={form.label}
                  onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="Campagne rentrée"
                  className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Type de remise</span>
                <div className="grid grid-cols-2 gap-2">
                  {([['percent', 'Pourcentage'], ['fixed', 'Montant fixe']] as const).map(([type, label]) => (
                    <button
                      key={type}
                      onClick={() => setForm(f => ({ ...f, type: type as DiscountType }))}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                        form.type === type
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">
                  Valeur * {form.type === 'percent' ? '(%)' : '(XAF)'}
                </span>
                <input
                  type="number" min={0} max={form.type === 'percent' ? 100 : undefined} value={form.value}
                  onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))}
                  className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Panier minimum (XAF)</span>
              <input
                type="number" min={0} value={form.min_subtotal}
                onChange={(e) => setForm(f => ({ ...f, min_subtotal: e.target.value }))}
                placeholder="Vide = sans minimum"
                className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Utilisations totales</span>
                <input
                  type="number" min={1} value={form.max_uses}
                  onChange={(e) => setForm(f => ({ ...f, max_uses: e.target.value }))}
                  placeholder="Vide = illimité"
                  className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Par client</span>
                <input
                  type="number" min={1} value={form.max_uses_per_user}
                  onChange={(e) => setForm(f => ({ ...f, max_uses_per_user: e.target.value }))}
                  placeholder="Vide = illimité"
                  className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="mt-1 block text-xs text-ink-400">
                  Ne s'applique qu'aux clients connectés.
                </span>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Début</span>
                <input
                  type="datetime-local" value={form.starts_at}
                  onChange={(e) => setForm(f => ({ ...f, starts_at: e.target.value }))}
                  className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Fin</span>
                <input
                  type="datetime-local" value={form.ends_at}
                  onChange={(e) => setForm(f => ({ ...f, ends_at: e.target.value }))}
                  className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-ink-100 p-3 transition hover:bg-ink-50">
              <input
                type="checkbox" checked={form.is_active}
                onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-ink-900">Code actif</span>
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
  const [selectedZone, setSelectedZone] = useState<ShippingZone | null>(null);

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
        <p className="text-sm text-ink-500">
          Le client choisit sa zone au moment de commander. Sans zone active, aucun frais de livraison
          n'est facturé.
        </p>
        <button
          onClick={() => openForm()}
          className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white transition hover:bg-brand-700"
        >
          <Plus size={18} />
          Nouvelle zone
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-ink-200 bg-white py-16 text-center text-sm text-ink-400">
          <Loader2 size={20} className="mx-auto mb-2 animate-spin" />
          Chargement…
        </div>
      ) : zones.length === 0 ? (
        <div className="rounded-xl border border-ink-200 bg-white px-6 py-16 text-center">
          <Truck size={32} className="mx-auto text-ink-300" />
          <p className="mt-3 text-sm font-medium text-ink-900">Aucune zone de livraison</p>
          <p className="mt-1 text-xs text-ink-500">
            Tant qu'aucune zone n'existe, la livraison est gratuite pour tout le monde.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {zones.map(zone => (
            <article
              key={zone.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedZone(zone)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedZone(zone);
                }
              }}
              className={`cursor-pointer rounded-xl border bg-white p-4 transition hover:border-brand-300 hover:shadow-md ${zone.is_active ? 'border-ink-200' : 'border-ink-200 opacity-60'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-ink-900">{zone.name}</h3>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${zone.is_active ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}>
                    {zone.is_active ? 'Active' : 'Inactive'}
                  </span>
              </div>

              <div className="mt-3">
                <p className="text-lg font-bold text-ink-900">
                  {zone.fee === 0 ? 'Gratuite' : xaf(zone.fee)}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-ink-100 pt-3">
                <span className="text-[11px] uppercase tracking-wide text-ink-400">Détails</span>
                <div className="flex gap-2">
                <button
                  onClick={event => {
                    event.stopPropagation();
                    openForm(zone);
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 transition hover:bg-brand-50"
                >
                  <Edit2 size={14} />
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation();
                    setDeleting(zone);
                  }}
                  aria-label={`Supprimer ${zone.name}`}
                  className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedZone && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setSelectedZone(null)} aria-hidden />
          <section role="dialog" aria-modal="true" aria-labelledby="shipping-zone-sheet-title" className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center gap-3 border-b border-ink-200 bg-white px-6 py-4">
              <button onClick={() => setSelectedZone(null)} aria-label="Fermer la fiche zone" className="text-ink-400 transition hover:text-ink-700">
                <ArrowLeft size={20} />
              </button>
              <h2 id="shipping-zone-sheet-title" className="flex-1 text-base font-semibold text-ink-900">{selectedZone.name}</h2>
              <button onClick={() => setSelectedZone(null)} aria-label="Fermer" className="text-ink-400 transition hover:text-ink-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-ink-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-ink-500">Tarif</p>
                  <p className="mt-1 font-semibold text-ink-900">{selectedZone.fee === 0 ? 'Gratuite' : xaf(selectedZone.fee)}</p>
                </div>
                <div className="rounded-lg bg-ink-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-ink-500">Statut</p>
                  <p className={`mt-1 font-semibold ${selectedZone.is_active ? 'text-green-700' : 'text-ink-500'}`}>
                    {selectedZone.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="rounded-lg bg-ink-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-ink-500">Livraison offerte dès</p>
                  <p className="mt-1 font-semibold text-ink-900">
                    {selectedZone.free_above == null ? 'Jamais' : xaf(selectedZone.free_above)}
                  </p>
                </div>
                <div className="rounded-lg bg-ink-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-ink-500">Délai annoncé</p>
                  <p className="mt-1 font-semibold text-ink-900">{selectedZone.delay || 'Non précisé'}</p>
                </div>
              </div>
              <div className="rounded-xl border border-ink-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Quartiers couverts</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">
                  {selectedZone.description || 'Aucun quartier précisé.'}
                </p>
              </div>
              {selectedZone.orders_count != null && (
                <p className="text-sm text-ink-500">{selectedZone.orders_count} commande(s) associée(s)</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const zone = selectedZone;
                    setSelectedZone(null);
                    openForm(zone);
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 font-medium text-brand-700 transition hover:bg-brand-100"
                >
                  <Edit2 size={16} /> Modifier
                </button>
                <button
                  onClick={() => {
                    setDeleting(selectedZone);
                    setSelectedZone(null);
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 font-medium text-red-700 transition hover:bg-red-100"
                >
                  <Trash2 size={16} /> Supprimer
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {showForm && (
        <Modal title={form.id ? 'Modifier la zone' : 'Nouvelle zone de livraison'} onClose={() => setShowForm(false)}>
          <div className="space-y-4">
            {formError && <FormError message={formError} />}

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Nom *</span>
              <input
                type="text" value={form.name} autoFocus
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Yaoundé — centre"
                className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Quartiers couverts</span>
              <textarea
                rows={2} value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Bastos, Nlongkak, Mvog-Mbi, Essos"
                className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="mt-1 block text-xs text-ink-400">
                Affiché au client pour qu'il choisisse la bonne zone.
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Tarif (XAF) *</span>
                <input
                  type="number" min={0} value={form.fee}
                  onChange={(e) => setForm(f => ({ ...f, fee: e.target.value }))}
                  placeholder="0 pour une livraison offerte"
                  className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Franco de port (XAF)</span>
                <input
                  type="number" min={0} value={form.free_above}
                  onChange={(e) => setForm(f => ({ ...f, free_above: e.target.value }))}
                  placeholder="Vide = jamais offerte"
                  className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="mt-1 block text-xs text-ink-400">
                  Au-delà de ce montant, la livraison passe à 0.
                </span>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Délai annoncé</span>
                <input
                  type="text" value={form.delay}
                  onChange={(e) => setForm(f => ({ ...f, delay: e.target.value }))}
                  placeholder="24 à 48 h"
                  className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Ordre d'affichage</span>
                <input
                  type="number" min={0} value={form.sort_order}
                  onChange={(e) => setForm(f => ({ ...f, sort_order: e.target.value }))}
                  className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="mt-1 block text-xs text-ink-400">Le plus petit apparaît en premier.</span>
              </label>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-ink-100 p-3 transition hover:bg-ink-50">
              <input
                type="checkbox" checked={form.is_active}
                onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-ink-900">Proposée aux clients</span>
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
        <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
          <p className="text-xs font-medium text-ink-500">Désinscrits</p>
          <p className="mt-1 text-2xl font-bold text-ink-700">{stats?.unsubscribed ?? '—'}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {([['active', 'Actifs'], ['unsubscribed', 'Désinscrits'], ['all', 'Tous']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatus(key as typeof status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                status === key ? 'bg-brand-600 text-white' : 'border border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={exportCsv}
          className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-xs font-medium text-ink-700 transition hover:bg-ink-50"
        >
          Exporter les actifs en CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
        {loading ? (
          <div className="py-16 text-center text-sm text-ink-400">
            <Loader2 size={20} className="mx-auto mb-2 animate-spin" />
            Chargement…
          </div>
        ) : subscribers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Mail size={32} className="mx-auto text-ink-300" />
            <p className="mt-3 text-sm font-medium text-ink-900">Aucun inscrit</p>
            <p className="mt-1 text-xs text-ink-500">
              Le formulaire du pied de page alimente cette liste.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-ink-50">
              <tr className="border-b border-ink-200 text-left text-sm font-semibold text-ink-900">
                <th className="px-6 py-4">Adresse</th>
                <th className="px-6 py-4">Origine</th>
                <th className="px-6 py-4">Inscrit le</th>
                <th className="px-6 py-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {subscribers.map(s => (
                <tr key={s.id} className="transition-colors hover:bg-ink-50">
                  <td className="px-6 py-3 text-sm text-ink-900">{s.email}</td>
                  <td className="px-6 py-3 text-xs text-ink-500">{s.source}</td>
                  <td className="px-6 py-3 text-xs text-ink-500">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.unsubscribed_at ? 'bg-ink-100 text-ink-500' : 'bg-green-100 text-green-700'
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
    <div className="absolute inset-0 bg-ink-900/40" onClick={onClose} aria-hidden />
    <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-200 bg-white px-6 py-4">
        <h2 className="text-base font-semibold text-ink-900">{title}</h2>
        <button onClick={onClose} aria-label="Fermer" className="text-ink-400 hover:text-ink-700">
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
  <div className="mt-6 flex justify-end gap-3 border-t border-ink-200 pt-5">
    <button
      onClick={onCancel}
      className="rounded-lg border border-ink-200 px-5 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
    >
      Annuler
    </button>
    <button
      onClick={onConfirm}
      disabled={saving}
      className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:bg-ink-300"
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
    <div className="absolute inset-0 bg-ink-900/40" onClick={onCancel} aria-hidden />
    <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
      <h2 className="text-base font-semibold text-ink-900">{title}</h2>
      <p className="mt-2 text-sm text-ink-600">{message}</p>
      <div className="mt-5 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
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
