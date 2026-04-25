import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: {
    template: '%s | ResumeForge',
    default: 'ResumeForge — Free Resume Builder Online',
  },
  description: 'Free online resume builder with 14+ professional templates.',
  icons: {
    icon: '/icon.svg',
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
