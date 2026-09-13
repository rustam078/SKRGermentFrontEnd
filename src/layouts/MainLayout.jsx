import React, { useState } from 'react';
import { Box, Toolbar, useTheme, useMediaQuery } from '@mui/material';
import Navbar from '../components/layout/Navbar';
import Sidebar, { DRAWER_WIDTH } from '../components/layout/Sidebar';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* Header AppBar */}
      <Navbar onToggleSidebar={handleToggleSidebar} sidebarOpen={sidebarOpen} />

      {/* Side Navigation Menu */}
      <Sidebar
        open={sidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        variant={isMdUp ? 'permanent' : 'temporary'}
      />

      {/* Primary Page Canvas */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2.5, md: 4 },
          height: '100vh',
          overflow: 'auto',
          width: {
            xs: '100%',
            md: sidebarOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%',
          },
          marginLeft: 0,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Spacer for Toolbar alignment */}
        <Toolbar sx={{ minHeight: 64, mb: 1 }} />
        
        {/* Render child routes */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
