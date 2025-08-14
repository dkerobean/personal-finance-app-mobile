# Tech Stack

## Overview
This document serves as the single source of truth for all technologies used in the Kippo project. It defines the complete technology stack across frontend, backend, testing, and deployment infrastructure.

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| **Frontend Language** | TypeScript | ~5.3.3 | Language for React Native app | Provides strong typing to reduce errors and improve developer experience |
| **Frontend Framework** | React Native (Expo) | ~50.0.0 | Core framework for the app | Enables cross-platform development. Expo simplifies the build process and development workflow |
| **UI Component Library** | Gluestack UI | ~1.1.10 | Universal & performant component library | Provides a highly customizable foundation for a unique design system with excellent performance |
| **State Management** | Zustand | ~4.5.0 | Manages global app state | A simple and scalable state management solution with minimal boilerplate |
| **Backend Language** | TypeScript | ~5.3.3 | Language for Edge Functions | Maintains language consistency across the stack, reducing context switching |
| **Backend Platform** | Supabase | 2.0 | Backend-as-a-Service | Provides all backend needs with a generous free tier, integrated auth, database, and API |
| **API Style** | RESTful API | n/a | Convention for endpoints | A well-understood standard for client-server communication |
| **Database** | PostgreSQL | 15.1 | Primary application database | Powerful and reliable SQL database provided by Supabase with advanced features |
| **Authentication** | Supabase Auth | n/a | Handles user security | A secure, built-in solution for user management with email verification |
| **Frontend Testing** | Jest & RNTL | ~29.7.0 | Unit/component testing | The standard for testing React Native apps with comprehensive testing utilities |
| **Backend Testing** | Deno Test Runner | ~1.40.0 | Testing of Edge Functions | The native test runner for the Deno environment used by Supabase Edge Functions |
| **E2E Testing** | Maestro | ~1.35.0 | End-to-end mobile testing | A modern, simple framework for mobile E2E testing with great developer experience |
| **CI/CD** | GitHub Actions | n/a | Automates testing/deployment | Natively integrated with GitHub repositories for seamless workflow automation |
| **Monitoring & Logging** | Supabase Dashboard | n/a | Backend health and logs | Provides essential, built-in monitoring for backend services |

## Frontend Technology Details

### React Native with Expo
- **Framework**: Expo SDK 50.x
- **Router**: expo-router for file-based navigation
- **Platform Support**: iOS and Android
- **Development Tools**: Expo CLI, Expo Go app for testing
- **Build System**: Expo Application Services (EAS) for production builds

### UI and Styling
- **Component Library**: Gluestack UI for consistent design system
- **Styling Approach**: Utility-first styling with Gluestack's props system
- **Icons**: React Native Vector Icons or Expo Icons
- **Fonts**: System fonts with custom font support via Expo

### State Management and Data
- **Global State**: Zustand stores for different data domains
- **Local State**: React hooks (useState, useReducer)
- **Data Fetching**: Native fetch API with custom hooks
- **Caching**: Consider TanStack Query for advanced caching needs

### Development and Build Tools
- **Package Manager**: npm or yarn
- **Bundler**: Metro (React Native's default)
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with @expo/eslint-config
- **Formatting**: Prettier with project-specific rules

## Backend Technology Details

### Supabase Platform
- **Database**: PostgreSQL 15.1 with Row Level Security (RLS)
- **API**: Auto-generated REST API from database schema
- **Auth**: Built-in authentication with JWT tokens
- **Edge Functions**: Serverless functions running on Deno
- **Storage**: File storage with CDN (if needed for future features)

### API Development
- **Runtime**: Deno runtime for Edge Functions
- **Framework**: Native Supabase Edge Function templates
- **Authentication**: JWT validation middleware
- **CORS**: Configured for mobile app origins
- **Error Handling**: Standardized error response format

### Database and Security
- **Schema Management**: SQL migrations in version control
- **Row Level Security**: Policy-based access control
- **Connection Pooling**: Managed by Supabase
- **Backup Strategy**: Automated backups via Supabase

## External Services and APIs

### Financial Data Integration
- **Aggregator**: Mono API for bank and mobile money connections
- **Documentation**: https://docs.mono.co/
- **Authentication**: Secret key-based authentication
- **Rate Limits**: As per Mono API documentation

### Push Notifications
- **Service**: OneSignal for cross-platform notifications
- **Documentation**: https://documentation.onesignal.com/
- **Integration**: SDK for React Native and REST API for backend

### Development Services
- **Version Control**: GitHub
- **Package Registry**: npm registry
- **CDN**: Supabase CDN for static assets

## Testing Technology Stack

### Frontend Testing
- **Unit Testing**: Jest test runner
- **Component Testing**: React Native Testing Library (RNTL)
- **Mocking**: Jest mocks for API calls and navigation
- **Coverage**: Istanbul coverage reporting
- **Test Structure**: Co-located test files with source code

### Backend Testing
- **Unit Testing**: Deno's built-in test runner
- **Integration Testing**: Database transactions for isolated tests
- **API Testing**: HTTP request testing for Edge Functions
- **Mocking**: Deno's mocking capabilities

### End-to-End Testing
- **Framework**: Maestro for mobile E2E testing
- **Test Environment**: Staging environment with test data
- **CI Integration**: Automated E2E tests in GitHub Actions

## Development and Deployment Tools

### Local Development
- **Node.js**: v18+ for frontend development
- **Expo CLI**: For React Native development and testing
- **Supabase CLI**: For local backend development and migrations
- **VS Code**: Recommended IDE with TypeScript and React Native extensions

### CI/CD Pipeline
- **Platform**: GitHub Actions
- **Workflows**: Separate workflows for frontend and backend
- **Environments**: Development, Staging, Production
- **Deployment**: Automated deployment to Supabase and app stores

### Monitoring and Analytics
- **Backend Monitoring**: Supabase Dashboard with built-in metrics
- **Error Tracking**: Console logging with structured error handling
- **Performance**: React Native Performance Monitor
- **Analytics**: Consider adding analytics service post-MVP

## Security and Performance Tools

### Security
- **Secret Management**: Environment variables and Expo SecureStore
- **Static Analysis**: ESLint security rules
- **Dependency Scanning**: npm audit and Snyk (if budget allows)
- **Authentication**: JWT with secure storage

### Performance
- **Bundle Analysis**: expo-bundle-analyzer for frontend
- **Database Performance**: Supabase built-in query performance insights
- **Mobile Performance**: Flipper for React Native debugging
- **Load Testing**: Artillery or similar for API load testing (future consideration)

## Future Technology Considerations

### Post-MVP Additions
- **State Management**: Consider Redux Toolkit if state complexity grows
- **Caching**: TanStack Query for advanced data management
- **Analytics**: Mixpanel or similar for user behavior tracking
- **Error Tracking**: Sentry for production error monitoring
- **Feature Flags**: LaunchDarkly or similar for feature management

### Scalability Considerations
- **Database**: PostgreSQL can handle significant scale on Supabase
- **API**: Edge Functions auto-scale with Supabase
- **CDN**: Consider Cloudflare for global content delivery
- **Search**: PostgreSQL full-text search or Elasticsearch for advanced search

## Version Management and Updates

### Update Strategy
- **Regular Updates**: Monthly dependency updates
- **Security Updates**: Immediate application of security patches
- **Major Version Updates**: Planned during development cycles
- **Breaking Changes**: Coordinated updates across frontend and backend

### Compatibility Matrix
- **Minimum iOS**: iOS 13+
- **Minimum Android**: API level 21 (Android 5.0)
- **Node.js**: v18+ for development
- **TypeScript**: Consistent versions across frontend and backend