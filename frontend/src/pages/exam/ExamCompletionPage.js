import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { examAPI } from '../../services/api';

const ExamCompletionPage = () => {
  const { sessionId } = useParams();
  const [examResult, setExamResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExamResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const fetchExamResult = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get session status first
      const sessionResponse = await examAPI.getSessionStatus(sessionId);
      
      if (sessionResponse.data.success) {
        const sessionData = sessionResponse.data.data;
        
        // Get exam paper details
        const examResponse = await examAPI.getExamQuestionPaper(sessionId, true);
        
        if (examResponse.data.success) {
          const examData = examResponse.data.data;
          
          // Get unanswered questions count
          const unansweredResponse = await examAPI.getUnansweredQuestions(sessionId);
          const unansweredCount = unansweredResponse.data.success ? 
            unansweredResponse.data.data.count : 0;
          
          // Calculate total questions from exam data
          const totalQuestions = examData.sections.reduce((total, section) => 
            total + section.questions.length, 0);
          
          // Calculate time spent
          const timeSpentMs = sessionData.endTime ? 
            new Date(sessionData.endTime) - new Date(sessionData.startTime) :
            Date.now() - new Date(sessionData.startTime);
          const timeSpentMinutes = Math.floor(timeSpentMs / (1000 * 60));
          
          setExamResult({
            sessionId,
            examCode: sessionData.examCode || examData.examCode,
            examTitle: examData.title,
            jobRole: examData.jobRole,
            submittedAt: sessionData.submittedAt ? new Date(sessionData.submittedAt) : new Date(),
            questionsCount: totalQuestions,
            answeredCount: totalQuestions - unansweredCount,
            timeSpent: timeSpentMinutes,
            totalTime: examData.duration,
            status: sessionData.status,
            isAutoSubmitted: sessionData.isAutoSubmitted
          });
        } else {
          setError('Failed to load exam details');
        }
      } else {
        setError(sessionResponse.data.message || 'Failed to load session details');
      }
    } catch (error) {
      console.error('Error fetching exam result:', error);
      setError(error.response?.data?.message || 'Failed to load exam completion details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 400,
          textAlign: 'center'
        }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Loading exam completion details...
          </Typography>
          <Typography color="text.secondary">
            Please wait while we retrieve your submission information.
          </Typography>
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

  if (!examResult) {
    return (
      <Container>
        <Alert severity="error">
          Unable to load exam completion details.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Success Header */}
        <Paper sx={{ p: 4, mb: 4, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
          <CheckCircleIcon sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Exam Submitted Successfully!
          </Typography>
          {examResult.isAutoSubmitted && (
            <Typography variant="body1" sx={{ mb: 1 }}>
              (Auto-submitted due to time expiry)
            </Typography>
          )}
          <Typography variant="h6">
            Your submission has been recorded
          </Typography>
        </Paper>

        {/* Exam Summary */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ mr: 1 }} />
            Exam Summary
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Exam Title
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {examResult.examTitle}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Exam Code
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {examResult.examCode}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Submitted At
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {examResult.submittedAt.toLocaleString()}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Questions Answered
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {examResult.answeredCount} of {examResult.questionsCount}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Time Spent
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {examResult.timeSpent} of {examResult.totalTime} minutes
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip 
                  label={examResult.status} 
                  color="success" 
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* What's Next */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ScheduleIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Evaluation Process
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Your answers are being evaluated by our AI system. This process typically takes a few minutes.
                  The evaluation includes checking for accuracy, relevance, and quality of your responses.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmailIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Results Notification
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Once the evaluation is complete, the results will be automatically sent to the hiring team.
                  You may also receive a copy if configured by the administrator.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Important Notes */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Important:</strong> Please save your session ID for reference: <strong>{sessionId}</strong>
            <br />
            You can now safely close this window. If you have any questions about your exam submission, 
            please contact the administrator with your session ID.
          </Typography>
        </Alert>

        {/* Action Button */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => window.location.href = '/'}
          >
            Take Another Exam
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ExamCompletionPage;