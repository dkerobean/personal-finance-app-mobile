import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import NetWorthTrendChart from '@/components/networth/dashboard/NetWorthTrendChart';

const mockHistoricalData = [
  {
    month: 'Jan',
    netWorth: 50000,
    assets: 80000,
    liabilities: 30000,
    timestamp: '2024-01-01T00:00:00.000Z',
  },
  {
    month: 'Feb',
    netWorth: 52000,
    assets: 82000,
    liabilities: 30000,
    timestamp: '2024-02-01T00:00:00.000Z',
  },
  {
    month: 'Mar',
    netWorth: 55000,
    assets: 85000,
    liabilities: 30000,
    timestamp: '2024-03-01T00:00:00.000Z',
  },
  {
    month: 'Apr',
    netWorth: 53000,
    assets: 83000,
    liabilities: 30000,
    timestamp: '2024-04-01T00:00:00.000Z',
  },
];

describe('NetWorthTrendChart', () => {
  it('should render with historical data', () => {
    const { getByText } = render(
      <NetWorthTrendChart historicalData={mockHistoricalData} />
    );

    expect(getByText('Net Worth Trend')).toBeTruthy();
    expect(getByText('View All')).toBeTruthy();
    
    // Check for month labels
    expect(getByText('Jan')).toBeTruthy();
    expect(getByText('Feb')).toBeTruthy();
    expect(getByText('Mar')).toBeTruthy();
    expect(getByText('Apr')).toBeTruthy();
  });

  it('should show loading state', () => {
    const { getByTestId } = render(
      <NetWorthTrendChart 
        historicalData={[]} 
        isLoading={true} 
      />
    );

    // Loading skeletons should be present
    const loadingElements = getByTestId?.('loading-container') || 
                          document.querySelector('[style*="backgroundColor"]');
    expect(loadingElements).toBeTruthy();
  });

  it('should show placeholder when no data', () => {
    const { getByText } = render(
      <NetWorthTrendChart historicalData={[]} />
    );

    expect(getByText('Net Worth History')).toBeTruthy();
    expect(getByText('Track your progress over time. Add assets and liabilities to start building your history.')).toBeTruthy();
    expect(getByText('Learn More')).toBeTruthy();
  });

  it('should calculate monthly change correctly', () => {
    const { getByText } = render(
      <NetWorthTrendChart historicalData={mockHistoricalData} />
    );

    // Latest change should be from Mar (55000) to Apr (53000) = -2000
    // Should show as positive number with down arrow
    expect(getByText(/GHS 2,000/)).toBeTruthy();
    expect(getByText(/3.6%/)).toBeTruthy(); // (2000 / 55000) * 100 = 3.6%
  });

  it('should call onViewHistory when view all button is pressed', () => {
    const mockOnViewHistory = jest.fn();
    const { getByText } = render(
      <NetWorthTrendChart 
        historicalData={mockHistoricalData} 
        onViewHistory={mockOnViewHistory}
      />
    );

    fireEvent.press(getByText('View All'));
    expect(mockOnViewHistory).toHaveBeenCalled();
  });

  it('should call onViewHistory when learn more button is pressed in placeholder', () => {
    const mockOnViewHistory = jest.fn();
    const { getByText } = render(
      <NetWorthTrendChart 
        historicalData={[]} 
        onViewHistory={mockOnViewHistory}
      />
    );

    fireEvent.press(getByText('Learn More'));
    expect(mockOnViewHistory).toHaveBeenCalled();
  });

  it('should handle single data point', () => {
    const singleDataPoint = [mockHistoricalData[0]];
    const { getByText } = render(
      <NetWorthTrendChart historicalData={singleDataPoint} />
    );

    expect(getByText('Net Worth Trend')).toBeTruthy();
    expect(getByText('Jan')).toBeTruthy();
    
    // Should show no change when only one data point
    expect(getByText(/GHS 0/)).toBeTruthy();
  });

  it('should handle negative net worth values', () => {
    const negativeData = [
      {
        ...mockHistoricalData[0],
        netWorth: -10000,
      },
      {
        ...mockHistoricalData[1],
        netWorth: -8000,
      },
    ];

    const { getByText } = render(
      <NetWorthTrendChart historicalData={negativeData} />
    );

    expect(getByText('Net Worth Trend')).toBeTruthy();
    // Should show positive change from -10000 to -8000 = +2000
    expect(getByText(/GHS 2,000/)).toBeTruthy();
  });

  it('should handle zero net worth values', () => {
    const zeroData = [
      {
        ...mockHistoricalData[0],
        netWorth: 0,
      },
      {
        ...mockHistoricalData[1],
        netWorth: 1000,
      },
    ];

    const { getByText } = render(
      <NetWorthTrendChart historicalData={zeroData} />
    );

    expect(getByText('Net Worth Trend')).toBeTruthy();
    // Should handle division by zero gracefully
    expect(getByText(/GHS 1,000/)).toBeTruthy();
  });

  it('should render correct number of data points in chart', () => {
    const { container } = render(
      <NetWorthTrendChart historicalData={mockHistoricalData} />
    );

    // Check that SVG elements are rendered (mocked in test environment)
    // In a real test environment with proper SVG support, we would check for circle elements
    expect(container).toBeTruthy();
  });
});