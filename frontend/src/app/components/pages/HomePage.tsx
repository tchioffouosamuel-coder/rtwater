import { HeroSection } from "../HeroSection";
import { AnnouncementBanner } from "../AnnouncementBanner";
import { AnnouncementModal } from "../AnnouncementModal";
import { NewProductsSection } from "../NewProductsSection";
import { AdToasts } from "../AdToasts";
import { ServicesSection } from "../ServicesSection";
import { TrustSection } from "../TrustSection";
import { CTASection } from "../CTASection";
import { useSeo } from "../../../lib/seo";

export function HomePage() {
  useSeo({
    description: "Spécialiste du traitement de l'eau à Yaoundé : filtres, osmoseurs, adoucisseurs, installation et maintenance. Boutique en ligne et devis gratuit.",
    path: "/",
  });
  return (
    <>
      <HeroSection />
      <NewProductsSection />
      <ServicesSection />
      <TrustSection />
      <CTASection />
      {/* Annonces : bandeaux collés au bord de l'écran, pubs flottantes et
          modales. Montées ici, elles ne suivent pas le visiteur hors de
          l'accueil, et aucune ne décale le contenu de la page. */}
      <AnnouncementBanner />
      <AdToasts />
      <AnnouncementModal />
    </>
  );
}
