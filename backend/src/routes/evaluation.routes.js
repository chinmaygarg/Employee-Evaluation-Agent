const express = require('express');
const {
  getAllEvaluations,
  getEvaluationById,
  getEvaluationsByExamCode,
  getEvaluationsByCandidate,
  downloadEvaluationReport,
  regenerateEvaluation,
  getEvaluationStats,
} = require('../controllers/evaluation.controller');

const router = express.Router();

// These routes are dedicated for API clients
// The same functionality is also available through the admin routes
// with authentication

// Get all evaluations (public API)
router.get('/', getAllEvaluations);

// Get evaluation stats
router.get('/stats', getEvaluationStats);

// Get evaluation by ID
router.get('/:id', getEvaluationById);

// Get evaluations by exam code
router.get('/exam/:examCode', getEvaluationsByExamCode);

// Get evaluations by candidate
router.get('/candidate/:candidateId', getEvaluationsByCandidate);

// Download evaluation report
router.get('/:id/report', downloadEvaluationReport);

// Regenerate evaluation
router.post('/:id/regenerate', regenerateEvaluation);

module.exports = router;
