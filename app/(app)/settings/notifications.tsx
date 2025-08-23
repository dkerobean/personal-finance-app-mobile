import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  ScrollView,
  Button,
  Switch,
  Spinner,
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogBody,
  AlertDialogFooter,
  Icon,
  useToast,
  Toast,
  ToastTitle,
  ToastDescription,
} from '@gluestack-ui/themed';
import { ArrowLeft, Bell, TestTube2, Info, Clock, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useAlertStore } from '@/stores/alertStore';
import { oneSignalService } from '@/services/oneSignalService';

export default function NotificationsScreen() {
  const toast = useToast();
  const {
    alertSettings,
    alertHistory,
    isLoading,
    error,
    fetchAlertSettings,
    fetchAlertHistory,
    updateAlertSettings,
    sendTestNotification,
    clearError,
  } = useAlertStore();

  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<{
    granted: boolean;
    denied: boolean;
  }>({ granted: false, denied: false });

  useEffect(() => {
    loadData();
    checkPermissionStatus();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchAlertSettings(),
      fetchAlertHistory()
    ]);
  };

  const checkPermissionStatus = async () => {
    const status = await oneSignalService.getPermissionStatus();
    setPermissionStatus(status);
  };

  const handleToggleBudgetAlerts = async (enabled: boolean) => {
    if (enabled && permissionStatus.denied) {
      setShowPermissionDialog(true);
      return;
    }

    const success = await updateAlertSettings({
      budget_alerts_enabled: enabled,
    });

    if (success) {
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="success" variant="accent">
            <ToastTitle>Settings Updated</ToastTitle>
            <ToastDescription>
              Budget alerts have been {enabled ? 'enabled' : 'disabled'}
            </ToastDescription>
          </Toast>
        ),
      });
    }
  };

  const handleToggleOverBudgetAlerts = async (enabled: boolean) => {
    if (enabled && permissionStatus.denied) {
      setShowPermissionDialog(true);
      return;
    }

    const success = await updateAlertSettings({
      over_budget_alerts_enabled: enabled,
    });

    if (success) {
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="success" variant="accent">
            <ToastTitle>Settings Updated</ToastTitle>
            <ToastDescription>
              Over-budget alerts have been {enabled ? 'enabled' : 'disabled'}
            </ToastDescription>
          </Toast>
        ),
      });
    }
  };

  const handleWarningThresholdChange = async (threshold: number) => {
    const success = await updateAlertSettings({
      warning_threshold: threshold,
    });

    if (success) {
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="success" variant="accent">
            <ToastTitle>Threshold Updated</ToastTitle>
            <ToastDescription>
              Warning threshold set to {threshold}%
            </ToastDescription>
          </Toast>
        ),
      });
    }
  };

  const handleTestNotification = async () => {
    if (permissionStatus.denied) {
      setShowPermissionDialog(true);
      return;
    }

    setIsTestingNotification(true);
    
    try {
      const success = await sendTestNotification();
      
      if (success) {
        toast.show({
          placement: 'top',
          render: ({ id }) => (
            <Toast nativeID={`toast-${id}`} action="success" variant="accent">
              <ToastTitle>Test Notification Sent</ToastTitle>
              <ToastDescription>
                Check your notifications to verify delivery
              </ToastDescription>
            </Toast>
          ),
        });
      } else {
        throw new Error('Failed to send test notification');
      }
    } catch (error) {
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="error" variant="accent">
            <ToastTitle>Test Failed</ToastTitle>
            <ToastDescription>
              Could not send test notification. Please try again.
            </ToastDescription>
          </Toast>
        ),
      });
    } finally {
      setIsTestingNotification(false);
    }
  };

  const handleRequestPermissions = async () => {
    try {
      const result = await oneSignalService.requestPermissions();
      
      if (result.granted) {
        setPermissionStatus({ granted: true, denied: false });
        setShowPermissionDialog(false);
        
        toast.show({
          placement: 'top',
          render: ({ id }) => (
            <Toast nativeID={`toast-${id}`} action="success" variant="accent">
              <ToastTitle>Permissions Granted</ToastTitle>
              <ToastDescription>
                You can now receive budget alert notifications
              </ToastDescription>
            </Toast>
          ),
        });
      } else {
        setPermissionStatus({ granted: false, denied: true });
        
        Alert.alert(
          'Notifications Disabled',
          'To receive budget alerts, please enable notifications in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // This would open device settings - implementation depends on platform
              console.log('Open device settings');
            }},
          ]
        );
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action="error" variant="accent">
            <ToastTitle>Permission Error</ToastTitle>
            <ToastDescription>
              Failed to request notification permissions
            </ToastDescription>
          </Toast>
        ),
      });
    }
  };

  const thresholdOptions = [75, 80, 85, 90, 95];

  if (isLoading && !alertSettings) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg="$background">
        <Spinner size="large" />
        <Text mt="$4">Loading notification settings...</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="$background">
      <ScrollView flex={1}>
        <VStack space="$6" p="$4">
          {/* Header */}
          <HStack alignItems="center" space="$3">
            <Button variant="link" size="sm" onPress={() => router.back()}>
              <Icon as={ArrowLeft} size="xl" color="$textLight600" />
            </Button>
            <VStack flex={1}>
              <Heading size="xl">Notification Settings</Heading>
              <Text color="$textLight600" size="sm">
                Manage your budget alert preferences
              </Text>
            </VStack>
          </HStack>

          {/* Permission Status */}
          {permissionStatus.denied && (
            <Box
              bg="$warning100"
              borderColor="$warning300"
              borderWidth={1}
              borderRadius="$md"
              p="$4"
            >
              <HStack space="$3" alignItems="center">
                <Icon as={Info} size="lg" color="$warning600" />
                <VStack flex={1}>
                  <Text color="$warning800" fontWeight="$semibold">
                    Notifications Disabled
                  </Text>
                  <Text color="$warning700" size="sm">
                    Enable notifications to receive budget alerts
                  </Text>
                </VStack>
              </HStack>
              <Button
                variant="outline"
                action="warning"
                size="sm"
                mt="$3"
                onPress={() => setShowPermissionDialog(true)}
              >
                <Text>Enable Notifications</Text>
              </Button>
            </Box>
          )}

          {/* Budget Alerts Section */}
          <VStack space="$4">
            <VStack space="$2">
              <Heading size="lg">Budget Alerts</Heading>
              <Text color="$textLight600" size="sm">
                Get notified when you're approaching or exceeding your budget limits
              </Text>
            </VStack>

            {/* Budget Warning Alerts Toggle */}
            <HStack justifyContent="space-between" alignItems="center" py="$2">
              <VStack flex={1} mr="$4">
                <Text fontWeight="$medium">Budget Warning Alerts</Text>
                <Text color="$textLight600" size="sm">
                  Alert when approaching budget limit ({alertSettings?.warning_threshold || 90}%)
                </Text>
              </VStack>
              <Switch
                value={alertSettings?.budget_alerts_enabled || false}
                onValueChange={handleToggleBudgetAlerts}
                isDisabled={isLoading}
                trackColor={{ true: '$primary600', false: '$trueGray300' }}
                thumbColor={alertSettings?.budget_alerts_enabled ? '$primary100' : '$trueGray50'}
              />
            </HStack>

            {/* Warning Threshold Selection */}
            {alertSettings?.budget_alerts_enabled && (
              <VStack space="$2">
                <Text fontWeight="$medium" size="sm">Warning Threshold</Text>
                <HStack space="$2" flexWrap="wrap">
                  {thresholdOptions.map((threshold) => (
                    <Button
                      key={threshold}
                      variant={alertSettings.warning_threshold === threshold ? 'solid' : 'outline'}
                      action={alertSettings.warning_threshold === threshold ? 'primary' : 'secondary'}
                      size="sm"
                      onPress={() => handleWarningThresholdChange(threshold)}
                      isDisabled={isLoading}
                    >
                      <Text>{threshold}%</Text>
                    </Button>
                  ))}
                </HStack>
              </VStack>
            )}

            {/* Over Budget Alerts Toggle */}
            <HStack justifyContent="space-between" alignItems="center" py="$2">
              <VStack flex={1} mr="$4">
                <Text fontWeight="$medium">Over-Budget Alerts</Text>
                <Text color="$textLight600" size="sm">
                  Alert when spending exceeds budget limit (100%+)
                </Text>
              </VStack>
              <Switch
                value={alertSettings?.over_budget_alerts_enabled || false}
                onValueChange={handleToggleOverBudgetAlerts}
                isDisabled={isLoading}
                trackColor={{ true: '$primary600', false: '$trueGray300' }}
                thumbColor={alertSettings?.over_budget_alerts_enabled ? '$primary100' : '$trueGray50'}
              />
            </HStack>
          </VStack>

          {/* Notification Methods Section */}
          <VStack space="$4">
            <VStack space="$2">
              <Heading size="lg">Notification Methods</Heading>
              <Text color="$textLight600" size="sm">
                Choose how you want to receive budget alerts
              </Text>
            </VStack>

            {/* Push Notifications Toggle */}
            <HStack justifyContent="space-between" alignItems="center" py="$2">
              <VStack flex={1} mr="$4">
                <Text fontWeight="$medium">Push Notifications</Text>
                <Text color="$textLight600" size="sm">
                  Receive instant alerts on your device
                </Text>
              </VStack>
              <Switch
                value={permissionStatus.granted}
                onValueChange={(enabled) => {
                  if (enabled) {
                    handleRequestPermissions();
                  } else {
                    // Disable push notifications
                    setPermissionStatus({ granted: false, denied: true });
                  }
                }}
                isDisabled={isLoading}
                trackColor={{ true: '$primary600', false: '$trueGray300' }}
                thumbColor={permissionStatus.granted ? '$primary100' : '$trueGray50'}
              />
            </HStack>

            {/* Email Notifications Toggle */}
            <HStack justifyContent="space-between" alignItems="center" py="$2">
              <VStack flex={1} mr="$4">
                <Text fontWeight="$medium">Email Notifications</Text>
                <Text color="$textLight600" size="sm">
                  Receive detailed budget alerts via email
                </Text>
              </VStack>
              <Switch
                value={alertSettings?.budget_alerts_enabled || false}
                onValueChange={(enabled) => {
                  // For now, use same setting as budget alerts
                  // In future, this could be a separate setting
                  handleToggleBudgetAlerts(enabled);
                }}
                isDisabled={isLoading}
                trackColor={{ true: '$primary600', false: '$trueGray300' }}
                thumbColor={alertSettings?.budget_alerts_enabled ? '$primary100' : '$trueGray50'}
              />
            </HStack>

            {/* Email info box */}
            <Box
              bg="$info100"
              borderColor="$info300"
              borderWidth={1}
              borderRadius="$md"
              p="$3"
            >
              <HStack space="$2" alignItems="center">
                <Icon as={Info} size="sm" color="$info600" />
                <Text color="$info800" size="sm" flex={1}>
                  Email alerts include detailed spending summaries and actionable insights. 
                  They're sent using your registered email address.
                </Text>
              </HStack>
            </Box>
          </VStack>

          {/* Test Notification */}
          <VStack space="$4">
            <VStack space="$2">
              <Heading size="lg">Test Notifications</Heading>
              <Text color="$textLight600" size="sm">
                Send a test notification to verify your settings
              </Text>
            </VStack>

            <Button
              variant="outline"
              action="secondary"
              onPress={handleTestNotification}
              isDisabled={isTestingNotification || permissionStatus.denied}
            >
              <HStack space="$2" alignItems="center">
                {isTestingNotification ? (
                  <Spinner size="small" />
                ) : (
                  <Icon as={TestTube2} size="lg" />
                )}
                <Text>
                  {isTestingNotification ? 'Sending...' : 'Send Test Notification'}
                </Text>
              </HStack>
            </Button>
          </VStack>

          {/* Alert History */}
          <VStack space="$4">
            <VStack space="$2">
              <Heading size="lg">Recent Alerts</Heading>
              <Text color="$textLight600" size="sm">
                Your budget alert history
              </Text>
            </VStack>

            {alertHistory && alertHistory.length > 0 ? (
              <VStack space="$3">
                {alertHistory.slice(0, 5).map((alert) => (
                  <Box
                    key={alert.id}
                    borderColor="$borderLight200"
                    borderWidth={1}
                    borderRadius="$md"
                    p="$3"
                    bg="$backgroundLight0"
                  >
                    <HStack space="$3" alignItems="center">
                      <Icon
                        as={alert.alert_type === 'warning' ? AlertCircle : CheckCircle}
                        size="lg"
                        color={alert.alert_type === 'warning' ? '$warning600' : '$error600'}
                      />
                      <VStack flex={1} space="$1">
                        <HStack justifyContent="space-between" alignItems="center">
                          <Text fontWeight="$medium">
                            {alert.alert_type === 'warning' ? 'Budget Warning' : 'Budget Exceeded'}
                          </Text>
                          <HStack space="$1" alignItems="center">
                            <Icon
                              as={alert.status === 'sent' ? CheckCircle : AlertCircle}
                              size="sm"
                              color={alert.status === 'sent' ? '$success600' : '$error600'}
                            />
                            <Text
                              size="xs"
                              color={alert.status === 'sent' ? '$success600' : '$error600'}
                              textTransform="capitalize"
                            >
                              {alert.status}
                            </Text>
                          </HStack>
                        </HStack>
                        <Text color="$textLight600" size="sm">
                          {alert.percentage.toFixed(0)}% of ₵{alert.budget_amount.toFixed(2)} budget
                        </Text>
                        <HStack space="$2" alignItems="center">
                          <Icon as={Clock} size="xs" color="$textLight400" />
                          <Text color="$textLight400" size="xs">
                            {new Date(alert.sent_at).toLocaleDateString()} at{' '}
                            {new Date(alert.sent_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Text>
                        </HStack>
                      </VStack>
                    </HStack>
                  </Box>
                ))}
                
                {alertHistory.length > 5 && (
                  <Text color="$textLight600" size="sm" textAlign="center">
                    Showing 5 most recent alerts ({alertHistory.length} total)
                  </Text>
                )}
              </VStack>
            ) : (
              <Box
                borderColor="$borderLight200"
                borderWidth={1}
                borderRadius="$md"
                p="$4"
                bg="$backgroundLight0"
                alignItems="center"
              >
                <Icon as={Bell} size="xl" color="$textLight400" mb="$2" />
                <Text color="$textLight600" textAlign="center">
                  No budget alerts yet
                </Text>
                <Text color="$textLight500" size="sm" textAlign="center" mt="$1">
                  Alerts will appear here when your spending approaches budget limits
                </Text>
              </Box>
            )}
          </VStack>

          {/* Error Display */}
          {error && (
            <Box
              bg="$error100"
              borderColor="$error300"
              borderWidth={1}
              borderRadius="$md"
              p="$4"
            >
              <Text color="$error800">{error}</Text>
              <Button
                variant="link"
                action="secondary"
                size="sm"
                alignSelf="flex-start"
                mt="$2"
                onPress={clearError}
              >
                <Text>Dismiss</Text>
              </Button>
            </Box>
          )}
        </VStack>
      </ScrollView>

      {/* Permission Request Dialog */}
      <AlertDialog isOpen={showPermissionDialog} onClose={() => setShowPermissionDialog(false)}>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading size="lg">Enable Notifications</Heading>
            <AlertDialogCloseButton />
          </AlertDialogHeader>
          <AlertDialogBody>
            <VStack space="$3">
              <HStack space="$3" alignItems="center">
                <Icon as={Bell} size="xl" color="$primary600" />
                <Text>
                  To receive budget alerts, we need permission to send you notifications.
                </Text>
              </HStack>
              <Text color="$textLight600" size="sm">
                You can change this setting anytime in your device's notification preferences.
              </Text>
            </VStack>
          </AlertDialogBody>
          <AlertDialogFooter>
            <HStack space="$3" justifyContent="flex-end" flex={1}>
              <Button
                variant="outline"
                action="secondary"
                onPress={() => setShowPermissionDialog(false)}
              >
                <Text>Not Now</Text>
              </Button>
              <Button action="primary" onPress={handleRequestPermissions}>
                <Text>Allow Notifications</Text>
              </Button>
            </HStack>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
}