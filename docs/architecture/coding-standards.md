# Coding Standards

## Overview
This document defines the coding standards and best practices for the Kippo project, emphasizing clean, minimal design principles inspired by HillFusion's actual aesthetic. These standards ensure code consistency, maintainability, and quality while supporting a professional, minimal user interface across both the React Native frontend and Supabase backend.

## Language Standards

### TypeScript Configuration
- **Strict Mode**: Enable TypeScript strict mode across all projects
- **Type Safety**: All functions must have explicit return types
- **Interface Definitions**: Use interfaces for all data models and API contracts
- **No `any` Types**: Avoid using `any` type; use specific types or `unknown` when necessary

```typescript
// Good
interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
}

// Bad
const transaction: any = { id: "123", amount: 100 };
```

## Naming Conventions

### Files and Directories
- **Components**: PascalCase (e.g., `TransactionCard.tsx`)
- **Utilities/Services**: camelCase (e.g., `supabaseClient.ts`)
- **Test Files**: Match source file with `.test.` suffix (e.g., `TransactionCard.test.tsx`)
- **Directories**: kebab-case (e.g., `transaction-management/`)

### Code Elements
- **Variables/Functions**: camelCase (e.g., `getCurrentUser`, `transactionData`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `API_BASE_URL`, `MAX_RETRY_ATTEMPTS`)
- **Components**: PascalCase (e.g., `TransactionList`, `DashboardHeader`)
- **Interfaces/Types**: PascalCase with descriptive names (e.g., `UserProfile`, `TransactionFormData`)

## Code Organization

### Import Ordering
1. React/React Native imports
2. Third-party library imports
3. Internal service/utility imports
4. Component imports
5. Type-only imports (with `type` keyword)

```typescript
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Box, Button } from '@gluestack-ui/themed';
import { supabaseClient } from '@/services/supabaseClient';
import { TransactionCard } from '@/components/TransactionCard';
import type { Transaction, Category } from '@/types/models';
```

### Component Structure (HillFusion Clean Approach)
```typescript
// 1. Imports (System and Theme First)
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { Text, Button } from '@/components/ui';

// 2. Types/Interfaces (Clean, Minimal)
interface Props {
  title: string;
  onPress: () => void;
}

// 3. Component (Functional, Clean)
export const MyComponent: React.FC<Props> = ({ title, onPress }) => {
  const theme = useTheme();
  
  // 4. State (Minimal)
  const [loading, setLoading] = useState(false);
  
  // 5. Event handlers (Clean logic)
  const handlePress = () => {
    setLoading(true);
    onPress();
  };
  
  // 6. Render (Clean, Semantic)
  return (
    <View style={styles.container}>
      <Text variant="h3" style={{ marginBottom: theme.spacing[4] }}>
        {title}
      </Text>
      <Button onPress={handlePress} loading={loading}>
        Continue
      </Button>
    </View>
  );
};

// 7. Styles (Theme-based, Minimal)
const styles = {
  container: {
    padding: 24,
    backgroundColor: '#ffffff',
  },
};
```

## Error Handling

### Frontend Error Handling (Clean UI)
- **Centralized Error Handling**: Use a central error handler service
- **Clean Error Display**: Show errors using the design system components
- **Error Boundaries**: Implement React Error Boundaries for critical sections
- **Minimal Error UI**: Use clean, professional error presentation

```typescript
// Clean error handling with design system
import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

export const ErrorMessage: React.FC<{ message: string }> = ({ message }) => {
  const theme = useTheme();
  
  return (
    <Text 
      variant="body" 
      color="error" 
      style={{ 
        padding: theme.spacing[4],
        textAlign: 'center',
      }}
    >
      {message}
    </Text>
  );
};

// Centralized error handling
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    console.error('API Error:', error.message);
    return 'An error occurred. Please try again.';
  }
  return 'An unexpected error occurred.';
};
```

### Backend Error Handling
- **Standardized Error Format**: Use consistent error response structure
- **Input Validation**: Validate all inputs before processing
- **No Sensitive Data**: Never expose sensitive data in error messages

```typescript
// Standardized error response
interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
```

## Design System Integration

### Theme Usage Standards
- **Theme Provider**: All components must use the theme system
- **Design Tokens**: Use theme tokens instead of hardcoded values
- **Component Library**: Prefer UI components from the design system
- **Minimal Styling**: Avoid complex visual effects, maintain clean aesthetic

