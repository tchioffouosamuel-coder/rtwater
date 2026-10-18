# Notifications Web Firebase

Le projet `rtwater-c3d5e` et sa clé publique VAPID sont configurés. La configuration Firebase Web est fournie par les variables `VITE_FIREBASE_*` : copier les variables de `frontend/.env.example` dans l'environnement de déploiement et renseigner `VITE_FIREBASE_API_KEY`, puis lancer `npm install` et `npm run build` dans `frontend`. Ne pas écraser les variables existantes. La configuration locale existante a été conservée dans `frontend/.env`, ignoré par Git.

Vite utilise les mêmes valeurs pour le client et le fichier `dist/firebase-config.js` généré pour le service worker. Ce fichier fait partie du déploiement ; il n'est pas à ajouter au dépôt. Toute modification de la clé nécessite une nouvelle compilation et un redéploiement. Un build avec une clé VAPID configurée et une configuration Firebase incomplète échoue avec un message explicite.

Le bouton **Activer les notifications** est disponible dans le pied de page et dans les réglages du backoffice, rubrique Notifications. L'autorisation du navigateur n'est demandée qu'au clic. Les appareils sans support Web Push n'affichent pas le bouton. Sur iPhone/iPad, ouvrir le site installé sur l'écran d'accueil pour utiliser les notifications.

## API et envoi

1. Dans `api`, exécuter `php artisan migrate` pour créer `push_subscriptions`.
2. Pour recevoir un message de test envoyé par la console Firebase, aucun compte de service n'est nécessaire côté Laravel.
3. Pour envoyer depuis Laravel, activer l'API Firebase Cloud Messaging HTTP v1 du projet. Placer le JSON du compte de service **en dehors du répertoire public et du dépôt**, puis définir dans l'environnement serveur :

   ```dotenv
   FIREBASE_PROJECT_ID=rtwater-c3d5e
   FIREBASE_CREDENTIALS=/chemin/prive/firebase-service-account.json
   FRONTEND_URL=https://rt-watersolution.com
   ```

4. Recharger la configuration (`php artisan config:cache`). Pour un appareil de test, relever son ID dans `push_subscriptions`, puis :

   ```sh
   php artisan push:send 1 --title="RT Water" --body="Les notifications sont actives" --url=/shop
   ```

`App\Services\FirebaseMessaging::send()` permet aussi l'envoi depuis le code serveur. Aucun endpoint public d'envoi n'est exposé. Les abonnements sont propres à l'appareil, sans rattachement à un compte client : aucun événement de commande privé n'est diffusé automatiquement.

## Fonctionnement

- `POST /api/push/subscriptions` enregistre ou renouvelle le jeton, `DELETE` désabonne l'appareil. Un secret aléatoire local identifie l'installation ; seul son hash est stocké. Les jetons ne sont pas renvoyés dans les réponses.
- Un seul service worker `/sw.js` conserve le mode hors ligne et importe `/firebase-messaging-sw.js`, qui charge `/firebase-config.js` généré lors du build. Déployer les trois fichiers ensemble et laisser leur mise à jour accessible sans cache HTTP prolongé.
- Page ouverte : message dans le site avec lien « Voir ». Arrière-plan : notification système, sans doublon pour les messages Firebase contenant déjà `notification`. Les liens sont limités à l'origine du site.
- L'abonnement est renouvelé au retour sur le site et au rétablissement de la connexion. Un échec API laisse la possibilité de réessayer. Les jetons déclarés `UNREGISTERED` sont supprimés par l'expéditeur.

## Validation en production

Ouvrir le site en HTTPS (localhost convient au développement), cliquer sur le bouton et autoriser les notifications. Vérifier la création de l'abonnement, puis envoyer un message de test sur cet appareil avec la commande ci-dessus ou la console Firebase. Vérifier avec l'onglet ouvert puis en arrière-plan, le clic vers `/shop`, et la désactivation. L'envoi réel exige des identifiants Firebase valides ; les tests locaux utilisent des réponses simulées.

Sur l'environnement local actuel, l'exécution de la migration est bloquée par MySQL : `Plugin 'mysql_native_password' is not loaded`. Corriger la connexion MySQL existante, puis relancer `php artisan migrate --path=database/migrations/2026_10_18_000001_create_push_subscriptions_table.php`. La migration n'a pas été appliquée pendant l'intégration.

Documentation officielle : [client Web](https://firebase.google.com/docs/cloud-messaging/js/client), [réception](https://firebase.google.com/docs/cloud-messaging/js/receive), [envoi HTTP v1](https://firebase.google.com/docs/cloud-messaging/send/v1-api).

## Alerte GitHub sur la clé API Web

La clé API a été retirée des fichiers sources suivis et conservée dans l'environnement local ignoré. Cela évite de l'inscrire dans les prochains commits, mais ne la rend pas privée : la configuration Firebase Web reste visible dans le navigateur et dans les fichiers distribués. Ne jamais placer le JSON privé du compte de service dans une variable `VITE_*`.

Dans Google Cloud → API et services → Identifiants, sélectionner la clé signalée pour le projet `rtwater-c3d5e` et vérifier ses restrictions. Une clé réservée aux services Firebase est conçue pour être publique. Pour FCM, conserver notamment les API Firebase Installations et FCM Registration requises. Ne pas autoriser des API étrangères à Firebase, notamment Generative Language/Gemini, sur cette clé publique.

Si la clé est sans restrictions, permet d'autres usages sensibles ou présente un usage inattendu, créer une nouvelle clé restreinte, mettre à jour `VITE_FIREBASE_API_KEY` dans l'environnement de déploiement, reconstruire et tester FCM avant de révoquer l'ancienne. Si elle est bien réservée à Firebase avec les restrictions adaptées, l'alerte peut être examinée comme une exposition publique attendue, selon les règles du dépôt.

Le commit déjà publié reste dans l'historique : la correction locale ne clôture pas son alerte GitHub et ne révoque pas la clé. Les restrictions et l'état de l'alerte n'ont pas été modifiés depuis cette session.

Références : [gestion des clés Firebase](https://firebase.google.com/docs/projects/api-keys), [évaluation des alertes GitHub](https://docs.github.com/en/code-security/tutorials/remediate-leaked-secrets/evaluating-alerts).
