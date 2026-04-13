import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from './utility/mongo';
import { TemplateSchema } from './templates/schemas/template.schema';
import templates from './seeder/template.json';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/resumeforge';

async function seed() {
  await connectMongo(MONGODB_URI);

  const TemplateModel = mongoose.model('Template', TemplateSchema);

  for (const template of templates) {
    await TemplateModel.updateOne(
      { id: template.id },
      template,
      { upsert: true }
    );
  }

  console.log('✅ Templates seeded successfully');
  await disconnectMongo();
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});