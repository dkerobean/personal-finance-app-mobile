# Technical Assumptions

## Repository Structure: Polyrepo
* We will use a **Polyrepo** structure, meaning the frontend React Native application and the backend Supabase functions will be in separate, dedicated GitHub repositories.

## Service Architecture: Serverless
* The backend will follow a **Serverless** architecture, utilizing Supabase Edge Functions for API endpoints and business logic.

## Testing Requirements: Unit + Integration
* The project will require both **Unit Tests** to verify individual pieces of code and **Integration Tests** to ensure that different parts of the application work correctly together.

## Additional Technical Assumptions and Requests
* **Frontend Framework:** React Native with the Expo framework.
* **Backend Platform:** Supabase.
* **External APIs:** A financial data aggregator (e.g., Mono) and a push notification service (e.g., OneSignal).
* **Source Control:** GitHub.

---
