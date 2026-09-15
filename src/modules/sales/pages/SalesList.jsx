import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Badge, Box, Button, Divider, FormControl, InputLabel, MenuItem,
  Popover, Select, Stack, TextField, Typography,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import salesService from '../services/salesService';
import SalesTable from '../components/SalesTable';
import HeadingInfo from '../../../components/common/HeadingInfo';

const paymentModes = ['All', 'CASH', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'WALLET'];
const paymentStatuses = ['All', 'PAID', 'PENDING', 'PARTIALLY_PAID', 'FAILED', 'REFUNDED'];
const DEFAULT_FILTERS = { search: '', fromDate: '', toDate: '', paymentMode: 'All', paymentStatus: 'All' };

const SalesList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [queryKey, setQueryKey] = useState(['salesList', filters, page, rowsPerPage]);
  const [filterAnchor, setFilterAnchor] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = { page, size: rowsPerPage };
      if (filters.search) params.search = filters.search;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      if (filters.paymentMode && filters.paymentMode !== 'All') params.paymentMode = filters.paymentMode.toUpperCase();
      if (filters.paymentStatus && filters.paymentStatus !== 'All') params.paymentStatus = filters.paymentStatus.toUpperCase();
      const response = await salesService.getSales(params);
      return response;
    },
    keepPreviousData: true,
    // Always refresh when landing on the list (e.g. after creating a sale) — no manual refresh needed.
    staleTime: 0,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    setQueryKey(['salesList', filters, page, rowsPerPage]);
  }, [filters, page, rowsPerPage]);

  const rows = useMemo(() => (Array.isArray(data?.content) ? data.content : data?.content || []), [data]);
  const totalCount = data?.totalElements ?? data?.totalCount ?? rows.length;

  // Count of active (non-default) filters — shown as a badge on the Filters button.
  const activeCount = [
    filters.search,
    filters.fromDate,
    filters.toDate,
    filters.paymentMode !== 'All' ? filters.paymentMode : '',
    filters.paymentStatus !== 'All' ? filters.paymentStatus : '',
  ].filter(Boolean).length;

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(0);
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 4 }} spacing={2}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
          Sales
          <HeadingInfo text="Manage all invoices and sales transactions." />
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <Badge color="primary" badgeContent={activeCount} overlap="circular">
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={(e) => setFilterAnchor(e.currentTarget)}
              sx={{ borderColor: 'divider', color: '#334155' }}
            >
              Filters
            </Button>
          </Badge>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/sales/new')}>
            New Sale
          </Button>
        </Stack>
      </Stack>

      <Popover
        open={Boolean(filterAnchor)}
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { p: 2.5, width: 320, borderRadius: 2, mt: 1 } } }}
      >
        <Stack spacing={2}>
          <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>Filter Sales</Typography>
          <TextField label="Search invoice / customer / mobile" name="search" value={filters.search} onChange={handleFilterChange} fullWidth size="small" />
          <Stack direction="row" spacing={1.5}>
            <TextField label="From" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="To" name="toDate" value={filters.toDate} onChange={handleFilterChange} type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />
          </Stack>
          <FormControl fullWidth size="small">
            <InputLabel>Payment Mode</InputLabel>
            <Select name="paymentMode" value={filters.paymentMode} label="Payment Mode" onChange={handleFilterChange}>
              {paymentModes.map((mode) => (
                <MenuItem key={mode} value={mode}>{mode === 'All' ? 'All' : mode.replace(/_/g, ' ')}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Payment Status</InputLabel>
            <Select name="paymentStatus" value={filters.paymentStatus} label="Payment Status" onChange={handleFilterChange}>
              {paymentStatuses.map((status) => (
                <MenuItem key={status} value={status}>{status.replace(/_/g, ' ')}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Divider />
          <Stack direction="row" justifyContent="space-between">
            <Button startIcon={<ReplayIcon />} onClick={handleReset} disabled={activeCount === 0}>Reset</Button>
            <Button variant="contained" onClick={() => setFilterAnchor(null)}>Done</Button>
          </Stack>
        </Stack>
      </Popover>

      <SalesTable
        rows={rows}
        loading={isLoading}
        error={error?.message}
        page={page}
        rowsPerPage={rowsPerPage}
        count={totalCount}
        onPageChange={(event, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        onView={(saleId) => navigate(`/sales/${saleId}`)}
        onRowClick={(saleId) => navigate(`/sales/${saleId}`)}
      />
    </Box>
  );
};

export default SalesList;
