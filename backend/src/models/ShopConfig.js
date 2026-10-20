import mongoose from 'mongoose';

const shopConfigSchema = new mongoose.Schema(
  {
    shopName: { type: String, default: 'My Shop' },
    whatsappNumber: { type: String, default: '919610684627' },
    tagline: { type: String, default: 'Quality products at great prices' },
    categories: { type: [String], default: ['General', 'Fireworks', 'Gifts', 'Sweets'] },
    deliveryOptions: { type: [String], default: ['Pickup', 'Delivery'] },
    footerText: { type: String, default: '' },
    announcementBanner: { type: String, default: '' },
    isStoreOpen: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ShopConfig = mongoose.model('ShopConfig', shopConfigSchema);

export default ShopConfig;
