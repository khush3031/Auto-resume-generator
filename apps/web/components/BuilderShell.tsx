'use client';

import { NavLink } from './NavLink';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createResume, exportResumePdf, fetchResume, updateResume } from '../src/lib/api';
import { useAuthStore } from '../src/store/auth.store';
import { AuthModal } from './AuthModal';
import { ResumePreviewer } from './ResumePreviewer';
// import { AiBulletSuggestions } from './builder/AiBulletSuggestions';
// import { AiSkillSuggestions } from './builder/AiSkillSuggestions';
// import { AiSummarySuggestions } from './builder/AiSummarySuggestions';
import { ColorPicker }   from './builder/ColorPicker';
import { ZoomControls }  from './builder/ZoomControls';
import { DEFAULT_COLOR, RESUME_COLORS, ResumeColor } from '../src/lib/resume-colors';


const baseFormData: Record<string, string> = {
  fullName: '', jobTitle: '', email: '', phone: '',
  location: '', linkedin: '', website: '', initials: '', summary: '',
  _accentColor: '',
  // Job 1 fields — always present (user starts with one job entry)
  job1Title: '', job1Company: '', job1Location: '', job1Start: '', job1End: '',
  job1Bullet1: '', job1Bullet2: '', job1Bullet3: '',
};

const sampleData: Record<string, string> = {
  fullName:  'Alex Johnson',        jobTitle:  'Senior Software Engineer',
  email:     'alex@example.com',    phone:     '+1 (555) 234-5678',
  location:  'San Francisco, CA',   linkedin:  'linkedin.com/in/alexjohnson',
  website:   'alexjohnson.dev',     initials:  'AJ',
  summary:   'Results-driven software engineer with 6+ years building scalable web applications. Passionate about clean architecture, developer experience, and shipping products that users love.',

  job1Title: 'Senior Software Engineer', job1Company:  'TechCorp Inc.',
  job1Location: 'San Francisco, CA',     job1Start: 'Jan 2021', job1End: 'Present',
  job1Bullet1: 'Led microservices redesign serving 2 M+ daily active users',
  job1Bullet2: 'Cut API p95 latency by 40 % through query optimisation',
  job1Bullet3: 'Mentored 4 junior engineers and ran technical interviews',

  job2Title: 'Software Engineer',    job2Company: 'StartupXYZ',
  job2Location: 'Remote',            job2Start: 'Jun 2019', job2End: 'Dec 2020',
  job2Bullet1: 'Built React dashboard adopted by 500+ enterprise clients',
  job2Bullet2: 'Automated CI/CD pipeline, reducing deploy time by 60 %',

  degree: 'B.S. Computer Science',  university:    'University of California, Berkeley',
  graduationYear: '2019',

  skill1: 'TypeScript', skill2: 'React',      skill3: 'Node.js',
  skill4: 'PostgreSQL', skill5: 'Docker',

  lang1: 'English', lang1Level: 'Native',
  lang2: 'Spanish', lang2Level: 'Conversational',

  cert1: 'AWS Certified Developer',   cert1Issuer: 'Amazon Web Services', cert1Year: '2022',
  cert2: 'Google Cloud Professional', cert2Issuer: 'Google',              cert2Year: '2023',
};


function jobFields(n: number): Record<string, string> {
  return {
    [`job${n}Title`]: '', [`job${n}Company`]: '', [`job${n}Location`]: '',
    [`job${n}Start`]: '', [`job${n}End`]: '',
    [`job${n}Bullet1`]: '', [`job${n}Bullet2`]: '', [`job${n}Bullet3`]: '',
  };
}
function educationFields(n: number): Record<string, string> {
  const p = n === 1 ? '' : String(n);
  return { [`degree${p}`]: '', [`university${p}`]: '', [`graduationYear${p}`]: '' };
}
function certFields(n: number): Record<string, string> {
  return { [`cert${n}`]: '', [`cert${n}Issuer`]: '', [`cert${n}Year`]: '', [`cert${n}Url`]: '' };
}
function skillFields(n: number): Record<string, string> { return { [`skill${n}`]: '' }; }
function langFields(n: number): Record<string, string> {
  return { [`lang${n}`]: '', [`lang${n}Level`]: '' };
}
function projectFields(n: number): Record<string, string> {
  return {
    [`project${n}Name`]: '', [`project${n}Role`]: '', [`project${n}Tech`]: '',
    [`project${n}Start`]: '', [`project${n}End`]: '',
    [`project${n}Description`]: '', [`project${n}Url`]: '',
  };
}

// URL fields: cert*Url, project*Url, linkedin, website — everything else is plain text
const URL_FIELD_RX    = /Url$|^linkedin$|^website$/;
const LOCALHOST_RX    = /localhost|127\.0\.0\.1|builder\//i;
const ANY_URL_RX      = /https?:\/\/|localhost|127\.0\.0\.1|builder\//i;

function sanitizeEncoding(html: string): string {
  return html
    .replace(/â€"/g,    '\u2013').replace(/â€"/g,    '\u2014')
    .replace(/â€™/g,    '\u2019').replace(/â€œ/g,    '\u201C')
    .replace(/â€\x9D/g, '\u201D').replace(/â€¢/g,    '\u2022')
    .replace(/Ã©/g,     '\u00E9').replace(/Ã¨/g,     '\u00E8')
    .replace(/Ã /g,     '\u00E0').replace(/Ã¼/g,     '\u00FC')
    .replace(/Ã¶/g,     '\u00F6').replace(/Ã¤/g,     '\u00E4');
}

function injectWrapFix(html: string): string {
  const style = `<style>
  * { box-sizing: border-box; }
  body, .page { max-width: 100% !important; overflow-x: hidden !important; }
  p, li, span, div {
    word-break: break-word !important;
    overflow-wrap: break-word !important;
    white-space: normal !important;
  }
</style>`;
  return html.includes('</head>') ? html.replace('</head>', style + '\n</head>') : style + html;
}

// ── Dynamic slot expansion ────────────────────────────────────────────────────
/**
 * Find the smallest HTML element that spans all the given search strings.
 * Walks backwards from the first search position looking for an opening tag
 * whose matching close tag falls after all search strings.
 */
