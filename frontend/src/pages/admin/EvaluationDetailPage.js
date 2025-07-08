import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { evaluationAPI } from '../../services/api';

const EvaluationDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [evaluation, setEvaluation] = useState(null);

  const fetchEvaluationDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await evaluationAPI.getEvaluationById(id);
      
      if (response.data.success) {
        setEvaluation(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch evaluation details');
      }
    } catch (error) {
      console.error('Error fetching evaluation details:', error);
      setError(error.response?.data?.message || 'Failed to fetch evaluation details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvaluationDetails();
  }, [fetchEvaluationDetails]);

  const handleDownloadReport = async () => {
    try {
      const response = await evaluationAPI.downloadReport(id);
      // Handle file download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `evaluation-report-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const handleDownloadAnswers = async () => {
    try {
      const response = await evaluationAPI.downloadAnswers(id);
      // Handle file download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `answers-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading answers:', error);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading evaluation details...</Typography>
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

  if (!evaluation) {
    return (
      <Container>
        <Alert severity="error">
          Evaluation not found.
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
            onClick={() => navigate('/admin/evaluations')}
            sx={{ mr: 2 }}
          >
            Back to Evaluations
          </Button>
          <Typography variant="h4" component="h1">
            Evaluation Details
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Candidate Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Name:</strong> {evaluation.candidate?.name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Email:</strong> {evaluation.candidate?.email || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Mobile:</strong> {evaluation.candidate?.mobile || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Exam Code:</strong> {evaluation.examCode || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Expert Evaluation Summary
              </Typography>
              {evaluation.overallFeedback ? (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2 }}>
                    {evaluation.overallFeedback}
                  </Typography>
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  No overall evaluation summary available.
                </Typography>
              )}

              {evaluation.strengthsAndWeaknesses && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Strengths & Areas for Improvement
                  </Typography>
                  {evaluation.strengthsAndWeaknesses.strengths && evaluation.strengthsAndWeaknesses.strengths.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" color="success.main" gutterBottom>
                        Strengths:
                      </Typography>
                      <Box component="ul" sx={{ pl: 2 }}>
                        {evaluation.strengthsAndWeaknesses.strengths.map((strength, index) => (
                          <Typography component="li" key={index} variant="body2" sx={{ mb: 0.5 }}>
                            {strength}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}
                  {evaluation.strengthsAndWeaknesses.weaknesses && evaluation.strengthsAndWeaknesses.weaknesses.length > 0 && (
                    <Box>
                      <Typography variant="subtitle1" color="warning.main" gutterBottom>
                        Areas for Improvement:
                      </Typography>
                      <Box component="ul" sx={{ pl: 2 }}>
                        {evaluation.strengthsAndWeaknesses.weaknesses.map((weakness, index) => (
                          <Typography component="li" key={index} variant="body2" sx={{ mb: 0.5 }}>
                            {weakness}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              <Typography variant="h6" gutterBottom>
                Section-wise Performance
              </Typography>
              {evaluation.sectionScores && evaluation.sectionScores.length > 0 ? (
                evaluation.sectionScores.map((section, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1">{section.sectionTitle}</Typography>
                      <Chip 
                        label={`${section.score}/${section.maxScore}`}
                        color={section.score >= section.maxScore * 0.7 ? 'success' : section.score >= section.maxScore * 0.5 ? 'warning' : 'error'}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ 
                      width: '100%', 
                      height: 8, 
                      bgcolor: 'grey.200', 
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ 
                        width: `${(section.score / section.maxScore) * 100}%`, 
                        height: '100%', 
                        bgcolor: section.score >= section.maxScore * 0.7 ? 'success.main' : section.score >= section.maxScore * 0.5 ? 'warning.main' : 'error.main',
                        transition: 'width 0.3s ease'
                      }} />
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">
                  No section-wise scores available.
                </Typography>
              )}

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Answers & Evaluation
              </Typography>
              {evaluation.questionEvaluations && evaluation.questionEvaluations.length > 0 ? (
                <Box>
                  {evaluation.questionEvaluations.map((qEval, qIndex) => (
                    <Card key={qIndex} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Question {qIndex + 1}: {qEval.questionText}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                          {qEval.answer || 'No answer provided'}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip 
                            label={`Score: ${qEval.score || 0}/${qEval.maxScore || 10}`}
                            color={(qEval.score || 0) >= (qEval.maxScore || 10) * 0.7 ? 'success' : 'warning'}
                          />
                        </Box>
                        {qEval.feedback && (
                          <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                            <strong>Feedback:</strong> {qEval.feedback}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  No evaluation data available.
                </Typography>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography><strong>Question Paper:</strong></Typography>
                <Typography color="text.secondary">{evaluation.questionPaper?.title || 'N/A'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography><strong>Status:</strong></Typography>
                <Chip label={evaluation.status || 'pending'} color="success" size="small" />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography><strong>Overall Score:</strong></Typography>
                <Typography variant="h4" color="primary">
                  {evaluation.overallScore || 0}%
                </Typography>
              </Box>
              {(evaluation.completionRate !== undefined || evaluation.accuracyRate !== undefined) && (
                <Box sx={{ mb: 2 }}>
                  <Typography><strong>Detailed Metrics:</strong></Typography>
                  <Typography color="text.secondary">
                    Completion: {evaluation.completionRate || 0}% 
                    ({evaluation.answeredCount || 0}/{evaluation.totalQuestions || 0} questions)
                  </Typography>
                  <Typography color="text.secondary">
                    Accuracy: {evaluation.accuracyRate || 0}% 
                    (of answered questions)
                  </Typography>
                </Box>
              )}
              <Box sx={{ mb: 3 }}>
                <Typography><strong>Completed:</strong></Typography>
                <Typography>{evaluation.createdAt ? new Date(evaluation.createdAt).toLocaleDateString() : 'N/A'}</Typography>
              </Box>
              
              <Button
                fullWidth
                variant="contained"
                startIcon={<DownloadIcon />}
                sx={{ mb: 1 }}
                onClick={handleDownloadReport}
              >
                Download Report
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadAnswers}
              >
                Download Answers
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default EvaluationDetailPage;