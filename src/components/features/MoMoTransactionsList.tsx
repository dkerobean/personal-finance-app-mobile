import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { MoMoTransaction } from '@/types/mtnMomo';

interface MoMoTransactionsListProps {
  transactions: MoMoTransaction[];
  isLoading?: boolean;
  showAll?: boolean;
}

export default function MoMoTransactionsList({ 
  transactions, 
  isLoading, 
  showAll = false 
}: MoMoTransactionsListProps) {
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

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleTransactionPress = (transactionId: string) => {
    router.push(`/transactions/${transactionId}`);
  };

  const displayTransactions = showAll 
    ? transactions 
    : transactions.slice(0, 5);

  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>MTN MoMo Transactions</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading MoMo transactions...</Text>
        </View>
      </View>
    );
  }

  if (displayTransactions.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>MTN MoMo Transactions</Text>
        </View>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="phone-android" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No MoMo Transactions</Text>
          <Text style={styles.emptySubtitle}>
            Link your MTN MoMo account to automatically import transactions
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>MTN MoMo Transactions</Text>
        {!showAll && transactions.length > 5 && (
          <TouchableOpacity onPress={() => router.push('/transactions')}>
            <Text style={styles.viewAllButton}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
        {displayTransactions.map((transaction) => (
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
                  name="phone-android"
                  size={20}
                  color="#ffffff"
                />
              </View>
              
              <View style={styles.transactionDetails}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.categoryName}>
                    {transaction.category?.name || 'MoMo Transaction'}
                  </Text>
                  {transaction.auto_categorized && (
                    <View style={styles.autoBadge}>
                      <MaterialIcons name="auto-awesome" size={12} color="#7c3aed" />
                      <Text style={styles.autoBadgeText}>Auto</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.transactionDate}>
                  {formatDate(transaction.transaction_date)}
                </Text>
                
                {transaction.merchant_name && (
                  <Text style={styles.merchantName} numberOfLines={1}>
                    📍 {transaction.merchant_name}
                  </Text>
                )}
                
                {transaction.description && (
                  <Text style={styles.transactionDescription} numberOfLines={1}>
                    {transaction.description}
                  </Text>
                )}
                
                <View style={styles.momoDetails}>
                  <Text style={styles.momoStatus}>
                    Status: {transaction.momo_status.replace('_', ' ')}
                  </Text>
                  {transaction.categorization_confidence && (
                    <Text style={styles.confidence}>
                      Confidence: {Math.round(transaction.categorization_confidence * 100)}%
                    </Text>
                  )}
                </View>
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
  },
  transactionsList: {
    maxHeight: 400,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  autoBadgeText: {
    fontSize: 10,
    color: '#7c3aed',
    fontWeight: '500',
    marginLeft: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  merchantName: {
    fontSize: 12,
    color: '#059669',
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  momoDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  momoStatus: {
    fontSize: 11,
    color: '#6366f1',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  confidence: {
    fontSize: 11,
    color: '#059669',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
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