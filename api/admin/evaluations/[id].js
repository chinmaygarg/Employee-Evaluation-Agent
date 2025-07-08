const connectDB = require('../../_utils/db');
const { verifyToken } = require('../../_utils/auth');
const Evaluation = require('../../../backend/src/models/evaluation.model');

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

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Evaluation ID is required'
      });
    }

    const evaluation = await Evaluation.findById(id)
      .populate({
        path: 'sessionId',
        select: 'examCode candidate startTime endTime duration answers ipAddress userAgent',
      })
      .populate({
        path: 'questionPaperId',
        select: 'title jobRole skills experience sections',
      });
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found',
      });
    }

    // Transform the data to match frontend expectations
    const transformedData = {
      _id: evaluation._id,
      sessionId: evaluation.sessionId,
      candidateId: evaluation.candidateId,
      questionPaperId: evaluation.questionPaperId,
      overallScore: evaluation.overallScore,
      sectionScores: evaluation.sectionScores,
      questionEvaluations: evaluation.questionEvaluations,
      summary: evaluation.summary,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      evaluatedAt: evaluation.evaluatedAt,
      sentToAdmin: evaluation.sentToAdmin,
      reportUrl: evaluation.reportUrl,
      llmPrompt: evaluation.llmPrompt,
      llmResponse: evaluation.llmResponse,
      createdAt: evaluation.createdAt,
      updatedAt: evaluation.updatedAt,
      completionRate: evaluation.completionRate,
      accuracyRate: evaluation.accuracyRate,
      answeredCount: evaluation.answeredCount,
      totalQuestions: evaluation.totalQuestions,
      
      // Add computed fields for frontend compatibility
      candidate: evaluation.sessionId ? {
        name: evaluation.sessionId.candidate?.name || 'N/A',
        email: evaluation.sessionId.candidate?.email || 'N/A',
        mobile: evaluation.sessionId.candidate?.mobile || 'N/A'
      } : { name: 'N/A', email: 'N/A', mobile: 'N/A' },
      
      examCode: evaluation.sessionId?.examCode || 'N/A',
      
      questionPaper: evaluation.questionPaperId ? {
        title: evaluation.questionPaperId.title || 'N/A',
        jobRole: evaluation.questionPaperId.jobRole || 'N/A',
        skills: evaluation.questionPaperId.skills || [],
        experience: evaluation.questionPaperId.experience || 'N/A'
      } : { title: 'N/A', jobRole: 'N/A', skills: [], experience: 'N/A' },
      
      status: 'evaluated',
      
      // Transform section evaluations for frontend display
      sectionEvaluations: evaluation.sectionScores.map(section => {
        // Find related question evaluations for this section
        const sessionAnswers = evaluation.sessionId?.answers || [];
        const sectionQuestions = [];
        
        // For each answer in the session, check if it belongs to this section
        sessionAnswers.forEach(answer => {
          const answerSectionId = answer.sectionId ? answer.sectionId.toString() : null;
          const currentSectionId = section.sectionId ? section.sectionId.toString() : null;
          
          if (answerSectionId && answerSectionId === currentSectionId) {
            // Find the evaluation for this question by questionId
            const questionEval = evaluation.questionEvaluations.find(q => {
              const qId = q.questionId ? q.questionId.toString() : null;
              const aId = answer.questionId ? answer.questionId.toString() : null;
              return qId && aId && qId === aId;
            });
            
            if (questionEval) {
              sectionQuestions.push({
                questionId: questionEval.questionId,
                questionText: questionEval.questionText,
                candidateAnswer: questionEval.answer,
                score: questionEval.score,
                maxScore: questionEval.maxScore,
                feedback: questionEval.feedback,
                relevance: questionEval.relevance,
                accuracy: questionEval.accuracy,
                completion: questionEval.completion
              });
            }
          }
        });
        
        return {
          sectionId: section.sectionId,
          sectionTitle: section.sectionTitle,
          score: section.score,
          maxScore: section.maxScore,
          totalMarks: section.maxScore,
          questionEvaluations: sectionQuestions
        };
      }),
      
      // Add overall feedback and strengths/weaknesses
      overallFeedback: evaluation.summary,
      strengthsAndWeaknesses: {
        strengths: evaluation.strengths || [],
        weaknesses: evaluation.weaknesses || []
      }
    };
    
    return res.status(200).json({
      success: true,
      data: transformedData,
    });

  } catch (error) {
    console.error('Get evaluation by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching evaluation',
      error: error.message
    });
  }
};

module.exports = verifyToken(handler);
