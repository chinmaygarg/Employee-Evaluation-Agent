const Evaluation = require('../models/evaluation.model');
const ExamSession = require('../models/examSession.model');
const QuestionPaper = require('../models/questionPaper.model');
const Candidate = require('../models/candidate.model');
const { asyncHandler } = require('../middleware/error.middleware');
const pdfService = require('../services/pdf.service');
const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Get all evaluations
 * @route   GET /api/admin/evaluations
 * @access  Private
 */
const getAllEvaluations = asyncHandler(async (req, res) => {
  // Parse query parameters
  const { 
    search, 
    examCode, 
    startDate, 
    endDate, 
    minScore, 
    maxScore, 
    page = 1, 
    limit = 50 
  } = req.query;
  
  // Build aggregation pipeline for better performance
  const pipeline = [
    {
      $lookup: {
        from: 'examsessions',
        localField: 'sessionId',
        foreignField: '_id',
        as: 'session'
      }
    },
    {
      $unwind: '$session'
    },
    {
      $lookup: {
        from: 'questionpapers',
        localField: 'questionPaperId',
        foreignField: '_id',
        as: 'questionPaper'
      }
    },
    {
      $unwind: '$questionPaper'
    }
  ];
  
  // Build match conditions
  const matchConditions = {};
  
  if (search) {
    matchConditions.$or = [
      { 'session.candidate.name': { $regex: search, $options: 'i' } },
      { 'session.candidate.email': { $regex: search, $options: 'i' } },
      { 'session.candidate.mobile': { $regex: search, $options: 'i' } },
      { 'session.examCode': { $regex: search, $options: 'i' } }
    ];
  }
  
  if (examCode) {
    matchConditions['session.examCode'] = examCode;
  }
  
  if (startDate || endDate) {
    matchConditions.createdAt = {};
    
    if (startDate) {
      matchConditions.createdAt.$gte = new Date(startDate);
    }
    
    if (endDate) {
      matchConditions.createdAt.$lte = new Date(endDate);
    }
  }
  
  if (minScore !== undefined || maxScore !== undefined) {
    matchConditions.overallScore = {};
    
    if (minScore !== undefined) {
      matchConditions.overallScore.$gte = parseInt(minScore);
    }
    
    if (maxScore !== undefined) {
      matchConditions.overallScore.$lte = parseInt(maxScore);
    }
  }
  
  // Add match stage if there are conditions
  if (Object.keys(matchConditions).length > 0) {
    pipeline.push({ $match: matchConditions });
  }
  
  // Add sorting
  pipeline.push({ $sort: { createdAt: -1 } });
  
  // Get total count
  const totalPipeline = [...pipeline, { $count: 'total' }];
  const totalResult = await Evaluation.aggregate(totalPipeline);
  const total = totalResult.length > 0 ? totalResult[0].total : 0;
  
  // Add pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  pipeline.push(
    { $skip: skip },
    { $limit: parseInt(limit) }
  );
  
  // Execute aggregation
  const evaluations = await Evaluation.aggregate(pipeline);
  
  res.status(200).json({
    success: true,
    data: {
      evaluations: evaluations.map(evaluation => ({
        id: evaluation._id,
        candidate: evaluation.session.candidate,
        examCode: evaluation.session.examCode,
        title: evaluation.questionPaper.title,
        jobRole: evaluation.questionPaper.jobRole,
        date: evaluation.session.startTime,
        duration: evaluation.session.duration,
        overallScore: evaluation.overallScore,
        reportUrl: evaluation.reportUrl,
        createdAt: evaluation.createdAt,
        evaluatedAt: evaluation.evaluatedAt,
        status: 'evaluated', // All evaluations are evaluated
        questionPaper: {
          title: evaluation.questionPaper.title,
          jobRole: evaluation.questionPaper.jobRole,
          skills: evaluation.questionPaper.skills,
          experience: evaluation.questionPaper.experience,
        },
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

/**
 * @desc    Get evaluation by ID
 * @route   GET /api/admin/evaluations/:id
 * @access  Private
 */
const getEvaluationById = asyncHandler(async (req, res) => {
  const evaluation = await Evaluation.findById(req.params.id)
    .populate({
      path: 'sessionId',
      select: 'examCode candidate startTime endTime duration answers ipAddress userAgent',
    })
    .populate({
      path: 'questionPaperId',
      select: 'title jobRole skills experience sections',
    });
  
  if (!evaluation) {
    return res.status(404).json({
      success: false,
      message: 'Evaluation not found',
    });
  }

  // Transform the data to match frontend expectations
  const transformedData = {
    _id: evaluation._id,
    sessionId: evaluation.sessionId,
    candidateId: evaluation.candidateId,
    questionPaperId: evaluation.questionPaperId,
    overallScore: evaluation.overallScore,
    sectionScores: evaluation.sectionScores,
    questionEvaluations: evaluation.questionEvaluations,
    summary: evaluation.summary,
    strengths: evaluation.strengths,
    weaknesses: evaluation.weaknesses,
    evaluatedAt: evaluation.evaluatedAt,
    sentToAdmin: evaluation.sentToAdmin,
    reportUrl: evaluation.reportUrl,
    llmPrompt: evaluation.llmPrompt,
    llmResponse: evaluation.llmResponse,
    createdAt: evaluation.createdAt,
    updatedAt: evaluation.updatedAt,
    
    // Add computed fields for frontend compatibility
    candidate: evaluation.sessionId ? {
      name: evaluation.sessionId.candidate?.name || 'N/A',
      email: evaluation.sessionId.candidate?.email || 'N/A',
      mobile: evaluation.sessionId.candidate?.mobile || 'N/A'
    } : { name: 'N/A', email: 'N/A', mobile: 'N/A' },
    
    examCode: evaluation.sessionId?.examCode || 'N/A',
    
    questionPaper: evaluation.questionPaperId ? {
      title: evaluation.questionPaperId.title || 'N/A',
      jobRole: evaluation.questionPaperId.jobRole || 'N/A',
      skills: evaluation.questionPaperId.skills || [],
      experience: evaluation.questionPaperId.experience || 'N/A'
    } : { title: 'N/A', jobRole: 'N/A', skills: [], experience: 'N/A' },
    
    status: 'evaluated',
    
    // Transform section evaluations for frontend display
    sectionEvaluations: evaluation.sectionScores.map(section => {
      // Find related question evaluations for this section
      // Since existing data might not have sectionId in questionEvaluations,
      // we'll use session answers to map questions to sections
      const sessionAnswers = evaluation.sessionId?.answers || [];
      const sectionQuestions = [];
      
      // For each answer in the session, check if it belongs to this section
      sessionAnswers.forEach(answer => {
        const answerSectionId = answer.sectionId ? answer.sectionId.toString() : null;
        const currentSectionId = section.sectionId ? section.sectionId.toString() : null;
        
        if (answerSectionId && answerSectionId === currentSectionId) {
          // Find the evaluation for this question by questionId
          const questionEval = evaluation.questionEvaluations.find(q => {
            const qId = q.questionId ? q.questionId.toString() : null;
            const aId = answer.questionId ? answer.questionId.toString() : null;
            return qId && aId && qId === aId;
          });
          
          if (questionEval) {
            sectionQuestions.push({
              questionId: questionEval.questionId,
              questionText: questionEval.questionText,
              candidateAnswer: questionEval.answer,
              score: questionEval.score,
              maxScore: questionEval.maxScore,
              feedback: questionEval.feedback,
              relevance: questionEval.relevance,
              accuracy: questionEval.accuracy,
              completion: questionEval.completion
            });
          }
        }
      });
      
      return {
        sectionId: section.sectionId,
        sectionTitle: section.sectionTitle,
        score: section.score,
        totalMarks: section.maxScore,
        questionEvaluations: sectionQuestions
      };
    }),
    
    // Add overall feedback and strengths/weaknesses
    overallFeedback: evaluation.summary,
    strengthsAndWeaknesses: {
      strengths: evaluation.strengths || [],
      weaknesses: evaluation.weaknesses || []
    }
  };
  
  res.status(200).json({
    success: true,
    data: transformedData,
  });
});

/**
 * @desc    Get evaluations by exam code
 * @route   GET /api/admin/evaluations/exam/:examCode
 * @access  Private
 */
const getEvaluationsByExamCode = asyncHandler(async (req, res) => {
  const { examCode } = req.params;
  
  // Find sessions by exam code
  const sessions = await ExamSession.find({ examCode }).select('_id');
  
  if (sessions.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No sessions found for this exam code',
    });
  }
  
  // Find evaluations for these sessions
  const evaluations = await Evaluation.find({
    sessionId: { $in: sessions.map(s => s._id) },
  })
    .populate({
      path: 'sessionId',
      select: 'examCode candidate startTime endTime duration',
    })
    .populate({
      path: 'questionPaperId',
      select: 'title jobRole skills experience',
    })
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    data: {
      evaluations: evaluations.map(evaluation => ({
        id: evaluation._id,
        candidate: evaluation.sessionId.candidate,
        examCode: evaluation.sessionId.examCode,
        title: evaluation.questionPaperId.title,
        jobRole: evaluation.questionPaperId.jobRole,
        date: evaluation.sessionId.startTime,
        duration: evaluation.sessionId.duration,
        overallScore: evaluation.overallScore,
        reportUrl: evaluation.reportUrl,
        createdAt: evaluation.createdAt,
      })),
      count: evaluations.length,
    },
  });
});

/**
 * @desc    Get evaluations by candidate
 * @route   GET /api/admin/evaluations/candidate/:candidateId
 * @access  Private
 */
const getEvaluationsByCandidate = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  
  // Find evaluations by candidate ID
  const evaluations = await Evaluation.find({ candidateId })
    .populate({
      path: 'sessionId',
      select: 'examCode candidate startTime endTime duration',
    })
    .populate({
      path: 'questionPaperId',
      select: 'title jobRole skills experience',
    })
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    data: {
      evaluations: evaluations.map(evaluation => ({
        id: evaluation._id,
        candidate: evaluation.sessionId.candidate,
        examCode: evaluation.sessionId.examCode,
        title: evaluation.questionPaperId.title,
        jobRole: evaluation.questionPaperId.jobRole,
        date: evaluation.sessionId.startTime,
        duration: evaluation.sessionId.duration,
        overallScore: evaluation.overallScore,
        reportUrl: evaluation.reportUrl,
        createdAt: evaluation.createdAt,
      })),
      count: evaluations.length,
    },
  });
});