function findContainer(
  html: string,
  searches: string[],
): { el: string; start: number; end: number } | null {
  if (!searches.length) return null;

  // Compute the range that must be covered
  let rangeStart = Infinity;
  let rangeEnd   = -1;
  for (const s of searches) {
    const p = html.indexOf(s);
    if (p === -1) return null;
    if (p < rangeStart) rangeStart = p;
    if (p + s.length > rangeEnd) rangeEnd = p + s.length;
  }

  const VOID = new Set(['meta','link','br','hr','img','input','head','html','body','style','script']);

  for (let i = rangeStart - 1; i >= 0; i--) {
    if (html[i] !== '<') continue;
    const next = html[i + 1];
    if (next === '/' || next === '!' || next === '?') continue;

    const gt = html.indexOf('>', i);
    if (gt === -1 || gt >= rangeStart) continue; // tag must fully open before rangeStart

    const tagName = (html.slice(i, gt + 1).match(/^<(\w+)/i) ?? [])[1]?.toLowerCase();
    if (!tagName || VOID.has(tagName)) continue;

    const closeTag = `</${tagName}>`;
    const closePos = html.indexOf(closeTag, rangeEnd);
    if (closePos === -1) continue;

    const candidate = html.slice(i, closePos + closeTag.length);
    if (searches.every(s => candidate.includes(s))) {
      return { el: candidate, start: i, end: closePos + closeTag.length };
    }
  }
  return null;
}

/** Clone the HTML block wrapping the last slot of `prefix` for each extra item in data. */
function expandSingleSlots(html: string, data: Record<string, string>, prefix: string): string {
  let max = 0;
  for (let n = 1; html.includes(`{{${prefix}${n}}}`); n++) max = n;
  if (!max) return html;

  const extras: number[] = [];
  for (let n = max + 1; data[`${prefix}${n}`]; n++) extras.push(n);
  if (!extras.length) return html;

  const c = findContainer(html, [`{{${prefix}${max}}}`]);
  if (!c) return html;

  const clones = extras
    .map(n => c.el.split(`{{${prefix}${max}}}`).join(`{{${prefix}${n}}}`))
    .join('');
  return html.slice(0, c.end) + clones + html.slice(c.end);
}

/** Clone the HTML block for multi-field items (cert, lang) */
function expandMultiSlots(
  html: string,
  data: Record<string, string>,
  prefix: string,
  suffixes: string[],
): string {
  let max = 0;
  for (let n = 1; html.includes(`{{${prefix}${n}}}`); n++) max = n;
  if (!max) return html;

  const extras: number[] = [];
  for (let n = max + 1; data[`${prefix}${n}`]; n++) extras.push(n);
  if (!extras.length) return html;

  const searchKeys = [`{{${prefix}${max}}}`, ...suffixes.map(s => `{{${prefix}${max}${s}}}`)];
  const validKeys  = searchKeys.filter(s => html.includes(s));

  const c = findContainer(html, validKeys);
  if (!c) return expandSingleSlots(html, data, prefix); // fallback

  const allSuffixes = ['', ...suffixes];
  const clones = extras.map(n => {
    let clone = c.el;
    allSuffixes.forEach(s => {
      clone = clone.split(`{{${prefix}${max}${s}}}`).join(`{{${prefix}${n}${s}}}`);
    });
    return clone;
  }).join('');
  return html.slice(0, c.end) + clones + html.slice(c.end);
}

/** Clone the HTML block for extra work-experience entries */
function expandJobSlots(html: string, data: Record<string, string>): string {
  let max = 0;
  for (let n = 1; html.includes(`{{job${n}Title}}`); n++) max = n;
  if (!max) return html;

  const extras: number[] = [];
  for (let n = max + 1; data[`job${n}Title`]; n++) extras.push(n);
  if (!extras.length) return html;

  const allSuffixes = ['Title','Company','Location','Start','End','Bullet1','Bullet2','Bullet3'];
  const validKeys   = allSuffixes
    .map(s => `{{job${max}${s}}}`)
    .filter(s => html.includes(s));
  if (validKeys.length < 2) return html;

  const c = findContainer(html, validKeys.slice(0, 3));
  if (!c) return html;

  const clones = extras.map(n => {
    let clone = c.el;
    allSuffixes.forEach(s => {
      clone = clone.split(`{{job${max}${s}}}`).join(`{{job${n}${s}}}`);
    });
    return clone;
  }).join('');
  return html.slice(0, c.end) + clones + html.slice(c.end);
}

function expandAllDynamicSlots(html: string, data: Record<string, string>): string {
  html = expandSingleSlots(html, data, 'skill');
  html = expandMultiSlots(html, data, 'lang', ['Level']);
  html = expandMultiSlots(html, data, 'cert', ['Issuer', 'Year']);
  html = expandJobSlots(html, data);
  return html;
}

// ─── Client-side block builders (mirror backend logic for live preview) ───────

/** Build experience HTML for templates using {{experienceBlocks}} placeholder. */
function buildExpBlocksFront(d: Record<string, string>): string {
  const items: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const title = (d[`job${i}Title`] ?? '').trim();
    if (!title) continue;
    const company  = (d[`job${i}Company`]  ?? '').trim();
    const location = (d[`job${i}Location`] ?? '').trim();
    const start    = (d[`job${i}Start`]    ?? '').trim();
    const end      = (d[`job${i}End`]      ?? '').trim();
    const bullets  = [1, 2, 3].map((b) => (d[`job${i}Bullet${b}`] ?? '').trim()).filter(Boolean);
    const dateStr    = [start, end].filter(Boolean).join(' \u2013 ');
    const companyStr = [company, location].filter(Boolean).join(' \u00b7 ');
    items.push(`
<div style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid #f0f0f0;">
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px;">
    <span style="font-size:13px;font-weight:700;color:#1a1a1a;">${title}</span>
    ${dateStr ? `<span style="font-size:11px;color:var(--accent,#1a3a4a);white-space:nowrap;margin-left:8px;">${dateStr}</span>` : ''}
  </div>
  ${companyStr ? `<div style="font-size:12px;color:#666;margin-bottom:6px;">${companyStr}</div>` : ''}
  ${bullets.length ? `<ul style="list-style:none;padding:0;margin:0;">${
    bullets.map((b) => `<li style="font-size:12px;color:#444;line-height:1.65;padding-left:14px;position:relative;margin-bottom:2px;word-break:break-word;"><span style="position:absolute;left:0;color:var(--accent,#1a3a4a);">&#9658;</span>${b}</li>`).join('')
  }</ul>` : ''}
</div>`);
  }
  return items.join('');
}

/** Build certification HTML for templates using {{certificationBlocks}} placeholder. */
function buildCertBlocksFront(d: Record<string, string>): string {
  const items: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const name = (d[`cert${i}`] ?? '').trim();
    if (!name) continue;
    const issuer = (d[`cert${i}Issuer`] ?? '').trim();
    const year   = (d[`cert${i}Year`]   ?? '').trim();
    const url    = (d[`cert${i}Url`]    ?? '').trim();
    items.push(`
<div style="margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f5f5f5;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <div style="font-size:12px;font-weight:700;color:#1a1a1a;">${name}</div>
      ${issuer ? `<div style="font-size:11px;color:#777;margin-top:1px;">${issuer}</div>` : ''}
      ${url ? `<a href="${url}" style="font-size:10px;color:var(--accent,#1a3a4a);text-decoration:none;display:inline-block;margin-top:2px;">View \u2192</a>` : ''}
    </div>
    ${year ? `<span style="font-size:11px;color:var(--accent,#1a3a4a);font-weight:600;white-space:nowrap;margin-left:8px;">${year}</span>` : ''}
  </div>
</div>`);
  }
  return items.join('');
}

