import { connectMongo, disconnectMongo } from './utility/mongo';
import mongoose from 'mongoose';
import { ResumeSchema } from './resumes/schemas/resume.schema';

async function check() {
  await connectMongo('mongodb://localhost:27017/resumeforge');
  const ResumeModel = mongoose.model('Resume', ResumeSchema);
  const resumes = await ResumeModel.find().lean().exec();
  for (const r of resumes) {
    console.log(`Resume ID: ${r._id}, Title: ${r.title}`);
    console.log(` job1Bullet1: ${JSON.stringify(r.formData?.job1Bullet1)}`);
  }
  await disconnectMongo();
}
check();
