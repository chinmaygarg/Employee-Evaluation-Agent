const express = require('express');
const {
  login,
  register,
  getCurrentUser,
  changePassword,
} = require('../controllers/auth.controller');
const { authMiddleware, roleMiddleware } = require('../middleware/auth.middleware');
const { validate, authSchemas } = require('../middleware/validation.middleware');

const router = express.Router();

// Public routes
router.post('/login', validate(authSchemas.login), login);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);
router.put('/change-password', authMiddleware, changePassword);

// Admin-only routes
router.post(
  '/register',
  authMiddleware,
  roleMiddleware(['super-admin']),
  validate(authSchemas.register),
  register
);

module.exports = router;
