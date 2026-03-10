import React, { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTransactionStore } from '@/stores/transactionStore';
import { transactionsApi } from '@/services/api/transactions';
import type { Transaction } from '@/types/models';
import { useAppToast } from '@/hooks/useAppToast';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/design';
import { useAuth } from '@clerk/clerk-expo';
import { mapIconName } from '@/utils/iconMapping';

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const toast = useAppToast();
  const { deleteTransaction, error: transactionError } = useTransactionStore();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && userId) {
      loadTransaction();
    }
  }, [id, userId]);

  const loadTransaction = async () => {
    if (!id || !userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await transactionsApi.getById(userId, id);
      
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
      `Are you sure you want to delete this ${transaction.type} of GH¢${transaction.amount.toFixed(2)}? This action cannot be undone.`,
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
    if (!transaction) {
      return;
    }

    if (!userId) {
      toast.error('Sign in required', 'Please sign in again before deleting this transaction.');
      return;
    }

    const success = await deleteTransaction(userId, transaction.id);
    
    if (success) {
      toast.success(
        transaction.type === 'income' ? 'Income Deleted' : 'Expense Deleted',
        `GH¢${transaction.amount.toFixed(2)} removed successfully`
      );
      setTimeout(() => router.back(), 450);
    } else {
      toast.error('Delete failed', transactionError || 'Failed to delete transaction');
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
    return `${sign}GH¢${amount.toFixed(2)}`;
  };

  const transactionIcon = mapIconName(transaction?.category?.icon_name, transaction?.category?.name);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading transaction...</Text>
        </View>
      </View>
    );
  }

  if (error || !transaction) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorTitle}>Transaction Not Found</Text>
          <Text style={styles.errorText}>
            {error || 'The transaction you\'re looking for could not be found.'}
          </Text>
          <TouchableOpacity 
            style={styles.backToListButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backToListButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Green Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialIcons name="notifications-none" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content with curved background */}
      <View style={styles.content}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Amount Card */}
          <View style={styles.amountCard}>
            <Text style={[
              styles.amountText,
              { color: transaction.type === 'income' ? COLORS.primary : COLORS.error }
            ]}>
              {formatAmount(transaction.amount, transaction.type)}
            </Text>
            <Text style={styles.typeText}>
              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
            </Text>
          </View>

          {/* Details Cards */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category</Text>
              </View>
              <View style={styles.categoryValue}>
                <View style={[
                  styles.categoryIconWrap,
                  transaction.type === 'income' ? styles.categoryIconIncome : styles.categoryIconExpense,
                ]}>
                  <Ionicons
                    name={transactionIcon as any}
                    size={18}
                    color={COLORS.white}
                  />
                </View>
                <Text style={styles.detailValue}>
                  {transaction.category?.name || 'Unknown Category'}
                </Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <MaterialIcons name="event" size={20} color={COLORS.primaryDark} />
                <Text style={styles.detailLabel}>Date</Text>
              </View>
              <Text style={styles.detailValue}>
                {formatDateTime(transaction.transaction_date).date}
              </Text>
            </View>

            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <MaterialIcons name="access-time" size={20} color={COLORS.primaryDark} />
                <Text style={styles.detailLabel}>Time</Text>
              </View>
              <Text style={styles.detailValue}>
                {formatDateTime(transaction.transaction_date).time}
              </Text>
            </View>

            {transaction.description && (
              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="notes" size={20} color={COLORS.primaryDark} />
                  <Text style={styles.detailLabel}>Description</Text>
                </View>
                <Text style={styles.detailValue}>
                  {transaction.description}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
      
      {/* Action Buttons - Fixed at bottom */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEdit}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  header: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.fonts.display,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.backgroundContent,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingTop: SPACING.xl,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundContent,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.primaryDark,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 37,
    backgroundColor: COLORS.backgroundContent,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.primaryDark,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.primaryDark,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Poppins',
    lineHeight: 24,
  },
  backToListButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backToListButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fonts.semibold,
  },
  amountCard: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: 20,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  amountText: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.fonts.display,
  },
  typeText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontFamily: TYPOGRAPHY.fonts.medium,
    textTransform: 'capitalize',
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailCard: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: 20,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    fontWeight: '500',
    fontFamily: TYPOGRAPHY.fonts.medium,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fonts.semibold,
  },
  categoryValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  categoryIconIncome: {
    backgroundColor: COLORS.success,
  },
  categoryIconExpense: {
    backgroundColor: COLORS.error,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: 120,
    backgroundColor: COLORS.backgroundContent,
  },
  editButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    minHeight: 50,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  editButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.fonts.bold,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  deleteButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    color: COLORS.error,
    fontFamily: TYPOGRAPHY.fonts.bold,
  },
});
