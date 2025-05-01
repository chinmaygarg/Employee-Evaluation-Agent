const User = require('../models/user.model');
const { generateAuthToken, comparePassword } = require('../utils/auth');
const { asyncHandler } = require('../middleware/error.middleware');
const logger = require('../config/logger');

/**
 * @desc    Login admin user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Find user by email
  const user = await User.findOne({ email });
  
  // Check if user exists
  if (!user) {
    logger.warn(`Login attempt with non-existent email: ${email}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }
  
  // Check password
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    logger.warn(`Failed login attempt for user: ${email}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }
  
  // Update last login
  user.lastLogin = new Date();
  await user.save();
  
  // Generate token
  const token = generateAuthToken(user);
  
  logger.info(`User logged in: ${email}`);
  
  // Return response
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    },
  });
});

/**
 * @desc    Register admin user
 * @route   POST /api/auth/register
 * @access  Private (super-admin only)
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  
  // Check if user with email already exists
  const existingUser = await User.findOne({ email });
  
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists',
    });
  }
  
  // Create new user
  const user = new User({
    name,
    email,
    password, // Will be hashed by pre-save hook
    role: role || 'admin',
  });
  
  // Save user
  await user.save();
  
  logger.info(`New user registered: ${email}`);
  
  // Return success response (without token)
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  // User is already available from auth middleware
  const user = req.user;
  
  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
    },
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  // Get user from database with password
  const user = await User.findById(req.user.id);
  
  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }
  
  // Update password
  user.password = newPassword; // Will be hashed by pre-save hook
  await user.save();
  
  logger.info(`Password changed for user: ${user.email}`);
  
  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

module.exports = {
  login,
  register,
  getCurrentUser,
  changePassword,
};
