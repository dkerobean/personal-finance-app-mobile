import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TRANSACTIONS, TYPOGRAPHY, SHADOWS, SPACING } from '@/constants/design';

interface TotalBalanceCardProps {
  totalBalance: number;
}

export default function TotalBalanceCard({
  totalBalance,
}: TotalBalanceCardProps): React.ReactElement {
  const isPositive = totalBalance >= 0;
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isPositive 
          ? [COLORS.emeraldGradientStart, COLORS.emeraldGradientEnd] 
          : ['#EF4444', '#DC2626']} // Red gradient for negative
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Total Balance</Text>
          <Text style={styles.amount}>
            ₵{Math.abs(totalBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          {!isPositive && (
            <Text style={styles.negativeIndicator}>Negative Balance</Text>
          )}
        </View>
        
        {/* Decorative circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginTop: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    minHeight: 120,
    borderRadius: 24,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  amount: {
    fontSize: 40,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    lineHeight: 48,
    letterSpacing: -1,
  },
  negativeIndicator: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -30,
    right: -30,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -20,
    left: -20,
  },
});