import mongoose from 'mongoose';

let isConnected = false;

export async function connectMongo(uri: string) {
  if (isConnected) {
    console.log('⚡ Mongo already connected');
    return;
  }

  try {
    await mongoose.connect(uri, {
      dbName: 'resumeforge',
    });

    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

export async function disconnectMongo() {
  if (!isConnected) return;

  await mongoose.disconnect();
  isConnected = false;
  console.log('🔌 MongoDB disconnected');
}