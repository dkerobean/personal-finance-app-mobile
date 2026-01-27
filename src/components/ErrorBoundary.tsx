import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '@/constants/design';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred'
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    // You could send this to a crash reporting service here
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={new Error(this.state.errorMessage)}
            retry={this.handleRetry}
          />
        );
      }

      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="error-outline" size={48} color={COLORS.error} />
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>{this.state.errorMessage}</Text>
            
            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            
            <Text style={styles.helpText}>
              If this error persists, please restart the app.
            </Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundMain, // Emerald background for full screen error? Or white? Let's go white card on emerald or just white. Use White for simplicity.
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    alignItems: 'center',
    maxWidth: 320,
    backgroundColor: COLORS.white,
    padding: 32,
    borderRadius: 24,
    ...SHADOWS.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ErrorBoundary;