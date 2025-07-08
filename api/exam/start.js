const connectDB = require('../_utils/db');
const ExamCode = require('../../backend/src/models/examCode.model');
const QuestionPaper = require('../../backend/src/models/questionPaper.model');
const Candidate = require('../../backend/src/models/candidate.model');
const ExamSession = require('../../backend/src/models/examSession.model');
const { v4: uuidv4 } = require('uuid');

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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { examCode, name, email, mobile } = req.body;
    
    // Validate input
    if (!examCode || !name || !email || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Find and validate exam code
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
    
    // Get question paper
    const questionPaper = await QuestionPaper.findById(examCodeDoc.questionPaperId);
    
    if (!questionPaper || !questionPaper.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Question paper not found or inactive'
      });
    }
    
    // Find or create candidate
    let candidate = await Candidate.findOne({ email });
    
    if (!candidate) {
      candidate = new Candidate({
        name,
        email,
        mobile
      });
      await candidate.save();
    } else {
      // Update candidate info if needed
      if (candidate.name !== name || candidate.mobile !== mobile) {
        candidate.name = name;
        candidate.mobile = mobile;
        await candidate.save();
      }
    }
    
    // Check for existing active session
    const existingSession = await ExamSession.findOne({
      candidateId: candidate._id,
      questionPaperId: questionPaper._id,
      status: 'active'
    });
    
    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active session for this exam'
      });
    }
    
    // Create exam session
    const sessionId = uuidv4();
    const examSession = new ExamSession({
      sessionId,
      candidateId: candidate._id,
      examCode,
      questionPaperId: questionPaper._id,
      startTime: new Date(),
      duration: questionPaper.duration,
      status: 'active',
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    
    await examSession.save();
    
    // Mark exam code as used
    await examCodeDoc.markAsUsed(candidate._id, examSession._id);
    
    // Update candidate's last exam date
    candidate.lastExamDate = new Date();
    await candidate.save();
    
    return res.status(200).json({
      success: true,
      message: 'Exam session started successfully',
      data: {
        sessionId: examSession.sessionId,
        duration: questionPaper.duration,
        startTime: examSession.startTime,
        candidateName: candidate.name
      }
    });

  } catch (error) {
    console.error('Start exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting exam',
      error: error.message
    });
  }
};
