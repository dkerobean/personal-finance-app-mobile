import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { render } from './utils';
import CategoriesScreen from '../app/(app)/settings/categories/index';
import { useCategoryStore } from '@/stores/categoryStore';

jest.mock('@/stores/categoryStore');

const mockUseCategoryStore = useCategoryStore as jest.MockedFunction<typeof useCategoryStore>;

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
}));

describe('CategoriesScreen', () => {
  const mockStoreValues = {
    categories: [],
    isLoading: false,
    error: null,
    loadCategories: jest.fn(),
    deleteCategory: jest.fn(),
    clearError: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    seedDefaults: jest.fn(),
    setLoading: jest.fn(),
    setError: jest.fn(),
    initialized: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCategoryStore.mockReturnValue(mockStoreValues);
  });

  it('renders loading state correctly', () => {
    mockUseCategoryStore.mockReturnValue({
      ...mockStoreValues,
      isLoading: true,
    });

    const { getByText } = render(<CategoriesScreen />);

    expect(getByText('Loading categories...')).toBeTruthy();
  });

  it('renders empty state when no categories', () => {
    const { getByText } = render(<CategoriesScreen />);

    expect(getByText(/No categories found/)).toBeTruthy();
    expect(getByText(/Create your first category/)).toBeTruthy();
  });

  it('renders categories list', () => {
    const mockCategories = [
      {
        id: '1',
        name: 'Food',
        icon_name: 'restaurant',
        user_id: 'user1',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
      {
        id: '2',
        name: 'Transport',
        icon_name: 'car',
        user_id: 'user1',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
    ];

    mockUseCategoryStore.mockReturnValue({
      ...mockStoreValues,
      categories: mockCategories,
    });

    const { getByText } = render(<CategoriesScreen />);

    expect(getByText('Food')).toBeTruthy();
    expect(getByText('Transport')).toBeTruthy();
  });

  it('calls loadCategories on mount', () => {
    const mockLoadCategories = jest.fn();
    mockUseCategoryStore.mockReturnValue({
      ...mockStoreValues,
      loadCategories: mockLoadCategories,
    });

    render(<CategoriesScreen />);

    expect(mockLoadCategories).toHaveBeenCalled();
  });

  it('displays error message when there is an error', () => {
    mockUseCategoryStore.mockReturnValue({
      ...mockStoreValues,
      error: 'Failed to load categories',
    });

    const { getByText } = render(<CategoriesScreen />);

    expect(getByText('Failed to load categories')).toBeTruthy();
  });

  it('clears error when close button is pressed', () => {
    const mockClearError = jest.fn();
    mockUseCategoryStore.mockReturnValue({
      ...mockStoreValues,
      error: 'Failed to load categories',
      clearError: mockClearError,
    });

    const { getByLabelText } = render(<CategoriesScreen />);
    
    // Note: This might need adjustment based on actual accessibility label
    const closeButton = getByLabelText('Close');
    fireEvent.press(closeButton);

    expect(mockClearError).toHaveBeenCalled();
  });

  it('navigates to create screen when FAB is pressed', () => {
    const { getByLabelText } = render(<CategoriesScreen />);
    
    // Note: This might need adjustment based on actual accessibility label
    const fabButton = getByLabelText('Add Category');
    fireEvent.press(fabButton);

    expect(mockPush).toHaveBeenCalledWith('/settings/categories/create');
  });

  it('navigates to edit screen when edit button is pressed', () => {
    const mockCategories = [
      {
        id: '1',
        name: 'Food',
        icon_name: 'restaurant',
        user_id: 'user1',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
    ];

    mockUseCategoryStore.mockReturnValue({
      ...mockStoreValues,
      categories: mockCategories,
    });

    const { getByLabelText } = render(<CategoriesScreen />);
    
    // Note: This might need adjustment based on actual accessibility label
    const editButton = getByLabelText('Edit Food');
    fireEvent.press(editButton);

    expect(mockPush).toHaveBeenCalledWith('/settings/categories/edit/1');
  });

  it('shows delete confirmation dialog', () => {
    const mockCategories = [
      {
        id: '1',
        name: 'Food',
        icon_name: 'restaurant',
        user_id: 'user1',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
    ];

    mockUseCategoryStore.mockReturnValue({
      ...mockStoreValues,
      categories: mockCategories,
    });

    const { getByLabelText, getByText } = render(<CategoriesScreen />);
    
    // Note: This might need adjustment based on actual accessibility label
    const deleteButton = getByLabelText('Delete Food');
    fireEvent.press(deleteButton);

    expect(getByText('Delete Category')).toBeTruthy();
    expect(getByText(/Are you sure you want to delete "Food"/)).toBeTruthy();
  });

  it('calls deleteCategory when delete is confirmed', async () => {
    const mockDeleteCategory = jest.fn().mockResolvedValue(true);
    const mockCategories = [
      {
        id: '1',
        name: 'Food',
        icon_name: 'restaurant',
        user_id: 'user1',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
    ];

    mockUseCategoryStore.mockReturnValue({
      ...mockStoreValues,
      categories: mockCategories,
      deleteCategory: mockDeleteCategory,
    });

    const { getByLabelText, getByText } = render(<CategoriesScreen />);
    
    // Open delete dialog
    const deleteButton = getByLabelText('Delete Food');
    fireEvent.press(deleteButton);

    // Confirm deletion
    const confirmButton = getByText('Delete');
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(mockDeleteCategory).toHaveBeenCalledWith('1');
    });
  });
});