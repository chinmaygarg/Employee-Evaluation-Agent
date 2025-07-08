const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'descriptive', 
        'mcq', 
        'true_false', 
        'fill_blank', 
        'matching', 
        'coding',
        'essay',
        'short_answer',
        'problem_solving',
        'code_explanation',
        'case_study',
        'design'
      ],
      default: 'descriptive',
    },
    options: {
      type: [String],
      default: [],
    },
    expectedAnswer: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    jobRole: {
      type: String,
      required: true,
      trim: true,
    },
    skillTag: {
      type: String,
      required: true,
      trim: true,
    },
    experience: {
      type: String,
      required: true,
      enum: ['entry', 'mid', 'senior'],
    },
    createdFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionPaper',
      default: null,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
questionBankSchema.index({ jobRole: 1, skillTag: 1, experience: 1 });
questionBankSchema.index({ difficulty: 1, skillTag: 1 });

// Method to check for similar questions
questionBankSchema.statics.findSimilar = async function (questionText, threshold = 0.8) {
  // This is a placeholder for a more sophisticated similarity check
  // In a real implementation, we would use a vector database or text similarity algorithm
  // For now, we just do a simple case-insensitive substring check
  
  const regex = new RegExp(
    questionText
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
      .replace(/\s+/g, '\\s+'), // Normalize whitespace
    'i'
  );
  
  return await this.find({ question: regex });
};

// Method to increment usage count
questionBankSchema.methods.incrementUsage = function () {
  this.usageCount += 1;
  return this.save();
};

const QuestionBank = mongoose.models.QuestionBank || mongoose.model('QuestionBank', questionBankSchema);

module.exports = QuestionBank;
