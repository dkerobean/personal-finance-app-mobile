import React from 'react';
import { render } from '../utils';
import TotalBalanceCard from '../../src/components/dashboard/TotalBalanceCard';
import type { Transaction } from '../../src/types/models';

describe('TotalBalanceCard', () => {
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      user_id: 'user1',
      amount: 1000,
      type: 'income',
      category_id: 'cat1',
      transaction_date: '2025-01-01',
      description: 'Salary',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
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
      transaction_date: '2025-01-02',
      description: 'Groceries',
      created_at: '2025-01-02',
      updated_at: '2025-01-02',
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
      transaction_date: '2025-01-03',
      description: 'Gas',
      created_at: '2025-01-03',
      updated_at: '2025-01-03',
      category: {
        id: 'cat3',
        user_id: 'user1',
        name: 'Transport',
        icon_name: 'car',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
    },
  ];

  it('renders loading state correctly', () => {
    const { getByText } = render(
      <TotalBalanceCard transactions={[]} isLoading={true} />
    );

    expect(getByText('Total Balance')).toBeTruthy();
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('calculates and displays positive balance correctly', () => {
    const { getByText } = render(
      <TotalBalanceCard transactions={mockTransactions} />
    );

    expect(getByText('Total Balance')).toBeTruthy();
    // Balance should be 1000 - 300 - 150 = 550
    expect(getByText('GH₵550.00')).toBeTruthy();
  });

  it('displays income and expense summaries', () => {
    const { getByText } = render(
      <TotalBalanceCard transactions={mockTransactions} />
    );

    expect(getByText('Income')).toBeTruthy();
    expect(getByText('Expenses')).toBeTruthy();
    expect(getByText('GH₵1,000.00')).toBeTruthy(); // Total income
    expect(getByText('GH₵450.00')).toBeTruthy(); // Total expenses
  });

  it('handles negative balance correctly', () => {
    const negativeBalanceTransactions: Transaction[] = [
      {
        id: '1',
        user_id: 'user1',
        amount: 100,
        type: 'income',
        category_id: 'cat1',
        transaction_date: '2025-01-01',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
      {
        id: '2',
        user_id: 'user1',
        amount: 200,
        type: 'expense',
        category_id: 'cat2',
        transaction_date: '2025-01-02',
        created_at: '2025-01-02',
        updated_at: '2025-01-02',
      },
    ];

    const { getByText } = render(
      <TotalBalanceCard transactions={negativeBalanceTransactions} />
    );

    // Balance should be 100 - 200 = -100
    expect(getByText('-GH₵100.00')).toBeTruthy();
  });

  it('handles empty transactions array', () => {
    const { getByText } = render(
      <TotalBalanceCard transactions={[]} />
    );

    expect(getByText('Total Balance')).toBeTruthy();
    expect(getByText('GH₵0.00')).toBeTruthy();
  });

  it('calculates balance correctly with only income transactions', () => {
    const incomeOnlyTransactions: Transaction[] = [
      {
        id: '1',
        user_id: 'user1',
        amount: 500,
        type: 'income',
        category_id: 'cat1',
        transaction_date: '2025-01-01',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
      {
        id: '2',
        user_id: 'user1',
        amount: 300,
        type: 'income',
        category_id: 'cat1',
        transaction_date: '2025-01-02',
        created_at: '2025-01-02',
        updated_at: '2025-01-02',
      },
    ];

    const { getByText } = render(
      <TotalBalanceCard transactions={incomeOnlyTransactions} />
    );

    expect(getByText('GH₵800.00')).toBeTruthy();
  });

  it('calculates balance correctly with only expense transactions', () => {
    const expenseOnlyTransactions: Transaction[] = [
      {
        id: '1',
        user_id: 'user1',
        amount: 200,
        type: 'expense',
        category_id: 'cat1',
        transaction_date: '2025-01-01',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
      {
        id: '2',
        user_id: 'user1',
        amount: 150,
        type: 'expense',
        category_id: 'cat1',
        transaction_date: '2025-01-02',
        created_at: '2025-01-02',
        updated_at: '2025-01-02',
      },
    ];

    const { getByText } = render(
      <TotalBalanceCard transactions={expenseOnlyTransactions} />
    );

    expect(getByText('-GH₵350.00')).toBeTruthy();
  });
});