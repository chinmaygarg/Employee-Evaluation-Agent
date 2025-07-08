const connectDB = require('../../_utils/db');
const { verifyToken } = require('../../_utils/auth');
const ExamCode = require('../../../backend/src/models/examCode.model');

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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { questionPaperId, count = 1, expiresIn } = req.body;
    
    if (!questionPaperId) {
      return res.status(400).json({
        success: false,
        message: 'Question paper ID is required'
      });
    }

    const examCodes = [];
    let expiresAt = null;
    
    if (expiresIn) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn));
    }
    
    // Generate requested number of exam codes
    for (let i = 0; i < count; i++) {
      const examCode = new ExamCode({
        code: ExamCode.generateCode(),
        questionPaperId,
        createdBy: req.user.id,
        expiresAt
      });
      
      await examCode.save();
      examCodes.push(examCode);
    }
    
    return res.status(201).json({
      success: true,
      message: `Generated ${count} exam code(s) successfully`,
      data: examCodes
    });

  } catch (error) {
    console.error('Generate exam codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating exam codes',
      error: error.message
    });
  }
};

module.exports = verifyToken(handler);
