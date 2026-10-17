import { HeroSection } from "../HeroSection";
import { AnnouncementBanner } from "../AnnouncementBanner";
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
      {/* Bandeau d'annonces : il chevauche le bas du héros, là où le regard arrive */}
      <AnnouncementBanner />
      <NewProductsSection />
      <ServicesSection />
      <TrustSection />
      <CTASection />
      {/* Pubs flottantes : montées ici, elles ne suivent pas le visiteur hors de l'accueil */}
      <AdToasts />
    </>
  );
}
