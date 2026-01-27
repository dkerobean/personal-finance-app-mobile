import { create } from 'zustand';
import { transactionSyncService } from '@/services/transactionSyncService';
import { mtnSyncService } from '@/services/mtnSyncService';
import { mtnMomoService } from '@/services/api/mtnMomoService';
import type { 
  MoMoAccountLink, 
  MoMoTransaction, 
  MoMoServiceResponse,
  MoMoTransactionStatusResponse 
} from '@/types/mtnMomo';

interface SyncResult {
  totalTransactions: number;
  newTransactions: number;
  updatedTransactions: number;
  errors: string[];
}

interface MoMoAccountLinkRequest {
  phone_number: string;
  account_name: string;
}

interface MoMoState {
  // Account linking
  linkedAccounts: MoMoAccountLink[];
  isLoadingAccounts: boolean;
  
  // Transaction sync
  momoTransactions: MoMoTransaction[];
  isLoadingTransactions: boolean;
  isSyncing: boolean;
  syncStatus: 'idle' | 'fetching' | 'storing' | 'completed' | 'error';
  lastSyncTime: string | null;
  syncHistory: any[];
  
  // General state
  error: string | null;
  isInitialized: boolean;
}

interface MoMoActions {
  // Account management
  loadLinkedAccounts: () => Promise<void>;
  linkAccount: (userId: string, request: MoMoAccountLinkRequest) => Promise<boolean>;
  deactivateAccount: (accountId: string) => Promise<boolean>;
  
  // Transaction sync
  syncTransactions: () => Promise<SyncResult | null>;
  syncAccountWithProgress: (accountId: string) => Promise<SyncResult | null>;
  loadMoMoTransactions: () => Promise<void>;
  loadSyncHistory: () => Promise<void>;
  
  // MTN MoMo service
  initializeMoMoService: () => Promise<boolean>;
  processPayment: (amount: string, phoneNumber: string, description: string) => Promise<MoMoTransactionStatusResponse | null>;
  
  // State management
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (type: 'accounts' | 'transactions' | 'syncing', isLoading: boolean) => void;
  setSyncStatus: (status: 'idle' | 'fetching' | 'storing' | 'completed' | 'error') => void;
}

interface MoMoStore extends MoMoState, MoMoActions {}

export const useMoMoStore = create<MoMoStore>((set, get) => ({
  // Initial state
  linkedAccounts: [],
  isLoadingAccounts: false,
  momoTransactions: [],
  isLoadingTransactions: false,
  isSyncing: false,
  syncStatus: 'idle',
  lastSyncTime: null,
  syncHistory: [],
  error: null,
  isInitialized: false,

  // State management actions
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  setLoading: (type, isLoading) => {
    const updates: Partial<MoMoState> = {};
    
    switch (type) {
      case 'accounts':
        updates.isLoadingAccounts = isLoading;
        break;
      case 'transactions':
        updates.isLoadingTransactions = isLoading;
        break;
      case 'syncing':
        updates.isSyncing = isLoading;
        break;
    }
    
    set(updates);
  },

  setSyncStatus: (status) => set({ syncStatus: status }),

  // Account management actions
  loadLinkedAccounts: async () => {
    const { setLoading, setError } = get();
    
    setLoading('accounts', true);
    setError(null);

    try {
      const response = await transactionSyncService.getMoMoAccounts();
      
      if (response.error) {
        setError(response.error.message);
        return;
      }

      set({ linkedAccounts: response.data || [] });
    } catch (error) {
      setError('Failed to load linked accounts');
      console.error('Error loading linked accounts:', error);
    } finally {
      setLoading('accounts', false);
    }
  },

  linkAccount: async (userId: string, request: MoMoAccountLinkRequest) => {
    const { setLoading, setError, loadLinkedAccounts } = get();
    
    setLoading('accounts', true);
    setError(null);

    try {
      const response = await mtnMomoService.linkAccount(
        userId,
        request.phone_number,
        request.account_name
      );
      
      if (!response.success) {
        setError(response.error || 'Failed to link account');
        return false;
      }

      // Reload accounts to get updated list
      await loadLinkedAccounts();
      return true;
    } catch (error) {
      setError('Failed to link account');
      console.error('Error linking account:', error);
      return false;
    } finally {
      setLoading('accounts', false);
    }
  },

  deactivateAccount: async (accountId) => {
    const { setLoading, setError, loadLinkedAccounts } = get();
    
    setLoading('accounts', true);
    setError(null);

    try {
      const response = await transactionSyncService.deactivateMoMoAccount(accountId);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      // Reload accounts to get updated list
      await loadLinkedAccounts();
      return true;
    } catch (error) {
      setError('Failed to deactivate account');
      console.error('Error deactivating account:', error);
      return false;
    } finally {
      setLoading('accounts', false);
    }
  },

  // Transaction sync actions
  syncTransactions: async () => {
    const { setLoading, setError, loadMoMoTransactions, loadSyncHistory } = get();
    
    setLoading('syncing', true);
    setError(null);

    try {
      const response = await transactionSyncService.syncTransactionsFromMoMo();
      
      if (response.error) {
        setError(response.error.message);
        return null;
      }

      // Update last sync time
      set({ lastSyncTime: new Date().toISOString() });
      
      // Reload data
      await Promise.all([
        loadMoMoTransactions(),
        loadSyncHistory()
      ]);

      return response.data || null;
    } catch (error) {
      setError('Failed to sync transactions');
      console.error('Error syncing transactions:', error);
      return null;
    } finally {
      setLoading('syncing', false);
    }
  },

  syncAccountWithProgress: async (accountId: string) => {
    const { setLoading, setError, setSyncStatus, loadMoMoTransactions, loadSyncHistory } = get();
    
    setLoading('syncing', true);
    setError(null);
    setSyncStatus('idle');

    try {
      const response = await mtnSyncService.syncAccountWithProgress(
        accountId,
        (progress) => setSyncStatus(progress.status)
      );
      
      if (response.error) {
        setSyncStatus('error');
        setError(response.error.message);
        return null;
      }

      // Update last sync time
      set({ lastSyncTime: new Date().toISOString() });
      
      // Reload data
      await Promise.all([
        loadMoMoTransactions(),
        loadSyncHistory()
      ]);

      return response.data || null;
    } catch (error) {
      setSyncStatus('error');
      setError('Failed to sync transactions');
      console.error('Error syncing transactions:', error);
      return null;
    } finally {
      setLoading('syncing', false);
    }
  },

  loadMoMoTransactions: async () => {
    const { setLoading, setError } = get();
    
    setLoading('transactions', true);
    setError(null);

    try {
      const response = await transactionSyncService.getMoMoTransactions();
      
      if (response.error) {
        setError(response.error.message);
        return;
      }

      set({ momoTransactions: response.data || [] });
    } catch (error) {
      setError('Failed to load MoMo transactions');
      console.error('Error loading MoMo transactions:', error);
    } finally {
      setLoading('transactions', false);
    }
  },

  loadSyncHistory: async () => {
    const { setError } = get();
    
    setError(null);

    try {
      const response = await transactionSyncService.getSyncHistory();
      
      if (response.error) {
        setError(response.error.message);
        return;
      }

      set({ syncHistory: response.data || [] });
    } catch (error) {
      setError('Failed to load sync history');
      console.error('Error loading sync history:', error);
    }
  },

  // MTN MoMo service actions
  initializeMoMoService: async () => {
    const { setError } = get();
    
    setError(null);

    try {
      const response = await mtnMomoService.initializeForSandbox();
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }

      set({ isInitialized: true });
      return true;
    } catch (error) {
      setError('Failed to initialize MTN MoMo service');
      console.error('Error initializing MTN MoMo service:', error);
      return false;
    }
  },

  processPayment: async (amount, phoneNumber, description) => {
    const { setError } = get();
    
    setError(null);

    try {
      const response = await mtnMomoService.processPayment(amount, phoneNumber, description);
      
      if (response.error) {
        setError(response.error.message);
        return null;
      }

      return response.data || null;
    } catch (error) {
      setError('Failed to process payment');
      console.error('Error processing payment:', error);
      return null;
    }
  },
}));

