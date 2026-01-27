import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '@/constants/design';

export interface AlertAction {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'destructive' | 'cancel'; // destructive = red, cancel = gray, default = primary
}

export interface AlertOptions {
  title: string;
  message?: string;
  actions?: AlertAction[];
}

interface CustomAlertProps {
  visible: boolean;
  options: AlertOptions;
  onDismiss: () => void;
}

const { width } = Dimensions.get('window');

export default function CustomAlert({ visible, options, onDismiss }: CustomAlertProps) {
  const { title, message, actions = [] } = options;

  const handleActionPress = (action: AlertAction) => {
    onDismiss();
    if (action.onPress) {
      action.onPress();
    }
  };

  const isDestructive = (action: AlertAction) => action.style === 'destructive';
  const isCancel = (action: AlertAction) => action.style === 'cancel';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* Icon/Header Indicator */}
          <View style={styles.iconContainer}>
            <MaterialIcons 
              name={title.toLowerCase().includes('error') ? 'error-outline' : 'info-outline'} 
              size={32} 
              color={COLORS.primary} 
            />
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{title}</Text>
            {message && (
              <Text style={styles.message}>{message}</Text>
            )}
          </View>
          
          {/* Actions */}
          <View style={[
            styles.actionsContainer, 
            actions.length > 2 && styles.actionsContainerVertical // Stack vertically if > 2 actions
          ]}>
            {actions.length === 0 ? (
               // Default OK button if no actions provided
               <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={onDismiss}
              >
                <Text style={styles.primaryButtonText}>OK</Text>
              </TouchableOpacity>
            ) : (
              actions.map((action, index) => {
                const isPrimary = !isDestructive(action) && !isCancel(action);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.actionButton,
                      // Layout logic: if 2 buttons, split 50/50. If vertical, full width.
                      actions.length === 2 && styles.actionButtonHalf,
                      actions.length > 2 && styles.actionButtonFull,
                      
                      // Style logic
                      isPrimary && styles.primaryButton,
                      isDestructive(action) && styles.destructiveButton,
                      isCancel(action) && styles.cancelButton,
                    ]}
                    onPress={() => handleActionPress(action)}
                  >
                    <Text style={[
                      styles.buttonText,
                      isPrimary && styles.primaryButtonText,
                      isDestructive(action) && styles.destructiveButtonText,
                      isCancel(action) && styles.cancelButtonText,
                    ]}>
                      {action.text}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Slightly lighter backdrop
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  alertContainer: {
    width: Math.min(width - 48, 340), // Responsive Max Width
    backgroundColor: COLORS.white,
    borderRadius: 24, // Softer corners
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  iconContainer: {
    marginBottom: SPACING.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight, // Light green background for icon
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  actionsContainerVertical: {
    flexDirection: 'column',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  actionButtonHalf: {
    flex: 1,
  },
  actionButtonFull: {
    width: '100%',
    marginBottom: SPACING.xs,
  },
  
  // Button Variants
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  destructiveButton: {
    backgroundColor: '#FEE2E2', // Light red bg
  },
  cancelButton: {
    backgroundColor: '#F1F5F9', // Slate 100
  },

  // Text Variants
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  destructiveButtonText: {
    color: '#EF4444', // Red text
  },
  cancelButtonText: {
    color: '#334155', // Slate 700
  },
});