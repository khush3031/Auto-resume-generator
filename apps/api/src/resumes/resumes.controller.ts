import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResumesService } from './resumes.service';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { ExportResumeDto } from './dto/export-resume.dto';

@Controller('resumes')
@UseFilters(HttpExceptionFilter)
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  // ------------------------------------------------------------------ CREATE
  @UseGuards(OptionalJwtGuard)
  @Post()
  async create(@Body() payload: CreateResumeDto, @Req() req: Request) {
    if (req.user) {
      payload.userId = (req.user as any).sub;
    }
    const resume = await this.resumesService.createResume(payload);
    return { success: true, data: resume, message: 'Resume created.' };
  }

  // -------------------------------------------------------- MY RESUMES (auth)
  // IMPORTANT: literal route must be declared before the :id param route or
  // NestJS will match "my" as an id and throw a 404 / CastError.
  @UseGuards(JwtAuthGuard)
  @Get('my')
  async findMy(@Req() req: Request) {
    const user = req.user as any;
    const resumes = await this.resumesService.findUserResumes(user.sub);
    return { success: true, data: resumes, message: 'User resumes loaded.' };
  }

  // ------------------------------------------------- USER RESUME DETAILS (profile)
  // IMPORTANT: declared before :id routes so "my-details" isn't treated as an id.

  /** GET /resumes/my-details — return the saved form-data profile for the logged-in user */
  @UseGuards(JwtAuthGuard)
  @Get('my-details')
  async getMyDetails(@Req() req: Request) {
    const user = req.user as any;
    const formData = await this.resumesService.getUserResumeDetails(user.sub);
    return { success: true, data: formData ?? {}, message: 'User resume details loaded.' };
  }

  /** PATCH /resumes/my-details — upsert the form-data profile for the logged-in user */
  @UseGuards(JwtAuthGuard)
  @Patch('my-details')
  async upsertMyDetails(@Req() req: Request, @Body() body: { formData: Record<string, string> }) {
    const user = req.user as any;
    const saved = await this.resumesService.upsertUserResumeDetails(user.sub, body.formData ?? {});
    return { success: true, data: saved, message: 'User resume details saved.' };
  }

  // ------------------------------------------------------- SINGLE RESUME (public)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const resume = await this.resumesService.findById(id);
    return { success: true, data: resume, message: 'Resume retrieved.' };
  }

  // ------------------------------------------------------------------ UPDATE
  @UseGuards(OptionalJwtGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() payload: UpdateResumeDto, @Req() req: Request) {
    const currentUserId = req.user ? (req.user as any).sub : undefined;
    const resume = await this.resumesService.updateResume(id, payload, currentUserId);
    return { success: true, data: resume, message: 'Resume updated.' };
  }

  // ------------------------------------------------------------------ DELETE
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    await this.resumesService.softDeleteResume(id, user.sub);
    return { success: true, data: null, message: 'Resume deleted.' };
  }

  // ------------------------------------------------------------ PDF EXPORT
  @UseGuards(JwtAuthGuard)
  @Post(':id/export')
  async exportPdf(
    @Param('id') id: string,
    @Body() body: ExportResumeDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const user = req.user as any;
      const pdf = await this.resumesService.exportToPdf(id, user.sub, body.formData);
      res.set({
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="resume-${id}.pdf"`,
        'Content-Length':      pdf.length.toString(),
        'Cache-Control':       'no-cache, no-store, must-revalidate',
        'Pragma':              'no-cache',
        'Expires':             '0',
      });
      res.end(pdf);
    } catch (err: any) {
      res.status(err?.status || 500).json({
        success: false,
        message: err?.message || 'PDF export failed',
      });
    }
  }

  // --------------------------------------------------------- CLAIM (guest → user)
  @UseGuards(JwtAuthGuard)
  @Post(':id/claim')
  async claim(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    const resume = await this.resumesService.claimResume(id, user.sub);
    return { success: true, data: resume, message: 'Resume claimed.' };
  }
}
