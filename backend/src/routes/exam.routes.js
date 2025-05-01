const express = require('express');
const {
  validateExamCode,
  startExam,
  getExamQuestionPaper,
  saveAnswer,
  submitExam,
  getUnansweredQuestions,
  getSessionStatus,
} = require('../controllers/exam.controller');
const { validate, candidateSchemas, examSessionSchemas } = require('../middleware/validation.middleware');

const router = express.Router();

// Exam code validation
router.get('/validate/:examCode', validateExamCode);

// Start exam
router.post('/start', validate(candidateSchemas.register), startExam);

// Get question paper for session
router.get('/:sessionId', getExamQuestionPaper);

// Save answer
router.post(
  '/:sessionId/answer',
  validate(examSessionSchemas.saveAnswer),
  saveAnswer
);

// Submit exam
router.post('/:sessionId/submit', submitExam);

// Get unanswered questions
router.get('/:sessionId/unanswered', getUnansweredQuestions);

// Get session status
router.get('/:sessionId/status', getSessionStatus);

module.exports = router;
