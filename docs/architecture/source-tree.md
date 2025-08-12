# Source Tree Structure

## Overview
This document defines the unified project structure for the Personal Finance App, following a Polyrepo architecture with separate repositories for the mobile frontend and backend services. The structure is designed to maintain consistency, scalability, and developer productivity.

## Repository Organization

### Polyrepo Structure
- **Frontend Repository**: `personal-finance-app-mobile`
- **Backend Repository**: `personal-finance-app-backend`
- **Version Control**: Separate Git repositories for independent deployment cycles

## Frontend Repository Structure

### Repository: `personal-finance-app-mobile`

```
personal-finance-app-mobile/
├── app/                              # Expo Router file-based routing
│   ├── (app)/                       # Authenticated route group
│   │   ├── _layout.tsx              # Authenticated layout with route protection
│   │   ├── index.tsx                # Dashboard/Home screen
│   │   ├── transactions/            # Transaction management screens
│   │   │   ├── _layout.tsx          # Transactions layout
│   │   │   ├── index.tsx            # Transaction list
│   │   │   ├── add.tsx              # Add transaction
│   │   │   └── [id].tsx             # Transaction details/edit
│   │   ├── accounts/                # Account management screens
│   │   │   ├── index.tsx            # Account list
│   │   │   └── link.tsx             # Link new account
│   │   ├── budgets/                 # Budget management screens
│   │   │   ├── index.tsx            # Budget overview
│   │   │   └── [id].tsx             # Budget details/edit
│   │   ├── settings/                # App settings
│   │   │   ├── index.tsx            # Settings main
│   │   │   ├── profile.tsx          # User profile
│   │   │   └── notifications.tsx    # Notification preferences
│   │   └── reports/                 # Financial reports
│   │       ├── index.tsx            # Reports overview
│   │       └── monthly.tsx          # Monthly reports
│   ├── (auth)/                      # Public/authentication route group
│   │   ├── _layout.tsx              # Auth layout
│   │   ├── register.tsx             # User registration
│   │   ├── verify.tsx               # Email verification
│   │   ├── login.tsx                # User login
│   │   └── forgot-password.tsx      # Password reset
│   ├── +not-found.tsx               # 404 page
│   └── _layout.tsx                  # Root layout
├── src/                             # Source code organization
│   ├── components/                  # Reusable UI components
│   │   ├── common/                  # Generic components
│   │   │   ├── Button/              # Component folder structure
│   │   │   │   ├── Button.tsx       # Component implementation
│   │   │   │   ├── Button.test.tsx  # Component tests
│   │   │   │   └── index.ts         # Export barrel
│   │   │   ├── Input/
│   │   │   ├── LoadingSpinner/
│   │   │   ├── ErrorBoundary/
│   │   │   └── index.ts             # Common components barrel
│   │   ├── features/                # Feature-specific components
│   │   │   ├── authentication/
│   │   │   │   ├── LoginForm/
│   │   │   │   ├── RegisterForm/
│   │   │   │   └── VerifyEmailForm/
│   │   │   ├── transactions/
│   │   │   │   ├── TransactionCard/
│   │   │   │   ├── TransactionList/
│   │   │   │   ├── TransactionForm/
│   │   │   │   └── CategoryPicker/
│   │   │   ├── accounts/
│   │   │   │   ├── AccountCard/
│   │   │   │   ├── AccountBalance/
│   │   │   │   └── LinkAccountButton/
│   │   │   ├── budgets/
│   │   │   │   ├── BudgetCard/
│   │   │   │   ├── BudgetProgress/
│   │   │   │   └── BudgetForm/
│   │   │   └── dashboard/
│   │   │       ├── FinancialSummary/
│   │   │       ├── RecentTransactions/
│   │   │       └── QuickActions/
│   │   └── index.ts                 # Component barrel exports
│   ├── services/                    # External service integrations
│   │   ├── supabaseClient.ts        # Supabase client configuration
│   │   ├── authService.ts           # Authentication service
│   │   ├── transactionService.ts    # Transaction CRUD operations
│   │   ├── accountService.ts        # Account management operations
│   │   ├── budgetService.ts         # Budget operations
│   │   ├── notificationService.ts   # Push notification handling
│   │   ├── apiClient.ts             # Base API client with error handling
│   │   └── index.ts                 # Service barrel exports
│   ├── stores/                      # Zustand state management
│   │   ├── authStore.ts             # Authentication state
│   │   ├── transactionStore.ts      # Transaction state management
│   │   ├── accountStore.ts          # Account state management
│   │   ├── budgetStore.ts           # Budget state management
│   │   ├── uiStore.ts               # UI state (loading, modals, etc.)
│   │   └── index.ts                 # Store barrel exports
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.ts               # Authentication hook
│   │   ├── useTransactions.ts       # Transaction management hook
│   │   ├── useAccounts.ts           # Account management hook
│   │   ├── useBudgets.ts            # Budget management hook
│   │   ├── useNotifications.ts      # Notification hook
│   │   ├── useApi.ts                # Generic API hook
│   │   └── index.ts                 # Hooks barrel exports
│   ├── lib/                         # Utility libraries and helpers
│   │   ├── utils.ts                 # General utility functions
│   │   ├── constants.ts             # App constants
│   │   ├── validators.ts            # Input validation functions
│   │   ├── formatters.ts            # Data formatting utilities
│   │   ├── storage.ts               # Secure storage utilities
│   │   ├── permissions.ts           # Device permissions handling
│   │   └── index.ts                 # Library barrel exports
│   ├── types/                       # TypeScript type definitions
│   │   ├── models.ts                # Data model interfaces
│   │   ├── api.ts                   # API request/response types
│   │   ├── navigation.ts            # Navigation parameter types
│   │   ├── store.ts                 # Store state types
│   │   └── index.ts                 # Type barrel exports
│   └── assets/                      # Static assets
│       ├── images/                  # App images and icons
│       ├── fonts/                   # Custom fonts (if any)
│       └── data/                    # Static data files
├── __tests__/                       # Global test configuration
│   ├── __mocks__/                   # Global mocks
│   ├── setup.ts                     # Test setup configuration
│   └── utils.tsx                    # Test utilities and helpers
├── .env.example                     # Environment variables template
├── .env.local                       # Local environment variables (gitignored)
├── .gitignore                       # Git ignore rules
├── .eslintrc.js                     # ESLint configuration
├── .prettierrc                      # Prettier configuration
├── app.json                         # Expo configuration
├── babel.config.js                  # Babel configuration
├── expo-env.d.ts                    # Expo TypeScript definitions
├── jest.config.js                   # Jest test configuration
├── metro.config.js                  # Metro bundler configuration
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
└── README.md                        # Project documentation
```

