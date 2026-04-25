'use strict';

/** @type {import('./index').TemplateMeta[]} */
const templates = [
  // ── Original 8 ──────────────────────────────────────────────────────────────
  {
    id: 'classic',
    name: 'Classic',
    slug: 'classic',
    style: 'Professional',
    thumbnail: '/templates/thumbnails/classic.png',
    htmlPath: 'classic.html'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    slug: 'minimal',
    style: 'Minimal',
    thumbnail: '/templates/thumbnails/minimal.png',
    htmlPath: 'minimal.html'
  },
  {
    id: 'executive',
    name: 'Executive',
    slug: 'executive',
    style: 'Professional',
    thumbnail: '/templates/thumbnails/executive.png',
    htmlPath: 'executive.html'
  },
  {
    id: 'modern',
    name: 'Modern',
    slug: 'modern',
    style: 'Creative',
    thumbnail: '/templates/thumbnails/modern.png',
    htmlPath: 'modern.html'
  },
  {
    id: 'elegant',
    name: 'Elegant',
    slug: 'elegant',
    style: 'Creative',
    thumbnail: '/templates/thumbnails/elegant.png',
    htmlPath: 'elegant.html'
  },
  {
    id: 'bold',
    name: 'Bold',
    slug: 'bold',
    style: 'Modern',
    thumbnail: '/templates/thumbnails/bold.png',
    htmlPath: 'bold.html'
  },
  {
    id: 'clean-grid',
    name: 'Clean Grid',
    slug: 'clean-grid',
    style: 'Modern',
    thumbnail: '/templates/thumbnails/clean-grid.png',
    htmlPath: 'clean-grid.html'
  },
  {
    id: 'ats',
    name: 'ATS Resume',
    slug: 'ats',
    style: 'Minimal',
    thumbnail: '/templates/thumbnails/ats.png',
    htmlPath: 'ats.html'
  },
  {
    id: 'ats-friendly',
    name: 'ATS Friendly',
    slug: 'ats-friendly',
    style: 'Minimal',
    thumbnail: '/templates/thumbnails/ats-friendly.png',
    htmlPath: 'ats-friendly.html'
  },

  // ── Pro 8 ────────────────────────────────────────────────────────────────────
  {
    id: 'classic-pro',
    name: 'Classic Pro',
    slug: 'classic-pro',
    style: 'Professional',
    thumbnail: '/templates/thumbnails/classic-pro.png',
    htmlPath: 'classic-pro.html'
  },
  {
    id: 'minimal-pro',
    name: 'Minimal Pro',
    slug: 'minimal-pro',
    style: 'Minimal',
    thumbnail: '/templates/thumbnails/minimal-pro.png',
    htmlPath: 'minimal-pro.html'
  },
  {
    id: 'executive-pro',
    name: 'Executive Pro',
    slug: 'executive-pro',
    style: 'Professional',
    thumbnail: '/templates/thumbnails/executive-pro.png',
    htmlPath: 'executive-pro.html'
  },
  {
    id: 'modern-pro',
    name: 'Modern Pro',
    slug: 'modern-pro',
    style: 'Creative',
    thumbnail: '/templates/thumbnails/modern-pro.png',
    htmlPath: 'modern-pro.html'
  },
  {
    id: 'elegant-pro',
    name: 'Elegant Pro',
    slug: 'elegant-pro',
    style: 'Creative',
    thumbnail: '/templates/thumbnails/elegant-pro.png',
    htmlPath: 'elegant-pro.html'
  },
  {
    id: 'bold-pro',
    name: 'Bold Pro',
    slug: 'bold-pro',
    style: 'Modern',
    thumbnail: '/templates/thumbnails/bold-pro.png',
    htmlPath: 'bold-pro.html'
  },
  {
    id: 'clean-grid-pro',
    name: 'Clean Grid Pro',
    slug: 'clean-grid-pro',
    style: 'Modern',
    thumbnail: '/templates/thumbnails/clean-grid-pro.png',
    htmlPath: 'clean-grid-pro.html'
  },
  {
    id: 'ats-pro',
    name: 'ATS Pro',
    slug: 'ats-pro',
    style: 'Minimal',
    thumbnail: '/templates/thumbnails/ats-pro.png',
    htmlPath: 'ats-pro.html'
  },

  // ── New 10 ───────────────────────────────────────────────────────────────────
  {
    id: 'slate',
    name: 'Slate',
    slug: 'slate',
    style: 'Professional',
    thumbnail: '/templates/thumbnails/slate.png',
    htmlPath: 'slate.html'
  },
  {
    id: 'indigo',
    name: 'Indigo',
    slug: 'indigo',
    style: 'Creative',
    thumbnail: '/templates/thumbnails/indigo.png',
    htmlPath: 'indigo.html'
  },
  {
    id: 'cobalt',
    name: 'Cobalt',
    slug: 'cobalt',
    style: 'Professional',
    thumbnail: '/templates/thumbnails/cobalt.png',
    htmlPath: 'cobalt.html'
  },
  {
    id: 'sage',
    name: 'Sage',
    slug: 'sage',
    style: 'Minimal',
    thumbnail: '/templates/thumbnails/sage.png',
    htmlPath: 'sage.html'
  },
  {
    id: 'compact',
    name: 'Compact',
    slug: 'compact',
    style: 'Minimal',
    thumbnail: '/templates/thumbnails/compact.png',
    htmlPath: 'compact.html'
  },
  {
    id: 'creative',
    name: 'Creative',
    slug: 'creative',
    style: 'Creative',
    thumbnail: '/templates/thumbnails/creative.png',
    htmlPath: 'creative.html'
  },
  {
    id: 'mono',
    name: 'Mono',
    slug: 'mono',
    style: 'Minimal',
    thumbnail: '/templates/thumbnails/mono.png',
    htmlPath: 'mono.html'
  },
  {
    id: 'timeline',
    name: 'Timeline',
    slug: 'timeline',
    style: 'Modern',
    thumbnail: '/templates/thumbnails/timeline.png',
    htmlPath: 'timeline.html'
  },
  {
    id: 'corporate',
    name: 'Corporate',
    slug: 'corporate',
    style: 'Professional',
    thumbnail: '/templates/thumbnails/corporate.png',
    htmlPath: 'corporate.html'
  }
];

const templateStyles = ['Professional', 'Minimal', 'Creative', 'Modern'];

module.exports = { templates, templateStyles };
