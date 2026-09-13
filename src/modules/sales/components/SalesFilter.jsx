import React from 'react';
import { Box, Button, Card, CardContent, Grid, Stack, TextField, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReplayIcon from '@mui/icons-material/Replay';

const paymentModes = ['All', 'CASH', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'WALLET'];
const paymentStatuses = ['All', 'PAID', 'PENDING', 'PARTIALLY_PAID', 'FAILED', 'REFUNDED'];

const SalesFilter = ({ filters, onChange, onReset, onRefresh }) => {
  return (
    <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Filter Sales
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Search invoices, customers or filter by dates and payment status.
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Search Invoice / Customer / Mobile"
                name="search"
                value={filters.search}
                onChange={onChange}
                fullWidth
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={2.5}>
              <TextField
                label="From"
                name="fromDate"
                value={filters.fromDate}
                onChange={onChange}
                type="date"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={2.5}>
              <TextField
                label="To"
                name="toDate"
                value={filters.toDate}
                onChange={onChange}
                type="date"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  name="paymentMode"
                  value={filters.paymentMode}
                  label="Payment Mode"
                  onChange={onChange}
                >
                  {paymentModes.map((mode) => (
                    <MenuItem key={mode} value={mode}>
                      {mode === 'All' ? 'All' : mode.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Status</InputLabel>
                <Select
                  name="paymentStatus"
                  value={filters.paymentStatus}
                  label="Payment Status"
                  onChange={onChange}
                >
                  {paymentStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
            <Button variant="outlined" startIcon={<ReplayIcon />} onClick={onReset}>
              Reset Filter
            </Button>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={onRefresh}>
              Refresh
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default SalesFilter;
