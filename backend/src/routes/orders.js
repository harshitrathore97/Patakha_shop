import express from 'express';
import { body, validationResult } from 'express-validator';
import Product from '../models/Product.js';
import { isDbConnected } from '../config/db.js';
import { localStore } from '../config/localStore.js';

const router = express.Router();

// POST /api/orders/validate - validate cart items and return trusted prices
router.post('/validate', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    const validatedItems = [];
    let total = 0;

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ success: false, message: 'Invalid cart item.' });
      }

      const product = !isDbConnected()
        ? localStore.getProducts().find((p) => String(p._id) === String(item.productId))
        : await Product.findById(item.productId);

      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` });
      }

      if (!product.isAvailable) {
        return res.status(400).json({ success: false, message: `"${product.name}" is currently unavailable.` });
      }

      const subtotal = product.price * item.quantity;
      total += subtotal;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        quantity: item.quantity,
        subtotal,
      });
    }

    res.json({ success: true, items: validatedItems, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to validate order.' });
  }
});

export default router;
