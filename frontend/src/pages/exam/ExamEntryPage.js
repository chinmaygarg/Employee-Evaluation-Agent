import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { validateExamCode, clearError } from '../../store/slices/examSlice';
import examImage from '../../assets/exam_illustration.svg';

const ExamEntryPage = () => {
  const [examCode, setExamCode] = useState('');
  const [codeError, setCodeError] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, examInfo } = useSelector((state) => state.exam);
  
  // Clear exam state when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);
  
  // If exam code is validated, navigate to registration
  useEffect(() => {
    if (examInfo && examInfo.examCode) {
      navigate(`/register/${examInfo.examCode}`);
    }
  }, [examInfo, navigate]);
  
  const validateForm = () => {
    if (!examCode.trim()) {
      setCodeError('Please enter an exam code');
      return false;
    }
    
    setCodeError('');
    return true;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      dispatch(validateExamCode(examCode.trim()));
    }
  };
  
  return (
    <Container maxWidth="md">
      <Grid container spacing={4} alignItems="center">
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ backgroundColor: 'transparent' }}>
            <CardMedia
              component="img"
              image={examImage}
              alt="Examination"
              sx={{ height: 280, objectFit: 'contain' }}
            />
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Smart Examination System
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Enter your unique exam code to start the assessment. The code should have been provided to you by your administrator.
              </Typography>
              <Box mt={2}>
                <Divider />
              </Box>
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Note: Once you start the exam, you will have limited time to complete it. Ensure you are ready before proceeding.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h5" align="center" gutterBottom>
              Enter Exam Code
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="examCode"
                label="Exam Code"
                name="examCode"
                autoFocus
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                error={!!codeError}
                helperText={codeError}
                disabled={loading}
                placeholder="e.g., DEV-ABCD1234-123456"
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                endIcon={<SendIcon />}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                    Validating...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              Make sure you have entered the code exactly as provided.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ExamEntryPage;
