import { useState } from "react";
import { Download, ExternalLink, FileText, Loader2, Maximize2, X } from "lucide-react";
import type { ProductDatasheet as Datasheet } from "../../lib/product";
import { useI18n } from "../../i18n/I18nContext";

/**
 * Fiche technique d'un produit, sous l'une de trois formes.
 *
 * Chaque forme a ses contraintes propres :
 *  — texte : saisi ligne par ligne dans le backoffice, rendu tel quel ;
 *  — image : un tableau de caractéristiques, donc agrandissable, sinon illisible ;
 *  — PDF : affiché en ligne quand le navigateur sait le faire, téléchargeable sinon.
 */
export function ProductDatasheet({ datasheet }: { datasheet: Datasheet | null }) {
  const { tx } = useI18n();

  if (!datasheet) return null;

  return (
    <section className="mt-10 border-t border-gray-200 pt-8 dark:border-slate-700">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
        <FileText className="h-5 w-5 text-[#0077BE]" />
        {tx("Fiche technique", "Technical datasheet")}
      </h2>

      {datasheet.type === "text" && <DatasheetText text={datasheet.text} />}
      {datasheet.type === "image" && <DatasheetImage datasheet={datasheet} />}
      {datasheet.type === "pdf" && <DatasheetPdf datasheet={datasheet} />}
    </section>
  );
}

// ═══════════════════════════════════════════════════

/**
 * Texte saisi dans le backoffice.
 *
 * Les lignes de la forme « Débit : 10 L/min » sont rendues en tableau de
 * caractéristiques — c'est la façon dont elles sont effectivement saisies. Les
 * autres lignes restent du paragraphe.
 */
function DatasheetText({ text }: { text: string | null }) {
  if (!text?.trim()) return null;

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Le séparateur doit porter du contenu des deux côtés, sinon « Note : » seul
  // produirait une ligne de tableau vide.
  const rows = lines.map((line) => {
    const match = line.match(/^(.{1,60}?)\s*:\s*(.+)$/);
    return match ? { label: match[1], value: match[2] } : null;
  });

  const pairCount = rows.filter(Boolean).length;
  const asTable = pairCount >= 2 && pairCount >= lines.length / 2;

  if (!asTable) {
    return (
      <div className="space-y-2 leading-relaxed text-gray-700 dark:text-gray-300">
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    );
  }

  return (
    <dl className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
      {rows.map((row, i) =>
        row ? (
          <div
            key={i}
            className="flex flex-col gap-0.5 border-b border-gray-100 px-4 py-2.5 last:border-0 even:bg-gray-50/60 dark:border-slate-700/60 dark:even:bg-slate-800/40 sm:flex-row sm:gap-4"
          >
            <dt className="text-sm font-medium text-gray-500 sm:w-2/5 sm:flex-shrink-0 dark:text-gray-400">
              {row.label}
            </dt>
            <dd className="text-sm text-gray-900 dark:text-gray-100">{row.value}</dd>
          </div>
        ) : (
          <p
            key={i}
            className="border-b border-gray-100 px-4 py-2.5 text-sm text-gray-700 last:border-0 dark:border-slate-700/60 dark:text-gray-300"
          >
            {lines[i]}
          </p>
        ),
      )}
    </dl>
  );
}

// ═══════════════════════════════════════════════════

/** Image agrandissable : un tableau de caractéristiques en vignette est illisible. */
function DatasheetImage({ datasheet }: { datasheet: Datasheet }) {
  const { tx } = useI18n();
  const [zoomed, setZoomed] = useState(false);

  if (!datasheet.url) return null;

  const label = tx("Agrandir la fiche technique", "Enlarge the datasheet");

  return (
    <>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        aria-label={label}
        className="group relative block w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800"
      >
        <img
          src={datasheet.url}
          alt={tx("Fiche technique du produit", "Product technical datasheet")}
          loading="lazy"
          className="w-full object-contain"
        />
        <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 size={12} />
          {tx("Agrandir", "Enlarge")}
        </span>
      </button>

      <a
        href={datasheet.url}
        download={datasheet.filename ?? undefined}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#0077BE] hover:underline dark:text-[#00A8E8]"
      >
        <Download size={14} />
        {tx("Télécharger l'image", "Download the image")}
      </a>

      {zoomed && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomed(false)}
          role="dialog"
          aria-modal="true"
          aria-label={tx("Fiche technique agrandie", "Enlarged datasheet")}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label={tx("Fermer", "Close")}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <X size={20} />
          </button>
          <img
            src={datasheet.url}
            alt={tx("Fiche technique du produit", "Product technical datasheet")}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full cursor-default object-contain"
          />
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════

/**
 * PDF. L'aperçu intégré n'est pas garanti — plusieurs navigateurs mobiles
 * refusent d'afficher un PDF en `<object>` — donc le lien de téléchargement est
 * toujours présent, et le repli explicite.
 */
function DatasheetPdf({ datasheet }: { datasheet: Datasheet }) {
  const { tx } = useI18n();
  const [showPreview, setShowPreview] = useState(false);

  if (!datasheet.url) return null;

  const filename = datasheet.filename ?? tx("fiche-technique.pdf", "datasheet.pdf");

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <FileText size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{filename}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {tx("Document PDF", "PDF document")}
          </p>
        </div>

        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
          >
            {showPreview ? tx("Masquer", "Hide") : tx("Aperçu", "Preview")}
          </button>

          <a
            href={datasheet.url}
            download={datasheet.filename ?? undefined}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0077BE] to-[#00A8E8] px-3 py-2 text-xs font-semibold text-white transition hover:shadow-lg"
          >
            <Download size={14} />
            {tx("Télécharger", "Download")}
          </a>
        </div>
      </div>

      {showPreview && (
        <div className="border-t border-gray-200 dark:border-slate-700">
          <object
            data={datasheet.url}
            type="application/pdf"
            className="h-[70vh] max-h-[600px] w-full"
            aria-label={tx("Aperçu de la fiche technique", "Datasheet preview")}
          >
            {/* Repli : navigateurs sans lecteur PDF intégré, mobiles compris */}
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tx(
                  "Votre navigateur n'affiche pas les PDF directement.",
                  "Your browser cannot display PDFs inline.",
                )}
              </p>
              <a
                href={datasheet.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0077BE] hover:underline dark:text-[#00A8E8]"
              >
                <ExternalLink size={14} />
                {tx("Ouvrir dans un nouvel onglet", "Open in a new tab")}
              </a>
            </div>
          </object>
        </div>
      )}
    </div>
  );
}
