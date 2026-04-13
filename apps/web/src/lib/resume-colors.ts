export interface ResumeColor {
  id: string;
  label: string;
  hex: string;
}

export const RESUME_COLORS: ResumeColor[] = [
  { id: 'navy',     label: 'Navy',       hex: '#1a3a4a' },
  { id: 'charcoal', label: 'Charcoal',   hex: '#2d2d2d' },
  { id: 'slate',    label: 'Slate',      hex: '#374151' },
  { id: 'cobalt',   label: 'Cobalt',     hex: '#1e40af' },
  { id: 'royal',    label: 'Royal Blue', hex: '#2563eb' },
  { id: 'teal',     label: 'Teal',       hex: '#0d7c6b' },
  { id: 'emerald',  label: 'Emerald',    hex: '#059669' },
  { id: 'sage',     label: 'Sage',       hex: '#4a7c59' },
  { id: 'crimson',  label: 'Crimson',    hex: '#dc2626' },
  { id: 'coral',    label: 'Coral',      hex: '#e84040' },
  { id: 'amber',    label: 'Amber',      hex: '#d97706' },
  { id: 'violet',   label: 'Violet',     hex: '#7c3aed' },
];

export const DEFAULT_COLOR = RESUME_COLORS[0]; // navy
