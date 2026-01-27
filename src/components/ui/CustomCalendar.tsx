import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/design';

interface CustomCalendarProps {
  visible: boolean;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onClose: () => void;
  minDate?: Date;
  maxDate?: Date;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CustomCalendar({
  visible,
  selectedDate,
  onDateSelect,
  onClose,
  minDate,
  maxDate,
}: CustomCalendarProps): React.ReactElement {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const [tempSelectedDate, setTempSelectedDate] = useState(new Date(selectedDate));

  const today = useMemo(() => new Date(), []);

  // Get calendar data for current view month
  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    // First day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(year, month, 1);
    let startingDay = firstDayOfMonth.getDay() - 1; // Adjust for Monday start
    if (startingDay < 0) startingDay = 6; // Sunday becomes 6
    
    // Number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Build the calendar grid
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = [];
    
    // Add empty cells for days before the 1st
    for (let i = 0; i < startingDay; i++) {
      week.push(null);
    }
    
    // Add the days
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    
    // Fill the last week with empty cells
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      weeks.push(week);
    }
    
    return weeks;
  }, [viewDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const isDateDisabled = (day: number): boolean => {
    if (!day) return true;
    
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    
    return false;
  };

  const isToday = (day: number): boolean => {
    if (!day) return false;
    return (
      day === today.getDate() &&
      viewDate.getMonth() === today.getMonth() &&
      viewDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number): boolean => {
    if (!day) return false;
    return (
      day === tempSelectedDate.getDate() &&
      viewDate.getMonth() === tempSelectedDate.getMonth() &&
      viewDate.getFullYear() === tempSelectedDate.getFullYear()
    );
  };

  const handleDayPress = (day: number) => {
    if (!day || isDateDisabled(day)) return;
    
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setTempSelectedDate(newDate);
  };

  const handleConfirm = () => {
    onDateSelect(tempSelectedDate);
    onClose();
  };

  const formatSelectedDate = (): string => {
    const day = tempSelectedDate.getDate();
    const month = MONTHS[tempSelectedDate.getMonth()].substring(0, 3);
    return `${month} ${day}`;
  };

  const getDayOfWeek = (): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[tempSelectedDate.getDay()];
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={e => e.stopPropagation()}>
          {/* Header with selected date */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Select Date</Text>
              <Text style={styles.selectedDateLarge}>{formatSelectedDate()}</Text>
              <Text style={styles.dayOfWeek}>{getDayOfWeek()} {tempSelectedDate.getFullYear()}</Text>
            </View>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Ionicons name="checkmark" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={() => navigateMonth('prev')}
            >
              <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.monthYearButton}>
              <Text style={styles.monthYearText}>
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={() => navigateMonth('next')}
            >
              <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Days of Week Header */}
          <View style={styles.daysOfWeekRow}>
            {DAYS_OF_WEEK.map(day => (
              <View key={day} style={styles.dayOfWeekCell}>
                <Text style={styles.dayOfWeekText}>{day.toUpperCase()}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarData.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {week.map((day, dayIndex) => (
                  <TouchableOpacity
                    key={`${weekIndex}-${dayIndex}`}
                    style={[
                      styles.dayCell,
                      isSelected(day as number) && styles.selectedDayCell,
                      isToday(day as number) && !isSelected(day as number) && styles.todayCell,
                    ]}
                    onPress={() => handleDayPress(day as number)}
                    disabled={!day || isDateDisabled(day)}
                  >
                    {day && (
                      <Text style={[
                        styles.dayText,
                        isSelected(day) && styles.selectedDayText,
                        isToday(day) && !isSelected(day) && styles.todayText,
                        isDateDisabled(day) && styles.disabledDayText,
                      ]}>
                        {day}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectButton} onPress={handleConfirm}>
              <Text style={styles.selectButtonText}>Select</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    paddingBottom: 34, // Safe area
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  selectedDateLarge: {
    fontSize: TYPOGRAPHY.sizes.huge,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
  },
  dayOfWeek: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  confirmButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  monthYearText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  dayOfWeekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  dayOfWeekText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textTertiary,
  },
  calendarGrid: {
    paddingHorizontal: SPACING.md,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    borderRadius: 50,
  },
  selectedDayCell: {
    backgroundColor: COLORS.primary,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  dayText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  selectedDayText: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  todayText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  disabledDayText: {
    color: COLORS.gray400,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
  },
  selectButton: {
    flex: 1,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
});
