# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FinWise is a React Native mobile application built with Expo for managing personal finances in Ghana. The app connects to local bank and mobile money accounts for automated transaction syncing, provides expense tracking, budgeting, and financial insights.

## Technology Stack

- **Frontend**: React Native with Expo SDK 53
- **Language**: TypeScript
- **UI Components**: Gluestack UI
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Navigation**: Expo Router with file-based routing
- **Testing**: Jest with React Native Testing Library

## Development Commands

### Essential Commands
- `npm start` - Start the Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run on web browser
- `npm test` - Run Jest test suite
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Testing
- Test files are located in `__tests__/` directory
- Run specific test: `npm test -- filename.test.tsx`
- Test setup is in `__tests__/setup.ts`

## Architecture

### Project Structure
```
app/                    # Expo Router screens
├── (auth)/            # Authentication screens (register, verify)
├── (app)/             # Protected app screens  
├── _layout.tsx        # Root layout
└── index.tsx          # Entry point

src/
├── components/        # Reusable components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and helpers
├── services/         # API clients and services
├── stores/           # Zustand stores
└── types/            # TypeScript definitions
```

### Authentication Flow
- Uses Supabase Auth with email/password
- Auth state managed by Zustand store in `src/stores/authStore.ts`
- Protected routes in `(app)` group, public routes in `(auth)` group
- Session persistence handled by Supabase client

### State Management
- Zustand stores in `src/stores/`
- Auth store handles user session and authentication state
- Type-safe store interfaces defined in `src/types/store.ts`

### API Integration
- Supabase client configured in `src/services/supabaseClient.ts`
- Environment variables: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- API services abstracted in `src/services/` directory

### Navigation
- File-based routing with Expo Router
- Route groups: `(auth)` for public, `(app)` for protected screens
- Stack navigation with hidden headers by default

## Code Conventions

### TypeScript
- Strict mode enabled
- Path aliases: `@/*` maps to `src/*`
- All new code must be TypeScript
- Interface definitions in `src/types/`

### Component Structure
- Functional components with TypeScript
- Use Gluestack UI components for consistency
- Co-locate test files with components where applicable

### Styling
- Gluestack UI for component library
- Utility-first approach with styled props
- Consistent spacing and color schemes

## Testing Strategy

### Coverage Requirements
- Minimum 80% coverage for branches, functions, lines, statements
- Test files excluded from coverage
- Focus on core business logic and user interactions

### Test Organization
- Unit tests for utilities and services
- Component tests for UI components
- Integration tests for complex flows

## Environment Setup

### Required Environment Variables
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development Prerequisites
- Node.js
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

## Key Development Patterns

### Error Handling
- Standardized error responses from API
- User-friendly error messages in UI
- Comprehensive error logging

### Security
- Secure token storage with expo-secure-store
- Row Level Security (RLS) on Supabase tables
- Input validation on all API endpoints

### Performance
- Code splitting with Expo Router
- Optimized bundle size monitoring
- Efficient state updates with Zustand

## Financial Data Integration

The app integrates with:
- Mono API for bank/mobile money account connections
- OneSignal for push notifications
- Local Ghanaian financial institutions

## Deployment

- Frontend: Expo Application Services (EAS) for app store deployment
- Backend: Supabase Edge Functions for serverless API
- CI/CD: GitHub Actions for automated testing and deployment