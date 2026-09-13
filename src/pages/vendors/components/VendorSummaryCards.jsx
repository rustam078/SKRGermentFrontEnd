import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { 
  ShoppingCartOutlined, 
  FileTextOutlined, 
  CalendarOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const SummaryCard = ({ title, value, subValue, icon, iconBg, valueColor }) => (
  <Card style={{ borderRadius: 12, border: '1px solid #F1F5F9' }} bodyStyle={{ padding: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: valueColor || '#0F172A', lineHeight: 1 }}>
          {value}
        </div>
        {subValue && (
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 6 }}>
            {subValue}
          </div>
        )}
      </div>
    </div>
  </Card>
);

const VendorSummaryCards = ({ summary }) => {
  const { totalInvoices = 0, totalPurchaseAmount = 0, lastPurchaseDate } = summary || {};
  
  const avgInvoice = totalInvoices > 0 ? (totalPurchaseAmount / totalInvoices) : 0;
  
  const formattedLastPurchase = lastPurchaseDate 
    ? dayjs(lastPurchaseDate).format('DD MMM YYYY') 
    : 'No Purchases';

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <SummaryCard
          title="Total Purchase"
          value={`₹${(totalPurchaseAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subValue="All time total purchase"
          icon={<ShoppingCartOutlined style={{ color: '#2563EB', fontSize: '1.4rem' }} />}
          iconBg="#EFF6FF"
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <SummaryCard
          title="Total Invoices"
          value={totalInvoices}
          subValue="All time invoices"
          icon={<FileTextOutlined style={{ color: '#059669', fontSize: '1.4rem' }} />}
          iconBg="#DCFCE7"
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <SummaryCard
          title="Last Purchase"
          value={formattedLastPurchase}
          subValue="Most recent purchase"
          icon={<CalendarOutlined style={{ color: '#D97706', fontSize: '1.4rem' }} />}
          iconBg="#FEF3C7"
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <SummaryCard
          title="Average Invoice"
          value={`₹${avgInvoice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subValue="Total Purchase ÷ Invoices"
          icon={<LineChartOutlined style={{ color: '#7C3AED', fontSize: '1.4rem' }} />}
          iconBg="#F3E8FF"
        />
      </Col>
    </Row>
  );
};

export default VendorSummaryCards;
