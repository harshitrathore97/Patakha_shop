import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit/pack size is required'],
      trim: true,
      default: 'per piece',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    imagePublicId: {
      type: String,
      default: '',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      default: null, // null means unlimited/not tracked
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search
productSchema.index({ name: 'text', description: 'text', category: 'text' });

const Product = mongoose.model('Product', productSchema);

export default Product;
