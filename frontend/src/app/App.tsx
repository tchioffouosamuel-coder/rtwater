import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";
import { Header } from "./components/Header";
import { HomePage } from "./components/pages/HomePage";
import { GalleryPage } from "./components/pages/GalleryPage";
import { QuotePage } from "./components/pages/QuotePage";
import { AboutPage } from "./components/pages/AboutPage";
import { Footer } from "./components/Footer";
import { ContactPage } from "./components/pages/ContactPage";
import { ShopPage } from "./components/pages/ShopPage";
import { LoginPage } from "./components/pages/LoginPage";
import { RegisterPage } from "./components/pages/RegisterPage";
import { ProfilePage } from "./components/pages/ProfilePage";
import { OrdersPage } from "./components/pages/OrdersPage";
import { BlogPage, BlogPostPage } from "./components/pages/BlogPage";
import { DynamicPage } from "./components/pages/DynamicPage";
import { Cart } from "./components/Cart";
import { CheckoutModal } from "./components/CheckoutModal";
import { ScrollToTop } from "./components/ScrollToTop";
import { ProtectedRoute } from "./admin/layout/ProtectedRoute";
import { Toaster } from "./components/ui/sonner";

// Lazy loading des pages admin pour réduire la taille du bundle initial
const AdminLogin = lazy(() => import("./admin/pages/AdminLogin").then(m => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import("./admin/pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const ProductsPage = lazy(() => import("./admin/pages/ProductsPage").then(m => ({ default: m.ProductsPage })));
const PagesManagerPage = lazy(() => import("./admin/pages/PagesManagerPage").then(m => ({ default: m.PagesManagerPage })));
const OrdersAdminPage = lazy(() => import("./admin/pages/OrdersAdminPage").then(m => ({ default: m.OrdersAdminPage })));
const InventoryPage = lazy(() => import("./admin/pages/InventoryPage").then(m => ({ default: m.InventoryPage })));
const POSPage = lazy(() => import("./admin/pages/POSPage").then(m => ({ default: m.POSPage })));
const ReceiptsPage = lazy(() => import("./admin/pages/ReceiptsPage").then(m => ({ default: m.ReceiptsPage })));
const AnalyticsPage = lazy(() => import("./admin/pages/AnalyticsPage").then(m => ({ default: m.AnalyticsPage })));
const SettingsPage = lazy(() => import("./admin/pages/SettingsPage").then(m => ({ default: m.SettingsPage })));
const ReviewsPage  = lazy(() => import("./admin/pages/ReviewsPage").then(m => ({ default: m.ReviewsPage })));

// Composant de chargement pour le Suspense
const AdminLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
    </div>
  </div>
);

export default function App() {
  const { theme } = useTheme();

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
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Pages publiques avec Header et Footer */}
        <Route element={<Layout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/devis" element={<QuotePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/pages/:slug" element={<DynamicPage />} />
        </Route>

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Cart Sidebar - Global */}
      <Cart />

      {/* Toast notifications */}
      <Toaster />

      {/* Checkout Modal - Global */}
      <CheckoutModal />

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
}

function Layout() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
