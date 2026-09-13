import React from 'react';
import { Card, Steps, Empty } from 'antd';
import { ICurrentMonthProductSummary } from '../../types/employee-details.types';
import { getProductIconAndLabel } from '../../utils/product-icons';

interface CurrentMonthProductPerformanceProps {
  data?: ICurrentMonthProductSummary[];
}

export const CurrentMonthProductPerformance: React.FC<CurrentMonthProductPerformanceProps> = ({ data = [] }) => {
  // Format currency in Indian Rupees
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
    height: '533px', // Locked height to prevent row shifting
    display: 'flex',
    flexDirection: 'column',
  };

  if (!data || data.length === 0) {
    return (
      <Card
        style={cardStyle}
        title={<span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>Current Month Product Performance</span>}
        bodyStyle={{ padding: '32px 24px', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Empty
          description={
            <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.95rem' }}>
              No production recorded for current month.
            </span>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      style={cardStyle}
      title={<span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>Current Month Product Performance</span>}
      bodyStyle={{ padding: '24px 32px', flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <div className="hide-scrollbar" style={{ flexGrow: 1, overflowY: 'auto' }}>
        <Steps
          direction="vertical"
          size="small"
          current={-1}
          status="process"
          items={data.map((item) => ({
            title: <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>{getProductIconAndLabel(item.iconName, item.productName)}</span>,
            description: (
              <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>Quantity Produced:</span>
                  <span style={{ fontSize: '0.9rem', color: '#2563EB', fontWeight: 600 }}>
                    {item.quantity.toLocaleString('en-IN')} Pcs
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>Earnings:</span>
                  <span style={{ fontSize: '1.1rem', color: '#10B981', fontWeight: 800 }}>
                    {formatCurrency(item.earnings)}
                  </span>
                </div>
              </div>
            ),
          }))}
        />
      </div>
    </Card>
  );
};
