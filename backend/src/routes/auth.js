import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { protect } from '../middleware/auth.js';
import { isDbConnected } from '../config/db.js';
import { localStore } from '../config/localStore.js';

const router = express.Router();

// Rate limit login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/login
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    try {
      let admin;
      if (!isDbConnected()) {
        admin = localStore.getAdmin(cleanEmail);
      } else {
        admin = await Admin.findOne({ email: new RegExp('^' + cleanEmail + '$', 'i') });
      }

      if (!admin) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const jwtSecret = process.env.JWT_SECRET || 'patakha_jwt_secret_dev_key_2026_change_in_prod';
      const token = jwt.sign({ id: admin._id, role: admin.role }, jwtSecret, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      res.json({
        success: true,
        token,
        admin: { id: admin._id, email: admin.email, role: admin.role },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Server error during login: ' + error.message });
    }
  }
);

// GET /api/auth/me - verify token and get admin info
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// POST /api/auth/logout (client-side token removal, but we acknowledge it)
router.post('/logout', protect, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

export default router;
