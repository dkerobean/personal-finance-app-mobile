import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { BUDGET, COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  onCalendarPress?: () => void;
  onNotificationPress?: () => void;
  showCalendar?: boolean;
  showNotification?: boolean;
  children?: React.ReactNode;
}

export default function GradientHeader({
  title,
  subtitle,
  onBackPress,
  onCalendarPress,
  onNotificationPress,
  showCalendar = true,
  showNotification = true,
}: GradientHeaderProps): React.ReactElement {
  return (
    <LinearGradient
      colors={[BUDGET.gradientColors.start, BUDGET.gradientColors.end]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={BUDGET.gradientColors.start} />
      
      {/* Header Section */}
      <View style={styles.headerSection}>
        {/* Left Section - Back Button */}
        <View style={styles.leftSection}>
          {onBackPress && (
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={19} color={COLORS.backgroundContent} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center Section - Title */}
        <View style={styles.centerSection}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {/* Right Section - Action Buttons */}
        <View style={styles.rightSection}>
          {showCalendar && onCalendarPress && (
            <TouchableOpacity onPress={onCalendarPress} style={styles.calendarButton}>
              <MaterialIcons name="calendar-today" size={17.93} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
          {showNotification && onNotificationPress && (
            <TouchableOpacity onPress={onNotificationPress} style={styles.notificationButton}>
              <MaterialIcons name="notifications-none" size={14.57} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: SPACING.md, // Reduced padding since native status bar handles this
    paddingBottom: SPACING.xl,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  leftSection: {
    width: 50,
    alignItems: 'flex-start',
  },
  backButton: {
    padding: SPACING.sm,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.normal,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rightSection: {
    width: 50,
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  calendarButton: {
    width: 32.26,
    height: 30,
    backgroundColor: COLORS.backgroundContent,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  notificationButton: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.backgroundInput,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
});