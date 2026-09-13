import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ConfigProvider,
  Card,
  Row,
  Col,
  Table,
  Button,
  DatePicker,
  Select,
  Space,
  Form,
  Tooltip,
  Skeleton,
  Statistic,
  Tag,
  Modal,
  Dropdown,
  notification,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  HistoryOutlined,
  InboxOutlined,
  DollarCircleOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  MoreOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';

import { productionService } from '../../services/productionService';
import { employeeService } from '../../services/employee.service';
import { productService } from '../../services/productService';
import { getProductIconAndLabel } from '../../utils/product-icons';
import { IProductionEntry } from '../../types/production';
import HeadingInfo from '../../components/common/HeadingInfo';

const ProductionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Filters state mapping directly to query parameters
  const [filters, setFilters] = useState<{
    fromDate?: string;
    toDate?: string;
    employeeId?: string;
    productId?: string;
  }>({});

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
  const handleDelete = (record: IProductionEntry) => {
    Modal.confirm({
      title: 'Delete production entry?',
      icon: <ExclamationCircleOutlined />,
      content: `This permanently deletes the entry for ${record.employeeName} on ${record.productionDate ? dayjs(record.productionDate).format('DD MMM YYYY') : ''}. This cannot be undone.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await productionService.deleteProduction(record.id);
          notification.success({ message: 'Production entry deleted', placement: 'topRight' });
          refetch();
        } catch (e: any) {
          notification.error({ message: 'Delete failed', description: e.message, placement: 'topRight' });
        }
      },
    });
  };

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
  const { data: historyResponse, isLoading, refetch } = useQuery({
    queryKey: ['productionHistory', filters],
    queryFn: () => productionService.getProduction(filters),
  });
  const productionEntries = historyResponse?.data || [];

  // Currency formatter
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSearch = (values: any) => {
    setFilters({
      fromDate: values.fromDate ? values.fromDate.format('YYYY-MM-DD') : undefined,
      toDate: values.toDate ? values.toDate.format('YYYY-MM-DD') : undefined,
      employeeId: values.employeeId,
      productId: values.productId,
    });
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({});
  };

  // Dynamic KPI aggregates calculation
  const todayStr = dayjs().format('YYYY-MM-DD');
  
  // Today Quantity Produced
  const todayQuantity = productionEntries
    .filter((e) => e.productionDate === todayStr)
    .reduce((sum, e) => sum + (e.totalQuantity || 0), 0);

  // This Month Quantity Produced (Current month: 2026-06)
  const thisMonthQuantity = productionEntries
    .filter((e) => e.productionDate && e.productionDate.startsWith('2026-06'))
    .reduce((sum, e) => sum + (e.totalQuantity || 0), 0);

  // Global totals from list
  const totalQuantity = productionEntries.reduce((sum, e) => sum + (e.totalQuantity || 0), 0);
  const totalAmount = productionEntries.reduce((sum, e) => sum + (e.totalAmount || 0), 0);

  const cardStyle = {
    borderRadius: 12,
    boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
    border: '1px solid #E2E8F0',
    backgroundColor: '#ffffff',
  };

  const columns = [
    {
      title: 'Production Date',
      dataIndex: 'productionDate',
      key: 'productionDate',
      width: '15%',
      render: (date: string) => (
        <span style={{ fontWeight: 600, color: '#475569' }}>
          {date ? dayjs(date).format('DD-MMM-YYYY') : '-'}
        </span>
      ),
      sorter: (a: IProductionEntry, b: IProductionEntry) =>
        a.productionDate.localeCompare(b.productionDate),
    },
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: '20%',
      render: (name: string, record: IProductionEntry) => (
        <div>
          <span style={{ fontWeight: 700, color: '#0F172A', display: 'block' }}>{name}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
            {record.employeeCode}
          </span>
        </div>
      ),
      sorter: (a: IProductionEntry, b: IProductionEntry) =>
        (a.employeeName || '').localeCompare(b.employeeName || ''),
    },
    {
      title: 'Items',
      dataIndex: 'productCount',
      key: 'productCount',
      width: '24%',
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
      title: 'Total Quantity',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: '12%',
      align: 'right' as const,
      render: (qty: number) => (
        <span style={{ fontWeight: 700, color: '#2563EB' }}>
          {(qty || 0).toLocaleString('en-IN')} Pcs
        </span>
      ),
      sorter: (a: IProductionEntry, b: IProductionEntry) =>
        (a.totalQuantity || 0) - (b.totalQuantity || 0),
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: '15%',
      align: 'right' as const,
      render: (amount: number) => (
        <span style={{ fontWeight: 800, color: '#10B981' }}>
          {formatCurrency(amount || 0)}
        </span>
      ),
      sorter: (a: IProductionEntry, b: IProductionEntry) =>
        (a.totalAmount || 0) - (b.totalAmount || 0),
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      width: '18%',
      render: (remarks: string) => (
        <span
          style={{
            color: '#64748B',
            fontSize: '0.875rem',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            display: 'block',
            maxWidth: 180,
          }}
        >
          {remarks || <span style={{ fontStyle: 'italic', color: '#94A3B8' }}>No Remarks</span>}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: '8%',
      align: 'center' as const,
      render: (_: any, record: IProductionEntry) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'pdf', icon: <FilePdfOutlined style={{ color: '#DC2626' }} />, label: 'Download PDF', onClick: () => handleDownloadPdf(record) },
              { key: 'excel', icon: <FileExcelOutlined style={{ color: '#059669' }} />, label: 'Download Excel', onClick: () => handleDownloadExcel(record) },
              { type: 'divider' },
              { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true, onClick: () => handleDelete(record) },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined style={{ fontSize: '1.15rem', color: '#475569' }} />} />
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
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <HistoryOutlined style={{ color: '#2563EB' }} />
              Production History Log
              <HeadingInfo text="Review and audit historic enterprise garment production entries." />
            </Typography>
          </div>
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            style={{ borderRadius: 6, fontWeight: 600 }}
          >
            Refresh
          </Button>
        </div>

        {/* ==================================================
            TOP SUMMARY CARDS (4 KPI Panels)
            ================================================== */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card style={cardStyle} bodyStyle={{ padding: '20px 24px', display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 8, backgroundColor: '#FFFBEB',
                border: '1px solid #FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16
              }}>
                <ClockCircleOutlined style={{ fontSize: '20px', color: '#D97706' }} />
              </div>
              <div>
                <Statistic
                  title={<span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.8rem' }}>Today Production</span>}
                  value={todayQuantity}
                  suffix="Pcs"
                  valueStyle={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card style={cardStyle} bodyStyle={{ padding: '20px 24px', display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 8, backgroundColor: '#EFF6FF',
                border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16
              }}>
                <CalendarOutlined style={{ fontSize: '20px', color: '#2563EB' }} />
              </div>
              <div>
                <Statistic
                  title={<span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.8rem' }}>This Month Production</span>}
                  value={thisMonthQuantity}
                  suffix="Pcs"
                  valueStyle={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card style={cardStyle} bodyStyle={{ padding: '20px 24px', display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 8, backgroundColor: '#F5F3FF',
                border: '1px solid #EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16
              }}>
                <InboxOutlined style={{ fontSize: '20px', color: '#8B5CF6' }} />
              </div>
              <div>
                <Statistic
                  title={<span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.8rem' }}>Total Quantity</span>}
                  value={totalQuantity}
                  suffix="Pcs"
                  valueStyle={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB' }}
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card style={cardStyle} bodyStyle={{ padding: '20px 24px', display: 'flex', alignItems: 'center', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 8, backgroundColor: '#D1FAE5',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16
              }}>
                <DollarCircleOutlined style={{ fontSize: '20px', color: '#059669' }} />
              </div>
              <div>
                <Statistic
                  title={<span style={{ color: '#065F46', fontWeight: 700, fontSize: '0.8rem' }}>Total Amount</span>}
                  value={totalAmount}
                  formatter={(val) => formatCurrency(Number(val))}
                  valueStyle={{ fontSize: '1.4rem', fontWeight: 800, color: '#047857' }}
                />
              </div>
            </Card>
          </Col>
        </Row>

        {/* Filters Card */}
        <Card style={cardStyle} bodyStyle={{ padding: '20px 24px' }}>
          <Form
            form={form}
            onFinish={handleSearch}
            layout="vertical"
            requiredMark={false}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="fromDate" label={<span style={{ fontWeight: 600, color: '#475569' }}>From Date</span>}>
                  <DatePicker style={{ width: '100%', borderRadius: 6 }} format="DD-MMM-YYYY" placeholder="Select date" />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="toDate" label={<span style={{ fontWeight: 600, color: '#475569' }}>To Date</span>}>
                  <DatePicker style={{ width: '100%', borderRadius: 6 }} format="DD-MMM-YYYY" placeholder="Select date" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="employeeId" label={<span style={{ fontWeight: 600, color: '#475569' }}>Employee</span>}>
                  <Select
                    placeholder="Search employee"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    style={{ borderRadius: 6 }}
                  >
                    {employees.map((emp: any) => (
                      <Select.Option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.employeeCode})
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="productId" label={<span style={{ fontWeight: 600, color: '#475569' }}>Product</span>}>
                  <Select
                    placeholder="Search product"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    style={{ borderRadius: 6 }}
                  >
                    {products.map((prod: any) => (
                      <Select.Option key={prod.id} value={prod.id}>
                        {getProductIconAndLabel(prod.iconName, prod.name)}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
                style={{ borderRadius: 6, fontWeight: 600 }}
              >
                Search Filter
              </Button>
              <Button
                onClick={handleReset}
                icon={<ReloadOutlined />}
                style={{ borderRadius: 6, fontWeight: 600 }}
              >
                Reset
              </Button>
            </div>
          </Form>
        </Card>

        {/* History Table Card */}
        <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: 24 }}>
              <Skeleton active paragraph={{ rows: 8 }} />
            </div>
          ) : (
            <Table
              dataSource={productionEntries}
              columns={columns}
              rowKey="id"
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} logs`,
              }}
              style={{ borderRadius: 12, overflow: 'hidden' }}
              locale={{
                emptyText: (
                  <div style={{ padding: '48px 16px', color: '#94A3B8', textAlign: 'center' }}>
                    No production logs found matching the selected filters.
                  </div>
                ),
              }}
            />
          )}
        </Card>

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
              scroll={{ x: 'max-content' }}
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

export default ProductionHistoryPage;
