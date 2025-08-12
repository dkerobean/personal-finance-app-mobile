# Personal Finance App Product Requirements Document (PRD)

## Goals and Background Context

### Goals
* Provide users with a single, clear, and consolidated view of their complete financial health.
* Automate the process of tracking income and expenses by integrating with local Ghanaian banks and Mobile Money services.
* Empower users with AI-powered insights to make informed financial decisions.
* Create a secure, scalable, and low-cost application suitable for a personal project with the potential for future growth.

### Background Context
The project aims to solve the problem of financial fragmentation for tech-savvy individuals in Ghana. Users currently struggle to manage their money across multiple disconnected platforms (bank apps, MoMo, spreadsheets), leading to a lack of visibility and ineffective planning. This app will provide a hyper-local, all-in-one solution that goes beyond simple data aggregation by offering intelligent, actionable insights.

### Change Log
| Date | Version | Description | Author |
| :--- | :--- | :--- | :--- |
| 2025-08-12 | 1.0 | Initial PRD draft creation | John, PM |

---

## Requirements (v2)

### Functional
1.  **FR1:** The system shall allow users to securely create an account, log in, and log out.
2.  **FR2:** Users must be able to manually add, edit, and delete income and expense transactions.
3.  **FR3:** The system must provide a secure interface to connect to Ghanaian bank and Mobile Money accounts via a third-party data aggregator API.
4.  **FR4:** The system shall automatically synchronize and display transactions from all linked accounts.
5.  **FR5:** Users must be able to assign categories (e.g., "Food," "Transport," "Salary") to transactions.
6.  **FR6:** The application must feature a main dashboard that displays a high-level summary of the user's financial status, including account balances and recent spending.
7.  **FR7:** The system shall be able to generate a simple monthly report comparing total income versus total expenses.
8.  **FR8:** The system must be able to send push notifications to alert users of significant events, such as large transactions or approaching budget limits.
9.  **FR9:** Users shall be able to create monthly spending **budgets** for specific categories and view their progress against these budgets.
10. **FR10:** Users shall be able to create, edit, and delete their own **custom categories** for income and expenses.
11. **FR11:** Users shall be able to mark transactions as **recurring** (e.g., monthly rent, weekly salary) to automate future entries.

### Non-Functional
1.  **NFR1:** The application must be built using React Native and be deployable to both Android and iOS devices.
2.  **NFR2:** The user interface must be responsive and intuitive, with smooth transitions and minimal perceived latency.
3.  **NFR3:** The backend infrastructure (Supabase) must be configured to operate within the free tier to minimize cost.
4.  **NFR4:** All sensitive user data, including credentials and financial information, must be encrypted both in transit and at rest.
5.  **NFR5:** The application must adhere to best practices for handling sensitive financial data, ensuring user privacy and security.
6.  **NFR6:** The integration with the third-party financial data aggregator must be reliable and handle connection errors gracefully.

---

## User Interface Design Goals (v2)

### Overall UX Vision
The user experience should be clean, intuitive, and trustworthy. The primary goal is to make personal finance management feel accessible and less intimidating, empowering users with clarity and confidence.

### Key Interaction Paradigms
* **Dashboard-Centric:** A central "Home" screen will serve as the main dashboard.
* **Card-Based UI:** Information will be organized into distinct, easy-to-read cards.
* **Floating Action Button (FAB):** A prominent "+" button will be present for adding a new transaction.

### Core Screens and Views
* Login / Registration Screen
* Dashboard (Home Screen)
* All Transactions Screen (with filtering/search)
* Add/Edit Transaction Screen
* Budgets Screen
* Simple Reports Screen
* Accounts & Settings Screen

### Accessibility: Best Practices
The application will be designed following **general accessibility best practices** to ensure it is usable by as many people as possible. This includes considerations for color contrast, readable fonts, clear navigation, and adequate touch target sizes.

### Branding
*(To Be Defined)*

### Target Device and Platforms: Mobile Only (iOS & Android)
The application is designed as a mobile-first experience for iOS and Android devices, built from a single React Native codebase.

---

## Technical Assumptions

### Repository Structure: Polyrepo
* We will use a **Polyrepo** structure, meaning the frontend React Native application and the backend Supabase functions will be in separate, dedicated GitHub repositories.

### Service Architecture: Serverless
* The backend will follow a **Serverless** architecture, utilizing Supabase Edge Functions for API endpoints and business logic.

### Testing Requirements: Unit + Integration
* The project will require both **Unit Tests** to verify individual pieces of code and **Integration Tests** to ensure that different parts of the application work correctly together.

### Additional Technical Assumptions and Requests
* **Frontend Framework:** React Native with the Expo framework.
* **Backend Platform:** Supabase.
* **External APIs:** A financial data aggregator (e.g., Mono) and a push notification service (e.g., OneSignal).
* **Source Control:** GitHub.

