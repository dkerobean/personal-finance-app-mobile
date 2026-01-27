import { create } from 'zustand';
import type { ReportsState, ReportsActions } from '@/types/store';
import type { MonthlyReport, ReportComparison } from '@/types/models';
import { reportsApi } from '@/services/api/reports';

interface ReportsStore extends ReportsState, ReportsActions {}

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export const useReportsStore = create<ReportsStore>((set, get) => ({
  currentReport: null,
  reportHistory: new Map(),
  selectedMonth: getCurrentMonth(),
  availableMonths: [],
  comparison: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  setSelectedMonth: (month: string) => {
    set({ selectedMonth: month });
    
    const { reportHistory } = get();
    const cachedReport = reportHistory.get(month);
    
    if (cachedReport) {
      set({ currentReport: cachedReport });
    }
    // Note: fetchMonthlyReport should be called by the component with userId
  },

  fetchMonthlyReport: async (month: string, userId?: string) => {
    const { setLoading, setError, reportHistory } = get();
    
    // Don't fetch if no userId - this is expected during initial load
    if (!userId) {
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await reportsApi.getMonthlyReport(month, userId);
      
      if (response.error) {
        setError(response.error.message);
        return;
      }

      const report = response.data;
      if (report) {
        const newHistory = new Map(reportHistory);
        newHistory.set(month, report);
        
        set({ 
          currentReport: report,
          reportHistory: newHistory,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      setError('Failed to load monthly report');
      console.error('Error loading monthly report:', error);
    } finally {
      setLoading(false);
    }
  },

  refreshCurrentReport: async (userId?: string) => {
    const { selectedMonth, fetchMonthlyReport, reportHistory } = get();
    
    if (!userId) return;
    
    const newHistory = new Map(reportHistory);
    newHistory.delete(selectedMonth);
    set({ reportHistory: newHistory });
    
    await fetchMonthlyReport(selectedMonth, userId);
  },

  fetchReportComparison: async (currentMonth: string, previousMonth: string, userId?: string) => {
    const { setLoading, setError } = get();
    
    if (!userId) {
      setError('User ID is required');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await reportsApi.getReportComparison(currentMonth, previousMonth, userId);
      
      if (response.error) {
        setError(response.error.message);
        return;
      }

      const comparison = response.data;
      set({ comparison });
    } catch (error) {
      setError('Failed to load report comparison');
      console.error('Error loading report comparison:', error);
    } finally {
      setLoading(false);
    }
  },

  clearReportData: () => {
    set({
      currentReport: null,
      reportHistory: new Map(),
      comparison: null,
      error: null,
      lastUpdated: null
    });
  },

  getCurrentReport: () => {
    const { currentReport } = get();
    return currentReport;
  },

  getReportForMonth: (month: string) => {
    const { reportHistory } = get();
    return reportHistory.get(month) || null;
  },

  getAvailableMonths: () => {
    const { availableMonths } = get();
    return availableMonths;
  },

  getCachedReports: () => {
    const { reportHistory } = get();
    return reportHistory;
  },
}));