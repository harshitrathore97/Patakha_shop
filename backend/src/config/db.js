import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('PLACEHOLDER')) {
    console.warn('\n⚠️  [DATABASE NOTICE]: MONGODB_URI contains placeholder credentials.');
    console.warn('   Using built-in local JSON storage for testing & offline development.');
    console.warn('   To connect to MongoDB Atlas, update MONGODB_URI in backend/.env\n');
    isConnected = false;
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Atlas connected: ${conn.connection.host}`);
    isConnected = true;
    return true;
  } catch (error) {
    console.warn('\n⚠️  [DATABASE WARNING]: Failed to connect to MongoDB:', error.message);
    console.warn('   Falling back to built-in local JSON storage so development and testing can proceed.\n');
    isConnected = false;
    return false;
  }
};

export const isDbConnected = () => isConnected;

