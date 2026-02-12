import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { 
  Bell, 
  BellOff, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Trash2,
  ChevronRight,
  Clock
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useUser } from '@clerk/clerk-expo';
import GradientHeader from '@/components/budgets/GradientHeader';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS, BUDGET } from '@/constants/design';

interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

// Icon mapping for notification types
const getNotificationIcon = (type: string, isRead: boolean) => {
  const color = isRead ? COLORS.textTertiary : COLORS.primary;
  const size = 24;
  
  switch (type) {
    case 'budget_alert':
    case 'budget_exceeded':
      return <AlertTriangle size={size} color={COLORS.warning} />;
    case 'low_balance':
      return <Wallet size={size} color={COLORS.error} />;
    case 'large_transaction':
      return <TrendingDown size={size} color={COLORS.error} />;
    case 'savings_goal':
    case 'net_worth_milestone':
      return <TrendingUp size={size} color={COLORS.success} />;
    case 'bill_reminder':
      return <Clock size={size} color={COLORS.warning} />;
    case 'weekly_summary':
      return <CheckCircle size={size} color={COLORS.primary} />;
    default:
      return <Bell size={size} color={color} />;
  }
};

const getIconBackground = (type: string) => {
  switch (type) {
    case 'budget_alert':
    case 'budget_exceeded':
      return '#FEF9C3';
    case 'low_balance':
    case 'large_transaction':
      return '#FEE2E2';
    case 'savings_goal':
    case 'net_worth_milestone':
      return '#DCFCE7';
    default:
      return COLORS.primaryLight;
  }
};

const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function NotificationsScreen() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${API_URL}/notifications?userId=${user.id}`);
      const json = await response.json();
      
      if (response.ok) {
        setNotifications(json.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNotifications();
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'budget_alert':
      case 'budget_exceeded':
        router.push('/budgets');
        break;
      case 'net_worth_milestone':
        router.push('/networth');
        break;
      case 'large_transaction':
        router.push('/transactions');
        break;
      default:
        break;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.white}
            colors={[COLORS.white]}
          />
        }
      >
        {/* Gradient Header */}
        <GradientHeader
          title="Notifications"
          subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          onBackPress={handleGoBack}
          showCalendar={false}
          onCalendarPress={() => {}}
          onNotificationPress={() => {}}
        />

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Mark All Read Button */}
          {unreadCount > 0 && (
            <TouchableOpacity 
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
            >
              <CheckCircle size={18} color={COLORS.primary} />
              <Text style={styles.markAllText}>Mark all as read</Text>
            </TouchableOpacity>
          )}

          {/* Notifications List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <BellOff size={48} color={COLORS.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>
                We'll notify you about important updates, budget alerts, and financial milestones.
              </Text>
            </View>
          ) : (
            <View style={styles.notificationsList}>
              {notifications.map((notification, index) => (
                <Animated.View
                  key={notification._id}
                  entering={FadeInDown.delay(index * 50).duration(400)}
                >
                  <TouchableOpacity
                    style={[
                      styles.notificationItem,
                      !notification.isRead && styles.unreadItem,
                    ]}
                    onPress={() => handleNotificationPress(notification)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: getIconBackground(notification.type) }]}>
                      {getNotificationIcon(notification.type, notification.isRead)}
                    </View>
                    
                    <View style={styles.contentContainer}>
                      <View style={styles.titleRow}>
                        <Text 
                          style={[
                            styles.notificationTitle,
                            !notification.isRead && styles.unreadTitle
                          ]}
                          numberOfLines={1}
                        >
                          {notification.title}
                        </Text>
                        <Text style={styles.timeText}>
                          {formatTimeAgo(notification.createdAt)}
                        </Text>
                      </View>
                      <Text 
                        style={styles.notificationMessage}
                        numberOfLines={2}
                      >
                        {notification.message}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(notification._id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={18} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Animated.View>
              ))}
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
  contentCard: {
    backgroundColor: COLORS.backgroundContent,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -20,
    paddingTop: 24,
    paddingHorizontal: SPACING.lg,
    minHeight: '100%',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
  },
  markAllText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textTertiary,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
  notificationsList: {
    gap: SPACING.md,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  unreadItem: {
    backgroundColor: COLORS.primaryLight,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  contentContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  timeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
  },
  notificationMessage: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  bottomSpacing: {
    height: 120,
  },
});
