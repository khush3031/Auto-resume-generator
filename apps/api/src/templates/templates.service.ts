import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Template, TemplateDocument } from './schemas/template.schema';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(Template.name)
    private templateModel: Model<TemplateDocument>,
  ) {}

  async findAll() {
    return this.templateModel.find().lean();
  }

  async findOne(id: string) {
    const template = await this.templateModel
      .findOne({ $or: [{ id }, { slug: id }] })
      .lean();

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }
}