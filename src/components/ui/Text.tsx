/**
 * Text Component - HillFusion Clean Design
 * 
 * Minimal text component with pre-defined styles based on HillFusion's typography
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { useTheme } from '@/theme';

export interface TextProps extends RNTextProps {
  variant?: 
    | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    | 'bodyLarge' | 'body' | 'bodySmall'
    | 'financialLarge' | 'financialMedium' | 'financialSmall'
    | 'label' | 'caption';
  color?: 'primary' | 'secondary' | 'muted' | 'income' | 'expense' | 'transfer' | string;
  align?: 'left' | 'center' | 'right';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'xbold';
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color,
  align,
  weight,
  style,
  children,
  ...props
}) => {
  const theme = useTheme();

  // Get base style from variant
  const baseStyle = theme.textStyles[variant] || theme.textStyles.body;

  // Create computed style
  const computedStyle: TextStyle = {
    ...baseStyle,
  };

  // Apply color override
  if (color) {
    if (color === 'primary' || color === 'secondary' || color === 'muted') {
      computedStyle.color = theme.colors.text[color];
    } else if (color === 'income' || color === 'expense' || color === 'transfer') {
      computedStyle.color = theme.colors.financial[color];
    } else {
      computedStyle.color = color;
    }
  }

  // Apply text alignment
  if (align) {
    computedStyle.textAlign = align;
  }

  // Apply font weight override
  if (weight) {
    computedStyle.fontWeight = theme.typography.fontWeight[weight];
  }

  return (
    <RNText
      style={[computedStyle, style]}
      {...props}
    >
      {children}
    </RNText>
  );
};

// Export common text components for convenience
export const Heading1: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="h1" {...props} />
);

export const Heading2: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="h2" {...props} />
);

export const Heading3: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="h3" {...props} />
);

export const BodyText: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="body" {...props} />
);

export const FinancialAmount: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="financialMedium" {...props} />
);

export const Caption: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="caption" {...props} />
);