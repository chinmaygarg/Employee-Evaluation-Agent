import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  LinearProgress,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert
} from '@mui/material';
import {
  Timer as TimerIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { examAPI } from '../../services/api';

const ExamPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(3600); // Will be set from API
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]); // Flattened questions for navigation

  useEffect(() => {
    fetchExam();
  }, [sessionId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        if (prev === 300) { // 5 minutes remaining
          setShowWarningDialog(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchExam = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch exam data from API
      const response = await examAPI.getExamQuestionPaper(sessionId);
      
      if (response.data.success) {
        const examData = response.data.data;
        
        // Flatten all questions from all sections for easier navigation
        const flattenedQuestions = [];
        examData.sections.forEach((section, sectionIndex) => {
          section.questions.forEach((question, questionIndex) => {
            flattenedQuestions.push({
              ...question,
              sectionId: section._id,
              sectionTitle: section.title,
              sectionIndex,
              questionIndex,
              globalIndex: flattenedQuestions.length
            });
          });
        });
        
        setExam(examData);
        setAllQuestions(flattenedQuestions);
        setTimeRemaining(examData.remainingTime || examData.duration * 60);
        
        // Load existing answers
        if (examData.answers && examData.answers.length > 0) {
          const answerMap = {};
          examData.answers.forEach(answer => {
            answerMap[answer.questionId] = answer.answer;
          });
          setAnswers(answerMap);
        }
        
        console.log('Exam loaded:', {
          title: examData.title,
          sectionsCount: examData.sections.length,
          totalQuestions: flattenedQuestions.length,
          remainingTime: examData.remainingTime
        });
      } else {
        setError(response.data.message || 'Failed to load exam');
      }
    } catch (error) {
      console.error('Error fetching exam:', error);
      setError(error.response?.data?.message || 'Failed to load exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    // Auto-save answer with debouncing
    saveAnswer(questionId, answer);
  };

  const saveAnswer = async (questionId, answer) => {
    try {
      // Find the question to get section ID
      const question = allQuestions.find(q => q._id === questionId);
      if (!question) return;
      
      await examAPI.saveAnswer(sessionId, {
        questionId,
        sectionId: question.sectionId,
        answer
      });
      
      console.log('Answer saved:', { questionId, answer: answer.substring(0, 50) + '...' });
    } catch (error) {
      console.error('Error saving answer:', error);
      // Could show a toast notification here
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await examAPI.submitExam(sessionId);
      
      if (response.data.success) {
        // Navigate to completion page
        navigate(`/completion/${sessionId}`);
      } else {
        setError(response.data.message || 'Failed to submit exam');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      setError(error.response?.data?.message || 'Failed to submit exam. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    // Auto-submit when time runs out
    await handleSubmit();
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).filter(key => answers[key] && answers[key].trim() !== '').length;
  };

  const renderQuestion = (question) => {
    const answer = answers[question._id] || '';

    switch (question.type) {
      case 'mcq':
      case 'multiple-choice':
        return (
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 2 }}>
              Select your answer:
            </FormLabel>
            <RadioGroup
              value={answer}
              onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            >
              {question.options && question.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );
      
      case 'true_false':
        return (
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 2 }}>
              Select True or False:
            </FormLabel>
            <RadioGroup
              value={answer}
              onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            >
              <FormControlLabel
                value="True"
                control={<Radio />}
                label="True"
              />
              <FormControlLabel
                value="False"
                control={<Radio />}
                label="False"
              />
            </RadioGroup>
          </FormControl>
        );
      
      case 'fill_blank':
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Fill in the blank with the most appropriate answer:
            </Typography>
            <TextField
              fullWidth
              value={answer}
              onChange={(e) => handleAnswerChange(question._id, e.target.value)}
              placeholder="Enter your answer..."
              variant="outlined"
            />
          </Box>
        );
      
      case 'matching':
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Match the items by providing the correct pairs:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={answer}
              onChange={(e) => handleAnswerChange(question._id, e.target.value)}
              placeholder="Write your matching pairs here... (e.g., 1-A, 2-B, 3-C)"
              variant="outlined"
            />
          </Box>
        );
      
      case 'short_answer':
        return (
          <TextField
            fullWidth
            value={answer}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            placeholder="Enter a brief answer (1-2 sentences)..."
            variant="outlined"
          />
        );
      
      case 'essay':
        return (
          <TextField
            fullWidth
            multiline
            rows={10}
            value={answer}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            placeholder="Write a comprehensive essay answer..."
            variant="outlined"
          />
        );
      
      case 'problem_solving':
        return (
          <TextField
            fullWidth
            multiline
            rows={8}
            value={answer}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            placeholder="Provide step-by-step solution..."
            variant="outlined"
          />
        );
      
      case 'code_explanation':
        return (
          <TextField
            fullWidth
            multiline
            rows={6}
            value={answer}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            placeholder="Explain the code, algorithm, or concept..."
            variant="outlined"
          />
        );
      
      case 'case_study':
        return (
          <TextField
            fullWidth
            multiline
            rows={8}
            value={answer}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            placeholder="Analyze the case study and provide your solution..."
            variant="outlined"
          />
        );
      
      case 'design':
        return (
          <TextField
            fullWidth
            multiline
            rows={8}
            value={answer}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            placeholder="Describe your design approach, architecture, or solution..."
            variant="outlined"
          />
        );
      
      case 'descriptive':
      case 'short-answer':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={answer}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            placeholder="Enter your answer here..."
            variant="outlined"
          />
        );
      
      case 'long-answer':
        return (
          <TextField
            fullWidth
            multiline
            rows={8}
            value={answer}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            placeholder="Enter your detailed answer here..."
            variant="outlined"
          />
        );
      
      case 'coding':
        return (
          <TextField
            fullWidth
            multiline
            rows={12}
            value={answer}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            placeholder="Write your code here..."
            variant="outlined"
            sx={{ fontFamily: 'monospace' }}
          />
        );
      
      default:
        return (
          <TextField
            fullWidth
            multiline
            rows={6}
            value={answer}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            placeholder="Enter your answer here..."
            variant="outlined"
          />
        );
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography>Loading exam...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!exam || allQuestions.length === 0) {
    return (
      <Container>
        <Alert severity="error">
          Exam not found or session expired.
        </Alert>
      </Container>
    );
  }

  const currentQuestion = allQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / allQuestions.length) * 100;
  const answeredCount = getAnsweredCount();
  const unansweredCount = allQuestions.length - answeredCount;

  return (
    <Container maxWidth="lg">
      {/* Header with timer and progress */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h6">{exam.title}</Typography>
            <Typography variant="body2">
              Question {currentQuestionIndex + 1} of {allQuestions.length}
            </Typography>
          </Grid>
          <Grid item>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2">Answered</Typography>
                <Typography variant="h6">{answeredCount}/{allQuestions.length}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimerIcon sx={{ mr: 1 }} />
                <Typography variant="h6" color={timeRemaining < 300 ? 'error.light' : 'inherit'}>
                  {formatTime(timeRemaining)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ mt: 2, bgcolor: 'primary.dark', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }}
        />
      </Paper>

      {/* Question */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Chip label={currentQuestion.sectionTitle} color="primary" size="small" sx={{ mb: 1 }} />
            <Typography variant="h6" component="h2">
              Question {currentQuestionIndex + 1}
            </Typography>
          </Box>
          <Chip label={`${currentQuestion.marks} points`} variant="outlined" />
        </Box>
        
        <Typography variant="body1" sx={{ mb: 3, fontSize: '1.1rem' }}>
          {currentQuestion.text}
        </Typography>
        
        {renderQuestion(currentQuestion)}
      </Paper>

      {/* Navigation */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
          >
            Previous
          </Button>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', maxWidth: 400, justifyContent: 'center' }}>
            {allQuestions.map((question, index) => (
              <Button
                key={question._id}
                variant={index === currentQuestionIndex ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setCurrentQuestionIndex(index)}
                color={answers[question._id] ? 'success' : 'primary'}
                sx={{ minWidth: 36, height: 36 }}
              >
                {index + 1}
              </Button>
            ))}
          </Box>
          
          <Box>
            {currentQuestionIndex === allQuestions.length - 1 ? (
              <Button
                variant="contained"
                color="success"
                onClick={() => setShowSubmitDialog(true)}
                startIcon={<CheckCircleIcon />}
              >
                Submit Exam
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)}>
        <DialogTitle>Submit Exam</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to submit your exam?
          </Typography>
          {unansweredCount > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              You have {unansweredCount} unanswered questions. 
              You can still submit, but consider reviewing them first.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="success"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Time Warning Dialog */}
      <Dialog open={showWarningDialog} onClose={() => setShowWarningDialog(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <WarningIcon color="warning" sx={{ mr: 1 }} />
          Time Warning
        </DialogTitle>
        <DialogContent>
          <Typography>
            You have 5 minutes remaining! The exam will be automatically submitted when time expires.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWarningDialog(false)} variant="contained">
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ExamPage;