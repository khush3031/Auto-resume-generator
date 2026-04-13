import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Resume, ResumeDocument } from './schemas/resume.schema';
import { templates } from '@resumeforge/templates';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as puppeteer from 'puppeteer';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';

@Injectable()
export class ResumesService {
  constructor(@InjectModel(Resume.name) private readonly resumeModel: Model<ResumeDocument>) {}

  async createResume(payload: CreateResumeDto) {
    const template = templates.find((item) => item.id === payload.templateId);
    if (!template) {
      throw new BadRequestException('Template not found');
    }

    const renderedHtml = await this.generateRenderedHtml(payload.templateId, payload.formData);

    return this.resumeModel.create({
      templateId: payload.templateId,
      templateName: template.name,
      title: 'My Resume',
      status: 'draft',
      formData: payload.formData,
      renderedHtml,
      userId: payload.userId || null
    });
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Resume not found');
    }

    const resume = await this.resumeModel.findOne({ _id: id, isDeleted: false }).lean().exec();
    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    return resume;
  }

  async updateResume(id: string, payload: UpdateResumeDto, currentUserId?: string) {
    const resume = await this.resumeModel.findOne({ _id: id, isDeleted: false }).exec();
    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    if (resume.userId && currentUserId && resume.userId.toString() !== currentUserId) {
      throw new ForbiddenException('You do not have permission to update this resume');
    }

    resume.formData = payload.formData;
    resume.renderedHtml = await this.generateRenderedHtml(resume.templateId, payload.formData);
    if (payload.title) {
      resume.title = payload.title;
    }
    if (payload.status) {
      resume.status = payload.status;
    }

    await resume.save();
    return resume.toObject();
  }

  async findUserResumes(userId: string) {
    return this.resumeModel.find({ userId: new Types.ObjectId(userId), isDeleted: false }).lean().exec();
  }

  async softDeleteResume(id: string, userId: string) {
    const resume = await this.resumeModel.findOne({ _id: id, isDeleted: false }).exec();
    if (!resume) {
      throw new NotFoundException('Resume not found');
    }
    if (!resume.userId || resume.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to delete this resume');
    }
    resume.isDeleted = true;
    await resume.save();
  }

  async exportToPdf(id: string, userId: string) {
    const resume = await this.resumeModel.findOne({ _id: id, isDeleted: false }).exec();
    if (!resume) {
      throw new NotFoundException('Resume not found');
    }
    if (!resume.userId || resume.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to export this resume');
    }

    const buffer = await this.createPdfBuffer(resume.renderedHtml);
    resume.downloadCount += 1;
    resume.lastExportedAt = new Date();
    await resume.save();
    return buffer;
  }

  async claimResume(id: string, userId: string) {
    const resume = await this.resumeModel.findOne({ _id: id, isDeleted: false }).exec();
    if (!resume) {
      throw new NotFoundException('Resume not found');
    }
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

  private async generateRenderedHtml(templateId: string, formData: Record<string, string>) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      throw new BadRequestException('Template not found');
    }

    // process.cwd() is apps/api when Turbo runs the dev script.
    // packages/templates lives two directories above that at the monorepo root.
    const templatePath = join(process.cwd(), '..', '..', 'packages', 'templates', template.htmlPath);
    let html = await fs.readFile(templatePath, 'utf-8');

    // Replace {{placeholders}} with formData values
    html = html.replace(/{{\s*([^}\s]+)\s*}}/g, (_, key) => {
      return key === '_accentColor' ? '' : String(formData[key] ?? '');
    });

    // Inject accent color chosen by the user (stored in formData._accentColor)
    const accentHex = formData['_accentColor'];
    if (accentHex) {
      html = this.injectAccentColor(html, accentHex, templateId);
    }

    return html;
  }

  /** Mirrors the client-side injectAccentColor logic in BuilderShell.tsx */
  private injectAccentColor(html: string, hex: string, templateId: string): string {
    const ACCENT_MAP: Record<string, string> = {
      'classic': '#0f3d5c', 'minimal': '#111827', 'executive': '#d4af37',
      'bold': '#ef4444', 'modern': '#3b82f6', 'elegant': '#9d8189',
      'clean-grid': '#334155', 'ats-friendly': '#374151', 'ats': '#374151',
      'corporate': '#4299e1', 'creative': '#4ecdc4', 'compact': '#e53935',
      'timeline': '#7c3aed', 'mono': '#333', 'slate': '#38bdf8',
      'indigo': '#4338ca', 'cobalt': '#0077cc', 'sage': '#3a5e3b',
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

    // CSS variable override (for new templates using var(--resume-accent-color))
    const cssVar = `<style>:root { --resume-accent-color: ${hex} !important; --accent: ${hex} !important; }</style>`;
    html = html.includes('<head>') ? html.replace('<head>', `<head>${cssVar}`) : cssVar + html;
    return html;
  }


  private async createPdfBuffer(html: string) {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const buffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return buffer;
  }
}
