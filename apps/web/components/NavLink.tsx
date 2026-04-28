'use client';

/**
 * NavLink — a smart <a> that prevents duplicate history entries.
 *
 * Behaviour:
 *  • href === current page  →  no-op (clicking the page you're already on does nothing)
 *  • href exists exactly one step earlier in the tracked stack  →  router.back()
 *    (goes back in history without pushing a duplicate, only when it's safe to do so)
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

    const stack      = readStack();
    const currentPos = stack.length - 1;

    // ── Target is exactly one step back: safe to go back ──────────────
    // Only use router.back() when the immediately previous entry matches.
    // This avoids the risk of window.history.go(-n) overshooting into
    // external browser history entries when n > 1.
    if (
      currentPos >= 1 &&
      stack[currentPos - 1]?.split('?')[0] === targetBase
    ) {
      router.back();
      return;
    }

    // ── New destination (or target is further back): push normally ─────
    router.push(href);
  };

  return (
    <a href={href} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  );
}
