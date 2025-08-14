import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Transaction } from '@/types/models';

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export default function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  const router = useRouter();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    // Return formatted date
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  const handleTransactionPress = (transactionId: string) => {
    router.push(`/transactions/${transactionId}`);
  };

  const handleViewAllPress = () => {
    router.push('/transactions');
  };

  // Get the 5 most recent transactions
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Transactions</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </View>
    );
  }

  if (recentTransactions.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Transactions</Text>
        </View>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="receipt-long" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Transactions Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start by adding your first transaction to track your finances
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/transactions/create')}
          >
            <MaterialIcons name="add" size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>Add Transaction</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Transactions</Text>
        <TouchableOpacity onPress={handleViewAllPress}>
          <Text style={styles.viewAllButton}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
        {recentTransactions.map((transaction) => (
          <TouchableOpacity
            key={transaction.id}
            style={styles.transactionItem}
            onPress={() => handleTransactionPress(transaction.id)}
          >
            <View style={styles.transactionLeft}>
              <View style={[
                styles.iconContainer,
                transaction.type === 'income' ? styles.incomeIcon : styles.expenseIcon
              ]}>
                <MaterialIcons
                  name={transaction.category?.icon_name as any || 'category'}
                  size={20}
                  color="#ffffff"
                />
              </View>
              
              <View style={styles.transactionDetails}>
                <Text style={styles.categoryName}>
                  {transaction.category?.name || 'Unknown Category'}
                </Text>
                <Text style={styles.transactionDate}>
                  {formatDate(transaction.transaction_date)}
                </Text>
                {transaction.description && (
                  <Text style={styles.transactionDescription} numberOfLines={1}>
                    {transaction.description}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.transactionRight}>
              <Text style={[
                styles.transactionAmount,
                transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount
              ]}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </Text>
              <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  viewAllButton: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  transactionsList: {
    maxHeight: 300,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  incomeIcon: {
    backgroundColor: '#059669',
  },
  expenseIcon: {
    backgroundColor: '#dc3545',
  },
  transactionDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  incomeAmount: {
    color: '#059669',
  },
  expenseAmount: {
    color: '#dc3545',
  },
});