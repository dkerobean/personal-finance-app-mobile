# Component System - Kippo Design System

## Overview
Directly inspired by HillFusion's actual clean, minimal design approach, our component system emphasizes clarity over decoration, content over complexity, and professional simplicity over visual effects. Each component is designed to present financial information with maximum clarity through strategic use of white space, clean typography, and minimal visual elements.

## Design Philosophy

### Minimal & Clean
Following HillFusion's true aesthetic, we eliminate unnecessary visual complexity in favor of clean, professional presentation that lets content speak for itself.

### Content-First Design
Every component prioritizes the information it contains over decorative elements, ensuring financial data is presented with clarity and professional credibility.

### System-Native Feel
Components use system fonts, minimal colors, and native interaction patterns to create a professional, trustworthy experience that feels integrated with the user's device.

## Base Components

### Cards

#### Base Card (HillFusion Minimal)
Clean, minimal container for information with subtle borders and generous white space.

```typescript
interface CardProps {
  variant?: 'default' | 'outlined' | 'flat';
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  children: React.ReactNode;
}
```

**Variants (Simplified):**
- **Default**: Clean white background with subtle border
- **Outlined**: Emphasized border for structure
- **Flat**: No border for seamless integration

**Visual Specifications:**
```css
.card-default {
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.card-outlined {
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  border: 2px solid #e5e7eb;
}

.card-flat {
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
}

.card-interactive {
  transition: border-color 0.2s ease;
  cursor: pointer;
}

.card-interactive:hover {
  border-color: #d1d5db;
}

.card-interactive:active {
  border-color: #9ca3af;
}
```

#### Financial Summary Card (Clean Approach)
Minimal card for displaying account balances with clear typography hierarchy.

```typescript
interface FinancialSummaryCardProps {
  title: string;
  amount: number;
  currency?: string;
  trend?: {
    value: number;
    period: string;
    direction: 'up' | 'down' | 'neutral';
  };
  subtitle?: string;
}
```

**Visual Specifications:**
```css
.financial-summary-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 32px 24px;
}

.financial-amount {
  font-family: system-monospace;
  font-size: 48px;
  font-weight: 700;
  line-height: 1.1;
  color: #000000;
  margin-bottom: 8px;
}

.financial-title {
  font-size: 16px;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 16px;
}

.financial-trend {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.trend-up { color: #16a34a; }
.trend-down { color: #dc2626; }
.trend-neutral { color: #4b5563; }
```

### Buttons

#### Button System (HillFusion Clean)
Minimal, professional buttons emphasizing clarity and system-native feel.

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  state?: 'default' | 'loading' | 'disabled';
  fullWidth?: boolean;
  children: React.ReactNode;
}
```

**Visual Specifications:**
```css
.button-primary {
  background: #000000;
  color: #ffffff;
  font-weight: 600;
  border-radius: 6px;
  padding: 12px 24px;
  border: none;
  font-size: 16px;
  line-height: 1.5;
  transition: background-color 0.2s ease;
}

.button-primary:hover {
  background: #374151;
}

.button-secondary {
  background: #ffffff;
  color: #000000;
  border: 1px solid #d1d5db;
  font-weight: 500;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 16px;
  transition: border-color 0.2s ease;
}

.button-secondary:hover {
  border-color: #9ca3af;
}

.button-outline {
  background: transparent;
  color: #000000;
  border: 1px solid #000000;
  font-weight: 500;
  border-radius: 6px;
  padding: 12px 24px;
  transition: all 0.2s ease;
}

.button-outline:hover {
  background: #000000;
  color: #ffffff;
}

.button-ghost {
  background: transparent;
  color: #4b5563;
  border: none;
  font-weight: 500;
  border-radius: 6px;
  padding: 12px 24px;
  transition: color 0.2s ease;
}

.button-ghost:hover {
  color: #000000;
}

.button-large {
  padding: 16px 32px;
  font-size: 18px;
}

.button-small {
  padding: 8px 16px;
  font-size: 14px;
}

.button-disabled {
  opacity: 0.5;
  pointer-events: none;
}
```

### Form Elements

#### Input Fields (Clean Design)
Minimal, professional input fields following HillFusion's clean aesthetic.

```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'currency';
  size?: 'medium' | 'large';
  state?: 'default' | 'focus' | 'error';
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorMessage?: string;
}
```

**Visual Specifications:**
```css
.input-container {
  margin-bottom: 24px;
}

