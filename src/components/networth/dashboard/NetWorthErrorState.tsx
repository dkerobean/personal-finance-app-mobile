import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/design';

export interface NetWorthError {
  type: 'network' | 'calculation' | 'data' | 'permission' | 'unknown';
  message: string;
  details?: string;
}

interface NetWorthErrorStateProps {
  error: NetWorthError;
  onRetry?: () => void;
  onContactSupport?: () => void;
  showContactSupport?: boolean;
}

export default function NetWorthErrorState({
  error,
  onRetry,
  onContactSupport,
  showContactSupport = true,
}: NetWorthErrorStateProps): React.ReactElement {
  const getErrorConfig = () => {
    switch (error.type) {
      case 'network':
        return {
          icon: 'wifi-off' as const,
          title: 'Network Connection Issue',
          description: 'Unable to connect to our servers. Please check your internet connection and try again.',
          color: COLORS.warning,
          showRetry: true,
        };
      
      case 'calculation':
        return {
          icon: 'calculate' as const,
          title: 'Calculation Error',
          description: 'We encountered an issue calculating your net worth. This might be due to invalid data.',
          color: COLORS.error,
          showRetry: true,
        };
      
      case 'data':
        return {
          icon: 'error-outline' as const,
          title: 'Data Issue',
          description: 'Some of your financial data appears to be incomplete or corrupted.',
          color: COLORS.error,
          showRetry: false,
        };
      
      case 'permission':
        return {
          icon: 'lock' as const,
          title: 'Access Denied',
          description: 'You don\'t have permission to access this feature. Please check your account settings.',
          color: COLORS.error,
          showRetry: false,
        };
      
      default:
        return {
          icon: 'error' as const,
          title: 'Something Went Wrong',
          description: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
          color: COLORS.error,
          showRetry: true,
        };
    }
  };

  const config = getErrorConfig();

  const getTroubleshootingSteps = () => {
    switch (error.type) {
      case 'network':
        return [
          'Check your internet connection',
          'Try switching between WiFi and mobile data',
          'Restart the app',
        ];
      
      case 'calculation':
        return [
          'Review your asset and liability values',
          'Remove any assets or liabilities with invalid data',
          'Try refreshing your data',
        ];
      
      case 'data':
        return [
          'Check your recent transactions',
          'Verify all asset and liability information',
          'Consider re-adding problematic entries',
        ];
      
      case 'permission':
        return [
          'Log out and log back in',
          'Check your subscription status',
          'Contact support for account verification',
        ];
      
      default:
        return [
          'Close and reopen the app',
          'Check for app updates',
          'Clear app cache if the problem persists',
        ];
    }
  };

  const troubleshootingSteps = getTroubleshootingSteps();

  return (
    <View style={styles.container}>
      <View style={styles.errorCard}>
        {/* Error Icon and Title */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
            <MaterialIcons 
              name={config.icon} 
              size={48} 
              color={config.color} 
            />
          </View>
          <Text style={styles.title}>{config.title}</Text>
        </View>

        {/* Error Description */}
        <Text style={styles.description}>
          {config.description}
        </Text>

        {/* Detailed Error Message */}
        {error.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Error Details:</Text>
            <Text style={styles.messageText}>{error.message}</Text>
            {error.details && (
              <Text style={styles.detailsText}>{error.details}</Text>
            )}
          </View>
        )}

        {/* Troubleshooting Steps */}
        <View style={styles.troubleshootingContainer}>
          <Text style={styles.troubleshootingTitle}>Try these steps:</Text>
          {troubleshootingSteps.map((step, index) => (
            <View key={index} style={styles.troubleshootingStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {config.showRetry && onRetry && (
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={onRetry}
              activeOpacity={0.8}
            >
              <MaterialIcons name="refresh" size={20} color={COLORS.white} />
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
          
          {showContactSupport && onContactSupport && (
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={onContactSupport}
              activeOpacity={0.8}
            >
              <MaterialIcons name="support-agent" size={20} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Contact Support</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Technical Details (Collapsible) */}
        {error.details && (
          <View style={styles.technicalDetails}>
            <Text style={styles.technicalTitle}>Technical Information</Text>
            <View style={styles.technicalContent}>
              <Text style={styles.technicalText}>Error Type: {error.type}</Text>
              <Text style={styles.technicalText}>Timestamp: {new Date().toISOString()}</Text>
              {error.details && (
                <Text style={styles.technicalText}>Details: {error.details}</Text>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// Helper function to create standard errors
export const createNetWorthError = (
  type: NetWorthError['type'],
  message: string,
  details?: string
): NetWorthError => ({
  type,
  message,
  details,
});

// Common error creators
export const NetworkError = (message: string = 'Network connection failed') => 
  createNetWorthError('network', message);

export const CalculationError = (message: string = 'Net worth calculation failed') => 
  createNetWorthError('calculation', message);

export const DataError = (message: string = 'Data validation failed') => 
  createNetWorthError('data', message);

export const PermissionError = (message: string = 'Access denied') => 
  createNetWorthError('permission', message);

export const UnknownError = (message: string = 'An unexpected error occurred') => 
  createNetWorthError('unknown', message);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundContent,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  errorCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * 1.5,
    marginBottom: SPACING.lg,
  },
  messageContainer: {
    backgroundColor: COLORS.backgroundContent,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  messageLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  messageText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    marginBottom: SPACING.xs,
  },
  detailsText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  troubleshootingContainer: {
    marginBottom: SPACING.xl,
  },
  troubleshootingTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  troubleshootingStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  stepText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.sizes.sm * 1.4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  primaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  secondaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
  },
  technicalDetails: {
    backgroundColor: COLORS.backgroundContent,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  technicalTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  technicalContent: {
    gap: SPACING.xs,
  },
  technicalText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
});