import React from 'react';
import { render, fireEvent, waitFor } from '../utils';
import DashboardScreen from '../../app/(app)/index';
import { useTransactionStore, useDashboardData } from '../../src/stores/transactionStore';
import { useAuthStore } from '../../src/stores/authStore';
import { authService } from '../../src/services/authService';
import type { Transaction, User } from '../../src/types/models';

// Mock the router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: mockPush,
    replace: mockReplace,
  },
}));

// Mock the auth service
jest.mock('../../src/services/authService', () => ({
  authService: {
    signOut: jest.fn(),
  },
}));

// Mock the stores
jest.mock('../../src/stores/authStore');
jest.mock('../../src/stores/transactionStore');

const mockUser: User = {
  id: 'user1',
  email: 'test@example.com',
  emailConfirmed: true,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
};

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
];

describe('DashboardScreen', () => {
  const mockLoadTransactions = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    mockLoadTransactions.mockClear();
    mockLogout.mockClear();
    (authService.signOut as jest.Mock).mockClear();

    // Mock useAuthStore
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    });

    // Mock useTransactionStore
    (useTransactionStore as unknown as jest.Mock).mockReturnValue({
      loadTransactions: mockLoadTransactions,
    });

    // Mock useDashboardData
    (useDashboardData as unknown as jest.Mock).mockReturnValue({
      transactions: mockTransactions,
      isLoading: false,
      error: null,
      recentTransactions: mockTransactions.slice(0, 5),
    });
  });

  it('renders dashboard correctly', () => {
    const { getByText } = render(<DashboardScreen />);

    expect(getByText('Dashboard')).toBeTruthy();
    expect(getByText('Welcome back, test!')).toBeTruthy();
    expect(getByText('Total Balance')).toBeTruthy();
    expect(getByText('Recent Transactions')).toBeTruthy();
  });

  it('loads transactions on mount', () => {
    render(<DashboardScreen />);
    expect(mockLoadTransactions).toHaveBeenCalledTimes(1);
  });

  it('displays loading state', () => {
    (useDashboardData as unknown as jest.Mock).mockReturnValue({
      transactions: [],
      isLoading: true,
      error: null,
      recentTransactions: [],
    });

    const { getByText } = render(<DashboardScreen />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('displays error state', () => {
    const errorMessage = 'Failed to load transactions';
    (useDashboardData as unknown as jest.Mock).mockReturnValue({
      transactions: [],
      isLoading: false,
      error: errorMessage,
      recentTransactions: [],
    });

    const { getByText } = render(<DashboardScreen />);
    expect(getByText(errorMessage)).toBeTruthy();
  });

  it('handles sign out successfully', async () => {
    (authService.signOut as jest.Mock).mockResolvedValue({ success: true });

    const { getByTestId } = render(<DashboardScreen />);
    
    // Find the profile button and press it
    const profileButton = getByTestId('profile-button') || 
                         document.querySelector('[data-testid="profile-button"]');
    
    if (profileButton) {
      fireEvent.press(profileButton);
    }

    await waitFor(() => {
      expect(authService.signOut).toHaveBeenCalled();
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    });
  });

  it('handles sign out failure', async () => {
    (authService.signOut as jest.Mock).mockResolvedValue({ success: false });

    const { getByTestId } = render(<DashboardScreen />);
    
    const profileButton = getByTestId('profile-button') || 
                         document.querySelector('[data-testid="profile-button"]');
    
    if (profileButton) {
      fireEvent.press(profileButton);
    }

    await waitFor(() => {
      expect(authService.signOut).toHaveBeenCalled();
      expect(mockLogout).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it('navigates to create transaction when Add Transaction is pressed', () => {
    const { getByText } = render(<DashboardScreen />);

    const addButton = getByText('Add Transaction');
    fireEvent.press(addButton);

    expect(mockPush).toHaveBeenCalledWith('/transactions/create');
  });

  it('navigates to create transaction when FAB is pressed', () => {
    const { getByTestId } = render(<DashboardScreen />);

    const fab = getByTestId('fab') || 
               document.querySelector('[data-testid="fab"]');
    
    if (fab) {
      fireEvent.press(fab);
      expect(mockPush).toHaveBeenCalledWith('/transactions/create');
    }
  });

  it('navigates to transactions list when View All is pressed', () => {
    const { getByText } = render(<DashboardScreen />);

    const viewAllButton = getByText('View All');
    fireEvent.press(viewAllButton);

    expect(mockPush).toHaveBeenCalledWith('/transactions');
  });

  it('handles refresh correctly', async () => {
    const { getByTestId } = render(<DashboardScreen />);

    // Simulate pull to refresh
    const scrollView = getByTestId('scroll-view') || 
                      document.querySelector('[data-testid="scroll-view"]');
    
    if (scrollView) {
      fireEvent(scrollView, 'refresh');
      expect(mockLoadTransactions).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
    }
  });

  it('displays user email correctly in welcome message', () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText('Welcome back, test!')).toBeTruthy();
  });

  it('handles user without email gracefully', () => {
    const userWithoutEmail: User = {
      ...mockUser,
      email: '' as any,
    };

    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: userWithoutEmail,
      logout: mockLogout,
    });

    const { getByText } = render(<DashboardScreen />);
    expect(getByText('Welcome back, User!')).toBeTruthy();
  });

  it('displays transactions data correctly', () => {
    const { getByText } = render(<DashboardScreen />);

    // Should display transaction categories
    expect(getByText('Salary')).toBeTruthy();
    expect(getByText('Food')).toBeTruthy();
  });

  it('shows quick actions buttons', () => {
    const { getByText } = render(<DashboardScreen />);

    expect(getByText('Add Transaction')).toBeTruthy();
    expect(getByText('View All')).toBeTruthy();
  });

  it('renders with empty transactions gracefully', () => {
    (useDashboardData as unknown as jest.Mock).mockReturnValue({
      transactions: [],
      isLoading: false,
      error: null,
      recentTransactions: [],
    });

    const { getByText } = render(<DashboardScreen />);

    expect(getByText('Dashboard')).toBeTruthy();
    expect(getByText('Total Balance')).toBeTruthy();
    expect(getByText('GH₵0.00')).toBeTruthy();
  });
});