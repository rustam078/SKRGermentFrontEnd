import React from 'react';
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardContent,
  Stack,
  Typography,
  Chip,
} from '@mui/material';

const LowStockCard = ({ alerts, loading, error, onViewInventory }) => {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardHeader title="Low Stock Alerts" />
      <CardContent>
        {loading ? (
          <Typography color="text.secondary">Loading alerts...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : alerts.length === 0 ? (
          <Typography color="text.secondary">No low stock alerts at this time.</Typography>
        ) : (
          <Stack spacing={2}>
            {alerts.slice(0, 4).map((alert) => (
              <Box key={alert.productId || alert.id || alert.productName} sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {alert.productName || alert.product || 'Unnamed Product'}
                  </Typography>
                  <Chip label="Low" color="error" size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Current stock: {alert.currentStock != null ? alert.currentStock : alert.stock || '-'}
                </Typography>
                <Button size="small" variant="contained" onClick={onViewInventory}>
                  View Inventory
                </Button>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default LowStockCard;
