import React, { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ConfigProvider,
  Card,
  Row,
  Col,
  DatePicker,
  Segmented,
  Button,
  Table,
  Tag,
  Spin,
  Empty,
  Tooltip,
  notification,
} from 'antd';
import {
  ReloadOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  RiseOutlined,
  ShoppingCartOutlined,
  DollarCircleOutlined,
  ToolOutlined,
  WalletOutlined,
  InboxOutlined,
  WarningOutlined,
  TeamOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import dayjs from 'dayjs';
import { dashboardService } from '../../services/dashboardService';
import { exportToExcel, exportElementToPdf } from '../../utils/exportUtils';
import HeadingInfo from '../../components/common/HeadingInfo';

const { RangePicker } = DatePicker;

const inr = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v) || 0);
const num = (v) => new Intl.NumberFormat('en-IN').format(Number(v) || 0);

const PIE_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444'];

const PRESETS = {
  'Last 7 Days': [dayjs().subtract(6, 'day'), dayjs()],
  'Last 30 Days': [dayjs().subtract(29, 'day'), dayjs()],
  'Last 90 Days': [dayjs().subtract(89, 'day'), dayjs()],
  'This Month': [dayjs().startOf('month'), dayjs()],
  'This Year': [dayjs().startOf('year'), dayjs()],
  'All Time': [dayjs('2000-01-01'), dayjs()],
};

const cardStyle = {
  borderRadius: 12,
  border: '1px solid #E2E8F0',
  boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.04), 0px 10px 15px -3px rgba(15, 23, 42, 0.04)',
};

const KpiTile = ({ icon, color, label, value, sub }) => (
  <Card style={cardStyle} styles={{ body: { padding: 16 } }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: `${color}14`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {React.cloneElement(icon, { style: { fontSize: 18, color } })}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {label}
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2, marginTop: 2 }}>
          {value}
        </div>
        {sub != null && <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94A3B8' }}>{sub}</div>}
      </div>
    </div>
  </Card>
);

const SectionCard = ({ title, icon, extra, children, bodyPad = 16 }) => (
  <Card
    style={{ ...cardStyle, height: '100%' }}
    styles={{ body: { padding: bodyPad } }}
    title={
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
        {icon}
        {title}
      </span>
    }
    extra={extra}
  >
    {children}
  </Card>
);

