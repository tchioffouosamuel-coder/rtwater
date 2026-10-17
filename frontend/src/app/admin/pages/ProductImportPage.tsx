import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import * as importService from '../../../services/productImport';
import type { ImportPreview, ImportRecord, ImportRow } from '../../../services/productImport';
import { toast } from 'sonner';
import {
  AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Clock, Download, FileSpreadsheet,
  History, Image as ImageIcon, Link2, Loader2, Package, RefreshCw, Trash2,
  Upload, X, XCircle,
} from 'lucide-react';
import { ProductImagesPanel } from './ProductImagesPanel';
import { fetchPendingImages } from '../../../services/productImages';

type Step = 'upload' | 'preview' | 'done';

/** Les deux temps du flux : le catalogue d'abord, les photos ensuite. */
type Mode = 'catalogue' | 'images';

/** Libellés français des colonnes reconnues, pour l'écran de correspondance. */
const FIELD_LABELS: Record<string, string> = {
  name: 'Nom du produit',
  sku: 'Référence (SKU)',
  description: 'Description',
  price: 'Prix de vente',
  cost: "Prix d'achat",
  stock: 'Stock',
  min_quantity: "Seuil d'alerte",
  max_quantity: 'Stock maximum',
  location: 'Emplacement',
  category: 'Catégorie',
  image: 'Image',
  is_available: 'Disponible',
};

const IMAGE_SOURCE_LABELS: Record<ImportRow['image']['source'], string> = {
  archive: 'Fichier téléversé',
  url: 'Téléchargée depuis une URL',
  existing: 'Déjà en bibliothèque',
  none: 'Aucune image',
};

const xaf = (value: number | null) =>
  value === null ? '—' : `${Number(value).toLocaleString('fr-FR')} XAF`;

