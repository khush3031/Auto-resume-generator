import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { NavigationTracker } from '../components/NavigationTracker';

const siteUrl = 'https://resumeforge-web.onrender.com';

export const metadata: Metadata = {
  title: {
    template: '%s | ResumeForge',
    default: 'ResumeForge — Free Resume Builder Online',
  },
  description: 'Free online resume builder with 14+ professional templates. Create, customize, and download your resume as PDF in minutes.',
  metadataBase: new URL(siteUrl),
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'ResumeForge',
    title: 'ResumeForge — Free Resume Builder Online',
    description: 'Free online resume builder with 14+ professional templates. Create, customize, and download your resume as PDF in minutes.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'ResumeForge — Free Resume Builder Online' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResumeForge — Free Resume Builder Online',
    description: 'Free online resume builder with 14+ professional templates. Create, customize, and download your resume as PDF in minutes.',
    images: ['/opengraph-image'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
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
