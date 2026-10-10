const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const AuthController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { limiters } = require('../../config/rateLimit');
const loginValidation = [
  body('username').notEmpty().withMessage('Username (email or phone) is required'),
  body('password').notEmpty().withMessage('Password is required')
];
const registerValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address (e.g. name@example.com)')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^09[0-9]{8}$/).withMessage('Phone number must be in Ethiopian format: 09XXXXXXXX (10 digits, starting with 09)'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
];
const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
];
router.post('/login', limiters.login, loginValidation, validate, AuthController.login);
router.post('/register', limiters.auth, registerValidation, validate, AuthController.register);
router.post('/logout', authenticate, AuthController.logout);
router.post('/refresh', AuthController.refreshToken);
router.post('/change-password', authenticate, changePasswordValidation, validate, AuthController.changePassword);
router.post('/verify-password', authenticate, body('password').notEmpty(), validate, AuthController.verifyPassword);
router.post('/reset-password/request', limiters.auth, body('email').isEmail(), validate, AuthController.requestPasswordReset);
router.post('/reset-password/confirm', limiters.auth, [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 8 })
], validate, AuthController.confirmPasswordReset);
router.get('/me', authenticate, AuthController.getCurrentUser);
module.exports = router;
