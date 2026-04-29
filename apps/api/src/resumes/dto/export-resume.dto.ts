import { Transform } from 'class-transformer';
import { IsObject, IsOptional } from 'class-validator';
import { normalizeFormDataRecord } from '../../common/form-data.util';

export class ExportResumeDto {
  @IsOptional()
  @Transform(({ value }) => normalizeFormDataRecord(value))
  @IsObject()
  formData?: Record<string, string>;
}
