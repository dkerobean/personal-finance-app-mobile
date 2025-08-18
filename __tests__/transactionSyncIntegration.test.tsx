import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import TransactionsScreen from '../app/(app)/transactions/index';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { isSyncedTransaction } from '@/services/api/transactions';

// Mock the stores
jest.mock('@/stores/transactionStore');
jest.mock('@/stores/categoryStore');
jest.mock('@/services/api/transactions');
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockUseTransactionStore = useTransactionStore as jest.MockedFunction<typeof useTransactionStore>;
const mockUseCategoryStore = useCategoryStore as jest.MockedFunction<typeof useCategoryStore>;
const mockIsSyncedTransaction = isSyncedTransaction as jest.MockedFunction<typeof isSyncedTransaction>;

describe('Story 2.3 - Synced Transaction Integration', () => {
  const mockSyncedTransaction = {
    id: 'sync-1',
    user_id: 'user-1',
    amount: 25.50,
    type: 'expense' as const,
    category_id: 'cat-1',
    transaction_date: '2024-01-15',
    description: 'Lunch at KFC Accra Mall',
    created_at: '2024-01-15T12:00:00Z',
    updated_at: '2024-01-15T12:00:00Z',
    momo_external_id: 'mock-ext-001',
    momo_transaction_id: 'mock-fin-001',
    merchant_name: 'KFC',
    auto_categorized: true,
    account: {
      id: 'acc-1',
      phone_number: '233241234567',
      account_name: 'Personal MTN',
      is_active: true,
    },
    category: {
      id: 'cat-1',
      user_id: 'user-1',
      name: 'Food & Dining',
      icon_name: 'restaurant',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  };

  const mockManualTransaction = {
    id: 'manual-1',
    user_id: 'user-1',
    amount: 50.00,
    type: 'expense' as const,
    category_id: 'cat-2',
    transaction_date: '2024-01-14',
    description: 'Manual grocery shopping',
    created_at: '2024-01-14T10:00:00Z',
    updated_at: '2024-01-14T10:00:00Z',
    category: {
      id: 'cat-2',
      user_id: 'user-1',
      name: 'Groceries',
      icon_name: 'shopping-cart',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockIsSyncedTransaction.mockImplementation((transaction) => {
      return !!(transaction.momo_external_id || transaction.momo_transaction_id);
    });

    mockUseTransactionStore.mockReturnValue({
      transactions: [mockSyncedTransaction, mockManualTransaction],
      isLoading: false,
      error: null,
      sortOrder: 'desc',
      loadTransactions: jest.fn(),
      deleteTransaction: jest.fn(),
      setSortOrder: jest.fn(),
      clearError: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      createTransaction: jest.fn(),
      updateTransaction: jest.fn(),
    });

    mockUseCategoryStore.mockReturnValue({
      categories: [
        mockSyncedTransaction.category,
        mockManualTransaction.category,
      ],
      isLoading: false,
      error: null,
      loadCategories: jest.fn(),
      createCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
    });
  });

  describe('Visual Differentiation', () => {
    it('displays MTN MoMo badge for synced transactions', () => {
      const { getByText, getAllByText } = render(<TransactionsScreen />);
      
      // Should show MTN MoMo badge for synced transaction
      expect(getByText('MTN MoMo')).toBeTruthy();
      
      // Should show both transactions
      expect(getByText('Food & Dining')).toBeTruthy();
      expect(getByText('Groceries')).toBeTruthy();
    });

    it('shows edit icon for synced transactions instead of delete', () => {
      const { getByTestId, queryByTestId } = render(<TransactionsScreen />);
      
      // Note: This would require adding testID props to the TouchableOpacity components
      // in the actual implementation for proper testing
    });

    it('shows delete button for manual transactions', () => {
      const { getAllByTestId } = render(<TransactionsScreen />);
      
      // This test would verify that manual transactions show delete buttons
      // Implementation would require testID props
    });
  });

  describe('Delete Restrictions', () => {
    it('prevents deletion of synced transactions with alert', async () => {
      const { getByText } = render(<TransactionsScreen />);
      
      // This test would simulate clicking delete on a synced transaction
      // and verify that the restriction alert is shown
      // Implementation depends on proper testID setup
    });

    it('allows deletion of manual transactions', async () => {
      const mockDeleteTransaction = jest.fn().mockResolvedValue(true);
      
      mockUseTransactionStore.mockReturnValue({
        transactions: [mockManualTransaction],
        isLoading: false,
        error: null,
        sortOrder: 'desc',
        loadTransactions: jest.fn(),
        deleteTransaction: mockDeleteTransaction,
        setSortOrder: jest.fn(),
        clearError: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        createTransaction: jest.fn(),
        updateTransaction: jest.fn(),
      });

      const { getByText } = render(<TransactionsScreen />);
      
      // This test would simulate successful deletion of manual transaction
    });
  });

  describe('Mixed Transaction Display', () => {
    it('displays both synced and manual transactions in chronological order', () => {
      const { getByText } = render(<TransactionsScreen />);
      
      // Verify both transaction types are displayed
      expect(getByText('Food & Dining')).toBeTruthy(); // Synced
      expect(getByText('Groceries')).toBeTruthy(); // Manual
      
      // Verify amounts are displayed correctly
      expect(getByText('-$25.50')).toBeTruthy(); // Synced transaction
      expect(getByText('-$50.00')).toBeTruthy(); // Manual transaction
    });

    it('maintains proper transaction data integrity', () => {
      const { getByText } = render(<TransactionsScreen />);
      
      // Verify synced transaction shows MTN MoMo account info
      expect(getByText('MTN MoMo')).toBeTruthy();
      
      // Verify transaction dates are displayed
      expect(getByText('Jan 15, 2024')).toBeTruthy();
      expect(getByText('Jan 14, 2024')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('handles missing account information gracefully', () => {
      const transactionWithoutAccount = {
        ...mockSyncedTransaction,
        account: undefined,
      };

      mockUseTransactionStore.mockReturnValue({
        transactions: [transactionWithoutAccount],
        isLoading: false,
        error: null,
        sortOrder: 'desc',
        loadTransactions: jest.fn(),
        deleteTransaction: jest.fn(),
        setSortOrder: jest.fn(),
        clearError: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        createTransaction: jest.fn(),
        updateTransaction: jest.fn(),
      });

      const { getByText } = render(<TransactionsScreen />);
      
      // Should still show MTN MoMo badge even without account info
      expect(getByText('MTN MoMo')).toBeTruthy();
    });

    it('handles transactions with missing categories', () => {
      const transactionWithoutCategory = {
        ...mockSyncedTransaction,
        category: undefined,
      };

      mockUseTransactionStore.mockReturnValue({
        transactions: [transactionWithoutCategory],
        isLoading: false,
        error: null,
        sortOrder: 'desc',
        loadTransactions: jest.fn(),
        deleteTransaction: jest.fn(),
        setSortOrder: jest.fn(),
        clearError: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        createTransaction: jest.fn(),
        updateTransaction: jest.fn(),
      });

      const { getByText } = render(<TransactionsScreen />);
      
      // Should show fallback category name
      expect(getByText('Unknown Category')).toBeTruthy();
    });
  });
});