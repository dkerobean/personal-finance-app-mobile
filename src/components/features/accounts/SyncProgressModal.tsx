import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SyncProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: 'idle' | 'fetching' | 'storing' | 'completed' | 'error';
  transactionCount?: number;
  errorMessage?: string;
  autoCloseDelay?: number; // in milliseconds
  accountType?: 'bank' | 'mobile_money';
  platformSource?: 'mono' | 'mtn_momo';
  institutionName?: string;
}

const getSyncSteps = (platformSource: 'mono' | 'mtn_momo' = 'mtn_momo', accountType: 'bank' | 'mobile_money' = 'mobile_money') => {
  if (platformSource === 'mono' || accountType === 'bank') {
    return [
      { key: 'fetching', label: 'Fetching bank account information...', progress: 33 },
      { key: 'storing', label: 'Processing and categorizing transactions...', progress: 66 },
      { key: 'completed', label: 'Bank sync complete!', progress: 100 },
    ] as const;
  } else {
    return [
      { key: 'fetching', label: 'Fetching MTN MoMo transactions...', progress: 33 },
      { key: 'storing', label: 'Processing mobile money data...', progress: 66 },
      { key: 'completed', label: 'MoMo sync complete!', progress: 100 },
    ] as const;
  }
};

export function SyncProgressModal({
  isOpen,
  onClose,
  syncStatus,
  transactionCount = 0,
  errorMessage,
  autoCloseDelay = 3000,
  accountType = 'mobile_money',
  platformSource,
  institutionName,
}: SyncProgressModalProps) {
  // Auto-close timer for successful sync
  React.useEffect(() => {
    if (syncStatus === 'completed' && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [syncStatus, autoCloseDelay, onClose]);

  const syncSteps = getSyncSteps(platformSource, accountType);

  const getCurrentStep = () => {
    switch (syncStatus) {
      case 'fetching':
        return syncSteps[0];
      case 'storing':
        return syncSteps[1];
      case 'completed':
        return syncSteps[2];
      default:
        return syncSteps[0];
    }
  };

  const currentStep = getCurrentStep();
  const isLoading = syncStatus === 'fetching' || syncStatus === 'storing';
  const isCompleted = syncStatus === 'completed';
  const isError = syncStatus === 'error';

  const getStatusIcon = () => {
    if (isCompleted) {
      return (
        <MaterialIcons name="check-circle" size={48} color="#059669" />
      );
    }
    if (isError) {
      return (
        <MaterialIcons name="error" size={48} color="#dc3545" />
      );
    }
    if (isLoading) {
      return (
        <ActivityIndicator size="large" color="#2563eb" />
      );
    }
    return (
      <MaterialIcons name="info" size={48} color="#0ea5e9" />
    );
  };

  const getStatusMessage = () => {
    if (isError) {
      return errorMessage || 'An error occurred during sync';
    }
    if (isCompleted) {
      const platformText = platformSource === 'mono' || accountType === 'bank' ? 'bank transaction' : 'mobile money transaction';
      const institutionText = institutionName ? ` from ${institutionName}` : '';
      const platformPrefix = platformSource === 'mono' ? 'Bank' : platformSource === 'mtn_momo' ? 'MoMo' : '';
      return `${platformPrefix}: Imported ${transactionCount} ${platformText}${transactionCount !== 1 ? 's' : ''}${institutionText}`;
    }
    return currentStep.label;
  };

  const getProgressValue = () => {
    if (isError) return 0;
    if (isCompleted) return 100;
    return currentStep.progress;
  };

  const ProgressBar = ({ progress }: { progress: number }) => (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${progress}%` }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>
        {Math.round(progress)}% complete
      </Text>
    </View>
  );

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={isLoading ? undefined : onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {platformSource === 'mono' ? 'Bank Account Sync' : 
               platformSource === 'mtn_momo' ? 'MTN MoMo Sync' :
               accountType === 'bank' ? 'Bank Account Sync' : 'MTN MoMo Sync'}
            </Text>
            {!isLoading && (
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={onClose}
              >
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Body */}
          <View style={styles.body}>
            {/* Status Icon */}
            <View style={styles.iconContainer}>
              {getStatusIcon()}
            </View>

            {/* Progress Bar */}
            {!isError && (
              <ProgressBar progress={getProgressValue()} />
            )}

            {/* Status Message */}
            <View style={styles.messageContainer}>
              <Text 
                style={[
                  styles.statusMessage,
                  isError && styles.errorMessage,
                  isCompleted && styles.successMessage
                ]}
              >
                {getStatusMessage()}
              </Text>

              {isCompleted && transactionCount > 0 && (
                <Text style={styles.successSubMessage}>
                  Your transaction history has been updated successfully!
                </Text>
              )}

              {isError && (
                <Text style={styles.errorSubMessage}>
                  Please try again or contact support if the problem persists.
                </Text>
              )}
            </View>

            {/* Loading Steps Indicator */}
            {isLoading && (
              <View style={styles.stepsContainer}>
                {syncSteps.map((step, index) => {
                  const isCurrentStep = step.key === syncStatus;
                  const isCompletedStep = 
                    (syncStatus === 'storing' && step.key === 'fetching');

                  return (
                    <View key={step.key} style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepDot,
                          isCompletedStep && styles.stepDotCompleted,
                          isCurrentStep && styles.stepDotCurrent,
                        ]}
                      />
                      <Text 
                        style={[
                          styles.stepLabel,
                          (isCompletedStep || isCurrentStep) && styles.stepLabelActive,
                          isCurrentStep && styles.stepLabelCurrent
                        ]}
                      >
                        {step.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            {!isLoading && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onClose}
              >
                <Text style={styles.secondaryButtonText}>
                  {isCompleted ? 'Close' : 'Cancel'}
                </Text>
              </TouchableOpacity>
            )}

            {isError && (
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, styles.retryButton]}
                onPress={onClose}
              >
                <Text style={styles.primaryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  closeButton: {
    padding: 4,
  },
  body: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorMessage: {
    color: '#dc3545',
  },
  successMessage: {
    fontWeight: '600',
  },
  successSubMessage: {
    fontSize: 14,
    color: '#059669',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  errorSubMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  stepsContainer: {
    width: '100%',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
    marginRight: 12,
  },
  stepDotCompleted: {
    backgroundColor: '#059669',
  },
  stepDotCurrent: {
    backgroundColor: '#2563eb',
  },
  stepLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  stepLabelActive: {
    color: '#374151',
  },
  stepLabelCurrent: {
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  retryButton: {
    marginLeft: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
});