export const ProductImportPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAdminAuth();

  const [mode, setMode] = useState<Mode>('catalogue');
  // Compteur affiche sur l'onglet Images : signale qu'il reste des photos a fournir
  const [awaitingImages, setAwaitingImages] = useState<number | null>(null);

  const [step, setStep] = useState<Step>('upload');
  const [sheet, setSheet] = useState<File | null>(null);
  const [archive, setArchive] = useState<File | null>(null);
  const [looseImages, setLooseImages] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rowFilter, setRowFilter] = useState<'all' | 'create' | 'update' | 'error'>('all');

  const [options, setOptions] = useState({
    update_existing: true,
    create_categories: true,
    allow_remote_images: true,
  });

  const [history, setHistory] = useState<ImportRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const sheetInput = useRef<HTMLInputElement>(null);

  const loadHistory = useCallback(() => {
    importService.fetchImportHistory()
      .then(res => setHistory(res?.data ?? []))
      .catch(() => { /* le journal est secondaire : on n'alerte pas */ });
  }, []);

  useEffect(loadHistory, [loadHistory]);

  // Nombre de produits en attente d'image, relu apres chaque import de catalogue
  const refreshAwaiting = useCallback(() => {
    fetchPendingImages()
      .then(res => setAwaitingImages(res?.summary?.awaiting ?? 0))
      .catch(() => { /* indicatif : pas d'alerte */ });
  }, []);

  useEffect(refreshAwaiting, [refreshAwaiting]);

  // Un aperçu abandonné laisse des fichiers temporaires côté serveur
  useEffect(() => {
    const token = preview?.token;
    if (!token || step !== 'preview') return;

    const release = () => { void importService.discardImport(token).catch(() => {}); };
    window.addEventListener('beforeunload', release);
    return () => window.removeEventListener('beforeunload', release);
  }, [preview?.token, step]);

  const filteredRows = useMemo(() => {
    if (!preview) return [];
    return rowFilter === 'all' ? preview.rows : preview.rows.filter(r => r.action === rowFilter);
  }, [preview, rowFilter]);

  if (!hasPermission('manage_products')) {
    return (
      <AdminLayout title="Import de produits">
        <div className="text-center py-12">
          <p className="text-red-600 font-semibold">Accès refusé</p>
        </div>
      </AdminLayout>
    );
  }

  // ── Fichiers ────────────────────────────────────────

  const acceptFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    const nextLoose: File[] = [];

    for (const file of list) {
      const name = file.name.toLowerCase();
      if (/\.(xlsx|xls|csv)$/.test(name)) setSheet(file);
      else if (name.endsWith('.zip')) setArchive(file);
      else if (file.type.startsWith('image/')) nextLoose.push(file);
      else toast(`Fichier ignoré : ${file.name}`, { icon: '⚠️' });
    }

    if (nextLoose.length) setLooseImages(prev => [...prev, ...nextLoose]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) acceptFiles(e.dataTransfer.files);
  };

  const resetAll = () => {
    setStep('upload');
    setSheet(null);
    setArchive(null);
    setLooseImages([]);
    setPreview(null);
    setResult(null);
    setError(null);
    setRowFilter('all');
  };

  // ── Actions ─────────────────────────────────────────

  const handleTemplate = async () => {
    try {
      await importService.downloadTemplate();
    } catch {
      toast('Téléchargement du modèle impossible', { icon: '⚠️' });
    }
  };

  const handleAnalyze = async () => {
    if (!sheet) {
      toast('Sélectionnez d’abord un fichier Excel ou CSV', { icon: '⚠️' });
      return;
    }

    setAnalyzing(true);
    setError(null);
    try {
      const data = await importService.analyzeImport(sheet, { archive, loose: looseImages });
      setPreview(data);
      setStep('preview');
      setRowFilter(data.summary.error > 0 && data.summary.error === data.summary.total ? 'error' : 'all');
    } catch (e: any) {
      setError(e?.data?.message || e?.message || "Le fichier n'a pas pu être lu.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCommit = async () => {
    if (!preview) return;

    setCommitting(true);
    setError(null);
    try {
      const record = await importService.commitImport(preview.token, options);
      setResult(record);
      setStep('done');
      loadHistory();
      refreshAwaiting();
      toast(`${record.created_count} création(s), ${record.updated_count} mise(s) à jour`, { icon: '✅' });
    } catch (e: any) {
      setError(e?.data?.message || e?.message || "L'import n'a pas abouti.");
    } finally {
      setCommitting(false);
    }
  };

  const handleCancelPreview = async () => {
    if (preview) await importService.discardImport(preview.token).catch(() => {});
    resetAll();
  };

  // ── Rendu ───────────────────────────────────────────

  const importable = preview
    ? preview.summary.create + (options.update_existing ? preview.summary.update : 0)
    : 0;

  return (
    <AdminLayout
      title="Import massif de produits"
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Produits', path: '/admin/products' },
        { label: 'Import Excel' },
      ]}
    >
      {/* Les deux temps de l'import */}
      <div className="mb-6 flex gap-2 border-b border-ink-200">
        <button
          onClick={() => setMode('catalogue')}
          className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
            mode === 'catalogue'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-ink-500 hover:text-ink-800'
          }`}
        >
          <FileSpreadsheet size={16} />
          Catalogue (Excel)
        </button>
        <button
          onClick={() => setMode('images')}
          className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
            mode === 'images'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-ink-500 hover:text-ink-800'
          }`}
        >
          <ImageIcon size={16} />
          Images
          {!!awaitingImages && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              <Clock size={10} />
              {awaitingImages}
            </span>
          )}
        </button>
      </div>

      {mode === 'images' ? (
        <ProductImagesPanel />
      ) : (
      <>
      <Stepper step={step} />

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-red-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-900">Import impossible</p>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X size={18} />
          </button>
        </div>
      )}

      {/* ══ ÉTAPE 1 — DÉPÔT DES FICHIERS ══ */}
      {step === 'upload' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => sheetInput.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${
                dragging ? 'border-brand-500 bg-brand-50' : 'border-ink-300 bg-white hover:border-brand-400 hover:bg-ink-50'
              }`}
            >
              <input
                ref={sheetInput}
                type="file"
                multiple
                accept=".xlsx,.xls,.csv,.zip,image/*"
                className="hidden"
                onChange={(e) => { if (e.target.files) acceptFiles(e.target.files); e.target.value = ''; }}
              />
              <Upload size={36} className="mx-auto text-brand-500" />
              <p className="mt-4 text-sm font-semibold text-ink-900">
                Glissez votre fichier Excel ici, avec vos images
              </p>
              <p className="mt-1 text-xs text-ink-500">
                .xlsx, .xls ou .csv — et une archive .zip ou des images isolées (jpg, png, webp)
              </p>
            </div>

            {/* Fichiers retenus */}
            <div className="space-y-3">
              {sheet && (
                <FileChip
                  icon={<FileSpreadsheet size={18} className="text-emerald-600" />}
                  title={sheet.name}
                  subtitle={`${(sheet.size / 1024).toFixed(0)} Ko — catalogue à importer`}
                  onRemove={() => setSheet(null)}
                />
              )}
              {archive && (
                <FileChip
                  icon={<ImageIcon size={18} className="text-violet-600" />}
                  title={archive.name}
                  subtitle={`${(archive.size / 1024 / 1024).toFixed(1)} Mo — archive d'images`}
                  onRemove={() => setArchive(null)}
                />
              )}
              {looseImages.length > 0 && (
                <FileChip
                  icon={<ImageIcon size={18} className="text-violet-600" />}
                  title={`${looseImages.length} image(s) isolée(s)`}
                  subtitle={looseImages.slice(0, 4).map(f => f.name).join(', ') + (looseImages.length > 4 ? '…' : '')}
                  onRemove={() => setLooseImages([])}
                />
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAnalyze}
                disabled={!sheet || analyzing}
                className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-ink-300"
              >
                {analyzing ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                {analyzing ? 'Analyse du fichier…' : "Analyser le fichier"}
              </button>
              <button
                onClick={handleTemplate}
                className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-6 py-2.5 font-medium text-ink-700 transition hover:bg-ink-50"
              >
                <Download size={18} />
                Télécharger le modèle
              </button>
            </div>
          </div>

          {/* Mode d'emploi du référencement automatique */}
          <aside className="rounded-xl border border-brand-100 bg-brand-50/60 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-900">
              <ImageIcon size={16} />
              Référencement automatique des images
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-brand-800">
              Trois façons de rattacher une image à un produit, dans cet ordre :
            </p>
            <ol className="mt-3 space-y-3 text-xs leading-relaxed text-brand-800">
              <li>
                <span className="font-semibold">Colonne « image » = nom de fichier.</span> Le fichier
                est cherché dans l'archive ZIP ou les images téléversées.
              </li>
              <li>
                <span className="font-semibold">Colonne « image » = URL https.</span> L'image est
                téléchargée automatiquement depuis le web.
              </li>
              <li>
                <span className="font-semibold">Colonne « image » vide.</span> Le système cherche seul
                un fichier nommé comme la référence (<code className="rounded bg-white/70 px-1">RTW-B15.jpg</code>)
                ou comme le produit (<code className="rounded bg-white/70 px-1">bidon-10-l.png</code>).
                Les suffixes <code className="rounded bg-white/70 px-1">-1</code> / <code className="rounded bg-white/70 px-1">_1</code> sont acceptés.
              </li>
            </ol>
            <p className="mt-4 border-t border-brand-200 pt-3 text-xs text-brand-700">
              Toutes les images sont redimensionnées et converties en WebP : les fiches produit restent
              rapides même en 3G.
            </p>
          </aside>
        </div>
      )}

      {/* ══ ÉTAPE 2 — APERÇU ══ */}
      {step === 'preview' && preview && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatCard tone="slate" label="Lignes lues" value={preview.summary.total} />
            <StatCard tone="green" label="À créer" value={preview.summary.create} />
            <StatCard tone="blue" label="À mettre à jour" value={preview.summary.update} />
            <StatCard tone="red" label="En erreur" value={preview.summary.error} />
            <StatCard tone="violet" label="Images rattachées" value={preview.summary.images} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Correspondance des colonnes */}
            <div className="rounded-xl border border-ink-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-ink-900">Colonnes reconnues</h3>
              <p className="mt-1 text-xs text-ink-500">{preview.filename}</p>
              <ul className="mt-4 space-y-2">
                {Object.keys(preview.mapping).map(field => (
                  <li key={field} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 size={14} className="flex-shrink-0 text-green-600" />
                    <span className="text-ink-700">{FIELD_LABELS[field] ?? field}</span>
                  </li>
                ))}
              </ul>
              {preview.unmapped.length > 0 && (
                <>
                  <p className="mt-4 text-xs font-semibold text-ink-500">Colonnes ignorées</p>
                  <ul className="mt-2 space-y-1">
                    {preview.unmapped.map(label => (
                      <li key={label} className="text-xs text-ink-400">— {label}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Options */}
            <div className="rounded-xl border border-ink-200 bg-white p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold text-ink-900">Options d'import</h3>
              <div className="mt-4 space-y-3">
                <Toggle
                  checked={options.update_existing}
                  onChange={(v) => setOptions(o => ({ ...o, update_existing: v }))}
                  label="Mettre à jour les produits existants"
                  hint={`${preview.summary.update} ligne(s) correspondent à un produit déjà enregistré. Décoché, elles sont ignorées.`}
                />
                <Toggle
                  checked={options.create_categories}
                  onChange={(v) => setOptions(o => ({ ...o, create_categories: v }))}
                  label="Créer les catégories absentes"
                  hint={
                    preview.summary.new_categories.length
                      ? `À créer : ${preview.summary.new_categories.join(', ')}`
                      : 'Aucune nouvelle catégorie dans ce fichier.'
                  }
                />
                <Toggle
                  checked={options.allow_remote_images}
                  onChange={(v) => setOptions(o => ({ ...o, allow_remote_images: v }))}
                  label="Télécharger les images depuis leur URL"
                  hint="Concerne les lignes dont la colonne image contient une adresse https."
                />
              </div>

              {preview.warnings.length > 0 && (
                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-900">
                    {preview.warnings.length} avertissement(s)
                  </p>
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
                    {preview.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-amber-800">— {w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Détail ligne par ligne */}
          <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
            <div className="flex flex-wrap items-center gap-2 border-b border-ink-200 bg-ink-50 px-4 py-3">
              {([
                ['all', `Toutes (${preview.summary.total})`],
                ['create', `Créations (${preview.summary.create})`],
                ['update', `Mises à jour (${preview.summary.update})`],
                ['error', `Erreurs (${preview.summary.error})`],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setRowFilter(key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    rowFilter === key ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 hover:bg-ink-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="max-h-[28rem] overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-ink-50">
                  <tr className="border-b border-ink-200 text-left text-xs font-semibold text-ink-600">
                    <th className="px-4 py-3">Ligne</th>
                    <th className="px-4 py-3">Produit</th>
                    <th className="px-4 py-3">Catégorie</th>
                    <th className="px-4 py-3 text-right">Prix</th>
                    <th className="px-4 py-3 text-center">Stock</th>
                    <th className="px-4 py-3">Image</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {filteredRows.map(row => (
                    <tr key={row.line} className={row.action === 'error' ? 'bg-red-50/60' : 'hover:bg-ink-50'}>
                      <td className="px-4 py-3 text-xs text-ink-400">{row.line}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-ink-900">{row.product.name || <em className="text-red-600">nom manquant</em>}</p>
                        {row.product.sku && <p className="text-xs text-ink-400">{row.product.sku}</p>}
                        {row.errors.length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {row.errors.map((msg, i) => (
                              <li key={i} className="text-xs text-red-600">{msg}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {row.category.status === 'none' && <span className="text-ink-400">—</span>}
                        {row.category.status === 'known' && <span className="text-ink-600">{row.category.name}</span>}
                        {row.category.status === 'new' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                            {row.category.name} · nouvelle
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-ink-900">{xaf(row.product.price)}</td>
                      <td className="px-4 py-3 text-center text-sm text-ink-700">
                        {row.product.stock ?? <span className="text-ink-300">inchangé</span>}
                      </td>
                      <td className="px-4 py-3">
                        <ImageBadge source={row.image.source} ref_={row.image.ref} />
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge action={row.action} existing={row.existing} skipped={row.action === 'update' && !options.update_existing} />
                      </td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-sm text-ink-400">
                        Aucune ligne dans cette catégorie.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCommit}
              disabled={committing || importable === 0}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-ink-300"
            >
              {committing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              {committing ? 'Import en cours…' : `Importer ${importable} produit(s)`}
            </button>
            <button
              onClick={handleCancelPreview}
              disabled={committing}
              className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-6 py-2.5 font-medium text-ink-700 transition hover:bg-ink-50 disabled:opacity-50"
            >
              <ArrowLeft size={18} />
              Changer de fichier
            </button>
            {preview.summary.error > 0 && (
              <p className="text-xs text-ink-500">
                Les {preview.summary.error} ligne(s) en erreur seront ignorées — corrigez-les et relancez un import.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ══ ÉTAPE 3 — RÉSULTAT ══ */}
      {step === 'done' && result && (
        <div className="space-y-6">
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <CheckCircle2 size={40} className="mx-auto text-green-600" />
            <h2 className="mt-4 text-lg font-semibold text-green-900">Import terminé</h2>
            <p className="mt-1 text-sm text-green-700">{result.filename}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatCard tone="green" label="Produits créés" value={result.created_count} />
            <StatCard tone="blue" label="Mis à jour" value={result.updated_count} />
            <StatCard tone="slate" label="Ignorés" value={result.skipped_count} />
            <StatCard tone="red" label="En échec" value={result.failed_count} />
            <StatCard tone="violet" label="Images rattachées" value={result.images_count} />
          </div>

          {result.errors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-white">
              <div className="border-b border-red-100 bg-red-50 px-4 py-3">
                <p className="text-sm font-semibold text-red-900">
                  {result.errors.length} ligne(s) non importée(s)
                </p>
              </div>
              <ul className="max-h-72 divide-y divide-ink-100 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <li key={i} className="px-4 py-3">
                    <p className="text-sm font-medium text-ink-900">
                      Ligne {err.line}{err.name ? ` — ${err.name}` : ''}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {err.messages.map((msg, j) => (
                        <li key={j} className="text-xs text-red-600">{msg}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/admin/products')}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 font-medium text-white transition hover:bg-brand-700"
            >
              <Package size={18} />
              Voir le catalogue
            </button>
            <button
              onClick={resetAll}
              className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-6 py-2.5 font-medium text-ink-700 transition hover:bg-ink-50"
            >
              <RefreshCw size={18} />
              Importer un autre fichier
            </button>
          </div>
        </div>
      )}

      </>
      )}

      {/* ══ JOURNAL DES IMPORTS ══ */}
      <div className="mt-8 overflow-hidden rounded-xl border border-ink-200 bg-white">
        <button
          onClick={() => setShowHistory(v => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-ink-50"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <History size={16} className="text-ink-400" />
            Historique des imports
            {history.length > 0 && (
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-600">
                {history.length}
              </span>
            )}
          </span>
          <ArrowRight size={16} className={`text-ink-400 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
        </button>

        {showHistory && (
          <div className="border-t border-ink-200">
            {history.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-400">Aucun import enregistré.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-ink-50">
                    <tr className="text-left text-xs font-semibold text-ink-600">
                      <th className="px-5 py-3">Fichier</th>
                      <th className="px-5 py-3">Par</th>
                      <th className="px-5 py-3 text-center">Créés</th>
                      <th className="px-5 py-3 text-center">Mis à jour</th>
                      <th className="px-5 py-3 text-center">Échecs</th>
                      <th className="px-5 py-3 text-center">Images</th>
                      <th className="px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {history.map(record => (
                      <tr key={record.id} className="hover:bg-ink-50">
                        <td className="px-5 py-3 text-sm text-ink-900">{record.filename}</td>
                        <td className="px-5 py-3 text-xs text-ink-500">{record.user ?? '—'}</td>
                        <td className="px-5 py-3 text-center text-sm font-medium text-green-700">{record.created_count}</td>
                        <td className="px-5 py-3 text-center text-sm font-medium text-brand-700">{record.updated_count}</td>
                        <td className="px-5 py-3 text-center text-sm font-medium text-red-700">{record.failed_count}</td>
                        <td className="px-5 py-3 text-center text-sm text-violet-700">{record.images_count}</td>
                        <td className="px-5 py-3 text-xs text-ink-500">
                          {record.created_at ? new Date(record.created_at).toLocaleString('fr-FR') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

// ═══════════════════════════════════════════════════
// Sous-composants
// ═══════════════════════════════════════════════════

const Stepper: React.FC<{ step: Step }> = ({ step }) => {
  const steps: Array<{ key: Step; label: string }> = [
    { key: 'upload', label: 'Fichier & images' },
    { key: 'preview', label: 'Vérification' },
    { key: 'done', label: 'Résultat' },
  ];
  const current = steps.findIndex(s => s.key === step);

  return (
    <div className="mb-6 flex items-center gap-2 overflow-x-auto">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className="flex flex-shrink-0 items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                i < current ? 'bg-green-100 text-green-700'
                  : i === current ? 'bg-brand-600 text-white'
                  : 'bg-ink-100 text-ink-400'
              }`}
            >
              {i < current ? '✓' : i + 1}
            </span>
            <span className={`whitespace-nowrap text-sm ${i === current ? 'font-semibold text-ink-900' : 'text-ink-400'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && <div className="h-px min-w-6 flex-1 bg-ink-200" />}
        </React.Fragment>
      ))}
    </div>
  );
};

const TONES = {
  slate: 'from-ink-50 to-ink-100 border-ink-200 text-ink-600 text-ink-900',
  green: 'from-green-50 to-green-100 border-green-200 text-green-600 text-green-900',
  blue: 'from-brand-50 to-brand-100 border-brand-200 text-brand-600 text-brand-900',
  red: 'from-red-50 to-red-100 border-red-200 text-red-600 text-red-900',
  violet: 'from-violet-50 to-violet-100 border-violet-200 text-violet-600 text-violet-900',
} as const;

const StatCard: React.FC<{ tone: keyof typeof TONES; label: string; value: number }> = ({ tone, label, value }) => {
  const [from, to, border, labelColor, valueColor] = TONES[tone].split(' ');

  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${from} ${to} ${border}`}>
      <p className={`text-xs font-medium ${labelColor}`}>{label}</p>
      <p className={`mt-2 text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
};

const FileChip: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onRemove: () => void;
}> = ({ icon, title, subtitle, onRemove }) => (
  <div className="flex items-center gap-3 rounded-lg border border-ink-200 bg-white px-4 py-3">
    <span className="flex-shrink-0">{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-ink-900">{title}</p>
      <p className="truncate text-xs text-ink-500">{subtitle}</p>
    </div>
    <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="flex-shrink-0 text-ink-400 hover:text-red-600">
      <Trash2 size={16} />
    </button>
  </div>
);

const Toggle: React.FC<{
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint: string;
}> = ({ checked, onChange, label, hint }) => (
  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-ink-100 p-3 transition hover:bg-ink-50">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
    />
    <span className="min-w-0">
      <span className="block text-sm font-medium text-ink-900">{label}</span>
      <span className="mt-0.5 block text-xs text-ink-500">{hint}</span>
    </span>
  </label>
);

const ImageBadge: React.FC<{ source: ImportRow['image']['source']; ref_: string | null }> = ({ source, ref_ }) => {
  if (source === 'none') {
    return <span className="text-xs text-ink-300">—</span>;
  }

  const icon = source === 'url' ? <Link2 size={12} /> : <ImageIcon size={12} />;
  const tone = source === 'url' ? 'bg-aqua-100 text-aqua-700' : 'bg-violet-100 text-violet-700';

  return (
    <span
      title={`${IMAGE_SOURCE_LABELS[source]}${ref_ ? ` : ${ref_}` : ''}`}
      className={`inline-flex max-w-[11rem] items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}
    >
      {icon}
      <span className="truncate">{ref_ ?? IMAGE_SOURCE_LABELS[source]}</span>
    </span>
  );
};

const ActionBadge: React.FC<{
  action: ImportRow['action'];
  existing: ImportRow['existing'];
  skipped: boolean;
}> = ({ action, existing, skipped }) => {
  if (action === 'error') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        <XCircle size={12} /> Rejetée
      </span>
    );
  }

  if (action === 'update') {
    return skipped ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-500">
        Ignorée
      </span>
    ) : (
      <span
        title={existing ? `Remplace « ${existing.name} » (stock actuel : ${existing.stock})` : undefined}
        className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700"
      >
        <RefreshCw size={12} /> Mise à jour
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      <CheckCircle2 size={12} /> Création
    </span>
  );
};
