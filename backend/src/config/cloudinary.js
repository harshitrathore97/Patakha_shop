import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'PLACEHOLDER' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'PLACEHOLDER'
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Memory storage for multer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * Upload a buffer to Cloudinary (or local uploads directory if Cloudinary is not configured)
 */
export const uploadToCloudinary = async (buffer, mimetype) => {
  if (!isCloudinaryConfigured) {
    // Local fallback: save to uploads folder
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = mimetype.split('/')[1] || 'jpg';
    const filename = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(filePath, buffer);
    return {
      url: `/uploads/${filename}`,
      publicId: `local_${filename}`,
    };
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'patakhashop/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

/**
 * Delete an image from Cloudinary or local disk
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  if (publicId.startsWith('local_')) {
    const filename = publicId.replace('local_', '');
    const filePath = path.join(process.cwd(), 'uploads', filename);
    if (fs.existsSync(filePath)) {
      try {
        await fs.promises.unlink(filePath);
      } catch (e) {
        console.warn('Local file delete warning:', e.message);
      }
    }
    return;
  }

  if (isCloudinaryConfigured) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (e) {
      console.warn('Cloudinary delete warning:', e.message);
    }
  }
};

export { cloudinary, isCloudinaryConfigured };

