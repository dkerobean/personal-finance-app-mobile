# Implementation Guide - HillFusion-Inspired Design System

## Getting Started

This guide provides practical examples for implementing the HillFusion-inspired clean, minimal design system in the Kippo React Native application.

## Setup

### 1. Theme Provider Setup

First, wrap your app with the `ThemeProvider`:

```typescript
// App.tsx
import React from 'react';
import { ThemeProvider } from '@/theme';
import { MainNavigator } from './navigation';

export default function App() {
  return (
    <ThemeProvider>
      <MainNavigator />
    </ThemeProvider>
  );
}
```

### 2. Using the Theme Hook

Access theme values in any component:

```typescript
import { useTheme } from '@/theme';

const MyComponent = () => {
  const theme = useTheme();
  
  return (
    <View style={{
      padding: theme.spacing[6],
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
    }}>
      {/* Component content */}
    </View>
  );
};
```

## Component Usage Examples

### Text Components

```typescript
import { Text, Heading1, Heading2, BodyText, FinancialAmount, Caption } from '@/components/ui';

const TextExample = () => (
  <View>
    {/* Page title */}
    <Heading1>Dashboard</Heading1>
    
    {/* Section header */}
    <Heading2 style={{ marginTop: 32, marginBottom: 16 }}>
      Recent Transactions
    </Heading2>
    
    {/* Body text */}
    <BodyText color="secondary">
      Your latest financial activity
    </BodyText>
    
    {/* Financial amount */}
    <FinancialAmount color="income" align="right">
      $1,234.56
    </FinancialAmount>
    
    {/* Caption */}
    <Caption color="muted">
      Last updated 5 minutes ago
    </Caption>
  </View>
);
```

### Card Components

```typescript
import { Card, FinancialSummaryCard } from '@/components/ui';

const CardExample = () => (
  <View>
    {/* Basic card */}
    <Card variant="default" style={{ marginBottom: 16 }}>
      <Text variant="h4">Account Overview</Text>
      <Text variant="body" color="secondary">
        Your financial summary for this month
      </Text>
    </Card>
    
    {/* Interactive card */}
    <Card 
      variant="outlined" 
      interactive 
      onPress={() => console.log('Card pressed')}
      style={{ marginBottom: 16 }}
    >
      <Text variant="body">Tap to view details</Text>
    </Card>
    
    {/* Financial summary card */}
    <FinancialSummaryCard
      title="Total Balance"
      amount={12345.67}
      trend={{
        value: 12.5,
        period: 'this month',
        direction: 'up'
      }}
      subtitle="Across all accounts"
    />
  </View>
);
```

### Button Components

```typescript
import { Button, PrimaryButton, SecondaryButton, OutlineButton } from '@/components/ui';

const ButtonExample = () => (
  <View style={{ gap: 16 }}>
    {/* Primary action */}
    <PrimaryButton 
      fullWidth 
      onPress={() => console.log('Primary action')}
    >
      Transfer Money
    </PrimaryButton>
    
    {/* Secondary action */}
    <SecondaryButton 
      size="large"
      onPress={() => console.log('Secondary action')}
    >
      View Details
    </SecondaryButton>
    
    {/* Outline button */}
    <OutlineButton 
      size="small"
      disabled
    >
      Coming Soon
    </OutlineButton>
    
    {/* Loading state */}
    <Button 
      variant="primary" 
      loading 
      onPress={() => {}}
    >
      Processing...
    </Button>
  </View>
);
```

## Financial Component Patterns

### Transaction List Item

```typescript
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  date: string;
  category: string;
}

const TransactionItem: React.FC<{ transaction: Transaction }> = ({ 
  transaction 
}) => {
  const theme = useTheme();
  
  const getAmountColor = (type: Transaction['type']) => {
    switch (type) {
      case 'income': return theme.colors.financial.income;
      case 'expense': return theme.colors.financial.expense;
      case 'transfer': return theme.colors.financial.transfer;
    }
  };
  
  return (
    <TouchableOpacity 
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="body" weight="medium">
          {transaction.description}
        </Text>
        <Text variant="bodySmall" color="secondary">
          {transaction.category}
        </Text>
      </View>
      
      <View style={{ alignItems: 'flex-end' }}>
        <Text 
          variant="financialMedium"
          style={{ color: getAmountColor(transaction.type) }}
        >
          {transaction.type === 'expense' ? '-' : ''}
          ${Math.abs(transaction.amount).toFixed(2)}
        </Text>
        <Text variant="caption" color="muted">
          {transaction.date}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
```

