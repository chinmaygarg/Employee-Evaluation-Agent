const connectDB = require('../../../_utils/db');
const { verifyToken } = require('../../../_utils/auth');
const ExamCode = require('../../../../backend/src/models/examCode.model');

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
    
    const { questionPaperId } = req.query;
    
    if (!questionPaperId) {
      return res.status(400).json({
        success: false,
        message: 'Question paper ID is required'
      });
    }

    const examCodes = await ExamCode.find({ 
      questionPaperId,
      isActive: true 
    }).sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      data: examCodes
    });

  } catch (error) {
    console.error('Get exam codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exam codes',
      error: error.message
    });
  }
};

module.exports = verifyToken(handler);
