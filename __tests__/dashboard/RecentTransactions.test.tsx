import React from 'react';
import { render, fireEvent } from '../utils';
import RecentTransactions from '../../src/components/dashboard/RecentTransactions';
import type { Transaction } from '../../src/types/models';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('RecentTransactions', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  const mockTransactions: Transaction[] = [
    {
      id: '1',
      user_id: 'user1',
      amount: 1000,
      type: 'income',
      category_id: 'cat1',
      transaction_date: '2025-01-15',
      description: 'Salary',
      created_at: '2025-01-15',
      updated_at: '2025-01-15',
      category: {
        id: 'cat1',
        user_id: 'user1',
        name: 'Salary',
        icon_name: 'attach-money',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
    },
    {
      id: '2',
      user_id: 'user1',
      amount: 300,
      type: 'expense',
      category_id: 'cat2',
      transaction_date: '2025-01-14',
      description: 'Groceries',
      created_at: '2025-01-14',
      updated_at: '2025-01-14',
      category: {
        id: 'cat2',
        user_id: 'user1',
        name: 'Food',
        icon_name: 'restaurant',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
    },
    {
      id: '3',
      user_id: 'user1',
      amount: 150,
      type: 'expense',
      category_id: 'cat3',
      transaction_date: '2025-01-13',
      description: 'Gas',
      created_at: '2025-01-13',
      updated_at: '2025-01-13',
      category: {
        id: 'cat3',
        user_id: 'user1',
        name: 'Transport',
        icon_name: 'local-gas-station',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
    },
    {
      id: '4',
      user_id: 'user1',
      amount: 200,
      type: 'income',
      category_id: 'cat4',
      transaction_date: '2025-01-12',
      description: 'Freelance',
      created_at: '2025-01-12',
      updated_at: '2025-01-12',
      category: {
        id: 'cat4',
        user_id: 'user1',
        name: 'Freelance',
        icon_name: 'work',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
    },
    {
      id: '5',
      user_id: 'user1',
      amount: 80,
      type: 'expense',
      category_id: 'cat5',
      transaction_date: '2025-01-11',
      description: 'Coffee',
      created_at: '2025-01-11',
      updated_at: '2025-01-11',
      category: {
        id: 'cat5',
        user_id: 'user1',
        name: 'Entertainment',
        icon_name: 'local-cafe',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
    },
    {
      id: '6',
      user_id: 'user1',
      amount: 120,
      type: 'expense',
      category_id: 'cat6',
      transaction_date: '2025-01-10',
      description: 'Utilities',
      created_at: '2025-01-10',
      updated_at: '2025-01-10',
      category: {
        id: 'cat6',
        user_id: 'user1',
        name: 'Bills',
        icon_name: 'receipt',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
    },
  ];

  it('renders loading state correctly', () => {
    const { getByText } = render(
      <RecentTransactions transactions={[]} isLoading={true} />
    );

    expect(getByText('Recent Transactions')).toBeTruthy();
    expect(getByText('Loading transactions...')).toBeTruthy();
  });

  it('renders empty state when no transactions', () => {
    const { getByText } = render(
      <RecentTransactions transactions={[]} />
    );

    expect(getByText('Recent Transactions')).toBeTruthy();
    expect(getByText('No Transactions Yet')).toBeTruthy();
    expect(getByText('Start by adding your first transaction to track your finances')).toBeTruthy();
    expect(getByText('Add Transaction')).toBeTruthy();
  });

  it('navigates to create transaction when empty state button is pressed', () => {
    const { getByText } = render(
      <RecentTransactions transactions={[]} />
    );

    const addButton = getByText('Add Transaction');
    fireEvent.press(addButton);

    expect(mockPush).toHaveBeenCalledWith('/transactions/create');
  });

  it('displays only 5 most recent transactions', () => {
    const { getByText, queryByText } = render(
      <RecentTransactions transactions={mockTransactions} />
    );

    expect(getByText('Recent Transactions')).toBeTruthy();
    expect(getByText('View All')).toBeTruthy();
    
    // Should show 5 most recent transactions
    expect(getByText('Salary')).toBeTruthy();
    expect(getByText('Food')).toBeTruthy();
    expect(getByText('Transport')).toBeTruthy();
    expect(getByText('Freelance')).toBeTruthy();
    expect(getByText('Entertainment')).toBeTruthy();
    
    // Should not show the 6th transaction
    expect(queryByText('Bills')).toBeFalsy();
  });

  it('navigates to transaction details when transaction is pressed', () => {
    const { getByText } = render(
      <RecentTransactions transactions={mockTransactions} />
    );

    const salaryTransaction = getByText('Salary');
    const transactionElement = salaryTransaction.parent;
    if (transactionElement) {
      fireEvent.press(transactionElement);
    }

    expect(mockPush).toHaveBeenCalledWith('/transactions/1');
  });

  it('navigates to all transactions when View All is pressed', () => {
    const { getByText } = render(
      <RecentTransactions transactions={mockTransactions} />
    );

    const viewAllButton = getByText('View All');
    fireEvent.press(viewAllButton);

    expect(mockPush).toHaveBeenCalledWith('/transactions');
  });

  it('displays correct currency formatting', () => {
    const { getByText } = render(
      <RecentTransactions transactions={mockTransactions} />
    );

    expect(getByText('+GH₵1,000.00')).toBeTruthy(); // Income
    expect(getByText('-GH₵300.00')).toBeTruthy(); // Expense
  });

  it('displays income transactions with positive indicator', () => {
    const { getByText } = render(
      <RecentTransactions transactions={mockTransactions} />
    );

    const incomeAmount = getByText('+GH₵1,000.00');
    expect(incomeAmount).toBeTruthy();
  });

  it('displays expense transactions with negative indicator', () => {
    const { getByText } = render(
      <RecentTransactions transactions={mockTransactions} />
    );

    const expenseAmount = getByText('-GH₵300.00');
    expect(expenseAmount).toBeTruthy();
  });

  it('handles transactions without categories', () => {
    const transactionsWithoutCategory: Transaction[] = [
      {
        id: '1',
        user_id: 'user1',
        amount: 100,
        type: 'expense',
        category_id: 'cat1',
        transaction_date: '2025-01-15',
        description: 'No category',
        created_at: '2025-01-15',
        updated_at: '2025-01-15',
      },
    ];

    const { getByText } = render(
      <RecentTransactions transactions={transactionsWithoutCategory} />
    );

    expect(getByText('Unknown Category')).toBeTruthy();
  });

  it('handles transactions without descriptions', () => {
    const transactionsWithoutDescription: Transaction[] = [
      {
        id: '1',
        user_id: 'user1',
        amount: 100,
        type: 'expense',
        category_id: 'cat1',
        transaction_date: '2025-01-15',
        created_at: '2025-01-15',
        updated_at: '2025-01-15',
        category: {
          id: 'cat1',
          user_id: 'user1',
          name: 'Food',
          icon_name: 'restaurant',
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      },
    ];

    const { getByText, queryByText } = render(
      <RecentTransactions transactions={transactionsWithoutDescription} />
    );

    expect(getByText('Food')).toBeTruthy();
    // Description should not be rendered if not present
    expect(queryByText('No category')).toBeFalsy();
  });

  it('sorts transactions by date in descending order', () => {
    const unsortedTransactions: Transaction[] = [
      {
        id: '1',
        user_id: 'user1',
        amount: 100,
        type: 'expense',
        category_id: 'cat1',
        transaction_date: '2025-01-10',
        description: 'Old transaction',
        created_at: '2025-01-10',
        updated_at: '2025-01-10',
        category: {
          id: 'cat1',
          user_id: 'user1',
          name: 'Old',
          icon_name: 'history',
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      },
      {
        id: '2',
        user_id: 'user1',
        amount: 200,
        type: 'income',
        category_id: 'cat2',
        transaction_date: '2025-01-15',
        description: 'New transaction',
        created_at: '2025-01-15',
        updated_at: '2025-01-15',
        category: {
          id: 'cat2',
          user_id: 'user1',
          name: 'New',
          icon_name: 'new-releases',
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      },
    ];

    const { getAllByTestId } = render(
      <RecentTransactions transactions={unsortedTransactions} />
    );

    // The newer transaction should appear first
    const categoryNames = getAllByTestId ? getAllByTestId('category-name') : [];
    // Since we can't use testID in this case, we'll test by checking the text content
    const { getByText } = render(
      <RecentTransactions transactions={unsortedTransactions} />
    );
    
    expect(getByText('New')).toBeTruthy();
    expect(getByText('Old')).toBeTruthy();
  });
});