import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadService } from './upload.service';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';

const ALLOWED_TYPES = /pdf|jpg|jpeg|png|webp/;
const MAX_SIZE_MB = 10;

@Controller('upload')
@UseFilters(HttpExceptionFilter)
@UseGuards(OptionalJwtGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('parse-resume')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (_, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
      limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        const ext = extname(file.originalname).toLowerCase().replace('.', '');
        if (ALLOWED_TYPES.test(ext)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'File type not allowed. Use: PDF, JPG, PNG, WEBP',
            ),
            false,
          );
        }
      },
    }),
  )
  async parseResume(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded.');

    const parsed = await this.uploadService.processUpload(file);

    return {
      success: true,
      message: 'Resume parsed successfully',
      data: parsed,
    };
  }
}
