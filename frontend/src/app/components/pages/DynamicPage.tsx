import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPage } from '../../../services/pages';
import {
  Droplet, Zap, Award, Users, Truck, Shield, Wrench, Star,
  MapPin, Phone, Mail, Clock, Loader2,
} from 'lucide-react';
import { useSeo } from '../../../lib/seo';

// ── Types ────────────────────────────────────────────────────────────────────

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface StatItem {
  value: string;
  label: string;
}

interface HeroBlock {
  type: 'hero';
  title: string;
  subtitle?: string;
  cta_label?: string;
  cta_link?: string;
}

interface FeaturesBlock {
  type: 'features';
  title?: string;
  items: FeatureItem[];
}

interface StatsBlock {
  type: 'stats';
  items: StatItem[];
}

interface SectionBlock {
  type: 'section';
  title?: string;
  content: string;
  align?: 'left' | 'center';
}

interface CtaBlock {
  type: 'cta';
  title: string;
  subtitle?: string;
  button_label: string;
  button_link: string;
}

interface ContactInfoBlock {
  type: 'contact_info';
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
}

type Block = HeroBlock | FeaturesBlock | StatsBlock | SectionBlock | CtaBlock | ContactInfoBlock;

interface ApiPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
}

// ── Icon map ─────────────────────────────────────────────────────────────────

const iconMap: Record<string, React.ElementType> = {
  droplet: Droplet,
  zap: Zap,
  award: Award,
  users: Users,
  truck: Truck,
  shield: Shield,
  wrench: Wrench,
  star: Star,
};

// ── Block renderers ───────────────────────────────────────────────────────────

