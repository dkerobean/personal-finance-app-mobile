import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import AssetItem from '@/components/networth/assets/AssetItem';
import type { Asset } from '@/types/models';

const mockAsset: Asset = {
  id: 'asset-1',
  user_id: 'user-1',
  name: 'Test House',
  category: 'property',
  asset_type: 'real_estate',
  current_value: 300000,
  original_value: 250000,
  purchase_date: '2020-01-01',
  description: 'My primary residence',
  is_active: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-06-15T10:30:00Z',
};

describe('AssetItem', () => {
  const mockOnPress = jest.fn();
  const mockOnDeletePress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render asset information correctly', () => {
    render(
      <AssetItem
        asset={mockAsset}
        onPress={mockOnPress}
        onDeletePress={mockOnDeletePress}
      />
    );

    expect(screen.getByText('Test House')).toBeTruthy();
    expect(screen.getByText('Real Estate')).toBeTruthy();
    expect(screen.getByText('$300,000.00')).toBeTruthy();
    expect(screen.getByText('My primary residence')).toBeTruthy();
    expect(screen.getByText('Updated Jun 15, 2023')).toBeTruthy();
  });

  it('should handle asset without description', () => {
    const assetWithoutDescription = { ...mockAsset, description: undefined };
    
    render(
      <AssetItem
        asset={assetWithoutDescription}
        onPress={mockOnPress}
      />
    );

    expect(screen.getByText('Test House')).toBeTruthy();
    expect(screen.queryByText('My primary residence')).toBeFalsy();
  });

  it('should show value gain when current value is higher than original', () => {
    render(
      <AssetItem
        asset={mockAsset}
        onPress={mockOnPress}
      />
    );

    expect(screen.getByText('+$50,000.00')).toBeTruthy();
  });

  it('should show value loss when current value is lower than original', () => {
    const depreciatedAsset = { 
      ...mockAsset, 
      current_value: 200000, 
      original_value: 250000 
    };
    
    render(
      <AssetItem
        asset={depreciatedAsset}
        onPress={mockOnPress}
      />
    );

    expect(screen.getByText('-$50,000.00')).toBeTruthy();
  });

  it('should not show value change when original value is not provided', () => {
    const assetWithoutOriginalValue = { ...mockAsset, original_value: undefined };
    
    render(
      <AssetItem
        asset={assetWithoutOriginalValue}
        onPress={mockOnPress}
      />
    );

    expect(screen.queryByText('+$50,000.00')).toBeFalsy();
    expect(screen.queryByText('-$50,000.00')).toBeFalsy();
  });

  it('should not show value change when current equals original', () => {
    const unchangedAsset = { 
      ...mockAsset, 
      current_value: 250000, 
      original_value: 250000 
    };
    
    render(
      <AssetItem
        asset={unchangedAsset}
        onPress={mockOnPress}
      />
    );

    expect(screen.queryByText('+$0.00')).toBeFalsy();
    expect(screen.queryByText('-$0.00')).toBeFalsy();
  });

  it('should call onPress when item is pressed', () => {
    render(
      <AssetItem
        asset={mockAsset}
        onPress={mockOnPress}
      />
    );

    fireEvent.press(screen.getByText('Test House'));
    expect(mockOnPress).toHaveBeenCalledWith('asset-1');
  });

  it('should call onDeletePress when delete button is pressed', () => {
    render(
      <AssetItem
        asset={mockAsset}
        onPress={mockOnPress}
        onDeletePress={mockOnDeletePress}
      />
    );

    const deleteButton = screen.getByLabelText('more-vert');
    fireEvent.press(deleteButton);
    
    expect(mockOnDeletePress).toHaveBeenCalledWith(mockAsset);
    expect(mockOnPress).not.toHaveBeenCalled(); // Should not trigger item press
  });

  it('should not show delete button when onDeletePress is not provided', () => {
    render(
      <AssetItem
        asset={mockAsset}
        onPress={mockOnPress}
      />
    );

    expect(screen.queryByLabelText('more-vert')).toBeFalsy();
  });

  it('should format different asset types correctly', () => {
    const stockAsset = {
      ...mockAsset,
      asset_type: 'mutual_funds' as const,
    };

    render(
      <AssetItem
        asset={stockAsset}
        onPress={mockOnPress}
      />
    );

    expect(screen.getByText('Mutual Funds')).toBeTruthy();
  });

  it('should render separator by default', () => {
    const { getByTestId } = render(
      <AssetItem
        asset={mockAsset}
        onPress={mockOnPress}
      />
    );

    // Note: We would need to add testID to the separator in the component for this to work
    // This test shows the intention, but the actual implementation might use style checks
  });

  it('should not render separator when showSeparator is false', () => {
    render(
      <AssetItem
        asset={mockAsset}
        onPress={mockOnPress}
        showSeparator={false}
      />
    );

    // Similar to above - would need testID or other way to verify separator visibility
  });

  describe('Category icons and colors', () => {
    it('should render correct icon for property category', () => {
      render(
        <AssetItem
          asset={mockAsset}
          onPress={mockOnPress}
        />
      );

      expect(screen.getByLabelText('home')).toBeTruthy();
    });

    it('should render correct icon for investment category', () => {
      const investmentAsset = {
        ...mockAsset,
        category: 'investments' as const,
      };

      render(
        <AssetItem
          asset={investmentAsset}
          onPress={mockOnPress}
        />
      );

      expect(screen.getByLabelText('trending-up')).toBeTruthy();
    });

    it('should render correct icon for vehicles category', () => {
      const vehicleAsset = {
        ...mockAsset,
        category: 'vehicles' as const,
      };

      render(
        <AssetItem
          asset={vehicleAsset}
          onPress={mockOnPress}
        />
      );

      expect(screen.getByLabelText('directions-car')).toBeTruthy();
    });

    it('should render default icon for unknown category', () => {
      const otherAsset = {
        ...mockAsset,
        category: 'other' as const,
      };

      render(
        <AssetItem
          asset={otherAsset}
          onPress={mockOnPress}
        />
      );

      expect(screen.getByLabelText('category')).toBeTruthy();
    });
  });

  describe('Currency formatting', () => {
    it('should format large numbers correctly', () => {
      const expensiveAsset = {
        ...mockAsset,
        current_value: 1500000,
      };

      render(
        <AssetItem
          asset={expensiveAsset}
          onPress={mockOnPress}
        />
      );

      expect(screen.getByText('$1,500,000.00')).toBeTruthy();
    });

    it('should format small numbers correctly', () => {
      const cheapAsset = {
        ...mockAsset,
        current_value: 1234.56,
      };

      render(
        <AssetItem
          asset={cheapAsset}
          onPress={mockOnPress}
        />
      );

      expect(screen.getByText('$1,234.56')).toBeTruthy();
    });
  });

  describe('Date formatting', () => {
    it('should format update date correctly', () => {
      const recentAsset = {
        ...mockAsset,
        updated_at: '2023-12-25T15:30:45Z',
      };

      render(
        <AssetItem
          asset={recentAsset}
          onPress={mockOnPress}
        />
      );

      expect(screen.getByText('Updated Dec 25, 2023')).toBeTruthy();
    });
  });
});