import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/design';

interface QuickActionButtonsProps {
  onSendPress?: () => void;
  onRequestPress?: () => void;
}

export default function QuickActionButtons({ onSendPress, onRequestPress }: QuickActionButtonsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.button, styles.expenseButton]} 
        onPress={onSendPress}
        activeOpacity={0.8}
      >
        <MaterialIcons name="remove-circle-outline" size={20} color={COLORS.white} />
        <Text style={styles.expenseButtonText}>Add Expense</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.incomeButton]} 
        onPress={onRequestPress}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add-circle-outline" size={20} color={COLORS.primary} />
        <Text style={styles.incomeButtonText}>Add Income</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.huge, // Rounded pill shape
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  expenseButton: {
    backgroundColor: COLORS.error,
  },
  incomeButton: {
    backgroundColor: COLORS.primaryLight,
  },
  expenseButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  incomeButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
