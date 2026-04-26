/**
 * nav-stack.ts
 *
 * Lightweight sessionStorage-backed navigation stack.
 * Used by NavigationTracker (to record every page visit) and
 * NavLink (to detect whether a target page already exists earlier
 * in the stack so we can go back instead of pushing a duplicate).
 *
 * sessionStorage is per-tab, so multiple open tabs don't interfere.
 */

const KEY = '__nav_stack';

/** Read the current stack (path strings, oldest → newest). */
export function readStack(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

/** Persist the stack (capped at 100 entries to avoid bloat). */
export function writeStack(stack: string[]): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(stack.slice(-100)));
}
