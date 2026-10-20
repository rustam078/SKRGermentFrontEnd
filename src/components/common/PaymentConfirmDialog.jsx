import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Stack, Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

/**
 * Shared "confirm before submit" dialog for Sale + Investment.
 * Shows payment mode, amounts and — most importantly — the leftover due,
 * so the user doesn't accidentally submit an unpaid (udhaar) bill.
 */
const PaymentConfirmDialog = ({
  open, onCancel, onConfirm, loading = false,
  title = 'Confirm', confirmText = 'Confirm',
  rows = [], dueAmount = 0, dueText = '', dueNote = '',
}) => (
  <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ fontWeight: 800, color: '#0F172A' }}>{title}</DialogTitle>
    <DialogContent>
      <Stack spacing={1.1} sx={{ mt: 0.5 }}>
        {rows.map((r, i) => (
          <Stack key={i} direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ color: '#64748B', fontSize: '0.88rem' }}>{r.label}</Typography>
            <Typography sx={{ color: '#0F172A', fontWeight: r.strong ? 800 : 600, fontSize: r.strong ? '1rem' : '0.9rem' }}>
              {r.value}
            </Typography>
          </Stack>
        ))}
      </Stack>

      {dueAmount > 0 ? (
        <Box sx={{ mt: 1.75, p: 1.25, borderRadius: 1.5, bgcolor: 'rgba(185,28,28,0.08)', border: '1px solid #FCA5A5' }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <WarningAmberIcon sx={{ color: '#B91C1C', fontSize: 18 }} />
            <Typography sx={{ color: '#B91C1C', fontWeight: 800, fontSize: '0.92rem' }}>
              Due / Udhaar: {dueText}
            </Typography>
          </Stack>
          <Typography sx={{ color: '#991B1B', fontSize: '0.78rem', mt: 0.5 }}>
            {dueNote || 'Yeh amount baaki (udhaar) reh jayega. Confirm karne se pehle amount received check kar lo.'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ mt: 1.75, p: 1.25, borderRadius: 1.5, bgcolor: 'rgba(22,163,74,0.08)', border: '1px solid #86EFAC' }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <CheckCircleOutlineIcon sx={{ color: '#16A34A', fontSize: 18 }} />
            <Typography sx={{ color: '#15803D', fontWeight: 800, fontSize: '0.92rem' }}>Fully paid — no due</Typography>
          </Stack>
        </Box>
      )}
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onCancel} disabled={loading} sx={{ textTransform: 'none', color: '#64748B' }}>Cancel</Button>
      <Button variant="contained" onClick={onConfirm} disabled={loading} sx={{ textTransform: 'none', fontWeight: 700 }}>
        {loading ? 'Saving…' : confirmText}
      </Button>
    </DialogActions>
  </Dialog>
);

export default PaymentConfirmDialog;
