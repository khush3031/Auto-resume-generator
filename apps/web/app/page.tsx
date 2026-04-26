import Link from 'next/link';
import type { Metadata } from 'next';
import { HeroCtas } from '../components/HeroCtas';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://resumeforge-web.onrender.com';

const PAGE_TITLE = 'ResumeForge — Free Resume Builder Online | 28+ Templates';
const PAGE_DESC  = 'Build a professional resume in minutes. Choose from 28+ ATS-friendly templates, edit live, and download a polished PDF — completely free. No sign-up needed to start.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: SITE_URL },
  keywords: ['resume builder', 'free resume maker', 'ATS resume', 'CV builder', 'resume templates', 'professional resume', 'PDF resume'],
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'ResumeForge',
    title: PAGE_TITLE,
    description: PAGE_DESC,
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: PAGE_TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESC,
    images: [`${SITE_URL}/opengraph-image`],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ResumeForge',
  url: SITE_URL,
  description: PAGE_DESC,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: ['28+ Resume Templates', 'Live Preview', 'PDF Export', 'ATS-Friendly Layouts', 'AI-Powered Suggestions'],
};

const STATS = [
  { v: '28+',       l: 'Resume templates'   },
  { v: '< 5 min',   l: 'Average build time' },
  { v: 'Live',      l: 'Design controls'    },
  { v: 'ATS-ready', l: 'Recruiter-friendly' },
] as const;

const STEPS = [
  {
    n: '01',
    t: 'Pick a template',
    d: 'Browse 28+ professionally designed layouts — from ATS-safe basics to richer premium-style editorial formats.',
  },
  {
    n: '02',
    t: 'Fill in your details',
    d: 'Add experience, education, skills, and certifications. Watch your resume update live as you type.',
  },
  {
    n: '03',
    t: 'Download your PDF',
    d: 'Export a pixel-perfect PDF. Create a free account to unlock downloads.',
  },
] as const;

import { Logo } from '../components/Logo';

export default function HomePage() {
  return (
    <div className="page-wrapper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── HERO ── */}
      <section className="landing-hero">
        <div className="landing-hero__grid">

            {/* Left column */}
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <Logo size={48} showText={false} />
              </div>
              <h1 className="landing-hero__title">
                Your resume,<br />ready in minutes
              </h1>
              <p className="landing-hero__subtitle">
                Pick a template, fill in your details, and download a
                recruiter-ready PDF — all from your browser, completely free.
              </p>
              <HeroCtas />
            </div>

            {/* Right column — stats card */}
            <div className="landing-hero__stats-card">
              <p className="landing-hero__stats-eyebrow">By the numbers</p>
              <div className="landing-hero__stats-grid">
                {STATS.map((s) => (
                  <div key={s.l}>
                    <div className="landing-hero__stat-number">{s.v}</div>
                    <div className="landing-hero__stat-label">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="landing-hero__stats-note">
                <strong>No design skills needed.</strong> Our templates handle
                spacing, typography, and layout — you just fill in your story.
              </div>
            </div>

        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="howitworks">
        <div className="container">
          <div className="howitworks__header">
            <p className="howitworks__eyebrow">How it works</p>
            <h2 className="howitworks__title">
              From blank page to PDF in three steps
            </h2>
          </div>
          <div className="howitworks__grid">
            {STEPS.map((s) => (
              <div key={s.n} className="howitworks__step">
                <div className="howitworks__step-number">{s.n}</div>
                <h3 className="howitworks__step-title">{s.t}</h3>
                <p className="howitworks__step-desc">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
