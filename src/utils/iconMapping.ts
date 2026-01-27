/**
 * Icon Mapping Utility - Ionicons Edition
 * Provides unique Ionicons for each finance category
 */

// Category to Ionicons mapping - each category gets a unique icon
export const CATEGORY_ICONS: Record<string, string> = {
  // Income Categories
  'salary': 'cash-outline',
  'freelance': 'briefcase-outline',
  'investments': 'trending-up-outline',
  'rental income': 'home-outline',
  'business': 'business-outline',
  'other income': 'add-circle-outline',
  
  // Food & Dining
  'food & dining': 'restaurant-outline',
  'food': 'restaurant-outline',
  'groceries': 'cart-outline',
  'restaurants': 'fast-food-outline',
  'coffee': 'cafe-outline',
  
  // Transportation
  'transportation': 'car-outline',
  'transport': 'car-outline',
  'fuel': 'speedometer-outline',
  'public transit': 'bus-outline',
  'taxi': 'car-sport-outline',
  'flights': 'airplane-outline',
  
  // Shopping
  'shopping': 'bag-outline',
  'clothing': 'shirt-outline',
  'electronics': 'phone-portrait-outline',
  'gifts & donations': 'gift-outline',
  'gifts': 'gift-outline',
  
  // Home & Bills
  'housing': 'home-outline',
  'rent': 'key-outline',
  'utilities': 'flash-outline',
  'electricity': 'flash-outline',
  'water': 'water-outline',
  'internet': 'wifi-outline',
  'phone': 'call-outline',
  
  // Entertainment
  'entertainment': 'film-outline',
  'movies': 'videocam-outline',
  'music': 'musical-notes-outline',
  'games': 'game-controller-outline',
  'streaming': 'tv-outline',
  'subscriptions': 'repeat-outline',
  
  // Health & Fitness
  'healthcare': 'medkit-outline',
  'health': 'heart-outline',
  'medical': 'medkit-outline',
  'fitness': 'fitness-outline',
  'gym': 'barbell-outline',
  'pharmacy': 'bandage-outline',
  
  // Education
  'education': 'school-outline',
  'books': 'book-outline',
  'courses': 'library-outline',
  'tuition': 'school-outline',
  
  // Personal
  'personal care': 'person-outline',
  'beauty': 'sparkles-outline',
  'haircut': 'cut-outline',
  
  // Finance
  'banking': 'card-outline',
  'insurance': 'shield-checkmark-outline',
  'taxes': 'document-text-outline',
  'savings': 'wallet-outline',
  'loans': 'cash-outline',
  
  // Communication
  'communication': 'chatbubbles-outline',
  
  // Travel
  'travel': 'airplane-outline',
  'vacation': 'sunny-outline',
  'hotels': 'bed-outline',
  
  // Pets
  'pets': 'paw-outline',
  
  // Other
  'other': 'ellipsis-horizontal-circle-outline',
  'miscellaneous': 'apps-outline',
};

// All available Ionicons for category selection
export const AVAILABLE_ICONS = [
  // Finance
  'cash-outline',
  'wallet-outline',
  'card-outline',
  'trending-up-outline',
  'trending-down-outline',
  
  // Food
  'restaurant-outline',
  'fast-food-outline',
  'cafe-outline',
  'cart-outline',
  'nutrition-outline',
  
  // Transport
  'car-outline',
  'car-sport-outline',
  'bus-outline',
  'airplane-outline',
  'bicycle-outline',
  'train-outline',
  'boat-outline',
  
  // Shopping
  'bag-outline',
  'basket-outline',
  'gift-outline',
  'shirt-outline',
  'pricetag-outline',
  
  // Home
  'home-outline',
  'key-outline',
  'flash-outline',
  'water-outline',
  'wifi-outline',
  'bed-outline',
  
  // Entertainment
  'film-outline',
  'tv-outline',
  'musical-notes-outline',
  'game-controller-outline',
  'headset-outline',
  'videocam-outline',
  
  // Health
  'heart-outline',
  'medkit-outline',
  'fitness-outline',
  'barbell-outline',
  'bandage-outline',
  
  // Education
  'school-outline',
  'book-outline',
  'library-outline',
  'document-text-outline',
  
  // Work
  'briefcase-outline',
  'business-outline',
  'laptop-outline',
  'desktop-outline',
  
  // Communication
  'call-outline',
  'chatbubbles-outline',
  'mail-outline',
  
  // Personal
  'person-outline',
  'people-outline',
  'sparkles-outline',
  'cut-outline',
  
  // Nature & Pets
  'paw-outline',
  'leaf-outline',
  'sunny-outline',
  'flower-outline',
  
  // Other
  'apps-outline',
  'grid-outline',
  'ellipsis-horizontal-circle-outline',
  'add-circle-outline',
  'shield-checkmark-outline',
  'repeat-outline',
  'star-outline',
  'flag-outline',
];

/**
 * Maps a category name to its Ionicons icon
 * Falls back to 'apps-outline' if no mapping found
 */
export function mapCategoryToIcon(categoryName?: string): string {
  if (!categoryName) return 'apps-outline';
  
  const normalized = categoryName.toLowerCase().trim();
  
  // Direct match
  if (CATEGORY_ICONS[normalized]) {
    return CATEGORY_ICONS[normalized];
  }
  
  // Partial match
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return icon;
    }
  }
  
  return 'apps-outline';
}

/**
 * Maps a stored icon name to a valid Ionicons name
 * Handles legacy MaterialIcons names and falls back to category name matching
 */
