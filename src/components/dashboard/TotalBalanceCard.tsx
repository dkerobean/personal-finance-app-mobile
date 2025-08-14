import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Transaction } from '@/types/models';

interface TotalBalanceCardProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export default function TotalBalanceCard({ transactions, isLoading }: TotalBalanceCardProps) {
  const calculateTotalBalance = (): number => {
    return transactions.reduce((total, transaction) => {
      if (transaction.type === 'income') {
        return total + transaction.amount;
      } else {
        return total - transaction.amount;
      }
    }, 0);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const totalBalance = calculateTotalBalance();
  const isPositive = totalBalance >= 0;

  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <MaterialIcons name="account-balance-wallet" size={24} color="#6b7280" />
          <Text style={styles.title}>Total Balance</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name="account-balance-wallet" size={24} color="#6b7280" />
        <Text style={styles.title}>Total Balance</Text>
      </View>
      
      <View style={styles.balanceContainer}>
        <Text style={[
          styles.balanceAmount,
          isPositive ? styles.positiveBalance : styles.negativeBalance
        ]}>
          {formatCurrency(totalBalance)}
        </Text>
        
        <View style={styles.balanceIndicator}>
          <MaterialIcons 
            name={isPositive ? "trending-up" : "trending-down"} 
            size={20} 
            color={isPositive ? "#059669" : "#dc3545"} 
          />
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={styles.incomeAmount}>
            {formatCurrency(
              transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0)
            )}
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={styles.expenseAmount}>
            {formatCurrency(
              transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0)
            )}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    flex: 1,
  },
  positiveBalance: {
    color: '#059669',
  },
  negativeBalance: {
    color: '#dc3545',
  },
  balanceIndicator: {
    marginLeft: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc3545',
  },
});