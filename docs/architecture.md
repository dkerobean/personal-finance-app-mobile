Kippo Fullstack Architecture Document
Introduction
This document outlines the complete fullstack architecture for the Kippo, including the backend systems on Supabase, the frontend React Native mobile application, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

Starter Template or Existing Project
We will begin with a standard Expo starter template (e.g., expo-router with tabs) and manually integrate the Supabase client. This approach provides a solid, community-tested foundation for navigation and project structure.

Change Log
Date	Version	Description	Author
2025-08-12	1.0	Initial Architecture draft	Winston, Architect

Export to Sheets
Export to Sheets

High Level Architecture
Technical Summary
This project will be a full-stack serverless application. The frontend will be a cross-platform mobile app built with React Native (Expo). The backend will be powered by Supabase, utilizing its integrated services including Authentication, a PostgreSQL Database, and serverless Edge Functions for our API. The system will follow a Polyrepo structure with separate repositories for the mobile app and the backend code. This architecture was chosen for its rapid development capabilities, low initial cost, and seamless scalability, directly aligning with the goals outlined in the PRD.

Platform and Infrastructure Choice
Platform: Supabase.

Key Services: We will use Supabase's core services:

Supabase Auth: For user registration, login, and session management.

Supabase Database (PostgreSQL): For storing all application data.

Supabase Edge Functions: To host our serverless API and business logic.

Deployment Host and Regions: The backend will be hosted on Supabase Cloud, with the Africa (Cape Town) region recommended to minimize latency for users in Ghana.

Repository Structure
Structure: Polyrepo.

Organization: Two separate GitHub repositories: personal-finance-app-mobile and personal-finance-app-backend.

High Level Architecture Diagram
Code snippet

graph TD
    subgraph User Device
        A[Mobile App - React Native]
    end

    subgraph Supabase Cloud
        B[Edge Functions API]
        C[Supabase Auth]
        D[PostgreSQL Database]
    end

    subgraph Third-Party Services
        E[Mono API - Financial Data]
        F[OneSignal API - Push Notifications]
    end

    A -->|HTTPS requests| B
    B -->|Validates token| C
    B -->|CRUD operations| D
    B -->|Fetches data| E
    B -->|Sends alerts| F
Architectural and Design Patterns
Serverless Architecture: Using Supabase Edge Functions for all backend logic.

Rationale: Cost-effective, auto-scaling, and no server management.

Repository Pattern (Backend): Abstracting data access logic from business logic.

Rationale: Improves testability and makes code cleaner.

Component-Based UI (Frontend): Using reusable React Native components.

Rationale: Promotes code reuse and maintainability.

Tech Stack
This table is the single source of truth for all technologies used in the project.

Category	Technology	Version	Purpose	Rationale
Frontend Language	TypeScript	~5.3.3	Language for React Native app	Provides strong typing to reduce errors.
Frontend Framework	React Native (Expo)	~50.0.0	Core framework for the app	Enables cross-platform development. Expo simplifies the build process.
UI Component Library	Gluestack UI	~1.1.10	Universal & performant component library	Provides a highly customizable foundation for a unique design system.
State Management	Zustand	~4.5.0	Manages global app state	A simple and scalable state management solution.
Backend Language	TypeScript	~5.3.3	Language for Edge Functions	Maintains language consistency across the stack.
Backend Platform	Supabase	2.0	Backend-as-a-Service	Provides all backend needs with a generous free tier.
API Style	RESTful API	n/a	Convention for endpoints	A well-understood standard for client-server communication.
Database	PostgreSQL	15.1	Primary application database	Powerful and reliable SQL database provided by Supabase.
Authentication	Supabase Auth	n/a	Handles user security	A secure, built-in solution for user management.
Frontend Testing	Jest & RNTL	~29.7.0	Unit/component testing	The standard for testing React Native apps.
Backend Testing	Deno Test Runner	~1.40.0	Testing of Edge Functions	The native test runner for the Deno environment.
E2E Testing	Maestro	~1.35.0	End-to-end mobile testing	A modern, simple framework for mobile E2E testing.
CI/CD	GitHub Actions	n/a	Automates testing/deployment	Natively integrated with GitHub repositories.
Monitoring & Logging	Supabase Dashboard	n/a	Backend health and logs	Provides essential, built-in monitoring for backend services.

