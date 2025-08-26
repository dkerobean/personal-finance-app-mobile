import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  TouchableOpacityProps,
} from 'react-native';
import { COLORS, MODAL, TYPOGRAPHY } from '@/constants/design';

// Modal Header Component
interface ModalHeaderProps {
  title: string;
  style?: object;
}

export function ModalHeader({ title, style }: ModalHeaderProps): React.ReactElement {
  return (
    <View style={[styles.headerContainer, style]}>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

// Modal Input Component
interface ModalInputProps extends TextInputProps {
  containerStyle?: object;
}

export function ModalInput({ 
  containerStyle, 
  style, 
  ...props 
}: ModalInputProps): React.ReactElement {
  return (
    <View style={[styles.inputContainer, containerStyle]}>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={COLORS.primary}
        {...props}
      />
    </View>
  );
}

// Primary Button Component
interface ModalButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary';
  containerStyle?: object;
}

export function ModalButton({ 
  title, 
  variant = 'primary', 
  containerStyle, 
  style, 
  ...props 
}: ModalButtonProps): React.ReactElement {
  const buttonStyle = variant === 'primary' ? styles.primaryButton : styles.secondaryButton;
  const textStyle = variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText;

  return (
    <View style={[styles.buttonContainer, containerStyle]}>
      <TouchableOpacity
        style={[buttonStyle, style]}
        activeOpacity={0.8}
        {...props}
      >
        <Text style={textStyle}>{title}</Text>
      </TouchableOpacity>
    </View>
  );
}

// Modal Footer with Button Layout
interface ModalFooterProps {
  primaryButton?: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
  };
  secondaryButton?: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
  };
  style?: object;
}

export function ModalFooter({ 
  primaryButton, 
  secondaryButton, 
  style 
}: ModalFooterProps): React.ReactElement {
  return (
    <View style={[styles.footerContainer, style]}>
      {primaryButton && (
        <ModalButton
          title={primaryButton.title}
          variant="primary"
          onPress={primaryButton.onPress}
          disabled={primaryButton.disabled}
        />
      )}
      {secondaryButton && (
        <ModalButton
          title={secondaryButton.title}
          variant="secondary"
          onPress={secondaryButton.onPress}
          disabled={secondaryButton.disabled}
          containerStyle={{ marginTop: MODAL.buttonGap }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Header Styles
  headerContainer: {
    position: 'absolute',
    top: MODAL.titleTopSpacing,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primaryDark,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },

  // Input Styles
  inputContainer: {
    position: 'absolute',
    top: MODAL.inputTopSpacing,
    left: MODAL.inputHorizontalSpacing,
    right: MODAL.inputHorizontalSpacing,
  },
  input: {
    height: MODAL.inputHeight,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: MODAL.inputBorderRadius,
    paddingHorizontal: 17,
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: 'League Spartan',
    color: COLORS.primaryDark,
  },

  // Button Styles
  buttonContainer: {
    alignItems: 'center',
  },
  primaryButton: {
    width: MODAL.buttonWidth,
    height: MODAL.buttonHeight,
    backgroundColor: COLORS.primary,
    borderRadius: MODAL.buttonBorderRadius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    width: MODAL.buttonWidth,
    height: MODAL.buttonHeight,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: MODAL.buttonBorderRadius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.primaryDark,
    textAlign: 'center',
    fontFamily: 'Poppins',
    textTransform: 'capitalize',
  },
  secondaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.primaryDark,
    textAlign: 'center',
    fontFamily: 'Poppins',
    textTransform: 'lowercase',
  },

  // Footer Styles
  footerContainer: {
    position: 'absolute',
    top: MODAL.buttonStartSpacing,
    left: MODAL.buttonHorizontalSpacing,
    right: MODAL.buttonHorizontalSpacing,
  },
});