const DashboardPage = () => {
  const reportRef = useRef(null);
  const [range, setRange] = useState(PRESETS['Last 30 Days']);
  const [preset, setPreset] = useState('Last 30 Days');

  const fromDate = range?.[0]?.format('YYYY-MM-DD');
  const toDate = range?.[1]?.format('YYYY-MM-DD');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['dashboardOverview', fromDate, toDate],
    queryFn: () => dashboardService.getOverview(fromDate, toDate),
    keepPreviousData: true,
  });

  const handlePreset = (val) => {
    setPreset(val);
    if (PRESETS[val]) setRange(PRESETS[val]);
  };

  const handleRange = (val) => {
    setRange(val);
    setPreset('');
  };

  const revenueSeries = useMemo(
    () =>
      (data?.revenueSeries || []).map((p) => ({
        ...p,
        label: dayjs(p.date).format('DD MMM'),
        revenue: Number(p.revenue) || 0,
      })),
    [data]
  );
  const paymentBreakdown = data?.paymentBreakdown || [];
  const topProducts = useMemo(
    () => (data?.topProducts || []).map((p) => ({ ...p, revenue: Number(p.revenue) || 0, quantity: Number(p.quantity) || 0 })),
    [data]
  );
  const topEmployees = useMemo(
    () => (data?.topEmployees || []).map((e) => ({ ...e, quantity: Number(e.quantity) || 0, earnings: Number(e.earnings) || 0 })),
    [data]
  );
  const recentSales = data?.recentSales || [];

  const handleExportExcel = () => {
    if (!data) return;
    try {
      exportToExcel(
        [
          {
            name: 'Summary',
            rows: [
              {
                'From Date': data.fromDate,
                'To Date': data.toDate,
                'Sales Orders': data.salesCount,
                'Sales Revenue': Number(data.salesRevenue) || 0,
                'Discount Given': Number(data.salesDiscount) || 0,
                'Avg Order Value': Number(data.avgOrderValue) || 0,
                'Production Entries': data.productionEntries,
                'Production Qty': data.productionQty,
                'Production Amount': Number(data.productionAmount) || 0,
                'Investment / Expense': Number(data.investmentTotal) || 0,
                'Net Profit': Number(data.netProfit) || 0,
                'Inventory Stock Value': Number(data.inventoryStockValue) || 0,
                'Inventory Units': Number(data.inventoryUnits) || 0,
                'Low Stock Items': data.lowStockCount,
                'Active Employees': data.activeEmployees,
                'Total Employees': data.totalEmployees,
              },
            ],
          },
          { name: 'Revenue Trend', rows: revenueSeries.map((r) => ({ Date: r.date, Revenue: r.revenue, Orders: r.orders })) },
          { name: 'Payment Breakdown', rows: paymentBreakdown.map((r) => ({ Mode: r.label, Orders: r.count, Amount: Number(r.amount) || 0 })) },
          { name: 'Top Products', rows: topProducts.map((r) => ({ Product: r.name, Quantity: r.quantity, Revenue: r.revenue })) },
          { name: 'Employee Productivity', rows: topEmployees.map((r) => ({ Employee: r.name, 'Pieces Produced': r.quantity, 'Piece-Rate Earnings': r.earnings })) },
          {
            name: 'Recent Sales',
            rows: recentSales.map((r) => ({ Invoice: r.invoiceNo, Customer: r.customerName, Amount: Number(r.amount) || 0, Status: r.paymentStatus, Date: r.date })),
          },
        ],
        `SKR-Dashboard_${fromDate}_to_${toDate}`
      );
      notification.success({ message: 'Excel exported', placement: 'topRight' });
    } catch (e) {
      notification.error({ message: 'Excel export failed', description: e.message, placement: 'topRight' });
    }
  };

  const [exportingPdf, setExportingPdf] = useState(false);
  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      await exportElementToPdf(reportRef.current, `SKR-Dashboard_${fromDate}_to_${toDate}`);
      notification.success({ message: 'PDF exported', placement: 'topRight' });
    } catch (e) {
      notification.error({ message: 'PDF export failed', description: e.message, placement: 'topRight' });
    } finally {
      setExportingPdf(false);
    }
  };

  const kpis = data
    ? [
        { icon: <DollarCircleOutlined />, color: '#2563EB', label: 'Sales Revenue', value: inr(data.salesRevenue), sub: `${num(data.salesCount)} orders` },
        { icon: <ShoppingCartOutlined />, color: '#0EA5E9', label: 'Avg Order Value', value: inr(data.avgOrderValue), sub: `${inr(data.salesDiscount)} discount` },
        { icon: <ToolOutlined />, color: '#8B5CF6', label: 'Production', value: inr(data.productionAmount), sub: `${num(data.productionQty)} pcs` },
        { icon: <WalletOutlined />, color: '#F59E0B', label: 'Investment', value: inr(data.investmentTotal), sub: `${num(data.investmentCount)} entries` },
        { icon: <RiseOutlined />, color: (Number(data.netProfit) || 0) >= 0 ? '#10B981' : '#EF4444', label: 'Net Cash Flow', value: inr(data.netProfit), sub: 'sales − wages − buys' },
        { icon: <InboxOutlined />, color: '#06B6D4', label: 'Inventory Value', value: inr(data.inventoryStockValue), sub: `${num(data.inventoryUnits)} units` },
        { icon: <WarningOutlined />, color: (data.lowStockCount || 0) > 0 ? '#EF4444' : '#10B981', label: 'Low Stock', value: num(data.lowStockCount), sub: 'items to reorder' },
        { icon: <TeamOutlined />, color: '#6366F1', label: 'Active Staff', value: num(data.activeEmployees), sub: `of ${num(data.totalEmployees)} total` },
      ]
    : [];

  const recentColumns = [
    { title: 'Invoice', dataIndex: 'invoiceNo', key: 'invoiceNo', render: (v) => <span style={{ fontWeight: 600, color: '#1E293B' }}>{v}</span> },
    { title: 'Customer', dataIndex: 'customerName', key: 'customerName' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', render: (v) => <span style={{ fontWeight: 700, color: '#10B981' }}>{inr(v)}</span> },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (v) => <Tag color={v === 'PAID' ? 'green' : v === 'PENDING' ? 'orange' : 'default'}>{v || '—'}</Tag>,
    },
    { title: 'Date', dataIndex: 'date', key: 'date', render: (v) => (v ? dayjs(v).format('DD MMM YYYY') : '—') },
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#2563EB', borderRadius: 8, fontFamily: '"Inter", "Helvetica", "Arial", sans-serif' } }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header + toolbar */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
              Business Dashboard
              <HeadingInfo text="Key reports across sales, production, inventory & workforce" />
            </h1>
            {data && (
              <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 2 }}>
                {dayjs(data.fromDate).format('DD MMM')} – {dayjs(data.toDate).format('DD MMM YYYY')}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Segmented
              size="small"
              value={preset}
              onChange={handlePreset}
              options={Object.keys(PRESETS)}
            />
            <RangePicker size="small" value={range} onChange={handleRange} allowClear={false} format="DD MMM YY" style={{ width: 230 }} />
            <Tooltip title="Refresh">
              <Button size="small" icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()} />
            </Tooltip>
            <Button size="small" icon={<FileExcelOutlined />} onClick={handleExportExcel} disabled={!data}>
              Excel
            </Button>
            <Button size="small" type="primary" icon={<FilePdfOutlined />} loading={exportingPdf} onClick={handleExportPdf} disabled={!data}>
              PDF
            </Button>
          </div>
        </div>

        <Spin spinning={isLoading}>
          <div ref={reportRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* KPI grid */}
            <Row gutter={[12, 12]}>
              {kpis.map((k) => (
                <Col xs={12} sm={8} md={6} key={k.label}>
                  <KpiTile {...k} />
                </Col>
              ))}
              {!data && !isLoading && (
                <Col span={24}>
                  <Card style={cardStyle}><Empty description="No data" /></Card>
                </Col>
              )}
            </Row>

            {/* Revenue trend + payment donut */}
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <SectionCard title="Revenue Trend" icon={<LineChartOutlined style={{ color: '#2563EB' }} />}>
                  <div style={{ height: 280 }}>
                    {revenueSeries.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} width={64} tickFormatter={(v) => inr(v)} />
                          <RTooltip formatter={(v, n) => (n === 'revenue' ? inr(v) : v)} labelStyle={{ fontWeight: 600 }} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                          <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="url(#revFill)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Empty description="No sales in this range" />
                      </div>
                    )}
                  </div>
                </SectionCard>
              </Col>
              <Col xs={24} lg={8}>
                <SectionCard title="Payment Modes" icon={<DollarCircleOutlined style={{ color: '#10B981' }} />}>
                  <div style={{ height: 280 }}>
                    {paymentBreakdown.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={paymentBreakdown} dataKey="amount" nameKey="label" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                            {paymentBreakdown.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <RTooltip formatter={(v) => inr(v)} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Empty description="No payments" />
                      </div>
                    )}
                  </div>
                </SectionCard>
              </Col>
            </Row>

            {/* Top products + employee productivity */}
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <SectionCard title="Top Products (by qty)" icon={<InboxOutlined style={{ color: '#8B5CF6' }} />}>
                  <div style={{ height: 300 }}>
                    {topProducts.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topProducts} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={false} width={100} />
                          <RTooltip formatter={(v, n) => (n === 'revenue' ? inr(v) : num(v))} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                          <Bar dataKey="quantity" fill="#8B5CF6" radius={[0, 6, 6, 0]} barSize={16} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Empty description="No product sales" />
                      </div>
                    )}
                  </div>
                </SectionCard>
              </Col>
              <Col xs={24} lg={12}>
                <SectionCard title="Employee Productivity (pieces made)" icon={<TeamOutlined style={{ color: '#6366F1' }} />}>
                  <div style={{ height: 300 }}>
                    {topEmployees.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topEmployees} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={false} width={100} />
                          <RTooltip
                            formatter={(v, n) => (n === 'earnings' ? inr(v) : `${num(v)} pcs`)}
                            contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
                          />
                          <Bar dataKey="quantity" fill="#6366F1" radius={[0, 6, 6, 0]} barSize={16} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Empty description="No production in this range" />
                      </div>
                    )}
                  </div>
                </SectionCard>
              </Col>
            </Row>

            {/* Recent sales (full width) */}
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <SectionCard title="Recent Sales" icon={<ShoppingCartOutlined style={{ color: '#0EA5E9' }} />} bodyPad={0}>
                  <Table
                    dataSource={recentSales}
                    columns={recentColumns}
                    rowKey={(r) => r.invoiceNo}
                    size="small"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: <Empty description="No recent sales" /> }}
                  />
                </SectionCard>
              </Col>
            </Row>
          </div>
        </Spin>
      </div>
    </ConfigProvider>
  );
};

export default DashboardPage;
