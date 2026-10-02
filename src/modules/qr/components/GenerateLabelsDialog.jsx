import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  Pagination,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import qrService, { DEFAULT_LABEL_CONFIG } from '../qrService';
import { printLabels, LABEL_CSS, labelClass, labelInnerHtml, toQrDataUrl } from '../labelPrinting';

// Labels are generated & printed in bounded runs; must match the backend cap.
const MAX_PER_RUN = 2000;
const PAGE_SIZE = 20;
const STATUS_COLOR = { AVAILABLE: 'primary', SOLD: 'success', VOID: 'default' };

/**
 * Side drawer to generate & print QR labels for one batch, in runs of up to 200.
 * Props: open, onClose, batch { batchNumber, productName, quantityAvailable, quantityReceived }, onGenerated
 */
const GenerateLabelsDialog = ({ open, onClose, batch, onGenerated }) => {
  const [count, setCount] = useState('');
  const [rangeFrom, setRangeFrom] = useState('1');
  const [rangeTo, setRangeTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [units, setUnits] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [labelConfig, setLabelConfig] = useState(null);
  const [search, setSearch] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const previewUnitsRef = React.useRef([]); // last generated run, for "Print again"

  const batchNumber = batch?.batchNumber;
  const cfg = labelConfig || DEFAULT_LABEL_CONFIG;
  const received = Number(summary?.received ?? batch?.quantityReceived ?? 0);
  const stock = Number(summary?.stock ?? batch?.quantityAvailable ?? 0);
  const availableLabels = Number(summary?.availableLabels ?? 0);
  const remaining = Number(summary?.remaining ?? Math.max(0, stock - availableLabels));
  const runLimit = Math.min(remaining, MAX_PER_RUN);
  const totalLabelled = Number(summary?.totalLabelled ?? 0);
  const fullyLabelled = !loadingSummary && remaining === 0 && stock > 0;

  const refreshSummary = () =>
    qrService.getSummary(batchNumber).then((res) => setSummary(res?.data || null));

  // One page of labels (all statuses), optional serial filter.
  const loadUnits = (p = 0, serial) => {
    setLoadingUnits(true);
    return qrService
      .getUnitsPage(batchNumber, p, PAGE_SIZE, serial)
      .then((res) => {
        const d = res?.data || {};
        setUnits(d.content || []);
        setPage(d.page || 0);
        setTotalPages(d.totalPages || 0);
        setTotalElements(d.totalElements || 0);
      })
      .catch(() => {
        setUnits([]);
        setTotalPages(0);
        setTotalElements(0);
      })
      .finally(() => setLoadingUnits(false));
  };

  useEffect(() => {
    if (!open || !batchNumber) return;
    setCount('');
    setRangeFrom('1');
    setRangeTo('');
    setError('');
    setNotice('');
    setSearch('');
    setPreviewHtml('');
    setLoadingSummary(true);
    refreshSummary().catch(() => setSummary(null)).finally(() => setLoadingSummary(false));
    loadUnits(0);
    qrService.getLabelConfig().then(setLabelConfig).catch(() => setLabelConfig(undefined));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, batchNumber]);

  // Server-side serial search (debounced) so we never load every label.
  useEffect(() => {
    if (!open || !batchNumber) return;
    const t = setTimeout(() => loadUnits(0, search.trim() || undefined), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const buildPreview = async (newUnits) => {
    previewUnitsRef.current = newUnits;
    const withQr = await Promise.all(newUnits.map(async (u) => ({ ...u, qrDataUrl: await toQrDataUrl(u) })));
    setPreviewHtml(withQr.map((u) => `<div class="${labelClass(cfg)}">${labelInnerHtml(u, cfg)}</div>`).join(''));
  };

  const handleGenerate = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const n = count ? Number(count) : undefined; // blank = backend's min(remaining, 200)
      const res = await qrService.generateUnits(batchNumber, n);
      const newUnits = res?.data?.units || [];
      await buildPreview(newUnits);
      setNotice(`Generated ${newUnits.length} label(s). Opening print…`);
      await printLabels(newUnits, { batchNumber, config: cfg });
      await refreshSummary();
      await loadUnits(page, search.trim() || undefined);
      setCount('');
      if (onGenerated) onGenerated();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate labels.');
    } finally {
      setBusy(false);
    }
  };

  const reprintPreview = async () => {
    setError('');
    try {
      await printLabels(previewUnitsRef.current, { batchNumber, config: cfg });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to print.');
    }
  };

  // Print/reprint an exact serial-range chunk, then auto-advance to the next same-size chunk.
  const handlePrintRange = async () => {
    const f = Math.max(1, Number(rangeFrom || 1));
    const t = Number(rangeTo || Math.min(f + 999, totalLabelled));
    if (totalLabelled === 0) {
      setError('No labels generated yet.');
      return;
    }
    if (!t || t < f) {
      setError("'To' must be greater than or equal to 'From'.");
      return;
    }
    if (t - f + 1 > MAX_PER_RUN) {
      setError(`You can print at most ${MAX_PER_RUN} labels at a time.`);
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await qrService.getUnitsRange(batchNumber, f, t);
      const list = res?.data || [];
      if (list.length === 0) {
        setError('No labels in that range.');
        return;
      }
      await printLabels(list, { batchNumber, config: cfg });
      setNotice(`Printing labels ${f}–${t}…`);
      const nextFrom = t + 1; // queue the next chunk of the same size
      if (nextFrom <= totalLabelled) {
        setRangeFrom(String(nextFrom));
        setRangeTo(String(Math.min(nextFrom + (t - f), totalLabelled)));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to print labels.');
    } finally {
      setBusy(false);
    }
  };

  const printOne = async (unit) => {
    setError('');
    try {
      await printLabels([unit], { batchNumber, config: cfg });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to print label.');
    }
  };

  const soldCount = Number(summary?.sold ?? 0);
  const voidCount = Number(summary?.voidCount ?? 0);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={busy ? undefined : onClose}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 460 } } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <QrCode2Icon color="primary" />
            <Typography sx={{ fontWeight: 800 }}>QR Labels — {batchNumber}</Typography>
          </Stack>
          <IconButton onClick={onClose} disabled={busy} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Body */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ fontWeight: 700 }}>{batch?.productName}</Typography>
              <Typography variant="body2" color="text.secondary">
                Batch pieces: {received} · Available stock: {stock}
              </Typography>
            </Box>

            {loadingSummary ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">Checking existing labels…</Typography>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={`${availableLabels} labelled`} color={availableLabels ? 'primary' : 'default'} variant="outlined" />
                {soldCount > 0 && <Chip size="small" label={`${soldCount} sold`} color="success" variant="outlined" />}
                {voidCount > 0 && <Chip size="small" label={`${voidCount} void`} variant="outlined" />}
                <Chip size="small" label={`${remaining} not labelled`} variant="outlined" />
              </Stack>
            )}

            {error ? <Alert severity="error">{error}</Alert> : null}
            {notice ? <Alert severity="success">{notice}</Alert> : null}

            {fullyLabelled ? (
              <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />}>
                All {stock} available piece(s) are labelled. Nothing more to generate.
              </Alert>
            ) : (
              <>
                <Divider />
                {/* Generate a run: count + generate icon right after it */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    label="Generate new labels"
                    type="number"
                    size="small"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    placeholder={`Max ${MAX_PER_RUN} at a time`}
                    inputProps={{ min: 1, max: runLimit || undefined }}
                    fullWidth
                    disabled={busy}
                  />
                  <Tooltip title="Generate & print this run">
                    <span>
                      <IconButton
                        color="primary"
                        onClick={handleGenerate}
                        disabled={busy || remaining === 0}
                        sx={{ border: '1px solid', borderColor: 'primary.main', borderRadius: 1.5 }}
                      >
                        {busy ? <CircularProgress size={20} /> : <AddIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </>
            )}

            {/* Print/reprint an exact chunk by serial range (max 2000 per print, auto-advances). */}
            {totalLabelled > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Print a chunk — labels 1 to {totalLabelled} exist (max {MAX_PER_RUN} per print)
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                  <TextField
                    label="From #"
                    type="number"
                    size="small"
                    value={rangeFrom}
                    onChange={(e) => setRangeFrom(e.target.value)}
                    inputProps={{ min: 1, max: totalLabelled }}
                    disabled={busy}
                    sx={{ width: 110 }}
                  />
                  <TextField
                    label="To #"
                    type="number"
                    size="small"
                    value={rangeTo}
                    onChange={(e) => setRangeTo(e.target.value)}
                    placeholder={`${Math.min(Number(rangeFrom || 1) + 999, totalLabelled)}`}
                    inputProps={{ min: 1, max: totalLabelled }}
                    disabled={busy}
                    sx={{ width: 110 }}
                  />
                  <Tooltip title="Print this chunk">
                    <span>
                      <IconButton
                        color="primary"
                        onClick={handlePrintRange}
                        disabled={busy}
                        sx={{ border: '1px solid', borderColor: 'primary.main', borderRadius: 1.5 }}
                      >
                        {busy ? <CircularProgress size={20} /> : <PrintIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Box>
            )}

            {/* Inline print preview of the run just generated (the browser print also opens). */}
            {previewHtml && (
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">Print preview (last run)</Typography>
                  <Button size="small" startIcon={<PrintIcon />} onClick={reprintPreview}>Print again</Button>
                </Stack>
                <style>{LABEL_CSS}</style>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 1,
                    maxHeight: 280,
                    overflowY: 'auto',
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: '#FAFAFA',
                  }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </Box>
            )}

            <Divider>
              <Typography variant="caption" color="text.secondary">All labels{totalElements ? ` (${totalElements})` : ''}</Typography>
            </Divider>

            <TextField
              size="small"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search serial (e.g. 007)…"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>
                ),
              }}
            />

            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, minHeight: 120 }}>
              {loadingUnits ? (
                <Stack alignItems="center" sx={{ py: 3 }}><CircularProgress size={20} /></Stack>
              ) : units.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
                  {search ? 'No matching serial.' : 'No labels generated yet.'}
                </Typography>
              ) : (
                units.map((u) => (
                  <Stack
                    key={u.serial}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ px: 1.5, py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{u.serial}</Typography>
                      <Chip size="small" label={u.status} color={STATUS_COLOR[u.status] || 'default'} variant="outlined" />
                    </Stack>
                    <Tooltip title="Reprint this label">
                      <IconButton size="small" onClick={() => printOne(u)} disabled={busy}>
                        <PrintIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))
              )}
            </Box>

            {totalPages > 1 && (
              <Stack alignItems="center">
                <Pagination
                  size="small"
                  count={totalPages}
                  page={page + 1}
                  onChange={(_, value) => loadUnits(value - 1, search.trim() || undefined)}
                  disabled={loadingUnits}
                />
              </Stack>
            )}
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};

export default GenerateLabelsDialog;
