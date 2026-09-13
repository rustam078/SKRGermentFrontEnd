import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  TablePagination,
} from '@mui/material';

const RecentSalesTable = ({ rows, loading, error }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Card sx={{ borderRadius: 2, minHeight: 420, display: 'flex', flexDirection: 'column' }}>
      <CardHeader title="Recent Sales" action={<Button size="small" variant="text" disabled>View All</Button>} />
      <CardContent sx={{ flexGrow: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : rows.length === 0 ? (
          <Typography color="text.secondary">No recent sales available yet.</Typography>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice No</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Payment Mode</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((sale) => (
                    <TableRow key={sale.invoiceNo || sale.id} hover>
                      <TableCell>{sale.invoice || sale.invoiceNo || '-'}</TableCell>
                      <TableCell>{sale.customerName || sale.customer || '-'}</TableCell>
                      <TableCell>{sale.grandTotal != null ? `₹${sale.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '-'}</TableCell>
                      <TableCell>{sale.paymentMode || sale.paymentStatus || '-'}</TableCell>
                      <TableCell>{sale.saleDate || sale.date || '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'inline-flex', px: 1.5, py: 0.5, borderRadius: 1, backgroundColor: sale.paymentStatus === 'PAID' ? '#DCFCE7' : '#FEE2E2', color: sale.paymentStatus === 'PAID' ? '#166534' : '#991B1B' }}>
                          {sale.paymentStatus || '-'}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="outlined" disabled>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={rows.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 15]}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentSalesTable;
