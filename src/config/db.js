import mongoose from 'mongoose';

export async function connectToDatabase() {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    throw new Error('DB_URL is not set in environment variables');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(dbUrl, {
    dbName: process.env.DB_NAME || 'image-generation',
  });

  console.log('Connected to MongoDB');
}


