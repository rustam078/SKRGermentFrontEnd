import React from 'react';
import { Box, Button, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography, Paper, Skeleton, Alert, Stack } from '@mui/material';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';

const SalesTable = ({ rows, loading, error, page, rowsPerPage, count, onPageChange, onRowsPerPageChange, onView, onRowClick }) => {
  const emptyRows = rowsPerPage - Math.min(rowsPerPage, rows.length - page * rowsPerPage);

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider', minHeight: 520, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {loading ? (
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {['Invoice No', 'Date', 'Customer', 'Mobile', 'Grand Total', 'Payment Mode', 'Payment Status', 'Actions'].map((label) => (
                    <TableCell key={label}>{label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: 8 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 8 }).map((__, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : rows.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <ReceiptLongOutlinedIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              No Sales Found
            </Typography>
            <Typography>Try a different filter or refresh the list.</Typography>
          </Box>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                        <TableCell>Invoice No</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell>Grand Total</TableCell>
                    <TableCell>Payment Mode</TableCell>
                    <TableCell>Payment Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((sale) => {
                    const saleId = sale.saleId || sale.id;
                    return (
                      <TableRow key={saleId || sale.invoiceNo} hover sx={{ cursor: 'pointer' }} onClick={() => onRowClick(saleId)}>
                        <TableCell>{sale.invoice || sale.invoiceNo || '-'}</TableCell>
                        <TableCell>{sale.saleDate || sale.createdAt?.split('T')[0] || sale.date || '-'}</TableCell>
                        <TableCell>{sale.customerName || sale.customer || '-'}</TableCell>
                        <TableCell>{sale.customerMobile || sale.mobile || '-'}</TableCell>
                        <TableCell>{sale.grandTotal != null ? `₹${Number(sale.grandTotal).toLocaleString('en-IN')}` : '-'}</TableCell>
                        <TableCell>{sale.paymentMode || '-'}</TableCell>
                        <TableCell>{sale.paymentStatus || '-'}</TableCell>
                        <TableCell align="center" onClick={(event) => event.stopPropagation()}>
                          <Button size="small" variant="outlined" onClick={() => onView(saleId)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 64 * emptyRows }}>
                      <TableCell colSpan={8} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </CardContent>
      {!loading && !error && rows.length > 0 ? (
        <TablePagination
          component="div"
          count={count}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage="Rows"
        />
      ) : null}
    </Card>
  );
};

export default SalesTable;
