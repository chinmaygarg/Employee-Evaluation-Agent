const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Generate a unique exam code
 * @param {string} prefix - Prefix for the code (e.g., jobRole)
 * @returns {string} - Unique exam code
 */
const generateExamCode = (prefix = 'EX') => {
  // Create a short prefix from the provided string
  const shortPrefix = prefix
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 3)
    .padEnd(3, 'X');
  
  // Generate random alphanumeric string
  const randomString = crypto.randomBytes(4).toString('hex').toUpperCase();
  
  // Add timestamp component
  const timestamp = Date.now().toString().slice(-6);
  
  // Combine components
  return `${shortPrefix}-${randomString}-${timestamp}`;
};

/**
 * Generate a unique token
 * @returns {string} - UUID v4 token
 */
const generateToken = () => {
  return uuidv4();
};

/**
 * Generate a random password
 * @param {number} length - Password length
 * @returns {string} - Random password
 */
const generatePassword = (length = 12) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    password += characters.charAt(randomIndex);
  }
  
  return password;
};

/**
 * Validate an exam code format
 * @param {string} code - Exam code to validate
 * @returns {boolean} - Whether the code is valid
 */
const isValidExamCode = (code) => {
  const codeRegex = /^[A-Z]{3}-[A-Z0-9]{8}-[0-9]{6}$/;
  return codeRegex.test(code);
};

module.exports = {
  generateExamCode,
  generateToken,
  generatePassword,
  isValidExamCode,
};