Export to Sheets
Export to Sheets

Data Models
(This section includes the detailed definitions and TypeScript interfaces for the Profiles, Accounts, Categories, Transactions, and Budgets models as previously defined.)

API Specification
(This section includes the OpenAPI 3.0 YAML specification for the RESTful API as previously defined.)

Components
(This section includes the detailed breakdown of Backend and Frontend logical components as previously defined.)

External APIs
(This section includes the detailed integration plan for the Mono API and OneSignal API as previously defined.)

Core Workflows
(This section includes the Mermaid sequence diagram for the "New User Registration and First Account Link" workflow as previously defined.)

Database Schema
(This section includes the complete SQL DDL for creating the PostgreSQL tables as previously defined.)

Frontend Architecture
(This section includes the detailed folder structures and code templates for Components, State Management, Routing, and Services using Gluestack UI, as previously defined.)

Backend Architecture
(This section includes the detailed folder structures, code templates, and security patterns (including RLS) for Supabase Edge Functions, as previously defined.)

Unified Project Structure
(This section includes the ASCII diagrams for the two separate frontend and backend repositories as previously defined.)

Development Workflow
(This section includes the setup, commands, and environment variable definitions for local development as previously defined.)

Deployment Architecture
(This section includes the deployment strategy, conceptual CI/CD pipeline, and environment definitions as previously defined.)

Security and Performance
Security Requirements
Frontend Security:

Secure Storage: Use Expo's expo-secure-store for storing sensitive items like session tokens.

XSS Prevention: React Native is not vulnerable to traditional XSS, but input validation is still critical.

Backend Security:

Input Validation: All API inputs must be validated on the server before processing.

Rate Limiting: Implement rate limiting on sensitive endpoints (like login) using Supabase's built-in features.

Authentication Security:

Token Storage: The JWT received from Supabase will be stored securely on the device using expo-secure-store.

Password Policy: Enforce strong password policies using Supabase Auth settings.

Performance Optimization
Frontend Performance:

Bundle Size: Regularly analyze the app bundle to remove unused packages.

Loading Strategy: Use code splitting for routes and lazy loading for large components to improve initial startup time.

Caching: Use a client-side data cache like TanStack Query to reduce redundant API calls.

Backend Performance:

Response Time Target: Aim for a median API response time of <200ms for all standard CRUD operations.

Database Optimization: Ensure all frequently queried columns in the PostgreSQL database are indexed.

Testing Strategy
Testing Pyramid
Our strategy will follow the testing pyramid, with a large base of fast unit tests, a smaller number of integration tests, and a few key end-to-end tests.

Plaintext

     /     \
    E2E Tests
   /_________\
 Integration Tests
/_______________\
Unit Tests (FE & BE)
Test Organization
Frontend: Tests will be co-located with the source code (e.g., Component.test.tsx next to Component.tsx).

Backend: Tests for each Edge Function will be located within that function's directory.

Error Handling Strategy
Error Response Format
The backend API will use a standardized JSON format for all errors to ensure consistency.

TypeScript

{
  "error": {
    "code": "unique_error_code",
    "message": "A user-friendly error message."
  }
}
Frontend Error Handling
The central API client will be responsible for catching API errors, logging them to a monitoring service, and converting them into a format that the UI can display to the user (e.g., a toast notification).

Backend Error Handling
A shared error handler in our Edge Functions will catch all exceptions, log them, and format the response according to the standard error format, ensuring no sensitive stack traces are leaked.

Data Models
1. Profiles
Purpose: To store public user data and application-specific settings, linked to the secure auth.users table provided by Supabase.
Relationships: A one-to-one relationship with the auth.users table.

TypeScript

export interface Profile {
  id: string; // UUID
  username: string | null;
  full_name: string | null;
  updated_at: string; // ISO 8601 Timestamp
}
2. Accounts
Purpose: To store information about a financial account (bank or mobile money) that a user has linked to the app.
Relationships: A user can have many accounts.

TypeScript

export interface Account {
  id: string; // UUID
  user_id: string; // UUID
  account_name: string;
  account_type: 'bank' | 'mobile_money';
  balance: number;
  aggregator_account_id: string;
  last_synced_at: string; // ISO 8601 Timestamp
}
3. Categories
Purpose: To store the spending and income categories that users create to organize their transactions.
Relationships: A user can have many custom categories.

