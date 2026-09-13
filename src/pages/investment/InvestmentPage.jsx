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
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  WalletOutlined,
  ShoppingOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  BankOutlined,
  UserOutlined,
  TeamOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { investmentService, vendorService } from '../../services/investmentService';
import { productService } from '../../services/productService';

const { Option } = Select;
const { TextArea } = Input;

// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────
const INVESTMENT_TYPES = [
  { value: 'PURCHASE', label: 'Purchase', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  { value: 'OVERHEAD', label: 'Overhead', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
];

const ITEM_TYPES = [
  { value: 'MATERIAL', label: 'Material' },
  { value: 'PRODUCT', label: 'Product' },
];

const UNIT_OPTIONS = [
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
  { key: 'NOS', label: 'Nos' },
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
      backgroundColor: active ? '#DCFCE7' : '#FEF2F2',
      color: active ? '#16A34A' : '#DC2626',
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
        backgroundColor: active ? '#16A34A' : '#DC2626',
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
        color: cfg.color,
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
  itemType: 'MATERIAL',
  itemName: '',
  productId: undefined,
  quantity: 0,
  unit: 'PIECE',
  rate: 0,
  amount: 0,
});

const makeEmptyOverheadRow = (id) => ({
  id,
  expenseName: '',
  amount: 0,
});

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────
const InvestmentPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

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
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [investmentForm] = Form.useForm();
  const [selectedType, setSelectedType] = useState(undefined);
  const [itemRows, setItemRows] = useState([makeEmptyRow(1)]);
  const [overheadRows, setOverheadRows] = useState([makeEmptyOverheadRow(1)]);
  const [subtotal, setSubtotal] = useState(0);
  const [gst, setGst] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);

  // ── Vendor states ──────────────────────
  const [vendorModalVisible, setVendorModalVisible] = useState(false);
  const [vendorForm] = Form.useForm();
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorSearch, setVendorSearch] = useState('');

  // ── Open modal from URL params ──────────
  useEffect(() => {
    if (queryAdd === 'true' && queryVendorId) {
      setAddModalVisible(true);
      setSelectedType('PURCHASE');
      investmentForm.setFieldsValue({
        type: 'PURCHASE',
        vendorId: queryVendorId,
      });
    }
  }, [queryAdd, queryVendorId, investmentForm]);

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
  const grandTotal = subtotal + gst - discount + otherCharges;

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
  };

  const handleResetFilters = () => {
    setInvestmentFilters({ fromDate: null, toDate: null, vendorId: undefined, type: undefined, search: '' });
    setAppliedFilters({});
  };

  const handleViewInvestment = (record) => {
    setSelectedInvestment(record);
    setViewDrawerVisible(true);
  };

  const handleCloseAddModal = () => {
    setAddModalVisible(false);
    investmentForm.resetFields();
    setSelectedType(undefined);
    setItemRows([makeEmptyRow(1)]);
    setOverheadRows([makeEmptyOverheadRow(1)]);
    setSubtotal(0);
    setGst(0);
    setDiscount(0);
    setOtherCharges(0);
    if (queryAdd === 'true' && queryVendorId) {
      navigate(`/vendors/${queryVendorId}`, { replace: true });
    }
  };

  const handleTypeChange = (val) => {
    setSelectedType(val);
    setItemRows([makeEmptyRow(1)]);
    setOverheadRows([makeEmptyOverheadRow(1)]);
    setSubtotal(0);
    if (val === 'OVERHEAD') {
      setGst(0);
      setDiscount(0);
      setOtherCharges(0);
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
          }));
      }

      const computedGrandTotal = selectedType === 'OVERHEAD'
        ? subtotal
        : subtotal + gst - discount + otherCharges;

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
          otherCharge: otherCharges,
        } : {}),
        grandTotal: computedGrandTotal,
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
      render: (val) => (
        <span style={{ fontWeight: 600, color: '#0F172A' }}>{val || '—'}</span>
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
        <span style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
          ₹{Number(val || 0).toLocaleString('en-IN')}
        </span>
      ),
      sorter: (a, b) => (a.grandTotal || 0) - (b.grandTotal || 0),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Tooltip title="View Details" placement="top">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewInvestment(record)}
            style={{
              color: '#2563EB',
              backgroundColor: '#EFF6FF',
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
            style={{ color: '#2563EB', fontWeight: 500 }}
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
                color: '#2563EB',
                backgroundColor: '#EFF6FF',
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
          <Tooltip title="Edit Vendor">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEditVendor(record)}
              style={{
                color: '#7C3AED',
                backgroundColor: '#F5F3FF',
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
          {record.active ? (
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
                  color: '#16A34A',
                  backgroundColor: '#F0FDF4',
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
          )}
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
          style={{ borderRadius: 6, fontSize: '0.82rem' }}
          size="small"
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
          style={{ width: '100%', borderRadius: 6, fontSize: '0.82rem' }}
          size="small"
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
        >
          {UNIT_OPTIONS.map((u) => (
            <Option key={u.key} value={u.key}>{u.label}</Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Rate (₹)',
      width: 100,
      render: (_, record) => (
        <InputNumber
          min={0}
          precision={2}
          value={record.rate}
          onChange={(val) => updateItemRow(record.id, 'rate', val)}
          style={{ width: '100%', borderRadius: 6, fontSize: '0.82rem' }}
          size="small"
        />
      ),
    },
    {
      title: 'Amount (₹)',
      width: 100,
      render: (_, record) => (
        <span style={{ fontWeight: 700, color: '#059669', fontSize: '0.85rem' }}>
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
          style={{ borderRadius: 6, fontSize: '0.82rem' }}
          size="small"
        />
      ),
    },
    {
      title: 'Amount (₹)',
      width: 150,
      render: (_, record) => (
        <InputNumber
          min={0}
          precision={2}
          value={record.amount}
          onChange={(val) => updateOverheadRow(record.id, 'amount', val)}
          style={{ width: '100%', borderRadius: 6, fontSize: '0.82rem' }}
          size="small"
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
        v != null ? `₹${Number(v).toLocaleString("en-IN")}` : "—",
    },
    {
      title: "Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 110,
      render: (v) => (
        <span style={{ fontWeight: 700, color: "#059669" }}>
          ₹{Number(v || 0).toLocaleString("en-IN")}
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
        <span style={{ fontWeight: 700, color: '#059669' }}>
          ₹{Number(v || 0).toLocaleString('en-IN')}
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
    color: activeTab === tab ? '#2563EB' : '#64748B',
    borderBottom: activeTab === tab ? '2px solid #2563EB' : '2px solid transparent',
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

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2563EB',
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
        <Card style={{ ...cardStyle, padding: 0 }} bodyStyle={{ padding: 0 }}>
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
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setAddModalVisible(true)}
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
                  <span style={{ color: '#0C4A6E' }}>Current Month:</span>
                  <span style={{ marginLeft: 6, color: '#164E63' }}>₹{currentMonthInvestment.toLocaleString('en-IN')}</span>
                  <span
                    style={{
                      marginLeft: 10,
                      fontSize: '0.82rem',
                      color: currentMonthInvestment >= previousMonthInvestment ? '#16A34A' : '#DC2626',
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
                  <span style={{ color: '#1D4ED8' }}>Total Investment:</span>
                  <span style={{ marginLeft: 6, color: '#1E40AF' }}>₹{totalInvestment.toLocaleString('en-IN')}</span>
                </span>
                <span style={{ color: '#CBD5E1' }}>|</span>
                <span>
                  <span style={{ color: '#047857' }}>Purchase:</span>
                  <span style={{ marginLeft: 6, color: '#065F46' }}>₹{purchaseTotal.toLocaleString('en-IN')}</span>
                </span>
                <span style={{ color: '#CBD5E1' }}>|</span>
                <span>
                  <span style={{ color: '#B45309' }}>Overhead:</span>
                  <span style={{ marginLeft: 6, color: '#92400E' }}>₹{overheadTotal.toLocaleString('en-IN')}</span>
                </span>
              </div>

              {/* Filters Bar */}
              <Card
                style={{ ...cardStyle, marginBottom: 16 }}
                bodyStyle={{ padding: '16px 20px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    alignItems: 'flex-end',
                  }}
                >
                  <div>
                    <span style={labelStyle}>Date From</span>
                    <DatePicker
                      value={investmentFilters.fromDate}
                      onChange={(d) => setInvestmentFilters((p) => ({ ...p, fromDate: d }))}
                      format="DD-MM-YYYY"
                      style={{ ...inlineInputStyle, width: 148 }}
                      placeholder="dd-mm-yyyy"
                    />
                  </div>
                  <div>
                    <span style={labelStyle}>Date To</span>
                    <DatePicker
                      value={investmentFilters.toDate}
                      onChange={(d) => setInvestmentFilters((p) => ({ ...p, toDate: d }))}
                      format="DD-MM-YYYY"
                      style={{ ...inlineInputStyle, width: 148 }}
                      placeholder="dd-mm-yyyy"
                    />
                  </div>
                  <div>
                    <span style={labelStyle}>Vendor</span>
                    <Select
                      value={investmentFilters.vendorId}
                      onChange={(v) => setInvestmentFilters((p) => ({ ...p, vendorId: v }))}
                      placeholder="All Vendors"
                      allowClear
                      style={{ width: 180, height: 36 }}
                    >
                      {vendors.map((v) => (
                        <Option key={v.id} value={v.id}>{v.name}</Option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <span style={labelStyle}>Investment Type</span>
                    <Select
                      value={investmentFilters.type}
                      onChange={(v) => setInvestmentFilters((p) => ({ ...p, type: v }))}
                      placeholder="All Types"
                      allowClear
                      style={{ width: 180, height: 36 }}
                    >
                      {INVESTMENT_TYPES.map((t) => (
                        <Option key={t.value} value={t.value}>{t.label}</Option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <span style={labelStyle}>Search</span>
                    <Input
                      value={investmentFilters.search}
                      onChange={(e) => setInvestmentFilters((p) => ({ ...p, search: e.target.value }))}
                      placeholder="Reference, vendor…"
                      prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                      style={{ ...inlineInputStyle, width: 200 }}
                      allowClear
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      type="primary"
                      onClick={handleApplyFilters}
                      style={{ borderRadius: 8, fontWeight: 600, height: 36 }}
                    >
                      Search
                    </Button>
                    <Button
                      onClick={handleResetFilters}
                      style={{ borderRadius: 8, fontWeight: 600, height: 36 }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Investments Table */}
              <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
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
                  style={{ borderRadius: 12, overflow: 'hidden' }}
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

              {/* Header Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 24,
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
                    Vendor Management
                    <HeadingInfo text="Manage suppliers and vendor information." />
                  </div>
                </div>
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
              </div>

              {/* Vendor Summary Cards */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                  <SummaryCard
                    title="Total Vendors"
                    value={totalVendors}
                    icon={<TeamOutlined style={{ color: '#2563EB', fontSize: '1.2rem' }} />}
                    iconBg="#EFF6FF"
                    valueColor="#2563EB"
                    loading={vendorsLoading}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <SummaryCard
                    title="Active Vendors"
                    value={activeVendors}
                    icon={<CheckCircleOutlined style={{ color: '#16A34A', fontSize: '1.2rem' }} />}
                    iconBg="#DCFCE7"
                    valueColor="#16A34A"
                    loading={vendorsLoading}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <SummaryCard
                    title="Inactive Vendors"
                    value={inactiveVendors}
                    icon={<StopOutlined style={{ color: '#DC2626', fontSize: '1.2rem' }} />}
                    iconBg="#FEF2F2"
                    valueColor="#DC2626"
                    loading={vendorsLoading}
                  />
                </Col>
              </Row>

              {/* Search bar */}
              <Card style={{ ...cardStyle, marginBottom: 16 }} bodyStyle={{ padding: '14px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Input
                    placeholder="Search by name, GST, phone, email…"
                    prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    allowClear
                    style={{ maxWidth: 380, borderRadius: 8 }}
                    size="large"
                  />
                </div>
              </Card>

              {/* Vendors Table */}
              <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
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
                  style={{ borderRadius: 12, overflow: 'hidden' }}
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
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileTextOutlined style={{ color: '#2563EB', fontSize: '0.95rem' }} />
            </div>
            Investment Details
          </span>
        }
        placement="right"
        width={580}
        onClose={() => { setViewDrawerVisible(false); setSelectedInvestment(null); }}
        open={viewDrawerVisible}
        bodyStyle={{ backgroundColor: '#F8FAFC', padding: 24 }}
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
                  { label: 'Vendor', value: investmentDetail.vendorName || '—' },
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
                { label: 'Other Charges', value: investmentDetail.otherCharges, color: '#0F172A' },
              ].map(({ label, value, color, prefix }) => (
                <div
                  key={label}
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.88rem' }}
                >
                  <span style={{ color: '#64748B', fontWeight: 500 }}>{label}</span>
                  <span style={{ color, fontWeight: 600 }}>
                    {prefix || ''}₹{Number(value || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              <Divider style={{ margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>Grand Total</span>
                <span style={{ fontWeight: 900, fontSize: '1.3rem', color: '#059669' }}>
                  ₹{Number(investmentDetail.grandTotal || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </Card>
          </div>
        ) : (
          <Empty description="No details available" />
        )}
      </Drawer>

      {/* ════════════════════════════════════
          ADD INVESTMENT MODAL
      ════════════════════════════════════ */}
      <Modal
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WalletOutlined style={{ color: '#2563EB', fontSize: '0.95rem' }} />
            </div>
            Add New Investment
          </span>
        }
        open={addModalVisible}
        onCancel={handleCloseAddModal}
        width={960}
        footer={null}
        destroyOnClose
        bodyStyle={{ backgroundColor: '#F8FAFC', padding: '12px 16px' }}
      >
        <Form
          form={investmentForm}
          layout="vertical"
          requiredMark={false}
          autoComplete="off"
        >
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
                      placeholder="Select Vendor"
                      style={{ borderRadius: 8 }}
                      size="middle"
                      showSearch
                      optionFilterProp="children"
                      disabled={isFromVendorDetails}
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
                      name="gstAmount"
                      label={<span style={{ fontWeight: 700, color: '#374151' }}>GST Amount (₹)</span>}
                    >
                      <InputNumber
                        min={0}
                        precision={2}
                        value={gst}
                        onChange={(v) => setGst(v || 0)}
                        style={{ width: '100%', borderRadius: 8 }}
                        size="middle"
                        placeholder="0.00"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8} lg={8}>
                    <Form.Item
                      name="discountAmount"
                      label={<span style={{ fontWeight: 700, color: '#374151' }}>Discount Amount (₹)</span>}
                    >
                      <InputNumber
                        min={0}
                        precision={2}
                        value={discount}
                        onChange={(v) => setDiscount(v || 0)}
                        style={{ width: '100%', borderRadius: 8 }}
                        size="middle"
                        placeholder="0.00"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8} lg={8}>
                    <Form.Item
                      name="otherCharge"
                      label={<span style={{ fontWeight: 700, color: '#374151' }}>Other Charge (₹)</span>}
                    >
                      <InputNumber
                        min={0}
                        precision={2}
                        value={otherCharges}
                        onChange={(v) => setOtherCharges(v || 0)}
                        style={{ width: '100%', borderRadius: 8 }}
                        size="middle"
                        placeholder="0.00"
                      />
                    </Form.Item>
                  </Col>
                </>
              )}
            </Row>
          </Card>

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
                style={{ overflow: 'hidden' }}
              />
              <div style={{ padding: '12px 16px 0' }}>
                <Button
                  icon={<PlusOutlined />}
                  onClick={selectedType === 'OVERHEAD' ? addOverheadRow : addItemRow}
                  style={{
                    borderRadius: 8,
                    borderColor: '#2563EB',
                    color: '#2563EB',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                  }}
                >
                  Add {selectedType === 'OVERHEAD' ? 'Expense' : 'Item'}
                </Button>
              </div>
            </Card>
          )}

          {/* Summary Card */}
          <Card
            style={{
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
              marginBottom: 12,
            }}
            bodyStyle={{ padding: '12px 16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <div style={labelStyle}>Subtotal (₹)</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                    ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                {selectedType === 'PURCHASE' && (
                  <>
                    <div>
                      <div style={labelStyle}>GST</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#475569' }}>
                        + ₹{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>Discount</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#DC2626' }}>
                        − ₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>Other Charges</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#475569' }}>
                        + ₹{otherCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={labelStyle}>Grand Total</div>
                <div style={{ fontWeight: 900, fontSize: '1.6rem', color: '#059669' }}>
                  ₹{(selectedType === 'OVERHEAD' ? subtotal : grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </Card>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={handleCloseAddModal} style={{ borderRadius: 8, fontWeight: 600, height: 40 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={createInvestmentMutation.isPending}
              onClick={handleSaveInvestment}
              disabled={!isFormValid}
              style={{ borderRadius: 8, fontWeight: 700, height: 40, paddingInline: 24 }}
            >
              Save Investment
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ════════════════════════════════════
          ADD / EDIT VENDOR MODAL
      ════════════════════════════════════ */}
      <Modal
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserOutlined style={{ color: '#2563EB', fontSize: '0.95rem' }} />
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
