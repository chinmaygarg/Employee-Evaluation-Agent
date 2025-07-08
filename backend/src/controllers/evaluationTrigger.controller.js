const ExamSession = require('../models/examSession.model');
const Evaluation = require('../models/evaluation.model');
const { asyncHandler } = require('../middleware/error.middleware');
const { evaluateExam } = require('./exam.controller');
const logger = require('../config/logger');

/**
 * @desc    Trigger evaluation for completed sessions without evaluations
 * @route   POST /api/admin/evaluations/trigger-missing
 * @access  Private
 */
const triggerMissingEvaluations = asyncHandler(async (req, res) => {
  try {
    // Find all completed sessions
    const completedSessions = await ExamSession.find({
      status: 'completed'
    });
    
    logger.info(`Found ${completedSessions.length} completed sessions`);
    
    // Get all evaluations to check which sessions are missing evaluations
    const existingEvaluations = await Evaluation.find({});
    const evaluatedSessionIds = existingEvaluations.map(e => e.sessionId.toString());
    
    // Filter out sessions that already have evaluations
    const sessionsNeedingEvaluation = completedSessions.filter(
      session => !evaluatedSessionIds.includes(session._id.toString())
    );
    
    logger.info(`${sessionsNeedingEvaluation.length} sessions actually need evaluation`);
    
    if (sessionsNeedingEvaluation.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No sessions need evaluation',
        data: {
          totalCompleted: completedSessions.length,
          alreadyEvaluated: existingEvaluations.length,
          needingEvaluation: 0
        }
      });
    }
    
    // Trigger evaluations for sessions that need them
    const evaluationPromises = sessionsNeedingEvaluation.map(session => {
      logger.info(`Triggering evaluation for session ${session._id}, exam code: ${session.examCode}`);
      return evaluateExam(session._id).catch(error => {
        logger.error(`Failed to evaluate session ${session._id}: ${error.message}`);
        return { sessionId: session._id, error: error.message };
      });
    });
    
    const results = await Promise.allSettled(evaluationPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    res.status(200).json({
      success: true,
      message: `Triggered evaluations for ${sessionsNeedingEvaluation.length} sessions`,
      data: {
        totalCompleted: completedSessions.length,
        alreadyEvaluated: existingEvaluations.length,
        needingEvaluation: sessionsNeedingEvaluation.length,
        successful,
        failed,
        sessionDetails: sessionsNeedingEvaluation.map(s => ({
          sessionId: s._id,
          examCode: s.examCode,
          candidateName: s.candidate.name,
          questionPaperTitle: s.questionPaperId // Will be ObjectId
        }))
      }
    });
    
  } catch (error) {
    logger.error(`Error triggering missing evaluations: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger evaluations',
      error: error.message
    });
  }
});

module.exports = {
  triggerMissingEvaluations,
};