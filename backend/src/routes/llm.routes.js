const express = require('express');
const router = express.Router();
const { regenerateQuestion, testConnection } = require('../controllers/llm.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes are protected (admin only)
router.use(protect);

// @route   POST /api/admin/llm/regenerate-question
// @desc    Regenerate a single question using LLM
// @access  Private
router.post('/regenerate-question', regenerateQuestion);

// @route   GET /api/admin/llm/test
// @desc    Test LLM connection
// @access  Private
router.get('/test', testConnection);

module.exports = router;