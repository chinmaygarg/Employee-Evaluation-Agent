const express = require('express');
const {
  createQuestionPaper,
  getAllQuestionPapers,
  getQuestionPaperById,
  updateQuestionPaper,
  addQuestionToSection,
  removeQuestionFromSection,
  addSection,
  removeSection,
  regenerateSectionQuestions,
} = require('../controllers/questionPaper.controller');

const {
  getAllEvaluations,
  getEvaluationById,
  getEvaluationsByExamCode,
  getEvaluationsByCandidate,
  downloadEvaluationReport,
  downloadAnswersSheet,
  regenerateEvaluation,
  getEvaluationStats,
} = require('../controllers/evaluation.controller');

const {
  getAllCandidates,
  getCandidateById,
  searchCandidate,
  getCandidateSessions,
  updateCandidate,
  getCandidateStats,
} = require('../controllers/candidate.controller');

const {
  regenerateQuestion,
  testConnection,
} = require('../controllers/llm.controller');

const {
  triggerMissingEvaluations,
} = require('../controllers/evaluationTrigger.controller');

const { validate, normalizeExperience, questionPaperSchemas } = require('../middleware/validation.middleware');

const router = express.Router();

// Question Paper routes
router.post(
  '/question-papers',
  normalizeExperience,
  validate(questionPaperSchemas.create),
  createQuestionPaper
);
router.get('/question-papers', getAllQuestionPapers);
router.get('/question-papers/:id', getQuestionPaperById);
router.put('/question-papers/:id', updateQuestionPaper);
router.post(
  '/question-papers/:id/questions',
  validate(questionPaperSchemas.addQuestion),
  addQuestionToSection
);
router.delete(
  '/question-papers/:id/questions/:questionId',
  removeQuestionFromSection
);
router.post('/question-papers/:id/sections', addSection);
router.delete('/question-papers/:id/sections/:sectionId', removeSection);
router.post(
  '/question-papers/:id/sections/:sectionId/regenerate',
  regenerateSectionQuestions
);

// Evaluation routes
router.get('/evaluations', getAllEvaluations);
router.get('/evaluations/stats', getEvaluationStats);
router.get('/evaluations/:id', getEvaluationById);
router.get('/evaluations/exam/:examCode', getEvaluationsByExamCode);
router.get('/evaluations/candidate/:candidateId', getEvaluationsByCandidate);
router.get('/evaluations/:id/report', downloadEvaluationReport);
router.get('/evaluations/:id/answers', downloadAnswersSheet);
router.post('/evaluations/:id/regenerate', regenerateEvaluation);
router.post('/evaluations/trigger-missing', triggerMissingEvaluations);

// Candidate routes
router.get('/candidates', getAllCandidates);
router.get('/candidates/stats', getCandidateStats);
router.get('/candidates/search', searchCandidate);
router.get('/candidates/:id', getCandidateById);
router.get('/candidates/:id/sessions', getCandidateSessions);
router.put('/candidates/:id', updateCandidate);

// LLM routes
router.post('/llm/regenerate-question', regenerateQuestion);
router.get('/llm/test', testConnection);

module.exports = router;
