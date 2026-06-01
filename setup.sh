#!/bin/bash
# RTWater Setup Script
# Run from project root: bash setup.sh

echo "========================================"
echo "RTWater - Setup complet (Frontend + API)"
echo "========================================"

# Frontend Setup
echo ""
echo "[1/4] Installation Frontend..."
cd frontend
if [ -d "node_modules" ]; then
    echo "node_modules trouvé, skip npm install"
else
    npm install
fi
cd ..

# API Setup
echo ""
echo "[2/4] Installation API (Composer)..."
cd api
if [ -d "vendor" ]; then
    echo "vendor trouvé, skip composer install"
else
    composer install
fi
cd ..

# .env API
echo ""
echo "[3/4] Configuration .env API..."
if [ ! -f "api/.env" ]; then
    if [ -f "api/.env.example" ]; then
        cp api/.env.example api/.env
        echo ".env créé depuis .env.example"
    fi
fi

# Generate app key
cd api
php artisan key:generate
cd ..

# Summary
echo ""
echo "========================================"
echo "Configuration terminée !"
echo "========================================"

echo ""
echo "📋 Prochaines étapes :"
echo ""
echo "  1. Frontend :"
echo "     cd frontend && npm run dev"
echo ""
echo "  2. API (option A - local) :"
echo "     cd api && php artisan migrate --seed && php artisan serve"
echo ""
echo "  3. API (option B - Docker) :"
echo "     cd api && docker compose build && docker compose up -d && docker compose exec app php artisan migrate --seed"
echo ""
echo "✅ Frontend : http://localhost:5173"
echo "✅ API : http://localhost:8000"
