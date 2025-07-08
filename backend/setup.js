const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('./src/models/user.model');
const QuestionPaper = require('./src/models/questionPaper.model');
const Candidate = require('./src/models/candidate.model');
const ExamSession = require('./src/models/examSession.model');
const Evaluation = require('./src/models/evaluation.model');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create admin user
const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@smartexam.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return existingAdmin;
    }

    // Create new admin user
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@smartexam.com',
      password: 'admin123',
      role: 'super-admin'
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@smartexam.com');
    console.log('🔑 Password: admin123');
    
    return adminUser;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

// Create sample question papers
const createSampleQuestionPapers = async (adminUser) => {
  try {
    // Check if sample data already exists
    const existingPapers = await QuestionPaper.find();
    if (existingPapers.length > 0) {
      console.log('Sample question papers already exist');
      return existingPapers;
    }

    const sampleQuestionPapers = [
      {
        examCode: 'FE001',
        title: 'Frontend Developer Assessment',
        jobRole: 'Frontend Developer',
        skills: ['React', 'JavaScript', 'CSS', 'HTML'],
        experience: 'mid',
        duration: 60,
        sections: [
          {
            title: 'Technical Knowledge',
            description: 'Core frontend concepts and best practices',
            questions: [
              {
                text: 'What is the difference between let, const, and var in JavaScript? Explain with examples.',
                type: 'descriptive',
                expectedAnswer: 'var is function-scoped, let and const are block-scoped. const cannot be reassigned after declaration.',
                marks: 5,
                skillTag: 'JavaScript'
              },
              {
                text: 'Explain the concept of Virtual DOM in React and its benefits.',
                type: 'descriptive',
                expectedAnswer: 'Virtual DOM is a programming concept where a virtual representation of the real DOM is kept in memory and synced with the real DOM.',
                marks: 8,
                skillTag: 'React'
              },
              {
                text: 'How do you center a div both horizontally and vertically using CSS?',
                type: 'descriptive',
                expectedAnswer: 'Using flexbox: display: flex; justify-content: center; align-items: center; or using CSS Grid.',
                marks: 4,
                skillTag: 'CSS'
              }
            ]
          },
          {
            title: 'Problem Solving',
            description: 'Practical problem-solving scenarios',
            questions: [
              {
                text: 'How would you optimize a React application that is rendering slowly?',
                type: 'descriptive',
                expectedAnswer: 'Use React.memo, useMemo, useCallback, lazy loading, code splitting, and avoid unnecessary re-renders.',
                marks: 10,
                skillTag: 'React'
              },
              {
                text: 'Describe how you would implement responsive design for a complex web application.',
                type: 'descriptive',
                expectedAnswer: 'Use CSS Grid/Flexbox, media queries, mobile-first approach, relative units, and test across devices.',
                marks: 8,
                skillTag: 'CSS'
              }
            ]
          },
          {
            title: 'Coding Challenge',
            description: 'Hands-on coding problems',
            questions: [
              {
                text: 'Write a JavaScript function that finds the first non-repeating character in a string.',
                type: 'descriptive',
                expectedAnswer: 'Use a Map or object to count character frequencies, then iterate to find the first character with count 1.',
                marks: 15,
                skillTag: 'JavaScript'
              }
            ]
          }
        ],
        createdBy: adminUser._id,
        isActive: true,
        prompt: 'Frontend Developer assessment focusing on React, JavaScript, and CSS skills for mid-level candidates'
      },
      {
        examCode: 'BE002',
        title: 'Backend Developer Assessment',
        jobRole: 'Backend Developer',
        skills: ['Node.js', 'Express', 'MongoDB', 'REST API'],
        experience: 'senior',
        duration: 90,
        sections: [
          {
            title: 'Backend Fundamentals',
            description: 'Core backend development concepts',
            questions: [
              {
                text: 'Explain the difference between SQL and NoSQL databases. When would you choose one over the other?',
                type: 'descriptive',
                expectedAnswer: 'SQL databases are relational with ACID properties, NoSQL are flexible and scalable. Choose based on data structure and scalability needs.',
                marks: 8,
                skillTag: 'MongoDB'
              },
              {
                text: 'What are the key principles of RESTful API design?',
                type: 'descriptive',
                expectedAnswer: 'Stateless, resource-based URLs, HTTP methods, proper status codes, consistent data format.',
                marks: 6,
                skillTag: 'REST API'
              }
            ]
          },
          {
            title: 'Node.js & Express',
            description: 'Server-side JavaScript development',
            questions: [
              {
                text: 'Explain middleware in Express.js and provide an example of custom middleware.',
                type: 'descriptive',
                expectedAnswer: 'Middleware functions execute during request-response cycle. Can modify req/res objects or end request.',
                marks: 10,
                skillTag: 'Express'
              },
              {
                text: 'How do you handle asynchronous operations in Node.js? Compare callbacks, promises, and async/await.',
                type: 'descriptive',
                expectedAnswer: 'Callbacks are traditional but can cause callback hell. Promises provide better error handling. Async/await offers synchronous-like syntax.',
                marks: 12,
                skillTag: 'Node.js'
              }
            ]
          },
          {
            title: 'Database & Security',
            description: 'Data management and security best practices',
            questions: [
              {
                text: 'Design a MongoDB schema for a blog application with users, posts, and comments.',
                type: 'descriptive',
                expectedAnswer: 'Users collection with profile info, Posts with author reference, Comments with post and author references.',
                marks: 15,
                skillTag: 'MongoDB'
              }
            ]
          }
        ],
        createdBy: adminUser._id,
        isActive: true,
        prompt: 'Backend Developer assessment focusing on Node.js, Express, MongoDB, and API design for senior candidates'
      }
    ];

    const createdPapers = await QuestionPaper.insertMany(sampleQuestionPapers);
    console.log(`✅ Created ${createdPapers.length} sample question papers`);
    
    return createdPapers;
  } catch (error) {
    console.error('Error creating sample question papers:', error);
    throw error;
  }
};

