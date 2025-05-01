import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

const EmptyState = ({
  title = 'No data found',
  description = 'There are no items to display.',
  icon = null,
  action = null,
  actionText = 'Action',
  onActionClick,
}) => {
  return (
    <Paper
      sx={{
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        my: 2,
      }}
    >
      {icon && <Box sx={{ mb: 2, color: 'text.secondary' }}>{icon}</Box>}
      
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 450 }}>
        {description}
      </Typography>
      
      {action && (
        <Button variant="contained" color="primary" onClick={onActionClick}>
          {actionText}
        </Button>
      )}
    </Paper>
  );
};

export default EmptyState;
