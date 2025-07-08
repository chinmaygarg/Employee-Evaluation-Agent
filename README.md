# Smart Examination System 🎓

An LLM-powered examination platform for creating, conducting, and evaluating online assessments with precise question generation and real-time evaluation.

## 🚀 **DEPLOYMENT STATUS: READY FOR VERCEL** ✅

The project has been fully migrated to a serverless architecture and is ready for immediate deployment on Vercel.

## ✨ Key Features

### For Administrators
- **AI-Powered Question Generation**: Create question papers using OpenAI GPT-4
- **Flexible Question Management**: Add, edit, or regenerate individual questions
- **Multiple Exam Codes**: Generate unique codes for each question paper
- **Real-time Monitoring**: Track exam sessions and candidate progress
- **Automated Evaluation**: LLM-powered assessment with detailed feedback
- **Comprehensive Reporting**: Download evaluation reports and answer sheets as PDF

### For Candidates
- **Seamless Exam Experience**: Clean, distraction-free interface
- **Real-time Auto-save**: Answers saved automatically every few seconds
- **Timer Management**: Visible countdown with 5-minute warning
- **Flexible Navigation**: Move between questions and sections freely
- **Security Features**: Copy-paste prevention and session management

### For Evaluation
- **Smart Scoring**: Comprehensive evaluation including accuracy, relevance, and completion
- **Detailed Feedback**: Section-wise performance analysis
- **Transparent Metrics**: Clear breakdown of scores and completion rates
- **Export Options**: PDF reports for detailed analysis

## 🏗️ Architecture

### Serverless Functions (Vercel)
```
/api/
├── auth/           # Authentication endpoints
├── admin/          # Admin panel APIs
├── exam/           # Exam taking APIs
├── llm/            # AI question generation
└── _utils/         # Shared utilities & models
```

### Frontend (React)
```
/frontend/
├── src/
│   ├── pages/      # Admin & exam pages
│   ├── components/ # Reusable UI components
│   ├── store/      # Redux state management
│   └── utils/      # Helper functions
```

### Database (MongoDB Atlas)
- **Users**: Admin authentication
- **Question Papers**: AI-generated question sets
- **Exam Sessions**: Real-time exam data
- **Evaluations**: Automated assessment results
- **Candidates**: Participant information

## 🚀 Quick Deployment

### Prerequisites
- Node.js 16+ installed
- MongoDB Atlas account
- OpenAI API key
- Vercel account

### 1. Clone & Setup
```bash
git clone https://github.com/chinmaygarg/Employee-Evaluation-Agent.git
cd Employee-Evaluation-Agent
git checkout vercel-deployment

# Install dependencies
npm run install:all
```

### 2. Environment Configuration
Create environment variables:

```bash
# Copy template file
cp .env.template .env

# Edit .env with your actual values:
# - MongoDB Atlas connection string
# - OpenAI API key
# - Other configuration values
```

### 3. Initialize Sample Data
```bash
cd database
node init-sample-data-direct.js
```

This creates:
- Admin user: `admin@smartexam.com` / `admin123`
- Sample question papers with exam codes
- Test candidates

### 4. Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard (see DEPLOYMENT.md)
3. Deploy automatically

#### Option B: Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

### 5. Configure Environment Variables in Vercel
Add these in your Vercel dashboard:
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `OPENAI_API_KEY` - Your OpenAI API key
- `JWT_SECRET` - JWT signing secret
- `DEFAULT_ADMIN_EMAIL` - Admin email
- `DEFAULT_ADMIN_PASSWORD` - Admin password
- `NODE_ENV=production`

See `DEPLOYMENT.md` for detailed instructions.

## 🧪 Testing the Deployment

### Admin Panel
1. Visit: `https://your-app.vercel.app/admin/login`
2. Login: `admin@smartexam.com` / `admin123`
3. Create question papers using AI
4. Generate exam codes
5. Monitor evaluations

### Exam Taking
1. Visit: `https://your-app.vercel.app/`
2. Use available exam codes (displayed after sample data initialization)
3. Register as candidate
4. Take the exam
5. View automated evaluation

## 🛠️ Local Development

