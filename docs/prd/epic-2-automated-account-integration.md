# Epic 2: Automated Account Integration

**Expanded Goal:** The goal of this epic is to deliver the app's primary value proposition: automation. We will build the functionality to securely link external financial accounts (banks and mobile money) using a third-party aggregator. This will eliminate the need for manual data entry, providing users with a real-time, hands-off overview of their financial activity.

### Story 2.1: Secure Account Linking
**As a** user,
**I want** to securely connect my bank and mobile money accounts to the app,
**so that** my transactions can be automatically tracked.

#### Acceptance Criteria
1.  An "Add Account" option is available within the app.
2.  Tapping this option launches the third-party aggregator's (e.g., Mono) secure connection widget.
3.  The user can successfully authenticate with their financial institution via the widget.
4.  Upon a successful link, the app securely stores the necessary token to access the account's data.
5.  The newly linked account appears in a list of "Linked Accounts" in the app's settings.
6.  The user has the ability to unlink an existing account.

### Story 2.2: Initial Transaction Sync
**As a** user,
**I want** the app to import my recent transaction history after I link a new account,
**so that** I have an immediate and useful overview of my spending.

#### Acceptance Criteria
1.  Immediately after an account is successfully linked, the app automatically fetches the last 30 days of transactions.
2.  Fetched transactions are stored securely in the database and associated with the correct user and account.
3.  The sync process displays clear feedback to the user (e.g., a loading indicator followed by a success message).
4.  The process gracefully handles and reports any API errors during the sync.

### Story 2.3: Displaying Synced Transactions
**As a** user,
**I want** to see my automatically synced transactions alongside my manual entries,
**so that** I have a single, unified view of my finances.

#### Acceptance Criteria
1.  Synced transactions appear in the main "All Transactions" list.
2.  Synced transactions are clearly identifiable from manual entries (e.g., via a bank logo).
3.  The dashboard's "Total Balance" and "Recent Transactions" widgets are updated to include data from synced accounts.
4.  Users can change the category of a synced transaction but cannot edit the amount, date, or description.

### Story 2.4: Basic Automated Categorization
**As a** user,
**I want** the app to intelligently suggest categories for my synced transactions,
**so that** I can save time on manual organization.

#### Acceptance Criteria
1.  When new transactions are synced, a backend process attempts to assign a category based on the transaction description (e.g., "UBER" is categorized as "Transport").
2.  A basic set of categorization rules is implemented.
3.  Transactions that cannot be automatically categorized are marked as "Uncategorized".
4.  The user can easily re-categorize any transaction.

### Story 2.5: Background Synchronization
**As a** user,
**I want** my financial accounts to be updated automatically in the background,
**so that** my data is always up-to-date without manual effort.

#### Acceptance Criteria
1.  A scheduled backend task runs periodically (e.g., daily) to fetch new transactions for all linked accounts.
2.  Only new transactions that have not been previously synced are added to the database.
3.  The background sync is efficient and handles errors without impacting the user experience.
4.  (Optional for MVP) The user receives a notification if a linked account requires re-authentication.

---
