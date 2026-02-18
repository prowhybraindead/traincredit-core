# TrainCredit_Core 🏦

> **The Banking Infrastructure**  
> The backbone API and admin dashboard processing all transactions in the ecosystem.

## 🚀 Capabilities
*   **Transaction API**: robust endpoint for processing payments (`/api/external/transaction`).
*   **Payment Gateway**: Hosted checkout pages (`/pay/[id]`) with real-time status updates.
*   **Admin Dashboard**: Live metrics, transaction feed, and system health monitoring (`/dashboard`).

## ⚙️ Configuration

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Secrets**:
    Copy `.env.example` to `.env.local`. You need:
    *   `ADMIN_SECRET`: A strong string for API internal auth.
    *   `FIREBASE_PROJECT_ID`, `CLIENT_EMAIL`, `PRIVATE_KEY`: From Firebase Console -> Project Settings -> Service Accounts.
    *   `NEXT_PUBLIC_FIREBASE_...`: Client-side keys for the Dashboard/Gateway real-time listeners.

3.  **Run Service**:
    ```bash
    npm run dev
    ```
    Runs on Port 3000 by default.

## 📊 Dashboard
Access `/dashboard` to view live transaction data.
