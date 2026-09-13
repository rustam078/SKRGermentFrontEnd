import React, { useState } from 'react';
import { Box, Button, InputAdornment, TextField } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import qrService from '../qrService';
import CameraScanner from './CameraScanner';

/**
 * Scan-to-add bar for a sale form. A focused text field captures keyboard-wedge
 * scanners (they "type" the code + Enter); a camera button opens the in-app scanner.
 * On a valid scan it resolves the unit via the API and calls onUnit(unit).
 *
 * Props: onUnit(unit), onError(message)
 */
const ScanBar = ({ onUnit, onError }) => {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const lookup = async (code) => {
    const trimmed = (code || '').trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const res = await qrService.scan(trimmed);
      onUnit(res?.data);
    } catch (err) {
      onError?.(err.response?.data?.message || err.message || 'Scan failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = value;
      setValue('');
      lookup(code);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
      <TextField
        autoFocus
        size="small"
        fullWidth
        value={value}
        disabled={busy}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Scan a QR tag (or type a serial) and press Enter"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <QrCodeScannerIcon fontSize="small" color="primary" />
            </InputAdornment>
          ),
        }}
        sx={{ '& .MuiInputBase-root': { bgcolor: '#F0F9FF' } }}
      />
      <Button
        variant="outlined"
        startIcon={<PhotoCameraIcon />}
        onClick={() => setCameraOpen(true)}
        sx={{ whiteSpace: 'nowrap' }}
      >
        Camera
      </Button>

      <CameraScanner
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onDecode={(text) => lookup(text)}
      />
    </Box>
  );
};

export default ScanBar;