TypeScript

export interface Category {
  id: string; // UUID
  user_id: string | null; // UUID or null for default
  name: string;
  icon_name: string;
}
4. Transactions
Purpose: To store every individual income or expense transaction, whether entered manually or synced automatically.
Relationships: A transaction belongs to one user, one category, and optionally one account.

TypeScript

export interface Transaction {
  id: string; // UUID
  user_id: string; // UUID
  account_id: string | null; // UUID
  category_id: string; // UUID
  amount: number;
  type: 'income' | 'expense';
  description: string;
  transaction_date: string; // ISO 8601 Timestamp
  is_synced: boolean;
}
5. Budgets
Purpose: To store the monthly spending limits that a user sets for specific categories.
Relationships: A budget belongs to one user and one category for a specific month.

TypeScript

export interface Budget {
  id: string; // UUID
  user_id: string; // UUID
  category_id: string; // UUID
  amount: number;
  month: string; // Date string like 'YYYY-MM-01'
}
API Specification
This is an OpenAPI 3.0 specification for the RESTful API that will be built using Supabase Edge Functions. All endpoints require a valid JWT from Supabase Auth.

YAML

openapi: 3.0.3
info:
  title: "Kippo API"
  version: "1.0.0"
  description: "API for managing personal finances, accounts, and budgets."
servers:
  - url: "https://{your-supabase-project-ref}.supabase.co/functions/v1"
    description: "Supabase Edge Functions"
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
security:
  - bearerAuth: []
paths:
  /transactions:
    get:
      summary: "List user's transactions"
      responses:
        '200':
          description: "A list of transactions."
    post:
      summary: "Create a new transaction"
      responses:
        '201':
          description: "Transaction created successfully."
  /transactions/{id}:
    patch:
      summary: "Update a transaction"
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200':
          description: "Transaction updated successfully."
    delete:
      summary: "Delete a transaction"
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '204':
          description: "Transaction deleted successfully."
  /categories:
    get:
      summary: "List user's categories"
      responses:
        '200':
          description: "A list of categories."
    post:
      summary: "Create a new category"
      responses:
        '201':
          description: "Category created successfully."
  /accounts/link:
    post:
      summary: "Link a new financial account"
      responses:
        '201':
          description: "Account linked successfully."
Components
Backend Components (Supabase)
Auth Service: Manages user profile data linked to Supabase Auth.

Transaction Service: Handles all business logic for transactions via the /transactions API endpoints.

Account Aggregation Service: Manages linking accounts and syncing transactions via the Mono API.

Budgeting Service: Manages logic for budgets and reports via the /budgets and /reports APIs.

Database Service (Data Access Layer): Implements the Repository Pattern to abstract all direct database interactions.

Frontend Components (React Native)
API Client: A centralized module for all communication with the backend API.

Global State (Zustand Store): Manages all shared application state (user profile, transactions, etc.).

Authentication Flow: UI screens for Registration, Email Verification, and Login.

Core Feature Flows: UI component collections for the Dashboard, Transaction Management, and Budget Management.

External APIs
1. Mono API
Purpose: To securely connect to a user's bank and mobile money accounts to fetch transaction data automatically.

Documentation: https://docs.mono.co/

Authentication: Backend uses a Secret Key.

Key Endpoints: POST /account/auth, GET /accounts/{id}/transactions.

2. OneSignal API
Purpose: To send push notifications to users' devices for events like budget alerts.

Documentation: https://documentation.onesignal.com/

Authentication: Backend uses an App ID and a REST API Key.

Key Endpoints: POST /notifications.

Core Workflows
This diagram shows the sequence for a new user registering and linking their first account.

Code snippet

