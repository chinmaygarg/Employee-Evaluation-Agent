const Candidate = require('../models/candidate.model');
const ExamSession = require('../models/examSession.model');
const { asyncHandler } = require('../middleware/error.middleware');

/**
 * @desc    Get all candidates
 * @route   GET /api/admin/candidates
 * @access  Private
 */
const getAllCandidates = asyncHandler(async (req, res) => {
  // Parse query parameters
  const { search, page = 1, limit = 10 } = req.query;
  
  // Build query
  const query = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
    ];
  }
  
  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Get candidates with pagination
  const candidates = await Candidate.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  // Get total count
  const total = await Candidate.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: {
      candidates,
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
 * @desc    Get candidate by ID
 * @route   GET /api/admin/candidates/:id
 * @access  Private
 */
const getCandidateById = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  
  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: 'Candidate not found',
    });
  }
  
  // Get detailed session information with question paper data and evaluations
  const sessions = await ExamSession.find({
    'candidate._id': candidate._id,
  })
    .populate('questionPaperId', 'title jobRole skills experience')
    .sort({ startTime: -1 });
  
  // For each session, get the evaluation if it exists
  const Evaluation = require('../models/evaluation.model');
  const sessionsWithEvaluations = await Promise.all(
    sessions.map(async (session) => {
      const evaluation = await Evaluation.findOne({ sessionId: session._id });
      
      return {
        _id: session._id,
        examCode: session.examCode,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
        duration: session.duration,
        questionPaper: session.questionPaperId,
        evaluation: evaluation ? {
          _id: evaluation._id,
          overallScore: evaluation.overallScore,
          createdAt: evaluation.createdAt,
          evaluatedAt: evaluation.evaluatedAt,
        } : null,
      };
    })
  );
  
  // Also get all evaluations directly for this candidate
  const evaluations = await Evaluation.find({ candidateId: candidate._id })
    .populate({
      path: 'sessionId',
      select: 'examCode startTime endTime duration',
    })
    .populate({
      path: 'questionPaperId',
      select: 'title jobRole skills experience',
    })
    .sort({ createdAt: -1 });
  
  const candidateWithSessions = {
    ...candidate.toObject(),
    sessions: sessionsWithEvaluations,
    evaluations: evaluations.map(evaluation => ({
      _id: evaluation._id,
      sessionId: evaluation.sessionId._id,
      examCode: evaluation.sessionId.examCode,
      overallScore: evaluation.overallScore,
      createdAt: evaluation.createdAt,
      evaluatedAt: evaluation.evaluatedAt,
      questionPaper: evaluation.questionPaperId,
      startTime: evaluation.sessionId.startTime,
      endTime: evaluation.sessionId.endTime,
      duration: evaluation.sessionId.duration,
    })),
  };
  
  res.status(200).json({
    success: true,
    data: candidateWithSessions,
  });
});

/**
 * @desc    Get candidate by email, mobile, or session ID
 * @route   GET /api/admin/candidates/search
 * @access  Private
 */
const searchCandidate = asyncHandler(async (req, res) => {
  const { email, mobile, sessionId } = req.query;
  
  if (!email && !mobile && !sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email, mobile, or session ID',
    });
  }
  
  let candidate = null;
  
  // Search by session ID first
  if (sessionId) {
    const ExamSession = require('../models/examSession.model');
    const session = await ExamSession.findById(sessionId);
    
    if (session && session.candidate && session.candidate._id) {
      candidate = await Candidate.findById(session.candidate._id);
    }
  }
  
  // If not found by session ID, search by email/mobile
  if (!candidate) {
    const query = {};
    
    if (email) {
      query.email = email;
    }
    
    if (mobile) {
      query.mobile = mobile;
    }
    
    if (Object.keys(query).length > 0) {
      candidate = await Candidate.findOne(query);
    }
  }
  
  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: 'Candidate not found',
    });
  }
  
  // Get evaluations for this candidate
  const Evaluation = require('../models/evaluation.model');
  const evaluations = await Evaluation.find({ candidateId: candidate._id })
    .populate({
      path: 'sessionId',
      select: 'examCode startTime endTime duration',
    })
    .populate({
      path: 'questionPaperId',
      select: 'title jobRole skills experience',
    })
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    data: {
      ...candidate.toObject(),
      evaluations: evaluations.map(evaluation => ({
        _id: evaluation._id,
        sessionId: evaluation.sessionId._id,
        examCode: evaluation.sessionId.examCode,
        overallScore: evaluation.overallScore,
        createdAt: evaluation.createdAt,
        evaluatedAt: evaluation.evaluatedAt,
        questionPaper: evaluation.questionPaperId,
        startTime: evaluation.sessionId.startTime,
        endTime: evaluation.sessionId.endTime,
        duration: evaluation.sessionId.duration,
      })),
    },
  });
});

/**
 * @desc    Get candidate sessions
 * @route   GET /api/admin/candidates/:id/sessions
 * @access  Private
 */
const getCandidateSessions = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  
  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: 'Candidate not found',
    });
  }
  
  // Get detailed session information
  const sessions = await ExamSession.find({
    'candidate._id': candidate._id,
  }).sort({ startTime: -1 });
  
  res.status(200).json({
    success: true,
    data: {
      sessions,
      count: sessions.length,
    },
  });
});

/**
 * @desc    Update candidate
 * @route   PUT /api/admin/candidates/:id
 * @access  Private
 */
const updateCandidate = asyncHandler(async (req, res) => {
  const { name, email, mobile } = req.body;
  
  const candidate = await Candidate.findById(req.params.id);
  
  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: 'Candidate not found',
    });
  }
  
  // Update fields
  if (name) candidate.name = name;
  if (email) candidate.email = email;
  if (mobile) candidate.mobile = mobile;
  
  await candidate.save();
  
  res.status(200).json({
    success: true,
    message: 'Candidate updated successfully',
    data: candidate,
  });
});

/**
 * @desc    Get candidates stats
 * @route   GET /api/admin/candidates/stats
 * @access  Private
 */
const getCandidateStats = asyncHandler(async (req, res) => {
  // Get total count
  const totalCandidates = await Candidate.countDocuments();
  
  // Get count by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const candidatesByMonth = await Candidate.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  
  // Get session counts
  const sessionStats = await Candidate.aggregate([
    {
      $project: {
        sessionCount: { $size: '$sessions' },
      },
    },
    {
      $group: {
        _id: null,
        avgSessions: { $avg: '$sessionCount' },
        maxSessions: { $max: '$sessionCount' },
        totalSessions: { $sum: '$sessionCount' },
      },
    },
  ]);
  
  // Get recent candidates
  const recentCandidates = await Candidate.find()
    .sort({ createdAt: -1 })
    .limit(5);
  
  res.status(200).json({
    success: true,
    data: {
      totalCandidates,
      candidatesByMonth,
      sessionStats: sessionStats.length > 0 ? sessionStats[0] : {
        avgSessions: 0,
        maxSessions: 0,
        totalSessions: 0,
      },
      recentCandidates,
    },
  });
});

module.exports = {
  getAllCandidates,
  getCandidateById,
  searchCandidate,
  getCandidateSessions,
  updateCandidate,
  getCandidateStats,
};
