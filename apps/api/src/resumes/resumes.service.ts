import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Resume, ResumeDocument } from './schemas/resume.schema';
import { UserResumeDetails, UserResumeDetailsDocument } from './schemas/userResumeDetails.schema';
import { templates } from '@resumeforge/templates';
import { promises as fs } from 'fs';
import { join } from 'path';
import puppeteer from 'puppeteer';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';

@Injectable()
export class ResumesService {
  constructor(
    @InjectModel(Resume.name) private readonly resumeModel: Model<ResumeDocument>,
    @InjectModel(UserResumeDetails.name) private readonly userResumeDetailsModel: Model<UserResumeDetailsDocument>,
  ) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  async createResume(payload: CreateResumeDto) {
    const template = templates.find((t) => t.id === payload.templateId);
    if (!template) throw new BadRequestException('Template not found');

    const renderedHtml = await this.generateRenderedHtml(payload.templateId, payload.formData);
    return this.resumeModel.create({
      templateId: payload.templateId,
      templateName: template.name,
      title: 'My Resume',
      status: 'draft',
      formData: payload.formData,
      renderedHtml,
      userId: payload.userId || null,
    });
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Resume not found');
    const resume = await this.resumeModel.findOne({ _id: id, isDeleted: { $ne: true } }).lean().exec();
    if (!resume) throw new NotFoundException('Resume not found');
    return resume;
  }

  async updateResume(id: string, payload: UpdateResumeDto, currentUserId?: string) {
    const resume = await this.resumeModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
    if (!resume) throw new NotFoundException('Resume not found');
    if (resume.userId && currentUserId && resume.userId.toString() !== currentUserId) {
      throw new ForbiddenException('You do not have permission to update this resume');
    }

    resume.formData = payload.formData;
    resume.markModified('formData');
    resume.renderedHtml = await this.generateRenderedHtml(resume.templateId, payload.formData);
    if (payload.title) resume.title = payload.title;
    if (payload.status) resume.status = payload.status;

    await resume.save();
    return resume.toObject();
  }

  async findUserResumes(userId: string) {
    const oid = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null;
    const userIdFilter = oid ? { $in: [oid, userId] } : userId;
    return this.resumeModel
      .find({ userId: userIdFilter, isDeleted: { $ne: true } })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
  }

  async softDeleteResume(id: string, userId: string) {
    const resume = await this.resumeModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
    if (!resume) throw new NotFoundException('Resume not found');
    if (!resume.userId || resume.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to delete this resume');
    }
    resume.isDeleted = true;
    await resume.save();
  }

  async exportToPdf(
    id: string,
    userId: string,
    clientFormData?: Record<string, string>,
  ): Promise<Buffer> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Resume not found');

    const resume = await this.resumeModel.findOne({ _id: id, isDeleted: { $ne: true } }).lean().exec();
    if (!resume) throw new NotFoundException('Resume not found');
    if (resume.userId && resume.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to export this resume');
    }

    // Prefer client-provided formData (always up-to-date) over MongoDB copy
    const formData = (clientFormData && Object.keys(clientFormData).length > 0)
      ? clientFormData
      : (resume.formData ?? {}) as Record<string, string>;

    const freshHtml = await this.generateRenderedHtml(resume.templateId, formData);
    const candidateName = (formData['fullName'] ?? 'Resume').trim();
    const buffer = await this.createPdfBuffer(this.prepareHtmlForPdf(freshHtml), candidateName);

    await this.resumeModel.findByIdAndUpdate(id, {
      $inc: { downloadCount: 1 },
      lastExportedAt: new Date(),
    });

