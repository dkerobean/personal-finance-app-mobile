import React from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/design';

export type FilterType = 'all' | 'income' | 'expense';

interface FilterPillsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
];

export default function FilterPills({ activeFilter, onFilterChange }: FilterPillsProps) {
  // We'll use a simple background highlight approach for now
  // For a more complex "sliding" pill, we'd need to measure layouts
  
  return (
    <View style={styles.container}>
      <View style={styles.pillContainer}>
        {FILTER_OPTIONS.map((option) => {
          const isActive = activeFilter === option.value;
          
          return (
            <Pressable
              key={option.value}
              style={[
                styles.filterOption,
                isActive && styles.activeFilterOption,
                isActive && option.value === 'income' && styles.activeIncome,
                isActive && option.value === 'expense' && styles.activeExpense,
              ]}
              onPress={() => onFilterChange(option.value)}
            >
              <Text 
                style={[
                  styles.filterText,
                  isActive && styles.activeFilterText
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: 4,
    ...SHADOWS.sm,
  },
  filterOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
  },
  activeFilterOption: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  activeIncome: {
    backgroundColor: COLORS.success,
  },
  activeExpense: {
    backgroundColor: COLORS.error,
  },
  filterText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeFilterText: {
    color: COLORS.white,
  },
});
