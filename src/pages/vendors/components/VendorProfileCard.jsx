import React from 'react';
import { Card, Button, Typography, Space, Tag } from 'antd';
import HeadingInfo from '../../../components/common/HeadingInfo';
import { 
  PhoneOutlined, 
  MailOutlined, 
  EnvironmentOutlined,
  PlusOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const VendorProfileCard = ({ vendor, onCreateInvestment }) => {
  const navigate = useNavigate();

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
