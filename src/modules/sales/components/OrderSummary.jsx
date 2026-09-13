import React from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Stack,
  Button,
} from '@mui/material';
import { getCurrencySymbol } from '../../../utils/currency';

const OrderSummary = ({ values, onChange, paymentProviderVisible, onSave, onCancel, loading }) => {
  const subtotal = values.subtotal ?? 0;
  const discount = values.discount ?? 0;
  const tax = values.tax ?? 0;
  const grandTotal = subtotal - discount + tax;

  return (
    <Card sx={{ borderRadius: 2, position: 'sticky', top: 24 }}>
      <CardHeader title="Order Summary" />
      <CardContent sx={{ display: 'grid', gap: 2 }}>
        <Box>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Subtotal</Typography>
              <Typography sx={{ fontWeight: 700 }}>{getCurrencySymbol()}{subtotal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Discount</Typography>
              <Typography>{getCurrencySymbol()}{discount.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Tax</Typography>
              <Typography>{getCurrencySymbol()}{tax.toFixed(2)}</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: 700 }}>Grand Total</Typography>
              <Typography sx={{ fontWeight: 700 }}>{getCurrencySymbol()}{grandTotal.toFixed(2)}</Typography>
            </Box>
          </Stack>
        </Box>

        <FormControl fullWidth>
          <InputLabel>Payment Mode</InputLabel>
          <Select name="paymentMode" value={values.paymentMode} label="Payment Mode" onChange={onChange}>
            <MenuItem value="CASH">Cash</MenuItem>
            <MenuItem value="UPI">UPI</MenuItem>
            <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
            <MenuItem value="DEBIT_CARD">Debit Card</MenuItem>
            <MenuItem value="NET_BANKING">Net Banking</MenuItem>
            <MenuItem value="WALLET">Wallet</MenuItem>
          </Select>
        </FormControl>

        {paymentProviderVisible && (
          <TextField
            label="Payment Provider"
            name="paymentProvider"
            value={values.paymentProvider}
            onChange={onChange}
            fullWidth
          />
        )}

        <TextField
          label="Remarks"
          name="remarks"
          value={values.remarks}
          onChange={onChange}
          multiline
          minRows={4}
          fullWidth
        />

        <Stack spacing={2}>
          <Button variant="contained" color="primary" fullWidth onClick={onSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Sale'}
          </Button>
          <Button variant="outlined" color="inherit" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default OrderSummary;