    return buffer;
  }

  async claimResume(id: string, userId: string) {
    const resume = await this.resumeModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
    if (!resume) throw new NotFoundException('Resume not found');
    if (resume.userId) {
      if (resume.userId.toString() !== userId) {
        throw new ForbiddenException('Resume already belongs to another account');
      }
      return resume.toObject();
    }
    resume.userId = new Types.ObjectId(userId);
    await resume.save();
    return resume.toObject();
  }

  // ─── User Resume Details (cross-template profile) ─────────────────────────────

  /**
   * Return the saved form-data profile for a user, or null if none exists yet.
   */
  async getUserResumeDetails(userId: string): Promise<Record<string, string> | null> {
    if (!Types.ObjectId.isValid(userId)) return null;
    const doc = await this.userResumeDetailsModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean()
      .exec();
    return doc ? (doc.formData as Record<string, string>) : null;
  }

  /**
   * Upsert (create or overwrite) the form-data profile for a user.
   * We only persist non-empty values so blank new templates don't wipe saved data.
   */
  async upsertUserResumeDetails(
    userId: string,
    formData: Record<string, string>,
  ): Promise<Record<string, string>> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    // Strip empty strings — keep only fields that have actual content
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(formData)) {
      if (typeof v === 'string' && v.trim()) cleaned[k] = v;
    }

    const doc = await this.userResumeDetailsModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: { formData: cleaned } },
        { upsert: true, new: true },
      )
      .lean()
      .exec();

    return doc!.formData as Record<string, string>;
  }

  // ─── Sanitization ─────────────────────────────────────────────────────────────

  private sanitizeBeforeRender(formData: Record<string, string>): Record<string, string> {
    const out = { ...formData };
    const isLocalhostUrl = (val: string): boolean => {
      const v = (val ?? '').trim();
      return v.startsWith('http') && (v.includes('localhost') || v.includes('127.0.0.1'));
    };

    ['fullName', 'initials', 'location'].forEach((f) => {
      if (isLocalhostUrl(out[f] ?? '')) out[f] = '';
    });
    ['linkedin', 'website'].forEach((f) => {
      if (isLocalhostUrl(out[f] ?? '')) out[f] = '';
    });
    for (let i = 1; i <= 10; i++) {
      if (isLocalhostUrl(out[`cert${i}Url`]    ?? '')) out[`cert${i}Url`]    = '';
      if (isLocalhostUrl(out[`project${i}Url`] ?? '')) out[`project${i}Url`] = '';
    }

    if ((out.initials ?? '').length > 3) {
      out.initials = (out.fullName ?? '')
        .split(' ')
        .map((w) => w[0] ?? '')
        .join('')
        .substring(0, 2)
        .toUpperCase();
    }
    return out;
  }

  // ─── HTML generation ──────────────────────────────────────────────────────────

  private async generateRenderedHtml(
    templateId: string,
    rawFormData: Record<string, string>,
  ): Promise<string> {
    const formData = this.sanitizeBeforeRender(rawFormData);

    const template = templates.find((t) => t.id === templateId);
    if (!template) throw new BadRequestException('Template not found');

    const templatePath = join(process.cwd(), '..', '..', 'packages', 'templates', template.htmlPath);
    let html = await fs.readFile(templatePath, 'utf-8');

    // Inject dynamic blocks before placeholder replacement
    html = html.replace('{{experienceBlocks}}',   this.buildExperienceBlocks(formData));
    html = html.replace('{{certificationBlocks}}', this.buildCertBlocks(formData));
    html = html.replace('{{educationBlocks}}',     this.buildEducationBlocks(formData, templateId));
    html = html.replace('{{projectBlocks}}',       this.buildProjectBlocks(formData));
    html = html.replace('{{languagesBlock}}',      this.buildLanguagesBlock(formData));
    html = html.replace('{{skillsBlock}}',         this.buildSkillsBlock(formData));

    // Projects section visibility
    const hasProjects = Array.from({ length: 10 }, (_, i) => formData[`project${i + 1}Name`])
      .some(Boolean);
    html = html.replace(/\{\{projectsSectionDisplay\}\}/g, hasProjects ? 'block' : 'none');

    // Replace remaining {{placeholders}}
    html = html.replace(/{{\s*([^}\s]+)\s*}}/g, (_, key) => {
      if (key === '_accentColor') return '';
      return this.esc(String(formData[key] ?? ''));
    });

    // Accent color
    const accentHex = formData['_accentColor'];
    if (accentHex) html = this.injectAccentColor(html, accentHex, templateId);

    // Hide sections/asides that have no content
    html = this.hideEmptySections(html);

    return html;
  }

  // ─── Hide empty sections ──────────────────────────────────────────────────────

  private hideEmptySections(html: string): string {
    // Pass 1: hide <section> elements whose content (after stripping heading + empty tags) is empty
    let result = html.replace(
      /(<section\b[^>]*?>)([\s\S]*?)(<\/section>)/g,
      (match, openTag: string, inner: string, closeTag: string) => {
        if (openTag.includes('display:none')) return match; // already hidden
        const stripped = inner
          .replace(/<h[1-6][^>]*?>[\s\S]*?<\/h[1-6]>/g, '') // strip headings
          .replace(/<p[^>]*?>\s*<\/p>/g, '')                  // strip empty <p>
          .replace(/<[^>]+>/g, '')                             // strip remaining tags
          .trim();
        if (!stripped) {
          return this.addStyleDisplayNone(openTag, 'section') + inner + closeTag;
        }
        return match;
      },
    );

    // Pass 2: hide <aside> elements where no visible <section> remains
    result = result.replace(
      /(<aside\b[^>]*?>)([\s\S]*?)(<\/aside>)/g,
      (match, openTag: string, inner: string, closeTag: string) => {
        if (openTag.includes('display:none')) return match;
        const sections = inner.match(/<section\b[^>]*?>[\s\S]*?<\/section>/g) ?? [];
        const hasVisibleSection = sections.some((s) => !s.includes('display:none'));
        const textOutside = inner
          .replace(/<section[\s\S]*?<\/section>/g, '')
          .replace(/<[^>]+>/g, '')
          .trim();
        if (!hasVisibleSection && !textOutside) {
          return this.addStyleDisplayNone(openTag, 'aside') + inner + closeTag;
        }
        return match;
      },
    );

    return result;
  }

  private addStyleDisplayNone(openTag: string, tag: string): string {
    if (openTag.includes('style=')) {
      return openTag.replace(/style="([^"]*)"/, 'style="display:none;$1"');
    }
    return openTag.replace(`<${tag}`, `<${tag} style="display:none"`);
  }

  // ─── Block builders ───────────────────────────────────────────────────────────

  private buildExperienceBlocks(d: Record<string, string>): string {
    const items: string[] = [];
    for (let n = 1; n <= 10; n++) {
      const title   = d[`job${n}Title`]    ?? '';
      const company = d[`job${n}Company`]  ?? '';
      const loc     = d[`job${n}Location`] ?? '';
      const start   = d[`job${n}Start`]    ?? '';
      const end     = d[`job${n}End`]      ?? '';
      if (!title && !company) break;

      const bullets = [1, 2, 3]
        .map((b) => d[`job${n}Bullet${b}`] ?? '')
        .filter(Boolean)
        .map((b) => `<li style="margin-bottom:4px;">${this.esc(b)}</li>`)
        .join('');
      const bulletsHtml = bullets
        ? `<ul style="margin:6px 0 0 18px;padding:0;">${bullets}</ul>`
        : '';

      items.push(
        `<div style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid #f0f0f0;">` +
        `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;">` +
        `<strong style="font-size:0.95rem;">${this.esc(title)}</strong>` +
        `<span style="font-size:0.85rem;color:#6b7280;white-space:nowrap;margin-left:8px;">${this.esc(start)}${start || end ? ' – ' : ''}${this.esc(end)}</span>` +
        `</div>` +
        `<div style="color:#6b7280;font-size:0.9rem;margin-bottom:6px;">${this.esc(company)}${loc ? ' · ' + this.esc(loc) : ''}</div>` +
        `${bulletsHtml}` +
        `</div>`,
      );
    }
    return items.join('');
  }

  private buildProjectBlocks(d: Record<string, string>): string {
    const items: string[] = [];
    for (let n = 1; n <= 10; n++) {
      const name  = d[`project${n}Name`]        ?? '';
      const role  = d[`project${n}Role`]        ?? '';
      const tech  = d[`project${n}Tech`]        ?? '';
      const start = d[`project${n}Start`]       ?? '';
      const end   = d[`project${n}End`]         ?? '';
      const desc  = d[`project${n}Description`] ?? '';
      const url   = d[`project${n}Url`]         ?? '';
      if (!name) break;

      const dateStr = start || end ? `${this.esc(start)}${start || end ? ' – ' : ''}${this.esc(end)}` : '';
      const urlHtml = url
        ? `<a href="${this.esc(url)}" style="font-size:0.8rem;color:#3b82f6;text-decoration:none;">${this.esc(url)}</a>`
        : '';

      items.push(
        `<div style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #f0f0f0;">` +
        `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;">` +
        `<strong style="font-size:0.95rem;">${this.esc(name)}</strong>` +
        `${dateStr ? `<span style="font-size:0.85rem;color:#6b7280;white-space:nowrap;margin-left:8px;">${dateStr}</span>` : ''}` +
        `</div>` +
        `${role ? `<div style="color:#6b7280;font-size:0.88rem;margin-bottom:4px;">${this.esc(role)}</div>` : ''}` +
        `${tech ? `<div style="font-size:0.82rem;color:#9ca3af;margin-bottom:4px;">${this.esc(tech)}</div>` : ''}` +
        `${desc ? `<p style="font-size:0.9rem;margin:4px 0 0;">${this.esc(desc)}</p>` : ''}` +
        `${urlHtml ? `<div style="margin-top:4px;">${urlHtml}</div>` : ''}` +
        `</div>`,
      );
    }
    return items.join('');
  }

  private buildCertBlocks(d: Record<string, string>): string {
    const items: string[] = [];
    for (let n = 1; n <= 10; n++) {
      const name   = d[`cert${n}`]       ?? '';
      const issuer = d[`cert${n}Issuer`] ?? '';
      const year   = d[`cert${n}Year`]   ?? '';
      const url    = d[`cert${n}Url`]    ?? '';
      if (!name) break;

      const nameEl = url
        ? `<a href="${this.esc(url)}" class="cert-name" style="font-size:12px;font-weight:600;color:inherit;text-decoration:none;">${this.esc(name)}</a>`
        : `<span class="cert-name" style="font-size:12px;font-weight:600;">${this.esc(name)}</span>`;

      items.push(
        `<div class="cert-entry" style="margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(128,128,128,0.15);">` +
        `${nameEl}` +
        `<div class="cert-meta" style="font-size:11px;opacity:0.75;margin-top:2px;">${this.esc(issuer)}${issuer && year ? ' · ' : ''}${this.esc(year)}</div>` +
        `</div>`,
      );
    }
    return items.join('');
  }

  private buildEducationBlocks(d: Record<string, string>, templateId = ''): string {
    const items: string[] = [];
    const isSlate = templateId === 'slate';

    for (let n = 1; n <= 5; n++) {
      const suffix     = n === 1 ? '' : String(n);
      const degree     = d[`degree${suffix}`]         ?? '';
      const university = d[`university${suffix}`]     ?? '';
      const year       = d[`graduationYear${suffix}`] ?? '';
      if (!degree && !university) break;

      if (isSlate) {
        items.push(
          `<div style="margin-bottom:10px;">` +
          `<div class="s-item" style="color:#cbd5e1;font-weight:500;">${this.esc(degree)}</div>` +
          `${university ? `<div class="s-item">${this.esc(university)}</div>` : ''}` +
          `${year ? `<div class="s-item" style="color:#38bdf8;">${this.esc(year)}</div>` : ''}` +
          `</div>`,
        );
      } else {
        items.push(
          `<div style="margin-bottom:12px;">` +
          `<div style="display:flex;justify-content:space-between;align-items:flex-start;">` +
          `<strong style="font-size:0.95rem;">${this.esc(degree)}</strong>` +
          `${year ? `<span style="font-size:0.85rem;color:#6b7280;white-space:nowrap;margin-left:8px;">${this.esc(year)}</span>` : ''}` +
          `</div>` +
          `${university ? `<div style="color:#6b7280;font-size:0.9rem;">${this.esc(university)}</div>` : ''}` +
          `</div>`,
        );
      }
    }
    return items.join('');
  }

  private buildLanguagesBlock(d: Record<string, string>): string {
    const items: string[] = [];
    let emptyStreak = 0;
    for (let n = 1; n <= 20; n++) {
      const lang  = (d[`lang${n}`]      ?? '').trim();
      const level = (d[`lang${n}Level`] ?? '').trim();
      if (!lang) {
        emptyStreak++;
        if (emptyStreak >= 3) break; // stop after 3 consecutive empty slots
        continue;
      }
      emptyStreak = 0;
      items.push(
        `<div style="display:flex;justify-content:space-between;font-size:0.9rem;padding:3px 0;">` +
        `<span>${this.esc(lang)}</span>` +
        `${level ? `<span style="color:#9ca3af;font-size:0.85rem;">${this.esc(level)}</span>` : ''}` +
        `</div>`,
      );
    }
    return items.join('');
  }

  private buildSkillsBlock(d: Record<string, string>): string {
    const skills: string[] = [];
    let emptyStreak = 0;
    for (let n = 1; n <= 30; n++) {
      const s = (d[`skill${n}`] ?? '').trim();
      if (!s) {
        emptyStreak++;
        if (emptyStreak >= 3) break;
        continue;
      }
      emptyStreak = 0;
      skills.push(s);
    }
    return skills
      .map(
        (s) =>
          `<span style="display:inline-block;padding:5px 10px;margin:3px 4px 3px 0;border-radius:999px;font-size:0.85rem;background:rgba(59,130,246,0.1);color:inherit;">${this.esc(s)}</span>`,
      )
      .join('');
  }

  // ─── Escape helpers ───────────────────────────────────────────────────────────

  private esc(str: string): string {
    return (str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private escHtml(str: string): string {
    return (str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─── Accent color injection ───────────────────────────────────────────────────

  private injectAccentColor(html: string, hex: string, templateId: string): string {
    const ACCENT_MAP: Record<string, string> = {
      'classic': '#0f3d5c', 'minimal': '#111827',
      'executive': '#1b1b1b', 'bold': '#ef4444',
      'modern': '#114b5f', 'elegant': '#9d8189',
      'clean-grid': '#334155', 'ats-friendly': '#374151', 'ats': '#374151',
      'corporate': '#1a1a2e', 'creative': '#1a1a2e',
      'compact': '#e53935', 'timeline': '#7c3aed',
      'mono': '#333',
      'slate': '#38bdf8', 'indigo': '#4338ca', 'cobalt': '#0077cc', 'sage': '#3a5e3b',
      'infographic': '#7c3aed', 'academic': '#374151',
    };

    const knownAccent = ACCENT_MAP[templateId];
    if (knownAccent) {
      const norm = knownAccent.replace('#', '').length === 3
        ? '#' + knownAccent.replace('#', '').split('').map((c: string) => c + c).join('')
        : knownAccent.toLowerCase();
      html = html.split(norm).join(hex);
      html = html.split(knownAccent).join(hex);
    }

    const cssVar = `\n<style id="resume-forge-theme">:root { --resume-accent-color: ${hex} !important; --accent: ${hex} !important; }</style>`;
    html = html.includes('</head>') ? html.replace('</head>', cssVar + '\n</head>') : cssVar + html;
    return html;
  }

  // ─── PDF generation ───────────────────────────────────────────────────────────

  private async fixLayoutForPdf(page: any): Promise<void> {
    await page.evaluate(() => {
      const pageEl = document.querySelector('.page') as HTMLElement;
      if (!pageEl) return;

      const isSignificantColor = (bg: string): boolean => {
        if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return false;
        const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!m) return false;
        const [r, g, b] = [+m[1], +m[2], +m[3]];
        return !(r > 235 && g > 235 && b > 235);
      };

      // Ensure all colored elements print their background correctly
      const allEls = Array.from(pageEl.querySelectorAll('*')) as HTMLElement[];
      allEls.forEach((el) => {
        const bg = window.getComputedStyle(el).backgroundColor;
        if (isSignificantColor(bg)) {
          el.style.setProperty('-webkit-print-color-adjust', 'exact', 'important');
          el.style.setProperty('print-color-adjust', 'exact', 'important');
        }
      });
    });
  }

  private async createPdfBuffer(html: string, candidateName = 'Resume'): Promise<Buffer> {
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
    const A4_H = 1122;
    try {
      browser = await puppeteer.launch({
        headless: 'new' as any,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 794, height: A4_H, deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: ['networkidle0', 'domcontentloaded'], timeout: 30000 });
      await page.emulateMediaType('screen');
      await page.evaluateHandle('document.fonts.ready');
      await new Promise((r) => setTimeout(r, 1500));

      // Step 1: Universal layout fix (colored column stretch)
      await this.fixLayoutForPdf(page);
      await new Promise((r) => setTimeout(r, 200));

      // Step 2: Smart page-break injection
      await page.evaluate((A4H: number) => {
        const pageEl = document.querySelector('.page') as HTMLElement;
        if (!pageEl) return;
        const blocks = Array.from(pageEl.querySelectorAll(
          'div[style*="margin-bottom:16px"], div[style*="margin-bottom: 16px"], ' +
          'div[style*="margin-bottom:12px"], div[style*="margin-bottom: 12px"], ' +
          'div[style*="margin-bottom:10px"], div[style*="margin-bottom: 10px"], ' +
          '.section, .m-section, .r-section, [id$="-section"]',
        )) as HTMLElement[];
        const TOLERANCE = 30;
        blocks.forEach((block) => {
          const rect      = block.getBoundingClientRect();
          const pageStart = Math.floor(rect.top    / A4H);
          const pageEnd   = Math.floor(rect.bottom / A4H);
          if (pageEnd > pageStart) {
            const boundaryY        = (pageStart + 1) * A4H;
            const distFromBoundary = boundaryY - rect.top;
            if (distFromBoundary < TOLERANCE && distFromBoundary > 0) {
              block.style.breakBefore = 'page';
            }
          }
        });
      }, A4_H);
      await new Promise((r) => setTimeout(r, 200));

      // Step 3: Measure total height
      const totalHeight = await page.evaluate(() => {
        const el = document.querySelector('.page');
        return el
          ? Math.max((el as HTMLElement).scrollHeight, document.body.scrollHeight)
          : document.body.scrollHeight;
      });
      const isMultiPage = totalHeight > A4_H;

      // Step 4: Generate PDF (no header/footer — clean professional resume)
      const buffer = await page.pdf({
        format:              'A4',
        printBackground:     true,
        margin: isMultiPage
          ? { top: '24px', bottom: '12px', left: '0', right: '0' }
          : { top: '0',    bottom: '0',    left: '0', right: '0' },
        displayHeaderFooter: false,
        preferCSSPageSize:   false,
      });

      return Buffer.from(buffer);
    } catch (err: any) {
      console.error('[PDF] generation failed:', err);
      throw new InternalServerErrorException(`PDF generation failed: ${err?.message}`);
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  }

  private prepareHtmlForPdf(html: string): string {
    if (!html.trimStart().startsWith('<!DOCTYPE')) html = '<!DOCTYPE html>\n' + html;
    if (!html.includes('charset')) html = html.replace('<head>', '<head>\n<meta charset="UTF-8">');
    html = html.replace(/(<meta[^>]*name=["']viewport["'][^>]*>)/i, '<meta name="viewport" content="width=794">');
    if (!html.includes('viewport')) html = html.replace('<head>', '<head>\n<meta name="viewport" content="width=794">');

    const css = `
<style id="pdf-render-styles">
*, *::before, *::after {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  box-sizing: border-box;
}
@page { size: A4; }
html, body {
  margin: 0 !important;
  padding: 0 !important;
  width: 794px !important;
  max-width: 794px !important;
  background: #fff !important;
  overflow-x: hidden !important;
}
.page {
  width: 794px !important;
  max-width: 794px !important;
  margin: 0 !important;
  box-shadow: none !important;
  overflow: visible !important;
}
p, div, span, li, td, h1, h2, h3, h4 {
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  white-space: normal !important;
  max-width: 100% !important;
}
img { max-width: 100% !important; height: auto !important; }
</style>`;

    return html.includes('</head>') ? html.replace('</head>', css + '\n</head>') : css + html;
  }
}
