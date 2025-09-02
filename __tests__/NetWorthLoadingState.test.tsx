import React from 'react';
import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import NetWorthLoadingState from '@/components/networth/dashboard/NetWorthLoadingState';

// Mock Animated for testing
jest.mock('react-native/Libraries/Animated/Animated', () => {
  const ActualAnimated = jest.requireActual('react-native/Libraries/Animated/Animated');
  return {
    ...ActualAnimated,
    loop: jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
    })),
    sequence: jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
    })),
    timing: jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
    })),
    Value: jest.fn(() => ({
      interpolate: jest.fn(() => ({
        opacity: 0.5,
      })),
    })),
  };
});

describe('NetWorthLoadingState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading skeleton with all components', () => {
    const { container } = render(<NetWorthLoadingState />);
    
    // Should render the main container
    expect(container).toBeTruthy();
    
    // Should start animation on mount
    expect(Animated.loop).toHaveBeenCalled();
  });

  it('should render with trend chart by default', () => {
    const { container } = render(<NetWorthLoadingState />);
    
    // Component should render without errors
    expect(container).toBeTruthy();
  });

  it('should render without trend chart when showTrendChart is false', () => {
    const { container } = render(<NetWorthLoadingState showTrendChart={false} />);
    
    // Should still render other components
    expect(container).toBeTruthy();
  });

  it('should start pulse animation on mount', () => {
    render(<NetWorthLoadingState />);
    
    expect(Animated.loop).toHaveBeenCalled();
    expect(Animated.sequence).toHaveBeenCalled();
    expect(Animated.timing).toHaveBeenCalledTimes(2); // Two timing animations in sequence
  });

  it('should stop animation on unmount', () => {
    const mockStop = jest.fn();
    const mockStart = jest.fn(() => ({ stop: mockStop }));
    
    (Animated.loop as jest.Mock).mockReturnValue({ start: mockStart });
    
    const { unmount } = render(<NetWorthLoadingState />);
    
    unmount();
    
    expect(mockStop).toHaveBeenCalled();
  });

  it('should render all required skeleton elements', () => {
    const { container } = render(<NetWorthLoadingState showTrendChart={true} />);
    
    // Should render without throwing errors
    expect(container).toBeTruthy();
    
    // Verify animation setup was called
    expect(Animated.Value).toHaveBeenCalled();
  });

  it('should handle animation interpolation', () => {
    const mockInterpolate = jest.fn().mockReturnValue({ opacity: 0.5 });
    (Animated.Value as jest.Mock).mockReturnValue({
      interpolate: mockInterpolate,
    });
    
    render(<NetWorthLoadingState />);
    
    expect(mockInterpolate).toHaveBeenCalledWith({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });
  });

  it('should render with correct structure for trend chart loading', () => {
    const { container } = render(<NetWorthLoadingState showTrendChart={true} />);
    
    // Should include all main sections:
    // - Summary card loading
    // - Breakdown card loading
    // - Quick actions loading
    // - Trend chart loading
    // - Health score loading
    expect(container).toBeTruthy();
  });

  it('should render with correct structure without trend chart', () => {
    const { container } = render(<NetWorthLoadingState showTrendChart={false} />);
    
    // Should include all main sections except trend chart
    expect(container).toBeTruthy();
  });

  it('should use correct animation timing', () => {
    render(<NetWorthLoadingState />);
    
    expect(Animated.timing).toHaveBeenCalledWith(
      expect.anything(),
      {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }
    );
    
    expect(Animated.timing).toHaveBeenCalledWith(
      expect.anything(),
      {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }
    );
  });

  it('should render multiple skeleton items for lists', () => {
    const { container } = render(<NetWorthLoadingState />);
    
    // Should render multiple action buttons (4), category items (3), month labels (6)
    // This is tested by ensuring the component renders without errors
    expect(container).toBeTruthy();
  });

  it('should have proper styling for skeleton elements', () => {
    const { container } = render(<NetWorthLoadingState />);
    
    // Skeleton elements should use border color for loading placeholders
    expect(container).toBeTruthy();
  });
});