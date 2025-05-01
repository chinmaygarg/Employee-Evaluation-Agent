const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Configure email transporter
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Verify email configuration
 */
const verifyEmailConfig = async () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      await transporter.verify();
      logger.info('Email server connection established');
      return true;
    } catch (error) {
      logger.warn(`Email server connection failed: ${error.message}`);
      return false;
    }
  }
  return true; // Skip verification in production
};

/**
 * Send email
 * @param {object} mailOptions - Email options (to, subject, text, html)
 * @returns {Promise<object>} - Nodemailer send response
 */
const sendEmail = async (mailOptions) => {
  try {
    const defaultOptions = {
      from: process.env.EMAIL_FROM || 'noreply@smartexamsystem.com',
    };
    
    const info = await transporter.sendMail({
      ...defaultOptions,
      ...mailOptions,
    });
    
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Email sending failed: ${error.message}`);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = {
  transporter,
  verifyEmailConfig,
  sendEmail,
};
