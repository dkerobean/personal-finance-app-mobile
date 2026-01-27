/**
 * Auth Service - Uses Backend API + Clerk
 * 
 * This service handles user profile syncing with the backend MongoDB.
 * Authentication itself is handled by Clerk hooks (useSignIn, useSignUp, useAuth).
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: any;
}

export const authService = {
  /**
   * Sync user to MongoDB after Clerk authentication
   */
  async syncUserToDatabase(
    clerkUserId: string, 
    email: string, 
    firstName?: string,
    lastName?: string
  ): Promise<AuthResult> {
    try {
      const response = await fetch(`${API_URL}/users/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: clerkUserId,
          email,
          firstName,
          lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync user');
      }

      return { success: true, user: data.data };
    } catch (error: any) {
      console.error('Error syncing user to database:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get user by Clerk ID
   */
  async getUserByClerkId(clerkUserId: string): Promise<any | null> {
    try {
      const response = await fetch(`${API_URL}/users/${clerkUserId}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  async updateUserProfile(
    clerkUserId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      mobileNumber?: string;
    }
  ): Promise<AuthResult> {
    try {
      const response = await fetch(`${API_URL}/users/${clerkUserId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      return { success: true, user: data.data };
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  },

  // Deprecated methods - keeping for backward compatibility during migration
  async signUp(): Promise<AuthResult> {
    console.warn('authService.signUp is deprecated. Use Clerk useSignUp hook instead.');
    return { success: false, error: 'Use Clerk for authentication' };
  },

  async signIn(): Promise<AuthResult> {
    console.warn('authService.signIn is deprecated. Use Clerk useSignIn hook instead.');
    return { success: false, error: 'Use Clerk for authentication' };
  },

  async signOut(): Promise<AuthResult> {
    console.warn('authService.signOut is deprecated. Use Clerk useClerk hook instead.');
    return { success: false, error: 'Use Clerk for authentication' };
  },

  async getSession(): Promise<{ session: null }> {
    console.warn('authService.getSession is deprecated. Use Clerk useAuth hook instead.');
    return { session: null };
  },
};

export default authService;