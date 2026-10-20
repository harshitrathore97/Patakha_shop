#!/usr/bin/env node
/**
 * One-time admin account setup script.
 * Run: npm run setup-admin
 * Uses ADMIN_EMAIL and ADMIN_PASSWORD from .env
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';

dotenv.config({ path: new URL('../../.env', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1') });

const setup = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ ADMIN_PASSWORD must be at least 8 characters');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log(`ℹ️  Admin with email "${email}" already exists.`);
      console.log('   To reset the password, delete the admin document in MongoDB and run this script again.');
      await mongoose.disconnect();
      process.exit(0);
    }

    const admin = new Admin({ email, password });
    await admin.save();

    console.log(`✅ Admin account created successfully!`);
    console.log(`   Email: ${email}`);
    console.log(`   Login at: /admin/login`);
    console.log('⚠️  Remove ADMIN_PASSWORD from .env after setup for security.');

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
  }
};

setup();
