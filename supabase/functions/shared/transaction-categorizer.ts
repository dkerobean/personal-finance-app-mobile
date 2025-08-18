// Transaction categorization engine for edge functions
// This is a simplified version of the client-side categorizer for use in Supabase edge functions

interface CategoryClassificationResult {
  category_id: string;
  confidence: number;
  reasons: string[];
  suggested_type: 'income' | 'expense';
}

interface TransactionCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  keywords: string[];
  merchant_patterns: RegExp[];
}

// Predefined categories for Ghanaian context
const INCOME_CATEGORIES: TransactionCategory[] = [
  {
    id: 'salary',
    name: 'Salary',
    type: 'income',
    keywords: ['salary', 'wages', 'pay', 'payroll', 'employment', 'monthly pay'],
    merchant_patterns: [/salary/i, /wages/i, /payroll/i, /monthly.*pay/i]
  },
  {
    id: 'business_income',
    name: 'Business Income',
    type: 'income',
    keywords: ['business', 'sale', 'revenue', 'client', 'customer', 'service', 'invoice'],
    merchant_patterns: [/business/i, /sale/i, /client/i, /invoice/i]
  },
  {
    id: 'transfer_received',
    name: 'Money Received',
    type: 'income',
    keywords: ['transfer', 'received', 'sent to you', 'deposit', 'refund', 'cashback'],
    merchant_patterns: [/transfer/i, /received/i, /deposit/i, /refund/i]
  }
];

const EXPENSE_CATEGORIES: TransactionCategory[] = [
  {
    id: 'food_dining',
    name: 'Food & Dining',
    type: 'expense',
    keywords: ['restaurant', 'food', 'dining', 'breakfast', 'lunch', 'dinner', 'cafe', 'bar', 'kfc', 'mcdonald', 'pizza'],
    merchant_patterns: [/restaurant/i, /cafe/i, /bar/i, /food/i, /kfc/i, /mcdonald/i, /pizza/i]
  },
  {
    id: 'transportation',
    name: 'Transportation',
    type: 'expense',
    keywords: ['uber', 'bolt', 'taxi', 'trotro', 'fuel', 'petrol', 'transport', 'bus', 'kantanka'],
    merchant_patterns: [/uber/i, /bolt/i, /taxi/i, /trotro/i, /fuel/i, /petrol/i, /transport/i, /kantanka/i]
  },
  {
    id: 'utilities',
    name: 'Utilities',
    type: 'expense',
    keywords: ['electricity', 'water', 'ecg', 'gwcl', 'internet', 'phone', 'airtime', 'data', 'airteltigo'],
    merchant_patterns: [/ecg/i, /gwcl/i, /electricity/i, /water/i, /internet/i, /airtime/i, /data/i, /airteltigo/i]
  },
  {
    id: 'shopping',
    name: 'Shopping',
    type: 'expense',
    keywords: ['shop', 'store', 'market', 'purchase', 'buy', 'clothing', 'fashion', 'melcom', 'palace shopping'],
    merchant_patterns: [/shop/i, /store/i, /market/i, /fashion/i, /clothing/i, /melcom/i, /palace.*shopping/i]
  },
  {
    id: 'transfer_sent',
    name: 'Money Sent',
    type: 'expense',
    keywords: ['transfer to friend', 'sent money', 'send money', 'remittance', 'money transfer'],
    merchant_patterns: [/transfer.*friend/i, /sent.*money/i, /send money/i, /remittance/i, /money transfer/i]
  },
  {
    id: 'banking_fees',
    name: 'Banking & Fees',
    type: 'expense',
    keywords: ['fee', 'charge', 'bank', 'service charge', 'commission', 'penalty'],
    merchant_patterns: [/fee/i, /charge/i, /commission/i, /penalty/i, /service charge/i]
  }
];

const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

class TransactionCategorizer {
  private categories: TransactionCategory[];

  constructor() {
    this.categories = ALL_CATEGORIES;
  }

  categorizeTransaction(
    description: string,
    amount: number,
    payerInfo?: { partyIdType: string; partyId: string },
    merchantName?: string
  ): CategoryClassificationResult {
    const text = this.normalizeText(description + ' ' + (merchantName || ''));
    const reasons: string[] = [];
    let bestMatch: { category: TransactionCategory; score: number } | null = null;

    // Analyze each category
    for (const category of this.categories) {
      const score = this.calculateCategoryScore(text, category, amount, reasons);
      
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { category, score };
      }
    }

    // Determine confidence level
    const confidence = bestMatch ? Math.min(bestMatch.score * 100, 95) : 0;

    // If confidence is too low, use fallback logic
    if (confidence < 40) {
      const fallbackResult = this.fallbackCategorization(text, amount);
      return {
        category_id: fallbackResult.category_id,
        confidence: fallbackResult.confidence,
        reasons: [...reasons, ...fallbackResult.reasons],
        suggested_type: fallbackResult.suggested_type
      };
    }

