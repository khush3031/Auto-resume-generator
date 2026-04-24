import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Template, TemplateDocument } from './schemas/template.schema';
import * as fsSync from 'fs';
import { join } from 'path';
import { templates as templatesMeta } from '@resumeforge/templates';

const SAMPLE_DATA: Record<string, string> = {
  fullName: 'Alex Johnson',        jobTitle: 'Senior Software Engineer',
  email: 'alex@example.com',       phone: '+1 (555) 234-5678',
  location: 'San Francisco, CA',   linkedin: 'linkedin.com/in/alexjohnson',
  website: 'alexjohnson.dev',      initials: 'AJ',
  summary: 'Results-driven software engineer with 6+ years building scalable web applications. Passionate about clean architecture, developer experience, and shipping products that users love.',

  job1Title: 'Senior Software Engineer', job1Company: 'TechCorp Inc.',
  job1Location: 'San Francisco, CA',     job1Start: 'Jan 2021', job1End: 'Present',
  job1Bullet1: 'Led microservices redesign serving 2M+ daily active users',
  job1Bullet2: 'Cut API p95 latency by 40% through query optimisation',
  job1Bullet3: 'Mentored 4 junior engineers and ran technical interviews',

  job2Title: 'Software Engineer',  job2Company: 'StartupXYZ',
  job2Location: 'Remote',          job2Start: 'Jun 2019', job2End: 'Dec 2020',
  job2Bullet1: 'Built React dashboard adopted by 500+ enterprise clients',
  job2Bullet2: 'Automated CI/CD pipeline, reducing deploy time by 60%',
  job2Bullet3: '',

  degree: 'B.S. Computer Science', university: 'University of California, Berkeley',
  graduationYear: '2019',

  skill1: 'TypeScript', skill2: 'React',      skill3: 'Node.js',
  skill4: 'PostgreSQL', skill5: 'Docker',

  lang1: 'English', lang1Level: 'Native',
  lang2: 'Spanish', lang2Level: 'Conversational',

  cert1: 'AWS Certified Developer',   cert1Issuer: 'Amazon Web Services', cert1Year: '2022',
  cert2: 'Google Cloud Professional', cert2Issuer: 'Google',              cert2Year: '2023',
};

/** Default accent/sidebar background per template — matches what's now in the HTML CSS */
const DEFAULT_ACCENT_COLORS: Record<string, string> = {
  'classic':      '#0f3d5c',
  'minimal':      '#111827',
  'executive':    '#1b1b1b',
  'bold':         '#ef4444',
  'modern':       '#114b5f',
  'elegant':      '#9d8189',
  'clean-grid':   '#334155',
  'ats-friendly': '#374151',
  'ats':          '#374151',
  'corporate':    '#1a1a2e',
  'creative':     '#1a1a2e',
  'compact':      '#e53935',
  'timeline':     '#7c3aed',
  'mono':         '#333333',
  'slate':        '#38bdf8',
  'indigo':       '#4338ca',
  'cobalt':       '#0077cc',
  'sage':         '#3a5e3b',
  'infographic':  '#7c3aed',
  'academic':     '#374151',
};

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(Template.name)
    private templateModel: Model<TemplateDocument>,
  ) {}

  async findAll() {
    const templates = await this.templateModel.find().lean();
    return templates.map((t) => {
      const htmlContent = this.readHtmlFromDisk(t.id) ?? t.htmlContent;
      return {
        ...t,
        htmlContent,
        previewHtml: this.getSamplePreviewHtml(htmlContent, t.id),
      };
    });
  }

  async findOne(id: string) {
    const template = await this.templateModel
      .findOne({ $or: [{ id }, { slug: id }] })
      .lean();

    if (!template) {
      // Fall back to file-system template if not seeded in MongoDB
      const meta = templatesMeta.find((t) => t.id === id || t.slug === id);
      if (!meta) throw new NotFoundException('Template not found');
      const htmlContent = this.readHtmlFromDisk(id);
      if (!htmlContent) throw new NotFoundException('Template not found');
      return { id: meta.id, slug: meta.slug, name: meta.name, style: meta.style, htmlContent };
    }

    // Always serve htmlContent fresh from disk so template edits take effect immediately
    const htmlContent = this.readHtmlFromDisk(template.id) ?? template.htmlContent;
    return { ...template, htmlContent };
  }

  /** Read a template's HTML from the file system. Returns null if the file is missing. */
  private readHtmlFromDisk(templateId: string): string | null {
    const meta = templatesMeta.find((t) => t.id === templateId || t.slug === templateId);
    if (!meta) return null;
    const filePath = join(process.cwd(), '..', '..', 'packages', 'templates', meta.htmlPath);
    try {
      return fsSync.readFileSync(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  /** Generate a thumbnail-ready HTML string with sample data and default accent color injected. */
  private getSamplePreviewHtml(htmlContent: string, templateId: string): string {
    // Replace all {{placeholders}} with sample data (empty string for unknowns)
    let html = htmlContent.replace(/{{\s*([^}\s]+)\s*}}/g, (_, key: string) => {
      return key === '_accentColor' ? '' : (SAMPLE_DATA[key] ?? '');
    });

    // Inject the default accent color before </head> so it wins the CSS cascade
    const color = DEFAULT_ACCENT_COLORS[templateId] || '#1a3a4a';
    const styleBlock = `\n<style id="resume-forge-theme">:root { --resume-accent-color: ${color} !important; --accent: ${color} !important; }</style>`;

    html = html.includes('</head>')
      ? html.replace('</head>', styleBlock + '\n</head>')
      : styleBlock + html;

    return html;
  }
}
