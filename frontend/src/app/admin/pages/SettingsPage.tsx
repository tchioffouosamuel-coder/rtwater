import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import * as settingsService from '../../../services/settings';
import type { AdminSettings } from '../../../services/settings';
import { toast } from 'sonner';
import {
  AlertCircle, Bell, Building2, Check, Database, Loader2, Palette, Save, Zap,
} from 'lucide-react';

/**
 * Réglages de la boutique.
 *
 * Cet écran était auparavant un gabarit : « Enregistrer » affichait une
 * confirmation sans rien écrire, et les valeurs par défaut décrivaient une
 * entreprise parisienne en euros. Tout passe désormais par /api/admin/settings.
 */

type TabId = 'general' | 'payment' | 'stock' | 'notifications' | 'display';

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: 'general',       label: 'Entreprise',    icon: Building2 },
  { id: 'payment',       label: 'Paiement',      icon: Zap },
  { id: 'stock',         label: 'Stock',         icon: Database },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'display',       label: 'Affichage',     icon: Palette },
];

export const SettingsPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    settingsService.fetchSettings()
      .then(res => setSettings(res?.data ?? null))
      .catch(() => toast('Chargement des réglages impossible', { icon: '⚠️' }))
      .finally(() => setLoading(false));
  }, []);

  // Avertit avant de quitter avec des modifications non enregistrées
  useEffect(() => {
    if (!dirty) return;

    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const change = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setSettings(prev => (prev ? { ...prev, [key]: value } : prev));
    setDirty(true);
    setSaved(false);
    setErrors(prev => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setErrors({});
    try {
      const fresh = await settingsService.updateSettings(settings);
      setSettings(fresh);
      setDirty(false);
      setSaved(true);
      toast('Réglages enregistrés', { icon: '✅' });
      setTimeout(() => setSaved(false), 4000);
    } catch (e: any) {
      setErrors(e?.data?.errors ?? {});
      toast(e?.data?.message ?? "Enregistrement impossible", { icon: '⚠️' });
    } finally {
      setSaving(false);
    }
  };

  if (!hasPermission('manage_settings')) {
    return (
      <AdminLayout title="Paramètres">
        <div className="py-12 text-center">
          <p className="font-semibold text-red-600">Accès refusé</p>
          <p className="mt-1 text-sm text-ink-500">Seul un administrateur peut modifier les réglages.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Paramètres"
      breadcrumbs={[{ label: 'Dashboard', path: '/admin/dashboard' }, { label: 'Paramètres' }]}
    >
      {loading ? (
        <div className="py-20 text-center text-sm text-ink-400">
          <Loader2 size={20} className="mx-auto mb-2 animate-spin" />
          Chargement des réglages…
        </div>
      ) : !settings ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle size={24} className="mx-auto text-red-500" />
          <p className="mt-2 text-sm font-medium text-red-900">Réglages indisponibles</p>
          <p className="mt-1 text-xs text-red-700">Vérifiez que la migration des réglages a bien été jouée.</p>
        </div>
      ) : (
        <>
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 border-b border-ink-200">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                      activeTab === tab.id
                        ? 'border-brand-600 text-brand-700'
                        : 'border-transparent text-ink-500 hover:text-ink-800'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-ink-200 bg-white p-6">
            {activeTab === 'general' && (
              <Section
                title="Identité de l'entreprise"
                hint="Ces informations apparaissent sur le site, les reçus et les factures."
              >
                <Field label="Nom de l'entreprise" error={errors.company_name}>
                  <input
                    type="text" value={settings.company_name}
                    onChange={(e) => change('company_name', e.target.value)}
                    className={inputClass(errors.company_name)}
                  />
                </Field>

                <Field label="Description du site" error={errors.site_description} hint="Utilisée comme description par défaut pour les moteurs de recherche.">
                  <textarea
                    rows={2} value={settings.site_description}
                    onChange={(e) => change('site_description', e.target.value)}
                    className={inputClass(errors.site_description)}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="E-mail de contact" error={errors.company_email}>
                    <input
                      type="email" value={settings.company_email}
                      onChange={(e) => change('company_email', e.target.value)}
                      className={inputClass(errors.company_email)}
                    />
                  </Field>
                  <Field label="Identifiant fiscal (NIU)" error={errors.company_tax_id} hint="Figure sur les factures.">
                    <input
                      type="text" value={settings.company_tax_id}
                      onChange={(e) => change('company_tax_id', e.target.value)}
                      className={inputClass(errors.company_tax_id)}
                    />
                  </Field>
                  <Field label="Téléphone principal" error={errors.company_phone}>
                    <input
                      type="tel" value={settings.company_phone}
                      onChange={(e) => change('company_phone', e.target.value)}
                      className={inputClass(errors.company_phone)}
                    />
                  </Field>
                  <Field label="Téléphone secondaire" error={errors.company_phone_2}>
                    <input
                      type="tel" value={settings.company_phone_2}
                      onChange={(e) => change('company_phone_2', e.target.value)}
                      className={inputClass(errors.company_phone_2)}
                    />
                  </Field>
                </div>

                <Field label="Adresse" error={errors.company_address}>
                  <textarea
                    rows={2} value={settings.company_address}
                    onChange={(e) => change('company_address', e.target.value)}
                    className={inputClass(errors.company_address)}
                  />
                </Field>
              </Section>
            )}

            {activeTab === 'payment' && (
              <Section title="Paiement et fiscalité" hint="La devise est utilisée partout sur le site et sur les documents.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Devise" error={errors.currency} hint="Code à 3 lettres : XAF, EUR, USD…">
                    <input
                      type="text" maxLength={3} value={settings.currency}
                      onChange={(e) => change('currency', e.target.value.toUpperCase())}
                      className={`${inputClass(errors.currency)} uppercase`}
                    />
                  </Field>
                  <Field label="Taux de TVA (%)" error={errors.tax_rate} hint="0 si l'entreprise n'est pas assujettie.">
                    <input
                      type="number" min={0} max={100} step="0.01" value={settings.tax_rate}
                      onChange={(e) => change('tax_rate', Number(e.target.value))}
                      className={inputClass(errors.tax_rate)}
                    />
                  </Field>
                </div>

                <Toggle
                  checked={settings.tax_included}
                  onChange={(v) => change('tax_included', v)}
                  label="Les prix affichés sont TTC"
                  hint="Décoché, la taxe est ajoutée au moment du paiement."
                />

                <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Moyens de paiement proposés au client
                </p>
                <Toggle
                  checked={settings.payment_mobile_money}
                  onChange={(v) => change('payment_mobile_money', v)}
                  label="Mobile Money (Orange Money, MTN MoMo)"
                  hint="Paiement en ligne immédiat, confirmé par le prestataire."
                />
                <Toggle
                  checked={settings.payment_cash}
                  onChange={(v) => change('payment_cash', v)}
                  label="Espèces à la livraison"
                  hint="Le client règle au livreur à la réception."
                />
              </Section>
            )}

            {activeTab === 'stock' && (
              <Section title="Seuils de stock" hint="Déterminent les alertes du tableau de bord et de l'inventaire.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Seuil d'alerte" error={errors.low_stock_alert} hint="En dessous, le produit est signalé en stock faible.">
                    <input
                      type="number" min={0} value={settings.low_stock_alert}
                      onChange={(e) => change('low_stock_alert', Number(e.target.value))}
                      className={inputClass(errors.low_stock_alert)}
                    />
                  </Field>
                  <Field label="Seuil critique" error={errors.critical_stock_level} hint="Doit rester inférieur ou égal au seuil d'alerte.">
                    <input
                      type="number" min={0} value={settings.critical_stock_level}
                      onChange={(e) => change('critical_stock_level', Number(e.target.value))}
                      className={inputClass(errors.critical_stock_level)}
                    />
                  </Field>
                </div>
              </Section>
            )}

            {activeTab === 'notifications' && (
              <Section title="Notifications" hint="Alertes envoyées à l'équipe, en plus des e-mails adressés aux clients.">
                <Field label="Adresse de réception des alertes" error={errors.notification_email} hint="Laisser vide pour utiliser l'e-mail de contact de l'entreprise.">
                  <input
                    type="email" value={settings.notification_email}
                    onChange={(e) => change('notification_email', e.target.value)}
                    className={inputClass(errors.notification_email)}
                  />
                </Field>
                <Toggle
                  checked={settings.notify_orders}
                  onChange={(v) => change('notify_orders', v)}
                  label="M'avertir à chaque nouvelle commande"
                  hint=""
                />
                <Toggle
                  checked={settings.notify_stock}
                  onChange={(v) => change('notify_stock', v)}
                  label="M'avertir quand un produit atteint le seuil critique"
                  hint=""
                />
              </Section>
            )}

            {activeTab === 'display' && (
              <Section title="Affichage de la boutique">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Produits par page" error={errors.products_per_page} hint="Entre 4 et 48. Au-delà, la boutique devient lente sur mobile.">
                    <input
                      type="number" min={4} max={48} value={settings.products_per_page}
                      onChange={(e) => change('products_per_page', Number(e.target.value))}
                      className={inputClass(errors.products_per_page)}
                    />
                  </Field>
                  <Field label="Langue par défaut" error={errors.default_language}>
                    <select
                      value={settings.default_language}
                      onChange={(e) => change('default_language', e.target.value)}
                      className={inputClass(errors.default_language)}
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </Field>
                </div>
              </Section>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-ink-200 pt-6">
              <button
                onClick={handleSave}
                disabled={saving || !dirty}
                className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-ink-300"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>

              {saved && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                  <Check size={16} />
                  Enregistré
                </span>
              )}
              {dirty && !saving && (
                <span className="text-xs text-amber-600">Modifications non enregistrées</span>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

// ═══════════════════════════════════════════════════

const inputClass = (error?: string[]) =>
  `w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
    error
      ? 'border-red-300 bg-red-50 focus:ring-red-400'
      : 'border-ink-200 bg-white focus:border-transparent focus:ring-brand-500'
  }`;

const Section: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <div className="space-y-5">
    <div>
      <h2 className="text-base font-semibold text-ink-900">{title}</h2>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
    {children}
  </div>
);

const Field: React.FC<{
  label: string;
  hint?: string;
  error?: string[];
  children: React.ReactNode;
}> = ({ label, hint, error, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
    {children}
    {error?.[0] && <span className="mt-1 block text-xs text-red-600">{error[0]}</span>}
    {!error && hint && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
  </label>
);

const Toggle: React.FC<{
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint: string;
}> = ({ checked, onChange, label, hint }) => (
  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-ink-100 p-3 transition hover:bg-ink-50">
    <input
      type="checkbox" checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
    />
    <span className="min-w-0">
      <span className="block text-sm font-medium text-ink-900">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-ink-500">{hint}</span>}
    </span>
  </label>
);
