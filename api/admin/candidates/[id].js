const connectDB = require('../../_utils/db');
const { verifyToken } = require('../../_utils/auth');
const Candidate = require('../../../backend/src/models/candidate.model');
const ExamSession = require('../../../backend/src/models/examSession.model');
const Evaluation = require('../../../backend/src/models/evaluation.model');

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
    
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Candidate ID is required'
      });
    }

    const candidate = await Candidate.findById(id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Get exam sessions with populated question paper data
    const sessions = await ExamSession.find({ candidateId: id })
      .populate({
        path: 'questionPaperId',
        select: 'title jobRole experience duration'
      })
      .sort({ createdAt: -1 });
    
    // Get evaluations for these sessions
    const evaluations = await Evaluation.find({
      candidateId: id
    }).select('sessionId overallScore status evaluatedAt');
    
    // Create a map of session evaluations
    const evaluationMap = {};
    evaluations.forEach(eval => {
      if (eval.sessionId) {
        evaluationMap[eval.sessionId.toString()] = {
          score: eval.overallScore,
          status: eval.status,
          evaluatedAt: eval.evaluatedAt
        };
      }
    });
    
    // Transform sessions with evaluation data
    const sessionsWithEvaluation = sessions.map(session => {
      const evalData = evaluationMap[session._id.toString()] || {};
      
      return {
        id: session._id,
        examCode: session.examCode,
        questionPaper: session.questionPaperId ? {
          title: session.questionPaperId.title,
          jobRole: session.questionPaperId.jobRole,
          experience: session.questionPaperId.experience
        } : null,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        status: session.status,
        score: evalData.score || null,
        evaluationStatus: evalData.status || 'pending',
        evaluatedAt: evalData.evaluatedAt
      };
    });
    
    return res.status(200).json({
      success: true,
      data: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        mobile: candidate.mobile,
        createdAt: candidate.createdAt,
        examSessions: sessionsWithEvaluation,
        totalExams: sessions.length,
        completedExams: sessions.filter(s => s.status === 'completed').length
      }
    });

  } catch (error) {
    console.error('Get candidate by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching candidate',
      error: error.message
    });
  }
};

module.exports = verifyToken(handler);
