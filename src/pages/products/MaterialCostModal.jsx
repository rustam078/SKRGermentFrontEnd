import React, { useEffect, useState } from 'react';
import {
    Modal,
    Form,
    InputNumber,
    DatePicker,
    message,
} from 'antd';
import { RiseOutlined, FallOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import productService from '../../services/productService';
import { getCurrencySymbol } from '../../utils/currency';

const MaterialCostModal = ({
    open,
    onClose,
    productId,
    editingMaterialCost,
    onSuccess,
}) => {

    const [form] = Form.useForm();
    const [cost, setCost] = useState(null);
    const [salePrice, setSalePrice] = useState(null);

    useEffect(() => {
        if (open) {
            form.resetFields();

            form.setFieldsValue({
                cost: editingMaterialCost?.cost ?? undefined,
                salePrice: editingMaterialCost?.salePrice ?? undefined,
                effectiveFrom: editingMaterialCost?.effectiveFrom ? dayjs(editingMaterialCost.effectiveFrom) : dayjs(),
            });
            setCost(editingMaterialCost?.cost ?? null);
            setSalePrice(editingMaterialCost?.salePrice ?? null);
        }
    }, [open, editingMaterialCost]);

    const handleSubmit = async () => {

        try {

            const values = await form.validateFields();

            const payload = {
                cost: values.cost,
                salePrice: (values.salePrice || values.salePrice === 0) ? values.salePrice : null,
                effectiveFrom: values.effectiveFrom.format('YYYY-MM-DD'),
            };

            if (editingMaterialCost?.id) {
                await productService.updateMaterialCost(editingMaterialCost.id, payload);
                message.success('Pricing updated successfully.');
            } else {
                await productService.createMaterialCost(
                    productId,
                    payload
                );
                message.success('Pricing added successfully.');
            }

            onSuccess();

            form.resetFields();

        } catch (error) {

            if (error?.errorFields) return;

            message.error(
                error?.response?.data?.message ||
                'Failed to save pricing.'
            );
        }
    };

    // Live profit preview
    const c = Number(cost);
    const s = Number(salePrice);
    const hasBoth = (cost || cost === 0) && (salePrice || salePrice === 0) && !Number.isNaN(c) && !Number.isNaN(s);
    const profitAmount = hasBoth ? s - c : null;
    const profitPct = hasBoth && c > 0 ? (profitAmount / c) * 100 : null;
    const positive = profitAmount != null && profitAmount >= 0;

    return (
        <Modal
            open={open}
            title={editingMaterialCost ? 'Edit Pricing' : 'Add Pricing'}
            okText="Save"
            cancelText="Cancel"
            destroyOnClose
            onCancel={onClose}
            onOk={handleSubmit}
        >

            <Form
                layout="vertical"
                form={form}
            >

                <Form.Item
                    label="Cost (per piece)"
                    name="cost"
                    rules={[
                        {
                            required: true,
                            message: 'Please enter cost',
                        },
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        precision={2}
                        addonBefore={getCurrencySymbol()}
                        placeholder="e.g. 120 (making / purchase cost)"
                        onChange={(v) => setCost(v)}
                    />
                </Form.Item>

                <Form.Item
                    label="Sale Price (per piece)"
                    name="salePrice"
                    rules={[
                        {
                            required: true,
                            message: 'Please enter sale price',
                        },
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        precision={2}
                        addonBefore={getCurrencySymbol()}
                        placeholder="e.g. 150 (selling price)"
                        onChange={(v) => setSalePrice(v)}
                    />
                </Form.Item>

                {/* Live profit preview */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        padding: '10px 14px',
                        borderRadius: 8,
                        marginBottom: 16,
                        backgroundColor: hasBoth ? (positive ? '#ECFDF5' : '#FEF2F2') : '#F8FAFC',
                        border: `1px solid ${hasBoth ? (positive ? '#A7F3D0' : '#FECACA') : '#E2E8F0'}`,
                    }}
                >
                    <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                        Profit on each piece
                    </span>
                    {hasBoth ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 800, color: positive ? '#047857' : '#B91C1C' }}>
                            {positive ? <RiseOutlined /> : <FallOutlined />}
                            {profitPct != null ? `${positive ? '+' : ''}${profitPct.toFixed(1)}%` : '—'}
                            <span style={{ fontWeight: 600, opacity: 0.85 }}>
                                ({positive ? '+' : '−'}{getCurrencySymbol()}{Math.abs(profitAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })})
                            </span>
                        </span>
                    ) : (
                        <span style={{ color: '#94A3B8', fontSize: '0.82rem' }}>Enter cost &amp; sale price</span>
                    )}
                </div>

                <Form.Item
                    label="Effective From"
                    name="effectiveFrom"
                    rules={[
                        {
                            required: true,
                            message: 'Please select date',
                        },
                    ]}
                >
                    <DatePicker
                        style={{ width: '100%' }}
                    />
                </Form.Item>

            </Form>

        </Modal>
    );
};

export default MaterialCostModal;
