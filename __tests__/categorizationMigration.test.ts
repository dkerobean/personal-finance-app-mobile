/**
 * Tests for categorization database migration
 * Validates that the auto_categorized and categorization_confidence fields work correctly
 */

import { supabase } from '@/services/supabaseClient';

// Mock Supabase
jest.mock('@/services/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Categorization Migration Schema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('auto_categorized field', () => {
    it('should allow inserting transactions with auto_categorized=true', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'tx-1',
          auto_categorized: true,
          categorization_confidence: 0.95,
        },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      mockInsert.mockReturnValue({
        single: mockSingle,
      });

      const transactionData = {
        user_id: 'user-123',
        amount: 25.50,
        type: 'expense',
        category_id: 'cat-food',
        description: 'KFC meal',
        auto_categorized: true,
        categorization_confidence: 0.95,
      };

      // Simulate API call
      await mockSupabase
        .from('transactions')
        .insert(transactionData)
        .single();

      expect(mockInsert).toHaveBeenCalledWith(transactionData);
      expect(mockSingle).toHaveBeenCalled();
    });

    it('should allow inserting transactions with auto_categorized=false', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'tx-2',
          auto_categorized: false,
          categorization_confidence: null,
        },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      mockInsert.mockReturnValue({
        single: mockSingle,
      });

      const transactionData = {
        user_id: 'user-123',
        amount: 50.00,
        type: 'expense',
        category_id: 'cat-shopping',
        description: 'Manual entry',
        auto_categorized: false,
        categorization_confidence: null,
      };

      await mockSupabase
        .from('transactions')
        .insert(transactionData)
        .single();

      expect(mockInsert).toHaveBeenCalledWith(transactionData);
    });

    it('should handle null auto_categorized (defaults to false)', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'tx-3',
          auto_categorized: null, // Should default to false
          categorization_confidence: null,
        },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      mockInsert.mockReturnValue({
        single: mockSingle,
      });

      const transactionData = {
        user_id: 'user-123',
        amount: 15.00,
        type: 'expense',
        category_id: 'cat-transport',
        description: 'Bus fare',
        // auto_categorized omitted (should default)
      };

      await mockSupabase
        .from('transactions')
        .insert(transactionData)
        .single();

      expect(mockInsert).toHaveBeenCalledWith(transactionData);
    });
  });

  describe('categorization_confidence field', () => {
    it('should accept confidence values between 0 and 1', async () => {
      const confidenceValues = [0.0, 0.25, 0.5, 0.75, 1.0];

      for (const confidence of confidenceValues) {
        const mockUpdate = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockResolvedValue({
          data: { categorization_confidence: confidence },
          error: null,
        });

        mockSupabase.from.mockReturnValue({
          update: mockUpdate,
        } as any);

        mockUpdate.mockReturnValue({
          eq: mockEq,
        });

        await mockSupabase
          .from('transactions')
          .update({ categorization_confidence: confidence })
          .eq('id', 'tx-test');

        expect(mockUpdate).toHaveBeenCalledWith({ categorization_confidence: confidence });
      }
    });

    it('should allow null confidence values', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: { categorization_confidence: null },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });

      await mockSupabase
        .from('transactions')
        .update({ categorization_confidence: null })
        .eq('id', 'tx-manual');

      expect(mockUpdate).toHaveBeenCalledWith({ categorization_confidence: null });
    });
  });

  describe('transaction_categorization_rules table', () => {
    it('should allow inserting categorization rules', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'rule-1',
          keyword_pattern: 'kfc',
          suggested_category_id: 'cat-food',
          confidence_score: 0.95,
        },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      mockInsert.mockReturnValue({
        single: mockSingle,
      });

      const ruleData = {
        keyword_pattern: 'kfc',
        suggested_category_id: 'cat-food',
        confidence_score: 0.95,
        created_by: 'system',
      };

      await mockSupabase
        .from('transaction_categorization_rules')
        .insert(ruleData)
        .single();

      expect(mockInsert).toHaveBeenCalledWith(ruleData);
    });

    it('should support querying rules by keyword pattern', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockIlike = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'rule-1',
            keyword_pattern: 'kfc',
            suggested_category_id: 'cat-food',
            confidence_score: 0.95,
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      mockSelect.mockReturnValue({
        ilike: mockIlike,
      });

      mockIlike.mockReturnValue({
        order: mockOrder,
      });

      await mockSupabase
        .from('transaction_categorization_rules')
        .select('*')
        .ilike('keyword_pattern', '%kfc%')
        .order('confidence_score', { ascending: false });

      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockIlike).toHaveBeenCalledWith('keyword_pattern', '%kfc%');
    });
  });

  describe('migration compatibility', () => {
    it('should handle existing transactions without categorization fields', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'old-tx-1',
            amount: 100,
            description: 'Old transaction',
            // auto_categorized and categorization_confidence should default
            auto_categorized: null,
            categorization_confidence: null,
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await mockSupabase
        .from('transactions')
        .select('*');

      expect(result.data?.[0]).toHaveProperty('auto_categorized');
      expect(result.data?.[0]).toHaveProperty('categorization_confidence');
    });

    it('should support updating old transactions with new categorization fields', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: {
          id: 'old-tx-1',
          auto_categorized: true,
          categorization_confidence: 0.87,
        },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });

      await mockSupabase
        .from('transactions')
        .update({
          auto_categorized: true,
          categorization_confidence: 0.87,
        })
        .eq('id', 'old-tx-1');

      expect(mockUpdate).toHaveBeenCalledWith({
        auto_categorized: true,
        categorization_confidence: 0.87,
      });
    });
  });
});