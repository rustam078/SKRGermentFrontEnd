import React from 'react';
import { Box, Card, CardContent, CardHeader, Divider, Stack, Typography } from '@mui/material';

const InvoiceSummary = ({ invoice }) => {
  const formatAmount = (value) => (value != null ? `₹${Number(value).toLocaleString('en-IN')}` : '-');

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
      <CardHeader title="Invoice Summary" sx={{ '& .MuiCardHeader-title': { fontWeight: 700 } }} />
      <Divider />
      <CardContent>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Subtotal</Typography>
            <Typography sx={{ fontWeight: 700 }}>{formatAmount(invoice.subtotal)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Discount</Typography>
            <Typography>{formatAmount(invoice.discount)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Tax</Typography>
            <Typography>{formatAmount(invoice.tax)}</Typography>
          </Box>
          <Divider />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 700 }}>Grand Total</Typography>
            <Typography sx={{ fontWeight: 700 }}>{formatAmount(invoice.grandTotal)}</Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Payment Mode
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>{invoice.paymentMode || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Payment Provider
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>{invoice.paymentProvider || '-'}</Typography>
          </Box>
          {invoice.remarks ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Remarks
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>{invoice.remarks}</Typography>
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default InvoiceSummary;
