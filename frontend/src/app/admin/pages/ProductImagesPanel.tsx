import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as imagesService from '../../../services/productImages';
import type {
  ImageImportPreview, ImageImportResult, MatchedBy, PendingProduct,
} from '../../../services/productImages';
import { toast } from 'sonner';
import {
  AlertCircle, ArrowLeft, CheckCircle2, Clock, Hash, Image as ImageIcon,
  Loader2, RefreshCw, Tag, Trash2, Type, Upload, X,
} from 'lucide-react';

/**
 * Import d'images en masse — second temps du flux.
 *
 * Le fichier Excel a déclaré les noms de photos attendus ; les fichiers
 * arrivent ici, éventuellement des semaines plus tard, et se rattachent seuls.
 */

const MATCH_LABELS: Record<MatchedBy, { label: string; hint: string; icon: React.ElementType; tone: string }> = {
  filename: {
    label: 'Nom déclaré',
    hint: "Le nom indiqué dans la colonne « image » du fichier Excel",
    icon: Hash,
    tone: 'bg-green-100 text-green-700',
  },
  sku: {
    label: 'Référence',
    hint: 'Le fichier porte le nom de la référence produit',
    icon: Tag,
    tone: 'bg-blue-100 text-blue-700',
  },
  name: {
    label: 'Nom du produit',
    hint: 'Le fichier porte le nom du produit',
    icon: Type,
    tone: 'bg-violet-100 text-violet-700',
  },
};