// Selector hooks for specific use cases
export const useMoMoAccountsData = () => {
  const linkedAccounts = useMoMoStore(state => state.linkedAccounts);
  const isLoadingAccounts = useMoMoStore(state => state.isLoadingAccounts);
  const error = useMoMoStore(state => state.error);

  const activeAccounts = linkedAccounts.filter(account => account.is_active);
  const hasLinkedAccounts = linkedAccounts.length > 0;
  const hasActiveAccounts = activeAccounts.length > 0;

  return {
    linkedAccounts,
    activeAccounts,
    isLoadingAccounts,
    error,
    hasLinkedAccounts,
    hasActiveAccounts,
  };
};

export const useMoMoTransactionsData = () => {
  const momoTransactions = useMoMoStore(state => state.momoTransactions);
  const isLoadingTransactions = useMoMoStore(state => state.isLoadingTransactions);
  const isSyncing = useMoMoStore(state => state.isSyncing);
  const lastSyncTime = useMoMoStore(state => state.lastSyncTime);
  const error = useMoMoStore(state => state.error);

  const totalMoMoIncome = momoTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalMoMoExpenses = momoTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const autoCategorizedCount = momoTransactions.filter(t => t.auto_categorized).length;
  const manualCategorizedCount = momoTransactions.filter(t => !t.auto_categorized).length;

  return {
    momoTransactions,
    isLoadingTransactions,
    isSyncing,
    lastSyncTime,
    error,
    totalMoMoIncome,
    totalMoMoExpenses,
    autoCategorizedCount,
    manualCategorizedCount,
    totalTransactions: momoTransactions.length,
  };
};

export const useMoMoSyncData = () => {
  const syncHistory = useMoMoStore(state => state.syncHistory);
  const isSyncing = useMoMoStore(state => state.isSyncing);
  const lastSyncTime = useMoMoStore(state => state.lastSyncTime);
  const isInitialized = useMoMoStore(state => state.isInitialized);

  const lastSync = syncHistory.length > 0 ? syncHistory[0] : null;
  const successfulSyncs = syncHistory.filter(sync => sync.sync_status === 'success').length;
  const failedSyncs = syncHistory.filter(sync => sync.sync_status === 'failed').length;

  return {
    syncHistory,
    isSyncing,
    lastSyncTime,
    isInitialized,
    lastSync,
    successfulSyncs,
    failedSyncs,
    totalSyncs: syncHistory.length,
  };
};