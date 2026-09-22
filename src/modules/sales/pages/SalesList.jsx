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
import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import salesService from '../services/salesService';
import SalesTable from '../components/SalesTable';
import HeadingInfo from '../../../components/common/HeadingInfo';
import { getCurrencySymbol } from '../../../utils/currency';

dayjs.extend(quarterOfYear);

const paymentModes = ['All', 'CASH', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'WALLET'];
const paymentStatuses = ['All', 'PAID', 'PENDING', 'PARTIALLY_PAID', 'FAILED', 'REFUNDED'];
const DEFAULT_FILTERS = { search: '', fromDate: '', toDate: '', paymentMode: 'All', paymentStatus: 'All' };

// Quick date ranges (mirrors the dashboard) — each returns a full-period [from, to].
const QUICK = {
  Today: () => [dayjs().startOf('day'), dayjs().endOf('day')],
  'This Week': () => [dayjs().startOf('week'), dayjs().endOf('week')],
  'This Month': () => [dayjs().startOf('month'), dayjs().endOf('month')],
  'Quarter': () => [dayjs().startOf('quarter'), dayjs().endOf('quarter')],
  'This Year': () => [dayjs().startOf('year'), dayjs().endOf('year')],
  'All Time': () => [dayjs('2000-01-01'), dayjs().endOf('day')],
};

const num = (v) => new Intl.NumberFormat('en-IN').format(Number(v) || 0);
const money = (v) => `${getCurrencySymbol()}${new Intl.NumberFormat('en-IN').format(Math.round(Number(v) || 0))}`;

const SalesList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterAnchor, setFilterAnchor] = useState(null);

  // Shared filter → query params (used by both the list and the summary).
  const filterParams = useMemo(() => {
    const p = {};
    if (filters.search) p.search = filters.search;
    if (filters.fromDate) p.fromDate = filters.fromDate;
    if (filters.toDate) p.toDate = filters.toDate;
    if (filters.paymentMode && filters.paymentMode !== 'All') p.paymentMode = filters.paymentMode.toUpperCase();
    if (filters.paymentStatus && filters.paymentStatus !== 'All') p.paymentStatus = filters.paymentStatus.toUpperCase();
    return p;
  }, [filters]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['salesList', filters, page, rowsPerPage],
    queryFn: () => salesService.getSales({ ...filterParams, page, size: rowsPerPage }),
    keepPreviousData: true,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Header summary — filter-aware totals (respects search / date / mode / status), same spec as the list.
  const { data: summary } = useQuery({
    queryKey: ['salesListSummary', filters],
    queryFn: () => salesService.getSummary(filterParams),
    keepPreviousData: true,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  useEffect(() => { setPage(0); }, [filters]);

  const rows = useMemo(() => (Array.isArray(data?.content) ? data.content : data?.content || []), [data]);
  const totalCount = data?.totalElements ?? data?.totalCount ?? rows.length;

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
  };

  const applyQuick = (key) => {
    const [from, to] = QUICK[key]();
    setFilters((prev) => ({ ...prev, fromDate: from.format('YYYY-MM-DD'), toDate: to.format('YYYY-MM-DD') }));
  };

  const handleReset = () => setFilters(DEFAULT_FILTERS);

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 3 }} spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" sx={{ rowGap: 0.5 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
            Sales
            <HeadingInfo text="Manage all invoices and sales transactions." />
          </Typography>
          {summary ? (
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>
              {num(summary.count)} sales
              <Box component="span" sx={{ color: '#CBD5E1', mx: 0.75 }}>|</Box>
              {money(summary.revenue)} revenue
              <Box component="span" sx={{ color: '#CBD5E1', mx: 0.75 }}>|</Box>
              {money(summary.discount)} discount
            </Typography>
          ) : null}
        </Stack>

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
        slotProps={{ paper: { sx: { p: 2.5, width: 340, borderRadius: 2, mt: 1 } } }}
      >
        <Stack spacing={2}>
          <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>Filter Sales</Typography>

          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>Quick range</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mt: 0.75 }}>
              {Object.keys(QUICK).map((k) => (
                <Button key={k} size="small" variant="outlined" onClick={() => applyQuick(k)} sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0.4 }}>
                  {k}
                </Button>
              ))}
            </Box>
          </Box>

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
