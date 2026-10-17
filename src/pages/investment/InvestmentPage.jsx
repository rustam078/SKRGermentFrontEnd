import React, { useState, useMemo, useEffect } from 'react';
import HeadingInfo from '../../components/common/HeadingInfo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ConfigProvider,
  Card,
  Row,
  Col,
  Table,
  Button,
  Space,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Modal,
  Tag,
  Divider,
  notification,
  Tooltip,
  Empty,
  Skeleton,
  Popover,
  Badge,
  Checkbox,
  Segmented,
} from 'antd';
import {
  PlusOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  WalletOutlined,
  ShoppingOutlined,
  DeleteOutlined,
  DownloadOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  BankOutlined,
  UserOutlined,
  TeamOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  TagsOutlined,
  LeftOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { investmentService, vendorService } from '../../services/investmentService';
import { productService } from '../../services/productService';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { formatMoney, getCurrencySymbol } from '../../utils/currency';
import { usePermissions } from '../../hooks/usePermissions';

const { Option } = Select;
const { TextArea } = Input;

// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────
const INVESTMENT_TYPES = [
  { value: 'PURCHASE', label: 'Purchase', color: 'var(--theme-primary)', bg: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '#BFDBFE' },
  { value: 'OVERHEAD', label: 'Overhead', color: 'var(--theme-primary)', bg: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '#FDE68A' },
];

const ITEM_TYPES = [
  { value: 'MATERIAL', label: 'Material' },
  { value: 'PRODUCT', label: 'Product' },
];

const UNIT_OPTIONS = [
  { key: 'NOS', label: 'Nos' },
  { key: 'PIECE', label: 'Piece' },
  { key: 'METER', label: 'Meter' },
  { key: 'KG', label: 'Kilogram' },
  { key: 'ROLL', label: 'Roll' },
  { key: 'GRAM', label: 'Gram' },
  { key: 'BUNDLE', label: 'Bundle' },
  { key: 'LITER', label: 'Liter' },
  { key: 'BOX', label: 'Box' },
  { key: 'DOZEN', label: 'Dozen' },
  { key: 'PACKET', label: 'Packet' },
  { key: 'PAIR', label: 'Pair' },
];

const getTypeConfig = (type) =>
  INVESTMENT_TYPES.find((t) => t.value === type) || INVESTMENT_TYPES[0];

// ─────────────────────────────────────────
// SHARED STYLES (matching ProductDetailsPage)
// ─────────────────────────────────────────
const cardStyle = {
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)',
  border: '1px solid #E2E8F0',
  backgroundColor: '#ffffff',
};

// ─────────────────────────────────────────
// STATUS BADGE (pill with dot)
// ─────────────────────────────────────────
const StatusBadge = ({ active }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      backgroundColor: active ? 'color-mix(in srgb, var(--theme-primary) 12%, white)' : '#FEF2F2',
      color: active ? 'var(--theme-primary)' : '#DC2626',
      fontSize: '0.72rem',
      fontWeight: 700,
      padding: '3px 10px',
      borderRadius: 20,
      border: `1px solid ${active ? '#BBF7D0' : '#FCA5A5'}`,
    }}
  >
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: active ? 'var(--theme-primary)' : '#DC2626',
      }}
    />
    {active ? 'Active' : 'Inactive'}
  </span>
);

