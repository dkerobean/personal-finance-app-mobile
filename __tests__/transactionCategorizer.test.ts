import { transactionCategorizer } from '@/services/transactionCategorizer';
import { TransactionType } from '@/types/mtnMomo';

// Mock the enum for testing
const MockTransactionType = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const;

describe('Transaction Categorizer', () => {
  describe('extractMerchantName', () => {
    it('should extract merchant name from payer message', async () => {
      const payerMessage = 'Payment to KFC Accra Mall for lunch';
      const payeeNote = 'Food purchase';

      const merchantName = transactionCategorizer.extractMerchantName(payerMessage, payeeNote);

      expect(merchantName).toBe('KFC Accra Mall');
    });

    it('should extract merchant name from payee note', async () => {
      const payerMessage = 'Payment for services';
      const payeeNote = 'Shoprite grocery shopping';

      const merchantName = transactionCategorizer.extractMerchantName(payerMessage, payeeNote);

      expect(merchantName).toBe('Shoprite');
    });

    it('should handle missing merchant information', async () => {
      const payerMessage = 'Payment';
      const payeeNote = 'Transaction';

      const merchantName = transactionCategorizer.extractMerchantName(payerMessage, payeeNote);

      expect(merchantName).toBe('Unknown Merchant');
    });

    it('should extract merchant from various formats', async () => {
      const testCases = [
        {
          input: 'Uber ride to Accra Mall',
          expected: 'Uber',
        },
        {
          input: 'MTN airtime purchase',
          expected: 'MTN',
        },
        {
          input: 'Vodafone data bundle',
          expected: 'Vodafone',
        },
        {
          input: 'ECG electricity bill',
          expected: 'ECG',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const merchantName = transactionCategorizer.extractMerchantName(input);
        expect(merchantName).toBe(expected);
      });
    });
  });

  describe('categorizeTransaction', () => {
    it('should categorize food and dining transactions', async () => {
      const description = 'KFC Accra Mall lunch';
      const amount = 25.50;
      const payer = { partyIdType: 'MSISDN', partyId: '233241234567' };
      const merchantName = 'KFC';

      const result = transactionCategorizer.categorizeTransaction(
        description,
        amount,
        payer,
        merchantName
      );

      expect(result.category_id).toBe('food_dining');
      expect(result.suggested_type).toBe(MockTransactionType.EXPENSE);
      expect(result.confidence).toBeGreaterThan(80);
    });

    it('should categorize transportation transactions', async () => {
      const description = 'Uber ride to work';
      const amount = 15.00;
      const payer = { partyIdType: 'MSISDN', partyId: '233241234567' };
      const merchantName = 'Uber';

      const result = transactionCategorizer.categorizeTransaction(
        description,
        amount,
        payer,
        merchantName
      );

      expect(result.category_id).toBe('transportation');
      expect(result.suggested_type).toBe(MockTransactionType.EXPENSE);
      expect(result.confidence).toBeGreaterThan(80);
    });

    it('should categorize utility bills', async () => {
      const description = 'ECG electricity bill payment';
      const amount = 100.00;
      const payer = { partyIdType: 'MSISDN', partyId: '233241234567' };
      const merchantName = 'ECG';

      const result = transactionCategorizer.categorizeTransaction(
        description,
        amount,
        payer,
        merchantName
      );

      expect(result.category_id).toBe('utilities');
      expect(result.suggested_type).toBe(MockTransactionType.EXPENSE);
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('should categorize shopping transactions', async () => {
      const description = 'Shoprite grocery shopping';
      const amount = 75.00;
      const payer = { partyIdType: 'MSISDN', partyId: '233241234567' };
      const merchantName = 'Shoprite';

      const result = transactionCategorizer.categorizeTransaction(
        description,
        amount,
        payer,
        merchantName
      );

      expect(result.category_id).toBe('shopping');
      expect(result.suggested_type).toBe(MockTransactionType.EXPENSE);
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('should categorize salary income', async () => {
      const description = 'Monthly salary deposit from Company XYZ';
      const amount = 2000.00;
      const payer = { partyIdType: 'MSISDN', partyId: '233241234567' };
      const merchantName = 'Company XYZ';

      const result = transactionCategorizer.categorizeTransaction(
        description,
        amount,
        payer,
        merchantName
      );

      expect(result.category_id).toBe('salary');
      expect(result.suggested_type).toBe(MockTransactionType.INCOME);
      expect(result.confidence).toBeGreaterThan(80);
    });

    it('should categorize business income', async () => {
      const description = 'Payment from client for services';
      const amount = 500.00;
      const payer = { partyIdType: 'MSISDN', partyId: '233241234567' };
      const merchantName = 'Client ABC';

      const result = transactionCategorizer.categorizeTransaction(
        description,
        amount,
        payer,
        merchantName
      );

      expect(result.category_id).toBe('business_income');
      expect(result.suggested_type).toBe(MockTransactionType.INCOME);
      expect(result.confidence).toBeGreaterThan(60);
    });

    it('should categorize money transfers', async () => {
      const description = 'Transfer to friend';
      const amount = 50.00;
      const payer = { partyIdType: 'MSISDN', partyId: '233241234567' };
      const merchantName = 'Friend';

      const result = transactionCategorizer.categorizeTransaction(
        description,
        amount,
        payer,
        merchantName
      );

      expect(result.category_id).toBe('transfer_sent');
      expect(result.suggested_type).toBe(MockTransactionType.EXPENSE);
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('should handle unknown transactions with default category', async () => {
      const description = 'Unknown transaction';
      const amount = 10.00;
      const payer = { partyIdType: 'MSISDN', partyId: '233241234567' };
      const merchantName = 'Unknown';

      const result = transactionCategorizer.categorizeTransaction(
        description,
        amount,
        payer,
        merchantName
      );

      expect(result.category_id).toBe('shopping'); // Default fallback
      expect(result.suggested_type).toBe(MockTransactionType.EXPENSE);
      expect(result.confidence).toBeLessThan(50);
    });

    it('should consider amount in categorization', async () => {
      // High amount salary-like transaction
      const highAmountResult = transactionCategorizer.categorizeTransaction(
        'Monthly payment',
        2500.00,
        { partyIdType: 'MSISDN', partyId: '233241234567' },
        'Employer'
      );

      // Low amount miscellaneous transaction
      const lowAmountResult = transactionCategorizer.categorizeTransaction(
        'Small payment',
        5.00,
        { partyIdType: 'MSISDN', partyId: '233241234567' },
        'Unknown'
      );

      expect(highAmountResult.confidence).toBeGreaterThan(lowAmountResult.confidence);
    });

    it('should handle Ghanaian-specific merchants', async () => {
      const ghanaianMerchants = [
        { merchant: 'Melcom', expectedCategory: 'shopping' },
        { merchant: 'Palace Shopping Mall', expectedCategory: 'shopping' },
        { merchant: 'Trotro fare', expectedCategory: 'transportation' },
        { merchant: 'Kantanka', expectedCategory: 'transportation' },
        { merchant: 'Ghana Water Company', expectedCategory: 'utilities' },
        { merchant: 'AirtelTigo', expectedCategory: 'utilities' },
      ];

      ghanaianMerchants.forEach(({ merchant, expectedCategory }) => {
        const result = transactionCategorizer.categorizeTransaction(
          `Payment to ${merchant}`,
          50.00,
          { partyIdType: 'MSISDN', partyId: '233241234567' },
          merchant
        );

        expect(result.category_id).toBe(expectedCategory);
      });
    });

    it('should handle multiple keywords in description', async () => {
      const description = 'KFC lunch and Uber ride home';
      const amount = 40.00;
      const payer = { partyIdType: 'MSISDN', partyId: '233241234567' };
      const merchantName = 'KFC';

      const result = transactionCategorizer.categorizeTransaction(
        description,
        amount,
        payer,
        merchantName
      );

      // Should prioritize the first/stronger match
      expect(result.category_id).toBe('food_dining');
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('should return high confidence for exact keyword matches', async () => {
      const exactMatches = [
        { keyword: 'salary', category: 'salary', type: MockTransactionType.INCOME },
        { keyword: 'fuel', category: 'transportation', type: MockTransactionType.EXPENSE },
        { keyword: 'hospital', category: 'healthcare', type: MockTransactionType.EXPENSE },
        { keyword: 'school fees', category: 'education', type: MockTransactionType.EXPENSE },
      ];

      exactMatches.forEach(({ keyword, category, type }) => {
        const result = transactionCategorizer.categorizeTransaction(
          `Payment for ${keyword}`,
          100.00,
          { partyIdType: 'MSISDN', partyId: '233241234567' },
          'Test Merchant'
        );

        expect(result.category_id).toBe(category);
        expect(result.suggested_type).toBe(type);
        expect(result.confidence).toBeGreaterThan(80);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty descriptions', async () => {
      const result = transactionCategorizer.categorizeTransaction(
        '',
        10.00,
        { partyIdType: 'MSISDN', partyId: '233241234567' },
        ''
      );

      expect(result.category_id).toBeDefined();
      expect(result.suggested_type).toBeDefined();
      expect(result.confidence).toBeLessThan(30);
    });

    it('should handle very long descriptions', async () => {
      const longDescription = 'A'.repeat(1000) + ' KFC lunch';
      const result = transactionCategorizer.categorizeTransaction(
        longDescription,
        25.00,
        { partyIdType: 'MSISDN', partyId: '233241234567' },
        'KFC'
      );

      expect(result.category_id).toBe('food_dining');
    });

    it('should handle special characters in descriptions', async () => {
      const description = 'Payment to KFC @#$%^&*() for lunch!!!';
      const result = transactionCategorizer.categorizeTransaction(
        description,
        25.00,
        { partyIdType: 'MSISDN', partyId: '233241234567' },
        'KFC'
      );

      expect(result.category_id).toBe('food_dining');
    });

    it('should handle zero amounts', async () => {
      const result = transactionCategorizer.categorizeTransaction(
        'Zero amount transaction',
        0,
        { partyIdType: 'MSISDN', partyId: '233241234567' },
        'Test'
      );

      expect(result.category_id).toBeDefined();
      expect(result.confidence).toBeLessThan(50);
    });

    it('should handle negative amounts', async () => {
      const result = transactionCategorizer.categorizeTransaction(
        'Refund transaction',
        -25.00,
        { partyIdType: 'MSISDN', partyId: '233241234567' },
        'Store'
      );

      expect(result.category_id).toBeDefined();
      expect(result.suggested_type).toBe(MockTransactionType.INCOME); // Refunds are income
    });
  });
});