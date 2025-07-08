const connectDB = require('../../_utils/db');
const { verifyToken } = require('../../_utils/auth');
const QuestionPaper = require('../../../backend/src/models/questionPaper.model');

const handler = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await connectDB();
    
    // Extract ID from query
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Question paper ID is required'
      });
    }

    // Handle GET - Get question paper by ID
    if (req.method === 'GET') {
      const questionPaper = await QuestionPaper.findById(id)
        .populate('createdBy', 'name email');
      
      if (!questionPaper) {
        return res.status(404).json({
          success: false,
          message: 'Question paper not found',
        });
      }
      
      return res.status(200).json({
        success: true,
        data: questionPaper,
      });
    }

    // Handle PUT - Update question paper
    if (req.method === 'PUT') {
      const { title, isActive } = req.body;
      
      const questionPaper = await QuestionPaper.findById(id);
      
      if (!questionPaper) {
        return res.status(404).json({
          success: false,
          message: 'Question paper not found',
        });
      }
      
      // Update fields
      if (title) questionPaper.title = title;
      if (isActive !== undefined) questionPaper.isActive = isActive;
      
      // Save changes
      await questionPaper.save();
      
      return res.status(200).json({
        success: true,
        message: 'Question paper updated successfully',
        data: {
          id: questionPaper._id,
          title: questionPaper.title,
          isActive: questionPaper.isActive,
        },
      });
    }

    // Handle DELETE - Delete question paper
    if (req.method === 'DELETE') {
      const questionPaper = await QuestionPaper.findById(id);
      
      if (!questionPaper) {
        return res.status(404).json({
          success: false,
          message: 'Question paper not found',
        });
      }
      
      // Soft delete by setting isActive to false
      questionPaper.isActive = false;
      await questionPaper.save();
      
      return res.status(200).json({
        success: true,
        message: 'Question paper deleted successfully',
      });
    }

    // Method not allowed
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });

  } catch (error) {
    console.error('Question paper error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = verifyToken(handler);
