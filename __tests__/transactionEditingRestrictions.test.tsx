import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EditTransactionScreen from '../app/(app)/transactions/edit/[id]';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { transactionsApi } from '@/services/api/transactions';

// Mock dependencies
jest.mock('@/stores/transactionStore');
jest.mock('@/stores/categoryStore');
jest.mock('@/services/api/transactions');
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'test-id' }),
}));

const mockUseTransactionStore = useTransactionStore as jest.MockedFunction<typeof useTransactionStore>;
const mockUseCategoryStore = useCategoryStore as jest.MockedFunction<typeof useCategoryStore>;
const mockTransactionsApi = transactionsApi as jest.Mocked<typeof transactionsApi>;

describe('Story 2.3 - Transaction Editing Restrictions', () => {
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

  const mockCategories = [
    {
      id: 'cat-1',
      user_id: 'user-1',
      name: 'Food & Dining',
      icon_name: 'restaurant',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'cat-2',
      user_id: 'user-1',
      name: 'Groceries',
      icon_name: 'shopping-cart',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'cat-3',
      user_id: 'user-1',
      name: 'Transportation',
      icon_name: 'car',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTransactionStore.mockReturnValue({
      transactions: [],
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
      updateTransaction: jest.fn().mockResolvedValue(true),
    });

    mockUseCategoryStore.mockReturnValue({
      categories: mockCategories,
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

  describe('Synced Transaction Editing Restrictions', () => {
    beforeEach(() => {
      mockTransactionsApi.getById.mockResolvedValue({
        data: mockSyncedTransaction,
        error: undefined,
      });
    });

    it('displays sync notice for synced transactions', async () => {
      const { getByText } = render(<EditTransactionScreen />);
      
      await waitFor(() => {
        expect(getByText('MTN MoMo')).toBeTruthy();
        expect(getByText('This transaction was synced from your MTN MoMo account. Only the category can be changed.')).toBeTruthy();
      });
    });

    it('disables amount field for synced transactions', async () => {
      const { getByDisplayValue } = render(<EditTransactionScreen />);
      
      await waitFor(() => {
        const amountInput = getByDisplayValue('25.5');
        expect(amountInput.props.editable).toBe(false);
      });
    });

    it('disables type selector for synced transactions', async () => {
      const { getByText } = render(<EditTransactionScreen />);
      
      await waitFor(() => {
        const incomeButton = getByText('Income').parent;
        const expenseButton = getByText('Expense').parent;
        
        // Buttons should be disabled (checking for disabled prop)
        expect(incomeButton?.props.disabled).toBe(true);
        expect(expenseButton?.props.disabled).toBe(true);
      });
    });

    it('disables date picker for synced transactions', async () => {
      const { getByText } = render(<EditTransactionScreen />);
      
      await waitFor(() => {
        const datePicker = getByText('January 15, 2024').parent;
        expect(datePicker?.props.disabled).toBe(true);
      });
    });

    it('disables description field for synced transactions', async () => {
      const { getByDisplayValue } = render(<EditTransactionScreen />);
      
      await waitFor(() => {
        const descriptionInput = getByDisplayValue('Lunch at KFC Accra Mall');
        expect(descriptionInput.props.editable).toBe(false);
      });
    });

    it('allows category selection for synced transactions', async () => {
      const { getByText } = render(<EditTransactionScreen />);
      
      await waitFor(() => {
        const categoryButton = getByText('Food & Dining').parent;
        expect(categoryButton?.props.disabled).toBeFalsy();
      });
    });

    it('only sends category updates for synced transactions', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(true);
      mockUseTransactionStore.mockReturnValue({
        transactions: [],
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
        updateTransaction: mockUpdate,
      });

      const { getByText, getByDisplayValue } = render(<EditTransactionScreen />);
      
      await waitFor(() => {
        expect(getByText('Food & Dining')).toBeTruthy();
      });

      // Try to change category
      fireEvent.press(getByText('Food & Dining'));
      
      await waitFor(() => {
        fireEvent.press(getByText('Transportation'));
      });

      // Submit the form
      fireEvent.press(getByText('Update Transaction'));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          'sync-1',
          undefined, // amount should not be passed
          undefined, // type should not be passed
          'cat-3', // only category_id should be passed
          undefined, // date should not be passed
          undefined // description should not be passed
        );
      });
    });
  });

  describe('Manual Transaction Editing Freedom', () => {
    beforeEach(() => {
      mockTransactionsApi.getById.mockResolvedValue({
        data: mockManualTransaction,
        error: undefined,
      });
    });

    it('does not display sync notice for manual transactions', async () => {
      const { queryByText } = render(<EditTransactionScreen />);
      
      await waitFor(() => {
        expect(queryByText('MTN MoMo')).toBeNull();
        expect(queryByText('This transaction was synced from your MTN MoMo account')).toBeNull();
      });
    });

    it('enables all fields for manual transactions', async () => {
      const { getByDisplayValue } = render(<EditTransactionScreen />);
      
      await waitFor(() => {
        const amountInput = getByDisplayValue('50');
        const descriptionInput = getByDisplayValue('Manual grocery shopping');
        
        expect(amountInput.props.editable).toBe(true);
        expect(descriptionInput.props.editable).toBe(true);
      });
    });

    it('allows all field updates for manual transactions', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(true);
      mockUseTransactionStore.mockReturnValue({
        transactions: [],
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
        updateTransaction: mockUpdate,
      });

      const { getByText, getByDisplayValue } = render(<EditTransactionScreen />);
      
      await waitFor(() => {
        expect(getByDisplayValue('50')).toBeTruthy();
      });

      // Change amount
      const amountInput = getByDisplayValue('50');
      fireEvent.changeText(amountInput, '75');

      // Change description
      const descriptionInput = getByDisplayValue('Manual grocery shopping');
      fireEvent.changeText(descriptionInput, 'Updated grocery shopping');

      // Submit the form
      fireEvent.press(getByText('Update Transaction'));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          'manual-1',
          75, // amount should be updated
          'expense', // type should be included
          'cat-2', // category_id should be included
          expect.any(String), // date should be included
          'Updated grocery shopping' // description should be updated
        );
      });
    });
  });
});