# Smart Examination System

An LLM-powered examination platform for creating, conducting, and evaluating online assessments.

## Features

- **Dynamic Question Generation**: LLM-powered creation of question papers based on job roles, skills, and experience levels
- **Secure Examination Environment**: Anti-cheating measures, real-time saving, and timer management
- **Automated Evaluation**: LLM-based assessment of candidate answers with detailed scoring and feedback
- **Comprehensive Admin Panel**: Manage question papers, view results, and generate reports
- **Candidate Management**: Track candidate performance across multiple exams

## Project Structure

```
/online-evaluation/
├── backend/            # Node.js/Express server
│   ├── src/            # Source code
│   │   ├── config/     # Configuration files
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/ # Express middleware
│   │   ├── models/     # MongoDB models
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   └── utils/      # Utility functions
│   ├── .env.example    # Environment variables template
│   └── package.json    # Backend dependencies
├── frontend/           # React application
│   ├── public/         # Static files
│   ├── src/            # Source code
│   │   ├── assets/     # Images, fonts, etc.
│   │   ├── components/ # Reusable components
│   │   ├── pages/      # Application pages
│   │   ├── services/   # API services
│   │   ├── store/      # Redux store
│   │   └── utils/      # Utility functions
│   ├── .env.example    # Environment variables template
│   └── package.json    # Frontend dependencies
├── docs/               # Documentation
├── scripts/            # Utility scripts
└── docker-compose.yml  # Docker configuration
```

## Prerequisites

- Node.js (v16+)
- MongoDB (v5+)
- OpenAI API key for LLM integration
- Docker and Docker Compose (optional, for containerized setup)

## Getting Started

### Local Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd online-evaluation
```

2. **Set up the backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env file with your configuration
```

3. **Set up the frontend**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env file with your configuration
```

4. **Start MongoDB**
If you have MongoDB installed locally:
```bash
mongod --dbpath /path/to/your/data/directory
```
Or using Docker:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

5. **Start the development servers**

For the backend:
```bash
cd backend
npm run dev
```

For the frontend:
```bash
cd frontend
npm start
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

### Docker Setup

1. **Configure environment variables**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your configuration
```

2. **Build and start containers**
```bash
docker-compose up -d
```

3. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current admin user
- `PUT /api/auth/change-password` - Change admin password

### Question Paper Endpoints

- `POST /api/admin/question-papers` - Create question paper
- `GET /api/admin/question-papers` - Get all question papers
- `GET /api/admin/question-papers/:id` - Get question paper by ID
- `GET /api/admin/question-papers/code/:examCode` - Get question paper by exam code
- `PUT /api/admin/question-papers/:id` - Update question paper
- `POST /api/admin/question-papers/:id/questions` - Add question to section
- `DELETE /api/admin/question-papers/:id/questions/:questionId` - Remove question from section
- `POST /api/admin/question-papers/:id/sections` - Add section to question paper
- `DELETE /api/admin/question-papers/:id/sections/:sectionId` - Remove section from question paper
- `POST /api/admin/question-papers/:id/sections/:sectionId/regenerate` - Regenerate questions for a section

### Exam Endpoints

- `GET /api/exam/validate/:examCode` - Validate exam code
- `POST /api/exam/start` - Register candidate and start exam
- `GET /api/exam/:sessionId` - Get question paper for exam
- `POST /api/exam/:sessionId/answer` - Save answer
- `POST /api/exam/:sessionId/submit` - Submit exam
- `GET /api/exam/:sessionId/unanswered` - Get unanswered questions
- `GET /api/exam/:sessionId/status` - Get session status

### Evaluation Endpoints

- `GET /api/admin/evaluations` - Get all evaluations
- `GET /api/admin/evaluations/stats` - Get evaluation statistics
- `GET /api/admin/evaluations/:id` - Get evaluation by ID
- `GET /api/admin/evaluations/exam/:examCode` - Get evaluations by exam code
- `GET /api/admin/evaluations/candidate/:candidateId` - Get evaluations by candidate
- `GET /api/admin/evaluations/:id/report` - Download evaluation report
- `POST /api/admin/evaluations/:id/regenerate` - Regenerate evaluation

### Candidate Endpoints

- `GET /api/admin/candidates` - Get all candidates
- `GET /api/admin/candidates/stats` - Get candidate statistics
- `GET /api/admin/candidates/search` - Search candidate by email or mobile
- `GET /api/admin/candidates/:id` - Get candidate by ID
- `GET /api/admin/candidates/:id/sessions` - Get candidate's exam sessions
- `PUT /api/admin/candidates/:id` - Update candidate

## LLM Integration

The system uses OpenAI's API for two primary functions:

1. **Question Generation**: Creates tailored questions based on job role, skills, and experience level
2. **Answer Evaluation**: Analyzes candidate responses and provides detailed scoring and feedback

Configure your OpenAI API key in the backend `.env` file:

```
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4
```

## Security Considerations

- All API routes are protected with JWT authentication (except public exam routes)
- Copy-paste functionality is disabled during exams to prevent cheating
- Only one active session per candidate per exam is allowed
- All answers are saved in real-time to prevent data loss
- Proper input validation is performed on all API requests

## License

[MIT License](LICENSE)

## Acknowledgements

- OpenAI for GPT models
- MongoDB for database
- React and Node.js communities for excellent documentation and resources
