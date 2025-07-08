const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-exam-system';
    console.log('Connecting to:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected for sample data initialization');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const initializeSampleData = async () => {
  try {
    console.log('Initializing sample data...');

    // Check if admin user exists
    const userCollection = mongoose.connection.collection('users');
    const existingAdmin = await userCollection.findOne({ email: 'admin@smartexam.com' });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const adminUser = {
        name: 'System Administrator',
        email: 'admin@smartexam.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = await userCollection.insertOne(adminUser);
      console.log('✅ Admin user created with ID:', result.insertedId);
    } else {
      console.log('✅ Admin user already exists');
    }

    // Get admin user for question papers
    const admin = await userCollection.findOne({ email: 'admin@smartexam.com' });
    
    // Check if question papers exist
    const questionPapersCollection = mongoose.connection.collection('questionpapers');
    const existingPapers = await questionPapersCollection.countDocuments();
    
    if (existingPapers === 0) {
      const samplePapers = [
        {
          title: 'Frontend Developer Assessment',
          jobRole: 'Frontend Developer',
          skills: ['JavaScript', 'React', 'HTML', 'CSS'],
          experience: 'mid',
          duration: 90,
          questionType: 'mixed',
          objectivePercentage: 50,
          sections: [
            {
              _id: new mongoose.Types.ObjectId(),
              title: 'JavaScript Fundamentals',
              description: 'Core JavaScript concepts and ES6+ features',
              questions: [
                {
                  _id: new mongoose.Types.ObjectId(),
                  text: 'Explain the difference between let, const, and var in JavaScript. Provide examples.',
                  type: 'descriptive',
                  expectedAnswer: 'let and const are block-scoped, var is function-scoped. const cannot be reassigned.',
                  marks: 5,
                  skillTag: 'JavaScript'
                },
                {
                  _id: new mongoose.Types.ObjectId(),
                  text: 'What are JavaScript closures? Explain with a practical example.',
                  type: 'descriptive', 
                  expectedAnswer: 'Closures are functions that have access to outer scope variables even after outer function returns.',
                  marks: 8,
                  skillTag: 'JavaScript'
                }
              ]
            },
            {
              _id: new mongoose.Types.ObjectId(),
              title: 'React Development',
              description: 'React components, hooks, and state management',
              questions: [
                {
                  _id: new mongoose.Types.ObjectId(),
                  text: 'Explain the React component lifecycle and how hooks like useEffect replace lifecycle methods.',
                  type: 'descriptive',
                  expectedAnswer: 'useEffect can handle mounting, updating, and unmounting phases using dependency arrays.',
                  marks: 10,
                  skillTag: 'React'
                }
              ]
            }
          ],
          createdBy: admin._id,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: 'Backend Developer Assessment',
          jobRole: 'Backend Developer', 
          skills: ['Node.js', 'Express', 'MongoDB', 'API Design'],
          experience: 'senior',
          duration: 120,
          questionType: 'mixed',
          objectivePercentage: 50,
          sections: [
            {
              _id: new mongoose.Types.ObjectId(),
              title: 'Node.js & Express',
              description: 'Server-side development with Node.js and Express framework',
              questions: [
                {
                  _id: new mongoose.Types.ObjectId(),
                  text: 'Explain the event loop in Node.js and how it handles asynchronous operations.',
                  type: 'descriptive',
                  expectedAnswer: 'Event loop handles callbacks, promises, and async operations in phases.',
                  marks: 10,
                  skillTag: 'Node.js'
                },
                {
                  _id: new mongoose.Types.ObjectId(),
                  text: 'Design a RESTful API for a book management system. Include all CRUD operations.',
                  type: 'descriptive',
                  expectedAnswer: 'GET /books, POST /books, PUT /books/:id, DELETE /books/:id with proper status codes.',
                  marks: 12,
                  skillTag: 'API Design'
                }
              ]
            }
          ],
          createdBy: admin._id,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      await questionPapersCollection.insertMany(samplePapers);
      console.log('✅ Sample question papers created');
      
      // Create exam codes for the question papers
      const examCodesCollection = mongoose.connection.collection('examcodes');
      const questionPapers = await questionPapersCollection.find({}).toArray();
      
      const examCodes = [];
      for (const paper of questionPapers) {
        // Generate unique exam code
        const prefix = 'SLX';
        const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        const code = `${prefix}-${randomPart}-${timestamp}`;
        
        examCodes.push({
          code: code,
          questionPaperId: paper._id,
          isUsed: false,
          usedAt: null,
          usedBy: null,
          examSession: null,
          createdBy: admin._id,
          expiresAt: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      await examCodesCollection.insertMany(examCodes);
      console.log('✅ Exam codes created:', examCodes.map(c => c.code));
      
    } else {
      console.log('✅ Question papers already exist');
    }

    // Check if sample candidates exist
    const candidatesCollection = mongoose.connection.collection('candidates');
    const existingCandidates = await candidatesCollection.countDocuments();
    
    if (existingCandidates === 0) {
      const sampleCandidates = [
        {
          name: 'John Doe',
          email: 'john.doe@example.com',
          mobile: '+1234567890',
          sessions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Jane Smith', 
          email: 'jane.smith@example.com',
          mobile: '+1234567891',
          sessions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Mike Johnson',
          email: 'mike.johnson@example.com', 
          mobile: '+1234567892',
          sessions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      await candidatesCollection.insertMany(sampleCandidates);
      console.log('✅ Sample candidates created');
    } else {
      console.log('✅ Candidates already exist');
    }

    console.log('\n🎉 Sample data initialization completed successfully!');
    console.log('\nYou can now:');
    console.log('- Login to admin panel: http://localhost:3000/admin/login');
    console.log('- Email: admin@smartexam.com');
    console.log('- Password: admin123');
    
    // Show available exam codes
    const examCodesCollection = mongoose.connection.collection('examcodes');
    const availableCodes = await examCodesCollection.find({ isUsed: false, isActive: true }).toArray();
    console.log('- Test with exam codes:', availableCodes.map(c => c.code).join(', '));
    
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};

const main = async () => {
  await connectDB();
  await initializeSampleData();
  mongoose.connection.close();
  console.log('\nDatabase connection closed.');
};

main();
