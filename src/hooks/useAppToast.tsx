import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
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

const { width } = Dimensions.get('window');

const getToastConfig = (type: ToastType) => {
  switch (type) {
    case 'success':
      return { 
        icon: CheckCircle, 
        backgroundColor: COLORS.primaryLight,
        borderColor: COLORS.primary,
        iconColor: COLORS.primary 
      };
    case 'error':
      return { 
        icon: AlertCircle, 
        backgroundColor: '#FEF2F2',
        borderColor: COLORS.error,
        iconColor: COLORS.error 
      };
    case 'warning':
      return { 
        icon: AlertCircle, 
        backgroundColor: '#FFFBEB',
        borderColor: COLORS.warning,
        iconColor: COLORS.warning 
      };
    case 'info':
    default:
      return { 
        icon: Info, 
        backgroundColor: COLORS.lightBlue,
        borderColor: COLORS.accent,
        iconColor: COLORS.accent 
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
          borderLeftColor: config.borderColor,
        }
      ]}
    >
      <View style={styles.toastContent}>
        <Icon size={22} color={config.iconColor} />
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

  const show = useCallback((
    type: ToastType, 
    { title, description, duration = 3000 }: { title: string; description?: string; duration?: number }
  ) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, description, duration }]);
  }, []);

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
      <View style={[styles.toastWrapper, { top: insets.top + 10 }]} pointerEvents="box-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </View>
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
    borderRadius: BORDER_RADIUS.lg,
    borderLeftWidth: 4,
    ...SHADOWS.lg,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingRight: SPACING.sm,
  },
  textContainer: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: SPACING.xs,
  },
});
