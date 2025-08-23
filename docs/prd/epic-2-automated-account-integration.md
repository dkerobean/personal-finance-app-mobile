# Epic 2: Hybrid Financial Integration - Banks via Mono & Mobile Money via MTN MoMo

**Expanded Goal:** The goal of this epic is to deliver the app's primary value proposition: comprehensive automation through a hybrid integration approach. We will build functionality to securely connect users' bank accounts via Mono API (leveraging their extensive bank coverage across Ghana) and mobile money accounts through direct MTN MoMo API integration (ensuring authentic MTN Mobile Money experience). This dual-platform approach eliminates the need for manual data entry for both banking and mobile money transactions, providing users with a unified, real-time, hands-off overview of their complete financial activity across Ghana's financial ecosystem.

### Story 2.1: Dual Account Linking - Banks via Mono & MTN MoMo Direct
**As a** user,
**I want** to securely connect my bank accounts via Mono and my MTN Mobile Money account through direct MTN MoMo integration,
**so that** all my financial transactions can be automatically tracked with the best platform for each account type.

#### Acceptance Criteria
1.  An "Add Account" option is available with choices: "Link Bank Account" and "Link MTN MoMo Account".
2.  For bank accounts: Launches Mono Connect Widget showing available Ghanaian banks with Mono's authentication flow.
3.  For MTN MoMo: Custom integration using MTN MoMo Collections API with phone number verification and PIN authentication.
4.  Upon successful bank authentication, the app receives and securely stores the Mono Account ID.
5.  Upon successful MTN MoMo authentication, the app stores MTN reference ID and phone number securely.
6.  All linked accounts appear in "Linked Accounts" with appropriate branding (bank logos vs MTN MoMo logo) and account types.
7.  Users can unlink any connected account through the appropriate platform's unlinking process.

### Story 2.2: Dual Platform Data Sync - Mono Banks & MTN MoMo
**As a** user,
**I want** the app to import my recent transaction history and account information from both my bank accounts (via Mono) and MTN MoMo account (via direct API),
**so that** I have an immediate and comprehensive overview of all my financial activity.

#### Acceptance Criteria
1.  For bank accounts: After successful Mono linking, automatically fetch account information and 30 days of transactions using Mono Account APIs.
2.  For MTN MoMo: After successful authentication, fetch recent mobile money transactions using MTN MoMo Collections API and account balance.
3.  Both data sources are stored securely with appropriate identifiers (Mono Account ID for banks, MTN Reference ID for mobile money).
4.  The sync process displays platform-specific feedback (Mono branding for banks, MTN MoMo branding for mobile money).
5.  Handle different error scenarios for each platform with appropriate user-friendly messages and retry mechanisms.

### Story 2.3: Unified Display - Mono Bank & MTN MoMo Transactions
**As a** user,
**I want** to see all my bank transactions (from Mono), MTN MoMo transactions, and manual entries in one unified interface,
**so that** I have a complete view of my financial activity across all platforms.

#### Acceptance Criteria
1.  All transactions appear in the main "All Transactions" list: Mono bank transactions, MTN MoMo transactions, and manual entries.
2.  Clear visual distinction: Bank transactions show bank logos, MTN MoMo transactions show MTN branding, manual entries show "Manual" indicator.
3.  Dashboard aggregates data from both Mono bank accounts and MTN MoMo account for total balance and recent transactions.
4.  Users can categorize any synced transaction but cannot edit core details (amounts, dates, descriptions are read-only for synced transactions).
5.  Transaction details show the data source (Mono for banks, MTN MoMo API for mobile money) for transparency.

### Story 2.4: Dual-Platform Smart Categorization
**As a** user,
**I want** intelligent transaction categorization that leverages Mono's built-in categorization for bank transactions and custom rules for MTN MoMo transactions,
**so that** I save time organizing transactions with platform-appropriate categorization logic.

#### Acceptance Criteria
1.  For bank transactions: Leverage Mono's Transaction Categorisation API to automatically categorize bank transactions with high accuracy.
2.  For MTN MoMo transactions: Implement custom categorization rules for mobile money patterns (airtime purchases, P2P transfers, merchant payments, cash-in/cash-out).
3.  Both platforms' transactions that cannot be categorized are marked as "Uncategorized" with clear platform indicators.
4.  Users can re-categorize any transaction, with the system learning patterns for future MTN MoMo categorization while respecting Mono's categorization for bank transactions.
5.  Categorization confidence scores displayed differently for Mono (using their confidence metrics) vs MTN MoMo (using custom scoring).

### Story 2.5: Hybrid Background Synchronization ✅ **COMPLETED**
**As a** user,
**I want** both my bank accounts (via Mono) and MTN MoMo account to be updated automatically in the background,
**so that** my complete financial data from both platforms is always current without manual effort.

#### Acceptance Criteria ✅ **ALL COMPLETED**
1.  ✅ **Scheduled backend tasks run periodically for both platforms: Mono Real-time Data API for bank accounts and MTN MoMo API for mobile money transactions.**
    - Implemented dual-platform sync orchestrator with platform-specific concurrency limits
    - Created dedicated MonoSyncWorker for bank account synchronization
    - Created dedicated MtnMomoSyncWorker for mobile money transaction synchronization
    - Enhanced background-sync Edge Function to support both platforms with configurable sync frequencies

2.  ✅ **Platform-specific duplicate prevention: Use Mono's transaction IDs for banks and MTN MoMo reference IDs for mobile money transactions.**
    - Mono transactions deduplicated using `mono_transaction_id` field
    - MTN MoMo transactions deduplicated using multiple identifier fields: `momo_external_id`, `mtn_reference_id`, `momo_reference_id`
    - Database schema enhanced with platform-specific identifier fields

3.  ✅ **Independent error handling for each platform with appropriate retry mechanisms and user notifications.**
    - Platform-specific error detection and authentication error handling in both sync workers
    - Exponential backoff and consecutive failure tracking per account
    - Enhanced notification service with platform-specific re-auth and completion notifications
    - Database functions for dual-platform sync status management

4.  ✅ **Re-authentication handled per platform: Mono's re-auth flow for bank accounts and MTN MoMo API user/key regeneration for mobile money.**
    - Platform-aware re-authentication notification system
    - Separate notification templates and deep links for Mono vs MTN MoMo re-auth
    - Sync status tracking with platform-specific authentication states

5.  ✅ **Background sync status available in app settings showing last sync times and status for each connected account type.**
    - Enhanced SyncStatusIndicator component with platform badges and status display
    - Updated SyncProgressModal with platform-specific messaging and branding
    - Database schema supports platform-specific sync tracking and configuration

#### Implementation Summary
- **Database Schema**: Enhanced accounts table with `platform_source` field and dual-platform sync tracking
- **Sync Architecture**: Dual-platform sync orchestrator with independent concurrency controls
- **Platform Workers**: Dedicated sync workers for Mono bank accounts and MTN MoMo transactions  
- **Error Handling**: Platform-specific error detection, retry logic, and notification system
- **Frontend Components**: Updated UI components to display platform-specific sync status and progress
- **Testing**: Comprehensive test suite covering dual-platform sync scenarios
- **Edge Functions**: Enhanced background-sync function with platform routing and configuration

---
