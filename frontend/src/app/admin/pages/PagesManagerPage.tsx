import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../layout/AdminLayout';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useSiteContent } from '../../../context/SiteContentContext';
import pagesService from '../../../services/pages';
import {
  Plus, Edit2, Trash2, X, Save, Loader2, AlertCircle, ChevronDown, ChevronUp,
  Image as ImageIcon, Globe, Layout, Users, Phone, Camera,
} from 'lucide-react';
import {
  DEFAULT_HOME, DEFAULT_ABOUT, DEFAULT_CONTACT, DEFAULT_GALLERY, DEFAULT_HEADER, DEFAULT_FOOTER,
} from '../../../types/site-content';
import type {
  HomeContent, AboutContent, ContactContent, GalleryContent, HeaderContent, FooterContent,
  HeroContent, ServicesContent, TrustContent, CtaContent,
  ServiceItem, StatItem, AboutValue, TimelineEvent, AboutStat, GalleryImage,
  NavLink, SocialLink,
} from '../../../types/site-content';

// ── Helpers ───────────────────────────────────────────────────────────────────

interface ApiPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function parsePageContent<T>(content: string | null | undefined, defaults: T): T {
  if (!content) return defaults;
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { ...defaults, ...(parsed as object) } as T;
    }
  } catch { /* ignore */ }
  return defaults;
}

// ── Reusable Field Components ─────────────────────────────────────────────────

function TextField({
  label, value, onChange, placeholder = '', mono = false, multiline = false, rows = 3,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; mono?: boolean; multiline?: boolean; rows?: number;
}) {
  const cls = `w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition ${mono ? 'font-mono' : ''}`;
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={`${cls} resize-y`} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="https://..."
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
      />
      {value && (
        <img
          src={value}
          alt=""
          className="h-24 w-full object-cover rounded-lg border border-slate-200"
          onError={e => (e.currentTarget.style.display = 'none')}
        />
      )}
    </div>
  );
}

