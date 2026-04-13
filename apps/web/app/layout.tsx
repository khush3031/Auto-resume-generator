import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'ResumeForge | Free Resume Builder',
  description: 'Free online resume builder with professional templates. Create, preview and download your resume instantly.',
  metadataBase: new URL('http://localhost:3000'),
  alternates: { canonical: '/' },
  openGraph: {
    title: 'ResumeForge | Free Resume Builder',
    description: 'Free online resume builder with professional templates. Create, preview and download your resume instantly.',
    type: 'website',
    url: 'http://localhost:3000'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="site-body">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" className="site-main">
          {children}
        </main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'ResumeForge',
              url: 'http://localhost:3000',
              description: 'Create, preview, and download professional resumes instantly using customizable templates.',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web'
            })
          }}
        />
      </body>
    </html>
  );
}
