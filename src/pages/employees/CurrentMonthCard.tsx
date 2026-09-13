import React from 'react';
import { Card, Divider, Empty, Steps } from 'antd';
import { WalletOutlined, AppstoreOutlined } from '@ant-design/icons';
import HeadingInfo from '../../components/common/HeadingInfo';
import { IEmployeeSummary, ICurrentMonthProductSummary } from '../../types/employee-details.types';
import { getProductIconAndLabel } from '../../utils/product-icons';

const inr = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

const cardStyle = {
  borderRadius: 12,
  boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
  border: '1px solid #E2E8F0',
  backgroundColor: '#ffffff',
  height: '563px', // Locked height — the product list scrolls instead of stretching the card
  display: 'flex',
  flexDirection: 'column' as const,
};

const Stat: React.FC<{ icon: React.ReactNode; bg: string; color: string; label: string; value: React.ReactNode }> = ({
  icon, bg, color, label, value,
}) => (
  <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: bg, minWidth: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</span>
    </div>
    <div style={{ fontSize: '1.25rem', fontWeight: 800, color, marginTop: 6 }}>{value}</div>
  </div>
);

interface Props {
  summary?: IEmployeeSummary;
  products?: ICurrentMonthProductSummary[];
}

export const CurrentMonthCard: React.FC<Props> = ({ summary, products = [] }) => {
  const worked = summary?.productsWorkedOn ?? 0;
  return (
    <Card
      style={cardStyle}
      title={
        <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem', display: 'inline-flex', alignItems: 'center' }}>
          Current Month
          <HeadingInfo text="Always shows the current month — the page filter does not apply to this card." />
        </span>
      }
      bodyStyle={{ padding: 16, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Stat
          icon={<WalletOutlined style={{ color: '#10B981', fontSize: 15 }} />}
          bg="#ECFDF5"
          color="#10B981"
          label="Earnings"
          value={inr(summary?.currentMonthEarnings ?? 0)}
        />
        <Stat
          icon={<AppstoreOutlined style={{ color: '#8B5CF6', fontSize: 15 }} />}
          bg="#F5F3FF"
          color="#8B5CF6"
          label="Products"
          value={worked}
        />
      </div>

      <Divider style={{ margin: '14px 0 10px' }} />

      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
        Product Performance
      </div>

      {/* Fixed-height scroll region (hidden scrollbar) — old step-wise design */}
      <div className="hide-scrollbar" style={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
        {products.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>No production this month</span>}
            />
          </div>
        ) : (
          <Steps
            direction="vertical"
            size="small"
            current={-1}
            status="process"
            items={products.map((item) => ({
              title: <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>{getProductIconAndLabel(item.iconName, item.productName)}</span>,
              description: (
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 500 }}>Quantity Produced:</span>
                    <span style={{ fontSize: '0.88rem', color: '#2563EB', fontWeight: 600 }}>{item.quantity.toLocaleString('en-IN')} Pcs</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 500 }}>Earnings:</span>
                    <span style={{ fontSize: '1.05rem', color: '#10B981', fontWeight: 800 }}>{inr(item.earnings)}</span>
                  </div>
                </div>
              ),
            }))}
          />
        )}
      </div>
    </Card>
  );
};
