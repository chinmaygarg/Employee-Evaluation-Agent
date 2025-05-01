import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Box, 
  CssBaseline, 
  Toolbar, 
  Typography, 
  Container,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { clearExamState } from '../../store/slices/examSlice';

const ExamLayout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const { sessionId, isSubmitted } = useSelector((state) => state.exam);
  const [openDialog, setOpenDialog] = React.useState(false);
  
  // Determine if we should show the return to home button
  const showHomeButton = !location.pathname.includes('/exam/') || isSubmitted;
  
  // Check if user is trying to leave an active exam
  const handleNavigateHome = () => {
    if (sessionId && !isSubmitted && location.pathname.includes('/exam/')) {
      setOpenDialog(true);
    } else {
      returnToHome();
    }
  };
  
  const returnToHome = () => {
    dispatch(clearExamState());
    navigate('/');
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Smart Examination System
          </Typography>
          {showHomeButton && (
            <Button color="inherit" onClick={handleNavigateHome}>
              Return to Home
            </Button>
          )}
        </Toolbar>
      </AppBar>
      
      <Container 
        component="main" 
        maxWidth="lg" 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          py: 4
        }}
      >
        <Outlet /> {/* Render child routes */}
      </Container>
      
      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          px: 2, 
          mt: 'auto', 
          backgroundColor: theme.palette.grey[200]
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Smart Examination System. All rights reserved.
          </Typography>
        </Container>
      </Box>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Are you sure you want to leave?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            You have an active exam session. If you leave now, your progress will be saved,
            but you may not be able to return to this exam. Are you sure you want to exit?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={returnToHome} autoFocus>
            Exit Exam
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExamLayout;