/** Build project HTML for templates using {{projectBlocks}} placeholder. */
function buildProjBlocksFront(d: Record<string, string>): string {
  const items: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const name = (d[`project${i}Name`] ?? '').trim();
    if (!name) continue;
    const role  = (d[`project${i}Role`]        ?? '').trim();
    const tech  = (d[`project${i}Tech`]        ?? '').trim();
    const start = (d[`project${i}Start`]       ?? '').trim();
    const end   = (d[`project${i}End`]         ?? '').trim();
    const desc  = (d[`project${i}Description`] ?? '').trim();
    const url   = (d[`project${i}Url`]         ?? '').trim();
    const dateStr = [start, end].filter(Boolean).join(' \u2013 ');
    items.push(`
<div style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #f0f0f0;">
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px;">
    <span style="font-size:13px;font-weight:700;color:#1a1a1a;">${name}</span>
    ${dateStr ? `<span style="font-size:11px;color:var(--accent,#1a3a4a);white-space:nowrap;">${dateStr}</span>` : ''}
  </div>
  ${role ? `<div style="font-size:12px;color:var(--accent,#1a3a4a);font-weight:600;margin-bottom:2px;">${role}</div>` : ''}
  ${tech ? `<div style="font-size:11px;color:#777;margin-bottom:5px;">Tech: ${tech}</div>` : ''}
  ${desc ? `<div style="font-size:12px;color:#444;line-height:1.65;word-break:break-word;">${desc}</div>` : ''}
  ${url ? `<a href="${url}" style="font-size:10px;color:var(--accent,#1a3a4a);text-decoration:none;margin-top:3px;display:inline-block;">View Project \u2192</a>` : ''}
</div>`);
  }
  return items.join('');
}

/** Build education HTML for templates using {{educationBlocks}} placeholder. */
function buildEducationBlocksFront(d: Record<string, string>): string {
  const items: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const degKey  = i === 1 ? 'degree'         : `degree${i}`;
    const uniKey  = i === 1 ? 'university'      : `university${i}`;
    const yearKey = i === 1 ? 'graduationYear'  : `graduationYear${i}`;
    const degree  = (d[degKey]  ?? '').trim();
    const school  = (d[uniKey]  ?? '').trim();
    const year    = (d[yearKey] ?? '').trim();
    if (!degree && !school) continue;
    items.push(`
<div style="margin-bottom:12px;">
  <div style="font-size:13px;font-weight:700;color:#1a1a1a;">${degree || school}</div>
  ${degree && school ? `<div style="font-size:12px;color:#666;">${school}</div>` : ''}
  ${year ? `<div style="font-size:11px;color:var(--accent,#1a3a4a);margin-top:2px;">${year}</div>` : ''}
</div>`);
  }
  return items.join('');
}

/** Build languages HTML for templates using {{languagesBlock}} placeholder. */
function buildLanguagesBlockFront(d: Record<string, string>): string {
  const rows: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const lang  = (d[`lang${i}`]      ?? '').trim();
    const level = (d[`lang${i}Level`] ?? '').trim();
    if (!lang) continue;
    rows.push(`<div style="font-size:12px;color:#444;margin-bottom:5px;"><strong>${lang}</strong>${level ? ` \u2014 ${level}` : ''}</div>`);
  }
  return rows.join('');
}

/** Build skills HTML for templates using {{skillsBlock}} placeholder. */
function buildSkillsBlockFront(d: Record<string, string>): string {
  const skills: string[] = [];
  for (let i = 1; i <= 30; i++) {
    const s = (d[`skill${i}`] ?? '').trim();
    if (!s) continue;
    skills.push(s);
  }
  return skills
    .map(
      (s) =>
        `<span style="display:inline-block;padding:5px 10px;margin:3px 4px 3px 0;border-radius:999px;font-size:0.85rem;background:rgba(59,130,246,0.1);color:inherit;">${s}</span>`,
    )
    .join('');
}

// ─────────────────────────────────────────────────────────────────────────────

function populateTemplate(html: string, data: Record<string, string>): string {
  const prepped  = injectWrapFix(sanitizeEncoding(html));
  const expanded = expandAllDynamicSlots(prepped, data);

  // Replace block placeholders BEFORE the general {{key}} sweep so they
  // don't get wiped to empty strings (data has no "experienceBlocks" key).
  const hasProjects = Array.from({ length: 10 }, (_, i) => i + 1)
    .some((i) => (data[`project${i}Name`] ?? '').trim());

  const withBlocks = expanded
    .replace(/\{\{experienceBlocks\}\}/g,      buildExpBlocksFront(data))
    .replace(/\{\{certificationBlocks\}\}/g,   buildCertBlocksFront(data))
    .replace(/\{\{projectBlocks\}\}/g,         buildProjBlocksFront(data))
    .replace(/\{\{projectsSectionDisplay\}\}/g, hasProjects ? 'block' : 'none')
    .replace(/\{\{educationBlocks\}\}/g,       buildEducationBlocksFront(data))
    .replace(/\{\{languagesBlock\}\}/g,        buildLanguagesBlockFront(data))
    .replace(/\{\{skillsBlock\}\}/g,           buildSkillsBlockFront(data));

  return withBlocks.replace(/{{\s*([^}\s]+)\s*}}/g, (_, key: string) => {
    const v = data[key];
    return v !== undefined && v.trim() !== '' ? v : (sampleData[key] ?? '');
  });
}


/**
 * Known accent colors for each template id.
 * These are the "brand" colors hardcoded in each template's CSS.
 * When the user picks a theme color, these get swapped out.
 */
const TEMPLATE_ACCENT_COLORS: Record<string, string> = {
  'classic':      '#0f3d5c',   // sidebar bg (now var(--accent))
  'minimal':      '#111827',
  'executive':    '#1b1b1b',   // sidebar bg (now var(--accent))
  'bold':         '#ef4444',   // header bg (now var(--accent))
  'modern':       '#114b5f',   // sidebar bg (now var(--accent))
  'elegant':      '#9d8189',
  'clean-grid':   '#334155',
  'ats-friendly': '#374151',
  'ats':          '#374151',
  'corporate':    '#1a1a2e',   // header bg (now var(--accent))
  'creative':     '#1a1a2e',   // sidebar bg (now var(--accent))
  'compact':      '#e53935',
  'timeline':     '#7c3aed',   // top band bg (now var(--accent))
  'mono':         '#333',
  'slate':        '#38bdf8',
  'indigo':       '#4338ca',
  'cobalt':       '#0077cc',
  'sage':         '#3a5e3b',
  'infographic':  '#7c3aed',   // left panel bg (var(--accent))
  'academic':     '#374151',
};

