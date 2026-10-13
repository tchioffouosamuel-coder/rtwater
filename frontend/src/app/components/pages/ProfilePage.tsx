import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { FileText, Heart, Loader2, LogOut, Lock, Package, Save, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useUserAuth } from "../../../context/UserAuthContext";
import { myQuotes, updatePassword, updateProfile } from "../../../services/auth";
import { fetchOrders } from "../../../services/orders";
import { useSeo } from "../../../lib/seo";
import { orderReference, quoteStatusLabel, statusColor, statusLabel } from "../../../lib/orderStatus";
import { useI18n } from "../../../i18n/I18nContext";
import { useShopMemory } from "../../../context/ShopMemoryContext";
import { ProductMiniCard } from "../shop/ShopWidgets";

type Tab = "infos" | "orders" | "favorites" | "quotes" | "security";

const TABS: { key: Tab; fr: string; en: string; icon: React.ElementType }[] = [
  { key: "infos", fr: "Mes informations", en: "My details", icon: UserIcon },
  { key: "orders", fr: "Mes commandes", en: "My orders", icon: Package },
  { key: "favorites", fr: "Mes favoris", en: "My favourites", icon: Heart },
  { key: "quotes", fr: "Mes devis", en: "My quotes", icon: FileText },
  { key: "security", fr: "Sécurité", en: "Security", icon: Lock },
];

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0077BE]/25 focus:border-[#0077BE] text-sm";
const primaryButton =
  "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#0077BE] to-[#00A8E8] disabled:opacity-70 text-sm";

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function InfosTab() {
  const { user, setUserFromApi } = useUserAuth();
  const { tx } = useI18n();
  const [form, setForm] = useState({ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "", address: user?.address ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Le profil complet (téléphone, adresse) peut arriver après le premier rendu
  useEffect(() => {
    if (user) setForm({ name: user.name, email: user.email, phone: user.phone ?? "", address: user.address ?? "" });
  }, [user?.id, user?.phone, user?.address]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      const res = await updateProfile({ ...form, phone: form.phone || null, address: form.address || null });
      setUserFromApi(res.data);
      toast.success(tx("Vos informations sont enregistrées", "Your details have been saved"));
    } catch (err: any) {
      const apiErrors = err?.data?.errors ?? {};
      setErrors(Object.fromEntries(Object.entries(apiErrors).map(([k, v]: any) => [k, v?.[0] ?? ""])));
      if (!Object.keys(apiErrors).length) toast.error(tx("Enregistrement impossible pour le moment.", "Could not save right now."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 max-w-xl">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {tx(
          "Ces informations pré-remplissent vos prochaines commandes et nous permettent de vous joindre pour la livraison.",
          "These details pre-fill your next orders and let us reach you for delivery."
        )}
      </p>
      <Field id="pf-name" label={tx("Nom complet", "Full name")} error={errors.name}>
        <input id="pf-name" required value={form.name} onChange={set("name")} autoComplete="name" className={inputClass} />
      </Field>
      <Field id="pf-email" label={tx("Adresse e-mail", "Email address")} error={errors.email}>
        <input id="pf-email" type="email" required value={form.email} onChange={set("email")} autoComplete="email" className={inputClass} />
      </Field>
      <Field id="pf-phone" label={tx("Téléphone (Mobile Money)", "Phone (Mobile Money)")} error={errors.phone}>
        <input id="pf-phone" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="6XX XX XX XX" className={inputClass} />
      </Field>
      <Field id="pf-address" label={tx("Adresse de livraison", "Delivery address")} error={errors.address}>
        <textarea id="pf-address" rows={3} value={form.address} onChange={set("address")} autoComplete="street-address"
          placeholder={tx("Quartier, rue, repère, ville", "Area, street, landmark, city")} className={inputClass} />
      </Field>
      <button type="submit" disabled={saving} className={primaryButton}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {tx("Enregistrer", "Save")}
      </button>
    </form>
  );
}

function SecurityTab() {
  const [form, setForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { tx } = useI18n();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: tx("Les deux mots de passe ne correspondent pas.", "The two passwords do not match.") });
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await updatePassword(form);
      setForm({ current_password: "", password: "", password_confirmation: "" });
      toast.success(tx("Mot de passe modifié. Vos autres appareils ont été déconnectés.", "Password changed. Your other devices have been signed out."));
    } catch (err: any) {
      const apiErrors = err?.data?.errors ?? {};
      setErrors(Object.fromEntries(Object.entries(apiErrors).map(([k, v]: any) => [k, v?.[0] ?? ""])));
      if (err?.status === 429) toast.error(tx("Trop de tentatives. Patientez une minute.", "Too many attempts. Please wait a minute."));
    } finally {
      setSaving(false);
    }
  };

  const fields: { key: keyof typeof form; label: string; auto: string }[] = [
    { key: "current_password", label: tx("Mot de passe actuel", "Current password"), auto: "current-password" },
    { key: "password", label: tx("Nouveau mot de passe (8 caractères minimum)", "New password (at least 8 characters)"), auto: "new-password" },
    { key: "password_confirmation", label: tx("Confirmez le nouveau mot de passe", "Confirm new password"), auto: "new-password" },
  ];

  return (
    <form onSubmit={submit} className="space-y-5 max-w-xl">
      {fields.map((f) => (
        <Field key={f.key} id={`sec-${f.key}`} label={f.label} error={errors[f.key]}>
          <input id={`sec-${f.key}`} type="password" required minLength={f.key === "current_password" ? undefined : 8}
            autoComplete={f.auto} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className={inputClass} />
        </Field>
      ))}
      <button type="submit" disabled={saving} className={primaryButton}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} {tx("Changer le mot de passe", "Change password")}
      </button>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {tx("Mot de passe oublié ?", "Forgot your password?")}{" "}
        <Link to="/forgot-password" className="text-[#0077BE] hover:underline">{tx("Recevoir un lien par e-mail", "Get a link by email")}</Link>
      </p>
    </form>
  );
}

