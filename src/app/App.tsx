import { useState } from "react";
import { Header } from "./components/Header";
import { HomePage } from "./components/pages/HomePage";
import { GalleryPage } from "./components/pages/GalleryPage";
import { QuotePage } from "./components/pages/QuotePage";
import { AboutPage } from "./components/pages/AboutPage";
import { Footer } from "./components/Footer";

export type Page = "accueil" | "galerie" | "devis" | "apropos";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("accueil");

  const renderPage = () => {
    switch (currentPage) {
      case "galerie":
        return <GalleryPage />;
      case "devis":
        return <QuotePage />;
      case "apropos":
        return <AboutPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {renderPage()}
      <Footer setCurrentPage={setCurrentPage} />
    </div>
  );
}
