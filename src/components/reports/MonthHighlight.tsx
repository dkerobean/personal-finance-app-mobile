import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/design';
import InteractivePressable from '@/components/common/InteractivePressable';

interface MonthHighlightProps {
  selectedMonth: string;
  onPrevious: () => void;
  onNext: () => void;
  onCalendarPress?: () => void;
}

const MonthHighlight: React.FC<MonthHighlightProps> = ({ 
  selectedMonth, 
  onPrevious, 
  onNext,
  onCalendarPress 
}) => {
  
  const formatMonthYear = (monthString: string): string => {
    if (!monthString) return 'Select Month';
    const date = new Date(monthString + '-01');
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <View style={styles.container}>
      <InteractivePressable 
        style={styles.navButton} 
        onPress={onPrevious}
        hitSlop={10}
      >
        <ChevronLeft size={28} color={COLORS.primary} />
      </InteractivePressable>

      <Pressable style={styles.centerContent} onPress={onCalendarPress}>
        <Text style={styles.monthText}>{formatMonthYear(selectedMonth)}</Text>
        <Calendar size={16} color={COLORS.textTertiary} style={{ marginLeft: 6 }} />
      </Pressable>

      <InteractivePressable 
        style={styles.navButton} 
        onPress={onNext}
        hitSlop={10}
      >
        <ChevronRight size={28} color={COLORS.primary} />
      </InteractivePressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  centerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.huge,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...SHADOWS.sm,
  },
  monthText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  }
});

export default MonthHighlight;
