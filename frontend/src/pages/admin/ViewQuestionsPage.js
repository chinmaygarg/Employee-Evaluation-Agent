import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { questionPaperAPI, llmAPI } from '../../services/api';

const ViewQuestionsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [questionPaper, setQuestionPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [regenerateDialog, setRegenerateDialog] = useState({ 
    open: false, 
    questionId: null, 
    sectionIndex: null,
    questionIndex: null,
    prompt: ''
  });
  const [regenerating, setRegenerating] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    questionId: null,
    sectionIndex: null,
    questionIndex: null
  });

  useEffect(() => {
    fetchQuestionPaper();
  }, [id]);

  const fetchQuestionPaper = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await questionPaperAPI.getQuestionPaperById(id);
      
      if (response.data.success) {
        setQuestionPaper(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch question paper');
      }
    } catch (error) {
      console.error('Error fetching question paper:', error);
      setError(error.response?.data?.message || 'Failed to fetch question paper');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateQuestion = async () => {
    try {
      setRegenerating(true);
      setError(''); // Clear any previous errors
      
      const originalQuestion = questionPaper.sections[regenerateDialog.sectionIndex].questions[regenerateDialog.questionIndex];
      
      console.log('Regenerating question with data:', {
        questionPaperId: id,
        sectionTitle: questionPaper.sections[regenerateDialog.sectionIndex].title,
        questionType: originalQuestion.type,
        jobRole: questionPaper.jobRole,
        skills: questionPaper.skills,
        experience: questionPaper.experience,
        difficulty: originalQuestion.difficulty || 'medium',
        customPrompt: regenerateDialog.prompt
      });
      
      // Call LLM API to regenerate question
      const response = await llmAPI.regenerateQuestion({
        questionPaperId: id,
        sectionTitle: questionPaper.sections[regenerateDialog.sectionIndex].title,
        questionType: originalQuestion.type,
        jobRole: questionPaper.jobRole,
        skills: questionPaper.skills,
        experience: questionPaper.experience,
        difficulty: originalQuestion.difficulty || 'medium',
        customPrompt: regenerateDialog.prompt
      });
      
      console.log('Regeneration response:', response);
      
      if (response.data.success) {
        // Update the question paper with new question
        const updatedQuestionPaper = { ...questionPaper };
        const newQuestion = response.data.data.question;
        
        // Map the new question fields to match the existing structure
        const mappedQuestion = {
          ...originalQuestion,
          text: newQuestion.question || newQuestion.text,
          question: newQuestion.question || newQuestion.text,
          type: newQuestion.type,
          marks: newQuestion.marks,
          difficulty: newQuestion.difficulty,
          options: newQuestion.options || [],
          correctAnswer: newQuestion.correctAnswer,
          expectedAnswer: newQuestion.correctAnswer || newQuestion.expectedAnswer,
          keywords: newQuestion.keywords || [],
          updatedAt: new Date()
        };
        
        updatedQuestionPaper.sections[regenerateDialog.sectionIndex].questions[regenerateDialog.questionIndex] = mappedQuestion;
        
        setQuestionPaper(updatedQuestionPaper);
        setRegenerateDialog({ open: false, questionId: null, sectionIndex: null, questionIndex: null, prompt: '' });
        
        // Save updated question paper
        await questionPaperAPI.updateQuestionPaper(id, updatedQuestionPaper);
        
        console.log('Question regenerated and saved successfully');
      } else {
        const errorMsg = response.data.message || 'Failed to regenerate question';
        console.error('Regeneration failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error('Error regenerating question:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to regenerate question. Please try again.';
      setError(errorMsg);
    } finally {
      setRegenerating(false);
    }
  };

  const handleDeleteQuestion = async () => {
    try {
      const updatedQuestionPaper = { ...questionPaper };
      updatedQuestionPaper.sections[deleteDialog.sectionIndex].questions.splice(deleteDialog.questionIndex, 1);
      
      // Update question counts
      updatedQuestionPaper.sections[deleteDialog.sectionIndex].questionCount = 
        updatedQuestionPaper.sections[deleteDialog.sectionIndex].questions.length;
      
      setQuestionPaper(updatedQuestionPaper);
      setDeleteDialog({ open: false, questionId: null, sectionIndex: null, questionIndex: null });
      
      // Save updated question paper
      await questionPaperAPI.updateQuestionPaper(id, updatedQuestionPaper);
    } catch (error) {
      console.error('Error deleting question:', error);
      setError(error.response?.data?.message || 'Failed to delete question');
    }
  };

  const getQuestionTypeColor = (type) => {
    const colors = {
      'mcq': 'primary',
      'true_false': 'secondary',
      'fill_blank': 'success',
      'matching': 'warning',
      'descriptive': 'info',
      'coding': 'error',
      'short_answer': 'default'
    };
    return colors[type] || 'default';
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading question paper...</Typography>
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

  if (!questionPaper) {
    return (
      <Container>
        <Alert severity="error">
          Question paper not found.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/question-papers')}
            sx={{ mr: 2 }}
          >
            Back to Question Papers
          </Button>
          <Typography variant="h4" component="h1">
            View Questions: {questionPaper.title}
          </Typography>
        </Box>

        {/* Question Paper Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography><strong>Job Role:</strong> {questionPaper.jobRole}</Typography>
                <Typography><strong>Experience:</strong> {questionPaper.experience}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><strong>Duration:</strong> {questionPaper.duration} minutes</Typography>
                <Typography><strong>Question Type:</strong> {questionPaper.questionType || 'Mixed'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>Skills:</strong></Typography>
                <Box sx={{ mt: 1 }}>
                  {questionPaper.skills.map((skill) => (
                    <Chip key={skill} label={skill} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Sections and Questions */}
        {questionPaper.sections.map((section, sectionIndex) => (
          <Accordion key={sectionIndex} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                {section.title} ({section.questions.length} questions)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {section.questions.map((question, questionIndex) => (
                <Card key={questionIndex} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" sx={{ mr: 2 }}>
                            Question {questionIndex + 1}
                          </Typography>
                          <Chip 
                            label={question.type} 
                            color={getQuestionTypeColor(question.type)}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Chip 
                            label={`${question.marks || 10} marks`}
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {question.text || question.question}
                        </Typography>
                        
                        {/* Show options for MCQ, True/False, etc. */}
                        {question.options && question.options.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>Options:</Typography>
                            {question.options.map((option, optionIndex) => (
                              <Typography 
                                key={optionIndex} 
                                variant="body2" 
                                sx={{ 
                                  ml: 2, 
                                  color: option === (question.correctAnswer || question.expectedAnswer) ? 'success.main' : 'text.secondary',
                                  fontWeight: option === (question.correctAnswer || question.expectedAnswer) ? 'bold' : 'normal'
                                }}
                              >
                                {String.fromCharCode(65 + optionIndex)}. {option}
                                {option === (question.correctAnswer || question.expectedAnswer) && ' ✓'}
                              </Typography>
                            ))}
                          </Box>
                        )}

                        {/* Show correct answer for non-MCQ questions */}
                        {(question.correctAnswer || question.expectedAnswer) && !question.options && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>Expected Answer:</Typography>
                            <Typography variant="body2" sx={{ color: 'success.main', fontStyle: 'italic' }}>
                              {question.correctAnswer || question.expectedAnswer}
                            </Typography>
                          </Box>
                        )}

                        {/* Show keywords for evaluation */}
                        {question.keywords && question.keywords.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>Evaluation Keywords:</Typography>
                            <Box>
                              {question.keywords.map((keyword, idx) => (
                                <Chip key={idx} label={keyword} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => setRegenerateDialog({
                            open: true,
                            questionId: question._id,
                            sectionIndex,
                            questionIndex,
                            prompt: ''
                          })}
                          title="Regenerate Question"
                        >
                          <RefreshIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog({
                            open: true,
                            questionId: question._id,
                            sectionIndex,
                            questionIndex
                          })}
                          title="Delete Question"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Regenerate Question Dialog */}
      <Dialog 
        open={regenerateDialog.open} 
        onClose={() => setRegenerateDialog({ open: false, questionId: null, sectionIndex: null, questionIndex: null, prompt: '' })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Regenerate Question</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Provide additional instructions for regenerating this question (optional):
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Custom prompt"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={regenerateDialog.prompt}
            onChange={(e) => setRegenerateDialog(prev => ({ ...prev, prompt: e.target.value }))}
            placeholder="e.g., Make it more challenging, focus on practical scenarios, etc."
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setRegenerateDialog({ open: false, questionId: null, sectionIndex: null, questionIndex: null, prompt: '' })}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRegenerateQuestion}
            variant="contained"
            disabled={regenerating}
            startIcon={regenerating ? <CircularProgress size={20} /> : <RefreshIcon />}
          >
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Question Dialog */}
      <Dialog 
        open={deleteDialog.open} 
        onClose={() => setDeleteDialog({ open: false, questionId: null, sectionIndex: null, questionIndex: null })}
      >
        <DialogTitle>Delete Question</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this question? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, questionId: null, sectionIndex: null, questionIndex: null })}
          >
            Cancel
          </Button>
          <Button onClick={handleDeleteQuestion} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ViewQuestionsPage;