.input-label {
  display: block;
  font-size: 16px;
  font-weight: 500;
  color: #000000;
  margin-bottom: 8px;
  line-height: 1.5;
}

.input-field {
  width: 100%;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 400;
  color: #000000;
  transition: border-color 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: #000000;
}

.input-field::placeholder {
  color: #9ca3af;
}

.input-currency {
  font-family: system-monospace;
  font-weight: 500;
  text-align: right;
}

.input-error {
  border-color: #dc2626;
}

.input-error:focus {
  border-color: #dc2626;
}

.input-large {
  padding: 16px 20px;
  font-size: 18px;
}

.input-helper {
  font-size: 14px;
  color: #4b5563;
  margin-top: 6px;
  line-height: 1.5;
}

.input-error-message {
  font-size: 14px;
  color: #dc2626;
  font-weight: 500;
  margin-top: 6px;
  line-height: 1.5;
}
```

## Financial Components

### Transaction List Item (Clean Design)
Minimal component for displaying transaction information with clear data hierarchy.

```typescript
interface TransactionItemProps {
  transaction: {
    id: string;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    description: string;
    merchant?: string;
    category: string;
    date: string;
    status?: 'pending' | 'completed' | 'failed';
  };
  onPress?: () => void;
}
```

**Visual Specifications:**
```css
.transaction-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s ease;
}

.transaction-item:hover {
  background: #f9fafb;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-content {
  flex: 1;
}

.transaction-title {
  font-size: 16px;
  font-weight: 500;
  color: #000000;
  margin-bottom: 4px;
  line-height: 1.5;
}

.transaction-category {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
}

.transaction-amount-container {
  text-align: right;
}

.transaction-amount {
  font-family: system-monospace;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  margin-bottom: 4px;
}

