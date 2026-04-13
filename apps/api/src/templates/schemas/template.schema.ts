import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TemplateDocument = Template & Document;

@Schema({ timestamps: true })
export class Template {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  style: string;

  @Prop({ required: true })
  thumbnailUrl: string;

  @Prop({ required: true })
  htmlContent: string;

  @Prop({ type: [String], default: [] })
  variables: string[];
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
