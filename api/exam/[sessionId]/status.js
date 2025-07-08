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

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Find session
    const session = await ExamSession.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Exam session not found'
      });
    }
    
    // Calculate remaining time if session is active
    let remainingTime = 0;
    
    if (session.status === 'active') {
      const endTime = new Date(session.startTime.getTime() + session.duration * 60000);
      remainingTime = Math.max(0, (endTime - new Date()) / 1000);
    }
    
    return res.status(200).json({
      success: true,
      data: {
        status: session.status,
        examCode: session.examCode,
        startTime: session.startTime,
        endTime: session.endTime,
        submittedAt: session.endTime,
        duration: session.duration,
        remainingTime,
        isAutoSubmitted: session.isAutoSubmitted || false
      }
    });

  } catch (error) {
    console.error('Get session status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching session status',
      error: error.message
    });
  }
};