```typescript
// Good - Using theme system
const MyComponent = () => {
  const theme = useTheme();
  return (
    <Card style={{ marginBottom: theme.spacing[4] }}>
      <Text variant="h4" color="primary">{title}</Text>
    </Card>
  );
};

// Bad - Hardcoded values
const MyComponent = () => {
  return (
    <View style={{ padding: 20, backgroundColor: '#f0f0f0' }}>
      <Text style={{ fontSize: 18, color: '#333' }}>{title}</Text>
    </View>
  );
};
```

## Security Standards

### Frontend Security
- **Secure Storage**: Use Expo SecureStore for sensitive data (JWT tokens, user credentials)
- **Input Validation**: Validate all user inputs on the client side
- **No Hardcoded Secrets**: Never hardcode API keys or sensitive data
- **Environment Variables**: Use environment variables for configuration

### Backend Security
- **Input Sanitization**: Sanitize all inputs before database operations
- **JWT Validation**: Validate JWT tokens on all protected endpoints
- **Row Level Security**: Use PostgreSQL RLS for data access control
- **Rate Limiting**: Implement rate limiting on sensitive endpoints

## Performance Standards

### Frontend Performance
- **Bundle Size**: Keep bundle size minimal; analyze with `expo-bundle-analyzer`
- **System Fonts**: Use system fonts for optimal performance (following HillFusion approach)
- **Minimal Effects**: Avoid complex animations and gradients for better performance
- **Theme Efficiency**: Leverage theme tokens for consistent, performant styling
- **Memoization**: Use React.memo, useMemo, and useCallback appropriately
- **Image Optimization**: Optimize images and use appropriate formats

### Backend Performance
- **Response Time**: Target <200ms response time for CRUD operations
- **Database Queries**: Use proper indexing and optimize queries
- **Caching**: Implement caching where appropriate

## Testing Standards

### Test Organization
- **Co-location**: Place test files next to source files
- **Naming**: Use `.test.` suffix for test files
- **Coverage**: Maintain minimum 80% test coverage
- **Test Types**: Follow testing pyramid (unit > integration > e2e)

### Test Structure
```typescript
describe('TransactionCard', () => {
  describe('when rendering', () => {
    it('should display transaction amount', () => {
      // Arrange
      const mockTransaction = { /* mock data */ };
      
      // Act
      const { getByText } = render(<TransactionCard transaction={mockTransaction} />);
      
      // Assert
      expect(getByText('$100.00')).toBeTruthy();
    });
  });
});
```

## Code Formatting

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### ESLint Rules
- Extend `@expo/eslint-config`
- Enable TypeScript rules
- Enforce consistent code style
- No unused variables or imports

## Git Commit Standards

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

### Commit Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `chore`: Maintenance tasks

### Examples
```
feat(auth): add user registration with email verification
fix(transactions): resolve category selection bug
docs(api): update authentication endpoints documentation
```

## Code Review Guidelines

### Review Checklist
- [ ] Code follows established naming conventions
- [ ] All functions have proper TypeScript types
- [ ] Theme system is used correctly (no hardcoded colors/spacing)
- [ ] Components use the UI library where appropriate
- [ ] Design follows HillFusion minimal aesthetic principles
- [ ] Error handling is implemented correctly with clean UI
- [ ] Security best practices are followed
- [ ] Tests are included and passing
- [ ] Performance considerations are addressed
- [ ] Code maintains accessibility standards
- [ ] Financial data uses proper formatting and monospace fonts

### Review Standards
- **Design Consistency**: Ensure adherence to HillFusion-inspired minimal aesthetic
- **Theme Usage**: Verify proper use of design system and theme tokens
- **Component Library**: Check for appropriate use of UI components
- **Accessibility**: Ensure components meet accessibility standards
- **Performance**: Review for optimal performance practices
- **Constructive Feedback**: Provide specific, actionable feedback
- **Knowledge Sharing**: Share relevant best practices and patterns
- **Security Review**: Check for potential security vulnerabilities

### Design-Specific Review Points
- **Color Usage**: Ensure minimal color palette is maintained
- **Typography**: Verify proper heading hierarchy and font usage
- **Spacing**: Check for consistent use of spacing tokens
- **Visual Complexity**: Ensure clean, minimal approach is maintained
- **Financial Data**: Verify proper formatting and display of financial information