import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Bell, TestTube2, Clock, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react-native';
import { useAlertStore } from '@/stores/alertStore';
import { oneSignalService } from '@/services/oneSignalService';
import { useAppToast } from '@/hooks/useAppToast';
import GradientHeader from '@/components/budgets/GradientHeader';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS, BUDGET } from '@/constants/design';

export default function NotificationsScreen() {
  const toast = useAppToast();
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
  const [permissionStatus, setPermissionStatus] = useState<{
    granted: boolean;
    denied: boolean;
  }>({ granted: false, denied: false });
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleBudgetAlerts = async (enabled: boolean) => {
    if (enabled && permissionStatus.denied) {
      handleRequestPermissions();
      return;
    }

    const success = await updateAlertSettings({
      budget_alerts_enabled: enabled,
    });

    if (success) {
      toast.success('Settings Updated', `Budget alerts ${enabled ? 'enabled' : 'disabled'}`);
    }
  };

  const handleToggleOverBudgetAlerts = async (enabled: boolean) => {
    if (enabled && permissionStatus.denied) {
      handleRequestPermissions();
      return;
    }

    const success = await updateAlertSettings({
      over_budget_alerts_enabled: enabled,
    });

    if (success) {
      toast.success('Settings Updated', `Over-budget alerts ${enabled ? 'enabled' : 'disabled'}`);
    }
  };

  const handleWarningThresholdChange = async (threshold: number) => {
    const success = await updateAlertSettings({
      warning_threshold: threshold,
    });

    if (success) {
      toast.success('Threshold Updated', `Warning threshold set to ${threshold}%`);
    }
  };

  const handleTestNotification = async () => {
    if (permissionStatus.denied) {
      handleRequestPermissions();
      return;
    }

    setIsTestingNotification(true);
    
    try {
      const success = await sendTestNotification();
      
      if (success) {
        toast.success('Test Sent', 'Check your notifications to verify delivery');
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      toast.error('Test Failed', 'Could not send test notification');
    } finally {
      setIsTestingNotification(false);
    }
  };

  const handleRequestPermissions = async () => {
    try {
      const result = await oneSignalService.requestPermissions();
      
      if (result.granted) {
        setPermissionStatus({ granted: true, denied: false });
        toast.success('Permissions Granted', 'You can now receive budget alerts');
      } else {
        setPermissionStatus({ granted: false, denied: true });
        Alert.alert(
          'Notifications Disabled',
          'To receive budget alerts, please enable notifications in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => console.log('Open device settings') },
          ]
        );
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      toast.error('Permission Error', 'Failed to request notification permissions');
    }
  };

  const thresholdOptions = [75, 80, 85, 90, 95];

  const handleGoBack = () => {
    router.back();
  };

  if (isLoading && !alertSettings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading notification settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor={COLORS.white}
            colors={[COLORS.white]}
          />
        }
      >
        {/* Gradient Header */}
        <GradientHeader
          title="Notifications"
          onBackPress={handleGoBack}
          onCalendarPress={() => {}}
          onNotificationPress={() => {}}
        />

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Permission Warning */}
          {permissionStatus.denied && (
            <View style={styles.warningCard}>
              <View style={styles.warningIcon}>
                <MaterialIcons name="notifications-off" size={24} color={COLORS.warning} />
              </View>
              <View style={styles.warningTextContainer}>
                <Text style={styles.warningTitle}>Notifications Disabled</Text>
                <Text style={styles.warningDescription}>
                  Enable notifications to receive budget alerts
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.enableButton}
                onPress={handleRequestPermissions}
              >
                <Text style={styles.enableButtonText}>Enable</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Budget Alerts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget Alerts</Text>
            <Text style={styles.sectionDescription}>
              Get notified when you're approaching or exceeding your budget limits
            </Text>

            {/* Budget Warning Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Budget Warning Alerts</Text>
                <Text style={styles.settingDescription}>
                  Alert when approaching budget limit ({alertSettings?.warning_threshold || 90}%)
                </Text>
              </View>
              <Switch
                value={alertSettings?.budget_alerts_enabled || false}
                onValueChange={handleToggleBudgetAlerts}
                disabled={isLoading}
                trackColor={{ true: COLORS.primary, false: COLORS.gray200 }}
                thumbColor={COLORS.white}
              />
            </View>

            {/* Threshold Selection */}
            {alertSettings?.budget_alerts_enabled && (
              <View style={styles.thresholdContainer}>
                <Text style={styles.thresholdLabel}>Warning Threshold</Text>
                <View style={styles.thresholdOptions}>
                  {thresholdOptions.map((threshold) => (
                    <TouchableOpacity
                      key={threshold}
                      style={[
                        styles.thresholdButton,
                        alertSettings.warning_threshold === threshold && styles.thresholdButtonActive
                      ]}
                      onPress={() => handleWarningThresholdChange(threshold)}
                      disabled={isLoading}
                    >
                      <Text style={[
                        styles.thresholdText,
                        alertSettings.warning_threshold === threshold && styles.thresholdTextActive
                      ]}>
                        {threshold}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Over Budget Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Over-Budget Alerts</Text>
                <Text style={styles.settingDescription}>
                  Alert when spending exceeds budget limit (100%+)
                </Text>
              </View>
              <Switch
                value={alertSettings?.over_budget_alerts_enabled || false}
                onValueChange={handleToggleOverBudgetAlerts}
                disabled={isLoading}
                trackColor={{ true: COLORS.primary, false: COLORS.gray200 }}
                thumbColor={COLORS.white}
              />
            </View>
          </View>

          {/* Notification Methods Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Methods</Text>
            <Text style={styles.sectionDescription}>
              Choose how you want to receive budget alerts
            </Text>

            {/* Push Notifications Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive instant alerts on your device
                </Text>
              </View>
              <Switch
                value={permissionStatus.granted}
                onValueChange={(enabled) => {
                  if (enabled) {
                    handleRequestPermissions();
                  } else {
                    setPermissionStatus({ granted: false, denied: true });
                  }
                }}
                disabled={isLoading}
                trackColor={{ true: COLORS.primary, false: COLORS.gray200 }}
                thumbColor={COLORS.white}
              />
            </View>
          </View>

          {/* Test Notification Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Notifications</Text>
            <Text style={styles.sectionDescription}>
              Send a test notification to verify your settings
            </Text>

            <TouchableOpacity 
              style={[styles.testButton, (isTestingNotification || permissionStatus.denied) && styles.testButtonDisabled]}
              onPress={handleTestNotification}
              disabled={isTestingNotification || permissionStatus.denied}
            >
              {isTestingNotification ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <TestTube2 size={20} color={COLORS.primary} />
              )}
              <Text style={styles.testButtonText}>
                {isTestingNotification ? 'Sending...' : 'Send Test Notification'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Alert History Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
            <Text style={styles.sectionDescription}>
              Your budget alert history
            </Text>

            {alertHistory && alertHistory.length > 0 ? (
              <View style={styles.historyList}>
                {alertHistory.slice(0, 5).map((alert) => (
                  <View key={alert.id} style={styles.historyItem}>
                    <View style={[
                      styles.historyIconBg,
                      { backgroundColor: alert.alert_type === 'warning' ? '#FEF3C7' : '#FEE2E2' }
                    ]}>
                      <AlertCircle 
                        size={20} 
                        color={alert.alert_type === 'warning' ? COLORS.warning : COLORS.error} 
                      />
                    </View>
                    <View style={styles.historyContent}>
                      <View style={styles.historyHeader}>
                        <Text style={styles.historyTitle}>
                          {alert.alert_type === 'warning' ? 'Budget Warning' : 'Budget Exceeded'}
                        </Text>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: alert.status === 'sent' ? COLORS.primaryLight : '#FEE2E2' }
                        ]}>
                          <Text style={[
                            styles.statusText,
                            { color: alert.status === 'sent' ? COLORS.primary : COLORS.error }
                          ]}>
                            {alert.status}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.historyDescription}>
                        {alert.percentage.toFixed(0)}% of ₵{alert.budget_amount.toFixed(2)} budget
                      </Text>
                      <View style={styles.historyTime}>
                        <Clock size={12} color={COLORS.textTertiary} />
                        <Text style={styles.historyTimeText}>
                          {new Date(alert.sent_at).toLocaleDateString()} at {new Date(alert.sent_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyHistory}>
                <Bell size={48} color={COLORS.textTertiary} />
                <Text style={styles.emptyTitle}>No budget alerts yet</Text>
                <Text style={styles.emptyDescription}>
                  Alerts will appear here when your spending approaches budget limits
                </Text>
              </View>
            )}
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError}>
                <Text style={styles.dismissText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BUDGET.gradientColors.start,
  },
  mainScrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },
  contentCard: {
    backgroundColor: COLORS.backgroundContent,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -20,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    flex: 1,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  warningIcon: {
    marginRight: SPACING.md,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: '#92400E',
  },
  warningDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#B45309',
  },
  enableButton: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  enableButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sectionDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    marginBottom: SPACING.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
  },
  thresholdContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  thresholdLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  thresholdOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  thresholdButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
  },
  thresholdButtonActive: {
    backgroundColor: COLORS.primary,
  },
  thresholdText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  thresholdTextActive: {
    color: COLORS.white,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  testButtonDisabled: {
    opacity: 0.5,
  },
  testButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  historyList: {
    gap: SPACING.md,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  historyIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  historyDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  historyTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  historyTimeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
  },
  emptyHistory: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xxl,
    ...SHADOWS.sm,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  dismissText: {
    color: COLORS.error,
    fontWeight: '600',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  bottomSpacing: {
    height: 130,
  },
});