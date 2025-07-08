const connectDB = require('../../_utils/db');
const ExamSession = require('../../../backend/src/models/examSession.model');
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
    
    const { sessionId } = req.query;
    const { forCompletion } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
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
    
    // Check if session is active (unless forCompletion flag is set)
    if (!forCompletion && examSession.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Exam session is no longer active'
      });
    }
    
    // Get question paper
    const questionPaper = await QuestionPaper.findById(examSession.questionPaperId)
      .select('-prompt -llmPrompt -llmResponse');
    
    if (!questionPaper) {
      return res.status(404).json({
        success: false,
        message: 'Question paper not found'
      });
    }
    
    // Calculate remaining time
    const elapsedTime = Math.floor((new Date() - examSession.startTime) / 1000 / 60);
    const remainingTime = Math.max(0, examSession.duration - elapsedTime);
    
    // Format response
    const response = {
      title: questionPaper.title,
      jobRole: questionPaper.jobRole,
      duration: examSession.duration,
      remainingTime,
      sections: questionPaper.sections.map(section => ({
        id: section._id,
        title: section.title,
        description: section.description,
        questions: section.questions.map(question => ({
          id: question._id,
          text: question.text,
          type: question.type,
          options: question.options || [],
          marks: question.marks
        }))
      }))
    };
    
    return res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Get exam question paper error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching question paper',
      error: error.message
    });
  }
};
