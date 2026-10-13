# RT Water Solution

Site vitrine, boutique en ligne et backoffice pour une entreprise de traitement et
distribution d'eau au Cameroun. Paiement par Mobile Money ou espèces à la livraison,
montants en XAF.

Deux applications indépendantes :

| Dossier | Rôle | Stack |
|---|---|---|
| `frontend/` | Site public + backoffice (SPA) | React 18, Vite, Tailwind, React Router |
| `api/` | API REST | Laravel 13, PHP 8.3, Sanctum, MySQL |

`api/` est un dépôt git distinct de la racine. Un `git status` à la racine ne montre
pas les changements du backend.

---

## Démarrage

### Prérequis

- PHP ≥ 8.3 avec les extensions `gd` (conversion WebP) et `zip` (import d'images)
- Composer, Node.js ≥ 18, MySQL

### API

```bash
cd api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link      # sans ça, aucune image uploadée n'est servie
php artisan serve
```

`storage:link` est à faire une fois par environnement. Il est facile à oublier et le
symptôme est déroutant : les produits s'enregistrent mais leurs images renvoient 404.

### Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
npm run build        # génère dist/
npm run smoke-api    # vérifie que l'API répond
```

### Comptes de démonstration

Créés par `UserSeeder`, mot de passe `password` pour tous :

| Compte | Rôle | Accès |
|---|---|---|
| `admin@example.com` | admin | tout, y compris réglages et comptes |
| `gestionnaire@example.com` | gestionnaire | catalogue, commandes, clients, caisse, remises |
| `secretaire@example.com` | secretaire | commandes, clients, contenu, newsletter |
| `comptable@example.com` | comptable | tableau de bord, analytiques, pièces comptables |

À supprimer avant toute mise en production.

---

## Variables d'environnement

### `api/.env`

| Clé | Rôle |
|---|---|
| `DB_*` | connexion MySQL |
| `FRONTEND_URL` | utilisée dans les e-mails et les liens signés |
| `SEBPAY_API_KEY`, `SEBPAY_SECRET`, `SEBPAY_ENV` | passerelle Mobile Money |
| `MAIL_*` | e-mails transactionnels |
| `MAIL_ADMIN_ADDRESS` | destinataire des alertes internes |

Les e-mails partent en « best effort » via `App\Support\Notifier` : un SMTP
injoignable ne fait jamais échouer une commande.

### `frontend/.env`

| Clé | Rôle |
|---|---|
| `VITE_API_BASE_URL` | base de l'API ; défaut en dur dans `src/services/api.ts` |
| `VITE_SITE_URL` | URL canonique, pour le SEO |
| `VITE_PLAUSIBLE_DOMAIN` | mesure d'audience sans cookie — démarre sans consentement |
| `VITE_GA4_ID` | Google Analytics — **déclenche le bandeau de consentement** |

Le bandeau de cookies n'apparaît que si `VITE_GA4_ID` est défini. Plausible ne posant
aucun cookie, il n'y a rien à demander au visiteur et le bandeau reste masqué.

---

## Documentation de l'API

Scramble génère la référence à partir du code :

- `GET /docs/api` — interface de navigation
- `GET /docs/api.json` — spécification OpenAPI

---

## Règles métier à connaître avant de toucher au code

Cette section couvre ce que le code ne dit pas de lui-même.

### Rôles et permissions

Le serveur est la seule autorité. `App\Support\Permissions` associe chaque rôle à une
liste de capacités, et chaque route déclare celle qu'elle exige :

```php
Route::middleware('permission:manage_products')->group(function () { ... });
```

Les rôles existants sont `admin`, `gestionnaire`, `secretaire`, `comptable`, `user`
(`App\Models\Role`). Le frontend **reçoit** ses permissions dans la réponse de `/login`
et de `/me` ; il ne les déduit pas. Pour ouvrir un écran à un rôle, modifier la carte
dans `Permissions::map()` — pas le React.

Deux pièges déjà rencontrés :

- un rôle inconnu retombe sur `user` (aucun droit), jamais sur `admin` ;
- `hasPermission()` côté React ne sert qu'à masquer l'interface. Le contrôle réel est
  le middleware. Ne jamais s'y fier pour protéger une donnée.

### Calcul des montants

`App\Support\OrderPricing` est le seul endroit où un total se calcule. Les trois chemins
de commande (boutique, invité, caisse) l'utilisent, dans cet ordre :

1. prix unitaire = prix du produit moins sa remise, **si elle n'est pas expirée** ;
2. sous-total = somme des lignes ;
3. remise du code promo, plafonnée au sous-total ;
4. frais de livraison de la zone — calculés sur le sous-total **avant** remise, pour
   qu'un code promo ne fasse pas perdre un franco de port déjà atteint.

Les montants envoyés par le navigateur sont ignorés. `POST /orders/quote` sert à
l'affichage avant validation ; la commande recalcule tout.

### Stock

`App\Support\StockReserver::reserve()` doit être appelé **dans** une transaction : il
relit les produits sous `lockForUpdate()` avant de décrémenter. Vérifier le stock puis
le décrémenter en deux temps laisse passer la survente — deux acheteurs sur le dernier
article passent tous les deux la vérification.

Les identifiants sont verrouillés dans un ordre trié, pour que deux commandes
concurrentes ne s'interbloquent pas en croisant leurs verrous.

Une commande annulée rend son stock **et** son code promo (`used_count` décrémenté).

### Référence de commande

Stockée en colonne, format `CMD-261013-K7M2Q`, suffixe aléatoire sur un alphabet sans
`I`, `O`, `0` ni `1` — ces caractères se confondent quand un client dicte sa référence
au téléphone.

Elle ne dérive **pas** de l'id : cela rendrait le volume d'affaires public et les
références énumérables. `Order::findByReference()` accepte encore les anciennes
références numériques (`CMD-000042`) pour les commandes antérieures à la migration.

### Réglages

`Setting::schema()` fait office de liste blanche : une clé absente du schéma est
refusée à l'écriture. Ajouter un réglage demande donc une entrée dans `schema()`, et
rien d'autre — la migration est générique (clé / valeur JSON).

`GET /settings` est public et filtré par `SettingController::PUBLIC_KEYS` : les seuils
de stock et les adresses de notification ne sortent pas.

Le jeu complet est mis en cache d'un bloc et vidé à chaque écriture.

### Import massif de produits

`App\Services\ProductImportService`, en deux temps :

1. `analyze()` — dépose le fichier dans `storage/app/private/imports/{jeton}/`, valide
   ligne par ligne, renvoie un aperçu. **Rien n'est écrit en base.**
2. `commit($jeton)` — enregistre. Chaque ligne a sa propre transaction : une ligne en
   échec n'annule pas les précédentes.

Le jeton évite de re-téléverser l'archive d'images entre les deux étapes. Les dossiers
abandonnés sont purgés après 24 h.

Les en-têtes sont reconnus en deux passes — exacte d'abord, puis mot entier — pour
qu'une colonne `prix_achat` ne soit jamais prise pour `prix`.

Rattachement automatique des images, par ordre de priorité :

1. colonne `image` = nom de fichier → cherché dans l'archive ZIP ;
2. colonne `image` = URL `https://` → téléchargée (type MIME vérifié, 8 Mo max) ;
3. colonne `image` vide → recherche par référence (`RTW-B15.jpg`) puis par nom
   slugifié. Les suffixes de série `-1` / `_1` sont acceptés.

Les entrées de l'archive sont aplaties et filtrées : une entrée `../../evil.png` ne
peut pas sortir du dossier d'import (couvert par un test).

### Fiche technique produit

`App\Support\DatasheetStorage` gère les caractéristiques détaillées d'un produit, sous
l'une de trois formes : texte saisi dans le backoffice, image (tableau de spécifications
scanné) ou PDF du fabricant. `products.datasheet_type` dit laquelle est en place.

