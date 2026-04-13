'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../src/store/auth.store';

export function Navbar() {
  const { user, isAuthenticated, logout, loadFromStorage } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);
  useEffect(() => { setIsOpen(false); }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link href="/" className="navbar__logo">ResumeForge</Link>

        {/* Desktop nav */}
        <nav className="navbar__desktop" aria-label="Main navigation">
          <Link href="/templates" className="navbar__link">Templates</Link>
          <Link href="/upload" className="navbar__link">Upload Resume</Link>
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="navbar__link">Dashboard</Link>
              <span className="navbar__user-badge">{user?.fullName}</span>
              <button onClick={logout} className="navbar__btn">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="navbar__btn">Login</Link>
              <Link href="/register" className="navbar__btn navbar__btn--primary">Register</Link>
            </>
          )}
        </nav>

        {/* Hamburger */}
        <button
          onClick={() => setIsOpen((o) => !o)}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
          className="navbar__hamburger"
        >
          {isOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-nav"
        aria-hidden={!isOpen}
        className={`navbar__mobile ${isOpen ? 'navbar__mobile--open' : 'navbar__mobile--closed'}`}
      >
        <nav className="navbar__mobile-nav" aria-label="Mobile navigation">
          <div className="navbar__mobile-links">
            <Link href="/templates" className="navbar__mobile-link">Templates</Link>
            <Link href="/upload" className="navbar__mobile-link">Upload Resume</Link>
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="navbar__mobile-link">Dashboard</Link>
                <div className="navbar__divider" />
                <span className="navbar__mobile-user">{user?.fullName}</span>
                <button
                  onClick={() => { logout(); setIsOpen(false); }}
                  className="navbar__mobile-link navbar__mobile-link--danger"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="navbar__divider" />
                <Link href="/login" className="navbar__mobile-link">Login</Link>
                <Link href="/register" className="navbar__mobile-link navbar__mobile-link--primary">Register</Link>
              </>
            )}
          </div>
        </nav>
      </div>

      {isOpen && (
        <div className="navbar__backdrop" onClick={() => setIsOpen(false)} aria-hidden="true" />
      )}
    </header>
  );
}
