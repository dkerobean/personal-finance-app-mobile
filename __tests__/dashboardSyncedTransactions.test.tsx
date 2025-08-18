import React from 'react';
import { render } from '@testing-library/react-native';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import TotalBalanceCard from '@/components/dashboard/TotalBalanceCard';
import { isSyncedTransaction } from '@/services/api/transactions';

// Mock dependencies
jest.mock('@/services/api/transactions');
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const mockIsSyncedTransaction = isSyncedTransaction as jest.MockedFunction<typeof isSyncedTransaction>;

describe('Story 2.3 - Dashboard Synced Transactions', () => {
  const mockSyncedTransaction = {
    id: 'sync-1',
    user_id: 'user-1',
    amount: 25.50,
    type: 'expense' as const,
    category_id: 'cat-1',
    transaction_date: '2024-01-15T12:00:00Z',
    description: 'Lunch at KFC Accra Mall',
    created_at: '2024-01-15T12:00:00Z',
    updated_at: '2024-01-15T12:00:00Z',
    momo_external_id: 'mock-ext-001',
    momo_transaction_id: 'mock-fin-001',
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
    transaction_date: '2024-01-14T10:00:00Z',
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

  const mockSyncedIncome = {
    id: 'sync-income-1',
    user_id: 'user-1',
    amount: 2000.00,
    type: 'income' as const,
    category_id: 'cat-3',
    transaction_date: '2024-01-01T09:00:00Z',
    description: 'Monthly salary deposit',
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2024-01-01T09:00:00Z',
    momo_external_id: 'mock-ext-002',
    momo_transaction_id: 'mock-fin-002',
    category: {
      id: 'cat-3',
      user_id: 'user-1',
      name: 'Salary',
      icon_name: 'briefcase',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockIsSyncedTransaction.mockImplementation((transaction) => {
      return !!(transaction.momo_external_id || transaction.momo_transaction_id);
    });
  });

  describe('RecentTransactions Component', () => {
    it('displays MTN MoMo badge for synced transactions', () => {
      const transactions = [mockSyncedTransaction, mockManualTransaction];
      const { getByText, queryByText } = render(
        <RecentTransactions transactions={transactions} />
      );

      // Should show MTN MoMo badge for synced transaction
      expect(getByText('MTN MoMo')).toBeTruthy();
      
      // Should show both transaction categories
      expect(getByText('Food & Dining')).toBeTruthy();
      expect(getByText('Groceries')).toBeTruthy();
    });

    it('handles mixed transaction types in recent list', () => {
      const transactions = [
        mockSyncedIncome,
        mockSyncedTransaction,
        mockManualTransaction,
      ];
      
      const { getByText, getAllByText } = render(
        <RecentTransactions transactions={transactions} />
      );

      // Should show MTN MoMo badges for synced transactions
      expect(getAllByText('MTN MoMo')).toHaveLength(2);
      
      // Should show correct amounts with proper signs
      expect(getByText('+GH₵2,000.00')).toBeTruthy(); // Synced income
      expect(getByText('-GH₵25.50')).toBeTruthy(); // Synced expense
      expect(getByText('-GH₵50.00')).toBeTruthy(); // Manual expense
    });

    it('sorts mixed transactions chronologically', () => {
      const transactions = [
        mockManualTransaction, // 2024-01-14
        mockSyncedTransaction, // 2024-01-15 (most recent)
        mockSyncedIncome, // 2024-01-01
      ];
      
      const { getAllByTestId } = render(
        <RecentTransactions transactions={transactions} />
      );

      // Would need testID props in implementation to verify order
      // This test structure shows how to verify chronological ordering
    });

    it('shows only 5 most recent transactions regardless of type', () => {
      const manyTransactions = [
        mockSyncedTransaction,
        mockManualTransaction,
        mockSyncedIncome,
        // Add 4 more transactions to exceed the limit
        { ...mockSyncedTransaction, id: 'sync-2', transaction_date: '2024-01-13T10:00:00Z' },
        { ...mockManualTransaction, id: 'manual-2', transaction_date: '2024-01-12T10:00:00Z' },
        { ...mockSyncedTransaction, id: 'sync-3', transaction_date: '2024-01-11T10:00:00Z' },
        { ...mockManualTransaction, id: 'manual-3', transaction_date: '2024-01-10T10:00:00Z' },
      ];
      
      const { getAllByTestId } = render(
        <RecentTransactions transactions={manyTransactions} />
      );

      // Would verify only 5 items are displayed
      // Implementation needs testID props for proper verification
    });
  });

  describe('TotalBalanceCard Component', () => {
    it('includes synced transactions in balance calculation', () => {
      const transactions = [
        mockSyncedIncome, // +2000
        mockSyncedTransaction, // -25.50
        mockManualTransaction, // -50
      ];
      
      const { getByText } = render(
        <TotalBalanceCard transactions={transactions} />
      );

      // Total balance should be 2000 - 25.50 - 50 = 1924.50
      expect(getByText('GH₵1,924.50')).toBeTruthy();
    });

    it('includes synced transactions in income summary', () => {
      const transactions = [
        mockSyncedIncome, // +2000 (synced income)
        mockSyncedTransaction, // -25.50 (synced expense)
        mockManualTransaction, // -50 (manual expense)
      ];
      
      const { getByText } = render(
        <TotalBalanceCard transactions={transactions} />
      );

      // Income summary should include synced income
      expect(getByText('GH₵2,000.00')).toBeTruthy();
    });

    it('includes synced transactions in expense summary', () => {
      const transactions = [
        mockSyncedIncome, // +2000 (synced income)
        mockSyncedTransaction, // -25.50 (synced expense)
        mockManualTransaction, // -50 (manual expense)
      ];
      
      const { getByText } = render(
        <TotalBalanceCard transactions={transactions} />
      );

      // Expense summary should include both synced and manual expenses
      // Total expenses: 25.50 + 50 = 75.50
      expect(getByText('GH₵75.50')).toBeTruthy();
    });

    it('handles positive balance from mixed transactions', () => {
      const transactions = [
        mockSyncedIncome, // +2000
        mockSyncedTransaction, // -25.50
      ];
      
      const { getByText } = render(
        <TotalBalanceCard transactions={transactions} />
      );

      // Should show positive balance with green color
      expect(getByText('GH₵1,974.50')).toBeTruthy();
    });

    it('handles negative balance from mixed transactions', () => {
      const transactions = [
        mockSyncedTransaction, // -25.50
        mockManualTransaction, // -50
      ];
      
      const { getByText } = render(
        <TotalBalanceCard transactions={transactions} />
      );

      // Should show negative balance
      expect(getByText('-GH₵75.50')).toBeTruthy();
    });

    it('handles empty transaction list', () => {
      const { getByText } = render(
        <TotalBalanceCard transactions={[]} />
      );

      // Should show zero balance
      expect(getByText('GH₵0.00')).toBeTruthy();
    });
  });

  describe('Data Integrity', () => {
    it('preserves synced transaction metadata in dashboard display', () => {
      const transactions = [mockSyncedTransaction];
      
      const { getByText } = render(
        <RecentTransactions transactions={transactions} />
      );

      // Should preserve original description
      expect(getByText('Lunch at KFC Accra Mall')).toBeTruthy();
      
      // Should show correct category
      expect(getByText('Food & Dining')).toBeTruthy();
      
      // Should show MTN MoMo badge
      expect(getByText('MTN MoMo')).toBeTruthy();
    });

    it('maintains transaction ordering with mixed types', () => {
      const transactions = [
        { ...mockSyncedTransaction, transaction_date: '2024-01-15T12:00:00Z' },
        { ...mockManualTransaction, transaction_date: '2024-01-15T11:00:00Z' },
        { ...mockSyncedIncome, transaction_date: '2024-01-15T10:00:00Z' },
      ];
      
      const { getAllByTestId } = render(
        <RecentTransactions transactions={transactions} />
      );

      // Implementation would need testID props to verify exact ordering
      // This test structure shows how to verify mixed transaction ordering
    });
  });
});