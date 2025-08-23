/**
 * Theme System Export
 * 
 * Centralized export of the HillFusion-inspired design system
 */

// Core theme exports
export { 
  ThemeProvider, 
  useTheme, 
  withTheme, 
  createStyles, 
  useThemedStyles,
  theme 
} from './ThemeProvider';

export { 
  colors, 
  typography, 
  spacing, 
  borderRadius, 
  shadows, 
  layout, 
  textStyles, 
  componentStyles 
} from './tokens';

export type { Theme } from './tokens';

// Import colors for utility functions
import { colors } from './tokens';

// Utility functions for common theme operations
export const getFinancialColor = (
  type: 'income' | 'expense' | 'transfer',
  theme = colors
) => {
  return theme.financial[type];
};

export const getSemanticColor = (
  type: 'success' | 'warning' | 'error' | 'info',
  theme = colors
) => {
  return theme.semantic[type];
};

export const getTextColor = (
  type: 'primary' | 'secondary' | 'muted',
  theme = colors
) => {
  return theme.text[type];
};