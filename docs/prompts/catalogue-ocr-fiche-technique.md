# Prompt — Extraction OCR d'une page de catalogue → fiche technique PDF

## Usage
Joindre 1 à N images de pages de catalogue, puis coller le prompt ci-dessous.
Remplacer les `{{...}}` si besoin.

---

## Prompt

> **Rôle** — Tu es un technicien documentaire spécialisé dans la numérisation de catalogues
> industriels (pompes, filtration, traitement de l'eau). Tu travailles avec rigueur : tu ne
> complètes jamais une donnée que tu n'as pas lue.
>
> **Entrée** — Les images jointes sont des photos/scans de pages d'un catalogue fournisseur.
> Elles peuvent être inclinées, mal éclairées, avec des reflets ou une faible résolution.
>
> ### Étape 1 — Prétraitement et amélioration de l'image
> Pour chaque image, produis une version nettoyée exploitable, via un script Python
> (OpenCV + Pillow) que tu écris et exécutes :
> 1. Redressement : détection des bords de page, correction de perspective (warp) et
>    désinclinaison (deskew) pour que le texte soit horizontal.
> 2. Recadrage sur la zone utile de la page (suppression des marges hors page).
> 3. Normalisation d'éclairage : correction du fond (division par un flou gaussien large ou
>    CLAHE) pour supprimer ombres et reflets.
> 4. Débruitage léger (`fastNlMeansDenoising`), puis renforcement de netteté (unsharp mask).
> 5. Upscale ×2 à ×3 (LANCZOS, ou un modèle de super-résolution si disponible) **avant** l'OCR,
>    car les tableaux de caractéristiques sont en très petits caractères.
> 6. Export de deux sorties par page :
>    - `page-NN-enhanced.png` : couleur, haute résolution, destinée à l'illustration du PDF ;
>    - `page-NN-ocr.png` : niveaux de gris / binarisation adaptative, destinée à l'OCR.
> 7. Découpe et export séparé des zones d'intérêt : photo produit, schéma dimensionnel,
>    courbe de performance, logos de certification, tableau de caractéristiques.
>    Le tableau est OCRisé seul, en pleine résolution.
>
> ### Étape 2 — OCR et structuration
> OCRise les images préparées (Tesseract `--oem 1 --psm 6` pour les blocs de texte,
> `--psm 11/12` pour les tableaux ; ou tout moteur plus fiable disponible). Relis ensuite
> **visuellement** l'image toi-même pour corriger l'OCR : les erreurs typiques sont
> `0/O`, `1/l`, `5/S`, `8/B`, les virgules décimales, et les unités (`m³/h`, `L/min`, `kW`, `HP`,
> `MPa`, `A`, `kg`, `mm`, `V/Hz`).
>
> Produis d'abord un **JSON intermédiaire** par produit, que tu me montres pour validation :
> ```json
> {
>   "gamme": "", "serie": "", "page_source": "",
>   "caracteristiques": [],
>   "conditions_fonctionnement": {},
>   "certifications": [],
>   "modeles": [
>     {"modele":"", "debit_max_l_min":null, "hauteur_max_m":null, "courbe":null,
>      "puissance_kw":null, "puissance_hp":null, "tension":"", "intensite_a":null,
>      "raccord_entree_mm":"", "raccord_sortie_mm":"", "hauteur_mm":null,
>      "poids_brut_kg":null, "emballage_mm":""}
>   ],
>   "incertitudes": [{"champ":"", "valeur_lue":"", "raison":""}]
> }
> ```
> **Règles strictes :**
> - Une valeur illisible vaut `null` et est listée dans `incertitudes` — jamais une estimation.
> - Conserve les unités d'origine ; ajoute les conversions dans des champs séparés si utile.
> - Reproduis le tableau ligne par ligne, sans en fusionner ni en inventer aucune.
> - Signale toute cellule fusionnée dans le tableau d'origine (ex. une hauteur commune à
>   plusieurs modèles).
>
> ### Étape 3 — Génération du PDF
> Génère un PDF A4 **{{langue : français}}**, nommé `fiche-technique-{{serie}}.pdf`, avec
> ReportLab (ou LaTeX/WeasyPrint), contenant :
> 1. **Page de garde** : nom de la gamme/série, photo produit détourée, logos de certification,
>    référence de la page source du catalogue, date d'extraction.
> 2. **Caractéristiques produit** et **conditions de fonctionnement** en listes à puces.
> 3. **Tableau des modèles** : une ligne par modèle, en-têtes sur fond coloré, lignes alternées,
>    unités dans l'en-tête de colonne, tableau répété en-tête si rupture de page. Colonnes en
>    mode paysage si nécessaire pour éviter le retour à la ligne.
> 4. **Courbe de performance** et **schéma dimensionnel** : images rognées en haute résolution,
>    avec légende.
> 5. **Pied de page** : numéro de page, mention « Données extraites par OCR du catalogue
>    fournisseur — à vérifier avant publication commerciale ».
> 6. **Annexe** : liste des champs incertains ou non lus, avec le recadrage de l'image
>    correspondante.
>
> Typo sans empattement lisible, pas de couleur criarde, tableau au trait fin.
>
> ### Étape 4 — Fichier Excel d'import produits (création et mise à jour)
> Produis `import-produits-{{serie}}.xlsx` au format attendu par l'importeur du back-office
> RT Water (`ProductImportService`). **Une ligne = un modèle du tableau catalogue.**
>
> Feuille 1, nommée `Produits`, en-têtes en ligne 1, exactement :
>
> | nom | reference | categorie | description | prix | prix_achat | stock | stock_min | stock_max | emplacement | image | disponible |
> |---|---|---|---|---|---|---|---|---|---|---|---|
>
> Règles de remplissage :
> - `nom` — **obligatoire**. Libellé commercial construit depuis le catalogue, ex.
>   `Pompe de piscine SWIM SI SWIMS1-050 — 0,75 kW / 1 HP`.
> - `reference` — **la clé de mise à jour** : reprends la référence constructeur telle quelle
>   (ex. `SWIMS1-050`), ou préfixe-la (`{{prefixe : RTW-}}SWIMS1-050`), mais **garde la même
>   référence d'un import à l'autre** : l'importeur met à jour le produit existant quand la
>   référence correspond, et en crée un nouveau sinon. Une référence vide fait retomber la
>   correspondance sur le nom exact — à éviter.
> - `categorie` — nom ou slug ; créée automatiquement si elle n'existe pas.
> - `description` — résumé technique en une à trois phrases, repris des caractéristiques
>   (débit max, hauteur manométrique, puissance, tension, raccords, poids).
> - `prix` — nombre en XAF, sans séparateur de milliers ni symbole. **Le catalogue fournisseur
>   ne contient pas de prix de vente : laisse la cellule vide et signale-le**, sauf si une
>   grille tarifaire m'est fournie. (`prix` est obligatoire pour l'importeur : préviens-moi
>   que le fichier devra être complété avant import.)
> - `stock` — laisser vide signifie « inchangé » : ne mets jamais `0` par défaut lors d'une
>   mise à jour, cela viderait le stock.
> - `image` — nom du fichier photo que tu as exporté à l'étape 1 (ex. `SWIMS1-050.jpg`),
>   ou une URL `https`. Nomme chaque photo d'après la référence du modèle.
> - `disponible` — `oui` / `non`.
> - Toute donnée technique sans colonne dédiée (courbe, Q-max, H-max, intensité, raccords,
>   emballage) va dans `description` **et** dans la feuille `Fiche technique` ci-dessous ;
>   n'invente pas de colonne supplémentaire, l'importeur ignore les en-têtes inconnus.
>
> Feuille 2, `Fiche technique` : le tableau brut extrait, une colonne par caractéristique
> d'origine avec ses unités, plus la référence en première colonne. C'est la trace de
> l'extraction, destinée au contrôle humain, pas à l'import.
>
> Feuille 3, `Notes` : date d'extraction, page source, liste des champs incertains ou vides
> à compléter manuellement (prix en tête).
>
> Mise en forme : en-têtes en gras sur fond coloré, volets figés sous la ligne 1, filtre
> automatique, colonnes dimensionnées, `prix`/`prix_achat` en format nombre, `reference` et
> `image` en format texte (pour éviter qu'Excel ne transforme `SWIMS1-025` ou ne tronque un
> zéro initial).
>
> **Mise à jour d'un fichier existant** — si `import-produits-{{serie}}.xlsx` existe déjà
> (ou si je t'en fournis un) :
> 1. Ouvre-le avec openpyxl et lis les lignes présentes, indexées par `reference`.
> 2. Pour chaque modèle extrait : référence déjà présente → mets à jour uniquement les
>    cellules techniques (nom, description, image) et **laisse intactes les cellules saisies
>    à la main** (`prix`, `prix_achat`, `stock`, `emplacement`, `categorie`) sauf si je demande
>    le contraire ; référence absente → ajoute une ligne à la fin.
> 3. Ne supprime jamais une ligne : signale-la dans `Notes` comme « absente du nouveau
>    catalogue » et laisse-moi trancher.
> 4. Conserve la mise en forme et les feuilles existantes (`openpyxl.load_workbook`, pas de
>    réécriture complète). Écris d'abord une copie de sauvegarde
>    `import-produits-{{serie}}.bak-AAAAMMJJ.xlsx`.
> 5. Rends un récapitulatif : X lignes créées, Y mises à jour, Z inchangées, et la liste des
>    références concernées.
>
> ### Étape 5 — Contrôle
> Avant de me livrer : rouvre le PDF généré, compare chaque ligne du tableau avec l'image
> source, et confirme explicitement le nombre de modèles et de colonnes extraits.
> Vérifie aussi que le fichier Excel se relit sans erreur, que les en-têtes correspondent
> exactement à ceux attendus, et que le nombre de lignes `Produits` égale le nombre de modèles
> du tableau source. Livre les chemins absolus du PDF, du JSON, du XLSX et des images
> retravaillées, et rappelle les colonnes restant à compléter avant import.

---

## Variante courte (une seule page, sans script)

> Lis cette image de page de catalogue. Extrais fidèlement toutes les caractéristiques
> techniques et l'intégralité du tableau des modèles, en JSON, en mettant `null` pour toute
> valeur illisible (jamais d'estimation) et en listant les incertitudes. Génère ensuite un PDF
> A4 structuré : titre de la série, caractéristiques, conditions de fonctionnement,
> certifications, tableau des modèles avec unités en en-tête, puis les recadrages haute
> résolution de la courbe de performance et du schéma dimensionnel. Produis enfin un fichier
> `import-produits.xlsx` avec les en-têtes `nom, reference, categorie, description, prix,
> prix_achat, stock, stock_min, stock_max, emplacement, image, disponible` — une ligne par
> modèle, `reference` = référence constructeur (clé de mise à jour), `prix` et `stock` laissés
> vides car absents du catalogue. Si le fichier existe déjà, mets-le à jour par `reference`
> sans écraser les colonnes saisies à la main. Avant livraison, recompte les lignes du tableau
> et du XLSX par rapport à l'image.
