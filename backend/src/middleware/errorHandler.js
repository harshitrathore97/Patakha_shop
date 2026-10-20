export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join('. ') });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(400).json({ success: false, message: 'Duplicate entry detected.' });
  }

  // CORS error
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ success: false, message: 'CORS policy violation.' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.',
  });
};
