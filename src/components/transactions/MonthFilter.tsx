import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TRANSACTIONS, TYPOGRAPHY } from '@/constants/design';

interface MonthFilterProps {
  selectedMonth: string;
  onMonthSelect: (month: string) => void;
  availableMonths: string[];
}

export default function MonthFilter({
  selectedMonth,
  onMonthSelect,
  availableMonths,
}: MonthFilterProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.calendarIconContainer}>
        <MaterialIcons name="event" size={24} color={COLORS.textPrimary} />
      </View>
      {availableMonths.map((month) => (
        <TouchableOpacity
          key={month}
          style={[
            styles.monthButton,
            selectedMonth === month && styles.selectedMonthButton
          ]}
          onPress={() => onMonthSelect(month)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.monthText,
              selectedMonth === month && styles.selectedMonthText
            ]}
          >
            {month}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 37,
    marginTop: 25,
    gap: 20,
    alignItems: 'center',
  },
  calendarIconContainer: {
    marginRight: 10,
  },
  monthButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
    minWidth: 60,
    alignItems: 'center',
  },
  selectedMonthButton: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
  },
  selectedMonthText: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});