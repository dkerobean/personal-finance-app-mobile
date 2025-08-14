import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import LoginScreen from '../app/(auth)/login';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

// Mock dependencies
jest.mock('expo-router');
jest.mock('@/services/authService');
jest.mock('@/stores/authStore');

// Mock Alert
const mockAlert = jest.fn();
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: mockAlert,
    },
  };
});

const mockRouter = router as jest.Mocked<typeof router>;
const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock store methods
const mockSetUser = jest.fn();
const mockSetSession = jest.fn();

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
    
    // Setup default store state
    mockUseAuthStore.mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      hydrated: false,
      setUser: mockSetUser,
      setSession: mockSetSession,
      setLoading: jest.fn(),
      logout: jest.fn(),
      initialize: jest.fn(),
    });
  });

  it('renders login form correctly', () => {
    render(<LoginScreen />);

    expect(screen.getByText('Welcome Back')).toBeTruthy();
    expect(screen.getByText('Sign in to your account')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(screen.getByText('Create Account')).toBeTruthy();
  });

  it('validates required fields', async () => {
    render(<LoginScreen />);

    const signInButton = screen.getByText('Sign In');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeTruthy();
      expect(screen.getByText('Password is required')).toBeTruthy();
    });
  });

  it('validates email format', async () => {
    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const signInButton = screen.getByText('Sign In');

    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
    });
  });

  it('clears field errors when typing', async () => {
    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const signInButton = screen.getByText('Sign In');

    // Trigger validation error
    fireEvent.press(signInButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeTruthy();
    });

    // Clear error by typing
    fireEvent.changeText(emailInput, 'test@example.com');
    
    await waitFor(() => {
      expect(screen.queryByText('Email is required')).toBeNull();
    });
  });

  it('handles successful login', async () => {
    const mockSession = {
      access_token: 'test-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: { 
        id: '1', 
        email: 'test@example.com',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: '2023-01-01T00:00:00.000Z',
      },
    };

    mockAuthService.signIn.mockResolvedValueOnce({
      success: true,
      message: 'Signed in successfully.',
    });

    mockAuthService.getSession.mockResolvedValueOnce(mockSession);

    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const signInButton = screen.getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockAuthService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockSetSession).toHaveBeenCalledWith(mockSession);
      expect(mockSetUser).toHaveBeenCalledWith(mockSession.user);
      expect(mockAlert).toHaveBeenCalledWith('Success', 'Welcome back!', [
        {
          text: 'OK',
          onPress: expect.any(Function),
        },
      ]);
    });
  });

  it('handles login failure', async () => {
    mockAuthService.signIn.mockResolvedValueOnce({
      success: false,
      message: 'Invalid credentials',
    });

    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const signInButton = screen.getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockAuthService.signIn).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
      expect(mockAlert).toHaveBeenCalledWith('Login Failed', 'Invalid credentials');
      expect(screen.getByText('Invalid credentials')).toBeTruthy();
    });
  });

  it('shows loading state during sign in', async () => {
    let resolveSignIn: (value: any) => void;
    const signInPromise = new Promise<any>((resolve) => {
      resolveSignIn = resolve;
    });

    mockAuthService.signIn.mockReturnValueOnce(signInPromise);

    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const signInButton = screen.getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);

    // Should show loading state
    expect(screen.getByText('Signing In...')).toBeTruthy();

    // Resolve the promise
    resolveSignIn!({ success: true });

    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeTruthy();
    });
  });

  it('navigates to registration screen', () => {
    render(<LoginScreen />);

    const createAccountLink = screen.getByText('Create Account');
    fireEvent.press(createAccountLink);

    expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/register');
  });

  it('navigates to dashboard on successful login alert OK press', async () => {
    mockAuthService.signIn.mockResolvedValueOnce({
      success: true,
      message: 'Signed in successfully.',
    });

    mockAuthService.getSession.mockResolvedValueOnce({
      access_token: 'test-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: { 
        id: '1', 
        email: 'test@example.com',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: '2023-01-01T00:00:00.000Z',
      },
    });

    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const signInButton = screen.getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Success', 'Welcome back!', [
        {
          text: 'OK',
          onPress: expect.any(Function),
        },
      ]);
    });

    // Simulate pressing OK on the alert
    const alertCall = mockAlert.mock.calls[0];
    const okButton = alertCall[2][0];
    okButton.onPress();

    expect(mockRouter.replace).toHaveBeenCalledWith('/(app)');
  });

  it('handles unexpected errors during sign in', async () => {
    const error = new Error('Network error');
    mockAuthService.signIn.mockRejectedValueOnce(error);

    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const signInButton = screen.getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Error', 'Network error');
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });
});