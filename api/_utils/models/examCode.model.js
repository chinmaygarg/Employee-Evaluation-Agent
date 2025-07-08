const mongoose = require('mongoose');

const examCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    questionPaperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionPaper',
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      default: null,
    },
    examSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamSession',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null, // Optional expiry date for codes
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
examCodeSchema.index({ code: 1 });
examCodeSchema.index({ questionPaperId: 1, isUsed: 1 });
examCodeSchema.index({ isActive: 1, isUsed: 1 });
examCodeSchema.index({ createdAt: -1 });

// Method to mark as used
examCodeSchema.methods.markAsUsed = function (candidateId, examSessionId) {
  this.isUsed = true;
  this.usedAt = new Date();
  this.usedBy = candidateId;
  this.examSession = examSessionId;
  
  return this.save();
};

// Static method to generate unique exam code
examCodeSchema.statics.generateCode = function () {
  const prefix = 'SLX';
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  
  return `${prefix}-${randomPart}-${timestamp}`;
};

// Static method to find available code for question paper
examCodeSchema.statics.findAvailableCode = function (questionPaperId) {
  return this.findOne({
    questionPaperId,
    isUsed: false,
    isActive: true,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  });
};

const ExamCode = mongoose.models.ExamCode || mongoose.model('ExamCode', examCodeSchema);

module.exports = ExamCode;
