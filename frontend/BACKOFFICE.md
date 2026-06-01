# 📱 BACKOFFICE RTWATER - Documentation

## ✅ Phase 1 : Structure & Architecture Frontend - COMPLÈTE

### 🏗️ Répertoires Créés

```
src/
├── app/admin/
│   ├── layout/
│   │   ├── AdminLayout.tsx         # Layout principal du backoffice
│   │   └── ProtectedRoute.tsx      # Wrapper pour routes protégées
│   ├── components/
│   │   └── Sidebar.tsx             # Navigation latérale
│   └── pages/
│       ├── AdminLogin.tsx          # Page de connexion
│       ├── AdminDashboard.tsx      # Dashboard principal
│       ├── ProductsPage.tsx        # Gestion des produits ✨
│       ├── PagesManagerPage.tsx    # Gestion des pages web
│       ├── OrdersAdminPage.tsx     # Gestion des commandes
│       ├── InventoryPage.tsx       # Gestion du stock ✨
│       ├── POSPage.tsx             # Point de vente ✨
│       ├── ReceiptsPage.tsx        # Reçus & transactions ✨
│       ├── AnalyticsPage.tsx       # Analytiques
│       └── SettingsPage.tsx        # Paramètres
└── context/
    ├── AdminAuthContext.tsx        # Auth & gestion des rôles
    ├── InventoryContext.tsx        # Gestion du stock
    ├── POSContext.tsx              # Système POS
    └── ReceiptContext.tsx          # Gestion des reçus
```

## 🔐 Système d'Authentification

### Rôles Disponibles

- **Admin**: Accès complet à toutes les fonctionnalités
- **Manager**: Gestion produits, commandes, stock, analytiques
- **Cashier**: POS et gestion des reçus uniquement

### Permissions

```typescript
admin: [
  "view_dashboard",
  "manage_products",
  "manage_pages",
  "manage_orders",
  "manage_inventory",
  "manage_pos",
  "manage_receipts",
  "manage_users",
  "manage_settings",
  "view_analytics",
];

manager: [
  "view_dashboard",
  "manage_products",
  "manage_orders",
  "manage_inventory",
  "manage_pos",
  "view_analytics",
];

cashier: ["manage_pos", "manage_receipts", "view_inventory"];
```

## 📊 Fonctionnalités

### 1. **Dashboard** ✅

- Stats principales (ventes, commandes, stock, clients)
- Activités récentes
- Actions rapides

### 2. **Gestion des Produits** ✅

- Tableau des produits
- Recherche
- CRUD (À développer)
- Gestion SKU/Prix

### 3. **Gestion du Stock** ✅

- Dashboard inventaire avec statistiques
- Alertes stock critique
- Mouvements de stock (entrées/sorties)
- Emplacements physiques
- Historique des mouvements

### 4. **Point de Vente (POS)** ✅

- Interface de vente
- Panier produits
- Gestion quantités
- Calcul automatique TVA
- Système de paiement multi-méthode
- **Génération de reçus automatique**
- Impression directe

### 5. **Gestion des Reçus** ✅

- Historique des transactions jour
- Détails des transactions
- Montants consolidés
- Paiements détaillés
- Export/Impression

### 6. **Gestion des Pages Web**

- À développer (Phase 2)

### 7. **Gestion des Commandes**

- À développer (Phase 2)

### 8. **Analytiques**

- À développer (Phase 2)

## 🔧 Contextes & Hooks

### AdminAuthContext

```typescript
useAdminAuth(): {
  user: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login(email: string, password: string): Promise<void>
  logout(): void
  hasPermission(permission: string): boolean
  hasRole(role: AdminRole): boolean
}
```

### InventoryContext

```typescript
useInventory(): {
  items: InventoryItem[]
  movements: StockMovement[]
  getLowStockItems(): InventoryItem[]
  getCriticalStockItems(): InventoryItem[]
  addMovement(movement): void
  updateItemQuantity(itemId, quantity): void
  getItemById(id): InventoryItem | undefined
  getMovementsByProduct(productId): StockMovement[]
}
```

### POSContext

```typescript
usePOS(): {
  cart: CartItem[]
  addToCart(item): void
  removeFromCart(itemId): void
  updateCart(itemId, quantity): void
  clearCart(): void
  calculateSubtotal(): number
  calculateTax(subtotal?, rate?): number
  calculateTotal(): number
  completeTransaction(payments, notes?): POSTransaction
  transactions: POSTransaction[]
  getTodayTransactions(): POSTransaction[]
  getDayTotal(): number
}
```

### ReceiptContext

```typescript
useReceipt(): {
  receipts: Receipt[]
  createReceipt(receipt): Receipt
  getReceiptById(id): Receipt | undefined
  generateReceiptHTML(receipt): string
  printReceipt(receipt): void
  downloadReceiptPDF(receipt): void
  getReceiptsByDateRange(start, end): Receipt[]
}
```

## 🛗 Routes Admin

```
/admin/login              # Connexion
/admin/dashboard         # Accueil (require: view_dashboard)
/admin/products          # Produits (require: manage_products)
/admin/pages             # Pages web (require: manage_pages)
/admin/orders            # Commandes (require: manage_orders)
/admin/inventory         # Stock (require: manage_inventory)
/admin/pos               # Caisse (require: manage_pos)
/admin/receipts          # Reçus (require: manage_receipts)
/admin/analytics         # Analytiques (require: view_analytics)
/admin/settings          # Paramètres (require: manage_settings)
```

## 👥 Identifiants de Test

```
Email: admin@rtwater.com
Mot de passe: password123
```

## 🎯 Prochaines Étapes (Phase 2+)

### Phase 2: Avancé

- [ ] Éditeur de pages WYSIWYG
- [ ] Gestionnaire média/images
- [ ] Gestion complète des produits (création/modification)
- [ ] Gestion des commandes e-commerce
- [ ] Analytiques avancées
- [ ] Gestion des utilisateurs

### Phase 3: Backend

- [ ] API REST
- [ ] Base de données
- [ ] Authentification JWT
- [ ] Synchronisation données

### Phase 4: Intégrations

- [ ] Paiement en ligne (Stripe, PayPal)
- [ ] Email/SMS notifications
- [ ] PDF generation (jsPDF)
- [ ] Code barres/QR (jsbarcode)

## 📝 Notes

- Tous les contextes utilisent localStorage pour la persistence
- Les données sont actuellement mock (à remplacer par API)
- TVA fixée à 20% (configurable en Phase 2)
- Reçus générés en HTML (convertible en PDF en Phase 2)

## 🚀 Démarrage

```bash
# Installation
npm install

# Développement
npm run dev

# Build
npm run build

# Les fichiers de base sont prêts à l'emploi
# Adaptez les URLs des pages /admin* à votre routeur si nécessaire
```

---

**Dernière mise à jour**: Février 2026  
**Statut**: Phase 1 Complète ✨
