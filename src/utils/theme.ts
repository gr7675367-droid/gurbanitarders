// ============================================================
// GURBANI TRADERS - Theme Constants
// Modern White + Green + Dark Gray professional theme
// ============================================================

export const COLORS = {
  // Primary Green Palette
  primary: '#2E7D32',        // Deep Forest Green
  primaryLight: '#4CAF50',   // Medium Green
  primaryLighter: '#81C784', // Light Green
  primaryPale: '#E8F5E9',    // Very Light Green (backgrounds)

  // Dark Gray Palette
  dark: '#1A1A2E',           // Almost Black
  darkGray: '#2D2D2D',       // Dark Gray
  mediumGray: '#616161',     // Medium Gray
  lightGray: '#9E9E9E',      // Light Gray
  veryLightGray: '#F5F5F5',  // Background Gray
  border: '#E0E0E0',         // Border Gray

  // White
  white: '#FFFFFF',
  offWhite: '#FAFAFA',

  // Semantic Colors
  success: '#2E7D32',
  warning: '#F57C00',
  error: '#C62828',
  info: '#1565C0',

  // Card & Surface
  surface: '#FFFFFF',
  surfaceElevated: '#F9FBF9',
  cardShadow: 'rgba(0,0,0,0.08)',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#616161',
  textMuted: '#9E9E9E',
  textOnGreen: '#FFFFFF',

  // Accent for charts / highlights
  accent1: '#FF8F00',  // Amber
  accent2: '#1565C0',  // Blue
  accent3: '#6A1B9A',  // Purple

  // Dark mode variants (used when dark mode enabled)
  darkBg: '#121212',
  darkSurface: '#1E1E1E',
  darkCard: '#252525',
  darkBorder: '#333333',
  darkTextPrimary: '#E0E0E0',
  darkTextSecondary: '#9E9E9E',
};

export const FONTS = {
  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Unit options for products
export const PRODUCT_UNITS = [
  'KG', 'Gram', 'Litre', 'ML', 'Piece',
  'Packet', 'Box', 'Dozen', 'Sack', 'Bottle',
];

// Currency
export const CURRENCY = 'Rs.';
export const CURRENCY_CODE = 'PKR';

// App Info
export const APP_INFO = {
  name: 'GURBANI TRADERS',
  tagline: 'Professional Inventory Management',
  owner1: { name: 'Ravi Gurbani', phone: '03334223716' },
  owner2: { name: 'Kabeer Gurbani', phone: '03113581308' },
};

export default COLORS;
