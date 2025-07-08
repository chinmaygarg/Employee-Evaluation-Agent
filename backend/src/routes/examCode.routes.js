const express = require('express');
const examCodeController = require('../controllers/examCode.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Generate exam codes for a question paper
router.post('/generate/:questionPaperId', examCodeController.generateExamCodes);

// Get exam codes for a question paper
router.get('/question-paper/:questionPaperId', examCodeController.getExamCodes);

// Get exam code statistics
router.get('/stats/:questionPaperId', examCodeController.getExamCodeStats);

// Get exam code by code
router.get('/code/:code', examCodeController.getExamCodeByCode);

// Deactivate an exam code
router.patch('/deactivate/:codeId', examCodeController.deactivateExamCode);

module.exports = router;