## Backend Repository Structure

### Repository: `personal-finance-app-backend`

```
personal-finance-app-backend/
├── supabase/                        # Supabase project configuration
│   ├── functions/                   # Edge Functions
│   │   ├── shared/                  # Shared utilities and types
│   │   │   ├── cors.ts              # CORS handling utility
│   │   │   ├── auth.ts              # JWT validation middleware
│   │   │   ├── errors.ts            # Error handling utilities
│   │   │   ├── validators.ts        # Input validation functions
│   │   │   ├── database.ts          # Database connection utilities
│   │   │   ├── types.ts             # Shared TypeScript types
│   │   │   └── constants.ts         # Shared constants
│   │   ├── transactions/            # Transaction management API
│   │   │   ├── index.ts             # Main transaction handler
│   │   │   ├── handlers/            # Route handlers
│   │   │   │   ├── create.ts        # POST /transactions
│   │   │   │   ├── read.ts          # GET /transactions, /transactions/:id
│   │   │   │   ├── update.ts        # PUT /transactions/:id
│   │   │   │   └── delete.ts        # DELETE /transactions/:id
│   │   │   ├── services/            # Business logic
│   │   │   │   ├── transactionService.ts
│   │   │   │   └── categoryService.ts
│   │   │   ├── repositories/        # Data access layer
│   │   │   │   └── transactionRepository.ts
│   │   │   ├── types.ts             # Transaction-specific types
│   │   │   └── tests/               # Function tests
│   │   │       ├── create.test.ts
│   │   │       ├── read.test.ts
│   │   │       ├── update.test.ts
│   │   │       └── delete.test.ts
│   │   ├── accounts/                # Account management API
│   │   │   ├── index.ts
│   │   │   ├── handlers/
│   │   │   │   ├── link.ts          # POST /accounts/link
│   │   │   │   ├── sync.ts          # POST /accounts/sync
│   │   │   │   └── list.ts          # GET /accounts
│   │   │   ├── services/
│   │   │   │   ├── accountService.ts
│   │   │   │   └── monoService.ts   # Mono API integration
│   │   │   ├── repositories/
│   │   │   │   └── accountRepository.ts
│   │   │   ├── types.ts
│   │   │   └── tests/
│   │   ├── budgets/                 # Budget management API
│   │   │   ├── index.ts
│   │   │   ├── handlers/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── types.ts
│   │   │   └── tests/
│   │   ├── auth/                    # Authentication utilities
│   │   │   ├── index.ts
│   │   │   ├── handlers/
│   │   │   │   ├── profile.ts       # User profile management
│   │   │   │   └── setup.ts         # Initial user setup
│   │   │   ├── services/
│   │   │   │   └── profileService.ts
│   │   │   ├── repositories/
│   │   │   │   └── profileRepository.ts
│   │   │   ├── types.ts
│   │   │   └── tests/
│   │   ├── reports/                 # Reporting and analytics API
│   │   │   ├── index.ts
│   │   │   ├── handlers/
│   │   │   │   ├── monthly.ts       # Monthly financial reports
│   │   │   │   └── spending.ts      # Spending analysis
│   │   │   ├── services/
│   │   │   │   └── reportService.ts
│   │   │   ├── types.ts
│   │   │   └── tests/
│   │   └── notifications/           # Push notification API
│   │       ├── index.ts
│   │       ├── handlers/
│   │       │   ├── send.ts          # Send notification
│   │       │   └── schedule.ts      # Schedule notification
│   │       ├── services/
│   │       │   └── oneSignalService.ts
│   │       ├── types.ts
│   │       └── tests/
│   ├── migrations/                  # Database migrations
│   │   ├── 20241201000000_initial_schema.sql
│   │   ├── 20241201000001_profiles_table.sql
│   │   ├── 20241201000002_accounts_table.sql
│   │   ├── 20241201000003_categories_table.sql
│   │   ├── 20241201000004_transactions_table.sql
│   │   ├── 20241201000005_budgets_table.sql
│   │   ├── 20241201000006_rls_policies.sql
│   │   └── 20241201000007_indexes.sql
│   ├── seed.sql                     # Initial data seeding
│   └── config.toml                  # Supabase configuration
├── tests/                           # Integration and setup tests
│   ├── setup.ts                     # Test environment setup
│   ├── helpers.ts                   # Test helper functions
│   ├── mocks.ts                     # Common test mocks
│   └── integration/                 # Cross-function integration tests
│       ├── auth-flow.test.ts
│       ├── transaction-flow.test.ts
│       └── account-sync.test.ts
├── scripts/                         # Development and deployment scripts
│   ├── deploy.sh                    # Deployment script
│   ├── migrate.sh                   # Migration script
│   ├── seed.sh                      # Database seeding script
│   └── test.sh                      # Test runner script
├── docs/                            # API documentation
│   ├── api.md                       # API endpoint documentation
│   ├── deployment.md                # Deployment guide
│   └── development.md               # Local development setup
├── .env.example                     # Environment variables template
├── .env.local                       # Local environment variables (gitignored)
├── .gitignore                       # Git ignore rules
├── deno.json                        # Deno configuration
├── import_map.json                  # Deno import map
├── package.json                     # Node.js scripts (for tooling)
└── README.md                        # Project documentation
```

