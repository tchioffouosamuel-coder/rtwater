import type { SitePhoto } from "../../content/photos";

/**
 * Photo de fond d'un bandeau d'en-tête de page.
 *
 * À poser en premier enfant d'une `<section className="relative overflow-hidden">`.
 * La couleur pétrole de la section reste visible si l'image ne charge pas.
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
        // Si la photo manque, la couleur de la section suffit : on masque l'image
        // plutôt que de laisser l'icône de fichier cassé sur le bandeau.
        onError={(e) => {
          e.currentTarget.style.visibility = "hidden";
        }}
        className="h-full w-full scale-105 object-cover animate-fade-in"
      />

      <div className={veil === "dense" ? "absolute inset-0 bg-brand-950/85" : "absolute inset-0 bg-brand-950/72"} />
    </div>
  );
}
