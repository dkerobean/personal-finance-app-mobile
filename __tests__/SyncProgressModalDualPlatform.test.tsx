import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SyncProgressModal } from '@/components/features/accounts/SyncProgressModal';

describe('SyncProgressModal - Dual Platform Support', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    syncStatus: 'idle' as const,
    transactionCount: 0,
    autoCloseDelay: 0, // Disable auto-close for tests
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Platform-Specific Branding', () => {
    it('should display MTN MoMo branding for mobile money accounts', () => {
      const { getByText } = render(
        <SyncProgressModal
          {...defaultProps}
          accountType="mobile_money"
          syncStatus="idle"
        />
      );

      expect(getByText('MTN MoMo Sync')).toBeTruthy();
    });

    it('should display bank account branding for bank accounts', () => {
      const { getByText } = render(
        <SyncProgressModal
          {...defaultProps}
          accountType="bank"
          syncStatus="idle"
        />
      );

      expect(getByText('Bank Account Sync')).toBeTruthy();
    });
  });

  describe('Platform-Specific Progress Messages', () => {
    it('should show MTN MoMo specific messages during sync', () => {
      const { getByText, rerender } = render(
        <SyncProgressModal
          {...defaultProps}
          accountType="mobile_money"
          syncStatus="fetching"
        />
      );

      expect(getByText('Fetching MTN MoMo transactions...')).toBeTruthy();

      rerender(
        <SyncProgressModal
          {...defaultProps}
          accountType="mobile_money"
          syncStatus="storing"
        />
      );

      expect(getByText('Storing data...')).toBeTruthy();
    });

    it('should show bank specific messages during sync', () => {
      const { getByText, rerender } = render(
        <SyncProgressModal
          {...defaultProps}
          accountType="bank"
          syncStatus="fetching"
        />
      );

      expect(getByText('Fetching bank account information...')).toBeTruthy();

      rerender(
        <SyncProgressModal
          {...defaultProps}
          accountType="bank"
          syncStatus="storing"
        />
      );

      expect(getByText('Processing transactions...')).toBeTruthy();
    });
  });

  describe('Completion Messages', () => {
    it('should show mobile money completion message', () => {
      const { getByText } = render(
        <SyncProgressModal
          {...defaultProps}
          accountType="mobile_money"
          syncStatus="completed"
          transactionCount={15}
          institutionName="MTN Mobile Money"
        />
      );

      expect(getByText('Imported 15 mobile money transactions from MTN Mobile Money')).toBeTruthy();
    });

    it('should show bank completion message', () => {
      const { getByText } = render(
        <SyncProgressModal
          {...defaultProps}
          accountType="bank"
          syncStatus="completed"
          transactionCount={25}
          institutionName="GCB Bank"
        />
      );

      expect(getByText('Imported 25 bank transactions from GCB Bank')).toBeTruthy();
    });

    it('should handle singular transaction count', () => {
      const { getByText } = render(
        <SyncProgressModal
          {...defaultProps}
          accountType="bank"
          syncStatus="completed"
          transactionCount={1}
          institutionName="Access Bank"
        />
      );

      expect(getByText('Imported 1 bank transaction from Access Bank')).toBeTruthy();
    });

    it('should work without institution name', () => {
      const { getByText } = render(
        <SyncProgressModal
          {...defaultProps}
          accountType="mobile_money"
          syncStatus="completed"
          transactionCount={5}
        />
      );

      expect(getByText('Imported 5 mobile money transactions')).toBeTruthy();
    });
  });

  describe('Progress Steps', () => {
    it('should show correct steps for mobile money sync', () => {
      const { getByText } = render(
        <SyncProgressModal
          {...defaultProps}
          accountType="mobile_money"
          syncStatus="fetching"
        />
      );

      expect(getByText('Fetching MTN MoMo transactions...')).toBeTruthy();
      expect(getByText('Storing data...')).toBeTruthy();
      expect(getByText('Complete!')).toBeTruthy();
    });

    it('should show correct steps for bank sync', () => {
      const { getByText } = render(
        <SyncProgressModal
          {...defaultProps}
          accountType="bank"
          syncStatus="fetching"
        />
      );

      expect(getByText('Fetching bank account information...')).toBeTruthy();
      expect(getByText('Processing transactions...')).toBeTruthy();
      expect(getByText('Complete!')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should display error message for bank sync failure', () => {
      const { getByText } = render(
        <SyncProgressModal
          {...defaultProps}
          accountType="bank"
          syncStatus="error"
          errorMessage="Failed to connect to Mono API"
        />
      );

      expect(getByText('Failed to connect to Mono API')).toBeTruthy();
      expect(getByText('Please try again or contact support if the problem persists.')).toBeTruthy();
    });

    it('should display error message for mobile money sync failure', () => {
      const { getByText } = render(
        <SyncProgressModal
          {...defaultProps}
          accountType="mobile_money"
          syncStatus="error"
          errorMessage="MTN MoMo API unavailable"
        />
      );

      expect(getByText('MTN MoMo API unavailable')).toBeTruthy();
    });

    it('should show retry button on error', () => {
      const { getByText } = render(
        <SyncProgressModal
          {...defaultProps}
          syncStatus="error"
          errorMessage="Network error"
        />
      );

      expect(getByText('Retry')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button is pressed', () => {
      const onClose = jest.fn();
      const { getByText } = render(
        <SyncProgressModal
          {...defaultProps}
          onClose={onClose}
          syncStatus="completed"
        />
      );

      fireEvent.press(getByText('Close'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not show close button during loading', () => {
      const { queryByText } = render(
        <SyncProgressModal
          {...defaultProps}
          syncStatus="fetching"
        />
      );

      expect(queryByText('Close')).toBeFalsy();
    });

    it('should call onClose when retry button is pressed on error', () => {
      const onClose = jest.fn();
      const { getByText } = render(
        <SyncProgressModal
          {...defaultProps}
          onClose={onClose}
          syncStatus="error"
          errorMessage="Test error"
        />
      );

      fireEvent.press(getByText('Retry'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Auto-close Functionality', () => {
    it('should auto-close after completion when autoCloseDelay is set', async () => {
      const onClose = jest.fn();
      
      render(
        <SyncProgressModal
          {...defaultProps}
          onClose={onClose}
          syncStatus="completed"
          autoCloseDelay={100}
        />
      );

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      }, { timeout: 200 });
    });

    it('should not auto-close when autoCloseDelay is 0', async () => {
      const onClose = jest.fn();
      
      render(
        <SyncProgressModal
          {...defaultProps}
          onClose={onClose}
          syncStatus="completed"
          autoCloseDelay={0}
        />
      );

      // Wait a bit and ensure onClose was not called
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Default Behavior', () => {
    it('should default to mobile money when no account type is specified', () => {
      const { getByText } = render(
        <SyncProgressModal
          {...defaultProps}
          syncStatus="idle"
        />
      );

      // Should show MTN MoMo branding by default
      expect(getByText('MTN MoMo Sync')).toBeTruthy();
    });
  });

  describe('Progress Bar', () => {
    it('should show correct progress values', () => {
      const { getByText, rerender } = render(
        <SyncProgressModal
          {...defaultProps}
          syncStatus="fetching"
        />
      );

      expect(getByText('33% complete')).toBeTruthy();

      rerender(
        <SyncProgressModal
          {...defaultProps}
          syncStatus="storing"
        />
      );

      expect(getByText('66% complete')).toBeTruthy();

      rerender(
        <SyncProgressModal
          {...defaultProps}
          syncStatus="completed"
        />
      );

      expect(getByText('100% complete')).toBeTruthy();
    });

    it('should show 0% progress on error', () => {
      const { getByText } = render(
        <SyncProgressModal
          {...defaultProps}
          syncStatus="error"
          errorMessage="Test error"
        />
      );

      expect(getByText('0% complete')).toBeTruthy();
    });
  });
});