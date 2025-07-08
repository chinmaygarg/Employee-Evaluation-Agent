const connectDB = require('../../_utils/db');
const { verifyToken } = require('../../_utils/auth');
const Evaluation = require('../../../backend/src/models/evaluation.model');
const Candidate = require('../../../backend/src/models/candidate.model');
const ExamSession = require('../../../backend/src/models/examSession.model');

const handler = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { 
      search, 
      examCode, 
      candidateId, 
      status,
      page = 1, 
      limit = 100,
      sortBy = 'createdAt',
      sortOrder = 'desc' 
    } = req.query;
    
    // Build query
    const query = {};
    
    if (examCode) {
      query.examCode = examCode;
    }
    
    if (candidateId) {
      query.candidateId = candidateId;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Add search functionality
    if (search) {
      const candidates = await Candidate.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      if (candidates.length > 0) {
        query.candidateId = { $in: candidates.map(c => c._id) };
      }
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get evaluations with populated data
    const evaluations = await Evaluation.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('candidateId', 'name email mobile')
      .populate('examSessionId', 'examCode questionPaperId')
      .populate({
        path: 'examSessionId',
        populate: {
          path: 'questionPaperId',
          select: 'title jobRole experience'
        }
      });
    
    // Get total count
    const total = await Evaluation.countDocuments(query);
    
    // Transform the data
    const transformedEvaluations = evaluations.map(evaluation => {
      const questionPaper = evaluation.examSessionId?.questionPaperId || {};
      
      return {
        id: evaluation._id,
        _id: evaluation._id,
        candidateId: evaluation.candidateId,
        examSessionId: evaluation.examSessionId?._id,
        examCode: evaluation.examCode || evaluation.examSessionId?.examCode,
        questionPaper: {
          id: questionPaper._id,
          title: questionPaper.title || 'Unknown',
          jobRole: questionPaper.jobRole,
          experience: questionPaper.experience
        },
        overallScore: evaluation.overallScore,
        sectionScores: evaluation.sectionScores,
        status: evaluation.status,
        evaluatedAt: evaluation.evaluatedAt,
        createdAt: evaluation.createdAt,
        completionRate: evaluation.completionRate,
        accuracyRate: evaluation.accuracyRate,
        answeredCount: evaluation.answeredCount,
        totalQuestions: evaluation.totalQuestions
      };
    });
    
    return res.status(200).json({
      success: true,
      data: {
        evaluations: transformedEvaluations,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });

  } catch (error) {
    console.error('Get evaluations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching evaluations',
      error: error.message
    });
  }
};

module.exports = verifyToken(handler);
