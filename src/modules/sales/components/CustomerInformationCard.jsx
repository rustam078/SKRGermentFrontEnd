import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

const CustomerInformationCard = ({
  formValues,
  onChange,
  onSearchMobile,
  onSelectCustomer,
  onShowAllCustomers,
  customers,
  loadingCustomers,
  selectedCustomer,
  errors,
}) => {
  return (
    <Card sx={{ borderRadius: 1, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
      <CardHeader
        title="Customer Details"
        sx={{
          '& .MuiCardHeader-title': {
            fontWeight: 700,
            fontSize: '1.05rem',
          },
          pb: 0,
        }}
      />
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
    
            <TextField
              label="Mobile Number"
              name="customerMobile"
              value={formValues.customerMobile}
              onChange={onChange}
              onBlur={onSearchMobile}
              error={Boolean(errors.customerMobile)}
              helperText={errors.customerMobile || 'Enter mobile to search existing customers'}
              fullWidth
              sx={{ flex: 1, minWidth: 240 }}
              inputProps={{ inputMode: 'numeric' }}
            />
                <TextField
              label="Customer Name"
              name="customerName"
              value={formValues.customerName}
              onChange={onChange}
              error={Boolean(errors.customerName)}
              helperText={errors.customerName}
              fullWidth
              sx={{ flex: 1, minWidth: 240 }}
            />
          </Box>

          <TextField
            label="Email"
            name="customerEmail"
            value={formValues.customerEmail}
            onChange={onChange}
            fullWidth
          />

          {loadingCustomers ? (
            <Typography variant="body2" color="text.secondary">
              Searching customers...
            </Typography>
          ) : null}

          {customers.length > 0 ? (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Found customers
              </Typography>
              <Stack spacing={1}>
                {customers.slice(0, 4).map((customer) => (
                  <Button
                    key={customer.id}
                    variant={selectedCustomer?.id === customer.id ? 'contained' : 'outlined'}
                    onClick={() => onSelectCustomer(customer)}
                    sx={{ justifyContent: 'space-between', textTransform: 'none' }}
                  >
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography sx={{ fontWeight: 700 }}>{customer.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {customer.mobile} • {customer.email}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="primary">
                      Select
                    </Typography>
                  </Button>
                ))}
              </Stack>
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default CustomerInformationCard;