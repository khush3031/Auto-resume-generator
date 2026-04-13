import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

class ContactInfo {
  @Prop({ default: '' })
  fullName: string;

  @Prop({ default: '' })
  jobTitle: string;

  @Prop({ default: '' })
  email: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: '' })
  location: string;

  @Prop({ default: '' })
  website: string;
}

class ResumeExperience {
  @Prop({ default: '' })
  title: string;

  @Prop({ default: '' })
  company: string;

  @Prop({ default: '' })
  date: string;

  @Prop({ default: '' })
  description: string;
}

class ResumeEducation {
  @Prop({ default: '' })
  degree: string;

  @Prop({ default: '' })
  school: string;

  @Prop({ default: '' })
  date: string;
}

class ResumeLanguage {
  @Prop({ default: '' })
  name: string;

  @Prop({ default: '' })
  level: string;
}

@Schema({ timestamps: true })
export class UserResume {
  @Prop({ type: String, ref: 'Template', required: true })
  templateId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: ContactInfo, default: {} })
  personalInfo: ContactInfo;

  @Prop()
  generatedHtml?: string;

  @Prop({ default: '' })
  summary: string;

  @Prop({ type: [ResumeExperience], default: [] })
  experience: ResumeExperience[];

  @Prop({ type: [ResumeEducation], default: [] })
  education: ResumeEducation[];

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop({ type: [ResumeLanguage], default: [] })
  languages: ResumeLanguage[];

  @Prop({ type: [String], default: [] })
  certifications: string[];
}

export type UserResumeDocument = UserResume & Document;
export const UserResumeSchema = SchemaFactory.createForClass(UserResume);
