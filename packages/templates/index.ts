export type TemplateMeta = {
  id: string;
  name: string;
  slug: string;
  style: string;
  thumbnail: string;
  htmlPath: string;
};

export const templates: TemplateMeta[] = [
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
    id: 'ats-friendly',
    name: 'ATS Friendly',
    slug: 'ats-friendly',
    style: 'Minimal',
    thumbnail: '/templates/thumbnails/ats-friendly.png',
    htmlPath: 'ats-friendly.html'
  },
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

export const templateStyles = ['Professional', 'Minimal', 'Creative', 'Modern'];
