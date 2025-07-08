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
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { candidateAPI } from '../../services/api';

const CandidateDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [candidate, setCandidate] = useState(null);

  const fetchCandidateDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await candidateAPI.getCandidateById(id);
      
      if (response.data.success) {
        setCandidate(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch candidate details');
      }
    } catch (error) {
      console.error('Error fetching candidate details:', error);
      setError(error.response?.data?.message || 'Failed to fetch candidate details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCandidateDetails();
  }, [fetchCandidateDetails]);

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading candidate details...</Typography>
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

  if (!candidate) {
    return (
      <Container>
        <Alert severity="error">
          Candidate not found.
        </Alert>
      </Container>
    );
  }

  const evaluations = candidate.evaluations || [];
  const avgScore = evaluations.length > 0 
    ? Math.round(evaluations.reduce((sum, evaluation) => {
        return sum + (evaluation.overallScore || 0);
      }, 0) / evaluations.length)
    : 0;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/candidates')}
            sx={{ mr: 2 }}
          >
            Back to Candidates
          </Button>
          <Typography variant="h4" component="h1">
            Candidate Details
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}>
                <PersonIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {candidate.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <EmailIcon sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">
                  {candidate.email}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <PhoneIcon sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">
                  {candidate.mobile}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Registered:</strong> {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : 'N/A'}
              </Typography>
            </Paper>

            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Total Evaluations</Typography>
                <Typography variant="h4" color="primary">{evaluations.length}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Average Score</Typography>
                <Typography variant="h4" color="success.main">{avgScore}%</Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Exam History & Evaluations
              </Typography>
              {candidate.evaluations && candidate.evaluations.length > 0 ? (
                <List>
                  {candidate.evaluations.map((evaluation) => (
                    <ListItem key={evaluation._id} divider>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1">
                              {evaluation.questionPaper?.title || 'Unknown Paper'}
                            </Typography>
                            <Chip
                              label={`${evaluation.overallScore || 0}%`}
                              color={(evaluation.overallScore || 0) >= 70 ? 'success' : 'warning'}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Exam Code:</strong> {evaluation.examCode}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Session ID:</strong> {evaluation.sessionId}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Started:</strong> {evaluation.startTime ? new Date(evaluation.startTime).toLocaleString() : 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Evaluated:</strong> {evaluation.evaluatedAt ? new Date(evaluation.evaluatedAt).toLocaleString() : 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Duration:</strong> {evaluation.duration ? `${evaluation.duration} minutes` : 'N/A'}
                            </Typography>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              sx={{ mt: 1 }}
                              onClick={() => navigate(`/admin/evaluations/${evaluation._id}`)}
                            >
                              View Evaluation Details
                            </Button>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  No evaluations found for this candidate.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default CandidateDetailPage;