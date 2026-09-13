import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import HeadingInfo from '../../components/common/HeadingInfo';

const SettingsPage = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
        System Settings
        <HeadingInfo text="Configure enterprise rules, tailor tolerances, and manage roles." />
      </Typography>
      
      <Card>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            Enterprise Rules & Parameters
          </Typography>
          <Typography variant="body2" color="text.disabled">
            This module will define system thresholds, API connection endpoints, notification triggers, and user access permissions (RBAC).
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SettingsPage;