function HeroSection({ block }: { block: HeroBlock }) {
  return (
    <section
      className="w-full py-24 px-4 text-white text-center"
      style={{ background: 'linear-gradient(135deg, #0077BE 0%, #00A8E8 100%)' }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{block.title}</h1>
        {block.subtitle && (
          <p className="text-lg md:text-xl text-brand-100 mb-8 max-w-2xl mx-auto">{block.subtitle}</p>
        )}
        {block.cta_label && block.cta_link && (
          <Link
            to={block.cta_link}
            className="inline-block px-8 py-3 bg-white font-semibold rounded-full transition hover:bg-brand-50"
            style={{ color: '#0077BE' }}
          >
            {block.cta_label}
          </Link>
        )}
      </div>
    </section>
  );
}

function FeaturesSection({ block }: { block: FeaturesBlock }) {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {block.title && (
          <h2 className="text-3xl font-bold text-center text-ink-900 mb-12">{block.title}</h2>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {block.items.map((item, idx) => {
            const IconComponent = iconMap[item.icon] ?? Droplet;
            return (
              <div key={idx} className="p-6 rounded-xl border border-ink-200 hover:shadow-md transition-shadow">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: '#EFF8FF' }}
                >
                  <IconComponent size={24} style={{ color: '#0077BE' }} />
                </div>
                <h3 className="text-lg font-semibold text-ink-900 mb-2">{item.title}</h3>
                <p className="text-ink-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StatsSection({ block }: { block: StatsBlock }) {
  return (
    <section className="py-16 px-4 bg-ink-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-center gap-12">
          {block.items.map((item, idx) => (
            <div key={idx} className="text-center">
              <p className="text-4xl md:text-5xl font-bold mb-2" style={{ color: '#0077BE' }}>
                {item.value}
              </p>
              <p className="text-ink-500 text-sm font-medium uppercase tracking-wide">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

let sectionCount = 0;

function SectionBlock_({ block }: { block: SectionBlock }) {
  sectionCount++;
  const isEven = sectionCount % 2 === 0;
  return (
    <section className={`py-16 px-4 ${isEven ? 'bg-ink-50' : 'bg-white'}`}>
      <div className={`max-w-3xl mx-auto ${block.align === 'center' ? 'text-center' : 'text-left'}`}>
        {block.title && (
          <h2 className="text-3xl font-bold text-ink-900 mb-6">{block.title}</h2>
        )}
        <div className="text-ink-600 leading-relaxed whitespace-pre-line">{block.content}</div>
      </div>
    </section>
  );
}

function CtaSection({ block }: { block: CtaBlock }) {
  return (
    <section
      className="py-16 px-4 text-white text-center"
      style={{ background: 'linear-gradient(135deg, #0077BE 0%, #00A8E8 100%)' }}
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">{block.title}</h2>
        {block.subtitle && (
          <p className="text-brand-100 text-lg mb-8">{block.subtitle}</p>
        )}
        <Link
          to={block.button_link}
          className="inline-block px-8 py-3 bg-white font-semibold rounded-full transition hover:bg-brand-50"
          style={{ color: '#0077BE' }}
        >
          {block.button_label}
        </Link>
      </div>
    </section>
  );
}

function ContactInfoSection({ block }: { block: ContactInfoBlock }) {
  const items: Array<{ icon: React.ElementType; label: string; value: string | undefined }> = [
    { icon: MapPin, label: 'Adresse', value: block.address },
    { icon: Phone, label: 'Téléphone', value: block.phone },
    { icon: Mail, label: 'Email', value: block.email },
    { icon: Clock, label: 'Horaires', value: block.hours },
  ].filter(i => i.value);

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div key={idx} className="flex gap-4 p-6 rounded-xl border border-ink-200 hover:shadow-md transition-shadow">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#EFF8FF' }}
                >
                  <IconComponent size={22} style={{ color: '#0077BE' }} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-1">{item.label}</p>
                  <p className="text-ink-800 font-medium">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function renderBlock(block: Block, index: number): React.ReactNode {
  switch (block.type) {
    case 'hero':
      return <HeroSection key={index} block={block} />;
    case 'features':
      return <FeaturesSection key={index} block={block} />;
    case 'stats':
      return <StatsSection key={index} block={block} />;
    case 'section':
      return <SectionBlock_ key={index} block={block} />;
    case 'cta':
      return <CtaSection key={index} block={block} />;
    case 'contact_info':
      return <ContactInfoSection key={index} block={block} />;
    default:
      return null;
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export const DynamicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<ApiPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useSeo({
    title: page?.meta_title || page?.title || (notFound ? "Page introuvable" : undefined),
    description: page?.meta_description ?? undefined,
    noindex: notFound,
  });

  useEffect(() => {
    if (!slug) return;
    sectionCount = 0;
    setLoading(true);
    setNotFound(false);
    setPage(null);

    fetchPage(slug)
      .then((res: any) => {
        const data: ApiPage = res?.data ?? res;
        if (!data || !data.id) {
          setNotFound(true);
        } else {
          setPage(data);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-ink-400">
        <Loader2 size={32} className="animate-spin" style={{ color: '#0077BE' }} />
        <span className="text-lg">Chargement...</span>
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <p className="text-6xl font-bold mb-4" style={{ color: '#0077BE' }}>404</p>
        <h1 className="text-2xl font-semibold text-ink-900 mb-2">Page introuvable</h1>
        <p className="text-ink-600 mb-8">La page que vous recherchez n'existe pas ou a été déplacée.</p>
        <Link
          to="/"
          className="px-6 py-2.5 text-white font-medium rounded-full transition hover:opacity-90"
          style={{ backgroundColor: '#0077BE' }}
        >
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  let blocks: Block[] = [];
  try {
    const parsed = JSON.parse(page.content);
    if (Array.isArray(parsed)) {
      blocks = parsed as Block[];
    } else {
      blocks = [{ type: 'section', content: page.content, align: 'left' }];
    }
  } catch {
    blocks = [{ type: 'section', title: page.title, content: page.content, align: 'left' }];
  }

  // Reset section counter for alternating backgrounds
  sectionCount = 0;

  return (
    <div className="w-full">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
};
