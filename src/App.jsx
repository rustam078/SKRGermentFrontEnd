import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import { notification, ConfigProvider, theme as antdTheme } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes';
import theme from './theme/theme';

// Global Ant Design theme — one compact source of truth so every antd surface
// (tables, drawers, modals, inputs) reads at a consistent, denser scale.
// Page-level ConfigProviders nest under this and inherit these tokens.
const antdConfig = {
  algorithm: antdTheme.compactAlgorithm,
  token: {
    colorPrimary: '#2563EB',
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    fontSize: 13,
    borderRadius: 8,
    controlHeight: 32,
  },
};

// Initialize TanStack React Query Client with global QueryCache error handler
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const errMsg = error.response?.data?.message || error.message || 'An error occurred while communicating with the server.';
      notification.error({
        message: 'API Request Failed',
        description: errMsg,
        placement: 'topRight',
      });
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents aggressive queries refetching on tab focus
      retry: 1, // Retries failed requests once before showing error
      staleTime: 5 * 60 * 1000, // Data remains fresh for 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ConfigProvider theme={antdConfig}>
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </ConfigProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
