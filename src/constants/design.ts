// Design system constants based on Figma design
export const COLORS = {
  // Primary brand colors
  primary: '#00D09E',
  primaryLight: '#F1FFF3',
  primaryDark: '#093030',
  
  // Text colors
  textPrimary: '#052224',
  textSecondary: '#093030',
  textTertiary: '#9CA3AF',
  
  // Background colors
  backgroundMain: '#00D09E',
  backgroundContent: '#F1FFF3',
  backgroundCard: '#FFFFFF',
  backgroundInput: '#DFF7E2',
  
  // Accent colors
  accent: '#0068FF',
  success: '#059669',
  warning: '#f59e0b',
  error: '#dc3545',
  
  // Neutral colors
  white: '#FFFFFF',
  gray50: '#f9fafb',
  gray100: '#E5E7EB',
  gray400: '#9CA3AF',
  gray600: '#6b7280',
  gray900: '#111827',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  xxl: 22,
  huge: 31,
  round: 50,
  bottomNav: 70,
};

export const TYPOGRAPHY = {
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    huge: 28,
    massive: 32,
  },
  weights: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const MODAL = {
  // Container dimensions
  width: 339,
  height: 335,
  borderRadius: 20,
  
  // Content spacing
  titleTopSpacing: 69,
  inputTopSpacing: 110,
  buttonStartSpacing: 165,
  buttonGap: 11,
  
  // Input specifications
  inputHeight: 37,
  inputBorderRadius: 18,
  inputHorizontalSpacing: 32,
  inputWidth: 268,
  
  // Button specifications
  buttonWidth: 218,
  buttonHeight: 45,
  buttonBorderRadius: 30,
  buttonHorizontalSpacing: 57,
  
  // Background and overlay
  backdropOpacity: 0.5,
  backdropColor: '#000000',
};

export const TRANSACTIONS = {
  // Summary cards
  summaryCard: {
    width: 171,
    height: 101,
    borderRadius: 14.888,
    padding: 16,
    gap: 8,
  },
  
  // Balance card
  balanceCard: {
    width: 357,
    height: 75,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  
  // Transaction item
  transactionItem: {
    paddingVertical: 12,
    paddingHorizontal: 37,
    iconSize: 57,
    iconBorderRadius: 22,
    separatorColor: '#00D09E',
    separatorWidth: 1,
  },
  
  // Category icon colors
  categoryColors: {
    salary: '#6DB6FE',
    groceries: '#3299FF', 
    rent: '#0068FF',
    transport: '#3299FF',
    food: '#6DB6FE',
  },
  
  // Month filter
  monthFilter: {
    buttonPadding: 12,
    borderRadius: 8,
    gap: 16,
  },
};