// Create sample candidates
const createSampleCandidates = async () => {
  try {
    // Check if sample candidates already exist
    const existingCandidates = await Candidate.find();
    if (existingCandidates.length > 0) {
      console.log('Sample candidates already exist');
      return existingCandidates;
    }

    const sampleCandidates = [
      {
        name: 'John Doe',
        email: 'john.doe@email.com',
        mobile: '+1234567890',
        registrationDate: new Date('2024-01-15')
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@email.com',
        mobile: '+1234567891',
        registrationDate: new Date('2024-01-20')
      },
      {
        name: 'Alex Johnson',
        email: 'alex.johnson@email.com',
        mobile: '+1234567892',
        registrationDate: new Date('2024-01-25')
      }
    ];

    const createdCandidates = await Candidate.insertMany(sampleCandidates);
    console.log(`✅ Created ${createdCandidates.length} sample candidates`);
    
    return createdCandidates;
  } catch (error) {
    console.error('Error creating sample candidates:', error);
    throw error;
  }
};

// Create sample exam sessions
const createSampleExamSessions = async (questionPapers, candidates) => {
  try {
    // Check if sample sessions already exist
    const existingSessions = await ExamSession.find();
    if (existingSessions.length > 0) {
      console.log('Sample exam sessions already exist');
      return existingSessions;
    }

    const frontendPaper = questionPapers.find(p => p.examCode === 'FE001');
    const backendPaper = questionPapers.find(p => p.examCode === 'BE002');
    
    const sampleSessions = [
      {
        examCode: 'FE001',
        questionPaperId: frontendPaper._id,
        candidate: {
          _id: candidates[0]._id,
          name: candidates[0].name,
          email: candidates[0].email,
          mobile: candidates[0].mobile
        },
        startTime: new Date('2024-01-25T10:00:00Z'),
        endTime: new Date('2024-01-25T10:58:00Z'),
        duration: 60,
        answers: [
          {
            questionId: frontendPaper.sections[0].questions[0]._id,
            sectionId: frontendPaper.sections[0]._id,
            answer: 'var is function-scoped and can be redeclared. let and const are block-scoped. const cannot be reassigned after declaration while let can be reassigned.',
            savedAt: new Date('2024-01-25T10:15:00Z')
          },
          {
            questionId: frontendPaper.sections[0].questions[1]._id,
            sectionId: frontendPaper.sections[0]._id,
            answer: 'Virtual DOM is a programming concept where a virtual representation of the real DOM is kept in memory and synced with the real DOM through a process called reconciliation. This makes React apps faster.',
            savedAt: new Date('2024-01-25T10:30:00Z')
          }
        ],
        status: 'completed',
        submittedAt: new Date('2024-01-25T10:58:00Z'),
        isAutoSubmitted: false
      },
      {
        examCode: 'BE002',
        questionPaperId: backendPaper._id,
        candidate: {
          _id: candidates[1]._id,
          name: candidates[1].name,
          email: candidates[1].email,
          mobile: candidates[1].mobile
        },
        startTime: new Date('2024-01-26T14:00:00Z'),
        endTime: new Date('2024-01-26T15:15:00Z'),
        duration: 90,
        answers: [
          {
            questionId: backendPaper.sections[0].questions[0]._id,
            sectionId: backendPaper.sections[0]._id,
            answer: 'SQL databases are relational and use structured query language. They have ACID properties and are good for complex queries. NoSQL databases are non-relational, more flexible, and better for horizontal scaling.',
            savedAt: new Date('2024-01-26T14:20:00Z')
          }
        ],
        status: 'completed',
        submittedAt: new Date('2024-01-26T15:15:00Z'),
        isAutoSubmitted: false
      }
    ];

    const createdSessions = await ExamSession.insertMany(sampleSessions);
    console.log(`✅ Created ${createdSessions.length} sample exam sessions`);
    
    return createdSessions;
  } catch (error) {
    console.error('Error creating sample exam sessions:', error);
    throw error;
  }
};

