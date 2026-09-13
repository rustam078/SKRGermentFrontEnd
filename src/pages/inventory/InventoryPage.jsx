import React, { useEffect, useMemo, useState } from 'react';
import HeadingInfo from '../../components/common/HeadingInfo';
import {
  Alert,
  Autocomplete,
  Box,
  Badge,
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
  Drawer,
  Grid,
  IconButton,
  MenuItem,
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
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axios';

const createEmptyItem = () => ({
  productId: '',
  productName: '',
  quantity: 1,
  sellingPrice: '',
  quantityAvailable: null,
  averageCost: null,
  loading: false,
  error: '',
});

const InventoryPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [inventoryData, setInventoryData] = useState({ content: [], totalElements: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saleDrawerOpen, setSaleDrawerOpen] = useState(false);
  const [inventoryOptions, setInventoryOptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [alerts, setAlerts] = useState([]);
  const [threshold, setThreshold] = useState(0);
  const [search, setSearch] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [alertsDrawerOpen, setAlertsDrawerOpen] = useState(false);
  const [thresholdInput, setThresholdInput] = useState('0');
  const [thresholdError, setThresholdError] = useState('');
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [saleForm, setSaleForm] = useState({
    customerName: '',
    customerMobile: '',
    customerEmail: '',
    paymentMode: 'UPI',
    paymentProvider: 'GPAY',
    remarks: '',
    items: [createEmptyItem()],
  });

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

  const resetSaleForm = () => {
    setSaleForm({
      customerName: '',
      customerMobile: '',
      customerEmail: '',
      paymentMode: 'UPI',
      paymentProvider: 'GPAY',
      remarks: '',
      items: [createEmptyItem()],
    });
    setSubmitError('');
    setSubmitSuccess('');
  };

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleOpenSaleDrawer = async () => {
    setSaleDrawerOpen(true);
    setSubmitError('');
    setSubmitSuccess('');
    setToast({ open: false, message: '', severity: 'success' });
    setLoadingProducts(true);

    try {
      const response = await axiosInstance.get('/inventory', { params: { page: 0, size: 100 } });
      setInventoryOptions(response.data?.content || []);
    } catch (err) {
      setSubmitError(err.message || 'Unable to load products for sale.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const updateSaleItem = (index, updates) => {
    setSaleForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...updates } : item)),
    }));
  };

  const handleSelectProduct = async (index, selectedOption) => {
    const productId = selectedOption?.productId || '';
    const productName = selectedOption?.productName || '';

    updateSaleItem(index, {
      productId,
      productName,
      quantityAvailable: null,
      averageCost: selectedOption?.averageCost ?? null,
      sellingPrice: selectedOption?.averageCost ?? '',
      loading: Boolean(productId),
      error: '',
    });

    if (!productId) {
      return;
    }

    try {
      const response = await axiosInstance.get(`/inventory/product/${productId}/batches`);
      const details = response.data || {};
      const quantityAvailable = Number(details.quantityAvailable ?? details.totalStock ?? 0);
      const averageCost = Number(details.averageCost ?? selectedOption?.averageCost ?? 0);
      const currentItem = saleForm.items[index];
      const quantity = currentItem?.quantity || 1;
      const nextError = quantity > quantityAvailable ? `Only ${quantityAvailable} available in stock.` : '';

      updateSaleItem(index, {
        quantityAvailable,
        averageCost,
        sellingPrice: currentItem?.sellingPrice || averageCost,
        loading: false,
        error: nextError,
      });
    } catch (err) {
      updateSaleItem(index, {
        loading: false,
        error: err.message || 'Unable to load stock information.',
      });
    }
  };

  const handleAddItem = () => {
    setSaleForm((prev) => ({ ...prev, items: [...prev.items, createEmptyItem()] }));
  };

  const handleRemoveItem = (index) => {
    setSaleForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSaleFieldChange = (field, value) => {
    setSaleForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemFieldChange = (index, field, value) => {
    const updatedItem = { ...saleForm.items[index], [field]: field === 'quantity' ? Number(value) : value };

    if (field === 'quantity' && updatedItem.quantityAvailable != null) {
      updatedItem.error = Number(value) > updatedItem.quantityAvailable ? `Only ${updatedItem.quantityAvailable} available in stock.` : '';
    }

    updateSaleItem(index, updatedItem);
  };

  const validateSaleForm = () => {
    if (!saleForm.customerName.trim()) {
      return 'Customer name is required.';
    }
    if (!saleForm.customerMobile.trim()) {
      return 'Customer mobile is required.';
    }
    if (!saleForm.items.length) {
      return 'Please add at least one product.';
    }

    for (const item of saleForm.items) {
      if (!item.productId) {
        return 'Please select a product for every row.';
      }
      if (!item.quantity || item.quantity <= 0) {
        return 'Quantity must be greater than zero.';
      }
      if (item.quantityAvailable != null && item.quantity > item.quantityAvailable) {
        return `Quantity for ${item.productName || 'selected product'} exceeds available stock.`;
      }
      if (!item.sellingPrice || Number(item.sellingPrice) <= 0) {
        return 'Selling price must be greater than zero.';
      }
    }

    return '';
  };

  const handleSaveSale = async () => {
    const validationError = validateSaleForm();
    if (validationError) {
      setSubmitError(validationError);
      showToast(validationError, 'error');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const payload = {
        customerName: saleForm.customerName.trim(),
        customerMobile: saleForm.customerMobile.trim(),
        customerEmail: saleForm.customerEmail.trim() || undefined,
        paymentMode: saleForm.paymentMode,
        paymentProvider: saleForm.paymentProvider.trim(),
        remarks: saleForm.remarks.trim(),
        items: saleForm.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          sellingPrice: Number(item.sellingPrice),
        })),
      };

      await axiosInstance.post('/sales', payload);
      const totalItems = payload.items.reduce((sum, item) => sum + item.quantity, 0);
      const totalValue = payload.items.reduce((sum, item) => sum + item.quantity * item.sellingPrice, 0);
      setSubmitSuccess(`Sale saved successfully for ${totalItems} item(s) totaling ₹${totalValue.toLocaleString('en-IN')}.`);
      showToast(`Sale saved successfully for ${totalItems} item(s).`, 'success');
      resetSaleForm();
      // A sale reduces stock, which can trip low-stock thresholds — refresh both
      // the inventory table and the low-stock alerts so the badge/drawer stay accurate.
      await Promise.all([loadInventory(), loadAlerts()]);
      setSaleDrawerOpen(false);
    } catch (err) {
      const errorMessage = err.message || 'Unable to save sale.';
      setSubmitError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedItems = saleForm.items.filter((item) => item.productId && item.quantity > 0);
  const totalSummaryQty = selectedItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalSummaryValue = selectedItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.sellingPrice || 0), 0);
  const lowStockCount = useMemo(() => alerts.length, [alerts]);

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
          <Tooltip title={`Low Stock Alerts${lowStockCount > 0 ? ` (${lowStockCount})` : ''}`}>
            <IconButton
              color={lowStockCount > 0 ? 'error' : 'default'}
              onClick={() => setAlertsDrawerOpen(true)}
              aria-label="low stock alerts"
              size="small"
            >
              <Badge badgeContent={lowStockCount} color="error" max={99}>
                <NotificationsNoneOutlinedIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Button
            variant="outlined"
            startIcon={<TuneRoundedIcon />}
            onClick={() => setSettingsOpen(true)}
            size="small"
          >
            Threshold
          </Button>

          <Button variant="contained" onClick={handleOpenSaleDrawer}>
            Sale
          </Button>
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
                        <TableCell>₹{item.stockValue?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>₹{item.averageCost?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
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
        open={saleDrawerOpen}
        onClose={() => {
          setSaleDrawerOpen(false);
          resetSaleForm();
        }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 560 }, p: 3 } }}
      >
        <Stack spacing={2.5} sx={{ height: '100%' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              New Sale
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'normal' }}>
              Capture a quick counter sale, validate stock, and review the summary before saving.
            </Typography>
          </Box>

          {submitError ? <Alert severity="error">{submitError}</Alert> : null}
          {submitSuccess ? <Alert severity="success">{submitSuccess}</Alert> : null}

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 0, bgcolor: '#FAFBFF' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Customer Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Customer Name"
                  fullWidth
                  required
                  value={saleForm.customerName}
                  onChange={(event) => handleSaleFieldChange('customerName', event.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Customer Mobile"
                  fullWidth
                  required
                  value={saleForm.customerMobile}
                  onChange={(event) => handleSaleFieldChange('customerMobile', event.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Customer Email"
                  fullWidth
                  type="email"
                  value={saleForm.customerEmail}
                  onChange={(event) => handleSaleFieldChange('customerEmail', event.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Payment Mode"
                  fullWidth
                  value={saleForm.paymentMode}
                  onChange={(event) => handleSaleFieldChange('paymentMode', event.target.value)}
                >
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="CARD">Card</MenuItem>
                  <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Payment Provider"
                  fullWidth
                  value={saleForm.paymentProvider}
                  onChange={(event) => handleSaleFieldChange('paymentProvider', event.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Remarks"
                  fullWidth
                  multiline
                  minRows={2}
                  value={saleForm.remarks}
                  onChange={(event) => handleSaleFieldChange('remarks', event.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Products
            </Typography>
            <Stack spacing={2}>
              {saleForm.items.map((item, index) => (
                <Paper key={`${item.productId || 'new'}-${index}`} variant="outlined" sx={{ borderRadius: 0, p: 2, bgcolor: '#fff' }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Item {index + 1}
                      </Typography>
                      {item.productName ? (
                        <Chip size="small" label={item.productName} color="primary" variant="outlined" />
                      ) : null}
                    </Box>

                    <Autocomplete
                      options={inventoryOptions}
                      loading={loadingProducts}
                      value={inventoryOptions.find((option) => option.productId === item.productId) || null}
                      onChange={(event, value) => handleSelectProduct(index, value)}
                      getOptionLabel={(option) => option?.productName || ''}
                      isOptionEqualToValue={(option, value) => option?.productId === value?.productId}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Product"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {loadingProducts ? <CircularProgress color="inherit" size={16} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Quantity"
                          type="number"
                          fullWidth
                          value={item.quantity}
                          onChange={(event) => handleItemFieldChange(index, 'quantity', event.target.value)}
                          inputProps={{ min: 1 }}
                          error={Boolean(item.error)}
                          helperText={item.error || (item.quantityAvailable != null ? `Available stock: ${item.quantityAvailable}` : '')}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Selling Price"
                          type="number"
                          fullWidth
                          value={item.sellingPrice}
                          onChange={(event) => handleItemFieldChange(index, 'sellingPrice', event.target.value)}
                          inputProps={{ min: 0 }}
                          helperText={item.averageCost != null ? `Unit cost: ₹${Number(item.averageCost).toLocaleString('en-IN')}` : ''}
                        />
                      </Grid>
                    </Grid>

                    {saleForm.items.length > 1 ? (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={() => handleRemoveItem(index)}>
                          Remove
                        </Button>
                      </Box>
                    ) : null}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>

          <Button startIcon={<AddCircleOutlineIcon />} onClick={handleAddItem} sx={{ alignSelf: 'flex-start' }}>
            Add Product
          </Button>

          {selectedItems.length > 0 ? (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 0, bgcolor: '#F8FAFC' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Sale Summary
              </Typography>
              <Stack spacing={1} divider={<Divider flexItem />}>
                {selectedItems.map((item) => (
                  <Box key={item.productId} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="body2">{item.productName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.quantity} × ₹{Number(item.sellingPrice || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <Typography variant="body2">Total</Typography>
                  <Typography variant="body2">
                    {totalSummaryQty} item(s) • ₹{totalSummaryValue.toLocaleString('en-IN')}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ) : null}

          <Stack direction="row" spacing={2} sx={{ mt: 'auto' }}>
            <Button variant="outlined" onClick={() => {
              setSaleDrawerOpen(false);
              resetSaleForm();
            }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSaveSale} disabled={submitting} sx={{ minWidth: 130 }}>
              {submitting ? 'Saving...' : 'Save Sale'}
            </Button>
          </Stack>
        </Stack>
      </Drawer>

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
