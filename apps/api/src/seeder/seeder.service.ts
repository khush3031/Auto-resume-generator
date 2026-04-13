import * as fs from 'fs';
import * as path from 'path';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Template } from '../templates/schemas/template.schema';

// Import template registry from the shared package
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { templates: templateRegistry } = require('@resumeforge/templates') as {
  templates: Array<{
    id: string;
    name: string;
    slug: string;
    style: string;
    thumbnail: string;
    htmlPath: string;
  }>;
};

// Resolve the directory where the HTML files live
const TEMPLATES_DIR = path.dirname(require.resolve('@resumeforge/templates'));

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectModel(Template.name)
    private templateModel: Model<Template>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedTemplates();
  }

  async seedTemplates() {
    this.logger.log(`Seeding ${templateRegistry.length} templates…`);

    for (const meta of templateRegistry) {
      const htmlFilePath = path.join(TEMPLATES_DIR, meta.htmlPath);

      let htmlContent: string;
      try {
        htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
      } catch {
        this.logger.warn(`Template HTML not found, skipping: ${htmlFilePath}`);
        continue;
      }

      const payload = {
        id: meta.id,
        name: meta.name,
        slug: meta.slug,
        style: meta.style,
        thumbnailUrl: meta.thumbnail,
        htmlContent,
        variables: extractVariables(htmlContent),
      };

      await this.templateModel.updateOne(
        { $or: [{ id: payload.id }, { slug: payload.slug }] },
        { $set: payload },
        { upsert: true },
      );
    }

    this.logger.log('Templates seeded successfully');
  }
}

/** Extract {{placeholder}} names from an HTML template string */
function extractVariables(html: string): string[] {
  const matches = html.matchAll(/{{\s*([^}\s]+)\s*}}/g);
  return [...new Set([...matches].map((m) => m[1]))];
}
