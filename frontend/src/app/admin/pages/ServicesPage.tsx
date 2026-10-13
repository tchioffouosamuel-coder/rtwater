import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import * as catalog from '../../../services/catalog';
import type { Category, Service } from '../../../services/catalog';
import { toast } from 'sonner';
import {
  AlertCircle, Clock, Edit2, ImageIcon, Loader2, Plus, Search, Trash2, Wrench, X,
} from 'lucide-react';

/**
 * Prestations de service (installation, maintenance, forage…).
 *
 * L'API et le modèle Booking existaient déjà, mais aucun écran ne permettait de
 * gérer le catalogue de prestations — alors que c'est la moitié de l'offre.
 */

const xaf = (value: number) => `${Math.round(value).toLocaleString('fr-FR')} XAF`;

/** 90 → « 1 h 30 ». */
const formatDuration = (minutes: number) => {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
};

interface FormState {
  id: number | null;
  name: string;
  description: string;
  price: string;
  duration_minutes: string;
  category_id: string;
  is_available: boolean;
}

const EMPTY_FORM: FormState = {
  id: null, name: '', description: '', price: '',
  duration_minutes: '60', category_id: '', is_available: true,
};

export const ServicesPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    catalog.fetchServices({ per_page: 100 })
      .then((res: any) => setServices(res?.data ?? []))
      .catch(() => toast('Chargement des services impossible', { icon: '⚠️' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    catalog.fetchCategories('service').then(setCategories).catch(() => {});
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? services.filter(s => s.name.toLowerCase().includes(term) || (s.description ?? '').toLowerCase().includes(term))
      : services;
  }, [services, search]);

  const openForm = (service?: Service) => {
    setForm(service
      ? {
          id: service.id,
          name: service.name,
          description: service.description ?? '',
          price: String(service.price ?? ''),
          duration_minutes: String(service.duration_minutes ?? 60),
          category_id: service.category?.id ? String(service.category.id) : '',
          is_available: service.is_available,
        }
      : EMPTY_FORM);
    setImageFile(null);
    setImagePreview(service?.image_url ?? null);
    setFormError(null);
    setShowForm(true);
  };

  const pickImage = (file: File | null) => {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const price = Number(form.price);

    if (!name) { setFormError('Le nom de la prestation est obligatoire.'); return; }
    if (!Number.isFinite(price) || price < 0) { setFormError('Indiquez un tarif valide.'); return; }

    setSaving(true);
    setFormError(null);
    try {
      let payload: Record<string, any> | FormData;

      if (imageFile) {
        // Un fichier impose multipart : les booléens passent en « 1 »/« 0 »
        const data = new FormData();
        data.append('name', name);
        data.append('description', form.description);
        data.append('price', String(price));
        data.append('duration_minutes', String(Number(form.duration_minutes) || 60));
        data.append('is_available', form.is_available ? '1' : '0');
        if (form.category_id) data.append('category_id', form.category_id);
        data.append('image_url', imageFile);
        payload = data;
      } else {
        payload = {
          name,
          description: form.description,
          price,
          duration_minutes: Number(form.duration_minutes) || 60,
          is_available: form.is_available,
          ...(form.category_id ? { category_id: Number(form.category_id) } : {}),
        };
      }

      if (form.id) {
        await catalog.updateService(form.id, payload);
        toast('Prestation mise à jour', { icon: '✅' });
      } else {
        await catalog.createService(payload);
        toast('Prestation créée', { icon: '✅' });
      }

      setShowForm(false);
      load();
    } catch (e: any) {
      setFormError(e?.data?.message ?? "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service: Service) => {
    setDeleting(null);
    try {
      await catalog.deleteService(service.id);
      toast('Prestation supprimée', { icon: '✅' });
      load();
    } catch (e: any) {
      toast(e?.data?.message ?? 'Suppression impossible', { icon: '⚠️' });
    }
  };

  if (!hasPermission('manage_services')) {
    return (
      <AdminLayout title="Prestations">
        <div className="py-12 text-center">
          <p className="font-semibold text-red-600">Accès refusé</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Prestations de service"
      breadcrumbs={[{ label: 'Dashboard', path: '/admin/dashboard' }, { label: 'Prestations' }]}
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input
            type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une prestation…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-12 pr-4 outline-none transition focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Nouvelle prestation
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          <Loader2 size={20} className="mx-auto mb-2 animate-spin" />
          Chargement…
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
          <Wrench size={32} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-900">
            {search ? 'Aucune prestation ne correspond' : 'Aucune prestation'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Installation, maintenance, forage, analyse d'eau : décrivez ici ce que vous proposez.
          </p>
          {!search && (
            <button
              onClick={() => openForm()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus size={16} />
              Créer la première
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(service => (
            <article key={service.id} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="relative aspect-video bg-slate-100">
                {service.image_url ? (
                  <img src={service.image_url} alt={service.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <ImageIcon size={28} />
                  </div>
                )}
                {!service.is_available && (
                  <span className="absolute left-2 top-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-[11px] font-medium text-white">
                    Masquée
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-sm font-semibold text-slate-900">{service.name}</h3>
                {service.category && (
                  <p className="mt-0.5 text-xs text-slate-400">{service.category.name}</p>
                )}
                {service.description && (
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">{service.description}</p>
                )}

                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <span className="font-semibold text-slate-900">{xaf(service.price)}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDuration(service.duration_minutes)}
                  </span>
                </div>

                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => openForm(service)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                  >
                    <Edit2 size={14} />
                    Modifier
                  </button>
                  <button
                    onClick={() => setDeleting(service)}
                    aria-label={`Supprimer ${service.name}`}
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

      {/* Formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setShowForm(false)} aria-hidden />

          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                {form.id ? 'Modifier la prestation' : 'Nouvelle prestation'}
              </h2>
              <button onClick={() => setShowForm(false)} aria-label="Fermer" className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-600" />
                  <p className="text-xs text-red-700">{formError}</p>
                </div>
              )}

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Nom *</span>
                <input
                  type="text" value={form.name} autoFocus
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Installation d'une fontaine à eau"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Description</span>
                <textarea
                  rows={3} value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ce que comprend la prestation, ce qui en est exclu…"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Tarif (XAF) *</span>
                  <input
                    type="number" min={0} value={form.price}
                    onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Durée (minutes)</span>
                  <input
                    type="number" min={0} step={15} value={form.duration_minutes}
                    onChange={(e) => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="mt-1 block text-xs text-slate-400">
                    {formatDuration(Number(form.duration_minutes) || 0)} — sert au calendrier des réservations.
                  </span>
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Catégorie</span>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sans catégorie</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {categories.length === 0 && (
                  <span className="mt-1 block text-xs text-amber-600">
                    Aucune catégorie de type « service » : créez-en une dans l'écran Catégories.
                  </span>
                )}
              </label>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Visuel</span>
                <div className="flex items-center gap-3">
                  <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {imagePreview ? (
                      <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-300">
                        <ImageIcon size={18} />
                      </div>
                    )}
                  </div>
                  <input
                    type="file" accept="image/*"
                    onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
                    className="text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-medium file:text-slate-700"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50">
                <input
                  type="checkbox" checked={form.is_available}
                  onChange={(e) => setForm(f => ({ ...f, is_available: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900">Visible sur le site</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Décoché, la prestation reste enregistrée mais n'est plus proposée aux visiteurs.
                  </span>
                </span>
              </label>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:bg-slate-300"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {form.id ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setDeleting(null)} aria-hidden />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-slate-900">Supprimer « {deleting.name} » ?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Les réservations déjà enregistrées pour cette prestation seront conservées.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleting(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
    </AdminLayout>
  );
};
