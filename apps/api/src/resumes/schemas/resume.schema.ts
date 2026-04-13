import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Resume {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true, default: null })
  userId?: Types.ObjectId | null;

  @Prop({ required: true })
  templateId: string;

  @Prop({ required: true })
  templateName: string;

  @Prop({ default: 'My Resume' })
  title: string;

  @Prop({ required: true, enum: ['draft', 'published'], default: 'draft' })
  status: string;

  @Prop({ type: Object, default: {} })
  formData: Record<string, string>;

  @Prop({ required: true })
  renderedHtml: string;

  @Prop()
  thumbnailUrl?: string;

  @Prop({ default: 0 })
  downloadCount: number;

  @Prop()
  lastExportedAt?: Date;

  @Prop({ default: false })
  isDeleted: boolean;
}

export type ResumeDocument = Resume & Document;
export const ResumeSchema = SchemaFactory.createForClass(Resume);
