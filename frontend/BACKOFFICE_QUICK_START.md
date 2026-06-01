# 🚀 QUICK START - BACKOFFICE RTWATER

## 🔐 ACCÈS BACKOFFICE

### URL

```
http://localhost:5173/admin/login
```

### Identifiants de test

```
📧 Email: admin@rtwater.com
🔑 Mot de passe: password123
```

---

## 📱 NAVIGATION PRINCIPALE

### 📊 Dashboard

```
/admin/dashboard
```

- Vue d'ensemble
- Stats principales
- Activités récentes
- Actions rapides

### 📦 Produits

```
/admin/products
```

- Liste des produits
- Gestion SKU/Prix
- CRUD (À développer)

### 📋 Pages Web

```
/admin/pages
```

- Gestion contenu site
- (À développer)

### 🛒 Commandes

```
/admin/orders
```

- Suivi commandes
- Statuts
- (À développer)

### 📊 Stock

```
/admin/inventory
```

- Dashboard inventaire
- Alertes critiques
- Mouvements stock
- Emplacements physiques

### 💳 Caisse (POS)

```
/admin/pos
```

- Interface de vente
- Panier produits
- Paiement multi-méthode
- **Génération reçus automatique**

### 🧾 Reçus

```
/admin/receipts
```

- Historique transactions
- Totaux jour
- Détails transactions
- Impression/Export

### 📈 Analytiques

```
/admin/analytics
```

- (À développer)

### ⚙️ Paramètres

```
/admin/settings
```

- (À développer)

---

## 🎯 ÉTAPES POUR COMMENCER

### 1️⃣ Démarrer l'app

```bash
npm run dev
```

### 2️⃣ Accéder au backoffice

```
http://localhost:5173/admin/login
```

### 3️⃣ Se connecter

- Email: `admin@rtwater.com`
- Mot de passe: `password123`

### 4️⃣ Explorer

- Cliquer sur les éléments dans la sidebar
- Tester chaque fonctionnalité

---

## ✨ FONCTIONNALITÉS PRINCIPALES

### ✅ Déjà Implémentées

#### Dashboard

- 📊 Stats principales
- 🔄 Activités récentes
- ⚡ Actions rapides

#### Stock

- 🚨 Alertes critiques
- 📦 Inventaire complet
- 📝 Mouvements stock
- 🏬 Emplacements physiques

#### POS (Caisse)

- 🛒 Panier produits
- ➕ Ajouter/Retirer articles
- 💰 Calcul TVA automatique
- 💳 Paiement multi-méthode (Espèces, Carte, Chèque, Virement)
- 🧾 **Génération reçus automatique**
- 🖨️ Impression directe

#### Reçus

- 📊 Historique transactions
- 💯 Totaux journaliers
- 📋 Détails transactions
- 🧾 Format HTML (prêt pour PDF)

### 🔄 Rôles & Permissions

#### 👨‍💼 Admin

- Accès complet à tout

#### 👨‍💻 Manager

- Dashboard, Produits, Commandes, Stock, POS, Analytiques

#### 👨‍🏪 Caissier

- POS uniquement, Reçus, Visualisation stock

---

## 💾 DONNÉES

### Mock Data

Toutes les données actuelles sont des exemples (mock data):

- ✏️ À remplacer par des appels API
- 💾 Sauvegardées dans localStorage (session actuelle)
- 🔄 Réinitialisées au rechargement (page)

### Exemple: Stock

```javascript
{
  id: '1',
  sku: 'FILT-001',
  name: 'Filtre à cartouche',
  quantity: 45,
  minQuantity: 10,
  maxQuantity: 100,
  cost: 45.00,
  location: 'A-01'
}
```

---

## 🔧 STRUCTURE DE CODE

### Contextes

```
src/context/
├── AdminAuthContext.tsx      # Auth + Rôles
├── InventoryContext.tsx      # Stock
├── POSContext.tsx            # Caisse
└── ReceiptContext.tsx        # Reçus
```

### Pages Admin

```
src/app/admin/pages/
├── AdminLogin.tsx
├── AdminDashboard.tsx
├── ProductsPage.tsx
├── InventoryPage.tsx
├── POSPage.tsx
└── ReceiptsPage.tsx
```

### Layout

```
src/app/admin/layout/
├── AdminLayout.tsx
├── Sidebar.tsx
└── ProtectedRoute.tsx
```

---

## 🎨 INTERFACE

### Couleurs Principales

- 🔵 Bleu: Actions principales
- 🟢 Vert: Succès/Positif
- 🔴 Rouge: Danger/Négatif
- 🟡 Jaune: Avertissements

### Responsive

- 📱 Mobile-first
- 💻 Tablet optimisé
- 🖥️ Desktop complet

---

## 📝 PROCHAINES ÉTAPES

### Phase 2

- [ ] Backend API
- [ ] Base de données
- [ ] CRUD complet produits
- [ ] Gestion commandes
- [ ] Éditeur WYSIWYG pages
- [ ] Galerie médias

### Phase 3

- [ ] Paiements en ligne
- [ ] Notifications email/SMS
- [ ] Export PDF reçus
- [ ] Code barres/QR
- [ ] Analytiques avancées

---

## ❓ FAQ

### Q: Les données sont-elles persistantes?

**A:** Oui via localStorage pour la session actuelle.  
Phase 2 intégrera un vrai backend.

### Q: Comment changer de rôle?

**A:** En Phase 2 avec système d'utilisateurs.  
Actuellement: admin par défaut.

### Q: Comment modifier les produits?

**A:** Page produits créée, CRUD à développer.

### Q: Les reçus s'impriment?

**A:** Oui! Format HTML, impression navigateur.  
PDF en Phase 2 avec jsPDF.

---

## 🐛 Support

Pour les bugs/questions:

1. Vérifier les erreurs console (F12)
2. Vérifier les logs backend (Phase 2)
3. Réinitialiser localStorage si besoin

---

**Bon travail! 🎉**  
Le backoffice est prêt à être développé en phase 2.
