import React, { createContext, useContext, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { makeTheme } from '../theme/theme';

const STORAGE_KEY = 'skr_theme_primary';
export const DEFAULT_PRIMARY = '#2B3D62';

const ThemeColorContext = createContext(null);

// Access the current primary color and a setter from anywhere in the app.
export const useThemeColor = () => useContext(ThemeColorContext) || { primary: DEFAULT_PRIMARY, setPrimary: () => {}, defaultPrimary: DEFAULT_PRIMARY };

const readStored = () => {
  try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_PRIMARY; } catch { return DEFAULT_PRIMARY; }
};

/**
 * Holds the app's primary (theme) color on this device and feeds it to both the
 * MUI theme and the Ant Design ConfigProvider, so every button/accent re-themes live.
 */
export const AppThemeProvider = ({ children }) => {
  const [primary, setPrimaryState] = useState(readStored);

  const setPrimary = (color) => {
    const next = color || DEFAULT_PRIMARY;
    setPrimaryState(next);
    try {
      if (color) localStorage.setItem(STORAGE_KEY, next);
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* storage unavailable — keep in-memory */ }
  };

  const muiTheme = useMemo(() => makeTheme(primary), [primary]);
  const antdConfig = useMemo(() => ({
    algorithm: antdTheme.compactAlgorithm,
    token: {
      colorPrimary: primary,
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      fontSize: 13,
      borderRadius: 8,
      controlHeight: 32,
    },
  }), [primary]);

  const value = useMemo(() => ({ primary, setPrimary, defaultPrimary: DEFAULT_PRIMARY }), [primary]);

  return (
    <ThemeColorContext.Provider value={value}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <ConfigProvider theme={antdConfig}>
          {children}
        </ConfigProvider>
      </ThemeProvider>
    </ThemeColorContext.Provider>
  );
};
