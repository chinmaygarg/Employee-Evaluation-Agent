const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    text: {
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
    marks: {
      type: Number,
      required: true,
      default: 1,
    },
    skillTag: {
      type: String,
      required: true,
    },
  },
  {
    _id: true,
    timestamps: false,
  }
);

const sectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    questions: {
      type: [questionSchema],
      required: true,
      validate: [(val) => val.length > 0, 'At least one question is required'],
    },
  },
  {
    _id: true,
    timestamps: false,
  }
);

const questionPaperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    jobRole: {
      type: String,
      required: true,
      trim: true,
    },
    skills: {
      type: [String],
      required: true,
      validate: [(val) => val.length > 0, 'At least one skill is required'],
    },
    experience: {
      type: String,
      required: true,
      enum: ['entry', 'mid', 'senior'],
    },
    duration: {
      type: Number,
      required: true,
      min: 10, // Minimum 10 minutes
      max: 240, // Maximum 4 hours
    },
    questionType: {
      type: String,
      enum: ['objective', 'subjective', 'mixed'],
      default: 'mixed',
    },
    objectivePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    sections: {
      type: [sectionSchema],
      required: true,
      validate: [(val) => val.length > 0, 'At least one section is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    prompt: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Create compound indexes for searching
questionPaperSchema.index({ jobRole: 1, skills: 1, experience: 1 });
questionPaperSchema.index({ createdAt: -1 });

// Method to get total questions
questionPaperSchema.methods.getTotalQuestions = function () {
  return this.sections.reduce((total, section) => total + section.questions.length, 0);
};

// Method to get total marks
questionPaperSchema.methods.getTotalMarks = function () {
  return this.sections.reduce((total, section) => {
    return total + section.questions.reduce((sectionTotal, question) => {
      return sectionTotal + question.marks;
    }, 0);
  }, 0);
};

const QuestionPaper = mongoose.model('QuestionPaper', questionPaperSchema);

module.exports = QuestionPaper;