export function mapIconName(iconName?: string, categoryName?: string): string {
  if (!iconName && !categoryName) return 'apps-outline';
  
  // Expanded Legacy MaterialIcons to Ionicons mapping
  const legacyMap: Record<string, string> = {
    // General
    'category': 'apps-outline',
    'more-horiz': 'ellipsis-horizontal-outline',
    'label': 'pricetag-outline',
    'bookmark': 'bookmark-outline',
    'star': 'star-outline',
    
    // Food & Dining
    'restaurant': 'restaurant-outline',
    'local-cafe': 'cafe-outline',
    'local-pizza': 'pizza-outline',
    'fastfood': 'fast-food-outline',
    'local-bar': 'beer-outline',
    'lunch-dining': 'restaurant-outline',
    'ramen-dining': 'restaurant-outline',
    'local-dining': 'restaurant-outline',
    'icecream': 'ice-cream-outline',
    
    // Shopping
    'shopping-cart': 'cart-outline',
    'shopping-bag': 'bag-outline',
    'local-mall': 'storefront-outline',
    'storefront': 'storefront-outline',
    'card-giftcard': 'gift-outline',
    'shopping-basket': 'basket-outline',
    'redeem': 'gift-outline',
    'sell': 'pricetag-outline',
    'store': 'storefront-outline',
    
    // Transportation
    'directions-car': 'car-outline',
    'local-gas-station': 'speedometer-outline',
    'directions-bus': 'bus-outline',
    'flight': 'airplane-outline',
    'commute': 'car-outline',
    'two-wheeler': 'bicycle-outline',
    'train': 'train-outline',
    'directions-boat': 'boat-outline',
    'electric-bike': 'bicycle-outline',
    'airport-shuttle': 'bus-outline',
    
    // Home & Utilities
    'home': 'home-outline',
    'power': 'flash-outline',
    'water': 'water-outline',
    'wifi': 'wifi-outline',
    'build': 'construct-outline',
    'lightbulb': 'bulb-outline',
    'electrical-services': 'flash-outline',
    'roofing': 'home-outline',
    'chair': 'bed-outline',
    'weekend': 'bed-outline',
    'flash-on': 'flash-outline',
    
    // Entertainment
    'movie': 'film-outline',
    'sports-esports': 'game-controller-outline',
    'music-note': 'musical-notes-outline',
    'celebration': 'sparkles-outline',
    'theaters': 'film-outline',
    'casino': 'dice-outline',
    'sports-bar': 'beer-outline',
    'nightlife': 'moon-outline',
    'sports-soccer': 'football-outline',
    'sports-basketball': 'basketball-outline',
    
    // Health & Fitness
    'local-hospital': 'medkit-outline',
    'fitness-center': 'fitness-outline',
    'spa': 'sparkles-outline',
    'medical-services': 'medkit-outline',
    'healing': 'heart-outline',
    'vaccines': 'bandage-outline',
    'medication': 'bandage-outline',
    'health-and-safety': 'shield-checkmark-outline',
    'self-improvement': 'person-outline',
    
    // Finance
    'attach-money': 'cash-outline',
    'savings': 'wallet-outline',
    'account-balance': 'business-outline',
    'credit-card': 'card-outline',
    'receipt': 'receipt-outline',
    'payments': 'card-outline',
    'request-quote': 'document-text-outline',
    'money': 'cash-outline',
    'paid': 'checkmark-circle-outline',
    'currency-exchange': 'swap-horizontal-outline',
    'local-atm': 'cash-outline',
    'account-balance-wallet': 'wallet-outline',
    
    // Education & Work
    'school': 'school-outline',
    'work': 'briefcase-outline',
    'laptop': 'laptop-outline',
    'business-center': 'business-outline',
    'menu-book': 'book-outline',
    'auto-stories': 'book-outline',
    'class': 'school-outline',
    'engineering': 'construct-outline',
    'science': 'flask-outline',
    'book': 'book-outline',
    
    // Family & Lifestyle
    'family-restroom': 'people-outline',
    'pets': 'paw-outline',
    'child-care': 'happy-outline',
    'volunteer-activism': 'heart-outline',
    'favorite': 'heart-outline',
    'cake': 'gift-outline',
    'person': 'person-outline',
    'people': 'people-outline',
    
    // Communication
    'phone': 'call-outline',
    'local-phone': 'call-outline',
    'email': 'mail-outline',
    'mail': 'mail-outline',
    'chat': 'chatbubbles-outline',
    
    // Other
    'subscriptions': 'repeat-outline',
    'receipt-long': 'receipt-outline',
    'trending-up': 'trending-up-outline',
    'trending-down': 'trending-down-outline',
  };
  
  // Check legacy mapping first
  if (iconName && legacyMap[iconName]) {
    return legacyMap[iconName];
  }
  
  // Check if already valid Ionicons
  if (iconName && AVAILABLE_ICONS.includes(iconName)) {
    return iconName;
  }
  
  // Fallback to category name mapping
  if (categoryName) {
    return mapCategoryToIcon(categoryName);
  }
  
  // If icon name looks like it might be a category
  if (iconName) {
    const categoryResult = mapCategoryToIcon(iconName);
    if (categoryResult !== 'apps-outline') {
      return categoryResult;
    }
  }
  
  // Ultimate fallback
  return 'apps-outline';
}

/**
 * Get all available icons for selection
 */
export function getAvailableIcons(): string[] {
  return AVAILABLE_ICONS;
}

/**
 * Check if an icon name is valid
 */
export function isValidIcon(iconName: string): boolean {
  return AVAILABLE_ICONS.includes(iconName);
}
