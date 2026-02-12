import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
    marginBottom: SPACING.sm,
  },
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray50,
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  filterOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 999,
  },
  activeFilterOption: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  activeIncome: {
    backgroundColor: '#0F9D77',
  },
  activeExpense: {
    backgroundColor: '#EF4444',
  },
  filterText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeFilterText: {
    color: COLORS.white,
  },
});