/**
 * @desc    Download evaluation report
 * @route   GET /api/admin/evaluations/:id/report
 * @access  Private
 */
const downloadEvaluationReport = asyncHandler(async (req, res) => {
  const evaluation = await Evaluation.findById(req.params.id)
    .populate('sessionId')
    .populate('questionPaperId');
  
  if (!evaluation) {
    return res.status(404).json({
      success: false,
      message: 'Evaluation not found',
    });
  }
  
  if (!evaluation.reportUrl) {
    // If report doesn't exist, generate it
    const reportPath = await pdfService.generateEvaluationReport(
      evaluation,
      evaluation.sessionId,
      evaluation.questionPaperId
    );
    
    // Update evaluation with report URL
    evaluation.reportUrl = reportPath.split('/').pop();
    await evaluation.save();
  }
  
  // Get report path
  const reportPath = path.join(__dirname, '../../reports', evaluation.reportUrl);
  
  // Check if file exists
  if (!fs.existsSync(reportPath)) {
    return res.status(404).json({
      success: false,
      message: 'Report file not found',
    });
  }
  
  // Send file
  res.download(reportPath);
});

/**
 * @desc    Download answers sheet
 * @route   GET /api/admin/evaluations/:id/answers
 * @access  Private
 */
const downloadAnswersSheet = asyncHandler(async (req, res) => {
  const evaluation = await Evaluation.findById(req.params.id)
    .populate('sessionId')
    .populate('questionPaperId');
  
  if (!evaluation) {
    return res.status(404).json({
      success: false,
      message: 'Evaluation not found',
    });
  }
  
  // Generate answers sheet PDF
  const answersPath = await pdfService.generateAnswersSheet(
    evaluation,
    evaluation.sessionId,
    evaluation.questionPaperId
  );
  
  // Check if file exists
  if (!fs.existsSync(answersPath)) {
    return res.status(404).json({
      success: false,
      message: 'Answers sheet not found',
    });
  }
  
  // Send file
  res.download(answersPath);
});

