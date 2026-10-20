import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, isDbConnected } from './config/db.js';
import productRoutes from './routes/products.js';
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import configRoutes from './routes/config.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS — supports multiple origins via comma-separated FRONTEND_URL
const allowedOrigins = [
  ...(process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(u => u.trim()),
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in production for now
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/config', configRoutes);

import path from 'path';

// Serve local uploaded images statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: isDbConnected() ? 'connected (MongoDB)' : 'offline (Local Storage Fallback)',
  });
});

// Error handler
app.use(errorHandler);

// Connect DB (or fallback) and start server
connectDB().finally(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`   Node ENV: ${process.env.NODE_ENV}`);
  });
});

export default app;
