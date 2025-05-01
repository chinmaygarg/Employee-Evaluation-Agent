import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
  Alert,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Timer as TimerIcon,
  Save as SaveIcon,
  Block as BlockIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  PlayArrow as StartIcon,
} from '@mui/icons-material';
import { getExamQuestionPaper, getSessionStatus } from '../../store/slices/examSlice';

const ExamInstructionsPage = () => {
  const { sessionId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { loading, error, questionPaper, sessionStatus } = useSelector((state) => state.exam);
  
  // Fetch session status and question paper
  useEffect(() => {
    if (sessionId) {
      dispatch(getSessionStatus(sessionId));
      dispatch(getExamQuestionPaper(sessionId));
    }
  }, [sessionId, dispatch]);
  
  // If session is already completed, redirect to completion page
  useEffect(() => {
    if (sessionStatus === 'completed' || sessionStatus === 'evaluated') {
      navigate(`/completion/${sessionId}`);
    }
  }, [sessionStatus, sessionId, navigate]);
  
  const handleStartExam = () => {
    navigate(`/exam/${sessionId}`);
  };
  
  // Loading state
  if (loading && !questionPaper) {
    return (
      <Container maxWidth="md" sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading exam information...
        </Typography>
      </Container>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          Return to Home
        </Button>
      </Container>
    );
  }
  
  // No question paper yet
  if (!questionPaper) {
    return (
      <Container maxWidth="md" sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">
          Exam information not available
        </Typography>
        <Button variant="contained" sx={{ mt: 4 }} onClick={() => navigate('/')}>
          Return to Home
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Exam Instructions
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            <Typography variant="h6" gutterBottom>
              Important Guidelines:
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <TimerIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Time Limit" 
                  secondary={`This exam has a time limit of ${questionPaper.duration} minutes. A timer will be displayed during the exam.`} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <SaveIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Auto-Save" 
                  secondary="Your answers are automatically saved. In case of connection issues, you can resume where you left off." 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <BlockIcon color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary="No Copy-Paste" 
                  secondary="Copy-paste functionality is disabled during the exam to maintain integrity." 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Submit Anytime" 
                  secondary="You can submit the exam before the time limit if you finish early." 
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color="warning" />
                </ListItemIcon>
                <ListItemText 
                  primary="Auto-Submit" 
                  secondary="The exam will be automatically submitted when the time expires." 
                />
              </ListItem>
            </List>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Exam Details
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  <strong>Title:</strong> {questionPaper.title}
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  <strong>Job Role:</strong> {questionPaper.jobRole}
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  <strong>Duration:</strong> {questionPaper.duration} minutes
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  <strong>Sections:</strong> {questionPaper.sections.length}
                </Typography>
                
                <Typography variant="body1">
                  <strong>Total Questions:</strong> {questionPaper.sections.reduce(
                    (total, section) => total + section.questions.length, 0
                  )}
                </Typography>
              </CardContent>
            </Card>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Please ensure you have a stable internet connection before starting the exam.
            </Alert>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              By clicking "Start Exam", you agree to the examination rules and conditions.
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<StartIcon />}
            onClick={handleStartExam}
            disabled={loading}
          >
            Start Exam
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ExamInstructionsPage;