/** Convert any hex color to its lowercase 6-char form (#abc → #aabbcc) */
function normHex(h: string): string {
  const s = h.replace('#', '');
  return s.length === 3
    ? '#' + s.split('').map(c => c + c).join('')
    : '#' + s.toLowerCase();
}

/**
 * Inject the selected accent color into the template HTML.
 *
 * Two-pass strategy so EVERY template responds to the picker:
 *  1. Replace all occurrences of the template's known accent color hex
 *     with the selected hex (handles hardcoded-color templates).
 *  2. Inject a <style> overriding --resume-accent-color (handles
 *     templates that already use CSS custom properties).
 */
function injectAccentColor(html: string, hex: string, templateId: string): string {
  let result = html;

  // Pass 1 — direct hex replacement for templates with hardcoded colors
  const knownAccent = TEMPLATE_ACCENT_COLORS[templateId];
  if (knownAccent) {
    const norm = normHex(knownAccent);
    const short = knownAccent.replace('#', '').length === 3 ? knownAccent : null;
    // Replace 6-char version (case-insensitive)
    result = result.split(norm).join(hex);
    result = result.split(norm.toUpperCase()).join(hex);
    result = result.split(knownAccent).join(hex);        // original form
    if (short) result = result.split(short).join(hex);
  }

  // Pass 2 — CSS variable override, injected BEFORE </head> so it overrides template's own :root
  const cssVar = `\n<style id="resume-forge-theme">:root { --resume-accent-color: ${hex} !important; --accent: ${hex} !important; }</style>`;
  result = result.includes('</head>') ? result.replace('</head>', cssVar + '\n</head>') : cssVar + result;

  return result;
}


function validate(
  formData: Record<string, string>,
  jobs: number[], educations: number[],
  skills: number[], langs: number[], certs: number[],
): Record<string, string> {
  const err: Record<string, string> = {};
  const req = (key: string, label: string) => {
    if (!formData[key]?.trim()) err[key] = `${label} is required`;
  };
  req('fullName', 'Full Name'); req('email', 'Email');
  // First job entry is required
  if (jobs.length > 0) {
    const n = jobs[0];
    req(`job${n}Title`, 'Job Title'); req(`job${n}Company`, 'Company');
  }
  educations.forEach((n) => {
    const p = n === 1 ? '' : String(n);
    req(`degree${p}`, 'Degree'); req(`university${p}`, 'University / School');
  });
  skills.forEach((n) => req(`skill${n}`, 'Skill'));
  langs.forEach((n)  => req(`lang${n}`,  'Language'));
  certs.forEach((n)  => req(`cert${n}`,  'Certificate Name'));
  return err;
}

