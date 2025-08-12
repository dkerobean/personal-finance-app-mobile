# Epic 3: Budgeting, Reporting & Alerts

**Expanded Goal:** This epic transitions the app from a passive financial tracker into an active management tool. By introducing budgeting, simple reporting, and alerts, we empower users to understand their spending habits, take control of their cash flow, and stay informed about important financial events.

### Story 3.1: Budget Creation & Management
**As a** user,
**I want** to create and manage monthly budgets for my spending categories,
**so that** I can proactively control my spending.

#### Acceptance Criteria
1.  A "Budgets" screen is available in the app's main navigation.
2.  The user can create a new budget by selecting one of their spending categories and defining a monthly limit.
3.  The user can view a list of all their created budgets.
4.  The user can edit the monthly limit of an existing budget.
5.  The user can delete a budget.

### Story 3.2: Budget Tracking & Display
**As a** user,
**I want** to easily see how much I've spent compared to my budget for each category,
**so that** I know if I'm staying on track.

#### Acceptance Criteria
1.  The "Budgets" screen displays each budget along with the total amount spent in that category for the current month.
2.  A clear visual indicator, such as a progress bar, shows what percentage of the budget has been used.
3.  The display updates automatically when new transactions are added or categorized.
4.  Tapping a budget item navigates to a filtered list of all transactions in that category for the current month.

### Story 3.3: Budget Alerts
**As a** user,
**I want** to be notified when I'm about to go over my budget,
**so that** I can adjust my spending in time.

#### Acceptance Criteria
1.  A push notification is sent when a user's spending in a budgeted category reaches 90% of its limit.
2.  A different push notification is sent when a user's spending exceeds 100% of the budget.
3.  Users can enable or disable these budget alerts in the app's settings.
4.  Alerts are triggered promptly after a transaction that crosses the threshold is recorded.

### Story 3.4: Basic Monthly Report
**As a** user,
**I want** to view a simple report of my income and expenses for the month,
**so that** I can understand my overall cash flow.

#### Acceptance Criteria
1.  A "Reports" screen is available in the app.
2.  The user can select any of the last 12 months to view a report.
3.  The report clearly displays the total income and total expenses for the selected month.
4.  The report includes a simple visual breakdown of expenses by category (e.g., a pie chart or a categorized list).
5.  The data presented in the report is accurate and reflects all transactions for that month.

---
