import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { isDbConnected } from '../config/db.js';
import { localStore } from '../config/localStore.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorised. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let admin;
    if (!isDbConnected()) {
      admin = localStore.getAdminById(decoded.id);
    } else {
      admin = await Admin.findById(decoded.id);
    }

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin account not found.' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};