/**
 * @desc    Regenerate evaluation
 * @route   POST /api/admin/evaluations/:id/regenerate
 * @access  Private
 */
const regenerateEvaluation = asyncHandler(async (req, res) => {
  const evaluation = await Evaluation.findById(req.params.id);
  
  if (!evaluation) {
    return res.status(404).json({
      success: false,
      message: 'Evaluation not found',
    });
  }
  
  const session = await ExamSession.findById(evaluation.sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Exam session not found',
    });
  }
  
  // Set session status back to completed to trigger re-evaluation
  session.status = 'completed';
  session.evaluatedAt = null;
  await session.save();
  
  // Delete current evaluation
  await Evaluation.findByIdAndDelete(evaluation._id);
  
  // Trigger evaluation asynchronously
  const { evaluateExam } = require('./exam.controller');
  
  evaluateExam(session._id).catch(error => {
    logger.error(`Error re-evaluating exam ${session._id}: ${error.message}`);
  });
  
  res.status(200).json({
    success: true,
    message: 'Evaluation regeneration started',
  });
});

/**
 * @desc    Get evaluation stats
 * @route   GET /api/admin/evaluations/stats
 * @access  Private
 */
const getEvaluationStats = asyncHandler(async (req, res) => {
  // Get overall stats
  const totalEvaluations = await Evaluation.countDocuments();
  const averageScore = await Evaluation.aggregate([
    { $group: { _id: null, avg: { $avg: '$overallScore' } } },
  ]);
  
  // Get stats by job role
  const statsByJobRole = await Evaluation.aggregate([
    {
      $lookup: {
        from: 'questionpapers',
        localField: 'questionPaperId',
        foreignField: '_id',
        as: 'paper',
      },
    },
    { $unwind: '$paper' },
    {
      $group: {
        _id: '$paper.jobRole',
        count: { $sum: 1 },
        avgScore: { $avg: '$overallScore' },
        minScore: { $min: '$overallScore' },
        maxScore: { $max: '$overallScore' },
      },
    },
    { $sort: { count: -1 } },
  ]);
  
  // Get stats by exam code
  const statsByExamCode = await Evaluation.aggregate([
    {
      $lookup: {
        from: 'examsessions',
        localField: 'sessionId',
        foreignField: '_id',
        as: 'session',
      },
    },
    { $unwind: '$session' },
    {
      $group: {
        _id: '$session.examCode',
        count: { $sum: 1 },
        avgScore: { $avg: '$overallScore' },
        minScore: { $min: '$overallScore' },
        maxScore: { $max: '$overallScore' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
  
  // Get recent evaluation trend (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentTrend = await Evaluation.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        avgScore: { $avg: '$overallScore' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      totalEvaluations,
      averageScore: averageScore.length > 0 ? Math.round(averageScore[0].avg) : 0,
      statsByJobRole,
      statsByExamCode,
      recentTrend,
    },
  });
});

module.exports = {
  getAllEvaluations,
  getEvaluationById,
  getEvaluationsByExamCode,
  getEvaluationsByCandidate,
  downloadEvaluationReport,
  downloadAnswersSheet,
  regenerateEvaluation,
  getEvaluationStats,
};
