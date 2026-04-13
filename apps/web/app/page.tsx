import Link from 'next/link';

export const metadata = {
  title: 'ResumeForge — Build Your Professional Resume in Minutes',
  description: 'Create a professional resume in minutes with ResumeForge. Browse templates, edit live, preview your work, and export a polished PDF.',
  openGraph: {
    title: 'ResumeForge — Build Your Professional Resume in Minutes',
    description: 'Create a professional resume in minutes with ResumeForge. Browse templates, edit live, preview your work, and export a polished PDF.',
    type: 'website'
  }
};

const steps = [
  { step: '01', title: 'Pick a template', description: 'Browse 16 professionally designed layouts — minimal, classic, executive, modern, and more.' },
  { step: '02', title: 'Fill in your details', description: 'Add experience, education, skills, and certifications. The live preview updates as you type.' },
  { step: '03', title: 'Download your PDF', description: 'Export a pixel-perfect PDF generated server-side. No watermarks, no limits.' }
];

const features = [
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>,
    title: 'Live preview', description: 'See exactly how your resume looks as you type — no guessing before you export.'
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /></svg>,
    title: 'PDF export', description: 'Server-side Puppeteer rendering produces a high-fidelity PDF that looks great in every ATS.'
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2" /><path d="M2 10h20" /></svg>,
    title: 'Auto-save', description: 'Every keystroke is saved to your account automatically. Continue on any device.'
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    title: 'ATS friendly', description: 'Clean semantic HTML passes applicant-tracking-system parsers without losing formatting.'
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" /></svg>,
    title: 'Free account', description: 'Sign up in seconds to unlock PDF downloads, save multiple resumes, and manage your dashboard.'
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M15 3h6v6" /><path d="m10 14 11-11" /></svg>,
    title: 'Multiple templates', description: 'Switch templates without losing data — your content fills the new layout instantly.'
  }
];

export default function HomePage() {
  return (
    <div className="page-wrapper">

      {/* Hero */}
      <section className="landing-hero">
        <div className="container">
          <div className="landing-hero__grid">
            <div>
              <p className="landing-hero__eyebrow">ResumeForge</p>
              <h1 className="landing-hero__title">
                Your resume,<br /> ready in minutes
              </h1>
              <p className="landing-hero__subtitle">
                Pick a template, fill in your details, and download a recruiter-ready PDF — all from your browser, completely free.
              </p>
              <div className="landing-hero__ctas">
                <Link href="/templates" className="btn btn--primary btn--lg">Browse templates</Link>
                <Link href="/register" className="btn btn--outline btn--lg">Create free account</Link>
              </div>
            </div>

            <div className="landing-hero__stats-card">
              <p className="landing-hero__stats-eyebrow">By the numbers</p>
              <div className="landing-hero__stats-grid">
                {[
                  { value: '16+', label: 'Resume templates' },
                  { value: '< 5 min', label: 'Average build time' },
                  { value: '100%', label: 'Free to use' },
                  { value: 'ATS-ready', label: 'Recruiter-friendly' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="landing-hero__stat-number">{s.value}</p>
                    <p className="landing-hero__stat-label">{s.label}</p>
                  </div>
                ))}
              </div>
              <p className="landing-hero__stats-note">
                <strong>No design skills needed.</strong>{' '}
                Our templates handle spacing, typography, and layout — you just fill in your story.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="howitworks">
        <div className="container">
          <div className="howitworks__header">
            <p className="howitworks__eyebrow">How it works</p>
            <h2 className="howitworks__title">From blank page to PDF in three steps</h2>
          </div>
          <div className="howitworks__grid">
            {steps.map((s) => (
              <article key={s.step} className="howitworks__step">
                <span className="howitworks__step-number">{s.step}</span>
                <h3 className="howitworks__step-title">{s.title}</h3>
                <p className="howitworks__step-desc">{s.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <div className="features__header">
            <p className="features__eyebrow">Features</p>
            <h2 className="features__title">Everything you need to land the interview</h2>
            <p className="features__subtitle">Built specifically for job seekers — fast, clean, and focused on what matters.</p>
          </div>
          <div className="features__grid">
            {features.map((f) => (
              <article key={f.title} className="feature-card">
                <div className="feature-card__icon">{f.icon}</div>
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <h2 className="cta-box__title">Ready to build your resume?</h2>
            <p className="cta-box__subtitle">
              Choose a template and start editing right away — no account required to preview.
            </p>
            <div className="cta-box__buttons">
              <Link href="/templates" className="btn btn--dark">Browse templates</Link>
              <Link href="/register" className="btn btn--dark-outline">Create free account</Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
