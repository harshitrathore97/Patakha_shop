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

      const Product = (await import('../models/Product.js')).default;
      const productCount = await Product.countDocuments();
      if (productCount === 0) {
        const initialProducts = [
          {
            name: 'Sparklers 50cm Pack (Phuljhadi)',
            description: 'Golden sparkling crackling fireworks, safe for kids with long burn time.',
            price: 150,
            unit: 'pack of 10',
            category: 'Sparklers',
            imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop',
            isAvailable: true,
          },
          {
            name: 'Deluxe Anar (Flower Pots)',
            description: 'Vibrant golden fountain shooting up to 15 feet high with sparkling stars.',
            price: 350,
            unit: 'box of 5',
            category: 'Flower Pots',
            imageUrl: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=600&auto=format&fit=crop',
            isAvailable: true,
          },
          {
            name: 'Ground Chakkars Special (Spinners)',
            description: 'Fast rotating ground wheels with high-speed spinning sparks and crackles.',
            price: 220,
            unit: 'box of 10',
            category: 'Chakkars',
            imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop',
            isAvailable: true,
          },
          {
            name: 'Sky Shot 12 Multi-Color Shots',
            description: 'Spectacular aerial repeaters bursting with 12 distinct multi-color peony shells.',
            price: 650,
            unit: 'per piece',
            category: 'Aerial / Sky Shots',
            imageUrl: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=600&auto=format&fit=crop',
            isAvailable: true,
          },
          {
            name: 'Mega Sound Rocket 10-Pack',
            description: 'High flying whistle rockets bursting with double-loud bang.',
            price: 400,
            unit: 'pack of 10',
            category: 'Rockets',
            imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop',
            isAvailable: true,
          },
          {
            name: 'Assorted Diwali Family Gift Box',
            description: 'All-in-one celebration hamper containing sparklers, flower pots, ground wheels, pencils, and rockets.',
            price: 1200,
            unit: 'per box',
            category: 'Gift Boxes',
            imageUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600&auto=format&fit=crop',
            isAvailable: true,
          },
        ];
        await Product.insertMany(initialProducts);
        console.log(`✨ Auto-seeded ${initialProducts.length} default products.`);
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

