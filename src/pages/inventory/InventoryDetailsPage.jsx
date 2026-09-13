import React, { useEffect, useMemo, useState } from 'react';
import HeadingInfo from '../../components/common/HeadingInfo';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import GenerateLabelsDialog from '../../modules/qr/components/GenerateLabelsDialog';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import axiosInstance from '../../services/axios';
import { getCurrencySymbol } from '../../utils/currency';

const formatCurrency = (value) =>
  value == null ? '—' : `${getCurrencySymbol()}${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatNumber = (value) =>
  value == null ? '—' : Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const quickRanges = [
  { value: 'All', label: 'All' },
  { value: 'Today', label: 'Today' },
  { value: 'Yesterday', label: 'Yesterday' },
  { value: 'ThisMonth', label: 'This Month' },
  { value: 'Custom', label: 'Custom Range' },
];

const InventoryDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tab, setTab] = useState(0); // 0 = Available, 1 = Sold Out
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [quickRange, setQuickRange] = useState('All');
  const [appliedQuickRange, setAppliedQuickRange] = useState('All');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const queryClient = useQueryClient();

  // Adjust-stock modal state
  const [adjustTarget, setAdjustTarget] = useState(null); // the batch row being adjusted
  // QR-label generation modal state
  const [qrBatch, setQrBatch] = useState(null);
  const [adjQty, setAdjQty] = useState('');
  const [adjDir, setAdjDir] = useState('INCREASE');
  const [adjRemarks, setAdjRemarks] = useState('');
  const [adjSaving, setAdjSaving] = useState(false);
  const [adjError, setAdjError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '' });

  const openAdjust = (batch) => {
    setAdjustTarget(batch);
    setAdjQty('');
    setAdjDir('INCREASE');
    setAdjRemarks('');
    setAdjError('');
  };
  const closeAdjust = () => setAdjustTarget(null);

  const submitAdjust = async () => {
    const qty = Number(adjQty);
    if (!qty || qty <= 0) {
      setAdjError('Enter a quantity greater than zero');
      return;
    }
    const available = Number(adjustTarget?.quantityAvailable ?? 0);
    if (adjDir === 'DECREASE' && qty > available) {
      setAdjError(`Only ${available} unit(s) available in this batch`);
      return;
    }
    setAdjSaving(true);
    setAdjError('');
    try {
      await axiosInstance.patch(`/inventory/batches/${adjustTarget.batchId}/adjust`, {
        quantity: qty,
        direction: adjDir,
        remarks: adjRemarks.trim() || undefined,
      });
      setToast({ open: true, message: `Stock ${adjDir === 'INCREASE' ? 'increased' : 'decreased'} by ${qty}` });
      closeAdjust();
      // Refresh this page + every other inventory surface so the change reflects everywhere.
      setRefreshKey((k) => k + 1);
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockAlerts'] });
      window.dispatchEvent(new Event('inventory-alerts-updated'));
    } catch (err) {
      setAdjError(err.response?.data?.message || err.message || 'Failed to adjust stock');
    } finally {
      setAdjSaving(false);
    }
  };

  const applyQuickRange = (range) => {
    const today = dayjs();
    switch (range) {
      case 'All':
        return { fromDate: '', toDate: '' };
      case 'Today':
        return { fromDate: today.format('YYYY-MM-DD'), toDate: today.format('YYYY-MM-DD') };
      case 'Yesterday':
        return {
          fromDate: today.subtract(1, 'day').format('YYYY-MM-DD'),
          toDate: today.subtract(1, 'day').format('YYYY-MM-DD'),
        };
      case 'ThisMonth':
        return {
          fromDate: today.startOf('month').format('YYYY-MM-DD'),
          toDate: today.endOf('month').format('YYYY-MM-DD'),
        };
      case 'Custom':
      default:
        return null;
    }
  };

  useEffect(() => {
    if (quickRange !== 'Custom') {
      const range = applyQuickRange(quickRange);
      if (range) {
        setFromDate(range.fromDate);
        setToDate(range.toDate);
        setAppliedQuickRange(quickRange);
        setAppliedFromDate(range.fromDate);
        setAppliedToDate(range.toDate);
      }
    }
  }, [quickRange]);

  const handleApplyFilter = () => {
    setAppliedQuickRange(quickRange);
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
  };

  useEffect(() => {
    const fetchInventoryDetails = async () => {
      setLoading(true);
      setError('');

      try {
        const params = {};
        if (appliedQuickRange !== 'All') {
          if (appliedFromDate) params.fromDate = appliedFromDate;
          if (appliedToDate) params.toDate = appliedToDate;
        }
        const detailsResponse = await axiosInstance.get(`/inventory/product/${productId}/batches`, {
          params,
        });
        setDetails(detailsResponse.data || null);
      } catch (err) {
        setError(err.message || 'Unable to load inventory details.');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchInventoryDetails();
    }
  }, [productId, appliedQuickRange, appliedFromDate, appliedToDate, refreshKey]);

  useEffect(() => {
    setPage(0);
  }, [productId, appliedQuickRange, appliedFromDate, appliedToDate]);

  const batches = details?.batches || [];

  const availableBatches = useMemo(
    () => batches.filter((b) => Number(b.quantityAvailable ?? 0) > 0),
    [batches]
  );
  const soldOutBatches = useMemo(
    () => batches.filter((b) => Number(b.quantityAvailable ?? 0) <= 0),
    [batches]
  );
  const displayedBatches = tab === 0 ? availableBatches : soldOutBatches;

  const paginatedBatches = useMemo(() => {
    const start = page * rowsPerPage;
    return displayedBatches.slice(start, start + rowsPerPage);
  }, [displayedBatches, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [tab]);

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/inventory")}
          sx={{ textTransform: "none" }}
        >
          Back to Inventory
        </Button>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="quick-range-label">Date Range</InputLabel>
            <Select
              labelId="quick-range-label"
              value={quickRange}
              label="Date Range"
              onChange={(event) => setQuickRange(event.target.value)}
            >
              {quickRanges.map((range) => (
                <MenuItem key={range.value} value={range.value}>
                  {range.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="From"
            type="date"
            size="small"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
              setQuickRange('Custom');
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
              setQuickRange('Custom');
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
          {quickRange === 'Custom' ? (
            <Button
              variant="contained"
              size="small"
              onClick={handleApplyFilter}
              disabled={!fromDate || !toDate}
              sx={{ minWidth: 120 }}
            >
              Apply
            </Button>
          ) : null}
        </Stack>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : details ? (
        <>
          {/* Removed threshold banner: low-stock UI is handled in the alerts drawer/page. */}

          <Box
            sx={{
              mb: 3,
              p: { xs: 2.25, md: 3 },
              border: "1px solid #E2E8F0",
              borderRadius: 3,
              bgcolor: "#FAFBFF",
              display: "flex",
              flexDirection: { xs: "column", lg: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", lg: "center" },
              gap: { xs: 2, lg: 3 },
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F172A", display: 'flex', alignItems: 'center' }}>
                {details.productName}
                <HeadingInfo text="Batch-level stock, movements and inventory value for this product." />
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75, flexWrap: "wrap" }}>
                  <Chip
                    label={details.source}
                    color={
                      details.source === "PURCHASED"
                        ? "info"
                        : details.source === "BOTH"
                          ? "secondary"
                          : "success"
                    }
                    variant="outlined"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Inventory snapshot for this product.
                  </Typography>
                </Stack>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 1.5, sm: 2 }}
              divider={
                <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
              }
              sx={{ width: { xs: "100%", lg: "auto" } }}
            >
              {[
                { label: "Total Quantity", value: formatNumber(details.totalQuantity) },
                { label: "Total Sold", value: formatNumber(details.totalSold), valueColor: 'error.main' },
                { label: "Quantity Available", value: formatNumber(details.quantityAvailable), valueColor: 'success.main' },
                { label: "Total Value", value: formatCurrency(details.totalValue) },
                { label: "Average Cost", value: formatCurrency(details.averageCost) },
                { label: "Batch Count", value: batches.length },
              ].map((item) => (
                <Box key={item.label} sx={{ minWidth: { sm: 120 } }}>
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.25, color: item.valueColor || 'inherit' }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Card>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Inventory2OutlinedIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Batch History
                </Typography>
              </Box>

              <Tabs
                value={tab}
                onChange={(e, v) => setTab(v)}
                sx={{ mb: 1, borderBottom: '1px solid #E2E8F0', minHeight: 40, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 40 } }}
              >
                <Tab label={`Available (${availableBatches.length})`} />
                <Tab label={`Sold Out (${soldOutBatches.length})`} />
              </Tabs>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Batch No.</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Received</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Sold</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Available</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Unit Cost</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Batch Value</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      {tab === 0 && (
                        <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedBatches.length > 0 ? (
                      paginatedBatches.map((batch) => {
                        const totalQ = Number(batch.totalQuantity ?? 0);
                        const availableQ = Number(batch.quantityAvailable ?? 0);
                        const soldQ = totalQ - availableQ;

                        return (
                          <TableRow key={batch.batchId} hover>
                            <TableCell>{batch.batchNumber}</TableCell>
                            <TableCell>{batch.source}</TableCell>
                            <TableCell>
                              {formatDate(batch.receivedDate)}
                            </TableCell>
                            <TableCell>{formatNumber(totalQ)}</TableCell>
                            <TableCell>
                              <Typography sx={{ color: soldQ > 0 ? 'error.main' : 'text.secondary', fontWeight: 700 }}>
                                {formatNumber(soldQ)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ color: availableQ > 0 ? 'success.main' : 'text.secondary', fontWeight: 700 }}>
                                {formatNumber(availableQ)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {formatCurrency(batch.unitCost)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(batch.batchValue)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={batch.status}
                                size="small"
                                color={
                                  batch.status === "ACTIVE"
                                    ? "success"
                                    : "default"
                                }
                                variant="outlined"
                              />
                            </TableCell>
                            {tab === 0 && (
                              <TableCell align="center">
                                <Stack direction="row" spacing={1} justifyContent="center">
                                  <Tooltip title="Adjust stock (increase / decrease)">
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<TuneOutlinedIcon fontSize="small" />}
                                      onClick={() => openAdjust(batch)}
                                      sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                                    >
                                      Adjust
                                    </Button>
                                  </Tooltip>
                                  <Tooltip title="Generate & print QR labels for this batch">
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="secondary"
                                      startIcon={<QrCode2Icon fontSize="small" />}
                                      onClick={() => setQrBatch({
                                        batchNumber: batch.batchNumber,
                                        productName: details.productName,
                                        quantityAvailable: availableQ,
                                        quantityReceived: totalQ,
                                      })}
                                      sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                                    >
                                      QR
                                    </Button>
                                  </Tooltip>
                                </Stack>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={tab === 0 ? 10 : 9} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            {tab === 0 ? 'No batches with available stock.' : 'No sold-out batches.'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={displayedBatches.length}
                page={page}
                onPageChange={(event, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 20]}
              />
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* QR labels modal */}
      <GenerateLabelsDialog
        open={Boolean(qrBatch)}
        onClose={() => setQrBatch(null)}
        batch={qrBatch}
        onGenerated={() => setRefreshKey((k) => k + 1)}
      />

      {/* Adjust Stock modal */}
      <Dialog open={Boolean(adjustTarget)} onClose={adjSaving ? undefined : closeAdjust} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TuneOutlinedIcon color="primary" fontSize="small" />
          Adjust Stock
        </DialogTitle>
        <DialogContent dividers>
          {adjustTarget ? (
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Batch</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{adjustTarget.batchNumber}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">Available</Typography>
                  <Typography sx={{ fontWeight: 800, color: 'success.main' }}>
                    {formatNumber(adjustTarget.quantityAvailable)}
                  </Typography>
                </Box>
              </Box>

              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={adjDir}
                onChange={(e, v) => v && setAdjDir(v)}
                color="primary"
              >
                <ToggleButton value="INCREASE"><AddIcon fontSize="small" sx={{ mr: 0.5 }} /> Increase</ToggleButton>
                <ToggleButton value="DECREASE"><RemoveIcon fontSize="small" sx={{ mr: 0.5 }} /> Decrease</ToggleButton>
              </ToggleButtonGroup>

              <TextField
                label="Quantity"
                type="number"
                size="small"
                value={adjQty}
                onChange={(e) => setAdjQty(e.target.value)}
                inputProps={{ min: 0, step: 'any' }}
                autoFocus
                fullWidth
              />

              {(() => {
                const avail = Number(adjustTarget.quantityAvailable ?? 0);
                const q = Number(adjQty) || 0;
                const next = adjDir === 'INCREASE' ? avail + q : avail - q;
                return (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">New available</Typography>
                    <Typography sx={{ fontWeight: 800, color: next < 0 ? 'error.main' : '#2563EB' }}>
                      {formatNumber(next)}
                    </Typography>
                  </Box>
                );
              })()}

              {adjError ? <Alert severity="error" sx={{ py: 0 }}>{adjError}</Alert> : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeAdjust} disabled={adjSaving} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={submitAdjust} disabled={adjSaving} sx={{ textTransform: 'none', fontWeight: 700 }}>
            {adjSaving ? 'Saving…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={() => setToast({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setToast({ open: false, message: '' })}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryDetailsPage;
