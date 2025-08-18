import type { 
  TransactionCategory, 
  CategoryClassificationResult,
  MoMoTransactionStatusResponse 
} from '@/types/mtnMomo';
import { TransactionType } from '@/types/mtnMomo';

// Predefined categories for Ghanaian context
const INCOME_CATEGORIES: TransactionCategory[] = [
  {
    id: 'salary',
    name: 'Salary',
    type: 'income',
    keywords: ['salary', 'wages', 'pay', 'payroll', 'employment', 'monthly pay', 'monthly payment'],
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
  },
  {
    id: 'investment_income',
    name: 'Investment Returns',
    type: 'income',
    keywords: ['dividend', 'interest', 'investment', 'return', 'profit', 'yield'],
    merchant_patterns: [/dividend/i, /interest/i, /investment/i, /return/i]
  },
  {
    id: 'freelance',
    name: 'Freelance Work',
    type: 'income',
    keywords: ['freelance', 'contract', 'gig', 'project', 'consultation', 'commission'],
    merchant_patterns: [/freelance/i, /contract/i, /gig/i, /commission/i]
  }
];

const EXPENSE_CATEGORIES: TransactionCategory[] = [
  {
    id: 'food_dining',
    name: 'Food & Dining',
    type: 'expense',
    keywords: ['restaurant', 'food', 'dining', 'breakfast', 'lunch', 'dinner', 'cafe', 'bar', 'kfc', 'mcdonald', 'pizza', 'burger'],
    merchant_patterns: [/restaurant/i, /cafe/i, /bar/i, /food/i, /kitchen/i, /eatery/i, /kfc/i, /mcdonald/i, /pizza/i, /burger/i]
  },
  {
    id: 'transportation',
    name: 'Transportation',
    type: 'expense',
    keywords: ['uber', 'bolt', 'taxi', 'trotro', 'fuel', 'petrol', 'transport', 'bus', 'metro', 'kantanka'],
    merchant_patterns: [/uber/i, /bolt/i, /taxi/i, /trotro/i, /fuel/i, /petrol/i, /transport/i, /kantanka/i]
  },
  {
    id: 'utilities',
    name: 'Utilities',
    type: 'expense',
    keywords: ['electricity', 'water', 'ecg', 'gwcl', 'internet', 'phone', 'airtime', 'data', 'ghana water company', 'airteltigo'],
    merchant_patterns: [/ecg/i, /gwcl/i, /electricity/i, /water/i, /internet/i, /airtime/i, /data/i, /ghana water/i, /airteltigo/i]
  },
  {
    id: 'shopping',
    name: 'Shopping',
    type: 'expense',
    keywords: ['shop', 'store', 'market', 'purchase', 'buy', 'clothing', 'fashion', 'melcom', 'palace shopping'],
    merchant_patterns: [/shop/i, /store/i, /market/i, /fashion/i, /clothing/i, /melcom/i, /palace.*shopping/i]
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    type: 'expense',
    keywords: ['hospital', 'clinic', 'doctor', 'pharmacy', 'medicine', 'medical', 'health'],
    merchant_patterns: [/hospital/i, /clinic/i, /pharmacy/i, /medical/i, /health/i, /doctor/i]
  },
  {
    id: 'education',
    name: 'Education',
    type: 'expense',
    keywords: ['school', 'university', 'tuition', 'books', 'education', 'course', 'training'],
    merchant_patterns: [/school/i, /university/i, /tuition/i, /education/i, /course/i, /training/i]
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    type: 'expense',
    keywords: ['movie', 'cinema', 'game', 'sport', 'music', 'concert', 'event', 'fun'],
    merchant_patterns: [/cinema/i, /movie/i, /game/i, /sport/i, /music/i, /concert/i, /event/i]
  },
  {
    id: 'transfer_sent',
    name: 'Money Sent',
    type: 'expense',
    keywords: ['transfer to friend', 'sent money', 'send money', 'remittance', 'money transfer'],
    merchant_patterns: [/transfer.*friend/i, /sent.*money/i, /send money/i, /remittance/i, /money transfer/i]
  },
  {
    id: 'subscription',
    name: 'Subscriptions',
    type: 'expense',
    keywords: ['netflix', 'spotify', 'subscription', 'monthly', 'recurring', 'premium'],
    merchant_patterns: [/netflix/i, /spotify/i, /subscription/i, /premium/i, /monthly/i]
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

  // Main categorization method
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

  // Calculate score for a specific category
  private calculateCategoryScore(
    text: string,
    category: TransactionCategory,
    amount: number,
    reasons: string[]
  ): number {
    let score = 0;

    // Keyword matching (60% weight) - Most important factor
    const keywordMatches = category.keywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (keywordMatches.length > 0) {
      // Give strong weight for any keyword match
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

    // Amount-based hints (10% weight)
    const amountScore = this.getAmountScore(amount, category);
    score += 0.1 * amountScore;

    // Context-based scoring (10% weight)
    const contextScore = this.getContextScore(text, category);
    score += 0.1 * contextScore;

    return score;
  }

  // Amount-based scoring logic
  private getAmountScore(amount: number, category: TransactionCategory): number {
    // Common amount patterns for different categories in Ghana (GHS)
    const amountPatterns: Record<string, { min: number; max: number; typical: number[] }> = {
      'utilities': { min: 10, max: 500, typical: [20, 50, 100, 150] },
      'transportation': { min: 2, max: 100, typical: [5, 10, 15, 20, 30] },
      'food_dining': { min: 5, max: 200, typical: [10, 15, 25, 35, 50] },
      'airtime': { min: 1, max: 50, typical: [5, 10, 20] },
      'salary': { min: 500, max: 10000, typical: [1000, 2000, 3000, 5000] },
      'shopping': { min: 1, max: 2000, typical: [10, 25, 50, 100, 200] },
      'transfer_sent': { min: 10, max: 5000, typical: [50, 100, 200, 500] },
      'banking_fees': { min: 0.5, max: 20, typical: [1, 2, 5] }
    };

    const pattern = amountPatterns[category.id];
    if (!pattern) return 0.5; // neutral score

    // Check if amount is within expected range
    if (amount >= pattern.min && amount <= pattern.max) {
      // Check if amount matches typical amounts
      const isTypical = pattern.typical.some(typical => 
        Math.abs(amount - typical) <= typical * 0.2
      );
      return isTypical ? 1.0 : 0.7;
    }

    return 0.2; // outside expected range
  }

  // Context-based scoring
  private getContextScore(text: string, category: TransactionCategory): number {
    const contextClues: Record<string, string[]> = {
      'food_dining': ['breakfast', 'lunch', 'dinner', 'meal', 'eat', 'drink'],
      'transportation': ['trip', 'ride', 'journey', 'travel', 'commute'],
      'utilities': ['bill', 'monthly', 'service', 'connection'],
      'shopping': ['purchase', 'buy', 'item', 'product', 'goods'],
      'entertainment': ['ticket', 'show', 'fun', 'leisure', 'enjoy'],
      'healthcare': ['appointment', 'prescription', 'treatment', 'checkup'],
      'education': ['fee', 'semester', 'academic', 'study', 'learn']
    };

    const clues = contextClues[category.id] || [];
    const matches = clues.filter(clue => text.toLowerCase().includes(clue));
    
    return matches.length > 0 ? Math.min(matches.length / clues.length, 1.0) : 0.5;
  }

  // Fallback categorization when confidence is low
  private fallbackCategorization(text: string, amount: number): CategoryClassificationResult {
    // Simple heuristics for unknown transactions
    
    // Handle edge cases first
    if (!text.trim() || text.length === 0) {
      return {
        category_id: 'shopping',
        confidence: 20, // Very low confidence for empty descriptions
        reasons: ['Empty description - manual categorization recommended'],
        suggested_type: 'expense'
      };
    }
    
    // Zero amounts should have very low confidence
    if (amount === 0) {
      return {
        category_id: 'banking_fees',
        confidence: 30, // Low confidence for zero amounts
        reasons: ['Zero amount transaction - may be fee or adjustment'],
        suggested_type: 'expense'
      };
    }
    
    // Very small amounts are likely fees or airtime
    if (amount < 5) {
      return {
        category_id: 'banking_fees',
        confidence: 45, // Reduced from 60 to 45
        reasons: ['Small amount suggests fee or service charge'],
        suggested_type: 'expense'
      };
    }

    // Large amounts might be salary or major purchases
    if (amount > 1000) {
      const hasIncomeIndicators = ['deposit', 'salary', 'pay', 'income', 'received']
        .some(word => text.toLowerCase().includes(word));
      
      if (hasIncomeIndicators) {
        return {
          category_id: 'salary',
          confidence: 65, // Slightly reduced from 70
          reasons: ['Large amount with income indicators'],
          suggested_type: 'income'
        };
      } else {
        return {
          category_id: 'shopping',
          confidence: 55, // Reduced from 60
          reasons: ['Large amount suggests major purchase'],
          suggested_type: 'expense'
        };
      }
    }

    // Medium amounts are likely general expenses
    return {
      category_id: 'shopping',
      confidence: 40, // Reduced from 45
      reasons: ['Default categorization for unrecognized transaction'],
      suggested_type: 'expense'
    };
  }

  // Utility method to normalize text for analysis
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  // Extract merchant name from transaction description
  extractMerchantName(description: string, payeeNote?: string): string | undefined {
    // Clean and combine the inputs
    const desc = description.trim();
    const note = (payeeNote || '').trim();
    const fullText = (desc + ' ' + note).trim();
    
    
    // Handle case where we have very generic/missing information
    if (!fullText || (desc === 'Payment' && note === 'Transaction')) {
      return 'Unknown Merchant';
    }
    
    // Known merchant patterns - highest priority for well-known brands
    const knownMerchants = [
      'uber', 'bolt', 'lyft', 'taxi',
      'kfc', 'mcdonald', 'pizza', 'burger',
      'mtn', 'vodafone', 'airteltigo', 'airtel',
      'ecg', 'gwcl', 'ghana water',
      'shoprite', 'melcom', 'palace',
      'netflix', 'spotify', 'youtube'
    ];
    
    // Priority 1: Look for known merchants first (highest priority)
    const words = fullText.split(/\s+/);
    for (const word of words) {
      const lowerWord = word.toLowerCase();
      if (knownMerchants.includes(lowerWord)) {
        // Check if this known merchant is part of a larger merchant name in a pattern
        const patterns = [
          /payment\s+to\s+([A-Za-z\s]+?)(?:\s+for|\s+at|\s+ride|\s+bill|$)/i,
          /from\s+([A-Za-z\s]+?)(?:\s+for|\s+at|\s+ride|\s+bill|$)/i,
        ];
        
        for (const pattern of patterns) {
          const match = fullText.match(pattern);
          if (match && match[1]) {
            const extractedName = match[1].trim();
            // If the extracted name contains our known merchant, prefer the full name
            if (extractedName.toLowerCase().includes(lowerWord) && extractedName.length > word.length) {
              return extractedName;
            }
          }
        }
        
        // Otherwise return just the known merchant
        return word;
      }
    }
    
    // Priority 2: Look for pattern-based extraction (for more specific results like "KFC Accra Mall")
    const patterns = [
      /payment\s+to\s+([A-Za-z\s]+?)(?:\s+for|\s+at|\s+ride|\s+bill|$)/i,
      /from\s+([A-Za-z\s]+?)(?:\s+for|\s+at|\s+ride|\s+bill|$)/i,
      /to\s+([A-Za-z\s]+?)(?:\s+for|\s+at|\s+ride|\s+bill|$)/i,
      /at\s+([A-Za-z\s]+?)(?:\s+for|\s+ride|\s+bill|$)/i,
    ];
    
    for (const pattern of patterns) {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        const merchant = match[1].trim();
        if (merchant.length > 2 && merchant.length < 50) {
          return merchant;
        }
      }
    }
    
    // Priority 3: Look for merchant names in the description (first capitalized word that's not location-related)
    const descWords = desc.split(/\s+/);
    const locationWords = ['Mall', 'Street', 'Road', 'Avenue', 'Center', 'Centre', 'Plaza', 'Market', 'Station', 'Terminal'];
    
    // First, check if any word is a known merchant (prioritize known merchants over locations)
    for (const word of descWords) {
      if (word && word.length > 2 && /^[A-Z]/.test(word)) {
        const lowerWord = word.toLowerCase();
        if (knownMerchants.includes(lowerWord)) {
          return word;
        }
      }
    }
    
    // Then check for other capitalized words (excluding known bad patterns)
    for (const word of descWords) {
      if (word && 
          word.length > 2 && 
          /^[A-Z]/.test(word) && 
          !['Payment', 'Transaction', 'Transfer', 'From', 'To', 'For', 'At', 'The', 'And', 'Ride', 'Bill', 'Purchase'].includes(word) &&
          !locationWords.includes(word)) {
        return word;
      }
    }
    
    // Priority 4: Look for merchant names in the payee note
    if (note) {
      const noteWords = note.split(/\s+/);
      const firstNoteWord = noteWords[0];
      
      // Check if first word in note looks like a merchant name (capitalized, not generic)
      if (firstNoteWord && 
          firstNoteWord.length > 2 && 
          /^[A-Z]/.test(firstNoteWord) && 
          !['Payment', 'Transaction', 'For', 'At', 'From', 'To', 'Service', 'Bill', 'Food', 'Grocery'].includes(firstNoteWord) &&
          !locationWords.includes(firstNoteWord)) {
        return firstNoteWord;
      }
    }
    
    // Priority 5: Look for any capitalized word that could be a merchant (excluding locations)
    const allWords = fullText.split(/\s+/);
    for (const word of allWords) {
      if (word.length > 2 && 
          /^[A-Z]/.test(word) && 
          !['Payment', 'Transaction', 'Transfer', 'From', 'To', 'For', 'At', 'The', 'And', 'With', 'Ride', 'Bill', 'Purchase'].includes(word) &&
          !locationWords.includes(word)) {
        return word;
      }
    }
    
    // Fallback
    return 'Unknown Merchant';
  }

  // Get all available categories
  getCategories(): TransactionCategory[] {
    return this.categories;
  }

  // Get categories by type
  getCategoriesByType(type: TransactionType): TransactionCategory[] {
    return this.categories.filter(cat => cat.type === type);
  }

  // Add custom category
  addCustomCategory(category: TransactionCategory): void {
    this.categories.push(category);
  }

  // Update existing category
  updateCategory(categoryId: string, updates: Partial<TransactionCategory>): boolean {
    const index = this.categories.findIndex(cat => cat.id === categoryId);
    if (index !== -1) {
      this.categories[index] = { ...this.categories[index], ...updates };
      return true;
    }
    return false;
  }
}

export const transactionCategorizer = new TransactionCategorizer();