## File Naming Conventions

### General Rules
- **Directories**: kebab-case (e.g., `transaction-management/`)
- **Components**: PascalCase (e.g., `TransactionCard.tsx`)
- **Utilities/Services**: camelCase (e.g., `supabaseClient.ts`)
- **Test Files**: Match source with `.test.` suffix (e.g., `Button.test.tsx`)
- **Type Files**: camelCase with descriptive names (e.g., `models.ts`, `api.ts`)

### Specific Patterns
- **React Native Screens**: PascalCase (e.g., `index.tsx`, `TransactionList.tsx`)
- **Edge Functions**: camelCase with descriptive names (e.g., `index.ts`)
- **Database Migrations**: Timestamp prefix with descriptive name (e.g., `20241201000000_initial_schema.sql`)
- **Environment Files**: Lowercase with dots (e.g., `.env.local`, `.env.production`)

## Testing File Organization

### Frontend Testing Structure
- **Unit Tests**: Co-located with source files (e.g., `Button.test.tsx` next to `Button.tsx`)
- **Integration Tests**: In `__tests__/integration/` directory
- **E2E Tests**: In `__tests__/e2e/` directory (Maestro configuration)
- **Test Utilities**: In `__tests__/utils/` directory

### Backend Testing Structure
- **Function Tests**: In each function's `tests/` subdirectory
- **Integration Tests**: In root `tests/integration/` directory
- **Database Tests**: In `tests/database/` directory
- **Mock Data**: In `tests/mocks/` directory

