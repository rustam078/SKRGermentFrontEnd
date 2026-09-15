import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import ScanBar from '../../qr/components/ScanBar';
import { mergeScannedUnit } from '../../qr/scanCart';
import { getCurrencySymbol } from '../../../utils/currency';

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

// Inline click-to-edit number cell: shows the value as text; click turns it into a
// compact input. Commits on blur/Enter, cancels on Escape.
const EditableNumber = ({ value, onCommit, prefix = '', disabled, min = 0, width = 92 }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? 0));
  useEffect(() => { setDraft(String(value ?? 0)); }, [value]);

  const commit = () => { setEditing(false); onCommit(Number(draft) || 0); };

  if (!editing) {
    return (
      <Box
        onClick={() => !disabled && setEditing(true)}
        sx={{
          display: 'inline-block', minWidth: width, textAlign: 'right', px: 1, py: 0.5, borderRadius: 1,
          cursor: disabled ? 'default' : 'text', color: '#0F172A', fontWeight: 600, fontSize: '0.86rem',
          '&:hover': disabled ? {} : { bgcolor: '#EFF3FB', outline: '1px dashed #BFDBFE' },
        }}
      >
        {prefix}{Number(value || 0).toLocaleString('en-IN')}
      </Box>
    );
  }
  return (
    <TextField
      type="number" size="small" autoFocus value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { setEditing(false); setDraft(String(value ?? 0)); }
      }}
      inputProps={{ min, style: { textAlign: 'right', padding: '4px 6px', fontWeight: 600 } }}
      sx={{ width, '& .MuiInputBase-root': { bgcolor: '#fff' } }}
    />
  );
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
    items: [],
  });
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [productOptions, setProductOptions] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const anyProductSelected = formValues.items.length > 0;
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
      // list and stock levels — invalidate them all so every view is fresh.
      queryClient.invalidateQueries({ queryKey: ['salesDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['recentSales'] });
      queryClient.invalidateQueries({ queryKey: ['topProducts'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['salesList'] });
      setToast({ open: true, message: 'Sale created successfully', severity: 'success' });
      setTimeout(() => navigate('/sales/list'), 900);
    },
    onError: (error) => {
      setToast({ open: true, message: error.message || 'Unable to create sale', severity: 'error' });
    },
  });

  // Final payable = sum of (price * qty - discount).
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
  const totalDiscount = formValues.items.reduce((sum, item) => sum + (Number(item.discount) || 0), 0);
  const itemsTotal = subtotal + totalDiscount; // gross before discount

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

  const handleRemoveItem = (index) => {
    setFormValues((prev) => ({ ...prev, items: prev.items.filter((_, idx) => idx !== index) }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formValues.customerName.trim()) nextErrors.customerName = 'Required';
    if (!formValues.customerMobile.trim()) nextErrors.customerMobile = 'Required';
    if (!formValues.items.length) nextErrors.items = 'Add at least one product';
    formValues.items.forEach((item, index) => {
      if (!item.quantity || Number(item.quantity) <= 0) nextErrors[`quantity_${index}`] = 'Qty > 0';
      if (item.quantityAvailable != null && Number(item.quantity) > Number(item.quantityAvailable)) nextErrors[`quantity_${index}`] = 'Exceeds stock';
      if (Number(item.sellingPrice) < 0) nextErrors[`sellingPrice_${index}`] = 'Invalid price';
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
        batchNumber: item.batchNumber || undefined,
        serials: item.serials && item.serials.length ? item.serials : undefined,
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

  // Load inventory products once for the add-product search.
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
    return () => { mounted = false; };
  }, []);

  const handleSelectCustomer = (customer) => {
    if (!customer) { setSelectedCustomer(null); return; }
    setSelectedCustomer(customer);
    setFormValues((prev) => ({
      ...prev,
      customerName: customer.name,
      customerMobile: customer.mobile,
      customerEmail: customer.email,
    }));
  };

  // A scanned QR unit → add/merge a batch-bound line at its frozen price.
  const handleScannedUnit = (unit) => {
    const makeNewItem = (u) => ({
      productId: u.productId,
      productName: u.productName,
      quantityAvailable: null,
      quantity: 1,
      sellingPrice: Number(u.printedPrice),
      cost: Number(u.unitCost) || 0,
      discount: 0,
      batchNumber: u.batchNumber,
      serials: [u.serial],
    });
    const { items, error } = mergeScannedUnit(formValues.items, unit, makeNewItem);
    if (error) { setToast({ open: true, message: error, severity: 'error' }); return; }
    setFormValues((prev) => ({ ...prev, items }));
    setToast({ open: true, message: `Added ${unit.serial}`, severity: 'success' });
  };

  // Add a product from the top search: append a new compact line, or if the product is
  // already in the cart (typed line), just bump its quantity (respecting stock).
  const handleAddProduct = (product) => {
    if (!product) return;
    const existingIndex = formValues.items.findIndex(
      (it) => it.productId === product.productId && !(it.serials && it.serials.length)
    );
    if (existingIndex !== -1) {
      const it = formValues.items[existingIndex];
      const max = it.quantityAvailable != null ? Number(it.quantityAvailable) : Infinity;
      updateItem(existingIndex, { quantity: Math.min((Number(it.quantity) || 0) + 1, max) });
      return;
    }
    const quantityAvailable = product?.currentStock ?? product?.quantityAvailable ?? null;
    const configuredSellingPrice = Number(product?.sellingPrice);
    const avgCost = Number(product?.averageCost) || 0;
    const price = product?.sellingPrice != null && configuredSellingPrice > 0 ? configuredSellingPrice : avgCost;
    setFormValues((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: product.productId,
          productName: product.productName || product.name,
          quantityAvailable,
          quantity: 1,
          sellingPrice: price,
          cost: avgCost,
          discount: 0,
        },
      ],
    }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Top bar: Back + inline customer fields (no card, one row) */}
      <Stack direction="row" alignItems="flex-start" spacing={1.5} flexWrap="wrap" sx={{ rowGap: 1.5 }}>
        <Button startIcon={<ArrowBackIcon />} variant="text" sx={{ color: '#475569', mt: 0.5 }} onClick={() => navigate('/sales/list')}>
          Back
        </Button>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Autocomplete
          freeSolo options={customerResults} loading={customerLoading}
          getOptionLabel={(o) => (typeof o === 'string' ? o : `${o.mobile} — ${o.name}`)}
          filterOptions={(x) => x}
          inputValue={formValues.customerMobile}
          onInputChange={(e, val, reason) => { if (reason === 'input') setFormValues((prev) => ({ ...prev, customerMobile: val })); }}
          onChange={(e, val) => { if (val && typeof val === 'object') handleSelectCustomer(val); }}
          sx={{ flex: '1 1 190px', minWidth: 170 }}
          renderInput={(params) => (
            <TextField {...params} label="Mobile" size="small" required
              error={Boolean(errors.customerMobile)} helperText={errors.customerMobile || ' '} sx={{ bgcolor: '#fff' }} />
          )}
        />
        <TextField
          name="customerName" label="Customer name" size="small" required
          value={formValues.customerName} onChange={handleInputChange}
          error={Boolean(errors.customerName)} helperText={errors.customerName || ' '}
          sx={{ flex: '1 1 200px', minWidth: 170, bgcolor: '#fff' }}
        />
        <TextField
          name="customerEmail" label="Email (optional)" size="small"
          value={formValues.customerEmail} onChange={handleInputChange} helperText=" "
          sx={{ flex: '1 1 200px', minWidth: 170, bgcolor: '#fff' }}
        />
      </Stack>

      <Grid container spacing={3}>
        {/* Products */}
        <Grid item xs={12} lg={8}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
              <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBagOutlinedIcon sx={{ color: '#2563EB', fontSize: 18 }} />
              </Box>
              <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem', flexGrow: 1 }}>Products</Typography>
              <Chip size="small" label={`${formValues.items.length} item${formValues.items.length === 1 ? '' : 's'}`} sx={{ fontWeight: 700, bgcolor: '#F1F5F9', color: '#475569' }} />
            </Stack>

            <Stack spacing={2}>
              <ScanBar onUnit={handleScannedUnit} onError={(m) => setToast({ open: true, message: m, severity: 'error' })} />

              <Autocomplete
                options={productOptions.filter((p) => !formValues.items.some((it) => it.productId === p.productId && !(it.serials && it.serials.length)))}
                loading={productLoading}
                value={null}
                blurOnSelect
                clearOnBlur
                popupIcon={<ArrowDropDownIcon />}
                onChange={(e, value) => handleAddProduct(value)}
                getOptionLabel={formatProductLabel}
                isOptionEqualToValue={(o, v) => o.productId === v?.productId}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography sx={{ fontSize: '0.95rem' }}>{option.productName || option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{option.productCode || option.barcode || option.sku || option.productSKU || ''}</Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search product by name / code / barcode to add…"
                    size="small" fullWidth
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <AddCircleOutlineIcon sx={{ color: '#2563EB', ml: 0.5, mr: 0.5 }} fontSize="small" />,
                      endAdornment: (<>{productLoading ? <CircularProgress color="inherit" size={16} /> : null}{params.InputProps.endAdornment}</>),
                    }}
                    sx={{ bgcolor: '#fff' }}
                  />
                )}
              />

              {formValues.items.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 7, color: '#94A3B8', border: '1px dashed #E2E8F0', borderRadius: 3 }}>
                  <ShoppingBagOutlinedIcon sx={{ fontSize: 42, mb: 1, color: '#CBD5E1' }} />
                  <Typography sx={{ fontWeight: 700, color: '#64748B' }}>No products added</Typography>
                  <Typography variant="body2">Search above or scan a QR tag to add items.</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table
                    size="small"
                    sx={{
                      '& th': { backgroundColor: '#F8FAFC', color: '#64748B', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #E2E8F0', py: 1 },
                      '& td': { borderBottom: '1px solid #F1F5F9', py: 1 },
                      '& tbody tr:hover': { backgroundColor: '#F8FAFC' },
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 26 }}>#</TableCell>
                        <TableCell>Product</TableCell>
                        <TableCell align="center" sx={{ width: 116 }}>Qty</TableCell>
                        <TableCell align="right" sx={{ width: 96 }}>Price</TableCell>
                        <TableCell align="right" sx={{ width: 92 }}>Discount</TableCell>
                        <TableCell align="right" sx={{ width: 100 }}>Total</TableCell>
                        <TableCell align="right" sx={{ width: 72 }}>Profit</TableCell>
                        <TableCell sx={{ width: 40 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formValues.items.map((item, index) => {
                        const scanned = Boolean(item.serials && item.serials.length);
                        const lineTotal = (Number(item.sellingPrice) || 0) * (Number(item.quantity) || 0) - (Number(item.discount) || 0);
                        const p = lineProfit(item);
                        const exceeded = isQuantityExceeded(item);
                        return (
                          <TableRow key={`${item.productId}-${index}`} hover>
                            <TableCell sx={{ color: '#94A3B8', fontSize: '0.8rem' }}>{index + 1}</TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1.25} alignItems="center">
                                <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <ShoppingBagOutlinedIcon sx={{ color: '#2563EB', fontSize: 15 }} />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontWeight: 600, fontSize: '0.86rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 230 }}>{item.productName}</Typography>
                                  <Typography variant="caption" sx={{ color: exceeded ? '#DC2626' : '#94A3B8' }}>
                                    {scanned ? `${item.batchNumber} · ${item.serials.length} scanned` : (item.quantityAvailable != null ? `In stock: ${item.quantityAvailable}` : 'Stock: —')}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.25}>
                                <IconButton
                                  size="small" sx={{ p: 0.25 }}
                                  disabled={(Number(item.quantity) || 0) <= 1}
                                  onClick={() => {
                                    const cur = Number(item.quantity) || 0;
                                    if (cur <= 1) return;
                                    if (scanned) {
                                      const serials = item.serials.slice(0, -1);
                                      updateItem(index, { quantity: serials.length, serials });
                                    } else {
                                      updateItem(index, { quantity: cur - 1 });
                                    }
                                  }}
                                ><RemoveIcon fontSize="small" /></IconButton>
                                <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', color: exceeded ? '#DC2626' : '#0F172A' }}>{item.quantity}</Typography>
                                <IconButton size="small" sx={{ p: 0.25 }} disabled={scanned || (item.quantityAvailable != null && Number(item.quantity) >= Number(item.quantityAvailable))} onClick={() => { const cur = Number(item.quantity) || 0; const max = item.quantityAvailable != null ? Number(item.quantityAvailable) : cur + 1; updateItem(index, { quantity: Math.min(cur + 1, max) }); }}><AddIcon fontSize="small" /></IconButton>
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <EditableNumber value={item.sellingPrice} prefix={getCurrencySymbol()} onCommit={(v) => updateItem(index, { sellingPrice: v })} />
                            </TableCell>
                            <TableCell align="right">
                              <EditableNumber
                                value={item.discount}
                                prefix={getCurrencySymbol()}
                                width={82}
                                onCommit={(v) => {
                                  // Discount can't exceed the line amount (i.e. max 100% off).
                                  const gross = (Number(item.sellingPrice) || 0) * (Number(item.quantity) || 0);
                                  updateItem(index, { discount: Math.min(Math.max(0, v), gross) });
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>{getCurrencySymbol()}{lineTotal.toLocaleString('en-IN')}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              {!p.hasCost ? (
                                <Typography variant="caption" color="text.secondary">—</Typography>
                              ) : (
                                <Chip size="small" label={p.pct != null ? `${p.amount >= 0 ? '+' : ''}${p.pct.toFixed(0)}%` : '—'} sx={{ height: 20, fontWeight: 700, fontSize: '0.7rem', bgcolor: p.amount >= 0 ? '#ECFDF5' : '#FEF2F2', color: p.amount >= 0 ? '#047857' : '#B91C1C' }} />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" color="error" onClick={() => handleRemoveItem(index)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          </Box>
        </Grid>

        {/* Summary */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: { lg: 'sticky' }, top: 20 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
              <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ReceiptLongOutlinedIcon sx={{ color: '#059669', fontSize: 18 }} />
              </Box>
              <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem' }}>Order Summary</Typography>
            </Stack>

            <Stack spacing={2}>
              <Box sx={{ p: 2.25, borderRadius: 0, bgcolor: '#2e3647', color: '#fff' }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Payable</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '2rem', lineHeight: 1.15, mt: 0.5 }}>{getCurrencySymbol()}{subtotal.toLocaleString('en-IN')}</Typography>
                {totalDiscount > 0 && <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mt: 0.25 }}>You saved {getCurrencySymbol()}{totalDiscount.toLocaleString('en-IN')}</Typography>}
              </Box>

              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>Items Total</Typography>
                  <Typography sx={{ fontWeight: 600 }}>{getCurrencySymbol()}{itemsTotal.toLocaleString('en-IN')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>Discount</Typography>
                  <Typography sx={{ fontWeight: 600, color: totalDiscount > 0 ? '#DC2626' : 'inherit' }}>
                    {totalDiscount > 0 ? '− ' : ''}{getCurrencySymbol()}{totalDiscount.toLocaleString('en-IN')}
                  </Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>Total Payable</Typography>
                  <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>{getCurrencySymbol()}{subtotal.toLocaleString('en-IN')}</Typography>
                </Box>
                {totalCostBasis > 0 && anyProductSelected && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>Est. Profit</Typography>
                    <Typography sx={{ fontWeight: 800, color: totalProfit >= 0 ? '#047857' : '#B91C1C' }}>
                      {totalProfit >= 0 ? '+' : '−'}{getCurrencySymbol()}{Math.abs(totalProfit).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      {totalProfitPct != null ? ` (${totalProfit >= 0 ? '+' : ''}${totalProfitPct.toFixed(1)}%)` : ''}
                    </Typography>
                  </Box>
                )}
              </Stack>

              <Divider />

              <TextField label="Payment Mode" name="paymentMode" select value={formValues.paymentMode} onChange={handleInputChange} fullWidth size="small" SelectProps={{ native: true }} disabled={!anyProductSelected}>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="WALLET">Wallet</option>
              </TextField>
              {formValues.paymentMode !== 'CASH' ? (
                <TextField label="Payment Provider" name="paymentProvider" value={formValues.paymentProvider} onChange={handleInputChange} fullWidth size="small" disabled={!anyProductSelected} />
              ) : null}
              <TextField label="Remarks (optional)" name="remarks" value={formValues.remarks} onChange={handleInputChange} multiline minRows={2} fullWidth size="small" disabled={!anyProductSelected} />

              <Button variant="contained" fullWidth startIcon={<CheckCircleOutlineIcon />} onClick={handleSave} disabled={createSaleMutation.isLoading || hasValidationIssues} sx={{ py: 1.2, fontWeight: 700, fontSize: '0.95rem', boxShadow: '0 8px 20px -6px rgba(37,99,235,0.5)' }}>
                {createSaleMutation.isLoading ? 'Saving…' : 'Complete Sale'}
              </Button>
              <Button variant="text" fullWidth onClick={() => navigate('/sales/list')} sx={{ color: '#64748B' }}>Cancel</Button>
            </Stack>
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
