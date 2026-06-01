# RTWater — Projet complet

Ce projet est organisé en deux dossiers principaux : **frontend** (React + Vite) et **api** (Laravel).

## Structure

```
rtwater/
├── frontend/               # Application React + Vite (SPA)
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── ...
├── api/                    # Backend Laravel
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── openapi.yaml        # Spécification OpenAPI
│   ├── postman_collection.json
│   ├── README_BACKEND_LARAVEL.md
│   └── docker/
└── README.md               # Ce fichier
```

## Prérequis globaux

- **Node.js** >= 18 (pour frontend)
- **PHP** >= 8.1 + Composer (pour API, ou Docker)
- **Docker & Docker Compose** (optionnel, pour containeriser l'API)

## Démarrage rapide

### 1. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Accès : `http://localhost:5173`

### 2. API (Laravel)

#### Option A : En local (PHP + Composer)

```bash
cd api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Accès : `http://localhost:8000`

#### Option B : Avec Docker

```bash
cd api
docker compose build
docker compose up -d
docker compose exec app php artisan migrate --seed
```

Accès : `http://localhost:8000`

## Configuration requise

- Configurer le `.env` (base de données, services externes, etc.)
- Frontend : vérifier `vite.config.ts` pour le proxy vers l'API (ex: `http://localhost:8000`)
- CORS : configurer `config/cors.php` en backend pour accepter `http://localhost:5173`

## Documentation

- **Frontend** : voir `frontend/` (composants React, Vite)
- **Backend** : voir `api/README_BACKEND_LARAVEL.md`
- **API** : voir `api/openapi.yaml` ou importer `api/postman_collection.json` dans Postman

## Scripts fournis

Un script de setup global est disponible (voir `setup.sh` ou `setup.ps1`).

## Déploiement

### Frontend

```bash
cd frontend
npm run build
# Les fichiers statiques sont générés dans `dist/`
```

### API

Voir `api/README_BACKEND_LARAVEL.md` pour les instructions de déploiement complet (CI/CD, Docker, etc.).

## Support

- Questions sur le frontend ? Voir `frontend/README.md` (si existe)
- Questions sur l'API ? Voir `api/README_BACKEND_LARAVEL.md`

---

**Dernière mise à jour** : Février 2026
