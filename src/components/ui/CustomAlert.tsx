import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY, MODAL } from '@/constants/design';

export interface AlertAction {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'destructive' | 'cancel';
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

export default function CustomAlert({ visible, options, onDismiss }: CustomAlertProps) {
  const { title, message, actions = [] } = options;

  const handleActionPress = (action: AlertAction) => {
    onDismiss();
    if (action.onPress) {
      action.onPress();
    }
  };

  const getButtonStyle = (action: AlertAction) => {
    switch (action.style) {
      case 'destructive':
        return styles.primaryButton;
      case 'cancel':
        return styles.secondaryButton;
      default:
        return styles.primaryButton;
    }
  };

  const getButtonTextStyle = (action: AlertAction) => {
    switch (action.style) {
      case 'destructive':
        return styles.primaryButtonText;
      case 'cancel':
        return styles.secondaryButtonText;
      default:
        return styles.primaryButtonText;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* Title */}
          <Text style={styles.title}>{title.toUpperCase()}</Text>
          
          {/* Message */}
          {message && (
            <Text style={styles.message}>{message}</Text>
          )}
          
          {/* Actions */}
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionButton, getButtonStyle(action)]}
                onPress={() => handleActionPress(action)}
              >
                <Text style={getButtonTextStyle(action)}>
                  {action.text.toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  alertContainer: {
    width: MODAL.width,
    height: MODAL.height,
    backgroundColor: COLORS.white,
    borderRadius: MODAL.borderRadius,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryDark,
    fontFamily: 'Poppins',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: SPACING.sm,
  },
  message: {
    fontSize: 14,
    fontWeight: '400',
    color: '#363130',
    fontFamily: 'Poppins',
    textAlign: 'center',
    lineHeight: 20,
    flex: 1,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: MODAL.buttonGap,
  },
  actionButton: {
    width: MODAL.buttonWidth,
    height: MODAL.buttonHeight,
    borderRadius: MODAL.buttonBorderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.backgroundInput,
  },
  primaryButtonText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Poppins',
    textTransform: 'uppercase',
  },
  secondaryButtonText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Poppins',
    textTransform: 'uppercase',
  },
});