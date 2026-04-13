'use client';

import { useEffect, useState } from 'react';

const storageKey = 'resumeforge-user';

export function useRegistration() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.name && parsed?.email) {
          setIsRegistered(true);
          setUser(parsed);
          return;
        }
      } catch {
        // ignore invalid storage
      }
    }
    setIsRegistered(false);
    setUser(null);
  }, []);

  const register = (name: string, email: string) => {
    const payload = { name, email };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
    setUser(payload);
    setIsRegistered(true);
  };

  return { isRegistered, user, register };
}
