import mongoose from 'mongoose';

export async function connectMongo(uri: string) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  return mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB_NAME || 'resumeforge'
  });
}
