import type { SitePhoto } from "../../content/photos";

/**
 * Photo de fond d'un bandeau d'en-tête de page.
 *
 * À poser en premier enfant d'une `<section className="relative overflow-hidden">`
 * qui garde son dégradé bleu : celui-ci reste visible tant que l'image n'est pas
 * chargée, et prend définitivement le relais si elle ne charge jamais. Le contenu
 * de l'en-tête doit porter `relative` (ou `z-10`) pour passer devant.
 *
 * Le voile n'est pas décoratif : le texte des en-têtes est blanc, et sans lui il
 * devient illisible dès que la photo s'éclaircit.
 */
export function PageHeroMedia({
  photo,
  /** Plus dense quand l'en-tête porte un formulaire ou beaucoup de texte. */
  veil = "normal",
  /** `object-position` quand le sujet n'est pas au centre du cadre. */
  position = "center",
}: {
  photo: SitePhoto;
  veil?: "normal" | "dense";
  position?: string;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <img
        src={photo.url}
        alt=""
        aria-hidden="true"
        decoding="async"
        // L'en-tête est au-dessus de la ligne de flottaison : on la charge tout de suite
        loading="eager"
        fetchPriority="high"
        style={{ objectPosition: position }}
        // Si la photo manque, le dégradé de la section suffit : on masque l'image
        // plutôt que de laisser l'icône de fichier cassé sur le bandeau.
        onError={(e) => {
          e.currentTarget.style.visibility = "hidden";
        }}
        className="h-full w-full scale-105 object-cover animate-fade-in"
      />

      {/* Voile bleu : lisibilité du texte blanc, et raccord avec la charte */}
      <div
        className={
          veil === "dense"
            ? "absolute inset-0 bg-gradient-to-br from-brand-950/92 via-brand-800/85 to-aqua-700/75"
            : "absolute inset-0 bg-gradient-to-br from-brand-950/85 via-brand-700/78 to-aqua-600/68"
        }
      />
      {/* Vignettage bas : la section suivante s'enchaîne sans rupture */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-950/45 via-transparent to-transparent" />
      {/* Trame, comme sur les sections sombres de l'accueil */}
      <div className="absolute inset-0 bg-grid-dark opacity-30" />
    </div>
  );
}
