import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { normalizeFormDataRecord } from '../../common/form-data.util';

export class CreateResumeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/i)
  templateId: string;

  @Transform(({ value }) => normalizeFormDataRecord(value))
  @IsObject()
  @IsDefined()
  formData: Record<string, string>;

  @IsOptional()
  @IsMongoId()
  userId?: string;
}
