import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, Stack, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import salesService from '../services/salesService';
import SalesFilter from '../components/SalesFilter';
import SalesTable from '../components/SalesTable';
import HeadingInfo from '../../../components/common/HeadingInfo';

const SalesList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', fromDate: '', toDate: '', paymentMode: 'All', paymentStatus: 'All' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [queryKey, setQueryKey] = useState(['salesList', filters, page, rowsPerPage]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = {
        page,
        size: rowsPerPage,
      };

      if (filters.search) params.search = filters.search;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      if (filters.paymentMode && filters.paymentMode !== 'All') params.paymentMode = filters.paymentMode.toUpperCase();
      if (filters.paymentStatus && filters.paymentStatus !== 'All') params.paymentStatus = filters.paymentStatus.toUpperCase();

      const response = await salesService.getSales(params);
      return response;
    },
    keepPreviousData: true,
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    setQueryKey(['salesList', filters, page, rowsPerPage]);
  }, [filters, page, rowsPerPage]);

  const rows = useMemo(() => (Array.isArray(data?.content) ? data.content : data?.content || []), [data]);
  const totalCount = data?.totalElements ?? data?.totalCount ?? rows.length;

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const handleReset = () => {
    setFilters({ search: '', fromDate: '', toDate: '', paymentMode: 'All', paymentStatus: 'All' });
    setPage(0);
  };

  const handleRefresh = () => refetch();

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 4 }} spacing={2}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
            Sales
            <HeadingInfo text="Manage all invoices and sales transactions." />
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate('/sales/new')}>
          New Sale
        </Button>
      </Stack>

      <Box sx={{ mb: 3 }}>
        <SalesFilter filters={filters} onChange={handleFilterChange} onReset={handleReset} onRefresh={handleRefresh} />
      </Box>

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
