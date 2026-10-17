/**
 * Photographies d'ambiance du site public.
 *
 * Toutes proviennent d'Unsplash et sont servies depuis `images.unsplash.com`.
 * La licence Unsplash autorise l'usage commercial sans attribution ni frais
 * (https://unsplash.com/license) — l'attribution reste un geste apprécié.
 *
 * Chaque visuel a été ouvert et vérifié : contexte africain, sujet lié à l'eau,
 * et registre positif. Pour en remplacer un, changer l'`url` ici : c'est le seul
 * endroit où ces photos sont déclarées.
 *
 * NB : ces visuels ne sont pas encore pilotables depuis le back-office,
 * contrairement au hero, au fond des services et à la galerie
 * (voir `types/site-content.ts`).
 */

export interface SitePhoto {
  url: string;
  /** Texte alternatif en français — décrit la scène pour les lecteurs d'écran */
  alt: string;
  /** Légende affichée sous la photo, quand la section en prévoit une */
  caption?: string;
  credit: string;
}

const unsplash = (id: string, w: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Bandeau d'accueil : la collecte de l'eau sur une piste de latérite. */
export const HERO_PHOTO: SitePhoto = {
  url: unsplash("1543181077-099f32f30a1c", 1920),
  alt: "Des habitantes et habitants d'un village marchent sur une piste de latérite en portant des bidons d'eau.",
  credit: "Unsplash",
};

/** Section « Nos services » : point d'eau équipé d'une pompe manuelle. */
export const SERVICES_PHOTO: SitePhoto = {
  url: unsplash("1760873059715-7c7cfbe2a2c6", 1600),
  alt: "Des enfants se tiennent près d'une pompe à bras installée sur un puits, dans un village entouré de collines vertes.",
  caption:
    "Un point d'eau équipé change le quotidien de tout un quartier.",
  credit: "Unsplash",
};

/** Section « Ils nous font confiance » : le transport de l'eau au quotidien. */
export const TRUST_PHOTO: SitePhoto = {
  url: unsplash("1760907949955-294e28bf058d", 1600),
  alt: "Une jeune femme en pagne traverse un champ en portant un seau d'eau sur la tête.",
  caption:
    "Derrière chaque installation, des trajets quotidiens que l'on raccourcit.",
  credit: "Unsplash",
};

/** Bandeau d'appel à l'action : l'eau transportée à vélo, à la tombée du jour. */
export const CTA_PHOTO: SitePhoto = {
  url: unsplash("1543180930-261980d4868a", 1920),
  alt: "Deux enfants poussent un vélo chargé de bidons jaunes sur une piste, dans la lumière de fin de journée.",
  credit: "Unsplash",
};
