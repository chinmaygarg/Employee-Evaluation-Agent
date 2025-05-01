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
    limit = 10 
  } = req.query;
  
  // Build query
  const query = {};
  
  if (search) {
    const sessions = await ExamSession.find({
      $or: [
        { 'candidate.name': { $regex: search, $options: 'i' } },
        { 'candidate.email': { $regex: search, $options: 'i' } },
        { 'candidate.mobile': { $regex: search, $options: 'i' } },
      ],
    }).select('_id');
    
    query.sessionId = { $in: sessions.map(s => s._id) };
  }
  
  if (examCode) {
    const sessions = await ExamSession.find({ examCode }).select('_id');
    query.sessionId = query.sessionId 
      ? { $in: query.sessionId.$in.filter(id => sessions.some(s => s._id.equals(id))) } 
      : { $in: sessions.map(s => s._id) };
  }
  
  if (startDate || endDate) {
    query.createdAt = {};
    
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }
  
  if (minScore !== undefined || maxScore !== undefined) {
    query.overallScore = {};
    
    if (minScore !== undefined) {
      query.overallScore.$gte = parseInt(minScore);
    }
    
    if (maxScore !== undefined) {
      query.overallScore.$lte = parseInt(maxScore);
    }
  }
  
  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Get evaluations with pagination
  const evaluations = await Evaluation.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate({
      path: 'sessionId',
      select: 'examCode candidate startTime endTime duration',
    })
    .populate({
      path: 'questionPaperId',
      select: 'title jobRole skills experience',
    });
  
  // Get total count
  const total = await Evaluation.countDocuments(query);
  
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
  
  res.status(200).json({
    success: true,
    data: evaluation,
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
  const evaluation = await Evaluation.findById(req.params.id);
  
  if (!evaluation) {
    return res.status(404).json({
      success: false,
      message: 'Evaluation not found',
    });
  }
  
  if (!evaluation.reportUrl) {
    // If report doesn't exist, generate it
    const session = await ExamSession.findById(evaluation.sessionId);
    const questionPaper = await QuestionPaper.findById(evaluation.questionPaperId);
    
    const reportPath = await pdfService.generateEvaluationReport(
      evaluation,
      session,
      questionPaper
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
  regenerateEvaluation,
  getEvaluationStats,
};
