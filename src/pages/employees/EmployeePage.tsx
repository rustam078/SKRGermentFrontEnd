import React, { useState } from 'react';
import HeadingInfo from '../../components/common/HeadingInfo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ConfigProvider, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Input, 
  Button, 
  Table, 
  Tag, 
  Space, 
  notification,
  Modal,
  Tooltip
} from 'antd';
import { 
  TeamOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  StopOutlined,
  ExclamationCircleOutlined,
  WalletOutlined,
  DollarCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employee.service';
import { IEmployee } from '../../types/employee.types';
import { EmployeeFormDrawer } from './EmployeeFormDrawer';
import { usePermissions } from '../../hooks/usePermissions';

const EmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [searchText, setSearchText] = useState('');
  
  // Drawer visibility states
  const [formDrawerVisible, setFormDrawerVisible] = useState(false);
  
  // Selected employee for view/edit operations
  const [selectedEmployee, setSelectedEmployee] = useState<IEmployee | null>(null);

  // Fetch employees list
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: employeeService.getEmployees,
  });

  // Fetch employee statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['employeeStats'],
    queryFn: employeeService.getEmployeeStats,
  });

  const employees = employeesData?.data || [];
  const stats = statsData?.data;

  // Indian currency formatter helper
  const formatIndianCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: employeeService.createEmployee,
    onSuccess: (res) => {
      notification.success({
        message: 'Success',
        description: res.message || 'Employee created successfully',
        placement: 'topRight',
      });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employeeStats'] });
      setFormDrawerVisible(false);
    },
    onError: (error: any) => {
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to create employee',
        placement: 'topRight',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => employeeService.updateEmployee(id, data),
    onSuccess: (res) => {
      notification.success({
        message: 'Success',
        description: res.message || 'Employee updated successfully',
        placement: 'topRight',
      });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employeeStats'] });
      setFormDrawerVisible(false);
      setSelectedEmployee(null);
    },
    onError: (error: any) => {
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to update employee',
        placement: 'topRight',
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: employeeService.deactivateEmployee,
    onSuccess: (res) => {
      notification.success({
        message: 'Success',
        description: res.message || 'Employee deactivated successfully',
        placement: 'topRight',
      });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employeeStats'] });
    },
    onError: (error: any) => {
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to deactivate employee',
        placement: 'topRight',
      });
    },
  });

  // Calculate statistics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((emp: IEmployee) => emp.active).length;
  const inactiveEmployees = employees.filter((emp: IEmployee) => !emp.active).length;

  // Filter employees client-side
  const filteredEmployees = employees.filter((emp: IEmployee) => {
    const query = searchText.toLowerCase().trim();
    if (!query) return true;
    return (
      emp.fullName.toLowerCase().includes(query) ||
      emp.employeeCode.toLowerCase().includes(query) ||
      (emp.email && emp.email.toLowerCase().includes(query)) ||
      (emp.mobileNumber && emp.mobileNumber.toLowerCase().includes(query))
    );
  });

  const handleOpenView = (employee: IEmployee) => {
    navigate(`/employees/${employee.id}`);
  };

  const handleOpenAdd = () => {
    setSelectedEmployee(null);
    setFormDrawerVisible(true);
  };

  const handleOpenEdit = (employee: IEmployee) => {
    setSelectedEmployee(employee);
    setFormDrawerVisible(true);
  };

  const handleDeactivate = (employee: IEmployee) => {
    Modal.confirm({
      title: 'Deactivate Employee',
      icon: <ExclamationCircleOutlined style={{ color: '#EF4444' }} />,
      content: `Are you sure you want to deactivate ${employee.fullName} (${employee.employeeCode})?`,
      okText: 'Yes, Deactivate',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        await deactivateMutation.mutateAsync(employee.id);
      },
    });
  };

  const handleFormSubmit = async (values: any) => {
    if (selectedEmployee) {
      await updateMutation.mutateAsync({ id: selectedEmployee.id, data: values });
    } else {
      await createMutation.mutateAsync(values);
    }
  };

  const cardStyle = {
    borderRadius: 12,
    boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
    border: '1px solid #E2E8F0',
    backgroundColor: '#ffffff',
  };

  const columns = [
    {
      title: 'Employee Code',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      width: '12%',
      render: (code: string) => <span style={{ fontWeight: 700, color: '#0F172A' }}>{code}</span>,
    },
    {
      title: 'Employee Name',
      dataIndex: 'fullName',
      key: 'fullName',
      width: '18%',
      sorter: (a: IEmployee, b: IEmployee) => a.fullName.localeCompare(b.fullName),
      render: (name: string) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{name}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '18%',
      render: (email?: string) => email ? (
        <a href={`mailto:${email}`} style={{ color: 'var(--theme-primary)', fontWeight: 500 }} onClick={(e) => e.stopPropagation()}>
          {email}
        </a>
      ) : (
        <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.85rem' }}>Not Provided</span>
      ),
    },
    {
      title: 'Mobile',
      dataIndex: 'mobileNumber',
      key: 'mobileNumber',
      width: '10%',
      render: (mobile?: string) => mobile ? (
        <span style={{ color: '#0F172A', fontWeight: 500 }}>{mobile}</span>
      ) : (
        <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.85rem' }}>Not Provided</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      width: '10%',
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value: any, record: IEmployee) => record.active === value,
      render: (active: boolean) => (
        active ? (
          <Tag style={{ background: 'transparent', color: '#16A34A', border: 'none', fontWeight: 600, padding: '2px 8px' }}>Active</Tag>
        ) : (
          <Tag style={{ background: 'transparent', color: '#DC2626', border: 'none', fontWeight: 600, padding: '2px 8px' }}>Inactive</Tag>
        )
      ),
    },
    {
      title: 'Current Month Earning',
      dataIndex: 'currentMonthEarning',
      key: 'currentMonthEarning',
      width: '15%',
      align: 'left' as const,
      sorter: (a: IEmployee, b: IEmployee) => (a.currentMonthEarning ?? 0) - (b.currentMonthEarning ?? 0),
      render: (val?: number) => (
        <span style={{ color: 'var(--theme-primary)', fontWeight: 500 }}>
          {formatIndianCurrency(val ?? 0)}
        </span>
      ),
    },
    {
      title: 'Overall Earning',
      dataIndex: 'totalEarning',
      key: 'totalEarning',
      width: '15%',
      align: 'left' as const,
      sorter: (a: IEmployee, b: IEmployee) => (a.totalEarning ?? 0) - (b.totalEarning ?? 0),
      render: (val?: number) => (
        <span style={{ color: 'var(--theme-primary)', fontWeight: 700 }}>
          {formatIndianCurrency(val ?? 0)}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '10%',
      render: (_: any, record: IEmployee) => (
        <Space size={4} align="center">
          {can('employees', 'write') && (
            <Tooltip title="Edit Employee">
              <Button
                type="text"
                icon={<EditOutlined style={{ color: 'var(--theme-primary)' }} />}
                onClick={(e) => { e.stopPropagation(); handleOpenEdit(record); }}
                style={{ minWidth: 32, padding: 0 }}
              />
            </Tooltip>
          )}
          {record.active && can('employees', 'write') && (
            <Tooltip title="Deactivate Employee">
              <Button
                type="text"
                danger
                icon={<StopOutlined />}
                onClick={(e) => { e.stopPropagation(); handleDeactivate(record); }}
                style={{ minWidth: 32, padding: 0 }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
                    borderRadius: 8,
          fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        },
      }}
    >
      <Box>
        {/* Title Header + search/actions in one row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
            Employee Management
            <HeadingInfo text="Manage garment production workers and employee records." />
          </Typography>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Input
              placeholder="Search by name, code or mobile number"
              prefix={<SearchOutlined style={{ color: '#94A3B8', marginRight: 4 }} />}
              style={{ width: 320, borderRadius: 6, height: 40 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            {can('employees', 'write') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)', fontWeight: 600, borderRadius: 6, height: 40 }}
                onClick={handleOpenAdd}
              >
                Add Employee
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Row */}
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          {[
            {
              title: 'Total Employees',
              value: stats?.totalEmployees ?? 0,
              icon: <TeamOutlined style={{ fontSize: '22px', color: 'var(--theme-primary)' }} />,
              bgColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
              borderColor: '#DBEAFE',
            },
            {
              title: 'Employee Status',
              isStatusCard: true,
              icon: <UserOutlined style={{ fontSize: '22px', color: '#64748B' }} />,
              bgColor: '#F8FAFC',
              borderColor: '#E2E8F0',
            },
            {
              title: 'Current Month Payroll',
              value: formatIndianCurrency(stats?.currentMonthTotalEarning ?? 0),
              icon: <WalletOutlined style={{ fontSize: '22px', color: 'var(--theme-primary)' }} />,
              bgColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
              borderColor: '#D1FAE5',
              valueColor: 'var(--theme-primary)',
            },
            {
              title: 'Overall Payroll',
              value: formatIndianCurrency(stats?.overallTotalEarning ?? 0),
              icon: <DollarCircleOutlined style={{ fontSize: '22px', color: 'var(--theme-primary)' }} />,
              bgColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
              borderColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
              valueColor: 'var(--theme-primary)',
            },
          ].map((kpi, idx) => (
            <Col xs={24} sm={12} lg={6} key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
              <Card
                style={{
                  ...cardStyle,
                  flexGrow: 1,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'default',
                }}
                bodyStyle={{ padding: '20px 24px', display: 'flex', alignItems: 'center', height: '100%' }}
                className="stat-card"
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    backgroundColor: kpi.bgColor,
                    border: `1px solid ${kpi.borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                    flexShrink: 0,
                  }}
                >
                  {kpi.icon}
                </div>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', marginBottom: 4 }}>
                    {kpi.title}
                  </div>
                  {kpi.isStatusCard ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Tag style={{ background: 'transparent', color: '#16A34A', border: 'none', fontWeight: 700, fontSize: '0.85rem', padding: '2px 6px', margin: 0 }}>
                        Active: {stats?.activeEmployees ?? 0}
                      </Tag>
                      <span style={{ color: '#CBD5E1', fontWeight: 300 }}>|</span>
                      <Tag style={{ background: 'transparent', color: '#DC2626', border: 'none', fontWeight: 700, fontSize: '0.85rem', padding: '2px 6px', margin: 0 }}>
                        Inactive: {stats?.inactiveEmployees ?? 0}
                      </Tag>
                    </div>
                  ) : (
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: kpi.valueColor || '#0F172A', lineHeight: 1.2 }}>
                      {kpi.value}
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Employee Table */}
        <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
          <Table
            dataSource={filteredEmployees}
            columns={columns}
            rowKey="id"
            loading={employeesLoading}
            onRow={(record: IEmployee) => ({
              onClick: () => handleOpenView(record),
              style: { cursor: 'pointer' },
            })}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '25', '50'],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} employees`,
              style: { marginRight: 24, marginBottom: 16 },
            }}
            sticky
            scroll={{ x: true }}
            style={{ borderRadius: 8, overflow: 'hidden' }}
          />
        </Card>

        {/* Drawers */}

        <EmployeeFormDrawer
          visible={formDrawerVisible}
          onClose={() => {
            setFormDrawerVisible(false);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
          onSubmit={handleFormSubmit}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </Box>
    </ConfigProvider>
  );
};

export default EmployeePage;
