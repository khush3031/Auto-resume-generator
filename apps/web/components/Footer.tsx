import Link from 'next/link';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <Link href="/" className="site-footer__brand" style={{ textDecoration: 'none' }}>
          <Logo size={24} />
        </Link>
        <span className="site-footer__sep">·</span>
        <Link href="/terms" className="site-footer__link">Terms &amp; Conditions</Link>
        <span className="site-footer__sep">·</span>
        <Link href="/privacy" className="site-footer__link">Privacy Policy</Link>
        <span className="site-footer__sep">·</span>
        <span className="site-footer__copy">&copy; {new Date().getFullYear()} ResumeForge. All rights reserved.</span>
      </div>
    </footer>
  );
}
