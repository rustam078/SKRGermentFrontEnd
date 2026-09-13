import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Menu,
  MenuItem,
  Tooltip,
  Avatar,
  Badge,
  Divider,
  ListItemIcon,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  ExitToApp as LogoutIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../services/axios';

const Navbar = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  // Low-stock alert count for the bell (shared cache key with the Inventory page).
  const { data: lowStockAlerts } = useQuery({
    queryKey: ['lowStockAlerts'],
    queryFn: async () => {
      const res = await axiosInstance.get('/inventory/alerts');
      return Array.isArray(res.data) ? res.data : (res.data?.content || []);
    },
    refetchInterval: 60000,
  });
  const lowStockCount = lowStockAlerts?.length || 0;

  const handleOpenAlerts = () => {
    // Open the global alerts drawer on the current page — no navigation.
    window.dispatchEvent(new Event('open-inventory-alerts'));
  };

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleCloseMenu();
    logout();
    navigate('/login');
  };

  const handleProfileSettings = () => {
    handleCloseMenu();
    navigate('/settings');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#ffffff',
        color: '#0F172A',
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: { xs: 2, sm: 3 } }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onToggleSidebar}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <IconButton
          color="inherit"
          aria-label="toggle drawer desktop"
          edge="start"
          onClick={onToggleSidebar}
          sx={{ mr: 2, display: { xs: 'none', md: 'inline-flex' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h5"
          noWrap
          component="div"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(45deg, #2563EB 30%, #0F172A 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            userSelect: 'none',
          }}
        >
          SKR Garment ERP
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Low-stock alerts */}
          <Tooltip title={`Low Stock Alerts${lowStockCount > 0 ? ` (${lowStockCount})` : ''}`}>
            <IconButton color="inherit" size="large" onClick={handleOpenAlerts} aria-label="low stock alerts">
              <Badge badgeContent={lowStockCount} color="error" max={99}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Profile */}
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleOpenMenu}
              size="small"
              sx={{ ml: 1 }}
              aria-controls={anchorEl ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={anchorEl ? 'true' : undefined}
            >
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: '#2563EB',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'A'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* User Account Menu Dropdown */}
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
              mt: 1.5,
              minWidth: 200,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.name || 'Administrator'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email || 'admin@skrgarments.com'}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleProfileSettings}>
            <ListItemIcon>
              <ProfileIcon fontSize="small" />
            </ListItemIcon>
            My Profile
          </MenuItem>
          <MenuItem onClick={handleProfileSettings}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            <Typography color="error.main">Logout</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
