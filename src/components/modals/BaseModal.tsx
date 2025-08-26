import React, { useEffect } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  BackHandler,
} from 'react-native';
import { COLORS, MODAL, SHADOWS } from '@/constants/design';

interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: 'slide' | 'fade' | 'none';
  closeOnBackdropPress?: boolean;
  closeOnBackButton?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function BaseModal({
  visible,
  onClose,
  children,
  animationType = 'fade',
  closeOnBackdropPress = true,
  closeOnBackButton = true,
}: BaseModalProps): React.ReactElement {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  useEffect(() => {
    if (!closeOnBackButton) return;

    const handleBackButton = (): boolean => {
      if (visible) {
        onClose();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackButton);

    return () => backHandler.remove();
  }, [visible, onClose, closeOnBackButton]);

  const handleBackdropPress = (): void => {
    if (closeOnBackdropPress) {
      onClose();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, MODAL.backdropOpacity],
              }),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={handleBackdropPress}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.modalContent}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: MODAL.backdropColor,
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: screenWidth - 40,
    maxHeight: screenHeight - 100,
  },
  modalContent: {
    width: MODAL.width,
    height: MODAL.height,
    backgroundColor: COLORS.white,
    borderRadius: MODAL.borderRadius,
    ...SHADOWS.lg,
    elevation: 10,
  },
});