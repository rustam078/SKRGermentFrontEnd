import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ConfigProvider,
  Card,
  Row,
  Col,
  Table,
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  InputNumber,
  Space,
  Statistic,
  notification,
  Divider,
  Tooltip,
  Modal,
  Drawer,
  Tag,
  Dropdown,
  Popover,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  FileAddOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  BarcodeOutlined,
  AppstoreOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';

import { productionService } from '../../services/productionService';
import { employeeService } from '../../services/employee.service';
import { productService } from '../../services/productService';
import { getProductIconAndLabel } from '../../utils/product-icons';
import { IProductionEntry } from '../../types/production';
import HeadingInfo from '../../components/common/HeadingInfo';
import { getCurrencySymbol } from '../../utils/currency';
import { usePermissions } from '../../hooks/usePermissions';

const ProductionPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();

  // Responsive Drawer width tracking
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getDrawerWidth = () => {
    if (windowWidth > 992) return 780;
    if (windowWidth > 768) return '72%';
    return '100%';
  };

  // Drawer visibility state
  const [drawerVisible, setDrawerVisible] = useState(false);
  // Filter popover visibility
  const [filterOpen, setFilterOpen] = useState(false);

  // "View items" modal — lists all products in a production entry
  const [itemsModal, setItemsModal] = useState<{ open: boolean; record: IProductionEntry | null }>({
    open: false,
    record: null,
  });
  const openItems = (record: IProductionEntry) => setItemsModal({ open: true, record });
  const closeItems = () => setItemsModal({ open: false, record: null });

  const handleDownloadPdf = async (record: IProductionEntry) => {
    try {
      await productionService.downloadProductionPdf(record.id);
    } catch (e: any) {
      notification.error({ message: 'PDF download failed', description: e.message, placement: 'topRight' });
    }
  };
  const handleDownloadExcel = async (record: IProductionEntry) => {
    try {
      await productionService.downloadProductionExcel(record.id);
    } catch (e: any) {
      notification.error({ message: 'Excel download failed', description: e.message, placement: 'topRight' });
    }
  };

  // Active filters for production history table
  const [historyFilters, setHistoryFilters] = useState<{
    fromDate?: string;
    toDate?: string;
    employeeId?: string;
    productId?: string;
  }>({});

  // Per-row piece code options (map: rowIndex → IPieceCode[])
  const [pieceCodesByRow, setPieceCodesByRow] = useState<Record<number, any[]>>({});
  const [pieceCodesLoadingByRow, setPieceCodesLoadingByRow] = useState<Record<number, boolean>>({});

  // Query 1: Fetch Employees list
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: employeeService.getEmployees,
  });
  const employees = employeesData?.data || [];

  // Query 2: Fetch Products list
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: productService.getProducts,
  });
  const products = productsData?.data || [];

  // Query 3: Fetch filtered production history entries
  const { data: productionResponse, isLoading: listLoading } = useQuery({
    queryKey: ['productionRecent', historyFilters],
    queryFn: () => productionService.getProduction(historyFilters),
  });
  const entries = productionResponse?.data || [];

  const quickFilter = Form.useWatch('quickFilter', filterForm) || 'Custom Range';
  const isCustom = quickFilter === 'Custom Range';

  // Watch form items for live summary
  const formItems = Form.useWatch('items', form) || [];

  // ── Mutations ────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: productionService.createProduction,
    onSuccess: (res) => {
      notification.success({
        message: 'Success',
        description: res.message || 'Production entry created successfully',
        placement: 'topRight',
      });
      queryClient.invalidateQueries({ queryKey: ['productionRecent'] });
      queryClient.invalidateQueries({ queryKey: ['employeeDetails'] });
      queryClient.invalidateQueries({ queryKey: ['employeeCalendar'] });
      // Also refresh the cross-page views a production entry feeds into.
      queryClient.invalidateQueries({ queryKey: ['productionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['production'] });
      setDrawerVisible(false);
      form.resetFields();
      setPieceCodesByRow({});
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create entry';
      notification.error({
        message: 'Error Saving Production',
        description: errorMsg,
        placement: 'topRight',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: productionService.deleteProduction,
    onSuccess: (res) => {
      notification.success({
        message: 'Success',
        description: res?.message || 'Production entry deleted successfully',
        placement: 'topRight',
      });
      queryClient.invalidateQueries({ queryKey: ['productionRecent'] });
      queryClient.invalidateQueries({ queryKey: ['employeeDetails'] });
      queryClient.invalidateQueries({ queryKey: ['employeeCalendar'] });
      // Also refresh the cross-page views a production entry feeds into.
      queryClient.invalidateQueries({ queryKey: ['productionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['production'] });
    },
    onError: (error: any) => {
      notification.error({
        message: 'Error',
        description: error.message || 'Failed to delete entry',
        placement: 'topRight',
      });
    },
  });

  // ── Currency formatter ──────────────────────────────────

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // ── Piece Code loading when product is selected ─────────

  const loadPieceCodesForRow = useCallback(async (productId: string, rowIndex: number) => {
    if (!productId) {
      setPieceCodesByRow((prev) => ({ ...prev, [rowIndex]: [] }));
      return;
    }
    setPieceCodesLoadingByRow((prev) => ({ ...prev, [rowIndex]: true }));
    try {
      const res = await productService.getActivePieceCodes(productId);
      const codes = res?.data || [];
      setPieceCodesByRow((prev) => ({ ...prev, [rowIndex]: codes }));
    } catch (e) {
      console.error('Error fetching piece codes for row', rowIndex, e);
      setPieceCodesByRow((prev) => ({ ...prev, [rowIndex]: [] }));
    } finally {
      setPieceCodesLoadingByRow((prev) => ({ ...prev, [rowIndex]: false }));
    }
  }, []);

  // When product changes for a row:
  const handleProductChange = async (productId: string, rowIndex: number) => {
    // Clear piece code and rate for this row
    form.setFieldValue(['items', rowIndex, 'pieceCodeId'], undefined);
    form.setFieldValue(['items', rowIndex, 'rate'], 0);
    form.setFieldValue(['items', rowIndex, 'amount'], 0);
    // Load piece codes
    await loadPieceCodesForRow(productId, rowIndex);
  };

  // When piece code changes for a row:
  const handlePieceCodeChange = (pieceCodeId: string, rowIndex: number) => {
    const codes = pieceCodesByRow[rowIndex] || [];
    const selected = codes.find((pc: any) => pc.id === pieceCodeId);
    const rate = selected?.rate || 0;
    form.setFieldValue(['items', rowIndex, 'rate'], rate);
    const qty = Number(form.getFieldValue(['items', rowIndex, 'quantity']) || 0);
    form.setFieldValue(['items', rowIndex, 'amount'], qty * rate);
  };

  // ── Form value change handler ───────────────────────────

  const handleFormValuesChange = (changedValues: any, allValues: any) => {
    if (changedValues.items) {
      const changedIndex = changedValues.items.findIndex(
        (item: any) => item && item.quantity !== undefined
      );
      if (changedIndex > -1) {
        const item = allValues.items[changedIndex];
        if (item) {
          const qty = Number(item.quantity || 0);
          const rate = Number(item.rate || 0);
          const amt = qty * rate;
          if (item.amount !== amt) {
            form.setFieldValue(['items', changedIndex, 'amount'], amt);
          }
        }
      }
    }
  };

  // ── Delete production entry ─────────────────────────────

  const handleDeleteRow = (record: IProductionEntry) => {
    Modal.confirm({
      title: 'Delete Production Entry',
      icon: <ExclamationCircleOutlined style={{ color: '#EF4444' }} />,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        await deleteMutation.mutateAsync(record.id);
      },
    });
  };

  // ── Save handler ────────────────────────────────────────

  const handleSaveEntry = (values: any) => {
    const items = values.items || [];

    // Validate each row has piece code selected
    const missingPieceCode = items.some((item: any) => item && item.productId && !item.pieceCodeId);
    if (missingPieceCode) {
      notification.error({
        message: 'Validation Error',
        description: 'Please select a Piece Code for each product row.',
        placement: 'topRight',
      });
      return;
    }

    // Front-end duplicate piece code check
    const pieceCodeIds = items.map((item: any) => item.pieceCodeId).filter(Boolean);
    const uniquePieceCodeIds = new Set(pieceCodeIds);
    if (uniquePieceCodeIds.size !== pieceCodeIds.length) {
      notification.error({
        message: 'Validation Error',
        description: 'Duplicate piece codes are not allowed in the same production entry.',
        placement: 'topRight',
      });
      return;
    }

    const payload = {
      employeeId: values.employeeId,
      productionDate: values.productionDate.format('YYYY-MM-DD'),
      remarks: values.remarks,
      items: items.map((item: any) => ({
        productId: item.productId,
        pieceCodeId: item.pieceCodeId,
        quantity: Number(item.quantity || 0),
        rate: Number(item.rate || 0),
        amount: Number(item.amount || 0),
      })),
    };

    createMutation.mutate(payload);
  };

  // ── Drawer open/close ───────────────────────────────────

  const handleOpenDrawer = () => {
    form.resetFields();
    setPieceCodesByRow({});
    form.setFieldsValue({
      productionDate: dayjs(),
      items: [{ productId: undefined, pieceCodeId: undefined, quantity: undefined, rate: 0, amount: 0 }],
    });
    setDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    form.resetFields();
    setPieceCodesByRow({});
  };

  // ── Filter handlers ─────────────────────────────────────

  const handleSearchHistory = (values: any) => {
    setHistoryFilters({
      fromDate: values.fromDate ? values.fromDate.format('YYYY-MM-DD') : undefined,
      toDate: values.toDate ? values.toDate.format('YYYY-MM-DD') : undefined,
      employeeId: values.employeeId,
      productId: values.productId,
    });
    setFilterOpen(false);
  };

  const handleResetHistoryFilters = () => {
    filterForm.resetFields();
    setHistoryFilters({});
    setFilterOpen(false);
  };

  // Count of active filters (for the badge on the Filter button)
  const activeFilterCount = Object.values(historyFilters).filter(Boolean).length;

  const handleQuickFilterChange = (val: string) => {
    if (val && val !== 'Custom Range') {
      let fromDateVal = dayjs();
      let toDateVal = dayjs();

      if (val === 'Today') {
        fromDateVal = dayjs().startOf('day');
        toDateVal = dayjs().endOf('day');
      } else if (val === 'Yesterday') {
        fromDateVal = dayjs().subtract(1, 'day').startOf('day');
        toDateVal = dayjs().subtract(1, 'day').endOf('day');
      } else if (val === 'This Week') {
        fromDateVal = dayjs().startOf('week');
        toDateVal = dayjs().endOf('week');
      } else if (val === 'This Month') {
        fromDateVal = dayjs().startOf('month');
        toDateVal = dayjs().endOf('month');
      } else if (val === 'This Quarter') {
        const startMonth = Math.floor(dayjs().month() / 3) * 3;
        fromDateVal = dayjs().month(startMonth).startOf('month');
        toDateVal = dayjs().month(startMonth + 2).endOf('month');
      } else if (val === 'This Year') {
        fromDateVal = dayjs().startOf('year');
        toDateVal = dayjs().endOf('year');
      }

      filterForm.setFieldsValue({ fromDate: fromDateVal, toDate: toDateVal });
      setHistoryFilters({
        fromDate: fromDateVal.format('YYYY-MM-DD'),
        toDate: toDateVal.format('YYYY-MM-DD'),
        employeeId: filterForm.getFieldValue('employeeId'),
        productId: filterForm.getFieldValue('productId'),
      });
    } else if (val === 'Custom Range') {
      filterForm.setFieldsValue({ fromDate: null, toDate: null });
    }
  };

  // ── Live summary stats ──────────────────────────────────

  const liveTotalPieceCodes = formItems.filter((item: any) => item && item.pieceCodeId).length;
  const liveTotalQuantity = formItems.reduce(
    (sum: number, item: any) => sum + (Number(item?.quantity) || 0),
    0
  );
  const liveTotalAmount = formItems.reduce(
    (sum: number, item: any) => sum + (Number(item?.amount) || 0),
    0
  );

  // ── Table summary stats ─────────────────────────────────

  const statsTotalEntries = entries.length;
  const todayStr = dayjs().format('YYYY-MM-DD');
  const statsTodayQty = entries
    .filter((e: any) => e.productionDate === todayStr)
    .reduce((sum: number, e: any) => sum + (e.totalQuantity || 0), 0);
  const statsTodayAmount = entries
    .filter((e: any) => e.productionDate === todayStr)
    .reduce((sum: number, e: any) => sum + (e.totalAmount || 0), 0);
  const statsTotalQty = entries.reduce((sum: number, e: any) => sum + (e.totalQuantity || 0), 0);
  const statsTotalAmount = entries.reduce((sum: number, e: any) => sum + (e.totalAmount || 0), 0);

  const cardStyle = {
    borderRadius: 12,
    boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
    border: '1px solid #E2E8F0',
    backgroundColor: '#ffffff',
  };

  // ── History Table Columns ───────────────────────────────

  const historyColumns = [
    {
      title: 'Production Date',
      dataIndex: 'productionDate',
      key: 'productionDate',
      width: '14%',
      render: (date: string) => (
        <span style={{ fontWeight: 600, color: '#475569' }}>
          {date ? dayjs(date).format('DD-MMM-YYYY') : '-'}
        </span>
      ),
      sorter: (a: IProductionEntry, b: IProductionEntry) =>
        a.productionDate.localeCompare(b.productionDate),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: '20%',
      render: (name: string, record: IProductionEntry) => (
        <div>
          <span style={{ fontWeight: 700, color: '#0F172A', display: 'block' }}>{name}</span>
          <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>{record.employeeCode}</span>
        </div>
      ),
      sorter: (a: IProductionEntry, b: IProductionEntry) =>
        (a.employeeName || '').localeCompare(b.employeeName || ''),
    },
    {
      title: 'Items',
      dataIndex: 'productCount',
      key: 'productCount',
      width: '28%',
      render: (_count: number, record: IProductionEntry) => {
        const items = record.items || [];
        const MAX_INLINE = 2;
        const shown = items.slice(0, MAX_INLINE);
        const extra = items.length - shown.length;
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            {shown.map((item, i) => (
              <Tag
                key={i}
                style={{ margin: 0, borderRadius: 6, background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#334155', fontWeight: 600, padding: '1px 8px' }}
              >
                {getProductIconAndLabel(item.iconName, item.productName || 'Product')}
                <span style={{ color: '#2563EB', marginLeft: 4 }}>×{item.quantity}</span>
              </Tag>
            ))}
            {items.length === 0 && <span style={{ color: '#94A3B8' }}>—</span>}
            {extra > 0 && (
              <Tag
                onClick={() => openItems(record)}
                style={{ margin: 0, cursor: 'pointer', borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', fontWeight: 700, padding: '1px 8px' }}
              >
                +{extra} more
              </Tag>
            )}
            {items.length > 0 && (
              <Tooltip title="View all items">
                <Button
                  type="text"
                  size="small"
                  icon={<AppstoreOutlined style={{ color: '#64748B' }} />}
                  onClick={() => openItems(record)}
                  style={{ height: 22, width: 22, minWidth: 22, padding: 0 }}
                />
              </Tooltip>
            )}
          </div>
        );
      },
      sorter: (a: IProductionEntry, b: IProductionEntry) =>
        (a.productCount || 0) - (b.productCount || 0),
    },
    {
      title: 'Quantity',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      align: 'right' as const,
      width: '12%',
      render: (qty: number) => (
        <span style={{ fontWeight: 700, color: '#2563EB' }}>{(qty || 0).toLocaleString()} Pcs</span>
      ),
      sorter: (a: IProductionEntry, b: IProductionEntry) =>
        (a.totalQuantity || 0) - (b.totalQuantity || 0),
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right' as const,
      width: '13%',
      render: (amt: number) => (
        <span style={{ fontWeight: 800, color: '#10B981' }}>{formatCurrency(amt || 0)}</span>
      ),
      sorter: (a: IProductionEntry, b: IProductionEntry) =>
        (a.totalAmount || 0) - (b.totalAmount || 0),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center' as const,
      width: '8%',
      render: (_: any, record: IProductionEntry) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'pdf', icon: <FilePdfOutlined style={{ color: '#DC2626' }} />, label: 'Download PDF', onClick: () => handleDownloadPdf(record) },
              { key: 'excel', icon: <FileExcelOutlined style={{ color: '#059669' }} />, label: 'Download Excel', onClick: () => handleDownloadExcel(record) },
              ...(can('production', 'delete') ? [
                { type: 'divider' as const },
                { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true, onClick: () => handleDeleteRow(record) },
              ] : []),
            ],
          }}
        >
          <Button type="text" size="small" icon={<MoreOutlined style={{ fontSize: '1.1rem', color: '#475569' }} />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2563EB',
          borderRadius: 8,
          fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <style>{`
          .table-row-even { background-color: #ffffff; }
          .table-row-odd { background-color: #F8FAFC; }
          .row-hover:hover > td { background-color: #F1F5F9 !important; }
        `}</style>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <FileAddOutlined style={{ color: '#2563EB' }} />
              Production Management
              <HeadingInfo text="Manage daily production entries with piece code based pricing." />
            </Typography>
          </div>
          <Space size={10}>
            <Popover
              trigger="click"
              placement="bottomRight"
              open={filterOpen}
              onOpenChange={setFilterOpen}
              content={
                <div style={{ width: 300 }}>
                  <Form
                    form={filterForm}
                    onFinish={handleSearchHistory}
                    layout="vertical"
                    initialValues={{ quickFilter: 'Custom Range' }}
                  >
                    <Form.Item
                      name="quickFilter"
                      label={<span style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Quick Filter</span>}
                      style={{ marginBottom: 12 }}
                    >
                      <Select placeholder="Quick Filter" onChange={handleQuickFilterChange}>
                        <Select.Option value="Today">Today</Select.Option>
                        <Select.Option value="Yesterday">Yesterday</Select.Option>
                        <Select.Option value="This Week">This Week</Select.Option>
                        <Select.Option value="This Month">This Month</Select.Option>
                        <Select.Option value="This Quarter">This Quarter</Select.Option>
                        <Select.Option value="This Year">This Year</Select.Option>
                        <Select.Option value="Custom Range">Custom Range</Select.Option>
                      </Select>
                    </Form.Item>

                    <Row gutter={8}>
                      <Col span={12}>
                        <Form.Item
                          name="fromDate"
                          label={<span style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>From</span>}
                          style={{ marginBottom: 12 }}
                        >
                          <DatePicker format="DD-MMM-YYYY" disabled={!isCustom} style={{ width: '100%', borderRadius: 6 }} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="toDate"
                          label={<span style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>To</span>}
                          style={{ marginBottom: 12 }}
                        >
                          <DatePicker format="DD-MMM-YYYY" disabled={!isCustom} style={{ width: '100%', borderRadius: 6 }} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="employeeId"
                      label={<span style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Employee</span>}
                      style={{ marginBottom: 12 }}
                    >
                      <Select placeholder="Employee" allowClear showSearch optionFilterProp="children">
                        {employees.map((emp: any) => (
                          <Select.Option key={emp.id} value={emp.id}>
                            {emp.fullName}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="productId"
                      label={<span style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Product</span>}
                      style={{ marginBottom: 16 }}
                    >
                      <Select placeholder="Product" allowClear showSearch optionFilterProp="children">
                        {products.filter((p: any) => p.active && p.source != 'PURCHASED')
                          .map((p: any) => (
                            <Select.Option key={p.id} value={p.id}>
                              {getProductIconAndLabel(p.iconName, p.name)}
                            </Select.Option>
                          ))}
                      </Select>
                    </Form.Item>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <Button onClick={handleResetHistoryFilters} icon={<ReloadOutlined />} style={{ borderRadius: 6 }}>
                        Reset
                      </Button>
                      <Button type="primary" htmlType="submit" icon={<SearchOutlined />} style={{ borderRadius: 6 }}>
                        Apply
                      </Button>
                    </div>
                  </Form>
                </div>
              }
            >
              <Badge count={activeFilterCount} size="small">
                <Button icon={<FilterOutlined />} size="large" style={{ borderRadius: 6, fontWeight: 600, height: 44 }}>
                  Filters
                </Button>
              </Badge>
            </Popover>

            {can('production', 'write') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={handleOpenDrawer}
                style={{ borderRadius: 6, fontWeight: 600, height: 44 }}
              >
                Create Production Entry
              </Button>
            )}
          </Space>
        </div>

        {/* ── Summary Cards ── */}
        <Row gutter={[16, 16]}>
          {[
            { label: "Today's Production", value: statsTodayQty, suffix: ' Pcs', icon: <CheckCircleOutlined style={{ color: '#10B981', marginRight: 8 }} />, color: '#10B981' },
            { label: "Today's Amount", value: statsTodayAmount, formatter: (v: any) => formatCurrency(Number(v)), color: '#059669' },
            { label: 'Total Quantity', value: statsTotalQty, suffix: ' Pcs', icon: <CheckCircleOutlined style={{ color: '#F59E0B', marginRight: 8 }} />, color: '#F59E0B' },
            { label: 'Total Amount', value: statsTotalAmount, formatter: (v: any) => formatCurrency(Number(v)), color: '#059669' },
            { label: 'Total Entries', value: statsTotalEntries, icon: <FileAddOutlined style={{ color: '#2563EB', marginRight: 8 }} />, color: '#0F172A' },
          ].map((stat, i) => (
            <Col key={i} xs={24} sm={12} lg={4} style={{ flex: '1 1 180px', maxWidth: '100%' }}>
              <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
                <Statistic
                  title={<span style={{ color: '#475569', fontWeight: 600, fontSize: '0.85rem' }}>{stat.label}</span>}
                  value={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.icon}
                  formatter={stat.formatter as any}
                  valueStyle={{ color: stat.color, fontWeight: 800 }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* ── Production Table ── */}
        <Card style={cardStyle} bodyStyle={{ padding: '0px 16px' }}>
          <Table
            dataSource={entries}
            columns={historyColumns}
            rowKey="id"
            size="middle"
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} entries`,
            }}
            loading={listLoading}
            scroll={{ x: 'max-content' }}
            rowClassName={(_, index) =>
              index % 2 === 0 ? 'table-row-even row-hover' : 'table-row-odd row-hover'
            }
            locale={{
              emptyText: (
                <div style={{ padding: '48px 16px', color: '#94A3B8', textAlign: 'center' }}>
                  No production logs found. Click "Create Production Entry" to log new worker outputs.
                </div>
              ),
            }}
            style={{ borderRadius: 8, overflow: 'hidden' }}
          />
        </Card>

        {/* ── Right-Side Production Form Drawer ── */}
        <Drawer
          title={
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
              Create Production Entry
            </span>
          }
          placement="right"
          width={getDrawerWidth()}
          onClose={handleCloseDrawer}
          open={drawerVisible}
          bodyStyle={{ backgroundColor: '#F8FAFC', padding: 24 }}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '10px 16px' }}>
              <Button onClick={handleCloseDrawer} style={{ borderRadius: 6, fontWeight: 500 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={() => form.submit()}
                icon={<CheckCircleOutlined />}
                loading={createMutation.isPending}
                style={{ borderRadius: 6, fontWeight: 700 }}
              >
                Save Production Entry
              </Button>
            </div>
          }
        >
          {/* Immutability Banner */}
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FEE2E2',
              borderRadius: 8,
              padding: '12px 16px',
              color: '#991B1B',
              fontSize: '0.85rem',
              fontWeight: 500,
              marginBottom: 20,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              lineHeight: 1.4,
            }}
          >
            <InfoCircleOutlined style={{ fontSize: '1.05rem', color: '#EF4444', marginTop: 2 }} />
            <div>
              <strong>Accounting Rule:</strong> Production entries cannot be edited after saving.
              If a mistake is made, delete the entry and create a new one.
            </div>
          </div>

          <Form
            form={form}
            onFinish={handleSaveEntry}
            onValuesChange={handleFormValuesChange}
            layout="vertical"
            initialValues={{
              productionDate: dayjs(),
              items: [{ productId: undefined, pieceCodeId: undefined, quantity: undefined, rate: 0, amount: 0 }],
            }}
            requiredMark={false}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="productionDate"
                  label={<span style={{ fontWeight: 600, color: '#475569' }}>Production Date</span>}
                  rules={[{ required: true, message: 'Production Date is required' }]}
                >
                  <DatePicker style={{ width: '100%', borderRadius: 6 }} format="DD-MMM-YYYY" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="employeeId"
                  label={<span style={{ fontWeight: 600, color: '#475569' }}>Employee</span>}
                  rules={[{ required: true, message: 'Employee is required' }]}
                >
                  <Select placeholder="Select worker" showSearch optionFilterProp="children">
                    {employees
                      .filter((emp: any) => emp.active)
                      .map((emp: any) => (
                        <Select.Option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.employeeCode})
                        </Select.Option>
                      ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="remarks"
              label={<span style={{ fontWeight: 600, color: '#475569' }}>Remarks</span>}
            >
              <Input.TextArea
                placeholder="Enter shift comments or batch notes..."
                rows={2}
                style={{ borderRadius: 6 }}
              />
            </Form.Item>

            <Divider style={{ margin: '12px 0 16px' }} />

            {/* Section Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarcodeOutlined style={{ color: '#2563EB' }} />
                Production Items
              </span>
              <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontStyle: 'italic' }}>
                Select Product → Piece Code → enter Quantity
              </span>
            </div>

            <Form.List name="items">
              {(fields, { add, remove }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {fields.map(({ key, name, ...restField }, idx) => {
                    const rowPieceCodes = pieceCodesByRow[idx] || [];
                    const isLoadingPC = pieceCodesLoadingByRow[idx] || false;
                    const currentProductId = form.getFieldValue(['items', idx, 'pieceCodeId']);
                    const currentRate = form.getFieldValue(['items', idx, 'rate']) || 0;
                    const currentAmount = form.getFieldValue(['items', idx, 'amount']) || 0;

                    return (
                      <div
                        key={key}
                        style={{
                          border: '1px solid #E2E8F0',
                          borderRadius: 10,
                          padding: '14px 12px 10px',
                          backgroundColor: '#FFFFFF',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        }}
                      >
                        {/* Row label */}
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                          Item #{idx + 1}
                        </div>

                        <Row gutter={[8, 0]} align="middle">
                          {/* Product */}
                          <Col xs={24} sm={8}>
                            <Form.Item
                              {...restField}
                              name={[name, 'productId']}
                              label={<span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Product</span>}
                              rules={[{ required: true, message: 'Select product' }]}
                              style={{ margin: 0 }}
                            >
                              <Select
                                placeholder="Select product"
                                onChange={(val) => handleProductChange(val, idx)}
                                showSearch
                                optionFilterProp="children"
                                style={{ borderRadius: 6 }}
                                size="middle"
                              >
                                {products
                                  .filter((p: any) => p.active && p.source != 'PURCHASED')
                                  .map((p: any) => (
                                    <Select.Option key={p.id} value={p.id}>
                                      {getProductIconAndLabel(p.iconName, p.name)}
                                    </Select.Option>
                                  ))}
                              </Select>
                            </Form.Item>
                          </Col>

                          {/* Piece Code */}
                          <Col xs={24} sm={7}>
                            <Form.Item
                              {...restField}
                              name={[name, 'pieceCodeId']}
                              label={<span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Piece Code</span>}
                              rules={[{ required: true, message: 'Select piece code' }]}
                              style={{ margin: 0 }}
                            >
                              <Select
                                placeholder={isLoadingPC ? 'Loading...' : 'Select code'}
                                loading={isLoadingPC}
                                disabled={rowPieceCodes.length === 0 && !isLoadingPC}
                                onChange={(val) => handlePieceCodeChange(val, idx)}
                                showSearch
                                optionFilterProp="label"
                                size="middle"
                                style={{ borderRadius: 6 }}
                                notFoundContent={
                                  isLoadingPC ? 'Loading...' : 'No active piece codes'
                                }
                              >
                                {rowPieceCodes.map((pc: any) => (
                                  <Select.Option key={pc.id} value={pc.id} label={`${pc.code} ${getCurrencySymbol()}${pc.rate}`}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{pc.code}</span>
                                      <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.82rem' }}>{getCurrencySymbol()}{Number(pc.rate).toLocaleString('en-IN')}</span>
                                    </div>
                                  </Select.Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>

                          {/* Quantity */}
                          <Col xs={8} sm={4}>
                            <Form.Item
                              {...restField}
                              name={[name, 'quantity']}
                              label={<span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Qty</span>}
                              rules={[{ required: true, message: 'Required' }]}
                              style={{ margin: 0 }}
                            >
                              <InputNumber
                                min={1}
                                placeholder="Qty"
                                style={{ width: '100%', borderRadius: 6 }}
                                size="middle"
                              />
                            </Form.Item>
                          </Col>

                          {/* Rate (auto-filled, read-only) */}
                          <Col xs={8} sm={3}>
                            <Form.Item
                              {...restField}
                              name={[name, 'rate']}
                              label={<span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Rate</span>}
                              style={{ margin: 0 }}
                            >
                              <InputNumber
                                formatter={(val) => `${getCurrencySymbol()}${val}`}
                                readOnly
                                disabled
                                style={{
                                  width: '100%',
                                  borderRadius: 6,
                                  backgroundColor: '#F8FAFC',
                                  color: '#64748B',
                                  fontWeight: 700,
                                  border: '1px solid #CBD5E1',
                                }}
                                size="middle"
                              />
                            </Form.Item>
                          </Col>

                          {/* Amount (auto-calc, read-only) */}
                          <Col xs={6} sm={0} style={{ display: 'none' }} />
                          <Col xs={24} sm={0}>
                            {/* mobile: amount row */}
                          </Col>
                        </Row>

                        {/* Amount Summary Row + Delete */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 10,
                            paddingTop: 8,
                            borderTop: '1px dashed #E2E8F0',
                          }}
                        >
                          <Form.Item
                            {...restField}
                            name={[name, 'amount']}
                            style={{ margin: 0 }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Amount:</span>
                              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#059669' }}>
                                {formatCurrency(form.getFieldValue(['items', idx, 'amount']) || 0)}
                              </span>
                            </div>
                          </Form.Item>

                          {fields.length > 1 && (
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => {
                                remove(name);
                                setPieceCodesByRow((prev) => {
                                  const updated: Record<number, any[]> = {};
                                  Object.keys(prev).forEach((k) => {
                                    const ki = Number(k);
                                    if (ki < idx) updated[ki] = prev[ki];
                                    else if (ki > idx) updated[ki - 1] = prev[ki];
                                  });
                                  return updated;
                                });
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <Button
                    type="dashed"
                    onClick={() => {
                      const newIdx = fields.length;
                      add({ productId: undefined, pieceCodeId: undefined, quantity: undefined, rate: 0, amount: 0 });
                    }}
                    icon={<PlusOutlined />}
                    style={{ width: '100%', borderRadius: 8, fontWeight: 500, height: 40 }}
                  >
                    Add Product Row
                  </Button>
                </div>
              )}
            </Form.List>

            {/* Live Summary Panel */}
            <div
              style={{
                background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
                border: '1.5px solid #A7F3D0',
                borderRadius: 12,
                padding: '16px 20px',
                marginTop: 8,
              }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                Entry Summary
              </div>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#064E3B', fontWeight: 600, fontSize: '0.9rem' }}>Piece Codes:</span>
                  <span style={{ color: '#0F172A', fontWeight: 700 }}>{liveTotalPieceCodes}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#064E3B', fontWeight: 600, fontSize: '0.9rem' }}>Total Quantity:</span>
                  <span style={{ color: '#2563EB', fontWeight: 700 }}>{liveTotalQuantity} Pcs</span>
                </div>
                <Divider style={{ margin: '6px 0', borderColor: '#A7F3D0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#047857', fontWeight: 800, fontSize: '0.95rem' }}>Total Amount:</span>
                  <span style={{ color: '#059669', fontWeight: 900, fontSize: '1.5rem' }}>
                    {formatCurrency(liveTotalAmount)}
                  </span>
                </div>
              </Space>
            </div>
          </Form>
        </Drawer>

        {/* ── View Items Modal (all products in a production entry) ── */}
        <Modal
          open={itemsModal.open}
          onCancel={closeItems}
          footer={null}
          width={640}
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#0F172A' }}>
              <AppstoreOutlined style={{ color: '#2563EB' }} />
              Products Produced
              {itemsModal.record && (
                <span style={{ fontWeight: 500, color: '#64748B', fontSize: '0.8rem' }}>
                  · {itemsModal.record.employeeName} · {itemsModal.record.productionDate ? dayjs(itemsModal.record.productionDate).format('DD MMM YYYY') : ''}
                </span>
              )}
            </span>
          }
        >
          {itemsModal.record && (
            <Table
              dataSource={itemsModal.record.items || []}
              rowKey={(r: any, i?: number) => `${r.productId}-${r.pieceCodeId || i}`}
              size="small"
              pagination={false}
              scroll={{ y: 340 }}
              columns={[
                {
                  title: 'Product',
                  dataIndex: 'productName',
                  key: 'productName',
                  render: (name: string, item: any) => (
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>{getProductIconAndLabel(item.iconName, name || 'Product')}</span>
                  ),
                },
                {
                  title: 'Piece Code',
                  dataIndex: 'pieceCode',
                  key: 'pieceCode',
                  render: (code: string) => code ? <Tag style={{ borderRadius: 6 }}>{code}</Tag> : <span style={{ color: '#94A3B8' }}>—</span>,
                },
                { title: 'Qty', dataIndex: 'quantity', key: 'quantity', align: 'right' as const, render: (q: number) => <span style={{ fontWeight: 600 }}>{(q || 0).toLocaleString('en-IN')}</span> },
                { title: 'Rate', dataIndex: 'rate', key: 'rate', align: 'right' as const, render: (r: number) => <span style={{ color: '#64748B' }}>{formatCurrency(r || 0)}</span> },
                { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right' as const, render: (a: number) => <span style={{ fontWeight: 700, color: '#10B981' }}>{formatCurrency(a || 0)}</span> },
              ]}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ background: '#F8FAFC' }}>
                    <Table.Summary.Cell index={0} colSpan={2}><span style={{ fontWeight: 800 }}>Total</span></Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right"><span style={{ fontWeight: 800, color: '#2563EB' }}>{(itemsModal.record.totalQuantity || 0).toLocaleString('en-IN')}</span></Table.Summary.Cell>
                    <Table.Summary.Cell index={3} />
                    <Table.Summary.Cell index={4} align="right"><span style={{ fontWeight: 900, color: '#10B981' }}>{formatCurrency(itemsModal.record.totalAmount || 0)}</span></Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          )}
        </Modal>
      </Box>
    </ConfigProvider>
  );
};

export default ProductionPage;
