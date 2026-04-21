import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
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
    try {
      const suggestions = await this.aiService.suggestExperienceBullets(body);
      return { success: true, data: { suggestions } };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not generate bullet suggestions.';
      throw new HttpException({ success: false, message }, HttpStatus.BAD_GATEWAY);
    }
  }

  @Post('suggest-skills')
  async suggestSkills(
    @Body() body: { jobTitle: string; experienceSummary: string },
  ) {
    try {
      const data = await this.aiService.suggestSkills(body);
      return { success: true, data };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not generate skill suggestions.';
      throw new HttpException({ success: false, message }, HttpStatus.BAD_GATEWAY);
    }
  }

  @Post('suggest-summary')
  async suggestSummary(
    @Body()
    body: {
      jobTitle: string;
      yearsOfExperience: string;
      topSkills: string[];
      currentRole: string;
      targetRole: string;
    },
  ) {
    try {
      const suggestions = await this.aiService.suggestSummary(body);
      return { success: true, data: { suggestions } };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not generate summaries.';
      throw new HttpException({ success: false, message }, HttpStatus.BAD_GATEWAY);
    }
  }
}