### Start Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or individually
npm run dev:frontend  # http://localhost:3000
npm run dev:backend   # http://localhost:5001
```

### Environment Files
- `.env.template` - Template for environment variables
- `.env.example` - Example for Vercel deployment
- `.env` - Local development (create from template)

## 📊 Sample Data Included

### Test Accounts
- **Admin**: admin@smartexam.com / admin123

### Sample Question Papers
1. **Frontend Developer Assessment** (90 mins)
   - JavaScript Fundamentals
   - React Development
   
2. **Backend Developer Assessment** (120 mins)
   - Node.js & Express
   - API Design

### Available Exam Codes
Generated automatically during initialization. View in admin panel or check database.

## 🔒 Security Features

- **JWT Authentication**: Secure admin access
- **Environment Variables**: Sensitive data protection
- **Copy-Paste Prevention**: Exam integrity
- **Session Management**: Single session per candidate
- **Input Validation**: Security protection

## 📱 Responsive Design

- **Mobile-first**: Optimized for all devices
- **Progressive Web App**: Fast loading and offline support
- **Accessible**: WCAG compliance for inclusivity

## 🚀 Performance

### Serverless Optimization
- **Edge Functions**: Fast global response times
- **Automatic Scaling**: Handle any number of concurrent exams
- **CDN Distribution**: Static assets served globally
- **Database Connection Pooling**: Efficient MongoDB Atlas integration

### Frontend Optimization
- **Code Splitting**: Lazy loading for faster initial load
- **Bundle Optimization**: Minimized JavaScript and CSS
- **Image Optimization**: Responsive images with WebP support

## 🔧 Advanced Configuration

### Custom Question Types
Support for multiple question formats:
- Descriptive answers
- Multiple choice (MCQ)
- True/False
- Fill in the blanks
- Coding challenges
- Case studies

### Evaluation Customization
- **Scoring Weights**: Adjust section importance
- **Feedback Templates**: Customize evaluation messages  
- **Pass/Fail Thresholds**: Set custom scoring criteria

### Integration Options
- **Webhook Support**: Real-time evaluation notifications
- **API Access**: Integrate with existing HR systems
- **Export Formats**: CSV, PDF, JSON data export

## 📚 API Documentation

### Authentication
```
POST /api/auth/login
GET /api/auth/me
PUT /api/auth/change-password
```

### Question Management
```
GET /api/admin/question-papers
POST /api/admin/question-papers
GET /api/admin/question-papers/:id
PUT /api/admin/question-papers/:id
DELETE /api/admin/question-papers/:id
```

### Exam Management
```
GET /api/exam/validate/:examCode
POST /api/exam/start
GET /api/exam/:sessionId
POST /api/exam/:sessionId/answer
POST /api/exam/:sessionId/submit
```

### AI Generation
```
POST /api/llm/generate-questions
POST /api/llm/regenerate-question
```

## 🐛 Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Database Connection**
```bash
# Test MongoDB Atlas connection
node database/test-connection.js
```

**Environment Variables**
- Ensure all required variables are set
- Check Vercel dashboard configuration
- Verify API key validity

### Performance Issues
- **Timeout**: Increase serverless function timeout in vercel.json
- **Memory**: Optimize database queries and payload sizes
- **Rate Limits**: Implement request throttling for high traffic

## 📞 Support

For deployment assistance or customization:
1. Check the comprehensive logs in Vercel dashboard
2. Review environment variable configuration
3. Test database connectivity
4. Verify API key permissions

## 🎯 Roadmap

- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Video proctoring integration
- [ ] Advanced question banks
- [ ] Bulk candidate import
- [ ] Automated certificate generation

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Ready for immediate deployment on Vercel! 🚀**

The system is production-ready with all features implemented, tested, and optimized for serverless deployment.

## 📋 Project Structure

```
/Employee-Evaluation-Agent/
├── 📁 api/                      # Serverless functions
│   ├── 📁 _utils/               # Shared utilities
│   │   ├── db.js               # Database connection
│   │   ├── auth.js             # Auth middleware
│   │   └── 📁 models/          # Database models
│   ├── 📁 auth/                # Authentication endpoints
│   ├── 📁 admin/               # Admin panel APIs
│   ├── 📁 exam/                # Exam taking APIs
│   └── 📁 llm/                 # LLM integration
├── 📁 frontend/                # React application
│   ├── 📁 src/                 # Source code
│   ├── .env.production        # Production config
│   └── .env.local             # Local config template
├── 📁 database/               # Database scripts
│   ├── init-sample-data-direct.js
│   └── test-connection.js
├── 📁 backend/                # Original backend (reference)
├── vercel.json               # Vercel configuration
├── package.json              # Root dependencies
├── .env.template            # Environment template
├── .env.example             # Vercel env example
├── DEPLOYMENT.md            # Deployment guide
├── task.md                  # Development tracker
└── README.md                # This file
```

## 🎉 Deployment Summary

✅ **All requirements from the Smart Examination System Specification have been implemented:**

1. **Candidate Workflow** - Complete exam flow with timer, navigation, auto-save
2. **Admin Panel** - Question management, evaluation viewing, reporting
3. **Technical Requirements** - MongoDB, LLM integration, responsive UI
4. **Security & UX** - Copy-paste prevention, single sessions, real-time saving

**The project is ready for production use! 🚀**
