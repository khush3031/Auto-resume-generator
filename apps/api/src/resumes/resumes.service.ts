import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Resume, ResumeDocument } from './schemas/resume.schema';
import { UserResumeDetails, UserResumeDetailsDocument } from './schemas/userResumeDetails.schema';
import { templates } from '@resumeforge/templates';
import { hideEmptyResumeSections } from '@resumeforge/shared';
import { promises as fs } from 'fs';
import { join } from 'path';
import puppeteer from 'puppeteer';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { shouldAllowUnsafePdfSandbox } from '../common/security.util';

const ACCENT_MAP: Record<string, string> = {
  'classic': '#0f3d5c', 'minimal': '#111827',
  'executive': '#1b1b1b', 'bold': '#ef4444',
  'modern': '#114b5f', 'elegant': '#9d8189',
  'clean-grid': '#334155', 'ats-friendly': '#374151', 'ats': '#374151',
  'classic-pro': '#0f3d5c', 'minimal-pro': '#111827',
  'executive-pro': '#1b1b1b', 'bold-pro': '#ef4444',
  'modern-pro': '#114b5f', 'elegant-pro': '#9d8189',
  'clean-grid-pro': '#334155', 'ats-pro': '#374151',
  'corporate': '#1a1a2e', 'creative': '#1a1a2e',
  'compact': '#e53935', 'timeline': '#7c3aed',
  'mono': '#333333',
  'slate': '#38bdf8', 'indigo': '#4338ca', 'cobalt': '#0077cc', 'sage': '#3a5e3b',
  'infographic': '#7c3aed', 'academic': '#374151', 'harbor': '#0f5c7a',
};

const DESIGN_FONT_STACKS: Record<string, string> = {
  'modern-sans': '"Aptos", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  'executive-serif': '"Iowan Old Style", Georgia, "Times New Roman", serif',
  'technical-sans': '"IBM Plex Sans", "Segoe UI", Arial, sans-serif',
  'editorial-serif': '"Palatino Linotype", "Book Antiqua", Palatino, serif',
};

const LOCAL_BROWSER_CANDIDATES: Partial<Record<NodeJS.Platform, string[]>> = {
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ],
  linux: [
    '/opt/render/project/src/.cache/puppeteer/chrome/linux-121.0.6167.85/chrome-linux64/chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/microsoft-edge',
  ],
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ],
};

