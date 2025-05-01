const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    examCode: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'evaluated'],
      default: 'in-progress',
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    sessions: {
      type: [sessionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for email and mobile
candidateSchema.index({ email: 1, mobile: 1 });
candidateSchema.index({ 'sessions.examCode': 1 });

// Method to check if candidate already has a session for an exam
candidateSchema.methods.hasActiveSession = function (examCode) {
  return this.sessions.some(
    (session) => 
      session.examCode === examCode && 
      session.status === 'in-progress'
  );
};

// Static method to find or create a candidate
candidateSchema.statics.findOrCreate = async function (candidateData) {
  try {
    let candidate = await this.findOne({ 
      email: candidateData.email,
      mobile: candidateData.mobile
    });
    
    if (!candidate) {
      candidate = await this.create(candidateData);
    }
    
    return candidate;
  } catch (error) {
    throw new Error(`Error finding or creating candidate: ${error.message}`);
  }
};

const Candidate = mongoose.model('Candidate', candidateSchema);

module.exports = Candidate;
