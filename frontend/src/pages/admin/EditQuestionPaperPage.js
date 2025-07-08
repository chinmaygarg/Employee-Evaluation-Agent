import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { questionPaperAPI } from '../../services/api';

const EditQuestionPaperPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [questionPaper, setQuestionPaper] = useState(null);

  const fetchQuestionPaper = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    fetchQuestionPaper();
  }, [fetchQuestionPaper]);

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
            Edit Question Paper
          </Typography>
        </Box>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            {questionPaper.title}
          </Typography>
          <Typography color="text.secondary">
            This is a placeholder for the edit question paper functionality.
            The full editing interface will be implemented here.
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Alert severity="info">
              Edit functionality coming soon. This will allow you to modify questions,
              sections, and other paper details.
            </Alert>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default EditQuestionPaperPage;