export function BuilderShell({
  template,
  resumeId: initialResumeId,
}: {
  template: { id: string; name: string; style: string; htmlContent: string };
  resumeId?: string;
}) {
  const { isAuthenticated, loadFromStorage } = useAuthStore();

  const [formData,     setFormData]     = useState<Record<string, string>>(baseFormData);
  const [jobs,         setJobs]         = useState<number[]>([1]);
  const [educations,   setEducations]   = useState<number[]>([]);
  const [certs,        setCerts]        = useState<number[]>([]);
  const [skills,       setSkills]       = useState<number[]>([]);
  const [langs,        setLangs]        = useState<number[]>([]);
  const [projects,     setProjects]     = useState<number[]>([]);

  const jobCounter   = useRef(1);
  const eduCounter   = useRef(0);
  const certCounter  = useRef(0);
  const skillCounter = useRef(0);
  const langCounter  = useRef(0);
  const projCounter  = useRef(0);

  const [resumeId,        setResumeId]        = useState<string | null>(null);
  const [html,            setHtml]            = useState('');
  const [accentColor,     setAccentColor]     = useState<ResumeColor>(DEFAULT_COLOR);
  const [isSaving,        setIsSaving]        = useState(false);
  const [isDownloading,   setIsDownloading]   = useState(false);
  const [lastSavedAt,     setLastSavedAt]     = useState<string | null>(null);
  const [showAuthModal,   setShowAuthModal]   = useState(false);
  const [activeTab,       setActiveTab]       = useState<'edit' | 'preview'>('edit');
  const [errors,          setErrors]          = useState<Record<string, string>>({});
  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const [panelWidth,      setPanelWidth]      = useState<number | null>(null);
  const [isDragging,      setIsDragging]      = useState(false);
  const [previewZoom,     setPreviewZoom]     = useState<number>(0.75);

  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelWidthRef  = useRef<number | null>(null);

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  // Restore saved panel width from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('rf-panel-w');
    if (stored) {
      const w = parseInt(stored, 10);
      if (w >= 260 && w <= 900) { setPanelWidth(w); panelWidthRef.current = w; }
    }
  }, []);

  // Keyboard shortcuts: Ctrl/Cmd + = / − / 0 for zoom
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setPreviewZoom((z) => Math.min(2.0, Math.round((z + 0.25) * 100) / 100));
        } else if (e.key === '-') {
          e.preventDefault();
          setPreviewZoom((z) => Math.max(0.25, Math.round((z - 0.25) * 100) / 100));
        } else if (e.key === '0') {
          e.preventDefault();
          setPreviewZoom(1);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const defaultW = window.innerWidth >= 1280 ? 660 : 420;
    const startW   = panelWidthRef.current ?? defaultW;
    setIsDragging(true);

    const onMouseMove = (ev: MouseEvent) => {
      const newW = Math.min(900, Math.max(260, startW + (ev.clientX - startX)));
      setPanelWidth(newW);
      panelWidthRef.current = newW;
    };
    const onMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',   onMouseUp);
      if (panelWidthRef.current) localStorage.setItem('rf-panel-w', String(panelWidthRef.current));
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
  }, []);

  // Scrub browser-autofilled garbage on mount — ONLY clear values that are
  // clearly wrong (contain the current page path or start with localhost http).
  useEffect(() => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isLocalhostUrl = (v: string) => {
      const t = (v ?? '').trim();
      return t.startsWith('http') && (t.includes('localhost') || t.includes('127.0.0.1'));
    };

    setFormData((prev) => {
      const next = { ...prev };

      // URL-typed fields: clear only if they contain the current builder URL
      ['linkedin', 'website'].forEach((f) => {
        if ((next[f] ?? '').includes(currentPath) || isLocalhostUrl(next[f] ?? '')) next[f] = '';
      });

      // cert/project URL fields: clear only if they contain the builder path
      for (let i = 1; i <= 10; i++) {
        if ((next[`cert${i}Url`]    ?? '').includes(currentPath)) next[`cert${i}Url`]    = '';
        if ((next[`project${i}Url`] ?? '').includes(currentPath)) next[`project${i}Url`] = '';
      }

      // Initials: clear only if obviously wrong (> 4 chars)
      if ((next.initials?.length ?? 0) > 4) next.initials = '';

      return next;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill from upload flow (source=upload query param) ──────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('source') !== 'upload') return;
    const key = `parsed_resume_${template.id}`;
    const stored = sessionStorage.getItem(key);
    if (!stored) return;
    try {
      const parsed: Record<string, string> = JSON.parse(stored);
      sessionStorage.removeItem(key);
      const urlRx = /https?:\/\/|localhost|127\.0\.0\.1|builder\//i;
      setFormData((prev) => {
        const next = { ...prev };
        Object.entries(parsed).forEach(([k, v]) => {
          if (typeof v === 'string' && v.trim() && !urlRx.test(v)) next[k] = v;
        });
        return next;
      });
      // Restore section counts from parsed data
      const d = parsed;
      let jc = 0;
      for (let i = 1; i <= 10; i++) { if (d[`job${i}Title`]?.trim()) jc = i; else break; }
      if (jc > 0) { setJobs(Array.from({ length: jc }, (_, i) => i + 1)); jobCounter.current = jc; }

      let cc = 0;
      for (let i = 1; i <= 10; i++) { if (d[`cert${i}`]?.trim()) cc = i; else break; }
      if (cc > 0) { setCerts(Array.from({ length: cc }, (_, i) => i + 1)); certCounter.current = cc; }

      let skc = 0;
      for (let i = 1; i <= 20; i++) { if (d[`skill${i}`]?.trim()) skc = i; else if (i > 5) break; }
      if (skc > 0) { setSkills(Array.from({ length: skc }, (_, i) => i + 1)); skillCounter.current = skc; }

      let lc = 0;
      for (let i = 1; i <= 10; i++) { if (d[`lang${i}`]?.trim()) lc = i; else break; }
      if (lc > 0) { setLangs(Array.from({ length: lc }, (_, i) => i + 1)); langCounter.current = lc; }

      let ec = 0;
      for (let i = 1; i <= 5; i++) {
        const key2 = i === 1 ? 'degree' : `degree${i}`;
        if (d[key2]?.trim()) ec = i; else break;
      }
      if (ec > 0) { setEducations(Array.from({ length: ec }, (_, i) => i + 1)); eduCounter.current = ec; }
    } catch {
      console.error('Failed to load parsed resume data from sessionStorage');
    }
  }, [template.id]);

  useEffect(() => {
    setHtml(injectAccentColor(populateTemplate(template.htmlContent, formData), accentColor.hex, template.id));
  }, [formData, template.htmlContent, accentColor.hex, template.id]);

  // Load existing resume when editing from dashboard
  useEffect(() => {
    if (!initialResumeId) return;
    setResumeId(initialResumeId);
    fetchResume(initialResumeId).then((resume) => {
      if (!resume?.formData) return;
      const d: Record<string, string> = resume.formData;
      setFormData((prev) => ({ ...prev, ...d }));

      // Restore section counters from saved formData
      let jc = 0;
      for (let i = 1; i <= 10; i++) { if (d[`job${i}Title`]?.trim()) jc = i; else break; }
      if (jc > 0) { setJobs(Array.from({ length: jc }, (_, i) => i + 1)); jobCounter.current = jc; }

      let cc = 0;
      for (let i = 1; i <= 10; i++) { if (d[`cert${i}`]?.trim()) cc = i; else break; }
      if (cc > 0) { setCerts(Array.from({ length: cc }, (_, i) => i + 1)); certCounter.current = cc; }

      let skc = 0;
      for (let i = 1; i <= 30; i++) { if (d[`skill${i}`]?.trim()) skc = i; else if (i > 5) break; }
      if (skc > 0) { setSkills(Array.from({ length: skc }, (_, i) => i + 1)); skillCounter.current = skc; }

      let lc = 0;
      for (let i = 1; i <= 20; i++) { if (d[`lang${i}`]?.trim()) lc = i; else break; }
      if (lc > 0) { setLangs(Array.from({ length: lc }, (_, i) => i + 1)); langCounter.current = lc; }

      let ec = 0;
      for (let i = 1; i <= 5; i++) {
        const key = i === 1 ? 'degree' : `degree${i}`;
        if (d[key]?.trim()) ec = i; else break;
      }
      if (ec > 0) { setEducations(Array.from({ length: ec }, (_, i) => i + 1)); eduCounter.current = ec; }

      let pc = 0;
      for (let i = 1; i <= 10; i++) { if (d[`project${i}Name`]?.trim()) pc = i; else break; }
      if (pc > 0) { setProjects(Array.from({ length: pc }, (_, i) => i + 1)); projCounter.current = pc; }

      if (d['_accentColor']) {
        const found = RESUME_COLORS.find((c) => c.hex === d['_accentColor']);
        if (found) setAccentColor(found);
      }
    }).catch(() => {});
  }, [initialResumeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save: create on first meaningful input, then update on every change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const hasContent = !!(formData['fullName']?.trim() || formData['jobTitle']?.trim());
      if (!hasContent) return; // Don't save blank resumes

      setIsSaving(true);
      try {
        if (!resumeId) {
          const created = await createResume({ templateId: template.id, formData });
          const newId = (created?._id ?? created?.id ?? null) as string | null;
          setResumeId(newId);
        } else {
          await updateResume(resumeId, { formData });
        }
        setLastSavedAt(new Date().toISOString());
      } catch { /* silent */ } finally { setIsSaving(false); }
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [formData, resumeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateField = useCallback((field: string, value: string) => {
    // Reject browser-autofilled URLs before they reach state
    let sanitized = value;
    if (URL_FIELD_RX.test(field)) {
      if (LOCALHOST_RX.test(value)) sanitized = '';   // URL fields: reject localhost/builder
    } else {
      if (ANY_URL_RX.test(value)) sanitized = '';     // text fields: reject any URL
    }
    setFormData((prev) => ({ ...prev, [field]: sanitized }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      if (Object.keys(next).length === 0) setShowErrorBanner(false);
      return next;
    });
  }, []);

  // Re-indexing remove handlers for langs and skills so gaps never form
  const removeLang = (n: number) => {
    const prev = langs;
    const idx  = prev.indexOf(n);
    if (idx < 0) return;
    setFormData((fd) => {
      const next = { ...fd };
      for (let i = idx; i < prev.length - 1; i++) {
        const fromN = prev[i + 1];
        const toN   = prev[i];
        next[`lang${toN}`]      = fd[`lang${fromN}`]      ?? '';
        next[`lang${toN}Level`] = fd[`lang${fromN}Level`] ?? '';
      }
      const lastN = prev[prev.length - 1];
      delete next[`lang${lastN}`];
      delete next[`lang${lastN}Level`];
      return next;
    });
    setLangs(prev.filter((x) => x !== n));
  };

  const removeSkill = (n: number) => {
    const prev = skills;
    const idx  = prev.indexOf(n);
    if (idx < 0) return;
    setFormData((fd) => {
      const next = { ...fd };
      for (let i = idx; i < prev.length - 1; i++) {
        const fromN = prev[i + 1];
        const toN   = prev[i];
        next[`skill${toN}`] = fd[`skill${fromN}`] ?? '';
      }
      const lastN = prev[prev.length - 1];
      delete next[`skill${lastN}`];
      return next;
    });
    setSkills(prev.filter((x) => x !== n));
  };

  const addSection = (
    setArr: React.Dispatch<React.SetStateAction<number[]>>,
    counter: React.MutableRefObject<number>,
    fields: (n: number) => Record<string, string>,
  ) => {
    counter.current += 1;
    const n = counter.current;
    setArr((p) => [...p, n]);
    setFormData((p) => ({ ...p, ...fields(n) }));
  };

  const addAndFocus = (
    setArr: React.Dispatch<React.SetStateAction<number[]>>,
    counter: React.MutableRefObject<number>,
    fields: (n: number) => Record<string, string>,
    getFocusId: (newN: number) => string,
  ) => {
    addSection(setArr, counter, fields);
    const newN = counter.current;
    setTimeout(() => {
      document.getElementById(getFocusId(newN))?.querySelector('input')?.focus();
    }, 50);
  };

  const removeSection = (
    n: number,
    setArr: React.Dispatch<React.SetStateAction<number[]>>,
    fields: (n: number) => Record<string, string>,
  ) => {
    setArr((p) => p.filter((x) => x !== n));
    setFormData((p) => { const next = { ...p }; Object.keys(fields(n)).forEach((k) => delete next[k]); return next; });
    setErrors((p) => {
      const next = { ...p };
      Object.keys(fields(n)).forEach((k) => delete next[k]);
      if (Object.keys(next).length === 0) setShowErrorBanner(false);
      return next;
    });
  };

  const handleDownload = async () => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    const errs = validate(formData, jobs, educations, skills, langs, certs);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setShowErrorBanner(true);
      setActiveTab('edit');
      const firstKey = Object.keys(errs)[0];
      setTimeout(() => {
        document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    if (!resumeId) return;
    try {
      setIsDownloading(true);
      // Cancel any pending debounce and pass formData directly in the export
      // request — the server uses it instead of reading (potentially stale) MongoDB.
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const blob = await exportResumePdf(resumeId, formData);
      const url  = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a    = document.createElement('a');
      a.href = url; a.download = `resume-${resumeId}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      // Persist the latest formData after the export
      updateResume(resumeId, { formData }).then(() => setLastSavedAt(new Date().toISOString())).catch(() => {});
    } finally { setIsDownloading(false); }
  };

  const errorCount = Object.keys(errors).length;
  const saveStatus = isSaving
    ? 'Saving…'
    : lastSavedAt
      ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}`
      : 'Auto-saved as you type';

  const errorBanner = showErrorBanner && errorCount > 0 ? (
    <div className="builder-error-banner">
      <svg className="builder-error-banner__icon" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
      </svg>
      <p className="builder-error-banner__text">
        <span style={{ fontWeight: 600 }}>{errorCount} field{errorCount > 1 ? 's' : ''} must be filled</span>
        {' '}before downloading. Required fields are highlighted in red.
      </p>
      <button onClick={() => setShowErrorBanner(false)} aria-label="Dismiss error banner"
        className="builder-error-banner__dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  ) : null;

  const formSections = (
    <div className="form-sections">
      <FormSection title="Personal Info">
        <Input id="field-fullName" label="Full Name *"  field="fullName"  value={formData.fullName}  onChange={updateField} error={errors.fullName} />
        <Input label="Job Title"                        field="jobTitle"  value={formData.jobTitle}  onChange={updateField} />
        <Input id="field-email"    label="Email *"      field="email"     value={formData.email}     onChange={updateField} error={errors.email} />
        <Input label="Phone"                            field="phone"     value={formData.phone}     onChange={updateField} />
        <Input label="Location"                         field="location"  value={formData.location}  onChange={updateField} />
        <Input label="LinkedIn URL"                     field="linkedin"  value={formData.linkedin}  onChange={updateField} />
        <Input label="Website"                          field="website"   value={formData.website}   onChange={updateField} />
        <Input label="Initials (e.g. JD)"               field="initials"  value={formData.initials}  onChange={updateField} />
      </FormSection>

      <FormSection title="Professional Summary">
        <Textarea label="Summary" field="summary" value={formData.summary} onChange={updateField} />
        {/* <AiSummarySuggestions
          jobTitle={formData.jobTitle || ''}
          topSkills={[formData.skill1, formData.skill2, formData.skill3].filter(Boolean)}
          yearsOfExperience="3+"
          currentRole={formData.job1Title || ''}
          onSelect={(s) => updateField('summary', s)}
        /> */}
      </FormSection>

      <FormSection title="Work Experience">
        {jobs.map((n) => {
          const isLastJob = n === jobs[jobs.length - 1];
          return (
          <Card key={n} label={`Job ${n}`} onRemove={jobs.length > 1 ? () => removeSection(n, setJobs, jobFields) : undefined}>
            <Input id={`field-job${n}Title`}   label="Job Title *" field={`job${n}Title`}   value={formData[`job${n}Title`]   ?? ''} onChange={updateField} error={errors[`job${n}Title`]} />
            <Input id={`field-job${n}Company`} label="Company *"   field={`job${n}Company`} value={formData[`job${n}Company`] ?? ''} onChange={updateField} error={errors[`job${n}Company`]} />
            <Input label="Location"            field={`job${n}Location`} value={formData[`job${n}Location`] ?? ''} onChange={updateField} />
            <div className="builder-date-row">
              <Input label="Start (e.g. Jan 2022)" field={`job${n}Start`} value={formData[`job${n}Start`] ?? ''} onChange={updateField} />
              <Input label="End (e.g. Present)"    field={`job${n}End`}   value={formData[`job${n}End`]   ?? ''} onChange={updateField} />
            </div>
            <Input label="Bullet 1" field={`job${n}Bullet1`} value={formData[`job${n}Bullet1`] ?? ''} onChange={updateField} />
            <Input label="Bullet 2" field={`job${n}Bullet2`} value={formData[`job${n}Bullet2`] ?? ''} onChange={updateField} />
            <Input label="Bullet 3" field={`job${n}Bullet3`} value={formData[`job${n}Bullet3`] ?? ''} onChange={updateField}
              onEnter={isLastJob && jobs.length < 10 ? () => addAndFocus(setJobs, jobCounter, jobFields, (newN) => `field-job${newN}Title`) : undefined}
            />
            {/* <AiBulletSuggestions
              jobTitle={formData[`job${n}Title`] || ''}
              company={formData[`job${n}Company`] || ''}
              existingBullets={[
                formData[`job${n}Bullet1`] || '',
                formData[`job${n}Bullet2`] || '',
                formData[`job${n}Bullet3`] || '',
              ]}
              onSelect={(bullet) => {
                const slots = [`job${n}Bullet1`, `job${n}Bullet2`, `job${n}Bullet3`];
                const empty = slots.find((s) => !formData[s]);
                updateField(empty ?? `job${n}Bullet3`, bullet);
              }}
            /> */}
          </Card>
          );
        })}
        {jobs.length < 10 && (
          <AddButton label="Add Work Experience" onClick={() => addSection(setJobs, jobCounter, jobFields)} />
        )}
      </FormSection>

      <FormSection title="Education">
        {educations.length === 0 && <EmptyHint text="No education entries added yet." />}
        {educations.map((n) => {
          const p = n === 1 ? '' : String(n);
          const isLastEdu = n === educations[educations.length - 1];
          return (
            <Card key={n} label={`Education ${n}`} onRemove={() => removeSection(n, setEducations, educationFields)}>
              <Input id={`field-degree${p}`}     label="Degree / Course *"     field={`degree${p}`}     value={formData[`degree${p}`]     ?? ''} onChange={updateField} error={errors[`degree${p}`]} />
              <Input id={`field-university${p}`} label="University / School *" field={`university${p}`} value={formData[`university${p}`] ?? ''} onChange={updateField} error={errors[`university${p}`]} />
              <Input                             label="Graduation Year"        field={`graduationYear${p}`} value={formData[`graduationYear${p}`] ?? ''} onChange={updateField}
                onEnter={isLastEdu ? () => addAndFocus(setEducations, eduCounter, educationFields, (newN) => `field-degree${newN === 1 ? '' : newN}`) : undefined}
              />
            </Card>
          );
        })}
        <AddButton label="Add Education" onClick={() => addSection(setEducations, eduCounter, educationFields)} />
      </FormSection>

      <FormSection title="Skills">
        {skills.length === 0 && <EmptyHint text="No skills added yet." />}
        {skills.length > 0 && (
          <div className="builder-skill-row">
            {skills.map((n) => (
              <div key={n} className="builder-skill-item">
                <div className="builder-skill-item__field">
                  <Input id={`field-skill${n}`} label="Skill *" field={`skill${n}`}
                    value={formData[`skill${n}`] ?? ''} onChange={updateField} error={errors[`skill${n}`]}
                    onEnter={() => addAndFocus(setSkills, skillCounter, skillFields, (newN) => `field-skill${newN}`)}
                  />
                </div>
                <button onClick={() => removeSkill(n)} aria-label="Remove skill"
                  className="builder-remove-btn">
                  <XIcon />
                </button>
              </div>
            ))}
          </div>
        )}
        {/* <AiSkillSuggestions
          jobTitle={formData.jobTitle || ''}
          experienceSummary={[
            formData.job1Title, formData.job1Company,
            formData.job1Bullet1, formData.job1Bullet2,
            formData.job2Title, formData.job2Company,
          ].filter(Boolean).join('. ')}
          selectedSkills={skills.map((n) => formData[`skill${n}`]).filter(Boolean)}
          onAdd={(skill) => {
            const emptySlot = skills.find((n) => !formData[`skill${n}`]);
            if (emptySlot != null) {
              updateField(`skill${emptySlot}`, skill);
            } else {
              addSection(setSkills, skillCounter, skillFields);
              setTimeout(() => {
                const newN = skillCounter.current;
                updateField(`skill${newN}`, skill);
              }, 50);
            }
          }}
          onRemove={(skill) => {
            const slot = skills.find((n) => formData[`skill${n}`] === skill);
            if (slot != null) updateField(`skill${slot}`, '');
          }}
        /> */}
        <AddButton label="Add Skill" onClick={() => addSection(setSkills, skillCounter, skillFields)} />
      </FormSection>

      <FormSection title="Languages">
        {langs.length === 0 && <EmptyHint text="No languages added yet." />}
        {langs.map((n) => {
          const isLastLang = n === langs[langs.length - 1];
          return (
          <div key={n} className="builder-lang-row">
            <div className="builder-lang-fields">
              <Input id={`field-lang${n}`} label="Language *" field={`lang${n}`}
                value={formData[`lang${n}`] ?? ''} onChange={updateField} error={errors[`lang${n}`]} />
              <Input label="Proficiency" field={`lang${n}Level`}
                value={formData[`lang${n}Level`] ?? ''} onChange={updateField}
                onEnter={isLastLang ? () => addAndFocus(setLangs, langCounter, langFields, (newN) => `field-lang${newN}`) : undefined}
              />
            </div>
            <button onClick={() => removeLang(n)} aria-label="Remove language"
              className="builder-remove-btn">
              <XIcon />
            </button>
          </div>
          );
        })}
        <AddButton label="Add Language" onClick={() => addSection(setLangs, langCounter, langFields)} />
      </FormSection>

      <FormSection title="Certifications">
        {certs.length === 0 && <EmptyHint text="No certifications added yet." />}
        {certs.map((n) => {
          const isLastCert = n === certs[certs.length - 1];
          return (
          <Card key={n} label={`Certification ${n}`} onRemove={() => removeSection(n, setCerts, certFields)}>
            <Input id={`field-cert${n}`} label="Certificate Name *"       field={`cert${n}`}       value={formData[`cert${n}`]       ?? ''} onChange={updateField} error={errors[`cert${n}`]} />
            <div className="builder-date-row">
              <Input label="Issuer (e.g. AWS, Google)" field={`cert${n}Issuer`} value={formData[`cert${n}Issuer`] ?? ''} onChange={updateField} />
              <Input label="Year (e.g. 2023)"          field={`cert${n}Year`}   value={formData[`cert${n}Year`]   ?? ''} onChange={updateField} />
            </div>
            <Input label="Certificate URL (optional)" field={`cert${n}Url`} value={formData[`cert${n}Url`] ?? ''} onChange={updateField} autoComplete="off"
              onEnter={isLastCert ? () => addAndFocus(setCerts, certCounter, certFields, (newN) => `field-cert${newN}`) : undefined}
            />
          </Card>
          );
        })}
        <AddButton label="Add Certification" onClick={() => addSection(setCerts, certCounter, certFields)} />
      </FormSection>

      <FormSection title="Projects">
        {projects.length === 0 && <EmptyHint text="No projects added yet." />}
        {projects.map((n) => {
          const isLastProject = n === projects[projects.length - 1];
          return (
          <Card key={n} label={`Project ${n}`} onRemove={() => removeSection(n, setProjects, projectFields)}>
            <Input id={`field-project${n}Name`} label="Project Name *" field={`project${n}Name`} value={formData[`project${n}Name`] ?? ''} onChange={updateField} />
            <div className="builder-date-row">
              <Input label="Your Role"        field={`project${n}Role`}        value={formData[`project${n}Role`]        ?? ''} onChange={updateField} />
              <Input label="Technologies"     field={`project${n}Tech`}        value={formData[`project${n}Tech`]        ?? ''} onChange={updateField} />
            </div>
            <div className="builder-date-row">
              <Input label="Start Date"       field={`project${n}Start`}       value={formData[`project${n}Start`]       ?? ''} onChange={updateField} />
              <Input label="End Date"         field={`project${n}End`}         value={formData[`project${n}End`]         ?? ''} onChange={updateField} />
            </div>
            <Textarea label="Description"    field={`project${n}Description`} value={formData[`project${n}Description`] ?? ''} onChange={updateField} rows={3} />
            <Input label="Project URL / GitHub (optional)" field={`project${n}Url`} value={formData[`project${n}Url`] ?? ''} onChange={updateField} autoComplete="off"
              onEnter={isLastProject && projects.length < 10 ? () => addAndFocus(setProjects, projCounter, projectFields, (newN) => `field-project${newN}Name`) : undefined}
            />
          </Card>
          );
        })}
        {projects.length < 10 && (
          <AddButton label="Add Project" onClick={() => addSection(setProjects, projCounter, projectFields)} />
        )}
      </FormSection>
    </div>
  );

  return (
    <>
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* ── Top bar (all breakpoints) ── */}
      <div className="builder-topbar">
        <div className="builder-topbar__left">
          <NavLink href="/templates" className="builder-topbar__back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Templates
          </NavLink>
          <span className="builder-topbar__divider" aria-hidden="true" />
          <div className="builder-topbar__info">
            <span className="builder-topbar__title">{template.name}</span>
            <span className="builder-topbar__saved">{saveStatus}</span>
          </div>
        </div>

        {/* Mobile tab switcher */}
        <div className="builder-tabs builder-tabs--topbar" role="tablist">
          {(['edit', 'preview'] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`builder-tab ${activeTab === tab ? 'builder-tab--active' : 'builder-tab--inactive'}`}
            >
              {tab === 'edit' ? 'Edit' : 'Preview'}
            </button>
          ))}
        </div>

        <button
          onClick={handleDownload}
          disabled={isDownloading || !resumeId}
          className="builder-download-btn builder-download-btn--topbar"
        >
          {isDownloading ? 'Preparing…' : 'Download PDF'}
        </button>
      </div>

      {/* ── Split (form + preview) ── */}
      <div className="builder-split" style={isDragging ? { cursor: 'col-resize', userSelect: 'none' } : undefined}>

        {/* Form panel */}
        <div
          className={`builder-form-panel${activeTab === 'preview' ? ' builder-form-panel--mobile-hidden' : ''}`}
          style={panelWidth ? { width: panelWidth } : undefined}
        >
          {errorBanner && <div className="builder-error-wrap">{errorBanner}</div>}
          <div className="builder-form-body">
            {formSections}
          </div>
        </div>

        {/* Drag-to-resize handle */}
        <div
          className={`builder-resize-handle${isDragging ? ' builder-resize-handle--active' : ''}`}
          onMouseDown={onResizeMouseDown}
          title="Drag to resize"
          aria-hidden="true"
        />

        {/* Preview panel */}
        <div className={`builder-preview-panel${activeTab === 'edit' ? ' builder-preview-panel--mobile-hidden' : ''}`}>
          <div className="builder-preview-panel__header">
            <div className="builder-preview-panel__header-left">
              <span className="builder-preview-dot" aria-hidden="true" />
              <span className="builder-preview-label">Live Preview</span>
              <span className="builder-preview-name">{template.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ZoomControls
                zoom={previewZoom}
                onChange={setPreviewZoom}
                min={0.25}
                max={2.0}
                step={0.25}
              />
              <span className="builder-preview-status">
                {isSaving ? 'Saving…' : resumeId ? 'Up to date' : 'Preview only'}
              </span>
            </div>
          </div>

          {/* Mobile zoom bar — visible only on small screens when preview is active */}
          {activeTab === 'preview' && (
            <div className="builder-mobile-zoom-bar">
              <span className="builder-mobile-zoom-label">Zoom:</span>
              <ZoomControls
                zoom={previewZoom}
                onChange={setPreviewZoom}
                min={0.25}
                max={2.0}
                step={0.25}
              />
            </div>
          )}

          {/* Color theme picker */}
          <ColorPicker
            selected={accentColor.hex}
            onChange={(color) => {
              setAccentColor(color);
              // persist color into formData so it's auto-saved and used for PDF export
              setFormData((prev) => ({ ...prev, _accentColor: color.hex }));
            }}
          />

          <div className="builder-preview-body">
            <ResumePreviewer html={html} zoomLevel={previewZoom} />
          </div>
        </div>
      </div>

      {/* ── Mobile download bar ── */}
      <div className="builder-download-bar">
        <div className="builder-download-bar__inner">
          <p className="builder-save-status">{saveStatus}</p>
          <button
            onClick={handleDownload}
            disabled={isDownloading || !resumeId}
            className="builder-download-btn"
          >
            {isDownloading ? 'Preparing…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Primitive components ─────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="form-section">
      <h3 className="form-section__title">{title}</h3>
      <div className="form-section__fields">{children}</div>
    </div>
  );
}

function Card({ label, onRemove, children }: {
  label: string; onRemove?: () => void; children: React.ReactNode;
}) {
  return (
    <div className="form-card">
      <div className="form-card__header">
        <p className="form-card__label">{label}</p>
        {onRemove && <button onClick={onRemove} className="form-card__remove">Remove</button>}
      </div>
      {children}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="add-button">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      {label}
    </button>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="empty-hint">{text}</p>;
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function Input({ id, label, field, value, onChange, error, autoComplete, onEnter }: {
  id?: string; label: string; field: string; value: string; error?: string;
  autoComplete?: string;
  onEnter?: () => void;
  onChange: (field: string, value: string) => void;
}) {
  return (
    <div id={id} className="builder-field">
      <span className="builder-field__label">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && onEnter) { e.preventDefault(); onEnter(); } }}
        autoComplete={autoComplete ?? 'off'}
        className={`builder-input${error ? ' builder-input--error' : ''}`}
      />
      {error && (
        <p className="field-error">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

function Textarea({ label, field, value, onChange, rows = 4 }: {
  label: string; field: string; value: string; rows?: number;
  onChange: (field: string, value: string) => void;
}) {
  return (
    <label className="builder-field">
      <span className="builder-field__label">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        rows={rows}
        autoComplete="off"
        className="builder-textarea"
      />
    </label>
  );
}
