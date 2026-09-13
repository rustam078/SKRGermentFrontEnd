import React from 'react';
import { Card, Table } from 'antd';
import { IProductSummary } from '../../types/employee-details.types';
import { getProductIconAndLabel } from '../../utils/product-icons';

interface EmployeeProductTableProps {
  data: IProductSummary[];
  loading?: boolean;
}

export const EmployeeProductTable: React.FC<EmployeeProductTableProps> = ({ data, loading }) => {
  // Format currency in Indian Rupees
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      width: '40%',
      render: (name: string, record: IProductSummary) => (
        <span style={{ fontWeight: 600, color: '#0F172A' }}>
          {getProductIconAndLabel(record.iconName, name)}
        </span>
      ),
    },
    {
      title: 'Quantity Produced',
      dataIndex: 'quantityProduced',
      key: 'quantityProduced',
      width: '30%',
      render: (qty: number) => (
        <span style={{ fontWeight: 500, color: '#475569' }}>
          {qty.toLocaleString('en-IN')} Pcs
        </span>
      ),
    },
    {
      title: 'Total Earnings',
      dataIndex: 'totalEarnings',
      key: 'totalEarnings',
      width: '30%',
      render: (earnings: number) => (
        <span style={{ fontWeight: 700, color: '#10B981' }}>
          {formatCurrency(earnings)}
        </span>
      ),
    },
  ];

  return (
    <Card
      title={<span style={{ color: '#0F172A', fontWeight: 700, fontSize: '1.1rem' }}>Product Wise Earnings</span>}
      style={{
        borderRadius: 12,
        boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
        border: '1px solid #E2E8F0',
        marginBottom: 24,
      }}
      bodyStyle={{ padding: 0 }}
    >
      <Table
        dataSource={data}
        columns={columns}
        rowKey="productName"
        pagination={false}
        loading={loading}
        locale={{
          emptyText: (
            <div style={{ padding: '32px 16px', color: '#94A3B8', textAlign: 'center' }}>
              No product contributions found.
            </div>
          ),
        }}
        style={{ borderRadius: '0 0 12px 12px', overflow: 'hidden' }}
      />
    </Card>
  );
};
