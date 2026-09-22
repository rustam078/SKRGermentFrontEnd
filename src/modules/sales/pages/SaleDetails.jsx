import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Button, Chip, Divider, Grid, Paper, Stack, Typography, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { notification } from 'antd';
import salesService from '../services/salesService';
import { getCurrencySymbol } from '../../../utils/currency';
import { useAppSettings } from '../../../contexts/AppSettingsContext';

const inr = (v) => `${getCurrencySymbol()}${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const STATUS_COLOR = {
  PAID: 'success',
  PENDING: 'warning',
  PARTIALLY_PAID: 'info',
  FAILED: 'error',
  REFUNDED: 'default',
};

const MetaBlock = ({ label, children }) => (
  <Box>
    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
      {label}
    </Typography>
    {children}
  </Box>
);

const SaleDetails = () => {
  const navigate = useNavigate();
  const { saleId } = useParams();
  const { companyName } = useAppSettings();
  const [downloading, setDownloading] = useState(false);

  const { data: sale, isLoading, error } = useQuery({
    queryKey: ['saleDetails', saleId],
    queryFn: () => salesService.getSaleById(saleId),
    enabled: Boolean(saleId),
  });

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await salesService.downloadInvoicePdf(saleId);
    } catch (e) {
      notification.error({ message: 'Invoice download failed', description: e.message, placement: 'topRight' });
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <Alert severity="error">{error.message}</Alert>;

  const inv = sale || {};
  const invoiceNo = inv.invoiceNo || inv.invoice || '-';
  const saleDate = inv.saleDate || inv.createdAt?.split('T')[0] || '-';
  const status = inv.paymentStatus ? inv.paymentStatus.replace(/_/g, ' ') : 'Unknown';
  const paymentMode = inv.paymentMode ? inv.paymentMode.replace(/_/g, ' ') : '-';
  const items = inv.items || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Button startIcon={<ArrowBackIcon />} variant="text" onClick={() => navigate('/sales/list')} sx={{ color: '#475569' }}>
            Back
          </Button>
          <Divider orientation="vertical" flexItem />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>Sale Details</Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<PictureAsPdfIcon />}
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? 'Preparing…' : 'Download Invoice PDF'}
        </Button>
      </Stack>

      {/* Invoice card */}
      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
        {/* Top banner */}
        <Box sx={{ p: 3, background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563EB', letterSpacing: '1px' }}>
                {companyName || 'SKR Garment'}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                Invoice {invoiceNo}
              </Typography>
              <Typography sx={{ color: '#64748B', mt: 0.5 }}>{saleDate} · {paymentMode}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                <Chip label={status} color={STATUS_COLOR[inv.paymentStatus] || 'default'} sx={{ fontWeight: 700 }} />
                <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8' }}>Grand Total</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#10B981' }}>{inr(inv.grandTotal)}</Typography>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Meta */}
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <MetaBlock label="Billed To">
                <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{inv.customerName || '-'}</Typography>
                <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>{inv.customerMobile || '-'}</Typography>
                {inv.customerEmail && <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>{inv.customerEmail}</Typography>}
              </MetaBlock>
            </Grid>
            <Grid item xs={12} sm={4}>
              <MetaBlock label="Payment">
                <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{paymentMode}</Typography>
                <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>{inv.paymentProvider || 'No provider'}</Typography>
              </MetaBlock>
            </Grid>
            <Grid item xs={12} sm={4}>
              <MetaBlock label="Order">
                <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{items.length} item{items.length === 1 ? '' : 's'}</Typography>
                <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>{inv.remarks || 'No remarks'}</Typography>
              </MetaBlock>
            </Grid>
          </Grid>

          {/* Items */}
          <TableContainer sx={{ mt: 3, mx: -3, width: 'auto', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { backgroundColor: '#E2E8F0', color: '#334155', fontWeight: 700 } }}>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Discount</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ color: '#94A3B8', py: 4 }}>No items</TableCell></TableRow>
                ) : items.map((it, i) => (
                  <TableRow key={it.productId || i} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{it.productName || 'Product'}</TableCell>
                    <TableCell align="right">{Number(it.quantity || 0)}</TableCell>
                    <TableCell align="right">{inr(it.sellingPrice)}</TableCell>
                    <TableCell align="right">{inr(it.discount)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#10B981' }}>{inr(it.lineTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Totals */}
          <Stack sx={{ mt: 2, ml: 'auto', width: { xs: '100%', sm: 320 } }} spacing={0.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ color: '#64748B' }}>Subtotal</Typography>
              <Typography sx={{ fontWeight: 600 }}>{inr(inv.subtotal)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ color: '#64748B' }}>Discount</Typography>
              <Typography sx={{ fontWeight: 600 }}>- {inr(inv.discount)}</Typography>
            </Stack>
            {Number(inv.tax) > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ color: '#64748B' }}>GST</Typography>
                <Typography sx={{ fontWeight: 600 }}>{inr(inv.tax)}</Typography>
              </Stack>
            )}
            <Divider sx={{ my: 0.5 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontWeight: 800, fontSize: '1.05rem' }}>Grand Total</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#2563EB' }}>{inr(inv.grandTotal)}</Typography>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default SaleDetails;
