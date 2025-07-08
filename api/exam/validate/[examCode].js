const connectDB = require('../../_utils/db');
const ExamCode = require('../../../backend/src/models/examCode.model');
const QuestionPaper = require('../../../backend/src/models/questionPaper.model');

module.exports = async (req, res) => {
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
    
    const { examCode } = req.query;
    
    if (!examCode) {
      return res.status(400).json({
        success: false,
        message: 'Exam code is required'
      });
    }

    // Find the exam code
    const examCodeDoc = await ExamCode.findOne({ 
      code: examCode,
      isActive: true 
    });
    
    if (!examCodeDoc) {
      return res.status(404).json({
        success: false,
        message: 'Invalid exam code'
      });
    }
    
    // Check if already used
    if (examCodeDoc.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'This exam code has already been used'
      });
    }
    
    // Check expiry
    if (examCodeDoc.expiresAt && new Date(examCodeDoc.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This exam code has expired'
      });
    }
    
    // Get question paper details
    const questionPaper = await QuestionPaper.findById(examCodeDoc.questionPaperId)
      .select('title jobRole duration experience');
    
    if (!questionPaper) {
      return res.status(404).json({
        success: false,
        message: 'Question paper not found for this exam code'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        examCode,
        title: questionPaper.title,
        jobRole: questionPaper.jobRole,
        duration: questionPaper.duration,
        experience: questionPaper.experience
      }
    });

  } catch (error) {
    console.error('Validate exam code error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating exam code',
      error: error.message
    });
  }
};
