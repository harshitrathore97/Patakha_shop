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

    // Auto-seed admin and shop config if new database
    try {
      const Admin = (await import('../models/Admin.js')).default;
      const ShopConfig = (await import('../models/ShopConfig.js')).default;
      
      const adminCount = await Admin.countDocuments();
      if (adminCount === 0) {
        const defaultEmail = process.env.ADMIN_EMAIL || 'admin@myshop.com';
        const defaultPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
        const admin = new Admin({ email: defaultEmail, password: defaultPassword });
        await admin.save();
        console.log(`✨ Auto-initialized default admin account: ${defaultEmail}`);
      }

      const configCount = await ShopConfig.countDocuments();
      if (configCount === 0) {
        await ShopConfig.create({
          shopName: process.env.SHOP_NAME || 'My Shop',
          whatsappNumber: process.env.SHOP_WHATSAPP || '919610684627',
          tagline: 'Best Quality & Fast Delivery via WhatsApp',
        });
        console.log(`✨ Auto-initialized default shop configuration.`);
      }
    } catch (seedErr) {
      console.warn('⚠️  Auto-seed notice:', seedErr.message);
    }

    return true;
  } catch (error) {
    console.warn('\n⚠️  [DATABASE WARNING]: Failed to connect to MongoDB:', error.message);
    console.warn('   Falling back to built-in local JSON storage so development and testing can proceed.\n');
    isConnected = false;
    return false;
  }
};

export const isDbConnected = () => isConnected;

