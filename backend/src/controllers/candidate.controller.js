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
  
  res.status(200).json({
    success: true,
    data: candidate,
  });
});

/**
 * @desc    Get candidate by email or mobile
 * @route   GET /api/admin/candidates/search
 * @access  Private
 */
const searchCandidate = asyncHandler(async (req, res) => {
  const { email, mobile } = req.query;
  
  if (!email && !mobile) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email or mobile',
    });
  }
  
  const query = {};
  
  if (email) {
    query.email = email;
  }
  
  if (mobile) {
    query.mobile = mobile;
  }
  
  const candidate = await Candidate.findOne(query);
  
  if (!candidate) {
    return res.status(404).json({
      success: false,
      message: 'Candidate not found',
    });
  }
  
  res.status(200).json({
    success: true,
    data: candidate,
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
