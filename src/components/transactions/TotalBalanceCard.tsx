import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TRANSACTIONS, TYPOGRAPHY, SHADOWS } from '@/constants/design';

interface TotalBalanceCardProps {
  totalBalance: number;
}

export default function TotalBalanceCard({
  totalBalance,
}: TotalBalanceCardProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Total Balance</Text>
        <Text style={styles.amount}>
          ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 37,
    marginTop: 20,
  },
  card: {
    width: TRANSACTIONS.balanceCard.width,
    height: TRANSACTIONS.balanceCard.height,
    backgroundColor: COLORS.primaryLight,
    borderRadius: TRANSACTIONS.balanceCard.borderRadius,
    paddingVertical: TRANSACTIONS.balanceCard.paddingVertical,
    paddingHorizontal: TRANSACTIONS.balanceCard.paddingHorizontal,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  amount: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins',
    lineHeight: 36,
  },
});