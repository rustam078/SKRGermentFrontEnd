import React from 'react';
import { ColorPicker, Button, Space } from 'antd';
import { Box, Typography } from '@mui/material';
import { useThemeColor, DEFAULT_PRIMARY } from '../../contexts/ThemeColorContext';

// A few tasteful presets alongside the default; all are deep, button-friendly tones.
const PRESETS = [DEFAULT_PRIMARY, '#1E293B', '#0F766E', '#7C3AED', '#B45309', '#BE123C'];

// Lets the user pick the app's primary (theme) color. Saved on this device and
// applied live to every button, accent and the Total Amount panels.
const ThemeSettings = () => {
  const { primary, setPrimary } = useThemeColor();

  return (
    <Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Pick your primary colour — it applies to all buttons, highlights and the Total Amount panels.
        Saved on this device.
      </Typography>

      <Space size={16} align="center" wrap>
        <ColorPicker
          value={primary}
          onChangeComplete={(c) => setPrimary(c.toHexString())}
          presets={[{ label: 'Suggested', colors: PRESETS }]}
          showText
          size="large"
        />
        <Button onClick={() => setPrimary(DEFAULT_PRIMARY)} disabled={primary?.toLowerCase() === DEFAULT_PRIMARY.toLowerCase()}>
          Reset to default
        </Button>
      </Space>

      <Box sx={{ mt: 2.5, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', mr: 0.5 }}>Quick picks:</Typography>
        {PRESETS.map((c) => (
          <button
            key={c}
            onClick={() => setPrimary(c)}
            title={c}
            style={{
              width: 26, height: 26, borderRadius: 6, cursor: 'pointer',
              background: c,
              border: primary?.toLowerCase() === c.toLowerCase() ? '2px solid #0F172A' : '2px solid #E2E8F0',
            }}
          />
        ))}
      </Box>

      <Box sx={{ mt: 3, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
          Preview
        </Typography>
        <Box sx={{ mt: 1.25, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button type="primary">Primary Button</Button>
          <Box sx={{ px: 2, py: 1, color: '#fff', fontWeight: 800, borderRadius: 1, bgcolor: 'primary.main' }}>
            Total Amount ₹0
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ThemeSettings;
