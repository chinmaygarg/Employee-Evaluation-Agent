# Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Prerequisites
- GitHub account with this repository
- Vercel account (free)
- MongoDB Atlas cluster (free)
- OpenAI API key

### 2. Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables (see below)
5. Deploy!

#### Option B: Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

### 3. Environment Variables Configuration

In your Vercel dashboard, add these environment variables:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2024
JWT_EXPIRY=24h

# AI Integration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4

# Admin Account
DEFAULT_ADMIN_EMAIL=admin@smartexam.com
DEFAULT_ADMIN_PASSWORD=admin123

# Production Settings
NODE_ENV=production
```

### 4. MongoDB Atlas Setup

1. Create account at [mongodb.com](https://mongodb.com)
2. Create a new cluster (free M0 tier)
3. Create database user with read/write permissions
4. Add your IP to Network Access (or use 0.0.0.0/0 for all IPs)
5. Get connection string and add to MONGODB_URI

### 5. Initialize Sample Data

After deployment, run the sample data script:

```bash
# Clone the repo locally
git clone your-repo-url
cd online-evaluation

# Create .env with your credentials
cp .env.template .env
# Edit .env with your actual values

# Run sample data initialization
cd database
node init-sample-data-direct.js
```

### 6. Test Your Deployment

1. **Admin Panel**: Visit `https://your-app.vercel.app/admin/login`
   - Email: `admin@smartexam.com`
   - Password: `admin123`

2. **Create Question Papers**: Use the AI-powered question generator

3. **Generate Exam Codes**: Create codes for candidates

4. **Test Exam Taking**: Visit `https://your-app.vercel.app/` and use exam codes

## 🔧 Local Development

### Setup
```bash
# Install dependencies
npm run install:all

# Create environment file
cp .env.template .env
# Edit .env with your credentials

# Initialize database
cd database && node init-sample-data-direct.js

# Start development servers
npm run dev
```

### Available Scripts
- `npm run dev` - Start both frontend and backend
- `npm run dev:frontend` - Frontend only (port 3000)
- `npm run dev:backend` - Backend only (port 5001)
- `npm run build` - Build for production

## 🎯 Features Ready

- ✅ AI-powered question generation
- ✅ Real-time exam taking with auto-save
- ✅ Automated evaluation with detailed feedback
- ✅ Admin dashboard for management
- ✅ PDF report generation
- ✅ Multiple exam codes per question paper
- ✅ Comprehensive candidate tracking

## 📞 Support

If you encounter issues:

1. Check Vercel function logs
2. Verify environment variables
3. Test MongoDB connection
4. Ensure OpenAI API key is valid

The system is production-ready and fully functional! 🚀
