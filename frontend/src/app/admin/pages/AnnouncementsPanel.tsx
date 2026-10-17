import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertCircle, BellRing, Edit2, Eye, Image as ImageIcon, Loader2, Megaphone,
  MousePointerClick, Plus, Trash2, Upload, X,
} from 'lucide-react';
import {
  createAnnouncement, deleteAnnouncement, fetchAdminAnnouncements, updateAnnouncement,
  uploadAnnouncementImage,
  type AdminAnnouncement, type AnnouncementPlacement, type AnnouncementState, type AnnouncementVariant,
} from '../../../services/announcements';

/**
 * Annonces de la page d'accueil : bandeaux défilants et pubs flottantes.
 *
 * Les deux partagent un seul écran et un seul formulaire — ils portent le même
 * contenu et ne diffèrent que par l'emplacement. Les champs propres à chaque
 * emplacement (délai d'une pub, fermeture d'un bandeau) n'apparaissent que
 * lorsqu'ils servent, pour que le formulaire ne demande jamais l'inutile.
 */

const STATE_META: Record<AnnouncementState, { label: string; tone: string }> = {
  running:   { label: 'Diffusée',  tone: 'bg-green-100 text-green-700' },
  scheduled: { label: 'Programmée', tone: 'bg-brand-100 text-brand-700' },
  expired:   { label: 'Terminée',  tone: 'bg-ink-100 text-ink-500' },
  inactive:  { label: 'Inactive',  tone: 'bg-ink-100 text-ink-500' },
};

const VARIANT_META: Array<{ id: AnnouncementVariant; label: string; swatch: string }> = [
  { id: 'brand',   label: 'Bleu',   swatch: 'bg-gradient-to-r from-brand-600 to-aqua-500' },
  { id: 'aqua',    label: 'Cyan',   swatch: 'bg-gradient-to-r from-aqua-500 to-brand-500' },
  { id: 'amber',   label: 'Ambre',  swatch: 'bg-gradient-to-r from-amber-500 to-orange-400' },
  { id: 'emerald', label: 'Vert',   swatch: 'bg-gradient-to-r from-emerald-600 to-teal-400' },
  { id: 'rose',    label: 'Rose',   swatch: 'bg-gradient-to-r from-rose-600 to-fuchsia-400' },
];

const FREQUENCY_LABEL: Record<string, string> = {
  always:  'À chaque visite',
  session: 'Une fois par visite',
  once:    'Une seule fois',
};

interface AnnouncementForm {
  id: number | null;
  placement: AnnouncementPlacement;
  title: string;
  message: string;
  link_url: string;
  link_label: string;
  image_path: string;
  image_preview: string;
  icon: string;
  variant: AnnouncementVariant;
  delay_seconds: string;
  duration_seconds: string;
  frequency: 'always' | 'session' | 'once';
  dismissible: boolean;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
  sort_order: string;
}

const emptyForm = (placement: AnnouncementPlacement): AnnouncementForm => ({
  id: null,
  placement,
  title: '',
  message: '',
  link_url: '',
  link_label: '',
  image_path: '',
  image_preview: '',
  icon: '',
  variant: 'brand',
  delay_seconds: '8',
  duration_seconds: '12',
  frequency: 'session',
  dismissible: true,
  is_active: true,
  starts_at: '',
  ends_at: '',
  sort_order: '0',
});

