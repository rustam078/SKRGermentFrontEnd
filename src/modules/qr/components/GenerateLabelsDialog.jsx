import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import PrintIcon from '@mui/icons-material/Print';
import qrService from '../qrService';
import { printLabels } from '../labelPrinting';

/**
 * Generate & print QR labels for one inventory batch.
 * Props: open, onClose, batch { batchNumber, productName, quantityAvailable, quantityReceived }, onGenerated
 */
const GenerateLabelsDialog = ({ open, onClose, batch, onGenerated }) => {
  const [count, setCount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [existing, setExisting] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [labelConfig, setLabelConfig] = useState(null);

  const batchNumber = batch?.batchNumber;
  const received = Number(batch?.quantityReceived ?? batch?.quantityAvailable ?? 0);
  const remaining = Math.max(0, received - existing.length);

  useEffect(() => {
    if (!open || !batchNumber) return;
    setCount('');
    setError('');
    setNotice('');
    setLoadingExisting(true);
    qrService
      .getUnits(batchNumber)
      .then((res) => setExisting(res?.data || []))
      .catch(() => setExisting([]))
      .finally(() => setLoadingExisting(false));
    qrService.getLabelConfig().then(setLabelConfig).catch(() => setLabelConfig(undefined));
  }, [open, batchNumber]);

  const handleGenerate = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const n = count ? Number(count) : undefined;
      const res = await qrService.generateUnits(batchNumber, n);
      const newUnits = res?.data?.units || [];
      setNotice(`Generated ${newUnits.length} label(s). Opening print…`);
      await printLabels(newUnits, { batchNumber, config: labelConfig });
      // refresh existing list
      const all = await qrService.getUnits(batchNumber);
      setExisting(all?.data || []);
      setCount('');
      if (onGenerated) onGenerated();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate labels.');
    } finally {
      setBusy(false);
    }
  };

  const handleReprintAll = async () => {
    setBusy(true);
    setError('');
    try {
      const all = await qrService.getUnits(batchNumber);
      await printLabels(all?.data || [], { batchNumber, config: labelConfig });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load labels.');
    } finally {
      setBusy(false);
    }
  };

  const soldCount = existing.filter((u) => u.status === 'SOLD').length;
  const voidCount = existing.filter((u) => u.status === 'VOID').length;

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800 }}>
        <QrCode2Icon color="primary" /> QR Labels — {batchNumber}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Box>
            <Typography sx={{ fontWeight: 700 }}>{batch?.productName}</Typography>
            <Typography variant="body2" color="text.secondary">
              Batch pieces: {received} · Available: {Number(batch?.quantityAvailable ?? 0)}
            </Typography>
          </Box>

          {loadingExisting ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">Checking existing labels…</Typography>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip size="small" label={`${existing.length} labelled`} color={existing.length ? 'primary' : 'default'} variant="outlined" />
              {soldCount > 0 && <Chip size="small" label={`${soldCount} sold`} color="success" variant="outlined" />}
              {voidCount > 0 && <Chip size="small" label={`${voidCount} void`} variant="outlined" />}
              <Chip size="small" label={`${remaining} not labelled`} variant="outlined" />
            </Stack>
          )}

          {error ? <Alert severity="error">{error}</Alert> : null}
          {notice ? <Alert severity="success">{notice}</Alert> : null}

          <Divider />

          <TextField
            label="How many to generate"
            type="number"
            size="small"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            placeholder={remaining ? `${remaining} (all remaining)` : 'nothing left to label'}
            helperText={`Serials continue from the batch's last number. Leave blank to label all ${remaining} remaining.`}
            inputProps={{ min: 1, max: remaining || undefined }}
            fullWidth
            disabled={remaining === 0}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={busy}>Close</Button>
        {existing.length > 0 && (
          <Button onClick={handleReprintAll} disabled={busy} startIcon={<PrintIcon />}>
            Reprint all
          </Button>
        )}
        <Button
          onClick={handleGenerate}
          variant="contained"
          disabled={busy || remaining === 0}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <QrCode2Icon />}
        >
          Generate &amp; Print
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GenerateLabelsDialog;
