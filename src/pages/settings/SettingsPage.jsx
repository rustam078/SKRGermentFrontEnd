import React, { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import ReorderRoundedIcon from '@mui/icons-material/ReorderRounded';
import PieChartOutlineRoundedIcon from '@mui/icons-material/PieChartOutlineRounded';
import HeadingInfo from '../../components/common/HeadingInfo';
import QrLabelSettings from '../../modules/qr/components/QrLabelSettings';
import ThresholdSettings from './ThresholdSettings';
import CompanyInvoiceSettings from './CompanyInvoiceSettings';
import MenuOrderSettings from './MenuOrderSettings';
import ChartSettings from './ChartSettings';

// Registry of settings sections — add future settings here and they get search + collapse for free.
const SECTIONS = [
  {
    id: 'company-invoice',
    title: 'Company & Invoice',
    subtitle: 'Company profile, GST %, currency symbol',
    keywords: 'company name address contact gstin gst percent currency symbol invoice tax rupee dollar profile business',
    icon: <BusinessRoundedIcon color="primary" />,
    render: () => <CompanyInvoiceSettings />,
  },
  {
    id: 'menu-order',
    title: 'Menu Order',
    subtitle: 'Reorder the left navigation menu',
    keywords: 'menu order sidebar navigation left arrange sort position dashboard reorder',
    icon: <ReorderRoundedIcon color="primary" />,
    render: () => <MenuOrderSettings />,
  },
  {
    id: 'dashboard-charts',
    title: 'Dashboard Charts',
    subtitle: 'Show/hide names on pie charts',
    keywords: 'dashboard chart pie label name leader line show hide report graph',
    icon: <PieChartOutlineRoundedIcon color="primary" />,
    render: () => <ChartSettings />,
  },
  {
    id: 'qr-label',
    title: 'QR Label Settings',
    subtitle: 'What prints on each garment QR label',
    keywords: 'qr label print barcode name price serial vertical orientation sticker tag',
    icon: <QrCode2Icon color="primary" />,
    render: () => <QrLabelSettings />,
  },
  {
    id: 'low-stock-threshold',
    title: 'Low Stock Threshold',
    subtitle: 'When products are flagged as low stock',
    keywords: 'low stock threshold inventory alert reorder minimum level bell',
    icon: <TuneRoundedIcon color="primary" />,
    render: () => <ThresholdSettings />,
  },
];

const SettingsPage = () => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState({});

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => SECTIONS.filter((s) => !q || `${s.title} ${s.subtitle} ${s.keywords}`.toLowerCase().includes(q)),
    [q]
  );

  // While searching, matching sections are auto-expanded; otherwise use per-section toggle state.
  const isExpanded = (id) => (q ? true : !!open[id]);
  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
        System Settings
        <HeadingInfo text="Search and configure enterprise rules and preferences." />
      </Typography>

      <TextField
        fullWidth
        size="small"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search settings…"
        sx={{ maxWidth: 420, mb: 3, bgcolor: '#fff' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          ),
        }}
      />

      <Stack spacing={1.5}>
        {filtered.map((s) => (
          <Accordion
            key={s.id}
            expanded={isExpanded(s.id)}
            onChange={() => { if (!q) toggle(s.id); }}
            disableGutters
            sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              '&:before': { display: 'none' },
              overflow: 'hidden',
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.5 } }}>
              {s.icon}
              <Box>
                <Typography sx={{ fontWeight: 800 }}>{s.title}</Typography>
                <Typography variant="caption" color="text.secondary">{s.subtitle}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
              {s.render()}
            </AccordionDetails>
          </Accordion>
        ))}

        {filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5, color: 'text.disabled' }}>
            <Typography>No settings match “{query}”.</Typography>
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
};

export default SettingsPage;
