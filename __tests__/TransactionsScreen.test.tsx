import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import TransactionsScreen from '../app/(app)/transactions/index';
import { useTransactionStore } from '@/stores/transactionStore';
import { useCategoryStore } from '@/stores/categoryStore';
import type { Transaction, Category } from '@/types/models';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock stores
jest.mock('@/stores/transactionStore', () => ({
  useTransactionStore: jest.fn(),
}));

jest.mock('@/stores/categoryStore', () => ({
  useCategoryStore: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
};

const mockTransactions: Transaction[] = [
  {
    id: '1',
    user_id: 'user1',
    amount: 100.50,
    type: 'expense',
    category_id: 'cat1',
    transaction_date: '2024-01-15',
    description: 'Groceries',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    category: {
      id: 'cat1',
      user_id: 'user1',
      name: 'Food',
      icon_name: 'restaurant',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }
  },
  {
    id: '2',
    user_id: 'user1',
    amount: 2500.00,
    type: 'income',
    category_id: 'cat2',
    transaction_date: '2024-01-10',
    description: 'Salary',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
    category: {
      id: 'cat2',
      user_id: 'user1',
      name: 'Salary',
      icon_name: 'attach-money',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }
  }
];

const mockTransactionStore = {
  transactions: mockTransactions,
  isLoading: false,
  error: null,
  sortOrder: 'desc' as const,
  loadTransactions: jest.fn(),
  deleteTransaction: jest.fn(),
  setSortOrder: jest.fn(),
  clearError: jest.fn(),
};

const mockCategoryStore = {
  loadCategories: jest.fn(),
};

describe('TransactionsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useTransactionStore as unknown as jest.Mock).mockReturnValue(mockTransactionStore);
    (useCategoryStore as unknown as jest.Mock).mockReturnValue(mockCategoryStore);
  });

  it('should render transactions list correctly', () => {
    render(<TransactionsScreen />);

    expect(screen.getByText('Transactions')).toBeTruthy();
    expect(screen.getByText('Food')).toBeTruthy();
    expect(screen.getByText('Salary')).toBeTruthy();
    expect(screen.getByText('-$100.50')).toBeTruthy();
    expect(screen.getByText('+$2,500.00')).toBeTruthy();
    expect(screen.getByText('Groceries')).toBeTruthy();
    expect(screen.getByText('Salary')).toBeTruthy();
  });

  it('should show loading state when transactions are loading', () => {
    (useTransactionStore as unknown as jest.Mock).mockReturnValue({
      ...mockTransactionStore,
      transactions: [],
      isLoading: true,
    });

    render(<TransactionsScreen />);

    expect(screen.getByText('Loading transactions...')).toBeTruthy();
  });

  it('should show empty state when no transactions', () => {
    (useTransactionStore as unknown as jest.Mock).mockReturnValue({
      ...mockTransactionStore,
      transactions: [],
      isLoading: false,
    });

    render(<TransactionsScreen />);

    expect(screen.getByText('No transactions yet.')).toBeTruthy();
    expect(screen.getByText('Add your first transaction to get started.')).toBeTruthy();
  });

  it('should show error message when there is an error', () => {
    (useTransactionStore as unknown as jest.Mock).mockReturnValue({
      ...mockTransactionStore,
      error: 'Failed to load transactions',
    });

    render(<TransactionsScreen />);

    expect(screen.getByText('Failed to load transactions')).toBeTruthy();
  });

  it('should clear error when close button is pressed', () => {
    (useTransactionStore as unknown as jest.Mock).mockReturnValue({
      ...mockTransactionStore,
      error: 'Failed to load transactions',
    });

    render(<TransactionsScreen />);

    const closeButton = screen.getByRole('button');
    fireEvent.press(closeButton);

    expect(mockTransactionStore.clearError).toHaveBeenCalled();
  });

  it('should navigate to create transaction when FAB is pressed', () => {
    render(<TransactionsScreen />);

    const fab = screen.getByRole('button');
    fireEvent.press(fab);

    expect(mockRouter.push).toHaveBeenCalledWith('/transactions/create');
  });

  it('should navigate to transaction detail when transaction is pressed', () => {
    render(<TransactionsScreen />);

    const firstTransaction = screen.getByText('Food');
    fireEvent.press(firstTransaction);

    expect(mockRouter.push).toHaveBeenCalledWith('/transactions/1');
  });

  it('should toggle sort order when sort button is pressed', () => {
    render(<TransactionsScreen />);

    const sortButton = screen.getByText('Date');
    fireEvent.press(sortButton);

    expect(mockTransactionStore.setSortOrder).toHaveBeenCalledWith('asc');
  });

  it('should show delete confirmation when delete button is pressed', () => {
    render(<TransactionsScreen />);

    const deleteButtons = screen.getAllByText('delete');
    fireEvent.press(deleteButtons[0]);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Transaction',
      'Are you sure you want to delete this expense of $100.50? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: expect.any(Function)
        }
      ]
    );
  });

  it('should call deleteTransaction when delete is confirmed', async () => {
    mockTransactionStore.deleteTransaction.mockResolvedValue(true);

    render(<TransactionsScreen />);

    const deleteButtons = screen.getAllByText('delete');
    fireEvent.press(deleteButtons[0]);

    // Simulate pressing the Delete button in the alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const deleteAction = alertCall[2][1];
    await deleteAction.onPress();

    expect(mockTransactionStore.deleteTransaction).toHaveBeenCalledWith('1');
  });

  it('should show error alert when delete fails', async () => {
    mockTransactionStore.deleteTransaction.mockResolvedValue(false);
    (useTransactionStore as unknown as jest.Mock).mockReturnValue({
      ...mockTransactionStore,
      error: 'Failed to delete transaction',
    });

    render(<TransactionsScreen />);

    const deleteButtons = screen.getAllByText('delete');
    fireEvent.press(deleteButtons[0]);

    // Simulate pressing the Delete button in the alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const deleteAction = alertCall[2][1];
    await deleteAction.onPress();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to delete transaction');
    });
  });

  it('should load transactions and categories on mount', () => {
    render(<TransactionsScreen />);

    expect(mockTransactionStore.loadTransactions).toHaveBeenCalled();
    expect(mockCategoryStore.loadCategories).toHaveBeenCalled();
  });

  it('should format dates correctly', () => {
    render(<TransactionsScreen />);

    expect(screen.getByText('Jan 15, 2024')).toBeTruthy();
    expect(screen.getByText('Jan 10, 2024')).toBeTruthy();
  });

  it('should format amounts correctly with income and expense styling', () => {
    render(<TransactionsScreen />);

    const expenseAmount = screen.getByText('-$100.50');
    const incomeAmount = screen.getByText('+$2,500.00');

    expect(expenseAmount).toBeTruthy();
    expect(incomeAmount).toBeTruthy();
  });

  it('should handle transactions without category gracefully', () => {
    const transactionWithoutCategory: Transaction = {
      id: '3',
      user_id: 'user1',
      amount: 25.00,
      type: 'expense',
      category_id: 'cat3',
      transaction_date: '2024-01-12',
      created_at: '2024-01-12T10:00:00Z',
      updated_at: '2024-01-12T10:00:00Z',
    };

    (useTransactionStore as unknown as jest.Mock).mockReturnValue({
      ...mockTransactionStore,
      transactions: [transactionWithoutCategory],
    });

    render(<TransactionsScreen />);

    expect(screen.getByText('Unknown Category')).toBeTruthy();
  });

  it('should handle transactions without description', () => {
    const transactionWithoutDescription: Transaction = {
      id: '3',
      user_id: 'user1',
      amount: 25.00,
      type: 'expense',
      category_id: 'cat1',
      transaction_date: '2024-01-12',
      created_at: '2024-01-12T10:00:00Z',
      updated_at: '2024-01-12T10:00:00Z',
      category: mockTransactions[0].category,
    };

    (useTransactionStore as unknown as jest.Mock).mockReturnValue({
      ...mockTransactionStore,
      transactions: [transactionWithoutDescription],
    });

    render(<TransactionsScreen />);

    expect(screen.getByText('Food')).toBeTruthy();
    expect(screen.getByText('-$25.00')).toBeTruthy();
    // Description should not be rendered if not present
    expect(screen.queryByText('Groceries')).toBeNull();
  });
});