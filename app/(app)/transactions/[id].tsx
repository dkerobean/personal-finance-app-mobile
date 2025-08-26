import React, { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTransactionStore } from '@/stores/transactionStore';
import { transactionsApi } from '@/services/api/transactions';
import type { Transaction } from '@/types/models';

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deleteTransaction } = useTransactionStore();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadTransaction();
    }
  }, [id]);

  const loadTransaction = async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await transactionsApi.getById(id);
      
      if (response.error) {
        setError(response.error.message);
      } else if (response.data) {
        setTransaction(response.data);
      }
    } catch (error) {
      setError('Failed to load transaction details');
      console.error('Error loading transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    if (transaction) {
      router.push(`/transactions/edit/${transaction.id}`);
    }
  };

  const handleDelete = () => {
    if (!transaction) return;

    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this ${transaction.type} of $${transaction.amount.toFixed(2)}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: confirmDelete
        }
      ]
    );
  };

  const confirmDelete = async () => {
    if (!transaction) return;

    const success = await deleteTransaction(transaction.id);
    
    if (success) {
      Alert.alert('Success', 'Transaction deleted successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert('Error', 'Failed to delete transaction');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const formatAmount = (amount: number, type: 'income' | 'expense') => {
    const sign = type === 'income' ? '+' : '-';
    return `${sign}$${amount.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading transaction...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#dc3545" />
          <Text style={styles.errorTitle}>Transaction Not Found</Text>
          <Text style={styles.errorText}>
            {error || 'The transaction you\'re looking for could not be found.'}
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Amount Section */}
          <View style={styles.amountSection}>
            <View style={[
              styles.amountContainer,
              { backgroundColor: transaction.type === 'income' ? '#d1fae5' : '#fee2e2' }
            ]}>
              <Text style={[
                styles.amountText,
                { color: transaction.type === 'income' ? '#059669' : '#dc3545' }
              ]}>
                {formatAmount(transaction.amount, transaction.type)}
              </Text>
              <Text style={styles.typeText}>
                {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
              </Text>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            <View style={styles.detailItem}>
              <View style={styles.detailLabel}>
                <MaterialIcons name="category" size={20} color="#666" />
                <Text style={styles.detailLabelText}>Category</Text>
              </View>
              <View style={styles.categoryValue}>
                <MaterialIcons
                  name={transaction.category?.icon_name as any || 'category'}
                  size={20}
                  color="#007bff"
                />
                <Text style={styles.detailValueText}>
                  {transaction.category?.name || 'Unknown Category'}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailLabel}>
                <MaterialIcons name="event" size={20} color="#666" />
                <Text style={styles.detailLabelText}>Date & Time</Text>
              </View>
              <View style={styles.dateTimeValue}>
                <Text style={styles.detailValueText}>
                  {formatDateTime(transaction.transaction_date).date}
                </Text>
                <Text style={styles.timeText}>
                  {formatDateTime(transaction.transaction_date).time}
                </Text>
              </View>
            </View>

            {transaction.description && (
              <View style={styles.detailItem}>
                <View style={styles.detailLabel}>
                  <MaterialIcons name="notes" size={20} color="#666" />
                  <Text style={styles.detailLabelText}>Description</Text>
                </View>
                <Text style={styles.detailValueText}>
                  {transaction.description}
                </Text>
              </View>
            )}

            <View style={styles.detailItem}>
              <View style={styles.detailLabel}>
                <MaterialIcons name="schedule" size={20} color="#666" />
                <Text style={styles.detailLabelText}>Created</Text>
              </View>
              <Text style={styles.detailValueText}>
                {formatDate(transaction.created_at)}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={handleEdit}
            >
              <MaterialIcons name="edit" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Edit Transaction</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <MaterialIcons name="delete" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Delete Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  amountContainer: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  amountText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  typeText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 16,
  },
  detailItem: {
    gap: 8,
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabelText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailValueText: {
    fontSize: 16,
    color: '#111827',
  },
  dateTimeValue: {
    gap: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  actionSection: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#007bff',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});