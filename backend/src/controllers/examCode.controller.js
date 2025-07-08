const mongoose = require('mongoose');
const ExamCode = require('../models/examCode.model');
const QuestionPaper = require('../models/questionPaper.model');
const { asyncHandler } = require('../middleware/error.middleware');

/**
 * Generate new exam codes for a question paper
 */
const generateExamCodes = asyncHandler(async (req, res) => {
  const { questionPaperId } = req.params;
  const { count = 1, expiresAt } = req.body;
  
  // Validate question paper exists
  const questionPaper = await QuestionPaper.findById(questionPaperId);
  if (!questionPaper) {
    return res.status(404).json({
      success: false,
      message: 'Question paper not found',
    });
  }
  
  // Generate exam codes
  const examCodes = [];
  for (let i = 0; i < count; i++) {
    let code;
    let isUnique = false;
    let attempts = 0;
    
    // Ensure unique code generation
    while (!isUnique && attempts < 10) {
      code = ExamCode.generateCode();
      const existingCode = await ExamCode.findOne({ code });
      if (!existingCode) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate unique exam code',
      });
    }
    
    const examCode = new ExamCode({
      code,
      questionPaperId,
      createdBy: req.user._id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
    
    await examCode.save();
    examCodes.push(examCode);
  }
  
  res.status(201).json({
    success: true,
    message: `Generated ${count} exam code(s) successfully`,
    data: {
      examCodes,
      questionPaper: {
        id: questionPaper._id,
        title: questionPaper.title,
        jobRole: questionPaper.jobRole,
      },
    },
  });
});

/**
 * Get all exam codes for a question paper
 */
const getExamCodes = asyncHandler(async (req, res) => {
  const { questionPaperId } = req.params;
  const { status, page = 1, limit = 10 } = req.query;
  
  // Build filter
  const filter = { questionPaperId, isActive: true };
  if (status === 'used') {
    filter.isUsed = true;
  } else if (status === 'available') {
    filter.isUsed = false;
  }
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Get exam codes with pagination
  const examCodes = await ExamCode.find(filter)
    .populate('usedBy', 'name email mobile')
    .populate('examSession', 'startTime endTime status submittedAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await ExamCode.countDocuments(filter);
  
  // Get question paper details
  const questionPaper = await QuestionPaper.findById(questionPaperId);
  if (!questionPaper) {
    return res.status(404).json({
      success: false,
      message: 'Question paper not found',
    });
  }
  
  res.status(200).json({
    success: true,
    data: {
      examCodes,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: examCodes.length,
        totalRecords: total,
      },
      questionPaper: {
        id: questionPaper._id,
        title: questionPaper.title,
        jobRole: questionPaper.jobRole,
        skills: questionPaper.skills,
        experience: questionPaper.experience,
        duration: questionPaper.duration,
      },
    },
  });
});

/**
 * Get statistics for exam codes
 */
const getExamCodeStats = asyncHandler(async (req, res) => {
  const { questionPaperId } = req.params;
  
  const stats = await ExamCode.aggregate([
    { $match: { questionPaperId: new mongoose.Types.ObjectId(questionPaperId), isActive: true } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        used: { $sum: { $cond: ['$isUsed', 1, 0] } },
        available: { $sum: { $cond: ['$isUsed', 0, 1] } },
        expired: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$expiresAt', null] },
                  { $lt: ['$expiresAt', new Date()] },
                  { $eq: ['$isUsed', false] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
  
  const result = stats[0] || { total: 0, used: 0, available: 0, expired: 0 };
  
  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Deactivate an exam code
 */
const deactivateExamCode = asyncHandler(async (req, res) => {
  const { codeId } = req.params;
  
  const examCode = await ExamCode.findById(codeId);
  if (!examCode) {
    return res.status(404).json({
      success: false,
      message: 'Exam code not found',
    });
  }
  
  if (examCode.isUsed) {
    return res.status(400).json({
      success: false,
      message: 'Cannot deactivate a used exam code',
    });
  }
  
  examCode.isActive = false;
  await examCode.save();
  
  res.status(200).json({
    success: true,
    message: 'Exam code deactivated successfully',
    data: examCode,
  });
});

/**
 * Get exam code details by code
 */
const getExamCodeByCode = asyncHandler(async (req, res) => {
  const { code } = req.params;
  
  const examCode = await ExamCode.findOne({ code, isActive: true })
    .populate('questionPaperId')
    .populate('usedBy', 'name email mobile')
    .populate('examSession', 'startTime endTime status submittedAt');
  
  if (!examCode) {
    return res.status(404).json({
      success: false,
      message: 'Exam code not found or inactive',
    });
  }
  
  res.status(200).json({
    success: true,
    data: examCode,
  });
});

module.exports = {
  generateExamCodes,
  getExamCodes,
  getExamCodeStats,
  deactivateExamCode,
  getExamCodeByCode,
};
