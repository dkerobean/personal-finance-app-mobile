import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import RegisterScreen from '../app/(auth)/register';
import { validateEmail, validatePassword } from '../src/lib/validators';
import { supabase } from '../src/services/supabaseClient';

// Mock validators
jest.mock('../src/lib/validators', () => ({
  validateEmail: jest.fn(),
  validatePassword: jest.fn(),
}));

// Mock router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: mockPush,
  },
}));

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

const mockValidateEmail = validateEmail as jest.MockedFunction<typeof validateEmail>;
const mockValidatePassword = validatePassword as jest.MockedFunction<typeof validatePassword>;
const mockSupabaseSignUp = supabase.auth.signUp as jest.MockedFunction<typeof supabase.auth.signUp>;

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateEmail.mockReturnValue(true);
    mockValidatePassword.mockReturnValue({ isValid: true, message: '' });
    mockSupabaseSignUp.mockResolvedValue({
      data: { 
        user: { 
          id: 'test-id', 
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: '2023-01-01T00:00:00Z'
        } as any, 
        session: null 
      },
      error: null
    });
  });

  it('renders correctly', () => {
    render(<RegisterScreen />);
    
    expect(screen.getByText('Create Your Account')).toBeTruthy();
    expect(screen.getByText('Sign up to start tracking your finances')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Create a password')).toBeTruthy();
    expect(screen.getByPlaceholderText('Confirm your password')).toBeTruthy();
    expect(screen.getByText('Create Account')).toBeTruthy();
  });

  it('validates email format', async () => {
    mockValidateEmail.mockReturnValue(false);
    
    render(<RegisterScreen />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Create a password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    const submitButton = screen.getByText('Create Account');
    
    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.changeText(passwordInput, 'ValidPass123!');
    fireEvent.changeText(confirmPasswordInput, 'ValidPass123!');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
    });
    
    expect(mockSupabaseSignUp).not.toHaveBeenCalled();
  });

  it('validates password strength', async () => {
    mockValidatePassword.mockReturnValue({ 
      isValid: false, 
      message: 'Password must be at least 8 characters long' 
    });
    
    render(<RegisterScreen />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Create a password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    const submitButton = screen.getByText('Create Account');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'weak');
    fireEvent.changeText(confirmPasswordInput, 'weak');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long')).toBeTruthy();
    });
    
    expect(mockSupabaseSignUp).not.toHaveBeenCalled();
  });

  it('validates password confirmation match', async () => {
    render(<RegisterScreen />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Create a password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    const submitButton = screen.getByText('Create Account');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'ValidPass123!');
    fireEvent.changeText(confirmPasswordInput, 'DifferentPass123!');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeTruthy();
    });
    
    expect(mockSupabaseSignUp).not.toHaveBeenCalled();
  });

  it('calls supabase signUp with correct credentials', async () => {
    render(<RegisterScreen />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Create a password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    const submitButton = screen.getByText('Create Account');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'ValidPass123!');
    fireEvent.changeText(confirmPasswordInput, 'ValidPass123!');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(mockSupabaseSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'ValidPass123!'
      });
    });
  });

  it('shows success message and navigates on successful registration', async () => {
    render(<RegisterScreen />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Create a password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    const submitButton = screen.getByText('Create Account');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'ValidPass123!');
    fireEvent.changeText(confirmPasswordInput, 'ValidPass123!');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Success',
        'Verification email sent! Please check your inbox.',
        expect.any(Array)
      );
    });
  });

  it('shows error message on registration failure', async () => {
    const errorMessage = 'User already registered';
    mockSupabaseSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: errorMessage, name: 'AuthError', status: 400 } as any,
    });
    
    render(<RegisterScreen />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Create a password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    const submitButton = screen.getByText('Create Account');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'ValidPass123!');
    fireEvent.changeText(confirmPasswordInput, 'ValidPass123!');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeTruthy();
      expect(mockAlert).toHaveBeenCalledWith('Error', errorMessage);
    });
  });

  it('clears field errors when user starts typing', () => {
    mockValidateEmail.mockReturnValue(false);
    
    render(<RegisterScreen />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByText('Create Account');
    
    // Trigger validation error
    fireEvent.press(submitButton);
    expect(screen.getByText('Email is required')).toBeTruthy();
    
    // Start typing to clear error
    fireEvent.changeText(emailInput, 'test');
    expect(screen.queryByText('Email is required')).toBeNull();
  });

  it('shows loading state during registration', async () => {
    mockSupabaseSignUp.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
      data: { 
        user: { 
          id: 'test-id', 
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: '2023-01-01T00:00:00Z'
        } as any, 
        session: null 
      },
      error: null
    }), 100)));
    
    render(<RegisterScreen />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Create a password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    const submitButton = screen.getByText('Create Account');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'ValidPass123!');
    fireEvent.changeText(confirmPasswordInput, 'ValidPass123!');
    fireEvent.press(submitButton);
    
    expect(screen.getByText('Creating Account...')).toBeTruthy();
  });
});