import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LiabilityItem } from '@/components/networth/liabilities';
import type { Liability } from '@/types/models';

// Mock the design constants
jest.mock('@/constants/design', () => ({
  COLORS: {
    white: '#FFFFFF',
    error: '#DC2626',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    backgroundInput: '#F3F4F6',
  },
  TYPOGRAPHY: {
    sizes: {
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  SPACING: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
  },
}));

// Mock MaterialIcons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

describe('LiabilityItem', () => {
  const mockLiability: Liability = {
    id: '1',
    user_id: 'test-user',
    name: 'Credit Card Debt',
    category: 'credit_cards',
    liability_type: 'credit_card',
    current_balance: 5000,
    original_balance: 8000,
    interest_rate: 18.5,
    monthly_payment: 200,
    due_date: '2024-01-15',
    description: 'Main credit card for daily expenses',
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockOnPress = jest.fn();
  const mockOnDeletePress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders liability information correctly', () => {
    const { getByText } = render(
      <LiabilityItem
        liability={mockLiability}
        onPress={mockOnPress}
        onDeletePress={mockOnDeletePress}
      />
    );

    expect(getByText('Credit Card Debt')).toBeTruthy();
    expect(getByText('$5,000.00')).toBeTruthy();
    expect(getByText('Credit Card')).toBeTruthy();
  });

  it('displays interest rate when available', () => {
    const { getByText } = render(
      <LiabilityItem
        liability={mockLiability}
        onPress={mockOnPress}
        onDeletePress={mockOnDeletePress}
      />
    );

    expect(getByText('18.5% APR')).toBeTruthy();
  });

  it('displays monthly payment when available', () => {
    const { getByText } = render(
      <LiabilityItem
        liability={mockLiability}
        onPress={mockOnPress}
        onDeletePress={mockOnDeletePress}
      />
    );

    expect(getByText('$200.00/mo')).toBeTruthy();
  });

  it('displays due date when available', () => {
    const { getByText } = render(
      <LiabilityItem
        liability={mockLiability}
        onPress={mockOnPress}
        onDeletePress={mockOnDeletePress}
      />
    );

    expect(getByText('Jan 15, 2024')).toBeTruthy();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalLiability: Liability = {
      ...mockLiability,
      interest_rate: undefined,
      monthly_payment: undefined,
      due_date: undefined,
      description: undefined,
    };

    const { queryByText } = render(
      <LiabilityItem
        liability={minimalLiability}
        onPress={mockOnPress}
        onDeletePress={mockOnDeletePress}
      />
    );

    expect(queryByText(/APR/)).toBeNull();
    expect(queryByText(/month/)).toBeNull();
    expect(queryByText(/Due:/)).toBeNull();
  });

  it('calls onPress when container is pressed', () => {
    const { getByText } = render(
      <LiabilityItem
        liability={mockLiability}
        onPress={mockOnPress}
        onDeletePress={mockOnDeletePress}
      />
    );

    fireEvent.press(getByText('Credit Card Debt'));
    expect(mockOnPress).toHaveBeenCalledWith(mockLiability.id);
  });

  it('renders description when available', () => {
    const { getByText } = render(
      <LiabilityItem
        liability={mockLiability}
        onPress={mockOnPress}
        onDeletePress={mockOnDeletePress}
      />
    );

    expect(getByText('Main credit card for daily expenses')).toBeTruthy();
  });
});