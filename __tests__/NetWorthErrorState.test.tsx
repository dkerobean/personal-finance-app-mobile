import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import NetWorthErrorState, { 
  createNetWorthError, 
  NetworkError, 
  CalculationError, 
  DataError, 
  PermissionError, 
  UnknownError 
} from '@/components/networth/dashboard/NetWorthErrorState';

describe('NetWorthErrorState', () => {
  const mockOnRetry = jest.fn();
  const mockOnContactSupport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Network Error', () => {
    it('should render network error correctly', () => {
      const error = NetworkError('Connection failed');
      const { getByText } = render(
        <NetWorthErrorState error={error} onRetry={mockOnRetry} />
      );

      expect(getByText('Network Connection Issue')).toBeTruthy();
      expect(getByText('Unable to connect to our servers. Please check your internet connection and try again.')).toBeTruthy();
      expect(getByText('Connection failed')).toBeTruthy();
      expect(getByText('Try Again')).toBeTruthy();
    });

    it('should show network troubleshooting steps', () => {
      const error = NetworkError();
      const { getByText } = render(
        <NetWorthErrorState error={error} onRetry={mockOnRetry} />
      );

      expect(getByText('Try these steps:')).toBeTruthy();
      expect(getByText('Check your internet connection')).toBeTruthy();
      expect(getByText('Try switching between WiFi and mobile data')).toBeTruthy();
      expect(getByText('Restart the app')).toBeTruthy();
    });

    it('should call onRetry when Try Again button is pressed', () => {
      const error = NetworkError();
      const { getByText } = render(
        <NetWorthErrorState error={error} onRetry={mockOnRetry} />
      );

      fireEvent.press(getByText('Try Again'));
      expect(mockOnRetry).toHaveBeenCalled();
    });
  });

  describe('Calculation Error', () => {
    it('should render calculation error correctly', () => {
      const error = CalculationError('Invalid asset data');
      const { getByText } = render(
        <NetWorthErrorState error={error} onRetry={mockOnRetry} />
      );

      expect(getByText('Calculation Error')).toBeTruthy();
      expect(getByText('We encountered an issue calculating your net worth. This might be due to invalid data.')).toBeTruthy();
      expect(getByText('Invalid asset data')).toBeTruthy();
    });

    it('should show calculation troubleshooting steps', () => {
      const error = CalculationError();
      const { getByText } = render(
        <NetWorthErrorState error={error} onRetry={mockOnRetry} />
      );

      expect(getByText('Review your asset and liability values')).toBeTruthy();
      expect(getByText('Remove any assets or liabilities with invalid data')).toBeTruthy();
      expect(getByText('Try refreshing your data')).toBeTruthy();
    });
  });

  describe('Data Error', () => {
    it('should render data error correctly', () => {
      const error = DataError('Corrupted data detected');
      const { queryByText } = render(
        <NetWorthErrorState error={error} onRetry={mockOnRetry} />
      );

      expect(queryByText('Data Issue')).toBeTruthy();
      expect(queryByText('Some of your financial data appears to be incomplete or corrupted.')).toBeTruthy();
      expect(queryByText('Corrupted data detected')).toBeTruthy();
      
      // Data errors should not show retry button
      expect(queryByText('Try Again')).toBeNull();
    });

    it('should show data troubleshooting steps', () => {
      const error = DataError();
      const { getByText } = render(
        <NetWorthErrorState error={error} />
      );

      expect(getByText('Check your recent transactions')).toBeTruthy();
      expect(getByText('Verify all asset and liability information')).toBeTruthy();
      expect(getByText('Consider re-adding problematic entries')).toBeTruthy();
    });
  });

  describe('Permission Error', () => {
    it('should render permission error correctly', () => {
      const error = PermissionError('Account not verified');
      const { getByText, queryByText } = render(
        <NetWorthErrorState error={error} />
      );

      expect(getByText('Access Denied')).toBeTruthy();
      expect(getByText('You don\'t have permission to access this feature. Please check your account settings.')).toBeTruthy();
      expect(getByText('Account not verified')).toBeTruthy();
      
      // Permission errors should not show retry button
      expect(queryByText('Try Again')).toBeNull();
    });

    it('should show permission troubleshooting steps', () => {
      const error = PermissionError();
      const { getByText } = render(
        <NetWorthErrorState error={error} />
      );

      expect(getByText('Log out and log back in')).toBeTruthy();
      expect(getByText('Check your subscription status')).toBeTruthy();
      expect(getByText('Contact support for account verification')).toBeTruthy();
    });
  });

  describe('Unknown Error', () => {
    it('should render unknown error correctly', () => {
      const error = UnknownError('Unexpected failure');
      const { getByText } = render(
        <NetWorthErrorState error={error} onRetry={mockOnRetry} />
      );

      expect(getByText('Something Went Wrong')).toBeTruthy();
      expect(getByText('An unexpected error occurred. Please try again or contact support if the problem persists.')).toBeTruthy();
      expect(getByText('Unexpected failure')).toBeTruthy();
      expect(getByText('Try Again')).toBeTruthy();
    });
  });

  describe('Contact Support', () => {
    it('should show contact support button when enabled', () => {
      const error = NetworkError();
      const { getByText } = render(
        <NetWorthErrorState 
          error={error} 
          onContactSupport={mockOnContactSupport}
          showContactSupport={true}
        />
      );

      expect(getByText('Contact Support')).toBeTruthy();
    });

    it('should call onContactSupport when Contact Support button is pressed', () => {
      const error = NetworkError();
      const { getByText } = render(
        <NetWorthErrorState 
          error={error} 
          onContactSupport={mockOnContactSupport}
          showContactSupport={true}
        />
      );

      fireEvent.press(getByText('Contact Support'));
      expect(mockOnContactSupport).toHaveBeenCalled();
    });

    it('should hide contact support button when showContactSupport is false', () => {
      const error = NetworkError();
      const { queryByText } = render(
        <NetWorthErrorState 
          error={error} 
          onContactSupport={mockOnContactSupport}
          showContactSupport={false}
        />
      );

      expect(queryByText('Contact Support')).toBeNull();
    });
  });

  describe('Error Details', () => {
    it('should show error details when provided', () => {
      const error = createNetWorthError('network', 'Connection timeout', 'Server response timeout after 30s');
      const { getByText } = render(
        <NetWorthErrorState error={error} />
      );

      expect(getByText('Error Details:')).toBeTruthy();
      expect(getByText('Connection timeout')).toBeTruthy();
      expect(getByText('Server response timeout after 30s')).toBeTruthy();
    });

    it('should show technical information section when details are provided', () => {
      const error = createNetWorthError('calculation', 'Math error', 'Division by zero in calculation');
      const { getByText } = render(
        <NetWorthErrorState error={error} />
      );

      expect(getByText('Technical Information')).toBeTruthy();
      expect(getByText('Error Type: calculation')).toBeTruthy();
      expect(getByText(/Timestamp:/)).toBeTruthy();
      expect(getByText('Details: Division by zero in calculation')).toBeTruthy();
    });
  });

  describe('Error Helper Functions', () => {
    it('should create network error correctly', () => {
      const error = NetworkError('Custom network message');
      expect(error.type).toBe('network');
      expect(error.message).toBe('Custom network message');
    });

    it('should create calculation error correctly', () => {
      const error = CalculationError();
      expect(error.type).toBe('calculation');
      expect(error.message).toBe('Net worth calculation failed');
    });

    it('should create data error correctly', () => {
      const error = DataError();
      expect(error.type).toBe('data');
      expect(error.message).toBe('Data validation failed');
    });

    it('should create permission error correctly', () => {
      const error = PermissionError();
      expect(error.type).toBe('permission');
      expect(error.message).toBe('Access denied');
    });

    it('should create unknown error correctly', () => {
      const error = UnknownError();
      expect(error.type).toBe('unknown');
      expect(error.message).toBe('An unexpected error occurred');
    });

    it('should create custom error with createNetWorthError', () => {
      const error = createNetWorthError('network', 'Custom message', 'Custom details');
      expect(error.type).toBe('network');
      expect(error.message).toBe('Custom message');
      expect(error.details).toBe('Custom details');
    });
  });

  describe('Troubleshooting Steps Numbering', () => {
    it('should show numbered troubleshooting steps', () => {
      const error = NetworkError();
      const { getByText } = render(
        <NetWorthErrorState error={error} />
      );

      // Check that step numbers are displayed
      expect(getByText('1')).toBeTruthy();
      expect(getByText('2')).toBeTruthy();
      expect(getByText('3')).toBeTruthy();
    });
  });
});