function ListState({ loading, empty, emptyText, cta }: { loading: boolean; empty: boolean; emptyText: string; cta: React.ReactNode }) {
  const { tx } = useI18n();
  if (loading) {
    return <div className="flex items-center gap-2 text-gray-400 py-10"><Loader2 className="w-5 h-5 animate-spin" /> {tx("Chargement…", "Loading…")}</div>;
  }
  if (empty) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-5">{emptyText}</p>
        {cta}
      </div>
    );
  }
  return null;
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { tx, language, locale } = useI18n();

  useEffect(() => {
    fetchOrders().then((res: any) => setOrders(res?.data ?? [])).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <ListState loading={loading} empty={!orders.length} emptyText={tx("Vous n'avez pas encore passé de commande.", "You haven't placed an order yet.")}
        cta={<Link to="/shop" className={primaryButton}>{tx("Découvrir la boutique", "Browse the shop")}</Link>} />
      {!loading && orders.length > 0 && (
        <>
          <ul className="divide-y divide-gray-100 dark:divide-slate-700">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id} className="py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{orderReference(o)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{o.created_at} · {Math.round(Number(o.total ?? 0)).toLocaleString(locale)} XAF</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(o.status)}`}>{statusLabel(o.status, language)}</span>
                  <Link to={`/suivi-commande?ref=${orderReference(o)}`} className="text-sm text-[#0077BE] hover:underline">{tx("Suivre", "Track")}</Link>
                </div>
              </li>
            ))}
          </ul>
          <Link to="/orders" className="inline-block mt-4 text-sm font-semibold text-[#0077BE] hover:underline">
            {tx("Voir le détail de toutes mes commandes", "See details of all my orders")}
          </Link>
        </>
      )}
    </div>
  );
}

function QuotesTab() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { tx, language } = useI18n();

  useEffect(() => {
    myQuotes().then((res: any) => setQuotes(res?.data ?? [])).catch(() => setQuotes([])).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <ListState loading={loading} empty={!quotes.length}
        emptyText={tx("Aucune demande de devis associée à votre adresse e-mail.", "No quote requests linked to your email address.")}
        cta={<Link to="/devis" className={primaryButton}>{tx("Demander un devis gratuit", "Request a free quote")}</Link>} />
      {!loading && quotes.length > 0 && (
        <ul className="divide-y divide-gray-100 dark:divide-slate-700">
          {quotes.map((q) => (
            <li key={q.id} className="py-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{q.solution_type || tx("Demande de devis", "Quote request")}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {q.created_at}{q.location ? ` · ${q.location}` : ""}{q.volume_m3 ? ` · ${q.volume_m3} m³` : ""}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                {quoteStatusLabel(q.status, language)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FavoritesTab() {
  const { favorites } = useShopMemory();
  const { tx } = useI18n();
  return (
    <div>
      <ListState loading={false} empty={!favorites.length}
        emptyText={tx("Touchez le cœur d'un produit pour le retrouver ici.", "Tap the heart on a product to find it here.")}
        cta={<Link to="/shop" className={primaryButton}>{tx("Découvrir la boutique", "Browse the shop")}</Link>} />
      {favorites.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((p) => <ProductMiniCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}

export const ProfilePage: React.FC = () => {
  const { user, isLoading, logout } = useUserAuth();
  const location = useLocation();
  const [tab, setTab] = useState<Tab>("infos");
  const { tx, language } = useI18n();

  useSeo({ title: tx("Mon compte", "My account"), path: "/profile", noindex: true });

  if (isLoading && !user) {
    return <div className="min-h-[60vh] flex items-center justify-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  const initials = user.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0077BE] to-[#00A8E8] text-white font-bold text-lg flex items-center justify-center">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tx("Bonjour", "Hello")} {user.name.split(" ")[0]}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}{user.createdAt ? ` · ${tx("client depuis le", "customer since")} ${user.createdAt}` : ""}
              </p>
            </div>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-red-600">
            <LogOut className="w-4 h-4" /> {tx("Se déconnecter", "Sign out")}
          </button>
        </div>

        <div className="grid md:grid-cols-[220px_1fr] gap-6">
          <nav aria-label={tx("Espace client", "Account")} className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0">
            {TABS.map(({ key, fr, en, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                aria-current={tab === key ? "page" : undefined}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === key
                    ? "bg-white dark:bg-slate-800 text-[#0077BE] dark:text-[#00A8E8] shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4" /> {language === "en" ? en : fr}
              </button>
            ))}
          </nav>

          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">{(() => { const t = TABS.find((x) => x.key === tab)!; return language === "en" ? t.en : t.fr; })()}</h2>
            {tab === "infos" && <InfosTab />}
            {tab === "orders" && <OrdersTab />}
            {tab === "favorites" && <FavoritesTab />}
            {tab === "quotes" && <QuotesTab />}
            {tab === "security" && <SecurityTab />}
          </section>
        </div>
      </div>
    </div>
  );
};
