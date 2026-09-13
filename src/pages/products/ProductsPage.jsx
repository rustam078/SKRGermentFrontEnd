import React, { useEffect, useState } from 'react';
import HeadingInfo from '../../components/common/HeadingInfo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ConfigProvider,
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  Space,
  notification,
  Empty,
  Popover,
  Tooltip,
  Popconfirm,
  Dropdown,
  Tag,
  Select,
  Drawer,
  Modal,
  Tabs,
} from 'antd';
import {
  ShoppingOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  InboxOutlined,
  TagsOutlined,
  FilterOutlined,
  EyeOutlined,
  BarcodeOutlined,
  MoreOutlined,
  StopOutlined,
  ReloadOutlined,
  BuildOutlined,
} from '@ant-design/icons';
import { Box } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import { getProductIcon, PRODUCT_ICONS, PRODUCT_ICON_LABELS } from '../../utils/product-icons';

/* ─────────────────────────────────────────────────────────
   Icon Picker (Popover grid)
   ───────────────────────────────────────────────────────── */
const IconPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredIcons = Object.keys(PRODUCT_ICONS).filter(
    (key) =>
      key.toLowerCase().includes(search.toLowerCase()) ||
      PRODUCT_ICON_LABELS[key].toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel = value ? PRODUCT_ICON_LABELS[value] : '';
  const selectedEmoji = value ? PRODUCT_ICONS[value] : '';

  const handleSelect = (key) => {
    if (onChange) onChange(key);
    setOpen(false);
  };

  const content = (
    <div style={{ width: '300px', padding: '4px' }}>
      <Input
        placeholder="Search icons..."
        prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12, borderRadius: 6 }}
        autoFocus
      />
      <div
        className="hide-scrollbar"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 8,
          maxHeight: '220px',
          overflowY: 'auto',
          padding: 2,
        }}
      >
        {filteredIcons.map((key) => {
          const emoji = PRODUCT_ICONS[key];
          const label = PRODUCT_ICON_LABELS[key];
          const isSelected = value === key;
          return (
            <div
              key={key}
              onClick={() => handleSelect(key)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 2px',
                borderRadius: 8,
                border: isSelected ? '2px solid #6366F1' : '1px solid #E2E8F0',
                backgroundColor: isSelected ? '#EEF2FF' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#C7D2FE';
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }
              }}
            >
              <span style={{ fontSize: '1.4rem', marginBottom: 2 }}>{emoji}</span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'capitalize',
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
      overlayStyle={{ zIndex: 1050 }}
    >
      <div
        style={{
          width: '100%',
          height: '40px',
          border: '1px solid #D9D9D9',
          borderRadius: 8,
          padding: '4px 11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          backgroundColor: '#ffffff',
          transition: 'all 0.3s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#D9D9D9'; }}
      >
        {value ? (
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A' }}>
            {selectedEmoji} {selectedLabel}
          </span>
        ) : (
          <span style={{ color: '#BFBFBF', fontSize: '0.9rem' }}>Search and select an icon</span>
        )}
        <span style={{ color: '#BFBFBF', fontSize: '0.8rem' }}>▼</span>
      </div>
    </Popover>
  );
};

/* ─────────────────────────────────────────────────────────
   Main Products Page Component
   ───────────────────────────────────────────────────────── */
const ProductsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const tabValue = searchParams.get('tab');
    if (['manufacture', 'purchase', 'all', 'archive'].includes(tabValue)) {
      setActiveTab(tabValue);
    }
  }, [searchParams]);

  // ── Fetch products ─────────────────────────────────────
  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['products'],
    queryFn: productService.getProducts,
  });

  const products = productsData?.data || [];
  const manufactureProducts = products.filter((p) => p.source !== 'PURCHASED');
  const purchaseProducts = products.filter((p) => p.source === 'PURCHASED');

  // ── Stats ──────────────────────────────────────────────
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.active).length;
  const inactiveProducts = products.filter((p) => !p.active).length;
  const totalPieceCodesAcrossAll = products.reduce(
    (sum, p) => sum + (p.activePieceCodes || 0),
    0
  );

  // ── Mutations ──────────────────────────────────────────
  const createProductMutation = useMutation({
    mutationFn: productService.createProduct,
    onSuccess: (res) => {
      notification.success({
        message: 'Product Created',
        description: res.message || 'Product created successfully.',
        placement: 'topRight',
        duration: 4,
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      form.resetFields();
      setDrawerOpen(false);
    },
    onError: (err) => {
      notification.error({
        message: 'Product Creation Failed',
        description: err.message || 'An error occurred while saving the product.',
        placement: 'topRight',
        duration: 4.5,
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, active }) => productService.updateProductStatus(id, active),
    onSuccess: (res) => {
      notification.success({
        message: 'Status Updated',
        description: res.message || 'Product status updated.',
        placement: 'topRight',
        duration: 3,
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to toggle status.';
      notification.error({
        message: 'Error Updating Status',
        description: errorMsg,
        placement: 'topRight',
        duration: 4.5,
      });
    },
  });

  const handleToggleStatus = (record) => {
    if (record.active) {
      Modal.confirm({
        title: 'Move to Archive',
        content: (
          <div>
            <p>
              Deactivating "{record.name}" will move it to the Archive tab.
              It will no longer appear in the active product listing, but can be restored later.
            </p>
            <p style={{ marginBottom: 0 }}>
              Are you sure you want to archive this product?
            </p>
          </div>
        ),
        okText: 'Archive Product',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk() {
          toggleStatusMutation.mutate({ id: record.id, active: false });
        },
      });
    } else {
      toggleStatusMutation.mutate({ id: record.id, active: true });
    }
  };

  const onFinishProduct = (values) => {
    const normalizedName = values.name?.trim().toLowerCase();
    if (!normalizedName) {
      notification.warning({
        message: 'Invalid Product Name',
        description: 'Please provide a valid product name before saving.',
        placement: 'topRight',
        duration: 4,
      });
      return;
    }

    const existingProduct = products.find(
      (p) => p.name?.trim().toLowerCase() === normalizedName
    );

    if (existingProduct) {
      if (existingProduct.active) {
        notification.warning({
          message: 'Product Already Exists',
          description: `A product named "${values.name}" already exists and is active. Please choose a different name or restore the archived product instead.`,
          placement: 'topRight',
          duration: 5,
        });
      } else {
        Modal.confirm({
          title: 'Restore Archived Product',
          content: (
            <div>
              <p>
                A product named "{values.name}" already exists in the Archive.
                Would you like to restore it instead of creating a duplicate?
              </p>
              <p style={{ marginBottom: 0 }}>
                Once restored, it will appear again in the active Products list.
              </p>
            </div>
          ),
          okText: 'Restore Product',
          cancelText: 'Cancel',
          onOk() {
            toggleStatusMutation.mutate({ id: existingProduct.id, active: true });
          },
        });
      }
      return;
    }

    createProductMutation.mutate(values);
  };

  // ── Client-side filtering & sorting ────────────────────
  const filteredProducts = React.useMemo(() => {
    let sourceFiltered = products;
    if (activeTab === 'manufacture') {
      sourceFiltered = products.filter((p) => p.source !== 'PURCHASED' && p.active);
    } else if (activeTab === 'purchase') {
      sourceFiltered = products.filter((p) => p.source === 'PURCHASED' && p.active);
    } else if (activeTab === 'archive') {
      sourceFiltered = products.filter((p) => !p.active);
    } else {
      sourceFiltered = products.filter((p) => p.active);
    }

    let result = [...sourceFiltered];

    // Search filter
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, searchText, sortBy, activeTab]);

  const cardStyle = {
    borderRadius: 12,
    boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
    border: '1px solid #E2E8F0',
    backgroundColor: '#ffffff',
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6366F1',
          borderRadius: 8,
          fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '4px 0' }}>
        
        {/* ── Page Header Toolbar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', letterSpacing: -0.5, display: 'flex', alignItems: 'center' }}>
              Product Directory
              <HeadingInfo text="Manage garment products, piece rates, and production codes" />
            </h2>
          </div>
          
          {/* Aligned Toolbar Filters */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Input
              placeholder="Search products..."
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: 220, borderRadius: 8, height: 38 }}
            />

            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 160, height: 38 }}
              size="large"
              options={[
                { value: 'newest', label: 'Sort: Newest' },
                { value: 'oldest', label: 'Sort: Oldest' },
                { value: 'name', label: 'Sort: Alphabetical' },
              ]}
            />

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setDrawerOpen(true)}
              style={{ borderRadius: 8, fontWeight: 700, height: 38, paddingInline: 18 }}
            >
              Add Product
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetchProducts()}
              style={{ borderRadius: 8, height: 38 }}
            />
          </div>
        </div>

        {/* ── Summary Stats Cards ── */}
        <Row gutter={[10, 10]}>
          <Col xs={24} sm={12} xl={6}>
            <Card
              style={cardStyle}
              bodyStyle={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShoppingOutlined style={{ fontSize: '1.4rem', color: '#6366F1' }} />
              </div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ color: '#64748B', fontWeight: 600, fontSize: '0.85rem' }}>Total Products</div>
                <div style={{ color: '#0F172A', fontWeight: 800, fontSize: '1.75rem', margin: '4px 0' }}>{totalProducts}</div>
                <div style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 500 }}>All registered lines</div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card
              style={cardStyle}
              bodyStyle={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircleOutlined style={{ fontSize: '1.4rem', color: '#16A34A' }} />
              </div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ color: '#64748B', fontWeight: 600, fontSize: '0.85rem' }}>Active Products</div>
                <div style={{ color: '#0F172A', fontWeight: 800, fontSize: '1.75rem', margin: '4px 0' }}>{activeProducts}</div>
                <div style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 500 }}>Accepting production</div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card
              style={cardStyle}
              bodyStyle={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <InboxOutlined style={{ fontSize: '1.4rem', color: '#DC2626' }} />
              </div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ color: '#64748B', fontWeight: 600, fontSize: '0.85rem' }}>Inactive Products</div>
                <div style={{ color: '#0F172A', fontWeight: 800, fontSize: '1.75rem', margin: '4px 0' }}>{inactiveProducts}</div>
                <div style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 500 }}>Temporarily suspended</div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card
              style={cardStyle}
              bodyStyle={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BarcodeOutlined style={{ fontSize: '1.4rem', color: '#D97706' }} />
              </div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ color: '#64748B', fontWeight: 600, fontSize: '0.85rem' }}>Total Piece Codes</div>
                <div style={{ color: '#0F172A', fontWeight: 800, fontSize: '1.75rem', margin: '4px 0' }}>
                  {totalPieceCodesAcrossAll}
                </div>
                <div style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 500 }}>Active pricing formulas</div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* ── Product Cards Grid Section ── */}
        <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key);
              const nextParams = new URLSearchParams(searchParams);
              nextParams.set('tab', key);
              setSearchParams(nextParams);
            }}
            items={[
              { key: 'all', label: 'All' },
              { key: 'manufacture', label: 'Manufacture' },
              { key: 'purchase', label: 'Purchase' },
              { key: 'archive', label: 'Archive' },
            ]}
            style={{ flex: 1 }}
          />
          <div style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: 500 }}>
            Showing {filteredProducts.length} products
          </div>
        </div>
        {filteredProducts.length > 0 ? (
          <Row gutter={[10, 10]}>
            {filteredProducts.map((product) => {
              const productIcon = getProductIcon(product.iconName, product.name);
              
              const dropdownMenu = {
                items: [
                  {
                    key: 'toggle-status',
                    label: product.active ? 'Deactivate Product' : 'Activate Product',
                    icon: product.active ? <StopOutlined style={{ color: '#EA580C' }} /> : <CheckCircleOutlined style={{ color: '#16A34A' }} />,
                    onClick: () => handleToggleStatus(product),
                  },
                ],
              };

              return (
                <Col xs={24} sm={12} xl={8} className="product-card-col" key={product.id}>
                  <div className="product-card" style={cardStyle}>
                    <div style={{ padding: '24px 24px 18px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Top Info section */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          {/* Large Icon Container */}
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 14,
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.8rem',
                              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                              flexShrink: 0,
                            }}
                          >
                            {productIcon}
                          </div>
                        </div>

                        {/* Source icon + Status Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                            {product.source === 'PURCHASED' ? (
                              <ShoppingOutlined style={{ color: '#6366F1' }} />
                            ) : (
                              <BuildOutlined style={{ color: '#0C4A6E' }} />
                            )}
                          </div>
                          <span
                            style={{
                              backgroundColor: product.active ? '#DCFCE7' : '#FEF2F2',
                              color: product.active ? '#16A34A' : '#DC2626',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: 12,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: product.active ? '#16A34A' : '#DC2626' }} />
                            {product.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      {/* Product Info — e-commerce style */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, margin: '8px 0 16px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>Overview</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>{product.name}</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                          {/* <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A' }}>
                            {product.price ?? product.currentRate ?? product.defaultRate ?? '--'}
                          </div> */}
                            {product.source !== 'PURCHASED' && (
                              <div style={{ display: 'flex', gap: 8 }}>
                                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 8px', borderRadius: 8, fontWeight: 700, color: '#0F172A' }}>{(product.totalPieceCodes || 0) + ' codes'}</div>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #F1F5F9', padding: '14px 24px', backgroundColor: '#FCFDFE', borderRadius: '0 0 12px 12px' }}>
                      <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          const nextParams = new URLSearchParams(searchParams);
                          nextParams.set('tab', activeTab);
                          navigate(`/products/${product.id}?${nextParams.toString()}`);
                        }}
                        style={{
                          flex: 1,
                          fontWeight: 700,
                          borderRadius: 8,
                          fontSize: '0.85rem',
                          height: 36,
                          boxShadow: 'none',
                        }}
                      >
                        View Details
                      </Button>
                      <Dropdown menu={dropdownMenu} trigger={['click']} placement="topRight" dropdownAlign={{ offset: [10, 0] }}>
                        <Button
                          icon={<MoreOutlined style={{ fontSize: '1.1rem', color: '#475569' }} />}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid #E2E8F0',
                            padding: 0,
                          }}
                        />
                      </Dropdown>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        ) : (
          <Card style={cardStyle} bodyStyle={{ padding: 48 }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem', marginBottom: 6 }}>No Products Found</div>
                  <div style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: 16 }}>
                    No products matched your search or status filter. Get started by adding a product!
                  </div>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)} style={{ borderRadius: 8, fontWeight: 600 }}>
                    Add Your First Product
                  </Button>
                </div>
              }
            />
          </Card>
        )}

        {/* ── Add Product Drawer ── */}
        <Drawer
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#EEF2FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PlusOutlined style={{ color: '#6366F1', fontSize: '1rem' }} />
              </div>
              Add New Product
            </span>
          }
          placement="right"
          width={460}
          onClose={() => {
            setDrawerOpen(false);
            form.resetFields();
          }}
          open={drawerOpen}
          bodyStyle={{ backgroundColor: '#F8FAFC', padding: 24 }}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '10px 16px' }}>
              <Button
                onClick={() => {
                  setDrawerOpen(false);
                  form.resetFields();
                }}
                style={{ borderRadius: 8, fontWeight: 600, height: 40 }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                loading={createProductMutation.isPending}
                onClick={() => form.submit()}
                style={{ borderRadius: 8, fontWeight: 700, height: 40, paddingInline: 20 }}
              >
                Save Product
              </Button>
            </div>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinishProduct}
            autoComplete="off"
            requiredMark={false}
          >
            <Card style={{ borderRadius: 10, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: 20 }}>
              <Form.Item
                name="name"
                label={<span style={{ fontWeight: 700, color: '#374151' }}>Product Name *</span>}
                rules={[
                  { required: true, message: 'Product Name is mandatory.' },
                  { whitespace: true, message: 'Product Name cannot be empty.' },
                ]}
              >
                <Input
                  placeholder="e.g. Shirt, T-Shirt, Kurta"
                  size="large"
                  id="product-name"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item
                name="iconName"
                label={<span style={{ fontWeight: 700, color: '#374151' }}>Product Icon *</span>}
                rules={[{ required: true, message: 'Product Icon is mandatory.' }]}
              >
                <IconPicker />
              </Form.Item>

              <Form.Item
                name="description"
                label={<span style={{ fontWeight: 700, color: '#374151' }}>Description <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional)</span></span>}
              >
                <Input.TextArea
                  placeholder="Enter product description..."
                  rows={4}
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Card>
          </Form>
        </Drawer>

        {/* CSS Hover Transitions for Grid Cards */}
        <style>{`
          .product-card {
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .product-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
            border-color: #6366F1 !important;
          }
          @media (min-width: 1200px) {
            .product-card-col {
              flex: 0 0 20% !important;
              max-width: 20% !important;
            }
          }
        `}</style>

      </Box>
    </ConfigProvider>
  );
};

export default ProductsPage;
