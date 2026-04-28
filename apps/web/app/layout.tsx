import type { Metadata } from 'next';
import './globals.css';
import { templateCount } from '@resumeforge/templates';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { NavigationTracker } from '../components/NavigationTracker';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://resumeforge-web.onrender.com';

const OG_TITLE = 'ResumeForge - Free Resume Builder Online';
const TEMPLATE_COUNT_LABEL = `${templateCount}+`;
const OG_DESCRIPTION = `Build a professional resume in minutes. Choose from ${TEMPLATE_COUNT_LABEL} ATS-friendly templates, edit in real time, and download a polished PDF - completely free.`;

export const metadata: Metadata = {
  title: {
    template: '%s | ResumeForge',
    default: OG_TITLE,
  },
  description: OG_DESCRIPTION,
  metadataBase: new URL(siteUrl),
  icons: { icon: '/icon.svg' },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'ResumeForge',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: OG_TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: [`${siteUrl}/opengraph-image`],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ogImage = `${siteUrl}/opengraph-image`;
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ResumeForge" />
        <meta property="og:title" content={OG_TITLE} />
        <meta property="og:description" content={OG_DESCRIPTION} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={siteUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={OG_TITLE} />
        <meta name="twitter:description" content={OG_DESCRIPTION} />
        <meta name="twitter:image" content={ogImage} />
      </head>
      <body>
        <NavigationTracker />
        <Navbar />
        <main>{children}</main>
        <div className="alpha-banner">
          This is an alpha version. Use is free for now, but features, data, and pricing may change without notice.
        </div>
        <Footer />
      </body>
    </html>
  );
}
