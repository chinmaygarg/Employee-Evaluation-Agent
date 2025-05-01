const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    answer: {
      type: String,
      default: '',
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);

const examSessionSchema = new mongoose.Schema(
  {
    examCode: {
      type: String,
      required: true,
      trim: true,
    },
    questionPaperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionPaper',
      required: true,
    },
    candidate: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      mobile: {
        type: String,
        required: true,
      },
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number, // Duration in minutes
      required: true,
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'evaluated'],
      default: 'in-progress',
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    evaluatedAt: {
      type: Date,
      default: null,
    },
    isAutoSubmitted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
examSessionSchema.index({ examCode: 1, 'candidate._id': 1 });
examSessionSchema.index({ status: 1, examCode: 1 });
examSessionSchema.index({ startTime: -1 });

// Method to save an answer
examSessionSchema.methods.saveAnswer = function (questionId, sectionId, answerText) {
  const existingAnswerIndex = this.answers.findIndex(
    (a) => a.questionId.toString() === questionId.toString()
  );
  
  if (existingAnswerIndex >= 0) {
    this.answers[existingAnswerIndex].answer = answerText;
    this.answers[existingAnswerIndex].savedAt = new Date();
  } else {
    this.answers.push({
      questionId,
      sectionId,
      answer: answerText,
      savedAt: new Date(),
    });
  }
  
  return this.save();
};

// Method to submit the exam
examSessionSchema.methods.submit = function (isAutoSubmitted = false) {
  this.status = 'completed';
  this.endTime = new Date();
  this.submittedAt = new Date();
  this.isAutoSubmitted = isAutoSubmitted;
  
  return this.save();
};

// Method to get unanswered questions
examSessionSchema.methods.getUnansweredQuestions = async function () {
  const questionPaper = await mongoose.model('QuestionPaper').findById(this.questionPaperId);
  
  if (!questionPaper) {
    throw new Error('Question paper not found');
  }
  
  const answeredQuestionIds = this.answers.map(answer => answer.questionId.toString());
  const unanswered = [];
  
  questionPaper.sections.forEach(section => {
    section.questions.forEach(question => {
      if (!answeredQuestionIds.includes(question._id.toString())) {
        unanswered.push({
          questionId: question._id,
          sectionId: section._id,
          questionText: question.text.substring(0, 50) + '...',
        });
      }
    });
  });
  
  return unanswered;
};

const ExamSession = mongoose.model('ExamSession', examSessionSchema);

module.exports = ExamSession;
