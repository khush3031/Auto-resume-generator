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
  project1Name: 'Resume Analytics Dashboard', project1Role: 'Lead Engineer',
  project1Tech: 'React, Node.js, PostgreSQL', project1Start: '2023', project1End: '2024',
  project1Description: 'Built a resume review workflow with live scoring, version history, and recruiter notes.',
  project1Url: 'https://alexjohnson.dev/projects/resume-analytics',
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
  'classic-pro':  '#0f3d5c',
  'minimal-pro':  '#111827',
  'executive-pro':'#1b1b1b',
  'bold-pro':     '#ef4444',
  'modern-pro':   '#114b5f',
  'elegant-pro':  '#9d8189',
  'clean-grid-pro': '#334155',
  'ats-pro':      '#374151',
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
  'harbor':       '#0f5c7a',
  'nova':         '#0d1b2a',
  'crimson':      '#b91c1c',
  'forest':       '#166534',
  'sunset':       '#c2410c',
  'blueprint':    '#1e40af',
  'ats-focus':    '#1f2937',
  'ats-prime':    '#0f172a',
  'sterling':     '#0f5d73',
  'aurora':       '#0f766e',
  'atlas':        '#1d4f91',
  'beacon':       '#394867',
  'mosaic':       '#b45309',
  'horizon':      '#0f6d8c',
  'prism':        '#7c3aed',
  'cascade':      '#2563eb',
  'ember':        '#ea580c',
  'meridian':     '#0f766e',
  'canopy':       '#16a34a',
  'radian':       '#db2777',
};

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(Template.name)
    private templateModel: Model<TemplateDocument>,
  ) {}

  async findAll() {
    const dbTemplates = await this.templateModel.find().lean();
    const dbById = new Map(dbTemplates.map((template) => [template.id, template]));

    const resolvedTemplates = templatesMeta.map((meta) => {
      const dbTemplate = dbById.get(meta.id);
      const htmlContent = this.readHtmlFromDisk(meta.id) ?? dbTemplate?.htmlContent ?? '';

      return {
        id: meta.id,
        slug: meta.slug,
        name: meta.name,
        style: meta.style,
        thumbnailUrl: dbTemplate?.thumbnailUrl ?? meta.thumbnail,
        htmlContent,
        variables: dbTemplate?.variables ?? [],
      };
    });

    const extras = dbTemplates
      .filter((template) => !templatesMeta.some((meta) => meta.id === template.id))
      .map((template) => {
        const htmlContent = this.readHtmlFromDisk(template.id) ?? template.htmlContent;
        return {
          ...template,
          htmlContent,
        };
      });

    return [...resolvedTemplates, ...extras].map((template) => ({
      ...template,
      previewHtml: this.getSamplePreviewHtml(template.htmlContent, template.id),
    }));
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
    const color = DEFAULT_ACCENT_COLORS[templateId] || '#1a3a4a';
    const previewBlocks: Record<string, string> = {
      experienceBlocks: [
        `<div style="margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid #e5e7eb;">`,
        `<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline;">`,
        `<strong style="font-size:13px;color:#111827;">${SAMPLE_DATA.job1Title}</strong>`,
        `<span style="font-size:11px;color:${color};">${SAMPLE_DATA.job1Start} - ${SAMPLE_DATA.job1End}</span>`,
        `</div>`,
        `<div style="font-size:12px;color:#475569;margin:4px 0 6px;">${SAMPLE_DATA.job1Company} - ${SAMPLE_DATA.job1Location}</div>`,
        `<ul style="margin:0;padding-left:18px;font-size:12px;line-height:1.6;color:#334155;">`,
        `<li>${SAMPLE_DATA.job1Bullet1}</li>`,
        `<li>${SAMPLE_DATA.job1Bullet2}</li>`,
        `</ul>`,
        `</div>`,
        `<div style="margin-bottom:4px;">`,
        `<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline;">`,
        `<strong style="font-size:13px;color:#111827;">${SAMPLE_DATA.job2Title}</strong>`,
        `<span style="font-size:11px;color:${color};">${SAMPLE_DATA.job2Start} - ${SAMPLE_DATA.job2End}</span>`,
        `</div>`,
        `<div style="font-size:12px;color:#475569;margin:4px 0 6px;">${SAMPLE_DATA.job2Company} - ${SAMPLE_DATA.job2Location}</div>`,
        `<ul style="margin:0;padding-left:18px;font-size:12px;line-height:1.6;color:#334155;">`,
        `<li>${SAMPLE_DATA.job2Bullet1}</li>`,
        `<li>${SAMPLE_DATA.job2Bullet2}</li>`,
        `</ul>`,
        `</div>`,
      ].join(''),
      educationBlocks: [
        `<div style="margin-bottom:10px;">`,
        `<div style="font-size:13px;font-weight:700;color:#111827;">${SAMPLE_DATA.degree}</div>`,
        `<div style="font-size:12px;color:#475569;">${SAMPLE_DATA.university}</div>`,
        `<div style="font-size:11px;color:${color};margin-top:2px;">${SAMPLE_DATA.graduationYear}</div>`,
        `</div>`,
      ].join(''),
      skillsBlock: [
        SAMPLE_DATA.skill1,
        SAMPLE_DATA.skill2,
        SAMPLE_DATA.skill3,
        SAMPLE_DATA.skill4,
        SAMPLE_DATA.skill5,
      ].map((skill) => `<span style="display:inline-block;padding:5px 10px;margin:3px 4px 3px 0;border-radius:999px;font-size:11px;background:rgba(15,23,42,0.06);color:#1f2937;">${skill}</span>`).join(''),
      projectBlocks: [
        `<div style="margin-bottom:8px;">`,
        `<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline;">`,
        `<strong style="font-size:13px;color:#111827;">${SAMPLE_DATA.project1Name}</strong>`,
        `<span style="font-size:11px;color:${color};">${SAMPLE_DATA.project1Start} - ${SAMPLE_DATA.project1End}</span>`,
        `</div>`,
        `<div style="font-size:12px;color:${color};margin:4px 0 6px;">${SAMPLE_DATA.project1Role}</div>`,
        `<div style="font-size:11px;color:#475569;margin-bottom:5px;">${SAMPLE_DATA.project1Tech}</div>`,
        `<div style="font-size:12px;line-height:1.6;color:#334155;">${SAMPLE_DATA.project1Description}</div>`,
        `</div>`,
      ].join(''),
      certificationBlocks: [
        `<div style="margin-bottom:8px;">`,
        `<div style="font-size:12px;font-weight:700;color:#111827;">${SAMPLE_DATA.cert1}</div>`,
        `<div style="font-size:11px;color:#475569;">${SAMPLE_DATA.cert1Issuer} - ${SAMPLE_DATA.cert1Year}</div>`,
        `</div>`,
        `<div>`,
        `<div style="font-size:12px;font-weight:700;color:#111827;">${SAMPLE_DATA.cert2}</div>`,
        `<div style="font-size:11px;color:#475569;">${SAMPLE_DATA.cert2Issuer} - ${SAMPLE_DATA.cert2Year}</div>`,
        `</div>`,
      ].join(''),
      languagesBlock: [
        `<div style="font-size:12px;color:#334155;margin-bottom:5px;"><strong>${SAMPLE_DATA.lang1}</strong> - ${SAMPLE_DATA.lang1Level}</div>`,
        `<div style="font-size:12px;color:#334155;"><strong>${SAMPLE_DATA.lang2}</strong> - ${SAMPLE_DATA.lang2Level}</div>`,
      ].join(''),
      projectsSectionDisplay: 'block',
    };

    const previewValues = { ...SAMPLE_DATA, ...previewBlocks };

    // Replace all {{placeholders}} with sample data (empty string for unknowns)
    let html = htmlContent.replace(/{{\s*([^}\s]+)\s*}}/g, (_, key: string) => {
      return key === '_accentColor' ? '' : (previewValues[key] ?? '');
    });

    // Inject the default accent color before </head> so it wins the CSS cascade
    const styleBlock = `\n<style id="resume-forge-theme">:root { --resume-accent-color: ${color} !important; --accent: ${color} !important; }</style>`;

    html = html.includes('</head>')
      ? html.replace('</head>', styleBlock + '\n</head>')
      : styleBlock + html;

    return html;
  }
}
