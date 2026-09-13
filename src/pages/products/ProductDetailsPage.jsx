import React, { useState } from 'react';
import HeadingInfo from '../../components/common/HeadingInfo';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MaterialCostModal from './MaterialCostModal';
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
  DatePicker,
  Popconfirm,
  Tooltip,
  Skeleton,
  Result,
  notification,
  Modal,
  Empty,
  Alert,
  Dropdown,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  BarcodeOutlined,
  CheckCircleOutlined,
  StopOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  DollarCircleOutlined,
  DollarOutlined,
  ShoppingOutlined,
  ReloadOutlined,
  RiseOutlined,
  FallOutlined,
  MoreOutlined,
  IdcardOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  BuildOutlined,
  LoadingOutlined,
  EditOutlined,
  RightOutlined,
  FileTextOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { Box } from '@mui/material';
import dayjs from 'dayjs';
import { productService } from '../../services/productService';
import { productionService } from '../../services/productionService';
import { getProductIcon } from '../../utils/product-icons';

/* ─────────────────────────────────────────
   Mini Sparkline (CSS only, no library)
   ───────────────────────────────────────── */
const Sparkline = ({ color = '#6366F1' }) => (
  <svg width="80" height="36" viewBox="0 0 80 36" fill="none" style={{ opacity: 0.8 }}>
    <polyline
      points="0,28 12,22 24,26 36,14 48,18 60,8 72,12 80,6"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.15" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient>
    </defs>
    <polygon
      points="0,28 12,22 24,26 36,14 48,18 60,8 72,12 80,6 80,36 0,36"
      fill={`url(#grad-${color.replace('#', '')})`}
    />
  </svg>
);

/* ─────────────────────────────────────────
   Sub-component: Live Preview Card inside Drawer
   ───────────────────────────────────────── */
const PieceCodePreview = ({ code, rate, description }) => (
  <div
    style={{
      background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      border: '1.5px solid #93C5FD',
      borderRadius: 12,
      padding: '10px',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        backgroundColor: 'rgba(37,99,235,0.07)',
      }}
    />
    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 1 }}>
      Live Preview
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: '1.25rem', color: '#0F172A', fontFamily: 'monospace', letterSpacing: 1 }}>
          {code || <span style={{ color: '#94A3B8', fontStyle: 'italic', fontFamily: 'inherit', fontWeight: 400 }}>CODE-000</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 400, color: '#64748B', marginBottom: 2 }}>Fixed Rate</div>
        <div style={{ fontWeight: 600, fontSize: '1.5rem', color: '#059669' }}>
          {rate ? `₹${Number(rate).toLocaleString('en-IN')}` : <span style={{ color: '#94A3B8', fontSize: '1rem' }}>₹ —</span>}
        </div>
      </div>
    </div>
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#DCFCE7', color: '#16A34A', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block' }} />
      Active
    </div>
  </div>
);

/* ─────────────────────────────────────────
   Main Component
   ───────────────────────────────────────── */
const ProductDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [productionDrawerVisible, setProductionDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [previewCode, setPreviewCode] = useState('');
  const [previewRate, setPreviewRate] = useState(null);
  const [previewDesc, setPreviewDesc] = useState('');
  const [materialCostModalOpen, setMaterialCostModalOpen] = useState(false);
  const [editingMaterialCost, setEditingMaterialCost] = useState(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [deletingPieceCodeId, setDeletingPieceCodeId] = useState(null);
  const [togglingPieceCodeId, setTogglingPieceCodeId] = useState(null);

  // ── Queries ──────────────────────────────────────
  const { data: productResponse, isLoading: productLoading, isError: productError, error: productFetchError, refetch: refetchProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productService.getProductById(productId),
    enabled: !!productId,
  });

  const { data: pieceCodesResponse, isLoading: pieceCodesLoading, refetch: refetchPieceCodes } = useQuery({
    queryKey: ['pieceCodes', productId],
    queryFn: () => productService.getPieceCodes(productId),
    enabled: !!productId,
  });

  const { data: productionResponse, isLoading: productionLoading, refetch: refetchProduction } = useQuery({
    queryKey: ['production', { productId }],
    queryFn: () => productionService.getProduction({ productId }),
    enabled: !!productId,
  });
  const { data: materialCostResponse, isLoading: materialCostLoading, } = useQuery({
    queryKey: ['materialCosts', productId],
    queryFn: () => productService.getMaterialCosts(productId),
    enabled: !!productId,
  });


  const materialCosts = materialCostResponse?.data || [];
  const product = productResponse?.data;
  const pieceCodes = pieceCodesResponse?.data || [];
  const productionEntries = productionResponse?.data || [];

  // ── Analytics Computations ──────────────────────
  const totalPieceCodes = pieceCodes.length;
  const activePieceCodes = pieceCodes.filter((pc) => pc.active).length;

  const productProductionItems = React.useMemo(() => {
    const items = [];
    productionEntries.forEach((entry) => {
      if (entry.items && Array.isArray(entry.items)) {
        entry.items.forEach((item) => {
          if (item.productId === productId) {
            items.push({ ...item, productionDate: entry.productionDate, employeeName: entry.employeeName, entryId: entry.id });
          }
        });
      }
    });
    return items.sort((a, b) => new Date(b.productionDate) - new Date(a.productionDate));
  }, [productionEntries, productId]);

  const filteredProductionItems = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return productProductionItems.filter((item) => {
      const matchesSearch = query
        ? (item.employeeName || '').toLowerCase().includes(query) || (item.pieceCode || '').toLowerCase().includes(query)
        : true;

      if ((!dateRange || !dateRange[0]) && (!dateRange || !dateRange[1])) {
        return matchesSearch;
      }

      const productionDay = dayjs(item.productionDate);
      const start = dateRange && dateRange[0] ? dayjs(dateRange[0]) : null;
      const end = dateRange && dateRange[1] ? dayjs(dateRange[1]) : null;
      const matchesStart = start ? productionDay.isSame(start, 'day') || productionDay.isAfter(start, 'day') : true;
      const matchesEnd = end ? productionDay.isSame(end, 'day') || productionDay.isBefore(end, 'day') : true;

      return matchesSearch && matchesStart && matchesEnd;
    });
  }, [productProductionItems, searchQuery, dateRange]);


  const totalProductionQty = React.useMemo(() => productProductionItems.reduce((s, i) => s + (i.quantity || 0), 0), [productProductionItems]);
  const totalInventoryAmount = React.useMemo(() => productProductionItems.reduce((s, i) => s + (i.amount || 0), 0), [productProductionItems]);
  const averageRate = React.useMemo(() => pieceCodes.length === 0 ? 0 : pieceCodes.reduce((a, pc) => a + (pc.rate || 0), 0) / pieceCodes.length, [pieceCodes]);
  const minRate = React.useMemo(() => pieceCodes.length === 0 ? 0 : Math.min(...pieceCodes.map((pc) => pc.rate)), [pieceCodes]);
  const maxRate = React.useMemo(() => pieceCodes.length === 0 ? 0 : Math.max(...pieceCodes.map((pc) => pc.rate)), [pieceCodes]);
  const activeCodes = React.useMemo(() => pieceCodes.filter((pc) => pc.active).sort((a, b) => b.rate - a.rate), [pieceCodes]);
  const maxActiveRate = React.useMemo(() => activeCodes.length === 0 ? 1 : Math.max(...activeCodes.map((pc) => pc.rate)), [activeCodes]);
  const currentMaterialCost = React.useMemo(() => {
    if (!materialCosts.length) return null;

    const today = new Date();
    const applicable = materialCosts
      .map((mc) => ({
        ...mc,
        effectiveDate: mc.effectiveFrom ? new Date(mc.effectiveFrom) : mc.createdAt ? new Date(mc.createdAt) : new Date(0),
      }))
      .filter((mc) => mc.effectiveDate <= today)
      .sort((a, b) => b.effectiveDate - a.effectiveDate);

    if (applicable.length) return applicable[0];

    return materialCosts
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
  }, [materialCosts]);


  const allActivities = React.useMemo(() => {
    const activities = [];

    // Material cost activities
    materialCosts.forEach((mc) => {
      activities.push({
        id: `mc-${mc.id}`,
        type: 'material_cost',
        title: 'Pricing updated',
        subtitle: `Cost ₹${Number(mc.cost).toFixed(2)}${(mc.salePrice || mc.salePrice === 0) ? ` · Sale ₹${Number(mc.salePrice).toFixed(2)}` : ''}\nEffective From: ${dayjs(mc.effectiveFrom).format('DD MMM YYYY')}`,
        date: dayjs(mc.createdAt).format('DD MMM YYYY hh:mm A'),
        dateBy: `by ${mc.createdBy || 'Admin'}`,
        sortDate: new Date(mc.createdAt),
      });
    });

    // Piece code activities
    pieceCodes.forEach((pc) => {
      activities.push({
        id: `pc-${pc.id}`,
        type: 'piece_code',
        title: 'Piece code created',
        subtitle: `Piece Code ${pc.code} (${pc.pieceType || pc.code})\ncreated with rate ₹${Number(pc.rate).toFixed(2)}`,
        date: dayjs(pc.createdAt).format('DD MMM YYYY hh:mm A'),
        dateBy: `by ${pc.createdBy || 'Admin'}`,
        sortDate: new Date(pc.createdAt),
      });
    });

    // Production activities
    productProductionItems.forEach((item) => {
      activities.push({
        id: `prod-${item.entryId}-${item.pieceCodeId}`,
        type: 'production',
        title: 'Production completed',
        subtitle: `${item.employeeName || 'Unknown'} produced ${item.quantity} Pcs\n(${item.pieceCode || 'N/A'})`,
        date: dayjs(item.productionDate).format('DD MMM YYYY hh:mm A'),
        dateBy: `by ${item.employeeName || 'Unknown'}`,
        sortDate: new Date(item.productionDate),
      });
    });

    return activities.sort((a, b) => b.sortDate - a.sortDate);
  }, [productProductionItems, pieceCodes, materialCosts]);

  const ACTIVITY_PREVIEW_COUNT = 5;
  const visibleActivities = showAllActivities ? allActivities : allActivities.slice(0, ACTIVITY_PREVIEW_COUNT);
  const hasMoreActivities = allActivities.length > ACTIVITY_PREVIEW_COUNT;

  const getActivityIcon = (type) => {
    switch (type) {
      case 'material_cost':
        return { icon: <DollarOutlined style={{ color: '#2563EB', fontSize: '1rem' }} />, bg: '#DBEAFE' };
      case 'piece_code':
        return { icon: <BarcodeOutlined style={{ color: '#7C3AED', fontSize: '1rem' }} />, bg: '#EDE9FE' };
      case 'production':
        return { icon: <BuildOutlined style={{ color: '#059669', fontSize: '1rem' }} />, bg: '#D1FAE5' };
      case 'inventory':
        return { icon: <InboxOutlined style={{ color: '#0891B2', fontSize: '1rem' }} />, bg: '#CFFAFE' };
      case 'product_update':
        return { icon: <EditOutlined style={{ color: '#6366F1', fontSize: '1rem' }} />, bg: '#EEF2FF' };
      default:
        return { icon: <FileTextOutlined style={{ color: '#64748B', fontSize: '1rem' }} />, bg: '#F1F5F9' };
    }
  };

  // ── Mutations ───────────────────────────────────
  const createPieceCodeMutation = useMutation({
    mutationFn: (data) => productService.createPieceCode(productId, data),
    onSuccess: (res) => {
      notification.success({ message: 'Piece Code Created', description: res.message || 'Created successfully.', placement: 'topRight', duration: 4 });
      queryClient.invalidateQueries({ queryKey: ['pieceCodes', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleCloseDrawer();
    },
    onError: (err) => {
      notification.error({ message: 'Creation Failed', description: err.response?.data?.message || err.message, placement: 'topRight', duration: 5 });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ pieceCodeId, active }) => productService.updatePieceCodeStatus(pieceCodeId, active),
    onSuccess: (res) => {
      notification.success({ message: 'Status Updated', description: res.message || 'Status updated.', placement: 'topRight', duration: 3 });
      queryClient.invalidateQueries({ queryKey: ['pieceCodes', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      notification.error({ message: 'Update Failed', description: err.response?.data?.message || err.message, placement: 'topRight', duration: 4 });
    },
    onSettled: () => {
      setTogglingPieceCodeId(null);
    },
  });

  const handleTogglePieceCodeStatus = (record) => {
    setTogglingPieceCodeId(record.id);
    updateStatusMutation.mutate({ pieceCodeId: record.id, active: !record.active });
  };

  const deletePieceCodeMutation = useMutation({
    mutationFn: (pieceCodeId) => productService.deletePieceCode(pieceCodeId),
    onSuccess: (res) => {
      if (res.success === false) {
        Modal.warning({ title: 'Cannot Delete', icon: <InfoCircleOutlined style={{ color: '#F59E0B' }} />, content: res.message || 'This piece code has production history. Deactivate it instead.', okText: 'OK' });
        return;
      }
      notification.success({ message: 'Piece Code Deleted', description: res.message || 'Deleted successfully.', placement: 'topRight', duration: 4 });
      queryClient.invalidateQueries({ queryKey: ['pieceCodes', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      const status = err.status || err.response?.status;
      if (status === 409 || status === 400) {
        Modal.warning({ title: 'Cannot Delete', icon: <InfoCircleOutlined style={{ color: '#F59E0B' }} />, content: err.response?.data?.message || 'This piece code has production history. Deactivate it instead.', okText: 'OK' });
      } else {
        notification.error({ message: 'Delete Failed', description: err.response?.data?.message || err.message, placement: 'topRight', duration: 5 });
      }
    },
    onSettled: () => {
      setDeletingPieceCodeId(null);
    },
  });

  const deletePieceCode = (id) => {
    setDeletingPieceCodeId(id);
    deletePieceCodeMutation.mutate(id);
  };

  const deleteMaterialCostMutation = useMutation({
    mutationFn: (id) => productService.deleteMaterialCost(id),
    onSuccess: (res) => {
      notification.success({ message: 'Material Cost Deleted', description: res.message || 'Deleted successfully.', placement: 'topRight', duration: 4 });
      queryClient.invalidateQueries({ queryKey: ['materialCosts', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
    onError: (err) => {
      notification.error({ message: 'Delete Failed', description: err.response?.data?.message || err.message, placement: 'topRight', duration: 5 });
    },
  });

  const deleteMaterialCost = (id) => {
    deleteMaterialCostMutation.mutate(id);
  };

  const editMaterialCost = (record) => {
    setEditingMaterialCost(record);
    setMaterialCostModalOpen(true);
  };

  const handleCloseMaterialCostModal = () => {
    setMaterialCostModalOpen(false);
    setEditingMaterialCost(null);
  };

  const handleMaterialCostSuccess = () => {
    setMaterialCostModalOpen(false);
    setEditingMaterialCost(null);
    queryClient.invalidateQueries({ queryKey: ['materialCosts', productId] });
    queryClient.invalidateQueries({ queryKey: ['product', productId] });
  };


  // ── Drawer ──────────────────────────────────────
  const handleOpenDrawer = () => { form.resetFields(); setPreviewCode(''); setPreviewRate(null); setPreviewDesc(''); setDrawerVisible(true); };
  const handleCloseDrawer = () => { setDrawerVisible(false); form.resetFields(); setPreviewCode(''); setPreviewRate(null); setPreviewDesc(''); };
  const handleOpenProductionDrawer = () => setProductionDrawerVisible(true);
  const handleCloseProductionDrawer = () => setProductionDrawerVisible(false);
  const handleFormChange = (_, v) => { setPreviewCode(v.code || ''); setPreviewRate(v.rate || null); setPreviewDesc(v.description || ''); };
  const handleCreatePieceCode = (values) => {
    createPieceCodeMutation.mutate({ code: values.code.trim().toUpperCase(), rate: Number(values.rate), description: values.description?.trim() || undefined });
  };

  // ── Styles ──────────────────────────────────────
  const cardStyle = {
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)',
    border: '1px solid #E2E8F0',
    backgroundColor: '#ffffff',
  };

  // ── Table Columns ────────────────────────────────
  const columns = [
    {
      title: '#',
      key: 'index',
      width: 44,
      render: (_, __, index) => <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.8rem' }}>{index + 1}</span>,
    },
    {
      title: 'Piece Code',
      dataIndex: 'code',
      key: 'code',
      // render: (code) => (
      //   <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9rem', color: '#6366F1', backgroundColor: '#EEF2FF', padding: '3px 10px', borderRadius: 6, letterSpacing: 0.5, border: '1px solid #C7D2FE' }}>
      //     {code}
      //   </span>
      // ),
      sorter: (a, b) => a.code.localeCompare(b.code),
    },
    {
      title: 'Fixed Rate',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate) => <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#059669' }}>₹{Number(rate).toLocaleString('en-IN')}</span>,
      sorter: (a, b) => (a.rate || 0) - (b.rate || 0),
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'status',
      render: (active) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px 10px',
          borderRadius: 12,
          fontSize: '0.78rem',
          fontWeight: 700,
          color: active ? '#166534' : '#991B1B',
          backgroundColor: active ? '#DCFCE7' : '#FEE2E2',
        }}>
          {active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      align: 'center',
      render: (_, record) => (
        isPurchasedProduct ? (
          <Tooltip title="Piece code actions are not available for purchased products" placement="top">
            <Space size={6}>
              <Button
                type="text"
                size="small"
                icon={<StopOutlined />}
                disabled
                style={{
                  color: '#94A3B8',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  borderRadius: 6,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                disabled
                style={{
                  color: '#94A3B8',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  borderRadius: 6,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </Space>
          </Tooltip>
        ) : (
          <Space size={6}>
            <Tooltip title={record.active ? 'Deactivate' : 'Activate'} placement="top">
              <Popconfirm
                title={record.active ? 'Deactivate this piece code? Once inactive, it will not show in the table.' : 'Activate this piece code?'}
                onConfirm={() => handleTogglePieceCodeStatus(record)}
                okText={record.active ? 'Deactivate' : 'Activate'}
                okButtonProps={{ danger: record.active }}
                cancelText="Cancel"
                placement="topRight"
              >
                <Button
                  type="text"
                  size="small"
                  icon={record.active ? <StopOutlined /> : <CheckCircleOutlined />}
                  loading={updateStatusMutation.isLoading && togglingPieceCodeId === record.id}
                  style={{
                    color: record.active ? '#B45309' : '#047857',
                    backgroundColor: record.active ? '#FEF3C7' : '#DCFCE7',
                    border: '1px solid',
                    borderColor: record.active ? '#FDE68A' : '#6EE7B7',
                    borderRadius: 6,
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
              </Popconfirm>
            </Tooltip>
            <Tooltip title="Delete" placement="top">
              <Popconfirm title="Delete this piece code?" description="This action cannot be undone." onConfirm={() => deletePieceCode(record.id)} okText="Delete" okButtonProps={{ danger: true }} cancelText="Cancel" placement="topRight">
                <Button type="text" size="small" icon={<DeleteOutlined />} loading={deletePieceCodeMutation.isLoading && deletingPieceCodeId === record.id}
                  style={{ color: '#EF4444', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              </Popconfirm>
            </Tooltip>
          </Space>
        )
      ),
    },
  ];

  // Profit derived from a cost + selling price pair. Returns null when either
  // side is missing so callers can render a neutral placeholder.
  const computeProfit = (cost, salePrice) => {
    const c = Number(cost);
    const s = Number(salePrice);
    if (!salePrice && salePrice !== 0) return null;
    if (Number.isNaN(c) || Number.isNaN(s)) return null;
    const amount = s - c;
    const pct = c > 0 ? (amount / c) * 100 : null;
    return { amount, pct };
  };

  const ProfitBadge = ({ cost, salePrice }) => {
    const profit = computeProfit(cost, salePrice);
    if (!profit) {
      return <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>—</span>;
    }
    const positive = profit.amount >= 0;
    const color = positive ? '#047857' : '#B91C1C';
    const bg = positive ? '#ECFDF5' : '#FEF2F2';
    const border = positive ? '#A7F3D0' : '#FECACA';
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        backgroundColor: bg, color, border: `1px solid ${border}`,
        borderRadius: 20, padding: '2px 9px', fontSize: '0.78rem', fontWeight: 700,
      }}>
        {positive ? <RiseOutlined style={{ fontSize: '0.7rem' }} /> : <FallOutlined style={{ fontSize: '0.7rem' }} />}
        {profit.pct != null ? `${positive ? '+' : ''}${profit.pct.toFixed(1)}%` : '—'}
        <span style={{ fontWeight: 500, opacity: 0.8 }}>
          ({positive ? '+' : '−'}₹{Math.abs(profit.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })})
        </span>
      </span>
    );
  };

  const materialcolumns = [
    {
      title: '#',
      width: 44,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Effective From',
      dataIndex: 'effectiveFrom',
      render: (date) => (
        <Space size={6}>
          <CalendarOutlined style={{ color: '#64748B' }} />
          {dayjs(date).format('DD-MMM-YYYY')}
        </Space>
      ),
    },
    {
      title: 'Cost (₹)',
      dataIndex: 'cost',
      align: 'right',
      render: (value) => (
        <span style={{ fontWeight: 600, color: '#D97706' }}>
          ₹{Number(value).toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Sale Price (₹)',
      dataIndex: 'salePrice',
      align: 'right',
      render: (value) => (
        value || value === 0 ? (
          <span style={{ fontWeight: 700, color: '#059669' }}>
            ₹{Number(value).toFixed(2)}
          </span>
        ) : <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Not set</span>
      ),
    },
    {
      title: 'Profit',
      align: 'right',
      render: (_, record) => (
        <ProfitBadge cost={record.cost} salePrice={record.salePrice} />
      ),
    },
    {
      title: 'Actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => editMaterialCost(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this pricing row?"
            onConfirm={() => deleteMaterialCost(record.id)}
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];


  // ── Loading / Error States ───────────────────────
  if (productLoading) {
    return (
      <ConfigProvider theme={{ token: { colorPrimary: '#6366F1', borderRadius: 8 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card style={cardStyle}><Skeleton active paragraph={{ rows: 3 }} /></Card>
          <Row gutter={[16, 16]}>{[1, 2, 3, 4].map(i => <Col xs={24} sm={12} xl={6} key={i}><Card style={cardStyle}><Skeleton active paragraph={{ rows: 2 }} /></Card></Col>)}</Row>
        </Box>
      </ConfigProvider>
    );
  }

  if (productError || !product) {
    return (
      <ConfigProvider theme={{ token: { colorPrimary: '#6366F1', borderRadius: 8 } }}>
        <Result status="error" title="Product Not Found" subTitle={productFetchError?.message || 'Could not retrieve this product.'}
          extra={[
            <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>Back to Products</Button>,
            <Button key="retry" type="primary" icon={<ReloadOutlined />} onClick={() => refetchProduct()}>Retry</Button>,
          ]} />
      </ConfigProvider>
    );
  }

  const productIcon = getProductIcon(product.iconName, product.name);
  const isPurchasedProduct = product.source === 'PURCHASED';

  const sourceIcon =
    product.source === 'PURCHASED'
      ? <ShoppingCartOutlined style={{ color: '#94A3B8', fontSize: '0.85rem' }} />
      : product.source === 'MANUFACTURED'
        ? <BuildOutlined style={{ color: '#94A3B8', fontSize: '0.85rem' }} />
        : <LoadingOutlined style={{ color: '#94A3B8', fontSize: '0.85rem' }} />;

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#6366F1', borderRadius: 8, fontFamily: '"Inter", "Helvetica", "Arial", sans-serif' } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '4px 0' }}>

        {/* ── Breadcrumb bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.88rem' }}>
            <span
              onClick={() => navigate(-1)}
              style={{ color: '#6366F1', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <ArrowLeftOutlined />
              Back
            </span>
            <span style={{ color: '#CBD5E1', fontSize: '0.75rem' }}>›</span>
            <span
              onClick={() => navigate('/products')}
              style={{ color: '#6366F1', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              🏠 Products
            </span>
            <span style={{ color: '#CBD5E1', fontSize: '0.75rem' }}>›</span>
            <span style={{ color: '#1E293B', fontWeight: 700 }}>{product.name}</span>
          </div>
        </div>

        {/* ── Hero Product Card (LIGHT) ── */}
        <Card
          style={{ ...cardStyle, background: '#FFFFFF' }}
          bodyStyle={{ padding: '24px 28px' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            {/* Left: Icon + Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {/* Large Product Icon */}
              <div style={{
                width: 100, height: 100, borderRadius: 16,
                backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3.5rem', flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}>
                {productIcon}
              </div>

              {/* Product Info */}
              <div>
                {/* Name + Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', letterSpacing: -0.5, display: 'inline-flex', alignItems: 'center' }}>
                    {product.name}
                    <HeadingInfo text="Piece codes, rates, material cost and production history for this product." />
                  </h1>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    backgroundColor: product.active ? '#DCFCE7' : '#FEF2F2',
                    color: product.active ? '#16A34A' : '#DC2626',
                    fontSize: '0.72rem', fontWeight: 700,
                    padding: '3px 10px', borderRadius: 20,
                    border: `1px solid ${product.active ? '#BBF7D0' : '#FCA5A5'}`,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: product.active ? '#16A34A' : '#DC2626' }} />
                    {product.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Description */}
                <p style={{ margin: '0 0 14px', color: '#64748B', fontSize: '0.88rem' }}>
                  {product.description || <span style={{ fontStyle: 'italic', color: '#CBD5E1' }}>No description</span>}
                </p>

                {/* Metadata Row */}
                <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <IdcardOutlined style={{ color: '#94A3B8', fontSize: '0.85rem' }} />
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Product ID</div>
                      <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, fontFamily: 'monospace' }}>
                        {product.id || '—'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    {sourceIcon}
                    <div>
                      <div
                        style={{
                          fontSize: '0.68rem',
                          color: '#94A3B8',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        Source
                      </div>

                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#475569',
                          fontWeight: 600,
                          fontFamily: 'monospace',
                        }}
                      >
                        {product.source || '—'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <CalendarOutlined style={{ color: '#94A3B8', fontSize: '0.85rem' }} />
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Created On</div>
                      <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                        {product.createdAt ? dayjs(product.createdAt).format('DD-MMM-YYYY') : '—'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <ClockCircleOutlined style={{ color: '#94A3B8', fontSize: '0.85rem' }} />
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Last Updated</div>
                      <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                        {product.updatedAt ? dayjs(product.updatedAt).format('DD-MMM-YYYY') : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── 4 KPI Metric Cards ── */}
        <Row gutter={[16, 16]}>
          {/* Card 1: Total Production Qty */}
          <Col xs={24} sm={12} xl={6}>
            <Card style={cardStyle} bodyStyle={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: 8 }}>Total Production Qty</div>
                  {productionLoading ? <Skeleton.Input active size="small" style={{ width: 80 }} /> : (
                    <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>
                      {totalProductionQty.toLocaleString('en-IN')}
                    </div>
                  )}
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 4 }}>Pcs</div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: 2 }}>All time production</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingOutlined style={{ color: '#6366F1', fontSize: '1.1rem' }} />
                  </div>
                  <Sparkline color="#6366F1" />
                  <Button type="link" size="small" onClick={handleOpenProductionDrawer} style={{ color: '#2563EB', fontWeight: 700, padding: 0 }}>View All</Button>
                </div>
              </div>
            </Card>
          </Col>

          {/* Card 2: Total Inventory Generated */}
          <Col xs={24} sm={12} xl={6}>
            <Card style={cardStyle} bodyStyle={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: 8 }}>Total Inventory Generated</div>
                  {productionLoading ? <Skeleton.Input active size="small" style={{ width: 100 }} /> : (
                    <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#059669', lineHeight: 1 }}>
                      ₹{totalInventoryAmount.toLocaleString('en-IN')}
                    </div>
                  )}
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 4 }}>Value</div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: 2 }}>From all production</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DollarCircleOutlined style={{ color: '#059669', fontSize: '1.1rem' }} />
                  </div>
                  <Sparkline color="#10B981" />
                </div>
              </div>
            </Card>
          </Col>

          {/* Card 3: Total Piece Codes */}
          <Col xs={24} sm={12} xl={6}>
            <Card style={cardStyle} bodyStyle={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: 8 }}>Total Piece Codes</div>
                  {pieceCodesLoading ? <Skeleton.Input active size="small" style={{ width: 60 }} /> : (
                    <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>
                      {totalPieceCodes}
                    </div>
                  )}
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 4 }}>Codes</div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: 2 }}>Across this product</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarcodeOutlined style={{ color: '#0284C7', fontSize: '1.1rem' }} />
                  </div>
                  <Sparkline color="#0EA5E9" />
                </div>
              </div>
            </Card>
          </Col>

          {/* Card 4: Current Sale Price (with cost + profit) */}
          <Col xs={24} sm={12} xl={6}>
            <Card style={cardStyle} bodyStyle={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: 8 }}>Current Sale Price</div>
                  {materialCostLoading ? <Skeleton.Input active size="small" style={{ width: 80 }} /> : (
                    <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#059669', lineHeight: 1 }}>
                      {currentMaterialCost && (currentMaterialCost.salePrice || currentMaterialCost.salePrice === 0)
                        ? `₹${Number(currentMaterialCost.salePrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '—'}
                    </div>
                  )}
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {currentMaterialCost ? (
                      <>
                        <span>Cost ₹{Number(currentMaterialCost.cost).toLocaleString('en-IN')}</span>
                        <ProfitBadge cost={currentMaterialCost.cost} salePrice={currentMaterialCost.salePrice} />
                      </>
                    ) : <span>No pricing set</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RiseOutlined style={{ color: '#059669', fontSize: '1.1rem' }} />
                  </div>
                  <Sparkline color="#10B981" />
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* ── Main 2-Column Layout ── */}
        <Row gutter={[20, 20]}>
          {/* Left Column: Piece Code Table */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarcodeOutlined style={{ fontSize: '0.85rem', color: '#6366F1' }} />
                  </div>
                  <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem' }}>Piece Code Management</span>
                </Space>
              }
              extra={
                <Space>
                  <Tooltip title={isPurchasedProduct ? 'Piece codes do not apply to purchased products' : 'Add a new piece code'}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleOpenDrawer}
                      disabled={isPurchasedProduct}
                      style={{ borderRadius: 6, fontWeight: 600, height: 34 }}
                    >
                      Add Piece Code
                    </Button>
                  </Tooltip>
                </Space>
              }
              style={cardStyle}
              bodyStyle={{ padding: 0 }}
            >
              <div style={{ backgroundColor: isPurchasedProduct ? '#FEF2F2' : '#FFFBEB', borderBottom: `1px solid ${isPurchasedProduct ? '#FECACA' : '#FDE68A'}`, padding: '9px 20px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <InfoCircleOutlined style={{ color: isPurchasedProduct ? '#B45309' : '#D97706', fontSize: '0.85rem', flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', color: isPurchasedProduct ? '#92400E' : '#92400E' }}>
                  {isPurchasedProduct ? (
                    <><strong>Purchase products do not use piece codes.</strong> Piece code pricing applies only to manufactured products.</>
                  ) : (
                    <><strong>Immutable Pricing:</strong> Rates cannot be edited once set. To change pricing, create a new Piece Code. Old production history remains unchanged.</>
                  )}
                </span>
              </div>
              <Table
                className="custom-table"
                rowKey="id"
                loading={pieceCodesLoading}
                dataSource={pieceCodes.map((pc) => ({ ...pc, key: pc.id }))}
                columns={columns}
                pagination={{
                  defaultPageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ['5', '10', '25', '50'],
                  showTotal: (total, range) =>
                    `Showing ${range[0]} to ${range[1]} of ${total} entries`,
                  style: {
                    margin: '12px 20px',
                  },
                }}
                size="small"
              />
            </Card>
          </Col>

          {/* Right Column: Pricing History (cost + sale price + profit) */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space wrap>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DollarOutlined style={{ fontSize: '0.85rem', color: '#D97706' }} />
                  </div>
                  <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem' }}>Pricing History</span>
                  {currentMaterialCost && (currentMaterialCost.salePrice || currentMaterialCost.salePrice === 0) ? (
                    <ProfitBadge cost={currentMaterialCost.cost} salePrice={currentMaterialCost.salePrice} />
                  ) : null}
                </Space>
              }
              extra={
                <Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setMaterialCostModalOpen(true)}
                    style={{ borderRadius: 6, fontWeight: 600, height: 34 }}
                  >
                    Add Pricing
                  </Button>
                </Space>
              }
              style={cardStyle}
              bodyStyle={{ padding: 0 }}
            >
              {/* Info Banner */}
              <div style={{ backgroundColor: '#EFF6FF', borderBottom: '1px solid #BFDBFE', padding: '9px 20px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <InfoCircleOutlined style={{ color: '#2563EB', fontSize: '0.85rem', flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', color: '#1E40AF' }}>
                  Cost &amp; sale price are versioned by Effective From date — add a new row to change pricing. Production uses the latest cost; New Sale auto-fills the latest sale price and shows the profit %.
                </span>
              </div>

              <Table
                className="custom-table"
                rowKey="id"
                loading={materialCostLoading}
                dataSource={materialCosts}
                columns={materialcolumns}
                scroll={{ x: 'max-content' }}
                locale={{ emptyText: 'No pricing set yet. Add cost & sale price so production and New Sale use them.' }}
                pagination={{
                  defaultPageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ['5', '10', '25', '50'],
                  showTotal: (total, range) =>
                    `Showing ${range[0]} to ${range[1]} of ${total} entries`,
                  style: {
                    margin: '12px 20px',
                  },
                }}
                size="small"
              />
            </Card>
          </Col>
        </Row>

        {/* ── Latest Activity (Full Width) ── */}
        <Card
          title={
            <Space>
              <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClockCircleOutlined style={{ fontSize: '0.85rem', color: '#EA580C' }} />
              </div>
              <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem' }}>Latest Activity</span>
            </Space>
          }
          extra={
            hasMoreActivities ? (
              <span
                onClick={() => setShowAllActivities(!showAllActivities)}
                style={{
                  fontSize: '0.82rem',
                  color: '#2563EB',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1D4ED8'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#2563EB'}
              >
                {showAllActivities ? 'Show Less' : 'View All'}
                <RightOutlined style={{ fontSize: '0.7rem', transform: showAllActivities ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s' }} />
              </span>
            ) : null
          }
          style={cardStyle}
          bodyStyle={{ padding: '20px 24px' }}
        >
          {allActivities.length > 0 ? (
            <>
              {/* Horizontal scrolling row – first 5 activities */}
              <div style={{
                display: 'flex',
                gap: 16,
                overflowX: 'auto',
                paddingBottom: 4,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}>
                {allActivities.slice(0, ACTIVITY_PREVIEW_COUNT).map((act) => {
                  const iconConfig = getActivityIcon(act.type);
                  return (
                    <div
                      key={act.id}
                      style={{
                        minWidth: 200,
                        flex: '1 1 0',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                        padding: '14px 16px',
                        borderRadius: 10,
                        backgroundColor: '#FAFAFA',
                        border: '1px solid #F1F5F9',
                        transition: 'box-shadow 0.2s, border-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                        e.currentTarget.style.borderColor = '#E2E8F0';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = '#F1F5F9';
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        backgroundColor: iconConfig.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {iconConfig.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#1E293B', marginBottom: 2 }}>
                          {act.title}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#64748B', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                          {act.subtitle}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ClockCircleOutlined style={{ fontSize: '0.55rem' }} />
                          {act.date}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <style>{`.ant-card-body > div::-webkit-scrollbar { display: none; }`}</style>

              {/* Expanded activities below (shown on View All click) */}
              {showAllActivities && allActivities.length > ACTIVITY_PREVIEW_COUNT && (
                <div style={{
                  display: 'flex',
                  gap: 16,
                  overflowX: 'auto',
                  paddingBottom: 4,
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}>
                  {allActivities.slice(ACTIVITY_PREVIEW_COUNT).map((act) => {
                    const iconConfig = getActivityIcon(act.type);
                    return (
                      <div
                        key={act.id}
                        style={{
                          minWidth: 200,
                          flex: '1 1 0',
                          display: 'flex',
                          gap: 12,
                          alignItems: 'flex-start',
                          padding: '14px 16px',
                          borderRadius: 10,
                          backgroundColor: '#FAFAFA',
                          border: '1px solid #F1F5F9',
                          transition: 'box-shadow 0.2s, border-color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FAFAFA'}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          backgroundColor: iconConfig.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {iconConfig.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1E293B' }}>
                            {act.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', whiteSpace: 'pre-line', lineHeight: 1.4, marginTop: 1 }}>
                            {act.subtitle}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                            {act.date}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: 2 }}>
                            {act.dateBy}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <Empty description="No activity yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>

        {/* ── Add Piece Code Drawer ── */}
        <Drawer
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarcodeOutlined style={{ color: '#6366F1', fontSize: '0.95rem' }} />
              </div>
              Add Piece Code
            </span>
          }
          placement="right"
          width={480}
          onClose={handleCloseDrawer}
          open={drawerVisible}
          bodyStyle={{ backgroundColor: '#F8FAFC', padding: 24 }}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '10px 16px' }}>
              <Button onClick={handleCloseDrawer} style={{ borderRadius: 8, fontWeight: 600, height: 40 }}>Cancel</Button>
              <Button type="primary" icon={<PlusOutlined />} loading={createPieceCodeMutation.isPending} onClick={() => form.submit()} style={{ borderRadius: 8, fontWeight: 700, height: 40, paddingInline: 20 }}>
                Create Piece Code
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Context */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: '2rem' }}>{productIcon}</div>
              <div>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>{product.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500 }}>{totalPieceCodes} existing codes · {activePieceCodes} active</div>
              </div>
            </div>

            {/* Warning */}
            <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', color: '#92400E', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <InfoCircleOutlined style={{ color: '#D97706', marginTop: 2, flexShrink: 0 }} />
              <span>Rate is <strong>permanently fixed</strong> and cannot be edited after creation. If pricing changes, create a new piece code.</span>
            </div>

            {/* Form */}
            <Card style={{ borderRadius: 10, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: 20 }}>
              <Form form={form} layout="vertical" onFinish={handleCreatePieceCode} onValuesChange={handleFormChange} autoComplete="off" requiredMark={false}>
                <Form.Item name="code" label={<span style={{ fontWeight: 700, color: '#374151' }}>Piece Code *</span>}
                  rules={[{ required: true, message: 'Piece code is required.' }, { whitespace: true, message: 'Cannot be blank.' }, { pattern: /^[A-Za-z0-9\-_]+$/, message: 'Only letters, numbers, hyphens, underscores.' }]}>
                  <Input placeholder="e.g. SHIRT-001" size="large" style={{ borderRadius: 8, fontFamily: 'monospace', fontWeight: 700 }}
                    onChange={(e) => { form.setFieldValue('code', e.target.value.toUpperCase()); setPreviewCode(e.target.value.toUpperCase()); }} />
                </Form.Item>
                <Form.Item name="rate" label={<span style={{ fontWeight: 700, color: '#374151' }}>Fixed Rate (₹) *</span>}
                  rules={[{ required: true, message: 'Rate is required.' }, { validator: (_, v) => (!v && v !== 0) || Number(v) > 0 ? Promise.resolve() : Promise.reject('Rate must be > ₹0.') }]}>
                  <InputNumber placeholder="e.g. 10" size="large" min={0.01} precision={2} prefix="₹" style={{ width: '100%', borderRadius: 8 }} onChange={(val) => setPreviewRate(val)} />
                </Form.Item>
              </Form>
            </Card>

            {/* Live Preview */}
            <PieceCodePreview code={previewCode} rate={previewRate} description={previewDesc} />
          </div>
        </Drawer>

        <Drawer
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCartOutlined style={{ color: '#0C4A6E', fontSize: '0.95rem' }} />
              </div>
              Production Overview
            </span>
          }
          placement="right"
          width={520}
          onClose={handleCloseProductionDrawer}
          open={productionDrawerVisible}
          bodyStyle={{ backgroundColor: '#F8FAFC', padding: 24 }}
        >
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Production items</div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{filteredProductionItems.length} matching rows</div>
            </div>
            <Button type="link" onClick={() => { setSearchQuery(''); setDateRange([null, null]); }} style={{ color: '#2563EB', fontWeight: 700, padding: 0 }}>Reset filters</Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Input.Search
              placeholder="Search employee or piece code"
              allowClear
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={(value) => setSearchQuery(value)}
              style={{ width: '100%' }}
            />
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates || [null, null])}
              format="DD-MMM-YYYY"
              style={{ width: '100%' }}
            />
          </div>
          <Table
            columns={[
              {
                title: 'Employee Name',
                dataIndex: 'employeeName',
                key: 'employeeName',
                render: (name) => name || 'Unknown',
              },
              {
                title: 'Production Date',
                dataIndex: 'productionDate',
                key: 'productionDate',
                render: (date) => dayjs(date).format('DD-MMM-YYYY'),
                sorter: (a, b) => new Date(b.productionDate) - new Date(a.productionDate),
                defaultSortOrder: 'descend',
              },
              {
                title: 'Quantity',
                dataIndex: 'quantity',
                key: 'quantity',
                align: 'right',
                render: (quantity) => quantity?.toLocaleString('en-IN') ?? '-',
              },
              {
                title: 'Rate (₹)',
                dataIndex: 'rate',
                key: 'rate',
                align: 'right',
                render: (rate) => rate != null ? `₹${Number(rate).toLocaleString('en-IN')}` : '-',
              },
              {
                title: 'Amount (₹)',
                dataIndex: 'amount',
                key: 'amount',
                align: 'right',
                render: (amount) => amount != null ? `₹${Number(amount).toLocaleString('en-IN')}` : '-',
              },
            ]}
            dataSource={filteredProductionItems}
            rowKey={(item) => `${item.entryId}-${item.pieceCodeId}-${item.productId}-${item.productionDate}`}
            pagination={{ pageSize: 20, showSizeChanger: false, showQuickJumper: true, position: ['bottomRight'] }}
            locale={{ emptyText: 'No production items for this product.' }}
            size="small"
          />
        </Drawer>

        {/* add material model */}
        <MaterialCostModal
          open={materialCostModalOpen}
          productId={productId}
          editingMaterialCost={editingMaterialCost}
          onClose={handleCloseMaterialCostModal}
          onSuccess={handleMaterialCostSuccess}
        />

      </Box>
    </ConfigProvider>
  );
};

export default ProductDetailsPage;