### Account Balance Display

```typescript
import { View } from 'react-native';
import { Text, Card } from '@/components/ui';
import { useTheme } from '@/theme';

interface AccountBalanceProps {
  accountName: string;
  balance: number;
  lastUpdated: string;
}

const AccountBalance: React.FC<AccountBalanceProps> = ({
  accountName,
  balance,
  lastUpdated
}) => {
  const theme = useTheme();
  
  return (
    <Card variant="default">
      <View style={{ alignItems: 'center', gap: theme.spacing[3] }}>
        <Text variant="body" color="secondary">
          {accountName}
        </Text>
        
        <Text 
          variant="financialLarge"
          style={{ 
            fontSize: theme.typography.fontSize['5xl'],
            fontWeight: theme.typography.fontWeight.bold,
          }}
        >
          ${balance.toLocaleString('en-US', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          })}
        </Text>
        
        <Text variant="caption" color="muted">
          Last updated {lastUpdated}
        </Text>
      </View>
    </Card>
  );
};
```

## Screen Layout Patterns

### Dashboard Layout

```typescript
import React from 'react';
import { View, ScrollView, SafeAreaView } from 'react-native';
import { Heading1, BodyText, Card } from '@/components/ui';
import { useTheme } from '@/theme';

const DashboardScreen = () => {
  const theme = useTheme();
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          padding: theme.layout.screenPadding,
          gap: theme.spacing[6]
        }}
      >
        {/* Header */}
        <View>
          <Heading1>Dashboard</Heading1>
          <BodyText color="secondary" style={{ marginTop: theme.spacing[2] }}>
            Your financial overview
          </BodyText>
        </View>
        
        {/* Balance Card */}
        <AccountBalance 
          accountName="Total Balance"
          balance={12345.67}
          lastUpdated="2 minutes ago"
        />
        
        {/* Quick Actions */}
        <Card variant="outlined">
          <Text variant="h4" style={{ marginBottom: theme.spacing[4] }}>
            Quick Actions
          </Text>
          <View style={{ gap: theme.spacing[3] }}>
            <PrimaryButton onPress={() => {}}>
              Transfer Money
            </PrimaryButton>
            <SecondaryButton onPress={() => {}}>
              View Transactions
            </SecondaryButton>
          </View>
        </Card>
        
        {/* Recent Transactions */}
        <Card variant="default">
          <Text variant="h4" style={{ marginBottom: theme.spacing[4] }}>
            Recent Activity
          </Text>
          {/* Transaction list would go here */}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};
```

### Form Layout

```typescript
import React, { useState } from 'react';
import { View, TextInput, SafeAreaView } from 'react-native';
import { Heading2, Text, PrimaryButton, SecondaryButton } from '@/components/ui';
import { useTheme } from '@/theme';

const TransferForm = () => {
  const theme = useTheme();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ 
        flex: 1, 
        padding: theme.layout.screenPadding,
        gap: theme.spacing[6]
      }}>
        {/* Header */}
        <View>
          <Heading2>Send Money</Heading2>
          <Text variant="body" color="secondary">
            Transfer funds to another account
          </Text>
        </View>
        
        {/* Form Fields */}
        <View style={{ gap: theme.spacing[5] }}>
          {/* Recipient Field */}
          <View>
            <Text 
              variant="label" 
              style={{ marginBottom: theme.spacing[2] }}
            >
              Recipient
            </Text>
            <TextInput
              style={theme.componentStyles.input.default}
              value={recipient}
              onChangeText={setRecipient}
              placeholder="Enter recipient name or account"
              placeholderTextColor={theme.colors.text.muted}
            />
          </View>
          
          {/* Amount Field */}
          <View>
            <Text 
              variant="label" 
              style={{ marginBottom: theme.spacing[2] }}
            >
              Amount
            </Text>
            <TextInput
              style={theme.componentStyles.input.currency}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor={theme.colors.text.muted}
            />
          </View>
        </View>
        
        {/* Actions */}
        <View style={{ gap: theme.spacing[3], marginTop: 'auto' }}>
          <PrimaryButton 
            fullWidth
            onPress={() => console.log('Send money')}
            disabled={!amount || !recipient}
          >
            Send Money
          </PrimaryButton>
          <SecondaryButton 
            fullWidth
            onPress={() => console.log('Cancel')}
          >
            Cancel
          </SecondaryButton>
        </View>
      </View>
    </SafeAreaView>
  );
};
```

