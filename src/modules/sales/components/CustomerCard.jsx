import React from 'react';
import { Card, CardContent, CardHeader, Divider, Stack, Typography } from '@mui/material';

const CustomerCard = ({ customer }) => {
  return (
    <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
      <CardHeader title="Customer Details" sx={{ '& .MuiCardHeader-title': { fontWeight: 700 } }} />
      <Divider />
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            Name
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>{customer?.name || '-'}</Typography>
          <Divider />
          <Typography variant="body2" color="text.secondary">
            Mobile
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>{customer?.mobile || '-'}</Typography>
          <Divider />
          <Typography variant="body2" color="text.secondary">
            Email
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>{customer?.email || '-'}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default CustomerCard;
