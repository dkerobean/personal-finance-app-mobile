import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { SyncProgressModal } from '@/components/features/accounts/SyncProgressModal';

// Mock auto-close functionality
jest.useFakeTimers();

const renderModal = (props: Partial<React.ComponentProps<typeof SyncProgressModal>> = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    syncStatus: 'idle' as const,
    transactionCount: 0,
  };

  return render(
    <SyncProgressModal {...defaultProps} {...props} />
  );
};

describe('SyncProgressModal', () => {
  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('renders correctly when closed', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText('MTN MoMo Sync')).toBeNull();
  });

  it('renders correctly when open with idle status', () => {
    renderModal({ syncStatus: 'idle' });
    expect(screen.getByText('MTN MoMo Sync')).toBeTruthy();
    expect(screen.getByText('Fetching MTN MoMo transactions...')).toBeTruthy();
  });

  it('shows fetching status correctly', () => {
    renderModal({ syncStatus: 'fetching' });
    expect(screen.getByText('Fetching MTN MoMo transactions...')).toBeTruthy();
    expect(screen.getByText('33% complete')).toBeTruthy();
  });

  it('shows storing status correctly', () => {
    renderModal({ syncStatus: 'storing' });
    expect(screen.getByText('Storing data...')).toBeTruthy();
    expect(screen.getByText('66% complete')).toBeTruthy();
  });

  it('shows completed status with transaction count', () => {
    renderModal({ 
      syncStatus: 'completed', 
      transactionCount: 15 
    });
    expect(screen.getByText('Imported 15 mobile money transactions')).toBeTruthy();
    expect(screen.getByText('100% complete')).toBeTruthy();
    expect(screen.getByText('Your transaction history has been updated successfully!')).toBeTruthy();
  });

  it('shows error status with error message', () => {
    renderModal({ 
      syncStatus: 'error', 
      errorMessage: 'Network connection failed' 
    });
    expect(screen.getByText('Network connection failed')).toBeTruthy();
    expect(screen.getByText('Please try again or contact support if the problem persists.')).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    const onCloseMock = jest.fn();
    renderModal({ onClose: onCloseMock, syncStatus: 'completed' });
    
    const closeButton = screen.getByText('Close');
    fireEvent.press(closeButton);
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when retry button is pressed in error state', () => {
    const onCloseMock = jest.fn();
    renderModal({ 
      onClose: onCloseMock, 
      syncStatus: 'error',
      errorMessage: 'Test error'
    });
    
    const retryButton = screen.getByText('Retry');
    fireEvent.press(retryButton);
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('auto-closes after completion with default delay', async () => {
    const onCloseMock = jest.fn();
    renderModal({ 
      onClose: onCloseMock, 
      syncStatus: 'completed',
      transactionCount: 5
    });
    
    // Fast-forward time by 3 seconds (default auto-close delay)
    jest.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });

  it('auto-closes with custom delay', async () => {
    const onCloseMock = jest.fn();
    renderModal({ 
      onClose: onCloseMock, 
      syncStatus: 'completed',
      transactionCount: 10,
      autoCloseDelay: 5000
    });
    
    // Should not close before 5 seconds
    jest.advanceTimersByTime(3000);
    expect(onCloseMock).not.toHaveBeenCalled();
    
    // Should close after 5 seconds
    jest.advanceTimersByTime(2000);
    await waitFor(() => {
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });

  it('does not auto-close when autoCloseDelay is 0', async () => {
    const onCloseMock = jest.fn();
    renderModal({ 
      onClose: onCloseMock, 
      syncStatus: 'completed',
      transactionCount: 8,
      autoCloseDelay: 0
    });
    
    jest.advanceTimersByTime(5000);
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  it('does not show close button during loading states', () => {
    renderModal({ syncStatus: 'fetching' });
    expect(screen.queryByText('Close')).toBeNull();
    expect(screen.queryByText('Cancel')).toBeNull();
    
    renderModal({ syncStatus: 'storing' });
    expect(screen.queryByText('Close')).toBeNull();
    expect(screen.queryByText('Cancel')).toBeNull();
  });

  it('handles singular transaction count correctly', () => {
    renderModal({ 
      syncStatus: 'completed', 
      transactionCount: 1 
    });
    expect(screen.getByText('Imported 1 mobile money transaction')).toBeTruthy();
  });

  it('shows loading steps indicator during sync', () => {
    renderModal({ syncStatus: 'fetching' });
    
    // Should show all three steps
    expect(screen.getByText('Fetching MTN MoMo transactions...')).toBeTruthy();
    expect(screen.getByText('Storing data...')).toBeTruthy();
    expect(screen.getByText('Complete!')).toBeTruthy();
  });

  it('updates progress steps correctly during storing phase', () => {
    renderModal({ syncStatus: 'storing' });
    
    // First step should be completed, second should be current, third should be pending
    expect(screen.getByText('Storing data...')).toBeTruthy();
    // Progress bar should show 66%
    expect(screen.getByText('66% complete')).toBeTruthy();
  });
});