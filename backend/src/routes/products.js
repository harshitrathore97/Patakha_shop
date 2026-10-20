import express from 'express';
import { body, validationResult } from 'express-validator';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';
import { upload, uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import { isDbConnected } from '../config/db.js';
import { localStore } from '../config/localStore.js';

const router = express.Router();

// ─── PUBLIC ROUTES ─────────────────────────────────────────────────────────────

// GET /api/products - list products with filtering and search
router.get('/', async (req, res) => {
  try {
    const { search, category, available, page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;

    if (!isDbConnected()) {
      let prods = localStore.getProducts();

      if (search) {
        const q = search.toLowerCase();
        prods = prods.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q)) ||
            p.category.toLowerCase().includes(q)
        );
      }

      if (category && category !== 'all') {
        prods = prods.filter((p) => p.category.toLowerCase() === category.toLowerCase());
      }

      if (available === 'true') {
        prods = prods.filter((p) => p.isAvailable);
      }

      const total = prods.length;
      const skip = (pageNum - 1) * limitNum;
      const paginated = prods.slice(skip, skip + limitNum);

      return res.json({
        success: true,
        products: paginated,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
      });
    }

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }
    if (category && category !== 'all') {
      filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }
    if (available === 'true') {
      filter.isAvailable = true;
    }

    const skip = (pageNum - 1) * limitNum;
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({ success: true, products, total, page: pageNum, pages: Math.ceil(total / limitNum) || 1 });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
});

// GET /api/products/categories - get distinct categories
router.get('/categories', async (req, res) => {
  try {
    if (!isDbConnected()) {
      const prods = localStore.getProducts();
      const distinct = [...new Set(prods.map((p) => p.category).filter(Boolean))];
      return res.json({ success: true, categories: distinct });
    }
    const categories = await Product.distinct('category');
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    if (!isDbConnected()) {
      const prods = localStore.getProducts();
      const product = prods.find((p) => String(p._id) === String(req.params.id));
      if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
      return res.json({ success: true, product });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch product.' });
  }
});

// ─── ADMIN ROUTES (protected) ──────────────────────────────────────────────────

// POST /api/products - create product
router.post(
  '/',
  protect,
  upload.single('image'),
  [
    body('name').trim().notEmpty().withMessage('Product name is required').isLength({ max: 100 }),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('unit').trim().notEmpty().withMessage('Unit/pack size is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    try {
      const productData = {
        name: req.body.name,
        description: req.body.description || '',
        price: parseFloat(req.body.price),
        unit: req.body.unit,
        category: req.body.category,
        isAvailable: req.body.isAvailable !== 'false' && req.body.isAvailable !== false,
      };

      if (req.file) {
        const { url, publicId } = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        productData.imageUrl = url;
        productData.imagePublicId = publicId;
      }

      if (!isDbConnected()) {
        const newProduct = {
          _id: 'prod_' + Date.now(),
          ...productData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const prods = localStore.getProducts();
        localStore.saveProducts([newProduct, ...prods]);
        return res.status(201).json({ success: true, product: newProduct });
      }

      const product = new Product(productData);
      await product.save();

      res.status(201).json({ success: true, product });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message || 'Failed to create product.' });
    }
  }
);

// PUT /api/products/:id - update product
router.put('/:id', protect, upload.single('image'), async (req, res) => {
  try {
    if (!isDbConnected()) {
      const prods = localStore.getProducts();
      const idx = prods.findIndex((p) => String(p._id) === String(req.params.id));
      if (idx === -1) return res.status(404).json({ success: false, message: 'Product not found.' });

      const existing = prods[idx];
      const updates = {};
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.price !== undefined) updates.price = parseFloat(req.body.price);
      if (req.body.unit !== undefined) updates.unit = req.body.unit;
      if (req.body.category !== undefined) updates.category = req.body.category;
      if (req.body.isAvailable !== undefined) {
        updates.isAvailable = req.body.isAvailable !== 'false' && req.body.isAvailable !== false;
      }

      if (req.file) {
        await deleteFromCloudinary(existing.imagePublicId);
        const { url, publicId } = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        updates.imageUrl = url;
        updates.imagePublicId = publicId;
      }

      const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      prods[idx] = updated;
      localStore.saveProducts(prods);

      return res.json({ success: true, product: updated });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.price !== undefined) updates.price = parseFloat(req.body.price);
    if (req.body.unit !== undefined) updates.unit = req.body.unit;
    if (req.body.category !== undefined) updates.category = req.body.category;
    if (req.body.isAvailable !== undefined) {
      updates.isAvailable = req.body.isAvailable !== 'false' && req.body.isAvailable !== false;
    }

    // Handle image replacement
    if (req.file) {
      await deleteFromCloudinary(product.imagePublicId);
      const { url, publicId } = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      updates.imageUrl = url;
      updates.imagePublicId = publicId;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, product: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update product.' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!isDbConnected()) {
      const prods = localStore.getProducts();
      const existing = prods.find((p) => String(p._id) === String(req.params.id));
      if (!existing) return res.status(404).json({ success: false, message: 'Product not found.' });

      await deleteFromCloudinary(existing.imagePublicId);
      const remaining = prods.filter((p) => String(p._id) !== String(req.params.id));
      localStore.saveProducts(remaining);

      return res.json({ success: true, message: 'Product deleted successfully.' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    await deleteFromCloudinary(product.imagePublicId);
    await Product.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
});

export default router;
