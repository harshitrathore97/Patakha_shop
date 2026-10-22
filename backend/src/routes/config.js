import express from 'express';
import ShopConfig from '../models/ShopConfig.js';
import { protect } from '../middleware/auth.js';
import { isDbConnected } from '../config/db.js';
import { localStore } from '../config/localStore.js';

const router = express.Router();

// Helper: get or create config
const getConfig = async () => {
  if (!isDbConnected()) {
    return localStore.getConfig();
  }
  let config = await ShopConfig.findOne();
  if (!config) {
    config = await ShopConfig.create({
      shopName: process.env.SHOP_NAME || 'My Shop',
      whatsappNumber: process.env.SHOP_WHATSAPP || '919610684627',
    });
  }
  return config;
};

// Sanitize WhatsApp number to always have 91 country code
const sanitizeWhatsApp = (num) => {
  if (!num) return '919610684627';
  const cleaned = String(num).replace(/[\s\-\+\(\)]/g, '');
  // If 10 digits starting with 6-9, prepend 91
  if (/^[6-9]\d{9}$/.test(cleaned)) return '91' + cleaned;
  // If already 12 digits starting with 91, return as is
  if (/^91[6-9]\d{9}$/.test(cleaned)) return cleaned;
  // Fallback
  return cleaned || '919610684627';
};

// GET /api/config - public shop config
router.get('/', async (req, res) => {
  try {
    const config = await getConfig();
    // Always return sanitized whatsapp number
    const configObj = config.toJSON ? config.toJSON() : { ...config };
    configObj.whatsappNumber = sanitizeWhatsApp(configObj.whatsappNumber);
    res.json({ success: true, config: configObj });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch shop config.' });
  }
});

// PUT /api/config - update config (admin only)
router.put('/', protect, async (req, res) => {
  try {
    const config = await getConfig();
    const allowed = ['shopName', 'whatsappNumber', 'tagline', 'categories', 'deliveryOptions', 'footerText', 'announcementBanner', 'isStoreOpen'];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        // Sanitize WhatsApp number before saving
        if (key === 'whatsappNumber') {
          config[key] = sanitizeWhatsApp(req.body[key]);
        } else {
          config[key] = req.body[key];
        }
      }
    }

    await config.save();
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update config.' });
  }
});

export default router;
