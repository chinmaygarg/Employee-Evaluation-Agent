const QuestionPaper = require('../models/questionPaper.model');
const Candidate = require('../models/candidate.model');
const ExamSession = require('../models/examSession.model');
const Evaluation = require('../models/evaluation.model');
const { asyncHandler } = require('../middleware/error.middleware');
const llmService = require('../services/llm.service');
const emailService = require('../services/email.service');
const pdfService = require('../services/pdf.service');
const logger = require('../config/logger');

/**
 * @desc    Validate exam code
 * @route   GET /api/exam/validate/:examCode
 * @access  Public
 */
const validateExamCode = asyncHandler(async (req, res) => {
  const { examCode } = req.params;
  
  // Find question paper by exam code
  const questionPaper = await QuestionPaper.findOne({ 
    examCode, 
    isActive: true,
  });
  
  if (!questionPaper) {
    return res.status(404).json({
      success: false,
      message: 'Invalid exam code or exam is not active',
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Valid exam code',
    data: {
      examCode,
      title: questionPaper.title,
      jobRole: questionPaper.jobRole,
      duration: questionPaper.duration,
    },
  });
});

/**
 * @desc    Register candidate and start exam
 * @route   POST /api/exam/start
 * @access  Public
 */
const startExam = asyncHandler(async (req, res) => {
  const { name, email, mobile, examCode } = req.body;
  
  // Find question paper by exam code
  const questionPaper = await QuestionPaper.findOne({ 
    examCode, 
    isActive: true,
  });
  
  if (!questionPaper) {
    return res.status(404).json({
      success: false,
      message: 'Invalid exam code or exam is not active',
    });
  }
  
  // Find or create candidate
  const candidate = await Candidate.findOrCreate({
    name,
    email,
    mobile,
  });
  
  // Check if candidate already has an active session for this exam
  if (candidate.hasActiveSession(examCode)) {
    return res.status(400).json({
      success: false,
      message: 'You already have an active session for this exam',
    });
  }
  
  // Create new session
  const session = new ExamSession({
    examCode,
    questionPaperId: questionPaper._id,
    candidate: {
      _id: candidate._id,
      name: candidate.name,
      email: candidate.email,
      mobile: candidate.mobile,
    },
    duration: questionPaper.duration,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || '',
  });
  
  // Save session
  await session.save();
  
  // Update candidate with new session
  candidate.sessions.push({
    examCode,
    startTime: session.startTime,
    status: 'in-progress',
  });
  
  await candidate.save();
  
  logger.info(`Exam started: ${examCode} for candidate ${candidate.name} (${candidate.email})`);
  
  res.status(201).json({
    success: true,
    message: 'Exam session started',
    data: {
      sessionId: session._id,
      examCode,
      candidateId: candidate._id,
      startTime: session.startTime,
      duration: questionPaper.duration,
      endTime: new Date(session.startTime.getTime() + questionPaper.duration * 60000),
    },
  });
});

/**
 * @desc    Get question paper for exam
 * @route   GET /api/exam/:sessionId
 * @access  Public
 */
const getExamQuestionPaper = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  // Find session
  const session = await ExamSession.findById(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Exam session not found',
    });
  }
  
  // Check if session is still active
  if (session.status !== 'in-progress') {
    return res.status(400).json({
      success: false,
      message: 'Exam session is no longer active',
    });
  }
  
  // Find question paper
  const questionPaper = await QuestionPaper.findById(session.questionPaperId);
  
  if (!questionPaper) {
    return res.status(404).json({
      success: false,
      message: 'Question paper not found',
    });
  }
  
  // Prepare the question paper for the candidate (remove expected answers)
  const candidateQuestionPaper = {
    title: questionPaper.title,
    jobRole: questionPaper.jobRole,
    duration: questionPaper.duration,
    sections: questionPaper.sections.map(section => ({
      _id: section._id,
      title: section.title,
      description: section.description,
      questions: section.questions.map(question => ({
        _id: question._id,
        text: question.text,
        type: question.type,
        options: question.options,
        marks: question.marks,
      })),
    })),
    startTime: session.startTime,
    endTime: new Date(session.startTime.getTime() + questionPaper.duration * 60000),
    remainingTime: Math.max(
      0,
      (new Date(session.startTime.getTime() + questionPaper.duration * 60000) - new Date()) / 1000
    ),
  };
  
  // Get saved answers if any
  candidateQuestionPaper.answers = session.answers.map(answer => ({
    questionId: answer.questionId,
    sectionId: answer.sectionId,
    answer: answer.answer,
  }));
  
  res.status(200).json({
    success: true,
    data: candidateQuestionPaper,
  });
});

/**
 * @desc    Save answer
 * @route   POST /api/exam/:sessionId/answer
 * @access  Public
 */
const saveAnswer = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { questionId, sectionId, answer } = req.body;
  
  // Find session
  const session = await ExamSession.findById(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Exam session not found',
    });
  }
  
  // Check if session is still active
  if (session.status !== 'in-progress') {
    return res.status(400).json({
      success: false,
      message: 'Exam session is no longer active',
    });
  }
  
  // Check if exam time has expired
  const endTime = new Date(session.startTime.getTime() + session.duration * 60000);
  if (new Date() > endTime) {
    // Auto-submit the exam
    await session.submit(true);
    
    return res.status(400).json({
      success: false,
      message: 'Exam time has expired',
      data: {
        status: 'completed',
        isAutoSubmitted: true,
      },
    });
  }
  
  // Save answer
  await session.saveAnswer(questionId, sectionId, answer);
  
  res.status(200).json({
    success: true,
    message: 'Answer saved',
  });
});

