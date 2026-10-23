import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  PhoneCall,
  Building2,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Scheme {
  id: string;
  name: string;
  ministry: string;
  category: string;
  state: string;
  eligibility: string;
  benefits: string;
  documents: string;
  application: string;
  helpline: string;
  verified_at: string;
}

// Bundled, verified official government elder-care & mental health schemes for 100% offline access
const OFFICIAL_SCHEMES: Scheme[] = [
  {
    id: 'pmjay_senior',
    name: 'Ayushman Bharat PM-JAY (Senior Citizens 70+)',
    ministry: 'Ministry of Health & Family Welfare, Govt of India',
    category: 'Healthcare & Hospitalization',
    state: 'National / All NER States',
    eligibility: 'All Indian citizens aged 70 years and above, irrespective of economic tier.',
    benefits: 'Cashless in-patient hospitalization up to ₹5,00,000 per family per year across 29,000+ empanelled hospitals.',
    documents: 'Aadhaar Card with verified Date of Birth. No income or caste certificate required.',
    application: 'Apply via Ayushman Arogya Mandirs, CSC Kendra, or online at beneficiaries.nha.gov.in',
    helpline: '14555',
    verified_at: '2026-10-01',
  },
  {
    id: 'nphce_geriatric',
    name: 'National Programme for Health Care of the Elderly (NPHCE)',
    ministry: 'Ministry of Health & Family Welfare, Govt of India',
    category: 'Geriatric & Dementia Care',
    state: 'NER Regional Centers (Guwahati Medical College & RIMS Imphal)',
    eligibility: 'Senior citizens aged 60+ experiencing memory changes, cognitive decline, or mobility challenges.',
    benefits: 'Free dedicated weekly Geriatric OPDs, cognitive evaluations, physiotherapy, and chronic illness medications.',
    documents: 'Age proof (Aadhaar/Voter ID), previous medical prescriptions if available.',
    application: 'Walk-in access at District Civil Hospitals and Community Health Centres (CHCs).',
    helpline: '1800-180-1104',
    verified_at: '2026-10-01',
  },
  {
    id: 'tele_manas',
    name: 'Tele-MANAS (National Tele Mental Health Programme)',
    ministry: 'National Health Mission & NIMHANS',
    category: 'Mental Health & Counseling',
    state: 'National / NER State Cells in Assam, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, Arunachal',
    eligibility: 'Anyone experiencing cognitive anxiety, memory distress, depression, or caregiver exhaustion.',
    benefits: 'Free 24x7 toll-free counseling in 20+ Indian languages (including Assamese, Bengali, Manipuri, Hindi, English).',
    documents: 'None required. Completely confidential and accessible via any mobile phone.',
    application: 'Dial toll-free short code 14416 or 1800-891-4416 anytime.',
    helpline: '14416',
    verified_at: '2026-10-01',
  },
  {
    id: 'elderline',
    name: 'Elder Line 14567 (National Senior Citizen Helpline)',
    ministry: 'Ministry of Social Justice & Empowerment, Govt of India',
    category: 'Social Welfare & Elder Protection',
    state: 'National / All NER States',
    eligibility: 'Senior citizens (60+) in need of elder abuse intervention, rescue, legal guidance, or emotional support.',
    benefits: 'Field rescue, dispute mediation, old age home linkages, and government pension assistance.',
    documents: 'None required for immediate helpline assistance.',
    application: 'Call toll-free 14567 (8:00 AM to 8:00 PM, 7 days a week).',
    helpline: '14567',
    verified_at: '2026-10-01',
  },
  {
    id: 'rvpy_assistive',
    name: 'Rashtriya Vayoshri Yojana (RVY)',
    ministry: 'Department of Social Justice & Empowerment, Govt of India / ALIMCO',
    category: 'Assistive Devices & Mobility',
    state: 'District Social Welfare Offices across NER',
    eligibility: 'Senior citizens (60+) belonging to BPL category or monthly family income under ₹15,000.',
    benefits: 'Free walking sticks, quadrupods, hearing aids, wheelchairs, spectacles, and dental prosthetics.',
    documents: 'BPL Ration Card or Income Certificate, Aadhaar Card, doctor disability certificate.',
    application: 'Apply via District Social Welfare Officer or ALIMCO assessment camps.',
    helpline: '1800-180-5129',
    verified_at: '2026-10-01',
  },
  {
    id: 'assam_atal_amrit',
    name: 'Atal Amrit Abhiyan (Assam State Health Assurance)',
    ministry: 'Government of Assam (Health & Family Welfare)',
    category: 'State Critical Care',
    state: 'Assam State',
    eligibility: 'Permanent residents of Assam with family annual income under ₹5,00,000.',
    benefits: 'Cashless treatment up to ₹2,00,000 per person per year for neurological and cardiovascular procedures.',
    documents: 'Assam Ration Card / Voter ID, Income Certificate, AAA Smart Card.',
    application: 'Apply at District Joint Director of Health Services or online at atalamritabhiyan.assam.gov.in',
    helpline: '1800-102-7480',
    verified_at: '2026-10-01',
  },
];