Les règles qui ne se devinent pas :

- **Le fichier détermine le type**, pas le champ déclaré. Un admin qui choisit « image »
  et dépose un PDF obtient un PDF. Un fichier envoyé sans type déclaré fonctionne aussi.
- **Retirer la fiche** demande `datasheet_type: "none"`. Une valeur explicite plutôt
  qu'une chaîne vide, car `FormData` ne transporte pas `null` et dépendre de la
  conversion des chaînes vides par le framework rendrait le retrait silencieusement
  inopérant si ce middleware changeait.
- **Une mise à jour qui ne parle pas de fiche technique la conserve.** Modifier un prix
  n'efface pas le PDF attaché.
- **L'ancien fichier n'est supprimé qu'après l'écriture du produit.** Si l'enregistrement
  échoue, la fiche d'origine est toujours servie.
- Formats acceptés : JPG, PNG, WebP, PDF — 10 Mo. SVG est exclu, il peut porter du script.
- Les images de fiche technique sont réduites à `DATASHEET_MAX_SIZE` (2400 px) et non à
  `MAX_SIZE` (1600 px) : un tableau de caractéristiques réduit comme une photo produit
  devient illisible.

L'**import Excel ne gère pas encore la fiche technique**. Un catalogue importé en masse
doit recevoir ses fiches une à une dans le backoffice.

