import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Stores the latest form-data snapshot for a user across ALL templates.
 * One document per user (unique userId index).
 * Used to pre-populate the builder when a user opens a new template.
 */
@Schema({ timestamps: true, collection: 'userResumeDetails' })
export class UserResumeDetails {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  /**
   * Flat key-value map that mirrors BuilderShell's formData:
   *   fullName, email, jobTitle, phone, location, linkedin, website,
   *   initials, summary, job1Title, job1Company, … skill1 … lang1 … etc.
   */
  @Prop({ type: Object, default: {} })
  formData: Record<string, string>;
}

export type UserResumeDetailsDocument = UserResumeDetails & Document;
export const UserResumeDetailsSchema = SchemaFactory.createForClass(UserResumeDetails);
