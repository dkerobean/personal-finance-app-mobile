interface FormatCurrencyOptions {
  currency?: string;
  compact?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export const formatCurrency = (
  amount: number, 
  options: FormatCurrencyOptions | string = {}
): string => {
  // Handle legacy string parameter for backward compatibility
  const opts: FormatCurrencyOptions = typeof options === 'string' 
    ? { currency: options } 
    : options;
  
  const {
    currency = 'GHS', // Default to Ghana Cedis
    compact = false,
    minimumFractionDigits,
    maximumFractionDigits,
  } = opts;
  
  // Validate amount
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₵0.00'; // Return default GHS format for invalid amounts
  }
  
  try {
    // Use Ghana locale when available, fallback to en-US
    const locale = 'en-GH';
    
    const formatOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currency === 'GHS' ? 'GHS' : currency,
    };
    
    // Add compact notation if requested
    if (compact) {
      formatOptions.notation = 'compact';
      formatOptions.maximumFractionDigits = 1;
    } else {
      if (minimumFractionDigits !== undefined) {
        formatOptions.minimumFractionDigits = minimumFractionDigits;
      }
      if (maximumFractionDigits !== undefined) {
        formatOptions.maximumFractionDigits = maximumFractionDigits;
      } else {
        formatOptions.maximumFractionDigits = 2;
      }
    }
    
    const formatter = new Intl.NumberFormat(locale, formatOptions);
    let formatted = formatter.format(amount);
    
    // For Ghana Cedis, ensure we show the ₵ symbol correctly
    if (currency === 'GHS') {
      // Replace GHS with ₵ symbol if the formatter doesn't handle it properly
      formatted = formatted.replace(/GHS\s?/, '₵');
      // If no currency symbol is shown, add ₵
      if (!formatted.includes('₵') && !formatted.includes('GHS')) {
        formatted = '₵' + formatted;
      }
    }
    
    return formatted;
    
  } catch (error) {
    console.warn('Currency formatting error:', error);
    // Fallback formatting for Ghana Cedis
    const fallbackAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    
    if (compact && fallbackAmount >= 1000000) {
      return `${sign}₵${(fallbackAmount / 1000000).toFixed(1)}M`;
    } else if (compact && fallbackAmount >= 1000) {
      return `${sign}₵${(fallbackAmount / 1000).toFixed(1)}K`;
    } else {
      return `${sign}₵${fallbackAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }
};

export const formatDate = (date: Date | string): string => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    // Validate date
    if (!d || isNaN(d.getTime())) {
      return 'Invalid Date';
    }
    
    // Use Ghana locale when possible
    return d.toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Invalid Date';
  }
};

export const formatDateRelative = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - d.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return formatDate(d);
  }
};