// ─────────────────────────────────────────
// INVESTMENT TYPE BADGE
// ─────────────────────────────────────────
const TypeBadge = ({ type }) => {
  const cfg = getTypeConfig(type);
  return (
    <span
      style={{
        display: 'inline-block',
        backgroundColor: cfg.bg,
        color: '#0F172A',
        border: `1px solid ${cfg.border}`,
        borderRadius: 6,
        fontSize: '0.72rem',
        fontWeight: 700,
        padding: '2px 9px',
        letterSpacing: 0.3,
      }}
    >
      {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────
// KPI SUMMARY CARD
// ─────────────────────────────────────────
const SummaryCard = ({ title, value, icon, iconBg, valueColor = '#0F172A', loading }) => (
  <Card style={cardStyle} bodyStyle={{ padding: '20px 24px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          backgroundColor: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginBottom: 4 }}>
          {title}
        </div>
        {loading ? (
          <Skeleton.Input active size="small" style={{ width: 100 }} />
        ) : (
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: valueColor, lineHeight: 1.2 }}>
            {value}
          </div>
        )}
      </div>
    </div>
  </Card>
);

// ─────────────────────────────────────────
// EMPTY ROW for add-row tables
// ─────────────────────────────────────────
const makeEmptyRow = (id) => ({
  id,
  itemType: 'PRODUCT',
  itemName: '',
  productId: undefined,
  quantity: undefined,
  unit: 'NOS',
  rate: undefined,
  mrp: undefined,
  amount: 0,
});

const makeEmptyOverheadRow = (id) => ({
  id,
  expenseName: '',
  amount: undefined,
});

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────
const InvestmentPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermissions();

  const isAddPage = location.pathname === '/investment/new'; // Add Investment opens as a full page
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const queryVendorId = queryParams.get('vendorId');
  const queryAdd = queryParams.get('add');
  const tabParam = queryParams.get('tab');
  const isFromVendorDetails = queryAdd === 'true' && !!queryVendorId;

  const [activeTab, setActiveTab] = useState(tabParam === 'vendors' ? 'vendors' : 'investments');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // ── Investment states ──────────────────
  const [investmentFilters, setInvestmentFilters] = useState({
    fromDate: null,
    toDate: null,
    vendorId: undefined,
    type: undefined,
    search: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [investmentForm] = Form.useForm();
  const [selectedType, setSelectedType] = useState(undefined);
  const [itemRows, setItemRows] = useState([makeEmptyRow(1)]);
  const [overheadRows, setOverheadRows] = useState([makeEmptyOverheadRow(1)]);
  const [subtotal, setSubtotal] = useState(0);
  const [gst, setGst] = useState(0);
  const [gstManual, setGstManual] = useState(false); // true once the user edits GST % by hand
  const [gstRate, setGstRate] = useState(null); // user-overridden GST percent
  const [discount, setDiscount] = useState(0); // rupee amount — source of truth
  const [discountMode, setDiscountMode] = useState('PERCENT'); // PERCENT (%) or AMOUNT (₹)
  const [discountPct, setDiscountPct] = useState(null); // entered % when mode = PERCENT

  // Default GST % from system settings; auto-applied to new PURCHASE invoices.
  const { gstPercent } = useAppSettings();

  // In % mode the rupee discount follows the subtotal automatically.
  useEffect(() => {
    if (discountMode !== 'PERCENT') return;
    setDiscount(Math.round((subtotal * (Number(discountPct) || 0) / 100) * 100) / 100);
  }, [subtotal, discountPct, discountMode]);

  // GST is entered as a percent. Use the user's override % once edited, else the default %.
  // The rupee amount is derived from the subtotal and snapshotted into the invoice on save.
  const effectiveGstRate = gstManual ? (gstRate || 0) : (gstPercent || 0);
  useEffect(() => {
    if (selectedType === 'OVERHEAD') return;
    const auto = Math.round((subtotal * effectiveGstRate / 100) * 100) / 100;
    setGst(auto);
  }, [subtotal, effectiveGstRate, selectedType]);

  // ── Vendor states ──────────────────────
  const [vendorModalVisible, setVendorModalVisible] = useState(false);
  const [vendorForm] = Form.useForm();
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorSearch, setVendorSearch] = useState('');
  // Inline "add new vendor" on the investment page (Purchase type).
  const [vendorSearchText, setVendorSearchText] = useState('');
  const [quickVendorOpen, setQuickVendorOpen] = useState(false);
  const [qv, setQv] = useState({ name: '', mobile: '' });
  const [qvSaving, setQvSaving] = useState(false);

  // ── Open modal from URL params ──────────
  useEffect(() => {
    if (queryAdd === 'true' && queryVendorId) {
      navigate(`/investment/new?vendorId=${queryVendorId}`, { replace: true });
    }
  }, [queryAdd, queryVendorId, navigate]);

  // ── Add-investment page: seed defaults once ──
  useEffect(() => {
    if (!isAddPage) return;
    if (!investmentForm.getFieldValue('purchaseDate')) {
      investmentForm.setFieldsValue({ purchaseDate: dayjs() });
    }
    // Purchase is the default type on the add page.
    if (!investmentForm.getFieldValue('type')) {
      setSelectedType('PURCHASE');
      investmentForm.setFieldsValue({ type: 'PURCHASE' });
    }
    const vid = queryParams.get('vendorId');
    if (vid && !investmentForm.getFieldValue('vendorId')) {
      setSelectedType('PURCHASE');
      investmentForm.setFieldsValue({ type: 'PURCHASE', vendorId: vid });
    }
  }, [isAddPage, investmentForm, queryParams]);

  // ── Queries ────────────────────────────
  const { data: investmentsData, isLoading: invLoading, refetch: refetchInvestments } = useQuery({
    queryKey: ['investments', appliedFilters],
    queryFn: () => investmentService.getInvestments(appliedFilters),
  });

  const { data: vendorsData, isLoading: vendorsLoading, refetch: refetchVendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: vendorService.getVendors,
  });



  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: productService.getProducts,
  });

  // Backend returns these already sorted: latest purchaseDate first, then latest createdAt.
  const investments = investmentsData?.data || [];
  const vendors = vendorsData?.data || [];
  const products = productsData?.data || [];

  // ── Investment detail query (for view drawer) ──
  const { data: investmentDetailData, isLoading: invDetailLoading } = useQuery({
    queryKey: ['investment', selectedInvestment?.id],
    queryFn: () => investmentService.getInvestmentById(selectedInvestment?.id),
    enabled: !!selectedInvestment?.id && viewDrawerVisible,
  });
  const investmentDetail = investmentDetailData?.data || selectedInvestment;

  // ── Payment form state + mutations ─────
  const [payDate, setPayDate] = useState(null);
  const [payMode, setPayMode] = useState('CASH');
  const [payAmount, setPayAmount] = useState(null);

  // Create-time payment fields
  const [createFullPayment, setCreateFullPayment] = useState(false);
  const [createPayAmount, setCreatePayAmount] = useState(null);
  const [createPayMode, setCreatePayMode] = useState('CASH');
  const [showDues, setShowDues] = useState(false); // slide-open the vendor's previous dues

  // Selected vendor's outstanding (for the create-time payment allocation preview).
  const watchedVendorId = Form.useWatch('vendorId', investmentForm);
  const { data: vendorDetailData } = useQuery({
    queryKey: ['vendorForInvestment', watchedVendorId],
    queryFn: () => vendorService.getVendorById(watchedVendorId),
    enabled: !!watchedVendorId && (addModalVisible || isAddPage) && selectedType === 'PURCHASE',
  });
  const vendorUnpaid = useMemo(() => {
    const purchases = vendorDetailData?.data?.purchases || [];
    return purchases
      .filter((p) => Number(p.amountDue) > 0)
      .sort((a, b) => (a.purchaseDate || '').localeCompare(b.purchaseDate || ''));
  }, [vendorDetailData]);
  const vendorOverdue = useMemo(
    () => vendorUnpaid.reduce((s, p) => s + Number(p.amountDue || 0), 0),
    [vendorUnpaid]
  );

  const addPaymentMutation = useMutation({
    mutationFn: ({ id, data }) => investmentService.addPayment(id, data),
    onSuccess: () => {
      notification.success({ message: 'Payment Recorded', placement: 'topRight', duration: 3 });
      queryClient.invalidateQueries({ queryKey: ['investment', selectedInvestment?.id] });
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['vendorPayments'] });
      if (selectedInvestment?.vendorId) {
        queryClient.invalidateQueries({ queryKey: ['vendor', selectedInvestment.vendorId] });
      }
      setPayAmount(null);
      setPayDate(null);
      setPayMode('CASH');
    },
    onError: (err) => {
      notification.error({
        message: 'Payment Failed',
        description: err.response?.data?.message || err.message,
        placement: 'topRight',
        duration: 5,
      });
    },
  });

  const handleAddPayment = () => {
    if (!payAmount || Number(payAmount) <= 0) {
      notification.warning({ message: 'Enter a valid payment amount', placement: 'topRight' });
      return;
    }
    addPaymentMutation.mutate({
      id: selectedInvestment.id,
      data: {
        paymentDate: (payDate || dayjs()).format('YYYY-MM-DD'),
        mode: payMode,
        amount: Number(payAmount),
      },
    });
  };

  const PAYMENT_STATUS_META = {
    PAID: { color: 'success', label: 'Paid', border: '#86EFAC' },
    PARTIALLY_PAID: { color: 'warning', label: 'Partial', border: '#FDE68A' },
    PENDING: { color: 'default', label: 'Unpaid', border: '#FECACA' },
  };

  // ── Summary computations ───────────────
  const totalInvestment = useMemo(
    () => investments.reduce((s, i) => s + (i.grandTotal || 0), 0),
    [investments]
  );
  const currentMonthInvestment = useMemo(
    () =>
      investments
        .filter((i) => i.purchaseDate && dayjs(i.purchaseDate).isSame(dayjs(), 'month'))
        .reduce((s, i) => s + (i.grandTotal || 0), 0),
    [investments]
  );
  const previousMonthInvestment = useMemo(
    () =>
      investments
        .filter((i) =>
          i.purchaseDate && dayjs(i.purchaseDate).isSame(dayjs().subtract(1, 'month'), 'month')
        )
        .reduce((s, i) => s + (i.grandTotal || 0), 0),
    [investments]
  );
  const purchaseTotal = useMemo(
    () =>
      investments
        .filter((i) => i.investmentType === "PURCHASE")
        .reduce((s, i) => s + (i.grandTotal || 0), 0),
    [investments]
  );
  const overheadTotal = useMemo(
    () =>
      investments
        .filter((i) => i.investmentType === "OVERHEAD")
        .reduce((s, i) => s + (i.grandTotal || 0), 0),
    [investments]
  );
  // Total outstanding across the currently listed (filtered) invoices.
  const totalDue = useMemo(
    () =>
      investments.reduce(
        (s, i) => s + Math.max(0, (Number(i.grandTotal) || 0) - (Number(i.amountPaid) || 0)),
        0
      ),
    [investments]
  );

  // ── Vendor summary computations ────────
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((v) => v.active).length;
  const inactiveVendors = vendors.filter((v) => !v.active).length;

  // ── Filtered vendors ───────────────────
  const filteredVendors = useMemo(() => {
    if (!vendorSearch) return vendors;
    const q = vendorSearch.toLowerCase();
    return vendors.filter(
      (v) =>
        v.name?.toLowerCase().includes(q) ||
        v.gstNumber?.toLowerCase().includes(q) ||
        v.mobile?.toLowerCase().includes(q) ||
        v.email?.toLowerCase().includes(q)
    );
  }, [vendors, vendorSearch]);

  // ── Grand total calculation ────────────
  const grandTotal = subtotal + gst - discount;

  // Live oldest-first allocation of the create-time payment: old dues first, then this invoice.
  const payNow = Number(createPayAmount) || 0;
  const paymentAllocation = useMemo(() => {
    let remaining = payNow;
    const rows = [];
    for (const inv of vendorUnpaid) {
      const due = Number(inv.amountDue) || 0;
      const pay = Math.min(remaining, due);
      if (pay > 0) rows.push({ key: inv.id, label: inv.invoiceNumber || 'Invoice', old: true, pay, due });
      remaining -= pay;
    }
    const thisPay = Math.min(remaining, grandTotal);
    if (thisPay > 0) rows.push({ key: 'new', label: 'This invoice', old: false, pay: thisPay, due: grandTotal });
    remaining -= thisPay;
    return { rows, leftover: Math.max(0, remaining) };
  }, [payNow, vendorUnpaid, grandTotal]);

  // Per-due status for the slider: how the entered amount clears oldest dues first.
  const duesWithStatus = useMemo(() => {
    let remaining = payNow;
    return vendorUnpaid.map((inv) => {
      const due = Number(inv.amountDue) || 0;
      const pay = Math.min(remaining, due);
      remaining -= pay;
      const status = due > 0 && pay >= due ? 'cleared' : pay > 0 ? 'partial' : 'pending';
      return { ...inv, due, pay, status };
    });
  }, [vendorUnpaid, payNow]);

  // Max payable now = this invoice + vendor's overdue (just this invoice for overhead).
  const maxPayable = Math.round(selectedType === 'PURCHASE' ? (grandTotal + vendorOverdue) : grandTotal);

  // Keep the entered amount within the outstanding balance if totals change.
  useEffect(() => {
    if (createPayAmount != null && Number(createPayAmount) > maxPayable) {
      setCreatePayAmount(Number(maxPayable.toFixed(2)));
    }
  }, [maxPayable]); // eslint-disable-line react-hooks/exhaustive-deps

  const recalcSubtotal = (rows, type) => {
    if (type === 'OVERHEAD') {
      const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
      setSubtotal(total);
    } else {
      const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
      setSubtotal(total);
    }
  };

  // ── Mutations ──────────────────────────
  const createInvestmentMutation = useMutation({
    mutationFn: investmentService.createInvestment,
    onSuccess: (res, variables) => {
      notification.success({
        message: 'Investment Saved',
        description: res.message || 'Investment created successfully.',
        placement: 'topRight',
        duration: 4,
      });
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      // Refresh the affected vendor's detail (purchase history/totals) whether the
      // vendor came from the URL param or was picked in the form, plus the vendor list.
      const affectedVendorId = variables?.vendorId || queryVendorId;
      if (affectedVendorId) {
        queryClient.invalidateQueries({ queryKey: ['vendor', affectedVendorId] });
      }
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendorForInvestment'] });
      queryClient.invalidateQueries({ queryKey: ['vendorPayments'] });
      handleCloseAddModal();
    },
    onError: (err) => {
      notification.error({
        message: 'Save Failed',
        description: err.response?.data?.message || err.message,
        placement: 'topRight',
        duration: 5,
      });
    },
  });

  const createVendorMutation = useMutation({
    mutationFn: vendorService.createVendor,
    onSuccess: (res) => {
      notification.success({
        message: 'Vendor Saved',
        description: res.message || 'Vendor created successfully.',
        placement: 'topRight',
        duration: 4,
      });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      handleCloseVendorModal();
    },
    onError: (err) => {
      notification.error({
        message: 'Save Failed',
        description: err.response?.data?.message || err.message,
        placement: 'topRight',
        duration: 5,
      });
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: ({ id, data }) => vendorService.updateVendor(id, data),
    onSuccess: (res) => {
      notification.success({
        message: 'Vendor Updated',
        description: res.message || 'Vendor updated successfully.',
        placement: 'topRight',
        duration: 4,
      });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      handleCloseVendorModal();
    },
    onError: (err) => {
      notification.error({
        message: 'Update Failed',
        description: err.response?.data?.message || err.message,
        placement: 'topRight',
        duration: 5,
      });
    },
  });

  const toggleVendorStatusMutation = useMutation({
    mutationFn: ({ id, active }) => vendorService.toggleVendorStatus(id, active),
    onSuccess: (res) => {
      notification.success({
        message: 'Status Updated',
        description: res.message || 'Vendor status updated.',
        placement: 'topRight',
        duration: 3,
      });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
    onError: (err) => {
      notification.error({
        message: 'Update Failed',
        description: err.response?.data?.message || err.message,
        placement: 'topRight',
        duration: 4,
      });
    },
  });

  // ── Investment handlers ────────────────
  const handleApplyFilters = () => {
    const params = {};
    if (investmentFilters.fromDate)
      params.fromDate = investmentFilters.fromDate.format('YYYY-MM-DD');
    if (investmentFilters.toDate)
      params.toDate = investmentFilters.toDate.format('YYYY-MM-DD');
    if (investmentFilters.vendorId) params.vendorId = investmentFilters.vendorId;
    if (investmentFilters.type) params.type = investmentFilters.type;
    if (investmentFilters.search) params.search = investmentFilters.search;
    setAppliedFilters(params);
    setFilterOpen(false);
  };

  const handleResetFilters = () => {
    setInvestmentFilters({ fromDate: null, toDate: null, vendorId: undefined, type: undefined, search: '' });
    setAppliedFilters({});
    setFilterOpen(false);
  };

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  const handleViewInvestment = (record) => {
    setSelectedInvestment(record);
    setViewDrawerVisible(true);
  };

  const handleDownloadInvoice = async () => {
    const inv = investmentDetail;
    if (!inv?.id) return;
    try {
      setDownloadingInvoice(true);
      await investmentService.downloadInvoicePdf(inv.id, inv.invoiceNumber);
    } catch (e) {
      notification.error({
        message: 'Invoice download failed',
        description: e.response?.data?.message || e.message || 'Could not generate the invoice PDF.',
        placement: 'topRight',
      });
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const handleCloseAddModal = () => {
    setAddModalVisible(false);
    if (isAddPage) navigate('/investment');
    investmentForm.resetFields();
    setSelectedType(undefined);
    setItemRows([makeEmptyRow(1)]);
    setOverheadRows([makeEmptyOverheadRow(1)]);
    setSubtotal(0);
    setGst(0);
    setGstManual(false);
    setGstRate(null);
    setDiscount(0);
    setDiscountMode('PERCENT');
    setDiscountPct(null);
    setCreateFullPayment(false);
    setCreatePayAmount(null);
    setCreatePayMode('CASH');
    setShowDues(false);
    if (queryAdd === 'true' && queryVendorId) {
      navigate(`/vendors/${queryVendorId}`, { replace: true });
    }
  };

  // Add Investment now opens as a full page.
  const handleOpenAddInvestment = () => {
    navigate('/investment/new');
  };

  // Open the inline vendor quick-add, prefilling the name from the current search.
  const openQuickVendor = () => {
    setQv({ name: vendorSearchText || '', mobile: '' });
    setQuickVendorOpen(true);
  };

  // Validate quick-add fields: name + a unique 10-digit phone. Returns an error or null.
  const quickVendorError = (name, mobile) => {
    if (!name || !mobile) return 'Vendor name and phone are required.';
    if (!/^\d{10}$/.test(mobile)) return 'Enter a valid 10-digit phone number.';
    if (vendors.some((v) => (v.mobile || '').replace(/\D/g, '') === mobile)) return 'A vendor with this phone number already exists.';
    return null;
  };

  // Create a vendor (active) right from the investment form and select it.
  const saveQuickVendor = async () => {
    const name = qv.name.trim();
    const mobile = qv.mobile.trim();
    const err = quickVendorError(name, mobile);
    if (err) { notification.error({ message: 'Check details', description: err, placement: 'topRight' }); return; }
    try {
      setQvSaving(true);
      const res = await vendorService.createVendor({ name, mobile, active: true });
      const newId = res?.data?.id || res?.id;
      await refetchVendors();
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      if (newId) investmentForm.setFieldsValue({ vendorId: newId });
      setQuickVendorOpen(false);
      notification.success({ message: 'Vendor added', description: `${name} added and selected.`, placement: 'topRight', duration: 3 });
    } catch (e) {
      notification.error({ message: 'Failed', description: e.response?.data?.message || e.message, placement: 'topRight', duration: 5 });
    } finally {
      setQvSaving(false);
    }
  };

  const handleTypeChange = (val) => {
    setSelectedType(val);
    setItemRows([makeEmptyRow(1)]);
    setOverheadRows([makeEmptyOverheadRow(1)]);
    setSubtotal(0);
    setGstManual(false);
    setGstRate(null);
    if (val === 'OVERHEAD') {
      setGst(0);
      setDiscount(0);
      setDiscountMode('PERCENT');
      setDiscountPct(null);
    }
  };

  // ── Item row helpers ───────────────────
  const updateItemRow = (id, field, value) => {
    setItemRows((prev) => {
      const updated = prev.map((row) => {
        if (row.id !== id) return row;
        const newRow = { ...row, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          newRow.amount = (Number(newRow.quantity) || 0) * (Number(newRow.rate) || 0);
        }
        return newRow;
      });
      recalcSubtotal(updated, selectedType);
      return updated;
    });
  };

  const addItemRow = () => {
    setItemRows((prev) => {
      const newRows = [...prev, makeEmptyRow(Date.now())];
      return newRows;
    });
  };

  const removeItemRow = (id) => {
    setItemRows((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      recalcSubtotal(updated, selectedType);
      return updated;
    });
  };

  const updateOverheadRow = (id, field, value) => {
    setOverheadRows((prev) => {
      const updated = prev.map((row) => (row.id === id ? { ...row, [field]: value } : row));
      recalcSubtotal(updated, 'OVERHEAD');
      return updated;
    });
  };

  const addOverheadRow = () => {
    setOverheadRows((prev) => [...prev, makeEmptyOverheadRow(Date.now())]);
  };

  const removeOverheadRow = (id) => {
    setOverheadRows((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      recalcSubtotal(updated, 'OVERHEAD');
      return updated;
    });
  };

  // ── Form validity check ─────────────────
  const isFormValid = useMemo(() => {
    if (!selectedType) return false;
    const formValues = investmentForm.getFieldsValue();
    if (!formValues.type) return false;

    if (selectedType === 'PURCHASE') {
      if (!formValues.vendorId) return false;
      const validItems = itemRows.filter((r) => r.itemName && r.quantity > 0 && r.rate > 0);
      if (validItems.length === 0) return false;
    } else {
      const validExpenses = overheadRows.filter((r) => r.expenseName && (Number(r.amount) || 0) > 0);
      if (validExpenses.length === 0) return false;
    }
    return true;
  }, [selectedType, itemRows, overheadRows, investmentForm]);

  // ── Save Investment ────────────────────
  const handleSaveInvestment = async () => {
    try {
      const values = await investmentForm.validateFields();

      // Selling price (MRP) is required for every product item.
      if (selectedType !== 'OVERHEAD') {
        const missingMrp = itemRows.some((r) => r.itemName && r.itemType === 'PRODUCT' && (r.mrp == null || r.mrp === ''));
        if (missingMrp) {
          notification.error({ message: 'Selling price (MRP) is required for every product item.', placement: 'topRight' });
          return;
        }
      }

      let items = [];

      if (selectedType === 'OVERHEAD') {
        items = overheadRows
          .filter((r) => r.expenseName && (Number(r.amount) || 0) > 0)
          .map((r) => ({
            itemType: 'OVERHEAD',
            itemName: r.expenseName,
            quantity: 1,
            unit: 'NOS',
            rate: Number(r.amount) || 0,
          }));
      } else {
        items = itemRows
          .filter((r) => r.itemName)
          .map((r) => ({
            itemType: r.itemType || 'MATERIAL',
            itemName: r.itemName,
            quantity: Number(r.quantity) || 0,
            unit: r.unit || 'PIECE',
            rate: Number(r.rate) || 0,
            // MRP (selling price) for products only; blank → product's default price is used.
            sellingPrice: (r.itemType === 'PRODUCT' && r.mrp != null && r.mrp !== '')
              ? Number(r.mrp) : undefined,
          }));
      }

      const computedGrandTotal = selectedType === 'OVERHEAD'
        ? subtotal
        : subtotal + gst - discount;

      const payload = {
        ...(selectedType === 'PURCHASE' ? { vendorId: values.vendorId } : {}),
        investmentType: values.type,
        purchaseDate: values.purchaseDate ? values.purchaseDate.format('YYYY-MM-DD') : undefined,
        invoiceNumber: values.invoiceNumber || undefined,
        items,
        subtotal,
        ...(selectedType === 'PURCHASE' ? {
          gstAmount: gst,
          discountAmount: discount,
        } : {}),
        grandTotal: computedGrandTotal,
        // Optional payment captured at creation (allocated oldest-dues-first on the backend).
        fullPayment: false,
        paymentAmount: createPayAmount ? Number(createPayAmount) : undefined,
        paymentMode: createPayMode,
        // Payment is recorded as of today by the backend.
      };

      createInvestmentMutation.mutate(payload);
    } catch (_) {
      // validation error — Ant Design shows field errors automatically
    }
  };

  // ── Vendor handlers ────────────────────
  const handleOpenAddVendor = () => {
    setSelectedVendor(null);
    vendorForm.resetFields();
    vendorForm.setFieldsValue({ active: true });
    setVendorModalVisible(true);
  };

  const handleOpenEditVendor = (vendor) => {
    setSelectedVendor(vendor);
    vendorForm.setFieldsValue({
      name: vendor.name,
      gstNumber: vendor.gstNumber,
      mobile: vendor.mobile,
      email: vendor.email,
      address: vendor.address,
      active: vendor.active,
    });
    setVendorModalVisible(true);
  };

  const handleCloseVendorModal = () => {
    setVendorModalVisible(false);
    setSelectedVendor(null);
    vendorForm.resetFields();
  };

  const handleSaveVendor = async () => {
    try {
      const values = await vendorForm.validateFields();
      if (selectedVendor) {
        updateVendorMutation.mutate({ id: selectedVendor.id, data: values });
      } else {
        createVendorMutation.mutate(values);
      }
    } catch (_) { }
  };

  const handleOpenVendorDrawer = (vendor) => {
    navigate(`/vendors/${vendor.id}`);
  };

  // ── Investment Table Columns ───────────
  const investmentColumns = [
    {
      title: '#',
      key: 'index',
      width: 44,
      render: (_, __, i) => (
        <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.8rem' }}>{i + 1}</span>
      ),
    },
    {
      title: 'Invoice No',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (val) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1E293B', fontSize: '0.85rem' }}>
          {val || '—'}
        </span>
      ),
    },
    {
      title: 'Vendor',
      dataIndex: 'vendorName',
      key: 'vendorName',
      render: (val, record) => (
        record.vendorId ? (
          <a onClick={() => navigate(`/vendors/${record.vendorId}`)} style={{ fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}>
            {val || '—'}
          </a>
        ) : (
          <span style={{ fontWeight: 600, color: '#0F172A' }}>{val || '—'}</span>
        )
      ),
    },
    {
      title: 'Type',
      dataIndex: 'investmentType',
      key: 'investmentType',
      render: (val) => <TypeBadge type={val} />,
    },
    {
      title: 'Purchase Date',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      render: (val) => (
        <span style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 500 }}>
          {val ? dayjs(val).format('DD-MMM-YYYY') : '—'}
        </span>
      ),
      sorter: (a, b) => (a.purchaseDate || '').localeCompare(b.purchaseDate || ''),
    },
    {
      title: 'Items',
      dataIndex: 'itemCount',
      key: 'itemCount',
      align: 'center',
      render: (val) => (
        <span
          style={{
            backgroundColor: '#F1F5F9',
            color: '#475569',
            fontWeight: 700,
            fontSize: '0.8rem',
            padding: '2px 10px',
            borderRadius: 20,
          }}
        >
          {val ?? (Array.isArray(val) ? val.length : '—')}
        </span>
      ),
    },
    {
      title: 'Grand Total',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      render: (val) => (
        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>
          {getCurrencySymbol()}{Number(val || 0).toLocaleString('en-IN')}
        </span>
      ),
      sorter: (a, b) => (a.grandTotal || 0) - (b.grandTotal || 0),
    },
    {
      title: 'Payment',
      key: 'paymentStatus',
      align: 'center',
      render: (_, record) => {
        const meta = PAYMENT_STATUS_META[record.paymentStatus] || PAYMENT_STATUS_META.PENDING;
        const paid = Number(record.amountPaid || 0);
        const total = Number(record.grandTotal || 0);
        return (
          <Tooltip title={`Paid ${getCurrencySymbol()}${paid.toLocaleString('en-IN')} of ${getCurrencySymbol()}${total.toLocaleString('en-IN')}`}>
            <Tag style={{
              color: '#0F172A',
              background: 'color-mix(in srgb, var(--theme-primary) 10%, white)',
              border: `1px solid ${meta.border}`,
              fontWeight: 700, borderRadius: 6,
            }}>{meta.label}</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 96,
      align: 'left',
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="View Details" placement="top">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewInvestment(record)}
              style={{
                color: 'var(--theme-primary)',
                backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
                border: '1px solid #BFDBFE',
                borderRadius: 6,
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </Tooltip>
          {record.investmentType !== 'OVERHEAD' && (
            <Tooltip title="Download Invoice PDF" placement="top">
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => investmentService.downloadInvoicePdf(record.id, record.invoiceNumber).catch((e) =>
                  notification.error({
                    message: 'Invoice download failed',
                    description: e.response?.data?.message || e.message || 'Could not generate the invoice PDF.',
                    placement: 'topRight',
                  })
                )}
                style={{
                  color: 'var(--theme-primary)',
                  backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
                  border: '1px solid #FDE68A',
                  borderRadius: 6,
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // ── Vendor Table Columns ───────────────
  const vendorColumns = [
    {
      title: '#',
      key: 'index',
      width: 44,
      render: (_, __, i) => (
        <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.8rem' }}>{i + 1}</span>
      ),
    },
    {
      title: 'Vendor Name',
      dataIndex: 'name',
      key: 'name',
      render: (val) => <span style={{ fontWeight: 700, color: '#0F172A' }}>{val}</span>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'GST Number',
      dataIndex: 'gstNumber',
      key: 'gstNumber',
      render: (val) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#475569', fontSize: '0.83rem' }}>
          {val || '—'}
        </span>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'mobile',
      key: 'mobile',
      render: (val) => (
        <span style={{ color: '#0F172A', fontWeight: 500 }}>{val || '—'}</span>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (val) =>
        val ? (
          <a
            href={`mailto:${val}`}
            style={{ color: 'var(--theme-primary)', fontWeight: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            {val}
          </a>
        ) : (
          <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.85rem' }}>Not Provided</span>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (val) => <StatusBadge active={val} />,
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.active === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      render: (_, record) => (
        <Space size={6}>
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleOpenVendorDrawer(record)}
              style={{
                color: 'var(--theme-primary)',
                backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
                border: '1px solid #BFDBFE',
                borderRadius: 6,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </Tooltip>
          {can('investment', 'write') && (
          <Tooltip title="Edit Vendor">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEditVendor(record)}
              style={{
                color: 'var(--theme-primary)',
                backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
                border: '1px solid #DDD6FE',
                borderRadius: 6,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </Tooltip>
          )}
          {can('investment', 'write') && (record.active ? (
            <Tooltip title="Deactivate">
              <Button
                type="text"
                size="small"
                icon={<StopOutlined />}
                onClick={() => toggleVendorStatusMutation.mutate({ id: record.id, active: false })}
                loading={toggleVendorStatusMutation.isPending}
                style={{
                  color: '#EA580C',
                  backgroundColor: '#FFF7ED',
                  border: '1px solid #FED7AA',
                  borderRadius: 6,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Activate">
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => toggleVendorStatusMutation.mutate({ id: record.id, active: true })}
                loading={toggleVendorStatusMutation.isPending}
                style={{
                  color: 'var(--theme-primary)',
                  backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
                  border: '1px solid #BBF7D0',
                  borderRadius: 6,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </Tooltip>
          ))}
        </Space>
      ),
    },
  ];

  // ── Item rows columns (for Add Investment modal) ──
  const purchaseItemColumns = [
    {
      title: 'S.No',
      width: 48,
      render: (_, __, i) => (
        <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.78rem' }}>{i + 1}</span>
      ),
    },
    {
      title: 'Item Type',
      width: 110,
      render: (_, record) => (
        <Select
          value={record.itemType}
          onChange={(val) => updateItemRow(record.id, 'itemType', val)}
          style={{ width: '100%' }}
          size="small"
          variant="borderless"
        >
          {ITEM_TYPES.map((t) => (
            <Option key={t.value} value={t.value}>{t.label}</Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Item Name',
      width: 150,
      render: (_, record) => (
        <Input
          placeholder="Item name"
          value={record.itemName}
          onChange={(e) => updateItemRow(record.id, 'itemName', e.target.value)}
          style={{ fontSize: '0.82rem' }}
          size="small"
          variant="borderless"
        />
      ),
    },
    {
      title: 'Qty',
      width: 80,
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.quantity}
          onChange={(val) => updateItemRow(record.id, 'quantity', val)}
          placeholder="0"
          controls={false}
          style={{ width: '100%', fontSize: '0.82rem' }}
          size="small"
          variant="borderless"
        />
      ),
    },
    {
      title: 'Unit',
      width: 100,
      render: (_, record) => (
        <Select
          value={record.unit}
          onChange={(val) => updateItemRow(record.id, 'unit', val)}
          style={{ width: '100%' }}
          size="small"
          variant="borderless"
        >
          {UNIT_OPTIONS.map((u) => (
            <Option key={u.key} value={u.key}>{u.label}</Option>
          ))}
        </Select>
      ),
    },
    {
      title: `Rate (${getCurrencySymbol()})`,
      width: 100,
      render: (_, record) => (
        <InputNumber
          min={0}
          precision={2}
          value={record.rate}
          onChange={(val) => updateItemRow(record.id, 'rate', val)}
          placeholder="0"
          controls={false}
          style={{ width: '100%', fontSize: '0.82rem' }}
          size="small"
          variant="borderless"
        />
      ),
    },
    {
      title: (
        <Tooltip title="Selling price (MRP) for this stock — required for every product.">
          <span>MRP ({getCurrencySymbol()}) <span style={{ color: '#DC2626' }}>*</span></span>
        </Tooltip>
      ),
      width: 110,
      render: (_, record) =>
        record.itemType === 'PRODUCT' ? (
          <InputNumber
            min={0}
            precision={2}
            value={record.mrp}
            onChange={(val) => updateItemRow(record.id, 'mrp', val)}
            placeholder="0"
            controls={false}
            style={{ width: '100%', fontSize: '0.82rem' }}
            size="small"
            variant="borderless"
          />
        ) : (
          <span style={{ color: '#CBD5E1', fontSize: '0.8rem' }}>—</span>
        ),
    },
    {
      title: `Amount (${getCurrencySymbol()})`,
      width: 100,
      render: (_, record) => (
        <span style={{ fontWeight: 700, color: 'var(--theme-primary)', fontSize: '0.85rem' }}>
          {Number(record.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: '',
      width: 40,
      render: (_, record) =>
        itemRows.length > 1 ? (
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => removeItemRow(record.id)}
            style={{ color: '#EF4444' }}
          />
        ) : null,
    },
  ];

  const overheadItemColumns = [
    {
      title: 'S.No',
      width: 48,
      render: (_, __, i) => (
        <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.78rem' }}>{i + 1}</span>
      ),
    },
    {
      title: 'Expense Name',
      width: 150,
      render: (_, record) => (
        <Input
          placeholder="Expense name"
          value={record.expenseName}
          onChange={(e) => updateOverheadRow(record.id, 'expenseName', e.target.value)}
          style={{ fontSize: '0.82rem' }}
          size="small"
          variant="borderless"
        />
      ),
    },
    {
      title: `Amount (${getCurrencySymbol()})`,
      width: 150,
      render: (_, record) => (
        <InputNumber
          min={0}
          precision={2}
          value={record.amount}
          onChange={(val) => updateOverheadRow(record.id, 'amount', val)}
          placeholder="0"
          controls={false}
          style={{ width: '100%', fontSize: '0.82rem' }}
          size="small"
          variant="borderless"
        />
      ),
    },
    {
      title: '',
      width: 40,
      render: (_, record) =>
        overheadRows.length > 1 ? (
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => removeOverheadRow(record.id)}
            style={{ color: '#EF4444' }}
          />
        ) : null,
    },
  ];

  // ── View Drawer Items Table ────────────
  const drawerItemColumns = [
    {
      title: "Item",
      dataIndex: "itemName",
      key: "itemName",
      render: (v, r) => v || r.expenseName || "—",
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      width: 70,
      render: (v) => v ?? "—",
    },
    {
      title: "Unit",
      dataIndex: "unit",
      key: "unit",
      width: 70,
      render: (v) => v || "—",
    },
    {
      title: "Rate",
      dataIndex: "rate",
      key: "rate",
      width: 90,
      render: (v) =>
        v != null ? `${getCurrencySymbol()}${Number(v).toLocaleString("en-IN")}` : "—",
    },
    {
      title: "Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 110,
      render: (v) => (
        <span style={{ fontWeight: 700, color: "var(--theme-primary)" }}>
          {getCurrencySymbol()}{Number(v || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
  ];

  // ── Vendor recent investments columns ──
  const recentInvColumns = [
    {
      title: 'Reference',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber',
      render: (v) => <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{v || '—'}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      render: (v) => (v ? dayjs(v).format('DD-MMM-YYYY') : '—'),
    },
    {
      title: 'Amount',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      render: (v) => (
        <span style={{ fontWeight: 700, color: 'var(--theme-primary)' }}>
          {getCurrencySymbol()}{Number(v || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  // ── Tab style helper ───────────────────
  const tabStyle = (tab) => ({
    padding: '14px 28px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: activeTab === tab ? 700 : 500,
    color: activeTab === tab ? 'var(--theme-primary)' : '#64748B',
    borderBottom: activeTab === tab ? '2px solid var(--theme-primary)' : '2px solid transparent',
    transition: 'all 0.2s ease',
    userSelect: 'none',
  });

  const inlineInputStyle = {
    borderRadius: 8,
    height: 36,
    fontSize: '0.85rem',
  };

  const labelStyle = {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#64748B',
    marginBottom: 4,
    display: 'block',
  };

  // Bill-style rows for the totals / payment summary (right column).
  const billRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0', fontSize: '0.86rem' };
  const billLabel = { color: '#64748B', fontWeight: 500 };
  const billValue = { color: '#0F172A', fontWeight: 600, fontVariantNumeric: 'tabular-nums' };
  const billDivider = { borderTop: '1px dashed #CBD5E1', margin: '8px 0' };

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <ConfigProvider
      theme={{
        token: {
                    borderRadius: 8,
          fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        },
        components: {
          Form: {
            itemMarginBottom: 12,
          },
        },
      }}
    >
      {!isAddPage && (
      <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '4px 0' }}>

        {/* ── Page Header ── */}
        {/* <div>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: '#0F172A' }}>
            Investment &amp; Vendor
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage raw material purchases, purchased products and business expenses.
          </Typography>
        </div> */}

        {/* ── Tabs ── */}
        <Card style={{ ...cardStyle, padding: 0, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
          {/* Tab Bar */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#FAFAFA',
              borderRadius: '12px 12px 0 0',
            }}
          >
            <div style={tabStyle('investments')} onClick={() => setActiveTab('investments')}>
              Investments
            </div>
            <div style={tabStyle('vendors')} onClick={() => setActiveTab('vendors')}>
              Vendors
            </div>
          </div>

          {/* ════════════════════════════════════
              INVESTMENTS TAB
          ════════════════════════════════════ */}
          {activeTab === 'investments' && (
            <div style={{ padding: '24px' }}>

              {/* Header Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: 24,
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
                    Investment
                    <HeadingInfo text="Manage raw material purchases, purchased products and business expenses." />
                  </div>
                </div>
                <Space size={10}>
                  <Popover
                    trigger="click"
                    placement="bottomRight"
                    open={filterOpen}
                    onOpenChange={setFilterOpen}
                    content={
                      <div style={{ width: 260 }}>
                        <span style={labelStyle}>Date From</span>
                        <DatePicker
                          value={investmentFilters.fromDate}
                          onChange={(d) => setInvestmentFilters((p) => ({ ...p, fromDate: d }))}
                          format="DD-MM-YYYY"
                          style={{ ...inlineInputStyle, width: '100%', marginBottom: 12 }}
                          placeholder="dd-mm-yyyy"
                        />
                        <span style={labelStyle}>Date To</span>
                        <DatePicker
                          value={investmentFilters.toDate}
                          onChange={(d) => setInvestmentFilters((p) => ({ ...p, toDate: d }))}
                          format="DD-MM-YYYY"
                          style={{ ...inlineInputStyle, width: '100%', marginBottom: 12 }}
                          placeholder="dd-mm-yyyy"
                        />
                        <span style={labelStyle}>Vendor</span>
                        <Select
                          value={investmentFilters.vendorId}
                          onChange={(v) => setInvestmentFilters((p) => ({ ...p, vendorId: v }))}
                          placeholder="All Vendors"
                          allowClear
                          style={{ width: '100%', marginBottom: 12 }}
                        >
                          {vendors.map((v) => (
                            <Option key={v.id} value={v.id}>{v.name}</Option>
                          ))}
                        </Select>
                        <span style={labelStyle}>Investment Type</span>
                        <Select
                          value={investmentFilters.type}
                          onChange={(v) => setInvestmentFilters((p) => ({ ...p, type: v }))}
                          placeholder="All Types"
                          allowClear
                          style={{ width: '100%', marginBottom: 12 }}
                        >
                          {INVESTMENT_TYPES.map((t) => (
                            <Option key={t.value} value={t.value}>{t.label}</Option>
                          ))}
                        </Select>
                        <span style={labelStyle}>Search</span>
                        <Input
                          value={investmentFilters.search}
                          onChange={(e) => setInvestmentFilters((p) => ({ ...p, search: e.target.value }))}
                          placeholder="Invoice number …"
                          prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                          style={{ ...inlineInputStyle, width: '100%', marginBottom: 16 }}
                          allowClear
                          onPressEnter={handleApplyFilters}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <Button onClick={handleResetFilters} icon={<ReloadOutlined />} style={{ borderRadius: 8 }}>
                            Reset
                          </Button>
                          <Button type="primary" onClick={handleApplyFilters} icon={<SearchOutlined />} style={{ borderRadius: 8 }}>
                            Search
                          </Button>
                        </div>
                      </div>
                    }
                  >
                    <Badge count={activeFilterCount} size="small">
                      <Button icon={<FilterOutlined />} style={{ borderRadius: 8, fontWeight: 600, height: 38 }}>
                        Filters
                      </Button>
                    </Badge>
                  </Popover>
                  {can('investment', 'write') && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenAddInvestment}
                    style={{
                      borderRadius: 8,
                      fontWeight: 700,
                      height: 38,
                      paddingInline: 18,
                      boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                    }}
                  >
                    Add Investment
                  </Button>
                  )}
                </Space>
              </div>

              {/* Summary Row */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: 24,
                  color: '#334155',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                }}
              >
                <span>
                  <span style={{ color: 'var(--theme-primary)' }}>Current Month:</span>
                  <span style={{ marginLeft: 6, color: 'var(--theme-primary)' }}>{getCurrencySymbol()}{currentMonthInvestment.toLocaleString('en-IN')}</span>
                  <span
                    style={{
                      marginLeft: 10,
                      fontSize: '0.82rem',
                      color: currentMonthInvestment >= previousMonthInvestment ? 'var(--theme-primary)' : '#DC2626',
                      fontWeight: 700,
                    }}
                  >
                    {previousMonthInvestment === 0
                      ? currentMonthInvestment === 0
                        ? '0%'
                        : 'New'
                      : `${currentMonthInvestment >= previousMonthInvestment ? '+' : ''}${(
                          ((currentMonthInvestment - previousMonthInvestment) / previousMonthInvestment) * 100
                        ).toFixed(1)}%`}
                  </span>
                </span>
                <span style={{ color: '#CBD5E1' }}>|</span>
                <span>
                  <span style={{ color: 'var(--theme-primary)' }}>Total Investment:</span>
                  <span style={{ marginLeft: 6, color: 'var(--theme-primary)' }}>{getCurrencySymbol()}{totalInvestment.toLocaleString('en-IN')}</span>
                </span>
                <span style={{ color: '#CBD5E1' }}>|</span>
                <span>
                  <span style={{ color: 'var(--theme-primary)' }}>Purchase:</span>
                  <span style={{ marginLeft: 6, color: 'var(--theme-primary)' }}>{getCurrencySymbol()}{purchaseTotal.toLocaleString('en-IN')}</span>
                </span>
                <span style={{ color: '#CBD5E1' }}>|</span>
                <span>
                  <span style={{ color: 'var(--theme-primary)' }}>Overhead:</span>
                  <span style={{ marginLeft: 6, color: 'var(--theme-primary)' }}>{getCurrencySymbol()}{overheadTotal.toLocaleString('en-IN')}</span>
                </span>
                <span style={{ color: '#CBD5E1' }}>|</span>
                <span>
                  <span style={{ color: '#B91C1C' }}>Due:</span>
                  <span style={{ marginLeft: 6, color: '#DC2626' }}>{getCurrencySymbol()}{totalDue.toLocaleString('en-IN')}</span>
                </span>
              </div>

              {/* Investments Table — flush to the outer card (cancels the 24px wrapper padding) */}
              <Card style={{ ...cardStyle, borderRadius: 0, border: 'none', boxShadow: 'none', margin: '0 -24px -24px -24px' }} styles={{ body: { padding: 0 } }}>
                <Table
                  className="custom-table"
                  size="small"
                  rowKey="id"
                  dataSource={investments.map((i) => ({ ...i, key: i.id }))}
                  columns={investmentColumns}
                  loading={invLoading}
                  pagination={{
                    defaultPageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '25', '50'],
                    showTotal: (total, range) =>
                      `Showing ${range[0]} to ${range[1]} of ${total} entries`,
                    style: { margin: '12px 20px' },
                  }}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <div style={{ padding: '16px 0' }}>
                            <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                              No Investments Found
                            </div>
                            <div style={{ color: '#94A3B8', fontSize: '0.83rem' }}>
                              Click &quot;Add Investment&quot; to record your first investment.
                            </div>
                          </div>
                        }
                      />
                    ),
                  }}
                  style={{ borderRadius: 0, overflow: 'hidden' }}
                  sticky
                />
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════
              VENDORS TAB
          ════════════════════════════════════ */}
          {activeTab === 'vendors' && (
            <div style={{ padding: '24px' }}>

              {/* Compact Header Row: title + inline counts + search + add */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
                    Vendor Management
                    <HeadingInfo text="Manage suppliers and vendor information." />
                  </div>
                  <div style={{ marginTop: 4, fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span><span style={{ color: 'var(--theme-primary)' }}>Total:</span> {totalVendors}</span>
                    <span style={{ color: '#CBD5E1' }}>|</span>
                    <span><span style={{ color: 'var(--theme-primary)' }}>Active:</span> {activeVendors}</span>
                    <span style={{ color: '#CBD5E1' }}>|</span>
                    <span><span style={{ color: '#DC2626' }}>Inactive:</span> {inactiveVendors}</span>
                  </div>
                </div>
                <Space size={10} wrap>
                  <Input
                    placeholder="Search by name, GST, phone, email…"
                    prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    allowClear
                    style={{ width: 300, borderRadius: 8, height: 38 }}
                  />
                  {can('investment', 'write') && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenAddVendor}
                    style={{
                      borderRadius: 8,
                      fontWeight: 700,
                      height: 38,
                      paddingInline: 18,
                      boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                    }}
                  >
                    Add Vendor
                  </Button>
                  )}
                </Space>
              </div>

              {/* Vendors Table — flush to the outer card (cancels the 24px wrapper padding) */}
              <Card style={{ ...cardStyle, borderRadius: 0, border: 'none', boxShadow: 'none', margin: '0 -24px -24px -24px' }} styles={{ body: { padding: 0 } }}>
                <Table
                  className="custom-table"
                  size="small"
                  rowKey="id"
                  dataSource={filteredVendors.map((v) => ({ ...v, key: v.id }))}
                  columns={vendorColumns}
                  loading={vendorsLoading}
                  pagination={{
                    defaultPageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '25', '50'],
                    showTotal: (total, range) =>
                      `Showing ${range[0]} to ${range[1]} of ${total} entries`,
                    style: { margin: '12px 20px' },
                  }}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <div style={{ padding: '16px 0' }}>
                            <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                              No Vendors Found
                            </div>
                            <div style={{ color: '#94A3B8', fontSize: '0.83rem' }}>
                              Click &quot;Add Vendor&quot; to register your first vendor.
                            </div>
                          </div>
                        }
                      />
                    ),
                  }}
                  style={{ borderRadius: 0, overflow: 'hidden' }}
                  sticky
                />
              </Card>
            </div>
          )}
        </Card>
      </Box>

      {/* ════════════════════════════════════
          VIEW INVESTMENT DRAWER
      ════════════════════════════════════ */}
      <Drawer
        title={
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '1rem',
              fontWeight: 800,
              color: '#0F172A',
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileTextOutlined style={{ color: 'var(--theme-primary)', fontSize: '0.95rem' }} />
            </div>
            Investment Details
          </span>
        }
        placement="right"
        width={580}
        onClose={() => { setViewDrawerVisible(false); setSelectedInvestment(null); }}
        open={viewDrawerVisible}
        bodyStyle={{ backgroundColor: '#F8FAFC', padding: 24 }}
        extra={
          investmentDetail && investmentDetail.investmentType !== 'OVERHEAD' ? (
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={downloadingInvoice}
              onClick={handleDownloadInvoice}
            >
              Invoice PDF
            </Button>
          ) : null
        }
      >
        {invDetailLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : investmentDetail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Info Card */}
            <Card style={{ borderRadius: 10, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '18px 20px' }}>
              <Row gutter={[16, 16]}>
                {[
                  { label: 'Invoice Number', value: investmentDetail.invoiceNumber || '—' },
                  {
                    label: 'Vendor',
                    value: investmentDetail.vendorId ? (
                      <a
                        onClick={() => navigate(`/vendors/${investmentDetail.vendorId}`)}
                        style={{ color: 'var(--theme-primary)', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {investmentDetail.vendorName || '—'}
                      </a>
                    ) : (investmentDetail.vendorName || '—'),
                  },
                  {
                    label: 'Purchase Date',
                    value: investmentDetail.purchaseDate
                      ? dayjs(investmentDetail.purchaseDate).format('DD-MMM-YYYY')
                      : '—',
                  },
                  {
                    label: 'Type',
                    value: <TypeBadge type={investmentDetail.investmentType} />,
                  },
                ].map(({ label, value }) => (
                  <Col xs={12} key={label}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0F172A' }}>
                      {value}
                    </div>
                  </Col>
                ))}
                {investmentDetail.remarks && (
                  <Col xs={24}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                      Remarks
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                      {investmentDetail.remarks}
                    </div>
                  </Col>
                )}
              </Row>
            </Card>

            <Divider style={{ margin: '4px 0', borderColor: '#E2E8F0' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Items</span>
            </Divider>

            {/* Items Table */}
            <Card style={{ borderRadius: 10, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: 0 }}>
              <Table
                dataSource={(investmentDetail.items || []).map((it, idx) => ({ ...it, key: idx }))}
                columns={drawerItemColumns}
                pagination={false}
                size="small"
                style={{ borderRadius: 10, overflow: 'hidden' }}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No items" /> }}
              />
            </Card>

            <Divider style={{ margin: '4px 0', borderColor: '#E2E8F0' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Summary</span>
            </Divider>

            {/* Totals Card */}
            <Card style={{ borderRadius: 10, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '16px 20px' }}>
              {[
                { label: 'Subtotal', value: investmentDetail.subtotal, color: '#0F172A' },
                { label: 'GST', value: investmentDetail.gst, color: '#0F172A' },
                { label: 'Discount', value: investmentDetail.discount, color: '#DC2626', prefix: '− ' },
              ].map(({ label, value, color, prefix }) => (
                <div
                  key={label}
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.88rem' }}
                >
                  <span style={{ color: '#64748B', fontWeight: 500 }}>{label}</span>
                  <span style={{ color, fontWeight: 600 }}>
                    {prefix || ''}{getCurrencySymbol()}{Number(value || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              <Divider style={{ margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>Grand Total</span>
                <span style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--theme-primary)' }}>
                  {getCurrencySymbol()}{Number(investmentDetail.grandTotal || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </Card>

            <Divider style={{ margin: '4px 0', borderColor: '#E2E8F0' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Payments</span>
            </Divider>

            {/* Payment summary + add form + history */}
            <Card style={{ borderRadius: 10, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '16px 20px' }}>
              {/* Summary row */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{ flex: '1 1 120px', background: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid #BBF7D0', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700 }}>Paid</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--theme-primary)' }}>{getCurrencySymbol()}{Number(investmentDetail.amountPaid || 0).toLocaleString('en-IN')}</div>
                </div>
                <div style={{ flex: '1 1 120px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#991B1B', fontWeight: 700 }}>Due</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#DC2626' }}>{getCurrencySymbol()}{Number(investmentDetail.amountDue ?? ((investmentDetail.grandTotal || 0) - (investmentDetail.amountPaid || 0))).toLocaleString('en-IN')}</div>
                </div>
                <div style={{ flex: '1 1 120px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700 }}>Status</div>
                  <Tag color={(PAYMENT_STATUS_META[investmentDetail.paymentStatus] || PAYMENT_STATUS_META.PENDING).color} style={{ marginTop: 4, fontWeight: 700 }}>
                    {(PAYMENT_STATUS_META[investmentDetail.paymentStatus] || PAYMENT_STATUS_META.PENDING).label}
                  </Tag>
                </div>
              </div>

              {/* Add payment form (hidden once fully paid) */}
              {investmentDetail.paymentStatus !== 'PAID' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px dashed #E2E8F0' }}>
                  <InputNumber
                    value={payAmount}
                    onChange={setPayAmount}
                    min={0}
                    placeholder="Amount"
                    prefix={getCurrencySymbol()}
                    style={{ width: 130 }}
                  />
                  <Select value={payMode} onChange={setPayMode} style={{ width: 130 }}>
                    <Option value="CASH">Cash</Option>
                    <Option value="UPI">UPI</Option>
                    <Option value="CREDIT_CARD">Credit Card</Option>
                    <Option value="DEBIT_CARD">Debit Card</Option>
                    <Option value="NET_BANKING">Net Banking</Option>
                  </Select>
                  <DatePicker
                    value={payDate || dayjs()}
                    onChange={setPayDate}
                    format="DD-MMM-YYYY"
                    allowClear={false}
                    placeholder="Payment date"
                    style={{ width: 150 }}
                    disabledDate={(d) =>
                      d && (
                        d.isAfter(dayjs(), 'day') ||
                        (investmentDetail.purchaseDate && d.isBefore(dayjs(investmentDetail.purchaseDate), 'day'))
                      )
                    }
                  />
                  <Button type="primary" icon={<PlusOutlined />} loading={addPaymentMutation.isPending} onClick={handleAddPayment} style={{ borderRadius: 8 }}>
                    Add
                  </Button>
                </div>
              )}

              {/* Payment history */}
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: 8 }}>Payment History</div>
              {(investmentDetail.payments && investmentDetail.payments.length > 0) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {investmentDetail.payments.map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.85rem' }}>{dayjs(p.paymentDate).format('DD-MMM-YYYY')}</span>
                        <Tag style={{ borderRadius: 6 }}>{p.mode}</Tag>
                      </div>
                      <span style={{ fontWeight: 800, color: 'var(--theme-primary)' }}>{getCurrencySymbol()}{Number(p.amount).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#94A3B8', fontSize: '0.83rem', padding: '8px 0' }}>No payments recorded yet.</div>
              )}
            </Card>
          </div>
        ) : (
          <Empty description="No details available" />
        )}
      </Drawer>
        </>
        )}

      {/* ════════════════════════════════════
          ADD INVESTMENT — FULL PAGE
      ════════════════════════════════════ */}
      {isAddPage && (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <Button onClick={handleCloseAddModal} icon={<ArrowLeftOutlined />} style={{ borderRadius: 8, fontWeight: 600 }}>Back</Button>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WalletOutlined style={{ color: 'var(--theme-primary)', fontSize: '1rem' }} />
            </div>
            Add New Investment
          </span>
        </div>
        <Form
          form={investmentForm}
          layout="vertical"
          requiredMark={false}
          autoComplete="off"
        >
          {/* Two columns: left = type + items, right = totals + payment */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* ── LEFT: Investment Type + Purchase Items ── */}
          <Box sx={{ flex: '1 1 460px', minWidth: 0 }}>
          {/* Section 1: Header Fields */}
          <Card
            style={{ borderRadius: 10, border: '1px solid #E2E8F0', marginBottom: 12 }}
            bodyStyle={{ padding: '12px 16px' }}
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  name="type"
                  label={<span style={{ fontWeight: 700, color: '#374151' }}>Investment Type *</span>}
                  rules={[{ required: true, message: 'Please select a type.' }]}
                >
                  <Select
                    placeholder="Select Type"
                    style={{ borderRadius: 8 }}
                    size="middle"
                    onChange={handleTypeChange}
                    disabled={isFromVendorDetails}
                  >
                    {INVESTMENT_TYPES.map((t) => (
                      <Option key={t.value} value={t.value}>
                        <TypeBadge type={t.value} />
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              {/* Vendor — only for PURCHASE */}
              {selectedType === 'PURCHASE' && (
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item
                    name="vendorId"
                    label={<span style={{ fontWeight: 700, color: '#374151' }}>Vendor *</span>}
                    rules={[{ required: true, message: 'Please select a vendor.' }]}
                  >
                    <Select
                      placeholder="Select or search vendor"
                      style={{ borderRadius: 8 }}
                      size="middle"
                      showSearch
                      optionFilterProp="children"
                      onSearch={setVendorSearchText}
                      disabled={isFromVendorDetails}
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          <Divider style={{ margin: '6px 0' }} />
                          <div style={{ padding: '2px 8px 6px' }}>
                            <Button
                              type="link"
                              icon={<PlusOutlined />}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={openQuickVendor}
                              style={{ padding: 0, fontWeight: 600 }}
                            >
                              Add {vendorSearchText ? `"${vendorSearchText}"` : 'new vendor'}
                            </Button>
                          </div>
                        </>
                      )}
                    >
                      {vendors.map((v) => (
                        <Option key={v.id} value={v.id}>{v.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              )}
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  name="purchaseDate"
                  label={<span style={{ fontWeight: 700, color: '#374151' }}>Purchase Date *</span>}
                  rules={[{ required: true, message: 'Please select a date.' }]}
                >
                  <DatePicker
                    format="DD-MM-YYYY"
                    style={{ width: '100%', borderRadius: 8 }}
                    size="middle"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  name="invoiceNumber"
                  label={<span style={{ fontWeight: 700, color: '#374151' }}>Invoice Number</span>}
                >
                  <Input placeholder="Auto Generated if left blank" style={{ borderRadius: 8 }} size="middle" />
                </Form.Item>
              </Col>
              {/* GST / Discount / Other — only for PURCHASE */}
              {selectedType === 'PURCHASE' && (
                <>
                  <Col xs={24} sm={8} lg={8}>
                    <Form.Item
                      label={<span style={{ fontWeight: 700, color: '#374151' }}>
                        GST %
                        <span style={{ fontWeight: 500, color: '#6B7280' }}> = {getCurrencySymbol()}{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </span>}
                    >
                      <InputNumber
                        min={0}
                        max={100}
                        precision={2}
                        value={gstManual ? gstRate : gstPercent}
                        onChange={(v) => { setGstRate(v ?? 0); setGstManual(true); }}
                        style={{ width: '100%', borderRadius: 8 }}
                        size="middle"
                        placeholder="0"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8} lg={8}>
                    <Form.Item
                      label={<span style={{ fontWeight: 700, color: '#374151' }}>
                        Discount
                        {discountMode === 'PERCENT' && (
                          <span style={{ fontWeight: 500, color: '#6B7280' }}> = {getCurrencySymbol()}{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        )}
                      </span>}
                    >
                      <InputNumber
                        min={0}
                        max={discountMode === 'PERCENT' ? 100 : undefined}
                        precision={2}
                        controls={false}
                        value={discountMode === 'PERCENT' ? discountPct : discount}
                        onChange={(v) => (discountMode === 'PERCENT' ? setDiscountPct(v ?? 0) : setDiscount(v || 0))}
                        className="skr-discount-input"
                        addonBefore={
                          <Segmented
                            size="small"
                            value={discountMode}
                            onChange={setDiscountMode}
                            options={[{ label: '%', value: 'PERCENT' }, { label: getCurrencySymbol(), value: 'AMOUNT' }]}
                          />
                        }
                        style={{ width: '100%' }}
                        size="middle"
                        placeholder={discountMode === 'PERCENT' ? '0' : '0.00'}
                      />
                    </Form.Item>
                  </Col>
                </>
              )}
            </Row>
          </Card>

          {/* Inline add-new-vendor panel (Purchase type) */}
          {selectedType === 'PURCHASE' && quickVendorOpen && (
            <Card style={{ borderRadius: 10, border: '1px solid var(--theme-primary)', marginBottom: 12 }} bodyStyle={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>Add new vendor</span>
                <Button type="text" size="small" onClick={() => setQuickVendorOpen(false)}>Cancel</Button>
              </div>
              <Row gutter={[12, 8]}>
                <Col xs={24} sm={12}>
                  <div style={labelStyle}>Name *</div>
                  <Input value={qv.name} onChange={(e) => setQv((p) => ({ ...p, name: e.target.value }))} placeholder="Vendor name" style={{ borderRadius: 8 }} />
                </Col>
                <Col xs={24} sm={12}>
                  <div style={labelStyle}>Phone *</div>
                  <Input
                    value={qv.mobile}
                    onChange={(e) => setQv((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="10-digit phone number"
                    maxLength={10}
                    style={{ borderRadius: 8 }}
                  />
                </Col>
              </Row>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <Button type="primary" loading={qvSaving} onClick={saveQuickVendor} style={{ borderRadius: 8, fontWeight: 700 }}>Add & select</Button>
              </div>
            </Card>
          )}

          {/* Dynamic Items Section */}
          {selectedType && (
            <Card
              title={
                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
                  {selectedType === 'OVERHEAD' ? 'Expense Items' : 'Purchase Items'}
                </span>
              }
              style={{ borderRadius: 10, border: '1px solid #E2E8F0', marginBottom: 12 }}
              bodyStyle={{ padding: '0 0 8px 0' }}
            >
              <Table
                dataSource={
                  selectedType === 'OVERHEAD'
                    ? overheadRows.map((r) => ({ ...r, key: r.id }))
                    : itemRows.map((r) => ({ ...r, key: r.id }))
                }
                columns={selectedType === 'OVERHEAD' ? overheadItemColumns : purchaseItemColumns}
                pagination={false}
                size="small"
                className="skr-item-table"
                style={{ overflow: 'hidden' }}
              />
              <div style={{ padding: '12px 16px 0' }}>
                <Button
                  icon={<PlusOutlined />}
                  onClick={selectedType === 'OVERHEAD' ? addOverheadRow : addItemRow}
                  style={{
                    borderRadius: 8,
                    borderColor: 'var(--theme-primary)',
                    color: 'var(--theme-primary)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                  }}
                >
                  Add {selectedType === 'OVERHEAD' ? 'Expense' : 'Item'}
                </Button>
              </div>
            </Card>
          )}
          </Box>
          {/* ── RIGHT: Totals + Payment ── */}
          <Box sx={{ flex: '1 1 320px', minWidth: 300 }}>
          {/* Bill summary */}
          <Card
            style={{
              borderRadius: 10,
              border: '1px solid color-mix(in srgb, var(--theme-primary) 25%, white)',
              marginBottom: 12,
            }}
            bodyStyle={{ padding: '14px 18px', background: 'color-mix(in srgb, var(--theme-primary) 10%, white)', borderRadius: 10 }}
          >
            <div style={billRow}>
              <span style={billLabel}>Subtotal</span>
              <span style={billValue}>{getCurrencySymbol()}{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {selectedType === 'PURCHASE' && (
              <>
                <div style={billRow}>
                  <span style={billLabel}>GST</span>
                  <span style={billValue}>+ {getCurrencySymbol()}{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={billRow}>
                  <span style={billLabel}>Discount</span>
                  <span style={billValue}>− {getCurrencySymbol()}{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            )}
            <div style={billDivider} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: '#0F172A', fontWeight: 700, fontSize: '0.92rem' }}>Grand Total</span>
              <span style={{ color: 'var(--theme-primary)', fontWeight: 700, fontSize: '1.1rem', fontVariantNumeric: 'tabular-nums' }}>
                {getCurrencySymbol()}{(selectedType === 'OVERHEAD' ? subtotal : grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </Card>

          {/* Payment — bill style, captured at creation (clears oldest vendor dues first) */}
          <Card style={{ borderRadius: 10, border: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden' }} bodyStyle={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>Payment</span>
              {selectedType === 'PURCHASE' && vendorOverdue > 0 && (
                <button
                  type="button"
                  onClick={() => setShowDues((s) => !s)}
                  style={{
                    cursor: 'pointer', borderRadius: 999, padding: '2px 10px', fontSize: '0.74rem', fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    color: 'var(--theme-primary)',
                    background: 'color-mix(in srgb, var(--theme-primary) 10%, white)',
                    border: '1px solid color-mix(in srgb, var(--theme-primary) 35%, white)',
                  }}
                >
                  <LeftOutlined style={{ fontSize: 10, transform: showDues ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }} />
                  Previous dues ({vendorUnpaid.length})
                </button>
              )}
            </div>

            {/* Previous dues — slides in from the right, over the payment form (half width, themed) */}
            <div style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', zIndex: 20,
              background: 'color-mix(in srgb, var(--theme-primary) 8%, white)',
              borderLeft: '1px solid color-mix(in srgb, var(--theme-primary) 25%, white)',
              boxShadow: '-6px 0 18px rgba(15,23,42,0.12)',
              transform: showDues ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.4s ease',
              padding: '14px 16px', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: 'var(--theme-primary)', fontSize: '0.86rem' }}>Previous dues · oldest first</span>
                <CloseOutlined onClick={() => setShowDues(false)} style={{ cursor: 'pointer', color: 'var(--theme-primary)', fontSize: 13 }} />
              </div>
              {payNow > 0 && (
                <div style={{ fontSize: '0.7rem', color: '#64748B', marginBottom: 8 }}>
                  <CheckCircleOutlined style={{ color: '#16A34A' }} /> cleared · <span style={{ color: '#D97706', fontWeight: 700 }}>●</span> partial · <span style={{ color: '#C0C0C0', fontWeight: 700 }}>●</span> pending
                </div>
              )}
              <div style={{ overflowY: 'auto' }}>
                {duesWithStatus.map((inv) => {
                  const cleared = inv.status === 'cleared';
                  const partial = inv.status === 'partial';
                  const rowColor = cleared ? '#16A34A' : partial ? '#D97706' : '#C0C0C0';
                  return (
                    <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '5px 0', borderBottom: '1px dashed #EEF2F7', opacity: payNow > 0 && inv.status === 'pending' ? 0.6 : 1 }}>
                      <span style={{ color: '#0F172A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {payNow > 0 && (cleared
                          ? <CheckCircleOutlined style={{ color: '#16A34A', fontSize: 13 }} />
                          : <span style={{ color: rowColor, fontSize: 11 }}>●</span>)}
                        {inv.invoiceNumber || 'Invoice'}
                        <span style={{ color: '#94A3B8', fontWeight: 500 }}>
                          {inv.purchaseDate ? dayjs(inv.purchaseDate).format('DD MMM YYYY') : ''}
                        </span>
                      </span>
                      <span style={{ color: 'var(--theme-primary)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {getCurrencySymbol()}{inv.due.toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, fontWeight: 800 }}>
                <span style={{ color: '#0F172A' }}>Total overdue</span>
                <span style={{ color: 'var(--theme-primary)', fontVariantNumeric: 'tabular-nums' }}>{getCurrencySymbol()}{vendorOverdue.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {selectedType === 'PURCHASE' && (
              <>
                <div style={billRow}>
                  <span style={billLabel}>This invoice</span>
                  <span style={billValue}>{getCurrencySymbol()}{grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={billRow}>
                  <span style={billLabel}>Previous overdue</span>
                  <span style={billValue}>{getCurrencySymbol()}{vendorOverdue.toLocaleString('en-IN')}</span>
                </div>
                <div style={billDivider} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                  <span style={{ color: '#0F172A', fontWeight: 700 }}>Total outstanding</span>
                  <span style={{ color: 'var(--theme-primary)', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                    {getCurrencySymbol()}{Math.round(grandTotal + vendorOverdue).toLocaleString('en-IN')}
                  </span>
                </div>
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <InputNumber
                value={createPayAmount}
                onChange={(v) => setCreatePayAmount(v == null ? null : Math.min(Number(v), maxPayable))}
                min={0}
                max={maxPayable}
                prefix={getCurrencySymbol()}
                placeholder="Amount paying now"
                controls={false}
                variant="borderless"
                style={{ flex: 1, minWidth: 150, borderBottom: '1px solid #E2E8F0', borderRadius: 0 }}
              />
              <Select value={createPayMode} onChange={setCreatePayMode} style={{ width: 130, borderBottom: '1px solid #E2E8F0' }} variant="borderless">
                <Option value="CASH">Cash</Option>
                <Option value="UPI">UPI</Option>
                <Option value="CREDIT_CARD">Credit Card</Option>
                <Option value="DEBIT_CARD">Debit Card</Option>
                <Option value="NET_BANKING">Net Banking</Option>
              </Select>
            </div>

            {selectedType === 'PURCHASE' && paymentAllocation.leftover > 0 && (
              <div style={{ color: '#DC2626', fontSize: '0.8rem', fontWeight: 600, marginTop: 8 }}>
                ⚠ {getCurrencySymbol()}{paymentAllocation.leftover.toLocaleString('en-IN')} is more than the total outstanding — reduce the amount.
              </div>
            )}

            {/* Action buttons live inside the payment card */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8, marginTop: 16 }}>
              <Button onClick={handleCloseAddModal} style={{ borderRadius: 8, fontWeight: 600 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                loading={createInvestmentMutation.isPending}
                onClick={handleSaveInvestment}
                disabled={!isFormValid}
                style={{ borderRadius: 8, fontWeight: 700 }}
              >
                Save Investment
              </Button>
            </div>
          </Card>
          </Box>
          </Box>
        </Form>
      </Box>
      )}

      {/* ════════════════════════════════════
          ADD / EDIT VENDOR MODAL
      ════════════════════════════════════ */}
      <Modal
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserOutlined style={{ color: 'var(--theme-primary)', fontSize: '0.95rem' }} />
            </div>
            {selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}
          </span>
        }
        open={vendorModalVisible}
        onCancel={handleCloseVendorModal}
        width={600}
        footer={null}
        destroyOnClose
        bodyStyle={{ backgroundColor: '#F8FAFC', padding: 24 }}
      >
        <Form
          form={vendorForm}
          layout="vertical"
          requiredMark={false}
          autoComplete="off"
        >
          <Card style={{ borderRadius: 10, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '18px 20px' }}>
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={16}>
                <Form.Item
                  name="name"
                  label={<span style={{ fontWeight: 700, color: '#374151' }}>Vendor Name *</span>}
                  rules={[{ required: true, message: 'Vendor name is required.' }]}
                >
                  <Input placeholder="Enter vendor name" style={{ borderRadius: 8 }} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="active"
                  label={<span style={{ fontWeight: 700, color: '#374151' }}>Status *</span>}
                  rules={[{ required: true }]}
                  initialValue={true}
                >
                  <Select style={{ borderRadius: 8 }} size="large">
                    <Option value={true}>Active</Option>
                    <Option value={false}>Inactive</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  name="gstNumber"
                  label={<span style={{ fontWeight: 700, color: '#374151' }}>GST Number</span>}
                >
                  <Input placeholder="Enter GST number" style={{ borderRadius: 8 }} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="mobile"
                  label={<span style={{ fontWeight: 700, color: '#374151' }}>Phone *</span>}
                  rules={[{ required: true, message: 'Phone is required.' }]}
                >
                  <Input placeholder="Enter phone number" style={{ borderRadius: 8 }} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="email"
                  label={<span style={{ fontWeight: 700, color: '#374151' }}>Email</span>}
                  rules={[{ type: 'email', message: 'Please enter a valid email.' }]}
                >
                  <Input placeholder="Enter email address" style={{ borderRadius: 8 }} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  name="address"
                  label={<span style={{ fontWeight: 700, color: '#374151' }}>Address *</span>}
                  rules={[{ required: true, message: 'Address is required.' }]}
                >
                  <TextArea
                    placeholder="Enter full address"
                    rows={3}
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <Button onClick={handleCloseVendorModal} style={{ borderRadius: 8, fontWeight: 600, height: 40 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={createVendorMutation.isPending || updateVendorMutation.isPending}
              onClick={handleSaveVendor}
              style={{ borderRadius: 8, fontWeight: 700, height: 40, paddingInline: 24 }}
            >
              {selectedVendor ? 'Update Vendor' : 'Save Vendor'}
            </Button>
          </div>
        </Form>
      </Modal>

    </ConfigProvider>
  );
};

export default InvestmentPage;
