# Database Schema

The Smart Examination System uses MongoDB for data storage. Below is the schema design for each collection:

## Users (Admins)
```javascript
{
  _id: ObjectId,
  email: String,          // Unique, required
  password: String,       // Hashed, required
  name: String,           // Required
  role: String,           // Default: 'admin'
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

## QuestionPapers
```javascript
{
  _id: ObjectId,
  examCode: String,       // Unique, required
  title: String,          // Required
  jobRole: String,        // Required
  skills: [String],       // Required
  experience: String,     // Required (e.g., 'entry', 'mid', 'senior')
  duration: Number,       // Minutes, required
  sections: [             // Required
    {
      _id: ObjectId,
      title: String,
      description: String,
      questions: [        // Required
        {
          _id: ObjectId,
          text: String,   // Required
          type: String,   // 'mcq', 'descriptive', etc.
          options: [String], // For MCQs
          expectedAnswer: String, // For reference/evaluation
          marks: Number,  // Points for this question
          skillTag: String // Related skill
        }
      ]
    }
  ],
  createdBy: ObjectId,    // Reference to Users
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean       // Default: true
}
```

## Candidates
```javascript
{
  _id: ObjectId,
  name: String,           // Required
  email: String,          // Required
  mobile: String,         // Required
  sessions: [             // Exam sessions taken by candidate
    {
      examCode: String,   // Reference to QuestionPapers
      startTime: Date,
      endTime: Date,
      status: String      // 'in-progress', 'completed', 'evaluated'
    }
  ],
  createdAt: Date
}
```

## ExamSessions
```javascript
{
  _id: ObjectId,
  examCode: String,       // Reference to QuestionPapers.examCode
  questionPaperId: ObjectId, // Reference to QuestionPapers
  candidate: {            // Required
    _id: ObjectId,        // Reference to Candidates
    name: String,
    email: String,
    mobile: String
  },
  startTime: Date,        // Required
  endTime: Date,
  duration: Number,       // Minutes, from question paper
  answers: [              // Answers submitted by candidate
    {
      questionId: ObjectId, // Reference to question in QuestionPapers
      sectionId: ObjectId,  // Reference to section in QuestionPapers
      answer: String,       // Candidate's answer
      savedAt: Date         // Timestamp of last save
    }
  ],
  ipAddress: String,
  userAgent: String,
  status: String,         // 'in-progress', 'completed', 'evaluated'
  submittedAt: Date,
  evaluatedAt: Date
}
```

## Evaluations
```javascript
{
  _id: ObjectId,
  sessionId: ObjectId,    // Reference to ExamSessions
  candidateId: ObjectId,  // Reference to Candidates
  questionPaperId: ObjectId, // Reference to QuestionPapers
  overallScore: Number,   // Overall percentage
  sectionScores: [        // Scores by section
    {
      sectionId: ObjectId, // Reference to section in QuestionPapers
      sectionTitle: String,
      score: Number,
      maxScore: Number
    }
  ],
  questionEvaluations: [  // Evaluation details for each question
    {
      questionId: ObjectId, // Reference to question in QuestionPapers
      questionText: String,
      answer: String,      // Candidate's answer
      score: Number,       // Points awarded
      maxScore: Number,    // Maximum possible points
      feedback: String,    // LLM-generated feedback
      relevance: Number,   // 0-10 rating for answer relevance
      accuracy: Number,    // 0-10 rating for factual accuracy
      completion: Number   // 0-10 rating for completeness
    }
  ],
  summary: String,        // Overall evaluation summary
  strengths: [String],    // Candidate's strengths
  weaknesses: [String],   // Areas for improvement
  evaluatedAt: Date,
  sentToAdmin: Boolean,   // Whether email notification sent
  reportUrl: String       // Link to generated PDF report
}
```

## QuestionBank
```javascript
{
  _id: ObjectId,
  question: String,       // Required
  type: String,           // 'mcq', 'descriptive', etc.
  options: [String],      // For MCQs
  expectedAnswer: String, // For reference
  difficulty: String,     // 'easy', 'medium', 'hard'
  jobRole: String,        // Related job role
  skillTag: String,       // Related skill
  experience: String,     // Target experience level
  createdFrom: ObjectId,  // Reference to QuestionPapers
  usageCount: Number,     // How many times used in papers
  createdAt: Date
}
```

## Indexes

### Users Collection
```javascript
{ email: 1 }  // Unique index
```

### QuestionPapers Collection
```javascript
{ examCode: 1 }  // Unique index
{ jobRole: 1, skills: 1, experience: 1 }  // Compound index for search
{ createdAt: -1 }  // For sorting by creation date
```

### Candidates Collection
```javascript
{ email: 1, mobile: 1 }  // Compound index
{ "sessions.examCode": 1 }  // For looking up exam sessions
```

### ExamSessions Collection
```javascript
{ examCode: 1, "candidate._id": 1 }  // Compound index
{ status: 1, examCode: 1 }  // For querying session status
{ startTime: -1 }  // For sorting by start time
```

### Evaluations Collection
```javascript
{ sessionId: 1 }  // For looking up session evaluations
{ candidateId: 1 }  // For looking up candidate evaluations
{ overallScore: -1 }  // For sorting by score
```

### QuestionBank Collection
```javascript
{ jobRole: 1, skillTag: 1, experience: 1 }  // Compound index for search
{ difficulty: 1, skillTag: 1 }  // For difficulty-based filtering
```