### Images

Tout passe par `App\Support\ImageOptimizer` : redimensionnement à 1600 px et conversion
WebP. Une photo de téléphone de 3 Mo descend à ~150 Ko, ce qui compte sur un réseau
mobile. Sans l'extension `gd`, le fichier est stocké tel quel.

`php artisan images:optimize` convertit les images déjà en base.

### Envoi de fichiers depuis le backoffice

Les routes de mise à jour sont en `PUT`, mais **PHP ne parse pas les corps multipart en
PUT**. Les services frontend qui envoient un `FormData` POSTent donc avec `_method=PUT`,
que le routeur Laravel interprète comme un PUT :

```ts
payload.append("_method", "PUT");
return api.request(`/products/${id}`, { method: "POST", body: payload });
```

Sans cela la requête part en POST sur une route qui n'accepte que PUT et répond 405.
C'est à reproduire pour toute nouvelle ressource acceptant un fichier à la mise à jour.

### Autorisation : route et FormRequest doivent s'accorder

Une route protégée par `permission:manage_products` et un `FormRequest` dont
`authorize()` exige `isAdmin()` se contredisent : un gestionnaire franchit le middleware
puis se fait refuser par la validation. Les `FormRequest` du catalogue vérifient donc la
même permission que leur route, via `Permissions::userCan()`.

### Cache

`App\Support\CacheVersion` versionne les réponses de `pages`, `blog` et `categories`.
Le cache est invalidé à l'écriture du modèle, via `booted()`. Un nouveau contenu mis en
cache doit déclarer son invalidation au même endroit, sinon il reste figé une heure.

---

## Tests

```bash
cd api && php artisan test
```

Les tests tournent sur SQLite en mémoire (`phpunit.xml`), sans toucher à MySQL.

| Suite | Couvre |
|---|---|
| `CustomerJourneyTest` | commande, suivi, e-mails, profil, mot de passe oublié |
| `CommerceFoundationsTest` | référence, verrou de stock, livraison, codes promo, réglages, permissions, clients, newsletter |
| `ProductImportTest` | lecture Excel/CSV, correspondance des colonnes, images, sécurité de l'archive |
| `ProductDatasheetTest` | fiche technique : texte, image, PDF, remplacement, retrait, formats refusés |
| `PerformanceAndMonitoringTest` | cache, remontée d'erreurs |

**Deux échecs connus** dans `Auth/AuthenticationTest` : tests Breeze par session, hérités
du squelette Laravel. L'API est en jetons Bearer, ces tests ne correspondent à rien dans
l'application. À supprimer ou réécrire.

Il n'y a **aucun test frontend**. Le parcours panier → commande → paiement n'est couvert
par rien côté navigateur.

---

## Structure

```
rtwater/
├── api/                          # dépôt git distinct
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/  # 24 contrôleurs
│   │   │   └── Middleware/       # CheckRole, CheckPermission
│   │   ├── Models/
│   │   ├── Services/             # ProductImportService, SebpayService
│   │   └── Support/              # Permissions, OrderPricing, StockReserver,
│   │                             # DatasheetStorage, ImageOptimizer,
│   │                             # CacheVersion, Notifier
│   ├── database/migrations/
│   ├── database/seeders/
│   ├── routes/api.php            # toutes les routes, groupées par permission
│   └── tests/Feature/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/            # backoffice (pages, layout, sidebar)
│   │   │   └── components/       # site public
│   │   ├── context/              # panier, auth, contenu CMS, caisse
│   │   ├── services/             # un module par domaine d'API
│   │   ├── lib/                  # seo, monitoring, helpers produit
│   │   └── i18n/                 # fr / en
│   └── public/
├── setup.sh / setup.ps1
└── README.md
```

