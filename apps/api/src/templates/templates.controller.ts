import { Controller, Get, Param, UseFilters } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { HttpExceptionFilter } from '../common/http-exception.filter';

@Controller('templates')
@UseFilters(HttpExceptionFilter)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  async findAll() {
    const templates = await this.templatesService.findAll();
    return { success: true, data: templates, message: 'Template list loaded.' };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const template = await this.templatesService.findOne(id);
    return { success: true, data: template, message: 'Template retrieved.' };
  }
}