function ArrayItemRow({
  index, expanded, onToggle, onDelete, label, children,
}: {
  index: number; expanded: boolean; onToggle: () => void; onDelete: () => void;
  label: string; children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2 bg-slate-50 cursor-pointer select-none"
        onClick={onToggle}
      >
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
          >
            <Trash2 size={13} />
          </button>
          {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </div>
      {expanded && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );
}

const SERVICE_ICONS = ['droplet', 'zap', 'beaker', 'drill', 'waves', 'wrench', 'award', 'users'];
const GALLERY_CATEGORIES = ['drilling', 'purification', 'pools', 'pumps', 'installation', 'maintenance', 'projects'];

// ── Section Editors ───────────────────────────────────────────────────────────

function HeroEditor({ data, onChange }: { data: HeroContent; onChange: (d: HeroContent) => void }) {
  return (
    <div className="space-y-4">
      <TextField label="Badge" value={data.badge} onChange={v => onChange({ ...data, badge: v })} placeholder="Ex: Leader en traitement d'eau" />
      <TextField label="Titre" value={data.title} onChange={v => onChange({ ...data, title: v })} />
      <TextField label="Titre (partie colorée)" value={data.titleHighlight} onChange={v => onChange({ ...data, titleHighlight: v })} />
      <TextField label="Description" value={data.description} onChange={v => onChange({ ...data, description: v })} multiline rows={3} />
      <ImageField label="Image de fond" value={data.backgroundImage} onChange={v => onChange({ ...data, backgroundImage: v })} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Bouton Services" value={data.servicesButtonLabel} onChange={v => onChange({ ...data, servicesButtonLabel: v })} />
        <TextField label="Bouton Contact" value={data.contactButtonLabel} onChange={v => onChange({ ...data, contactButtonLabel: v })} />
      </div>
    </div>
  );
}

function ServicesEditor({ data, onChange }: { data: ServicesContent; onChange: (d: ServicesContent) => void }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const updateItem = (idx: number, item: ServiceItem) => {
    const items = data.items.map((it, i) => i === idx ? item : it);
    onChange({ ...data, items });
  };

  const addItem = () => {
    const newItem: ServiceItem = { icon: 'droplet', title: '', description: '', gradient: 'from-blue-500 to-cyan-500' };
    onChange({ ...data, items: [...data.items, newItem] });
    setExpandedIdx(data.items.length);
  };

  const removeItem = (idx: number) => {
    onChange({ ...data, items: data.items.filter((_, i) => i !== idx) });
    if (expandedIdx === idx) setExpandedIdx(null);
  };

  return (
    <div className="space-y-4">
      <TextField label="Sous-titre de section" value={data.sectionSubtitle} onChange={v => onChange({ ...data, sectionSubtitle: v })} />
      <TextField label="Titre de section" value={data.sectionTitle} onChange={v => onChange({ ...data, sectionTitle: v })} />
      <TextField label="Description de section" value={data.sectionDescription} onChange={v => onChange({ ...data, sectionDescription: v })} multiline rows={2} />
      <ImageField label="Image de fond" value={data.backgroundImage} onChange={v => onChange({ ...data, backgroundImage: v })} />
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Services ({data.items.length})</p>
        {data.items.map((item, idx) => (
          <ArrayItemRow
            key={idx}
            index={idx}
            expanded={expandedIdx === idx}
            onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            onDelete={() => removeItem(idx)}
            label={item.title || `Service ${idx + 1}`}
          >
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">Icône</label>
              <select
                value={item.icon}
                onChange={e => updateItem(idx, { ...item, icon: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
              >
                {SERVICE_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
            <TextField label="Titre" value={item.title} onChange={v => updateItem(idx, { ...item, title: v })} />
            <TextField label="Description" value={item.description} onChange={v => updateItem(idx, { ...item, description: v })} multiline rows={2} />
            <TextField label="Gradient (ex: from-blue-500 to-cyan-500)" value={item.gradient} onChange={v => updateItem(idx, { ...item, gradient: v })} mono />
          </ArrayItemRow>
        ))}
        <button
          onClick={addItem}
          className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 hover:text-blue-600 transition w-full justify-center"
        >
          <Plus size={14} /> Ajouter un service
        </button>
      </div>
    </div>
  );
}

function TrustEditor({ data, onChange }: { data: TrustContent; onChange: (d: TrustContent) => void }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const updateStat = (idx: number, stat: StatItem) => {
    const stats = data.stats.map((s, i) => i === idx ? stat : s);
    onChange({ ...data, stats });
  };

  const addStat = () => {
    onChange({ ...data, stats: [...data.stats, { value: '', suffix: '+', label: '', description: '' }] });
    setExpandedIdx(data.stats.length);
  };

  const removeStat = (idx: number) => {
    onChange({ ...data, stats: data.stats.filter((_, i) => i !== idx) });
    if (expandedIdx === idx) setExpandedIdx(null);
  };

  return (
    <div className="space-y-4">
      <TextField label="Sous-titre de section" value={data.sectionSubtitle} onChange={v => onChange({ ...data, sectionSubtitle: v })} />
      <TextField label="Titre de section" value={data.sectionTitle} onChange={v => onChange({ ...data, sectionTitle: v })} />
      <TextField label="Titre (partie colorée)" value={data.sectionTitleHighlight} onChange={v => onChange({ ...data, sectionTitleHighlight: v })} />
      <TextField label="Description" value={data.sectionDescription} onChange={v => onChange({ ...data, sectionDescription: v })} multiline rows={2} />
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Statistiques ({data.stats.length})</p>
        {data.stats.map((stat, idx) => (
          <ArrayItemRow
            key={idx}
            index={idx}
            expanded={expandedIdx === idx}
            onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            onDelete={() => removeStat(idx)}
            label={stat.label || `Stat ${idx + 1}`}
          >
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Valeur" value={stat.value} onChange={v => updateStat(idx, { ...stat, value: v })} placeholder="15" />
              <TextField label="Suffixe" value={stat.suffix} onChange={v => updateStat(idx, { ...stat, suffix: v })} placeholder="+" />
            </div>
            <TextField label="Label" value={stat.label} onChange={v => updateStat(idx, { ...stat, label: v })} />
            <TextField label="Description" value={stat.description} onChange={v => updateStat(idx, { ...stat, description: v })} />
          </ArrayItemRow>
        ))}
        <button
          onClick={addStat}
          className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 hover:text-blue-600 transition w-full justify-center"
        >
          <Plus size={14} /> Ajouter une statistique
        </button>
      </div>
    </div>
  );
}

function CtaEditor({ data, onChange }: { data: CtaContent; onChange: (d: CtaContent) => void }) {
  const updateIndicator = (idx: number, val: string) => {
    const indicators = data.trustIndicators.map((ti, i) => i === idx ? val : ti);
    onChange({ ...data, trustIndicators: indicators });
  };

  return (
    <div className="space-y-4">
      <TextField label="Badge" value={data.badge} onChange={v => onChange({ ...data, badge: v })} />
      <TextField label="Titre" value={data.title} onChange={v => onChange({ ...data, title: v })} />
      <TextField label="Titre (partie colorée)" value={data.titleHighlight} onChange={v => onChange({ ...data, titleHighlight: v })} />
      <TextField label="Description" value={data.description} onChange={v => onChange({ ...data, description: v })} multiline rows={3} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Bouton Contact" value={data.contactButtonLabel} onChange={v => onChange({ ...data, contactButtonLabel: v })} />
        <TextField label="Bouton Services" value={data.servicesButtonLabel} onChange={v => onChange({ ...data, servicesButtonLabel: v })} />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-600">Indicateurs de confiance (3 items)</p>
        {[0, 1, 2].map(idx => (
          <TextField
            key={idx}
            label={`Indicateur ${idx + 1}`}
            value={data.trustIndicators[idx] ?? ''}
            onChange={v => updateIndicator(idx, v)}
          />
        ))}
      </div>
    </div>
  );
}

// Home editor with 4 tabs
function HomeEditor({ data, onChange }: { data: HomeContent; onChange: (d: HomeContent) => void }) {
  const [tab, setTab] = useState<'hero' | 'services' | 'trust' | 'cta'>('hero');
  const tabs = [
    { key: 'hero', label: 'Hero' },
    { key: 'services', label: 'Services' },
    { key: 'trust', label: 'Chiffres' },
    { key: 'cta', label: 'CTA' },
  ] as const;

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition -mb-px ${tab === t.key ? 'bg-white border border-slate-200 border-b-white text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'hero' && <HeroEditor data={data.hero} onChange={hero => onChange({ ...data, hero })} />}
      {tab === 'services' && <ServicesEditor data={data.services} onChange={services => onChange({ ...data, services })} />}
      {tab === 'trust' && <TrustEditor data={data.trust} onChange={trust => onChange({ ...data, trust })} />}
      {tab === 'cta' && <CtaEditor data={data.cta} onChange={cta => onChange({ ...data, cta })} />}
    </div>
  );
}

// About editor
function AboutEditor({ data, onChange }: { data: AboutContent; onChange: (d: AboutContent) => void }) {
  const [tab, setTab] = useState<'hero' | 'mission' | 'stats' | 'values' | 'timeline'>('hero');
  const [expandedVal, setExpandedVal] = useState<number | null>(null);
  const [expandedTl, setExpandedTl] = useState<number | null>(null);

  const tabs = [
    { key: 'hero', label: 'Hero' },
    { key: 'mission', label: 'Mission' },
    { key: 'stats', label: 'Statistiques' },
    { key: 'values', label: 'Valeurs' },
    { key: 'timeline', label: 'Chronologie' },
  ] as const;

  const updateValue = (idx: number, val: AboutValue) => {
    onChange({ ...data, values: data.values.map((v, i) => i === idx ? val : v) });
  };
  const addValue = () => {
    onChange({ ...data, values: [...data.values, { icon: 'droplet', title: '', description: '', gradient: 'from-blue-500 to-cyan-500' }] });
    setExpandedVal(data.values.length);
  };
  const removeValue = (idx: number) => {
    onChange({ ...data, values: data.values.filter((_, i) => i !== idx) });
    if (expandedVal === idx) setExpandedVal(null);
  };

  const updateTimeline = (idx: number, tl: TimelineEvent) => {
    onChange({ ...data, timeline: data.timeline.map((t, i) => i === idx ? tl : t) });
  };
  const addTimeline = () => {
    onChange({ ...data, timeline: [...data.timeline, { year: '', event: '' }] });
    setExpandedTl(data.timeline.length);
  };
  const removeTimeline = (idx: number) => {
    onChange({ ...data, timeline: data.timeline.filter((_, i) => i !== idx) });
    if (expandedTl === idx) setExpandedTl(null);
  };

  const updateStat = (idx: number, stat: AboutStat) => {
    onChange({ ...data, stats: data.stats.map((s, i) => i === idx ? stat : s) });
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-6 border-b border-slate-200">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition -mb-px ${tab === t.key ? 'bg-white border border-slate-200 border-b-white text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hero' && (
        <div className="space-y-4">
          <TextField label="Badge" value={data.heroBadge} onChange={v => onChange({ ...data, heroBadge: v })} />
          <TextField label="Titre" value={data.heroTitle} onChange={v => onChange({ ...data, heroTitle: v })} />
          <TextField label="Titre (partie colorée)" value={data.heroTitleHighlight} onChange={v => onChange({ ...data, heroTitleHighlight: v })} />
          <TextField label="Description" value={data.heroDescription} onChange={v => onChange({ ...data, heroDescription: v })} multiline rows={3} />
        </div>
      )}

      {tab === 'mission' && (
        <div className="space-y-4">
          <TextField label="Badge" value={data.missionBadge} onChange={v => onChange({ ...data, missionBadge: v })} />
          <TextField label="Titre" value={data.missionTitle} onChange={v => onChange({ ...data, missionTitle: v })} />
          <TextField label="Description 1" value={data.missionDescription1} onChange={v => onChange({ ...data, missionDescription1: v })} multiline rows={3} />
          <TextField label="Description 2" value={data.missionDescription2} onChange={v => onChange({ ...data, missionDescription2: v })} multiline rows={3} />
        </div>
      )}

      {tab === 'stats' && (
        <div className="space-y-3">
          {data.stats.map((stat, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-3 p-3 border border-slate-200 rounded-lg">
              <TextField label="Valeur" value={stat.value} onChange={v => updateStat(idx, { ...stat, value: v })} placeholder="15+" />
              <TextField label="Label" value={stat.label} onChange={v => updateStat(idx, { ...stat, label: v })} />
            </div>
          ))}
        </div>
      )}

      {tab === 'values' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <TextField label="Badge valeurs" value={data.valuesBadge} onChange={v => onChange({ ...data, valuesBadge: v })} />
          </div>
          <TextField label="Titre valeurs" value={data.valuesTitle} onChange={v => onChange({ ...data, valuesTitle: v })} />
          <div className="space-y-2">
            {data.values.map((val, idx) => (
              <ArrayItemRow
                key={idx}
                index={idx}
                expanded={expandedVal === idx}
                onToggle={() => setExpandedVal(expandedVal === idx ? null : idx)}
                onDelete={() => removeValue(idx)}
                label={val.title || `Valeur ${idx + 1}`}
              >
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600">Icône</label>
                  <select
                    value={val.icon}
                    onChange={e => updateValue(idx, { ...val, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                  >
                    {['droplet', 'zap', 'award', 'users', 'target', 'globe', 'wrench', 'shield'].map(ic => (
                      <option key={ic} value={ic}>{ic}</option>
                    ))}
                  </select>
                </div>
                <TextField label="Titre" value={val.title} onChange={v => updateValue(idx, { ...val, title: v })} />
                <TextField label="Description" value={val.description} onChange={v => updateValue(idx, { ...val, description: v })} multiline rows={2} />
                <TextField label="Gradient" value={val.gradient} onChange={v => updateValue(idx, { ...val, gradient: v })} mono />
              </ArrayItemRow>
            ))}
            <button
              onClick={addValue}
              className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 hover:text-blue-600 transition w-full justify-center"
            >
              <Plus size={14} /> Ajouter une valeur
            </button>
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="space-y-4">
          <TextField label="Badge chronologie" value={data.timelineBadge} onChange={v => onChange({ ...data, timelineBadge: v })} />
          <TextField label="Titre chronologie" value={data.timelineTitle} onChange={v => onChange({ ...data, timelineTitle: v })} />
          <div className="space-y-2">
            {data.timeline.map((item, idx) => (
              <ArrayItemRow
                key={idx}
                index={idx}
                expanded={expandedTl === idx}
                onToggle={() => setExpandedTl(expandedTl === idx ? null : idx)}
                onDelete={() => removeTimeline(idx)}
                label={item.year ? `${item.year} — ${item.event.slice(0, 30)}` : `Événement ${idx + 1}`}
              >
                <div className="grid grid-cols-4 gap-3">
                  <TextField label="Année" value={item.year} onChange={v => updateTimeline(idx, { ...item, year: v })} placeholder="2008" />
                  <div className="col-span-3">
                    <TextField label="Événement" value={item.event} onChange={v => updateTimeline(idx, { ...item, event: v })} />
                  </div>
                </div>
              </ArrayItemRow>
            ))}
            <button
              onClick={addTimeline}
              className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 hover:text-blue-600 transition w-full justify-center"
            >
              <Plus size={14} /> Ajouter un événement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Contact editor
function ContactEditor({ data, onChange }: { data: ContactContent; onChange: (d: ContactContent) => void }) {
  return (
    <div className="space-y-4">
      <TextField label="Adresse" value={data.address} onChange={v => onChange({ ...data, address: v })} placeholder="Yaoundé, Cameroun" />
      <TextField label="Téléphone" value={data.phone} onChange={v => onChange({ ...data, phone: v })} placeholder="+237 6XX XXX XXX" />
      <TextField label="Email" value={data.email} onChange={v => onChange({ ...data, email: v })} placeholder="info@rt-water.cm" />
      <TextField label="Horaires" value={data.hours} onChange={v => onChange({ ...data, hours: v })} placeholder="Lun - Ven : 08:00 - 17:00" />
      <TextField label="URL embed Google Maps (optionnel)" value={data.mapEmbedUrl ?? ''} onChange={v => onChange({ ...data, mapEmbedUrl: v })} mono placeholder="https://www.google.com/maps/embed?..." />
      <TextField label="Numéro WhatsApp (bouton flottant du site)" value={data.whatsapp ?? ''} onChange={v => onChange({ ...data, whatsapp: v })} placeholder="+237 6XX XXX XXX" />
    </div>
  );
}

// Gallery editor
function GalleryEditor({ data, onChange }: { data: GalleryContent; onChange: (d: GalleryContent) => void }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const updateImage = (idx: number, img: GalleryImage) => {
    onChange({ ...data, images: data.images.map((im, i) => i === idx ? img : im) });
  };
  const addImage = () => {
    onChange({ ...data, images: [...data.images, { url: '', title: '', category: 'drilling' }] });
    setExpandedIdx(data.images.length);
  };
  const removeImage = (idx: number) => {
    onChange({ ...data, images: data.images.filter((_, i) => i !== idx) });
    if (expandedIdx === idx) setExpandedIdx(null);
  };

  return (
    <div className="space-y-4">
      <TextField label="Badge" value={data.badge} onChange={v => onChange({ ...data, badge: v })} />
      <TextField label="Titre" value={data.title} onChange={v => onChange({ ...data, title: v })} />
      <TextField label="Titre (partie colorée)" value={data.titleHighlight} onChange={v => onChange({ ...data, titleHighlight: v })} />
      <TextField label="Description" value={data.description} onChange={v => onChange({ ...data, description: v })} multiline rows={2} />
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Images ({data.images.length})</p>
        {data.images.map((img, idx) => (
          <ArrayItemRow
            key={idx}
            index={idx}
            expanded={expandedIdx === idx}
            onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            onDelete={() => removeImage(idx)}
            label={img.title || `Image ${idx + 1}`}
          >
            <ImageField label="URL de l'image" value={img.url} onChange={v => updateImage(idx, { ...img, url: v })} />
            <TextField label="Titre" value={img.title} onChange={v => updateImage(idx, { ...img, title: v })} />
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">Catégorie</label>
              <select
                value={img.category}
                onChange={e => updateImage(idx, { ...img, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
              >
                {GALLERY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </ArrayItemRow>
        ))}
        <button
          onClick={addImage}
          className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 hover:text-blue-600 transition w-full justify-center"
        >
          <Plus size={14} /> Ajouter une image
        </button>
      </div>
    </div>
  );
}

// Header editor
function HeaderEditor({ data, onChange }: { data: HeaderContent; onChange: (d: HeaderContent) => void }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const updateLink = (idx: number, link: NavLink) => {
    onChange({ ...data, navLinks: data.navLinks.map((l, i) => i === idx ? link : l) });
  };
  const addLink = () => {
    onChange({ ...data, navLinks: [...data.navLinks, { label: '', path: '/' }] });
    setExpandedIdx(data.navLinks.length);
  };
  const removeLink = (idx: number) => {
    onChange({ ...data, navLinks: data.navLinks.filter((_, i) => i !== idx) });
    if (expandedIdx === idx) setExpandedIdx(null);
  };

  return (
    <div className="space-y-4">
      <ImageField label="URL du logo" value={data.logoUrl} onChange={v => onChange({ ...data, logoUrl: v })} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Nom de la société" value={data.companyName} onChange={v => onChange({ ...data, companyName: v })} />
        <TextField label="Tagline" value={data.companyTagline} onChange={v => onChange({ ...data, companyTagline: v })} />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Liens de navigation ({data.navLinks.length})</p>
        {data.navLinks.map((link, idx) => (
          <ArrayItemRow
            key={idx}
            index={idx}
            expanded={expandedIdx === idx}
            onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            onDelete={() => removeLink(idx)}
            label={link.label || `Lien ${idx + 1}`}
          >
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Label" value={link.label} onChange={v => updateLink(idx, { ...link, label: v })} />
              <TextField label="Chemin (path)" value={link.path} onChange={v => updateLink(idx, { ...link, path: v })} mono placeholder="/" />
            </div>
          </ArrayItemRow>
        ))}
        <button
          onClick={addLink}
          className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 hover:text-blue-600 transition w-full justify-center"
        >
          <Plus size={14} /> Ajouter un lien
        </button>
      </div>
    </div>
  );
}

// Footer editor
function FooterEditor({ data, onChange }: { data: FooterContent; onChange: (d: FooterContent) => void }) {
  const [expandedSocial, setExpandedSocial] = useState<number | null>(null);

  const updateServiceLink = (idx: number, val: string) => {
    onChange({ ...data, serviceLinks: data.serviceLinks.map((s, i) => i === idx ? val : s) });
  };
  const addServiceLink = () => onChange({ ...data, serviceLinks: [...data.serviceLinks, ''] });
  const removeServiceLink = (idx: number) => onChange({ ...data, serviceLinks: data.serviceLinks.filter((_, i) => i !== idx) });

  const updateSocial = (idx: number, link: SocialLink) => {
    onChange({ ...data, socialLinks: data.socialLinks.map((s, i) => i === idx ? link : s) });
  };
  const addSocial = () => {
    onChange({ ...data, socialLinks: [...data.socialLinks, { platform: 'facebook', url: '#' }] });
    setExpandedSocial(data.socialLinks.length);
  };
  const removeSocial = (idx: number) => {
    onChange({ ...data, socialLinks: data.socialLinks.filter((_, i) => i !== idx) });
    if (expandedSocial === idx) setExpandedSocial(null);
  };

  return (
    <div className="space-y-4">
      <ImageField label="URL du logo" value={data.logoUrl} onChange={v => onChange({ ...data, logoUrl: v })} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Nom de la société" value={data.companyName} onChange={v => onChange({ ...data, companyName: v })} />
        <TextField label="Tagline logo" value={data.companyTagline} onChange={v => onChange({ ...data, companyTagline: v })} />
      </div>
      <TextField label="Tagline footer" value={data.tagline} onChange={v => onChange({ ...data, tagline: v })} multiline rows={2} />
      <div className="grid grid-cols-3 gap-3">
        <TextField label="Adresse" value={data.address} onChange={v => onChange({ ...data, address: v })} />
        <TextField label="Téléphone" value={data.phone} onChange={v => onChange({ ...data, phone: v })} />
        <TextField label="Email" value={data.email} onChange={v => onChange({ ...data, email: v })} />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Liens services ({data.serviceLinks.length})</p>
        {data.serviceLinks.map((link, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input
              type="text"
              value={link}
              onChange={e => updateServiceLink(idx, e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
              placeholder="Nom du service"
            />
            <button onClick={() => removeServiceLink(idx)} className="p-1.5 text-red-400 hover:text-red-600 transition">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          onClick={addServiceLink}
          className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 hover:text-blue-600 transition w-full justify-center"
        >
          <Plus size={14} /> Ajouter un service
        </button>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Liens réseaux sociaux ({data.socialLinks.length})</p>
        {data.socialLinks.map((social, idx) => (
          <ArrayItemRow
            key={idx}
            index={idx}
            expanded={expandedSocial === idx}
            onToggle={() => setExpandedSocial(expandedSocial === idx ? null : idx)}
            onDelete={() => removeSocial(idx)}
            label={social.platform || `Social ${idx + 1}`}
          >
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">Plateforme</label>
              <select
                value={social.platform}
                onChange={e => updateSocial(idx, { ...social, platform: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
              >
                {['facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'tiktok'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <TextField label="URL" value={social.url} onChange={v => updateSocial(idx, { ...social, url: v })} mono placeholder="https://..." />
          </ArrayItemRow>
        ))}
        <button
          onClick={addSocial}
          className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 hover:text-blue-600 transition w-full justify-center"
        >
          <Plus size={14} /> Ajouter un réseau
        </button>
      </div>
    </div>
  );
}

// ── Section Config ────────────────────────────────────────────────────────────

interface SectionConfig {
  slug: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  defaultContent: HomeContent | AboutContent | ContactContent | GalleryContent | HeaderContent | FooterContent;
}

const SECTIONS: SectionConfig[] = [
  {
    slug: 'accueil',
    title: 'Accueil',
    description: 'Hero, services, chiffres clés et appel à action',
    icon: Layout,
    color: 'from-blue-500 to-cyan-500',
    defaultContent: DEFAULT_HOME,
  },
  {
    slug: 'a-propos',
    title: 'À propos',
    description: 'Histoire, mission, valeurs et chronologie',
    icon: Users,
    color: 'from-purple-500 to-pink-500',
    defaultContent: DEFAULT_ABOUT,
  },
  {
    slug: 'contact',
    title: 'Contact',
    description: 'Adresse, téléphone, email, horaires',
    icon: Phone,
    color: 'from-green-500 to-emerald-500',
    defaultContent: DEFAULT_CONTACT,
  },
  {
    slug: 'galerie',
    title: 'Galerie',
    description: 'Images et métadonnées de la galerie',
    icon: Camera,
    color: 'from-orange-500 to-amber-500',
    defaultContent: DEFAULT_GALLERY,
  },
  {
    slug: 'site-header',
    title: 'En-tête',
    description: 'Logo, nom de la société et navigation',
    icon: Globe,
    color: 'from-sky-500 to-blue-500',
    defaultContent: DEFAULT_HEADER,
  },
  {
    slug: 'site-footer',
    title: 'Pied de page',
    description: 'Logo, tagline, services, contact et réseaux sociaux',
    icon: ImageIcon,
    color: 'from-slate-500 to-slate-700',
    defaultContent: DEFAULT_FOOTER,
  },
];

// ── Main Component ────────────────────────────────────────────────────────────

export const PagesManagerPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();
  const { reload: reloadSiteContent } = useSiteContent();

  const [pages, setPages] = useState<ApiPage[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  // Editor state
  const [editingSection, setEditingSection] = useState<SectionConfig | null>(null);
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pagesService.fetchAdminPages();
      setPages(res?.data ?? res ?? []);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPages(); }, [loadPages]);

  const openEditor = async (section: SectionConfig) => {
    setEditingSection(section);
    setEditingContent(null);
    setEditingPageId(null);
    setEditorError(null);
    setEditorLoading(true);
    try {
      const res = await pagesService.fetchPage(section.slug);
      const apiPage: ApiPage = res?.data ?? res;
      if (apiPage && apiPage.id) {
        setEditingPageId(apiPage.id);
        const parsed = parsePageContent(apiPage.content, section.defaultContent);
        setEditingContent(parsed);
      } else {
        setEditingContent({ ...section.defaultContent });
      }
    } catch {
      setEditingContent({ ...section.defaultContent });
    } finally {
      setEditorLoading(false);
    }
  };

  const closeEditor = () => {
    setEditingSection(null);
    setEditingContent(null);
    setEditingPageId(null);
    setEditorError(null);
  };

  const handleSave = async () => {
    if (!editingSection || !editingContent) return;
    setSaving(true);
    setEditorError(null);
    try {
      const payload = {
        title: editingSection.title,
        slug: editingSection.slug,
        content: JSON.stringify(editingContent),
        is_published: true,
      };
      if (editingPageId) {
        await pagesService.updatePage(editingPageId, payload);
      } else {
        const res = await pagesService.createPage(payload);
        const created: ApiPage = res?.data ?? res;
        if (created?.id) setEditingPageId(created.id);
      }
      showToast('Contenu enregistré avec succès');
      reloadSiteContent();
      await loadPages();
      closeEditor();
    } catch (err: any) {
      setEditorError(err?.message ?? 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const renderEditor = () => {
    if (!editingSection || !editingContent) return null;
    const slug = editingSection.slug;
    if (slug === 'accueil') return <HomeEditor data={editingContent as HomeContent} onChange={setEditingContent} />;
    if (slug === 'a-propos') return <AboutEditor data={editingContent as AboutContent} onChange={setEditingContent} />;
    if (slug === 'contact') return <ContactEditor data={editingContent as ContactContent} onChange={setEditingContent} />;
    if (slug === 'galerie') return <GalleryEditor data={editingContent as GalleryContent} onChange={setEditingContent} />;
    if (slug === 'site-header') return <HeaderEditor data={editingContent as HeaderContent} onChange={setEditingContent} />;
    if (slug === 'site-footer') return <FooterEditor data={editingContent as FooterContent} onChange={setEditingContent} />;
    return null;
  };

  if (!hasPermission('manage_pages')) {
    return (
      <AdminLayout>
        <div className="text-center py-12"><p className="text-red-600 font-semibold">Accès refusé</p></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Gestion du contenu"
      breadcrumbs={[{ label: 'Dashboard', path: '/admin/dashboard' }, { label: 'Contenu' }]}
    >
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium shadow-lg z-[60] ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-600 font-medium">Total sections</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">{SECTIONS.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-600 font-medium">Publiées</p>
          <p className="text-2xl font-bold text-green-900 mt-2">
            {loading ? '…' : pages.filter(p => SECTIONS.some(s => s.slug === p.slug) && p.is_published).length}
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-600 font-medium">Non configurées</p>
          <p className="text-2xl font-bold text-amber-900 mt-2">
            {loading ? '…' : SECTIONS.filter(s => !pages.some(p => p.slug === s.slug)).length}
          </p>
        </div>
      </div>

      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SECTIONS.map(section => {
          const SectionIcon = section.icon;
          const apiPage = pages.find(p => p.slug === section.slug);
          return (
            <div key={section.slug} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`h-2 bg-gradient-to-r ${section.color}`}></div>
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                    <SectionIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900">{section.title}</h3>
                      {apiPage ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${apiPage.is_published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {apiPage.is_published ? 'Publié' : 'Brouillon'}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500">Non créé</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{section.description}</p>
                  </div>
                </div>
                {apiPage && (
                  <p className="text-xs text-slate-400 mb-4">
                    Modifié le {new Date(apiPage.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
                <button
                  onClick={() => openEditor(section)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #0077BE, #00A8E8)' }}
                >
                  <Edit2 size={15} />
                  Éditer le contenu
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-screen Editor Overlay */}
      {editingSection && (
        <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden">
          {/* Editor Header */}
          <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4 shadow-sm">
            <button onClick={closeEditor} className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-500">
              <X size={20} />
            </button>
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${editingSection.color} flex items-center justify-center`}>
              {React.createElement(editingSection.icon, { className: 'w-4 h-4 text-white' })}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-900 text-sm">{editingSection.title}</h2>
              <p className="text-xs text-slate-400 truncate">{editingSection.description}</p>
            </div>
            {editorError && (
              <div className="flex items-center gap-1.5 text-red-600 text-sm bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                <AlertCircle size={14} />
                <span className="truncate max-w-xs">{editorError}</span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving || editorLoading}
              className="flex items-center gap-2 px-5 py-2 text-white font-medium rounded-lg transition hover:opacity-90 disabled:opacity-60 flex-shrink-0"
              style={{ backgroundColor: '#0077BE' }}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Enregistrer
            </button>
          </div>

          {/* Editor Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {editorLoading ? (
              <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
                <Loader2 size={28} className="animate-spin" />
                <span className="text-base">Chargement du contenu...</span>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
                {renderEditor()}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
