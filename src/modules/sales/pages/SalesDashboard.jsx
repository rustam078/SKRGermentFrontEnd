import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ConfigProvider, Card, Row, Col, Button, Table, Tag, Spin, Empty, Alert, Popover, Radio, DatePicker,
} from 'antd';
import {
  DollarCircleOutlined, ShoppingCartOutlined, RiseOutlined,
  PercentageOutlined, WarningOutlined, LineChartOutlined, FilterOutlined,
} from '@ant-design/icons';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import dayjs from 'dayjs';
import { dashboardService } from '../../../services/dashboardService';
import HeadingInfo from '../../../components/common/HeadingInfo';

const inr = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v) || 0);
const num = (v) => new Intl.NumberFormat('en-IN').format(Number(v) || 0);

const PIE_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444'];

const RANGES = {
  'Today': [dayjs().startOf('day'), dayjs().endOf('day')],
  'This Week': [dayjs().startOf('week'), dayjs().endOf('day')],
  'This Month': [dayjs().startOf('month'), dayjs()],
  'Last Month': [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')],
  'Last 3 Months': [dayjs().subtract(3, 'month'), dayjs()],
  'This Year': [dayjs().startOf('year'), dayjs()],
  'All Time': [dayjs('2000-01-01'), dayjs()],
};

const cardStyle = {
  borderRadius: 12,
  border: '1px solid #E2E8F0',
  boxShadow: '0px 1px 3px rgba(15,23,42,0.04), 0px 10px 15px -3px rgba(15,23,42,0.04)',
};

const Kpi = ({ icon, color, label, value, sub }) => (
  <Card style={cardStyle} styles={{ body: { padding: 16 } }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {React.cloneElement(icon, { style: { fontSize: 18, color } })}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2, marginTop: 2 }}>{value}</div>
        {sub != null && <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94A3B8' }}>{sub}</div>}
      </div>
    </div>
  </Card>
);

const Section = ({ title, icon, children }) => (
  <Card
    style={{ ...cardStyle, height: '100%' }}
    styles={{ body: { padding: 16 } }}
    title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>{icon}{title}</span>}
  >
    {children}
  </Card>
);