export const ProductImagesPanel: React.FC = () => {
  const [archive, setArchive] = useState<File | null>(null);
  const [loose, setLoose] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [preview, setPreview] = useState<ImageImportPreview | null>(null);
  const [result, setResult] = useState<ImageImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(true);

  const [pending, setPending] = useState<PendingProduct[]>([]);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [loadingPending, setLoadingPending] = useState(true);
  const [showPending, setShowPending] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);

  const loadPending = useCallback(() => {
    setLoadingPending(true);
    imagesService.fetchPendingImages()
      .then(res => {
        setPending(res?.data ?? []);
        setPendingCount(res?.summary?.awaiting ?? 0);
      })
      .catch(() => { /* la liste est indicative : pas d'alerte bloquante */ })
      .finally(() => setLoadingPending(false));
  }, []);

  useEffect(loadPending, [loadPending]);

  // Un aperçu abandonné laisse des fichiers temporaires côté serveur
  useEffect(() => {
    const token = preview?.token;
    if (!token || result) return;

    const release = () => { void imagesService.discardImages(token).catch(() => {}); };
    window.addEventListener('beforeunload', release);
    return () => window.removeEventListener('beforeunload', release);
  }, [preview?.token, result]);

  const acceptFiles = (files: FileList | File[]) => {
    const next: File[] = [];

    for (const file of Array.from(files)) {
      if (file.name.toLowerCase().endsWith('.zip')) setArchive(file);
      else if (file.type.startsWith('image/')) next.push(file);
      else toast(`Fichier ignoré : ${file.name}`, { icon: '⚠️' });
    }

    if (next.length) setLoose(prev => [...prev, ...next]);
  };

  const reset = () => {
    setArchive(null);
    setLoose([]);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!archive && loose.length === 0) {
      toast('Déposez une archive ZIP ou des images', { icon: '⚠️' });
      return;
    }

    setAnalyzing(true);
    setError(null);
    try {
      setPreview(await imagesService.analyzeImages({ archive, loose }));
    } catch (e: any) {
      setError(e?.data?.message || e?.message || "Les images n'ont pas pu être lues.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCommit = async () => {
    if (!preview) return;

    setCommitting(true);
    setError(null);
    try {
      const outcome = await imagesService.commitImages(preview.token, { replace_existing: replaceExisting });
      setResult(outcome);
      loadPending();

      const total = outcome.attached + outcome.replaced;
      toast(total > 0 ? `${total} image(s) rattachée(s)` : 'Aucune image rattachée', {
        icon: total > 0 ? '✅' : '⚠️',
      });
    } catch (e: any) {
      setError(e?.data?.message || e?.message || "Le rattachement n'a pas abouti.");
    } finally {
      setCommitting(false);
    }
  };

  const handleCancelPreview = async () => {
    if (preview) await imagesService.discardImages(preview.token).catch(() => {});
    reset();
  };

  const attachable = preview
    ? preview.summary.matched - (replaceExisting ? 0 : preview.summary.replacing)
    : 0;

  const expectedNames = useMemo(
    () => pending.map(p => p.expects).filter((n): n is string => !!n),
    [pending],
  );

  const copyExpectedNames = async () => {
    try {
      await navigator.clipboard.writeText(expectedNames.join('\n'));
      toast('Noms de fichiers copiés', { icon: '✅' });
    } catch {
      toast('Copie impossible — sélectionnez la liste manuellement', { icon: '⚠️' });
    }
  };

  // ── Résultat ────────────────────────────────────────

  if (result) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <CheckCircle2 size={40} className="mx-auto text-green-600" />
          <h2 className="mt-4 text-lg font-semibold text-green-900">Rattachement terminé</h2>
          <p className="mt-1 text-sm text-green-700">
            Les images sont visibles immédiatement sur la boutique.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard tone="green" label="Images ajoutées" value={result.attached} />
          <StatCard tone="blue" label="Images remplacées" value={result.replaced} />
          <StatCard tone="slate" label="Ignorées" value={result.skipped} />
          <StatCard tone="red" label="En échec" value={result.failed} />
        </div>

        {result.errors.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-white">
            <div className="border-b border-red-100 bg-red-50 px-4 py-3">
              <p className="text-sm font-semibold text-red-900">{result.errors.length} problème(s)</p>
            </div>
            <ul className="max-h-60 divide-y divide-slate-100 overflow-y-auto">
              {result.errors.map((message, i) => (
                <li key={i} className="px-4 py-2 text-xs text-red-600">{message}</li>
              ))}
            </ul>
          </div>
        )}

        {pendingCount !== null && pendingCount > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <Clock size={18} className="mt-0.5 flex-shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              <strong>{pendingCount} produit(s)</strong> attendent encore leur image. Les noms de fichiers
              sont listés plus bas.
            </p>
          </div>
        )}

        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition hover:bg-blue-700"
        >
          <RefreshCw size={18} />
          Téléverser d'autres images
        </button>

        <PendingList
          pending={pending}
          loading={loadingPending}
          count={pendingCount}
          expanded={showPending}
          onToggle={() => setShowPending(v => !v)}
          onCopy={copyExpectedNames}
        />
      </div>
    );
  }

  // ── Aperçu ──────────────────────────────────────────

  if (preview) {
    return (
      <div className="space-y-6">
        {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard tone="slate" label="Fichiers déposés" value={preview.summary.uploaded} />
          <StatCard tone="green" label="Rattachements" value={preview.summary.matched} />
          <StatCard tone="blue" label="Remplacements" value={preview.summary.replacing} />
          <StatCard tone="amber" label="Sans correspondance" value={preview.summary.unmatched} />
        </div>

        {preview.summary.replacing > 0 && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50">
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>
              <span className="block text-sm font-medium text-slate-900">
                Remplacer les images existantes
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {preview.summary.replacing} produit(s) ont déjà une photo. Décoché, ils sont laissés
                tels quels et seuls les produits sans image reçoivent la leur.
              </span>
            </span>
          </label>
        )}

        {preview.warnings.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold text-amber-900">
              {preview.warnings.length} avertissement(s)
            </p>
            <ul className="mt-2 space-y-1">
              {preview.warnings.map((w, i) => (
                <li key={i} className="text-xs text-amber-800">— {w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Rattachements */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              Rattachements prévus
              <span className="ml-2 text-xs font-normal text-slate-500">
                {preview.summary.matched} fichier(s)
              </span>
            </p>
          </div>

          {preview.matches.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-slate-400">
              Aucun fichier ne correspond à un produit. Vérifiez les noms attendus plus bas.
            </p>
          ) : (
            <div className="max-h-96 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-600">
                    <th className="px-4 py-3">Fichier</th>
                    <th className="px-4 py-3">Produit</th>
                    <th className="px-4 py-3">Rattaché par</th>
                    <th className="px-4 py-3 text-center">Effet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.matches.map(match => {
                    const meta = MATCH_LABELS[match.matched_by];
                    const Icon = meta.icon;

                    return (
                      <tr key={`${match.product_id}-${match.file}`} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <code className="text-xs text-slate-700">{match.file}</code>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-900">{match.name}</p>
                          {match.sku && <p className="text-xs text-slate-400">{match.sku}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            title={meta.hint}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.tone}`}
                          >
                            <Icon size={11} />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {match.replaces ? (
                            <span className={`text-xs font-medium ${replaceExisting ? 'text-blue-700' : 'text-slate-400'}`}>
                              {replaceExisting ? 'Remplace la photo' : 'Ignoré'}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-green-700">Nouvelle photo</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Fichiers sans correspondance */}
        {preview.unmatched.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">
              {preview.unmatched.length} fichier(s) sans correspondance
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Renommez-les avec la référence du produit, ou corrigez la colonne « image » de votre
              fichier Excel.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {preview.unmatched.map(file => (
                <code key={file} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                  {file}
                </code>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCommit}
            disabled={committing || attachable === 0}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {committing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            {committing ? 'Rattachement…' : `Rattacher ${attachable} image(s)`}
          </button>
          <button
            onClick={handleCancelPreview}
            disabled={committing}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <ArrowLeft size={18} />
            Changer de fichiers
          </button>
        </div>

        <PendingList
          pending={preview.pending}
          loading={false}
          count={preview.summary.pending}
          expanded={showPending}
          onToggle={() => setShowPending(v => !v)}
          onCopy={copyExpectedNames}
        />
      </div>
    );
  }

  // ── Dépôt ───────────────────────────────────────────

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.length) acceptFiles(e.dataTransfer.files); }}
            onClick={() => fileInput.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${
              dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInput}
              type="file"
              multiple
              accept=".zip,image/*"
              className="hidden"
              onChange={(e) => { if (e.target.files) acceptFiles(e.target.files); e.target.value = ''; }}
            />
            <Upload size={36} className="mx-auto text-blue-500" />
            <p className="mt-4 text-sm font-semibold text-slate-900">
              Glissez ici toutes vos photos produit
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Une archive .zip, ou les images directement (jpg, png, webp) — 1000 fichiers maximum
            </p>
          </div>

          <div className="space-y-3">
            {archive && (
              <FileChip
                icon={<ImageIcon size={18} className="text-violet-600" />}
                title={archive.name}
                subtitle={`${(archive.size / 1024 / 1024).toFixed(1)} Mo — archive de photos`}
                onRemove={() => setArchive(null)}
              />
            )}
            {loose.length > 0 && (
              <FileChip
                icon={<ImageIcon size={18} className="text-violet-600" />}
                title={`${loose.length} image(s)`}
                subtitle={loose.slice(0, 4).map(f => f.name).join(', ') + (loose.length > 4 ? '…' : '')}
                onRemove={() => setLoose([])}
              />
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || (!archive && loose.length === 0)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {analyzing ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
            {analyzing ? 'Analyse des fichiers…' : 'Analyser les images'}
          </button>
        </div>

        <aside className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
          <h3 className="text-sm font-semibold text-blue-900">Comment ça marche</h3>
          <ol className="mt-3 space-y-3 text-xs leading-relaxed text-blue-800">
            <li>
              <span className="font-semibold">1. Dans votre fichier Excel</span>, la colonne
              « image » porte le nom de la photo : <code className="rounded bg-white/70 px-1">RTW-B15.jpg</code>.
              Les photos n'ont pas besoin d'être prêtes à ce moment-là.
            </li>
            <li>
              <span className="font-semibold">2. Plus tard, ici</span>, vous déposez toutes les
              photos d'un coup. Chaque fichier retrouve son produit par son nom.
            </li>
            <li>
              <span className="font-semibold">3. Les images s'affichent</span> aussitôt sur la
              boutique, redimensionnées et converties en WebP.
            </li>
          </ol>

          <p className="mt-4 border-t border-blue-200 pt-3 text-xs text-blue-700">
            Un fichier dont le nom ne figure pas dans l'Excel est quand même rattaché s'il porte la
            référence du produit ou son nom.
          </p>
        </aside>
      </div>

      <PendingList
        pending={pending}
        loading={loadingPending}
        count={pendingCount}
        expanded={showPending}
        onToggle={() => setShowPending(v => !v)}
        onCopy={copyExpectedNames}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════

const PendingList: React.FC<{
  pending: PendingProduct[];
  loading: boolean;
  count: number | null;
  expanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
}> = ({ pending, loading, count, expanded, onToggle, onCopy }) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-400">
        <Loader2 size={16} className="mr-2 inline animate-spin" />
        Vérification des produits en attente…
      </div>
    );
  }

  if (!count) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
        <CheckCircle2 size={16} className="flex-shrink-0 text-green-600" />
        <p className="text-sm text-green-800">
          Aucun produit n'attend d'image. Tout ce que votre fichier Excel a déclaré est en place.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-amber-200 bg-white">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-amber-50"
      >
        <span className="flex items-center gap-2">
          <Clock size={16} className="flex-shrink-0 text-amber-600" />
          <span className="text-sm font-semibold text-slate-900">
            {count} produit(s) attendent une image
          </span>
        </span>
        <span className="text-xs font-medium text-amber-700">
          {expanded ? 'Masquer' : 'Voir les noms de fichiers'}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-amber-100">
          <div className="flex items-center justify-between gap-3 bg-amber-50/60 px-5 py-3">
            <p className="text-xs text-amber-800">
              Nommez vos photos exactement comme ci-dessous. L'extension peut différer :
              <code className="mx-1 rounded bg-white/70 px-1">RTW-B15.png</code> répond à
              <code className="mx-1 rounded bg-white/70 px-1">RTW-B15.jpg</code>.
            </p>
            <button
              onClick={onCopy}
              className="flex-shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-50"
            >
              Copier la liste
            </button>
          </div>

          <div className="max-h-72 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-600">
                  <th className="px-5 py-2.5">Produit</th>
                  <th className="px-5 py-2.5">Référence</th>
                  <th className="px-5 py-2.5">Fichier attendu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pending.map(p => (
                  <tr key={p.product_id} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 text-sm text-slate-900">{p.name}</td>
                    <td className="px-5 py-2.5 text-xs text-slate-500">{p.sku ?? '—'}</td>
                    <td className="px-5 py-2.5">
                      <code className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                        {p.expects}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const TONES = {
  slate: 'from-slate-50 to-slate-100 border-slate-200 text-slate-600 text-slate-900',
  green: 'from-green-50 to-green-100 border-green-200 text-green-600 text-green-900',
  blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-600 text-blue-900',
  amber: 'from-amber-50 to-amber-100 border-amber-200 text-amber-600 text-amber-900',
  red: 'from-red-50 to-red-100 border-red-200 text-red-600 text-red-900',
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
  <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
    <span className="flex-shrink-0">{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-slate-900">{title}</p>
      <p className="truncate text-xs text-slate-500">{subtitle}</p>
    </div>
    <button
      onClick={(e) => { e.stopPropagation(); onRemove(); }}
      aria-label={`Retirer ${title}`}
      className="flex-shrink-0 text-slate-400 transition hover:text-red-600"
    >
      <Trash2 size={16} />
    </button>
  </div>
);

const ErrorBanner: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
    <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-red-600" />
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-red-900">Import impossible</p>
      <p className="mt-1 text-sm text-red-700">{message}</p>
    </div>
    <button onClick={onClose} aria-label="Fermer" className="text-red-400 hover:text-red-600">
      <X size={18} />
    </button>
  </div>
);
