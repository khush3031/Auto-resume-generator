import { Transform } from 'class-transformer';
import { IsIn, IsObject, IsOptional } from 'class-validator';
import { normalizeFormDataRecord } from '../../common/form-data.util';

export const RESUME_EXPORT_FORMATS = ['pdf', 'doc', 'docx'] as const;
export type ResumeExportFormat = (typeof RESUME_EXPORT_FORMATS)[number];

export class ExportResumeDto {
  @IsOptional()
  @IsIn(RESUME_EXPORT_FORMATS)
  format?: ResumeExportFormat;

  @IsOptional()
  @Transform(({ value }) => normalizeFormDataRecord(value))
  @IsObject()
  formData?: Record<string, string>;
}
