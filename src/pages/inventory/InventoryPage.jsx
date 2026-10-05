import React, { useEffect, useMemo, useState } from 'react';
import HeadingInfo from '../../components/common/HeadingInfo';
import { getCurrencySymbol } from '../../utils/currency';
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
  Drawer,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  InputAdornment,
  Typography,
} from '@mui/material';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axios';
import { usePermissions } from '../../hooks/usePermissions';

const InventoryPage = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [inventoryData, setInventoryData] = useState({ content: [], totalElements: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [alerts, setAlerts] = useState([]);
  const [threshold, setThreshold] = useState(0);
  const [search, setSearch] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [alertsDrawerOpen, setAlertsDrawerOpen] = useState(false);
  const [thresholdInput, setThresholdInput] = useState('0');
  const [thresholdError, setThresholdError] = useState('');
  const [savingThreshold, setSavingThreshold] = useState(false);

  const loadInventory = async () => {
    setLoading(true);
    setError('');

    try {
      // Load all products so search + pagination work client-side (and products
      // never get split across server pages).
      const response = await axiosInstance.get('/inventory', {
        params: {
          page: 0,
          size: 1000,
        },
      });

      setInventoryData(response.data || { content: [], totalElements: 0 });
    } catch (err) {
      setError(err.message || 'Unable to load inventory data.');
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const [alertsResponse, thresholdResponse] = await Promise.all([
        axiosInstance.get('/inventory/alerts'),
        axiosInstance.get('/settings/LOW_STOCK_THRESHOLD'),
      ]);

      const items = Array.isArray(alertsResponse.data) ? alertsResponse.data : (alertsResponse.data?.content || []);
      const currentThreshold = Number(thresholdResponse.data?.threshold ?? thresholdResponse.data ?? 0);

      setAlerts(items);
      setThreshold(currentThreshold);
      setThresholdInput(String(currentThreshold));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInventory();
    loadAlerts();
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      loadInventory();
      loadAlerts();
    };

    window.addEventListener('inventory-alerts-updated', handleRefresh);
    return () => window.removeEventListener('inventory-alerts-updated', handleRefresh);
  }, []);


  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadAlerts();
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleView = (productId) => {
    navigate(`/inventory/${productId}`);
  };

  const allProducts = inventoryData.content || [];
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter((p) => (p.productName || '').toLowerCase().includes(q));
  }, [allProducts, search]);
  const paginatedProducts = useMemo(
    () => filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredProducts, page, rowsPerPage]
  );

  useEffect(() => {
    setPage(0);
  }, [search]);

  const handleSaveThreshold = async () => {
    const parsedValue = Number(thresholdInput);
    if (!Number.isFinite(parsedValue) || parsedValue < 0 || parsedValue > 100000) {
      setThresholdError('Threshold must be between 0 and 100000.');
      return;
    }

    setSavingThreshold(true);
    setThresholdError('');

    try {
      await axiosInstance.put('/settings/LOW_STOCK_THRESHOLD', { threshold: parsedValue });
      setThreshold(parsedValue);
      setSettingsOpen(false);
      showToast('Threshold Updated Successfully', 'success');
      window.dispatchEvent(new Event('inventory-alerts-updated'));
      setTimeout(() => {
        window.dispatchEvent(new Event('inventory-alerts-updated'));
      }, 150);
    } catch (err) {
      setThresholdError(err.message || 'Unable to save stock threshold.');
    } finally {
      setSavingThreshold(false);
    }
  };

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
            Inventory Control
            <HeadingInfo text="Track current stock, stock value, and product-level inventory health." />
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {can('inventory', 'write') && (
            <Button variant="contained" onClick={() => navigate('/sales/new')}>
              Sale
            </Button>
          )}
        </Stack>
      </Stack>

      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Products</Typography>
            <TextField
              size="small"
              placeholder="Search product…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: { xs: '100%', sm: 280 } }}
            />
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Current Stock</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Stock Value</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Average Cost</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            {search ? 'No products match your search.' : 'No inventory found.'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {paginatedProducts.map((item) => (
                      <TableRow key={item.productId} hover>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.source}
                            size="small"
                            color={item.source === 'PURCHASED' ? 'info' : item.source === 'BOTH' ? 'secondary' : 'success'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {Number(item.currentStock ?? 0) <= Number(threshold ?? 0) ? (
                            <Tooltip title="Below Threshold">
                              <Box component="span" sx={{ color: '#DC2626', fontWeight: 700 }}>
                                🔴 {Number(item.currentStock ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </Box>
                            </Tooltip>
                          ) : (
                            Number(item.currentStock ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
                          )}
                        </TableCell>
                        <TableCell>{getCurrencySymbol()}{item.stockValue?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>{getCurrencySymbol()}{item.averageCost?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>
                          <Tooltip title="View batches">
                            <IconButton size="small" color="primary" onClick={() => handleView(item.productId)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={filteredProducts.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 25, 50]}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Drawer
        anchor="right"
        open={alertsDrawerOpen}
        onClose={() => setAlertsDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 560 }, p: 3, overflowX: 'hidden' } }}
      >
        <Stack spacing={2.5} sx={{ height: '100%', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Low Stock Products
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review products at or below the global threshold.
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              startIcon={<TuneRoundedIcon />}
              onClick={() => setSettingsOpen(true)}
              sx={{ borderRadius: 999 }}
            >
              Threshold
            </Button>
          </Box>

          {alerts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <NotificationsNoneOutlinedIcon sx={{ fontSize: 44, color: 'text.secondary', mb: 1.5 }} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                No products are below the configured threshold.
              </Typography>
            </Box>
          ) : (
              <Box sx={{ overflowY: 'auto', pr: 0.5 }}>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0 }}>
                <Table size="small" sx={{ tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '30%', fontWeight: 700, py: 0.5, px: 0.75 }}>Product</TableCell>
                      <TableCell sx={{ width: '20%', fontWeight: 700, py: 0.5, px: 0.75, textAlign: 'right' }}>Stock</TableCell>
                      <TableCell sx={{ width: '20%', fontWeight: 700, py: 0.5, px: 0.75, textAlign: 'right' }}>Threshold</TableCell>
                      <TableCell sx={{ width: '30%', fontWeight: 700, py: 0.5, px: 0.75, textAlign: 'center' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alerts.map((item) => (
                      <TableRow key={item.productId} hover onClick={() => { setAlertsDrawerOpen(false); navigate(`/inventory/${item.productId}`); }} sx={{ cursor: 'pointer' }}>
                        <TableCell sx={{ py: 0.5, px: 0.75 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{item.productName}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 0.5, px: 0.75, textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{Number(item.currentStock ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 0.5, px: 0.75, textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{Number(item.threshold ?? threshold ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 0.5, px: 0.75, textAlign: 'center' }}>
                          <Chip label="LOW STOCK" color="error" size="small" sx={{ fontSize: '0.75rem', px: 1 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

        </Stack>
      </Drawer>

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Stock Alert Settings</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Global Low Stock Threshold"
            type="number"
            fullWidth
            value={thresholdInput}
            onChange={(event) => {
              setThresholdInput(event.target.value);
              setThresholdError('');
            }}
            error={Boolean(thresholdError)}
            helperText={thresholdError || 'Set the threshold for low stock alerts.'}
            inputProps={{ min: 0, max: 100000 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveThreshold} disabled={savingThreshold}>
            {savingThreshold ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryPage;
