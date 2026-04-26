import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResumesService } from './resumes.service';
import { ResumesController } from './resumes.controller';
import { Resume, ResumeSchema } from './schemas/resume.schema';
import { UserResumeDetails, UserResumeDetailsSchema } from './schemas/userResumeDetails.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Resume.name, schema: ResumeSchema },
      { name: UserResumeDetails.name, schema: UserResumeDetailsSchema },
    ]),
  ],
  providers: [ResumesService],
  controllers: [ResumesController],
})
export class ResumesModule {}
