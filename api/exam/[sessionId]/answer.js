const connectDB = require('../../_utils/db');
const ExamSession = require('../../../backend/src/models/examSession.model');

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
    
    const { sessionId } = req.query;
    const { questionId, sectionId, answer } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    if (!questionId || !sectionId) {
      return res.status(400).json({
        success: false,
        message: 'Question ID and Section ID are required'
      });
    }

    // Find exam session
    const examSession = await ExamSession.findOne({ sessionId });
    
    if (!examSession) {
      return res.status(404).json({
        success: false,
        message: 'Exam session not found'
      });
    }
    
    // Check if session is active
    if (examSession.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Exam session is no longer active'
      });
    }
    
    // Check if time is up
    const elapsedTime = Math.floor((new Date() - examSession.startTime) / 1000 / 60);
    if (elapsedTime > examSession.duration) {
      examSession.status = 'completed';
      examSession.endTime = new Date();
      await examSession.save();
      
      return res.status(400).json({
        success: false,
        message: 'Exam time has expired'
      });
    }
    
    // Find existing answer
    const existingAnswerIndex = examSession.answers.findIndex(
      a => a.questionId.toString() === questionId && a.sectionId.toString() === sectionId
    );
    
    if (existingAnswerIndex >= 0) {
      // Update existing answer
      examSession.answers[existingAnswerIndex].answer = answer;
      examSession.answers[existingAnswerIndex].updatedAt = new Date();
    } else {
      // Add new answer
      examSession.answers.push({
        questionId,
        sectionId,
        answer,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Save session
    await examSession.save();
    
    return res.status(200).json({
      success: true,
      message: 'Answer saved successfully'
    });

  } catch (error) {
    console.error('Save answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving answer',
      error: error.message
    });
  }
};
