import { useState, useCallback } from 'react';
import { AlertOptions, AlertAction } from '@/components/ui/CustomAlert';

interface AlertState {
  visible: boolean;
  options: AlertOptions;
}

export const useCustomAlert = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    options: { title: '', message: '', actions: [] },
  });

  const showAlert = useCallback((
    title: string,
    message?: string,
    actions?: AlertAction[]
  ) => {
    // Default actions if none provided
    const defaultActions: AlertAction[] = [
      { text: 'OK', style: 'default' as const }
    ];

    setAlertState({
      visible: true,
      options: {
        title,
        message,
        actions: actions || defaultActions,
      },
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  // Helper for simple alerts (like the original Alert.alert)
  const alert = useCallback((
    title: string,
    message?: string,
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>
  ) => {
    const actions: AlertAction[] = buttons?.map(button => ({
      text: button.text,
      onPress: button.onPress,
      style: button.style,
    })) || [{ text: 'OK', style: 'default' as const }];

    showAlert(title, message, actions);
  }, [showAlert]);

  return {
    alert,
    showAlert,
    hideAlert,
    alertProps: {
      visible: alertState.visible,
      options: alertState.options,
      onDismiss: hideAlert,
    },
  };
};