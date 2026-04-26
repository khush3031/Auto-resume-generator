'use client';

/**
 * NavigationTracker
 *
 * Mount once in the root layout (it renders nothing).
 * It keeps our sessionStorage nav-stack in sync with the browser's
 * actual history so that NavLink can make accurate "go back vs push"
 * decisions.
 *
 * Two sources of truth it handles:
 *  1. Programmatic navigation (router.push / <Link>) — detected via
 *     the usePathname() change.
 *  2. Native back / forward button — detected via the `popstate` event,
 *     which fires after the URL has already changed.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { readStack, writeStack } from '../src/lib/nav-stack';

export function NavigationTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string>('');

  // ── 1. Sync stack when the user uses the browser's back / forward ──
  useEffect(() => {
    const handlePopState = () => {
      // popstate fires AFTER the URL has updated, so location.pathname
      // already reflects the new page.
      const newPath = window.location.pathname;
      const stack   = readStack();

      // Walk backwards to find where we landed and truncate there.
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i] === newPath || stack[i].startsWith(newPath + '?')) {
          writeStack(stack.slice(0, i + 1));
          return;
        }
      }
      // Landed on a page not in our stack (e.g. navigated outside the app
      // and came back) — just reset to the current page.
      writeStack([newPath]);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ── 2. Record every programmatic / <Link> push ──
  useEffect(() => {
    if (pathname === lastPathRef.current) return; // no change (e.g. hash-only)
    lastPathRef.current = pathname;

    const stack = readStack();
    const last  = stack[stack.length - 1];

    if (stack.length === 0 || last !== pathname) {
      // New page — push onto our stack.
      // Note: router.replace() also triggers this (we can't distinguish it
      // from push at this level), so the stack may contain an extra entry
      // for replaced pages. NavLink tolerates this gracefully: a wrong
      // go-back is extremely rare and the fallback is router.push().
      stack.push(pathname);
      writeStack(stack);
    }
    // If last === pathname it's a same-URL replace/refresh — no-op.
  }, [pathname]);

  return null;
}
