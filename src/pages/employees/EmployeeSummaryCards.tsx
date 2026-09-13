import React from 'react';
import { Card, Divider, Row, Col } from 'antd';
import {
  InboxOutlined,
  DollarCircleOutlined,
  WalletOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { IEmployeeSummary } from '../../types/employee-details.types';

// Format currency helper
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const cardStyle = {
  borderRadius: 12,
  boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
  border: '1px solid #E2E8F0',
  backgroundColor: '#ffffff',
  height: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
};

interface SummaryCardProps {
  summary: IEmployeeSummary;
}

export const PremiumSummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
        border: '1px solid #E2E8F0',
        backgroundColor: '#ffffff',
        width: '100%',
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <Row align="middle" style={{ textAlign: 'center' }} gutter={[16, 24]}>
        {/* Total Production Qty */}
        <Col xs={24} sm={5}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Production Qty
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E293B', marginTop: 4 }}>
            {summary.totalProductionQty.toLocaleString('en-IN')} Pcs
          </div>
        </Col>

        {/* Divider 1 */}
        <Col xs={0} sm={1} style={{ display: 'flex', justifyContent: 'center' }}>
          <Divider type="vertical" style={{ height: '40px', backgroundColor: '#E2E8F0', margin: 0 }} />
        </Col>

        {/* Total Earnings */}
        <Col xs={24} sm={5}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Earnings
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563EB', marginTop: 4 }}>
            {formatCurrency(summary.totalEarnings)}
          </div>
        </Col>

        {/* Divider 2 */}
        <Col xs={0} sm={1} style={{ display: 'flex', justifyContent: 'center' }}>
          <Divider type="vertical" style={{ height: '40px', backgroundColor: '#E2E8F0', margin: 0 }} />
        </Col>

        {/* Current Month Earnings */}
        <Col xs={24} sm={5}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Current Month Earnings
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10B981', marginTop: 4 }}>
            {formatCurrency(summary.currentMonthEarnings)}
          </div>
        </Col>

        {/* Divider 3 */}
        <Col xs={0} sm={1} style={{ display: 'flex', justifyContent: 'center' }}>
          <Divider type="vertical" style={{ height: '40px', backgroundColor: '#E2E8F0', margin: 0 }} />
        </Col>

        {/* Products Worked On */}
        <Col xs={24} sm={5}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Products Worked On
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8B5CF6', marginTop: 4 }}>
            {summary.productsWorkedOn}
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export const OverallSummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  const qty = summary.totalProductionQty || 0;
  const earnings = summary.totalEarnings || 0;
  const avgPerPiece = qty > 0 ? earnings / qty : 0;

  const tiles = [
    { icon: <InboxOutlined />, color: '#2563EB', bg: '#EFF6FF', label: 'Total Production', value: `${qty.toLocaleString('en-IN')} Pcs` },
    { icon: <DollarCircleOutlined />, color: '#10B981', bg: '#ECFDF5', label: 'Total Earnings', value: formatCurrency(earnings) },
    { icon: <AppstoreOutlined />, color: '#8B5CF6', bg: '#F5F3FF', label: 'Products Worked On', value: `${summary.productsWorkedOn}` },
    { icon: <WalletOutlined />, color: '#D97706', bg: '#FFFBEB', label: 'Avg / Piece', value: formatCurrency(avgPerPiece) },
  ];

  return (
    <Card
      style={cardStyle}
      title={<span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>Overall Summary</span>}
      bodyStyle={{ padding: 16, display: 'flex', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 10, width: '100%', flexGrow: 1, minHeight: 0 }}>
        {tiles.map((t) => (
          <div
            key={t.label}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '10px 12px', borderRadius: 12, background: t.bg, minWidth: 0, minHeight: 0, overflow: 'hidden' }}
          >
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {React.cloneElement(t.icon, { style: { fontSize: 16, color: t.color } })}
            </div>
            <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: 8 }}>
              {t.label}
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: t.color, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t.value}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export const CurrentMonthSummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  return (
    <Card
      style={cardStyle}
      title={<span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>Current Month Summary</span>}
      bodyStyle={{
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        flexGrow: 1,
        gap: 16,
      }}
    >
      {/* Current Month Earnings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#ECFDF5', border: '1px solid #D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <WalletOutlined style={{ fontSize: '22px', color: '#10B981' }} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Current Month Earnings
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981', marginTop: 2 }}>
            {formatCurrency(summary.currentMonthEarnings)}
          </div>
        </div>
      </div>

      {/* Products Worked On */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#F5F3FF', border: '1px solid #EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <AppstoreOutlined style={{ fontSize: '22px', color: '#8B5CF6' }} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Products Worked On
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8B5CF6', marginTop: 2 }}>
            {summary.productsWorkedOn} {summary.productsWorkedOn === 1 ? 'Product' : 'Products'}
          </div>
        </div>
      </div>
    </Card>
  );
};

