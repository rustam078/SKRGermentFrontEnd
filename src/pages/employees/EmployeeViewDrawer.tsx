import React from 'react';
import { Drawer, Tag, Button, Descriptions } from 'antd';
import { UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { IEmployee } from '../../types/employee.types';

interface EmployeeViewDrawerProps {
  visible: boolean;
  onClose: () => void;
  employee: IEmployee | null;
}

export const EmployeeViewDrawer: React.FC<EmployeeViewDrawerProps> = ({
  visible,
  onClose,
  employee,
}) => {
  if (!employee) return null;

  return (
    <Drawer
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
          <UserOutlined style={{ color: '#2563EB' }} />
          Employee Details
        </span>
      }
      placement="right"
      width={700}
      onClose={onClose}
      open={visible}
      bodyStyle={{ backgroundColor: '#F8FAFC', padding: 24 }}
      extra={
        <Button onClick={onClose} icon={<ArrowLeftOutlined />}>
          Back
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Profile Card */}
        <div style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee Code</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
              {employee.employeeCode}
            </div>
          </div>
          <div>
            {employee.active ? (
              <Tag color="success" style={{ padding: '4px 12px', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600 }}>Active</Tag>
            ) : (
              <Tag color="error" style={{ padding: '4px 12px', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600 }}>Inactive</Tag>
            )}
          </div>
        </div>

        {/* Detailed Info Card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', padding: 24 }}>
          <Descriptions 
            title={<span style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>Personal &amp; Joining Details</span>} 
            column={1} 
            bordered 
            labelStyle={{ width: '180px', fontWeight: 600, color: '#475569', backgroundColor: '#F8FAFC' }} 
            contentStyle={{ color: '#0F172A' }}
          >
            <Descriptions.Item label="Full Name">
              {employee.fullName}
            </Descriptions.Item>
            <Descriptions.Item label="Mobile Number">
              {employee.mobileNumber ? (
                employee.mobileNumber
              ) : (
                <span style={{ fontStyle: 'italic', color: '#94A3B8' }}>Not Provided</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Address">
              {employee.address ? (
                employee.address
              ) : (
                <span style={{ fontStyle: 'italic', color: '#94A3B8' }}>Not Provided</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Joining Date">
              {employee.joiningDate ? dayjs(employee.joiningDate).format('DD-MMM-YYYY') : '-'}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>
    </Drawer>
  );
};
