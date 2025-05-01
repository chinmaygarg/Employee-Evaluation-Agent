const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {string} - JWT token
 */
const generateAuthToken = (user) => {
  try {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };
    
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );
    
    return token;
  } catch (error) {
    logger.error(`Failed to generate auth token: ${error.message}`);
    throw new Error('Token generation failed');
  }
};

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    logger.error(`Failed to hash password: ${error.message}`);
    throw new Error('Password hashing failed');
  }
};

/**
 * Compare a password with its hash
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} - Whether passwords match
 */
const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    logger.error(`Failed to compare password: ${error.message}`);
    throw new Error('Password comparison failed');
  }
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    logger.error(`Failed to verify token: ${error.message}`);
    throw new Error('Token verification failed');
  }
};

module.exports = {
  generateAuthToken,
  hashPassword,
  comparePassword,
  verifyToken,
};
