const connectDB = require('../../_utils/db');
const { verifyToken } = require('../../_utils/auth');
const QuestionPaper = require('../../../backend/src/models/questionPaper.model');
const QuestionBank = require('../../../backend/src/models/questionBank.model');
const ExamCode = require('../../../backend/src/models/examCode.model');
const llmService = require('../../../backend/src/services/llm.service');

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

  try {
    await connectDB();

    // Handle GET - Get all question papers
    if (req.method === 'GET') {
      const { search, jobRole, experience, page = 1, limit = 10 } = req.query;
      
      // Build query
      const query = {};
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { jobRole: { $regex: search, $options: 'i' } },
        ];
      }
      
      if (jobRole) {
        query.jobRole = { $regex: jobRole, $options: 'i' };
      }
      
      if (experience) {
        query.experience = experience;
      }
      
      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Get question papers with pagination
      const questionPapers = await QuestionPaper.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email');
      
      // Get total count
      const total = await QuestionPaper.countDocuments(query);
      
      return res.status(200).json({
        success: true,
        data: {
          questionPapers: questionPapers.map(paper => ({
            id: paper._id,
            title: paper.title,
            jobRole: paper.jobRole,
            skills: paper.skills,
            experience: paper.experience,
            duration: paper.duration,
            totalQuestions: paper.getTotalQuestions(),
            totalMarks: paper.getTotalMarks(),
            createdBy: paper.createdBy,
            createdAt: paper.createdAt,
            isActive: paper.isActive,
          })),
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    }

    // Handle POST - Create new question paper
    if (req.method === 'POST') {
      const { 
        title, 
        jobRole, 
        skills, 
        experience, 
        duration, 
        sections, 
        questionType, 
        objectivePercentage 
      } = req.body;
      
      // Validate sections format and add question counts
      const processedSections = sections.map(section => ({
        title: section.title || section.name,
        description: section.description || `Questions related to ${section.title || section.name}`,
        questionCount: section.questionCount || 5
      }));
      
      console.log(`Generating questions for ${title} with sections:`, processedSections);
      console.log(`Question type: ${questionType}, Objective percentage: ${objectivePercentage}%`);
      
      // Generate questions using LLM
      const { questions, prompt, rawResponse } = await llmService.generateQuestionPaper({
        title,
        jobRole,
        skills,
        experience,
        sections: processedSections,
        duration,
        questionType: questionType || 'mixed',
        objectivePercentage: objectivePercentage || 50,
      });
      
      // Create question paper
      const questionPaper = new QuestionPaper({
        title,
        jobRole,
        skills,
        experience,
        duration,
        questionType: questionType || 'mixed',
        objectivePercentage: objectivePercentage || 50,
        sections: questions.sections.map(section => ({
          title: section.title,
          description: section.description || '',
          questions: section.questions.map(q => ({
            text: q.text,
            type: q.type,
            options: q.options || [],
            expectedAnswer: q.expectedAnswer || q.correctAnswer || '',
            marks: q.marks,
            skillTag: q.skillTag
          }))
        })),
        createdBy: req.user.id,
        prompt,
      });
      
      // Save question paper
      await questionPaper.save();
      
      // Create an initial exam code for this question paper
      const initialExamCode = new ExamCode({
        code: ExamCode.generateCode(),
        questionPaperId: questionPaper._id,
        createdBy: req.user.id,
      });
      
      await initialExamCode.save();
      
      // Add questions to question bank
      const questionsForBank = [];
      
      questionPaper.sections.forEach(section => {
        section.questions.forEach(question => {
          questionsForBank.push({
            question: question.text,
            type: question.type,
            options: question.options || [],
            expectedAnswer: question.expectedAnswer || '',
            difficulty: 'medium',
            jobRole,
            skillTag: question.skillTag,
            experience,
            createdFrom: questionPaper._id,
            usageCount: 1,
          });
        });
      });
      
      // Save questions to bank if there are any
      if (questionsForBank.length > 0) {
        await QuestionBank.insertMany(questionsForBank);
        console.log(`Added ${questionsForBank.length} questions to question bank`);
      }
      
      return res.status(201).json({
        success: true,
        message: 'Question paper created successfully',
        data: {
          id: questionPaper._id,
          title,
          questionType: questionPaper.questionType,
          objectivePercentage: questionPaper.objectivePercentage,
          totalQuestions: questionPaper.getTotalQuestions(),
          totalMarks: questionPaper.getTotalMarks(),
          initialExamCode: initialExamCode.code,
          sections: questionPaper.sections.map(section => ({
            title: section.title,
            questionCount: section.questions.length,
            questionTypes: [...new Set(section.questions.map(q => q.type))]
          }))
        },
      });
    }

    // Method not allowed
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });

  } catch (error) {
    console.error('Question paper error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = verifyToken(handler);