.amount-income { color: #16a34a; }
.amount-expense { color: #dc2626; }
.amount-transfer { color: #000000; }

.transaction-date {
  font-size: 14px;
  color: #9ca3af;
  line-height: 1.5;
}

.transaction-status {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  margin-top: 4px;
}

.status-pending {
  background: #fef3c7;
  color: #d97706;
}

.status-completed {
  background: #f0fdf4;
  color: #16a34a;
}

.status-failed {
  background: #fef2f2;
  color: #dc2626;
}
```

### Account Balance Card
Displays account balance with trend information and quick actions.

```typescript
interface AccountBalanceCardProps {
  account: {
    name: string;
    type: 'checking' | 'savings' | 'momo' | 'investment';
    balance: number;
    currency: string;
    lastUpdated: string;
  };
  trend?: {
    amount: number;
    percentage: number;
    period: string;
    direction: 'up' | 'down' | 'neutral';
  };
  quickActions?: Array<{
    label: string;
    icon: string;
    onPress: () => void;
  }>;
  onPress?: () => void;
}
```

### Budget Progress Indicator
Visual representation of budget usage with financial context.

```typescript
interface BudgetProgressProps {
  category: string;
  spent: number;
  budget: number;
  currency: string;
  period: string;
  status: 'on-track' | 'warning' | 'exceeded';
  remainingDays?: number;
}
```

**Visual Specifications:**
```css
.budget-progress-container {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
}

.budget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.budget-category {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.budget-status {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-on-track {
  background: #d1fae5;
  color: #047857;
}

.status-warning {
  background: #fef3c7;
  color: #92400e;
}

.status-exceeded {
  background: #fee2e2;
  color: #991b1b;
}

.budget-progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin: 12px 0;
}

.budget-progress-fill {
  height: 100%;
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.progress-on-track { background: #10b981; }
.progress-warning { background: #f59e0b; }
.progress-exceeded { background: #ef4444; }

.budget-amounts {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-spent {
  font-family: 'SF Mono', 'Roboto Mono', monospace;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.budget-total {
  font-family: 'SF Mono', 'Roboto Mono', monospace;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
}

.budget-remaining {
  font-size: 12px;
  color: #64748b;
  text-align: right;
  margin-top: 4px;
}
```

## Navigation Components

### Tab Bar (HillFusion Clean)
Minimal navigation with clear hierarchy and professional styling.

```typescript
interface TabBarProps {
  tabs: Array<{
    id: string;
    label: string;
    onPress: () => void;
  }>;
  activeTab: string;
}
```

**Visual Specifications:**
```css
.tab-bar {
  display: flex;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  padding: 16px;
}

.tab-item {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 16px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.tab-item-active {
  background: #000000;
  color: #ffffff;
}

.tab-item-inactive {
  color: #4b5563;
}

.tab-item:hover:not(.tab-item-active) {
  background: #f9fafb;
  color: #000000;
}

.tab-label {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
}
```

### Header Navigation
Clean, professional header design for financial application screens.

```typescript
interface HeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: {
    icon: string;
    onPress: () => void;
    label?: string;
  };
  rightActions?: Array<{
    icon: string;
    onPress: () => void;
    label?: string;
    badge?: number;
  }>;
  variant?: 'default' | 'transparent' | 'elevated';
}
```

## Data Visualization Components

### Financial Chart (Minimal Design)
Clean, minimal charts focusing on data clarity over visual effects.

```typescript
interface ChartProps {
  data: Array<{
    label: string;
    value: number;
  }>;
  type: 'bar' | 'line';
  period: string;
  showValues?: boolean;
  height?: number;
}
```

**Design Principles:**
- Use minimal colors (black, gray, single accent)
- Clean typography for labels and values
- Subtle grid lines and axes
- Focus on data readability over decoration

### Spending Summary (Clean List)
Simple list-based spending breakdown without complex visualizations.

```typescript
interface SpendingSummaryProps {
  categories: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
  totalSpent: number;
  currency: string;
  period: string;
}
```

**Visual Approach:**
- Clean list layout with clear typography
- Minimal use of color
- Percentage bars using subtle gray backgrounds
- Focus on data comprehension

## Accessibility Standards

### WCAG Compliance
All components meet WCAG 2.1 AA standards with enhanced considerations for financial data.

#### Touch Targets
- Minimum 44px touch targets for all interactive elements
- Enhanced touch targets (56px) for primary financial actions
- Adequate spacing between adjacent interactive elements

#### Screen Reader Support
```typescript
// Accessibility props for financial amounts
const accessibilityProps = {
  accessibilityRole: 'text',
  accessibilityLabel: `Balance: ${formatCurrency(balance)}`,
  accessibilityHint: 'Double tap to view detailed balance information',
};
```

#### High Contrast Support
All components automatically adapt to system high contrast preferences:

```css
@media (prefers-contrast: high) {
  .card-default {
    border: 2px solid #1e293b;
    background: #ffffff;
  }
  
  .button-primary {
    border: 2px solid #ffffff;
  }
}
```

## Animation & Transitions (Minimal Approach)

### Subtle Interactions
Minimal animations focused on usability rather than visual effects.

```css
.component-enter {
  opacity: 0;
}

.component-enter-active {
  opacity: 1;
  transition: opacity 0.2s ease;
}

.interactive-hover {
  transition: background-color 0.2s ease;
}

.interactive-hover:hover {
  background-color: #f9fafb;
}
```

### Loading States (Clean)
Simple, professional loading indicators.

```css
.skeleton-loader {
  background: #f3f4f6;
  border-radius: 4px;
}

.loading-spinner {
  border: 2px solid #f3f4f6;
  border-top: 2px solid #000000;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

## Implementation Guidelines

### Component Development
1. **Type Safety**: All components must have comprehensive TypeScript interfaces
2. **Accessibility**: Implement proper ARIA labels and screen reader support
3. **Performance**: Use React.memo for complex financial data components
4. **Testing**: Unit tests for all interactive behaviors and accessibility

### File Structure
```
src/components/
├── base/
│   ├── Card/
│   ├── Button/
│   └── Input/
├── financial/
│   ├── TransactionItem/
│   ├── AccountBalance/
│   └── BudgetProgress/
├── navigation/
│   ├── TabBar/
│   └── Header/
└── visualization/
    ├── Chart/
    └── SpendingBreakdown/
```

### Style Organization
```
src/styles/
├── components/
│   ├── _base.scss
│   ├── _financial.scss
│   └── _navigation.scss
├── tokens/
│   ├── _colors.scss
│   └── _typography.scss
└── utils/
    ├── _mixins.scss
    └── _animations.scss
```

---

*This component system directly reflects HillFusion's actual clean, minimal design philosophy, ensuring financial data is presented with maximum clarity and professional credibility through strategic use of white space, clean typography, and restrained visual elements.*