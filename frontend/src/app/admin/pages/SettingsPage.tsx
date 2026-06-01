import React, { useState } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { Save, Building2, Zap, Bell, Lock, Palette, Database, AlertCircle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);

  // Form states
  const [settings, setSettings] = useState({
    // Général
    siteName: 'RTWater',
    siteDescription: 'Votre boutique aquatique en ligne',
    companyName: 'RTWater SARL',
    companyEmail: 'contact@rtwater.com',
    companyPhone: '+33 1 23 45 67 89',
    companyAddress: '123 Rue de l\'Eau, 75000 Paris',
    companyPhone2: '+33 1 98 76 54 32',
    
    // Paiement
    taxRate: 20,
    currency: 'EUR',
    paymentMethods: ['cash', 'card', 'check', 'transfer'],
    stripeKey: '',
    
    // Stock
    lowStockAlert: 10,
    criticalStockLevel: 5,
    autoReorderEnabled: false,
    
    // Notifications
    notifyOrdersEnabled: true,
    notifyStockEnabled: true,
    notifyPaymentEnabled: true,
    notificationEmail: 'admin@rtwater.com',
    
    // Sécurité
    sessionTimeout: 30,
    passwordMinLength: 8,
    
    // Affichage
    productsPerPage: 20,
    darkMode: false,
    language: 'fr',
  });

  if (!hasPermission('manage_settings')) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600 font-semibold">Accès refusé</p>
        </div>
      </AdminLayout>
    );
  }

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Building2 },
    { id: 'payment', label: 'Paiement', icon: Zap },
    { id: 'stock', label: 'Stock', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Lock },
    { id: 'display', label: 'Affichage', icon: Palette },
  ];

  return (
    <AdminLayout
      title="Paramètres"
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Paramètres' },
      ]}
    >
      {/* Notification */}
      {saved && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-600"></div>
          <p className="text-sm font-medium">Paramètres sauvegardés avec succès</p>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-slate-200">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Informations du site</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Nom du site</label>
                      <input
                        type="text"
                        value={settings.siteName}
                        onChange={(e) => handleChange('siteName', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                      <textarea
                        value={settings.siteDescription}
                        onChange={(e) => handleChange('siteDescription', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Informations de l'entreprise</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Nom de l'entreprise</label>
                      <input
                        type="text"
                        value={settings.companyName}
                        onChange={(e) => handleChange('companyName', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Adresse</label>
                      <input
                        type="text"
                        value={settings.companyAddress}
                        onChange={(e) => handleChange('companyAddress', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone principal</label>
                        <input
                          type="tel"
                          value={settings.companyPhone}
                          onChange={(e) => handleChange('companyPhone', e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Téléphone secondaire</label>
                        <input
                          type="tel"
                          value={settings.companyPhone2}
                          onChange={(e) => handleChange('companyPhone2', e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={settings.companyEmail}
                        onChange={(e) => handleChange('companyEmail', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENT TAB */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Configuration des paiements</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Devise</label>
                        <select
                          value={settings.currency}
                          onChange={(e) => handleChange('currency', e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                          <option value="XAF">Franc (XAF)</option>
                          <option value="USD">Dollar ($)</option>
                          <option value="GBP">Livre (£)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Taux TVA (%)</label>
                        <input
                          type="number"
                          value={settings.taxRate}
                          onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))}
                          min="0"
                          max="100"
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">Méthodes de paiement acceptées</label>
                      <div className="space-y-2">
                        {[
                          { id: 'cash', label: 'Espèces' },
                          { id: 'card', label: 'Carte bancaire' },
                          { id: 'check', label: 'Chèque' },
                          { id: 'transfer', label: 'Virement' },
                        ].map((method) => (
                          <label key={method.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={settings.paymentMethods.includes(method.id)}
                              onChange={(e) => {
                                const methods = e.target.checked
                                  ? [...settings.paymentMethods, method.id]
                                  : settings.paymentMethods.filter(m => m !== method.id);
                                handleChange('paymentMethods', methods);
                              }}
                              className="w-4 h-4 rounded border-slate-300"
                            />
                            <span className="text-sm text-slate-700">{method.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Clé Stripe (optionnel)</label>
                        <input
                          type="password"
                          value={settings.stripeKey}
                          onChange={(e) => handleChange('stripeKey', e.target.value)}
                          placeholder="sk_live_..."
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">Pour activer les paiements en ligne</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STOCK TAB */}
            {activeTab === 'stock' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Gestion du stock</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Seuil stock faible</label>
                        <input
                          type="number"
                          value={settings.lowStockAlert}
                          onChange={(e) => handleChange('lowStockAlert', parseInt(e.target.value))}
                          min="1"
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">Alerte si stock ≤ cette valeur</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Seuil critique</label>
                        <input
                          type="number"
                          value={settings.criticalStockLevel}
                          onChange={(e) => handleChange('criticalStockLevel', parseInt(e.target.value))}
                          min="0"
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">Alerte urgente si ≤ cette valeur</p>
                      </div>
                    </div>

                    <label className="flex items-center gap-3 p-3 rounded hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={settings.autoReorderEnabled}
                        onChange={(e) => handleChange('autoReorderEnabled', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-900">Auto-commande stock</span>
                        <p className="text-xs text-slate-500">Créer une commande fournisseur automatiquement</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Préférences de notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={settings.notifyOrdersEnabled}
                        onChange={(e) => handleChange('notifyOrdersEnabled', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-900">Nouvelles commandes</span>
                        <p className="text-xs text-slate-500">Recevoir une alerte pour chaque nouvelle commande</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={settings.notifyStockEnabled}
                        onChange={(e) => handleChange('notifyStockEnabled', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-900">Alertes stock</span>
                        <p className="text-xs text-slate-500">Notifier en cas de stock faible ou critique</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={settings.notifyPaymentEnabled}
                        onChange={(e) => handleChange('notifyPaymentEnabled', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-900">Paiements reçus</span>
                        <p className="text-xs text-slate-500">Recevoir une confirmation de paiement</p>
                      </div>
                    </label>
                  </div>

                  <div className="border-t border-slate-200 pt-4 mt-4">
                    <h4 className="text-sm font-medium text-slate-900 mb-3">Email de notification</h4>
                    <input
                      type="email"
                      value={settings.notificationEmail}
                      onChange={(e) => handleChange('notificationEmail', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                  <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">Les paramètres de sécurité affectent tous les utilisateurs du backoffice.</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Configuration de sécurité</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Délai d'inactivité (minutes)
                      </label>
                      <input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                        min="5"
                        max="480"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                      <p className="text-xs text-slate-500 mt-1">Déconnexion après cette durée d'inactivité</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Longueur minimale du mot de passe
                      </label>
                      <input
                        type="number"
                        value={settings.passwordMinLength}
                        onChange={(e) => handleChange('passwordMinLength', parseInt(e.target.value))}
                        min="4"
                        max="32"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                      <p className="text-xs text-slate-500 mt-1">Minimum de caractères requis pour les mots de passe</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DISPLAY TAB */}
            {activeTab === 'display' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Préférences d'affichage</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Produits par page
                      </label>
                      <select
                        value={settings.productsPerPage}
                        onChange={(e) => handleChange('productsPerPage', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Langue</label>
                      <select
                        value={settings.language}
                        onChange={(e) => handleChange('language', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-3 p-3 rounded hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={settings.darkMode}
                        onChange={(e) => handleChange('darkMode', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-900">Mode sombre</span>
                        <p className="text-xs text-slate-500">Activer le thème sombre du backoffice</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 h-fit">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Actions</h3>
          
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition mb-4"
          >
            <Save size={18} />
            Enregistrer les modifications
          </button>

          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-900 font-medium mb-1">💡 Astuce</p>
              <p className="text-blue-800 text-xs">Les modifications prennent effet immédiatement.</p>
            </div>

            <div className="border-t border-slate-200 pt-3 mt-3">
              <p className="text-slate-600 font-medium mb-2">Onglets disponibles:</p>
              <ul className="text-slate-500 text-xs space-y-1">
                <li>• Général - Infos du site</li>
                <li>• Paiement - Modes de paiement</li>
                <li>• Stock - Gestion inventaire</li>
                <li>• Notifications - Alertes</li>
                <li>• Sécurité - Paramètres sécurité</li>
                <li>• Affichage - Apparence</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
