import React, { useState } from 'react';
import { Modal, Radio, DatePicker, Button, Space, Typography } from 'antd';
import { FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const MAX_DAYS = 90;

type Format = 'pdf' | 'excel';

interface Props {
  open: boolean;
  title?: string;
  onClose: () => void;
  onDownload: (format: Format, fromDate: string, toDate: string) => Promise<void> | void;
}

/** Report range picker (current month / particular month / custom ≤90 days) + PDF/Excel buttons. */
const ReportDownloadDialog: React.FC<Props> = ({ open, title = 'Download report', onClose, onDownload }) => {
  const [mode, setMode] = useState<'current' | 'month' | 'range'>('current');
  const [month, setMonth] = useState<Dayjs>(dayjs());
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [busy, setBusy] = useState<Format | null>(null);
  const [error, setError] = useState('');

  const resolveRange = (): { from: string; to: string } | null => {
    if (mode === 'current') {
      const now = dayjs();
      return { from: now.startOf('month').format('YYYY-MM-DD'), to: now.endOf('month').format('YYYY-MM-DD') };
    }
    if (mode === 'month') {
      if (!month) { setError('Select a month.'); return null; }
      return { from: month.startOf('month').format('YYYY-MM-DD'), to: month.endOf('month').format('YYYY-MM-DD') };
    }
    if (!range || !range[0] || !range[1]) { setError('Select a date range.'); return null; }
    if (range[1].diff(range[0], 'day') > MAX_DAYS) { setError(`Range cannot exceed ${MAX_DAYS} days.`); return null; }
    return { from: range[0].format('YYYY-MM-DD'), to: range[1].format('YYYY-MM-DD') };
  };

  const handle = async (format: Format) => {
    setError('');
    const r = resolveRange();
    if (!r) return;
    setBusy(format);
    try {
      await onDownload(format, r.from, r.to);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Download failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal open={open} onCancel={onClose} title={title} footer={null} destroyOnClose>
      <Radio.Group
        value={mode}
        onChange={(e) => { setMode(e.target.value); setError(''); }}
        style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}
      >
        <Radio value="current">Current month</Radio>
        <Radio value="month">Particular month</Radio>
        <Radio value="range">Custom date range (max {MAX_DAYS} days)</Radio>
      </Radio.Group>

      {mode === 'month' && (
        <DatePicker
          picker="month"
          value={month}
          onChange={(d) => setMonth(d as Dayjs)}
          format="MMMM YYYY"
          allowClear={false}
          style={{ width: '100%' }}
          disabledDate={(c) => c && c.isAfter(dayjs(), 'month')}
        />
      )}
      {mode === 'range' && (
        <RangePicker
          value={range as any}
          onChange={(d) => setRange(d as any)}
          format="DD-MMM-YYYY"
          style={{ width: '100%' }}
          disabledDate={(c) => c && c.isAfter(dayjs(), 'day')}
        />
      )}

      {error && <Typography.Text type="danger" style={{ display: 'block', marginTop: 10 }}>{error}</Typography.Text>}

      <Space style={{ marginTop: 18, width: '100%', justifyContent: 'flex-end' }}>
        <Button icon={<FilePdfOutlined style={{ color: '#DC2626' }} />} loading={busy === 'pdf'} onClick={() => handle('pdf')}>
          Download PDF
        </Button>
        <Button type="primary" icon={<FileExcelOutlined />} loading={busy === 'excel'} onClick={() => handle('excel')}>
          Download Excel
        </Button>
      </Space>
    </Modal>
  );
};

export default ReportDownloadDialog;