/**
 * @desc    Submit exam
 * @route   POST /api/exam/:sessionId/submit
 * @access  Public
 */
const submitExam = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  // Find session
  const session = await ExamSession.findById(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Exam session not found',
    });
  }
  
  // Check if session is still active
  if (session.status !== 'in-progress') {
    return res.status(400).json({
      success: false,
      message: 'Exam session is already submitted',
    });
  }
  
  // Submit the exam
  await session.submit(false);
  
  // Update candidate session status
  const candidate = await Candidate.findById(session.candidate._id);
  
  const sessionIndex = candidate.sessions.findIndex(
    s => s.examCode === session.examCode && s.status === 'in-progress'
  );
  
  if (sessionIndex >= 0) {
    candidate.sessions[sessionIndex].status = 'completed';
    candidate.sessions[sessionIndex].endTime = session.endTime;
    await candidate.save();
  }
  
  // Trigger evaluation asynchronously (don't wait for it to complete)
  evaluateExam(session._id).catch(error => {
    logger.error(`Error evaluating exam ${session._id}: ${error.message}`);
  });
  
  // Send confirmation email to candidate
  const questionPaper = await QuestionPaper.findById(session.questionPaperId);
  
  emailService.sendExamConfirmationToCandidate(session, questionPaper).catch(error => {
    logger.error(`Error sending confirmation email: ${error.message}`);
  });
  
  logger.info(`Exam submitted: ${session.examCode} by ${session.candidate.name}`);
  
  res.status(200).json({
    success: true,
    message: 'Exam submitted successfully',
    data: {
      sessionId: session._id,
      submittedAt: session.submittedAt,
    },
  });
});

/**
 * @desc    Get unanswered questions
 * @route   GET /api/exam/:sessionId/unanswered
 * @access  Public
 */
const getUnansweredQuestions = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  // Find session
  const session = await ExamSession.findById(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Exam session not found',
    });
  }
  
  // Get unanswered questions
  const unanswered = await session.getUnansweredQuestions();
  
  res.status(200).json({
    success: true,
    data: {
      unanswered,
      count: unanswered.length,
    },
  });
});

/**
 * @desc    Get session status
 * @route   GET /api/exam/:sessionId/status
 * @access  Public
 */
const getSessionStatus = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  // Find session
  const session = await ExamSession.findById(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Exam session not found',
    });
  }
  
  // Calculate remaining time if session is in progress
  let remainingTime = 0;
  
  if (session.status === 'in-progress') {
    const endTime = new Date(session.startTime.getTime() + session.duration * 60000);
    remainingTime = Math.max(0, (endTime - new Date()) / 1000);
  }
  
  res.status(200).json({
    success: true,
    data: {
      status: session.status,
      startTime: session.startTime,
      endTime: session.endTime,
      submittedAt: session.submittedAt,
      duration: session.duration,
      remainingTime,
      isAutoSubmitted: session.isAutoSubmitted,
    },
  });
});

/**
 * Helper function to evaluate an exam asynchronously
 * @param {string} sessionId - Exam session ID
 */
const evaluateExam = async (sessionId) => {
  try {
    // Find session
    const session = await ExamSession.findById(sessionId);
    
    if (!session || session.status !== 'completed') {
      throw new Error('Session not found or not completed');
    }
    
    // Find question paper
    const questionPaper = await QuestionPaper.findById(session.questionPaperId);
    
    if (!questionPaper) {
      throw new Error('Question paper not found');
    }
    
    logger.info(`Starting evaluation for session ${sessionId}`);
    
    // Generate evaluation using LLM
    const { evaluation, prompt, rawResponse } = await llmService.evaluateAnswers(
      session,
      questionPaper
    );
    
    // Create evaluation record
    const evaluationRecord = new Evaluation({
      sessionId: session._id,
      candidateId: session.candidate._id,
      questionPaperId: questionPaper._id,
      overallScore: evaluation.overallScore,
      sectionScores: evaluation.sectionScores,
      questionEvaluations: evaluation.questionEvaluations,
      summary: evaluation.summary,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      llmPrompt: prompt,
      llmResponse: rawResponse,
    });
    
    // Save evaluation
    await evaluationRecord.save();
    
    // Update session status
    session.status = 'evaluated';
    session.evaluatedAt = new Date();
    await session.save();
    
    // Update candidate session status
    const candidate = await Candidate.findById(session.candidate._id);
    
    const sessionIndex = candidate.sessions.findIndex(
      s => s.examCode === session.examCode && s.status === 'completed'
    );
    
    if (sessionIndex >= 0) {
      candidate.sessions[sessionIndex].status = 'evaluated';
      await candidate.save();
    }
    
    // Generate PDF report
    const reportPath = await pdfService.generateEvaluationReport(
      evaluationRecord,
      session,
      questionPaper
    );
    
    // Update evaluation with report URL
    evaluationRecord.reportUrl = reportPath.split('/').pop(); // Just store filename
    await evaluationRecord.save();
    
    // Send email notification to admin
    await emailService.sendEvaluationToAdmin(
      evaluationRecord,
      session,
      questionPaper,
      reportPath
    );
    
    // Mark as sent to admin
    evaluationRecord.sentToAdmin = true;
    await evaluationRecord.save();
    
    logger.info(`Evaluation completed for session ${sessionId}`);
    return evaluationRecord;
  } catch (error) {
    logger.error(`Error in evaluation process: ${error.message}`);
    throw error;
  }
};

module.exports = {
  validateExamCode,
  startExam,
  getExamQuestionPaper,
  saveAnswer,
  submitExam,
  getUnansweredQuestions,
  getSessionStatus,
  evaluateExam,
};
