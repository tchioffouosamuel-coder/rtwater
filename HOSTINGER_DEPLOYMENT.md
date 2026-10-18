# Débloquer l'API, le manifeste et Firebase sur Hostinger

## Diagnostic du 18 octobre 2026

Les requêtes GET vers `/manifest.webmanifest`, `/firebase-config.js` et
`https://api.rt-watersolution.com/api/settings`, ainsi que le prévol OPTIONS
vers `/api/google-auth`, ont reçu une réponse **403 HTML** du serveur `hcdn` :
« Checking your browser before accessing. Just a moment... ».

Cette réponse est une vérification JavaScript du CDN Hostinger. L'API ne renvoie
alors ni son JSON ni ses en-têtes CORS. Un manifeste, un import de service worker
ou un prévol CORS ne peut pas exécuter une page de vérification JavaScript.
Ajouter des en-têtes dans Laravel ne suffit donc pas à lever ce blocage.

## Réglages dans hPanel

1. Ouvrir **Sites web → Tableau de bord → Performance → CDN → Gérer → Sécurité**.
2. Vérifier si **Under Attack / I'm under attack** est activé. Le désactiver
   si aucune attaque en cours ne le justifie. Si nécessaire, abaisser le niveau
   de sécurité progressivement vers **Medium**, puis **Low**, en testant après
   chaque changement. Vérifier les domaines du site et de l'API.
3. Attendre une minute puis retester les requêtes ci-dessous, depuis le navigateur
   affecté. Si elles restent bloquées, contrôler les règles de blocage IP/pays.
4. Si une exception pour l'API est nécessaire, contacter le support Hostinger :
   les exceptions par endpoint ne se configurent pas dans hPanel. Fournir l'URL,
   la méthode, l'heure et le `x-hcdn-request-id` d'une réponse bloquée.

Exemple observé : `OPTIONS https://api.rt-watersolution.com/api/google-auth`,
`x-hcdn-request-id: eb20a1a1844a55ee6f6db4a888faab6f-int-edge7`.
Utiliser de préférence un identifiant récent provenant du navigateur affecté.

Documentation officielle :
[vérification du navigateur](https://www.hostinger.com/support/hostinger-cdn-the-browser-verification-page/),
[requêtes légitimes bloquées](https://www.hostinger.com/support/hostinger-cdn-how-to-fix-blocked-legitimate-requests/).

## Déploiement du code

Dans le `.env` de l'API :

```dotenv
FRONTEND_URL=https://rt-watersolution.com
# Ajouter ici les éventuelles autres origines, séparées par des virgules.
CORS_ALLOWED_ORIGINS=
```

Les origines `https://rt-watersolution.com` et `https://www.rt-watersolution.com`
sont explicitement autorisées par `api/config/cors.php`. Après mise à jour de
ce fichier et de l'environnement, exécuter dans le dossier API du serveur :

```sh
php artisan config:clear
php artisan config:cache
```

Pour le frontend, renseigner les variables `VITE_FIREBASE_*` et
`VITE_GOOGLE_CLIENT_ID` dans l'environnement de compilation puis lancer
`npm run build` depuis `frontend/`. Déployer tout `frontend/dist/`, y compris
`.htaccess`, `sw.js`, `firebase-messaging-sw.js` et `firebase-config.js`.
La configuration Firebase est produite au build ; voir [FCM_SETUP.md](FCM_SETUP.md).

Le `.htaccess` frontend configure `Cross-Origin-Opener-Policy: same-origin-allow-popups`
pour la connexion Google. Si un autre proxy impose cet en-tête, y appliquer la
même valeur. [Documentation Google](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid#cross_origin_opener_policy).

Le service worker renvoie une erreur JSON **503** si l'API est inaccessible et
qu'aucune copie publique n'est disponible en cache. Il conserve les statuts HTTP
d'erreur reçus du serveur et ne les met pas en cache. Cette gestion évite les
promesses rejetées supplémentaires ; elle ne rétablit pas l'accès à l'API.

## Validation après les réglages

- `GET https://rt-watersolution.com/manifest.webmanifest` : **200**, contenu JSON.
- `GET https://rt-watersolution.com/firebase-config.js` : **200**, JavaScript avec
  une configuration Firebase renseignée, aucune page HTML de vérification.
- `GET https://api.rt-watersolution.com/api/settings` avec
  `Origin: https://rt-watersolution.com` : **200 JSON**, en-tête
  `Access-Control-Allow-Origin: https://rt-watersolution.com`.
- `OPTIONS https://api.rt-watersolution.com/api/google-auth` avec `Origin` comme
  ci-dessus, `Access-Control-Request-Method: POST` et
  `Access-Control-Request-Headers: content-type` : **204**, même en-tête CORS.
- Recharger le site, puis retester la connexion Google et l'activation des
  notifications. Si FCM échoue encore, la console du worker conserve désormais
  l'erreur d'origine après « Firebase Messaging unavailable ».

Le message Edge sur les images chargées paresseusement est informatif.
