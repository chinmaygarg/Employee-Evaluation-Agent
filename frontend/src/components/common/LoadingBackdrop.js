import React from 'react';
import { useSelector } from 'react-redux';
import { Backdrop, CircularProgress, Typography, Box } from '@mui/material';

const LoadingBackdrop = () => {
  const { global: isLoading } = useSelector((state) => state.ui.loading);

  return (
    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 2, flexDirection: 'column' }}
      open={isLoading}
    >
      <CircularProgress color="inherit" />
      <Box mt={2}>
        <Typography variant="h6">Loading...</Typography>
      </Box>
    </Backdrop>
  );
};

export default LoadingBackdrop;
