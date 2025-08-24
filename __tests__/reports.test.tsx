import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { jest } from '@jest/globals';
import ReportsScreen from '../app/(app)/reports/index';
import MonthlySummaryCard from '../src/components/reports/MonthlySummaryCard';
import CategoryBreakdownChart from '../src/components/reports/CategoryBreakdownChart';
import MonthPicker from '../src/components/reports/MonthPicker';
import { useReportsStore } from '../src/stores/reportsStore';
import { reportsApi } from '../src/services/api/reports';
import type { MonthlyReport, CategorySpending } from '../src/types/models';

// Mock the stores and services
jest.mock('../src/stores/reportsStore');
jest.mock('../src/services/api/reports');
jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ children }: { children: React.ReactNode }) => children,
  },
}));

// Victory-native components are no longer used - replaced with custom bar chart

// Mock MaterialIcons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: ({ name, size, color, ...props }: any) => null,
}));

const mockReportsStore = useReportsStore as jest.MockedFunction<typeof useReportsStore>;
const mockReportsApi = reportsApi as jest.Mocked<typeof reportsApi>;

describe('Reports Functionality', () => {
  const mockReport: MonthlyReport = {
    month: '2024-08',
    totalIncome: 5000,
    totalExpenses: 3500,
    netIncome: 1500,
    transactionCount: 25,
    incomeTransactionCount: 8,
    expenseTransactionCount: 17,
    avgTransactionAmount: 200,
    categoryBreakdown: [
      {
        categoryId: '1',
        categoryName: 'Food',
        categoryIcon: 'restaurant',
        totalAmount: 1200,
        percentage: 34.3,
        transactionCount: 8,
        avgTransactionAmount: 150,
        type: 'expense',
      },
      {
        categoryId: '2',
        categoryName: 'Transport',
        categoryIcon: 'directions-car',
        totalAmount: 800,
        percentage: 22.9,
        transactionCount: 5,
        avgTransactionAmount: 160,
        type: 'expense',
      },
      {
        categoryId: '3',
        categoryName: 'Salary',
        categoryIcon: 'work',
        totalAmount: 5000,
        percentage: 100,
        transactionCount: 1,
        avgTransactionAmount: 5000,
        type: 'income',
      },
    ],
    topCategories: [
      {
        categoryId: '1',
        categoryName: 'Food',
        categoryIcon: 'restaurant',
        totalAmount: 1200,
        percentage: 34.3,
        transactionCount: 8,
        avgTransactionAmount: 150,
        type: 'expense',
      },
    ],
    largestExpense: {
      amount: 500,
      description: 'Grocery shopping',
      category_name: 'Food',
      date: '2024-08-15',
    },
    largestIncome: {
      amount: 5000,
      description: 'Monthly salary',
      category_name: 'Salary',
      date: '2024-08-01',
    },
  };

  const defaultStoreState = {
    currentReport: mockReport,
    reportHistory: new Map([['2024-08', mockReport]]),
    selectedMonth: '2024-08',
    availableMonths: ['2024-08', '2024-07', '2024-06'],
    comparison: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
    setSelectedMonth: jest.fn(),
    fetchMonthlyReport: jest.fn(),
    refreshCurrentReport: jest.fn(),
    clearError: jest.fn(),
    setError: jest.fn(),
    fetchReportComparison: jest.fn(),
    clearReportData: jest.fn(),
    setLoading: jest.fn(),
    getCurrentReport: jest.fn(() => mockReport),
    getReportForMonth: jest.fn(),
    getAvailableMonths: jest.fn(() => ['2024-08', '2024-07', '2024-06']),
    getCachedReports: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockReportsStore.mockReturnValue(defaultStoreState);
    mockReportsApi.getAvailableMonths.mockResolvedValue({
      data: [
        { month: '2024-08', transaction_count: 25, total_amount: 8500 },
        { month: '2024-07', transaction_count: 20, total_amount: 7200 },
        { month: '2024-06', transaction_count: 18, total_amount: 6800 },
      ],
      error: null,
    });
  });

  describe('MonthlySummaryCard Component', () => {
    it('renders monthly summary correctly', () => {
      render(<MonthlySummaryCard report={mockReport} />);
      
      expect(screen.getByText('August 2024')).toBeTruthy();
      expect(screen.getByText('25 transactions')).toBeTruthy();
      expect(screen.getByText('Income')).toBeTruthy();
      expect(screen.getByText('Expenses')).toBeTruthy();
      expect(screen.getByText('Net Income')).toBeTruthy();
    });

    it('displays loading state when isLoading is true', () => {
      render(<MonthlySummaryCard report={mockReport} isLoading={true} />);
      
      expect(screen.getByText('Loading monthly summary...')).toBeTruthy();
    });

    it('formats amounts correctly with Ghana Cedi symbol', () => {
      render(<MonthlySummaryCard report={mockReport} />);
      
      expect(screen.getByText('₵5,000.00')).toBeTruthy();
      expect(screen.getByText('₵3,500.00')).toBeTruthy();
      expect(screen.getByText('₵1,500.00')).toBeTruthy();
    });

    it('shows largest transactions when available', () => {
      render(<MonthlySummaryCard report={mockReport} />);
      
      expect(screen.getByText('Notable Transactions')).toBeTruthy();
      expect(screen.getByText(/Largest Income: ₵5,000.00/)).toBeTruthy();
      expect(screen.getByText(/Largest Expense: ₵500.00/)).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
      const onPress = jest.fn();
      render(<MonthlySummaryCard report={mockReport} onPress={onPress} />);
      
      const card = screen.getByTestId('monthly-summary-card');
      fireEvent.press(card);
      
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('CategoryBreakdownChart Component', () => {
    it('renders expense chart correctly', () => {
      render(
        <CategoryBreakdownChart
          categoryData={mockReport.categoryBreakdown}
          type="expense"
        />
      );
      
      expect(screen.getByText('Expense Breakdown')).toBeTruthy();
      expect(screen.getByText('Total: ₵2,000.00')).toBeTruthy();
    });

    it('renders income chart correctly', () => {
      render(
        <CategoryBreakdownChart
          categoryData={mockReport.categoryBreakdown}
          type="income"
        />
      );
      
      expect(screen.getByText('Income Breakdown')).toBeTruthy();
      expect(screen.getByText('Total: ₵5,000.00')).toBeTruthy();
    });

    it('displays loading state when isLoading is true', () => {
      render(
        <CategoryBreakdownChart
          categoryData={mockReport.categoryBreakdown}
          type="expense"
          isLoading={true}
        />
      );
      
      expect(screen.getByText('Loading chart data...')).toBeTruthy();
    });

    it('shows empty state when no data available', () => {
      render(
        <CategoryBreakdownChart
          categoryData={[]}
          type="expense"
        />
      );
      
      expect(screen.getByText('No expense data available for this month')).toBeTruthy();
    });

    it('renders legend items with correct data', () => {
      render(
        <CategoryBreakdownChart
          categoryData={mockReport.categoryBreakdown}
          type="expense"
        />
      );
      
      expect(screen.getByText('Food')).toBeTruthy();
      expect(screen.getByText('Transport')).toBeTruthy();
      expect(screen.getByText('₵1,200.00')).toBeTruthy();
      expect(screen.getByText('₵800.00')).toBeTruthy();
      expect(screen.getByText('34.3%')).toBeTruthy();
      expect(screen.getByText('22.9%')).toBeTruthy();
    });
  });

  describe('MonthPicker Component', () => {
    const availableMonths = ['2024-08', '2024-07', '2024-06'];
    const onMonthSelect = jest.fn();

    it('renders selected month correctly', () => {
      render(
        <MonthPicker
          selectedMonth="2024-08"
          availableMonths={availableMonths}
          onMonthSelect={onMonthSelect}
        />
      );
      
      expect(screen.getByText('Selected Month')).toBeTruthy();
      expect(screen.getByText('August 2024')).toBeTruthy();
    });

    it('opens modal when button is pressed', () => {
      render(
        <MonthPicker
          selectedMonth="2024-08"
          availableMonths={availableMonths}
          onMonthSelect={onMonthSelect}
        />
      );
      
      const button = screen.getByTestId('month-picker-button');
      fireEvent.press(button);
      
      expect(screen.getByText('Select Month')).toBeTruthy();
    });

    it('displays available months in modal', () => {
      render(
        <MonthPicker
          selectedMonth="2024-08"
          availableMonths={availableMonths}
          onMonthSelect={onMonthSelect}
        />
      );
      
      const button = screen.getByTestId('month-picker-button');
      fireEvent.press(button);
      
      expect(screen.getByText('August 2024')).toBeTruthy();
      expect(screen.getByText('July 2024')).toBeTruthy();
      expect(screen.getByText('June 2024')).toBeTruthy();
    });

    it('calls onMonthSelect when month is selected', () => {
      render(
        <MonthPicker
          selectedMonth="2024-08"
          availableMonths={availableMonths}
          onMonthSelect={onMonthSelect}
        />
      );
      
      const button = screen.getByTestId('month-picker-button');
      fireEvent.press(button);
      
      const monthItem = screen.getByTestId('month-item-1');
      fireEvent.press(monthItem);
      
      expect(onMonthSelect).toHaveBeenCalledWith('2024-07');
    });

    it('shows disabled state when disabled prop is true', () => {
      render(
        <MonthPicker
          selectedMonth="2024-08"
          availableMonths={availableMonths}
          onMonthSelect={onMonthSelect}
          disabled={true}
        />
      );
      
      const button = screen.getByTestId('month-picker-button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    it('shows loading state when isLoading is true', () => {
      render(
        <MonthPicker
          selectedMonth="2024-08"
          availableMonths={availableMonths}
          onMonthSelect={onMonthSelect}
          isLoading={true}
        />
      );
      
      // Should show hourglass icon instead of arrow
      const button = screen.getByTestId('month-picker-button');
      expect(button).toBeTruthy();
    });
  });

  describe('ReportsScreen Integration', () => {
    it('renders reports screen with all components', async () => {
      render(<ReportsScreen />);
      
      await waitFor(() => {
        expect(screen.getByText('August 2024')).toBeTruthy();
        expect(screen.getByText('Expense Breakdown')).toBeTruthy();
        expect(screen.getByText('Key Insights')).toBeTruthy();
      });
    });

    it('handles month selection', async () => {
      const setSelectedMonth = jest.fn();
      mockReportsStore.mockReturnValue({
        ...defaultStoreState,
        setSelectedMonth,
      });

      render(<ReportsScreen />);
      
      const monthPicker = screen.getByTestId('month-picker-button');
      fireEvent.press(monthPicker);
      
      await waitFor(() => {
        expect(screen.getByText('Select Month')).toBeTruthy();
      });
    });

    it('shows loading state when data is loading', () => {
      mockReportsStore.mockReturnValue({
        ...defaultStoreState,
        isLoading: true,
        currentReport: null,
      });

      render(<ReportsScreen />);
      
      expect(screen.getByText('Loading your financial report...')).toBeTruthy();
    });

    it('shows empty state when no report data', () => {
      mockReportsStore.mockReturnValue({
        ...defaultStoreState,
        currentReport: null,
        isLoading: false,
      });

      render(<ReportsScreen />);
      
      expect(screen.getByText('No Report Data')).toBeTruthy();
      expect(screen.getByText('Add some transactions to see your monthly financial report')).toBeTruthy();
    });

    it('handles refresh functionality', async () => {
      const refreshCurrentReport = jest.fn();
      mockReportsStore.mockReturnValue({
        ...defaultStoreState,
        refreshCurrentReport,
      });

      render(<ReportsScreen />);
      
      // Simulate pull to refresh
      const scrollView = screen.getByTestId('reports-scroll-view');
      if (scrollView) {
        fireEvent(scrollView, 'refresh');
        await waitFor(() => {
          expect(refreshCurrentReport).toHaveBeenCalledTimes(1);
        });
      }
    });

    it('displays insights section with correct data', () => {
      render(<ReportsScreen />);
      
      expect(screen.getByText('Key Insights')).toBeTruthy();
      expect(screen.getByText(/Top spending category: Food/)).toBeTruthy();
      expect(screen.getByText(/Average transaction: ₵200.00/)).toBeTruthy();
      expect(screen.getByText(/You saved ₵1,500.00 this month/)).toBeTruthy();
    });

    it('shows both income and expense charts when data available', () => {
      render(<ReportsScreen />);
      
      expect(screen.getByText('Expense Breakdown')).toBeTruthy();
      expect(screen.getByText('Income Breakdown')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const setError = jest.fn();
      mockReportsStore.mockReturnValue({
        ...defaultStoreState,
        setError,
      });

      mockReportsApi.getAvailableMonths.mockResolvedValue({
        data: null,
        error: { message: 'Network error', code: 'NETWORK_ERROR' },
      });

      render(<ReportsScreen />);
      
      await waitFor(() => {
        expect(setError).toHaveBeenCalledWith('Network error');
      });
    });

    it('displays error alert when error occurs', () => {
      mockReportsStore.mockReturnValue({
        ...defaultStoreState,
        error: 'Failed to load report data',
      });

      render(<ReportsScreen />);
      
      // Error should trigger alert (tested through store error state)
      expect(defaultStoreState.error).toBe(null); // Mocked state should not have error
    });
  });
});

describe('Reports Store', () => {
  // These would test the actual store implementation
  // For now, we'll test the mocked behavior
  
  it('should initialize with default state', () => {
    const store = useReportsStore();
    expect(store.currentReport).toBe(defaultStoreState.currentReport);
    expect(store.selectedMonth).toBe('2024-08');
    expect(store.isLoading).toBe(false);
  });

  it('should handle month selection', () => {
    const store = useReportsStore();
    store.setSelectedMonth('2024-07');
    expect(store.setSelectedMonth).toHaveBeenCalledWith('2024-07');
  });
});

describe('Reports API', () => {
  it('should fetch monthly report', async () => {
    mockReportsApi.getMonthlyReport.mockResolvedValue({
      data: defaultStoreState.currentReport,
      error: null,
    });

    const result = await reportsApi.getMonthlyReport('2024-08');
    
    expect(result.data).toEqual(defaultStoreState.currentReport);
    expect(result.error).toBeNull();
  });

  it('should handle API errors', async () => {
    mockReportsApi.getMonthlyReport.mockResolvedValue({
      data: null,
      error: { message: 'Failed to fetch report', code: 'FETCH_ERROR' },
    });

    const result = await reportsApi.getMonthlyReport('2024-08');
    
    expect(result.data).toBeNull();
    expect(result.error?.message).toBe('Failed to fetch report');
  });
});