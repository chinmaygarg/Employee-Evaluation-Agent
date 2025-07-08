const connectDB = require('../../_utils/db');
const { verifyToken } = require('../../_utils/auth');
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

    const { search, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
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
    
    // Get exam count for each candidate
    const candidatesWithExamCount = await Promise.all(
      candidates.map(async (candidate) => {
        const examCount = await ExamSession.countDocuments({ candidateId: candidate._id });
        
        return {
          id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          mobile: candidate.mobile,
          examCount,
          lastExamDate: candidate.lastExamDate,
          createdAt: candidate.createdAt
        };
      })
    );
    
    return res.status(200).json({
      success: true,
      data: {
        candidates: candidatesWithExamCount,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching candidates',
      error: error.message
    });
  }
};

module.exports = verifyToken(handler);
