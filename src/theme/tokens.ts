/**
 * Design Tokens - HillFusion Inspired
 * 
 * Based on actual analysis of HillFusion's website design system.
 * Emphasizes clean, minimal aesthetic with high contrast and professional styling.
 */

export const colors = {
  // Core Colors (Minimal Palette)
  primary: '#000000',      // Pure black for primary text and elements
  background: '#ffffff',   // Pure white for clean backgrounds
  surface: '#f9fafb',     // Very subtle gray for secondary surfaces
  border: '#e5e7eb',      // Light gray for subtle borders
  
  // Text Colors (High Contrast)
  text: {
    primary: '#000000',    // Pure black for primary text
    secondary: '#4b5563',  // Professional gray for secondary text
    muted: '#9ca3af',      // Subtle gray for disabled/muted text
  },
  
  // Semantic Colors (Minimal Usage)
  semantic: {
    success: '#16a34a',    // Clean green for positive states
    warning: '#d97706',    // Professional amber for warnings
    error: '#dc2626',      // Minimal red for errors
    info: '#2563eb',       // Subtle blue for information
  },
  
  // Financial Colors (Restrained)
  financial: {
    income: '#16a34a',     // Clean green for income
    expense: '#dc2626',    // Minimal red for expenses
    transfer: '#000000',   // Primary black for transfers
  },
  
  // Interactive States
  interactive: {
    hover: '#f3f4f6',      // Light gray for hover states
    pressed: '#e5e7eb',    // Slightly darker for pressed states
    disabled: '#f9fafb',   // Very light gray for disabled states
  },
};

export const typography = {
  // Font Families (System Native)
  fontFamily: {
    system: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
    mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'monospace'],
  },
  
  // Font Sizes (HillFusion Scale)
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 56,
  },
  
  // Font Weights (Professional Range)
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    xbold: '800' as const,
  },
  
  // Line Heights (Generous Spacing)
  lineHeight: {
    tight: 1.1,
    snug: 1.15,
    base: 1.5,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: -0.02,
    normal: 0,
    wide: 0.05,
  },
};

export const spacing = {
  // Spacing Scale (Consistent System)
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
};

export const borderRadius = {
  // Border Radius (Minimal Approach)
  none: 0,
  sm: 4,
  base: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

export const shadows = {
  // Shadows (Minimal, Professional)
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
};

export const layout = {
  // Layout Constants
  screenPadding: 16,
  cardPadding: 24,
  containerMaxWidth: 400,
  
  // Component Sizes
  button: {
    small: { paddingVertical: 8, paddingHorizontal: 16 },
    medium: { paddingVertical: 12, paddingHorizontal: 24 },
    large: { paddingVertical: 16, paddingHorizontal: 32 },
  },
  
  input: {
    medium: { paddingVertical: 12, paddingHorizontal: 16 },
    large: { paddingVertical: 16, paddingHorizontal: 20 },
  },
};

// Pre-defined Text Styles (HillFusion Inspired)
export const textStyles = {
  // Headings
  h1: {
    fontSize: typography.fontSize['6xl'],
    fontWeight: typography.fontWeight.xbold,
    lineHeight: typography.lineHeight.tight,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
  },
  h2: {
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.snug,
    color: colors.text.primary,
  },
  h3: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.base,
    color: colors.text.primary,
  },
  h4: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.base,
    color: colors.text.primary,
  },
  h5: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.base,
    color: colors.text.primary,
  },
  h6: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.base,
    color: colors.text.primary,
  },
  
  // Body Text
  bodyLarge: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.relaxed,
    color: colors.text.primary,
  },
  body: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.relaxed,
    color: colors.text.primary,
  },
  bodySmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.base,
    color: colors.text.secondary,
  },
  
  // Financial Text
  financialLarge: {
    fontFamily: typography.fontFamily.mono.join(', '),
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    color: colors.text.primary,
  },
  financialMedium: {
    fontFamily: typography.fontFamily.mono.join(', '),
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.base,
    color: colors.text.primary,
  },
  financialSmall: {
    fontFamily: typography.fontFamily.mono.join(', '),
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.base,
    color: colors.text.primary,
  },
  
  // Labels and Captions
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.base,
    color: colors.text.primary,
  },
  caption: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.base,
    color: colors.text.muted,
  },
};

// Component Style Presets
export const componentStyles = {
  // Cards
  card: {
    default: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      padding: layout.cardPadding,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.base,
    },
    outlined: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      padding: layout.cardPadding,
      borderWidth: 2,
      borderColor: colors.border,
    },
    flat: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      padding: layout.cardPadding,
    },
  },
  
  // Buttons
  button: {
    primary: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.base,
      ...layout.button.medium,
    },
    secondary: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.base,
      ...layout.button.medium,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: borderRadius.base,
      ...layout.button.medium,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: borderRadius.base,
      ...layout.button.medium,
    },
  },
  
  // Inputs
  input: {
    default: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.base,
      ...layout.input.medium,
      fontSize: typography.fontSize.base,
      color: colors.text.primary,
    },
    large: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.base,
      ...layout.input.large,
      fontSize: typography.fontSize.lg,
      color: colors.text.primary,
    },
    currency: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.base,
      ...layout.input.medium,
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.mono.join(', '),
      textAlign: 'right' as const,
      color: colors.text.primary,
    },
  },
};

// Export complete theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  layout,
  textStyles,
  componentStyles,
} as const;

export type Theme = typeof theme;