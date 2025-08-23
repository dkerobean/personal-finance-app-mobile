/**
 * Theme Provider - HillFusion Inspired Design System
 * 
 * Provides the clean, minimal theme throughout the application
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { theme, Theme } from './tokens';

// Theme Context
const ThemeContext = createContext<Theme | undefined>(undefined);

// Theme Provider Props
interface ThemeProviderProps {
  children: ReactNode;
  customTheme?: Partial<Theme>;
}

/**
 * ThemeProvider component that provides the HillFusion-inspired theme
 * throughout the component tree.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  customTheme 
}) => {
  // Merge custom theme with default theme
  const mergedTheme = customTheme 
    ? { ...theme, ...customTheme }
    : theme;

  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access the theme from any component within ThemeProvider
 */
export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

/**
 * Higher-order component to inject theme as props
 */
export const withTheme = <P extends object>(
  Component: React.ComponentType<P & { theme: Theme }>
) => {
  return (props: P) => {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
};

/**
 * Utility function to create themed styles with TypeScript support
 */
export const createStyles = <T extends Record<string, any>>(
  styleFactory: (theme: Theme) => T
) => {
  return (theme: Theme): T => styleFactory(theme);
};

/**
 * Hook for creating themed styles within components
 */
export const useThemedStyles = <T extends Record<string, any>>(
  styleFactory: (theme: Theme) => T
): T => {
  const theme = useTheme();
  return React.useMemo(() => styleFactory(theme), [theme, styleFactory]);
};

// Export theme tokens for direct use
export { theme };
export type { Theme };