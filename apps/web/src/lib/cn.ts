import { clsx, type ClassValue } from 'clsx';

/**
 * Utility for merging Tailwind class names conditionally.
 * Uses clsx for conditional logic.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
