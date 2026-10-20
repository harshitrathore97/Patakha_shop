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
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    try {
      let admin;
      if (!isDbConnected()) {
        admin = localStore.getAdmin(email);
      } else {
        admin = await Admin.findOne({ email });
      }

      if (!admin) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      res.json({
        success: true,
        token,
        admin: { id: admin._id, email: admin.email, role: admin.role },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error during login.' });
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
