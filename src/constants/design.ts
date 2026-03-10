// Design system constants based on Figma design
export const COLORS = {
  // Primary brand colors
  primary: '#006D4F',
  primaryLight: '#F0FDF4',
  primaryDark: '#022C22',
  secondary: '#0FB67A',
  
  // Text colors
  textPrimary: '#0F172A', // Slate 900
  textSecondary: '#1E293B', // Slate 800
  textTertiary: '#475569', // Slate 600
  textInverse: '#FFFFFF',

  // Gradients
  emeraldGradientStart: '#006D4F',
  emeraldGradientEnd: '#10B981',
  
  // Background colors
  backgroundMain: '#006D4F',
  backgroundContent: '#F8FAFC',
  backgroundCard: '#FFFFFF',
  backgroundInput: '#F1F5F9',
  border: '#CBD5E1',
  
  // Accent colors
  accent: '#3B82F6', // Blue
  lightBlue: '#E0F2FE',
  success: '#006D4F', // Aligned with primary
  warning: '#F59E0B',
  error: '#EF4444',
  
  // Neutral colors
  white: '#FFFFFF',
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray400: '#94A3B8',
  gray600: '#475569',
  gray900: '#0F172A',
};

export const SPACING = {
  xs: 4,
  sm: 9,
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

const FONT_FAMILY = {
  light: 'PlusJakartaSans_300Light',
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  display: 'PlusJakartaSans_700Bold',
};

export const TYPOGRAPHY = {
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 17,
    xl: 19,
    xxl: 21,
    xxxl: 26,
    huge: 30,
    massive: 34,
  },
  weights: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 18,
    body: 22,
    relaxed: 28,
    display: 40,
    hero: 48,
  },
  fonts: FONT_FAMILY, // Expose font family names
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 8,
  },
};

export const MODAL = {
  // Container dimensions - optimized for mobile
  width: 280,
  height: 220,
  borderRadius: 20,
  
  // Content spacing
  titleTopSpacing: 30,
  inputTopSpacing: 110,
  buttonStartSpacing: 120,
  buttonGap: 12,
  
  // Input specifications
  inputHeight: 37,
  inputBorderRadius: 18,
  inputHorizontalSpacing: 32,
  inputWidth: 240,
  
  // Button specifications
  buttonWidth: 200,
  buttonHeight: 40,
  buttonBorderRadius: 30,
  buttonHorizontalSpacing: 40,
  
  // Background and overlay
  backdropOpacity: 0.6,
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

export const BUDGET = {
  // Gradient colors from Figma
  gradientColors: {
    start: '#006D4F',
    end: '#006D4F',
  },
  
  // Circular progress indicator
  circularProgress: {
    size: 167,
    strokeWidth: 10,
    iconSize: 50,
    iconColor: '#FFFFFF',
    progressColor: '#006D4F',
    backgroundStroke: '#FFFFFF',
  },
  
  // Progress bar
  progressBar: {
    height: 27,
    borderRadius: 13.5,
    backgroundColor: '#E2E8F0',
    fillColor: '#006D4F',
    textColor: '#FFFFFF',
  },
  
  // Summary sections
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    padding: 20,
    marginHorizontal: 50,
  },
  
  // Transaction items
  transactionItem: {
    iconSize: 57,
    iconBorderRadius: 22,
    backgroundColor: '#F1F5F9',
    titleColor: '#0F172A',
    subtitleColor: '#64748B',
    amountColor: '#0F172A',
  },
  
  // Button
  addButton: {
    backgroundColor: '#006D4F',
    borderRadius: 30,
    height: 36,
    textColor: '#FFFFFF',
  },
};
