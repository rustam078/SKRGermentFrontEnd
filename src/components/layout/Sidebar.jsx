import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Collapse,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ExpandLess,
  ExpandMore,
  Factory as ProductionIcon,
  People as EmployeesIcon,
  Inventory as InventoryIcon,
  Category as ProductsIcon,
  ReceiptLong as SalesIcon,
  PointOfSale as PointOfSaleIcon,
  ListAlt as ListIcon,
  Settings as SettingsIcon,
  AccountBalanceWallet as InvestmentIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 228;
const MINI_DRAWER_WIDTH = 68;

const NAVIGATION_ITEMS = [
  { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { text: 'Production', path: '/production', icon: <ProductionIcon /> },
  { text: 'Inventory', path: '/inventory', icon: <InventoryIcon /> },
  { text: 'Products', path: '/products', icon: <ProductsIcon /> },
  { text: 'Investment', path: '/investment', icon: <InvestmentIcon /> },
  { text: 'Employees', path: '/employees', icon: <EmployeesIcon /> },
  { text: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

const SALES_SUBMENU = [
  { text: 'Dashboard', path: '/sales/dashboard', icon: <DashboardIcon /> },
  // { text: 'New Sale', path: '/sales/new', icon: <PointOfSaleIcon /> },
  { text: 'Sales List', path: '/sales/list', icon: <ListIcon /> },
];

const Sidebar = ({ open, onToggleSidebar, variant = 'permanent' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [salesOpen, setSalesOpen] = useState(true);

  useEffect(() => {
    if (location.pathname.startsWith('/sales')) {
      setSalesOpen(true);
    }
  }, [location.pathname]);

  const handleNavigation = (path) => {
    navigate(path);
    if (variant === 'temporary') {
      onToggleSidebar();
    }
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Space matching top navbar */}
      <Toolbar sx={{ minHeight: 64 }} />
      
      <Box sx={{ px: open ? 2.5 : 0, py: 2, textAlign: open ? 'left' : 'center' }}>
        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: open ? 'block' : 'none' }}>
          Navigation
        </Typography>
        {!open && <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Nav</Typography>}
      </Box>

      <List sx={{ px: 1.5, flexGrow: 1 }}>
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || 
                           (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: '10px',
                  py: 1,
                  px: open ? 2 : 1.5,
                  justifyContent: open ? 'initial' : 'center',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  backgroundColor: isActive ? '#2563EB' : 'transparent',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    color: '#FFFFFF',
                    backgroundColor: isActive ? '#2563EB' : 'rgba(255, 255, 255, 0.05)',
                    '& .MuiListItemIcon-root': {
                      color: '#FFFFFF',
                    },
                  },
                  '& .MuiListItemIcon-root': {
                    color: isActive ? '#FFFFFF' : '#64748B',
                    minWidth: open ? 36 : 'auto',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease-in-out',
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    opacity: open ? 1 : 0,
                    display: open ? 'block' : 'none',
                    transition: 'opacity 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  primaryTypographyProps={{
                    fontSize: '0.84rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}

        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => setSalesOpen((prev) => !prev)}
            sx={{
              borderRadius: '10px',
              py: 1.25,
              px: open ? 2 : 1.5,
              justifyContent: open ? 'initial' : 'center',
              color: location.pathname.startsWith('/sales') ? '#FFFFFF' : '#94A3B8',
              backgroundColor: location.pathname.startsWith('/sales') ? '#2563EB' : 'transparent',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                color: '#FFFFFF',
                backgroundColor: location.pathname.startsWith('/sales') ? '#2563EB' : 'rgba(255, 255, 255, 0.05)',
                '& .MuiListItemIcon-root': {
                  color: '#FFFFFF',
                },
              },
              '& .MuiListItemIcon-root': {
                color: location.pathname.startsWith('/sales') ? '#FFFFFF' : '#64748B',
                minWidth: open ? 40 : 'auto',
                justifyContent: 'center',
                transition: 'all 0.2s ease-in-out',
              },
            }}
          >
            <ListItemIcon>
              <SalesIcon />
            </ListItemIcon>
            <ListItemText
              primary="Sales"
              sx={{
                opacity: open ? 1 : 0,
                display: open ? 'block' : 'none',
                transition: 'opacity 0.2s',
                whiteSpace: 'nowrap',
              }}
              primaryTypographyProps={{ fontSize: '0.84rem', fontWeight: 500 }}
            />
            {open && (salesOpen ? <ExpandLess sx={{ color: '#94A3B8' }} /> : <ExpandMore sx={{ color: '#94A3B8' }} />)}
          </ListItemButton>
        </ListItem>

        <Collapse in={salesOpen && open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 4 }}>
            {SALES_SUBMENU.map((subitem) => {
              const isActive = location.pathname === subitem.path;
              return (
                <ListItem key={subitem.text} disablePadding>
                  <ListItemButton
                    onClick={() => handleNavigation(subitem.path)}
                    sx={{
                      borderRadius: '10px',
                      py: 0.75,
                      px: 2,
                      justifyContent: 'initial',
                      color: isActive ? '#FFFFFF' : '#94A3B8',
                      backgroundColor: isActive ? '#2563EB' : 'transparent',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        color: '#FFFFFF',
                        backgroundColor: isActive ? '#2563EB' : 'rgba(255, 255, 255, 0.05)',
                        '& .MuiListItemIcon-root': {
                          color: '#FFFFFF',
                        },
                      },
                      '& .MuiListItemIcon-root': {
                        color: isActive ? '#FFFFFF' : '#64748B',
                        minWidth: 36,
                        justifyContent: 'center',
                        transition: 'all 0.2s ease-in-out',
                      },
                    }}
                  >
                    <ListItemIcon>{subitem.icon}</ListItemIcon>
                    <ListItemText
                      primary={subitem.text}
                      sx={{
                        opacity: open ? 1 : 0,
                        display: open ? 'block' : 'none',
                        transition: 'opacity 0.2s',
                      }}
                      primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: isActive ? 600 : 500 }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Collapse>
      </List>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
      
      <Box sx={{ p: 2.5, textAlign: 'center' }}>
        <Typography variant="caption" display="block" sx={{ color: '#64748B', opacity: open ? 1 : 0, display: open ? 'block' : 'none' }}>
          SKR Garment ERP v1.0.0
        </Typography>
      </Box>
    </Box>
  );

  // Render exactly one drawer for the active breakpoint. Rendering both and
  // toggling with CSS `display` left the temporary modal permanently mounted
  // and "open" on desktop, so MUI's modal backdrop/scroll-lock machinery ran
  // there — producing a stray dark scrim over the page content.
  const isTemporary = variant === 'temporary';

  if (isTemporary) {
    return (
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={open}
          onClose={onToggleSidebar}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>
    );
  }

  return (
    <Box
      component="nav"
      sx={{ width: open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH, flexShrink: 0, transition: 'width 0.2s ease-in-out' }}
    >
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            borderRight: 'none',
            overflowX: 'hidden',
            transition: 'width 0.2s ease-in-out',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
export { DRAWER_WIDTH, MINI_DRAWER_WIDTH };
