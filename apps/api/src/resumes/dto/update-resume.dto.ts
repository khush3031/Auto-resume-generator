import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { normalizeFormDataRecord } from '../../common/form-data.util';

export class UpdateResumeDto {
  @Transform(({ value }) => normalizeFormDataRecord(value))
  @IsObject()
  @IsDefined()
  formData: Record<string, string>;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: 'draft' | 'published';
}
