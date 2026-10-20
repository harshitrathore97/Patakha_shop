#!/usr/bin/env node
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import ShopConfig from '../models/ShopConfig.js';
import Product from '../models/Product.js';

dotenv.config({ path: new URL('../../.env', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1') });

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

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('PLACEHOLDER')) {
    console.error('❌ MONGODB_URI not found or contains PLACEHOLDER in .env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas');

    // Admin
    const email = process.env.ADMIN_EMAIL || 'admin@myshop.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      await new Admin({ email, password }).save();
      console.log(`✅ Admin account created: ${email} (Password: ${password})`);
    } else {
      console.log(`ℹ️ Admin account already exists (${adminCount} found)`);
    }

    // Shop Config
    const configCount = await ShopConfig.countDocuments();
    if (configCount === 0) {
      await ShopConfig.create({
        shopName: process.env.SHOP_NAME || 'patakhashop',
        whatsappNumber: process.env.SHOP_WHATSAPP || '919610684627',
        tagline: 'Premium quality festival fireworks and sparklers at wholesale prices',
        categories: ['All', 'Sparklers', 'Flower Pots', 'Chakkars', 'Aerial / Sky Shots', 'Rockets', 'Gift Boxes'],
        deliveryOptions: ['Store Pickup', 'Local Home Delivery'],
        announcementBanner: '🔥 Grand Festive Season Sale — Direct WhatsApp Ordering Open!',
        isStoreOpen: true,
      });
      console.log('✅ Shop configuration initialized');
    } else {
      console.log(`ℹ️ Shop configuration already exists`);
    }

    // Products
    const prodCount = await Product.countDocuments();
    if (prodCount === 0) {
      await Product.insertMany(initialProducts);
      console.log(`✅ Seeded ${initialProducts.length} default products`);
    } else {
      console.log(`ℹ️ Products already exist (${prodCount} products found)`);
    }

    console.log('\n🎉 Database initialization finished successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();
