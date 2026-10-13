import { HeroSection } from "../HeroSection";
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
      <ServicesSection />
      <TrustSection />
      <CTASection />
    </>
  );
}