const SalesDashboard = () => {
  const navigate = useNavigate();
  const [preset, setPreset] = useState('This Month');
  const [customRange, setCustomRange] = useState(null); // [dayjs, dayjs] overrides the preset
  const hasCustom = Boolean(customRange && customRange[0] && customRange[1]);
  const [from, to] = hasCustom ? customRange : RANGES[preset];
  const fromDate = from.format('YYYY-MM-DD');
  const toDate = to.format('YYYY-MM-DD');

  const { data, isLoading, error } = useQuery({
    queryKey: ['salesDashboard', fromDate, toDate],
    queryFn: () => dashboardService.getOverview(fromDate, toDate),
    keepPreviousData: true,
  });

  const revenueSeries = useMemo(
    () => (data?.revenueSeries || []).map((p) => ({ ...p, label: dayjs(p.date).format('DD MMM'), revenue: Number(p.revenue) || 0 })),
    [data]
  );
  const paymentBreakdown = data?.paymentBreakdown || [];
  const topProducts = useMemo(
    () => (data?.topProducts || []).map((p) => ({ ...p, quantity: Number(p.quantity) || 0, revenue: Number(p.revenue) || 0 })),
    [data]
  );
  const recentSales = data?.recentSales || [];

  const kpis = data ? [
    { icon: <DollarCircleOutlined />, color: '#2563EB', label: 'Sales Revenue', value: inr(data.salesRevenue), sub: `${num(data.salesCount)} orders` },
    { icon: <ShoppingCartOutlined />, color: '#0EA5E9', label: 'Orders', value: num(data.salesCount), sub: preset.toLowerCase() },
    { icon: <RiseOutlined />, color: '#10B981', label: 'Avg Order Value', value: inr(data.avgOrderValue), sub: 'per invoice' },
    { icon: <PercentageOutlined />, color: '#F59E0B', label: 'Discount Given', value: inr(data.salesDiscount), sub: 'in period' },
  ] : [];

  const recentColumns = [
    { title: 'Invoice', dataIndex: 'invoiceNo', key: 'invoiceNo', render: (v) => <span style={{ fontWeight: 600, color: '#1E293B' }}>{v}</span> },
    { title: 'Customer', dataIndex: 'customerName', key: 'customerName' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', render: (v) => <span style={{ fontWeight: 700, color: '#10B981' }}>{inr(v)}</span> },
    { title: 'Status', dataIndex: 'paymentStatus', key: 'paymentStatus', render: (v) => <Tag color={v === 'PAID' ? 'green' : v === 'PENDING' ? 'orange' : 'default'}>{v || '—'}</Tag> },
    { title: 'Date', dataIndex: 'date', key: 'date', render: (v) => (v ? dayjs(v).format('DD MMM YYYY') : '—') },
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#2563EB', borderRadius: 8, fontFamily: '"Inter", "Helvetica", "Arial", sans-serif' } }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
              Sales Dashboard
              <HeadingInfo text="Revenue, orders and product momentum" />
            </h1>
            {data && (
              <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 2 }}>
                {dayjs(data.fromDate).format('DD MMM')} – {dayjs(data.toDate).format('DD MMM YYYY')}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Popover
              trigger="click"
              placement="bottomRight"
              content={(
                <div style={{ width: 250 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, color: '#0F172A' }}>Date range</div>
                  <Radio.Group
                    value={hasCustom ? null : preset}
                    onChange={(e) => { setPreset(e.target.value); setCustomRange(null); }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                  >
                    {Object.keys(RANGES).map((k) => <Radio key={k} value={k}>{k}</Radio>)}
                  </Radio.Group>
                  <div style={{ fontWeight: 700, margin: '12px 0 6px', color: '#0F172A' }}>Custom range</div>
                  <DatePicker.RangePicker
                    value={customRange}
                    onChange={(v) => setCustomRange(v)}
                    allowClear
                    style={{ width: '100%' }}
                    format="DD MMM YYYY"
                  />
                </div>
              )}
            >
              <Button icon={<FilterOutlined />}>Filters · {hasCustom ? 'Custom' : preset}</Button>
            </Popover>
          </div>
        </div>

        {error && <Alert type="error" showIcon message="Failed to load sales dashboard" description={error.message} />}

        <Spin spinning={isLoading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Row gutter={[12, 12]}>
              {kpis.map((k) => (
                <Col xs={12} md={6} key={k.label}><Kpi {...k} /></Col>
              ))}
              {!data && !isLoading && <Col span={24}><Card style={cardStyle}><Empty description="No data" /></Card></Col>}
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <Section title="Revenue Trend" icon={<LineChartOutlined style={{ color: '#2563EB' }} />}>
                  <div style={{ height: 280 }}>
                    {revenueSeries.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="salesRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} width={64} tickFormatter={(v) => inr(v)} />
                          <RTooltip formatter={(v) => inr(v)} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                          <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="url(#salesRev)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Empty description="No sales in this range" /></div>
                    )}
                  </div>
                </Section>
              </Col>
              <Col xs={24} lg={8}>
                <Section title="Payment Modes" icon={<DollarCircleOutlined style={{ color: '#10B981' }} />}>
                  <div style={{ height: 280 }}>
                    {paymentBreakdown.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={paymentBreakdown} dataKey="amount" nameKey="label" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                            {paymentBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <RTooltip formatter={(v) => inr(v)} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Empty description="No payments" /></div>
                    )}
                  </div>
                </Section>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={11}>
                <Section title="Top Products (by qty)" icon={<ShoppingCartOutlined style={{ color: '#8B5CF6' }} />}>
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
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Empty description="No product sales" /></div>
                    )}
                  </div>
                </Section>
              </Col>
              <Col xs={24} lg={13}>
                <Card
                  style={{ ...cardStyle, height: '100%' }}
                  styles={{ body: { padding: 0 } }}
                  title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}><ShoppingCartOutlined style={{ color: '#0EA5E9' }} />Recent Sales</span>}
                >
                  <Table
                    dataSource={recentSales}
                    columns={recentColumns}
                    rowKey={(r) => r.invoiceNo}
                    size="small"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: <Empty description="No recent sales" /> }}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        </Spin>
      </div>
    </ConfigProvider>
  );
};

export default SalesDashboard;
