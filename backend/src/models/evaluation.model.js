const mongoose = require('mongoose');

const sectionScoreSchema = new mongoose.Schema(
  {
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    sectionTitle: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    maxScore: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);

const questionEvaluationSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      default: '',
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    maxScore: {
      type: Number,
      required: true,
      min: 1,
    },
    feedback: {
      type: String,
      default: '',
    },
    relevance: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    completion: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);

const evaluationSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamSession',
      required: true,
      unique: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    questionPaperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionPaper',
      required: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    sectionScores: {
      type: [sectionScoreSchema],
      required: true,
      validate: [(val) => val.length > 0, 'At least one section score is required'],
    },
    questionEvaluations: {
      type: [questionEvaluationSchema],
      required: true,
      validate: [(val) => val.length > 0, 'At least one question evaluation is required'],
    },
    summary: {
      type: String,
      required: true,
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    evaluatedAt: {
      type: Date,
      default: Date.now,
    },
    sentToAdmin: {
      type: Boolean,
      default: false,
    },
    reportUrl: {
      type: String,
      default: '',
    },
    llmPrompt: {
      type: String,
      default: '',
    },
    llmResponse: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
evaluationSchema.index({ sessionId: 1 });
evaluationSchema.index({ candidateId: 1 });
evaluationSchema.index({ overallScore: -1 });

// Method to generate a PDF report
evaluationSchema.methods.generateReport = async function () {
  // Implementation of PDF generation will be in a separate service
  // This is just a placeholder
  return `report-${this._id}.pdf`;
};

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

module.exports = Evaluation;
