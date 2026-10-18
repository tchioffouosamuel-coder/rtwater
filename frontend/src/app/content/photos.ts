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
  url: "/images/headers/contact.webp",
  alt: "Un filet d'eau claire coule entre des mains ouvertes.",
  credit: "Pexels",
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

/* ---------------------------------------------------------------------------
   Bandeaux d'en-tête des pages intérieures

   Ces visuels-là ne viennent pas d'Unsplash mais de Pexels (licence libre, usage
   commercial autorisé sans attribution — https://www.pexels.com/license/), et ils
   sont servis depuis `public/images/headers/` plutôt que depuis le CDN du
   fournisseur : un en-tête est la première chose que la page peint, il ne doit
   pas dépendre d'un domaine tiers. Chaque fichier est recadré en bandeau 16/7,
   large de 1920 px, encodé en WebP (40 à 220 Ko).

   Pour remplacer un visuel : déposer le nouveau fichier sous le même nom dans
   `public/images/headers/` et corriger l'`alt` ici.
   --------------------------------------------------------------------------- */

const header = (name: string) => `/images/headers/${name}.webp`;

/** Galerie de projets : un forage qui donne enfin de l'eau. */
export const GALLERY_HEADER_PHOTO: SitePhoto = {
  url: header("galerie"),
  alt: "Un forage en service déverse un jet d'eau claire dans un champ bordé de palmiers.",
  credit: "Pexels",
};

/** À propos : l'équipe, en tenue de chantier, devant le véhicule d'intervention. */
export const ABOUT_HEADER_PHOTO: SitePhoto = {
  url: header("a-propos"),
  alt: "Quatre techniciens en combinaison bleue et casque de chantier posent devant leur camion d'intervention.",
  credit: "Pexels",
};

/** Devis gratuit : le geste technique qu'on vient chiffrer. */
export const QUOTE_HEADER_PHOTO: SitePhoto = {
  url: header("devis"),
  alt: "Un technicien ganté soude une conduite d'eau en tranchée, gerbe d'étincelles à l'appui.",
  credit: "Pexels",
};

/** Boutique : l'eau filtrée au point d'usage, verres prêts à servir. */
export const SHOP_HEADER_PHOTO: SitePhoto = {
  url: header("boutique"),
  alt: "Un robinet d'eau purifiée au-dessus d'un plan de travail où sont alignés des verres propres.",
  credit: "Pexels",
};

/** Contact : l'eau qui coule enfin, au bout du tuyau. */
export const CONTACT_HEADER_PHOTO: SitePhoto = {
  url: header("contact"),
  alt: "Deux mains se rejoignent sous l'eau qui jaillit d'un tuyau.",
  credit: "Pexels",
};

/** Blog : la pluie sur une surface d'eau, au ras des feuilles. */
export const BLOG_HEADER_PHOTO: SitePhoto = {
  url: header("blog"),
  alt: "Des gouttes de pluie dessinent des ronds concentriques à la surface d'une eau sombre.",
  credit: "Pexels",
};

/** Mes commandes : la préparation des colis au dépôt. */
export const ORDERS_HEADER_PHOTO: SitePhoto = {
  url: header("commandes"),
  alt: "Un cariste déplace une palette de cartons dans un entrepôt.",
  credit: "Pexels",
};

/** Suivi de commande : le camion à quai, prêt à partir. */
export const TRACKING_HEADER_PHOTO: SitePhoto = {
  url: header("suivi"),
  alt: "Un camion de livraison stationné à un quai de chargement, vu depuis l'intérieur du dépôt.",
  credit: "Pexels",
};