export const AnnouncementsPanel: React.FC = () => {
  const [items, setItems] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | AnnouncementPlacement>('all');
  const [form, setForm] = useState<AnnouncementForm>(emptyForm('banner'));
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminAnnouncement | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminAnnouncements()
      .then(setItems)
      .catch(() => toast('Chargement des annonces impossible', { icon: '⚠️' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter(i => i.placement === filter)),
    [items, filter],
  );

  const openForm = (announcement?: AdminAnnouncement, placement: AnnouncementPlacement = 'banner') => {
    setForm(announcement
      ? {
          id: announcement.id,
          placement: announcement.placement,
          title: announcement.title,
          message: announcement.message ?? '',
          link_url: announcement.link_url ?? '',
          link_label: announcement.link_label ?? '',
          image_path: announcement.image_path ?? '',
          image_preview: announcement.image_url ?? '',
          icon: announcement.icon ?? '',
          variant: announcement.variant,
          delay_seconds: String(announcement.delay_seconds),
          duration_seconds: String(announcement.duration_seconds),
          frequency: announcement.frequency,
          dismissible: announcement.dismissible,
          is_active: announcement.is_active,
          starts_at: announcement.starts_at ? announcement.starts_at.slice(0, 16) : '',
          ends_at: announcement.ends_at ? announcement.ends_at.slice(0, 16) : '',
          sort_order: String(announcement.sort_order),
        }
      : emptyForm(placement));
    setFormError(null);
    setShowForm(true);
  };

  const pickImage = async (file: File) => {
    setUploading(true);
    try {
      const path = await uploadAnnouncementImage(file);
      setForm(f => ({ ...f, image_path: path, image_preview: URL.createObjectURL(file) }));
    } catch (e: any) {
      setFormError(e?.data?.message ?? "Téléversement de l'image impossible.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const title = form.title.trim();
    if (!title) { setFormError('Le titre est obligatoire.'); return; }

    setSaving(true);
    setFormError(null);
    try {
      const payload: Record<string, any> = {
        placement: form.placement,
        title,
        message: form.message.trim() || null,
        link_url: form.link_url.trim() || null,
        link_label: form.link_label.trim() || null,
        image_url: form.image_path || null,
        icon: form.icon.trim() || null,
        variant: form.variant,
        delay_seconds: Number(form.delay_seconds || 0),
        duration_seconds: Number(form.duration_seconds || 0),
        frequency: form.frequency,
        dismissible: form.dismissible,
        is_active: form.is_active,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        sort_order: Number(form.sort_order || 0),
      };

      if (form.id) {
        await updateAnnouncement(form.id, payload);
        toast('Annonce mise à jour', { icon: '✅' });
      } else {
        await createAnnouncement(payload);
        toast('Annonce créée', { icon: '✅' });
      }

      setShowForm(false);
      load();
    } catch (e: any) {
      const errors = e?.data?.errors;
      setFormError(errors ? String(Object.values(errors)[0]) : e?.data?.message ?? 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  /** Bascule l'activation depuis la liste : c'est le geste le plus fréquent. */
  const toggleActive = async (announcement: AdminAnnouncement) => {
    try {
      await updateAnnouncement(announcement.id, { is_active: !announcement.is_active });
      load();
    } catch {
      toast('Modification impossible', { icon: '⚠️' });
    }
  };

  const handleDelete = async (announcement: AdminAnnouncement) => {
    setDeleting(null);
    try {
      await deleteAnnouncement(announcement.id);
      toast('Annonce supprimée', { icon: '✅' });
      load();
    } catch {
      toast('Suppression impossible', { icon: '⚠️' });
    }
  };

  const isToast = form.placement === 'toast';

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-ink-500">
          Les bandeaux défilent en haut de la page d'accueil ; les pubs apparaissent en bas de l'écran
          après un délai. Une annonce sans date de fin reste diffusée tant qu'elle est active.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => openForm(undefined, 'banner')}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            <Plus size={18} />
            Bandeau
          </button>
          <button
            onClick={() => openForm(undefined, 'toast')}
            className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
          >
            <Plus size={18} />
            Pub flottante
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {([['all', 'Toutes'], ['banner', 'Bandeaux'], ['toast', 'Pubs flottantes']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id as 'all' | AnnouncementPlacement)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              filter === id ? 'bg-brand-600 text-white' : 'border border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
        {loading ? (
          <div className="py-16 text-center text-sm text-ink-400">
            <Loader2 size={20} className="mx-auto mb-2 animate-spin" />
            Chargement…
          </div>
        ) : visible.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Megaphone size={32} className="mx-auto text-ink-300" />
            <p className="mt-3 text-sm font-medium text-ink-900">Aucune annonce</p>
            <p className="mt-1 text-xs text-ink-500">
              Un bandeau « livraison offerte » est le moyen le plus rapide de faire connaître une offre.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ink-50">
                <tr className="border-b border-ink-200 text-left text-sm font-semibold text-ink-900">
                  <th className="px-6 py-4">Annonce</th>
                  <th className="px-6 py-4">Emplacement</th>
                  <th className="px-6 py-4">Diffusion</th>
                  <th className="px-6 py-4 text-center">Vues / clics</th>
                  <th className="px-6 py-4 text-center">Statut</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {visible.map(item => {
                  const state = STATE_META[item.state];
                  const swatch = VARIANT_META.find(v => v.id === item.variant)?.swatch ?? '';

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-ink-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <span className={`mt-1 h-8 w-1.5 shrink-0 rounded-full ${swatch}`} aria-hidden />
                          {item.image_url && (
                            <img src={item.image_url} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-ink-900">
                              {item.icon && <span className="mr-1">{item.icon}</span>}
                              {item.title}
                            </p>
                            {item.message && <p className="mt-0.5 line-clamp-1 text-xs text-ink-500">{item.message}</p>}
                            {item.link_url && (
                              <p className="mt-0.5 truncate text-xs text-brand-600">
                                {item.link_label || 'Lien'} → {item.link_url}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-700">
                          {item.placement === 'banner' ? <Megaphone size={14} /> : <BellRing size={14} />}
                          {item.placement === 'banner' ? 'Bandeau' : 'Pub flottante'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-ink-500">
                        {item.starts_at && <p>Dès le {new Date(item.starts_at).toLocaleDateString('fr-FR')}</p>}
                        {item.ends_at
                          ? <p>Jusqu'au {new Date(item.ends_at).toLocaleDateString('fr-FR')}</p>
                          : <p>Sans date de fin</p>}
                        {item.placement === 'toast' && (
                          <p>
                            Après {item.delay_seconds}s · {FREQUENCY_LABEL[item.frequency]}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-ink-700">
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Eye size={13} className="text-ink-400" /> {item.views}
                          <MousePointerClick size={13} className="ml-2 text-ink-400" /> {item.clicks}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleActive(item)}
                          title={item.is_active ? 'Désactiver' : 'Activer'}
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium transition hover:opacity-80 ${state.tone}`}
                        >
                          {state.label}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openForm(item)}
                            aria-label={`Modifier ${item.title}`}
                            className="rounded-lg p-1.5 text-brand-600 transition hover:bg-brand-50"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleting(item)}
                            aria-label={`Supprimer ${item.title}`}
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
        <PanelModal
          title={form.id ? "Modifier l'annonce" : isToast ? 'Nouvelle pub flottante' : 'Nouveau bandeau'}
          onClose={() => setShowForm(false)}
        >
          <div className="space-y-4">
            {formError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-600" />
                <p className="text-xs text-red-700">{formError}</p>
              </div>
            )}

            {/* Aperçu : évite d'aller vérifier sur le site après chaque retouche */}
            <Preview form={form} />

            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Emplacement</span>
              <div className="grid grid-cols-2 gap-2">
                {([['banner', 'Bandeau en haut'], ['toast', 'Pub flottante']] as const).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setForm(f => ({ ...f, placement: id }))}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                      form.placement === id
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Titre *</span>
                <input
                  type="text" value={form.title} autoFocus maxLength={150}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Livraison offerte dès 50 000 XAF"
                  className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Emoji</span>
                <input
                  type="text" value={form.icon} maxLength={4}
                  onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))}
                  placeholder="🚚"
                  className="w-20 rounded-lg border border-ink-200 px-4 py-2.5 text-center text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Message</span>
              <textarea
                value={form.message} rows={2} maxLength={500}
                onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Sur toute la ville de Yaoundé, jusqu'à la fin du mois."
                className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Lien</span>
                <input
                  type="text" value={form.link_url}
                  onChange={(e) => setForm(f => ({ ...f, link_url: e.target.value }))}
                  placeholder="/shop"
                  className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="mt-1 block text-xs text-ink-400">
                  Une adresse du site (/shop) ou une adresse complète (https://…).
                </span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Texte du bouton</span>
                <input
                  type="text" value={form.link_label} maxLength={60}
                  onChange={(e) => setForm(f => ({ ...f, link_label: e.target.value }))}
                  placeholder="Voir la boutique"
                  className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Couleur</span>
              <div className="flex flex-wrap gap-2">
                {VARIANT_META.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setForm(f => ({ ...f, variant: v.id }))}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      form.variant === v.id
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                    }`}
                  >
                    <span className={`h-4 w-4 rounded-full ${v.swatch}`} aria-hidden />
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visuel : utile surtout pour la pub flottante, qui l'affiche en vignette */}
            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Visuel</span>
              <div className="flex items-center gap-3">
                {form.image_preview ? (
                  <img src={form.image_preview} alt="" className="h-16 w-16 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-ink-200 text-ink-300">
                    <ImageIcon size={20} />
                  </div>
                )}
                <input
                  ref={fileInput} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) pickImage(file); }}
                />
                <button
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50 disabled:opacity-60"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {form.image_preview ? 'Remplacer' : 'Téléverser'}
                </button>
                {form.image_preview && (
                  <button
                    onClick={() => setForm(f => ({ ...f, image_path: '', image_preview: '' }))}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Retirer
                  </button>
                )}
              </div>
            </div>

            {isToast ? (
              <div className="grid gap-4 rounded-xl border border-ink-200 bg-ink-50/60 p-4 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink-700">Délai (s)</span>
                  <input
                    type="number" min={0} max={600} value={form.delay_seconds}
                    onChange={(e) => setForm(f => ({ ...f, delay_seconds: e.target.value }))}
                    className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="mt-1 block text-xs text-ink-400">Temps avant l'apparition.</span>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink-700">Durée (s)</span>
                  <input
                    type="number" min={0} max={600} value={form.duration_seconds}
                    onChange={(e) => setForm(f => ({ ...f, duration_seconds: e.target.value }))}
                    className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="mt-1 block text-xs text-ink-400">0 = reste jusqu'à fermeture.</span>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink-700">Fréquence</span>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm(f => ({ ...f, frequency: e.target.value as AnnouncementForm['frequency'] }))}
                    className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="always">À chaque visite</option>
                    <option value="session">Une fois par visite</option>
                    <option value="once">Une seule fois</option>
                  </select>
                </label>
              </div>
            ) : (
              <label className="flex items-center gap-3 rounded-xl border border-ink-200 bg-ink-50/60 p-4">
                <input
                  type="checkbox" checked={form.dismissible}
                  onChange={(e) => setForm(f => ({ ...f, dismissible: e.target.checked }))}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-ink-700">
                  Le visiteur peut fermer ce bandeau
                  <span className="block text-xs text-ink-400">
                    Une fois fermé, il ne revient plus pour ce visiteur.
                  </span>
                </span>
              </label>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Début</span>
                <input
                  type="datetime-local" value={form.starts_at}
                  onChange={(e) => setForm(f => ({ ...f, starts_at: e.target.value }))}
                  className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="mt-1 block text-xs text-ink-400">Vide = tout de suite.</span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Fin</span>
                <input
                  type="datetime-local" value={form.ends_at}
                  onChange={(e) => setForm(f => ({ ...f, ends_at: e.target.value }))}
                  className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="mt-1 block text-xs text-ink-400">Vide = sans fin.</span>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Ordre d'affichage</span>
                <input
                  type="number" min={0} max={999} value={form.sort_order}
                  onChange={(e) => setForm(f => ({ ...f, sort_order: e.target.value }))}
                  className="w-full rounded-lg border border-ink-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="mt-1 block text-xs text-ink-400">Le plus petit passe en premier.</span>
              </label>
              <label className="flex items-end gap-3 pb-2">
                <input
                  type="checkbox" checked={form.is_active}
                  onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-ink-700">Diffuser cette annonce</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-ink-200 pt-5">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-ink-200 px-5 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:bg-ink-300"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {form.id ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </PanelModal>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setDeleting(null)} aria-hidden />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-ink-900">Supprimer l'annonce</h2>
            <p className="mt-2 text-sm text-ink-600">
              « {deleting.title} » disparaîtra du site. Ses compteurs de vues et de clics seront perdus.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleting(null)}
                className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleting)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/** Rendu approchant de ce que verra le visiteur, pour juger sans quitter l'écran. */
const Preview: React.FC<{ form: AnnouncementForm }> = ({ form }) => {
  const swatch = VARIANT_META.find(v => v.id === form.variant)?.swatch ?? '';

  return (
    <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Aperçu</p>
      {form.placement === 'banner' ? (
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-white ${swatch}`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 text-base">
            {form.icon || '📣'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{form.title || 'Titre de votre annonce'}</p>
            {form.message && <p className="truncate text-xs text-white/85">{form.message}</p>}
          </div>
          {form.link_url && (
            <span className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand-700">
              {form.link_label || 'Découvrir'}
            </span>
          )}
        </div>
      ) : (
        <div className="max-w-xs overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg">
          <div className={`h-1 ${swatch}`} />
          <div className="flex gap-3 p-3">
            {form.image_preview ? (
              <img src={form.image_preview} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${swatch}`}>
                {form.icon || '✨'}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900">{form.title || 'Titre de votre pub'}</p>
              {form.message && <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{form.message}</p>}
              {form.link_url && (
                <p className="mt-1.5 text-xs font-semibold text-brand-600">{form.link_label || 'En profiter'} →</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PanelModal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
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
