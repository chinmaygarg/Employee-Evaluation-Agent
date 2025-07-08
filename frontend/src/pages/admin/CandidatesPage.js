import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  IconButton,
  Avatar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Search as SearchIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { candidateAPI } from '../../services/api';

const CandidatesPage = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await candidateAPI.getAllCandidates({
        search: searchTerm,
        limit: 50
      });
      
      if (response.data.success) {
        setCandidates(response.data.data.candidates || []);
      } else {
        setError(response.data.message || 'Failed to fetch candidates');
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setError(error.response?.data?.message || 'Failed to fetch candidates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        fetchCandidates();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const filteredCandidates = searchTerm === '' ? candidates : candidates.filter(candidate => {
    return candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           candidate.mobile.includes(searchTerm);
  });

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading candidates...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
          Candidates
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Search */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Search candidates"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Box>

        {/* Candidates Grid */}
        <Grid container spacing={3}>
          {filteredCandidates.map((candidate) => (
            <Grid item xs={12} md={6} lg={4} key={candidate._id || candidate.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2 }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h2">
                        {candidate.name}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {candidate.email}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Mobile:</strong> {candidate.mobile}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Exams Taken:</strong> {candidate.sessions?.length || 0}
                  </Typography>
                  {candidate.sessions && candidate.sessions.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Last Exam:</strong> {new Date(candidate.sessions[candidate.sessions.length - 1].startTime).toLocaleDateString()}
                    </Typography>
                  )}

                  <Box sx={{ mt: 2 }}>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => navigate(`/admin/candidates/${candidate._id || candidate.id}`)}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredCandidates.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'No candidates found matching your search' : 'No candidates registered yet'}
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default CandidatesPage;