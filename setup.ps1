# RTWater Setup Script
# Run from project root: .\setup.ps1

Write-Host "========================================" -ForegroundColor Green
Write-Host "RTWater - Setup complet (Frontend + API)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Frontend Setup
Write-Host "`n[1/4] Installation Frontend..." -ForegroundColor Cyan
Set-Location frontend
if (Test-Path node_modules) {
    Write-Host "node_modules trouvé, skip npm install"
} else {
    npm install
}
Set-Location ..

# API Setup
Write-Host "`n[2/4] Installation API (Composer)..." -ForegroundColor Cyan
Set-Location api
if (Test-Path vendor) {
    Write-Host "vendor trouvé, skip composer install"
} else {
    composer install
}
Set-Location ..

# .env API
Write-Host "`n[3/4] Configuration .env API..." -ForegroundColor Cyan
if (!(Test-Path api\.env)) {
    if (Test-Path api\.env.example) {
        Copy-Item api\.env.example api\.env
        Write-Host ".env créé depuis .env.example"
    }
}

# Generate app key
Set-Location api
php artisan key:generate
Set-Location ..

# Summary
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Configuration terminée !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`n[!] Prochaines etapes :" -ForegroundColor Yellow
Write-Host "  1. Frontend :" -ForegroundColor Cyan
Write-Host "     cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "  2. API (option A - local) :" -ForegroundColor Cyan
Write-Host "     cd api && php artisan migrate --seed && php artisan serve" -ForegroundColor White
Write-Host ""
Write-Host "  3. API (option B - Docker) :" -ForegroundColor Cyan
Write-Host "     cd api && docker compose up -d && docker compose exec app php artisan migrate --seed" -ForegroundColor White
Write-Host ""
Write-Host "[OK] Frontend : http://localhost:5173" -ForegroundColor Green
Write-Host "[OK] API : http://localhost:8000" -ForegroundColor Green
