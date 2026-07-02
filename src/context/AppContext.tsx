// ============================================================
// GURBANI TRADERS - App Context
// Global state: dark mode, settings, refresh triggers
// ============================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAllSettings, setSetting, type AppSettings } from '../database/settings';
import { COLORS } from '../utils/theme';

interface AppContextType {
  settings: AppSettings;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  updateSetting: (key: keyof AppSettings, value: string) => void;
  refreshSettings: () => void;
  colors: typeof COLORS & {
    bg: string;
    surface: string;
    card: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
  };
}

const defaultSettings: AppSettings = {
  business_name: 'GURBANI TRADERS',
  shop_address: 'Karachi, Pakistan',
  contact1: '03334223716',
  contact2: '03113581308',
  currency: 'Rs.',
  currency_code: 'PKR',
  dark_mode: '0',
  low_stock_threshold: '10',
  tax_enabled: '0',
  tax_rate: '0',
};

const AppContext = createContext<AppContextType>({
  settings: defaultSettings,
  isDarkMode: false,
  toggleDarkMode: () => {},
  updateSetting: () => {},
  refreshSettings: () => {},
  colors: {
    ...COLORS,
    bg: COLORS.white,
    surface: COLORS.white,
    card: COLORS.white,
    border: COLORS.border,
    textPrimary: COLORS.textPrimary,
    textSecondary: COLORS.textSecondary,
    textMuted: COLORS.textMuted,
  },
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const loadSettings = useCallback(() => {
    try {
      const s = getAllSettings();
      setSettings(s);
      setIsDarkMode(s.dark_mode === '1');
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, []);

  const toggleDarkMode = () => {
    const newVal = isDarkMode ? '0' : '1';
    setSetting('dark_mode', newVal);
    setIsDarkMode(!isDarkMode);
    setSettings(prev => ({ ...prev, dark_mode: newVal }));
  };

  const updateSetting = (key: keyof AppSettings, value: string) => {
    setSetting(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Dynamic color palette based on dark mode
  const colors = {
    ...COLORS,
    bg: isDarkMode ? COLORS.darkBg : COLORS.offWhite,
    surface: isDarkMode ? COLORS.darkSurface : COLORS.white,
    card: isDarkMode ? COLORS.darkCard : COLORS.white,
    border: isDarkMode ? COLORS.darkBorder : COLORS.border,
    textPrimary: isDarkMode ? COLORS.darkTextPrimary : COLORS.textPrimary,
    textSecondary: isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary,
    textMuted: isDarkMode ? '#666' : COLORS.textMuted,
  };

  return (
    <AppContext.Provider value={{
      settings,
      isDarkMode,
      toggleDarkMode,
      updateSetting,
      refreshSettings: loadSettings,
      colors,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

// ─── FORMAT CURRENCY ──────────────────────────────────────────
export const formatCurrency = (amount: number, currency = 'Rs.'): string => {
  return `${currency} ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};
