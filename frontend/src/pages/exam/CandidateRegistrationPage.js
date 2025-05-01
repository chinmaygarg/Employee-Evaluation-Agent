import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import { HowToReg as RegisterIcon } from '@mui/icons-material';
import { validateExamCode, startExam, clearError } from '../../store/slices/examSlice';

const CandidateRegistrationPage = () => {
  const { examCode } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
  });
  const [formErrors, setFormErrors] = useState({});
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, examInfo, sessionId } = useSelector((state) => state.exam);
  
  // If we don't have exam info, validate the exam code
  useEffect(() => {
    if (!examInfo && examCode) {
      dispatch(validateExamCode(examCode));
    }
  }, [examCode, examInfo, dispatch]);
  
  // If session ID is available, navigate to instructions
  useEffect(() => {
    if (sessionId) {
      navigate(`/instructions/${sessionId}`);
    }
  }, [sessionId, navigate]);
  
  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^\d{10,15}$/;
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (!mobileRegex.test(formData.mobile)) {
      errors.mobile = 'Please enter a valid mobile number (10-15 digits)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      dispatch(startExam({
        ...formData,
        examCode,
      }));
    }
  };
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Candidate Registration
          </Typography>
          
          {examInfo && (
            <Box sx={{ mb: 2 }}>
              <Chip 
                label={`Exam: ${examInfo.title}`} 
                color="primary" 
                sx={{ mr: 1, mb: 1 }} 
              />
              <Chip 
                label={`Job Role: ${examInfo.jobRole}`} 
                color="secondary" 
                sx={{ mr: 1, mb: 1 }} 
              />
              <Chip 
                label={`Duration: ${examInfo.duration} minutes`} 
                color="info" 
                sx={{ mb: 1 }} 
              />
            </Box>
          )}
          
          <Divider>
            <Chip label="Please fill in your details to begin" />
          </Divider>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                disabled={loading}
                autoFocus
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="mobile"
                label="Mobile Number"
                name="mobile"
                autoComplete="tel"
                value={formData.mobile}
                onChange={handleChange}
                error={!!formErrors.mobile}
                helperText={formErrors.mobile}
                disabled={loading}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, mb: 2 }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <RegisterIcon />}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register & Start Exam'}
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            By proceeding, you agree to the examination terms and conditions. Your answers will be saved automatically.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default CandidateRegistrationPage;
