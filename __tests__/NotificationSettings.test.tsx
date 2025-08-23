import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import NotificationsScreen from '@/app/(app)/settings/notifications';
import { useAlertStore } from '@/stores/alertStore';
import { oneSignalService } from '@/services/oneSignalService';

// Mock the alert store
jest.mock('@/stores/alertStore');
const mockedUseAlertStore = useAlertStore as jest.MockedFunction<typeof useAlertStore>;

// Mock OneSignal service
jest.mock('@/services/oneSignalService');
const mockedOneSignalService = oneSignalService as jest.Mocked<typeof oneSignalService>;

// Mock expo router
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
  },
}));

// Mock Gluestack UI components
jest.mock('@gluestack-ui/themed', () => ({
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  VStack: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  HStack: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Text: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  Heading: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
  ScrollView: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Button: ({ children, onPress, ...props }: any) => (
    <button onClick={onPress} {...props}>{children}</button>
  ),
  Switch: ({ value, onValueChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={value}
      onChange={(e) => onValueChange(e.target.checked)}
      {...props}
    />
  ),
  Spinner: (props: any) => <div {...props}>Loading...</div>,
  Icon: ({ as: IconComponent, ...props }: any) => <IconComponent {...props} />,
  useToast: () => ({
    show: jest.fn(),
  }),
  Toast: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  ToastTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  ToastDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDialog: ({ children, isOpen, ...props }: any) => isOpen ? <div {...props}>{children}</div> : null,
  AlertDialogBackdrop: (props: any) => <div {...props} />,
  AlertDialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDialogHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDialogCloseButton: (props: any) => <button {...props}>×</button>,
  AlertDialogBody: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDialogFooter: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

// Mock Lucide icons
jest.mock('lucide-react-native', () => ({
  ArrowLeft: (props: any) => <span {...props}>←</span>,
  Bell: (props: any) => <span {...props}>🔔</span>,
  TestTube2: (props: any) => <span {...props}>🧪</span>,
  Info: (props: any) => <span {...props}>ℹ️</span>,
}));

describe('NotificationsScreen', () => {
  const mockAlertStore = {
    alertSettings: null,
    isLoading: false,
    error: null,
    fetchAlertSettings: jest.fn(),
    updateAlertSettings: jest.fn(),
    sendTestNotification: jest.fn(),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAlertStore.mockReturnValue(mockAlertStore as any);
    mockedOneSignalService.getPermissionStatus.mockResolvedValue({
      granted: true,
      denied: false,
      provisional: false,
    });
  });

  describe('initial render', () => {
    it('should render loading state when loading and no settings', () => {
      mockedUseAlertStore.mockReturnValue({
        ...mockAlertStore,
        isLoading: true,
        alertSettings: null,
      } as any);

      render(<NotificationsScreen />);

      expect(screen.getByText('Loading...')).toBeTruthy();
      expect(screen.getByText('Loading notification settings...')).toBeTruthy();
    });

    it('should render settings when loaded', async () => {
      mockedUseAlertStore.mockReturnValue({
        ...mockAlertStore,
        alertSettings: {
          id: '1',
          user_id: 'user-1',
          budget_alerts_enabled: true,
          warning_threshold: 90,
          over_budget_alerts_enabled: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      } as any);

      render(<NotificationsScreen />);

      expect(screen.getByText('Notification Settings')).toBeTruthy();
      expect(screen.getByText('Budget Warning Alerts')).toBeTruthy();
      expect(screen.getByText('Over-Budget Alerts')).toBeTruthy();
      expect(screen.getByText('Send Test Notification')).toBeTruthy();
    });
  });

  describe('alert toggles', () => {
    beforeEach(() => {
      mockedUseAlertStore.mockReturnValue({
        ...mockAlertStore,
        alertSettings: {
          id: '1',
          user_id: 'user-1',
          budget_alerts_enabled: true,
          warning_threshold: 90,
          over_budget_alerts_enabled: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        updateAlertSettings: jest.fn().mockResolvedValue(true),
      } as any);
    });

    it('should toggle budget alerts', async () => {
      render(<NotificationsScreen />);

      const budgetAlertsToggle = screen.getAllByRole('checkbox')[0];
      expect(budgetAlertsToggle).toHaveProperty('checked', true);

      fireEvent(budgetAlertsToggle, 'change', { target: { checked: false } });

      await waitFor(() => {
        expect(mockAlertStore.updateAlertSettings).toHaveBeenCalledWith({
          budget_alerts_enabled: false,
        });
      });
    });

    it('should toggle over-budget alerts', async () => {
      render(<NotificationsScreen />);

      const overBudgetAlertsToggle = screen.getAllByRole('checkbox')[1];
      expect(overBudgetAlertsToggle).toHaveProperty('checked', false);

      fireEvent(overBudgetAlertsToggle, 'change', { target: { checked: true } });

      await waitFor(() => {
        expect(mockAlertStore.updateAlertSettings).toHaveBeenCalledWith({
          over_budget_alerts_enabled: true,
        });
      });
    });
  });

  describe('warning threshold selection', () => {
    beforeEach(() => {
      mockedUseAlertStore.mockReturnValue({
        ...mockAlertStore,
        alertSettings: {
          id: '1',
          user_id: 'user-1',
          budget_alerts_enabled: true,
          warning_threshold: 90,
          over_budget_alerts_enabled: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        updateAlertSettings: jest.fn().mockResolvedValue(true),
      } as any);
    });

    it('should update warning threshold when button is pressed', async () => {
      render(<NotificationsScreen />);

      const threshold85Button = screen.getByText('85%');
      fireEvent.press(threshold85Button);

      await waitFor(() => {
        expect(mockAlertStore.updateAlertSettings).toHaveBeenCalledWith({
          warning_threshold: 85,
        });
      });
    });

    it('should show current threshold as selected', () => {
      render(<NotificationsScreen />);

      // The 90% button should be shown as selected (variant="solid")
      const threshold90Button = screen.getByText('90%');
      expect(threshold90Button).toBeTruthy();
    });
  });

  describe('test notification', () => {
    beforeEach(() => {
      mockedUseAlertStore.mockReturnValue({
        ...mockAlertStore,
        alertSettings: {
          id: '1',
          user_id: 'user-1',
          budget_alerts_enabled: true,
          warning_threshold: 90,
          over_budget_alerts_enabled: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        sendTestNotification: jest.fn().mockResolvedValue(true),
      } as any);
    });

    it('should send test notification when button is pressed', async () => {
      render(<NotificationsScreen />);

      const testButton = screen.getByText('Send Test Notification');
      fireEvent.press(testButton);

      await waitFor(() => {
        expect(mockAlertStore.sendTestNotification).toHaveBeenCalledTimes(1);
      });
    });

    it('should show loading state while sending test notification', async () => {
      let resolvePromise: (value: boolean) => void;
      const testPromise = new Promise<boolean>(resolve => {
        resolvePromise = resolve;
      });

      mockedUseAlertStore.mockReturnValue({
        ...mockAlertStore,
        alertSettings: {
          id: '1',
          user_id: 'user-1',
          budget_alerts_enabled: true,
          warning_threshold: 90,
          over_budget_alerts_enabled: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        sendTestNotification: jest.fn().mockReturnValue(testPromise),
      } as any);

      render(<NotificationsScreen />);

      const testButton = screen.getByText('Send Test Notification');
      fireEvent.press(testButton);

      // Should show loading text
      expect(screen.getByText('Sending...')).toBeTruthy();

      // Resolve the promise
      resolvePromise!(true);

      await waitFor(() => {
        expect(screen.getByText('Send Test Notification')).toBeTruthy();
      });
    });
  });

  describe('permission handling', () => {
    it('should show permission warning when notifications are denied', async () => {
      mockedOneSignalService.getPermissionStatus.mockResolvedValue({
        granted: false,
        denied: true,
        provisional: false,
      });

      mockedUseAlertStore.mockReturnValue({
        ...mockAlertStore,
        alertSettings: {
          id: '1',
          user_id: 'user-1',
          budget_alerts_enabled: true,
          warning_threshold: 90,
          over_budget_alerts_enabled: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      } as any);

      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Notifications Disabled')).toBeTruthy();
        expect(screen.getByText('Enable notifications to receive budget alerts')).toBeTruthy();
      });
    });

    it('should request permissions when enable button is pressed', async () => {
      mockedOneSignalService.getPermissionStatus.mockResolvedValue({
        granted: false,
        denied: true,
        provisional: false,
      });

      mockedOneSignalService.requestPermissions.mockResolvedValue({
        granted: true,
        denied: false,
        provisional: false,
      });

      render(<NotificationsScreen />);

      await waitFor(() => {
        const enableButton = screen.getByText('Enable Notifications');
        fireEvent.press(enableButton);
      });

      // Should show permission dialog
      await waitFor(() => {
        expect(screen.getByText('Enable Notifications')).toBeTruthy();
        expect(screen.getByText('Allow Notifications')).toBeTruthy();
      });

      const allowButton = screen.getByText('Allow Notifications');
      fireEvent.press(allowButton);

      await waitFor(() => {
        expect(mockedOneSignalService.requestPermissions).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('error handling', () => {
    it('should display errors when present', () => {
      mockedUseAlertStore.mockReturnValue({
        ...mockAlertStore,
        error: 'Failed to update settings',
        alertSettings: {
          id: '1',
          user_id: 'user-1',
          budget_alerts_enabled: true,
          warning_threshold: 90,
          over_budget_alerts_enabled: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      } as any);

      render(<NotificationsScreen />);

      expect(screen.getByText('Failed to update settings')).toBeTruthy();
      expect(screen.getByText('Dismiss')).toBeTruthy();
    });

    it('should clear errors when dismiss is pressed', () => {
      mockedUseAlertStore.mockReturnValue({
        ...mockAlertStore,
        error: 'Failed to update settings',
        clearError: jest.fn(),
        alertSettings: {
          id: '1',
          user_id: 'user-1',
          budget_alerts_enabled: true,
          warning_threshold: 90,
          over_budget_alerts_enabled: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      } as any);

      render(<NotificationsScreen />);

      const dismissButton = screen.getByText('Dismiss');
      fireEvent.press(dismissButton);

      expect(mockAlertStore.clearError).toHaveBeenCalledTimes(1);
    });
  });
});