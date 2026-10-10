import React from 'react';
import { Box, Card, CardContent, Chip, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Tooltip, Typography, Paper, Skeleton, Alert, Stack } from '@mui/material';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { getCurrencySymbol } from '../../../utils/currency';
import { modeLabel } from '../../../utils/payment';

const STATUS_COLOR = { PAID: 'success', DUE: 'warning', PENDING: 'warning', PARTIALLY_PAID: 'info', FAILED: 'error', REFUNDED: 'default' };

const SalesTable = ({ rows, loading, error, page, rowsPerPage, count, onPageChange, onRowsPerPageChange, onDownload, onRowClick }) => {
  // Server-side paging: `rows` is only the current page, so fill up to the page size by its length.
  const emptyRows = Math.max(0, rowsPerPage - rows.length);

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider', minHeight: 520, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {loading ? (
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {['Invoice No', 'Date', 'Customer', 'Mobile', 'Grand Total', 'Received', 'Payment Mode', 'Payment Status', 'Actions'].map((label) => (
                    <TableCell key={label}>{label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: 8 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 9 }).map((__, cellIndex) => (
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
                    <TableCell>Received</TableCell>
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
                        <TableCell>{sale.grandTotal != null ? `${getCurrencySymbol()}${Number(sale.grandTotal).toLocaleString('en-IN')}` : '-'}</TableCell>
                        <TableCell sx={{ color: '#047857', fontWeight: 600 }}>{sale.amountReceived != null ? `${getCurrencySymbol()}${Number(sale.amountReceived).toLocaleString('en-IN')}` : '-'}</TableCell>
                        <TableCell>{modeLabel(sale.paymentMode)}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip size="small" label={(sale.paymentStatus || '-').replace(/_/g, ' ')} color={STATUS_COLOR[sale.paymentStatus] || 'default'} sx={{ fontWeight: 700 }} />
                            {Number(sale.amountDue) > 0 && (
                              <Typography variant="caption" sx={{ color: '#B91C1C', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                Due {getCurrencySymbol()}{Number(sale.amountDue).toLocaleString('en-IN')}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell align="center" onClick={(event) => event.stopPropagation()}>
                          <Tooltip title="Download invoice">
                            <IconButton size="small" color="primary" onClick={() => onDownload(saleId)}>
                              <FileDownloadOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 64 * emptyRows }}>
                      <TableCell colSpan={9} />
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
