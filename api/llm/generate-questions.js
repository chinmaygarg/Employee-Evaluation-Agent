const connectDB = require('../_utils/db');
const { verifyToken } = require('../_utils/auth');
const llmService = require('../../backend/src/services/llm.service');
const QuestionBank = require('../../backend/src/models/questionBank.model');

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
    
    const { 
      title, 
      jobRole, 
      skills, 
      experience, 
      sections, 
      duration,
      questionType = 'mixed',
      objectivePercentage = 50
    } = req.body;
    
    // Validate required fields
    if (!title || !jobRole || !skills || !experience || !sections || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    console.log('Generating questions for:', { title, jobRole, experience });
    
    // Generate questions using LLM
    const { questions, prompt, rawResponse } = await llmService.generateQuestionPaper({
      title,
      jobRole,
      skills,
      experience,
      sections,
      duration,
      questionType,
      objectivePercentage
    });
    
    // Add questions to question bank
    const questionsForBank = [];
    
    questions.sections.forEach(section => {
      section.questions.forEach(question => {
        questionsForBank.push({
          question: question.text,
          type: question.type,
          options: question.options || [],
          expectedAnswer: question.expectedAnswer || question.correctAnswer || '',
          difficulty: 'medium',
          jobRole,
          skillTag: question.skillTag,
          experience,
          usageCount: 0
        });
      });
    });
    
    if (questionsForBank.length > 0) {
      await QuestionBank.insertMany(questionsForBank);
    }
    
    return res.status(200).json({
      success: true,
      data: {
        questions,
        prompt,
        totalQuestions: questions.sections.reduce((sum, s) => sum + s.questions.length, 0)
      }
    });

  } catch (error) {
    console.error('Generate questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating questions',
      error: error.message
    });
  }
};

module.exports = verifyToken(handler);