## Best Practices

### 1. Consistent Spacing

Always use theme spacing tokens:

```typescript
// Good
<View style={{ 
  padding: theme.spacing[4],
  marginBottom: theme.spacing[6],
  gap: theme.spacing[3]
}}>

// Bad
<View style={{ 
  padding: 16,
  marginBottom: 24,
  gap: 12
}}>
```

### 2. Color Usage

Use semantic color names and minimal palette:

```typescript
// Good - Semantic colors
<Text color="primary">Main content</Text>
<Text color="secondary">Supporting text</Text>
<Text color="income">+$123.45</Text>

// Bad - Direct colors
<Text style={{ color: '#000000' }}>Content</Text>
<Text style={{ color: '#16a34a' }}>+$123.45</Text>
```

### 3. Typography Hierarchy

Use the predefined text variants:

```typescript
// Good - Semantic variants
<Text variant="h1">Page Title</Text>
<Text variant="h2">Section Header</Text>
<Text variant="body">Content</Text>
<Text variant="financialMedium">$1,234.56</Text>

// Bad - Custom styling
<Text style={{ fontSize: 56, fontWeight: '800' }}>Title</Text>
<Text style={{ fontSize: 20, fontFamily: 'monospace' }}>$1,234.56</Text>
```

### 4. Component Composition

Build complex interfaces using the base components:

```typescript
const FinancialCard = ({ title, amount, trend }) => (
  <Card variant="default">
    <Text variant="body" color="secondary" style={{ marginBottom: 8 }}>
      {title}
    </Text>
    <Text variant="financialLarge">
      ${amount.toFixed(2)}
    </Text>
    {trend && (
      <Text 
        variant="caption" 
        color={trend.direction === 'up' ? 'income' : 'expense'}
        style={{ marginTop: 4 }}
      >
        {trend.direction === 'up' ? '+' : ''}{trend.value}%
      </Text>
    )}
  </Card>
);
```

### 5. Financial Data Formatting

Always use proper formatting for financial data:

```typescript
// Currency formatting
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Percentage formatting
const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};
```

## Common Patterns

### Loading States

```typescript
const [loading, setLoading] = useState(false);

return (
  <Card variant="default">
    {loading ? (
      <View style={{ alignItems: 'center', padding: theme.spacing[6] }}>
        <ActivityIndicator size="large" color={theme.colors.text.secondary} />
        <Text variant="body" color="secondary" style={{ marginTop: theme.spacing[3] }}>
          Loading...
        </Text>
      </View>
    ) : (
      // Normal content
      <AccountBalance balance={balance} />
    )}
  </Card>
);
```

### Error States

```typescript
const ErrorMessage = ({ message }: { message: string }) => (
  <Card variant="outlined">
    <View style={{ alignItems: 'center', padding: theme.spacing[4] }}>
      <Text variant="body" color="error" style={{ textAlign: 'center' }}>
        {message}
      </Text>
    </View>
  </Card>
);
```

### Empty States

```typescript
const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <View style={{ 
    alignItems: 'center', 
    padding: theme.spacing[8],
    gap: theme.spacing[4]
  }}>
    <Text variant="h4" color="secondary">
      {title}
    </Text>
    <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
      {description}
    </Text>
  </View>
);
```

---

*This implementation guide ensures consistent application of the HillFusion-inspired clean, minimal design system throughout the Kippo application, maintaining professional aesthetics while providing excellent usability for financial data management.*