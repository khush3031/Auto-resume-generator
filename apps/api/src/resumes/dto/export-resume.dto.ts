import { IsObject, IsOptional } from 'class-validator';

export class ExportResumeDto {
  @IsOptional()
  @IsObject()
  formData?: Record<string, string>;
}
