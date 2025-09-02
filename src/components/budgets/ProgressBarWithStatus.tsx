import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BUDGET, COLORS, TYPOGRAPHY, SPACING } from '@/constants/design';

interface ProgressBarWithStatusProps {
  percentage: number; // 0-100
  goalAmount: number;
  statusMessage?: string;
  currency?: string;
  showCheckmark?: boolean;
}

export default function ProgressBarWithStatus({
  percentage,
  goalAmount,
  statusMessage,
  currency = '₵',
  showCheckmark = true,
}: ProgressBarWithStatusProps): React.ReactElement {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  const progressWidth = `${clampedPercentage}%`;
  
  const defaultStatusMessage = 
    clampedPercentage >= 100 
      ? 'Goal achieved! Great work!'
      : clampedPercentage >= 75 
      ? `${Math.round(clampedPercentage)}% of your goal, looking good.`
      : clampedPercentage >= 50 
      ? `${Math.round(clampedPercentage)}% of your goal, keep going.`
      : `${Math.round(clampedPercentage)}% of your goal, you can do it.`;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>
        
        {/* Percentage Text on Bar */}
        <View style={styles.percentageContainer}>
          <Text style={styles.percentageText}>
            {Math.round(clampedPercentage)}%
          </Text>
        </View>
        
        {/* Goal Amount on Right */}
        <View style={styles.goalAmountContainer}>
          <Text style={styles.goalAmountText}>
            {currency}{goalAmount.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Status Message */}
      <View style={styles.statusContainer}>
        {showCheckmark && (
          <View style={styles.checkmarkContainer}>
            <MaterialIcons 
              name={clampedPercentage >= 100 ? "check" : "trending-up"} 
              size={11} 
              color={COLORS.textSecondary} 
            />
          </View>
        )}
        <Text style={styles.statusText}>
          {statusMessage || defaultStatusMessage}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  progressBarBackground: {
    flex: 1,
    height: BUDGET.progressBar.height,
    backgroundColor: BUDGET.progressBar.backgroundColor,
    borderRadius: BUDGET.progressBar.borderRadius,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: BUDGET.progressBar.fillColor,
    borderRadius: BUDGET.progressBar.borderRadius,
    minWidth: 69, // Ensure percentage text fits
  },
  percentageContainer: {
    position: 'absolute',
    left: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: BUDGET.progressBar.textColor,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalAmountContainer: {
    position: 'absolute',
    right: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalAmountText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: BUDGET.progressBar.textColor,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: SPACING.lg,
  },
  checkmarkContainer: {
    width: 11,
    height: 11,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textSecondary,
    flex: 1,
  },
});