const QuestionPaper = require('../models/questionPaper.model');
const QuestionBank = require('../models/questionBank.model');
const { asyncHandler } = require('../middleware/error.middleware');
const { generateExamCode } = require('../utils/code-generator');
const llmService = require('../services/llm.service');
const logger = require('../config/logger');
const { generateText } = require('../config/llm');

/**
 * @desc    Create question paper with LLM generation
 * @route   POST /api/admin/question-papers
 * @access  Private
 */
const createQuestionPaper = asyncHandler(async (req, res) => {
  const { title, jobRole, skills, experience, duration, sections } = req.body;
  
  // Generate a unique exam code
  const examCode = generateExamCode(jobRole);
  
  // Generate questions using LLM
  const { questions, prompt, rawResponse } = await llmService.generateQuestionPaper({
    title,
    jobRole,
    skills,
    experience,
    sections,
    duration,
  });
  
  // Create question paper
  const questionPaper = new QuestionPaper({
    examCode,
    title,
    jobRole,
    skills,
    experience,
    duration,
    sections: questions.sections,
    createdBy: req.user._id,
    prompt,
  });
  
  // Save question paper
  await questionPaper.save();
  
  // Add questions to question bank
  const questionsForBank = [];
  
  questionPaper.sections.forEach(section => {
    section.questions.forEach(question => {
      questionsForBank.push({
        question: question.text,
        type: question.type,
        options: question.options || [],
        expectedAnswer: question.expectedAnswer || '',
        difficulty: 'medium', // Default difficulty
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
    logger.info(`Added ${questionsForBank.length} questions to question bank`);
  }
  
  logger.info(`Created question paper: ${title} with code ${examCode}`);
  
  res.status(201).json({
    success: true,
    message: 'Question paper created successfully',
    data: {
      id: questionPaper._id,
      examCode,
      title,
      totalQuestions: questionPaper.getTotalQuestions(),
      totalMarks: questionPaper.getTotalMarks(),
    },
  });
});

/**
 * @desc    Get all question papers
 * @route   GET /api/admin/question-papers
 * @access  Private
 */
const getAllQuestionPapers = asyncHandler(async (req, res) => {
  // Parse query parameters
  const { search, jobRole, experience, page = 1, limit = 10 } = req.query;
  
  // Build query
  const query = {};
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { examCode: { $regex: search, $options: 'i' } },
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
  
  res.status(200).json({
    success: true,
    data: {
      questionPapers: questionPapers.map(paper => ({
        id: paper._id,
        examCode: paper.examCode,
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
});

/**
 * @desc    Get question paper by ID
 * @route   GET /api/admin/question-papers/:id
 * @access  Private
 */
const getQuestionPaperById = asyncHandler(async (req, res) => {
  const questionPaper = await QuestionPaper.findById(req.params.id)
    .populate('createdBy', 'name email');
  
  if (!questionPaper) {
    return res.status(404).json({
      success: false,
      message: 'Question paper not found',
    });
  }
  
  res.status(200).json({
    success: true,
    data: questionPaper,
  });
});

/**
 * @desc    Get question paper by exam code
 * @route   GET /api/admin/question-papers/code/:examCode
 * @access  Private
 */
const getQuestionPaperByExamCode = asyncHandler(async (req, res) => {
  const questionPaper = await QuestionPaper.findOne({ examCode: req.params.examCode })
    .populate('createdBy', 'name email');
  
  if (!questionPaper) {
    return res.status(404).json({
      success: false,
      message: 'Question paper not found',
    });
  }
  
  res.status(200).json({
    success: true,
    data: questionPaper,
  });
});

/**
 * @desc    Update question paper
 * @route   PUT /api/admin/question-papers/:id
 * @access  Private
 */
const updateQuestionPaper = asyncHandler(async (req, res) => {
  const { title, isActive } = req.body;
  
  const questionPaper = await QuestionPaper.findById(req.params.id);
  
  if (!questionPaper) {
    return res.status(404).json({
      success: false,
      message: 'Question paper not found',
    });
  }
  
  // Update fields
  if (title) questionPaper.title = title;
  if (isActive !== undefined) questionPaper.isActive = isActive;
  
  // Save changes
  await questionPaper.save();
  
  logger.info(`Updated question paper: ${questionPaper._id}`);
  
  res.status(200).json({
    success: true,
    message: 'Question paper updated successfully',
    data: {
      id: questionPaper._id,
      title: questionPaper.title,
      isActive: questionPaper.isActive,
    },
  });
});

/**
 * @desc    Add question to section
 * @route   POST /api/admin/question-papers/:id/questions
 * @access  Private
 */
const addQuestionToSection = asyncHandler(async (req, res) => {
  const { sectionId, text, type, options, expectedAnswer, marks, skillTag } = req.body;
  
  const questionPaper = await QuestionPaper.findById(req.params.id);
  
  if (!questionPaper) {
    return res.status(404).json({
      success: false,
      message: 'Question paper not found',
    });
  }
  
  // Find the section
  const section = questionPaper.sections.id(sectionId);
  
  if (!section) {
    return res.status(404).json({
      success: false,
      message: 'Section not found',
    });
  }
  
  // Create new question
  const newQuestion = {
    text,
    type,
    options: type === 'mcq' ? options : [],
    expectedAnswer: expectedAnswer || '',
    marks,
    skillTag,
  };
  
  // Add question to section
  section.questions.push(newQuestion);
  
  // Save changes
  await questionPaper.save();
  
  // Add to question bank
  await QuestionBank.create({
    question: text,
    type,
    options: type === 'mcq' ? options : [],
    expectedAnswer: expectedAnswer || '',
    difficulty: 'medium', // Default difficulty
    jobRole: questionPaper.jobRole,
    skillTag,
    experience: questionPaper.experience,
    createdFrom: questionPaper._id,
    usageCount: 1,
  });
  
  logger.info(`Added question to section ${sectionId} in paper ${questionPaper._id}`);
  
  res.status(201).json({
    success: true,
    message: 'Question added successfully',
    data: {
      questionId: section.questions[section.questions.length - 1]._id,
      sectionId,
    },
  });
});

/**
 * @desc    Remove question from section
 * @route   DELETE /api/admin/question-papers/:id/questions/:questionId
 * @access  Private
 */
const removeQuestionFromSection = asyncHandler(async (req, res) => {
  const { id, questionId } = req.params;
  
  const questionPaper = await QuestionPaper.findById(id);
  
  if (!questionPaper) {
    return res.status(404).json({
      success: false,
      message: 'Question paper not found',
    });
  }
  
  // Find the section containing the question
  let questionFound = false;
  
  questionPaper.sections.forEach(section => {
    const questionIndex = section.questions.findIndex(
      q => q._id.toString() === questionId
    );
    
    if (questionIndex >= 0) {
      section.questions.splice(questionIndex, 1);
      questionFound = true;
    }
  });
  
  if (!questionFound) {
    return res.status(404).json({
      success: false,
      message: 'Question not found',
    });
  }
  
  // Save changes
  await questionPaper.save();
  
  logger.info(`Removed question ${questionId} from paper ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'Question removed successfully',
  });
});

/**
 * @desc    Add new section
 * @route   POST /api/admin/question-papers/:id/sections
 * @access  Private
 */
const addSection = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  
  const questionPaper = await QuestionPaper.findById(req.params.id);
  
  if (!questionPaper) {
    return res.status(404).json({
      success: false,
      message: 'Question paper not found',
    });
  }
  
  // Create new section
  const newSection = {
    title,
    description: description || '',
    questions: [],
  };
  
  // Add section
  questionPaper.sections.push(newSection);
  
  // Save changes
  await questionPaper.save();
  
  logger.info(`Added section to paper ${questionPaper._id}`);
  
  res.status(201).json({
    success: true,
    message: 'Section added successfully',
    data: {
      sectionId: questionPaper.sections[questionPaper.sections.length - 1]._id,
    },
  });
});

/**
 * @desc    Remove section
 * @route   DELETE /api/admin/question-papers/:id/sections/:sectionId
 * @access  Private
 */
const removeSection = asyncHandler(async (req, res) => {
  const { id, sectionId } = req.params;
  
  const questionPaper = await QuestionPaper.findById(id);
  
  if (!questionPaper) {
    return res.status(404).json({
      success: false,
      message: 'Question paper not found',
    });
  }
  
  // Find section index
  const sectionIndex = questionPaper.sections.findIndex(
    s => s._id.toString() === sectionId
  );
  
  if (sectionIndex < 0) {
    return res.status(404).json({
      success: false,
      message: 'Section not found',
    });
  }
  
  // Remove section
  questionPaper.sections.splice(sectionIndex, 1);
  
  // Save changes
  await questionPaper.save();
  
  logger.info(`Removed section ${sectionId} from paper ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'Section removed successfully',
  });
});

/**
 * @desc    Regenerate questions for a section
 * @route   POST /api/admin/question-papers/:id/sections/:sectionId/regenerate
 * @access  Private
 */
const regenerateSectionQuestions = asyncHandler(async (req, res) => {
  const { id, sectionId } = req.params;
  const { count = 5 } = req.body;
  
  const questionPaper = await QuestionPaper.findById(id);
  
  if (!questionPaper) {
    return res.status(404).json({
      success: false,
      message: 'Question paper not found',
    });
  }
  
  // Find section
  const section = questionPaper.sections.id(sectionId);
  
  if (!section) {
    return res.status(404).json({
      success: false,
      message: 'Section not found',
    });
  }
  
  // Generate new questions using LLM
  const prompt = `
Generate ${count} questions for a ${questionPaper.jobRole} exam. The questions should be related to the section "${section.title}".
Experience level: ${questionPaper.experience}
Skills: ${questionPaper.skills.join(', ')}

REQUIREMENTS:
1. Create ${count} descriptive questions.
2. Each question should test practical knowledge.
3. Include a variety of difficulty levels appropriate for the experience level.
4. For each question, provide an expected answer or evaluation criteria.
5. Ensure questions are unique and not repetitive.
6. Assign appropriate marks to each question (1-10 points).
7. Tag each question with the specific skill being tested.

RESPONSE FORMAT:
Please format your response as a JSON array of questions with the following structure:
[
  {
    "text": "Question text",
    "type": "descriptive",
    "expectedAnswer": "Example of what a good answer should include",
    "marks": 5,
    "skillTag": "specific skill"
  },
  // more questions...
]

Make sure the generated JSON is valid and can be parsed.
`;

  const llmResponse = await generateText(prompt, {
    temperature: 0.7,
    max_tokens: 2000,
  });
  
  // Parse the response
  try {
    const jsonMatch = llmResponse.match(/```json\n([\s\S]*?)\n```/) || 
                      llmResponse.match(/```\n([\s\S]*?)\n```/) ||
                      llmResponse.match(/\[([\s\S]*?)\]/);
    
    let jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : llmResponse;
    
    // Clean up any markdown or unexpected content
    if (jsonStr.indexOf('[') > 0) {
      jsonStr = jsonStr.substring(jsonStr.indexOf('['));
    }
    
    const newQuestions = JSON.parse(jsonStr);
    
    if (!Array.isArray(newQuestions)) {
      throw new Error('Invalid response format: not an array');
    }
    
    // Add new questions to section
    newQuestions.forEach(q => {
      section.questions.push({
        text: q.text,
        type: q.type || 'descriptive',
        expectedAnswer: q.expectedAnswer || '',
        marks: q.marks || 5,
        skillTag: q.skillTag || questionPaper.skills[0],
      });
    });
    
    // Save changes
    await questionPaper.save();
    
    // Add to question bank
    const questionsForBank = newQuestions.map(q => ({
      question: q.text,
      type: q.type || 'descriptive',
      options: [],
      expectedAnswer: q.expectedAnswer || '',
      difficulty: 'medium',
      jobRole: questionPaper.jobRole,
      skillTag: q.skillTag || questionPaper.skills[0],
      experience: questionPaper.experience,
      createdFrom: questionPaper._id,
      usageCount: 1,
    }));
    
    await QuestionBank.insertMany(questionsForBank);
    
    logger.info(`Regenerated ${newQuestions.length} questions for section ${sectionId}`);
    
    res.status(200).json({
      success: true,
      message: `Generated ${newQuestions.length} new questions`,
      data: {
        count: newQuestions.length,
      },
    });
  } catch (error) {
    logger.error(`Failed to parse generated questions: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate questions',
      error: error.message,
    });
  }
});

module.exports = {
  createQuestionPaper,
  getAllQuestionPapers,
  getQuestionPaperById,
  getQuestionPaperByExamCode,
  updateQuestionPaper,
  addQuestionToSection,
  removeQuestionFromSection,
  addSection,
  removeSection,
  regenerateSectionQuestions,
};
