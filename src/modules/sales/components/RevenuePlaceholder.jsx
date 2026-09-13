import React from 'react';
import { Card, CardHeader, CardContent, Box, Typography } from '@mui/material';

const RevenuePlaceholder = () => (
  <Card sx={{ borderRadius: 2, minHeight: 300 }}>
    <CardHeader title="Revenue Overview" />
    <CardContent>
      <Box sx={{ height: 220, border: '1px dashed #CBD5E1', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
          Chart Coming Soon
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

export default RevenuePlaceholder;
