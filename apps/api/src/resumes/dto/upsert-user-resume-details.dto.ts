import { Transform } from 'class-transformer';
import { IsDefined, IsObject } from 'class-validator';
import { normalizeFormDataRecord } from '../../common/form-data.util';

export class UpsertUserResumeDetailsDto {
  @Transform(({ value }) => normalizeFormDataRecord(value))
  @IsObject()
  @IsDefined()
  formData: Record<string, string>;
}
