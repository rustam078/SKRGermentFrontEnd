import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import salesService from '../services/salesService';
import customerService from '../services/customerService';
import productService from '../services/productService';
import CustomerInformationCard from '../components/CustomerInformationCard';

const initialItem = {
  productId: '',
  productName: '',
  quantityAvailable: null,
  quantity: 1,
  sellingPrice: 0,
  cost: 0,
  discount: 0,
  error: '',
};

// Profit % / amount for one line, based on unit cost vs selling price (after discount).
const lineProfit = (item) => {
  const qty = Number(item.quantity) || 0;
  const price = Number(item.sellingPrice) || 0;
  const cost = Number(item.cost) || 0;
  const discount = Number(item.discount) || 0;
  const revenue = price * qty - discount;
  const totalCost = cost * qty;
  const amount = revenue - totalCost;
  const pct = totalCost > 0 ? (amount / totalCost) * 100 : null;
  return { amount, pct, hasCost: cost > 0 };
};

const CreateSale = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formValues, setFormValues] = useState({
    customerName: '',
    customerMobile: '',
    customerEmail: '',
    paymentMode: 'CASH',
    paymentProvider: '',
    remarks: '',
    items: [initialItem],
  });
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const productInputRefs = React.useRef([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [productOptions, setProductOptions] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productLoading, setProductLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const hasEmptySelection = formValues.items.some((it) => !it.productId);
  const anyProductSelected = formValues.items.some((it) => Boolean(it.productId));
  const hasValidationIssues = useMemo(() => {
    if (!formValues.customerName.trim()) return true;
    if (!formValues.customerMobile.trim()) return true;
    if (!formValues.items.length) return true;
    for (const item of formValues.items) {
      if (!item.productId) return true;
      if (!item.quantity || Number(item.quantity) <= 0) return true;
      if (item.quantityAvailable != null && Number(item.quantity) > Number(item.quantityAvailable)) return true;
      if (Number(item.sellingPrice) < 0) return true;
    }
    return false;
  }, [formValues]);

  const createSaleMutation = useMutation({
    mutationFn: salesService.createSale,
    onSuccess: () => {
      // A new sale changes the dashboard, recent sales, top products, the sales
      // list and stock levels — invalidate them all so every view is fresh
      // (the global 5-min staleTime otherwise leaves them stale until a manual reload).
      queryClient.invalidateQueries({ queryKey: ['salesDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['recentSales'] });
      queryClient.invalidateQueries({ queryKey: ['topProducts'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['salesList'] });
      setToast({ open: true, message: 'Sale created successfully', severity: 'success' });
      setTimeout(() => navigate('/sales/dashboard'), 900);
    },
    onError: (error) => {
      setToast({ open: true, message: error.message || 'Unable to create sale', severity: 'error' });
    },
  });

  const subtotal = useMemo(
    () => formValues.items.reduce((sum, item) => sum + ((Number(item.sellingPrice) || 0) * (Number(item.quantity) || 0) - (Number(item.discount) || 0)), 0),
    [formValues.items]
  );

  const totalProfit = useMemo(
    () => formValues.items.reduce((sum, item) => (item.productId ? sum + lineProfit(item).amount : sum), 0),
    [formValues.items]
  );

  const totalCostBasis = useMemo(
    () => formValues.items.reduce((sum, item) => (item.productId ? sum + (Number(item.cost) || 0) * (Number(item.quantity) || 0) : sum), 0),
    [formValues.items]
  );

  const totalProfitPct = totalCostBasis > 0 ? (totalProfit / totalCostBasis) * 100 : null;

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const updateItem = (index, changes) => {
    setFormValues((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) => (idx === index ? { ...item, ...changes } : item)),
    }));
  };

  const isQuantityExceeded = (item) => (
    item && item.quantityAvailable != null && Number(item.quantity) > Number(item.quantityAvailable)
  );

  const formatProductLabel = (product) => {
    const code = product?.productCode || product?.barcode || product?.sku || product?.productSKU || product?.code;
    return [product?.productName || product?.name || '', code].filter(Boolean).join(' - ');
  };

  const handleAddItem = () => {
    setFormValues((prev) => ({ ...prev, items: [...prev.items, { ...initialItem }] }));
    // focus the product input for the new row
    setTimeout(() => {
      const idx = formValues.items.length; // new index
      const el = productInputRefs.current[idx];
      if (el && el.focus) el.focus();
    }, 80);
  };

  const handleRemoveItem = (index) => {
    setFormValues((prev) => ({ ...prev, items: prev.items.filter((_, idx) => idx !== index) }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formValues.customerName.trim()) nextErrors.customerName = 'Customer name is required';
    if (!formValues.customerMobile.trim()) nextErrors.customerMobile = 'Mobile number is required';
    if (!formValues.items.length) nextErrors.items = 'At least one product is required';
    formValues.items.forEach((item, index) => {
      if (!item.productId) nextErrors[`item_${index}`] = 'Product is required';
      if (!item.quantity || Number(item.quantity) <= 0) nextErrors[`quantity_${index}`] = 'Quantity must be greater than zero';
      if (item.quantityAvailable != null && Number(item.quantity) > Number(item.quantityAvailable)) nextErrors[`quantity_${index}`] = 'Quantity exceeds available stock';
      if (Number(item.sellingPrice) < 0) nextErrors[`sellingPrice_${index}`] = 'Selling price cannot be negative';
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const payload = {
      customerName: formValues.customerName,
      customerMobile: formValues.customerMobile,
      customerEmail: formValues.customerEmail,
      paymentMode: formValues.paymentMode,
      paymentProvider: formValues.paymentProvider,
      remarks: formValues.remarks,
      items: formValues.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        sellingPrice: Number(item.sellingPrice),
        discount: Number(item.discount),
      })),
    };

    createSaleMutation.mutate(payload);
  };

  const fetchCustomers = async () => {
    setCustomerLoading(true);
    try {
      const data = await customerService.getCustomers(formValues.customerMobile.trim());
      setCustomerResults(data?.content || []);
    } catch (err) {
      setToast({ open: true, message: err.message || 'Unable to fetch customers', severity: 'error' });
    } finally {
      setCustomerLoading(false);
    }
  };

  useEffect(() => {
    if (!formValues.customerMobile.trim()) {
      setCustomerResults([]);
      setSelectedCustomer(null);
      return;
    }
    const timer = window.setTimeout(fetchCustomers, 400);
    return () => window.clearTimeout(timer);
  }, [formValues.customerMobile]);

  // Load inventory products once and use for Autocomplete dropdown filtering
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setProductLoading(true);
      try {
        const list = await productService.getInventoryProducts(0, 200);
        if (!mounted) return;
        setProductOptions(Array.isArray(list) ? list : []);
      } catch (err) {
        setToast({ open: true, message: err.message || 'Unable to load products', severity: 'error' });
      } finally {
        if (mounted) setProductLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectCustomer = (customer) => {
    if (!customer) {
      setSelectedCustomer(null);
      return;
    }
    setSelectedCustomer(customer);
    setFormValues((prev) => ({
      ...prev,
      customerName: customer.name,
      customerMobile: customer.mobile,
      customerEmail: customer.email,
    }));
  };

  const handleSelectProduct = (product, index) => {
    if (!product) return;
    const existingIndex = formValues.items.findIndex((item) => item.productId === product.productId);
    if (existingIndex !== -1 && existingIndex !== index) return;

    // Use inventory API fields available on product object.
    const quantityAvailable = product?.currentStock ?? product?.quantityAvailable ?? null;
    // Prefer the configured selling price (product_sale_price) when one is set;
    // fall back to the average purchase/production cost only when no price exists.
    const configuredSellingPrice = Number(product?.sellingPrice);
    const avgCost = Number(product?.averageCost) || 0;
    const price = product?.sellingPrice != null && configuredSellingPrice > 0
      ? configuredSellingPrice
      : avgCost;

    updateItem(index, {
      productId: product.productId,
      productName: product.productName || product.name,
      quantityAvailable,
      sellingPrice: price,
      cost: avgCost,
      discount: 0,
      _selectedProduct: product,
    });

    // remember last selected product for display
    setSelectedProduct(product);
  };

  const cardSx = {
    borderRadius: 3,
    boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 10px 15px -3px rgba(15,23,42,0.04)',
    border: '1px solid',
    borderColor: 'divider',
    overflow: 'hidden',
  };

  const totalDiscount = formValues.items.reduce((sum, item) => sum + (Number(item.discount) || 0), 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
        <Button startIcon={<ArrowBackIcon />} variant="text" sx={{ color: '#475569' }} onClick={() => navigate('/sales/list')}>
          Back
        </Button>
        <Divider orientation="vertical" flexItem />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>New Sale</Typography>
          <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>Create a customer invoice in a few clicks</Typography>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            <CustomerInformationCard
              formValues={formValues}
              onChange={handleInputChange}
              onSearchMobile={fetchCustomers}
              onSelectCustomer={handleSelectCustomer}
              customers={customerResults}
              loadingCustomers={customerLoading}
              selectedCustomer={selectedCustomer}
              errors={errors}
            />

            <Card sx={cardSx}>
              <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBagOutlinedIcon sx={{ color: '#2563EB', fontSize: 20 }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>Products</Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: '#94A3B8' }}>Search and add items to this sale</Typography>
                </Box>
                <Box sx={{ px: 1.5, py: 0.5, borderRadius: 5, bgcolor: '#F1F5F9', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  {formValues.items.filter((i) => i.productId).length} item{formValues.items.filter((i) => i.productId).length === 1 ? '' : 's'}
                </Box>
              </Box>
              <CardContent sx={{ p: 2 }}>
              <Stack spacing={2}>
                <TableContainer sx={{ boxShadow: 'none' }}>
                  <Table size="small" sx={{ '& th': { backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: 'none' }, '& tbody tr:hover': { backgroundColor: '#F8FAFC' } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }}>#</TableCell>
                        <TableCell>Product</TableCell>
                        <TableCell>Stock</TableCell>
                        <TableCell>Qty</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Discount</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Profit</TableCell>
                        <TableCell align="center" sx={{ borderTopRightRadius: 8, borderBottomRightRadius: 8 }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formValues.items.map((item, index) => (
                        <TableRow key={`${item.productId || index}-${index}`}>
                          <TableCell sx={{ width: 32, px: 1 }}>{index + 1}</TableCell>
                          <TableCell sx={{ minWidth: 120, px: 1 }}>
                            <Autocomplete
                              options={productOptions.filter((p) => p.productId === item.productId || !formValues.items.some((it) => it.productId === p.productId && it.productId !== item.productId))}
                              loading={productLoading}
                              popupIcon={<ArrowDropDownIcon />}
                              value={productOptions.find((option) => option.productId === item.productId) || null}
                              onChange={(event, value) => handleSelectProduct(value, index)}
                              getOptionLabel={formatProductLabel}
                              isOptionEqualToValue={(option, value) => option.productId === value?.productId}
                              renderOption={(props, option) => (
                                <li {...props}>
                                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography sx={{ fontSize: '0.95rem' }}>{option.productName || option.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {option.productCode || option.barcode || option.sku || option.productSKU || ''}
                                    </Typography>
                                  </Box>
                                </li>
                              )}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Search product by name / code / barcode"
                                  size="small"
                                  fullWidth
                                  inputRef={(el) => (productInputRefs.current[index] = el)}
                                  sx={{ backgroundColor: '#FBFCFF', borderRadius: 1 }}
                                  InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                      <>
                                        {productLoading ? <CircularProgress color="inherit" size={16} /> : null}
                                        {params.InputProps.endAdornment}
                                      </>
                                    ),
                                  }}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 0.5 }}>
                            <Typography variant="body2" color={item.quantityAvailable > 0 ? 'success.main' : 'text.secondary'}>
                              {item.quantityAvailable ?? '-'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 0.5, px: 0.5 }}>
                            <Stack direction="row" alignItems="center" spacing={0.25}>
                              <IconButton size="small" sx={{ p: 0.25 }} disabled={!item.productId} onClick={() => updateItem(index, { quantity: Math.max(1, (Number(item.quantity) || 0) - 1) })}>
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <TextField
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  updateItem(index, { quantity: val });
                                }}
                                size="small"
                                inputProps={{ min: 1, style: { textAlign: 'center', padding: '6px 2px' } }}
                                error={isQuantityExceeded(item) || Boolean(errors[`quantity_${index}`])}
                                helperText={isQuantityExceeded(item) ? `Only ${item.quantityAvailable} left` : errors[`quantity_${index}`] || ''}
                                sx={{ width: 48, '& .MuiInputBase-root': { backgroundColor: '#FBFCFF' } }}
                                disabled={!item.productId}
                              />
                              <IconButton
                                size="small"
                                disabled={!item.productId || (item.quantityAvailable != null && Number(item.quantity) >= Number(item.quantityAvailable))}
                                onClick={() => {
                                  const current = Number(item.quantity) || 0;
                                  const max = item.quantityAvailable != null ? Number(item.quantityAvailable) : current + 1;
                                  const next = Math.min(current + 1, max);
                                  updateItem(index, { quantity: next });
                                }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ py: 0.5, px: 0.5 }}>
                            <TextField
                              type="number"
                              value={item.sellingPrice}
                              onChange={(e) => updateItem(index, { sellingPrice: Number(e.target.value) })}
                              size="small"
                              inputProps={{ min: 0, style: { padding: '6px 6px' } }}
                              sx={{ width: 84, '& .MuiInputBase-root': { backgroundColor: '#FBFCFF' } }}
                              disabled={!item.productId}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 0.5, px: 0.5 }}>
                            <TextField
                              type="number"
                              value={item.discount}
                              onChange={(e) => updateItem(index, { discount: Number(e.target.value) })}
                              size="small"
                              inputProps={{ min: 0, style: { padding: '6px 6px' } }}
                              sx={{ width: 68, '& .MuiInputBase-root': { backgroundColor: '#FBFCFF' } }}
                              disabled={!item.productId}
                            />
                          </TableCell>
                          <TableCell>
                            ₹{((Number(item.sellingPrice) || 0) * (Number(item.quantity) || 0) - (Number(item.discount) || 0)).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell sx={{ py: 0.5, px: 0.5 }}>
                            {(() => {
                              if (!item.productId) return <Typography variant="body2" color="text.secondary">—</Typography>;
                              const p = lineProfit(item);
                              if (!p.hasCost) {
                                return <Typography variant="caption" color="text.secondary">No cost set</Typography>;
                              }
                              const positive = p.amount >= 0;
                              return (
                                <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                  <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: positive ? '#047857' : '#B91C1C', lineHeight: 1.1 }}>
                                    {p.pct != null ? `${positive ? '+' : ''}${p.pct.toFixed(1)}%` : '—'}
                                  </Typography>
                                  <Typography sx={{ fontSize: '0.72rem', color: positive ? '#059669' : '#DC2626' }}>
                                    {positive ? '+' : '−'}₹{Math.abs(p.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                  </Typography>
                                </Box>
                              );
                            })()}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              color="error"
                              onClick={() => handleRemoveItem(index)}
                              disabled={formValues.items.length === 1}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Button
                  startIcon={<AddCircleOutlineIcon />}
                  variant="outlined"
                  onClick={handleAddItem}
                  disabled={hasEmptySelection}
                  fullWidth
                  sx={{ borderStyle: 'dashed', borderColor: '#CBD5E1', color: '#2563EB', py: 1.1, fontWeight: 700, '&:hover': { borderStyle: 'dashed', bgcolor: '#EFF6FF' } }}
                >
                  Add Product
                </Button>
              </Stack>
            </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Box sx={{ position: { lg: 'sticky' }, top: 88 }}>
            <Card sx={cardSx}>
              <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ReceiptLongOutlinedIcon sx={{ color: '#059669', fontSize: 20 }} />
                </Box>
                <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>Order Summary</Typography>
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                  {/* Grand total highlight */}
                  <Box sx={{ p: 2.25, borderRadius: 3, bgcolor: '#0F172A', color: '#fff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Grand Total</Typography>
                      <Box sx={{ px: 1, py: 0.25, borderRadius: 5, bgcolor: 'rgba(255,255,255,0.08)', fontSize: '0.7rem', fontWeight: 700, color: '#CBD5E1' }}>
                        {formValues.items.filter((i) => i.productId).length} item{formValues.items.filter((i) => i.productId).length === 1 ? '' : 's'}
                      </Box>
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '2rem', lineHeight: 1.15, mt: 0.5 }}>₹{subtotal.toLocaleString('en-IN')}</Typography>
                    {totalDiscount > 0 && (
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748B', mt: 0.25 }}>You saved ₹{totalDiscount.toLocaleString('en-IN')}</Typography>
                    )}
                  </Box>

                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>Subtotal</Typography>
                      <Typography sx={{ fontWeight: 600 }}>₹{subtotal.toLocaleString('en-IN')}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>Discount</Typography>
                      <Typography sx={{ fontWeight: 600 }}>₹{totalDiscount.toLocaleString('en-IN')}</Typography>
                    </Box>
                    {totalCostBasis > 0 && anyProductSelected && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>Estimated Profit</Typography>
                        <Typography sx={{ fontWeight: 800, color: totalProfit >= 0 ? '#047857' : '#B91C1C' }}>
                          {totalProfit >= 0 ? '+' : '−'}₹{Math.abs(totalProfit).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          {totalProfitPct != null ? ` (${totalProfit >= 0 ? '+' : ''}${totalProfitPct.toFixed(1)}%)` : ''}
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  <Divider />

                  <TextField
                    label="Payment Mode"
                    name="paymentMode"
                    select
                    value={formValues.paymentMode}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    SelectProps={{ native: true }}
                    disabled={!anyProductSelected}
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="NET_BANKING">Net Banking</option>
                    <option value="WALLET">Wallet</option>
                  </TextField>
                  {formValues.paymentMode !== 'CASH' ? (
                    <TextField
                      label="Payment Provider"
                      name="paymentProvider"
                      value={formValues.paymentProvider}
                      onChange={handleInputChange}
                      fullWidth
                      size="small"
                      disabled={!anyProductSelected}
                    />
                  ) : null}
                  <TextField
                    label="Remarks (optional)"
                    name="remarks"
                    value={formValues.remarks}
                    onChange={handleInputChange}
                    multiline
                    minRows={2}
                    fullWidth
                    size="small"
                    disabled={!anyProductSelected}
                  />

                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<CheckCircleOutlineIcon />}
                    onClick={handleSave}
                    disabled={createSaleMutation.isLoading || hasValidationIssues}
                    sx={{ py: 1.2, fontWeight: 700, fontSize: '0.95rem', boxShadow: '0 8px 20px -6px rgba(37,99,235,0.5)' }}
                  >
                    {createSaleMutation.isLoading ? 'Saving…' : 'Complete Sale'}
                  </Button>
                  <Button variant="text" fullWidth onClick={() => navigate('/sales/dashboard')} sx={{ color: '#64748B' }}>
                    Cancel
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 1300 }}>
        {toast.open ? (
          <Paper sx={{ px: 3, py: 1.5, borderRadius: 2, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)' }}>
            <Typography color={toast.severity === 'error' ? 'error.main' : 'success.main'}>{toast.message}</Typography>
          </Paper>
        ) : null}
      </Box>
    </Box>
  );
};

export default CreateSale;