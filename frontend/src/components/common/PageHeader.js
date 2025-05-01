import React from 'react';
import { Box, Typography, Button, Breadcrumbs, Link, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const PageHeader = ({ 
  title, 
  subtitle, 
  breadcrumbs = [], 
  action = null,
  actionText = 'Action',
  actionIcon = null,
  onActionClick
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          aria-label="breadcrumb"
          sx={{ mb: 1 }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return isLast ? (
              <Typography key={index} color="text.primary">
                {crumb.text}
              </Typography>
            ) : (
              <Link
                key={index}
                component={RouterLink}
                to={crumb.to}
                underline="hover"
                color="inherit"
              >
                {crumb.text}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}
      
      {/* Header with action button */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="subtitle1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        
        {action && (
          <Button
            variant="contained"
            color="primary"
            startIcon={actionIcon}
            onClick={onActionClick}
          >
            {actionText}
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default PageHeader;
