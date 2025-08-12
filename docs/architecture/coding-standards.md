# Coding Standards

## Overview
This document defines the coding standards and best practices for the Personal Finance App project. These standards ensure code consistency, maintainability, and quality across both the React Native frontend and Supabase backend.

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

### Component Structure
```typescript
// 1. Imports
import React from 'react';
import { View } from 'react-native';

// 2. Types/Interfaces
interface Props {
  title: string;
  onPress: () => void;
}

// 3. Component
export const MyComponent: React.FC<Props> = ({ title, onPress }) => {
  // 4. State
  const [loading, setLoading] = useState(false);
  
  // 5. Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // 6. Event handlers
  const handlePress = () => {
    setLoading(true);
    onPress();
  };
  
  // 7. Render
  return (
    <View>
      {/* JSX */}
    </View>
  );
};
```

## Error Handling

### Frontend Error Handling
- **Centralized Error Handling**: Use a central error handler service
- **User-Friendly Messages**: Always display user-friendly error messages
- **Error Boundaries**: Implement React Error Boundaries for critical sections
- **Logging**: Log errors with context for debugging

```typescript
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
- **Lazy Loading**: Use lazy loading for screens and heavy components
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
- [ ] Error handling is implemented correctly
- [ ] Security best practices are followed
- [ ] Tests are included and passing
- [ ] Performance considerations are addressed
- [ ] Code is properly documented

### Review Standards
- **Constructive Feedback**: Provide specific, actionable feedback
- **Knowledge Sharing**: Share relevant best practices and patterns
- **Consistency**: Ensure code follows project standards
- **Security Review**: Check for potential security vulnerabilities