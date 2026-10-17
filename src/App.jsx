import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import { notification } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { AppThemeProvider } from './contexts/ThemeColorContext';
import AppRoutes from './routes';

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
      <AppThemeProvider>
        <AuthProvider>
          <AppSettingsProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AppSettingsProvider>
        </AuthProvider>
      </AppThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
