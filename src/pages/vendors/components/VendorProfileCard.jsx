import React from 'react';
import { Card, Button, Typography, Space, Tag } from 'antd';
import HeadingInfo from '../../../components/common/HeadingInfo';
import { 
  PhoneOutlined, 
  MailOutlined, 
  EnvironmentOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  CalendarOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { getCurrencySymbol } from '../../../utils/currency';

const { Title, Text } = Typography;

const Stat = ({ title, value, icon, iconBg, iconColor }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 180px', minWidth: 150 }}>
    <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {React.cloneElement(icon, { style: { color: iconColor, fontSize: '1.15rem' } })}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>{title}</div>
      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>{value}</div>
    </div>
  </div>
);

const VendorProfileCard = ({ vendor, onCreateInvestment, summary }) => {
  const navigate = useNavigate();

  const { totalInvoices = 0, totalPurchaseAmount = 0, lastPurchaseDate } = summary || {};
  const avgInvoice = totalInvoices > 0 ? totalPurchaseAmount / totalInvoices : 0;
  const inr = (v) => `${getCurrencySymbol()}${Number(v || 0).toLocaleString('en-IN')}`;
  const lastPurchase = lastPurchaseDate ? dayjs(lastPurchaseDate).format('DD MMM YYYY') : 'No Purchases';

  return (
    <Card 
      style={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }} 
      bodyStyle={{ padding: 24 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Space align="center" size="middle" style={{ marginBottom: 16 }}>
            <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#0F172A', display: 'inline-flex', alignItems: 'center' }}>
              {vendor?.name}
              <HeadingInfo text="Vendor profile, purchase history and totals." />
            </Title>
            {vendor?.active ? (
              <Tag color="success" style={{ borderRadius: 16, padding: '2px 12px', fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#52c41a', display: 'inline-block', marginRight: 6 }}></span>
                Active
              </Tag>
            ) : (
              <Tag color="default" style={{ borderRadius: 16, padding: '2px 12px', fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#d9d9d9', display: 'inline-block', marginRight: 6 }}></span>
                Inactive
              </Tag>
            )}
          </Space>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'stretch' }}>
            <Card
              style={{ borderRadius: 8, border: '1px solid #F1F5F9', background: '#FAFAFA' }}
              bodyStyle={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <Space align="start">
                <PhoneOutlined style={{ color: '#64748B', marginTop: 4 }} />
                <Text style={{ color: '#334155', fontWeight: 500 }}>{vendor?.mobile || 'N/A'}</Text>
              </Space>
              <Space align="start">
                <MailOutlined style={{ color: '#64748B', marginTop: 4 }} />
                <Text style={{ color: '#334155', fontWeight: 500 }}>{vendor?.email || 'N/A'}</Text>
              </Space>
              <Space align="start">
                <EnvironmentOutlined style={{ color: '#64748B', marginTop: 4 }} />
                <Text style={{ color: '#334155', fontWeight: 500, maxWidth: 400 }}>
                  {vendor?.address || 'N/A'}
                </Text>
              </Space>
            </Card>

            {/* Summary stats — right of the contact card, filling the space */}
            <div
              style={{
                flex: '1 1 320px',
                minWidth: 260,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '16px 24px',
                alignContent: 'center',
              }}
            >
              <Stat title="Total Purchase" value={inr(totalPurchaseAmount)} icon={<ShoppingCartOutlined />} iconBg="#EFF6FF" iconColor="#2563EB" />
              <Stat title="Total Invoices" value={totalInvoices} icon={<FileTextOutlined />} iconBg="#DCFCE7" iconColor="#059669" />
              <Stat title="Last Purchase" value={lastPurchase} icon={<CalendarOutlined />} iconBg="#FEF3C7" iconColor="#D97706" />
              <Stat title="Average Invoice" value={inr(avgInvoice)} icon={<LineChartOutlined />} iconBg="#F3E8FF" iconColor="#7C3AED" />
            </div>
          </div>
        </div>

        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={onCreateInvestment}
            style={{ borderRadius: 6, fontWeight: 600, height: 38, paddingInline: 18 }}
          >
            Create Investment
          </Button>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/investment?tab=vendors')}
            style={{ borderRadius: 6, fontWeight: 600, height: 38, paddingInline: 18 }}
          >
            Back
          </Button>
        </Space>
      </div>
    </Card>
  );
};

export default VendorProfileCard;
