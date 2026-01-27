import { Account } from '@/types/models';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const accountsApi = {
  getAccounts: async (userId: string): Promise<Account[]> => {
    try {
      const response = await fetch(`${API_URL}/accounts?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  },

  getAccount: async (id: string, userId: string): Promise<Account> => {
    try {
      const response = await fetch(`${API_URL}/accounts/${id}?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Account not found');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching account:', error);
      throw error;
    }
  },

  createAccount: async (accountData: Partial<Account>): Promise<Account> => {
    try {
      const response = await fetch(`${API_URL}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });
      if (!response.ok) {
        throw new Error('Failed to create account');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  },

  deleteAccount: async (id: string, userId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/accounts/${id}?userId=${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },

  linkMonoAccount: async (code: string, userId: string): Promise<Account> => {
    try {
      const response = await fetch(`${API_URL}/mono/exchange-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link Mono account');
      }

      return data.data;
    } catch (error) {
      console.error('Error linking Mono account:', error);
      throw error;
    }
  }
};
