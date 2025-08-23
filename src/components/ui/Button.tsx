/**
 * Button Component - HillFusion Clean Design
 * 
 * Minimal button component emphasizing clarity and system-native feel
 */

import React from 'react';
import { 
  TouchableOpacity, 
  TouchableOpacityProps, 
  ViewStyle, 
  TextStyle,
  ActivityIndicator 
} from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  children,
  style,
  ...props
}) => {
  const theme = useTheme();

  // Get base style from variant
  const baseStyle = theme.componentStyles.button[variant];

  // Size adjustments
  const sizeStyles: ViewStyle = {
    ...(size === 'small' && theme.layout.button.small),
    ...(size === 'large' && theme.layout.button.large),
  };

  // Full width style
  const fullWidthStyle: ViewStyle = fullWidth ? { width: '100%' } : {};

  // Disabled style
  const disabledStyle: ViewStyle = (disabled || loading) ? {
    opacity: 0.5,
  } : {};

  // Combine all styles
  const buttonStyle: ViewStyle = {
    ...baseStyle,
    ...sizeStyles,
    ...fullWidthStyle,
    ...disabledStyle,
    // Ensure text is centered
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  };

  // Text color based on variant
  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
        return theme.colors.background;
      case 'secondary':
      case 'outline':
        return theme.colors.text.primary;
      case 'ghost':
        return theme.colors.text.secondary;
      default:
        return theme.colors.text.primary;
    }
  };

  // Text weight based on variant
  const getTextWeight = (): 'medium' | 'semibold' | 'bold' => {
    switch (variant) {
      case 'primary':
        return 'semibold';
      case 'secondary':
      case 'outline':
        return 'medium';
      case 'ghost':
        return 'medium';
      default:
        return 'medium';
    }
  };

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
          style={{ marginRight: theme.spacing[2] }}
        />
      )}
      
      {typeof children === 'string' ? (
        <Text
          variant="body"
          color={getTextColor()}
          weight={getTextWeight()}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

// Specialized button variants for common use cases
export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="primary" {...props} />
);

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="secondary" {...props} />
);

export const OutlineButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="outline" {...props} />
);

export const GhostButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="ghost" {...props} />
);