import { create } from 'zustand';
import type { TransactionState, TransactionActions } from '@/types/store';
import type { TransactionType } from '@/types/models';
import { transactionsApi, isSyncedTransaction } from '@/services/api/transactions';

interface TransactionStore extends TransactionState, TransactionActions {}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  sortOrder: 'desc',

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  setSortOrder: (sortOrder) => {
    set({ sortOrder });
    // Re-sort existing transactions
    const { transactions } = get();
    const sorted = [...transactions].sort((a, b) => {
      const dateA = new Date(a.transaction_date).getTime();
      const dateB = new Date(b.transaction_date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    set({ transactions: sorted });
  },

  loadTransactions: async () => {
    const { setLoading, setError, sortOrder } = get();
    
    setLoading(true);
    setError(null);

    try {
      const response = await transactionsApi.list();
      
      if (response.error) {
        setError(response.error.message);
        return;
      }

      let transactions = response.data || [];
      
      // Sort transactions by date
      transactions = transactions.sort((a, b) => {
        const dateA = new Date(a.transaction_date).getTime();
        const dateB = new Date(b.transaction_date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });

      set({ transactions });
    } catch (error) {
      setError('Failed to load transactions');
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  },

  createTransaction: async (amount, type, categoryId, date, description) => {
    const { setLoading, setError, loadTransactions } = get();
    
    setLoading(true);
    setError(null);

    try {
      const response = await transactionsApi.create({
        amount,
        type,
        category_id: categoryId,
        transaction_date: date,
        description,
      });
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      // Reload transactions to get the updated list
      await loadTransactions();
      return true;
    } catch (error) {
      setError('Failed to create transaction');
      console.error('Error creating transaction:', error);
      return false;
    } finally {
      setLoading(false);
    }
  },

  updateTransaction: async (id, amount, type, categoryId, date, description) => {
    const { setLoading, setError, loadTransactions } = get();
    
    setLoading(true);
    setError(null);

    try {
      const updateData: any = {};
      if (amount !== undefined) updateData.amount = amount;
      if (type !== undefined) updateData.type = type;
      if (categoryId !== undefined) updateData.category_id = categoryId;
      if (date !== undefined) updateData.transaction_date = date;
      if (description !== undefined) updateData.description = description;

      const response = await transactionsApi.update(id, updateData);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      // Reload transactions to get the updated list
      await loadTransactions();
      return true;
    } catch (error) {
      setError('Failed to update transaction');
      console.error('Error updating transaction:', error);
      return false;
    } finally {
      setLoading(false);
    }
  },

  deleteTransaction: async (id) => {
    const { setLoading, setError, loadTransactions } = get();
    
    setLoading(true);
    setError(null);

    try {
      const response = await transactionsApi.delete(id);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      // Reload transactions to get the updated list
      await loadTransactions();
      return true;
    } catch (error) {
      setError('Failed to delete transaction');
      console.error('Error deleting transaction:', error);
      return false;
    } finally {
      setLoading(false);
    }
  },
}));

// Dashboard selectors
export const useDashboardData = () => {
  const transactions = useTransactionStore(state => state.transactions);
  const isLoading = useTransactionStore(state => state.isLoading);
  const error = useTransactionStore(state => state.error);

  const getTotalBalance = (): number => {
    return transactions.reduce((total, transaction) => {
      if (transaction.type === 'income') {
        return total + transaction.amount;
      } else {
        return total - transaction.amount;
      }
    }, 0);
  };

  const getRecentTransactions = (limit: number = 5) => {
    return [...transactions]
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
      .slice(0, limit);
  };

  const getTotalIncome = (): number => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpenses = (): number => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Synced transaction selectors
  const getSyncedTransactions = () => {
    return transactions.filter(t => isSyncedTransaction(t));
  };

  const getManualTransactions = () => {
    return transactions.filter(t => !isSyncedTransaction(t));
  };

  const getSyncedTransactionCount = (): number => {
    return getSyncedTransactions().length;
  };

  const getManualTransactionCount = (): number => {
    return getManualTransactions().length;
  };

  const getSyncedIncome = (): number => {
    return getSyncedTransactions()
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getSyncedExpenses = (): number => {
    return getSyncedTransactions()
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getManualIncome = (): number => {
    return getManualTransactions()
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getManualExpenses = (): number => {
    return getManualTransactions()
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return {
    transactions,
    isLoading,
    error,
    totalBalance: getTotalBalance(),
    recentTransactions: getRecentTransactions(),
    totalIncome: getTotalIncome(),
    totalExpenses: getTotalExpenses(),
    // Synced transaction data
    syncedTransactions: getSyncedTransactions(),
    manualTransactions: getManualTransactions(),
    syncedTransactionCount: getSyncedTransactionCount(),
    manualTransactionCount: getManualTransactionCount(),
    syncedIncome: getSyncedIncome(),
    syncedExpenses: getSyncedExpenses(),
    manualIncome: getManualIncome(),
    manualExpenses: getManualExpenses(),
  };
};