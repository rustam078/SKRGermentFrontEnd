import React, { useEffect, useState } from 'react';
import HeadingInfo from '../../components/common/HeadingInfo';
import { getCurrencySymbol } from '../../utils/currency';
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
    // Auto-refresh on open — no manual refresh button needed.
    staleTime: 0,
    refetchOnMount: 'always',
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
      queryClient.invalidateQueries({ queryKey: ['dashProducts'] }); // dashboard "Total Products" count
      queryClient.invalidateQueries({ queryKey: ['inventoryProducts'] });
      refetchProducts();
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
          </div>
        </div>

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
          <Row gutter={[12, 12]} align="stretch">
            {filteredProducts.map((product) => {
              const productIcon = getProductIcon(product.iconName, product.name);

              const openDetails = () => {
                const nextParams = new URLSearchParams(searchParams);
                nextParams.set('tab', activeTab);
                navigate(`/products/${product.id}?${nextParams.toString()}`);
              };

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
                <Col xs={12} sm={8} md={6} lg={4} key={product.id}>
                  <div className="product-card" style={{ ...cardStyle, height: '100%', display: 'flex', flexDirection: 'column' }} onClick={openDetails}>
                    {/* Image / icon area */}
                    <div
                      style={{
                        position: 'relative',
                        height: 130,
                        background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3.4rem',
                        borderBottom: '1px solid #F1F5F9',
                      }}
                    >
                      {productIcon}

                      {/* Status badge (top-left) */}
                      <span
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          backgroundColor: product.active ? '#DCFCE7' : '#FEF2F2',
                          color: product.active ? '#16A34A' : '#DC2626',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 10,
                        }}
                      >
                        {product.active ? 'Active' : 'Inactive'}
                      </span>

                      {/* Kebab (top-right corner) */}
                      <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 2 }} onClick={(e) => e.stopPropagation()}>
                        <Dropdown menu={dropdownMenu} trigger={['click']} placement="bottomRight">
                          <Button
                            type="text"
                            size="small"
                            icon={<MoreOutlined style={{ fontSize: '1.05rem', color: '#334155' }} />}
                            style={{
                              width: 26, height: 26, padding: 0, borderRadius: '50%',
                              background: '#ffffff', boxShadow: '0 1px 4px rgba(15,23,42,0.18)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          />
                        </Dropdown>
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '10px 12px 12px' }}>
                      <div
                        title={product.name}
                        style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {product.name}
                      </div>
                      {/* Current selling price */}
                      <div style={{ marginTop: 4, fontSize: '1rem', fontWeight: 800, color: '#059669' }}>
                        {product.sellingPrice != null
                          ? `${getCurrencySymbol()}${Number(product.sellingPrice).toLocaleString('en-IN')}`
                          : <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94A3B8' }}>No price set</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: '0.68rem', fontWeight: 700,
                            color: product.source === 'PURCHASED' ? '#6366F1' : '#0C4A6E',
                            backgroundColor: product.source === 'PURCHASED' ? '#EEF2FF' : '#E0F2FE',
                            padding: '2px 7px', borderRadius: 6,
                          }}
                        >
                          {product.source === 'PURCHASED' ? <ShoppingOutlined /> : <BuildOutlined />}
                          {product.source === 'PURCHASED' ? 'Purchased' : 'Manufactured'}
                        </span>
                        {product.source !== 'PURCHASED' && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748B', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '2px 7px', borderRadius: 6 }}>
                            {(product.totalPieceCodes || 0)} codes
                          </span>
                        )}
                      </div>
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
            cursor: pointer;
            overflow: hidden;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .product-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 16px 24px -8px rgba(0, 0, 0, 0.12) !important;
            border-color: #6366F1 !important;
          }
        `}</style>

      </Box>
    </ConfigProvider>
  );
};

export default ProductsPage;
