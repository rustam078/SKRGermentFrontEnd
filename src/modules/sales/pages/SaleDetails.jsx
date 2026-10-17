import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Button, Chip, Divider, Grid, Paper, Stack, Typography, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { notification, Tabs, Collapse, Pagination, Tag } from 'antd';
import dayjs from 'dayjs';
import salesService from '../services/salesService';
import { getCurrencySymbol } from '../../../utils/currency';
import { modeLabel } from '../../../utils/payment';
import { useAppSettings } from '../../../contexts/AppSettingsContext';

const inr = (v) => `${getCurrencySymbol()}${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const STATUS_COLOR = {
  PAID: 'success',
  DUE: 'warning',
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

  const [activeTab, setActiveTab] = useState('details');

  const { data: sale, isLoading, error } = useQuery({
    queryKey: ['saleDetails', saleId],
    queryFn: () => salesService.getSaleById(saleId),
    enabled: Boolean(saleId),
  });

  // Customer's recent transactions + running balance — loaded only when the History tab is opened.
  const [historyPage, setHistoryPage] = useState(1);
  const [historySearch, setHistorySearch] = useState('');
  const customerMobile = sale?.customerMobile;
  const historyEnabled = activeTab === 'history' && Boolean(customerMobile);
  const { data: payments = [], isLoading: historyLoading } = useQuery({
    queryKey: ['customerPaymentHistory', customerMobile],
    queryFn: () => salesService.getCustomerPaymentHistory(customerMobile),
    enabled: historyEnabled,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const { data: outstanding } = useQuery({
    queryKey: ['customerOutstanding', customerMobile],
    queryFn: () => salesService.getCustomerOutstanding(customerMobile),
    enabled: historyEnabled,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const balance = -(Number(outstanding?.totalOutstanding) || 0); // negative = customer owes
  const HISTORY_PAGE_SIZE = 8; // historyPage is 1-based (antd Pagination)
  // Filter payment groups by invoice number (matches any allocation's invoice).
  const historyQuery = historySearch.trim().toLowerCase();
  const filteredPayments = historyQuery
    ? payments.filter((grp) => (grp.allocations || []).some((a) => (a.invoiceNumber || '').toLowerCase().includes(historyQuery)))
    : payments;
  const paymentItems = filteredPayments
    .slice((historyPage - 1) * HISTORY_PAGE_SIZE, historyPage * HISTORY_PAGE_SIZE)
    .map((grp, idx) => ({
      key: String(idx),
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', fontSize: '0.85rem', borderBottom: '1px solid #F1F5F9', pb: 0.75 }}>
          <Box sx={{ flex: '1.4', fontWeight: 700, color: '#0F172A' }}>{grp.paymentDate ? dayjs(grp.paymentDate).format('DD MMM YYYY') : '—'}</Box>
          <Box sx={{ flex: '1' }}><Tag style={{ borderRadius: 6, margin: 0 }}>{modeLabel(grp.mode)}</Tag></Box>
          <Box sx={{ flex: '0.8', color: '#64748B' }}>{(grp.allocations || []).length}</Box>
          <Box sx={{ flex: '1', textAlign: 'right', fontWeight: 800, color: 'var(--theme-primary)' }}>{inr(grp.totalAmount)}</Box>
        </Box>
      ),
      children: (
        <Box sx={{ bgcolor: '#F1F5F9', borderRadius: 1.5, px: 1.5, py: 0.5, boxShadow: 'inset 0 1px 4px rgba(15,23,42,0.12)' }}>
          {(grp.allocations || []).map((a, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', py: 0.6, borderTop: i === 0 ? 'none' : '1px dashed #CBD5E1' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{a.invoiceNumber || '—'}</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{inr(a.amount)}</span>
            </Box>
          ))}
        </Box>
      ),
    }));

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
  const paymentMode = modeLabel(inv.paymentMode);
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

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[{ key: 'details', label: 'Details' }, { key: 'history', label: 'Customer Payment History' }]}
      />

      {/* Invoice card */}
      {activeTab === 'details' && (
      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
        {/* Top banner */}
        <Box sx={{ p: 3, background: 'linear-gradient(135deg, #F8FAFC 0%, color-mix(in srgb, var(--theme-primary) 12%, white) 100%)', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--theme-primary)', letterSpacing: '1px' }}>
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
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--theme-primary)' }}>{inr(inv.grandTotal)}</Typography>
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
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'var(--theme-primary)' }}>{inr(it.lineTotal)}</TableCell>
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
              <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--theme-primary)' }}>{inr(inv.grandTotal)}</Typography>
            </Stack>
            {(Number(inv.amountDue) > 0.0001 || Number(inv.paidToPreviousDues) > 0.0001 || Number(inv.customerBalanceDue) > 0.0001) && (
              <>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ color: '#64748B' }}>Amount Received</Typography>
                  <Typography sx={{ fontWeight: 700, color: 'var(--theme-primary)' }}>{inr(inv.amountReceived)}</Typography>
                </Stack>
                {Number(inv.paidToPreviousDues) > 0.0001 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ color: '#64748B', pl: 1.5, fontSize: '0.9rem' }}>• Towards previous dues</Typography>
                    <Typography sx={{ fontWeight: 600, color: 'var(--theme-primary)' }}>{inr(inv.paidToPreviousDues)}</Typography>
                  </Stack>
                )}
                {Number(inv.amountDue) > 0.0001 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ color: '#64748B' }}>This invoice due</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#B91C1C' }}>{inr(inv.amountDue)}</Typography>
                  </Stack>
                )}
                {Number(inv.customerBalanceDue) > 0.0001 && (
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontWeight: 800, color: '#B91C1C' }}>Balance Due</Typography>
                    <Typography sx={{ fontWeight: 800, color: '#B91C1C' }}>{inr(inv.customerBalanceDue)}</Typography>
                  </Stack>
                )}
              </>
            )}
            {Array.isArray(inv.clearances) && inv.clearances.length > 0 && (
              <>
                <Divider sx={{ my: 0.5 }} />
                <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem' }}>Due cleared later</Typography>
                {inv.clearances.map((c, i) => (
                  <Stack key={i} direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>
                      {dayjs(c.date).format('DD MMM YYYY')} · {modeLabel(c.mode)} · Ref: <b style={{ color: '#0F172A' }}>{c.referenceInvoiceNo}</b>
                    </Typography>
                    <Typography sx={{ fontWeight: 700, color: 'var(--theme-primary)' }}>{inr(c.amount)}</Typography>
                  </Stack>
                ))}
              </>
            )}
          </Stack>
        </Box>
      </Paper>
      )}

      {activeTab === 'history' && (
        <Paper sx={{ borderRadius: 0, border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>Customer Payment History</Typography>
              <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>{inv.customerName || '-'} · {inv.customerMobile || '-'}</Typography>
            </Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                size="small"
                placeholder="Search invoice…"
                value={historySearch}
                onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }}
                sx={{ width: { xs: 160, sm: 200 }, bgcolor: '#fff' }}
              />
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Balance</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: balance < 0 ? '#B91C1C' : 'var(--theme-primary)' }}>
                  {balance < 0 ? '− ' : ''}{inr(Math.abs(balance))}
                </Typography>
              </Box>
            </Stack>
          </Box>
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : payments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5, color: '#94A3B8', borderTop: '1px solid', borderColor: 'divider' }}>No payments yet</Box>
          ) : filteredPayments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5, color: '#94A3B8', borderTop: '1px solid', borderColor: 'divider' }}>No payment matches “{historySearch}”.</Box>
          ) : (
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
              {/* Table-style header row; the Collapse rows below align to these columns. */}
              <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, pr: 5, bgcolor: '#E2E8F0', color: '#334155', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Box sx={{ flex: '1.4' }}>Date</Box>
                <Box sx={{ flex: '1' }}>Mode</Box>
                <Box sx={{ flex: '0.8' }}>Invoices</Box>
                <Box sx={{ flex: '1', textAlign: 'right' }}>Received</Box>
              </Box>
              <Collapse
                accordion
                ghost
                items={paymentItems}
                expandIconPosition="end"
                style={{ background: 'transparent' }}
              />
              {filteredPayments.length > HISTORY_PAGE_SIZE && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <Pagination
                    current={historyPage}
                    pageSize={HISTORY_PAGE_SIZE}
                    total={filteredPayments.length}
                    onChange={setHistoryPage}
                    showSizeChanger={false}
                    showTotal={(t, r) => `${r[0]}–${r[1]} of ${t} payments`}
                  />
                </Box>
              )}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default SaleDetails;
