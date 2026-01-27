import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundMain} />
      
      {/* Header Section */}
      <View style={styles.headerSection}>
        {/* Left Section - Back Button */}
        <View style={styles.leftSection}>
          {onBackPress && (
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={20} color={COLORS.white} />
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
            <TouchableOpacity onPress={onCalendarPress} style={styles.iconButton}>
              <MaterialIcons name="calendar-today" size={20} color={COLORS.white} />
            </TouchableOpacity>
          )}
          {showNotification && onNotificationPress && (
            <TouchableOpacity onPress={onNotificationPress} style={styles.iconButton}>
              <MaterialIcons name="notifications-none" size={22} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.backgroundMain,
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
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.normal,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  rightSection: {
    width: 60,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});