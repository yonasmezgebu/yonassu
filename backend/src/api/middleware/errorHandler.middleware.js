const { logger } = require('../../config/logger');
const AppError = require('../../utils/AppError');
const config = require('../../config/env');
const notFound = (req, res, next) => {
  const error = new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404);
  next(error);
};
const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    statusCode: err.statusCode || 500
  });
  // FIX #1: PostgreSQL specific error codes (Replacing MySQL codes)
  if (err.code === '23505') { // Unique constraint violation
    const fieldInfo = err.detail ? ` (${err.detail.replace(/^Key /, '').replace(/[)=]+$/, '')})` : '';
    err = new AppError(`This record already exists${fieldInfo}. Please use a different value or sign in instead.`, 409);
  }
  if (err.code === '23503') { // Foreign key constraint violation
    const constraintInfo = err.constraint ? ` [constraint: ${err.constraint}]` : '';
    err = new AppError(`A required related record is missing${constraintInfo}. Please contact administrator or try again later.`, 400);
  }
  if (err.code === '22P02') { // Invalid text representation (e.g., passing string to integer/uuid column)
    err = new AppError('Invalid data format provided for a field.', 400);
  }
  if (err.name === 'ValidationError') {
    err = new AppError(err.message, 400, err.errors);
  }
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    err = new AppError('Invalid or expired token. Please login again.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    err = new AppError('Your session has expired. Please login again.', 401);
  }
  if (err.name === 'MulterError') {
    if (err.code === 'FILE_TOO_LARGE') {
      err = new AppError(`File too large. Max size: ${config.upload.maxFileSizeBytes / (1024 * 1024)}MB`, 400);
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      err = new AppError('Too many files uploaded', 400);
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      err = new AppError('Unexpected field name for file upload', 400);
    } else {
      err = new AppError(err.message, 400);
    }
  }
  if (err.code === 'ECONNREFUSED') {
    err = new AppError('Database connection error. Please try again later.', 503);
  }
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';
  const errorResponse = {
    status: 'error',
    message,
    code: statusCode
  };
  if (err.errors && Array.isArray(err.errors)) {
    errorResponse.errors = err.errors;
  }
  if (config.isDevelopment && !err.isOperational) {
    errorResponse.stack = err.stack;
  }
  res.status(statusCode).json(errorResponse);
};
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
const handleUncaughtException = (error) => {
  logger.error('Uncaught Exception:', error);
  logger.error('Stack trace:', error.stack);
  process.exit(1);
};
const handleUnhandledRejection = (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise);
  logger.error('Reason:', reason);
  process.exit(1);
};
process.on('uncaughtException', handleUncaughtException);
process.on('unhandledRejection', handleUnhandledRejection);
module.exports = {
  notFound,
  errorHandler,
  catchAsync,
  handleUncaughtException,
  handleUnhandledRejection
};
