import { IsDefined, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateResumeDto {
  @IsObject()
  @IsDefined()
  formData: Record<string, string>;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  status?: 'draft' | 'published';
}
