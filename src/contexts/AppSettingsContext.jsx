import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import settingsService from '../services/settingsService';
import { setCurrencySymbol, formatMoney } from '../utils/currency';

const AppSettingsContext = createContext(null);

// Fallbacks used before settings load (or if the API is unavailable).
const DEFAULTS = {
  COMPANY_NAME: 'SKR Garment',
  COMPANY_ADDRESS: '',
  COMPANY_CONTACT: '',
  COMPANY_GSTIN: '',
  DEFAULT_GST_PERCENT: '0',
  SALES_GST_ENABLED: 'false',
  CURRENCY_SYMBOL: '₹',
  MENU_ORDER: '["dashboard","production","inventory","products","investment","employees","sales","settings"]',
};

/**
 * Loads company profile + invoice defaults (currency symbol, GST %) once and exposes
 * them app-wide. Company info is read live everywhere; changing it in Settings and
 * refetching updates every consumer. Currency symbol is also pushed into the module-level
 * cache in utils/currency so non-React code can format money identically.
 */
export const AppSettingsProvider = ({ children }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['appSettings'],
    queryFn: settingsService.getAll,
    staleTime: 10 * 60 * 1000,
  });

  const map = useMemo(() => ({ ...DEFAULTS, ...(data || {}) }), [data]);

  // Keep the module-level currency cache in sync for plain (non-React) formatters.
  useEffect(() => {
    setCurrencySymbol(map.CURRENCY_SYMBOL);
  }, [map.CURRENCY_SYMBOL]);

  const value = useMemo(() => {
    const gstPercent = Number(map.DEFAULT_GST_PERCENT) || 0;
    const gstEnabled = String(map.SALES_GST_ENABLED).toLowerCase() === 'true';
    const currencySymbol = map.CURRENCY_SYMBOL || '₹';
    let menuOrder = [];
    try {
      const parsed = JSON.parse(map.MENU_ORDER);
      if (Array.isArray(parsed)) menuOrder = parsed.filter((k) => typeof k === 'string');
    } catch { /* keep empty → sidebar uses its built-in order */ }
    return {
      isLoading,
      raw: map,
      menuOrder,
      company: {
        name: map.COMPANY_NAME,
        address: map.COMPANY_ADDRESS,
        contact: map.COMPANY_CONTACT,
        gstin: map.COMPANY_GSTIN,
      },
      companyName: map.COMPANY_NAME,
      gstPercent,
      gstEnabled,
      currencySymbol,
      // Convenience formatter bound to the current symbol.
      money: (v, opts) => formatMoney(v, opts),
    };
  }, [map, isLoading]);

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
};

export const useAppSettings = () => {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used within an AppSettingsProvider');
  return ctx;
};
