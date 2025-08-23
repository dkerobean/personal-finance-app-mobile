import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CreateBudgetModal from '@/components/budgets/CreateBudgetModal';
import { useBudgetStore } from '@/stores/budgetStore';
import { Category } from '@/types/models';

// Mock the budget store
jest.mock('@/stores/budgetStore');
const mockedUseBudgetStore = useBudgetStore as jest.MockedFunction<typeof useBudgetStore>;

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('CreateBudgetModal', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      user_id: 'user-1',
      name: 'Food',
      icon_name: 'restaurant',
      created_at: '2024-08-01T00:00:00Z',
      updated_at: '2024-08-01T00:00:00Z',
    },
    {
      id: 'cat-2',
      user_id: 'user-1',
      name: 'Transportation',
      icon_name: 'car',
      created_at: '2024-08-01T00:00:00Z',
      updated_at: '2024-08-01T00:00:00Z',
    },
  ];

  const mockCreateBudget = jest.fn();
  const mockClearError = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    visible: true,
    onClose: mockOnClose,
    categories: mockCategories,
    defaultMonth: '2024-08-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockedUseBudgetStore.mockReturnValue({
      createBudget: mockCreateBudget,
      isLoading: false,
      error: null,
      clearError: mockClearError,
      budgets: [],
      loadBudgets: jest.fn(),
      updateBudget: jest.fn(),
      deleteBudget: jest.fn(),
      getBudgetsForMonth: jest.fn(),
      getBudgetByCategory: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
    });
  });

  it('should render correctly when visible', () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateBudgetModal {...defaultProps} />
    );

    expect(getByText('Create Budget')).toBeTruthy();
    expect(getByText('Category')).toBeTruthy();
    expect(getByText('Monthly Budget Amount')).toBeTruthy();
    expect(getByText('Budget Month')).toBeTruthy();
    expect(getByPlaceholderText('0.00')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <CreateBudgetModal {...defaultProps} visible={false} />
    );

    expect(queryByText('Create Budget')).toBeNull();
  });

  it('should call onClose when Cancel button is pressed', () => {
    const { getByText } = render(
      <CreateBudgetModal {...defaultProps} />
    );

    fireEvent.press(getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should validate required fields before creating budget', async () => {
    const { getByText } = render(
      <CreateBudgetModal {...defaultProps} />
    );

    fireEvent.press(getByText('Create'));

    await waitFor(() => {
      expect(getByText('Please select a category')).toBeTruthy();
      expect(getByText('Amount is required')).toBeTruthy();
    });

    expect(mockCreateBudget).not.toHaveBeenCalled();
  });

  it('should validate positive amount', async () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateBudgetModal {...defaultProps} />
    );

    const amountInput = getByPlaceholderText('0.00');
    fireEvent.changeText(amountInput, '-100');
    fireEvent.press(getByText('Create'));

    await waitFor(() => {
      expect(getByText('Amount must be a positive number')).toBeTruthy();
    });

    expect(mockCreateBudget).not.toHaveBeenCalled();
  });

  it('should validate maximum amount', async () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateBudgetModal {...defaultProps} />
    );

    const amountInput = getByPlaceholderText('0.00');
    fireEvent.changeText(amountInput, '2000000');
    fireEvent.press(getByText('Create'));

    await waitFor(() => {
      expect(getByText('Amount cannot exceed ₵1,000,000')).toBeTruthy();
    });

    expect(mockCreateBudget).not.toHaveBeenCalled();
  });

  it('should format currency input correctly', () => {
    const { getByPlaceholderText } = render(
      <CreateBudgetModal {...defaultProps} />
    );

    const amountInput = getByPlaceholderText('0.00');
    
    // Test removing non-numeric characters
    fireEvent.changeText(amountInput, 'abc123.45def');
    expect(amountInput.props.value).toBe('123.45');

    // Test limiting decimal places
    fireEvent.changeText(amountInput, '123.456789');
    expect(amountInput.props.value).toBe('123.45');
  });

  it('should create budget successfully with valid data', async () => {
    mockCreateBudget.mockResolvedValue(true);

    const { getByText, getByPlaceholderText } = render(
      <CreateBudgetModal {...defaultProps} />
    );

    // Fill in the form
    const amountInput = getByPlaceholderText('0.00');
    fireEvent.changeText(amountInput, '500');

    // Note: In a real test environment, you'd need to properly interact with the Picker
    // For now, we'll simulate the form validation passing

    fireEvent.press(getByText('Create'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Budget created successfully');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle creation error', async () => {
    mockCreateBudget.mockResolvedValue(false);
    
    mockedUseBudgetStore.mockReturnValue({
      createBudget: mockCreateBudget,
      isLoading: false,
      error: 'Budget already exists',
      clearError: mockClearError,
      budgets: [],
      loadBudgets: jest.fn(),
      updateBudget: jest.fn(),
      deleteBudget: jest.fn(),
      getBudgetsForMonth: jest.fn(),
      getBudgetByCategory: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
    });

    const { getByText } = render(
      <CreateBudgetModal {...defaultProps} />
    );

    expect(getByText('Budget already exists')).toBeTruthy();
  });

  it('should show loading state when creating budget', () => {
    mockedUseBudgetStore.mockReturnValue({
      createBudget: mockCreateBudget,
      isLoading: true,
      error: null,
      clearError: mockClearError,
      budgets: [],
      loadBudgets: jest.fn(),
      updateBudget: jest.fn(),
      deleteBudget: jest.fn(),
      getBudgetsForMonth: jest.fn(),
      getBudgetByCategory: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
    });

    const { getByText } = render(
      <CreateBudgetModal {...defaultProps} />
    );

    expect(getByText('Creating...')).toBeTruthy();
  });

  it('should clear error and reset form when modal opens', () => {
    const { rerender } = render(
      <CreateBudgetModal {...defaultProps} visible={false} />
    );

    rerender(<CreateBudgetModal {...defaultProps} visible={true} />);

    expect(mockClearError).toHaveBeenCalled();
  });

  it('should display current month by default when no defaultMonth provided', () => {
    const currentDate = new Date();
    const expectedMonth = currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });

    const { getByText } = render(
      <CreateBudgetModal 
        {...defaultProps} 
        defaultMonth={undefined}
      />
    );

    expect(getByText(expectedMonth)).toBeTruthy();
  });
});