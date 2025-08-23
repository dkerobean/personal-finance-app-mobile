import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BudgetProgressCard from '@/components/budgets/BudgetProgressCard';
import type { BudgetWithSpending } from '@/types/models';

// Mock MaterialIcons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

const mockBudgetOnTrack: BudgetWithSpending = {
  id: '1',
  user_id: 'user1',
  category_id: 'cat1',
  amount: 1000,
  month: '2024-01-01',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  category_name: 'Food',
  category_icon_name: 'restaurant',
  spent: 500,
  percentage: 50,
  remaining: 500,
  status: 'on_track',
  transaction_count: 5,
};

const mockBudgetWarning: BudgetWithSpending = {
  ...mockBudgetOnTrack,
  id: '2',
  spent: 850,
  percentage: 85,
  remaining: 150,
  status: 'warning',
};

const mockBudgetOverBudget: BudgetWithSpending = {
  ...mockBudgetOnTrack,
  id: '3',
  spent: 1200,
  percentage: 120,
  remaining: -200,
  status: 'over_budget',
};

describe('BudgetProgressCard', () => {
  const defaultProps = {
    budget: mockBudgetOnTrack,
    onPress: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders budget information correctly', () => {
    const { getByText } = render(<BudgetProgressCard {...defaultProps} />);
    
    expect(getByText('Food')).toBeTruthy();
    expect(getByText('5 transactions')).toBeTruthy();
    expect(getByText('₵500.00')).toBeTruthy();
    expect(getByText('of ₵1000.00')).toBeTruthy();
    expect(getByText('Remaining: ₵500.00')).toBeTruthy();
    expect(getByText('50.0%')).toBeTruthy();
  });

  it('handles singular transaction count correctly', () => {
    const budgetWithOneTransaction = {
      ...mockBudgetOnTrack,
      transaction_count: 1,
    };
    
    const { getByText } = render(
      <BudgetProgressCard 
        {...defaultProps} 
        budget={budgetWithOneTransaction} 
      />
    );
    
    expect(getByText('1 transaction')).toBeTruthy();
  });

  it('displays warning status correctly', () => {
    const { getByText } = render(
      <BudgetProgressCard 
        {...defaultProps} 
        budget={mockBudgetWarning} 
      />
    );
    
    expect(getByText('₵850.00')).toBeTruthy();
    expect(getByText('85.0%')).toBeTruthy();
    expect(getByText('Remaining: ₵150.00')).toBeTruthy();
  });

  it('displays over budget status correctly', () => {
    const { getByText } = render(
      <BudgetProgressCard 
        {...defaultProps} 
        budget={mockBudgetOverBudget} 
      />
    );
    
    expect(getByText('₵1200.00')).toBeTruthy();
    expect(getByText('120.0%')).toBeTruthy();
    expect(getByText('Over by: ₵200.00')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByTestId } = render(
      <BudgetProgressCard {...defaultProps} />
    );
    
    // Since we can't easily test TouchableOpacity by test ID in this setup,
    // we'll test by finding the pressable area and checking the callback
    const card = getByTestId('budget-progress-card');
    fireEvent.press(card);
    
    expect(defaultProps.onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit when edit button is pressed', () => {
    const { getAllByTestId } = render(
      <BudgetProgressCard {...defaultProps} />
    );
    
    const editButton = getAllByTestId('edit-button')[0];
    fireEvent.press(editButton);
    
    expect(defaultProps.onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is pressed', () => {
    const { getAllByTestId } = render(
      <BudgetProgressCard {...defaultProps} />
    );
    
    const deleteButton = getAllByTestId('delete-button')[0];
    fireEvent.press(deleteButton);
    
    expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
  });

  it('calculates days remaining correctly for current month', () => {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
    
    const currentMonthBudget = {
      ...mockBudgetOnTrack,
      month: currentMonth,
    };
    
    const { getByText } = render(
      <BudgetProgressCard 
        {...defaultProps} 
        budget={currentMonthBudget} 
      />
    );
    
    // Should show days remaining (exact number depends on current date)
    expect(getByText(/\d+ days? remaining/)).toBeTruthy();
  });

  it('shows month ended for past months', () => {
    const pastMonthBudget = {
      ...mockBudgetOnTrack,
      month: '2023-01-01', // Past month
    };
    
    const { getByText } = render(
      <BudgetProgressCard 
        {...defaultProps} 
        budget={pastMonthBudget} 
      />
    );
    
    expect(getByText('Month ended')).toBeTruthy();
  });

  it('limits progress bar width to 100% even when over budget', () => {
    const { getByTestId } = render(
      <BudgetProgressCard 
        {...defaultProps} 
        budget={mockBudgetOverBudget} 
      />
    );
    
    const progressBar = getByTestId('progress-bar');
    const style = progressBar.props.style;
    
    // Progress bar width should be capped at 100%
    expect(style.width).toBe('100%');
  });

  it('handles missing category icon gracefully', () => {
    const budgetWithoutIcon = {
      ...mockBudgetOnTrack,
      category_icon_name: undefined,
    };
    
    const { getByText } = render(
      <BudgetProgressCard 
        {...defaultProps} 
        budget={budgetWithoutIcon} 
      />
    );
    
    // Should still render the category name
    expect(getByText('Food')).toBeTruthy();
  });

  it('handles zero transaction count', () => {
    const budgetWithNoTransactions = {
      ...mockBudgetOnTrack,
      transaction_count: 0,
      spent: 0,
      percentage: 0,
      remaining: 1000,
    };
    
    const { getByText } = render(
      <BudgetProgressCard 
        {...defaultProps} 
        budget={budgetWithNoTransactions} 
      />
    );
    
    expect(getByText('0 transactions')).toBeTruthy();
    expect(getByText('₵0.00')).toBeTruthy();
    expect(getByText('0.0%')).toBeTruthy();
  });

  it('rounds decimal amounts correctly', () => {
    const budgetWithDecimals = {
      ...mockBudgetOnTrack,
      spent: 123.456,
      remaining: 876.544,
      percentage: 12.3456,
    };
    
    const { getByText } = render(
      <BudgetProgressCard 
        {...defaultProps} 
        budget={budgetWithDecimals} 
      />
    );
    
    expect(getByText('₵123.46')).toBeTruthy(); // Rounded to 2 decimal places
    expect(getByText('Remaining: ₵876.54')).toBeTruthy();
    expect(getByText('12.3%')).toBeTruthy(); // Rounded to 1 decimal place
  });
});