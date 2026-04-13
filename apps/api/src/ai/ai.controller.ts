import { Body, Controller, Post, UseFilters, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';

@Controller('ai')
@UseFilters(HttpExceptionFilter)
@UseGuards(OptionalJwtGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('suggest-bullets')
  async suggestBullets(
    @Body() body: { jobTitle: string; company: string; existingBullets: string[] },
  ) {
    const suggestions = await this.aiService.suggestExperienceBullets(body);
    return { success: true, data: { suggestions } };
  }

  @Post('suggest-skills')
  async suggestSkills(
    @Body() body: { jobTitle: string; experienceSummary: string },
  ) {
    const data = await this.aiService.suggestSkills(body);
    return { success: true, data };
  }

  @Post('suggest-summary')
  async suggestSummary(
    @Body() body: {
      jobTitle: string;
      yearsOfExperience: string;
      topSkills: string[];
      currentRole: string;
      targetRole: string;
    },
  ) {
    const suggestions = await this.aiService.suggestSummary(body);
    return { success: true, data: { suggestions } };
  }
}