---

## Epic List

* **Epic 1: Foundation & Manual Finance Tracking**
    * **Goal:** Establish the application's core infrastructure with secure user authentication and provide all the necessary tools for a user to manually track their income and expenses.
* **Epic 2: Automated Account Integration**
    * **Goal:** Introduce the core automation feature by securely connecting to users' bank and mobile money accounts to synchronize their transactions automatically.
* **Epic 3: Budgeting, Reporting & Alerts**
    * **Goal:** Empower users to manage their finances proactively by introducing tools for creating budgets, viewing simple reports, and receiving important financial alerts.

---

## Epic 1: Foundation & Manual Finance Tracking (v2)

**Expanded Goal:** The primary goal of this epic is to build the foundational skeleton of the application. By the end of this epic, a user will be able to sign up, log in with a **verified email address**, and begin manually tracking their income and expenses using their own custom categories.

#### Story 1.1: Project Setup & Verified User Registration
**As a** new user,
**I want** to create a secure and verified account with my email and password,
**so that** I can ensure my account is protected and start tracking my finances.

##### Acceptance Criteria
1.  Initial React Native (Expo) and Supabase projects are set up and linked.
2.  A registration screen exists with fields for email and a secure password.
3.  User input is validated on the client-side (e.g., valid email format, password strength).
4.  Upon submitting the form, a verification code is sent to the user's email address.
5.  The user is prompted to enter the verification code to complete the registration.
6.  Upon successful verification, a new user is created in the Supabase authentication system and marked as "verified".
7.  The user is automatically logged in and redirected to the main dashboard screen.
8.  Clear error messages are shown for failed registrations or incorrect verification codes.

#### Story 1.2: User Login & Session Management
**As a** returning user,
**I want** to log in securely with my email and password and remain logged in,
**so that** I can easily access my financial data.

##### Acceptance Criteria
1.  A login screen exists with fields for email and password.
2.  Upon successful login, the user is redirected to the dashboard.
3.  The user's session is securely persisted, so they remain logged in when they reopen the app.
4.  A "Logout" button is available within the app that securely ends the session.
5.  Clear error messages are shown for failed login attempts (e.g., "Invalid credentials").

#### Story 1.3: Custom Category Management (CRUD)
**As a** user,
**I want** to create, view, update, and delete my own spending and income categories,
**so that** I can organize my transactions in a way that makes sense to me.

##### Acceptance Criteria
1.  A "Categories" management screen exists within the app's settings.
2.  Users can add a new category with a name and select an icon/color.
3.  A default set of common categories (e.g., Food, Transport, Salary) is created for every new user.
4.  The user can view a list of all their categories.
5.  The user can edit the name, icon, or color of an existing category.
6.  The user can delete a category they created.

#### Story 1.4: Manual Transaction Management (CRUD)
**As a** user,
**I want** to manually add, view, edit, and delete my transactions,
**so that** I have an accurate record of my financial activity.

##### Acceptance Criteria
1.  An "Add Transaction" screen is accessible, for example, via a Floating Action Button.
2.  The form includes fields for Amount, Type (Income/Expense), Category, Date, and an optional Note.
3.  The Category field must be a dropdown populated from the user's list of categories.
4.  A screen exists to view a list of all transactions, sortable by date.
5.  Users can select a transaction from the list to view its details and have options to edit or delete it.

#### Story 1.5: Basic Dashboard Display
**As a** user,
**I want** to see a simple dashboard with a summary of my finances,
**so that** I can understand my current situation at a glance.

##### Acceptance Criteria
1.  The dashboard is the first screen visible after a user logs in.
2.  The dashboard displays a "Total Balance" card, calculated from all manual income and expense transactions.
3.  The dashboard displays a list of the five most recent transactions.
4.  The dashboard data updates automatically and correctly after a transaction is added, edited, or deleted.

---

## Epic 2: Automated Account Integration

**Expanded Goal:** The goal of this epic is to deliver the app's primary value proposition: automation. We will build the functionality to securely link external financial accounts (banks and mobile money) using a third-party aggregator. This will eliminate the need for manual data entry, providing users with a real-time, hands-off overview of their financial activity.

#### Story 2.1: Secure Account Linking
**As a** user,
**I want** to securely connect my bank and mobile money accounts to the app,
**so that** my transactions can be automatically tracked.

##### Acceptance Criteria
1.  An "Add Account" option is available within the app.
2.  Tapping this option launches the third-party aggregator's (e.g., Mono) secure connection widget.
3.  The user can successfully authenticate with their financial institution via the widget.
4.  Upon a successful link, the app securely stores the necessary token to access the account's data.
5.  The newly linked account appears in a list of "Linked Accounts" in the app's settings.
6.  The user has the ability to unlink an existing account.

