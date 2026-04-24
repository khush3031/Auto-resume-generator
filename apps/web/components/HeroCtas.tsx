'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useAuthStore } from '../src/store/auth.store';

export function HeroCtas() {
  const { isAuthenticated, loadFromStorage } = useAuthStore();

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  return (
    <div className="landing-hero__ctas">
      <Link href="/templates" className="btn btn--primary btn--lg">
        Browse templates
      </Link>
      {!isAuthenticated && (
        <Link href="/register" className="btn btn--outline btn--lg">
          Create free account
        </Link>
      )}
    </div>
  );
}
