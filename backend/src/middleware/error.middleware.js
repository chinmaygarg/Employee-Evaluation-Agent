const logger = require('../config/logger');

/**
 * Error response helper
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {string} message - Optional custom error message
 * @returns {Response} - Express response
 */
const errorResponse = (err, req, res, message) => {
  // Log error details
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`);
  logger.error(err.stack);
  
  // Send response
  return res.status(err.statusCode || 500).json({
    success: false,
    message: message || err.message || 'Server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Custom error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Default error status code
  err.statusCode = err.statusCode || 500;
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    err.statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${field} already exists with value: ${value}`;
    return errorResponse(err, req, res, message);
  }
  
  // MongoDB validation error
  if (err.name === 'ValidationError') {
    err.statusCode = 400;
    const errors = Object.values(err.errors).map(val => val.message);
    const message = `Invalid input data: ${errors.join(', ')}`;
    return errorResponse(err, req, res, message);
  }
  
  // MongoDB cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    err.statusCode = 400;
    const message = `Invalid ${err.path}: ${err.value}`;
    return errorResponse(err, req, res, message);
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401;
    return errorResponse(err, req, res, 'Invalid token');
  }
  
  // Token expired error
  if (err.name === 'TokenExpiredError') {
    err.statusCode = 401;
    return errorResponse(err, req, res, 'Token expired');
  }
  
  // Default error response
  return errorResponse(err, req, res);
};

/**
 * Not found middleware
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Async handler to avoid try-catch blocks
 * @param {Function} fn - Async function
 * @returns {Function} - Express middleware
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
};
