import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/design';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
}

interface ToastContextType {
  show: (type: ToastType, options: { title: string; description?: string; duration?: number }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);
let BurntModule: null | {
  toast: (options: Record<string, unknown>) => Promise<void> | void;
} = null;

try {
  BurntModule = require('burnt');
} catch {
  BurntModule = null;
}

const canUseNativeIosToast =
  Platform.OS === 'ios' &&
  Constants.appOwnership !== 'expo' &&
  BurntModule !== null;

const getToastConfig = (type: ToastType) => {
  switch (type) {
    case 'success':
      return { 
        icon: CheckCircle, 
        backgroundColor: COLORS.primaryLight,
        borderColor: COLORS.primary,
        iconColor: COLORS.primary,
        accentColor: '#D6FAE7',
        nativePreset: 'done' as const,
        nativeHaptic: 'success' as const,
        nativeIcon: 'checkmark.seal.fill',
      };
    case 'error':
      return { 
        icon: AlertCircle, 
        backgroundColor: '#FEF2F2',
        borderColor: COLORS.error,
        iconColor: COLORS.error,
        accentColor: '#FDE2E2',
        nativePreset: 'error' as const,
        nativeHaptic: 'error' as const,
        nativeIcon: 'xmark.octagon.fill',
      };
    case 'warning':
      return { 
        icon: AlertCircle, 
        backgroundColor: '#FFFBEB',
        borderColor: COLORS.warning,
        iconColor: COLORS.warning,
        accentColor: '#FEF3C7',
        nativePreset: 'custom' as const,
        nativeHaptic: 'warning' as const,
        nativeIcon: 'exclamationmark.triangle.fill',
      };
    case 'info':
    default:
      return { 
        icon: Info, 
        backgroundColor: COLORS.lightBlue,
        borderColor: COLORS.accent,
        iconColor: COLORS.accent,
        accentColor: '#DBEAFE',
        nativePreset: 'custom' as const,
        nativeHaptic: 'none' as const,
        nativeIcon: 'info.circle.fill',
      };
  }
};

const ToastItem: React.FC<{ 
  toast: ToastData; 
  onDismiss: (id: string) => void 
}> = ({ toast, onDismiss }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = getToastConfig(toast.type);
  const Icon = config.icon;

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      dismissToast();
    }, toast.duration);

    return () => clearTimeout(timer);
  }, []);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  };

  return (
    <Animated.View 
      style={[
        styles.toastContainer, 
        { 
          transform: [{ translateY }],
          opacity,
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        }
      ]}
    >
      <View
        style={[
          styles.accentStripe,
          { backgroundColor: config.accentColor }
        ]}
      />
      <View style={styles.toastContent}>
        <View style={[styles.iconBadge, { backgroundColor: config.accentColor }]}>
          <Icon size={20} color={config.iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{toast.title}</Text>
          {toast.description && (
            <Text style={styles.description}>{toast.description}</Text>
          )}
        </View>
        <TouchableOpacity onPress={dismissToast} style={styles.closeButton}>
          <X size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const insets = useSafeAreaInsets();

  const showNativeToast = useCallback((
    type: ToastType,
    { title, description, duration = 3200 }: { title: string; description?: string; duration?: number }
  ) => {
    if (!canUseNativeIosToast || !BurntModule) {
      return false;
    }

    const config = getToastConfig(type);
    const seconds = Math.max(1.6, Math.round(duration / 100) / 10);

    if (config.nativePreset === 'custom') {
      BurntModule.toast({
        title,
        message: description,
        preset: 'custom',
        haptic: config.nativeHaptic,
        duration: seconds,
        from: 'top',
        shouldDismissByDrag: true,
        icon: {
          ios: {
            name: config.nativeIcon,
            color: config.iconColor,
          },
        },
      });
    } else {
      BurntModule.toast({
        title,
        message: description,
        preset: config.nativePreset,
        haptic: config.nativeHaptic,
        duration: seconds,
        from: 'top',
        shouldDismissByDrag: true,
      });
    }

    return true;
  }, []);

  const show = useCallback((
    type: ToastType, 
    { title, description, duration = 3200 }: { title: string; description?: string; duration?: number }
  ) => {
    if (showNativeToast(type, { title, description, duration })) {
      return;
    }

    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, description, duration }]);
  }, [showNativeToast]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const contextValue: ToastContextType = {
    show,
    success: (title, description) => show('success', { title, description }),
    error: (title, description) => show('error', { title, description }),
    info: (title, description) => show('info', { title, description }),
    warning: (title, description) => show('warning', { title, description }),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {!canUseNativeIosToast && (
        <View style={[styles.toastWrapper, { top: insets.top + 10 }]} pointerEvents="box-none">
          {toasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </View>
      )}
    </ToastContext.Provider>
  );
};

export const useAppToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useAppToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 9999,
  },
  toastContainer: {
    marginBottom: SPACING.sm,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.lg,
    shadowOpacity: 0.12,
  },
  accentStripe: {
    height: 4,
    width: '100%',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingRight: SPACING.sm,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: COLORS.textPrimary,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fonts.medium,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: TYPOGRAPHY.lineHeights.body,
  },
  closeButton: {
    padding: SPACING.xs,
    marginTop: 2,
  },
});