    return {
      category_id: bestMatch!.category.id,
      confidence,
      reasons,
      suggested_type: bestMatch!.category.type
    };
  }

  private calculateCategoryScore(
    text: string,
    category: TransactionCategory,
    amount: number,
    reasons: string[]
  ): number {
    let score = 0;

    // Keyword matching (60% weight)
    const keywordMatches = category.keywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (keywordMatches.length > 0) {
      score += 0.6;
      reasons.push(`Matched keywords: ${keywordMatches.join(', ')}`);
    }

    // Pattern matching (20% weight) 
    if (category.merchant_patterns) {
      const patternMatches = category.merchant_patterns.filter(pattern => 
        pattern.test(text)
      );
      
      if (patternMatches.length > 0) {
        score += 0.2;
        reasons.push(`Matched merchant patterns`);
      }
    }

    // Amount-based hints (20% weight)
    const amountScore = this.getAmountScore(amount, category);
    score += 0.2 * amountScore;

    return score;
  }

  private getAmountScore(amount: number, category: TransactionCategory): number {
    const amountPatterns: Record<string, { min: number; max: number; typical: number[] }> = {
      'utilities': { min: 10, max: 500, typical: [20, 50, 100, 150] },
      'transportation': { min: 2, max: 100, typical: [5, 10, 15, 20, 30] },
      'food_dining': { min: 5, max: 200, typical: [10, 15, 25, 35, 50] },
      'salary': { min: 500, max: 10000, typical: [1000, 2000, 3000, 5000] },
      'shopping': { min: 1, max: 2000, typical: [10, 25, 50, 100, 200] },
      'banking_fees': { min: 0.5, max: 20, typical: [1, 2, 5] }
    };

    const pattern = amountPatterns[category.id];
    if (!pattern) return 0.5;

    if (amount >= pattern.min && amount <= pattern.max) {
      const isTypical = pattern.typical.some(typical => 
        Math.abs(amount - typical) <= typical * 0.2
      );
      return isTypical ? 1.0 : 0.7;
    }

    return 0.2;
  }

  private fallbackCategorization(text: string, amount: number): CategoryClassificationResult {
    if (!text.trim() || text.length === 0) {
      return {
        category_id: 'shopping',
        confidence: 20,
        reasons: ['Empty description - manual categorization recommended'],
        suggested_type: 'expense'
      };
    }
    
    if (amount === 0) {
      return {
        category_id: 'banking_fees',
        confidence: 30,
        reasons: ['Zero amount transaction - may be fee or adjustment'],
        suggested_type: 'expense'
      };
    }
    
    if (amount < 5) {
      return {
        category_id: 'banking_fees',
        confidence: 45,
        reasons: ['Small amount suggests fee or service charge'],
        suggested_type: 'expense'
      };
    }

    if (amount > 1000) {
      const hasIncomeIndicators = ['deposit', 'salary', 'pay', 'income', 'received']
        .some(word => text.toLowerCase().includes(word));
      
      if (hasIncomeIndicators) {
        return {
          category_id: 'salary',
          confidence: 65,
          reasons: ['Large amount with income indicators'],
          suggested_type: 'income'
        };
      } else {
        return {
          category_id: 'shopping',
          confidence: 55,
          reasons: ['Large amount suggests major purchase'],
          suggested_type: 'expense'
        };
      }
    }

    return {
      category_id: 'shopping',
      confidence: 40,
      reasons: ['Default categorization for unrecognized transaction'],
      suggested_type: 'expense'
    };
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  extractMerchantName(description: string, payeeNote?: string): string | undefined {
    const desc = description.trim();
    const note = (payeeNote || '').trim();
    const fullText = (desc + ' ' + note).trim();
    
    if (!fullText || (desc === 'Payment' && note === 'Transaction')) {
      return 'Unknown Merchant';
    }
    
    // Known merchant patterns
    const knownMerchants = [
      'uber', 'bolt', 'lyft', 'taxi',
      'kfc', 'mcdonald', 'pizza', 'burger',
      'mtn', 'vodafone', 'airteltigo', 'airtel',
      'ecg', 'gwcl', 'ghana water',
      'shoprite', 'melcom', 'palace',
      'netflix', 'spotify', 'youtube'
    ];
    
    const lowerText = fullText.toLowerCase();
    for (const merchant of knownMerchants) {
      if (lowerText.includes(merchant)) {
        const regex = new RegExp(merchant, 'i');
        const match = fullText.match(regex);
        if (match) {
          return match[0];
        }
      }
    }
    
    // Look for merchant names (first capitalized word that's not location-related)
    const descWords = desc.split(/\s+/);
    const locationWords = ['Mall', 'Street', 'Road', 'Avenue', 'Center', 'Centre', 'Plaza', 'Market'];
    
    for (const word of descWords) {
      if (word && 
          word.length > 2 && 
          /^[A-Z]/.test(word) && 
          !['Payment', 'Transaction', 'Transfer', 'From', 'To', 'For', 'At', 'The', 'And', 'Ride', 'Bill'].includes(word) &&
          !locationWords.includes(word)) {
        return word;
      }
    }
    
    return 'Unknown Merchant';
  }
}

export const transactionCategorizer = new TransactionCategorizer();