#### Story 2.2: Initial Transaction Sync
**As a** user,
**I want** the app to import my recent transaction history after I link a new account,
**so that** I have an immediate and useful overview of my spending.

##### Acceptance Criteria
1.  Immediately after an account is successfully linked, the app automatically fetches the last 30 days of transactions.
2.  Fetched transactions are stored securely in the database and associated with the correct user and account.
3.  The sync process displays clear feedback to the user (e.g., a loading indicator followed by a success message).
4.  The process gracefully handles and reports any API errors during the sync.

#### Story 2.3: Displaying Synced Transactions
**As a** user,
**I want** to see my automatically synced transactions alongside my manual entries,
**so that** I have a single, unified view of my finances.

##### Acceptance Criteria
1.  Synced transactions appear in the main "All Transactions" list.
2.  Synced transactions are clearly identifiable from manual entries (e.g., via a bank logo).
3.  The dashboard's "Total Balance" and "Recent Transactions" widgets are updated to include data from synced accounts.
4.  Users can change the category of a synced transaction but cannot edit the amount, date, or description.

#### Story 2.4: Basic Automated Categorization
**As a** user,
**I want** the app to intelligently suggest categories for my synced transactions,
**so that** I can save time on manual organization.

##### Acceptance Criteria
1.  When new transactions are synced, a backend process attempts to assign a category based on the transaction description (e.g., "UBER" is categorized as "Transport").
2.  A basic set of categorization rules is implemented.
3.  Transactions that cannot be automatically categorized are marked as "Uncategorized".
4.  The user can easily re-categorize any transaction.

#### Story 2.5: Background Synchronization
**As a** user,
**I want** my financial accounts to be updated automatically in the background,
**so that** my data is always up-to-date without manual effort.

##### Acceptance Criteria
1.  A scheduled backend task runs periodically (e.g., daily) to fetch new transactions for all linked accounts.
2.  Only new transactions that have not been previously synced are added to the database.
3.  The background sync is efficient and handles errors without impacting the user experience.
4.  (Optional for MVP) The user receives a notification if a linked account requires re-authentication.

---

## Epic 3: Budgeting, Reporting & Alerts

**Expanded Goal:** This epic transitions the app from a passive financial tracker into an active management tool. By introducing budgeting, simple reporting, and alerts, we empower users to understand their spending habits, take control of their cash flow, and stay informed about important financial events.

#### Story 3.1: Budget Creation & Management
**As a** user,
**I want** to create and manage monthly budgets for my spending categories,
**so that** I can proactively control my spending.

##### Acceptance Criteria
1.  A "Budgets" screen is available in the app's main navigation.
2.  The user can create a new budget by selecting one of their spending categories and defining a monthly limit.
3.  The user can view a list of all their created budgets.
4.  The user can edit the monthly limit of an existing budget.
5.  The user can delete a budget.

#### Story 3.2: Budget Tracking & Display
**As a** user,
**I want** to easily see how much I've spent compared to my budget for each category,
**so that** I know if I'm staying on track.

##### Acceptance Criteria
1.  The "Budgets" screen displays each budget along with the total amount spent in that category for the current month.
2.  A clear visual indicator, such as a progress bar, shows what percentage of the budget has been used.
3.  The display updates automatically when new transactions are added or categorized.
4.  Tapping a budget item navigates to a filtered list of all transactions in that category for the current month.

#### Story 3.3: Budget Alerts
**As a** user,
**I want** to be notified when I'm about to go over my budget,
**so that** I can adjust my spending in time.

##### Acceptance Criteria
1.  A push notification is sent when a user's spending in a budgeted category reaches 90% of its limit.
2.  A different push notification is sent when a user's spending exceeds 100% of the budget.
3.  Users can enable or disable these budget alerts in the app's settings.
4.  Alerts are triggered promptly after a transaction that crosses the threshold is recorded.

#### Story 3.4: Basic Monthly Report
**As a** user,
**I want** to view a simple report of my income and expenses for the month,
**so that** I can understand my overall cash flow.

##### Acceptance Criteria
1.  A "Reports" screen is available in the app.
2.  The user can select any of the last 12 months to view a report.
3.  The report clearly displays the total income and total expenses for the selected month.
4.  The report includes a simple visual breakdown of expenses by category (e.g., a pie chart or a categorized list).
5.  The data presented in the report is accurate and reflects all transactions for that month.

---

## Checklist Results Report
As the Product Manager, I have executed the **PM Master Checklist** against this PRD. The document has **passed** the validation check. The requirements are internally consistent, the MVP scope is clearly defined and aligned with the project's goals, and the epics are logically sequenced for incremental value delivery. The PRD is now ready for the architecture and design phase.

---

## Next Steps

### Architect Prompt
Winston, please review this complete PRD. Your task is to create the **fullstack architecture document** that will serve as the technical blueprint for development, based on the requirements and technical assumptions laid out here.