## Configuration File Organization

### Frontend Configuration
- **Expo**: `app.json` and `expo-env.d.ts`
- **TypeScript**: `tsconfig.json`
- **Babel**: `babel.config.js`
- **Metro**: `metro.config.js`
- **Jest**: `jest.config.js`
- **ESLint**: `.eslintrc.js`
- **Prettier**: `.prettierrc`

### Backend Configuration
- **Supabase**: `supabase/config.toml`
- **Deno**: `deno.json` and `import_map.json`
- **Environment**: `.env.example` and environment-specific files

## Asset Organization

### Frontend Assets
- **Images**: Organized by feature in `src/assets/images/`
- **Icons**: Vector icons from React Native Vector Icons
- **Fonts**: Custom fonts in `src/assets/fonts/` (if needed)
- **Static Data**: JSON files in `src/assets/data/`

### Backend Assets
- **SQL Scripts**: In `supabase/migrations/` with timestamp prefixes
- **Seed Data**: In `supabase/seed.sql`
- **Documentation**: In `docs/` directory

## Environment and Deployment Structure

### Environment Files
- **Development**: `.env.local` (gitignored)
- **Staging**: `.env.staging` (stored in CI/CD secrets)
- **Production**: `.env.production` (stored in CI/CD secrets)
- **Template**: `.env.example` (versioned, no secrets)

### CI/CD Organization
- **GitHub Actions**: `.github/workflows/` directory
- **Frontend Workflow**: `mobile-ci.yml`
- **Backend Workflow**: `backend-ci.yml`
- **E2E Workflow**: `e2e-tests.yml`

## Import Path Organization

### Frontend Import Paths
- **Absolute Imports**: Use `@/` prefix for `src/` directory
- **Component Imports**: `@/components/`
- **Service Imports**: `@/services/`
- **Type Imports**: `@/types/`
- **Utility Imports**: `@/lib/`

### Backend Import Paths
- **Shared Utilities**: `../shared/` relative imports
- **External Dependencies**: Full URLs in `import_map.json`
- **Supabase Client**: Standard Supabase imports

## Documentation Organization

### Project Documentation
- **README**: High-level project overview and setup
- **API Documentation**: Detailed API endpoint documentation
- **Architecture**: High-level architecture decisions
- **Deployment**: Deployment and environment setup guides
- **Contributing**: Development workflow and contribution guidelines