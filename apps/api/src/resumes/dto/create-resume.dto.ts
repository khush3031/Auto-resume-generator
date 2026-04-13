import { IsDefined, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateResumeDto {
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @IsObject()
  @IsDefined()
  formData: Record<string, string>;

  @IsOptional()
  @IsString()
  userId?: string;
}