const SAFE_HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

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

    const sanitizedFormData = this.sanitizeBeforeRender(payload.formData);
    const renderedHtml = await this.generateRenderedHtml(payload.templateId, sanitizedFormData);
    return this.resumeModel.create({
      templateId: payload.templateId,
      templateName: template.name,
      title: 'My Resume',
      status: 'draft',
      formData: sanitizedFormData,
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

    const sanitizedFormData = this.sanitizeBeforeRender(payload.formData);
    resume.formData = sanitizedFormData;
    resume.markModified('formData');
    resume.renderedHtml = await this.generateRenderedHtml(resume.templateId, sanitizedFormData);
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
    const sanitizedFormData = this.sanitizeBeforeRender(formData);
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(sanitizedFormData)) {
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
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(formData)) {
      out[key] = (value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
    }

    if (out._accentColor) {
      out._accentColor = this.normalizeAccentColor(out._accentColor) ?? '';
    }

    for (let i = 1; i <= 10; i++) {
      if (this.looksLikeDisallowedUrl(out[`cert${i}Url`] ?? '')) out[`cert${i}Url`] = '';
      if (this.looksLikeDisallowedUrl(out[`project${i}Url`] ?? '')) out[`project${i}Url`] = '';
    }
    ['linkedin', 'website'].forEach((field) => {
      if (this.looksLikeDisallowedUrl(out[field] ?? '')) out[field] = '';
    });
    ['fullName', 'initials', 'location'].forEach((field) => {
      if (this.looksLikeDisallowedUrl(out[field] ?? '')) out[field] = '';
    });

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
    let formData = this.sanitizeBeforeRender(rawFormData);

    const template = templates.find((t) => t.id === templateId);
    if (!template) throw new BadRequestException('Template not found');

    const templatePath = join(process.cwd(), '..', '..', 'packages', 'templates', template.htmlPath);
    let html = await fs.readFile(templatePath, 'utf-8');

    const hide = (key: string) => formData[key] === '1';

    // Inject dynamic blocks before placeholder replacement
    html = html.replace('{{experienceBlocks}}',   hide('_hideExperience') ? '' : this.buildExperienceBlocks(formData));
    html = html.replace('{{certificationBlocks}}', hide('_hideCerts')      ? '' : this.buildCertBlocks(formData));
    html = html.replace('{{educationBlocks}}',     hide('_hideEducation')  ? '' : this.buildEducationBlocks(formData, templateId));
    html = html.replace('{{projectBlocks}}',       hide('_hideProjects')   ? '' : this.buildProjectBlocks(formData));
    html = html.replace('{{languagesBlock}}',      hide('_hideLanguages')  ? '' : this.buildLanguagesBlock(formData, templateId));
    html = html.replace('{{skillsBlock}}',         hide('_hideSkills')     ? '' : this.buildSkillsBlock(formData, templateId));

    // Summary visibility — blank the content so hideEmptySections (Pass 5) can
    // detect and hide the entire wrapper block including its heading.
    if (hide('_hideSummary')) {
      formData = { ...formData, summary: '' };
    }

    // Projects section visibility
    const hasProjects = !hide('_hideProjects') && Array.from({ length: 10 }, (_, i) => formData[`project${i + 1}Name`])
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

    html = this.injectDesignSystem(html, formData);

    // Hide sections/asides that have no content
    html = hideEmptyResumeSections(html);

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

    // Pass 3: hide slate-style <div class="m-section"> blocks with no content
    result = result.replace(
      /(<div\b[^>]*?\bm-section\b[^>]*?>)([\s\S]*?)(<\/div>)/g,
      (match, openTag: string, inner: string, closeTag: string) => {
        if (openTag.includes('display:none')) return match;
        const stripped = inner
          .replace(/<div[^>]*?\bm-label\b[^>]*?>[\s\S]*?<\/div>/g, '') // strip section labels
          .replace(/<p[^>]*?>\s*<\/p>/g, '')
          .replace(/<[^>]+>/g, '')
          .trim();
        if (!stripped) {
          return this.addStyleDisplayNone(openTag, 'div') + inner + closeTag;
        }
        return match;
      },
    );

    // Pass 4: hide slate sidebar label+content pairs (s-section-label followed by empty block)
    // Replace consecutive label + empty-content pairs with display:none on the label
    result = result.replace(
      /(<div\b[^>]*?\bs-section-label\b[^>]*?>)([\s\S]*?)(<\/div>)([\s\S]*?)(?=<div\b[^>]*?\bs-section-label\b|<\/div>\s*<\/div>)/g,
      (match, labelOpen: string, labelInner: string, labelClose: string, content: string) => {
        if (labelOpen.includes('display:none')) return match;
        const contentText = content.replace(/<[^>]+>/g, '').trim();
        if (!contentText) {
          return this.addStyleDisplayNone(labelOpen, 'div') + labelInner + labelClose + content;
        }
        return match;
      },
    );

    // Pass 5: hide <div class="section"> blocks with no meaningful content.
    // ATS-style templates (ats, ats-pro, academic, compact, elegant-pro, mono)
    // use <div class="section"> + <div class="sec-title"> instead of <section> + <h1-6>,
    // so Passes 1–4 above miss them. We use iterative depth-tracking here (not regex)
    // to correctly find the matching </div> for each section div, avoiding the
    // classic nested-element regex problem.
    result = this.hideEmptyDivSections(result);

    return result;
  }

  private hideEmptyDivSections(html: string): string {
    let result = '';
    let remaining = html;

    while (true) {
      // Find the next <div ...section...> that isn't already hidden
      const m = remaining.match(/<div[^>]*\bsection\b[^>]*>/);
      if (!m || m.index === undefined) {
        result += remaining;
        break;
      }

      const openTag  = m[0];
      const openStart = m.index;
      const openEnd   = openStart + openTag.length;

      // Skip already-hidden divs
      if (openTag.includes('display:none')) {
        result   += remaining.slice(0, openEnd);
        remaining = remaining.slice(openEnd);
        continue;
      }

      // Walk forward counting <div> / </div> to find the matching closing tag
      let depth     = 1;
      let pos       = openEnd;
      let closeStart = -1;

      while (depth > 0 && pos < remaining.length) {
        const nextOpen  = remaining.indexOf('<div', pos);
        const nextClose = remaining.indexOf('</div>', pos);

        if (nextClose === -1) break; // malformed HTML – bail

        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++;
          pos = nextOpen + 4; // advance past '<div'
        } else {
          depth--;
          if (depth === 0) closeStart = nextClose;
          pos = nextClose + 6; // advance past '</div>'
        }
      }

      if (closeStart === -1) {
        // Could not find matching tag – emit everything up to and including the opening tag
        result   += remaining.slice(0, openEnd);
        remaining = remaining.slice(openEnd);
        continue;
      }

      const inner = remaining.slice(openEnd, closeStart);

      // Strip <div class="sec-title"> headings + empty <p> tags, then check for real content
      const stripped = inner
        .replace(/<div[^>]*?\bsec-title\b[^>]*>[\s\S]*?<\/div>/g, '')
        .replace(/<p[^>]*?>\s*<\/p>/g, '')
        .replace(/<[^>]+>/g, '')
        .trim();

      // Emit everything before this section div
      result += remaining.slice(0, openStart);

      if (!stripped) {
        result += this.addStyleDisplayNone(openTag, 'div') + inner + '</div>';
      } else {
        result += openTag + inner + '</div>';
      }

      remaining = remaining.slice(closeStart + 6); // advance past '</div>'
    }

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
        .map((b) => {
          const cleanText = b.replace(/^[▶•\-\*]\s*/, '');
          return `<li style="margin-bottom:4px;">${this.esc(cleanText)}</li>`;
        })
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
      const safeUrl = this.toSafeExternalUrl(url);
      const urlHtml = safeUrl
        ? `<a href="${this.esc(safeUrl)}" rel="noreferrer noopener" style="font-size:0.8rem;color:#3b82f6;text-decoration:none;">${this.esc(url)}</a>`
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

      const safeUrl = this.toSafeExternalUrl(url);
      const nameEl = safeUrl
        ? `<a href="${this.esc(safeUrl)}" rel="noreferrer noopener" class="cert-name" style="font-size:12px;font-weight:600;color:inherit;text-decoration:none;">${this.esc(name)}</a>`
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

  private buildLanguagesBlock(d: Record<string, string>, templateId = ''): string {
    const isSlate = templateId === 'slate';
    const items: string[] = [];
    let emptyStreak = 0;
    for (let n = 1; n <= 20; n++) {
      const lang  = (d[`lang${n}`]      ?? '').trim();
      const level = (d[`lang${n}Level`] ?? '').trim();
      if (!lang) {
        emptyStreak++;
        if (emptyStreak >= 3) break;
        continue;
      }
      emptyStreak = 0;
      if (isSlate) {
        items.push(
          `<div class="s-lang">` +
          `<span>${this.esc(lang)}</span>` +
          `${level ? `<span>${this.esc(level)}</span>` : ''}` +
          `</div>`,
        );
      } else {
        items.push(
          `<div style="display:flex;justify-content:space-between;font-size:0.9rem;padding:3px 0;">` +
          `<span>${this.esc(lang)}</span>` +
          `${level ? `<span style="color:#9ca3af;font-size:0.85rem;">${this.esc(level)}</span>` : ''}` +
          `</div>`,
        );
      }
    }
    return items.join('');
  }

  private buildSkillsBlock(d: Record<string, string>, templateId = ''): string {
    const isSlate = templateId === 'slate';
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
    if (isSlate) {
      return skills.map((s) => `<span class="s-skill">${this.esc(s)}</span>`).join('');
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

  private parseNumberSetting(value: string | undefined, fallback: number, min: number, max: number): number {
    const parsed = Number.parseFloat(value ?? '');
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  }

  private injectDesignSystem(html: string, formData: Record<string, string>): string {
    const fontFamilyId = formData['_fontFamily'] || 'modern-sans';
    const fontFamily = DESIGN_FONT_STACKS[fontFamilyId] ?? DESIGN_FONT_STACKS['modern-sans'];
    const fontScale = this.parseNumberSetting(formData['_fontScale'], 1, 0.9, 1.15);
    const lineHeight = this.parseNumberSetting(formData['_lineHeight'], 1.5, 1.25, 1.85);
    const sectionGap = this.parseNumberSetting(formData['_sectionGap'], 1, 0.7, 1.45);
    const entryGap = this.parseNumberSetting(formData['_entryGap'], 1, 0.7, 1.45);
    const letterSpacing = this.parseNumberSetting(formData['_letterSpacing'], 0, 0, 0.15);
    const headingCaps = formData['_headingCaps'] === '1';
    const sectionDividers = formData['_sectionDividers'] !== '0';
    const paperTone = formData['_paperTone'] === 'warm'
      ? '#fffaf5'
      : formData['_paperTone'] === 'cool'
        ? '#f8fbff'
        : '#ffffff';

    const css = `
<style id="resume-forge-design-system">
  :root {
    --rf-font-family: ${fontFamily};
    --rf-font-scale: ${fontScale};
    --rf-line-height: ${lineHeight};
    --rf-section-gap: ${sectionGap};
    --rf-entry-gap: ${entryGap};
    --rf-letter-spacing: ${letterSpacing.toFixed(4)}em;
    --rf-heading-transform: ${headingCaps ? 'uppercase' : 'none'};
    --rf-heading-spacing: ${headingCaps ? '0.12em' : '0'};
    --rf-divider-width: ${sectionDividers ? '1px' : '0'};
    --rf-paper-tone: ${paperTone};
  }

  html, body, .page {
    font-family: var(--rf-font-family) !important;
    font-size: calc(16px * var(--rf-font-scale));
    line-height: var(--rf-line-height) !important;
    letter-spacing: var(--rf-letter-spacing);
    background: var(--rf-paper-tone);
  }

  .page {
    background: var(--rf-paper-tone) !important;
  }

  .page p,
  .page li,
  .page span,
  .page a,
  .page strong,
  .page em {
    line-height: inherit !important;
  }

  .page h1,
  .page h2,
  .page h3,
  .page h4,
  .page h5,
  .page h6,
  .page section > h2,
  .page section > h3,
  .page aside h2,
  .page aside h3 {
    text-transform: var(--rf-heading-transform) !important;
    letter-spacing: var(--rf-heading-spacing) !important;
  }

  .page section {
    margin-bottom: calc(18px * var(--rf-section-gap)) !important;
  }

  .page section:not(:last-of-type) {
    border-bottom: var(--rf-divider-width) solid rgba(15, 23, 42, 0.1);
    padding-bottom: calc(10px * var(--rf-section-gap));
  }

  .page ul li,
  .page ol li {
    margin-bottom: calc(4px * var(--rf-entry-gap));
  }

  .page section > div,
  .page article > div {
    margin-bottom: calc(10px * var(--rf-entry-gap));
  }
</style>`;

    return html.includes('</head>') ? html.replace('</head>', `${css}\n</head>`) : css + html;
  }

  // ─── Accent color injection ───────────────────────────────────────────────────

  private injectAccentColor(html: string, hex: string, templateId: string): string {
    const safeHex = this.normalizeAccentColor(hex);
    if (!safeHex) return html;

    const knownAccent = ACCENT_MAP[templateId];
    if (knownAccent) {
      const norm = knownAccent.replace('#', '').length === 3
        ? '#' + knownAccent.replace('#', '').split('').map((c: string) => c + c).join('')
        : knownAccent.toLowerCase();
      html = html.split(norm).join(safeHex);
      html = html.split(knownAccent).join(safeHex);
    }

    const cssVar = `\n<style id="resume-forge-theme">:root { --resume-accent-color: ${safeHex} !important; --accent: ${safeHex} !important; }</style>`;
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

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  private async resolveBrowserExecutablePath(): Promise<string | undefined> {
    const explicitPath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN;
    const candidates = [
      explicitPath,
      ...(
        LOCAL_BROWSER_CANDIDATES[process.platform]
        ?? []
      ),
    ].filter((value): value is string => Boolean(value));

    for (const candidate of candidates) {
      if (await this.fileExists(candidate)) {
        return candidate;
      }
    }

    try {
      const bundledPath = puppeteer.executablePath();
      if (bundledPath && await this.fileExists(bundledPath)) {
        return bundledPath;
      }
    } catch {
      // Ignore and fall through to the launch error below.
    }

    return undefined;
  }

  private async createPdfBuffer(html: string, candidateName = 'Resume'): Promise<Buffer> {
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
    const A4_H = 1122;
    try {
      const executablePath = await this.resolveBrowserExecutablePath();
      const launchArgs = [
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
      ];
      if (shouldAllowUnsafePdfSandbox()) {
        launchArgs.push('--no-sandbox', '--disable-setuid-sandbox');
      }

      browser = await puppeteer.launch({
        executablePath,
        headless: 'new' as any,
        args: launchArgs,
      });

      const page = await browser.newPage();
      await page.setJavaScriptEnabled(false);
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const url = request.url();
        if (
          url === 'about:blank' ||
          url.startsWith('data:') ||
          url.startsWith('blob:')
        ) {
          request.continue().catch(() => {});
          return;
        }

        request.abort().catch(() => {});
      });
      await page.setViewport({ width: 794, height: A4_H, deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: ['domcontentloaded'], timeout: 30000 });
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
    html = this.stripRemoteResourceImports(html);
    if (!html.includes('<head>')) {
      html = html.replace(/<html([^>]*)>/i, '<html$1><head></head>');
    }
    if (!html.trimStart().startsWith('<!DOCTYPE')) html = '<!DOCTYPE html>\n' + html;
    if (!html.includes('charset')) html = html.replace('<head>', '<head>\n<meta charset="UTF-8">');
    html = html.replace(/(<meta[^>]*name=["']viewport["'][^>]*>)/i, '<meta name="viewport" content="width=794">');
    if (!html.includes('viewport')) html = html.replace('<head>', '<head>\n<meta name="viewport" content="width=794">');
    if (!html.includes('http-equiv="Content-Security-Policy"')) {
      html = html.replace(
        '<head>',
        `<head>\n<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data:; script-src 'none'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'">`,
      );
    }

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

  private normalizeAccentColor(value: string): string | null {
    const normalized = value.trim();
    if (!SAFE_HEX_COLOR_PATTERN.test(normalized)) return null;
    return normalized.toLowerCase();
  }

  private looksLikeDisallowedUrl(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (!/^(https?:\/\/|www\.)/i.test(trimmed)) return false;
    return this.toSafeExternalUrl(trimmed) === null;
  }

  private toSafeExternalUrl(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed.replace(/^\/+/, '')}`;

    let parsed: URL;
    try {
      parsed = new URL(candidate);
    } catch {
      return null;
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    if (parsed.username || parsed.password) return null;
    if (this.isPrivateOrLocalHostname(parsed.hostname)) return null;

    return parsed.toString();
  }

  private isPrivateOrLocalHostname(hostname: string): boolean {
    const normalized = hostname.trim().toLowerCase();
    if (!normalized) return true;
    if (
      normalized === 'localhost' ||
      normalized.endsWith('.localhost') ||
      normalized.endsWith('.local')
    ) {
      return true;
    }
    if (!normalized.includes('.') && !normalized.includes(':')) {
      return true;
    }

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(normalized)) {
      const [a, b] = normalized.split('.').map((part) => Number(part));
      if (a === 10 || a === 127 || a === 0) return true;
      if (a === 169 && b === 254) return true;
      if (a === 192 && b === 168) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
    }

    if (
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:')
    ) {
      return true;
    }

    return false;
  }

  private stripRemoteResourceImports(html: string): string {
    return html
      .replace(/<link[^>]+href=["']https?:\/\/[^"']+["'][^>]*>/gi, '')
      .replace(/@import\s+url\((['"]?)https?:\/\/[^)]+\1\)\s*;?/gi, '');
  }
}
