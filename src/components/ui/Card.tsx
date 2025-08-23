/**
 * Card Component - HillFusion Clean Design
 * 
 * Minimal card component with clean backgrounds and subtle borders
 */

import React from 'react';
import { View, ViewProps, ViewStyle, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useTheme } from '@/theme';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'outlined' | 'flat';
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  size = 'medium',
  interactive = false,
  onPress,
  style,
  children,
  ...props
}) => {
  const theme = useTheme();

  // Get base style from variant
  const baseStyle = theme.componentStyles.card[variant];

  // Size adjustments
  const sizeAdjustments: ViewStyle = {
    ...(size === 'small' && { padding: theme.spacing[4] }),
    ...(size === 'large' && { padding: theme.spacing[8] }),
  };

  // Interactive styles
  const interactiveStyle: ViewStyle = interactive ? {
    // No visual changes in static state for clean design
  } : {};

  const computedStyle: ViewStyle = {
    ...baseStyle,
    ...sizeAdjustments,
    ...interactiveStyle,
  };

  if (interactive || onPress) {
    return (
      <TouchableOpacity
        style={[computedStyle, style]}
        onPress={onPress}
        activeOpacity={0.95}
        {...(props as TouchableOpacityProps)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[computedStyle, style]} {...props}>
      {children}
    </View>
  );
};

// Financial Summary Card - specialized for account balances
export interface FinancialSummaryCardProps extends Omit<CardProps, 'children'> {
  title: string;
  amount: number;
  currency?: string;
  trend?: {
    value: number;
    period: string;
    direction: 'up' | 'down' | 'neutral';
  };
  subtitle?: string;
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  title,
  amount,
  currency = '$',
  trend,
  subtitle,
  ...cardProps
}) => {
  const theme = useTheme();

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getTrendColor = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up': return theme.colors.financial.income;
      case 'down': return theme.colors.financial.expense;
      case 'neutral': return theme.colors.text.secondary;
    }
  };

  return (
    <Card {...cardProps}>
      <View>
        {/* Title */}
        <Text 
          style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing[4],
          }}
        >
          {title}
        </Text>

        {/* Amount */}
        <Text 
          style={{
            fontFamily: theme.typography.fontFamily.mono.join(', '),
            fontSize: theme.typography.fontSize['5xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            lineHeight: theme.typography.lineHeight.tight,
            marginBottom: theme.spacing[2],
          }}
        >
          {formatAmount(amount)}
        </Text>

        {/* Trend */}
        {trend && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: getTrendColor(trend.direction),
              }}
            >
              {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
              {Math.abs(trend.value)}% {trend.period}
            </Text>
          </View>
        )}

        {/* Subtitle */}
        {subtitle && (
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.muted,
              marginTop: theme.spacing[2],
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </Card>
  );
};

// Import Text component (would be imported in actual implementation)
const Text = ({ children, style, ...props }: any) => (
  <View style={style} {...props}>{children}</View>
);