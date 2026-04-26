'use client';

/**
 * NavLink — a smart <a> that prevents duplicate history entries.
 *
 * Behaviour:
 *  • href === current page  →  no-op (clicking the page you're already on does nothing)
 *  • href exists earlier in the tracked stack  →  window.history.go(-n)
 *    (goes back to the real existing browser entry instead of pushing a copy)
 *  • href is a new destination  →  router.push(href)  (normal forward navigation)
 *
 * Use this anywhere you want React-Native-style "navigate() won't stack duplicates"
 * semantics: navbar links, in-page back buttons, auth page switches, etc.
 *
 * It renders a plain <a> so right-click → "Open in new tab" and accessibility
 * tools still work correctly.
 */

import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode, MouseEvent } from 'react';
import { readStack } from '../src/lib/nav-stack';

interface NavLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  /** Extra inline styles (forwarded straight to <a>). */
  style?: React.CSSProperties;
}

export function NavLink({ href, className, children, style }: NavLinkProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Let the browser handle modifier-key clicks (open in new tab, etc.)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();

    const targetBase  = href.split('?')[0];
    const currentBase = pathname.split('?')[0];

    // ── Same page: do nothing ──────────────────────────────────────────
    if (targetBase === currentBase) return;

    const stack       = readStack();
    const currentPos  = stack.length - 1;

    // ── Target exists earlier in the stack: go back to it ─────────────
    // Search backwards from one before the current position.
    for (let i = currentPos - 1; i >= 0; i--) {
      if (stack[i].split('?')[0] === targetBase) {
        const stepsBack = currentPos - i;
        window.history.go(-stepsBack);
        return;
      }
    }

    // ── New destination: push normally ────────────────────────────────
    router.push(href);
  };

  return (
    <a href={href} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  );
}