sequenceDiagram
    participant User
    participant Mobile App (Frontend)
    participant Supabase Auth
    participant Backend API (Edge Function)
    participant Mono API

    User->>+Mobile App: Submits Registration (email, pass)
    Mobile App->>+Supabase Auth: signUp()
    Note over User, Supabase Auth: Supabase sends verification email
    Supabase Auth-->>-Mobile App: Awaits verification
    User->>+Mobile App: Enters verification code
    Mobile App->>+Supabase Auth: verifyOtp()
    Supabase Auth-->>-Mobile App: Returns success + JWT

    User->>+Mobile App: Clicks "Link Bank Account"
    Mobile App->>+User: Shows Mono Widget
    User->>Mono API: Authenticates with bank
    Mono API-->>-Mobile App: Provides one-time 'code'

    Mobile App->>+Backend API: POST /accounts/link with 'code'
    Backend API->>+Mono API: Exchange 'code' for 'account_id'
    Mono API-->>-Backend API: Returns 'account_id'
    Backend API->>Backend API: Stores new account in Database
    Backend API-->>-Mobile App: Returns 201 Created

    par
        Backend API->>+Mono API: GET /accounts/{id}/transactions
        Mono API-->>-Backend API: Returns transaction data
    and
        Backend API->>Backend API: Stores transactions in Database
    end
Database Schema
This is the SQL DDL for creating the tables in our Supabase PostgreSQL database.

SQL

-- Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Accounts Table
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  aggregator_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);

-- Categories Table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Null for default
  name TEXT NOT NULL,
  icon_name TEXT
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_categories_user_id ON public.categories(user_id);

-- Transactions Table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL, -- 'income' or 'expense'
  description TEXT NOT NULL,
  transaction_date TIMESTAMPTZ NOT NULL,
  is_synced BOOLEAN DEFAULT false
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);

-- Budgets Table
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  month DATE NOT NULL
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX idx_budgets_user_category_month ON public.budgets(user_id, category_id, month);
Frontend Architecture
Component Architecture
Organization: Components will be grouped by features (src/components/features) with a common directory for reusable elements.

Template: All components will be typed functional components built with Gluestack UI's factory method and styled with its utility-first props.

State Management Architecture
Pattern: We will use separate Zustand stores for different data domains (e.g., userStore, transactionStore).

Template: Stores will define state, actions, and asynchronous functions for fetching data.

Routing Architecture
Pattern: We will use Expo Router's file-based routing system, with separate route groups for authenticated (/app) and public (/auth) screens.

Protection: A layout route will protect authenticated routes by checking for a valid user session.

Frontend Services Layer
Pattern: A dedicated services layer (src/services) will handle all API communication, using a centrally configured Supabase client.

Backend Architecture
Service Architecture (Serverless)
Organization: Edge Functions will be organized by feature in the supabase/functions directory.

Template: Functions will follow a standard template for handling CORS, authentication, and error responses.

Database Architecture
Schema: Managed via SQL migration files in the supabase/migrations directory.

Data Access: A repository pattern will be used to abstract database queries from business logic.

Authentication and Authorization
Authentication: Handled by Supabase Auth.

Authorization: Enforced primarily through PostgreSQL's Row Level Security (RLS) to ensure users can only access their own data.

Unified Project Structure
1. Frontend Repository: personal-finance-app-mobile
Plaintext

personal-finance-app-mobile/
├── app/
├── src/
│   ├── components/
│   ├── services/
│   ├── stores/
│   ├── hooks/
│   └── lib/
└── package.json
2. Backend Repository: personal-finance-app-backend
Plaintext

personal-finance-app-backend/
├── supabase/
│   ├── functions/
│   │   ├── shared/
│   │   └── transactions-crud/
│   └── migrations/
└── supabase/config.toml
Development Workflow
Local Development Setup
Prerequisites: Node.js, Git, Supabase CLI, Expo CLI.

Setup: Clone both repositories, run npm install in the frontend, and supabase start in the backend.

Environment Configuration
Frontend (.env): Requires EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.

Backend (.env): Requires keys for third-party services like MONO_SECRET_KEY.

Deployment Architecture
Deployment Strategy
Frontend: App binaries built using Expo Application Services (EAS) and submitted to the Google Play Store and Apple App Store.

Backend: Edge Functions and database migrations deployed via the Supabase CLI, integrated into a CI/CD pipeline.

CI/CD Pipeline (GitHub Actions)
A GitHub Actions workflow will be configured to run tests on every pull request and deploy the backend to staging or production upon merging to develop or main branches, respectively.

Environments
We will use three environments: Development (local), Staging (separate Supabase project for QA), and Production (live).