// Create sample evaluations
const createSampleEvaluations = async (examSessions, questionPapers, candidates) => {
  try {
    // Check if sample evaluations already exist
    const existingEvaluations = await Evaluation.find();
    if (existingEvaluations.length > 0) {
      console.log('Sample evaluations already exist');
      return existingEvaluations;
    }

    const sampleEvaluations = [
      {
        sessionId: examSessions[0]._id,
        candidateId: candidates[0]._id,
        questionPaperId: questionPapers[0]._id,
        questionEvaluations: [
          {
            questionId: questionPapers[0].sections[0].questions[0]._id,
            questionText: questionPapers[0].sections[0].questions[0].text,
            answer: 'var is function-scoped and can be redeclared. let and const are block-scoped. const cannot be reassigned after declaration while let can be reassigned.',
            score: 4,
            maxScore: 5,
            feedback: 'Good understanding of variable scoping in JavaScript. Could have mentioned hoisting behavior.',
            relevance: 8,
            accuracy: 8,
            completion: 7
          },
          {
            questionId: questionPapers[0].sections[0].questions[1]._id,
            questionText: questionPapers[0].sections[0].questions[1].text,
            answer: 'Virtual DOM is a programming concept where a virtual representation of the real DOM is kept in memory and synced with the real DOM through a process called reconciliation. This makes React apps faster.',
            score: 7,
            maxScore: 8,
            feedback: 'Excellent explanation of Virtual DOM concept and its benefits. Well understood.',
            relevance: 9,
            accuracy: 9,
            completion: 8
          }
        ],
        sectionScores: [
          {
            sectionId: questionPapers[0].sections[0]._id,
            sectionTitle: 'Technical Knowledge',
            score: 11,
            maxScore: 13
          }
        ],
        overallScore: 85,
        summary: 'Strong candidate with good understanding of frontend concepts. Shows solid knowledge of JavaScript and React.',
        strengths: ['JavaScript fundamentals', 'React concepts', 'Clear explanations'],
        weaknesses: ['Could improve on advanced JavaScript topics', 'More practical examples needed'],
        evaluatedAt: new Date('2024-01-25T11:00:00Z'),
        sentToAdmin: false,
        llmPrompt: 'Evaluate frontend developer assessment answers',
        llmResponse: 'Generated evaluation results for frontend assessment'
      }
    ];

    const createdEvaluations = await Evaluation.insertMany(sampleEvaluations);
    console.log(`✅ Created ${createdEvaluations.length} sample evaluations`);
    
    // Update exam session status
    await ExamSession.findByIdAndUpdate(examSessions[0]._id, {
      status: 'evaluated',
      evaluatedAt: new Date('2024-01-25T11:00:00Z')
    });

    return createdEvaluations;
  } catch (error) {
    console.error('Error creating sample evaluations:', error);
    throw error;
  }
};

// Main setup function
const setupDatabase = async () => {
  try {
    console.log('🚀 Starting database setup...');
    
    // Connect to database
    await connectDB();
    
    // Create admin user
    const adminUser = await createAdminUser();
    
    // Create sample data
    const questionPapers = await createSampleQuestionPapers(adminUser);
    const candidates = await createSampleCandidates();
    const examSessions = await createSampleExamSessions(questionPapers, candidates);
    const evaluations = await createSampleEvaluations(examSessions, questionPapers, candidates);
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${questionPapers.length} Question Papers`);
    console.log(`   • ${candidates.length} Candidates`);
    console.log(`   • ${examSessions.length} Exam Sessions`);
    console.log(`   • ${evaluations.length} Evaluations`);
    
    console.log('\n🔐 Admin Credentials:');
    console.log('   Email: admin@smartexam.com');
    console.log('   Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = {
  setupDatabase,
  createAdminUser,
  createSampleQuestionPapers,
  createSampleCandidates,
  createSampleExamSessions,
  createSampleEvaluations
};