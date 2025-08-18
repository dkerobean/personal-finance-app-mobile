import React from 'react';
import { render } from '@testing-library/react-native';
import SyncedTransactionBadge from '@/components/SyncedTransactionBadge';

describe('SyncedTransactionBadge', () => {
  it('renders with default props', () => {
    const { getByText } = render(<SyncedTransactionBadge />);
    
    expect(getByText('MTN MoMo')).toBeTruthy();
  });

  it('renders with account name when provided', () => {
    const { getByText } = render(
      <SyncedTransactionBadge accountName="John's Account" />
    );
    
    expect(getByText('MTN MoMo')).toBeTruthy();
    expect(getByText('• John\'s Account')).toBeTruthy();
  });

  it('does not show account name for small size', () => {
    const { getByText, queryByText } = render(
      <SyncedTransactionBadge accountName="John's Account" size="small" />
    );
    
    expect(getByText('MTN MoMo')).toBeTruthy();
    expect(queryByText('• John\'s Account')).toBeNull();
  });

  it('renders in medium size by default', () => {
    const { getByText } = render(<SyncedTransactionBadge />);
    
    const badge = getByText('MTN MoMo');
    expect(badge).toBeTruthy();
  });

  it('renders in small size when specified', () => {
    const { getByText } = render(<SyncedTransactionBadge size="small" />);
    
    const badge = getByText('MTN MoMo');
    expect(badge).toBeTruthy();
  });
});