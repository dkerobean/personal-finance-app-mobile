import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  StyleSheet,
  SafeAreaView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { isSyncedTransaction } from '@/services/api/transactions';
import SyncedTransactionBadge from '@/components/SyncedTransactionBadge';
import type { Transaction } from '@/types/models';

export default function TransactionsScreen() {
  const router = useRouter();
  const {
    transactions,
    isLoading,
    error,
    sortOrder,
    loadTransactions,
    deleteTransaction,
    setSortOrder,
    clearError,
  } = useTransactionStore();

  const { loadCategories } = useCategoryStore();

  useEffect(() => {
    loadTransactions();
    loadCategories(); // Ensure categories are loaded for display
  }, []);

  const handleDeletePress = (transaction: Transaction) => {
    if (isSyncedTransaction(transaction)) {
      Alert.alert(
        'Cannot Delete Synced Transaction',
        'This transaction was automatically synced from your MTN MoMo account and cannot be deleted. You can only change its category.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this ${transaction.type} of $${transaction.amount.toFixed(2)}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => handleDeleteConfirm(transaction.id)
        }
      ]
    );
  };

  const handleDeleteConfirm = async (transactionId: string) => {
    const success = await deleteTransaction(transactionId);
    if (!success && error) {
      Alert.alert('Error', error);
    }
  };

  const handleTransactionPress = (transactionId: string) => {
    router.push(`/transactions/${transactionId}`);
  };

  const handleCreatePress = () => {
    router.push('/transactions/create');
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatAmount = (amount: number, type: 'income' | 'expense') => {
    const sign = type === 'income' ? '+' : '-';
    return `${sign}$${amount.toFixed(2)}`;
  };

  if (isLoading && transactions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity onPress={toggleSortOrder} style={styles.sortButton}>
          <MaterialIcons 
            name={sortOrder === 'desc' ? 'arrow-downward' : 'arrow-upward'} 
            size={24} 
            color="#007bff" 
          />
          <Text style={styles.sortText}>Date</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError} style={styles.errorCloseButton}>
                <MaterialIcons name="close" size={20} color="#dc3545" />
              </TouchableOpacity>
            </View>
          )}

          {transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="receipt-long" size={64} color="#9ca3af" />
              <Text style={styles.emptyText}>
                No transactions yet.{'\n'}Add your first transaction to get started.
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.map((transaction) => (
                <TouchableOpacity 
                  key={transaction.id} 
                  style={styles.transactionItem}
                  onPress={() => handleTransactionPress(transaction.id)}
                >
                  <View style={styles.transactionInfo}>
                    <View style={styles.iconContainer}>
                      <MaterialIcons
                        name={transaction.category?.icon_name as any || 'category'}
                        size={24}
                        color={transaction.type === 'income' ? '#059669' : '#dc3545'}
                      />
                    </View>
                    <View style={styles.transactionDetails}>
                      <View style={styles.categoryRow}>
                        <Text style={styles.transactionCategory}>
                          {transaction.category?.name || 'Unknown Category'}
                        </Text>
                        {isSyncedTransaction(transaction) && (
                          <SyncedTransactionBadge 
                            accountName={transaction.account?.account_name}
                            size="small"
                          />
                        )}
                      </View>
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

                  <View style={styles.amountContainer}>
                    <Text 
                      style={[
                        styles.transactionAmount,
                        { color: transaction.type === 'income' ? '#059669' : '#dc3545' }
                      ]}
                    >
                      {formatAmount(transaction.amount, transaction.type)}
                    </Text>
                    {!isSyncedTransaction(transaction) ? (
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeletePress(transaction);
                        }}
                        style={styles.deleteButton}
                      >
                        <MaterialIcons name="delete" size={16} color="#dc3545" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeletePress(transaction);
                        }}
                        style={styles.editButton}
                      >
                        <MaterialIcons name="edit" size={16} color="#6b7280" />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleCreatePress}>
        <MaterialIcons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  sortText: {
    marginLeft: 4,
    color: '#007bff',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#dc3545',
    flex: 1,
  },
  errorCloseButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 16,
  },
  transactionsList: {
    gap: 8,
  },
  transactionItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  transactionDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: 4,
    padding: 4,
  },
  editButton: {
    marginTop: 4,
    padding: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});