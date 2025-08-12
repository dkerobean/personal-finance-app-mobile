# Epic 1: Foundation & Manual Finance Tracking (v2)

**Expanded Goal:** The primary goal of this epic is to build the foundational skeleton of the application. By the end of this epic, a user will be able to sign up, log in with a **verified email address**, and begin manually tracking their income and expenses using their own custom categories.

### Story 1.1: Project Setup & Verified User Registration
**As a** new user,
**I want** to create a secure and verified account with my email and password,
**so that** I can ensure my account is protected and start tracking my finances.

#### Acceptance Criteria
1.  Initial React Native (Expo) and Supabase projects are set up and linked.
2.  A registration screen exists with fields for email and a secure password.
3.  User input is validated on the client-side (e.g., valid email format, password strength).
4.  Upon submitting the form, a verification code is sent to the user's email address.
5.  The user is prompted to enter the verification code to complete the registration.
6.  Upon successful verification, a new user is created in the Supabase authentication system and marked as "verified".
7.  The user is automatically logged in and redirected to the main dashboard screen.
8.  Clear error messages are shown for failed registrations or incorrect verification codes.

### Story 1.2: User Login & Session Management
**As a** returning user,
**I want** to log in securely with my email and password and remain logged in,
**so that** I can easily access my financial data.

#### Acceptance Criteria
1.  A login screen exists with fields for email and password.
2.  Upon successful login, the user is redirected to the dashboard.
3.  The user's session is securely persisted, so they remain logged in when they reopen the app.
4.  A "Logout" button is available within the app that securely ends the session.
5.  Clear error messages are shown for failed login attempts (e.g., "Invalid credentials").

### Story 1.3: Custom Category Management (CRUD)
**As a** user,
**I want** to create, view, update, and delete my own spending and income categories,
**so that** I can organize my transactions in a way that makes sense to me.

#### Acceptance Criteria
1.  A "Categories" management screen exists within the app's settings.
2.  Users can add a new category with a name and select an icon/color.
3.  A default set of common categories (e.g., Food, Transport, Salary) is created for every new user.
4.  The user can view a list of all their categories.
5.  The user can edit the name, icon, or color of an existing category.
6.  The user can delete a category they created.

### Story 1.4: Manual Transaction Management (CRUD)
**As a** user,
**I want** to manually add, view, edit, and delete my transactions,
**so that** I have an accurate record of my financial activity.

#### Acceptance Criteria
1.  An "Add Transaction" screen is accessible, for example, via a Floating Action Button.
2.  The form includes fields for Amount, Type (Income/Expense), Category, Date, and an optional Note.
3.  The Category field must be a dropdown populated from the user's list of categories.
4.  A screen exists to view a list of all transactions, sortable by date.
5.  Users can select a transaction from the list to view its details and have options to edit or delete it.

### Story 1.5: Basic Dashboard Display
**As a** user,
**I want** to see a simple dashboard with a summary of my finances,
**so that** I can understand my current situation at a glance.

#### Acceptance Criteria
1.  The dashboard is the first screen visible after a user logs in.
2.  The dashboard displays a "Total Balance" card, calculated from all manual income and expense transactions.
3.  The dashboard displays a list of the five most recent transactions.
4.  The dashboard data updates automatically and correctly after a transaction is added, edited, or deleted.

---
