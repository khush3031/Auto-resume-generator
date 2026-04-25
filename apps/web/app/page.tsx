import Link from 'next/link';
import type { Metadata } from 'next';
import { HeroCtas } from '../components/HeroCtas';

export const metadata: Metadata = {
  title: 'ResumeForge — Build Your Professional Resume in Minutes',
  description:
    'Create a professional resume in minutes with ResumeForge. ' +
    'Browse templates, edit live, preview, and export a polished PDF.',
};

const STATS = [
  { v: '16+',       l: 'Resume templates'   },
  { v: '< 5 min',   l: 'Average build time' },
  { v: '100%',      l: 'Free to use'        },
  { v: 'ATS-ready', l: 'Recruiter-friendly' },
] as const;

const STEPS = [
  {
    n: '01',
    t: 'Pick a template',
    d: 'Browse 16+ professionally designed layouts — minimal, modern, executive, ATS-optimised and more.',
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
