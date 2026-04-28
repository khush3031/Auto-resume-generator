import { TemplatesGrid } from '../../components/TemplatesGrid';
import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://resumeforge-web.onrender.com';
const PAGE_URL  = `${SITE_URL}/templates`;
const PAGE_TITLE = 'Free Resume Templates — 34+ Professional Designs | ResumeForge';
const PAGE_DESC  = 'Browse 34+ free resume templates: ATS-friendly, modern, executive, creative, and more. Preview live and start building your resume instantly — no account needed.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  alternates: { canonical: PAGE_URL },
  keywords: ['resume templates', 'free resume templates', 'ATS resume template', 'professional resume design', 'CV templates'],
  openGraph: {
    type: 'website',
    url: PAGE_URL,
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
  '@type': 'CollectionPage',
  name: PAGE_TITLE,
  description: PAGE_DESC,
  url: PAGE_URL,
  isPartOf: { '@type': 'WebSite', name: 'ResumeForge', url: SITE_URL },
};

export default function TemplatesPage() {
  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="templates-page">

      {/* Page header */}
      <div className="templates-header">
        <div className="templates-header__inner">
          <div className="templates-header__grid">
            <div>
              <p className="templates-header__eyebrow">Resume Templates</p>
              <h1 className="templates-header__title">
                Browse a deeper template library
                <br /> built for different hiring moments.
              </h1>
            </div>
            <div>
              <p className="templates-header__desc">
                Compare ATS-safe, premium, compact, executive, and creative layouts, then tune typography and spacing live in the builder.
              </p>
            </div>
          </div>
          <div className="templates-accent" />
        </div>
      </div>

      {/* Template grid — client-side with retry for Render cold starts */}
      <div className="templates-body">
        <div className="templates-body__inner">
          <TemplatesGrid />
        </div>
      </div>

    </div>
    </>
  );
}
