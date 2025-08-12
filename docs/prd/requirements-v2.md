# Requirements (v2)

## Functional
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

## Non-Functional
1.  **NFR1:** The application must be built using React Native and be deployable to both Android and iOS devices.
2.  **NFR2:** The user interface must be responsive and intuitive, with smooth transitions and minimal perceived latency.
3.  **NFR3:** The backend infrastructure (Supabase) must be configured to operate within the free tier to minimize cost.
4.  **NFR4:** All sensitive user data, including credentials and financial information, must be encrypted both in transit and at rest.
5.  **NFR5:** The application must adhere to best practices for handling sensitive financial data, ensuring user privacy and security.
6.  **NFR6:** The integration with the third-party financial data aggregator must be reliable and handle connection errors gracefully.

---