---

## Backoffice

Accessible sur `/admin`, filtré par permission.

| Écran | Permission |
|---|---|
| Tableau de bord | `view_dashboard` |
| Produits, Import Excel | `manage_products` |
| Catégories | `manage_categories` |
| Prestations | `manage_services` |
| Commandes, Devis, Réservations | `manage_orders` |
| Clients | `manage_customers` |
| Inventaire | `manage_inventory` |
| Point de vente | `manage_pos` |
| Transactions, Factures | `manage_receipts` |
| Avis clients | `manage_reviews` |
| Pages web | `manage_pages` |
| Blog | `manage_blog` |
| Commercial — codes promo, zones de livraison, newsletter | `manage_discounts`, `manage_shipping`, `manage_newsletter` |
| Analytiques | `view_analytics` |
| Paramètres | `manage_settings` |

Le backoffice est en thème clair uniquement. Le site public gère le mode sombre ; les
écrans admin n'ont aucune variante `dark:`.

---

## Contenu éditorial

Les pages du site vitrine sont pilotées par le CMS : `SiteContentContext` charge les
pages par slug et le contenu est du JSON structuré, modifiable dans **Pages web**.

Trois pages légales sont semées par `LegalPageSeeder` — `conditions-generales`,
`politique-de-confidentialite`, `mentions-legales`. Ce sont des **brouillons** portant
des mentions `[à compléter]` et ils doivent être relus par un juriste avant mise en
ligne. Le pied de page y renvoie déjà.

Les zones de livraison semées par `ShippingZoneSeeder` sont des valeurs plausibles pour
Yaoundé, pas des tarifs contractuels. À ajuster dans **Commercial → Zones de livraison**.

---

## Déploiement

```bash
# Frontend
cd frontend && npm run build        # → dist/

# API
cd api
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan storage:link
php artisan config:cache && php artisan route:cache
```

`frontend/public/_redirects` assure le routage SPA sur Cloudflare Pages et Netlify.
Sur un autre hébergeur, rediriger toutes les routes inconnues vers `index.html`.

Côté API, vérifier que `config/cors.php` accepte le domaine du frontend.

---

## Travaux en attente

### À faire avant ouverture au public

- Compléter les trois pages légales et les faire relire.
- Renseigner les coordonnées réelles de l'entreprise dans **Paramètres**.
- Ajuster les tarifs de livraison.
- Supprimer les comptes de démonstration.
- Vérifier l'intégration SEBPAY contre sa documentation à jour — le code existe
  (`PaymentController`, `SebpayService`) mais n'a pas été confronté au service réel.

### Manques fonctionnels connus

| Manque | Pourquoi ça compte |
|---|---|
| **Variantes produit** | L'eau se vend en contenances (1,5 L / 5 L / 10 L / pack de 6). Sans variantes, chaque format demande une fiche dupliquée. C'est le seul manque vraiment structurel. |
| **Galerie multi-images** | Un seul visuel par produit (`products.image_url`). |
| Recherche full-text et filtres à facettes | La recherche couvre nom, référence et description en `LIKE`. Pas de pertinence, pas de suggestions. |
| Relance de panier abandonné | — |
| Carnet d'adresses client | L'adresse est retapée à chaque commande. |
| Fiche technique dans l'import Excel | Les fiches se saisissent produit par produit ; un import de masse ne les porte pas. |
| Export CSV des commandes | L'export existe pour les clients et la newsletter, pas pour les commandes. |
| Actions en lot dans le backoffice | Aucune liste ne propose de sélection multiple. |
| Raccourcis clavier en caisse | Une caissière enchaîne les ventes à la souris. |
| Mode sombre du backoffice | — |
| Tests frontend | — |

---

**Dernière mise à jour** : 13 octobre 2026