const CATEGORIES = [
  'All',
  'Healthcare & Hospitalization',
  'Geriatric & Dementia Care',
  'Mental Health & Counseling',
  'Social Welfare & Elder Protection',
  'Assistive Devices & Mobility',
  'State Critical Care',
];

export function GovtHub() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);

  const filteredSchemes = useMemo(() => {
    return OFFICIAL_SCHEMES.filter(s => {
      const matchCat = selectedCategory === 'All' || s.category === selectedCategory;
      const matchSearch =
        searchTerm.trim() === '' ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.benefits.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.eligibility.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div
      className="min-h-screen w-full pb-20"
      style={{ background: 'rgb(var(--color-surface-bg))' }}
    >
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-5 pt-6 pb-4"
        style={{
          background: 'rgba(var(--color-surface-bg), 0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        <button
          onClick={() => navigate('/')}
          aria-label="Back to home"
          className="flex items-center justify-center rounded-2xl active:scale-95 transition-all"
          style={{
            width: 52,
            height: 52,
            background: 'rgba(var(--color-primary),0.08)',
            color: 'rgb(var(--color-text-secondary))',
          }}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h1
            className="font-extrabold text-[rgb(var(--color-text-primary))]"
            style={{ fontFamily: 'Nunito, Inter, sans-serif', fontSize: 'var(--text-xl)' }}
          >
            Govt Welfare Hub
          </h1>
          <p
            className="text-[rgb(var(--color-text-secondary))]"
            style={{ fontSize: 'var(--text-xs)' }}
          >
            Official Schemes & Helplines (Offline Ready)
          </p>
        </div>

        <div className="w-12 flex justify-end">
          <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 text-xs font-bold dark:bg-emerald-950/40 dark:text-emerald-300">
            Cached
          </span>
        </div>
      </header>

      {/* ── Search & Filter Controls ────────────────────────────────────────── */}
      <div className="px-5 pt-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search schemes, benefits, documents, helplines..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-stone-200 bg-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-white"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-slate-800 dark:text-stone-300'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Scheme Cards List ──────────────────────────────────────────────── */}
      <div className="px-5 pt-4 space-y-4">
        {filteredSchemes.length === 0 ? (
          <div className="p-8 text-center text-stone-500 space-y-2">
            <p className="font-bold text-base">No matching schemes found</p>
            <p className="text-xs">Try adjusting your keywords or category filters.</p>
          </div>
        ) : (
          filteredSchemes.map(scheme => {
            const isExpanded = expandedSchemeId === scheme.id;
            return (
              <motion.div
                key={scheme.id}
                layout
                className="rounded-3xl p-5 bg-white border border-stone-200/80 shadow-md space-y-3.5 transition-all dark:bg-slate-900 dark:border-slate-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                      {scheme.category}
                    </span>
                    <h3 className="text-base font-extrabold text-stone-900 leading-snug dark:text-white">
                      {scheme.name}
                    </h3>
                    <p className="text-xs font-medium text-stone-500 flex items-center gap-1 dark:text-stone-400">
                      <Building2 className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                      <span>{scheme.ministry}</span>
                    </p>
                  </div>
                </div>

                {/* Key Benefits Callout */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/40">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    ✨ Key Benefits:
                  </p>
                  <p className="text-xs text-amber-950 font-medium mt-0.5 leading-relaxed dark:text-amber-200">
                    {scheme.benefits}
                  </p>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 pt-2 border-t border-stone-100 text-xs dark:border-slate-800"
                    >
                      <div>
                        <span className="font-bold text-stone-700 dark:text-stone-300">👤 Who is Eligible:</span>
                        <p className="text-stone-600 dark:text-stone-400 mt-0.5">{scheme.eligibility}</p>
                      </div>

                      <div>
                        <span className="font-bold text-stone-700 dark:text-stone-300">📄 Required Documents:</span>
                        <p className="text-stone-600 dark:text-stone-400 mt-0.5">{scheme.documents}</p>
                      </div>

                      <div>
                        <span className="font-bold text-stone-700 dark:text-stone-300">📍 How to Apply:</span>
                        <p className="text-stone-600 dark:text-stone-400 mt-0.5">{scheme.application}</p>
                      </div>

                      <div className="flex items-center gap-2 pt-1 text-[11px] text-stone-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Verified: {scheme.verified_at} · Official Ministry Data</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setExpandedSchemeId(isExpanded ? null : scheme.id)}
                    className="text-xs font-bold text-violet-600 hover:text-violet-700 underline underline-offset-2"
                  >
                    {isExpanded ? 'Show less' : 'View eligibility & application'}
                  </button>

                  <a
                    href={`tel:${scheme.helpline}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-sm active:scale-95 transition-all"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call {scheme.helpline}</span>
                  </a>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ── Disclaimers ─────────────────────────────────────────────────────── */}
      <div className="px-6 pt-6 text-center text-stone-400 text-[11px] leading-relaxed">
        <p>
          COGNIVA is an independent public-health assistive platform. Government scheme data is verified from official portals (MoHFW, MSJE, NHM) and cached for field convenience in low-connectivity areas.
        </p>
      </div>
    </div>
  );
}
