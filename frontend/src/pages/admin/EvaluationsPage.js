import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { evaluationAPI } from '../../services/api';

const EvaluationsPage = () => {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchEvaluations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await evaluationAPI.getAllEvaluations({
        search: searchTerm,
        status: statusFilter,
        limit: 50,  // Get more evaluations
        page: 1
      });
      
      if (response.data.success) {
        setEvaluations(response.data.data.evaluations || []);
      } else {
        setError(response.data.message || 'Failed to fetch evaluations');
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      setError(error.response?.data?.message || 'Failed to fetch evaluations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEvaluations();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownloadReport = async (evaluationId) => {
    try {
      const response = await evaluationAPI.downloadReport(evaluationId);
      // Handle file download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `evaluation-report-${evaluationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'evaluated': return 'success';
      case 'pending': return 'warning';
      case 'in-progress': return 'info';
      default: return 'default';
    }
  };

  const filteredEvaluations = evaluations.filter(evaluation => {
    const candidateName = evaluation.candidate?.name || '';
    const candidateEmail = evaluation.candidate?.email || '';
    const examCode = evaluation.examCode || '';
    
    const matchesSearch = candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         examCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || evaluation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading evaluations...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
          Evaluations
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Search"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ flexGrow: 1 }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="evaluated">Evaluated</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Evaluations Grid */}
        <Grid container spacing={3}>
          {filteredEvaluations.map((evaluation) => (
            <Grid item xs={12} md={6} lg={4} key={evaluation.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2">
                      {evaluation.candidate?.name || 'Unknown Candidate'}
                    </Typography>
                    <Chip
                      label={evaluation.status || 'pending'}
                      color={getStatusColor(evaluation.status)}
                      size="small"
                    />
                  </Box>

                  <Typography color="text.secondary" gutterBottom>
                    {evaluation.candidate?.email || 'No email'}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Paper:</strong> {evaluation.questionPaper?.title || evaluation.title || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Code:</strong> {evaluation.examCode || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Score:</strong> {evaluation.overallScore || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Completed:</strong> {evaluation.createdAt ? new Date(evaluation.createdAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Evaluated:</strong> {evaluation.evaluatedAt ? new Date(evaluation.evaluatedAt).toLocaleDateString() : 'N/A'}
                  </Typography>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => navigate(`/admin/evaluations/${evaluation.id}`)}
                    >
                      View Details
                    </Button>
                    <IconButton 
                      size="small"
                      onClick={() => handleDownloadReport(evaluation.id)}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredEvaluations.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              {searchTerm || statusFilter ? 'No evaluations found matching your criteria' : 'No evaluations available yet'}
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default EvaluationsPage;