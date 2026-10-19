import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";
import { Header } from "./components/Header";
import { HomePage } from "./components/pages/HomePage";
import { Footer } from "./components/Footer";
import { ShopPage } from "./components/pages/ShopPage";
import { ProductPage } from "./components/pages/ProductPage";
import { WhatsAppButton } from "./components/WhatsAppButton";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OfflineBanner } from "./components/OfflineBanner";
import { CookieBanner } from "./components/CookieBanner";
import { trackPageview } from "../lib/monitoring";
import { Cart } from "./components/Cart";
import { CheckoutModal } from "./components/CheckoutModal";
import { CustomerBottomNav } from "./components/CustomerBottomNav";
import { ScrollToTop } from "./components/ScrollToTop";
import { ProtectedRoute } from "./admin/layout/ProtectedRoute";
import { Toaster } from "./components/ui/sonner";
import { useUserAuth } from "../context/UserAuthContext";
import { useIsInstalledApp } from "../lib/pwa";


// Pages publiques secondaires chargées à la demande : accueil, boutique et fiche produit restent immédiates
const GalleryPage = lazy(() => import("./components/pages/GalleryPage").then(m => ({ default: m.GalleryPage })));
const QuotePage = lazy(() => import("./components/pages/QuotePage").then(m => ({ default: m.QuotePage })));
const AboutPage = lazy(() => import("./components/pages/AboutPage").then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import("./components/pages/ContactPage").then(m => ({ default: m.ContactPage })));
const LoginPage = lazy(() => import("./components/pages/LoginPage").then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./components/pages/RegisterPage").then(m => ({ default: m.RegisterPage })));
const ProfilePage = lazy(() => import("./components/pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const OrdersPage = lazy(() => import("./components/pages/OrdersPage").then(m => ({ default: m.OrdersPage })));
const DynamicPage = lazy(() => import("./components/pages/DynamicPage").then(m => ({ default: m.DynamicPage })));
const OrderTrackingPage = lazy(() => import("./components/pages/OrderTrackingPage").then(m => ({ default: m.OrderTrackingPage })));
const NotFoundPage = lazy(() => import("./components/pages/NotFoundPage").then(m => ({ default: m.NotFoundPage })));
const FavoritesPage = lazy(() => import("./components/pages/FavoritesPage").then(m => ({ default: m.FavoritesPage })));
const BlogPage = lazy(() => import("./components/pages/BlogPage").then(m => ({ default: m.BlogPage })));
const BlogPostPage = lazy(() => import("./components/pages/BlogPage").then(m => ({ default: m.BlogPostPage })));
const ForgotPasswordPage = lazy(() => import("./components/pages/PasswordPages").then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("./components/pages/PasswordPages").then(m => ({ default: m.ResetPasswordPage })));

// Lazy loading des pages admin pour réduire la taille du bundle initial
const AdminLogin = lazy(() => import("./admin/pages/AdminLogin").then(m => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import("./admin/pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const ProductsPage = lazy(() => import("./admin/pages/ProductsPage").then(m => ({ default: m.ProductsPage })));
const ProductImportPage = lazy(() => import("./admin/pages/ProductImportPage").then(m => ({ default: m.ProductImportPage })));
const CustomersPage = lazy(() => import("./admin/pages/CustomersPage").then(m => ({ default: m.CustomersPage })));
const CategoriesPage = lazy(() => import("./admin/pages/CategoriesPage").then(m => ({ default: m.CategoriesPage })));
const AdminServicesPage = lazy(() => import("./admin/pages/ServicesPage").then(m => ({ default: m.ServicesPage })));
const BlogAdminPage = lazy(() => import("./admin/pages/BlogAdminPage").then(m => ({ default: m.BlogAdminPage })));
const MarketingPage = lazy(() => import("./admin/pages/MarketingPage").then(m => ({ default: m.MarketingPage })));
const PagesManagerPage = lazy(() => import("./admin/pages/PagesManagerPage").then(m => ({ default: m.PagesManagerPage })));
const OrdersAdminPage = lazy(() => import("./admin/pages/OrdersAdminPage").then(m => ({ default: m.OrdersAdminPage })));
const InventoryPage = lazy(() => import("./admin/pages/InventoryPage").then(m => ({ default: m.InventoryPage })));
const POSPage = lazy(() => import("./admin/pages/POSPage").then(m => ({ default: m.POSPage })));
const ReceiptsPage = lazy(() => import("./admin/pages/ReceiptsPage").then(m => ({ default: m.ReceiptsPage })));
const AnalyticsPage = lazy(() => import("./admin/pages/AnalyticsPage").then(m => ({ default: m.AnalyticsPage })));
const SettingsPage = lazy(() => import("./admin/pages/SettingsPage").then(m => ({ default: m.SettingsPage })));
const ReviewsPage  = lazy(() => import("./admin/pages/ReviewsPage").then(m => ({ default: m.ReviewsPage })));
const QuotesAdminPage = lazy(() => import("./admin/pages/QuotesAdminPage").then(m => ({ default: m.QuotesAdminPage })));

// Composant de chargement pour le Suspense
const AdminLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-ink-100 dark:bg-ink-900">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-ink-600 dark:text-ink-400">Chargement...</p>
    </div>
  </div>
);

const PageLoadingFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center" aria-busy="true">
    <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  const { theme } = useTheme();

  // L'application installée (PWA) est réservée au back-office : la vitrine et la
  // boutique n'y sont pas servies, toute autre URL retombe sur l'administration.
  const installedApp = useIsInstalledApp();

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <Routes>
        {/* Admin Login */}
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminLogin />
            </Suspense>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ProtectedRoute requiredPermission="view_dashboard">
                <AdminDashboard />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/admin/products"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ProtectedRoute requiredPermission="manage_products">
                <ProductsPage />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/admin/products/import"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ProtectedRoute requiredPermission="manage_products">
                <ProductImportPage />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ProtectedRoute requiredPermission="manage_customers">
                <CustomersPage />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ProtectedRoute requiredPermission="manage_categories">
                <CategoriesPage />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/admin/services"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ProtectedRoute requiredPermission="manage_services">
                <AdminServicesPage />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/admin/blog"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ProtectedRoute requiredPermission="manage_blog">
                <BlogAdminPage />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/admin/marketing"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ProtectedRoute requiredPermission="manage_discounts">
                <MarketingPage />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/admin/pages"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ProtectedRoute requiredPermission="manage_pages">
                <PagesManagerPage />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ProtectedRoute requiredPermission="manage_orders">
                <OrdersAdminPage />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ProtectedRoute requiredPermission="manage_inventory">
                <InventoryPage />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/admin/pos"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ProtectedRoute requiredPermission="manage_pos">
                <POSPage />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/admin/receipts"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ProtectedRoute requiredPermission="manage_receipts">
                <ReceiptsPage />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ProtectedRoute requiredPermission="view_analytics">
                <AnalyticsPage />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ProtectedRoute requiredPermission="manage_settings">
                <SettingsPage />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ProtectedRoute requiredPermission="manage_reviews">
                <ReviewsPage />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/admin/quotes"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ProtectedRoute requiredPermission="manage_orders">
                <QuotesAdminPage />
              </ProtectedRoute>
            </Suspense>
          }
        />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Pages publiques avec Header et Footer — absentes de l'application installée */}
        {installedApp ? (
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        ) : (
        <Route element={<Layout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/devis" element={<QuotePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/:slug" element={<ProductPage />} />
          <Route path="/suivi-commande" element={<OrderTrackingPage />} />
          <Route path="/favoris" element={<FavoritesPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/pages/:slug" element={<DynamicPage />} />
          {/* Page 404 avec le menu et le pied de page */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        )}
      </Routes>

      {/* Panier, caisse et navigation client : vitrine uniquement */}
      {!installedApp && (
        <>
          <Cart />
          <CustomerBottomNav />
          <CheckoutModal />
          <ScrollToTop />
        </>
      )}

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

function Layout() {
  const { pathname } = useLocation();
  const { isAuthenticated, isLoading } = useUserAuth();

  // Mesure d'audience : une page vue par navigation (sans effet si non configurée)
  useEffect(() => {
    trackPageview(pathname);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-white dark:bg-ink-950 flex flex-col transition-colors duration-300">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-brand-600 focus:shadow-lg"
      >
        Aller au contenu
      </a>
      <Header />
      <main
        id="contenu"
        className={`flex-1 ${isAuthenticated && !isLoading ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0' : ''}`}
      >
        <ErrorBoundary resetKey={pathname}>
          <Suspense fallback={<PageLoadingFallback />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      {!isAuthenticated && !isLoading && <Footer />}
      <WhatsAppButton />
      <OfflineBanner />
      <CookieBanner />
    </div>
  );
}
