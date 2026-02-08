import { Routes, Route, Navigate } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";
import { Header } from "./components/Header";
import { HomePage } from "./components/pages/HomePage";
import { GalleryPage } from "./components/pages/GalleryPage";
import { QuotePage } from "./components/pages/QuotePage";
import { AboutPage } from "./components/pages/AboutPage";
import { LoginPage } from "./components/pages/LoginPage";
import { RegisterPage } from "./components/pages/RegisterPage";
import { ForgotPasswordPage } from "./components/pages/ForgotPasswordPage";
import { Footer } from "./components/Footer";
import { ContactPage } from "./components/pages/ContactPage";

export default function App() {
  const { theme } = useTheme();

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <Routes>
        {/* Pages publiques avec Header et Footer */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/devis" element={<QuotePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Route>

        {/* Pages d'authentification sans Header/Footer */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signin" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function Layout() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/devis" element={<QuotePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
